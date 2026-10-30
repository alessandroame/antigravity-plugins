#!/usr/bin/env node

/**
 * Transcript-Verified Delivery Gate (Antigravity `Stop` Hook & CLI Verifier)
 * Cross-checks `transcript.jsonl` before the agent yields control to the human:
 * if source code or UI files were modified in the active turn without a subsequent
 * passing test execution or UI probe, forces a single automatic continuation (`decision: "continue"`).
 * Includes a strict 1-retry-per-edit-signature circuit breaker to prevent infinite loops.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyTranscriptDeliveryGate } from '../core/review-guard-engine.mjs';

const isDirectEntry =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

const isCliCheckMode = process.argv.includes('--check');

if (isDirectEntry && !isCliCheckMode) {
  const watchdog = setTimeout(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  }, 5000);
  watchdog.unref();
}

const STATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getAnalyticsDir() {
  if (process.env.ANTIGRAVITY_ANALYTICS_DIR) {
    return resolve(process.env.ANTIGRAVITY_ANALYTICS_DIR);
  }
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

function getBrainDir() {
  if (process.env.ANTIGRAVITY_BRAIN_DIR) {
    return resolve(process.env.ANTIGRAVITY_BRAIN_DIR);
  }
  return join(homedir(), '.gemini', 'antigravity', 'brain');
}

export function parseTranscriptSteps(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return [];
  const raw = readFileSync(transcriptPath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const steps = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === 'object') {
        steps.push(parsed);
      }
    } catch {
      // Skip malformed partial lines
    }
  }
  return steps;
}

function pruneStaleDeliveryState(analyticsDir) {
  try {
    const now = Date.now();
    for (const name of readdirSync(analyticsDir)) {
      if (name.startsWith('.delivery_gate_') && name.endsWith('.json')) {
        const full = join(analyticsDir, name);
        try {
          if (now - statSync(full).mtimeMs > STATE_TTL_MS) {
            unlinkSync(full);
          }
        } catch {
          // Ignore concurrent unlink
        }
      }
    }
  } catch {
    // Non-blocking cleanup
  }
}

function runCliCheck(argv) {
  let transcriptPath = '';
  const jsonOutput = argv.includes('--json');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--transcript' && argv[i + 1]) {
      transcriptPath = resolve(argv[++i]);
    }
  }

  if (!transcriptPath || !existsSync(transcriptPath)) {
    console.error('[ERROR] Provide an existing --transcript <path/to/transcript.jsonl>.');
    process.exit(1);
  }

  const steps = parseTranscriptSteps(transcriptPath);
  const verdict = verifyTranscriptDeliveryGate(steps);

  if (jsonOutput) {
    console.log(JSON.stringify(verdict, null, 2));
  } else {
    console.log(`=== TRANSCRIPT DELIVERY RECEIPT VERIFIER (${verdict.ok ? 'PASS' : 'FAIL'}) ===`);
    console.log(`Last Code Edit Step    : ${verdict.lastCodeEditStep}`);
    console.log(`Last Passing Test Step : ${verdict.lastPassingTestStep}`);
    console.log(`Last UI Edit Step      : ${verdict.lastUiEditStep}`);
    console.log(`Last UI Probe Step     : ${verdict.lastPassingUiVerifyStep}`);
    if (!verdict.ok) {
      console.log(`Reason                 : ${verdict.reasonIt}`);
    }
  }

  process.exit(verdict.ok ? 0 : 2);
}

async function runStopHook() {
  let rawInput = '';
  for await (const chunk of process.stdin) {
    rawInput += chunk;
  }

  let payload = {};
  try {
    if (rawInput.trim()) {
      payload = JSON.parse(rawInput);
    }
  } catch {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  // Only inspect normal turn completions when no background work is pending
  if (payload.terminationReason && payload.terminationReason !== 'NO_TOOL_CALL') {
    process.stdout.write('{}\n');
    process.exit(0);
  }
  if (payload.fullyIdle === false) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const conversationId = payload.conversationId || 'unknown-session';
  const transcriptPath =
    payload.transcriptPath ||
    join(getBrainDir(), conversationId, '.system_generated', 'logs', 'transcript.jsonl');

  if (!existsSync(transcriptPath)) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const steps = parseTranscriptSteps(transcriptPath);
  const verdict = verifyTranscriptDeliveryGate(steps);

  const analyticsDir = getAnalyticsDir();
  mkdirSync(analyticsDir, { recursive: true });
  pruneStaleDeliveryState(analyticsDir);

  const stateFile = join(analyticsDir, `.delivery_gate_${conversationId}.json`);

  if (verdict.ok) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  // Circuit breaker: remind at most once per unique (lastCodeEditStep, lastUiEditStep) signature
  const editSignature = `${verdict.lastCodeEditStep}:${verdict.lastUiEditStep}`;
  let prevState = { lastRemindedSignature: '', reminderCount: 0 };
  if (existsSync(stateFile)) {
    try {
      prevState = JSON.parse(readFileSync(stateFile, 'utf-8'));
    } catch {
      // Ignore corrupted state
    }
  }

  if (prevState.lastRemindedSignature === editSignature) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  try {
    writeFileSync(
      stateFile,
      JSON.stringify(
        {
          lastRemindedSignature: editSignature,
          reminderCount: (prevState.reminderCount || 0) + 1,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {
    // Non-blocking state write
  }

  process.stdout.write(
    JSON.stringify({
      decision: 'continue',
      reason: verdict.reasonIt
    }) + '\n'
  );
  process.exit(0);
}

if (isDirectEntry) {
  if (isCliCheckMode) {
    runCliCheck(process.argv.slice(2));
  } else {
    runStopHook().catch(() => {
      process.stdout.write('{}\n');
      process.exit(0);
    });
  }
}

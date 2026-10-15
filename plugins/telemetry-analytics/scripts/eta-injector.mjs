#!/usr/bin/env node

/**
 * Real-Time ETA Clock & Baseline Injector for Antigravity PreInvocation Hook.
 * Reads the current conversation transcript and historical workspace metrics to inject
 * an ephemeral timing message before each model invocation.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

// Rigid safety watchdog to prevent hook freeze
const WATCHDOG_TIMEOUT_MS = 5000;
const safetyWatchdog = setTimeout(() => {
  process.stdout.write('{}\n');
  process.exit(0);
}, WATCHDOG_TIMEOUT_MS);
safetyWatchdog.unref();

function getAnalyticsDir() {
  const custom = process.env.ANTIGRAVITY_ANALYTICS_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

function formatClockTime(ms) {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function inspectActivePrompt(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return null;
  }

  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

    let lastUserInputMs = null;
    let executedToolCalls = 0;
    let plannerTurns = 0;
    let initialEtaSec = null;

    for (const line of lines) {
      try {
        const step = JSON.parse(line);
        const isUserStep =
          step.type === 'USER_INPUT' ||
          step.source === 'USER_EXPLICIT' ||
          step.type === 'CORTEX_STEP_TYPE_USER_INPUT';

        if (isUserStep && step.created_at) {
          const ts = new Date(step.created_at).getTime();
          if (!Number.isNaN(ts)) {
            lastUserInputMs = ts;
            executedToolCalls = 0;
            plannerTurns = 0;
            initialEtaSec = null;
          }
        } else if (lastUserInputMs !== null) {
          if (Array.isArray(step.tool_calls) && step.tool_calls.length > 0) {
            executedToolCalls += step.tool_calls.length;
            plannerTurns += 1;
          }
          if (initialEtaSec === null) {
            let textToScan = typeof step.content === 'string' ? step.content : '';
            if (Array.isArray(step.tool_calls)) {
              for (const tc of step.tool_calls) {
                if (tc?.args?.toolSummary) textToScan += ' ' + tc.args.toolSummary;
                if (tc?.args?.toolAction) textToScan += ' ' + tc.args.toolAction;
              }
            }
            const etaMatch = textToScan.match(/(?:\[ETA(?:\s+iniziale)?:\s*~?(\d+)s|·\s*ETA\s*~?(\d+)s|\bETA:\s*~?(\d+)s)/i);
            if (etaMatch) {
              initialEtaSec = parseInt(etaMatch[1] || etaMatch[2] || etaMatch[3], 10);
            }
          }
        }
      } catch {
        // Ignore malformed transcript lines
      }
    }

    if (lastUserInputMs === null) {
      return null;
    }

    return {
      promptStartMs: lastUserInputMs,
      executedToolCalls,
      plannerTurns,
      initialEtaSec
    };
  } catch {
    return null;
  }
}

function loadHistoricalBaselines(analyticsDir, workspacePath) {
  const defaults = {
    avgStepSec: 4.5,
    calibrationFactor: 1.0
  };

  const summaryPath = join(analyticsDir, 'metrics-summary.json');
  if (!existsSync(summaryPath)) {
    return defaults;
  }

  try {
    const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
    const normalizedWs = (workspacePath || '').replace(/\\/g, '/').toLowerCase();
    const wsMatch = Object.entries(summary.workspaces || {}).find(
      ([k]) => k.replace(/\\/g, '/').toLowerCase() === normalizedWs
    );

    const source = wsMatch ? wsMatch[1] : summary.global;
    if (!source) return defaults;

    let avgStepSec = defaults.avgStepSec;
    const totalToolCalls = Object.values(source.tools || {}).reduce((acc, t) => acc + (t.calls || 0), 0);
    const totalSteps = Math.max(source.totalSteps || 0, totalToolCalls);
    const totalDurationMs = source.totalDurationMs || 0;
    if (totalSteps >= 5 && totalDurationMs > 0) {
      const computed = totalDurationMs / totalSteps / 1000;
      avgStepSec = Math.max(1.5, Math.min(12.0, Number(computed.toFixed(1))));
    }

    let calibrationFactor = defaults.calibrationFactor;
    if (typeof source.etaCalibrationFactor === 'number' && source.etaCalibrationFactor > 0) {
      calibrationFactor = Math.max(0.5, Math.min(2.5, Number(source.etaCalibrationFactor.toFixed(2))));
    }

    return { avgStepSec, calibrationFactor };
  } catch {
    return defaults;
  }
}

async function main() {
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
    // Fallback to empty object on invalid JSON
  }

  const nowMs = Date.now();
  const conversationId = payload.conversationId || 'unknown-session';
  const workspacePath = payload.workspacePaths?.[0] || process.cwd();
  const transcriptPath = payload.transcriptPath;
  const invocationNum = typeof payload.invocationNum === 'number' ? payload.invocationNum : 1;

  const analyticsDir = getAnalyticsDir();
  mkdirSync(analyticsDir, { recursive: true });

  const stateFile = join(analyticsDir, `.eta_${conversationId}.json`);
  const transcriptState = inspectActivePrompt(transcriptPath);

  let promptStartMs = transcriptState?.promptStartMs || nowMs;
  let executedToolCalls = transcriptState?.executedToolCalls || 0;
  let initialEtaSec = transcriptState?.initialEtaSec || null;

  if (!transcriptState && existsSync(stateFile)) {
    try {
      const saved = JSON.parse(readFileSync(stateFile, 'utf-8'));
      if (invocationNum > 1 && typeof saved.promptStartMs === 'number') {
        promptStartMs = saved.promptStartMs;
      }
      if (initialEtaSec === null && typeof saved.initialEtaSec === 'number') {
        initialEtaSec = saved.initialEtaSec;
      }
    } catch {
      // Ignore state read errors
    }
  }

  const elapsedSec = Math.max(0, Math.round((nowMs - promptStartMs) / 1000));
  const { avgStepSec, calibrationFactor } = loadHistoricalBaselines(analyticsDir, workspacePath);

  try {
    writeFileSync(
      stateFile,
      JSON.stringify({
        promptStartMs,
        lastInvocationMs: nowMs,
        invocationNum,
        executedToolCalls,
        initialEtaSec
      }),
      'utf-8'
    );
  } catch {
    // Ignore write failure
  }

  const nowStr = formatClockTime(nowMs);
  const startStr = formatClockTime(promptStartMs);
  const initialEtaTag = initialEtaSec !== null ? ` | InitialETA: ~${initialEtaSec}s` : '';

  const ephemeralMessage =
    `[TELEMETRY-ETA-CLOCK] Now: ${nowStr} | PromptStart: ${startStr} | Elapsed: ${elapsedSec}s | ` +
    `Invocation: #${invocationNum} | ToolsRun: ${executedToolCalls}${initialEtaTag} | ` +
    `Baseline: ${avgStepSec}s/step (Read ~3s, Edit ~6s, Cmd ~12s) | Calibration: ${calibrationFactor.toFixed(2)}x. ` +
    `If this task requires >= 2 operational steps/tools, output the ETA status line in chat and prefix toolAction/toolSummary with [Step X/Y · ETA ~Ns]. Silence ETA for short/direct replies (<10s, 0-1 tools).`;

  const response = {
    injectSteps: [
      {
        ephemeralMessage
      }
    ]
  };

  process.stdout.write(JSON.stringify(response) + '\n');
  process.exit(0);
}

main().catch(() => {
  process.stdout.write('{}\n');
  process.exit(0);
});

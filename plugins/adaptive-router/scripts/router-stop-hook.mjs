#!/usr/bin/env node

/**
 * Adaptive Router Stop Hook (< 5ms hot path)
 * Passively inspects the active conversation transcript at turn completion to:
 * 1. Auto-discover newly released models or effort modes from `<USER_SETTINGS_CHANGE>` and `PLANNER_RESPONSE`.
 * 2. Empirically self-calibrate model duration, token output, and error rates.
 * 3. Detect Antigravity built-in `.checksum` updates.
 *
 * Always outputs `{}\n` on stdout.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { discoverCapabilitiesFromTranscript } from '../core/router-engine.mjs';
import {
  getAnalyticsDir,
  getBrainDir,
  loadCapabilityRegistry,
  probeBuiltinChecksumDrift,
  saveCapabilityRegistry
} from './model-router.mjs';

const isDirectEntry =
  Boolean(process.argv[1]) &&
  import.meta.url.replace(/\\/g, '/') === pathToFileURL(resolve(process.argv[1])).href.replace(/\\/g, '/');

if (isDirectEntry) {
  const safetyWatchdog = setTimeout(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  }, 5000);
  safetyWatchdog.unref();
}

async function main() {
  let rawInput = '';
  for await (const chunk of process.stdin) {
    rawInput += chunk;
  }

  let payload = {};
  try {
    if (rawInput.trim()) payload = JSON.parse(rawInput);
  } catch {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  try {
    const analyticsDir = getAnalyticsDir();
    const brainDir = getBrainDir();
    const convId = payload.conversationId || '';
    const transcriptPath =
      payload.transcriptPath ||
      (convId ? join(brainDir, convId, '.system_generated', 'logs', 'transcript.jsonl') : '');

    let registry = loadCapabilityRegistry(analyticsDir);
    const drift = probeBuiltinChecksumDrift(registry);
    let updated = drift.drifted;

    if (transcriptPath && existsSync(transcriptPath)) {
      const rawJsonl = readFileSync(transcriptPath, 'utf-8');
      const res = discoverCapabilitiesFromTranscript(rawJsonl, registry);
      registry = res.registry;
      updated = true;
    }

    if (updated) {
      saveCapabilityRegistry(registry, analyticsDir);
    }
  } catch {
    // Non-blocking fail-safe
  }

  process.stdout.write('{}\n');
  process.exit(0);
}

if (isDirectEntry) {
  main();
}

#!/usr/bin/env node

/**
 * Pattern Harvester Periodic Stop Hook
 * Ultralightweight check (< 5ms hot path) triggered at the end of a turn (Stop event).
 * Tracks completed human sessions and spawns `pattern-harvester.mjs --incremental --quiet`
 * in a detached background process only when the periodic cadence threshold is reached
 * (every N=5 human sessions or every 24 hours).
 *
 * Always outputs `{}\n` on stdout to guarantee zero UI noise in Antigravity chat.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  getAnalyticsDir,
  getBrainDir,
  isHumanConversationTranscript,
  loadHarvesterState,
  saveHarvesterState
} from './pattern-harvester.mjs';

const isDirectEntry =
  Boolean(process.argv[1]) &&
  import.meta.url.replace(/\\/g, '/') === pathToFileURL(resolve(process.argv[1])).href.replace(/\\/g, '/');

// 5-second safety watchdog so the hook can never stall Antigravity
if (isDirectEntry) {
  const safetyWatchdog = setTimeout(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  }, 5000);
  safetyWatchdog.unref();
}

/**
 * Evaluates whether the periodic harvest threshold is met based on elapsed time
 * or number of new/updated human sessions since the last scan.
 *
 * @param {{
 *   lastHarvestAtMs: number,
 *   humanSessionsSinceLastHarvest: number,
 *   config?: { periodicSessionThreshold?: number, periodicIntervalHours?: number }
 * }} state
 * @param {number} nowMs
 * @returns {{ shouldTrigger: boolean, reason: string }}
 */
export function evaluatePeriodicTrigger(state, nowMs = Date.now()) {
  const sessionThreshold = Number(state?.config?.periodicSessionThreshold || 5);
  const intervalHours = Number(state?.config?.periodicIntervalHours || 24);
  const intervalMs = intervalHours * 3600 * 1000;
  const lastHarvest = Number(state?.lastHarvestAtMs || 0);
  const sessionsSince = Number(state?.humanSessionsSinceLastHarvest || 0);

  if (lastHarvest === 0) {
    return { shouldTrigger: true, reason: 'INITIAL_SCAN' };
  }
  if (sessionsSince >= sessionThreshold) {
    return { shouldTrigger: true, reason: `SESSION_THRESHOLD_${sessionsSince}` };
  }
  if (nowMs - lastHarvest >= intervalMs && sessionsSince >= 1) {
    return { shouldTrigger: true, reason: `TIME_INTERVAL_${intervalHours}H` };
  }
  return { shouldTrigger: false, reason: 'BELOW_THRESHOLD' };
}

function runPeriodicCheck() {
  try {
    const analyticsDir = getAnalyticsDir();
    const brainDir = getBrainDir();
    const nowMs = Date.now();
    const state = loadHarvesterState(analyticsDir);

    // Count newly modified human sessions in the last 60 minutes
    const recentCutoffMs = nowMs - 60 * 60 * 1000;
    let newlyTouchedCount = 0;

    if (existsSync(brainDir)) {
      for (const ent of readdirSync(brainDir, { withFileTypes: true })) {
        if (!ent.isDirectory()) continue;
        const tPath = join(brainDir, ent.name, '.system_generated', 'logs', 'transcript.jsonl');
        if (!existsSync(tPath)) continue;
        try {
          const st = statSync(tPath);
          if (st.mtimeMs < recentCutoffMs) continue;
          const prevMtime = Number(state.knownHumanSessions?.[ent.name]?.mtimeMs || 0);
          if (st.mtimeMs > prevMtime && isHumanConversationTranscript(tPath)) {
            state.knownHumanSessions[ent.name] = { mtimeMs: st.mtimeMs };
            newlyTouchedCount++;
          }
        } catch {
          // ignore
        }
      }
    }

    if (newlyTouchedCount > 0) {
      state.humanSessionsSinceLastHarvest =
        Number(state.humanSessionsSinceLastHarvest || 0) + newlyTouchedCount;
      saveHarvesterState(state, analyticsDir);
    }

    const decision = evaluatePeriodicTrigger(state, nowMs);
    if (decision.shouldTrigger) {
      const scriptDir = dirname(fileURLToPath(import.meta.url));
      const harvesterCli = join(scriptDir, 'pattern-harvester.mjs');
      const child = spawn(process.execPath, [harvesterCli, '--incremental', '--quiet'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    }
  } catch {
    // Fail-safe silent recovery
  }

  process.stdout.write('{}\n');
}

if (isDirectEntry) {
  runPeriodicCheck();
}

#!/usr/bin/env node

/**
 * MAPE-K Always-On Stop Hook
 * Ultralightweight check (< 5ms hot path) executed automatically at turn completion.
 * Tracks completed human conversation activity and spawns `mapek.mjs --analyze --quiet`
 * in a detached read-only background process every 3 updated human sessions or every 12h.
 *
 * Always outputs `{}\n` on stdout for zero UI noise.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getAnalyticsDir, getBrainDir } from './mapek.mjs';
import { isHumanConversationTranscript } from '../../human-governor/scripts/governor-hook.mjs';

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

export function shouldTriggerBackgroundMapekScan(state, nowMs = Date.now()) {
  const lastScan = Number(state?.lastAnalysisAtMs || 0);
  const sessionsSince = Number(state?.humanSessionsSinceLastScan || 0);
  const sessionThreshold = Number(state?.sessionThreshold || 3);
  const intervalMs = Number(state?.intervalHours || 12) * 3600 * 1000;

  if (lastScan === 0) return { shouldTrigger: true, reason: 'INITIAL_SCAN' };
  if (sessionsSince >= sessionThreshold) return { shouldTrigger: true, reason: 'SESSION_THRESHOLD' };
  if (nowMs - lastScan >= intervalMs && sessionsSince >= 1) return { shouldTrigger: true, reason: 'TIME_INTERVAL' };
  return { shouldTrigger: false, reason: 'IDLE' };
}

function runStopCheck() {
  try {
    const analyticsDir = getAnalyticsDir();
    const brainDir = getBrainDir();
    const nowMs = Date.now();
    mkdirSync(analyticsDir, { recursive: true });

    const stateFile = join(analyticsDir, 'mapek-state.json');
    let state = { lastAnalysisAtMs: 0, humanSessionsSinceLastScan: 0, knownHumanSessions: {} };
    if (existsSync(stateFile)) {
      try {
        state = { ...state, ...JSON.parse(readFileSync(stateFile, 'utf-8')) };
      } catch {
        // Reset corrupt state cleanly
      }
    }

    const recentCutoffMs = nowMs - 60 * 60 * 1000;
    let newlyTouched = 0;

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
            state.knownHumanSessions[ent.name] = { mtimeMs: Math.round(st.mtimeMs) };
            newlyTouched += 1;
          }
        } catch {
          // Ignore locked file
        }
      }
    }

    if (newlyTouched > 0) {
      state.humanSessionsSinceLastScan = Number(state.humanSessionsSinceLastScan || 0) + newlyTouched;
      writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n', 'utf-8');
    }

    const trigger = shouldTriggerBackgroundMapekScan(state, nowMs);
    if (trigger.shouldTrigger) {
      const scriptDir = dirname(fileURLToPath(import.meta.url));
      const mapekCli = join(scriptDir, 'mapek.mjs');
      const child = spawn(process.execPath, [mapekCli, '--analyze', '--quiet'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    }
  } catch {
    // Non-blocking fail-safe
  }

  process.stdout.write('{}\n');
}

if (isDirectEntry) {
  runStopCheck();
}

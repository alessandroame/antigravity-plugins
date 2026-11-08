#!/usr/bin/env node

/**
 * MAPE-K Always-On Stop Hook
 * Ultralightweight check (< 5ms hot path) executed automatically at turn completion.
 * Tracks completed human conversation activity and spawns `mapek.mjs --analyze --quiet`
 * in a detached read-only background process every 3 updated human sessions or every 12h.
 *
 * Always outputs `{}\n` on stdout for zero UI noise.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAnalyticsDir } from './mapek.mjs';
import { isHumanConversationTranscript } from '../../human-governor/scripts/governor-hook.mjs';
import {
  discoverUnifiedBrainSessions,
  isDirectCliEntrypoint
} from '../../proactive-mentorship/scripts/session-miner.mjs';

const isDirectEntry = isDirectCliEntrypoint(import.meta.url, process.argv[1]);

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

export function runStopCheck() {
  try {
    const analyticsDir = getAnalyticsDir();
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

    const sessions = discoverUnifiedBrainSessions({ analyticsDir });
    for (const item of sessions) {
      if (item.mtimeMs < recentCutoffMs) continue;
      const prevMtime = Number(state.knownHumanSessions?.[item.conversationId]?.mtimeMs || 0);
      const isHuman = item.transcriptPath
        ? isHumanConversationTranscript(item.transcriptPath)
        : Boolean(item.syntheticJsonl);
      if (item.mtimeMs > prevMtime && isHuman) {
        state.knownHumanSessions[item.conversationId] = { mtimeMs: Math.round(item.mtimeMs) };
        newlyTouched += 1;
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

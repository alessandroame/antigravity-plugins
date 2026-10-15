#!/usr/bin/env node

/**
 * Event-Driven Whole-Task ETA Injector for Antigravity PreInvocation Hook.
 * Stays completely silent ({}) during initial blind exploration or when the work
 * is progressing along the previously announced trajectory. Injects a compact
 * 1-line clock signal ONLY when a whole-task estimate becomes reliable or needs
 * recalibration due to significant drift (>= 15s).
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

const SIGNIFICANT_DRIFT_SEC = 15;

function getAnalyticsDir() {
  const custom = process.env.ANTIGRAVITY_ANALYTICS_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

function parseEtaSecondsFromToolCalls(toolCalls) {
  if (!Array.isArray(toolCalls)) return null;
  let textToScan = '';
  for (const tc of toolCalls) {
    if (tc?.args?.toolAction) textToScan += ' ' + tc.args.toolAction;
    if (tc?.args?.toolSummary) textToScan += ' ' + tc.args.toolSummary;
  }
  if (!textToScan) return null;

  const etaMatch = textToScan.match(
    /(?:·\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\b|\(\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\s*\)|\bETA(?:\s+tot)?:?\s*~?(\d+)s\b)/i
  );
  if (!etaMatch) return null;
  const val = parseInt(etaMatch[1] || etaMatch[2] || etaMatch[3], 10);
  return Number.isNaN(val) || val <= 0 ? null : val;
}

function inspectActiveWork(transcriptPath, nowMs) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return null;
  }

  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

    let workStartMs = null;
    let pausedDurationMs = 0;
    let pendingAskQuestionStartMs = null;
    let executedToolCalls = 0;
    let plannerTurns = 0;
    let firstReliableEtaSec = null;
    let firstReliableEtaAtActiveSec = 0;
    let lastAnnouncedEtaSec = null;
    let lastAnnouncedAtActiveSec = 0;
    let lastTurnCompleted = true;

    for (const line of lines) {
      try {
        const step = JSON.parse(line);
        const stepTs = step.created_at ? new Date(step.created_at).getTime() : null;
        const validTs = stepTs !== null && !Number.isNaN(stepTs);

        const isUserStep =
          step.type === 'USER_INPUT' ||
          step.source === 'USER_EXPLICIT' ||
          step.type === 'CORTEX_STEP_TYPE_USER_INPUT';

        if (isUserStep && validTs) {
          // Reset only if no active task is running or the previous task completed its final response
          if (workStartMs === null || lastTurnCompleted) {
            workStartMs = stepTs;
            pausedDurationMs = 0;
            pendingAskQuestionStartMs = null;
            executedToolCalls = 0;
            plannerTurns = 0;
            firstReliableEtaSec = null;
            firstReliableEtaAtActiveSec = 0;
            lastAnnouncedEtaSec = null;
            lastAnnouncedAtActiveSec = 0;
            lastTurnCompleted = false;
          }
          continue;
        }

        if (workStartMs === null) continue;

        // If returning from an ask_question pause, accumulate the user wait time
        if (pendingAskQuestionStartMs !== null && validTs && stepTs >= pendingAskQuestionStartMs) {
          pausedDurationMs += stepTs - pendingAskQuestionStartMs;
          pendingAskQuestionStartMs = null;
        }

        if (Array.isArray(step.tool_calls) && step.tool_calls.length > 0) {
          lastTurnCompleted = false;
          executedToolCalls += step.tool_calls.length;
          plannerTurns += 1;

          const activeSecAtStep = validTs
            ? Math.max(0, Math.round((stepTs - workStartMs - pausedDurationMs) / 1000))
            : 0;

          const declaredEta = parseEtaSecondsFromToolCalls(step.tool_calls);
          if (declaredEta !== null) {
            if (firstReliableEtaSec === null) {
              firstReliableEtaSec = declaredEta;
              firstReliableEtaAtActiveSec = activeSecAtStep;
            }
            lastAnnouncedEtaSec = declaredEta;
            lastAnnouncedAtActiveSec = activeSecAtStep;
          }

          const hasAskQuestion = step.tool_calls.some((tc) => tc?.name === 'ask_question');
          if (hasAskQuestion && validTs) {
            pendingAskQuestionStartMs = stepTs;
          }
        } else if (step.type === 'PLANNER_RESPONSE') {
          lastTurnCompleted = true;
        }
      } catch {
        // Ignore malformed transcript lines
      }
    }

    if (workStartMs === null) {
      return null;
    }

    if (pendingAskQuestionStartMs !== null && nowMs >= pendingAskQuestionStartMs) {
      pausedDurationMs += nowMs - pendingAskQuestionStartMs;
    }

    const activeElapsedSec = Math.max(0, Math.round((nowMs - workStartMs - pausedDurationMs) / 1000));

    return {
      workStartMs,
      pausedDurationMs,
      activeElapsedSec,
      executedToolCalls,
      plannerTurns,
      firstReliableEtaSec,
      firstReliableEtaAtActiveSec,
      lastAnnouncedEtaSec,
      lastAnnouncedAtActiveSec
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
  const workState = inspectActiveWork(transcriptPath, nowMs);

  // Stay completely silent on Invocation #1 (initial exploration or quick answer)
  if (invocationNum <= 1 || !workState) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const {
    workStartMs,
    pausedDurationMs,
    activeElapsedSec,
    executedToolCalls,
    plannerTurns,
    firstReliableEtaSec,
    firstReliableEtaAtActiveSec,
    lastAnnouncedEtaSec,
    lastAnnouncedAtActiveSec
  } = workState;

  const { avgStepSec, calibrationFactor } = loadHistoricalBaselines(analyticsDir, workspacePath);

  // Read previous state to avoid repeating the same signal when nothing changed
  let prevState = {};
  if (existsSync(stateFile)) {
    try {
      prevState = JSON.parse(readFileSync(stateFile, 'utf-8'));
    } catch {
      prevState = {};
    }
  }

  try {
    writeFileSync(
      stateFile,
      JSON.stringify({
        promptStartMs: workStartMs,
        pausedDurationMs,
        activeElapsedSec,
        invocationNum,
        executedToolCalls,
        initialEtaSec: firstReliableEtaSec,
        initialEtaAtActiveSec: firstReliableEtaAtActiveSec,
        lastAnnouncedEtaSec,
        lastAnnouncedAtActiveSec
      }),
      'utf-8'
    );
  } catch {
    // Ignore state write failure
  }

  // Always output empty JSON {} so Antigravity never appends [ETA-CLOCK] logs to tool outputs.
  // The agent uses native Created At / Completed At timestamps and rules/AGENTS.md directly.
  process.stdout.write('{}\n');
  process.exit(0);
}

main().catch(() => {
  process.stdout.write('{}\n');
  process.exit(0);
});

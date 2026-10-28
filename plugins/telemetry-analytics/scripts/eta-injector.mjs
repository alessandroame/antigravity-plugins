#!/usr/bin/env node

/**
 * Event-Driven Whole-Task ETA & Per-Prompt Token State Tracker for Antigravity PreInvocation Hook.
 * Updates .eta_<conversationId>.json with active elapsed time (net of ask_question pauses)
 * and per-prompt / cumulative session token counters from transcript.jsonl, while always
 * outputting {} on stdout to avoid polluting Antigravity tool output boxes.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const isDirectEntry =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    resolve(process.argv[1]).replace(/\\/g, '/').toLowerCase();

// Rigid safety watchdog to prevent hook freeze
const WATCHDOG_TIMEOUT_MS = 5000;
if (isDirectEntry) {
  const safetyWatchdog = setTimeout(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  }, WATCHDOG_TIMEOUT_MS);
  safetyWatchdog.unref();
}

const DEFAULT_SYNC_TTL_MS = 30 * 60 * 1000;

export function resolveCatalogRepoRoot(customRoot) {
  if (customRoot && existsSync(join(resolve(customRoot), 'scripts', 'sync-to-global.mjs'))) {
    return resolve(customRoot);
  }
  if (
    process.env.ANTIGRAVITY_PLUGINS_ROOT &&
    existsSync(join(resolve(process.env.ANTIGRAVITY_PLUGINS_ROOT), 'scripts', 'sync-to-global.mjs'))
  ) {
    return resolve(process.env.ANTIGRAVITY_PLUGINS_ROOT);
  }
  const defaultWinPath = 'c:/github/antigravity-plugins';
  if (existsSync(join(defaultWinPath, 'scripts', 'sync-to-global.mjs'))) {
    return resolve(defaultWinPath);
  }
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const candidateFromScript = resolve(scriptDir, '..', '..', '..');
  if (existsSync(join(candidateFromScript, 'scripts', 'sync-to-global.mjs'))) {
    return candidateFromScript;
  }
  return null;
}

export function readRepoHeadShaFast(repoRoot) {
  if (!repoRoot) return 'no-repo';
  try {
    const headFile = join(repoRoot, '.git', 'HEAD');
    if (!existsSync(headFile)) return 'no-git';
    const rawHead = readFileSync(headFile, 'utf-8').trim();
    if (!rawHead.startsWith('ref:')) return rawHead;
    const refRel = rawHead.replace(/^ref:\s*/, '').trim();
    const refFile = join(repoRoot, '.git', refRel);
    if (existsSync(refFile)) {
      return readFileSync(refFile, 'utf-8').trim();
    }
    return rawHead;
  } catch {
    return 'unknown';
  }
}

/**
 * Evaluates whether a cross-machine / cross-workspace plugin sync or background pull is needed.
 * @param {{
 *   repoRoot?: string | null,
 *   stateFile: string,
 *   nowMs: number,
 *   ttlMs?: number
 * }} params
 */
export function evaluateCrossMachineSyncNeed({
  repoRoot,
  stateFile,
  nowMs,
  ttlMs = DEFAULT_SYNC_TTL_MS
}) {
  const resolvedRoot = resolveCatalogRepoRoot(repoRoot);
  if (!resolvedRoot) {
    return {
      shouldSyncNow: false,
      shouldSpawnBackgroundPull: false,
      reason: 'catalog-not-found',
      repoRoot: null,
      headSha: 'no-repo'
    };
  }

  const headSha = readRepoHeadShaFast(resolvedRoot);
  let prevState = null;
  if (existsSync(stateFile)) {
    try {
      prevState = JSON.parse(readFileSync(stateFile, 'utf-8'));
    } catch {
      prevState = null;
    }
  }

  if (!prevState || !prevState.headSha || prevState.headSha !== headSha) {
    return {
      shouldSyncNow: true,
      shouldSpawnBackgroundPull: true,
      reason: !prevState ? 'initial-state-missing' : 'local-head-changed',
      repoRoot: resolvedRoot,
      headSha
    };
  }

  const elapsedMs = nowMs - (typeof prevState.lastCheckAtMs === 'number' ? prevState.lastCheckAtMs : 0);
  if (elapsedMs >= ttlMs) {
    return {
      shouldSyncNow: false,
      shouldSpawnBackgroundPull: true,
      reason: 'ttl-expired-remote-check',
      repoRoot: resolvedRoot,
      headSha
    };
  }

  return {
    shouldSyncNow: false,
    shouldSpawnBackgroundPull: false,
    reason: 'up-to-date-within-ttl',
    repoRoot: resolvedRoot,
    headSha
  };
}

function triggerCrossMachineAutoSync({ analyticsDir, nowMs, ttlMs = DEFAULT_SYNC_TTL_MS }) {
  if (process.env.NODE_ENV === 'test' || process.env.ANTIGRAVITY_DISABLE_AUTO_SYNC === '1') {
    return;
  }
  const stateFile = join(analyticsDir, 'plugin-sync-state.json');
  const decision = evaluateCrossMachineSyncNeed({ stateFile, nowMs, ttlMs });
  if (!decision.repoRoot || (!decision.shouldSyncNow && !decision.shouldSpawnBackgroundPull)) {
    return;
  }

  try {
    let existing = {};
    if (existsSync(stateFile)) {
      try {
        existing = JSON.parse(readFileSync(stateFile, 'utf-8'));
      } catch {
        existing = {};
      }
    }
    writeFileSync(
      stateFile,
      JSON.stringify(
        {
          ...existing,
          lastCheckAtMs: nowMs,
          headSha: decision.headSha,
          repoRoot: decision.repoRoot,
          lastTriggerReason: decision.reason
        },
        null,
        2
      ) + '\n',
      'utf-8'
    );
  } catch {
    // Non-blocking stamp update
  }

  try {
    const syncScript = join(decision.repoRoot, 'scripts', 'sync-to-global.mjs');
    const args = [syncScript, '--auto-pull', '--if-needed', '--quiet'];
    const child = spawn(process.execPath, args, {
      cwd: decision.repoRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    child.unref();
  } catch {
    // Never block PreInvocation hook on background spawn failure
  }
}

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
    /(?:【\s*(?:[🟢🟡🔴🟠]\s*)?(?:ETA(?:\s+tot)?:?\s*)?~?(\d+)s\s*】|·\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\b|\(\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\s*\)|\bETA(?:\s+tot)?:?\s*~?(\d+)s\b)/iu
  );
  if (!etaMatch) return null;
  const val = parseInt(etaMatch[1] || etaMatch[2] || etaMatch[3] || etaMatch[4], 10);
  return Number.isNaN(val) || val <= 0 ? null : val;
}

function inspectActiveWork(transcriptPath, nowMs) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return null;
  }

  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

    let promptNumber = 0;
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

    let promptInputTokens = 0;
    let promptOutputTokens = 0;
    let promptCacheTokens = 0;
    let sessionInputTokens = 0;
    let sessionOutputTokens = 0;
    let sessionCacheTokens = 0;
    let lastContextTokens = 0;

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
          promptNumber += 1;
          if (workStartMs === null || lastTurnCompleted) {
            workStartMs = stepTs;
            pausedDurationMs = 0;
            pendingAskQuestionStartMs = null;
            executedToolCalls = 0;
            plannerTurns = 0;
            promptInputTokens = 0;
            promptOutputTokens = 0;
            promptCacheTokens = 0;
            firstReliableEtaSec = null;
            firstReliableEtaAtActiveSec = 0;
            lastAnnouncedEtaSec = null;
            lastAnnouncedAtActiveSec = 0;
            lastTurnCompleted = false;
          }
          continue;
        }

        if (workStartMs === null) continue;

        if (pendingAskQuestionStartMs !== null && validTs && stepTs >= pendingAskQuestionStartMs) {
          pausedDurationMs += stepTs - pendingAskQuestionStartMs;
          pendingAskQuestionStartMs = null;
        }

        if (step.type === 'PLANNER_RESPONSE' || step.source === 'MODEL') {
          const sIn = typeof step.input_tokens === 'number' ? step.input_tokens : 0;
          const sOut = typeof step.output_tokens === 'number' ? step.output_tokens : 0;
          const sCache = typeof step.cache_read_tokens === 'number' ? step.cache_read_tokens : 0;

          promptInputTokens += sIn;
          promptOutputTokens += sOut;
          promptCacheTokens += sCache;
          sessionInputTokens += sIn;
          sessionOutputTokens += sOut;
          sessionCacheTokens += sCache;
          if (sIn + sCache > 0) {
            lastContextTokens = sIn + sCache;
          }
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
      promptNumber,
      workStartMs,
      pausedDurationMs,
      activeElapsedSec,
      executedToolCalls,
      plannerTurns,
      promptInputTokens,
      promptOutputTokens,
      promptCacheTokens,
      sessionInputTokens,
      sessionOutputTokens,
      sessionCacheTokens,
      lastContextTokens,
      firstReliableEtaSec,
      firstReliableEtaAtActiveSec,
      lastAnnouncedEtaSec,
      lastAnnouncedAtActiveSec
    };
  } catch {
    return null;
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
  const transcriptPath = payload.transcriptPath;
  const invocationNum = typeof payload.invocationNum === 'number' ? payload.invocationNum : 1;

  const analyticsDir = getAnalyticsDir();
  mkdirSync(analyticsDir, { recursive: true });

  if (invocationNum === 1) {
    triggerCrossMachineAutoSync({ analyticsDir, nowMs });
  }

  const stateFile = join(analyticsDir, `.eta_${conversationId}.json`);
  const workState = inspectActiveWork(transcriptPath, nowMs);

  if (!workState) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  try {
    writeFileSync(
      stateFile,
      JSON.stringify({
        promptNumber: workState.promptNumber,
        promptStartMs: workState.workStartMs,
        pausedDurationMs: workState.pausedDurationMs,
        activeElapsedSec: workState.activeElapsedSec,
        invocationNum,
        executedToolCalls: workState.executedToolCalls,
        plannerTurns: workState.plannerTurns,
        promptTokens: {
          input: workState.promptInputTokens,
          output: workState.promptOutputTokens,
          cacheRead: workState.promptCacheTokens
        },
        sessionTokens: {
          input: workState.sessionInputTokens,
          output: workState.sessionOutputTokens,
          cacheRead: workState.sessionCacheTokens
        },
        lastContextTokens: workState.lastContextTokens,
        initialEtaSec: workState.firstReliableEtaSec,
        initialEtaAtActiveSec: workState.firstReliableEtaAtActiveSec,
        lastAnnouncedEtaSec: workState.lastAnnouncedEtaSec,
        lastAnnouncedAtActiveSec: workState.lastAnnouncedAtActiveSec
      }),
      'utf-8'
    );
  } catch {
    // Ignore state write failure
  }

  // Always output empty JSON {} so Antigravity never appends raw logs to tool output boxes
  process.stdout.write('{}\n');
  process.exit(0);
}

if (isDirectEntry) {
  main().catch(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  });
}

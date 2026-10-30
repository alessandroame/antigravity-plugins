#!/usr/bin/env node

/**
 * MAPE-K Process Supervisor CLI & Human-Gated Execution Engine
 * Pure Node.js CLI supporting:
 *   --analyze [--quiet] [--limit N]        Read-only scan of brain/ transcripts (updates mastery & pending proposals)
 *   --digest [--json]                      Prints Semantic Drill-Down (L0 -> L1 -> L2) report
 *   --show <decisionId>                    Displays full draft content of a pending decision
 *   --apply <decisionId> --confirm-user-approval   Applies an approved decision, validates, and syncs globally
 *   --reject <decisionId>                  Rejects a decision with a 30-day cooldown
 *   --snooze <decisionId> [--hours N]      Snoozes a decision notification (default 24h)
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  aggregateCrossSessionBottlenecks,
  analyzeSessionTrajectory,
  parseSessionTrajectoryFromJsonl
} from '../core/trajectory-analyzer.mjs';
import {
  buildDecisionProposal,
  routeBottleneckToPrimitive
} from '../core/primitive-router.mjs';
import {
  authorizeDecisionExecution,
  createInitialMasteryState,
  evaluatePostAdoptionRoi,
  formatDrillDownDecisionReport,
  reconcilePendingDecisions,
  updateOperatorMastery
} from '../core/mastery-ledger.mjs';
import {
  resolveCatalogRepoRoot,
  verifyAndSyncGlobalPlugins
} from '../../proactive-mentorship/scripts/session-miner.mjs';

const isDirectEntry =
  Boolean(process.argv[1]) &&
  import.meta.url.replace(/\\/g, '/') === pathToFileURL(resolve(process.argv[1])).href.replace(/\\/g, '/');

if (isDirectEntry) {
  const safetyTimer = setTimeout(() => {
    console.error('[FATAL TIMEOUT] mapek.mjs exceeded 45s safety ceiling.');
    process.exit(1);
  }, 45000);
  safetyTimer.unref();
}

export function getAnalyticsDir() {
  if (process.env.ANTIGRAVITY_ANALYTICS_DIR) {
    return resolve(process.env.ANTIGRAVITY_ANALYTICS_DIR);
  }
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

export function getBrainDir() {
  if (process.env.ANTIGRAVITY_BRAIN_DIR) {
    return resolve(process.env.ANTIGRAVITY_BRAIN_DIR);
  }
  return join(homedir(), '.gemini', 'antigravity', 'brain');
}

function readJsonOrFallback(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJsonSafe(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Computes current total inline bytes across all plugin rules/AGENTS.md files.
 * @param {string} repoRoot
 * @returns {number}
 */
export function measureCatalogInlineRulesBytes(repoRoot) {
  const pluginsDir = join(repoRoot, 'plugins');
  if (!existsSync(pluginsDir)) return 0;
  let total = 0;
  for (const ent of readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const ruleFile = join(pluginsDir, ent.name, 'rules', 'AGENTS.md');
    if (existsSync(ruleFile)) {
      try {
        total += statSync(ruleFile).size;
      } catch {
        // Ignore transient stat failure
      }
    }
  }
  return total;
}

/**
 * Scans human conversation transcripts in `brain/` (strictly read-only on workspaces/plugins).
 *
 * @param {{ brainDir?: string, analyticsDir?: string, repoRoot?: string, limit?: number, nowMs?: number }} [opts]
 * @returns {object}
 */
export function runReadOnlyMapekAnalysis(opts = {}) {
  const brainDir = opts.brainDir || getBrainDir();
  const analyticsDir = opts.analyticsDir || getAnalyticsDir();
  const repoRoot = opts.repoRoot ? resolve(opts.repoRoot) : resolveCatalogRepoRoot();
  const limit = Number(opts.limit || 45);
  const nowMs = Number(opts.nowMs || Date.now());

  mkdirSync(analyticsDir, { recursive: true });

  const masteryFile = join(analyticsDir, 'operator-mastery.json');
  const pendingFile = join(analyticsDir, 'mapek-pending-decisions.json');
  const ledgerFile = join(analyticsDir, 'process-ledger.json');
  const stateFile = join(analyticsDir, 'mapek-state.json');

  // Optional token/workspace enrichment from telemetry-analytics sessions-index.json
  const sessionsIndex = readJsonOrFallback(join(analyticsDir, 'sessions-index.json'), { sessions: {} });
  const indexedMap = sessionsIndex?.sessions && typeof sessionsIndex.sessions === 'object' ? sessionsIndex.sessions : {};

  const candidates = [];
  if (existsSync(brainDir)) {
    for (const ent of readdirSync(brainDir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const tPath = join(brainDir, ent.name, '.system_generated', 'logs', 'transcript.jsonl');
      if (!existsSync(tPath)) continue;
      try {
        const st = statSync(tPath);
        candidates.push({ conversationId: ent.name, transcriptPath: tPath, mtimeMs: Math.round(st.mtimeMs) });
      } catch {
        // Ignore inaccessible files
      }
    }
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const analyzedSessions = [];

  for (const item of candidates) {
    if (analyzedSessions.length >= limit) break;
    try {
      const raw = readFileSync(item.transcriptPath, 'utf-8');
      const idxEntry = indexedMap[item.conversationId] || {};
      const parsed = parseSessionTrajectoryFromJsonl(raw, {
        conversationId: item.conversationId,
        workspace: idxEntry.workspace || '',
        mtimeMs: item.mtimeMs
      });
      if (!parsed) continue;
      if (Number(idxEntry.peakContextTokens || 0) > parsed.peakContextTokens) {
        parsed.peakContextTokens = Number(idxEntry.peakContextTokens);
      }
      analyzedSessions.push(analyzeSessionTrajectory(parsed));
    } catch {
      // Skip malformed transcript
    }
  }

  const prevMastery = readJsonOrFallback(masteryFile, createInitialMasteryState());
  const nextMastery = updateOperatorMastery(prevMastery, analyzedSessions);

  const prevLedgerData = readJsonOrFallback(ledgerFile, { entries: [] });
  const prevLedgerEntries = Array.isArray(prevLedgerData.entries) ? prevLedgerData.entries : [];

  const { updatedLedger, pruningClusters } = evaluatePostAdoptionRoi(prevLedgerEntries, analyzedSessions);

  const bottleneckClusters = aggregateCrossSessionBottlenecks(analyzedSessions);
  const totalRulesBytes = measureCatalogInlineRulesBytes(repoRoot);

  const allClusters = [...pruningClusters, ...bottleneckClusters];
  const synthesizedProposals = allClusters.map((cluster) => {
    const route = routeBottleneckToPrimitive(cluster, { totalRulesBytes });
    return buildDecisionProposal(cluster, route, nowMs);
  });

  const prevPendingData = readJsonOrFallback(pendingFile, { decisions: [] });
  const prevPending = Array.isArray(prevPendingData.decisions) ? prevPendingData.decisions : [];

  const pendingDecisions = reconcilePendingDecisions(
    prevPending,
    updatedLedger,
    synthesizedProposals,
    nowMs
  );

  writeJsonSafe(masteryFile, nextMastery);
  writeJsonSafe(ledgerFile, { schemaVersion: 1, updatedAtMs: nowMs, entries: updatedLedger });
  writeJsonSafe(pendingFile, { schemaVersion: 1, updatedAtMs: nowMs, decisions: pendingDecisions });

  const prevState = readJsonOrFallback(stateFile, { knownHumanSessions: {} });
  writeJsonSafe(stateFile, {
    ...prevState,
    lastAnalysisAtMs: nowMs,
    humanSessionsSinceLastScan: 0,
    totalAnalyzedSessions: analyzedSessions.length
  });

  return {
    sessionsAnalyzed: analyzedSessions.length,
    totalRulesBytes,
    masteryState: nextMastery,
    pendingDecisions,
    ledgerEntries: updatedLedger
  };
}

/**
 * Applies a pending decision ONLY when explicit user approval is confirmed.
 * Runs global validation and rollback protection before syncing.
 *
 * @param {string} decisionId
 * @param {{ explicitUserApproval: boolean, analyticsDir?: string, repoRoot?: string, skipGlobalSync?: boolean, nowMs?: number }} opts
 * @returns {{ ok: boolean, error?: string, appliedPath?: string }}
 */
export function applyApprovedDecision(decisionId, opts = { explicitUserApproval: false }) {
  const analyticsDir = opts.analyticsDir || getAnalyticsDir();
  const repoRoot = opts.repoRoot ? resolve(opts.repoRoot) : resolveCatalogRepoRoot();
  const nowMs = Number(opts.nowMs || Date.now());

  const pendingFile = join(analyticsDir, 'mapek-pending-decisions.json');
  const ledgerFile = join(analyticsDir, 'process-ledger.json');

  const pendingData = readJsonOrFallback(pendingFile, { decisions: [] });
  const decisions = Array.isArray(pendingData.decisions) ? pendingData.decisions : [];
  const decision = decisions.find((d) => d.decisionId === decisionId);

  const auth = authorizeDecisionExecution(decision, {
    explicitUserApproval: opts.explicitUserApproval === true
  });
  if (!auth.allowed) {
    return { ok: false, error: auth.error };
  }

  const relPath = decision.targetArtifact?.relativePath || '';
  if (!relPath || relPath.includes('..')) {
    return { ok: false, error: 'INVALID_TARGET_PATH' };
  }

  const targetFull = resolve(repoRoot, relPath);
  const existedBefore = existsSync(targetFull);
  const previousContent = existedBefore ? readFileSync(targetFull, 'utf-8') : null;

  try {
    if (decision.targetArtifact.action === 'DELETE_OR_ARCHIVE') {
      if (existsSync(targetFull)) {
        rmSync(targetFull, { force: true });
      }
    } else {
      mkdirSync(dirname(targetFull), { recursive: true });
      writeFileSync(targetFull, decision.targetArtifact.proposedContent, 'utf-8');
    }

    if (!opts.skipGlobalSync) {
      const syncOutcome = verifyAndSyncGlobalPlugins({ repoRoot });
      if (!syncOutcome.ok) {
        // Immediate rollback on validation/test failure
        if (existedBefore && previousContent !== null) {
          writeFileSync(targetFull, previousContent, 'utf-8');
        } else if (!existedBefore && existsSync(targetFull)) {
          rmSync(targetFull, { force: true });
        }
        return {
          ok: false,
          error: `VALIDATION_FAILED_ROLLED_BACK: ${syncOutcome.steps.map((s) => `${s.step}=${s.status}`).join(', ')}`
        };
      }
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const remaining = decisions.filter((d) => d.decisionId !== decisionId);
  writeJsonSafe(pendingFile, { schemaVersion: 1, updatedAtMs: nowMs, decisions: remaining });

  const ledgerData = readJsonOrFallback(ledgerFile, { entries: [] });
  const entries = Array.isArray(ledgerData.entries) ? ledgerData.entries : [];

  if (decision.targetLevel === 'PRUNE') {
    for (const e of entries) {
      if (`prune:${e.patternKey}` === decision.patternKey) {
        e.status = 'PRUNED';
        e.prunedAtMs = nowMs;
      }
    }
  } else {
    entries.push({
      decisionId: decision.decisionId,
      patternKey: decision.patternKey,
      detectorId: decision.detectorId,
      targetLevel: decision.targetLevel,
      targetArtifact: {
        action: decision.targetArtifact.action,
        relativePath: relPath
      },
      generalizedContract: decision.generalizedContract,
      baselineFrictionRate: decision.baselineFrictionRate,
      status: 'ACTIVE',
      efficacyStatus: 'MONITORING',
      approvedAtMs: nowMs,
      decidedAtMs: nowMs
    });
  }

  writeJsonSafe(ledgerFile, { schemaVersion: 1, updatedAtMs: nowMs, entries });
  return { ok: true, appliedPath: targetFull };
}

/**
 * Rejects or snoozes a pending decision.
 *
 * @param {string} decisionId
 * @param {'REJECT' | 'SNOOZE'} action
 * @param {{ analyticsDir?: string, snoozeHours?: number, nowMs?: number }} [opts]
 * @returns {{ ok: boolean, error?: string }}
 */
export function updateDecisionDisposition(decisionId, action, opts = {}) {
  const analyticsDir = opts.analyticsDir || getAnalyticsDir();
  const nowMs = Number(opts.nowMs || Date.now());
  const pendingFile = join(analyticsDir, 'mapek-pending-decisions.json');
  const ledgerFile = join(analyticsDir, 'process-ledger.json');

  const pendingData = readJsonOrFallback(pendingFile, { decisions: [] });
  const decisions = Array.isArray(pendingData.decisions) ? pendingData.decisions : [];
  const idx = decisions.findIndex((d) => d.decisionId === decisionId);
  if (idx === -1) {
    return { ok: false, error: `Decision '${decisionId}' not found in pending queue.` };
  }

  const target = decisions[idx];
  if (action === 'SNOOZE') {
    const hours = Number(opts.snoozeHours || 24);
    target.snoozedUntilMs = nowMs + hours * 3600 * 1000;
    writeJsonSafe(pendingFile, { schemaVersion: 1, updatedAtMs: nowMs, decisions });
    return { ok: true };
  }

  // REJECT (30-day cooldown recorded in ledger)
  decisions.splice(idx, 1);
  writeJsonSafe(pendingFile, { schemaVersion: 1, updatedAtMs: nowMs, decisions });

  const ledgerData = readJsonOrFallback(ledgerFile, { entries: [] });
  const entries = Array.isArray(ledgerData.entries) ? ledgerData.entries : [];
  entries.push({
    decisionId: target.decisionId,
    patternKey: target.patternKey,
    detectorId: target.detectorId,
    targetLevel: target.targetLevel,
    status: 'REJECTED',
    decidedAtMs: nowMs
  });
  writeJsonSafe(ledgerFile, { schemaVersion: 1, updatedAtMs: nowMs, entries });
  return { ok: true };
}

function getArgValue(args, flag) {
  const i = args.indexOf(flag);
  if (i !== -1 && i + 1 < args.length && !args[i + 1].startsWith('--')) {
    return args[i + 1];
  }
  return '';
}

function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const asJson = args.includes('--json');

  const applyId = getArgValue(args, '--apply');
  if (applyId) {
    const confirmed = args.includes('--confirm-user-approval');
    const res = applyApprovedDecision(applyId, { explicitUserApproval: confirmed });
    if (!res.ok) {
      console.error(`[MAPEK BLOCKED] ${res.error}`);
      process.exit(1);
    }
    if (!quiet) {
      console.log(`Decisione [${applyId}] applicata con successo e sincronizzata: ${res.appliedPath}`);
    }
    process.exit(0);
  }

  const rejectId = getArgValue(args, '--reject');
  if (rejectId) {
    const res = updateDecisionDisposition(rejectId, 'REJECT');
    if (!res.ok) {
      console.error(res.error);
      process.exit(1);
    }
    if (!quiet) {
      console.log(`Decisione [${rejectId}] rifiutata e silenziata per 30 giorni.`);
    }
    process.exit(0);
  }

  const snoozeId = getArgValue(args, '--snooze');
  if (snoozeId) {
    const hours = Number(getArgValue(args, '--hours') || 24);
    const res = updateDecisionDisposition(snoozeId, 'SNOOZE', { snoozeHours: hours });
    if (!res.ok) {
      console.error(res.error);
      process.exit(1);
    }
    if (!quiet) {
      console.log(`Decisione [${snoozeId}] rimandata di ${hours} ore.`);
    }
    process.exit(0);
  }

  const showId = getArgValue(args, '--show');
  if (showId) {
    const pendingFile = join(getAnalyticsDir(), 'mapek-pending-decisions.json');
    const pendingData = readJsonOrFallback(pendingFile, { decisions: [] });
    const dec = (pendingData.decisions || []).find((d) => d.decisionId === showId);
    if (!dec) {
      console.error(`Decisione '${showId}' non trovata.`);
      process.exit(1);
    }
    console.log(asJson ? JSON.stringify(dec, null, 2) : dec.targetArtifact?.proposedContent || '');
    process.exit(0);
  }

  const limit = Number(getArgValue(args, '--limit') || 45);
  const digest = runReadOnlyMapekAnalysis({ limit });

  if (quiet) {
    process.exit(0);
  }
  if (asJson) {
    console.log(JSON.stringify(digest, null, 2));
    process.exit(0);
  }

  process.stdout.write(formatDrillDownDecisionReport(digest));
}

if (isDirectEntry) {
  main();
}

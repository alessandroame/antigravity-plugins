#!/usr/bin/env node

/**
 * MAPE-K Always-On PreInvocation Hook
 * Ultralightweight check (< 3ms hot path) executed before turn invocation #1 on human chats.
 *
 * Outputs `{}\n` (zero noise) whenever there are no unnotified pending decisions.
 * When a mature `PENDING_APPROVAL` decision is ready, injects an ephemeral directive
 * instructing the agent to communicate the decision rationale in Semantic Drill-Down
 * and ask explicit permission via `ask_question` before executing any modification.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getAnalyticsDir, getBrainDir } from './mapek.mjs';
import {
  isHumanConversationTranscript,
  isSubagentTranscriptHead
} from '../../human-governor/scripts/governor-hook.mjs';

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

export const NOTIFICATION_COOLDOWN_MS = 6 * 3600 * 1000; // 6 hours between notifications of the same pending decision

/**
 * Selects the highest-ROI pending decision eligible for automatic notification, if any.
 *
 * @param {Array<object>} decisions
 * @param {number} [nowMs]
 * @returns {object | null}
 */
export function selectReadyDecisionForNotification(decisions, nowMs = Date.now()) {
  if (!Array.isArray(decisions) || decisions.length === 0) return null;

  for (const dec of decisions) {
    if (!dec || dec.status !== 'PENDING_APPROVAL') continue;
    if (Number(dec.snoozedUntilMs || 0) > nowMs) continue;
    if (Number(dec.lastNotifiedAtMs || 0) > 0 && nowMs - Number(dec.lastNotifiedAtMs) < NOTIFICATION_COOLDOWN_MS) {
      continue;
    }
    return dec;
  }
  return null;
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

  const invocationNum = typeof payload.invocationNum === 'number' ? payload.invocationNum : 1;
  if (invocationNum > 1) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const lastUserInput = typeof payload.lastUserInput === 'string' ? payload.lastUserInput : '';
  if (isSubagentTranscriptHead(lastUserInput) || isSubagentTranscriptHead(rawInput)) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const brainDir = getBrainDir();
  const convId = payload.conversationId || '';
  const transcriptPath =
    payload.transcriptPath ||
    (convId ? join(brainDir, convId, '.system_generated', 'logs', 'transcript.jsonl') : '');

  if (transcriptPath && existsSync(transcriptPath) && !isHumanConversationTranscript(transcriptPath)) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const analyticsDir = getAnalyticsDir();
  const pendingFile = join(analyticsDir, 'mapek-pending-decisions.json');
  if (!existsSync(pendingFile)) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  let pendingData;
  try {
    pendingData = JSON.parse(readFileSync(pendingFile, 'utf-8'));
  } catch {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const nowMs = Date.now();
  const decisions = Array.isArray(pendingData?.decisions) ? pendingData.decisions : [];
  const candidate = selectReadyDecisionForNotification(decisions, nowMs);

  if (!candidate) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  candidate.lastNotifiedAtMs = nowMs;
  try {
    writeFileSync(pendingFile, JSON.stringify(pendingData, null, 2) + '\n', 'utf-8');
  } catch {
    // Non-blocking persistence
  }

  const directive =
    `[MAPEK DECISION READY — ID: ${candidate.decisionId}] ` +
    `Proposta supervisore di processo: "${candidate.titleIt}" (${candidate.primitiveLabelIt} -> ${candidate.targetArtifact?.relativePath}). ` +
    `Evidenza: ${candidate.observedEvidenceIt} | Motivazione: ${candidate.decisionRationaleIt}. ` +
    `REGOLA OBBLIGATORIA (HUMAN-GATED MAPE-K): Non applicare alcuna modifica ai file dei plugin di nascosto. ` +
    `Comunica all'utente questa decisione in stile Semantic Drill-Down (Livello 0 sintetico + cassetto <details> con evidenza e alternative scartate) ` +
    `e usa ask_question per chiedergli se (1) Approvare e applicare ora eseguendo 'node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --apply ${candidate.decisionId} --confirm-user-approval', ` +
    `(2) Vedere/modificare prima la bozza ('--show ${candidate.decisionId}'), ` +
    `(3) Rifiutare per 30 giorni ('--reject ${candidate.decisionId}'), oppure ` +
    `(4) Rimandare di 24 ore ('--snooze ${candidate.decisionId}').`;

  process.stdout.write(
    JSON.stringify({
      injectSteps: [
        {
          ephemeralMessage: directive
        }
      ]
    }) + '\n'
  );
  process.exit(0);
}

if (isDirectEntry) {
  main().catch(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  });
}

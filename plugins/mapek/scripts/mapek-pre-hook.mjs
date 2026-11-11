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
import { join } from 'node:path';
import { getAnalyticsDir, getBrainDir } from './mapek.mjs';
import {
  isHumanConversationTranscript,
  isSubagentTranscriptHead
} from '../../human-governor/scripts/governor-hook.mjs';
import { isDirectCliEntrypoint } from '../../proactive-mentorship/scripts/session-miner.mjs';

const isDirectEntry = isDirectCliEntrypoint(import.meta.url, process.argv[1]);

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

  const questionPrompt =
    candidate.userFacingQuestionIt ||
    `[Plugin: mapek] Componente interessato: \`${candidate.targetArtifact?.relativePath}\` (${candidate.titleIt}).\nCosa non va bene: ${candidate.plainProblemIt || candidate.observedEvidenceIt}\nCome vuoi procedere?`;
  const optionsList = Array.isArray(candidate.userFacingOptionsIt) && candidate.userFacingOptionsIt.length === 4
    ? candidate.userFacingOptionsIt
    : [
        '(Recommended) Sì, applica ora questa modifica',
        'Mostrami prima il contenuto completo del file',
        'No, non mi serve (non riproporlo per 30 giorni)',
        'Chiedimelo di nuovo domani'
      ];

  const directive =
    `[MAPEK DECISION READY — PLUGIN: mapek — ID: ${candidate.decisionId}] ` +
    `Componente bersaglio ("cosa"): "${candidate.targetArtifact?.relativePath}" | Titolo: "${candidate.titleIt}" (${candidate.primitiveLabelIt}). ` +
    `Spiegazione chiara del problema ("cosa non va bene"): ${candidate.plainProblemIt || candidate.observedEvidenceIt} | Motivazione: ${candidate.decisionRationaleIt}. ` +
    `REGOLA OBBLIGATORIA DI IDENTIFICAZIONE E CHIAREZZA (HUMAN-GATED MAPE-K): ` +
    `1) Non applicare alcuna modifica di nascosto. ` +
    `2) Poiché ask_question appare all'utente PRIMA della tua risposta testuale, il testo della domanda in ask_question DEVE SEMPRE iniziare con "[Plugin: mapek]", indicare il nome esatto del file/componente ("${candidate.targetArtifact?.relativePath}") e spiegare in italiano semplice e dettagliato cosa non va bene usando questo testo: ${JSON.stringify(questionPrompt)} con le opzioni ${JSON.stringify(optionsList)}. ` +
    `3) In base alla risposta: (Opzione 1) esegui 'node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --apply ${candidate.decisionId} --confirm-user-approval', ` +
    `(Opzione 2) esegui '--show ${candidate.decisionId}', ` +
    `(Opzione 3) esegui '--reject ${candidate.decisionId}', ` +
    `(Opzione 4) esegui '--snooze ${candidate.decisionId}'.`;

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

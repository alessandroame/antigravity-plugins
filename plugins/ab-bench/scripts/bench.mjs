#!/usr/bin/env node

/**
 * Headless A/B Benchmark Engine & CLI for Prompt, Skill, and Plugin Evaluation.
 * Implements transcript metric extraction, SHA-256 blind assignment, sanitizer,
 * 5-Finger binary evaluation, Occam's Razor cost/value arbitration, and 5 MB log rotation.
 */

import {
  existsSync,
  readFileSync,
  appendFileSync,
  mkdirSync,
  statSync,
  renameSync,
  unlinkSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const MAX_HISTORY_BYTES = 5 * 1024 * 1024; // 5 MB rotation threshold

export const FINGER_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'pollice',
    index: 1,
    name: 'Pollice',
    label: 'Va al primo colpo',
    question: 'Completa ed eseguibile subito senza errori di sintassi, crash o TODO incompleti.'
  }),
  Object.freeze({
    id: 'indice',
    index: 2,
    name: 'Indice',
    label: 'Meno click / fatica',
    question: 'Minimo numero di passaggi manuali, click e scelte per chi lo usa.'
  }),
  Object.freeze({
    id: 'medio',
    index: 3,
    name: 'Medio',
    label: 'Tolleranza input sporchi',
    question: 'Normalizza spazi extra, separatori misti e formati imperfetti senza bloccarsi.'
  }),
  Object.freeze({
    id: 'anulare',
    index: 4,
    name: 'Anulare',
    label: 'Tenuta casi limite',
    question: 'Regge campi vuoti, valori estremi, assenza di rete o viewport ridotti (360px).'
  }),
  Object.freeze({
    id: 'mignolo',
    index: 5,
    name: 'Mignolo',
    label: 'Logica pulita / separata',
    question: 'Motore di calcolo isolato dalla grafica e verificabile con test.'
  })
]);

/**
 * Normalizes a file path by stripping outer quotes and normalizing slashes.
 * @param {string} rawPath
 * @returns {string}
 */
export function normalizePath(rawPath) {
  if (typeof rawPath !== 'string') return '';
  return rawPath
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\+/g, '/')
    .replace(/\/+/g, '/');
}

/**
 * Resolves the analytics directory, honoring explicit override or environment variable.
 * @param {string} [customDir]
 * @returns {string}
 */
export function getAnalyticsDir(customDir) {
  if (typeof customDir === 'string' && customDir.trim().length > 0) {
    return resolve(normalizePath(customDir));
  }
  if (process.env.ANTIGRAVITY_ANALYTICS_DIR) {
    return resolve(normalizePath(process.env.ANTIGRAVITY_ANALYTICS_DIR));
  }
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

/**
 * Parses raw JSONL content from a conversation transcript into deterministic metrics.
 * @param {string} rawText
 * @returns {object}
 */
export function parseTranscriptContent(rawText) {
  const empty = {
    exists: true,
    steps: 0,
    durationMs: 0,
    toolCalls: 0,
    errors: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    corruptedLines: 0
  };

  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return empty;
  }

  const cleanText = rawText.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/);
  const stepMap = new Map();
  let fallbackIndex = 0;
  let corruptedLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') {
        corruptedLines++;
        continue;
      }
      const key = Number.isFinite(parsed.step_index) ? parsed.step_index : `seq_${fallbackIndex++}`;
      stepMap.set(key, parsed);
    } catch {
      corruptedLines++;
    }
  }

  const orderedSteps = [...stepMap.entries()]
    .sort((a, b) => {
      const numA = typeof a[0] === 'number' ? a[0] : Number.MAX_SAFE_INTEGER;
      const numB = typeof b[0] === 'number' ? b[0] : Number.MAX_SAFE_INTEGER;
      return numA - numB;
    })
    .map((entry) => entry[1]);

  let minTime = null;
  let maxTime = null;
  let toolCalls = 0;
  let errors = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  for (const step of orderedSteps) {
    if (typeof step.created_at === 'string') {
      const ts = Date.parse(step.created_at);
      if (!Number.isNaN(ts)) {
        if (minTime === null || ts < minTime) minTime = ts;
        if (maxTime === null || ts > maxTime) maxTime = ts;
      }
    }

    if (Array.isArray(step.tool_calls)) {
      for (const tc of step.tool_calls) {
        if (tc && (typeof tc.name === 'string' || typeof tc.tool_name === 'string')) {
          toolCalls++;
        }
      }
    }

    const contentStr = String(step.content || '');
    if (step.status === 'ERROR' || /exited with code [^0]/i.test(contentStr)) {
      errors++;
    }

    if (Number.isFinite(step.input_tokens) && step.input_tokens > 0) {
      inputTokens += step.input_tokens;
    }
    if (Number.isFinite(step.output_tokens) && step.output_tokens > 0) {
      outputTokens += step.output_tokens;
    }
  }

  const durationMs =
    minTime !== null && maxTime !== null && maxTime >= minTime ? maxTime - minTime : 0;

  return {
    exists: true,
    steps: orderedSteps.length,
    durationMs,
    toolCalls,
    errors,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    corruptedLines
  };
}

/**
 * Reads a transcript.jsonl file from disk and extracts metrics without throwing on missing files.
 * @param {string} transcriptPath
 * @returns {object}
 */
export function parseTranscriptMetrics(transcriptPath) {
  const norm = normalizePath(transcriptPath);
  if (!norm || !existsSync(norm)) {
    return {
      exists: false,
      steps: 0,
      durationMs: 0,
      toolCalls: 0,
      errors: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      corruptedLines: 0
    };
  }
  try {
    const raw = readFileSync(norm, 'utf-8');
    return parseTranscriptContent(raw);
  } catch {
    return {
      exists: false,
      steps: 0,
      durationMs: 0,
      toolCalls: 0,
      errors: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      corruptedLines: 0
    };
  }
}

/**
 * Strips identifiable plugin banners, conversation links, and subagent role labels
 * so the Blind Judge evaluates pure substance without brand bias.
 * @param {string} rawOutput
 * @returns {string}
 */
export function sanitizeForBlindJudge(rawOutput) {
  if (typeof rawOutput !== 'string') return '';
  return rawOutput
    .replace(/^>\s*\[!IMPORTANT\]\r?\n>\s*\*\*MODALITÀ SKIZZO ATTIVA[^\r\n]*\r?\n+/gim, '')
    .replace(/^>\s*\[!IMPORTANT\]\r?\n>\s*\*\*VERDETTO AB-BENCH[^\r\n]*\r?\n+/gim, '')
    .replace(/\[[^\]]*\]\(conversation:\/\/[a-zA-Z0-9_-]+\)/g, '[Subagent]')
    .replace(/\bMODALITÀ SKIZZO ATTIVA\b/gi, 'MODALITÀ ANALISI')
    .replace(/\bSubagent (Alpha|Beta|Gamma)\b/gi, 'Modulo di Analisi')
    .replace(/\bOracolo (Alpha|Beta)\b/gi, 'Suite di Verifica')
    .trim();
}

/**
 * Creates a deterministic SHA-256 blind assignment mapping Challenger A and B
 * to anonymous labels 'Soluzione X' and 'Soluzione Y'.
 * @param {string} idA
 * @param {string} idB
 * @param {string} [seed]
 * @returns {object}
 */
export function createBlindAssignment(idA, idB, seed = randomUUID()) {
  if (typeof idA !== 'string' || !idA.trim() || typeof idB !== 'string' || !idB.trim()) {
    throw new TypeError('idA and idB must be non-empty strings.');
  }
  if (idA.trim() === idB.trim()) {
    throw new RangeError('idA and idB must be distinct identifiers.');
  }
  const cleanSeed = String(seed || randomUUID());
  const hash = createHash('sha256').update(`${cleanSeed}::${idA}::${idB}`).digest();
  const swapped = (hash[0] & 1) === 1;

  const slotX = swapped ? 'B' : 'A';
  const slotY = swapped ? 'A' : 'B';
  const assignedIdX = swapped ? idB : idA;
  const assignedIdY = swapped ? idA : idB;

  return Object.freeze({
    seed: cleanSeed,
    swapped,
    assignments: Object.freeze({
      X: Object.freeze({ anonymousLabel: 'Soluzione X', slot: slotX, id: assignedIdX }),
      Y: Object.freeze({ anonymousLabel: 'Soluzione Y', slot: slotY, id: assignedIdY })
    }),
    revealMap: Object.freeze({
      X: assignedIdX,
      Y: assignedIdY,
      slotX,
      slotY
    })
  });
}

/**
 * Parses permissive user slash command input according to Postel's Law and Tesler's Law.
 * @param {string} rawCommand
 * @returns {object}
 */
export function parseBenchCommand(rawCommand) {
  const raw = typeof rawCommand === 'string' ? rawCommand.trim() : '';
  const body = raw.replace(/^\/ab-bench\b/i, '').trim();

  if (!body || /^(?:--stats|-st|stats|storico|bilancio)$/i.test(body)) {
    return {
      mode: 'stats',
      skillName: null,
      controlLabel: null,
      treatmentLabel: null,
      prompt: ''
    };
  }

  // Match explicit --skill / -s / "con <skill>:"
  const skillFlagMatch =
    body.match(/^(?:--skill|-s)\s+([a-zA-Z0-9_-]+)\s+([\s\S]+)$/i) ||
    body.match(/^con\s+([a-zA-Z0-9_-]+)\s*:?\s+([\s\S]+)$/i);

  if (skillFlagMatch) {
    const skillName = skillFlagMatch[1].toLowerCase();
    const prompt = skillFlagMatch[2].trim();
    return {
      mode: 'skill',
      skillName,
      controlLabel: `Senza ${skillName}`,
      treatmentLabel: `Con ${skillName}`,
      prompt
    };
  }

  // Match Prompt A vs Prompt B with straight or curly quotes
  const vsMatch = body.match(
    /^["“'«]([\s\S]+?)["”'»]\s*(?:vs\.?|contro|\|)\s*["“'«]([\s\S]+?)["”'»]$/i
  );
  if (vsMatch) {
    const promptA = vsMatch[1].trim();
    const promptB = vsMatch[2].trim();
    return {
      mode: 'prompt-vs-prompt',
      skillName: 'custom-prompt',
      controlLabel: 'Prompt A (Base)',
      treatmentLabel: 'Prompt B (Variante)',
      prompt: `${promptA} vs ${promptB}`,
      promptA,
      promptB
    };
  }

  // Zero-Config Default (Tesler fallback): Senza /skizzo vs Con /skizzo
  return {
    mode: 'default-skizzo',
    skillName: 'skizzo',
    controlLabel: 'Senza /skizzo',
    treatmentLabel: 'Con /skizzo',
    prompt: body
  };
}

/**
 * Normalizes a 5-finger score input (array or object) into a strict 5-element array of 0 or 1.
 * @param {Array|object} scores
 * @returns {number[]}
 */
export function normalizeFingerScores(scores) {
  const toBit = (val) => (val === 1 || val === true || val === '1' ? 1 : 0);
  if (Array.isArray(scores)) {
    return FINGER_DEFINITIONS.map((_, idx) => toBit(scores[idx]));
  }
  if (scores && typeof scores === 'object') {
    const aliases = [
      ['pollice', 'thumb', 'correctness', 'd1'],
      ['indice', 'index', 'ux', 'd2'],
      ['medio', 'middle', 'tolerance', 'sobriety', 'd3'],
      ['anulare', 'ring', 'edgeCases', 'completeness', 'd4'],
      ['mignolo', 'pinky', 'architecture', 'd5']
    ];
    return aliases.map((keys) => {
      for (const k of keys) {
        if (k in scores) return toBit(scores[k]);
      }
      return 0;
    });
  }
  return [0, 0, 0, 0, 0];
}

/**
 * Evaluates the 5-Finger scores and physical transcript metrics to produce a deterministic verdict.
 * @param {object} params
 * @returns {object}
 */
export function evaluateVerdict({
  metricsA = {},
  metricsB = {},
  scoresA = [],
  scoresB = [],
  labelA = 'Senza /skizzo',
  labelB = 'Con /skizzo'
}) {
  const dimensionsA = normalizeFingerScores(scoresA);
  const dimensionsB = normalizeFingerScores(scoresB);

  const scoreA = dimensionsA.reduce((acc, v) => acc + v, 0);
  const scoreB = dimensionsB.reduce((acc, v) => acc + v, 0);
  const scoreDelta = scoreB - scoreA;

  const stepsA = Number.isFinite(metricsA.steps) ? metricsA.steps : 0;
  const stepsB = Number.isFinite(metricsB.steps) ? metricsB.steps : 0;
  const durA = Number.isFinite(metricsA.durationMs) ? metricsA.durationMs : 0;
  const durB = Number.isFinite(metricsB.durationMs) ? metricsB.durationMs : 0;
  const errA = Number.isFinite(metricsA.errors) ? metricsA.errors : 0;
  const errB = Number.isFinite(metricsB.errors) ? metricsB.errors : 0;
  const tokA = Number.isFinite(metricsA.totalTokens) ? metricsA.totalTokens : 0;
  const tokB = Number.isFinite(metricsB.totalTokens) ? metricsB.totalTokens : 0;

  const rawStepRatio = stepsA > 0 ? stepsB / stepsA : stepsB > 0 ? Infinity : 1.0;
  const rawDurRatio = durA > 0 ? durB / durA : durB > 0 ? Infinity : 1.0;

  const stepRatio = Number.isFinite(rawStepRatio) ? Number(rawStepRatio.toFixed(2)) : Infinity;
  const durationRatio = Number.isFinite(rawDurRatio) ? Number(rawDurRatio.toFixed(2)) : Infinity;
  const durationDeltaMs = durB - durA;
  const isBloatB = stepRatio >= 1.5 || durationRatio >= 1.5;

  const gainedFingers = [];
  const lostFingers = [];
  FINGER_DEFINITIONS.forEach((f, idx) => {
    if (dimensionsB[idx] === 1 && dimensionsA[idx] === 0) gainedFingers.push(f.name);
    if (dimensionsB[idx] === 0 && dimensionsA[idx] === 1) lostFingers.push(f.name);
  });

  let winner = labelA;
  let winnerSlot = 'A';
  let reason = 'EXACT_PARITY';
  let verdictCode = 'WASTED_EFFORT';
  let verdictHeadline = 'NO, TEMPO SPRECATO';

  if (scoreB > scoreA) {
    winner = labelB;
    winnerSlot = 'B';
    reason = 'SCORE_SUPERIORITY_B';
    verdictCode = 'WORTH_IT';
    verdictHeadline = 'SÌ, VALEVA LA PENA';
  } else if (scoreB < scoreA) {
    winner = labelA;
    winnerSlot = 'A';
    reason = isBloatB ? 'EFFICIENCY_GUARD_A_WINS' : 'SCORE_SUPERIORITY_A';
    verdictCode = 'OVER_ENGINEERED';
    verdictHeadline = 'NO, DANNO DA OVER-ENGINEERING';
  } else {
    // scoreB === scoreA: Occam's Razor & Tie-Breaking Cascade
    verdictCode = 'WASTED_EFFORT';
    verdictHeadline = 'NO, TEMPO SPRECATO';

    if (isBloatB) {
      winner = labelA;
      winnerSlot = 'A';
      reason = 'EFFICIENCY_GUARD_A_WINS';
    } else if (stepsA !== stepsB) {
      winnerSlot = stepsA < stepsB ? 'A' : 'B';
      winner = winnerSlot === 'A' ? labelA : labelB;
      reason = 'TIE_BREAKER_FEWER_STEPS';
    } else if (durA !== durB) {
      winnerSlot = durA < durB ? 'A' : 'B';
      winner = winnerSlot === 'A' ? labelA : labelB;
      reason = 'TIE_BREAKER_FASTER_DURATION';
    } else if (errA !== errB) {
      winnerSlot = errA < errB ? 'A' : 'B';
      winner = winnerSlot === 'A' ? labelA : labelB;
      reason = 'TIE_BREAKER_FEWER_ERRORS';
    } else if (tokA !== tokB) {
      winnerSlot = tokA < tokB ? 'A' : 'B';
      winner = winnerSlot === 'A' ? labelA : labelB;
      reason = 'TIE_BREAKER_FEWER_TOKENS';
    } else {
      winner = 'TIE';
      winnerSlot = 'TIE';
      reason = 'EXACT_PARITY';
    }
  }

  return {
    winner,
    winnerSlot,
    verdictCode,
    verdictHeadline,
    reason,
    labelA,
    labelB,
    scoreA,
    scoreB,
    scoreDelta,
    stepRatio,
    durationRatio,
    durationDeltaMs,
    gainedFingers,
    lostFingers,
    dimensionsA,
    dimensionsB
  };
}

/**
 * Appends a benchmark record to ab-bench-history.ndjson, rotating to .archive.ndjson if > 5 MB.
 * @param {object} record
 * @param {string} [customAnalyticsDir]
 * @returns {string} Path to the written history file
 */
export function appendBenchRecord(record, customAnalyticsDir) {
  const dir = getAnalyticsDir(customAnalyticsDir);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const historyPath = join(dir, 'ab-bench-history.ndjson');
  const archivePath = join(dir, 'ab-bench-history.archive.ndjson');

  if (existsSync(historyPath)) {
    const { size } = statSync(historyPath);
    if (size > MAX_HISTORY_BYTES) {
      if (existsSync(archivePath)) {
        unlinkSync(archivePath);
      }
      renameSync(historyPath, archivePath);
    }
  }

  const payload = {
    timestamp: new Date().toISOString(),
    ...record
  };
  appendFileSync(historyPath, `${JSON.stringify(payload)}\n`, 'utf-8');
  return historyPath;
}

/**
 * Loads all benchmark records from ab-bench-history.ndjson.
 * @param {string} [customAnalyticsDir]
 * @returns {object[]}
 */
export function loadBenchHistory(customAnalyticsDir) {
  const dir = getAnalyticsDir(customAnalyticsDir);
  const historyPath = join(dir, 'ab-bench-history.ndjson');
  if (!existsSync(historyPath)) return [];

  const raw = readFileSync(historyPath, 'utf-8').replace(/^\uFEFF/, '');
  const records = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        records.push(parsed);
      }
    } catch {
      // Skip malformed line
    }
  }
  return records;
}

/**
 * Single-pass O(N) aggregation of benchmark history records.
 * @param {object[]} historyRecords
 * @returns {object}
 */
export function aggregateStats(historyRecords) {
  const records = Array.isArray(historyRecords) ? historyRecords : [];
  const slotWins = { A: 0, B: 0, TIE: 0 };
  const matchups = {};
  let totalBenchmarks = 0;
  let efficiencyGuardTriggers = 0;
  let sumScoreA = 0;
  let sumScoreB = 0;
  let sumStepRatio = 0;
  let countStepRatio = 0;
  let sumDurRatio = 0;
  let countDurRatio = 0;

  for (const rec of records) {
    if (!rec || typeof rec !== 'object') continue;
    totalBenchmarks++;

    const slot = rec.winnerSlot === 'B' ? 'B' : rec.winnerSlot === 'A' ? 'A' : 'TIE';
    slotWins[slot]++;

    if (rec.reason === 'EFFICIENCY_GUARD_A_WINS') {
      efficiencyGuardTriggers++;
    }

    const sA = Number.isFinite(rec.scoreA) ? rec.scoreA : 0;
    const sB = Number.isFinite(rec.scoreB) ? rec.scoreB : 0;
    sumScoreA += sA;
    sumScoreB += sB;

    if (Number.isFinite(rec.stepRatio) && rec.stepRatio > 0) {
      sumStepRatio += rec.stepRatio;
      countStepRatio++;
    }
    if (Number.isFinite(rec.durationRatio) && rec.durationRatio > 0) {
      sumDurRatio += rec.durationRatio;
      countDurRatio++;
    }

    const labelA = rec.labelA || 'Controllo A';
    const labelB = rec.labelB || 'Trattamento B';
    const key = `${labelA} vs ${labelB}`;
    if (!matchups[key]) {
      matchups[key] = {
        labelA,
        labelB,
        total: 0,
        winsA: 0,
        winsB: 0,
        ties: 0,
        totalScoreDelta: 0
      };
    }
    matchups[key].total++;
    matchups[key].totalScoreDelta += sB - sA;
    if (slot === 'B') matchups[key].winsB++;
    else if (slot === 'A') matchups[key].winsA++;
    else matchups[key].ties++;
  }

  const winRateB =
    totalBenchmarks > 0 ? Math.round((slotWins.B / totalBenchmarks) * 100) : 0;

  return {
    totalBenchmarks,
    slotWins,
    winRateB,
    efficiencyGuardTriggers,
    averages: {
      scoreA: totalBenchmarks > 0 ? Number((sumScoreA / totalBenchmarks).toFixed(2)) : 0,
      scoreB: totalBenchmarks > 0 ? Number((sumScoreB / totalBenchmarks).toFixed(2)) : 0,
      scoreDelta:
        totalBenchmarks > 0
          ? Number(((sumScoreB - sumScoreA) / totalBenchmarks).toFixed(2))
          : 0,
      stepRatio: countStepRatio > 0 ? Number((sumStepRatio / countStepRatio).toFixed(2)) : 1,
      durationRatio: countDurRatio > 0 ? Number((sumDurRatio / countDurRatio).toFixed(2)) : 1
    },
    matchups
  };
}

/**
 * Formats milliseconds into compact human-readable seconds (e.g., "12.4s").
 * @param {number} ms
 * @returns {string}
 */
export function formatSeconds(ms) {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
  return `${(safeMs / 1000).toFixed(1)}s`;
}

/**
 * Renders the ~600px compliant Markdown verdict block (0-Click <= 12 lines + 1-Click <details>).
 * @param {object} verdict
 * @param {object} [options]
 * @returns {string}
 */
export function renderVerdictMarkdown(verdict, options = {}) {
  const {
    metricsA = { durationMs: 0, steps: 0 },
    metricsB = { durationMs: 0, steps: 0 },
    notes = [],
    idA = '',
    idB = '',
    idJudge = ''
  } = options;

  const secA = formatSeconds(metricsA.durationMs);
  const secB = formatSeconds(metricsB.durationMs);
  const deltaSecNum = ((metricsB.durationMs || 0) - (metricsA.durationMs || 0)) / 1000;
  const deltaSecStr = `${deltaSecNum >= 0 ? '+' : ''}${deltaSecNum.toFixed(1)}s`;
  const deltaFingersStr = `${verdict.scoreDelta >= 0 ? '+' : ''}${verdict.scoreDelta} dita`;

  let gainLine = 'Nessun dito aggiuntivo guadagnato rispetto al prompt semplice.';
  if (verdict.gainedFingers.length > 0) {
    gainLine = `Guadagna ${verdict.gainedFingers.join(', ')} (${deltaFingersStr}) rispetto a ${verdict.labelA}.`;
  } else if (verdict.lostFingers.length > 0) {
    gainLine = `Perde ${verdict.lostFingers.join(', ')} (${deltaFingersStr}) per eccesso di complessità.`;
  }

  let roiLine = `A parità di risultato (${verdict.scoreA}/5), ${verdict.labelA} fa risparmiare tempo (${secA} vs ${secB}).`;
  if (verdict.verdictCode === 'WORTH_IT') {
    const secPerFinger =
      verdict.scoreDelta > 0 && deltaSecNum > 0
        ? `+${(deltaSecNum / verdict.scoreDelta).toFixed(1)}s per dito guadagnato`
        : `${deltaSecStr} totali`;
    roiLine = `Il vantaggio di +${verdict.scoreDelta} dita giustifica la differenza di tempo (${secPerFinger}).`;
  } else if (verdict.verdictCode === 'OVER_ENGINEERED') {
    roiLine = `${verdict.labelA} ottiene un punteggio migliore (${verdict.scoreA}/5 vs ${verdict.scoreB}/5) in ${secA}.`;
  }

  const lines = [];
  lines.push(`> [!IMPORTANT]`);
  lines.push(
    `> **VERDETTO AB-BENCH (\`${verdict.labelB}\` vs \`${verdict.labelA}\`)**: **${verdict.verdictHeadline}** — \`${verdict.labelB}\` ottiene **${verdict.scoreB}/5 dita** contro **${verdict.scoreA}/5** (\`${deltaFingersStr}\`, \`${deltaSecStr}\`).`
  );
  lines.push('');
  lines.push(
    `- **Punteggio Uomo della Pietra**: \`${verdict.labelA}\`: **${verdict.scoreA}/5 dita** (\`${secA}\`, \`${metricsA.steps || 0} step\`) · \`${verdict.labelB}\`: **${verdict.scoreB}/5 dita** (\`${secB}\`, \`${metricsB.steps || 0} step\`).`
  );
  lines.push(`- **Differenza sulle 5 Dita**: ${gainLine}`);
  lines.push(`- **Rapporto Tempo / Beneficio**: ${roiLine}`);

  if (idA && idB) {
    const judgePart = idJudge ? ` · [\`Giudice Cieco\`](conversation://${idJudge})` : '';
    lines.push(
      `- **Tracciabilità Cieca**: [\`${verdict.labelA}\`](conversation://${idA}) · [\`${verdict.labelB}\`](conversation://${idB})${judgePart}.`
    );
  }

  lines.push('');
  lines.push('<details>');
  lines.push(
    '<summary><strong>Tabella delle 5 Dita, Tempi Reali e Prova del Giudice Cieco (Espandi dettagli)</strong></summary>'
  );
  lines.push('');
  lines.push(
    `| Dito (Criterio Pratico) | ${verdict.labelA} (\`${secA}\`) | ${verdict.labelB} (\`${secB}\`) | Motivazione del Giudice Cieco |`
  );
  lines.push('| :--- | :---: | :---: | :--- |');

  FINGER_DEFINITIONS.forEach((f, idx) => {
    const valA = verdict.dimensionsA[idx] === 1 ? '`1` (SÌ)' : '`0` (NO)';
    const valB = verdict.dimensionsB[idx] === 1 ? '`1` (SÌ)' : '`0` (NO)';
    const note = notes[idx] || f.question;
    lines.push(`| **${f.index}. ${f.name}** — ${f.label} | ${valA} | ${valB} | ${note} |`);
  });

  const displayWinner =
    verdict.winnerSlot === 'B' ? verdict.labelB : verdict.labelA;
  lines.push(
    `| **TOTALE DITA & TEMPO** | **${verdict.scoreA}/5 dita** (\`${secA}\`) | **${verdict.scoreB}/5 dita** (\`${secB}\`) | **Vince \`${displayWinner}\` (\`${deltaFingersStr}\`, \`${deltaSecStr}\`)** |`
  );
  lines.push('');
  lines.push('</details>');

  return lines.join('\n');
}

/**
 * Renders the historical summary Markdown for /ab-bench --stats.
 * @param {object} stats
 * @returns {string}
 */
export function renderStatsMarkdown(stats) {
  if (!stats || stats.totalBenchmarks === 0) {
    return [
      '> [!NOTE]',
      '> **Bilancio Storico A/B Bench**: Nessuna sfida registrata finora. Esegui `/ab-bench <compito>` per avviare la prima sfida cieca sulle 5 dita.'
    ].join('\n');
  }

  const recommendation =
    stats.winRateB >= 50
      ? `Il trattamento potenziato ha vinto il **${stats.winRateB}%** delle sfide (\`+${stats.averages.scoreDelta} dita\` medie). Conviene sui task strutturati; evitalo sui fix banali.`
      : `Il prompt semplice ha vinto o pareggiato nel **${100 - stats.winRateB}%** dei casi. Riserva i plugin pesanti solo ai task con conflitto tra UX e architettura.`;

  const lines = [];
  lines.push('> [!IMPORTANT]');
  lines.push(
    `> **BILANCIO STORICO AB-BENCH (${stats.totalBenchmarks} Sfide)**: Tasso di vittoria Plugin/Variante **${stats.winRateB}%** (\`${stats.slotWins.B}\` vittorie vere vs \`${stats.slotWins.A + stats.slotWins.TIE}\` vittorie del prompt semplice per risparmio o superiorità).`
  );
  lines.push('');
  lines.push(
    `- **Media Punteggio 5 Dita**: Controllo Base **${stats.averages.scoreA}/5** · Con Plugin/Variante **${stats.averages.scoreB}/5** (\`${stats.averages.scoreDelta >= 0 ? '+' : ''}${stats.averages.scoreDelta} dita\`).`
  );
  lines.push(
    `- **Moltiplicatore di Costo Medio**: \`${stats.averages.durationRatio}x\` tempo · \`${stats.averages.stepRatio}x\` step (\`${stats.efficiencyGuardTriggers}\` sprechi bloccati dal Rasoio di Occam).`
  );
  lines.push(`- **Consiglio Pratico**: ${recommendation}`);
  lines.push('');
  lines.push('<details>');
  lines.push('<summary><strong>Dettaglio Sfide per Plugin / Skill Testata</strong></summary>');
  lines.push('');
  lines.push('| Confronto | Sfide | Vince Base (A) | Vince Plugin (B) | Delta Medio Dita |');
  lines.push('| :--- | :---: | :---: | :---: | :---: |');

  for (const [key, m] of Object.entries(stats.matchups)) {
    const avgDelta = m.total > 0 ? (m.totalScoreDelta / m.total).toFixed(2) : '0.00';
    lines.push(
      `| **${key}** | \`${m.total}\` | \`${m.winsA + m.ties}\` | \`${m.winsB}\` | \`${avgDelta >= 0 ? '+' : ''}${avgDelta}\` |`
    );
  }

  lines.push('');
  lines.push('</details>');
  return lines.join('\n');
}

function runCli() {
  const watchdog = setTimeout(() => {
    console.error('[FATAL TIMEOUT] bench.mjs exceeded 45s limit.');
    process.exit(1);
  }, 45000);
  watchdog.unref();

  const args = process.argv.slice(2);
  const getArg = (flag, fallback = '') => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
  };

  if (args.includes('--stats')) {
    const customDir = getArg('--analytics-dir', '');
    const records = loadBenchHistory(customDir);
    const stats = aggregateStats(records);
    if (args.includes('--json')) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log(renderStatsMarkdown(stats));
    }
    return;
  }

  if (args.includes('--parse')) {
    const cmd = getArg('--parse', '');
    console.log(JSON.stringify(parseBenchCommand(cmd), null, 2));
    return;
  }

  if (args.includes('--prepare')) {
    const idA = getArg('--id-a', 'control-a');
    const idB = getArg('--id-b', 'treatment-b');
    const transcriptA = getArg('--transcript-a', '');
    const transcriptB = getArg('--transcript-b', '');
    const seed = getArg('--seed', randomUUID());

    const metricsA = parseTranscriptMetrics(transcriptA);
    const metricsB = parseTranscriptMetrics(transcriptB);
    const blind = createBlindAssignment(idA, idB, seed);

    console.log(JSON.stringify({ blind, metricsA, metricsB }, null, 2));
    return;
  }

  if (args.includes('--evaluate')) {
    const labelA = getArg('--label-a', 'Senza /skizzo');
    const labelB = getArg('--label-b', 'Con /skizzo');
    const scoresA = getArg('--scores-a', '0,0,0,0,0')
      .split(',')
      .map((n) => Number(n.trim()));
    const scoresB = getArg('--scores-b', '0,0,0,0,0')
      .split(',')
      .map((n) => Number(n.trim()));
    const transcriptA = getArg('--transcript-a', '');
    const transcriptB = getArg('--transcript-b', '');
    const durA = Number(getArg('--duration-a', '0'));
    const durB = Number(getArg('--duration-b', '0'));
    const stepsA = Number(getArg('--steps-a', '0'));
    const stepsB = Number(getArg('--steps-b', '0'));
    const customDir = getArg('--analytics-dir', '');

    const parsedA = transcriptA ? parseTranscriptMetrics(transcriptA) : {};
    const parsedB = transcriptB ? parseTranscriptMetrics(transcriptB) : {};

    const metricsA = {
      ...parsedA,
      durationMs: durA || parsedA.durationMs || 0,
      steps: stepsA || parsedA.steps || 0
    };
    const metricsB = {
      ...parsedB,
      durationMs: durB || parsedB.durationMs || 0,
      steps: stepsB || parsedB.steps || 0
    };

    const verdict = evaluateVerdict({
      metricsA,
      metricsB,
      scoresA,
      scoresB,
      labelA,
      labelB
    });

    if (!args.includes('--no-save')) {
      appendBenchRecord({ ...verdict, metricsA, metricsB }, customDir);
    }

    if (args.includes('--json')) {
      console.log(JSON.stringify({ verdict, metricsA, metricsB }, null, 2));
    } else {
      console.log(
        renderVerdictMarkdown(verdict, {
          metricsA,
          metricsB,
          idA: getArg('--id-a', ''),
          idB: getArg('--id-b', ''),
          idJudge: getArg('--id-judge', '')
        })
      );
    }
    return;
  }

  console.log(
    'Usage: bench.mjs [--stats] [--parse "<cmd>"] [--prepare ...] [--evaluate ...]'
  );
}

const isMain =
  process.argv[1] &&
  normalizePath(fileURLToPath(import.meta.url)).toLowerCase() ===
    normalizePath(resolve(process.argv[1])).toLowerCase();

if (isMain) {
  runCli();
}

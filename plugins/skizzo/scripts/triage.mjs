#!/usr/bin/env node
/**
 * Skizzo Auto-Triage Headless Engine (O(1))
 * Pure deterministic classifier that decides a priori whether a user request
 * warrants launching the full Dual-Track (Alpha + Beta subagents) or executing
 * a direct Single-Track Fast-Pass (0 subagents, saving ~90-120s) while keeping
 * the SKIZZO session state sticky for subsequent turns.
 *
 * Zero DOM/storage dependencies. Runs in < 5ms in pure Node.js.
 */

import { fileURLToPath } from 'node:url';

const FORCE_PATTERNS = [
  /(?:^|\s)--force(?:\s|$)/i,
  /(?:^|\s)-f(?:\s|$)/i,
  /\b(?:forza\s+skizzo|usa\s+skizzo|con\s+skizzo\s+completo|dual[- ]track\s+forzato)\b/i
];

const SKIP_PATTERNS = [
  /(?:^|\s)--(?:skip|fast)(?:\s|$)/i,
  /\b(?:senza\s+skizzo|salta\s+skizzo|risposta\s+veloce|vai\s+veloce|fast[- ]pass)\b/i
];

const MEDIATOR_PATTERNS = [
  /(?:^|\s)--mediator(?:\s|$)/i,
  /(?:^|\s)-m(?:\s|$)/i
];

// Guard G1: Pure operational, Git, test runner, sync, memory commands, or direct execution confirmation of an approved plan
const OPS_GUARD_PATTERNS = [
  /^\/(?:memory-sync|take-note|review-notes|next-step|validate-plugins|focus-audit|plugin-analytics|telemetry-export)\b/i,
  /^(?:git\s+(?:status|add|commit|diff|log|push|pull|branch|checkout|worktree)|npm\s+(?:test|run\s+sync|run\s+validate)|node\s+(?:--test|scripts\/validate\.mjs))\b/i,
  /^(?:fai\s+(?:il\s+)?commit|esegui\s+i\s+test|lancia\s+i\s+test|sincronizza\s+i\s+plugin|aggiorna\s+la\s+memoria)\s*[.!]?$/i,
  /^(?:fallo|procedi|ok\s+procedi|vai(?:\s+pure)?|esegui(?:\s+il\s+piano)?|applica(?:\s+il\s+piano)?|implementa\s+il\s+piano|s[iì]\s+procedi)\s*[.!]?$/i
];

// Guard G2: Pure read-only / inspection questions without design or modification intent
const READONLY_START_PATTERNS = [
  /^\/how-its-made\b/i,
  /^(?:spiega(?:mi)?|mostra(?:mi)?|leggi|dove\s+si\s+trova|cosa\s+fa|come\s+funziona|a\s+che\s+punto\s+siamo|qual\s+[eè]|quali\s+sono|elenca|explain|where\s+is|show\s+me|what\s+does)\b/i
];

// Guard G3: Surgical single-choice micro-edits (typo, rename, single constant/color/padding tweak)
const MICRO_EDIT_PATTERNS = [
  /\b(?:correggi\s+(?:il\s+)?(?:typo|refuso)|fix\s+typo|rinomina|rename|cambia\s+il\s+(?:colore|testo|padding|margine|titolo|numero|valore)|aggiorna\s+la\s+versione|bump\s+version|fix\s+(?:lint|import))\b/i
];

// Signals that indicate genuine design, architectural, or UX trade-offs (overrides G2/G3)
const DESIGN_INTENT_PATTERNS = [
  /\b(?:fai\s+un\s+piano|progetta(?:re)?|architettura|nuova\s+funzionalit[aà]|nuovo\s+(?:plugin|modulo|sistema|flusso)|rifattorizza(?:re)?|refactor|migliora(?:re)?|modalit[aà]\s+auto|sistema\s+per\s+filtrare|bivio|compromesso|trade[- ]?off)\b/i
];

// Additive Scoring Dimension 1 (+2 pt): Architecture, planning, multi-file, or core engine design (Pollice & Mignolo)
const TENSION_ARCH_PATTERNS = [
  /\b(?:piano|progetta(?:re|zione)?|architettur\w+|funzionalit[aà]|feature|rifattorizz\w+|refactor\w*|miglior\w+|ottimizz\w+|motore|headless|core|algoritm\w+|struttur\w+|multi[- ]?file|plugin|orchestraz\w+|modalit[aà]\s+auto)\b/i
];

// Additive Scoring Dimension 2 (+2 pt): User Experience, ergonomics, UI flows, reducing clicks/fatigue (Indice & Anulare)
const TENSION_UX_PATTERNS = [
  /\b(?:utente|ux|ui|interfaccia|flusso|click|fatica|passaggi|pulsant\w+|botton\w+|form|modulo|dashboard|vista|mobile|360px|responsive|ergonomi\w+|semplicit[aà]|comodo|automatic\w+|preferenz\w+|feedback)\b/i
];

// Additive Scoring Dimension 3 (+2 pt): Dirty inputs, parsing, edge cases, filtering, thresholds, concurrency (Medio & Anulare)
const TENSION_EDGE_PATTERNS = [
  /\b(?:input|parsing|parser|validaz\w+|format\w+|casi\s+limite|edge\s+case|error\w+|fallback|cache|concorrenz\w+|race\s+condition|deterministic\w+|a\s+priori|sogli\w+|filtr\w+|ricerca|tolleranz\w+|sicurezz\w+)\b/i
];

// Additive Scoring Dimension 4 (+1 pt): Open-ended exploration / multiple degrees of freedom
const TENSION_OPEN_PATTERNS = [
  /\b(?:c'[eè]\s+qualche\s+modo|come\s+possiamo|conviene|dove\s+conviene|alternativ\w+|strategi\w+|approcci\w+|opzion\w+|valuta(?:re)?|confront\w+)\b/i
];

/**
 * Normalizes a raw prompt string by stripping leading `/skizzo` command tokens and flags.
 * @param {unknown} rawPrompt
 * @returns {string}
 */
export function normalizePromptText(rawPrompt) {
  if (typeof rawPrompt !== 'string') return '';
  return rawPrompt
    .replace(/^\s*\/skizzo\b/i, '')
    .replace(/(?:^|\s)--(?:force|skip|fast|always|mediator|no-mediator|proto)\b/gi, ' ')
    .replace(/(?:^|\s)-(?:f|m)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classifies a prompt in O(1) to decide between FAST-PASS (0 subagents) and DUAL-TRACK (2 subagents).
 * @param {unknown} rawPrompt
 * @param {{ force?: boolean, fast?: boolean, skip?: boolean, mediator?: boolean, always?: boolean }} [options]
 * @returns {{
 *   route: 'FAST-PASS' | 'DUAL-TRACK' | 'DUAL-TRACK+MEDIATOR',
 *   score: number,
 *   reason: string,
 *   signals: string[],
 *   keepStickyOn: boolean,
 *   estimatedSavedSeconds: number
 * }}
 */
export function classifySkizzoTask(rawPrompt, options = {}) {
  const safeRaw = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  const cleanText = normalizePromptText(safeRaw);

  const hasMediator = Boolean(options.mediator) || MEDIATOR_PATTERNS.some((rx) => rx.test(safeRaw));
  const dualRoute = hasMediator ? 'DUAL-TRACK+MEDIATOR' : 'DUAL-TRACK';

  // 0. Empty or whitespace-only input -> safe FAST-PASS
  if (!cleanText) {
    return {
      route: 'FAST-PASS',
      score: 0,
      reason: 'messaggio vuoto o solo comando di stato',
      signals: ['empty_input'],
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  // 1. Explicit user overrides (--force / --always vs --skip / --fast)
  const isForced = Boolean(options.force || options.always) || FORCE_PATTERNS.some((rx) => rx.test(safeRaw));
  if (isForced) {
    return {
      route: dualRoute,
      score: 99,
      reason: 'forzatura esplicita richiesta dall\'utente (--force)',
      signals: ['manual_force'],
      keepStickyOn: true,
      estimatedSavedSeconds: 0
    };
  }

  const isSkipped = Boolean(options.fast || options.skip) || SKIP_PATTERNS.some((rx) => rx.test(safeRaw));
  if (isSkipped) {
    return {
      route: 'FAST-PASS',
      score: -50,
      reason: 'risposta rapida richiesta dall\'utente (--skip)',
      signals: ['manual_skip'],
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  // 2. Hard-Bypass Guards (G1, G2, G3) when no structural design intent is present
  const hasDesignIntent = DESIGN_INTENT_PATTERNS.some((rx) => rx.test(cleanText));

  if (OPS_GUARD_PATTERNS.some((rx) => rx.test(cleanText))) {
    return {
      route: 'FAST-PASS',
      score: -99,
      reason: 'comando operativo o esecuzione diretta di piano già approvato',
      signals: ['guard_ops_or_plan_exec'],
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  if (!hasDesignIntent && READONLY_START_PATTERNS.some((rx) => rx.test(cleanText))) {
    return {
      route: 'FAST-PASS',
      score: -40,
      reason: 'domanda informativa o ispezione di sola lettura',
      signals: ['guard_readonly'],
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  if (!hasDesignIntent && MICRO_EDIT_PATTERNS.some((rx) => rx.test(cleanText))) {
    return {
      route: 'FAST-PASS',
      score: 1,
      reason: 'modifica puntuale a scelta unica senza bivi progettuali',
      signals: ['guard_micro_edit'],
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  // 3. Additive Dialectical Tension Scoring (0..7 points)
  let score = 0;
  const signals = [];

  if (TENSION_ARCH_PATTERNS.some((rx) => rx.test(cleanText))) {
    score += 2;
    signals.push('arch_or_plan_tension');
  }
  if (TENSION_UX_PATTERNS.some((rx) => rx.test(cleanText))) {
    score += 2;
    signals.push('ux_or_flow_tension');
  }
  if (TENSION_EDGE_PATTERNS.some((rx) => rx.test(cleanText))) {
    score += 2;
    signals.push('input_or_edge_tension');
  }
  if (TENSION_OPEN_PATTERNS.some((rx) => rx.test(cleanText))) {
    score += 1;
    signals.push('open_tradeoff');
  }

  // Multi-file or complex scope boost
  const fileMentions = (cleanText.match(/@[\w./-]+|\b[\w-]+\.(?:mjs|js|ts|md|json|html|css)\b/g) || []).length;
  if (fileMentions >= 3 && score < 3) {
    score += 2;
    signals.push('multi_file_scope');
  }

  if (score >= 3) {
    const finalRoute = score >= 5 && hasMediator ? 'DUAL-TRACK+MEDIATOR' : dualRoute;
    return {
      route: finalRoute,
      score,
      reason: 'scelta progettuale con compromessi tra esperienza d\'uso e architettura',
      signals,
      keepStickyOn: true,
      estimatedSavedSeconds: 0
    };
  }

  return {
    route: 'FAST-PASS',
    score,
    reason: 'richiesta diretta senza conflitti architetturali o di esperienza utente',
    signals: signals.length ? signals : ['low_tension_direct'],
    keepStickyOn: true,
    estimatedSavedSeconds: 110
  };
}

// CLI entrypoint for quick inspection: node plugins/skizzo/scripts/triage.mjs "<prompt>"
const isMain = process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].replace(/\\/g, '/').toLowerCase();
if (isMain) {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const skip = args.includes('--skip') || args.includes('--fast');
  const mediator = args.includes('--mediator') || args.includes('-m');
  const promptArg = args.filter((a) => !['--force', '-f', '--skip', '--fast', '--mediator', '-m'].includes(a)).join(' ');
  const result = classifySkizzoTask(promptArg, { force, skip, mediator });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

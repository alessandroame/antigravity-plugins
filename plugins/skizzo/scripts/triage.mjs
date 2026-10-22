#!/usr/bin/env node
/**
 * Skizzo Auto-Triage Headless Engine (O(1))
 * Pure deterministic classifier that decides a priori whether a user request
 * warrants launching Multi-Track Skizzo (2..4 dynamic domain subagents instantiated
 * and ranked by the LLM) or executing a direct Single-Track Fast-Pass (0 subagents).
 *
 * Also exports `rankAndCapDomains` to sort LLM-identified candidate domains by
 * importance and conflict weight, enforcing the hard cap of [2..4] agents.
 *
 * Zero DOM/storage dependencies. Runs in < 5ms in pure Node.js.
 */

import { fileURLToPath } from 'node:url';

const MAX_TRACKS = 4;
const MIN_TRACKS = 2;
const TRACK_SLOTS = ['Alpha', 'Beta', 'Delta', 'Epsilon'];

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

const TRACKS_FLAG_REGEX = /(?:^|\s)--(?:tracks|agents)\s+([234])\b/i;

// Guard G1: Pure operational, Git, test runner, sync, memory commands, or direct execution confirmation of an approved plan
const OPS_GUARD_PATTERNS = [
  /^\/(?:memory-sync|take-note|review-notes|next-step|validate-plugins|focus-audit|plugin-analytics|telemetry-export)\b/i,
  /^(?:git\s+(?:status|add|commit|diff|log|push|pull|branch|checkout|worktree)|npm\s+(?:test|run\s+sync|run\s+validate)|node\s+(?:--test|scripts\/validate\.mjs))\b/i,
  /^(?:fai\s+(?:il\s+)?commit|esegui\s+i\s+test|lancia\s+i\s+test|sincronizza\s+i\s+plugin|aggiorna\s+i\s+plugin\w*|aggiorna\s+la\s+memoria|start\s+server)\s*[.!]?$/i,
  /^(?:fallo|procedi|ok\s+procedi|vai(?:\s+pure)?|esegui(?:\s+il\s+piano)?|applica(?:\s+il\s+piano)?|implementa\s+il\s+piano|s[iì]\s+procedi)\s*[.!]?$/i
];

// Guard G2a: Pure read-only / inspection questions at the start of the prompt
const READONLY_START_PATTERNS = [
  /^\/how-its-made\b/i,
  /^(?:spiega(?:mi)?|mostra(?:mi)?|leggi|dove\s+si\s+trova|cosa\s+fa|come\s+funziona|come\s+mai|perch[eé]\s+(?:c'[eè]|non|la|il|lo|i|gli|le)|non\s+(?:comprendo|capisco)|a\s+che\s+punto\s+siamo|qual\s+[eè]|quali\s+sono|elenca|mi\s+dai|define|ha\s+un\s+nome|explain|where\s+is|show\s+me|what\s+does|why\s+is)\b/i
];

// Guard G2b: Hard read-only override anywhere in prompt (e.g. "non agire è solo una domanda")
const READONLY_OVERRIDE_PATTERNS = [
  /\b(?:non\s+agire|[eè]\s+solo\s+una?\s+domanda|solo\s+una?\s+domanda|non\s+modificare\s+nulla|non\s+toccare\s+(?:il\s+)?codice|senza\s+modificare\s+nulla)\b/i
];

// Guard G3: Surgical single-choice micro-edits (typo, rename, single constant/color/padding tweak)
const MICRO_EDIT_PATTERNS = [
  /\b(?:correggi\s+(?:il\s+)?(?:typo|refuso)|fix\s+typo|rinomina|rename|cambia\s+il\s+(?:colore|testo|padding|margine|titolo|numero|valore)|tieni\s+la\s+camera\s+pi[uù]\s+(?:lontana|vicina|alta|bassa)|avvicina\s+la\s+camera|allontana\s+la\s+camera|aggiorna\s+la\s+versione|bump\s+version|fix\s+(?:lint|import))\b/i
];

// Signals that indicate genuine design, architectural, or multi-perspective trade-offs (overrides G2a/G3)
const DESIGN_INTENT_PATTERNS = [
  /\b(?:fai\s+un\s+piano|progetta(?:re)?|architettura|nuova\s+funzionalit[aà]|nuovo\s+(?:plugin|modulo|sistema|flusso|metodo|percorso)|rifattorizza(?:re)?|refactor|migliora(?:re|menti)?|modalit[aà]\s+auto|sistema\s+per\s+filtrare|bivio|compromesso|trade[- ]?off|auto[- ]?apprendimento|struttura(?:re)?|imposta(?:re)?|organizza(?:re)?|decidere\s+come|bilancia(?:re)?)\b/i
];

// Additive Scoring Dimension 1 (+2 pt): Structural design, planning, architecture, methodology, or system organization
const TENSION_ARCH_PATTERNS = [
  /\b(?:piano|progetta(?:re|zione)?|architettur\w+|funzionalit[aà]|feature|rifattorizz\w+|refactor\w*|miglior\w+|ottimizz\w+|motore|headless|core|algoritm\w+|struttur\w+|organizz\w+|impost\w+|metodolog\w+|percors\w+|programm\w+|protocollo|multi[- ]?file|plugin|orchestraz\w+|modalit[aà]\s+auto|auto[- ]?apprendimento)\b/i
];

// Additive Scoring Dimension 2 (+2 pt): Human experience, usability, ergonomics, learning, or stakeholder perspectives
const TENSION_UX_PATTERNS = [
  /\b(?:utente|ux|ui|interfaccia|flusso|click|fatica|passaggi|pulsant\w+|botton\w+|form|modulo|dashboard|vista|mobile|360px|responsive|ergonomi\w+|semplicit[aà]|comodo|automatic\w+|preferenz\w+|feedback|inquadratur\w+|regia|replay\s+3d|prospettiv\w+|punto\s+di\s+vista|stakeholder|ruol\w+|domini\w*|apprendiment\w+|didattic\w+|chiarezz\w+|comprensi\w+|fruibilit[aà]|esperienz\w+)\b/i
];

// Additive Scoring Dimension 3 (+2 pt): Constraints, safety, edge cases, risk, dirty inputs, or multi-symptom regressions
const TENSION_EDGE_PATTERNS = [
  /\b(?:input|parsing|parser|validaz\w+|format\w+|casi\s+limite|edge\s+case|error\w+|fallback|cache|concorrenz\w+|race\s+condition|deterministic\w+|a\s+priori|sogli\w+|filtr\w+|ricerca|tolleranz\w+|sicurezz\w+|rischi\w*|vincol\w+|limiti|critic\w+|affidabilit[aà]|avviene\s+ancora|sparisc\w+|inchiodat\w+|scalin\w+|rollio|smoothing|frustum|jitter)\b/i
];

// Additive Scoring Dimension 4 (+1 pt): Open-ended exploration / multiple degrees of freedom / trade-off arbitration
const TENSION_OPEN_PATTERNS = [
  /\b(?:c'[eè]\s+qualche\s+modo|come\s+(?:possiamo|facciamo|conviene)|conviene|dove\s+conviene|meglio|alternativ\w+|strategi\w+|approcci\w+|opzion\w+|valuta(?:re|zione)?|confront\w+|competere|collaborare|bilanci\w+|compromess\w+|trade[- ]?off|pro\s+e\s+contro|vantaggi\s+e\s+svantaggi|criteri\w*|priorit[aà])\b/i
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
    .replace(/(?:^|\s)--(?:tracks|agents)\s+[234]\b/gi, ' ')
    .replace(/(?:^|\s)--(?:force|skip|fast|always|mediator|no-mediator|proto|implicit)\b/gi, ' ')
    .replace(/(?:^|\s)-(?:f|m)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ranks LLM-discovered candidate domains by importance and dialectical tension,
 * deduplicates overlapping perspectives, and enforces the hard [2..4] agent cap.
 *
 * @param {Array<{ id?: string, role: string, importance?: number, tension?: number, mandate?: string, oracle?: string, skills?: string[] }>} candidateDomains
 * @param {{ maxTracks?: number, minTracks?: number }} [options]
 * @returns {{
 *   trackCount: number,
 *   trackMode: 'FAST-PASS' | 'DUAL-TRACK' | 'TRI-TRACK' | 'QUAD-TRACK',
 *   selectedDomains: Array<{ trackId: string, rank: number, role: string, importance: number, tension: number, priorityScore: number, mandate: string, oracle: string, skills: string[] }>,
 *   droppedDomains: Array<{ role: string, priorityScore: number }>
 * }}
 */
export function rankAndCapDomains(candidateDomains, options = {}) {
  const rawList = Array.isArray(candidateDomains) ? candidateDomains : [];
  const cap = Math.min(MAX_TRACKS, Math.max(MIN_TRACKS, Number(options.maxTracks) || MAX_TRACKS));

  const seenRoles = new Set();
  const normalized = [];

  for (const item of rawList) {
    if (!item || typeof item.role !== 'string' || !item.role.trim()) continue;
    const cleanRole = item.role.trim();
    const roleKey = (item.id || cleanRole).toLowerCase();
    if (seenRoles.has(roleKey)) continue;
    seenRoles.add(roleKey);

    const importance = Number.isFinite(Number(item.importance)) ? Number(item.importance) : 5;
    const tension = Number.isFinite(Number(item.tension)) ? Number(item.tension) : 5;
    const priorityScore = importance * 2 + tension;

    normalized.push({
      role: cleanRole,
      importance,
      tension,
      priorityScore,
      mandate: typeof item.mandate === 'string' ? item.mandate.trim() : '',
      oracle: typeof item.oracle === 'string' ? item.oracle.trim() : '',
      skills: Array.isArray(item.skills) ? item.skills.slice(0, 2) : []
    });
  }

  normalized.sort((a, b) => b.priorityScore - a.priorityScore);

  const selected = normalized.slice(0, cap).map((d, idx) => ({
    trackId: TRACK_SLOTS[idx] || `Track-${idx + 1}`,
    rank: idx + 1,
    ...d
  }));

  const dropped = normalized.slice(cap).map((d) => ({
    role: d.role,
    priorityScore: d.priorityScore
  }));

  const trackCount = selected.length;
  const trackMode =
    trackCount < MIN_TRACKS
      ? 'FAST-PASS'
      : trackCount === 4
        ? 'QUAD-TRACK'
        : trackCount === 3
          ? 'TRI-TRACK'
          : 'DUAL-TRACK';

  return {
    trackCount,
    trackMode,
    selectedDomains: selected,
    droppedDomains: dropped
  };
}

/**
 * Classifies a prompt in O(1) to decide between FAST-PASS (0 subagents) and Multi-Track Skizzo (2..4 LLM-selected subagents).
 * @param {unknown} rawPrompt
 * @param {{ force?: boolean, fast?: boolean, skip?: boolean, mediator?: boolean, always?: boolean, stickySessionActive?: boolean, tracks?: number }} [options]
 */
export function classifySkizzoTask(rawPrompt, options = {}) {
  const safeRaw = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  const cleanText = normalizePromptText(safeRaw);

  const flagTracksMatch = safeRaw.match(TRACKS_FLAG_REGEX);
  const requestedTracks =
    options.tracks && [2, 3, 4].includes(Number(options.tracks))
      ? Number(options.tracks)
      : flagTracksMatch
        ? Number(flagTracksMatch[1])
        : null;

  const hasExplicitCommand = /(?:^|\s)\/skizzo\b/i.test(safeRaw);
  const isForced = Boolean(options.force || options.always || requestedTracks) || FORCE_PATTERNS.some((rx) => rx.test(safeRaw));
  const explicitTrigger = hasExplicitCommand || isForced;
  const stickySessionActive = options.stickySessionActive !== undefined ? Boolean(options.stickySessionActive) : explicitTrigger;
  const isImplicitMode = !explicitTrigger && !stickySessionActive;
  const threshold = isImplicitMode ? 4 : 3;

  const hasMediator = Boolean(options.mediator) || MEDIATOR_PATTERNS.some((rx) => rx.test(safeRaw));
  const activeRoute = hasMediator ? 'DUAL-TRACK+MEDIATOR' : 'DUAL-TRACK';
  const activeTrackMode =
    requestedTracks === 4
      ? 'QUAD-TRACK'
      : requestedTracks === 3
        ? 'TRI-TRACK'
        : requestedTracks === 2
          ? 'DUAL-TRACK'
          : 'MULTI-TRACK';

  const fastPassBounds = {
    trackMode: /** @type {'FAST-PASS'} */ ('FAST-PASS'),
    minTracks: 0,
    maxTracks: 0,
    requestedTracks: null,
    personaSelection: /** @type {'NONE'} */ ('NONE')
  };

  const activeBounds = {
    trackMode: /** @type {'DUAL-TRACK' | 'TRI-TRACK' | 'QUAD-TRACK' | 'MULTI-TRACK'} */ (activeTrackMode),
    minTracks: requestedTracks || MIN_TRACKS,
    maxTracks: requestedTracks || MAX_TRACKS,
    requestedTracks,
    personaSelection: /** @type {'LLM_DYNAMIC_RANKED'} */ ('LLM_DYNAMIC_RANKED')
  };

  // 0. Empty or whitespace-only input -> safe FAST-PASS
  if (!cleanText) {
    return {
      ...fastPassBounds,
      route: 'FAST-PASS',
      score: 0,
      threshold,
      reason: 'messaggio vuoto o solo comando di stato',
      signals: ['empty_input'],
      explicitTrigger,
      silentFastPass: isImplicitMode,
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  // 1. Explicit user overrides (--force / --always / --tracks N vs --skip / --fast)
  const isSkipped = Boolean(options.fast || options.skip) || SKIP_PATTERNS.some((rx) => rx.test(safeRaw));
  if (isForced && !isSkipped) {
    return {
      ...activeBounds,
      route: activeRoute,
      score: 99,
      threshold,
      reason: 'forzatura esplicita richiesta dall\'utente (--force / --tracks)',
      signals: ['manual_force'],
      explicitTrigger: true,
      silentFastPass: false,
      keepStickyOn: true,
      estimatedSavedSeconds: 0
    };
  }

  if (isSkipped) {
    return {
      ...fastPassBounds,
      route: 'FAST-PASS',
      score: -50,
      threshold,
      reason: 'risposta rapida richiesta dall\'utente (--skip)',
      signals: ['manual_skip'],
      explicitTrigger,
      silentFastPass: isImplicitMode,
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  // 2. Hard Read-Only Override anywhere in the prompt (e.g. "non agire è solo una domanda")
  if (READONLY_OVERRIDE_PATTERNS.some((rx) => rx.test(cleanText))) {
    return {
      ...fastPassBounds,
      route: 'FAST-PASS',
      score: -60,
      threshold,
      reason: 'clausola esplicita di sola lettura (non agire / solo una domanda)',
      signals: ['guard_readonly', 'readonly_override_clause'],
      explicitTrigger,
      silentFastPass: isImplicitMode,
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  // 3. Hard-Bypass Guards (G1, G2a, G3) when no structural design intent is present
  const hasDesignIntent = DESIGN_INTENT_PATTERNS.some((rx) => rx.test(cleanText));

  if (OPS_GUARD_PATTERNS.some((rx) => rx.test(cleanText))) {
    return {
      ...fastPassBounds,
      route: 'FAST-PASS',
      score: -99,
      threshold,
      reason: 'comando operativo o esecuzione diretta di piano già approvato',
      signals: ['guard_ops_or_plan_exec'],
      explicitTrigger,
      silentFastPass: isImplicitMode,
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  if (!hasDesignIntent && READONLY_START_PATTERNS.some((rx) => rx.test(cleanText))) {
    return {
      ...fastPassBounds,
      route: 'FAST-PASS',
      score: -40,
      threshold,
      reason: 'domanda informativa o ispezione di sola lettura',
      signals: ['guard_readonly'],
      explicitTrigger,
      silentFastPass: isImplicitMode,
      estimatedSavedSeconds: 110,
      keepStickyOn: true
    };
  }

  if (!hasDesignIntent && MICRO_EDIT_PATTERNS.some((rx) => rx.test(cleanText))) {
    return {
      ...fastPassBounds,
      route: 'FAST-PASS',
      score: 1,
      threshold,
      reason: 'modifica puntuale a scelta unica senza bivi progettuali',
      signals: ['guard_micro_edit'],
      explicitTrigger,
      silentFastPass: isImplicitMode,
      keepStickyOn: true,
      estimatedSavedSeconds: 110
    };
  }

  // 4. Additive Dialectical Tension Scoring (0..7 points)
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

  if (score >= threshold) {
    const finalRoute = score >= 5 && hasMediator ? 'DUAL-TRACK+MEDIATOR' : activeRoute;
    return {
      ...activeBounds,
      route: finalRoute,
      score,
      threshold,
      reason: 'scelta multi-prospettiva con domini in tensione (selezione e ranking ruoli 2..4 delegati all\'LLM)',
      signals,
      explicitTrigger,
      silentFastPass: false,
      keepStickyOn: true,
      estimatedSavedSeconds: 0
    };
  }

  return {
    ...fastPassBounds,
    route: 'FAST-PASS',
    score,
    threshold,
    reason: 'richiesta diretta senza conflitti multi-dominio',
    signals: signals.length ? signals : ['low_tension_direct'],
    explicitTrigger,
    silentFastPass: isImplicitMode,
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
  const stickySessionActive = args.includes('--sticky');
  const promptArg = args
    .filter((a) => !['--force', '-f', '--skip', '--fast', '--mediator', '-m', '--sticky'].includes(a))
    .join(' ');
  const result = classifySkizzoTask(promptArg, { force, skip, mediator, stickySessionActive });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

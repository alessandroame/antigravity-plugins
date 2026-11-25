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

import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_TRACKS = 4;
const MIN_TRACKS = 2;
const TRACK_SLOTS = ['Alpha', 'Beta', 'Delta', 'Epsilon'];

const FORCE_PATTERNS = [
  /(?:^|\s)--force(?:\s|$)/i,
  /\b(?:forza\s+skizzo|usa\s+skizzo|con\s+skizzo\s+completo|dual[- ]track\s+forzato)\b/i
];
const FORCE_SHORT_FLAG_REGEX = /(?:^|\s)-f(?:\s|$)/i;

const SKIP_PATTERNS = [
  /(?:^|\s)--(?:skip|fast)(?:\s|$)/i,
  /\b(?:senza\s+skizzo|salta\s+skizzo|risposta\s+veloce|vai\s+veloce|fast[- ]pass)\b/i
];

// Guard G0: Explicit deactivation commands that turn sticky Skizzo OFF
const STOP_PATTERNS = [
  /^\s*\/skizzo\s+(?:--)?(?:stop|off)(?:\s+(?:adesso|ora|grazie|per\s+favore))?\s*[.!]?$/i,
  /^\s*(?:ok\s+|va\s+bene\s+)?(?:stop|ferma|disattiva|spegni)\s+skizzo(?:\s+(?:adesso|ora|grazie|per\s+favore))?\s*[.!]?$/i
];

const MEDIATOR_PATTERNS = [
  /(?:^|\s)--mediator(?:\s|$)/i
];
const MEDIATOR_SHORT_FLAG_REGEX = /(?:^|\s)-m(?:\s|$)/i;

const LOG_AND_TRACE_LINE_PATTERNS = [
  /^\s*at\s+(?:async\s+)?(?:.+\([^)]*(?::\d+(?::\d+)?|<anonymous>|native)\)|.+:\d+(?::\d+)?|\S+\s+\((?:<anonymous>|native)\))\s*$/i,
  /^\s*[\w.$<>[\]-]*@(?:https?:\/\/|file:\/\/|[\w./\\-]+):\d+(?::\d+)?\s*$/i,
  /^\s*(?:\[?(?:\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?|\d{2}:\d{2}:\d{2}(?:\.\d+)?)\]?\s*)?(?:\[[^\]]+\]\s*)*(?:[\w./\\-]+\.(?:m?js|tsx?|jsx?|cjs|css|html|json|py|go|rs|java|rb|php)(?:\?[^\s:]*)?|VM\d+):\d+(?::\d+)?(?:\s|$).*$/i,
  /^\s*(?:Uncaught\s+(?:\([^)]+\)\s+)?)?(?:TypeError|ReferenceError|SyntaxError|RangeError|Error|EvalError|URIError|AggregateError|AssertionError|DOMException|UnhandledPromiseRejection(?:Warning)?)\s*:.*$/i,
  /^\s*(?:\[(?:ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|LOG|FATAL|VERBOSE|hmr|vite|webpack|i18n)\]|(?:ERROR|WARN(?:ING)?|FATAL|TRACE)\s*:|console\.(?:log|warn|error|info|debug)\b|\(node:\d+\)\s+|Failed to load resource:).*$/i,
  /^\s*(?:(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+https?:\/\/\S+.*|Traceback \(most recent call last\):.*|File "[^"]+", line \d+.*|Caused by:\s+.*|\.\.\.\s+\d+\s+more\s*|\d+\s*\|\s*.*|\^+)$/i
];

const TRACKS_FLAG_REGEX = /(?:^|\s)--(?:tracks|agents)\s+(\d+)\b/i;
const NATURAL_TRACKS_REGEX = /\b(?:con|usa|forza|lancia)\s+([234])\s+(?:agenti|subagent\w*|domini)\b/i;

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
  /\b(?:correggi\s+(?:il\s+)?(?:typo|refuso)|fix\s+typo|rinomina|rename|cambia\s+il\s+(?:colore|testo|padding|margine|titolo|numero|valore)|aggiorna\s+la\s+versione|bump\s+version|fix\s+(?:lint|import))\b/i
];

// Signals that indicate genuine design, architectural, or multi-perspective trade-offs (overrides G3, and G2a only with imperative/creation intent)
const DESIGN_INTENT_PATTERNS = [
  /\b(?:fai\s+un\s+piano|progetta(?:re)?|architettura|nuova\s+funzionalit[aà]|nuovo\s+(?:plugin|modulo|sistema|flusso|metodo|percorso)|rifattorizza(?:re)?|refactor|migliora(?:re|menti)?|modalit[aà]\s+auto|sistema\s+per\s+filtrare|bivio|compromesso|trade[- ]?off|auto[- ]?apprendimento|struttura(?:re)?|imposta(?:re)?|organizza(?:re)?|decidere\s+come|bilancia(?:re)?)\b/i
];

// Imperative/creation intent required before DESIGN_INTENT_PATTERNS overrides READONLY_START_PATTERNS
const IMPERATIVE_DESIGN_INTENT_PATTERNS = [
  /\b(?:fai\s+un\s+piano|progetta|progettiamo|implementa|implementiamo|crea|creiamo|costruisci|costruiamo|ridisegna|ridisegniamo|rifattorizza|rifattorizziamo|refactorizza|fai\s+(?:il\s+)?refactor|imposta|impostiamo|organizza|organizziamo|strutturiamo|bilanciamo|dobbiamo\s+(?:progettare|rifattorizzare|strutturare|decidere|implementare|creare)|(?:vorrei|voglio)\s+(?:progettare|implementare|creare|migliorare|rifattorizzare))\b/i
];

// Additive Scoring Dimension 1 (+2 pt): Structural design, planning, architecture, methodology, or system organization
const TENSION_ARCH_PATTERNS = [
  /\b(?:piano|progetta(?:re|zione)?|architettur\w+|funzionalit[aà]|feature|rifattorizz\w+|refactor\w*|miglior\w+|ottimizz\w+|motore|headless|core|algoritm\w+|struttur\w+|organizz\w+|impost\w+|metodolog\w+|percors\w+|programm\w+|protocollo|multi[- ]?file|plugin|orchestraz\w+|modalit[aà]\s+auto|auto[- ]?apprendimento)\b/i
];

// Additive Scoring Dimension 2 (+2 pt): Human experience, usability, ergonomics, learning, or stakeholder perspectives
const TENSION_UX_PATTERNS = [
  /\b(?:utente|ux|ui|interfaccia|flusso|click|fatica|passaggi|pulsant\w+|botton\w+|form|modulo|dashboard|vista|mobile|360px|responsive|ergonomi\w+|semplicit[aà]|comodo|automatic\w+|preferenz\w+|feedback|prospettiv\w+|punto\s+di\s+vista|stakeholder|ruol\w+|domini\w*|apprendiment\w+|didattic\w+|chiarezz\w+|comprensi\w+|fruibilit[aà]|esperienz\w+)\b/i
];

// Additive Scoring Dimension 3 (+2 pt): Constraints, safety, edge cases, risk, dirty inputs, or multi-symptom regressions
const TENSION_EDGE_PATTERNS = [
  /\b(?:input|parsing|parser|validaz\w+|format\w+|casi\s+limite|edge\s+case|error\w+|fallback|cache|concorrenz\w+|race\s+condition|deterministic\w+|a\s+priori|sogli\w+|filtr\w+|ricerca|tolleranz\w+|sicurezz\w+|rischi\w*|vincol\w+|limiti|critic\w+|affidabilit[aà]|regression\w+|latenza|avviene\s+ancora|non\s+funziona\s+ancora|stesso\s+errore)\b/i
];

// Additive Scoring Dimension 4 (+1 pt): Open-ended exploration / multiple degrees of freedom / trade-off arbitration
const TENSION_OPEN_PATTERNS = [
  /\b(?:c'[eè]\s+qualche\s+modo|come\s+(?:possiamo|facciamo|conviene)|conviene|dove\s+conviene|meglio|alternativ\w+|strategi\w+|approcci\w+|opzion\w+|valuta(?:re|zione)?|confront\w+|competere|collaborare|bilanci\w+|compromess\w+|trade[- ]?off|pro\s+e\s+contro|vantaggi\s+e\s+svantaggi|criteri\w*|priorit[aà])\b/i
];

/**
 * Parses a numeric metric in [0..10], returning `defaultVal` when null, undefined, boolean, empty string, or NaN.
 * @param {unknown} val
 * @param {number} [defaultVal=5]
 * @returns {number}
 */
function clampMetric(val, defaultVal = 5) {
  if (val === null || val === undefined || typeof val === 'boolean') return defaultVal;
  if (typeof val === 'string' && val.trim() === '') return defaultVal;
  const num = Number(val);
  if (!Number.isFinite(num)) return defaultVal;
  return Math.min(10, Math.max(0, num));
}

/**
 * Clamps a requested track count into [MIN_TRACKS..MAX_TRACKS], or returns null if invalid/non-positive.
 * @param {unknown} rawTracks
 * @returns {2 | 3 | 4 | null}
 */
function parseRequestedTracks(rawTracks) {
  if (rawTracks === null || rawTracks === undefined || typeof rawTracks === 'boolean' || rawTracks === '') {
    return null;
  }
  const num = Number(rawTracks);
  if (!Number.isFinite(num) || num <= 0) return null;
  return /** @type {2 | 3 | 4} */ (Math.min(MAX_TRACKS, Math.max(MIN_TRACKS, Math.round(num))));
}

/**
 * Strips fenced code blocks and pasted console/stack-trace lines from a prompt
 * so pasted logs or snippets do not inflate tension scores or file mention counts.
 * @param {unknown} rawText
 * @returns {string}
 */
export function stripFencedCodeAndLogs(rawText) {
  if (typeof rawText !== 'string') return '';
  const withoutInlineFences = rawText.replace(/(```|~~~)[^\n]*?\1/g, ' ');
  const lines = withoutInlineFences.split(/\r?\n/);
  const kept = [];
  let activeFence = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!activeFence) {
        activeFence = marker;
      } else if (activeFence === marker) {
        activeFence = null;
      }
      continue;
    }
    if (activeFence) continue;
    if (LOG_AND_TRACE_LINE_PATTERNS.some((rx) => rx.test(line))) continue;
    kept.push(line);
  }

  return kept.join('\n').trim();
}

/**
 * Strips inline backticked and quoted spans for CLI flag inspection while
 * preserving Italian apostrophes (e.g. `c'è`, `l'app`, `sull'app`).
 * @param {unknown} text
 * @returns {string}
 */
export function stripQuotedAndBackticked(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/`+[^`\n]*`+/g, ' ')
    .replace(/"(?:\\.|[^"\\\n])*"/g, ' ')
    .replace(/(^|[\s(\[{:=])'(?:\\.|[^'\\\n])*?'(?=$|[\s.,;:!?)\]}])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts leading `/skizzo` and contiguous leading CLI flag tokens so short
 * flags (`-f`, `-m`) are only honored in command-head position.
 * @param {unknown} text
 * @returns {string}
 */
export function extractCommandHead(text) {
  if (typeof text !== 'string') return '';
  const trimmed = text.trimStart();
  if (!trimmed) return '';
  const tokens = trimmed.split(/\s+/);
  const headTokens = [];
  let i = 0;

  if (tokens[0] && /^\/skizzo$/i.test(tokens[0])) {
    headTokens.push(tokens[0]);
    i = 1;
  }

  while (i < tokens.length) {
    const tok = tokens[i];
    if (/^--(?:tracks|agents)$/i.test(tok) && tokens[i + 1] && /^\d+$/.test(tokens[i + 1])) {
      headTokens.push(tok, tokens[i + 1]);
      i += 2;
      continue;
    }
    if (/^(?:--[a-z][a-z-]*|-[fm])$/i.test(tok)) {
      headTokens.push(tok);
      i += 1;
      continue;
    }
    break;
  }

  return headTokens.join(' ');
}

/**
 * Counts unique file mentions (`@path/file.ext` or `file.ext`) via Set so
 * repeated mentions of the same file do not trigger multi-file scope inflation.
 * @param {unknown} text
 * @returns {number}
 */
export function countUniqueFileMentions(text) {
  if (typeof text !== 'string') return 0;
  const matches = text.match(/@[\w./-]+|\b[\w-]+\.(?:mjs|js|ts|md|json|html|css)\b/g) || [];
  const unique = new Set(matches.map((token) => token.replace(/^@/, '').toLowerCase()));
  return unique.size;
}

/**
 * Normalizes a raw prompt string by stripping leading `/skizzo` command tokens and flags.
 * @param {unknown} rawPrompt
 * @returns {string}
 */
export function normalizePromptText(rawPrompt) {
  if (typeof rawPrompt !== 'string') return '';
  return rawPrompt
    .replace(/^\s*\/skizzo\b/i, '')
    .replace(/(?:^|\s)--(?:tracks|agents)\s+\d+\b/gi, ' ')
    .replace(/(?:^|\s)--(?:force|skip|fast|always|mediator|no-mediator|proto|implicit|sticky)\b/gi, ' ')
    .replace(/(?:^|\s)-(?:f|m)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ranks LLM-discovered candidate domains by importance and dialectical tension,
 * deduplicates overlapping perspectives keeping the highest-scoring entry,
 * and enforces the hard [2..4] agent cap.
 *
 * @param {Array<{ id?: unknown, role: string, importance?: unknown, tension?: unknown, mandate?: string, oracle?: string, skills?: string[] }>} candidateDomains
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
  const minT =
    options.minTracks !== undefined && Number.isFinite(Number(options.minTracks))
      ? Math.min(MAX_TRACKS, Math.max(MIN_TRACKS, Math.round(Number(options.minTracks))))
      : MIN_TRACKS;
  const maxT =
    options.maxTracks !== undefined && Number.isFinite(Number(options.maxTracks))
      ? Math.min(MAX_TRACKS, Math.max(minT, Math.round(Number(options.maxTracks))))
      : MAX_TRACKS;

  const scored = [];

  for (const item of rawList) {
    if (!item || typeof item.role !== 'string' || !item.role.trim()) continue;
    const cleanRole = item.role.trim();
    const idKey =
      item.id !== null && item.id !== undefined && String(item.id).trim() !== ''
        ? String(item.id).trim().toLowerCase()
        : null;
    const roleKey = cleanRole.toLowerCase();

    const importance = clampMetric(item.importance, 5);
    const tension = clampMetric(item.tension, 5);
    const priorityScore = importance * 2 + tension;

    scored.push({
      idKey,
      roleKey,
      role: cleanRole,
      importance,
      tension,
      priorityScore,
      mandate: typeof item.mandate === 'string' ? item.mandate.trim() : '',
      oracle: typeof item.oracle === 'string' ? item.oracle.trim() : '',
      skills: Array.isArray(item.skills) ? item.skills.slice(0, 2) : []
    });
  }

  // Sort by priorityScore descending BEFORE deduplication so the highest-scoring duplicate always wins
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const seenIds = new Set();
  const seenRoles = new Set();
  const deduplicated = [];

  for (const entry of scored) {
    if (seenRoles.has(entry.roleKey) || (entry.idKey && seenIds.has(entry.idKey))) {
      continue;
    }
    seenRoles.add(entry.roleKey);
    if (entry.idKey) seenIds.add(entry.idKey);
    const { idKey: _idKey, roleKey: _roleKey, ...cleanEntry } = entry;
    deduplicated.push(cleanEntry);
  }

  const selected = deduplicated.slice(0, maxT).map((d, idx) => ({
    trackId: TRACK_SLOTS[idx] || `Track-${idx + 1}`,
    rank: idx + 1,
    ...d
  }));

  const dropped = deduplicated.slice(maxT).map((d) => ({
    role: d.role,
    priorityScore: d.priorityScore
  }));

  const trackCount = selected.length;
  const trackMode =
    trackCount < minT
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
  const intentSurface = stripFencedCodeAndLogs(safeRaw);
  const flagSurface = stripQuotedAndBackticked(intentSurface);
  const commandHead = extractCommandHead(flagSurface);
  const cleanText = normalizePromptText(intentSurface);

  const flagTracksMatch = flagSurface.match(TRACKS_FLAG_REGEX) || flagSurface.match(NATURAL_TRACKS_REGEX);
  const requestedTracks =
    parseRequestedTracks(options.tracks) ??
    (flagTracksMatch ? parseRequestedTracks(flagTracksMatch[1]) : null);

  const hasExplicitCommand = /(?:^|\s)\/skizzo\b/i.test(flagSurface);
  const isForced =
    Boolean(options.force || options.always || requestedTracks) ||
    FORCE_PATTERNS.some((rx) => rx.test(flagSurface)) ||
    FORCE_SHORT_FLAG_REGEX.test(commandHead);
  const explicitTrigger = hasExplicitCommand || isForced;
  const stickySessionActive =
    options.stickySessionActive !== undefined ? Boolean(options.stickySessionActive) : explicitTrigger;
  const isImplicitMode = !explicitTrigger && !stickySessionActive;
  const threshold = isImplicitMode ? 4 : 3;

  const hasMediator =
    Boolean(options.mediator) ||
    MEDIATOR_PATTERNS.some((rx) => rx.test(flagSurface)) ||
    MEDIATOR_SHORT_FLAG_REGEX.test(commandHead);
  const activeRoute = hasMediator ? 'DUAL-TRACK+MEDIATOR' : 'DUAL-TRACK';
  const activeTrackMode =
    requestedTracks === 4
      ? 'QUAD-TRACK'
      : requestedTracks === 3
        ? 'TRI-TRACK'
        : requestedTracks === 2
          ? 'DUAL-TRACK'
          : 'MULTI-TRACK';

  /**
   * Builds a canonical 14-key FAST-PASS result object preserving JS-API backward compatibility.
   * @param {{ score: number, reason: string, signals: string[], silentFastPass?: boolean, keepStickyOn?: boolean, extra?: object }} fields
   */
  const buildFastPassResult = ({
    score,
    reason,
    signals,
    silentFastPass = isImplicitMode,
    keepStickyOn = true,
    extra = {}
  }) => ({
    trackMode: /** @type {'FAST-PASS'} */ ('FAST-PASS'),
    minTracks: 0,
    maxTracks: 0,
    requestedTracks: null,
    personaSelection: /** @type {'NONE'} */ ('NONE'),
    route: 'FAST-PASS',
    score,
    threshold,
    ...extra,
    reason,
    signals,
    explicitTrigger,
    silentFastPass,
    keepStickyOn,
    estimatedSavedSeconds: 110
  });

  const activeBounds = {
    trackMode: /** @type {'DUAL-TRACK' | 'TRI-TRACK' | 'QUAD-TRACK' | 'MULTI-TRACK'} */ (activeTrackMode),
    minTracks: requestedTracks || MIN_TRACKS,
    maxTracks: requestedTracks || MAX_TRACKS,
    requestedTracks,
    personaSelection: /** @type {'LLM_DYNAMIC_RANKED'} */ ('LLM_DYNAMIC_RANKED')
  };

  // 0a. Explicit stop/off command -> turn sticky Skizzo OFF cleanly
  if (STOP_PATTERNS.some((rx) => rx.test(safeRaw))) {
    return buildFastPassResult({
      score: -100,
      reason: 'disattivazione esplicita della modalità skizzo (/skizzo stop)',
      signals: ['guard_stop'],
      silentFastPass: true,
      keepStickyOn: false
    });
  }

  // 0b. Empty or whitespace-only input -> safe FAST-PASS
  if (!cleanText) {
    return buildFastPassResult({
      score: 0,
      reason: 'messaggio vuoto o solo comando di stato',
      signals: ['empty_input']
    });
  }

  // 1. Explicit user overrides (--force / --always / --tracks N vs --skip / --fast)
  const isSkipped = Boolean(options.fast || options.skip) || SKIP_PATTERNS.some((rx) => rx.test(flagSurface));
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
    return buildFastPassResult({
      score: -50,
      reason: 'risposta rapida richiesta dall\'utente (--skip)',
      signals: ['manual_skip']
    });
  }

  // 2. Hard Read-Only Override anywhere in the prompt (e.g. "non agire è solo una domanda")
  if (READONLY_OVERRIDE_PATTERNS.some((rx) => rx.test(cleanText))) {
    return buildFastPassResult({
      score: -60,
      reason: 'clausola esplicita di sola lettura (non agire / solo una domanda)',
      signals: ['guard_readonly', 'readonly_override_clause']
    });
  }

  // 3. Hard-Bypass Guards (G1, G2a, G3) when no structural design intent is present
  const hasDesignIntent = DESIGN_INTENT_PATTERNS.some((rx) => rx.test(cleanText));
  const hasImperativeDesignIntent =
    hasDesignIntent && IMPERATIVE_DESIGN_INTENT_PATTERNS.some((rx) => rx.test(cleanText));

  if (OPS_GUARD_PATTERNS.some((rx) => rx.test(cleanText))) {
    return buildFastPassResult({
      score: -99,
      reason: 'comando operativo o esecuzione diretta di piano già approvato',
      signals: ['guard_ops_or_plan_exec']
    });
  }

  if (!hasImperativeDesignIntent && READONLY_START_PATTERNS.some((rx) => rx.test(cleanText))) {
    return buildFastPassResult({
      score: -40,
      reason: 'domanda informativa o ispezione di sola lettura',
      signals: ['guard_readonly']
    });
  }

  if (!hasDesignIntent && MICRO_EDIT_PATTERNS.some((rx) => rx.test(cleanText))) {
    return buildFastPassResult({
      score: 1,
      reason: 'modifica puntuale a scelta unica senza bivi progettuali',
      signals: ['guard_micro_edit']
    });
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

  // Multi-file or complex scope boost (deduplicated unique files only)
  const fileMentions = countUniqueFileMentions(cleanText);
  if (fileMentions >= 3 && score < 3) {
    score += 2;
    signals.push('multi_file_scope');
  }

  if (score >= threshold) {
    return {
      ...activeBounds,
      route: activeRoute,
      score,
      threshold,
      uniqueFileMentions: fileMentions,
      reason: 'scelta multi-prospettiva con domini in tensione (selezione e ranking ruoli 2..4 delegati all\'LLM)',
      signals,
      explicitTrigger,
      silentFastPass: false,
      keepStickyOn: true,
      estimatedSavedSeconds: 0
    };
  }

  return buildFastPassResult({
    score,
    reason: 'richiesta diretta senza conflitti multi-dominio',
    signals: signals.length ? signals : ['low_tension_direct'],
    extra: { uniqueFileMentions: fileMentions }
  });
}

/**
 * Projects a full triage result into a compact single-line CLI payload
 * (`<= 6` keys on normal FAST-PASS, `7` when `keepStickyOn === false`, `8` on active routes).
 * @param {ReturnType<typeof classifySkizzoTask>} result
 */
export function formatCliResult(result) {
  if (result.route === 'FAST-PASS') {
    return {
      route: result.route,
      trackMode: result.trackMode,
      score: result.score,
      threshold: result.threshold,
      silentFastPass: result.silentFastPass,
      signals: result.signals,
      ...(result.keepStickyOn === false ? { keepStickyOn: false } : {})
    };
  }
  return {
    route: result.route,
    trackMode: result.trackMode,
    score: result.score,
    threshold: result.threshold,
    signals: result.signals,
    requestedTracks: result.requestedTracks,
    minTracks: result.minTracks,
    maxTracks: result.maxTracks
  };
}

// CLI entrypoint for quick inspection: node plugins/skizzo/scripts/triage.mjs "<prompt>"
function isCliEntrypoint(metaUrl, argv1) {
  if (!argv1) return false;
  const metaPath = fileURLToPath(metaUrl).replace(/\\/g, '/').toLowerCase();
  const rawArgPath = resolve(argv1).replace(/\\/g, '/').toLowerCase();
  if (metaPath === rawArgPath) return true;
  try {
    return metaPath === realpathSync(argv1).replace(/\\/g, '/').toLowerCase();
  } catch {
    return false;
  }
}

const isMain = isCliEntrypoint(import.meta.url, process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const skip = args.includes('--skip') || args.includes('--fast');
  const mediator = args.includes('--mediator') || args.includes('-m');
  const stickySessionActive = args.includes('--sticky') ? true : undefined;

  let tracks;
  const promptParts = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['--force', '-f', '--skip', '--fast', '--mediator', '-m', '--sticky', '--prompt'].includes(arg)) {
      continue;
    }
    if ((arg === '--tracks' || arg === '--agents') && i + 1 < args.length && /^\d+$/.test(args[i + 1])) {
      tracks = Number(args[i + 1]);
      i++;
      continue;
    }
    promptParts.push(arg);
  }

  const result = classifySkizzoTask(promptParts.join(' '), {
    force,
    skip,
    mediator,
    stickySessionActive,
    tracks
  });
  process.stdout.write(`${JSON.stringify(formatCliResult(result))}\n`);
}

/**
 * Adaptive Model & Effort Router Core Engine (Pure Headless Node.js)
 * Decouples abstract cognitive profiles (T1_INSTANT / LOW, T2_BALANCED / MEDIUM, T3_DEEP / HIGH)
 * from physical model names and effort modes.
 *
 * Future-proofing mechanisms:
 * 1. Zero-day lexical inference for newly released models and modes.
 * 2. Empirical self-calibration from transcript metrics (duration, tokens, error rate) after >= 5 samples.
 * 3. Built-in checksum drift detection and circuit-breaker fallback to `inherit` on deprecated subagent tiers.
 */

import { existsSync, readFileSync } from 'node:fs';

export const REGISTRY_SCHEMA_VERSION = 1;
export const CALIBRATION_MIN_SAMPLES = 5;

/**
 * Strips trailing system instructions appended to `<USER_SETTINGS_CHANGE>` model notices
 * (e.g. ". No need to comment on this change...").
 *
 * @param {unknown} rawModel
 * @returns {string}
 */
export function sanitizeModelSelectionName(rawModel) {
  if (typeof rawModel !== 'string') return '';
  return rawModel
    .trim()
    .replace(/^`+|`+$/g, '')
    .replace(/\.?\s+No need to comment on this change[\s\S]*$/i, '')
    .replace(/\.?\s+If reporting what model you are[\s\S]*$/i, '')
    .replace(/\.$/, '')
    .replace(/^`+|`+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts an explicit reasoning mode embedded in a UI model label or model slug
 * (e.g. "Gemini 4 Carbon (Low)", "Gemini 4 Hydrogen (XHigh)", "gemini-4-carbon-low").
 *
 * @param {unknown} modelName
 * @returns {{ tier: 'LOW' | 'MEDIUM' | 'HIGH', effort: 'low' | 'medium' | 'high', modeLabel: string } | null}
 */
export function extractExplicitReasoningMode(modelName) {
  const clean = sanitizeModelSelectionName(modelName);
  if (!clean) return null;

  const parenMatch = clean.match(/\(\s*(xhigh|high|medium|med|low|minimal)\s*\)\s*$/i);
  const slugMatch = !parenMatch
    ? clean.match(/(?:^|[-_])(xhigh|high|medium|low)$/i)
    : null;
  const rawMode = parenMatch ? parenMatch[1] : slugMatch ? slugMatch[1] : '';
  if (!rawMode) return null;

  const lower = rawMode.toLowerCase();
  if (lower === 'low' || lower === 'minimal') {
    return { tier: 'LOW', effort: 'low', modeLabel: rawMode };
  }
  if (lower === 'medium' || lower === 'med') {
    return { tier: 'MEDIUM', effort: 'medium', modeLabel: rawMode };
  }
  if (lower === 'high' || lower === 'xhigh') {
    return { tier: 'HIGH', effort: 'high', modeLabel: rawMode };
  }
  return null;
}

/**
 * Normalizes either a display label ("Gemini 4 Carbon (Medium)", "Claude Sonnet 5.5 (High)")
 * or a runtime slug ("gemini-4-carbon-medium", "claude-sonnet-5-5-high") into a single canonical ID
 * so identical model+mode selections never trigger duplicate change notifications.
 *
 * @param {unknown} rawModel
 * @returns {string}
 */
export function normalizeCanonicalModelId(rawModel) {
  const clean = sanitizeModelSelectionName(rawModel);
  if (!clean || /^(?:auto|none|default)$/i.test(clean)) return '';

  return clean
    .toLowerCase()
    .replace(/\(\s*(xhigh|high|medium|med|low|minimal)\s*\)\s*$/i, (_, m) => {
      const lm = m.toLowerCase();
      if (lm === 'med') return '-medium';
      if (lm === 'minimal') return '-low';
      return `-${lm}`;
    })
    .replace(/(\d)\.(\d)/g, '$1-$2')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formats a runtime model slug ("gemini-4-carbon-medium") or display string into a clean
 * human-readable label ("Gemini 4 Carbon (Medium)").
 *
 * @param {unknown} rawModel
 * @returns {string}
 */
export function formatHumanModelLabel(rawModel) {
  const clean = sanitizeModelSelectionName(rawModel);
  if (!clean) return '';
  if (/^gemini-pro-orchestrator$/i.test(clean)) return 'Orchestrator (Carbon)';
  if (/^gemini-pro-orchestrator-([a-z0-9]+)$/i.test(clean)) {
    const v = clean.replace(/^gemini-pro-orchestrator-/i, '');
    return `Orchestrator (${v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()})`;
  }
  if (/\s/.test(clean) && /[A-Z]/.test(clean)) {
    return clean;
  }

  let base = clean;
  let modeBadge = '';
  const modeMatch = base.match(/[-_](xhigh|high|medium|low)$/i);
  if (modeMatch && !/flash[-_]lite$/i.test(base)) {
    const m = modeMatch[1].toLowerCase();
    modeBadge =
      m === 'xhigh' ? 'XHigh' : m === 'high' ? 'High' : m === 'medium' ? 'Medium' : 'Low';
    base = base.slice(0, -modeMatch[0].length);
  }

  base = base.replace(/-(\d)-(\d)(?=-|$)/g, ' $1.$2');
  const words = base
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((tok) => {
      const lower = tok.toLowerCase();
      if (lower === 'gpt') return 'GPT';
      if (lower === 'oss') return 'OSS';
      if (lower === 'ai') return 'AI';
      if (/^\d+b$/i.test(tok)) return tok.toUpperCase();
      if (/^[a-z]/i.test(tok)) return tok.charAt(0).toUpperCase() + tok.slice(1);
      return tok;
    });

  const title = words.join(' ');
  return modeBadge ? `${title} (${modeBadge})` : title;
}

export const COGNITIVE_PROFILES = Object.freeze({
  LOW: Object.freeze({
    profileId: 'T1_INSTANT',
    tier: 'LOW',
    effort: 'low',
    defaultSubagentModel: 'flash_lite',
    maxToolTurns: 2,
    recommendedSubagents: 0,
    description: 'Esecuzione istantanea per comandi operativi, micro-correzioni e lookup rapidi'
  }),
  MEDIUM: Object.freeze({
    profileId: 'T2_BALANCED',
    tier: 'MEDIUM',
    effort: 'medium',
    defaultSubagentModel: 'flash',
    maxToolTurns: 4,
    recommendedSubagents: 1,
    description: 'Impegno bilanciato per analisi codice, spiegazioni strutturate e modifiche su singolo modulo'
  }),
  HIGH: Object.freeze({
    profileId: 'T3_DEEP',
    tier: 'HIGH',
    effort: 'high',
    defaultSubagentModel: 'pro',
    maxToolTurns: 8,
    recommendedSubagents: 2,
    description: 'Ragionamento profondo per scelte architetturali, refactoring multi-file e trade-off multi-dominio'
  })
});

export const PROMPT_ARCHETYPES = Object.freeze({
  R1_MECHANICAL_OPS: Object.freeze({
    archetypeId: 'R1_MECHANICAL_OPS',
    labelIt: 'Operazioni meccaniche, test e conferme',
    tier: 'LOW',
    effort: 'low',
    defaultSubagentModel: 'flash_lite',
    defaultSubagentType: 'self'
  }),
  R2_QUICK_LOOKUP_MICROEDIT: Object.freeze({
    archetypeId: 'R2_QUICK_LOOKUP_MICROEDIT',
    labelIt: 'Domande rapide e micro-correzioni puntuali',
    tier: 'LOW',
    effort: 'low',
    defaultSubagentModel: 'flash_lite',
    defaultSubagentType: 'research'
  }),
  R3_CODE_INSPECTION: Object.freeze({
    archetypeId: 'R3_CODE_INSPECTION',
    labelIt: 'Ispezione codice e ricostruzione flussi',
    tier: 'MEDIUM',
    effort: 'medium',
    defaultSubagentModel: 'flash',
    defaultSubagentType: 'research'
  }),
  R4_SINGLE_MODULE_DEV: Object.freeze({
    archetypeId: 'R4_SINGLE_MODULE_DEV',
    labelIt: 'Sviluppo, bugfix o test su singolo modulo',
    tier: 'MEDIUM',
    effort: 'medium',
    defaultSubagentModel: 'flash',
    defaultSubagentType: 'self'
  }),
  R5_MULTI_FILE_REFACTOR: Object.freeze({
    archetypeId: 'R5_MULTI_FILE_REFACTOR',
    labelIt: 'Refactoring multi-file e implementazione piani',
    tier: 'HIGH',
    effort: 'high',
    defaultSubagentModel: 'pro',
    defaultSubagentType: 'self'
  }),
  R6_DEEP_ARCH_TRADEOFF: Object.freeze({
    archetypeId: 'R6_DEEP_ARCH_TRADEOFF',
    labelIt: 'Audit architetturali, piani e trade-off complessi',
    tier: 'HIGH',
    effort: 'high',
    defaultSubagentModel: 'pro',
    defaultSubagentType: 'research'
  })
});

export function extractModelBaseFamily(modelLabelOrSlug) {
  const human = formatHumanModelLabel(modelLabelOrSlug);
  if (!human) return '';
  return human.replace(/\s*\(\s*(?:xhigh|high|medium|med|low|minimal)\s*\)\s*$/i, '').trim();
}

export function createDefaultCapabilityRegistry() {
  return {
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    updatedAtMs: 0,
    builtinChecksum: null,
    preInvocationContractHash: null,
    preInvocationModelOverrideSupported: false,
    pendingHarnessUpgradeNotice: null,
    lutConfig: {
      providerFilter: 'gemini-ui'
    },
    availableRoster: [],
    swarmDisplayNames: {},
    liveQuotas: {},
    pendingRosterRefresh: {
      required: false,
      detectedAtMs: null,
      notifiedAtMs: null
    },
    pendingDocCalibration: {
      required: false,
      uncalibratedFamilies: [],
      detectedAtMs: null,
      notifiedAtMs: null
    },
    lutCalibration: {
      calibratedAtMs: null,
      sourceDocs: [],
      calibratedFamilies: {},
      archetypeTargets: {}
    },
    subagentTiers: {
      flash_lite: { status: 'active', mappedTier: 'LOW', fallback: 'inherit' },
      flash: { status: 'active', mappedTier: 'MEDIUM', fallback: 'inherit' },
      pro: { status: 'active', mappedTier: 'HIGH', fallback: 'inherit' },
      inherit: { status: 'active', mappedTier: 'MEDIUM', fallback: 'inherit' }
    },
    effortModes: {
      low: { mappedTier: 'LOW', source: 'builtin' },
      medium: { mappedTier: 'MEDIUM', source: 'builtin' },
      high: { mappedTier: 'HIGH', source: 'builtin' }
    },
    models: {
      'gemini-2.5-flash-lite': {
        tier: 'LOW',
        effort: 'low',
        source: 'seed',
        samples: 0,
        avgDurationMs: 12000,
        avgOutputTokens: 350,
        errorRate: 0
      },
      'gemini-2.5-flash': {
        tier: 'MEDIUM',
        effort: 'medium',
        source: 'seed',
        samples: 0,
        avgDurationMs: 28000,
        avgOutputTokens: 900,
        errorRate: 0
      },
      'gemini-2.5-pro': {
        tier: 'HIGH',
        effort: 'high',
        source: 'seed',
        samples: 0,
        avgDurationMs: 65000,
        avgOutputTokens: 1800,
        errorRate: 0
      }
    }
  };
}

const LOW_MODEL_TOKENS_RX = /\b(?:lite|nano|mini|haiku|instant|fast|small|micro|flash[-_ ]?lite|8b|7b)\b/i;
const HIGH_MODEL_TOKENS_RX =
  /\b(?:pro|ultra|opus|thinking|deep|max|reasoner|o1|o3|o4|premier|flagship|heavy|large)\b/i;
const MEDIUM_MODEL_TOKENS_RX = /\b(?:flash|sonnet|standard|balanced|medium|default|turbo)\b/i;

const LOW_MODE_TOKENS_RX = /\b(?:low|minimal|fast|instant|quick|off|lite|0\.25)\b/i;
const HIGH_MODE_TOKENS_RX = /\b(?:high|max|deep|ultra|extended|exhaustive|thorough|1\.00|1\.0)\b/i;
const MEDIUM_MODE_TOKENS_RX = /\b(?:medium|med|standard|balanced|auto|adaptive|normal|0\.50|0\.5)\b/i;

/**
 * Infers the cognitive tier (LOW, MEDIUM, HIGH) of any model (including newly released future models)
 * using zero-day lexical heuristics and optional empirical runtime telemetry.
 *
 * @param {string} modelName
 * @param {{ samples?: number, avgDurationMs?: number, avgOutputTokens?: number, errorRate?: number }} [metrics]
 * @returns {{ tier: 'LOW' | 'MEDIUM' | 'HIGH', effort: 'low' | 'medium' | 'high', confidence: 'empirical' | 'lexical' | 'fallback', reason: string }}
 */
export function inferModelCapability(modelName, metrics = {}) {
  const clean = sanitizeModelSelectionName(modelName);
  const samples = typeof metrics.samples === 'number' ? metrics.samples : 0;
  const avgDurationMs = typeof metrics.avgDurationMs === 'number' ? metrics.avgDurationMs : 0;
  const avgOutputTokens = typeof metrics.avgOutputTokens === 'number' ? metrics.avgOutputTokens : 0;
  const errorRate = typeof metrics.errorRate === 'number' ? metrics.errorRate : 0;

  // Stage 0: Explicit parenthetical or suffix reasoning mode (e.g. "(Low)", "(Medium)", "(High)")
  // directly declares active reasoning depth and must never be overwritten by multi-tool turn duration.
  const explicitMode = extractExplicitReasoningMode(clean);
  if (explicitMode) {
    return {
      tier: explicitMode.tier,
      effort: explicitMode.effort,
      confidence: 'lexical',
      reason: `modalità di ragionamento esplicita (${explicitMode.modeLabel}) rilevata dal selettore UI`
    };
  }

  // Stage 2: Empirical self-calibration overrides lexical guess once >= 5 samples are collected
  if (samples >= CALIBRATION_MIN_SAMPLES && avgDurationMs > 0) {
    if (avgDurationMs >= 55000 || avgOutputTokens >= 2200) {
      return {
        tier: 'HIGH',
        effort: 'high',
        confidence: 'empirical',
        reason: `auto-calibrato su ${samples} turni (durata media ${Math.round(avgDurationMs / 1000)}s, ragionamento profondo)`
      };
    }
    if (avgDurationMs <= 18000 && avgOutputTokens <= 600 && errorRate <= 0.05) {
      return {
        tier: 'LOW',
        effort: 'low',
        confidence: 'empirical',
        reason: `auto-calibrato su ${samples} turni (risposta rapida ${Math.round(avgDurationMs / 1000)}s)`
      };
    }
    return {
      tier: 'MEDIUM',
      effort: 'medium',
      confidence: 'empirical',
      reason: `auto-calibrato su ${samples} turni (bilanciato ${Math.round(avgDurationMs / 1000)}s)`
    };
  }

  // Stage 1: Zero-day lexical inference on model name
  if (clean) {
    if (LOW_MODEL_TOKENS_RX.test(clean)) {
      return {
        tier: 'LOW',
        effort: 'low',
        confidence: 'lexical',
        reason: 'famiglia modello leggera/istantanea rilevata dal nome'
      };
    }
    if (HIGH_MODEL_TOKENS_RX.test(clean)) {
      return {
        tier: 'HIGH',
        effort: 'high',
        confidence: 'lexical',
        reason: 'famiglia modello ad alta capacità/thinking rilevata dal nome'
      };
    }
    if (MEDIUM_MODEL_TOKENS_RX.test(clean)) {
      return {
        tier: 'MEDIUM',
        effort: 'medium',
        confidence: 'lexical',
        reason: 'famiglia modello bilanciata rilevata dal nome'
      };
    }
  }

  // Stage 3: Safe fallback for unknown codenames
  return {
    tier: 'MEDIUM',
    effort: 'medium',
    confidence: 'fallback',
    reason: 'modello con nome non standard, applicato profilo intermedio di sicurezza'
  };
}

/**
 * Infers the tier for a newly introduced Effort or Thinking mode string.
 * @param {string} modeName
 * @returns {{ mappedTier: 'LOW' | 'MEDIUM' | 'HIGH', effort: 'low' | 'medium' | 'high' }}
 */
export function inferModeCapability(modeName) {
  const clean = typeof modeName === 'string' ? modeName.trim() : '';
  if (HIGH_MODE_TOKENS_RX.test(clean)) {
    return { mappedTier: 'HIGH', effort: 'high' };
  }
  if (LOW_MODE_TOKENS_RX.test(clean)) {
    return { mappedTier: 'LOW', effort: 'low' };
  }
  if (MEDIUM_MODE_TOKENS_RX.test(clean)) {
    return { mappedTier: 'MEDIUM', effort: 'medium' };
  }
  return { mappedTier: 'MEDIUM', effort: 'medium' };
}

/**
 * Resolves a safe subagent `Model` value for `invoke_subagent`, applying a circuit-breaker
 * fallback to `'inherit'` if a tier is deprecated or unsupported in the current runtime.
 *
 * @param {'LOW' | 'MEDIUM' | 'HIGH'} desiredTier
 * @param {object} [registry]
 * @returns {'flash_lite' | 'flash' | 'pro' | 'inherit'}
 */
export function resolveSafeSubagentModel(desiredTier, registry) {
  const reg = registry || createDefaultCapabilityRegistry();
  const profile = COGNITIVE_PROFILES[desiredTier] || COGNITIVE_PROFILES.MEDIUM;
  const candidate = profile.defaultSubagentModel;
  const tierEntry = reg.subagentTiers?.[candidate];

  if (!tierEntry || tierEntry.status !== 'active') {
    return 'inherit';
  }
  return candidate;
}

// --- Prompt Complexity & Intent Patterns ---

const FORCE_HIGH_PATTERNS = [
  /(?:^|\s)--(?:high|pro|deep|force)(?:\s|$)/i,
  /\b(?:forza\s+pro|usa\s+pro|massima\s+qualit[aà]|effort\s+high|ragionamento\s+profondo)\b/i
];

const FORCE_LOW_PATTERNS = [
  /(?:^|\s)--(?:low|fast|skip|lite)(?:\s|$)/i,
  /\b(?:risposta\s+veloce|vai\s+veloce|effort\s+low|usa\s+flash[-_ ]?lite|senza\s+subagent)\b/i
];

const OPS_GUARD_PATTERNS = [
  /^\/(?:memory-sync|take-note|review-notes|next-step|validate-plugins|focus-audit|plugin-analytics|telemetry-export|model-router)\b/i,
  /^(?:git\s+(?:status|add|commit|diff|log|push|pull|branch|checkout|worktree)|npm\s+(?:test|run\s+sync|run\s+validate)|node\s+(?:--test|scripts\/validate\.mjs))\b/i,
  /^(?:fai\s+(?:il\s+)?commit|esegui\s+i\s+test|lancia\s+i\s+test|sincronizza\s+i\s+plugin|aggiorna\s+i\s+plugin\w*|aggiorna\s+la\s+memoria|start\s+server)\s*[.!]?$/i,
  /^(?:fallo|procedi|ok\s+procedi|vai(?:\s+pure)?|esegui(?:\s+il\s+piano)?|applica(?:\s+il\s+piano)?|implementa\s+il\s+piano|s[iì]\s+procedi)\s*[.!]?$/i
];

const READONLY_OVERRIDE_PATTERNS = [
  /\b(?:non\s+agire|[eè]\s+solo\s+una?\s+domanda|solo\s+una?\s+domanda|non\s+modificare\s+nulla|non\s+toccare\s+(?:il\s+)?codice|senza\s+modificare\s+nulla)\b/i
];

const READONLY_START_PATTERNS = [
  /^\/how-its-made\b/i,
  /^(?:spiega(?:mi)?|mostra(?:mi)?|leggi|dove\s+si\s+trova|cosa\s+fa|come\s+funziona|come\s+mai|perch[eé]\s+(?:c'[eè]|non|la|il|lo|i|gli|le)|non\s+(?:comprendo|capisco)|a\s+che\s+punto\s+siamo|qual\s+[eè]|quali\s+sono|elenca|mi\s+dai|define|explain|where\s+is|show\s+me|what\s+does|why\s+is)\b/i
];

const MICRO_EDIT_PATTERNS = [
  /\b(?:correggi\s+(?:il\s+)?(?:typo|refuso)|fix\s+typo|rinomina|rename|cambia\s+il\s+(?:colore|testo|padding|margine|titolo|numero|valore)|aggiorna\s+la\s+versione|bump\s+version|fix\s+(?:lint|import))\b/i
];

const CODE_EXPLAIN_OR_SINGLE_MOD_RX =
  /\b(?:\/how-its-made|come\s+funziona|architettura\s+di|flusso\s+di|spiega(?:mi)?\s+il\s+(?:flusso|codice|meccanismo|funzionamento)|aggiungi\s+(?:un\s+)?(?:test|controllo|campo|parametro|flag)|correggi\s+il\s+bug|fixa\s+il\s+bug|gestisci\s+il\s+caso|estendi|implementa)\b/i;

const HIGH_INTENT_OR_TRADEOFF_RX =
  /\b(?:fai\s+un\s+piano|audit\b|verifica\s+(?:approfondita|architetturale|completa|integrit[aà])|progett\w+|architettur\w+|nuova\s+funzionalit[aà]|nuovo\s+(?:plugin|modulo|sistema|flusso|metodo)|rifattorizz\w+|refactor\w*|struttur\w+|impost\w+|organizz\w+|auto[- ]?apprendimento|come\s+conviene|bilanci\w+|ottimizz\w+\s+il\s+consumo|tutt[ei]\s+(?:le|i)\s+(?:regole|skill|plugin|file)|pro\s+e\s+contro|vantaggi\s+e\s+svantaggi|trade[- ]?off|bivio|compromess\w+|race\s+condition|regression\w+|multi[- ]?file|strategi\w+\s+conviene|approcci\w+\s+miglior\w+|future[- ]?proof)\b/i;

const TENSION_ARCH_RX =
  /\b(?:piano|progett\w+|architettur\w+|funzionalit[aà]|feature|rifattorizz\w+|refactor\w*|miglior\w+|ottimizz\w+|motore|headless|core|algoritm\w+|struttur\w+|organizz\w+|impost\w+|metodolog\w+|percors\w+|protocollo|multi[- ]?file|plugin|orchestraz\w+|auto[- ]?apprendimento)\b/i;

const TENSION_UX_RX =
  /\b(?:utente|ux|ui|interfaccia|flusso|click|fatica|passaggi|pulsant\w+|botton\w+|form|modulo|dashboard|vista|mobile|360px|responsive|ergonomi\w+|semplicit[aà]|comodo|automatic\w+|preferenz\w+|feedback|prospettiv\w+|punto\s+di\s+vista|stakeholder|ruol\w+|domini\w*|chiarezz\w+|fruibilit[aà]|esperienz\w+)\b/i;

const TENSION_EDGE_RX =
  /\b(?:input|parsing|parser|validaz\w+|validatore|compatibilit[aà]|format\w+|casi\s+limite|edge\s+case|error\w+|fallback|cache|concorrenz\w+|race\s+condition|deterministic\w+|a\s+priori|sogli\w+|filtr\w+|ricerca|tolleranz\w+|sicurezz\w+|rischi\w*|vincol\w+|limiti|critic\w+|affidabilit[aà]|regression\w+|latenza)\b/i;

const TENSION_OPEN_RX =
  /\b(?:c'[eè]\s+qualche\s+modo|come\s+(?:possiamo|facciamo|conviene|potremmo)|conviene|dove\s+conviene|meglio|alternativ\w+|strategi\w+|approcci\w+|opzion\w+|valuta(?:re|zione)?|confront\w+|competere|collaborare|bilanci\w+|compromess\w+|trade[- ]?off|pro\s+e\s+contro|vantaggi\s+e\s+svantaggi|criteri\w*|priorit[aà])\b/i;

/**
 * Strips router/skizzo flags to inspect clean semantic content.
 * @param {unknown} rawPrompt
 * @returns {string}
 */
export function normalizeRouterPrompt(rawPrompt) {
  if (typeof rawPrompt !== 'string') return '';
  return rawPrompt
    .replace(/^\s*\/(?:skizzo|model-router)\b/i, '')
    .replace(/(?:^|\s)--(?:high|pro|deep|force|low|fast|skip|lite|medium|status|scan|json)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Evaluates whether the currently active UI model is misaligned with the prompt's cognitive tier.
 *
 * @param {'LOW' | 'MEDIUM' | 'HIGH'} promptTier
 * @param {string | null | undefined} activeUiModel
 * @param {object} [registry]
 * @returns {{ mismatchType: 'NONE' | 'OVERPROVISIONED_UI_MODEL' | 'UNDERPROVISIONED_UI_MODEL', uiModelTier: 'LOW' | 'MEDIUM' | 'HIGH' | null, recommendation: string | null }}
 */
export function evaluateUiModelAlignment(promptTier, activeUiModel, registry) {
  const cleanUiModel = sanitizeModelSelectionName(activeUiModel);
  if (!cleanUiModel || /^(?:auto|none|default)$/i.test(cleanUiModel)) {
    return { mismatchType: 'NONE', uiModelTier: null, recommendation: null };
  }

  const reg = registry || createDefaultCapabilityRegistry();
  const key = cleanUiModel.toLowerCase();
  const explicitMode = extractExplicitReasoningMode(cleanUiModel);
  const known = reg.models?.[key];
  const uiModelTier = explicitMode
    ? explicitMode.tier
    : known
      ? known.tier
      : inferModelCapability(cleanUiModel).tier;

  if (uiModelTier === 'HIGH' && promptTier === 'LOW') {
    return {
      mismatchType: 'OVERPROVISIONED_UI_MODEL',
      uiModelTier,
      recommendation: `Modello UI '${cleanUiModel}' (HIGH) sovradimensionato per un task LOW: passa a Flash/Low o delega a flash_lite per risparmiare quota e ~20s.`
    };
  }

  if (uiModelTier === 'LOW' && promptTier === 'HIGH') {
    return {
      mismatchType: 'UNDERPROVISIONED_UI_MODEL',
      uiModelTier,
      recommendation: `Modello UI '${cleanUiModel}' (LOW) sottodimensionato per un task architetturale HIGH: passa il selettore UI su High o delega il ragionamento a invoke_subagent con Model: 'pro'.`
    };
  }

  return { mismatchType: 'NONE', uiModelTier, recommendation: null };
}

const IS_ARCH_PLAN_OR_AUDIT_RX =
  /\b(?:fai\s+un\s+piano|audit\b|verifica\s+(?:approfondita|architetturale|completa|integrit[aà])|pro\s+e\s+contro|vantaggi\s+e\s+svantaggi|trade[- ]?off|come\s+conviene|strategi\w+\s+conviene|approcci\w+\s+miglior\w+|progett\w+|analizza\s+il\s+problema)\b/i;

const IS_MUTATIVE_REFACTOR_RX =
  /\b(?:rifattorizz\w+|refactor\w*|esegui\s+la\s+rifattorizzazione|implementa|migra\w*)\b/i;

/**
 * Resolves the optimal target model, reasoning mode, subagent execution tier, and 1-click/0-click switch action
 * for a prompt archetype (`R1..R6`) using the official-docs calibrated LUT (or dynamic registry fallback).
 *
 * @param {string} archetypeId
 * @param {object} [registry]
 * @param {string | null | undefined} [activeUiModel]
 */
export function resolveLutRoute(archetypeId, registry, activeUiModel) {
  const reg = registry || createDefaultCapabilityRegistry();
  const arch = PROMPT_ARCHETYPES[archetypeId] || PROMPT_ARCHETYPES.R4_SINGLE_MODULE_DEV;
  const calibratedTarget = reg.lutCalibration?.archetypeTargets?.[arch.archetypeId] || null;

  let recommendedUiModel = calibratedTarget?.primaryUiModel || null;
  const alternativeUiModel = calibratedTarget?.alternativeUiModel || null;

  if (!recommendedUiModel) {
    const candidates = Object.entries(reg.models || {})
      .filter(([, m]) => m && m.tier === arch.tier && m.source === 'auto-discovered')
      .sort((a, b) => (b[1].samples || 0) - (a[1].samples || 0));
    recommendedUiModel =
      candidates.length > 0
        ? candidates[0][1].displayName || formatHumanModelLabel(candidates[0][0])
        : arch.tier === 'HIGH'
          ? 'Gemini 4 Carbon (High)'
          : arch.tier === 'MEDIUM'
            ? 'Gemini 4 Argon (Medium)'
            : 'Gemini 4 Hydrogen (Low)';
  }

  const desiredSubagentTier = calibratedTarget?.subagentModel || arch.defaultSubagentModel;
  const tierForSafeResolve =
    desiredSubagentTier === 'pro' ? 'HIGH' : desiredSubagentTier === 'flash' ? 'MEDIUM' : 'LOW';
  const executionSubagentModel = resolveSafeSubagentModel(tierForSafeResolve, reg);
  const executionSubagentType = calibratedTarget?.subagentType || arch.defaultSubagentType;

  const cleanActive = sanitizeModelSelectionName(activeUiModel);
  if (!cleanActive || /^(?:auto|none|default)$/i.test(cleanActive) || arch.archetypeId === 'R1_MECHANICAL_OPS') {
    return {
      archetypeId: arch.archetypeId,
      archetypeLabelIt: arch.labelIt,
      targetTier: arch.tier,
      recommendedUiModel,
      alternativeUiModel,
      executionSubagentModel,
      executionSubagentType,
      switchAction: 'NONE',
      rationaleIt: null
    };
  }

  const mappedDisplay = reg.swarmDisplayNames?.[cleanActive.toLowerCase()] || formatHumanModelLabel(cleanActive);
  const baseFamily = extractModelBaseFamily(mappedDisplay);
  const familyProfile = reg.lutCalibration?.calibratedFamilies?.[baseFamily] || null;
  const roleClass =
    familyProfile?.roleClass ||
    (/\borchestrator\b/i.test(mappedDisplay) ? 'DYNAMIC_ORCHESTRATOR' : null);
  const explicitMode = extractExplicitReasoningMode(mappedDisplay || cleanActive);
  const activeTier = explicitMode
    ? explicitMode.tier
    : inferModelCapability(mappedDisplay || cleanActive).tier;
  const isXHigh = Boolean(explicitMode && /^xhigh$/i.test(explicitMode.modeLabel));

  // Official-docs invariant: Antigravity Orchestrator natively swaps between Carbon/Argon and Hydrogen
  if (roleClass === 'DYNAMIC_ORCHESTRATOR') {
    return {
      archetypeId: arch.archetypeId,
      archetypeLabelIt: arch.labelIt,
      targetTier: arch.tier,
      recommendedUiModel,
      alternativeUiModel,
      executionSubagentModel,
      executionSubagentType,
      switchAction: 'NONE',
      rationaleIt: familyProfile?.officialSummaryIt || null
    };
  }

  const recFamilyProfile =
    reg.lutCalibration?.calibratedFamilies?.[extractModelBaseFamily(recommendedUiModel)] || null;

  // 1-Click Upgrade check (underprovisioned mode or lightweight fast model on complex multi-file/audit task)
  const isFastFamilyOnHigh =
    (roleClass === 'LEGACY_FAST' || roleClass === 'FAST_EXECUTION') &&
    arch.tier === 'HIGH' &&
    !isXHigh;
  const isLowOnMutativeMedium =
    arch.archetypeId === 'R4_SINGLE_MODULE_DEV' && activeTier === 'LOW';
  const isLowOnHigh = arch.tier === 'HIGH' && activeTier === 'LOW';

  if (isLowOnHigh || isLowOnMutativeMedium || isFastFamilyOnHigh) {
    return {
      archetypeId: arch.archetypeId,
      archetypeLabelIt: arch.labelIt,
      targetTier: arch.tier,
      recommendedUiModel,
      alternativeUiModel,
      executionSubagentModel,
      executionSubagentType,
      switchAction: 'ASK_1CLICK_UPGRADE',
      rationaleIt:
        recFamilyProfile?.officialSummaryIt ||
        `Richiede capacità ${arch.tier} (${arch.labelIt}).`
    };
  }

  // 0-Click Downgrade hint check (heavy frontier High mode used on lightweight R2/R3 tasks)
  const isHeavyHighOnLight =
    activeTier === 'HIGH' &&
    (arch.archetypeId === 'R2_QUICK_LOOKUP_MICROEDIT' || arch.archetypeId === 'R3_CODE_INSPECTION') &&
    (roleClass === 'FRONTIER_HEAVYWEIGHT' || roleClass === 'EFFICIENT_CODING' || !roleClass);

  if (isHeavyHighOnLight) {
    return {
      archetypeId: arch.archetypeId,
      archetypeLabelIt: arch.labelIt,
      targetTier: arch.tier,
      recommendedUiModel,
      alternativeUiModel,
      executionSubagentModel,
      executionSubagentType,
      switchAction: 'SUGGEST_0CLICK_DOWNGRADE',
      rationaleIt: recFamilyProfile?.officialSummaryIt || null
    };
  }

  return {
    archetypeId: arch.archetypeId,
    archetypeLabelIt: arch.labelIt,
    targetTier: arch.tier,
    recommendedUiModel,
    alternativeUiModel,
    executionSubagentModel,
    executionSubagentType,
    switchAction: 'NONE',
    rationaleIt: null
  };
}

/**
 * Classifies a prompt in < 0.5ms into LOW (T1_INSTANT), MEDIUM (T2_BALANCED), or HIGH (T3_DEEP),
 * resolving its 6-way LUT archetype (`R1..R6`), target UI model, subagent model, and UI alignment.
 *
 * @param {unknown} rawPrompt
 * @param {{ registry?: object, activeUiModel?: string | null }} [options]
 */
export function classifyPromptRoute(rawPrompt, options = {}) {
  const safeRaw = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  const clean = normalizeRouterPrompt(safeRaw);
  const reg = options.registry || createDefaultCapabilityRegistry();
  const wordCount = clean ? clean.split(/\s+/).length : 0;

  const resolveArchetype = (tier, signals) => {
    if (tier === 'LOW') {
      if (signals.includes('guard_ops') || signals.includes('empty_input')) {
        return 'R1_MECHANICAL_OPS';
      }
      return 'R2_QUICK_LOOKUP_MICROEDIT';
    }
    if (tier === 'MEDIUM') {
      if (
        signals.includes('readonly_structured_explain') ||
        signals.includes('readonly_override_medium') ||
        /^\/how-its-made\b/i.test(clean)
      ) {
        return 'R3_CODE_INSPECTION';
      }
      return 'R4_SINGLE_MODULE_DEV';
    }
    if (IS_MUTATIVE_REFACTOR_RX.test(clean) && !IS_ARCH_PLAN_OR_AUDIT_RX.test(clean)) {
      return 'R5_MULTI_FILE_REFACTOR';
    }
    if (signals.includes('multi_file_scope') && !IS_ARCH_PLAN_OR_AUDIT_RX.test(clean)) {
      return 'R5_MULTI_FILE_REFACTOR';
    }
    return 'R6_DEEP_ARCH_TRADEOFF';
  };

  const buildResult = (tier, score, reason, signals) => {
    const profile = COGNITIVE_PROFILES[tier] || COGNITIVE_PROFILES.MEDIUM;
    const archetypeId = resolveArchetype(tier, signals);
    const lutRoute = resolveLutRoute(archetypeId, reg, options.activeUiModel);
    const subagentModel = resolveSafeSubagentModel(tier, reg);
    const alignment = evaluateUiModelAlignment(tier, options.activeUiModel, reg);
    return {
      tier,
      archetypeId,
      profileId: profile.profileId,
      effort: profile.effort,
      subagentModel,
      maxToolTurns: profile.maxToolTurns,
      recommendedSubagents: profile.recommendedSubagents,
      score,
      reason,
      signals,
      alignment,
      lutRoute
    };
  };

  if (!clean) {
    return buildResult('LOW', 0, 'messaggio vuoto o solo comando di stato', ['empty_input']);
  }

  // 1. Explicit user overrides
  const isForcedHigh = FORCE_HIGH_PATTERNS.some((rx) => rx.test(safeRaw));
  const isForcedLow = FORCE_LOW_PATTERNS.some((rx) => rx.test(safeRaw));
  if (isForcedHigh && !isForcedLow) {
    return buildResult('HIGH', 99, 'forzatura esplicita HIGH/Pro richiesta dall\'utente', ['manual_force_high']);
  }
  if (isForcedLow) {
    return buildResult('LOW', -50, 'forzatura esplicita LOW/Fast richiesta dall\'utente', ['manual_force_low']);
  }

  // 2. Pure mechanical ops (Git, test runner, sync, memory commands, plan confirmation)
  if (OPS_GUARD_PATTERNS.some((rx) => rx.test(clean))) {
    return buildResult('LOW', -99, 'comando operativo meccanico o conferma esecuzione', ['guard_ops']);
  }

  // 3. Compute additive dialectical tension score (0..7) + multi-file boost
  let score = 0;
  const signals = [];
  if (TENSION_ARCH_RX.test(clean)) {
    score += 2;
    signals.push('arch_tension');
  }
  if (TENSION_UX_RX.test(clean)) {
    score += 2;
    signals.push('ux_tension');
  }
  if (TENSION_EDGE_RX.test(clean)) {
    score += 2;
    signals.push('edge_tension');
  }
  if (TENSION_OPEN_RX.test(clean)) {
    score += 1;
    signals.push('open_tradeoff');
  }
  const fileMentions = (clean.match(/@[\w./-]+|\b[\w-]+\.(?:mjs|js|ts|md|json|html|css)\b/g) || []).length;
  if (fileMentions >= 3 && score < 4) {
    score += 2;
    signals.push('multi_file_scope');
  }

  const hasHighIntent = HIGH_INTENT_OR_TRADEOFF_RX.test(clean);
  const isReadonlyStart = READONLY_START_PATTERNS.some((rx) => rx.test(clean));
  const isReadonlyOverride = READONLY_OVERRIDE_PATTERNS.some((rx) => rx.test(clean));
  const isMicroEdit = MICRO_EDIT_PATTERNS.some((rx) => rx.test(clean));

  // 4. Hard read-only override clause ("non agire è solo una domanda") -> MEDIUM if analytical, LOW if trivial
  if (isReadonlyOverride) {
    if (score >= 3 || wordCount >= 12) {
      return buildResult('MEDIUM', 2, 'domanda analitica con clausola esplicita di sola lettura', [
        ...signals,
        'readonly_override_medium'
      ]);
    }
    return buildResult('LOW', -60, 'domanda rapida di sola lettura', ['readonly_override_low']);
  }

  // 5. Rescue false negatives where G2a (readonly start) or G3 (micro edit keyword) appears in a complex architectural prompt
  if ((isReadonlyStart || isMicroEdit) && hasHighIntent && wordCount >= 12) {
    return buildResult(
      'HIGH',
      Math.max(4, score),
      'problema architetturale o multi-dominio complesso (falso negativo G2a/G3 evitato)',
      [...signals, 'rescued_high_complexity']
    );
  }

  // 6. Surgical single-target micro-edit (short prompt without architectural tension) -> LOW
  if (isMicroEdit && wordCount <= 14 && !hasHighIntent) {
    return buildResult('LOW', 1, 'micro-correzione chirurgica a scelta unica', ['guard_micro_edit']);
  }

  // 7. Read-only inspection without high architectural/trade-off intent: trivial lookup (LOW) vs structured explanation (MEDIUM)
  if (isReadonlyStart && !hasHighIntent) {
    if (CODE_EXPLAIN_OR_SINGLE_MOD_RX.test(clean) || wordCount >= 10) {
      return buildResult('MEDIUM', 2, 'spiegazione o ispezione strutturata del codice', [
        ...signals,
        'readonly_structured_explain'
      ]);
    }
    return buildResult('LOW', 0, 'lookup informativo rapido', ['readonly_quick_lookup']);
  }

  // 8. High complexity / Multi-domain tension -> HIGH
  if (score >= 4 || (score >= 2 && hasHighIntent)) {
    return buildResult(
      'HIGH',
      Math.max(4, score),
      'scelta architetturale, refactoring multi-file o trade-off multi-dominio',
      [...signals, 'high_tier']
    );
  }

  // 9. Medium scope (single-module implementation, bugfix, or unit test) -> MEDIUM
  if (score >= 2 || CODE_EXPLAIN_OR_SINGLE_MOD_RX.test(clean) || wordCount >= 9) {
    return buildResult('MEDIUM', Math.max(2, score), 'sviluppo, bugfix o test su singolo modulo', [
      ...signals,
      'medium_single_module'
    ]);
  }

  return buildResult('LOW', score, 'richiesta semplice diretta', signals.length ? signals : ['direct_low']);
}

/**
 * Scans a raw `transcript.jsonl` string to discover newly used models, effort modes,
 * and empirical telemetry (duration, output tokens, tool error rates), updating the capability registry.
 *
 * @param {string} rawJsonl
 * @param {object} [existingRegistry]
 * @returns {{
 *   registry: object,
 *   newlyDiscoveredModels: string[],
 *   newlyDiscoveredModes: string[],
 *   recalibratedModels: string[]
 * }}
 */
export function discoverCapabilitiesFromTranscript(rawJsonl, existingRegistry) {
  const base = existingRegistry
    ? JSON.parse(JSON.stringify(existingRegistry))
    : createDefaultCapabilityRegistry();

  if (!base.models) base.models = {};
  if (!base.effortModes) base.effortModes = {};
  if (!base.subagentTiers) base.subagentTiers = createDefaultCapabilityRegistry().subagentTiers;

  const newlyDiscoveredModels = [];
  const newlyDiscoveredModes = [];
  const recalibratedModels = [];

  if (typeof rawJsonl !== 'string' || !rawJsonl.trim()) {
    return { registry: base, newlyDiscoveredModels, newlyDiscoveredModes, recalibratedModels };
  }

  const lines = rawJsonl.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let activeModel = null;
  let lastUserTs = null;
  let turnOutputTokens = 0;
  let turnToolCalls = 0;
  let turnToolErrors = 0;

  const recordTurnMetrics = (endTs) => {
    if (!activeModel) return;
    const key = activeModel.toLowerCase();
    const entry = base.models[key];
    if (!entry) return;

    const prevTier = entry.tier;
    const hasMeasuredDuration =
      Boolean(lastUserTs && endTs && endTs > lastUserTs && endTs - lastUserTs <= 300000);
    const durationMs = hasMeasuredDuration ? endTs - lastUserTs : 0;

    const n = (entry.samples || 0) + 1;
    entry.samples = n;
    if (hasMeasuredDuration) {
      entry.avgDurationMs = entry.avgDurationMs
        ? Math.round((entry.avgDurationMs * (n - 1) + durationMs) / n)
        : durationMs;
    }
    if (turnOutputTokens > 0) {
      entry.avgOutputTokens = entry.avgOutputTokens
        ? Math.round((entry.avgOutputTokens * (n - 1) + turnOutputTokens) / n)
        : turnOutputTokens;
    }
    const turnErrRate = turnToolCalls > 0 ? turnToolErrors / turnToolCalls : 0;
    entry.errorRate = Number((((entry.errorRate || 0) * (n - 1) + turnErrRate) / n).toFixed(3));

    const inferred = inferModelCapability(activeModel, entry);
    entry.tier = inferred.tier;
    entry.effort = inferred.effort;
    entry.confidence = inferred.confidence;

    if (prevTier && prevTier !== entry.tier && n >= CALIBRATION_MIN_SAMPLES) {
      if (!recalibratedModels.includes(key)) {
        recalibratedModels.push(key);
      }
    }
  };

  for (const line of lines) {
    let step;
    try {
      step = JSON.parse(line);
    } catch {
      continue;
    }

    const stepTs = step.created_at ? new Date(step.created_at).getTime() : null;
    const content = typeof step.content === 'string' ? step.content : '';

    // 0. Probe embedded `swarm{action:"models"}` catalog JSON outputs in transcript steps
    if (content.includes('"models":[') && content.includes('"display_names":{')) {
      const jsonIdx = content.indexOf('{"models":[');
      if (jsonIdx !== -1) {
        try {
          const catalogObj = JSON.parse(content.slice(jsonIdx).trim());
          const imported = importSwarmModelsCatalog(base, catalogObj);
          Object.assign(base, imported.registry);
        } catch {
          // Ignore partial or truncated tool previews
        }
      }
    }

    // 1. Probe <USER_SETTINGS_CHANGE> for new models and new effort/thinking modes
    if (content.includes('<USER_SETTINGS_CHANGE>')) {
      const settingsBlocks = content.matchAll(/<USER_SETTINGS_CHANGE>([\s\S]*?)<\/USER_SETTINGS_CHANGE>/gi);
      for (const match of settingsBlocks) {
        const block = match[1] || '';

        const modelMatch = block.match(/Model Selection`?\s+from\s+.*?\s+to\s+`?([^\r\n`]+?)`?\.?(?:\r|\n|$)/i);
        if (modelMatch && modelMatch[1]) {
          const rawModel = sanitizeModelSelectionName(modelMatch[1]);
          const modelKey = rawModel.toLowerCase();
          if (modelKey && modelKey !== 'none') {
            activeModel = rawModel;
            if (!base.models[modelKey]) {
              const inferred = inferModelCapability(rawModel);
              base.models[modelKey] = {
                displayName: rawModel,
                tier: inferred.tier,
                effort: inferred.effort,
                confidence: inferred.confidence,
                source: 'auto-discovered',
                samples: 0,
                avgDurationMs: 0,
                avgOutputTokens: 0,
                errorRate: 0
              };
              newlyDiscoveredModels.push(rawModel);
            }
          }
        }

        const modeMatch = block.match(
          /(?:Thinking|Effort|Reasoning|Mode)\s*(?:Level|Mode)?`?\s+from\s+.*?\s+to\s+`?([^\r\n`]+?)`?\.?(?:\r|\n|$)/i
        );
        if (modeMatch && modeMatch[1]) {
          const rawMode = sanitizeModelSelectionName(modeMatch[1]);
          const modeKey = rawMode.toLowerCase();
          if (modeKey && modeKey !== 'none' && !base.effortModes[modeKey]) {
            const inferredMode = inferModeCapability(rawMode);
            base.effortModes[modeKey] = {
              mappedTier: inferredMode.mappedTier,
              effort: inferredMode.effort,
              source: 'auto-discovered'
            };
            newlyDiscoveredModes.push(rawMode);
          }
        }
      }
    }

    if (step.type === 'USER_INPUT' && step.source === 'USER_EXPLICIT') {
      if (lastUserTs && activeModel) {
        recordTurnMetrics(stepTs);
      }
      lastUserTs = stepTs;
      turnOutputTokens = 0;
      turnToolCalls = 0;
      turnToolErrors = 0;
    }

    if (step.type === 'PLANNER_RESPONSE' || step.source === 'MODEL') {
      if (typeof step.model === 'string' && step.model.trim()) {
        const rawM = step.model.trim();
        const mKey = rawM.toLowerCase();
        activeModel = rawM;
        if (!base.models[mKey]) {
          const inferred = inferModelCapability(rawM);
          base.models[mKey] = {
            displayName: rawM,
            tier: inferred.tier,
            effort: inferred.effort,
            confidence: inferred.confidence,
            source: 'auto-discovered',
            samples: 0,
            avgDurationMs: 0,
            avgOutputTokens: 0,
            errorRate: 0
          };
          newlyDiscoveredModels.push(rawM);
        }
      }
      if (typeof step.output_tokens === 'number') {
        turnOutputTokens += step.output_tokens;
      }
      if (Array.isArray(step.tool_calls)) {
        turnToolCalls += step.tool_calls.length;
      }
    }

    if (step.status === 'ERROR') {
      turnToolErrors += 1;
    }
  }

  if (lastUserTs && activeModel) {
    const lastLineTs = lines.length > 0 ? Date.now() : lastUserTs;
    recordTurnMetrics(lastLineTs);
  }

  base.updatedAtMs = Date.now();
  const sanitizedBase = cleanPollutedModelRegistry(base);
  return {
    registry: sanitizedBase,
    newlyDiscoveredModels,
    newlyDiscoveredModes,
    recalibratedModels
  };
}

/**
 * Cleans and merges model registry entries polluted by trailing `<USER_SETTINGS_CHANGE>` boilerplate,
 * recomputing tiers so explicit `(Low)` / `(Medium)` / `(High)` modes remain accurate.
 *
 * @param {object} registry
 * @returns {object}
 */
export function cleanPollutedModelRegistry(registry) {
  const cloned = registry ? JSON.parse(JSON.stringify(registry)) : createDefaultCapabilityRegistry();
  if (!cloned.models || typeof cloned.models !== 'object') {
    cloned.models = {};
    return cloned;
  }

  const nextModels = {};
  for (const [rawKey, rawEntry] of Object.entries(cloned.models)) {
    if (!rawEntry || typeof rawEntry !== 'object') continue;
    const cleanDisplay = sanitizeModelSelectionName(rawEntry.displayName || rawKey);
    const cleanKey = cleanDisplay.toLowerCase();
    if (!cleanKey || cleanKey === 'none') continue;

    const existing = nextModels[cleanKey];
    if (!existing) {
      const entry = {
        ...rawEntry,
        displayName: rawEntry.displayName ? cleanDisplay : undefined
      };
      if (entry.displayName === undefined) delete entry.displayName;
      const inferred = inferModelCapability(cleanDisplay, entry);
      entry.tier = inferred.tier;
      entry.effort = inferred.effort;
      entry.confidence = inferred.confidence;
      nextModels[cleanKey] = entry;
    } else {
      const prevSamples = existing.samples || 0;
      const addSamples = rawEntry.samples || 0;
      const totalSamples = prevSamples + addSamples;
      if (totalSamples > 0) {
        existing.avgDurationMs = Math.round(
          ((existing.avgDurationMs || 0) * prevSamples + (rawEntry.avgDurationMs || 0) * addSamples) /
            totalSamples
        );
        existing.avgOutputTokens = Math.round(
          ((existing.avgOutputTokens || 0) * prevSamples + (rawEntry.avgOutputTokens || 0) * addSamples) /
            totalSamples
        );
        existing.errorRate = Number(
          (
            ((existing.errorRate || 0) * prevSamples + (rawEntry.errorRate || 0) * addSamples) /
            totalSamples
          ).toFixed(3)
        );
      }
      existing.samples = totalSamples;
      const inferred = inferModelCapability(cleanDisplay, existing);
      existing.tier = inferred.tier;
      existing.effort = inferred.effort;
      existing.confidence = inferred.confidence;
    }
  }

  cloned.models = nextModels;
  return cloned;
}

/**
 * Resolves the latest active UI model and reasoning mode from a `transcript.jsonl` path or raw JSONL string.
 * Scans from the end of the transcript so the most recent `<USER_SETTINGS_CHANGE>` or `PLANNER_RESPONSE` wins.
 *
 * @param {string | null | undefined} transcriptSource
 * @returns {string | null}
 */
export function resolveActiveUiModelFromTranscript(transcriptSource) {
  if (!transcriptSource || typeof transcriptSource !== 'string' || !transcriptSource.trim()) {
    return null;
  }

  let rawJsonl = '';
  if (transcriptSource.includes('{') || transcriptSource.includes('\n')) {
    rawJsonl = transcriptSource;
  } else {
    try {
      if (!existsSync(transcriptSource)) return null;
      rawJsonl = readFileSync(transcriptSource, 'utf-8');
    } catch {
      return null;
    }
  }

  const lines = rawJsonl.split(/\r?\n/).filter((l) => l.trim().length > 0);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    let step;
    try {
      step = JSON.parse(lines[i]);
    } catch {
      continue;
    }

    const content = typeof step.content === 'string' ? step.content : '';
    if (content.includes('<USER_SETTINGS_CHANGE>')) {
      const matches = [...content.matchAll(/<USER_SETTINGS_CHANGE>([\s\S]*?)<\/USER_SETTINGS_CHANGE>/gi)];
      for (let m = matches.length - 1; m >= 0; m -= 1) {
        const block = matches[m][1] || '';
        const modelMatch = block.match(/Model Selection`?\s+from\s+.*?\s+to\s+`?([^\r\n`]+?)`?\.?(?:\r|\n|$)/i);
        if (modelMatch && modelMatch[1]) {
          const cleaned = sanitizeModelSelectionName(modelMatch[1]);
          if (cleaned && cleaned.toLowerCase() !== 'none') {
            return cleaned;
          }
        }
      }
    }

    if ((step.type === 'PLANNER_RESPONSE' || step.source === 'MODEL') && typeof step.model === 'string') {
      const cleaned = sanitizeModelSelectionName(step.model);
      if (cleaned && !/^(?:auto|none)$/i.test(cleaned)) {
        return cleaned;
      }
    }
  }

  return null;
}

/**
 * Inspects only the most recent `USER_INPUT` step in a transcript to check whether the user
 * explicitly changed `Model Selection` right before submitting the current prompt.
 *
 * @param {string | null | undefined} transcriptSource
 * @returns {{ fromModel: string | null, toModel: string } | null}
 */
export function extractLatestTurnSettingsChange(transcriptSource) {
  if (!transcriptSource || typeof transcriptSource !== 'string' || !transcriptSource.trim()) {
    return null;
  }

  let rawJsonl = '';
  if (transcriptSource.includes('{') || transcriptSource.includes('\n')) {
    rawJsonl = transcriptSource;
  } else {
    try {
      if (!existsSync(transcriptSource)) return null;
      rawJsonl = readFileSync(transcriptSource, 'utf-8');
    } catch {
      return null;
    }
  }

  const lines = rawJsonl.split(/\r?\n/).filter((l) => l.trim().length > 0);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    let step;
    try {
      step = JSON.parse(lines[i]);
    } catch {
      continue;
    }

    if (step.type === 'USER_INPUT') {
      const content = typeof step.content === 'string' ? step.content : '';
      if (!content.includes('<USER_SETTINGS_CHANGE>')) return null;

      const matches = [...content.matchAll(/<USER_SETTINGS_CHANGE>([\s\S]*?)<\/USER_SETTINGS_CHANGE>/gi)];
      for (let m = matches.length - 1; m >= 0; m -= 1) {
        const block = matches[m][1] || '';
        const modelMatch = block.match(
          /Model Selection`?\s+from\s+`?([^\r\n`]+?)`?\s+to\s+`?([^\r\n`]+?)`?\.?(?:\r|\n|$)/i
        );
        if (modelMatch && modelMatch[2]) {
          const rawFrom = sanitizeModelSelectionName(modelMatch[1]);
          const rawTo = sanitizeModelSelectionName(modelMatch[2]);
          if (rawTo && !/^(?:none|auto)$/i.test(rawTo)) {
            return {
              fromModel: rawFrom && !/^(?:none|default|auto)$/i.test(rawFrom) ? rawFrom : null,
              toModel: rawTo
            };
          }
        }
      }
      return null;
    }
  }

  return null;
}

/**
 * Imports the live runtime model list returned by `swarm{action:"models"}` into the capability registry,
 * filtering by `providerFilter` ('gemini-ui' by default) and flagging newly introduced families
 * for one-time official-documentation LUT calibration.
 *
 * @param {object} registry
 * @param {{ models?: string[], display_names?: Record<string, string>, quotas?: Record<string, object> }} swarmPayload
 * @param {{ providerFilter?: 'gemini-ui' | 'all' }} [options]
 */
export function importSwarmModelsCatalog(registry, swarmPayload = {}, options = {}) {
  const cloned = registry ? JSON.parse(JSON.stringify(registry)) : createDefaultCapabilityRegistry();
  if (!cloned.lutConfig) cloned.lutConfig = { providerFilter: 'gemini-ui' };
  if (options.providerFilter) cloned.lutConfig.providerFilter = options.providerFilter;
  const providerFilter = cloned.lutConfig.providerFilter || 'gemini-ui';

  const rawIds = Array.isArray(swarmPayload.models) ? swarmPayload.models : [];
  const displayNames =
    swarmPayload.display_names && typeof swarmPayload.display_names === 'object'
      ? swarmPayload.display_names
      : {};
  const quotas =
    swarmPayload.quotas && typeof swarmPayload.quotas === 'object' ? swarmPayload.quotas : {};

  const filteredIds = rawIds
    .filter((id) => typeof id === 'string' && id.trim().length > 0)
    .filter((id) => {
      if (providerFilter === 'all') return true;
      const disp = displayNames[id] || '';
      return /^(?:gemini-|orchestrator)/i.test(id) || /^(?:gemini\b|orchestrator\b)/i.test(disp);
    })
    .sort();

  const prevSorted = Array.isArray(cloned.availableRoster)
    ? [...cloned.availableRoster].sort()
    : [];
  const rosterChanged = filteredIds.join('|') !== prevSorted.join('|');

  cloned.availableRoster = filteredIds;
  if (!cloned.swarmDisplayNames) cloned.swarmDisplayNames = {};
  if (!cloned.liveQuotas) cloned.liveQuotas = {};
  if (!cloned.models) cloned.models = {};

  const discoveredFamilies = new Set();
  for (const slug of filteredIds) {
    const label = sanitizeModelSelectionName(displayNames[slug] || formatHumanModelLabel(slug));
    cloned.swarmDisplayNames[slug.toLowerCase()] = label;
    if (quotas[slug]) {
      cloned.liveQuotas[slug.toLowerCase()] = quotas[slug];
    }
    const baseFam = extractModelBaseFamily(label);
    if (baseFam) discoveredFamilies.add(baseFam);

    const modelKey = label.toLowerCase();
    if (!cloned.models[modelKey]) {
      const inferred = inferModelCapability(label);
      cloned.models[modelKey] = {
        slug,
        displayName: label,
        tier: inferred.tier,
        effort: inferred.effort,
        confidence: inferred.confidence,
        source: 'auto-discovered',
        samples: 0,
        avgDurationMs: 0,
        avgOutputTokens: 0,
        errorRate: 0
      };
    } else {
      cloned.models[modelKey].slug = slug;
      cloned.models[modelKey].displayName = label;
    }
  }

  const calibratedMap = cloned.lutCalibration?.calibratedFamilies || {};
  const uncalibratedFamilies = [...discoveredFamilies].filter((fam) => !calibratedMap[fam]);

  if (uncalibratedFamilies.length > 0) {
    cloned.pendingDocCalibration = {
      required: true,
      uncalibratedFamilies,
      detectedAtMs: Date.now(),
      notifiedAtMs: null
    };
  } else if (cloned.pendingDocCalibration) {
    cloned.pendingDocCalibration.required = false;
    cloned.pendingDocCalibration.uncalibratedFamilies = [];
  }

  cloned.updatedAtMs = Date.now();
  return {
    registry: cloned,
    rosterChanged,
    uncalibratedFamilies
  };
}

/**
 * Applies a one-time official-documentation calibration payload to `registry.lutCalibration`,
 * clearing `pendingDocCalibration` once all active roster families are covered.
 *
 * @param {object} registry
 * @param {{
 *   sourceDocs?: string[],
 *   calibratedFamilies?: Record<string, { roleClass: string, officialSummaryIt: string }>,
 *   archetypeTargets?: Record<string, { primaryUiModel: string, alternativeUiModel?: string, subagentModel: string, subagentType: string }>
 * }} calibrationPayload
 */
export function applyOfficialDocsCalibration(registry, calibrationPayload = {}) {
  const cloned = registry ? JSON.parse(JSON.stringify(registry)) : createDefaultCapabilityRegistry();
  if (!cloned.lutCalibration) {
    cloned.lutCalibration = {
      calibratedAtMs: null,
      sourceDocs: [],
      calibratedFamilies: {},
      archetypeTargets: {}
    };
  }

  if (Array.isArray(calibrationPayload.sourceDocs)) {
    cloned.lutCalibration.sourceDocs = calibrationPayload.sourceDocs;
  }
  if (calibrationPayload.calibratedFamilies && typeof calibrationPayload.calibratedFamilies === 'object') {
    cloned.lutCalibration.calibratedFamilies = {
      ...(cloned.lutCalibration.calibratedFamilies || {}),
      ...calibrationPayload.calibratedFamilies
    };
  }
  if (calibrationPayload.archetypeTargets && typeof calibrationPayload.archetypeTargets === 'object') {
    cloned.lutCalibration.archetypeTargets = {
      ...(cloned.lutCalibration.archetypeTargets || {}),
      ...calibrationPayload.archetypeTargets
    };
  }
  cloned.lutCalibration.calibratedAtMs = Date.now();

  const activeFamilies = new Set(
    (cloned.availableRoster || []).map((slug) =>
      extractModelBaseFamily(cloned.swarmDisplayNames?.[slug.toLowerCase()] || slug)
    )
  );
  const remainingUncalibrated = [...activeFamilies].filter(
    (fam) => fam && !cloned.lutCalibration.calibratedFamilies[fam]
  );

  cloned.pendingDocCalibration = {
    required: remainingUncalibrated.length > 0,
    uncalibratedFamilies: remainingUncalibrated,
    detectedAtMs: remainingUncalibrated.length > 0 ? Date.now() : null,
    notifiedAtMs: null
  };
  cloned.pendingRosterRefresh = {
    required: false,
    detectedAtMs: null,
    notifiedAtMs: null
  };
  cloned.updatedAtMs = Date.now();
  return cloned;
}

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

export const REGISTRY_SCHEMA_VERSION = 1;
export const CALIBRATION_MIN_SAMPLES = 5;

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

export function createDefaultCapabilityRegistry() {
  return {
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    updatedAtMs: 0,
    builtinChecksum: null,
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
  const clean = typeof modelName === 'string' ? modelName.trim() : '';
  const samples = typeof metrics.samples === 'number' ? metrics.samples : 0;
  const avgDurationMs = typeof metrics.avgDurationMs === 'number' ? metrics.avgDurationMs : 0;
  const avgOutputTokens = typeof metrics.avgOutputTokens === 'number' ? metrics.avgOutputTokens : 0;
  const errorRate = typeof metrics.errorRate === 'number' ? metrics.errorRate : 0;

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
  /\b(?:fai\s+un\s+piano|progett\w+|architettur\w+|nuova\s+funzionalit[aà]|nuovo\s+(?:plugin|modulo|sistema|flusso|metodo)|rifattorizz\w+|refactor\w*|struttur\w+|impost\w+|organizz\w+|auto[- ]?apprendimento|come\s+conviene|bilanci\w+|ottimizz\w+\s+il\s+consumo|tutt[ei]\s+(?:le|i)\s+(?:regole|skill|plugin|file)|pro\s+e\s+contro|vantaggi\s+e\s+svantaggi|trade[- ]?off|bivio|compromess\w+|race\s+condition|regression\w+|multi[- ]?file|strategi\w+\s+conviene|approcci\w+\s+miglior\w+|future[- ]?proof)\b/i;

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
  if (!activeUiModel || typeof activeUiModel !== 'string' || !activeUiModel.trim()) {
    return { mismatchType: 'NONE', uiModelTier: null, recommendation: null };
  }

  const reg = registry || createDefaultCapabilityRegistry();
  const key = activeUiModel.trim().toLowerCase();
  const known = reg.models?.[key];
  const uiModelTier = known ? known.tier : inferModelCapability(activeUiModel).tier;

  if (uiModelTier === 'HIGH' && promptTier === 'LOW') {
    return {
      mismatchType: 'OVERPROVISIONED_UI_MODEL',
      uiModelTier,
      recommendation: `Modello UI '${activeUiModel}' (HIGH) sovradimensionato per un task LOW: passa a Flash/Low o delega a flash_lite per risparmiare quota e ~20s.`
    };
  }

  if (uiModelTier === 'LOW' && promptTier === 'HIGH') {
    return {
      mismatchType: 'UNDERPROVISIONED_UI_MODEL',
      uiModelTier,
      recommendation: `Modello UI '${activeUiModel}' (LOW) sottodimensionato per un task architetturale HIGH: delega il ragionamento a invoke_subagent con Model: 'pro'.`
    };
  }

  return { mismatchType: 'NONE', uiModelTier, recommendation: null };
}

/**
 * Classifies a prompt in < 0.5ms into LOW (T1_INSTANT), MEDIUM (T2_BALANCED), or HIGH (T3_DEEP),
 * resolving the optimal subagent model, effort level, operational budget, and UI model alignment.
 *
 * @param {unknown} rawPrompt
 * @param {{ registry?: object, activeUiModel?: string | null }} [options]
 */
export function classifyPromptRoute(rawPrompt, options = {}) {
  const safeRaw = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  const clean = normalizeRouterPrompt(safeRaw);
  const reg = options.registry || createDefaultCapabilityRegistry();
  const wordCount = clean ? clean.split(/\s+/).length : 0;

  const buildResult = (tier, score, reason, signals) => {
    const profile = COGNITIVE_PROFILES[tier] || COGNITIVE_PROFILES.MEDIUM;
    const subagentModel = resolveSafeSubagentModel(tier, reg);
    const alignment = evaluateUiModelAlignment(tier, options.activeUiModel, reg);
    return {
      tier,
      profileId: profile.profileId,
      effort: profile.effort,
      subagentModel,
      maxToolTurns: profile.maxToolTurns,
      recommendedSubagents: profile.recommendedSubagents,
      score,
      reason,
      signals,
      alignment
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
    const durationMs =
      lastUserTs && endTs && endTs > lastUserTs && endTs - lastUserTs <= 300000
        ? endTs - lastUserTs
        : entry.avgDurationMs || 25000;

    const n = (entry.samples || 0) + 1;
    entry.samples = n;
    entry.avgDurationMs = Math.round(((entry.avgDurationMs || durationMs) * (n - 1) + durationMs) / n);
    if (turnOutputTokens > 0) {
      entry.avgOutputTokens = Math.round(
        ((entry.avgOutputTokens || turnOutputTokens) * (n - 1) + turnOutputTokens) / n
      );
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

    // 1. Probe <USER_SETTINGS_CHANGE> for new models and new effort/thinking modes
    if (content.includes('<USER_SETTINGS_CHANGE>')) {
      const settingsBlocks = content.matchAll(/<USER_SETTINGS_CHANGE>([\s\S]*?)<\/USER_SETTINGS_CHANGE>/gi);
      for (const match of settingsBlocks) {
        const block = match[1] || '';

        const modelMatch = block.match(/Model Selection`?\s+from\s+.*?\s+to\s+`?([^\r\n`]+?)`?\.?(?:\r|\n|$)/i);
        if (modelMatch && modelMatch[1]) {
          const rawModel = modelMatch[1].trim().replace(/\.$/, '').replace(/^`|`$/g, '');
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
                avgDurationMs: inferred.tier === 'HIGH' ? 60000 : inferred.tier === 'LOW' ? 14000 : 28000,
                avgOutputTokens: inferred.tier === 'HIGH' ? 1600 : inferred.tier === 'LOW' ? 400 : 900,
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
          const rawMode = modeMatch[1].trim().replace(/\.$/, '').replace(/^`|`$/g, '');
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
            avgDurationMs: inferred.tier === 'HIGH' ? 60000 : inferred.tier === 'LOW' ? 14000 : 28000,
            avgOutputTokens: inferred.tier === 'HIGH' ? 1600 : inferred.tier === 'LOW' ? 400 : 900,
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
  return {
    registry: base,
    newlyDiscoveredModels,
    newlyDiscoveredModes,
    recalibratedModels
  };
}

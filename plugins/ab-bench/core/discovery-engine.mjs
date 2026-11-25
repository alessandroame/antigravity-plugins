/**
 * Headless Oracle-Guided Discovery Loop Engine.
 * Implements domain-agnostic mutation contracts, Jaccard hypothesis deduplication,
 * anti-bias variant sanitization, deterministic SHA-256 blind batching, 4-oracle
 * blocking gates, multi-objective Pareto ranking, 5-condition composite stop policy,
 * and ~600px Semantic Drill-Down verdict rendering.
 *
 * Strictly headless: zero filesystem, OS, DOM, or network dependencies.
 */

import { createHash, randomUUID } from 'node:crypto';

export const SCHEMA_VERSION = '1.0.0';
export const DEFAULT_MAX_DUPLICATE_RATE = 0.7;
export const DEFAULT_MIN_IMPROVEMENT_DELTA = 0.05;
export const DEFAULT_TARGET_BASELINE_MARGIN = 0.1;

export const EXIT_REASONS = Object.freeze({
  CONTINUE: 'CONTINUE',
  PARETO_CONVERGED: 'PARETO_CONVERGED',
  TARGET_SATISFICED: 'TARGET_SATISFICED',
  RESOURCE_BUDGET_REACHED: 'RESOURCE_BUDGET_REACHED',
  YIELD_COLLAPSE: 'YIELD_COLLAPSE',
  WALL_CLOCK_CAP: 'WALL_CLOCK_CAP'
});

export const DISCOVERY_PROFILES = Object.freeze({
  quick: Object.freeze({
    profile: 'quick',
    maxWallClockMinutes: 20,
    maxWaves: 2,
    maxVariants: 4,
    maxSubagentCalls: 12,
    maxTotalTokens: 300000,
    stagnationWaves: 1,
    targetSatisficingCount: 1,
    yieldCollapseWaves: 2,
    maxDuplicateRate: DEFAULT_MAX_DUPLICATE_RATE,
    minImprovementDelta: DEFAULT_MIN_IMPROVEMENT_DELTA,
    targetBaselineMargin: DEFAULT_TARGET_BASELINE_MARGIN
  }),
  deep: Object.freeze({
    profile: 'deep',
    maxWallClockMinutes: 60,
    maxWaves: 4,
    maxVariants: 8,
    maxSubagentCalls: 28,
    maxTotalTokens: 800000,
    stagnationWaves: 2,
    targetSatisficingCount: 2,
    yieldCollapseWaves: 2,
    maxDuplicateRate: DEFAULT_MAX_DUPLICATE_RATE,
    minImprovementDelta: DEFAULT_MIN_IMPROVEMENT_DELTA,
    targetBaselineMargin: DEFAULT_TARGET_BASELINE_MARGIN
  }),
  overnight: Object.freeze({
    profile: 'overnight',
    maxWallClockMinutes: 120,
    maxWaves: 6,
    maxVariants: 12,
    maxSubagentCalls: 48,
    maxTotalTokens: 1500000,
    stagnationWaves: 2,
    targetSatisficingCount: 2,
    yieldCollapseWaves: 2,
    maxDuplicateRate: DEFAULT_MAX_DUPLICATE_RATE,
    minImprovementDelta: DEFAULT_MIN_IMPROVEMENT_DELTA,
    targetBaselineMargin: DEFAULT_TARGET_BASELINE_MARGIN
  })
});

export const MUTATION_ARCHETYPES = Object.freeze([
  Object.freeze({
    id: 'distracted-user',
    labelIt: 'Utente Distratto / Avversario Cognitivo',
    mechanism:
      'Inspects only rendered outputs or screens under a strict 3-5s comprehension budget without reading source code.'
  }),
  Object.freeze({
    id: 'extreme-abolitionist',
    labelIt: 'Abolizionista a Vincoli Estremi',
    mechanism:
      'Forces a 40-50% reduction in visible surface, controls, or parameters while proving zero decision-information loss.'
  }),
  Object.freeze({
    id: 'domain-skeptic',
    labelIt: 'Scettico / Fuzzer di Dominio',
    mechanism:
      'Challenges current heuristics against a minimal null model and generates extreme synthetic edge cases against real telemetry.'
  })
]);

export const ORACLE_STACK = Object.freeze([
  Object.freeze({
    id: 'empirical-data',
    labelIt: '1. Oracolo Empirico (Dati Reali)',
    blocking: true,
    rejects: 'Formulas or heuristics that fail offline backtest/hindcast against baseline on real data.'
  }),
  Object.freeze({
    id: 'invariance-fuzzing',
    labelIt: '2. Oracolo di Invarianza & Fuzzing',
    blocking: true,
    rejects: 'Cross-view contradictions, partial-input failures, or pathological synthetic edge-case breaks.'
  }),
  Object.freeze({
    id: 'blind-cognitive',
    labelIt: '3. Oracolo Cognitivo Cieco',
    blocking: true,
    rejects: 'Interfaces or outputs that pass technical layout checks yet confuse a fresh unprimed observer.'
  }),
  Object.freeze({
    id: 'technical-ab-bench',
    labelIt: '4. Oracolo Tecnico & Cieco (/ab-bench)',
    blocking: true,
    rejects: 'Test regressions, tampered tests, DOM/SVG overlap violations, or 5-Finger presentation bias.'
  })
]);

export const DEFAULT_OBJECTIVES = Object.freeze([
  Object.freeze({ key: 'empiricalScore', direction: 'higher' }),
  Object.freeze({ key: 'invarianceRate', direction: 'higher' }),
  Object.freeze({ key: 'cognitiveScore', direction: 'higher' }),
  Object.freeze({ key: 'fiveFingerScore', direction: 'higher' }),
  Object.freeze({ key: 'complexityCost', direction: 'lower' })
]);

const HARDCODED_USER_PATH_RX = /[cC]:[\\/]+Users[\\/]+(?!<)[a-zA-Z0-9._-]+[\\/]/;

function normalizeString(val) {
  return typeof val === 'string' ? val.trim() : '';
}

function normalizeScopeList(rawScope) {
  if (Array.isArray(rawScope)) {
    return rawScope.map((item) => normalizeString(item).replace(/\\/g, '/')).filter(Boolean);
  }
  if (typeof rawScope === 'string') {
    return rawScope
      .split(',')
      .map((item) => item.trim().replace(/\\/g, '/'))
      .filter(Boolean);
  }
  return [];
}

/**
 * Builds a normalized discovery-brief contract from user parameters.
 * @param {object} [input]
 * @returns {object}
 */
export function createDiscoveryBrief(input = {}) {
  const rawProfile = normalizeString(input.profile || 'deep').toLowerCase();
  const baseProfile = DISCOVERY_PROFILES[rawProfile] || DISCOVERY_PROFILES.deep;
  const overrides =
    input.stopPolicyOverrides && typeof input.stopPolicyOverrides === 'object'
      ? input.stopPolicyOverrides
      : {};

  const stopPolicy = {
    ...baseProfile,
    ...overrides,
    profile: DISCOVERY_PROFILES[rawProfile] ? rawProfile : rawProfile || 'deep'
  };

  const goal = normalizeString(input.goal);
  const targetScope = normalizeScopeList(input.targetScope);
  const createdAt = normalizeString(input.createdAt) || new Date().toISOString();
  const briefId =
    normalizeString(input.briefId) ||
    createHash('sha256')
      .update(`${goal}::${targetScope.join('|')}::${stopPolicy.profile}::${createdAt}`)
      .digest('hex')
      .slice(0, 12);

  const baselineInput = input.baseline && typeof input.baseline === 'object' ? input.baseline : {};
  const baselineMetrics =
    baselineInput.metrics && typeof baselineInput.metrics === 'object'
      ? { ...baselineInput.metrics }
      : {};
  if (!Number.isFinite(baselineMetrics.complexityCost)) {
    baselineMetrics.complexityCost = Number.isFinite(baselineInput.complexityCost)
      ? baselineInput.complexityCost
      : 1;
  }

  const objectives =
    Array.isArray(input.objectives) && input.objectives.length > 0
      ? input.objectives.map((obj) => ({
          key: normalizeString(obj.key),
          direction: obj.direction === 'lower' ? 'lower' : 'higher'
        }))
      : DEFAULT_OBJECTIVES.map((obj) => ({ ...obj }));

  const oracles =
    Array.isArray(input.oracles) && input.oracles.length > 0
      ? input.oracles.map((ora) => ({ ...ora }))
      : ORACLE_STACK.map((ora) => ({ ...ora }));

  const mutators =
    Array.isArray(input.mutators) && input.mutators.length > 0
      ? input.mutators.map((mut) => ({ ...mut }))
      : MUTATION_ARCHETYPES.map((mut) => ({ ...mut }));

  return {
    schemaVersion: SCHEMA_VERSION,
    briefId,
    createdAt,
    goal,
    targetScope,
    profile: stopPolicy.profile,
    stopPolicy,
    baseline: {
      id: normalizeString(baselineInput.id) || 'baseline',
      metrics: baselineMetrics,
      complexityCost: baselineMetrics.complexityCost
    },
    objectives,
    oracles,
    mutators
  };
}

/**
 * Validates a discovery-brief contract for structural integrity and path portability.
 * @param {object} brief
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDiscoveryBrief(brief) {
  const errors = [];
  if (!brief || typeof brief !== 'object') {
    return { valid: false, errors: ['Brief must be a non-null object.'] };
  }

  if (!normalizeString(brief.goal)) {
    errors.push('Brief goal must be a non-empty string.');
  }

  const profileKey = normalizeString(brief.profile).toLowerCase();
  if (!DISCOVERY_PROFILES[profileKey]) {
    errors.push(`Unknown profile '${brief.profile}'. Allowed: quick, deep, overnight.`);
  }

  if (!Array.isArray(brief.targetScope) || brief.targetScope.length === 0) {
    errors.push('targetScope must contain at least one relative target path.');
  } else {
    for (const p of brief.targetScope) {
      if (typeof p !== 'string' || !p.trim()) {
        errors.push('targetScope entries must be non-empty strings.');
      } else if (HARDCODED_USER_PATH_RX.test(p)) {
        errors.push(`targetScope contains non-portable hardcoded user path: '${p}'.`);
      }
    }
  }

  const policy = brief.stopPolicy;
  if (!policy || typeof policy !== 'object') {
    errors.push('stopPolicy must be an object.');
  } else {
    const positiveIntFields = [
      'maxWallClockMinutes',
      'maxWaves',
      'maxVariants',
      'maxSubagentCalls',
      'maxTotalTokens',
      'stagnationWaves',
      'targetSatisficingCount',
      'yieldCollapseWaves'
    ];
    for (const field of positiveIntFields) {
      if (!Number.isFinite(policy[field]) || policy[field] <= 0) {
        errors.push(`stopPolicy.${field} must be a positive number.`);
      }
    }
    if (
      !Number.isFinite(policy.maxDuplicateRate) ||
      policy.maxDuplicateRate <= 0 ||
      policy.maxDuplicateRate > 1
    ) {
      errors.push('stopPolicy.maxDuplicateRate must be in (0, 1].');
    }
    if (!Number.isFinite(policy.minImprovementDelta) || policy.minImprovementDelta < 0) {
      errors.push('stopPolicy.minImprovementDelta must be >= 0.');
    }
    if (!Number.isFinite(policy.targetBaselineMargin) || policy.targetBaselineMargin < 0) {
      errors.push('stopPolicy.targetBaselineMargin must be >= 0.');
    }
  }

  return { valid: errors.length === 0, errors };
}

function tokenizeClaim(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u017f\s]+/gi, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 2);
}

function buildTwoShingles(tokens) {
  const shingles = new Set();
  if (tokens.length === 0) return shingles;
  if (tokens.length === 1) {
    shingles.add(tokens[0]);
    return shingles;
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    shingles.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return shingles;
}

function computeJaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Deduplicates candidate hypotheses against prior waves and earlier entries in the current wave
 * using normalized 2-shingle Jaccard similarity.
 * @param {Array<object|string>} hypotheses
 * @param {Array<object|string>} [priorHypotheses]
 * @param {number} [maxDuplicateRate]
 * @returns {object}
 */
export function computeHypothesisDuplicateRate(
  hypotheses = [],
  priorHypotheses = [],
  maxDuplicateRate = DEFAULT_MAX_DUPLICATE_RATE
) {
  const list = Array.isArray(hypotheses) ? hypotheses : [];
  const prior = Array.isArray(priorHypotheses) ? priorHypotheses : [];
  const threshold = Number.isFinite(maxDuplicateRate) ? maxDuplicateRate : DEFAULT_MAX_DUPLICATE_RATE;

  const extractClaim = (entry) => {
    if (typeof entry === 'string') return entry;
    if (!entry || typeof entry !== 'object') return '';
    return [entry.claim, entry.hypothesis, entry.summary, entry.title].filter(Boolean).join(' ');
  };

  const seenShingles = prior.map((item) => buildTwoShingles(tokenizeClaim(extractClaim(item))));
  const uniqueHypotheses = [];
  const duplicateIds = [];
  let duplicates = 0;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const claim = extractClaim(item);
    const shingles = buildTwoShingles(tokenizeClaim(claim));
    const itemId =
      item && typeof item === 'object' && item.id ? String(item.id) : `hyp-${i + 1}`;

    let isDuplicate = false;
    for (const prev of seenShingles) {
      if (computeJaccard(shingles, prev) >= threshold) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      duplicates++;
      duplicateIds.push(itemId);
    } else {
      uniqueHypotheses.push(item);
      seenShingles.push(shingles);
    }
  }

  const total = list.length;
  const duplicateRate = total > 0 ? Number((duplicates / total).toFixed(4)) : 0;

  return {
    total,
    duplicates,
    uniqueHypotheses,
    duplicateIds,
    duplicateRate
  };
}

/**
 * Strips plugin banners, conversation links, mutator archetypes, worktree/branch
 * identifiers, and persuasive author metadata lines before blind evaluation.
 * @param {string} rawText
 * @returns {string}
 */
export function sanitizeDiscoveryText(rawText) {
  if (typeof rawText !== 'string') return '';
  return rawText
    .replace(
      /^>\s*\[!(?:IMPORTANT|NOTE)\]\r?\n>\s*(?:\*\*)?(?:MODALITÀ SKIZZO ATTIVA|VERDETTO AB-BENCH|DISCOVERY-LOOP)[^\r\n]*\r?\n+/gim,
      ''
    )
    .replace(/\[[^\]]*\]\(conversation:\/\/[a-zA-Z0-9_-]+\)/g, '[Agente]')
    .replace(/conversation:\/\/[a-zA-Z0-9_-]+/g, '[riferimento-rimosso]')
    .replace(/\bMODALITÀ SKIZZO ATTIVA\b/gi, 'MODALITÀ ANALISI')
    .replace(/\bVERDETTO AB-BENCH\b/gi, 'VALUTAZIONE')
    .replace(/\bDISCOVERY-LOOP\b/gi, 'ESPLORAZIONE')
    .replace(/\b(?:DUAL|TRI|QUAD|MULTI)-TRACK\b/gi, 'ANALISI STRUTTURATA')
    .replace(
      /\b(?:Utente\s+Distratto(?:\s*\/\s*Avversario\s+Cognitivo)?|Abolizionista(?:\s+a\s+Vincoli\s+Estremi)?|Scettico(?:\s*\/\s*Fuzzer(?:\s+di\s+Dominio)?)?|distracted-user|extreme-abolitionist|domain-skeptic)\b/gi,
      'Prospettiva'
    )
    .replace(/\bworktree[-_/a-zA-Z0-9.]*/gi, '[workspace-isolato]')
    .replace(/\bmutator[-_a-zA-Z0-9]+/gi, '[variante]')
    .replace(/\bbranch\s*[:=]\s*[^\s,;)]+/gi, 'branch: [anonimo]')
    .replace(
      /^(?:Autore|Mutatore|Archetipo|Branch|Worktree|Razionale\s+persuasivo)\s*:.*$/gim,
      ''
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sanitizes a variant record into a blind payload stripping identity and persuasive metadata.
 * @param {object} variant
 * @returns {object}
 */
export function sanitizeVariantForBlindJudge(variant) {
  if (!variant || typeof variant !== 'object') {
    throw new TypeError('variant must be a non-null object.');
  }
  const rendered = Array.isArray(variant.renderedArtifacts)
    ? variant.renderedArtifacts.map((art) => {
        if (typeof art === 'string') return sanitizeDiscoveryText(art);
        if (art && typeof art === 'object') {
          return {
            viewport: normalizeString(art.viewport),
            caption: sanitizeDiscoveryText(art.caption || ''),
            content: sanitizeDiscoveryText(art.content || '')
          };
        }
        return art;
      })
    : [];

  const signals =
    variant.measuredSignals && typeof variant.measuredSignals === 'object'
      ? { ...variant.measuredSignals }
      : variant.metrics && typeof variant.metrics === 'object'
        ? { ...variant.metrics }
        : {};

  return {
    summary: sanitizeDiscoveryText(variant.summary || ''),
    diffSummary: sanitizeDiscoveryText(variant.diffSummary || ''),
    renderedArtifacts: rendered,
    measuredSignals: signals
  };
}

function indexToAlphaLabel(idx) {
  let n = idx;
  let suffix = '';
  do {
    suffix = String.fromCharCode(65 + (n % 26)) + suffix;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Candidato ${suffix}`;
}

/**
 * Deterministically assigns anonymous labels ('Candidato A', 'Candidato B', ...) to
 * variants using SHA-256 hashing over `seed::variant.id`.
 * @param {Array<object>} variants
 * @param {string} [seed]
 * @returns {object}
 */
export function createBlindVariantBatch(variants, seed = randomUUID()) {
  if (!Array.isArray(variants) || variants.length === 0) {
    throw new TypeError('variants must be a non-empty array.');
  }

  const seenIds = new Set();
  const cleanSeed = String(seed || randomUUID());

  const keyed = variants.map((variant) => {
    const id = variant && typeof variant.id === 'string' ? variant.id.trim() : '';
    if (!id) {
      throw new TypeError('Every variant must have a non-empty string id.');
    }
    if (seenIds.has(id)) {
      throw new RangeError(`Duplicate variant id '${id}' in blind batch.`);
    }
    seenIds.add(id);
    const sortDigest = createHash('sha256')
      .update(`${cleanSeed}::${id}`)
      .digest('hex');
    return { id, variant, sortDigest };
  });

  keyed.sort((a, b) => a.sortDigest.localeCompare(b.sortDigest));

  const blindCandidates = [];
  const revealMap = {};

  keyed.forEach((entry, idx) => {
    const blindLabel = indexToAlphaLabel(idx);
    revealMap[blindLabel] = entry.id;
    blindCandidates.push(
      Object.freeze({
        blindLabel,
        sanitizedPayload: sanitizeVariantForBlindJudge(entry.variant)
      })
    );
  });

  return Object.freeze({
    seed: cleanSeed,
    blindCandidates: Object.freeze(blindCandidates),
    revealMap: Object.freeze(revealMap)
  });
}

/**
 * Evaluates a variant against all blocking oracles and technical sub-invariants.
 * @param {object} variant
 * @param {object} [brief]
 * @returns {object}
 */
export function evaluateOracleGate(variant, brief = {}) {
  const variantId = normalizeString(variant?.id) || 'unknown-variant';
  const activeOracles =
    Array.isArray(brief?.oracles) && brief.oracles.length > 0 ? brief.oracles : ORACLE_STACK;
  const oracleResults = variant?.oracles || variant?.oracleResults || {};
  const failedBlockingOracles = [];
  const rejectionReasons = [];
  let passedOracleCount = 0;

  for (const oracle of activeOracles) {
    const entry = oracleResults[oracle.id];
    const isPassed =
      typeof entry === 'boolean'
        ? entry
        : entry && typeof entry === 'object'
          ? entry.passed === true
          : false;

    if (isPassed) {
      passedOracleCount++;
    } else if (oracle.blocking !== false) {
      failedBlockingOracles.push(oracle.id);
      const detail =
        entry && typeof entry === 'object' && entry.reason
          ? String(entry.reason)
          : `Failed blocking oracle '${oracle.id}'`;
      rejectionReasons.push(`${oracle.id}: ${detail}`);
    }
  }

  const tech = variant?.technicalChecks || variant?.measuredSignals || {};
  if (tech.testsPassed === false) {
    if (!failedBlockingOracles.includes('technical-ab-bench')) {
      failedBlockingOracles.push('technical-ab-bench');
    }
    rejectionReasons.push('technical-ab-bench: unit tests failed (testsPassed === false)');
  }
  if (Number.isFinite(tech.probeViolations) && tech.probeViolations > 0) {
    if (!failedBlockingOracles.includes('technical-ab-bench')) {
      failedBlockingOracles.push('technical-ab-bench');
    }
    rejectionReasons.push(`technical-ab-bench: ${tech.probeViolations} UI geometry probe violations`);
  }
  if (Number.isFinite(tech.diffTamperCount) && tech.diffTamperCount > 0) {
    if (!failedBlockingOracles.includes('technical-ab-bench')) {
      failedBlockingOracles.push('technical-ab-bench');
    }
    rejectionReasons.push(`technical-ab-bench: ${tech.diffTamperCount} tampered or faux test findings`);
  }
  if (Number.isFinite(tech.invarianceFailures) && tech.invarianceFailures > 0) {
    if (!failedBlockingOracles.includes('invariance-fuzzing')) {
      failedBlockingOracles.push('invariance-fuzzing');
    }
    rejectionReasons.push(`invariance-fuzzing: ${tech.invarianceFailures} invariance failures`);
  }

  const passedAllBlocking = failedBlockingOracles.length === 0 && rejectionReasons.length === 0;

  return {
    variantId,
    passedAllBlocking,
    failedBlockingOracles,
    passedOracleCount,
    totalOracleCount: activeOracles.length,
    rejected: !passedAllBlocking,
    rejectionReasons
  };
}

function getMetricValue(candidate, key) {
  if (!candidate || typeof candidate !== 'object') return undefined;
  if (candidate.metrics && Number.isFinite(candidate.metrics[key])) {
    return candidate.metrics[key];
  }
  if (Number.isFinite(candidate[key])) {
    return candidate[key];
  }
  return undefined;
}

/**
 * Returns true iff candA is at least as good as candB on all shared objectives
 * and strictly better on at least one objective.
 * @param {object} candA
 * @param {object} candB
 * @param {Array<{ key: string, direction: 'higher' | 'lower' }>} [objectives]
 * @returns {boolean}
 */
export function dominates(candA, candB, objectives = DEFAULT_OBJECTIVES) {
  const objs = Array.isArray(objectives) && objectives.length > 0 ? objectives : DEFAULT_OBJECTIVES;
  let strictlyBetter = false;
  let comparedCount = 0;

  for (const obj of objs) {
    const valA = getMetricValue(candA, obj.key);
    const valB = getMetricValue(candB, obj.key);
    if (!Number.isFinite(valA) || !Number.isFinite(valB)) continue;
    comparedCount++;

    if (obj.direction === 'lower') {
      if (valA > valB) return false;
      if (valA < valB) strictlyBetter = true;
    } else {
      if (valA < valB) return false;
      if (valA > valB) strictlyBetter = true;
    }
  }

  return comparedCount > 0 && strictlyBetter;
}

function computeImprovementOverBaseline(candidate, objectives, baseline) {
  if (!baseline || typeof baseline !== 'object') return 0;
  const baseMetrics = baseline.metrics && typeof baseline.metrics === 'object' ? baseline.metrics : baseline;
  let totalGain = 0;
  let count = 0;

  for (const obj of objectives) {
    const cVal = getMetricValue(candidate, obj.key);
    const bVal = Number.isFinite(baseMetrics[obj.key]) ? baseMetrics[obj.key] : undefined;
    if (!Number.isFinite(cVal) || !Number.isFinite(bVal)) continue;
    const denom = Math.abs(bVal) > 1e-9 ? Math.abs(bVal) : 1;
    const rawDelta = obj.direction === 'lower' ? bVal - cVal : cVal - bVal;
    totalGain += rawDelta / denom;
    count++;
  }

  return count > 0 ? Number((totalGain / count).toFixed(4)) : 0;
}

function computeCrowdingDistances(layer, objectives) {
  const distances = new Map();
  for (const item of layer) {
    distances.set(item.id, 0);
  }
  if (layer.length <= 2) {
    for (const item of layer) {
      distances.set(item.id, Infinity);
    }
    return distances;
  }

  for (const obj of objectives) {
    const withVal = layer
      .map((item) => ({ id: item.id, val: getMetricValue(item, obj.key) }))
      .filter((entry) => Number.isFinite(entry.val))
      .sort((a, b) => a.val - b.val);

    if (withVal.length <= 2) continue;
    const minVal = withVal[0].val;
    const maxVal = withVal[withVal.length - 1].val;
    const span = maxVal - minVal;

    distances.set(withVal[0].id, Infinity);
    distances.set(withVal[withVal.length - 1].id, Infinity);

    if (span <= 0) continue;
    for (let i = 1; i < withVal.length - 1; i++) {
      const prevDist = distances.get(withVal[i].id);
      if (!Number.isFinite(prevDist)) continue;
      const contrib = (withVal[i + 1].val - withVal[i - 1].val) / span;
      distances.set(withVal[i].id, prevDist + contrib);
    }
  }

  return distances;
}

/**
 * Computes iterative non-dominated Pareto layers, crowding diversity, and baseline delta.
 * @param {Array<object>} candidates
 * @param {Array<{ key: string, direction: 'higher' | 'lower' }>} [objectives]
 * @param {object|null} [baseline]
 * @returns {object}
 */
export function computeParetoFrontier(
  candidates = [],
  objectives = DEFAULT_OBJECTIVES,
  baseline = null
) {
  const objs = Array.isArray(objectives) && objectives.length > 0 ? objectives : DEFAULT_OBJECTIVES;
  const eligible = (Array.isArray(candidates) ? candidates : []).filter(
    (c) => c && typeof c === 'object' && c.rejected !== true
  );

  if (eligible.length === 0) {
    return {
      frontier: [],
      dominated: [],
      ranked: [],
      frontierIds: [],
      bestImprovementOverBaseline: 0
    };
  }

  let remaining = eligible.map((c, idx) => ({
    ...c,
    id: normalizeString(c.id) || `cand-${idx + 1}`
  }));

  const ranked = [];
  let paretoRank = 1;

  while (remaining.length > 0) {
    const currentLayer = [];
    const nextRemaining = [];

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let isDominated = false;
      for (let j = 0; j < remaining.length; j++) {
        if (i === j) continue;
        if (dominates(remaining[j], candidate, objs)) {
          isDominated = true;
          break;
        }
      }
      if (isDominated) {
        nextRemaining.push(candidate);
      } else {
        currentLayer.push(candidate);
      }
    }

    // Safety guard if cyclic numerical anomaly occurs
    if (currentLayer.length === 0) {
      currentLayer.push(...nextRemaining);
      nextRemaining.length = 0;
    }

    const crowding = computeCrowdingDistances(currentLayer, objs);
    const enrichedLayer = currentLayer.map((item) => {
      const improvementOverBaseline = computeImprovementOverBaseline(item, objs, baseline);
      const cd = crowding.get(item.id) ?? 0;
      return {
        ...item,
        paretoRank,
        crowdingDistance: Number.isFinite(cd) ? Number(cd.toFixed(4)) : Infinity,
        improvementOverBaseline
      };
    });

    enrichedLayer.sort((a, b) => {
      if (b.improvementOverBaseline !== a.improvementOverBaseline) {
        return b.improvementOverBaseline - a.improvementOverBaseline;
      }
      if (b.crowdingDistance !== a.crowdingDistance) {
        if (!Number.isFinite(b.crowdingDistance)) return 1;
        if (!Number.isFinite(a.crowdingDistance)) return -1;
        return b.crowdingDistance - a.crowdingDistance;
      }
      return a.id.localeCompare(b.id);
    });

    ranked.push(...enrichedLayer);
    remaining = nextRemaining;
    paretoRank++;
  }

  const frontier = ranked.filter((item) => item.paretoRank === 1);
  const dominated = ranked.filter((item) => item.paretoRank > 1);
  const frontierIds = frontier.map((item) => item.id);
  const bestImprovementOverBaseline = frontier.reduce(
    (best, item) => (item.improvementOverBaseline > best ? item.improvementOverBaseline : best),
    0
  );

  return {
    frontier,
    dominated,
    ranked,
    frontierIds,
    bestImprovementOverBaseline
  };
}

/**
 * Evaluates the 5-condition composite stop policy (OR logic).
 * Wall-clock time is only a configurable safety cap, never a minimum floor.
 * @param {object} [runState]
 * @param {object} [stopPolicy]
 * @returns {object}
 */
export function evaluateStopCondition(runState = {}, stopPolicy = DISCOVERY_PROFILES.deep) {
  const policy = { ...DISCOVERY_PROFILES.deep, ...(stopPolicy || {}) };
  const elapsedMs = Number.isFinite(runState.elapsedMs) ? runState.elapsedMs : 0;
  const wavesCompleted = Number.isFinite(runState.wavesCompleted) ? runState.wavesCompleted : 0;
  const variantsPrototyped = Number.isFinite(runState.variantsPrototyped)
    ? runState.variantsPrototyped
    : 0;
  const subagentCalls = Number.isFinite(runState.subagentCalls) ? runState.subagentCalls : 0;
  const totalTokens = Number.isFinite(runState.totalTokens) ? runState.totalTokens : 0;
  const consecutiveStagnantWaves = Number.isFinite(runState.consecutiveStagnantWaves)
    ? runState.consecutiveStagnantWaves
    : 0;
  const consecutiveZeroYieldWaves = Number.isFinite(runState.consecutiveZeroYieldWaves)
    ? runState.consecutiveZeroYieldWaves
    : 0;
  const satisficingOrthogonalCount = Number.isFinite(runState.satisficingOrthogonalCount)
    ? runState.satisficingOrthogonalCount
    : 0;
  const lastWaveDuplicateRate = Number.isFinite(runState.lastWaveDuplicateRate)
    ? runState.lastWaveDuplicateRate
    : 0;
  const lastWaveHypothesisCount = Number.isFinite(runState.lastWaveHypothesisCount)
    ? runState.lastWaveHypothesisCount
    : 0;

  const maxWallClockMs = policy.maxWallClockMinutes * 60000;
  const remainingBudget = {
    waves: Math.max(0, policy.maxWaves - wavesCompleted),
    variants: Math.max(0, policy.maxVariants - variantsPrototyped),
    subagentCalls: Math.max(0, policy.maxSubagentCalls - subagentCalls),
    tokens: Math.max(0, policy.maxTotalTokens - totalTokens),
    wallClockMs: Math.max(0, maxWallClockMs - elapsedMs)
  };

  const triggeredLimits = [];
  if (wavesCompleted >= policy.maxWaves) triggeredLimits.push('maxWaves');
  if (variantsPrototyped >= policy.maxVariants) triggeredLimits.push('maxVariants');
  if (subagentCalls >= policy.maxSubagentCalls) triggeredLimits.push('maxSubagentCalls');
  if (totalTokens >= policy.maxTotalTokens) triggeredLimits.push('maxTotalTokens');

  if (elapsedMs >= maxWallClockMs) {
    return {
      shouldStop: true,
      exitReason: EXIT_REASONS.WALL_CLOCK_CAP,
      triggeredLimits: ['maxWallClockMinutes'],
      reasonIt: `Raggiunto il tetto temporale di sicurezza (${policy.maxWallClockMinutes} minuti).`,
      remainingBudget
    };
  }

  if (triggeredLimits.length > 0) {
    return {
      shouldStop: true,
      exitReason: EXIT_REASONS.RESOURCE_BUDGET_REACHED,
      triggeredLimits,
      reasonIt: `Esaurito il budget deterministico di risorse (${triggeredLimits.join(', ')}).`,
      remainingBudget
    };
  }

  if (satisficingOrthogonalCount >= policy.targetSatisficingCount) {
    return {
      shouldStop: true,
      exitReason: EXIT_REASONS.TARGET_SATISFICED,
      triggeredLimits: ['targetSatisficingCount'],
      reasonIt: `Obiettivo soddisfatto in anticipo: ${satisficingOrthogonalCount} varianti ortogonali superano tutti gli oracoli e la baseline.`,
      remainingBudget
    };
  }

  const zeroYieldCollapse = consecutiveZeroYieldWaves >= policy.yieldCollapseWaves;
  const duplicateCollapse =
    lastWaveHypothesisCount > 0 && lastWaveDuplicateRate > policy.maxDuplicateRate;

  if (zeroYieldCollapse || duplicateCollapse) {
    const causes = [];
    if (zeroYieldCollapse) causes.push('zeroYieldWaves');
    if (duplicateCollapse) causes.push('duplicateRate');
    return {
      shouldStop: true,
      exitReason: EXIT_REASONS.YIELD_COLLAPSE,
      triggeredLimits: causes,
      reasonIt: zeroYieldCollapse
        ? `Collasso della resa: 0 varianti valide per ${consecutiveZeroYieldWaves} ondate consecutive.`
        : `Collasso della resa: tasso di ipotesi duplicate al ${(lastWaveDuplicateRate * 100).toFixed(0)}% (oltre ${(policy.maxDuplicateRate * 100).toFixed(0)}%).`,
      remainingBudget
    };
  }

  if (wavesCompleted >= 1 && consecutiveStagnantWaves >= policy.stagnationWaves) {
    return {
      shouldStop: true,
      exitReason: EXIT_REASONS.PARETO_CONVERGED,
      triggeredLimits: ['stagnationWaves'],
      reasonIt: `Frontiera di Pareto convergente: nessun miglioramento significativo nelle ultime ${consecutiveStagnantWaves} ondate.`,
      remainingBudget
    };
  }

  return {
    shouldStop: false,
    exitReason: EXIT_REASONS.CONTINUE,
    triggeredLimits: [],
    reasonIt: 'Ciclo attivo: criteri di arresto non raggiunti.',
    remainingBudget
  };
}

/**
 * Combines oracle gate filtering, Pareto ranking, stop policy evaluation, and blind
 * reveal mapping into a deterministic discovery-verdict.json payload.
 * @param {object} params
 * @returns {object}
 */
export function buildDiscoveryVerdict({
  brief = {},
  runState = {},
  variants = [],
  blindReveal = {},
  generatedAt = new Date().toISOString()
} = {}) {
  const normalizedBrief = brief.stopPolicy ? brief : createDiscoveryBrief(brief);
  const reverseReveal = {};
  for (const [label, varId] of Object.entries(blindReveal || {})) {
    reverseReveal[varId] = label;
  }

  const evaluated = (Array.isArray(variants) ? variants : []).map((v) => {
    const gate = evaluateOracleGate(v, normalizedBrief);
    return {
      ...v,
      id: gate.variantId,
      oracleGate: gate,
      rejected: gate.rejected
    };
  });

  const rejectedVariants = evaluated.filter((v) => v.rejected);
  const passingVariants = evaluated.filter((v) => !v.rejected);
  const pareto = computeParetoFrontier(
    passingVariants,
    normalizedBrief.objectives,
    normalizedBrief.baseline
  );

  const stopDecision = evaluateStopCondition(runState, normalizedBrief.stopPolicy);
  const generatedCount = evaluated.length;
  const rejectedByOraclesCount = rejectedVariants.length;
  const rejectionRatePct =
    generatedCount > 0 ? Math.round((rejectedByOraclesCount / generatedCount) * 100) : 0;

  const oracleRejectBreakdown = {};
  for (const oracle of normalizedBrief.oracles) {
    oracleRejectBreakdown[oracle.id] = 0;
  }
  for (const rv of rejectedVariants) {
    for (const failedId of rv.oracleGate.failedBlockingOracles) {
      oracleRejectBreakdown[failedId] = (oracleRejectBreakdown[failedId] || 0) + 1;
    }
  }

  const humanSelectionOptions = pareto.frontier.map((item, idx) => ({
    rank: idx + 1,
    variantId: item.id,
    blindLabel: reverseReveal[item.id] || indexToAlphaLabel(idx),
    mutatorArchetype: item.mutatorArchetype || 'unknown',
    worktreeBranch: item.worktreeBranch || 'isolated-worktree',
    summary: item.summary || '',
    metrics: item.metrics || {},
    fiveFingerScore: Number.isFinite(item.fiveFingerScore)
      ? item.fiveFingerScore
      : Number.isFinite(item.metrics?.fiveFingerScore)
        ? item.metrics.fiveFingerScore
        : null,
    passedOracleCount: item.oracleGate.passedOracleCount,
    totalOracleCount: item.oracleGate.totalOracleCount,
    improvementOverBaseline: item.improvementOverBaseline,
    paretoRank: item.paretoRank
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    briefId: normalizedBrief.briefId,
    goal: normalizedBrief.goal,
    profile: normalizedBrief.profile,
    exitReason: stopDecision.exitReason,
    stopDecision,
    mainBranchUntouched: true,
    funnel: {
      generatedCount,
      rejectedByOraclesCount,
      rejectionRatePct,
      passedCount: passingVariants.length,
      frontierCount: pareto.frontier.length,
      oracleRejectBreakdown
    },
    runState: {
      wavesCompleted: runState.wavesCompleted || 0,
      variantsPrototyped: runState.variantsPrototyped || generatedCount,
      subagentCalls: runState.subagentCalls || 0,
      totalTokens: runState.totalTokens || 0,
      elapsedMs: runState.elapsedMs || 0
    },
    paretoFrontier: pareto.frontier.map((item) => item.id),
    bestImprovementOverBaseline: pareto.bestImprovementOverBaseline,
    humanSelectionOptions,
    rejectedVariants: rejectedVariants.map((rv) => ({
      variantId: rv.id,
      mutatorArchetype: rv.mutatorArchetype || 'unknown',
      failedBlockingOracles: rv.oracleGate.failedBlockingOracles,
      rejectionReasons: rv.oracleGate.rejectionReasons
    }))
  };
}

/**
 * Renders the ~600px Italian Semantic Drill-Down (L0 -> L1 -> L2) report.
 * @param {object} verdict
 * @returns {string}
 */
export function renderDiscoveryReportMarkdown(verdict) {
  const f = verdict.funnel || {};
  const lines = [];
  lines.push('> [!IMPORTANT]');
  lines.push(
    `> **DISCOVERY-LOOP (\`${verdict.profile}\` — \`${verdict.exitReason}\`)**: ${verdict.stopDecision?.reasonIt || 'Ciclo concluso.'}`
  );
  lines.push('');
  lines.push(
    `- **Imbuto Oracoli**: \`${f.generatedCount || 0}\` varianti generate -> \`${f.rejectedByOraclesCount || 0}\` scartate dagli oracoli (\`${f.rejectionRatePct || 0}%\`) -> \`${f.passedCount || 0}\` idonee -> **\`${f.frontierCount || 0}\` in frontiera di Pareto**.`
  );
  lines.push(
    `- **Protezione Branch**: \`main\` invariato (\`mainBranchUntouched: ${Boolean(verdict.mainBranchUntouched)}\`); nessuna modifica applicata senza conferma esplicita.`
  );
  lines.push(
    '- **Selezione Umana**: esamina la frontiera di Pareto nei dettagli sotto per promuovere una variante o scartare il lotto.'
  );
  lines.push('');
  lines.push('<details>');
  lines.push(
    '<summary><strong>Analisi Comparativa Frontiera di Pareto, Telemetria Oracoli e Budget (Espandi)</strong></summary>'
  );
  lines.push('');
  lines.push('| Candidato | Archetipo | Oracoli | 5 Dita | Delta / Complessità |');
  lines.push('| :--- | :--- | :---: | :---: | :--- |');

  if (!verdict.humanSelectionOptions || verdict.humanSelectionOptions.length === 0) {
    lines.push('| *Nessun sopravvissuto* | — | `0/4` | — | Nessuna variante ha superato gli oracoli |');
  } else {
    for (const opt of verdict.humanSelectionOptions) {
      const fingers = opt.fiveFingerScore !== null ? `\`${opt.fiveFingerScore}/5\`` : 'N/D';
      const deltaPct = `${opt.improvementOverBaseline >= 0 ? '+' : ''}${(opt.improvementOverBaseline * 100).toFixed(1)}%`;
      const comp = Number.isFinite(opt.metrics?.complexityCost) ? opt.metrics.complexityCost : 1;
      lines.push(
        `| **${opt.blindLabel}** (\`${opt.variantId}\`) | \`${opt.mutatorArchetype}\` | \`${opt.passedOracleCount}/${opt.totalOracleCount}\` | ${fingers} | \`${deltaPct}\` · costo \`${comp}\` |`
      );
    }
  }

  lines.push('');
  const rs = verdict.runState || {};
  const elapsedSec = ((rs.elapsedMs || 0) / 1000).toFixed(1);
  lines.push(
    `- **Telemetria Esecuzione**: \`${rs.wavesCompleted || 0}\` ondate · \`${rs.subagentCalls || 0}\` subagent · \`${rs.totalTokens || 0}\` token · \`${elapsedSec}s\`.`
  );
  const breakdownStr = Object.entries(f.oracleRejectBreakdown || {})
    .map(([id, cnt]) => `\`${id}\`: ${cnt}`)
    .join(' · ');
  if (breakdownStr) {
    lines.push(`- **Scarti per Oracolo**: ${breakdownStr}.`);
  }
  lines.push('');
  lines.push('<details>');
  lines.push(
    '<summary><strong>Audit Varianti Scartate e Istruzioni Worktree</strong></summary>'
  );
  lines.push('');

  if (!verdict.rejectedVariants || verdict.rejectedVariants.length === 0) {
    lines.push('- Nessuna variante scartata dagli oracoli in questo ciclo.');
  } else {
    for (const rv of verdict.rejectedVariants) {
      lines.push(
        `- **\`${rv.variantId}\`** (\`${rv.mutatorArchetype}\`) -> ${rv.rejectionReasons.join('; ')}`
      );
    }
  }

  if (verdict.humanSelectionOptions && verdict.humanSelectionOptions.length > 0) {
    lines.push('');
    for (const opt of verdict.humanSelectionOptions) {
      lines.push(
        `- **Promozione \`${opt.variantId}\`** (\`${opt.worktreeBranch}\`): revisiona il diff isolato prima di un eventuale merge su \`main\`.`
      );
    }
  }

  lines.push('');
  lines.push('</details>');
  lines.push('');
  lines.push('</details>');

  return lines.join('\n');
}

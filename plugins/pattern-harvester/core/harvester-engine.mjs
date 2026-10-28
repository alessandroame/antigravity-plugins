/**
 * Pattern Harvester & Automation Advisor — Headless Core Engine
 * Pure Node.js deterministic engine for discovering recurring workflow patterns,
 * tool-chain n-grams, normalized CLI command skeletons, and interaction archetypes
 * across Antigravity sessions, evaluating KLM/GOMS ROI and catalog overlap.
 *
 * Zero DOM/browser dependencies.
 */

import { createHash } from 'node:crypto';

export const DEFAULT_HARVESTER_CONFIG = Object.freeze({
  minOccurrences: 3,
  minDistinctSessions: 2,
  minPluginOccurrences: 4,
  minPluginDistinctSessions: 3,
  minSavedSeconds15Sessions: 120,
  minPluginSavedSeconds15Sessions: 240,
  setupCostSeconds: 40,
  catalogOverlapThreshold: 0.45,
  archetypeClusterJaccardThreshold: 0.35,
  periodicSessionThreshold: 5,
  periodicIntervalHours: 24,
  dismissCooldownDays: 30
});

const STOPWORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in',
  'con', 'su', 'per', 'tra', 'fra', 'che', 'non', 'e', 'ed', 'o', 'od', 'ma', 'se',
  'come', 'anche', 'piu', 'meno', 'molto', 'tutto', 'tutti', 'tutte', 'questo',
  'questa', 'questi', 'queste', 'quello', 'quella', 'sono', 'sei', 'ha', 'hai',
  'abbiamo', 'hanno', 'fare', 'fai', 'fatto', 'puo', 'puoi', 'deve', 'devi',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'when', 'where',
  'what', 'which', 'who', 'whom', 'whose', 'why', 'how', 'can', 'could', 'should',
  'would', 'will', 'shall', 'may', 'might', 'must', 'have', 'has', 'had', 'are',
  'was', 'were', 'been', 'being', 'file', 'files', 'code', 'project', 'please'
]);

const TRIVIAL_SINGLE_COMMANDS = new Set([
  'git status',
  'git diff',
  'git log',
  'git branch',
  'npm test',
  'node --version',
  'ls',
  'dir',
  'pwd'
]);

/**
 * Unwraps outer quotes and unescapes JSON-escaped string values from transcript.jsonl args.
 * @param {string} raw
 * @returns {string}
 */
export function unwrapTranscriptString(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === 'string') s = parsed.trim();
    } catch {
      s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
    }
  }
  return s;
}

/**
 * Normalizes a filesystem path to forward-slash lowercase without quotes.
 * @param {string} rawPath
 * @returns {string}
 */
export function normalizePathToken(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath) return '';
  return unwrapTranscriptString(rawPath)
    .replace(/^["']|["']$/g, '')
    .replace(/\\+/g, '/')
    .replace(/\/+/g, '/')
    .trim()
    .toLowerCase();
}

/**
 * Classifies a single tool call into a canonical semantic action token.
 * @param {{ name?: string, args?: Record<string, unknown> }} toolCall
 * @returns {string}
 */
export function classifyToolAction(toolCall) {
  const rawName = String(toolCall?.name || '').trim();
  const args = toolCall?.args && typeof toolCall.args === 'object' ? toolCall.args : {};

  if (!rawName) return 'UNKNOWN';
  if (rawName === 'read_file' || rawName === 'view_file' || rawName === 'read_resource') {
    const p = normalizePathToken(String(args.Path || args.AbsolutePath || ''));
    if (/(?:^|\/)skills\/[^/]+\/skill\.md$/i.test(p)) return 'READ:SKILL';
    if (/(?:^|\/)(?:memory|worklog|desiderata|notes)\.md$/i.test(p)) return 'READ:COGNITIVE';
    return 'READ:FILE';
  }
  if (rawName === 'edit_file' || rawName === 'replace_file_content' || rawName === 'multi_replace_file_content') {
    const p = normalizePathToken(String(args.Path || args.TargetFile || ''));
    if (/(?:^|\/)(?:memory|worklog|desiderata|notes)\.md$/i.test(p)) return 'EDIT:COGNITIVE';
    return 'EDIT:FILE';
  }
  if (rawName === 'write_file' || rawName === 'write_to_file') {
    const p = normalizePathToken(String(args.Path || args.TargetFile || ''));
    if (/\.test\.[cm]?[jt]s$/i.test(p)) return 'WRITE:TEST';
    if (/(?:^|\/)skill\.md$/i.test(p)) return 'WRITE:SKILL';
    return 'WRITE:FILE';
  }
  if (rawName === 'run_command') {
    const cmd = unwrapTranscriptString(String(args.CommandLine || '')).toLowerCase();
    if (/\b(?:validate\.mjs|--verify-and-sync|npm\s+run\s+validate)\b/.test(cmd)) return 'EXEC:VALIDATE';
    if (/\b(?:sync-to-global\.mjs|npm\s+run\s+sync)\b/.test(cmd)) return 'EXEC:SYNC';
    if (/\b(?:node\s+--test|npm\s+test|vitest|jest|pytest)\b/.test(cmd)) return 'EXEC:TEST';
    if (/\bgit\s+(?:add|commit|push|worktree|checkout|branch|merge|rebase)\b/.test(cmd)) return 'EXEC:GIT';
    if (/\bnode\s+/.test(cmd)) return 'EXEC:NODE';
    return 'EXEC:CMD';
  }
  if (rawName === 'invoke_subagent' || rawName === 'define_subagent' || rawName === 'send_message') {
    return 'ORCHESTRATE:SUBAGENT';
  }
  if (rawName === 'grep_search' || rawName === 'find_by_name' || rawName === 'search_web') {
    return 'SEARCH:QUERY';
  }
  if (rawName === 'ask_question') {
    return 'INTERACT:ASK';
  }
  if (rawName === 'schedule' || rawName === 'manage_task') {
    return 'SCHEDULE:TASK';
  }
  return `TOOL:${rawName.toUpperCase()}`;
}

/**
 * Compresses an ordered sequence of tool calls using Run-Length Encoding (RLE).
 * Contiguous identical semantic actions are collapsed into `<TOKEN>+` (or `<TOKEN>` if single).
 * @param {Array<{ name?: string, args?: Record<string, unknown> }>} toolCalls
 * @returns {{ rleTokens: string[], rawActions: string[], totalCalls: number, collapsedSteps: number }}
 */
export function compressToolSequenceRLE(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return { rleTokens: [], rawActions: [], totalCalls: 0, collapsedSteps: 0 };
  }

  const rawActions = toolCalls.map((tc) => classifyToolAction(tc)).filter((t) => t !== 'UNKNOWN');
  const rleTokens = [];
  let i = 0;

  while (i < rawActions.length) {
    const current = rawActions[i];
    let runCount = 1;
    while (i + runCount < rawActions.length && rawActions[i + runCount] === current) {
      runCount++;
    }
    rleTokens.push(runCount > 1 ? `${current}+` : current);
    i += runCount;
  }

  return {
    rleTokens,
    rawActions,
    totalCalls: rawActions.length,
    collapsedSteps: rawActions.length - rleTokens.length
  };
}

/**
 * Extracts ordered n-grams (default 3..5) from an RLE-compressed tool action sequence.
 * Ignores trivial sequences shorter than minN or pure read-only chains without operational steps.
 * @param {string[]} rleTokens
 * @param {number} [minN=3]
 * @param {number} [maxN=5]
 * @returns {Array<{ ngram: string, tokens: string[], length: number }>}
 */
export function extractToolChainNgrams(rleTokens, minN = 3, maxN = 5) {
  if (!Array.isArray(rleTokens) || rleTokens.length < minN) return [];

  const results = [];
  const seenInTurn = new Set();

  for (let n = minN; n <= Math.min(maxN, rleTokens.length); n++) {
    for (let i = 0; i <= rleTokens.length - n; i++) {
      const slice = rleTokens.slice(i, i + n);
      // Require at least one structured workflow action beyond generic file read/edit
      const hasWorkflowAction = slice.some((tok) =>
        /^(?:EXEC:(?:TEST|VALIDATE|SYNC|GIT|NODE)|WRITE:(?:TEST|SKILL)|EDIT:COGNITIVE|ORCHESTRATE:SUBAGENT|SCHEDULE:TASK)/.test(
          tok
        )
      );
      if (!hasWorkflowAction) continue;

      const ngram = slice.join(' -> ');
      if (!seenInTurn.has(ngram)) {
        seenInTurn.add(ngram);
        results.push({ ngram, tokens: slice, length: n });
      }
    }
  }

  return results;
}

/**
 * Normalizes a shell command line into a structural skeleton by replacing
 * user-specific paths, UUIDs, commit hashes, and arbitrary literals with placeholders
 * while preserving executable names, script basenames, and CLI flags.
 * @param {string} commandLine
 * @returns {string}
 */
export function normalizeCommandSkeleton(commandLine) {
  if (typeof commandLine !== 'string') return '';
  let cmd = unwrapTranscriptString(commandLine).replace(/\s+/g, ' ').trim();
  if (!cmd) return '';

  cmd = cmd
    // Replace UUIDs
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    // Preserve script basenames (*.mjs, *.js, *.py, *.ps1, *.sh) while collapsing directory prefixes
    .replace(
      /(?:["']?[a-zA-Z]:[\\/][^"'\s]*[\\/]|["']?(?:\.\.?[\\/]|\/)[^"'\s]*[\\/])([a-zA-Z0-9_.-]+\.(?:mjs|cjs|js|ts|py|ps1|sh))["']?/g,
      '<dir>/$1'
    )
    // Replace remaining Windows or Unix paths containing slashes
    .replace(/["']?[a-zA-Z]:[\\/][^"'\s]+["']?/g, '<path>')
    .replace(/["']?(?:\/[a-zA-Z0-9_.-]+){2,}["']?/g, '<path>')
    // Replace double or single quoted strings only when they appear as arguments after whitespace/flags
    .replace(/(\s|^-[a-zA-Z0-9_-]*\s*)"[^"]{1,120}"/g, '$1"<str>"')
    .replace(/(\s|^-[a-zA-Z0-9_-]*\s*)'[^']{1,120}'/g, "$1'<str>'")
    // Replace standalone numbers (ports, counts, PIDs)
    .replace(/\b\d{2,}\b/g, '<num>');

  const normalized = cmd.toLowerCase().trim();
  // Reject degenerate skeletons that contain only placeholders without executable/command tokens
  const strippedPlaceholders = normalized
    .replace(/<(?:uuid|dir|path|str|num)>|["']/g, '')
    .trim();
  if (strippedPlaceholders.length < 3) return '';
  return normalized;
}

/**
 * Extracts normalized tokens and 2-shingles from user requests or worklog entries.
 * Zero domain-specific hardcoded regexes (strictly adheres to Anti-Example Hardcoding).
 * @param {string} text
 * @returns {{ tokens: string[], shingles: string[] }}
 */
export function extractLexicalSignature(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { tokens: [], shingles: [] };
  }

  const cleaned = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/[a-zA-Z]:[\\/][^\s]+/g, ' ')
    .replace(/https?:\/\/[^\s]+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ');

  const rawWords = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/^[-/]+|[-/]+$/g, ''))
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOPWORDS.has(w));

  const uniqueTokens = [...new Set(rawWords)];
  const shingles = [];
  for (let i = 0; i < rawWords.length - 1; i++) {
    shingles.push(`${rawWords[i]}_${rawWords[i + 1]}`);
  }

  return {
    tokens: uniqueTokens.slice(0, 40),
    shingles: [...new Set(shingles)].slice(0, 40)
  };
}

/**
 * Computes deterministic Jaccard similarity between two arrays or sets of strings.
 * @param {Iterable<string>} a
 * @param {Iterable<string>} b
 * @returns {number}
 */
export function computeJaccardSimilarity(a, b) {
  const setA = a instanceof Set ? a : new Set(a || []);
  const setB = b instanceof Set ? b : new Set(b || []);
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : Number((intersection / union).toFixed(4));
}

/**
 * Evaluates semantic and structural overlap between a discovered pattern candidate
 * and the catalog of already installed skills and plugins.
 * @param {{ keywords: string[], commandSkeletons?: string[], invokedSkills?: string[], hasPostSkillManualSteps?: boolean }} candidate
 * @param {Array<{ id: string, kind: 'skill' | 'plugin', pluginName?: string, description: string, tokens: string[], scriptNames?: string[] }>} catalogEntries
 * @param {number} [overlapThreshold=0.45]
 * @returns {{ status: 'ALREADY_COVERED' | 'PARTIAL_OVERLAP' | 'NOVEL', maxOverlap: number, matchedEntry: { id: string, kind: string, pluginName?: string } | null }}
 */
export function evaluateCatalogOverlap(candidate, catalogEntries, overlapThreshold = 0.45) {
  if (!Array.isArray(catalogEntries) || catalogEntries.length === 0) {
    return { status: 'NOVEL', maxOverlap: 0, matchedEntry: null };
  }

  const candidateTokenSet = new Set(
    (candidate.keywords || []).map((k) => String(k).toLowerCase())
  );

  let bestScore = 0;
  let bestEntry = null;

  for (const entry of catalogEntries) {
    const entryTokens = new Set((entry.tokens || []).map((t) => String(t).toLowerCase()));
    const jaccard = computeJaccardSimilarity(candidateTokenSet, entryTokens);

    // Check if candidate CLI skeleton directly invokes one of the entry's scripts
    let scriptBonus = 0;
    if (Array.isArray(entry.scriptNames) && Array.isArray(candidate.commandSkeletons)) {
      const touchesEntryScript = candidate.commandSkeletons.some((cmd) =>
        entry.scriptNames.some((sName) => cmd.includes(`<dir>/${sName.toLowerCase()}`) || cmd.includes(sName.toLowerCase()))
      );
      if (touchesEntryScript) scriptBonus = 0.75;
    }

    const combinedScore = Number(Math.min(1, jaccard + scriptBonus).toFixed(4));
    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestEntry = {
        id: entry.id,
        kind: entry.kind,
        pluginName: entry.pluginName || entry.id
      };
    }
  }

  // If the turn already invoked the matching skill cleanly without extra manual friction
  if (
    bestEntry &&
    Array.isArray(candidate.invokedSkills) &&
    candidate.invokedSkills.includes(bestEntry.id) &&
    !candidate.hasPostSkillManualSteps
  ) {
    return { status: 'ALREADY_COVERED', maxOverlap: Math.max(bestScore, 0.85), matchedEntry: bestEntry };
  }

  if (bestScore >= 0.75) {
    return { status: 'ALREADY_COVERED', maxOverlap: bestScore, matchedEntry: bestEntry };
  }

  if (bestScore >= overlapThreshold) {
    return { status: 'PARTIAL_OVERLAP', maxOverlap: bestScore, matchedEntry: bestEntry };
  }

  return { status: 'NOVEL', maxOverlap: bestScore, matchedEntry: bestEntry };
}

/**
 * Computes KLM/GOMS time-savings ROI and classifies the candidate into the 4-way matrix:
 * IGNORE | RULE_OR_GUARD | SKILL_EXTENSION | NEW_SKILL | NEW_PLUGIN
 *
 * @param {{
 *   patternType: 'TOOL_CHAIN' | 'CLI_SEQUENCE' | 'INTERACTION_ARCHETYPE' | 'INVARIANT_CORRECTION',
 *   occurrences: number,
 *   distinctSessions: number,
 *   avgStepsPerRun: number,
 *   avgTokensPerTurn?: number,
 *   requiresHookOrState?: boolean,
 *   requiresMultipleComponents?: boolean,
 *   hasPostSkillManualSteps?: boolean,
 *   overlapResult?: { status: string, maxOverlap: number, matchedEntry: { id: string, kind: string, pluginName?: string } | null }
 * }} candidate
 * @param {Partial<typeof DEFAULT_HARVESTER_CONFIG>} [customConfig]
 */
export function classifyAndScoreCandidate(candidate, customConfig = {}) {
  const cfg = { ...DEFAULT_HARVESTER_CONFIG, ...customConfig };
  const occurrences = Math.max(0, Number(candidate.occurrences || 0));
  const distinctSessions = Math.max(0, Number(candidate.distinctSessions || 0));
  const avgSteps = Math.max(1, Number(candidate.avgStepsPerRun || 1));
  const avgTokens = Math.max(100, Number(candidate.avgTokensPerTurn || 1500));
  const overlap = candidate.overlapResult || { status: 'NOVEL', maxOverlap: 0, matchedEntry: null };

  // KLM/GOMS estimate: each manual tool/command/prompt orchestration step costs ~11s
  // plus ~18s of prompt typing/context setup per repeated workflow invocation
  const savedSecondsPerRun = Math.round(18 + avgSteps * 11);
  // Project expected runs over a 15-session horizon based on observed density
  const expectedRunsPer15Sessions = Math.max(occurrences, Math.round(distinctSessions * 1.5));
  const grossSavedSeconds15Sessions = savedSecondsPerRun * expectedRunsPer15Sessions;
  const netSavedSeconds15Sessions = grossSavedSeconds15Sessions - cfg.setupCostSeconds;
  const roiMultiplier = Number((grossSavedSeconds15Sessions / cfg.setupCostSeconds).toFixed(2));

  const roiScore = Number(
    (
      distinctSessions *
      avgSteps *
      Math.log10(Math.max(10, avgTokens)) *
      (1 - Math.min(0.9, overlap.maxOverlap || 0))
    ).toFixed(2)
  );

  // 1. Already covered by existing skill/plugin without post-skill friction -> IGNORE
  if (overlap.status === 'ALREADY_COVERED' && !candidate.hasPostSkillManualSteps) {
    return {
      recommendationType: 'IGNORE',
      reason: `Flusso già coperto da '${overlap.matchedEntry?.id || 'catalogo'}' (overlap ${Math.round(overlap.maxOverlap * 100)}%).`,
      savedSecondsPerRun,
      netSavedSeconds15Sessions,
      roiMultiplier,
      roiScore,
      targetArtifact: overlap.matchedEntry?.id || null
    };
  }

  // 2. Repeated invariant correction or compact static check -> RULE_OR_GUARD (L2a / L3)
  if (
    candidate.patternType === 'INVARIANT_CORRECTION' &&
    occurrences >= 2 &&
    distinctSessions >= 2
  ) {
    return {
      recommendationType: 'RULE_OR_GUARD',
      reason: `Vincolo o correzione ripetuta in ${distinctSessions} sessioni (${occurrences} occorrenze): candidabile a guardia statica L3 o regola L2a.`,
      savedSecondsPerRun,
      netSavedSeconds15Sessions,
      roiMultiplier,
      roiScore,
      targetArtifact: overlap.matchedEntry?.pluginName || 'proactive-mentorship'
    };
  }

  // 3. Below minimum frequency or net time-savings threshold -> IGNORE
  if (
    occurrences < cfg.minOccurrences ||
    distinctSessions < cfg.minDistinctSessions ||
    netSavedSeconds15Sessions < cfg.minSavedSeconds15Sessions
  ) {
    return {
      recommendationType: 'IGNORE',
      reason: `Sotto soglia ROI (${occurrences} occorrenze su ${distinctSessions} sessioni, risparmio netto ${netSavedSeconds15Sessions}s < ${cfg.minSavedSeconds15Sessions}s).`,
      savedSecondsPerRun,
      netSavedSeconds15Sessions,
      roiMultiplier,
      roiScore,
      targetArtifact: null
    };
  }

  // 4. Partial overlap with existing skill or systematic post-skill manual steps -> SKILL_EXTENSION
  if (overlap.status === 'PARTIAL_OVERLAP' || candidate.hasPostSkillManualSteps) {
    const targetId =
      candidate.primaryPostSkill || overlap.matchedEntry?.id || 'skill-esistente';
    const pct = Math.round((overlap.maxOverlap || 0.45) * 100);
    const reasonText = candidate.primaryPostSkill
      ? `Step manuali ricorrenti eseguiti dopo l'invocazione di '${targetId}': estendere la skill in-place o incapsulare in script L3.`
      : `Sovrapposizione parziale (${pct}%) con '${targetId}': estendere in-place o aggiungere script L3.`;
    return {
      recommendationType: 'SKILL_EXTENSION',
      reason: reasonText,
      savedSecondsPerRun,
      netSavedSeconds15Sessions,
      roiMultiplier,
      roiScore,
      targetArtifact: targetId
    };
  }

  // 5. Multi-component domain (hooks + rules + scripts/skills) with high ROI -> NEW_PLUGIN
  if (
    (candidate.requiresHookOrState || candidate.requiresMultipleComponents) &&
    occurrences >= cfg.minPluginOccurrences &&
    distinctSessions >= cfg.minPluginDistinctSessions &&
    netSavedSeconds15Sessions >= cfg.minPluginSavedSeconds15Sessions
  ) {
    return {
      recommendationType: 'NEW_PLUGIN',
      reason: `Dominio multi-componente rilevato in ${distinctSessions} sessioni (${occurrences} occorrenze, +${netSavedSeconds15Sessions}s netti su 15 sessioni): richiede bundle Plugin con hook/script dedicati.`,
      savedSecondsPerRun,
      netSavedSeconds15Sessions,
      roiMultiplier,
      roiScore,
      targetArtifact: 'plugins/<nuovo-plugin>'
    };
  }

  // 6. Standard sequential procedural workflow -> NEW_SKILL (L2b)
  return {
    recommendationType: 'NEW_SKILL',
    reason: `Procedura multi-step ripetuta ${occurrences} volte in ${distinctSessions} sessioni (+${netSavedSeconds15Sessions}s netti su 15 sessioni, ${roiMultiplier}x costo setup): candidabile a Skill on-demand (L2b).`,
    savedSecondsPerRun,
    netSavedSeconds15Sessions,
    roiMultiplier,
    roiScore,
    targetArtifact: 'skills/<nuova-skill>/SKILL.md'
  };
}

/**
 * Generates a deterministic short ID for a pattern signature.
 * @param {string} kind
 * @param {string} signature
 * @returns {string}
 */
export function computePatternId(kind, signature) {
  const digest = createHash('sha256')
    .update(`${kind}::${String(signature).trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 10);
  return `pat-${digest}`;
}

/**
 * Analyzes structured session records and returns ranked automation recommendations.
 *
 * @param {Array<{
 *   convId: string,
 *   turns: Array<{
 *     userText: string,
 *     toolCalls: Array<{ name: string, args?: Record<string, unknown> }>,
 *     invokedSkills?: string[],
 *     totalTokens?: number
 *   }>
 * }>} sessions
 * @param {Array<{ id: string, kind: 'skill' | 'plugin', pluginName?: string, description: string, tokens: string[], scriptNames?: string[] }>} catalogEntries
 * @param {{
 *   dismissedPatterns?: Record<string, { dismissedAtMs: number }>,
 *   nowMs?: number,
 *   config?: Partial<typeof DEFAULT_HARVESTER_CONFIG>
 * }} [options]
 */
export function analyzeSessionsForPatterns(sessions, catalogEntries = [], options = {}) {
  const cfg = { ...DEFAULT_HARVESTER_CONFIG, ...(options.config || {}) };
  const nowMs = options.nowMs ?? Date.now();
  const dismissedMap = options.dismissedPatterns || {};
  const cooldownMs = cfg.dismissCooldownDays * 24 * 3600 * 1000;

  const toolChainBuckets = new Map();
  const cliSkeletonBuckets = new Map();
  const archetypeTurnRecords = [];

  for (const session of sessions || []) {
    if (!session || !Array.isArray(session.turns)) continue;
    const convId = String(session.convId || 'unknown');

    for (const turn of session.turns) {
      const toolCalls = Array.isArray(turn.toolCalls) ? turn.toolCalls : [];
      const invokedSkills = Array.isArray(turn.invokedSkills) ? turn.invokedSkills : [];
      const turnTokens = Number(turn.totalTokens || 1500);
      const lex = extractLexicalSignature(turn.userText || '');

      // 1. Tool-Chain RLE & N-Grams (only turns with >= 3 tool calls)
      if (toolCalls.length >= 3) {
        const { rleTokens, totalCalls } = compressToolSequenceRLE(toolCalls);
        const ngrams = extractToolChainNgrams(rleTokens, 3, 5);
        const hasPostSkillManualSteps =
          invokedSkills.length > 0 &&
          rleTokens.filter((t) => t.startsWith('EXEC:') || t.startsWith('EDIT:')).length >= 3;

        for (const ng of ngrams) {
          let bucket = toolChainBuckets.get(ng.ngram);
          if (!bucket) {
            bucket = {
              signature: ng.ngram,
              patternType: 'TOOL_CHAIN',
              occurrences: 0,
              sessions: new Set(),
              totalSteps: 0,
              totalTokens: 0,
              keywords: new Set(),
              commandSkeletons: new Set(),
              invokedSkills: new Set(),
              postSkillCounts: new Map(),
              samplePrompts: []
            };
            toolChainBuckets.set(ng.ngram, bucket);
          }
          bucket.occurrences += 1;
          bucket.sessions.add(convId);
          bucket.totalSteps += Math.max(ng.length, Math.min(totalCalls, ng.length + 2));
          bucket.totalTokens += turnTokens;
          for (const tok of lex.tokens.slice(0, 12)) bucket.keywords.add(tok);
          for (const sk of invokedSkills) {
            bucket.invokedSkills.add(sk);
            if (hasPostSkillManualSteps) {
              bucket.postSkillCounts.set(sk, (bucket.postSkillCounts.get(sk) || 0) + 1);
            }
          }
          if (turn.userText && bucket.samplePrompts.length < 3) {
            bucket.samplePrompts.push(turn.userText.slice(0, 140));
          }
        }
      }

      // 2. Structural CLI Skeletons
      const turnCliSkeletons = [];
      for (const tc of toolCalls) {
        if (tc.name === 'run_command' && tc.args?.CommandLine) {
          const skel = normalizeCommandSkeleton(String(tc.args.CommandLine));
          if (skel && !TRIVIAL_SINGLE_COMMANDS.has(skel)) {
            turnCliSkeletons.push(skel);
          }
        }
      }

      if (turnCliSkeletons.length > 0) {
        const uniqueTurnSkels = [...new Set(turnCliSkeletons)];
        for (const skel of uniqueTurnSkels) {
          let bucket = cliSkeletonBuckets.get(skel);
          if (!bucket) {
            bucket = {
              signature: skel,
              patternType: 'CLI_SEQUENCE',
              occurrences: 0,
              sessions: new Set(),
              totalSteps: 0,
              totalTokens: 0,
              keywords: new Set(),
              commandSkeletons: new Set([skel]),
              invokedSkills: new Set(),
              hasPostSkillManualSteps: false,
              samplePrompts: []
            };
            cliSkeletonBuckets.set(skel, bucket);
          }
          bucket.occurrences += 1;
          bucket.sessions.add(convId);
          bucket.totalSteps += Math.max(3, turnCliSkeletons.length + 2);
          bucket.totalTokens += turnTokens;
          for (const tok of lex.tokens.slice(0, 12)) bucket.keywords.add(tok);
          for (const sk of invokedSkills) bucket.invokedSkills.add(sk);
          if (turn.userText && bucket.samplePrompts.length < 3) {
            bucket.samplePrompts.push(turn.userText.slice(0, 140));
          }
        }
      }

      // 3. Interaction Archetypes (turns with meaningful lexical signature and >= 2 tool calls)
      if (lex.tokens.length >= 4 && toolCalls.length >= 2) {
        archetypeTurnRecords.push({
          convId,
          tokens: lex.tokens,
          shingles: lex.shingles,
          stepCount: Math.max(3, toolCalls.length),
          turnTokens,
          invokedSkills,
          commandSkeletons: turnCliSkeletons,
          userText: (turn.userText || '').slice(0, 140),
          requiresHookOrState: lex.tokens.some((t) =>
            ['hook', 'periodic', 'periodicamente', 'cron', 'schedule', 'background', 'monitor'].includes(t)
          )
        });
      }
    }
  }

  // Cluster interaction archetypes via greedy Jaccard similarity on lexical tokens + shingles
  const archetypeClusters = [];
  const assignedTurns = new Set();

  for (let i = 0; i < archetypeTurnRecords.length; i++) {
    if (assignedTurns.has(i)) continue;
    const seed = archetypeTurnRecords[i];
    const clusterMembers = [seed];
    assignedTurns.add(i);

    const seedFeatures = new Set([...seed.tokens, ...seed.shingles]);
    for (let j = i + 1; j < archetypeTurnRecords.length; j++) {
      if (assignedTurns.has(j)) continue;
      const other = archetypeTurnRecords[j];
      const otherFeatures = new Set([...other.tokens, ...other.shingles]);
      const sim = computeJaccardSimilarity(seedFeatures, otherFeatures);
      if (sim >= cfg.archetypeClusterJaccardThreshold) {
        clusterMembers.push(other);
        assignedTurns.add(j);
      }
    }

    if (clusterMembers.length >= 2) {
      const tokenFreq = new Map();
      const sessionsSet = new Set();
      const cmdSkels = new Set();
      const invokedSet = new Set();
      let totalSteps = 0;
      let totalTokens = 0;
      let requiresHookOrState = false;
      const samplePrompts = [];

      for (const m of clusterMembers) {
        sessionsSet.add(m.convId);
        totalSteps += m.stepCount;
        totalTokens += m.turnTokens;
        if (m.requiresHookOrState) requiresHookOrState = true;
        for (const c of m.commandSkeletons) cmdSkels.add(c);
        for (const sk of m.invokedSkills) invokedSet.add(sk);
        if (m.userText && samplePrompts.length < 3) samplePrompts.push(m.userText);
        for (const tok of m.tokens) {
          tokenFreq.set(tok, (tokenFreq.get(tok) || 0) + 1);
        }
      }

      const topTokens = [...tokenFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tok]) => tok);

      if (topTokens.length >= 2) {
        archetypeClusters.push({
          signature: `archetype:${topTokens.join('+')}`,
          patternType: 'INTERACTION_ARCHETYPE',
          occurrences: clusterMembers.length,
          sessions: sessionsSet,
          totalSteps,
          totalTokens,
          keywords: new Set(topTokens),
          commandSkeletons: cmdSkels,
          invokedSkills: invokedSet,
          requiresHookOrState,
          hasPostSkillManualSteps: false,
          samplePrompts
        });
      }
    }
  }

  // Merge all candidate buckets and evaluate ROI + Anti-Collision Gate
  const allRawBuckets = [
    ...toolChainBuckets.values(),
    ...cliSkeletonBuckets.values(),
    ...archetypeClusters
  ];

  const evaluatedCandidates = [];
  const ignoredCandidates = [];

  for (const bucket of allRawBuckets) {
    const patternId = computePatternId(bucket.patternType, bucket.signature);
    const dismissedInfo = dismissedMap[patternId];
    if (dismissedInfo && nowMs - Number(dismissedInfo.dismissedAtMs || 0) < cooldownMs) {
      continue;
    }

    const distinctSessions = bucket.sessions.size;
    const avgStepsPerRun = Number((bucket.totalSteps / Math.max(1, bucket.occurrences)).toFixed(1));
    const avgTokensPerTurn = Math.round(bucket.totalTokens / Math.max(1, bucket.occurrences));
    const keywords = [...bucket.keywords];
    const commandSkeletons = [...bucket.commandSkeletons];
    const invokedSkills = [...bucket.invokedSkills];

    let primaryPostSkill = null;
    if (bucket.postSkillCounts instanceof Map && bucket.postSkillCounts.size > 0) {
      const sortedPost = [...bucket.postSkillCounts.entries()].sort((a, b) => b[1] - a[1]);
      if (sortedPost[0][1] >= Math.max(2, Math.ceil(bucket.occurrences * 0.5))) {
        primaryPostSkill = sortedPost[0][0];
      }
    }
    const hasPostSkillManualSteps = Boolean(primaryPostSkill || bucket.hasPostSkillManualSteps);

    const overlapResult = evaluateCatalogOverlap(
      {
        keywords,
        commandSkeletons,
        invokedSkills,
        hasPostSkillManualSteps
      },
      catalogEntries,
      cfg.catalogOverlapThreshold
    );

    const scoring = classifyAndScoreCandidate(
      {
        patternType: bucket.patternType,
        occurrences: bucket.occurrences,
        distinctSessions,
        avgStepsPerRun,
        avgTokensPerTurn,
        requiresHookOrState: Boolean(bucket.requiresHookOrState),
        requiresMultipleComponents:
          Boolean(bucket.requiresHookOrState) ||
          (bucket.patternType === 'TOOL_CHAIN' && bucket.signature.includes('ORCHESTRATE:SUBAGENT')),
        hasPostSkillManualSteps,
        primaryPostSkill,
        overlapResult
      },
      cfg
    );

    const record = {
      patternId,
      patternType: bucket.patternType,
      signature: bucket.signature,
      occurrences: bucket.occurrences,
      distinctSessions,
      avgStepsPerRun,
      avgTokensPerTurn,
      keywords: keywords.slice(0, 10),
      commandSkeletons: commandSkeletons.slice(0, 5),
      samplePrompts: bucket.samplePrompts,
      overlap: overlapResult,
      ...scoring
    };

    if (scoring.recommendationType === 'IGNORE') {
      ignoredCandidates.push(record);
    } else {
      evaluatedCandidates.push(record);
    }
  }

  // Sort actionable candidates by ROI score descending, then net saved seconds descending
  evaluatedCandidates.sort(
    (a, b) =>
      b.roiScore - a.roiScore ||
      b.netSavedSeconds15Sessions - a.netSavedSeconds15Sessions
  );

  // Deduplicate overlapping tool-chain sub-ngrams that share the exact same session count
  const deduplicatedRecommendations = [];
  for (const cand of evaluatedCandidates) {
    const isRedundantSubChain = deduplicatedRecommendations.some(
      (existing) =>
        existing.patternType === cand.patternType &&
        existing.distinctSessions === cand.distinctSessions &&
        (existing.signature.includes(cand.signature) || cand.signature.includes(existing.signature))
    );
    if (!isRedundantSubChain) {
      deduplicatedRecommendations.push(cand);
    }
  }

  return {
    analyzedSessionsCount: Array.isArray(sessions) ? sessions.length : 0,
    totalCandidatesEvaluated: allRawBuckets.length,
    actionableCount: deduplicatedRecommendations.length,
    ignoredCount: ignoredCandidates.length,
    recommendations: deduplicatedRecommendations,
    ignoredSample: ignoredCandidates.slice(0, 10)
  };
}

/**
 * Builds a compliant SKILL.md or plugin.json scaffold for an actionable pattern candidate.
 * Adheres strictly to scripts/validate.mjs (folded YAML description 80-250 chars,
 * explicit directive trigger, <= 200 lines, zero unquoted inline colons).
 *
 * @param {{
 *   patternId: string,
 *   patternType: string,
 *   signature: string,
 *   recommendationType: string,
 *   keywords?: string[],
 *   commandSkeletons?: string[],
 *   savedSecondsPerRun?: number,
 *   netSavedSeconds15Sessions?: number
 * }} candidate
 * @param {{ slug?: string }} [options]
 * @returns {{ kind: 'SKILL' | 'PLUGIN', slug: string, files: Record<string, string> }}
 */
export function generateCandidateScaffold(candidate, options = {}) {
  const rawWords = (candidate.keywords || [])
    .filter((w) => /^[a-z0-9]+$/.test(w) && w.length >= 3)
    .slice(0, 3);
  const fallbackSlug =
    rawWords.length >= 2 ? rawWords.join('-') : `auto-workflow-${candidate.patternId.replace(/^pat-/, '').slice(0, 6)}`;
  const slug = String(options.slug || fallbackSlug)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const keywordSummary = rawWords.length > 0 ? rawWords.join(', ') : 'sequenze operative ricorrenti';
  const rawDescription = `Automatizza il flusso operativo per ${keywordSummary} rilevato dal Pattern Harvester riducendo i passaggi manuali. Utilizza questa skill quando esegui questa procedura o invochi /${slug}.`;
  // Guarantee [80, 250] char budget required by scripts/validate.mjs
  const calibratedDescription =
    rawDescription.length > 245 ? `${rawDescription.slice(0, 242)}...` : rawDescription.padEnd(85, '.');

  const skillMarkdown = [
    '---',
    `name: ${slug}`,
    'description: >-',
    `  ${calibratedDescription}`,
    '---',
    '',
    `# Runbook Operativo: \`/${slug}\``,
    '',
    'Procedura generata dal **Pattern Harvester** a partire da un pattern ricorrente verificato su più sessioni di lavoro.',
    '',
    '## 1. Contesto e Impronta del Pattern',
    '',
    `- **ID Pattern**: \`${candidate.patternId}\` (\`${candidate.patternType}\`)`,
    `- **Sequenza Rilevata**: \`${candidate.signature}\``,
    `- **Risparmio Stimato (KLM)**: \`~${candidate.savedSecondsPerRun || 45}s\` per esecuzione (\`+${candidate.netSavedSeconds15Sessions || 150}s\` netti su 15 sessioni)`,
    '',
    '## 2. Sequenza Operativa Standard (Step 1..3)',
    '',
    '1. **Step 1 — Verifica Precondizioni**:',
    '   - Controllare i file target e lo stato locale prima di avviare la sequenza.',
    '2. **Step 2 — Esecuzione Deterministica**:',
    ...(Array.isArray(candidate.commandSkeletons) && candidate.commandSkeletons.length > 0
      ? candidate.commandSkeletons.map((cmd) => `   - Eseguire il comando strutturato: \`${cmd}\``)
      : [`   - Applicare la catena operativa: \`${candidate.signature}\``]),
    '3. **Step 3 — Oracolo di Verifica**:',
    '   - Validare l\'esito con `node scripts/validate.mjs --all` o con la suite di test del progetto.',
    ''
  ].join('\n');

  if (candidate.recommendationType === 'NEW_PLUGIN') {
    const manifestJson = JSON.stringify(
      {
        name: slug,
        displayName: `Auto Plugin ${slug}`,
        description: calibratedDescription,
        version: '1.0.0',
        suggestedPrompts: [
          `Esegui il flusso automatizzato /${slug} verificando i vincoli del progetto`,
          `Mostra lo stato e i controlli del plugin ${slug}`
        ]
      },
      null,
      2
    );

    const ruleMarkdown = [
      `# Regole Operative per \`${slug}\``,
      '',
      'Definisce i vincoli automatici estratti dal Pattern Harvester.',
      '',
      '## 1. Invarianti e Flusso Standard',
      `- **Sequenza Canonica**: \`${candidate.signature}\`.`,
      `- **Trigger On-Demand**: invocare \`/${slug}\` per eseguire il runbook associato.`,
      ''
    ].join('\n');

    return {
      kind: 'PLUGIN',
      slug,
      files: {
        [`plugins/${slug}/plugin.json`]: `${manifestJson}\n`,
        [`plugins/${slug}/rules/AGENTS.md`]: ruleMarkdown,
        [`plugins/${slug}/skills/${slug}/SKILL.md`]: skillMarkdown
      }
    };
  }

  return {
    kind: 'SKILL',
    slug,
    files: {
      [`skills/${slug}/SKILL.md`]: skillMarkdown
    }
  };
}

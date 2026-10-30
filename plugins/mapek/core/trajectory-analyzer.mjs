/**
 * MAPE-K Monitor & Analyze Engine — Bidirectional Human-AI Trajectory Process Miner
 * Pure Node.js headless module (zero DOM/browser dependencies).
 *
 * Reconstructs stateful Human <-> Agent interaction trajectories from Antigravity
 * session transcripts, detects structural process bottlenecks without domain-specific
 * hardcoded examples, and computes 5 operator mastery signals per session.
 */

import {
  classifyToolAction,
  normalizePathToken,
  unwrapTranscriptString
} from '../../pattern-harvester/core/harvester-engine.mjs';

export const DEFAULT_TRAJECTORY_CONFIG = Object.freeze({
  minOccurrences: 3,
  minDistinctSessions: 2,
  prematureMultiFileThreshold: 3,
  prematureReworkThreshold: 2,
  correctionSpiralThreshold: 3,
  contextEntropyPeakTokens: 150000,
  contextEntropyMinTurns: 20,
  humanRouterMinStreak: 5,
  humanRouterMaxPromptChars: 120,
  avgSecondsPerWastedTurn: 85,
  minNetSavedSeconds15Sessions: 150
});

const SUBAGENT_FIRST_STEP_RX =
  /Skill Attive \((?:Alpha|Beta|Gamma|Delta|Epsilon)|\bSei \*\*Subagent|\bAgisci esclusivamente come \*\*Subagent|\bYou have been spawned as a subagent|<subagent_context>|Sfidante [AB]\b|Giudice Cieco\b/i;

const CODE_FILE_EXT_RX = /\.(?:[cm]?[jt]sx?|py|dart|go|rs|java|kt|cs|cpp|c|h|html|css|scss|vue|svelte|sql)$/i;

const PLANNING_OR_ANCHOR_RX =
  /(?:^|\s)(?:\/plan|\/grill-me|\/skizzo|\/boost)\b|@[a-zA-Z0-9_./\\-]+|[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+/i;

const COMPACT_OR_GOAL_RX = /(?:^|\s)(?:\/compact|\/goal|\/teamwork)\b/i;

/**
 * Extracts user request text from a raw USER_INPUT content string.
 * @param {string} rawContent
 * @returns {string}
 */
export function extractCleanUserText(rawContent) {
  if (typeof rawContent !== 'string' || !rawContent) return '';
  const match = rawContent.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/i);
  const body = match ? match[1] : rawContent;
  return body.replace(/\s+/g, ' ').trim();
}

/**
 * Extracts normalized target file path from a modifying tool call, if present.
 * @param {{ name?: string, args?: Record<string, unknown> }} toolCall
 * @returns {string}
 */
export function extractModifiedFilePath(toolCall) {
  const name = String(toolCall?.name || '').trim();
  if (
    name !== 'edit_file' &&
    name !== 'write_file' &&
    name !== 'replace_file_content' &&
    name !== 'multi_replace_file_content' &&
    name !== 'write_to_file'
  ) {
    return '';
  }
  const args = toolCall?.args && typeof toolCall.args === 'object' ? toolCall.args : {};
  const raw = String(args.Path || args.TargetFile || '');
  const normalized = normalizePathToken(raw);
  // Ignore artifacts directory writes (e.g. implementation_plan.md, walkthrough.md) and cognitive files
  if (!normalized) return '';
  if (normalized.includes('/brain/') || /(?:^|\/)(?:memory|worklog|desiderata|notes)\.md$/i.test(normalized)) {
    return '';
  }
  return normalized;
}

/**
 * Parses a raw `transcript.jsonl` string into a structured trajectory object.
 * Returns `null` if the transcript belongs to an internal subagent rather than a human operator.
 *
 * @param {string} jsonlText
 * @param {{ conversationId?: string, workspace?: string, mtimeMs?: number }} [meta]
 * @returns {object | null}
 */
export function parseSessionTrajectoryFromJsonl(jsonlText, meta = {}) {
  if (typeof jsonlText !== 'string' || !jsonlText.trim()) return null;

  const lines = jsonlText.split(/\r?\n/).filter(Boolean);
  const turns = [];
  let currentTurn = null;
  let peakContextTokens = 0;
  let totalTokens = 0;
  let startedAtMs = 0;
  let endedAtMs = meta.mtimeMs || 0;
  let inferredWorkspace = meta.workspace || '';
  let sawFirstUserStep = false;

  for (let idx = 0; idx < lines.length; idx++) {
    let step;
    try {
      step = JSON.parse(lines[idx]);
    } catch {
      continue;
    }

    const stepTs = step.created_at ? Date.parse(step.created_at) || 0 : 0;
    if (stepTs > 0) {
      if (startedAtMs === 0) startedAtMs = stepTs;
      if (stepTs > endedAtMs) endedAtMs = stepTs;
    }

    const contentStr = typeof step.content === 'string' ? step.content : '';

    if (!inferredWorkspace && contentStr.includes('Command Working Directory:')) {
      const wdMatch = contentStr.match(/Command Working Directory:\s*([^\r\n<]+)/i);
      if (wdMatch && wdMatch[1]) {
        inferredWorkspace = normalizePathToken(wdMatch[1]).split('/').filter(Boolean).pop() || '';
      }
    }

    const isUserStep =
      step.type === 'USER_INPUT' ||
      step.source === 'USER_EXPLICIT' ||
      contentStr.includes('<USER_REQUEST>');

    if (isUserStep) {
      if (!sawFirstUserStep) {
        sawFirstUserStep = true;
        if (SUBAGENT_FIRST_STEP_RX.test(contentStr.slice(0, 2000))) {
          return null;
        }
      }
      const cleanText = extractCleanUserText(contentStr);
      if (!cleanText) continue;

      currentTurn = {
        promptIndex: turns.length + 1,
        userText: cleanText,
        timestampMs: stepTs,
        toolCalls: [],
        inputTokens: 0,
        outputTokens: 0
      };
      turns.push(currentTurn);
      continue;
    }

    if (Array.isArray(step.tool_calls) && currentTurn) {
      for (const tc of step.tool_calls) {
        const name = tc.name || tc.tool_name || '';
        let args = tc.args || tc.arguments || {};
        if (typeof args === 'string') {
          try {
            args = JSON.parse(unwrapTranscriptString(args));
          } catch {
            args = {};
          }
        }
        if (name) {
          currentTurn.toolCalls.push({ name, args });
          if (!inferredWorkspace) {
            const p = normalizePathToken(String(args.Path || args.TargetFile || ''));
            const ghMatch = p.match(/(?:github|repos|projects|workspace)\/([^/]+)\//);
            if (ghMatch) inferredWorkspace = ghMatch[1];
          }
        }
      }
    }

    const usage = step.token_usage || step.usage || step.metadata?.token_usage || null;
    if (usage && typeof usage === 'object') {
      const inTok = Number(usage.input_tokens || usage.prompt_tokens || 0);
      const cacheTok = Number(usage.cache_read_tokens || usage.cached_tokens || 0);
      const outTok = Number(usage.output_tokens || usage.completion_tokens || 0);
      const ctxPeak = inTok + cacheTok;
      if (ctxPeak > peakContextTokens) peakContextTokens = ctxPeak;
      totalTokens += ctxPeak + outTok;
      if (currentTurn) {
        currentTurn.inputTokens += ctxPeak;
        currentTurn.outputTokens += outTok;
      }
    }
  }

  if (!sawFirstUserStep || turns.length === 0) return null;

  return {
    conversationId: meta.conversationId || 'unknown-session',
    workspace: inferredWorkspace || 'default-workspace',
    startedAtMs: startedAtMs || endedAtMs,
    endedAtMs,
    peakContextTokens,
    totalTokens,
    turns
  };
}

/**
 * Analyzes a single human-AI session trajectory to extract structural friction episodes
 * and 5 normalized operator mastery signals (`0.0 .. 1.0`).
 *
 * @param {{
 *   conversationId: string,
 *   workspace?: string,
 *   startedAtMs?: number,
 *   endedAtMs?: number,
 *   peakContextTokens?: number,
 *   totalTokens?: number,
 *   turns: Array<{
 *     promptIndex?: number,
 *     userText: string,
 *     timestampMs?: number,
 *     toolCalls?: Array<{ name?: string, args?: Record<string, unknown> }>,
 *     inputTokens?: number,
 *     outputTokens?: number
 *   }>
 * }} session
 * @param {Partial<typeof DEFAULT_TRAJECTORY_CONFIG>} [customConfig]
 * @returns {{
 *   conversationId: string,
 *   workspace: string,
 *   endedAtMs: number,
 *   turnCount: number,
 *   modifiedFilesCount: number,
 *   episodes: Array<object>,
 *   masterySignals: {
 *     specClarity: number,
 *     verificationDiscipline: number,
 *     contextHygiene: number,
 *     delegationLeverage: number,
 *     deterministicDebugging: number
 *   }
 * }}
 */
export function analyzeSessionTrajectory(session, customConfig = {}) {
  const cfg = { ...DEFAULT_TRAJECTORY_CONFIG, ...customConfig };
  const turns = Array.isArray(session?.turns) ? session.turns : [];
  const convId = session?.conversationId || 'unknown';
  const workspace = session?.workspace || 'default-workspace';
  const endedAtMs = Number(session?.endedAtMs || session?.startedAtMs || 0);

  const allModifiedFiles = new Set();
  const codeModifiedFiles = new Set();
  const fileEditTurnsMap = new Map();
  let firstEditTurnIdx = -1;
  let hadEarlyAlignment = false;
  let totalTestOrValidateCalls = 0;
  let subagentCalls = 0;
  let usedCompactOrGoal = false;
  let unverifiedEditSpiralStreak = 0;
  let maxUnverifiedEditSpiral = 0;
  let lastTurnEditedFiles = new Set();
  let shortRouterStreak = 0;
  let maxShortRouterStreak = 0;

  let computedPeakContext = Number(session?.peakContextTokens || 0);

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const text = String(turn.userText || '').trim();
    const tcs = Array.isArray(turn.toolCalls) ? turn.toolCalls : [];
    const actions = tcs.map((tc) => classifyToolAction(tc));

    if (Number(turn.inputTokens || 0) > computedPeakContext) {
      computedPeakContext = Number(turn.inputTokens || 0);
    }

    if (COMPACT_OR_GOAL_RX.test(text)) {
      usedCompactOrGoal = true;
    }

    if (i <= 1 && (PLANNING_OR_ANCHOR_RX.test(text) || actions.includes('INTERACT:ASK'))) {
      hadEarlyAlignment = true;
    }

    const turnModifiedFiles = new Set();
    let turnHasVerification = false;

    for (let j = 0; j < tcs.length; j++) {
      const action = actions[j];
      if (action === 'EXEC:TEST' || action === 'EXEC:VALIDATE') {
        totalTestOrValidateCalls += 1;
        turnHasVerification = true;
      }
      if (action === 'ORCHESTRATE:SUBAGENT') {
        subagentCalls += 1;
      }
      const modPath = extractModifiedFilePath(tcs[j]);
      if (modPath) {
        allModifiedFiles.add(modPath);
        turnModifiedFiles.add(modPath);
        if (CODE_FILE_EXT_RX.test(modPath)) {
          codeModifiedFiles.add(modPath);
        }
        if (firstEditTurnIdx === -1) firstEditTurnIdx = i;
        const prevTurns = fileEditTurnsMap.get(modPath) || [];
        if (prevTurns[prevTurns.length - 1] !== i) {
          prevTurns.push(i);
          fileEditTurnsMap.set(modPath, prevTurns);
        }
      }
    }

    // Track unverified consecutive re-edits on overlapping files
    if (turnModifiedFiles.size > 0) {
      const overlapsPrev = [...turnModifiedFiles].some((f) => lastTurnEditedFiles.has(f));
      if (overlapsPrev && !turnHasVerification) {
        unverifiedEditSpiralStreak += 1;
      } else if (!turnHasVerification) {
        unverifiedEditSpiralStreak = 1;
      } else {
        unverifiedEditSpiralStreak = 0;
      }
      if (unverifiedEditSpiralStreak > maxUnverifiedEditSpiral) {
        maxUnverifiedEditSpiral = unverifiedEditSpiralStreak;
      }
      lastTurnEditedFiles = turnModifiedFiles;
    } else if (turnHasVerification) {
      unverifiedEditSpiralStreak = 0;
    }

    // Track human-router micromanagement streak
    const isShortOperationalNudge =
      text.length > 0 &&
      text.length <= cfg.humanRouterMaxPromptChars &&
      !text.startsWith('/take-note') &&
      !text.startsWith('/memory-sync') &&
      (turnModifiedFiles.size > 0 || actions.some((a) => a.startsWith('EXEC:')));

    if (isShortOperationalNudge && !usedCompactOrGoal && subagentCalls === 0) {
      shortRouterStreak += 1;
      if (shortRouterStreak > maxShortRouterStreak) {
        maxShortRouterStreak = shortRouterStreak;
      }
    } else {
      shortRouterStreak = 0;
    }
  }

  // Count rework turns (edits beyond the first 1-2 touches on the same file across distinct user prompts)
  let reworkTurns = 0;
  for (const turnIndices of fileEditTurnsMap.values()) {
    if (turnIndices.length >= 3) {
      reworkTurns += turnIndices.length - 2;
    }
  }

  const episodes = [];

  // Detector 1: PREMATURE_IMPLEMENTATION_LOOP
  if (
    allModifiedFiles.size >= cfg.prematureMultiFileThreshold &&
    firstEditTurnIdx !== -1 &&
    firstEditTurnIdx <= 1 &&
    !hadEarlyAlignment &&
    reworkTurns >= cfg.prematureReworkThreshold
  ) {
    episodes.push({
      detectorId: 'PREMATURE_IMPLEMENTATION_LOOP',
      conversationId: convId,
      workspace,
      endedAtMs,
      wastedTurns: reworkTurns,
      wastedSeconds: reworkTurns * cfg.avgSecondsPerWastedTurn,
      wastedTokens: reworkTurns * 18000,
      evidence: {
        modifiedFilesCount: allModifiedFiles.size,
        reworkTurns,
        firstEditTurn: firstEditTurnIdx + 1
      }
    });
  }

  // Detector 2: UNANCHORED_CORRECTION_SPIRAL
  if (maxUnverifiedEditSpiral >= cfg.correctionSpiralThreshold) {
    const wasted = maxUnverifiedEditSpiral - 1;
    episodes.push({
      detectorId: 'UNANCHORED_CORRECTION_SPIRAL',
      conversationId: convId,
      workspace,
      endedAtMs,
      wastedTurns: wasted,
      wastedSeconds: wasted * cfg.avgSecondsPerWastedTurn,
      wastedTokens: wasted * 20000,
      evidence: {
        consecutiveUnverifiedEdits: maxUnverifiedEditSpiral
      }
    });
  }

  // Detector 3: CONTEXT_ENTROPY_DRIFT
  if (
    computedPeakContext >= cfg.contextEntropyPeakTokens &&
    turns.length >= cfg.contextEntropyMinTurns &&
    !usedCompactOrGoal &&
    subagentCalls === 0
  ) {
    const excessTurns = turns.length - cfg.contextEntropyMinTurns + 2;
    episodes.push({
      detectorId: 'CONTEXT_ENTROPY_DRIFT',
      conversationId: convId,
      workspace,
      endedAtMs,
      wastedTurns: Math.max(2, Math.round(excessTurns * 0.5)),
      wastedSeconds: Math.max(2, Math.round(excessTurns * 0.5)) * 45,
      wastedTokens: excessTurns * Math.max(30000, computedPeakContext - 100000),
      evidence: {
        peakContextTokens: computedPeakContext,
        turnCount: turns.length
      }
    });
  }

  // Detector 4: HUMAN_ROUTER_MICROMANAGEMENT
  if (maxShortRouterStreak >= cfg.humanRouterMinStreak) {
    const savedTurns = maxShortRouterStreak - 2;
    episodes.push({
      detectorId: 'HUMAN_ROUTER_MICROMANAGEMENT',
      conversationId: convId,
      workspace,
      endedAtMs,
      wastedTurns: savedTurns,
      wastedSeconds: savedTurns * 65,
      wastedTokens: savedTurns * 14000,
      evidence: {
        shortPromptStreak: maxShortRouterStreak
      }
    });
  }

  // Detector 5: MISSING_VERIFICATION_ORACLE
  if (codeModifiedFiles.size >= 2 && turns.length >= 2 && totalTestOrValidateCalls === 0) {
    episodes.push({
      detectorId: 'MISSING_VERIFICATION_ORACLE',
      conversationId: convId,
      workspace,
      endedAtMs,
      wastedTurns: 1,
      wastedSeconds: 75,
      wastedTokens: 12000,
      evidence: {
        unverifiedCodeFiles: codeModifiedFiles.size
      }
    });
  }

  // Compute 5 normalized mastery signals (1.0 = optimal practice, lower = detected friction)
  const specClarity =
    allModifiedFiles.size < cfg.prematureMultiFileThreshold
      ? 1.0
      : hadEarlyAlignment
        ? 1.0
        : reworkTurns >= cfg.prematureReworkThreshold
          ? 0.25
          : 0.65;

  const verificationDiscipline =
    codeModifiedFiles.size === 0 ? 1.0 : totalTestOrValidateCalls > 0 ? 1.0 : 0.2;

  const contextHygiene =
    computedPeakContext < cfg.contextEntropyPeakTokens || usedCompactOrGoal || subagentCalls > 0
      ? 1.0
      : 0.3;

  const delegationLeverage =
    maxShortRouterStreak < cfg.humanRouterMinStreak ? 1.0 : 0.3;

  const deterministicDebugging =
    maxUnverifiedEditSpiral < cfg.correctionSpiralThreshold ? 1.0 : 0.25;

  return {
    conversationId: convId,
    workspace,
    endedAtMs,
    turnCount: turns.length,
    modifiedFilesCount: allModifiedFiles.size,
    episodes,
    masterySignals: {
      specClarity,
      verificationDiscipline,
      contextHygiene,
      delegationLeverage,
      deterministicDebugging
    }
  };
}

const DETECTOR_STRUCTURAL_META = Object.freeze({
  PREMATURE_IMPLEMENTATION_LOOP: {
    patternKey: 'process:premature-implementation-loop',
    precondition: 'Task modifies >= 3 source files without upfront /plan, /grill-me, or explicit @file anchors',
    transformation: 'Run bounded impact discovery and lock file touch-set + acceptance oracle before first edit',
    falsifiableOracle: 'Rework edits on identical files drop below 2 across subsequent multi-file tasks',
    staticallyCheckable: false,
    requiresIsolatedContext: false,
    isMultiStepProcedure: true
  },
  UNANCHORED_CORRECTION_SPIRAL: {
    patternKey: 'process:unanchored-correction-spiral',
    precondition: '>= 3 consecutive edit turns on overlapping files without intermediate test or probe execution',
    transformation: 'Halt blind patching, inject deterministic trace or failing invariant test, verify green before next edit',
    falsifiableOracle: 'Zero consecutive re-edit spirals >= 3 without an intermediate EXEC:TEST or EXEC:VALIDATE step',
    staticallyCheckable: true,
    requiresIsolatedContext: false,
    isMultiStepProcedure: false
  },
  CONTEXT_ENTROPY_DRIFT: {
    patternKey: 'process:context-entropy-drift',
    precondition: 'Active session exceeds 150k context tokens and 20 turns without /compact or subagent offloading',
    transformation: 'Delegate read-heavy exploration and verification audits to an isolated read-only subagent',
    falsifiableOracle: 'Parent coding sessions stay below 150k peak context tokens or offload exploration to agents/*.md',
    staticallyCheckable: false,
    requiresIsolatedContext: true,
    isMultiStepProcedure: false
  },
  HUMAN_ROUTER_MICROMANAGEMENT: {
    patternKey: 'process:human-router-micromanagement',
    precondition: 'Operator sends >= 5 short consecutive step-by-step nudges driving mechanical edit/run loops',
    transformation: 'Package the recurring verification/execution loop into an autonomous subagent or /goal contract',
    falsifiableOracle: 'Sequential micro-prompt streaks >= 5 drop by >= 30% over the next 10 sessions',
    staticallyCheckable: false,
    requiresIsolatedContext: true,
    isMultiStepProcedure: false
  },
  MISSING_VERIFICATION_ORACLE: {
    patternKey: 'process:missing-verification-oracle',
    precondition: 'Session modifies >= 2 code files and closes without executing any automated test or static validator',
    transformation: 'Enforce pre-delivery verification check executing discovered unit tests or static validator',
    falsifiableOracle: '100% of multi-file code modification sessions execute at least one test/validation command before exit',
    staticallyCheckable: true,
    requiresIsolatedContext: false,
    isMultiStepProcedure: false
  }
});

/**
 * Aggregates session-level friction episodes across sessions and workspaces,
 * filtering out single-session noise and extracting generalized structural triples.
 *
 * @param {Array<ReturnType<typeof analyzeSessionTrajectory>>} analyzedSessions
 * @param {Partial<typeof DEFAULT_TRAJECTORY_CONFIG>} [customConfig]
 * @returns {Array<object>}
 */
export function aggregateCrossSessionBottlenecks(analyzedSessions, customConfig = {}) {
  const cfg = { ...DEFAULT_TRAJECTORY_CONFIG, ...customConfig };
  if (!Array.isArray(analyzedSessions) || analyzedSessions.length === 0) return [];

  const totalHumanSessions = Math.max(1, analyzedSessions.length);
  const grouped = new Map();

  for (const s of analyzedSessions) {
    if (!s || !Array.isArray(s.episodes)) continue;
    for (const ep of s.episodes) {
      const bucket = grouped.get(ep.detectorId) || {
        detectorId: ep.detectorId,
        occurrences: 0,
        sessions: new Set(),
        workspaces: new Set(),
        totalWastedTurns: 0,
        totalWastedSeconds: 0,
        totalWastedTokens: 0,
        latestAtMs: 0,
        sampleConversations: []
      };
      bucket.occurrences += 1;
      bucket.sessions.add(ep.conversationId);
      bucket.workspaces.add(ep.workspace || 'default-workspace');
      bucket.totalWastedTurns += Number(ep.wastedTurns || 0);
      bucket.totalWastedSeconds += Number(ep.wastedSeconds || 0);
      bucket.totalWastedTokens += Number(ep.wastedTokens || 0);
      if (Number(ep.endedAtMs || 0) > bucket.latestAtMs) {
        bucket.latestAtMs = Number(ep.endedAtMs || 0);
      }
      if (
        bucket.sampleConversations.length < 4 &&
        !bucket.sampleConversations.includes(ep.conversationId)
      ) {
        bucket.sampleConversations.push(ep.conversationId);
      }
      grouped.set(ep.detectorId, bucket);
    }
  }

  const clusters = [];
  for (const [detectorId, b] of grouped.entries()) {
    const distinctSessions = b.sessions.size;
    const distinctWorkspaces = b.workspaces.size;
    if (b.occurrences < cfg.minOccurrences || distinctSessions < cfg.minDistinctSessions) {
      continue;
    }

    const avgSavedPerOccurrence = b.totalWastedSeconds / b.occurrences;
    const expectedOccurrences15 = (b.occurrences / totalHumanSessions) * 15;
    const projectedSavedSeconds15 = Math.round(expectedOccurrences15 * avgSavedPerOccurrence - 45);

    if (projectedSavedSeconds15 < cfg.minNetSavedSeconds15Sessions && b.totalWastedTokens < 50000) {
      continue;
    }

    const meta = DETECTOR_STRUCTURAL_META[detectorId];
    if (!meta) continue;

    clusters.push({
      detectorId,
      patternKey: meta.patternKey,
      occurrences: b.occurrences,
      distinctSessions,
      distinctWorkspaces,
      workspaces: [...b.workspaces],
      sampleConversations: b.sampleConversations,
      baselineFrictionRate: Number((distinctSessions / totalHumanSessions).toFixed(3)),
      totalWastedTurns: b.totalWastedTurns,
      totalWastedSeconds: b.totalWastedSeconds,
      totalWastedTokens: b.totalWastedTokens,
      projectedSavedSeconds15,
      latestAtMs: b.latestAtMs,
      generalizedContract: {
        precondition: meta.precondition,
        transformation: meta.transformation,
        falsifiableOracle: meta.falsifiableOracle
      },
      staticallyCheckable: meta.staticallyCheckable,
      requiresIsolatedContext: meta.requiresIsolatedContext,
      isMultiStepProcedure: meta.isMultiStepProcedure
    });
  }

  return clusters.sort(
    (a, b) =>
      b.projectedSavedSeconds15 - a.projectedSavedSeconds15 ||
      b.totalWastedTokens - a.totalWastedTokens
  );
}

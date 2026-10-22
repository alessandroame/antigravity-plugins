/**
 * Local Brain Session Miner & Incremental Backfill Engine (Headless Core)
 * Pure Node.js module with zero DOM/browser dependencies.
 * Scans ~/.gemini/antigravity/brain/<conversationId>/.system_generated/logs/transcript.jsonl,
 * maintains an incremental cache in sessions-index.json (keyed by mtimeMs & size),
 * and aggregates comprehensive usage metrics across sessions, workspaces, models,
 * active time, hourly/weekday habits, tokens, slash commands, plugins/skills, and tools.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, basename } from 'node:path';

export const MAX_IDLE_GAP_MS = 15 * 60 * 1000; // 15 minutes max idle gap between active steps
export const MIN_ACTIVE_SESSION_MS = 5000; // 5s floor for single-turn sessions
export const INDEX_SCHEMA_VERSION = 2;

const SUBAGENT_PROMPT_HEAD_RX =
  /Skill Attive \((?:Alpha|Beta|Gamma|Delta|Epsilon)|\bSei \*\*Subagent|\bAgisci esclusivamente come \*\*Subagent|\bYou have been spawned as a subagent|<subagent_context>|Sfidante [AB]\b|Giudice Cieco\b/i;

const KNOWN_SLASH_TO_PLUGIN_SKILL = {
  '/skizzo': { plugin: 'skizzo', skill: 'skizzo' },
  '/next-step': { plugin: 'cognitive-persistence', skill: 'next-step' },
  '/memory-sync': { plugin: 'cognitive-persistence', skill: 'memory-sync' },
  '/take-note': { plugin: 'cognitive-persistence', skill: 'take-note' },
  '/review-notes': { plugin: 'cognitive-persistence', skill: 'review-notes' },
  '/how-its-made': { plugin: 'code-inspector', skill: 'how-its-made' },
  '/ab-bench': { plugin: 'ab-bench', skill: 'ab-bench' },
  '/focus-audit': { plugin: 'human-governor', skill: 'focus-audit' },
  '/plugin-analytics': { plugin: 'telemetry-analytics', skill: 'plugin-analytics' },
  '/telemetry-export': { plugin: 'telemetry-analytics', skill: 'telemetry-export' },
  '/validate-plugins': { plugin: 'workspace', skill: 'validate-plugins' },
  '/install-plugin': { plugin: 'workspace', skill: 'install-plugin' },
  '/tone-audit': { plugin: 'engineering-sobriety', skill: 'tone-audit' },
  '/prompt-refactor': { plugin: 'proactive-mentorship', skill: 'prompt-refactor' }
};

const EXCLUDED_SLASH_TOKENS = new Set([
  '/bin',
  '/usr',
  '/etc',
  '/var',
  '/tmp',
  '/dev',
  '/proc',
  '/sys',
  '/home',
  '/root',
  '/opt',
  '/src',
  '/core',
  '/ui',
  '/api',
  '/app',
  '/dist',
  '/build',
  '/test',
  '/tests',
  '/scripts',
  '/plugins',
  '/skills',
  '/rules'
]);

/**
 * Normalizes a file path from tool arguments (stripping escaped quotes and normalizing slashes).
 * @param {unknown} rawPath
 * @returns {string}
 */
export function normalizeToolPath(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath) return '';
  return rawPath
    .trim()
    .replace(/^(?:\\*["'])+|(?:\\*["'])+$/g, '')
    .replace(/\\+/g, '/')
    .replace(/\/+/g, '/');
}

/**
 * Detects plugin and skill identifiers from a normalized or raw file path.
 * Supports both legacy view_file and modern read_file/edit_file/write_file tool paths.
 * @param {string} filePath
 * @returns {{ plugin: string, skill: string | null } | null}
 */
export function parseSkillAndPluginFromPath(filePath) {
  const normalized = normalizeToolPath(filePath).toLowerCase();
  if (!normalized) return null;

  // Pattern 1: /plugins/<plugin-name>/skills/<skill-name>/...
  const pluginSkillMatch = normalized.match(/(?:^|\/)plugins\/([^/]+)\/skills\/([^/]+)/);
  if (pluginSkillMatch && pluginSkillMatch[1] !== 'plugins') {
    return { plugin: pluginSkillMatch[1], skill: pluginSkillMatch[2] };
  }

  // Pattern 2: /.agents/skills/<skill-name>/...
  const workspaceSkillMatch = normalized.match(/(?:^|\/)\.agents\/skills\/([^/]+)/);
  if (workspaceSkillMatch) {
    return { plugin: 'workspace', skill: workspaceSkillMatch[1] };
  }

  // Pattern 3: /builtin/skills/<skill-name>/... or /skills/<skill-name>/skill.md
  const builtinSkillMatch = normalized.match(/(?:^|\/)(?:builtin\/)?skills\/([^/]+)\/skill\.md/);
  if (builtinSkillMatch) {
    return { plugin: 'builtin', skill: builtinSkillMatch[1] };
  }

  // Pattern 4: direct plugin reference (/plugins/<plugin-name>/...)
  const directPluginMatch = normalized.match(/(?:^|\/)plugins\/([^/]+)(?:\/|$)/);
  if (directPluginMatch && directPluginMatch[1] !== 'plugins') {
    return { plugin: directPluginMatch[1], skill: null };
  }

  return null;
}

/**
 * Extracts a candidate workspace root path from a file path used in tool calls.
 * Ignores internal ~/.gemini/antigravity or ~/.gemini/config paths.
 * @param {string} rawPath
 * @returns {{ workspace: string, workspaceName: string } | null}
 */
export function extractWorkspaceCandidateFromPath(rawPath) {
  const norm = normalizeToolPath(rawPath);
  if (!norm) return null;
  const lower = norm.toLowerCase();

  // Ignore internal Antigravity brain, analytics, or global config directories
  if (
    lower.includes('/.gemini/antigravity/') ||
    lower.includes('/.gemini/config/') ||
    lower.includes('/appdata/local/temp')
  ) {
    return null;
  }

  // Match standard repository directories: <drive>:/github/<repo> or <drive>:/repos/<repo> or <drive>:/projects/<repo>
  const repoMatch = norm.match(/^([a-zA-Z]:\/(?:github|repos|projects|workspace|work)\/[^/]+)/i);
  if (repoMatch) {
    const rawWs = repoMatch[1];
    const wsKey = rawWs.toLowerCase();
    return { workspace: wsKey, workspaceName: basename(rawWs) };
  }

  // Match user special folders like Downloads, Desktop, Documents if directly used
  const userFolderMatch = norm.match(/^([a-zA-Z]:\/Users\/[^/]+\/(?:Downloads|Desktop|Documents))/i);
  if (userFolderMatch) {
    const rawWs = userFolderMatch[1];
    const wsKey = rawWs.toLowerCase();
    return { workspace: wsKey, workspaceName: basename(rawWs) };
  }

  return null;
}

/**
 * Extracts declared ETA in milliseconds from step tool calls.
 * @param {object} step
 * @returns {number | null}
 */
export function extractDeclaredEtaMs(step) {
  let toolText = '';
  if (Array.isArray(step?.tool_calls)) {
    for (const tc of step.tool_calls) {
      if (tc?.args?.toolAction) toolText += ' ' + tc.args.toolAction;
      if (tc?.args?.toolSummary) toolText += ' ' + tc.args.toolSummary;
    }
  }
  if (!toolText) return null;

  const match = toolText.match(
    /(?:【\s*(?:[🟢🟡🔴🟠]\s*)?(?:ETA(?:\s+tot)?:?\s*)?~?(\d+)s\s*】|·\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\b|\(\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\s*\)|\bETA(?:\s+tot)?:?\s*~?(\d+)s\b)/iu
  );
  if (!match) return null;
  const seconds = parseInt(match[1] || match[2] || match[3] || match[4], 10);
  if (Number.isNaN(seconds) || seconds <= 0) return null;
  return seconds * 1000;
}

/**
 * Formats a timestamp (ms) into local YYYY-MM-DD string.
 * @param {number} tsMs
 * @returns {string}
 */
export function toLocalDateKey(tsMs) {
  const d = new Date(tsMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extracts clean user request text and metadata from a USER_INPUT content block.
 * @param {string} rawContent
 * @returns {{ cleanRequest: string, modelChanges: string[], slashCommands: string[] }}
 */
export function parseUserStepContent(rawContent) {
  const content = typeof rawContent === 'string' ? rawContent : '';
  const modelChanges = [];

  // Extract model selection changes from <USER_SETTINGS_CHANGE>
  const settingsRegex = /<USER_SETTINGS_CHANGE>([\s\S]*?)<\/USER_SETTINGS_CHANGE>/gi;
  for (const match of content.matchAll(settingsRegex)) {
    const block = match[1] || '';
    const modelMatch = block.match(/Model Selection`\s+from\s+.*?\s+to\s+([^\r\n.]+?)(?:\.|\r|\n|$)/i);
    if (modelMatch && modelMatch[1]) {
      const modelName = modelMatch[1].trim();
      if (modelName && modelName.toLowerCase() !== 'none') {
        modelChanges.push(modelName);
      }
    }
  }

  // Extract user request body
  let cleanRequest = '';
  const reqMatch = content.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/i);
  if (reqMatch && reqMatch[1]) {
    cleanRequest = reqMatch[1].trim();
  } else {
    cleanRequest = content
      .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/gi, '')
      .replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/gi, '')
      .replace(/<\/?USER_REQUEST>/gi, '')
      .trim();
  }

  // Extract slash commands used by the user
  const slashCommands = [];
  if (cleanRequest && !cleanRequest.includes('<SYSTEM_MESSAGE>')) {
    const slashRegex = /(?:^|\s)(\/[a-z][a-z0-9_-]{1,30})\b/gi;
    for (const m of cleanRequest.matchAll(slashRegex)) {
      const cmd = m[1].toLowerCase();
      if (!EXCLUDED_SLASH_TOKENS.has(cmd)) {
        slashCommands.push(cmd);
      }
    }
  }

  return { cleanRequest, modelChanges, slashCommands };
}

/**
 * Parses a raw transcript.jsonl string into a structured session summary object.
 * @param {string} rawJsonl
 * @param {string} conversationId
 * @param {number} [fallbackMtimeMs]
 * @returns {object}
 */
export function parseTranscriptContent(rawJsonl, conversationId, fallbackMtimeMs = Date.now()) {
  const lines = typeof rawJsonl === 'string' ? rawJsonl.split(/\r?\n/).filter((l) => l.trim().length > 0) : [];

  let isSubagent = false;
  const headText = typeof rawJsonl === 'string' ? rawJsonl.slice(0, 8192) : '';
  const firstUserReqIdx = headText.indexOf('<USER_REQUEST>');
  const firstUserReqEndIdx =
    firstUserReqIdx !== -1 ? headText.indexOf('</USER_REQUEST>', firstUserReqIdx) : -1;
  const firstAgentMsgIdx = headText.search(/\[Message\] timestamp=[^\]]+sender=[0-9a-f-]{36}/i);
  if (firstAgentMsgIdx !== -1 && (firstUserReqIdx === -1 || firstAgentMsgIdx < firstUserReqIdx)) {
    isSubagent = true;
  }
  const headBeforeFirstUserEnd =
    firstUserReqEndIdx !== -1
      ? headText.slice(0, firstUserReqEndIdx)
      : firstUserReqIdx !== -1
        ? headText.slice(0, firstUserReqIdx + 600)
        : headText.slice(0, 1500);
  if (SUBAGENT_PROMPT_HEAD_RX.test(headBeforeFirstUserEnd)) {
    isSubagent = true;
  }

  let topic = '';
  let userPromptsCount = 0;
  let plannerTurnsCount = 0;
  let toolCallsCount = 0;
  let toolErrorsCount = 0;
  let subagentsSpawnedCount = 0;
  let questionsAskedCount = 0;

  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;

  const timestamps = [];
  const promptTimestamps = [];
  const modelsUsed = {};
  let lastModel = null;
  const slashCommands = {};
  const plugins = {};
  const tools = {};
  const workspaceVotes = new Map();

  let declaredEtaCount = 0;
  let totalDeclaredEtaMs = 0;

  const recordPluginSkill = (pluginName, skillName) => {
    if (!pluginName) return;
    if (!plugins[pluginName]) {
      plugins[pluginName] = { invocations: 0, skills: {} };
    }
    plugins[pluginName].invocations += 1;
    if (skillName) {
      plugins[pluginName].skills[skillName] = (plugins[pluginName].skills[skillName] || 0) + 1;
    }
  };

  for (const line of lines) {
    let step;
    try {
      step = JSON.parse(line);
    } catch {
      continue;
    }

    if (
      step.step_index === 0 &&
      step.type === 'SYSTEM_MESSAGE' &&
      SUBAGENT_PROMPT_HEAD_RX.test(step.content || '')
    ) {
      isSubagent = true;
    }

    let stepTs = null;
    if (step.created_at) {
      const parsedTs = new Date(step.created_at).getTime();
      if (!Number.isNaN(parsedTs) && parsedTs > 0) {
        stepTs = parsedTs;
        timestamps.push(parsedTs);
      }
    }

    const isExplicitUser =
      (step.type === 'USER_INPUT' && step.source === 'USER_EXPLICIT') ||
      step.type === 'CORTEX_STEP_TYPE_USER_INPUT';

    if (isExplicitUser) {
      const { cleanRequest, modelChanges, slashCommands: cmds } = parseUserStepContent(step.content || '');
      if (cleanRequest && SUBAGENT_PROMPT_HEAD_RX.test(cleanRequest.slice(0, 600)) && userPromptsCount === 0) {
        isSubagent = true;
      }

      if (cleanRequest && !cleanRequest.includes('<SYSTEM_MESSAGE>')) {
        userPromptsCount += 1;
        if (stepTs) promptTimestamps.push(stepTs);
        if (!topic) {
          topic = cleanRequest.replace(/\s+/g, ' ').slice(0, 90);
        }
      }

      for (const m of modelChanges) {
        lastModel = m;
        modelsUsed[m] = (modelsUsed[m] || 0) + 1;
      }

      for (const cmd of cmds) {
        slashCommands[cmd] = (slashCommands[cmd] || 0) + 1;
        const mapped = KNOWN_SLASH_TO_PLUGIN_SKILL[cmd];
        if (mapped) {
          recordPluginSkill(mapped.plugin, mapped.skill);
        }
      }
    }

    if (step.type === 'PLANNER_RESPONSE' || step.source === 'MODEL') {
      if (step.type === 'PLANNER_RESPONSE') {
        plannerTurnsCount += 1;
        if (lastModel) {
          modelsUsed[lastModel] = (modelsUsed[lastModel] || 0) + 1;
        }
      }

      if (typeof step.input_tokens === 'number') inputTokens += step.input_tokens;
      if (typeof step.output_tokens === 'number') outputTokens += step.output_tokens;
      if (typeof step.cache_read_tokens === 'number') cacheReadTokens += step.cache_read_tokens;

      const etaMs = extractDeclaredEtaMs(step);
      if (etaMs) {
        declaredEtaCount += 1;
        totalDeclaredEtaMs += etaMs;
      }
    }

    const calls = Array.isArray(step.tool_calls) ? step.tool_calls.filter((tc) => tc && tc.name) : [];
    for (const tc of calls) {
      const tName = tc.name;
      toolCallsCount += 1;
      if (!tools[tName]) {
        tools[tName] = { calls: 0, errors: 0 };
      }
      tools[tName].calls += 1;

      if (tName === 'invoke_subagent') subagentsSpawnedCount += 1;
      if (tName === 'ask_question') questionsAskedCount += 1;

      // Extract file path from any file/directory tool
      const rawFilePath =
        tc.args?.Path ||
        tc.args?.AbsolutePath ||
        tc.args?.TargetFile ||
        tc.args?.DirectoryPath ||
        tc.args?.SearchPath ||
        tc.args?.Cwd ||
        '';

      if (rawFilePath) {
        const parsedSkill = parseSkillAndPluginFromPath(rawFilePath);
        if (parsedSkill && (tName === 'view_file' || tName === 'read_file')) {
          recordPluginSkill(parsedSkill.plugin, parsedSkill.skill);
        }

        const wsCandidate = extractWorkspaceCandidateFromPath(rawFilePath);
        if (wsCandidate) {
          // Give higher weight to project files vs skill files inside antigravity-plugins
          const isSkillRead = Boolean(parsedSkill);
          const weight = isSkillRead ? 1 : 5;
          const prev = workspaceVotes.get(wsCandidate.workspace) || {
            workspace: wsCandidate.workspace,
            workspaceName: wsCandidate.workspaceName,
            score: 0
          };
          prev.score += weight;
          // Prefer mixed-case display name (e.g. GlideMind over glidemind)
          if (/[A-Z]/.test(wsCandidate.workspaceName) && !/[A-Z]/.test(prev.workspaceName)) {
            prev.workspaceName = wsCandidate.workspaceName;
          }
          workspaceVotes.set(wsCandidate.workspace, prev);
        }
      }
    }

    if (step.status === 'ERROR' || (step.content && /exited with code [^0]/i.test(step.content))) {
      toolErrorsCount += 1;
      const lastTool = calls.length > 0 ? calls[calls.length - 1].name : null;
      if (lastTool && tools[lastTool]) {
        tools[lastTool].errors += 1;
      }
    }
  }

  if (userPromptsCount === 0) {
    isSubagent = true;
  }

  timestamps.sort((a, b) => a - b);
  const firstStepAtMs = timestamps.length > 0 ? timestamps[0] : fallbackMtimeMs;
  const lastStepAtMs = timestamps.length > 0 ? timestamps[timestamps.length - 1] : fallbackMtimeMs;

  let activeDurationMs = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const gap = timestamps[i] - timestamps[i - 1];
    if (gap > 0 && gap <= MAX_IDLE_GAP_MS) {
      activeDurationMs += gap;
    }
  }
  if (timestamps.length > 0 && activeDurationMs < MIN_ACTIVE_SESSION_MS) {
    activeDurationMs = MIN_ACTIVE_SESSION_MS;
  }

  // Pick highest-voted workspace
  let workspace = 'unknown';
  let workspaceName = 'Non assegnato';
  if (workspaceVotes.size > 0) {
    const sortedWs = [...workspaceVotes.values()].sort((a, b) => b.score - a.score);
    workspace = sortedWs[0].workspace;
    workspaceName = sortedWs[0].workspaceName;
  }

  // Activity buckets (hours 0..23 and weekdays 0..6) based on user prompts or step timestamps
  const sampleTimestamps = promptTimestamps.length > 0 ? promptTimestamps : timestamps.slice(0, 1);
  const hourlyMap = {};
  const weekdayMap = {};
  for (const ts of sampleTimestamps) {
    const d = new Date(ts);
    const hr = d.getHours();
    const wd = d.getDay();
    hourlyMap[hr] = (hourlyMap[hr] || 0) + 1;
    weekdayMap[wd] = (weekdayMap[wd] || 0) + 1;
  }

  return {
    conversationId,
    isSubagent,
    topic: topic || (isSubagent ? 'Subagent Task' : 'Sessione Antigravity'),
    workspace,
    workspaceName,
    firstStepAtMs,
    lastStepAtMs,
    dateKey: toLocalDateKey(lastStepAtMs),
    userPromptsCount,
    plannerTurnsCount,
    toolCallsCount,
    toolErrorsCount,
    subagentsSpawnedCount,
    questionsAskedCount,
    activeDurationMs,
    declaredEtaCount,
    totalDeclaredEtaMs,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      cacheRead: cacheReadTokens
    },
    modelsUsed,
    slashCommands,
    plugins,
    tools,
    hourlyMap,
    weekdayMap
  };
}

/**
 * Scans the brain directory and incrementally updates sessions-index.json in analyticsDir.
 * @param {{ brainDir?: string, analyticsDir?: string, forceRebuild?: boolean }} [options]
 * @returns {{ index: object, stats: { scanned: number, cached: number, totalFiles: number } }}
 */
export function syncBrainSessionsIndex(options = {}) {
  const brainDir =
    options.brainDir ||
    (process.env.ANTIGRAVITY_BRAIN_DIR
      ? resolve(process.env.ANTIGRAVITY_BRAIN_DIR)
      : join(homedir(), '.gemini', 'antigravity', 'brain'));

  const analyticsDir =
    options.analyticsDir ||
    (process.env.ANTIGRAVITY_ANALYTICS_DIR
      ? resolve(process.env.ANTIGRAVITY_ANALYTICS_DIR)
      : join(homedir(), '.gemini', 'antigravity', 'analytics'));

  mkdirSync(analyticsDir, { recursive: true });
  const indexFile = join(analyticsDir, 'sessions-index.json');

  let existingIndex = {
    version: INDEX_SCHEMA_VERSION,
    lastSyncedAt: null,
    sessions: {}
  };

  if (!options.forceRebuild && existsSync(indexFile)) {
    try {
      const parsed = JSON.parse(readFileSync(indexFile, 'utf-8'));
      if (parsed && parsed.version === INDEX_SCHEMA_VERSION && parsed.sessions) {
        existingIndex = parsed;
      }
    } catch {
      // Rebuild on corrupted index
    }
  }

  const nextSessions = {};
  let scanned = 0;
  let cached = 0;
  let totalFiles = 0;

  if (existsSync(brainDir)) {
    const entries = readdirSync(brainDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const convId = entry.name;
      const transcriptPath = join(brainDir, convId, '.system_generated', 'logs', 'transcript.jsonl');
      if (!existsSync(transcriptPath)) continue;

      try {
        const st = statSync(transcriptPath);
        totalFiles += 1;
        const mtimeMs = Math.round(st.mtimeMs);
        const size = st.size;

        const prev = existingIndex.sessions[convId];
        if (
          !options.forceRebuild &&
          prev &&
          prev._mtimeMs === mtimeMs &&
          prev._size === size &&
          prev.summary
        ) {
          nextSessions[convId] = prev;
          cached += 1;
          continue;
        }

        const raw = readFileSync(transcriptPath, 'utf-8');
        const summary = parseTranscriptContent(raw, convId, mtimeMs);
        nextSessions[convId] = {
          _mtimeMs: mtimeMs,
          _size: size,
          summary
        };
        scanned += 1;
      } catch {
        // Ignore locked or unreadable transcript
      }
    }
  }

  const updatedIndex = {
    version: INDEX_SCHEMA_VERSION,
    lastSyncedAt: new Date().toISOString(),
    sessions: nextSessions
  };

  try {
    writeFileSync(indexFile, JSON.stringify(updatedIndex, null, 2), 'utf-8');
  } catch {
    // Non-blocking write
  }

  return {
    index: updatedIndex,
    stats: { scanned, cached, totalFiles }
  };
}

/**
 * Aggregates indexed sessions with optional filtering by workspace and days window.
 * @param {object} indexData
 * @param {{ workspace?: string | null, days?: number | null, nowMs?: number }} [filters]
 */
export function aggregateSessionMetrics(indexData, filters = {}) {
  const nowMs = filters.nowMs || Date.now();
  const days = typeof filters.days === 'number' && filters.days > 0 ? filters.days : null;
  const cutoffMs = days ? nowMs - days * 24 * 60 * 60 * 1000 : 0;
  const targetWorkspaceNorm = filters.workspace
    ? filters.workspace.replace(/\\/g, '/').toLowerCase()
    : null;

  const entries = Object.values(indexData?.sessions || {})
    .map((e) => e.summary)
    .filter(Boolean);

  let humanSessions = 0;
  let subagentSessions = 0;
  let totalPrompts = 0;
  let totalPlannerTurns = 0;
  let totalToolCalls = 0;
  let totalToolErrors = 0;
  let totalSubagentsSpawned = 0;
  let totalQuestionsAsked = 0;
  let totalActiveDurationMs = 0;

  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;

  const hourlyDistribution = Array(24).fill(0);
  const weekdayDistribution = Array(7).fill(0); // 0=Sun .. 6=Sat
  const dailyMap = {};
  const workspacesMap = {};
  const modelsMap = {};
  const slashCommandsMap = {};
  const pluginsMap = {};
  const toolsMap = {};
  const recentHumanSessions = [];

  for (const s of entries) {
    if (cutoffMs > 0 && s.lastStepAtMs < cutoffMs) continue;
    if (targetWorkspaceNorm) {
      const sWsNorm = (s.workspace || '').replace(/\\/g, '/').toLowerCase();
      if (sWsNorm !== targetWorkspaceNorm) continue;
    }

    if (s.isSubagent) {
      subagentSessions += 1;
    } else {
      humanSessions += 1;
      recentHumanSessions.push({
        conversationId: s.conversationId,
        topic: s.topic,
        workspace: s.workspace,
        workspaceName: s.workspaceName,
        lastStepAtMs: s.lastStepAtMs,
        dateKey: s.dateKey,
        userPromptsCount: s.userPromptsCount,
        plannerTurnsCount: s.plannerTurnsCount,
        activeDurationMs: s.activeDurationMs,
        totalTokens: (s.tokens?.input || 0) + (s.tokens?.output || 0),
        cacheReadTokens: s.tokens?.cacheRead || 0
      });
    }

    totalPrompts += s.userPromptsCount || 0;
    totalPlannerTurns += s.plannerTurnsCount || 0;
    totalToolCalls += s.toolCallsCount || 0;
    totalToolErrors += s.toolErrorsCount || 0;
    totalSubagentsSpawned += s.subagentsSpawnedCount || 0;
    totalQuestionsAsked += s.questionsAskedCount || 0;
    totalActiveDurationMs += s.activeDurationMs || 0;

    const sIn = s.tokens?.input || 0;
    const sOut = s.tokens?.output || 0;
    const sCache = s.tokens?.cacheRead || 0;
    inputTokens += sIn;
    outputTokens += sOut;
    cacheReadTokens += sCache;

    // Daily series
    const dk = s.dateKey || toLocalDateKey(s.lastStepAtMs);
    if (!dailyMap[dk]) {
      dailyMap[dk] = {
        date: dk,
        humanSessions: 0,
        subagentSessions: 0,
        prompts: 0,
        activeDurationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0
      };
    }
    if (s.isSubagent) dailyMap[dk].subagentSessions += 1;
    else dailyMap[dk].humanSessions += 1;
    dailyMap[dk].prompts += s.userPromptsCount || 0;
    dailyMap[dk].activeDurationMs += s.activeDurationMs || 0;
    dailyMap[dk].inputTokens += sIn;
    dailyMap[dk].outputTokens += sOut;
    dailyMap[dk].cacheReadTokens += sCache;

    // Hourly & Weekday buckets (only from human sessions so subagent bursts don't skew operator habits)
    if (!s.isSubagent) {
      for (const [hr, count] of Object.entries(s.hourlyMap || {})) {
        const hIdx = Number(hr);
        if (hIdx >= 0 && hIdx < 24) hourlyDistribution[hIdx] += count;
      }
      for (const [wd, count] of Object.entries(s.weekdayMap || {})) {
        const wIdx = Number(wd);
        if (wIdx >= 0 && wIdx < 7) weekdayDistribution[wIdx] += count;
      }
    }

    // Workspaces breakdown
    const wsKey = s.workspace || 'unknown';
    if (!workspacesMap[wsKey]) {
      workspacesMap[wsKey] = {
        workspace: wsKey,
        name: s.workspaceName || 'Non assegnato',
        humanSessions: 0,
        subagentSessions: 0,
        prompts: 0,
        activeDurationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0
      };
    }
    if (s.isSubagent) workspacesMap[wsKey].subagentSessions += 1;
    else workspacesMap[wsKey].humanSessions += 1;
    workspacesMap[wsKey].prompts += s.userPromptsCount || 0;
    workspacesMap[wsKey].activeDurationMs += s.activeDurationMs || 0;
    workspacesMap[wsKey].inputTokens += sIn;
    workspacesMap[wsKey].outputTokens += sOut;
    workspacesMap[wsKey].cacheReadTokens += sCache;

    // Models
    for (const [mName, count] of Object.entries(s.modelsUsed || {})) {
      modelsMap[mName] = (modelsMap[mName] || 0) + count;
    }

    // Slash commands
    for (const [cmd, count] of Object.entries(s.slashCommands || {})) {
      slashCommandsMap[cmd] = (slashCommandsMap[cmd] || 0) + count;
    }

    // Plugins & skills
    for (const [pName, pInfo] of Object.entries(s.plugins || {})) {
      if (!pluginsMap[pName]) {
        pluginsMap[pName] = { invocations: 0, skills: {} };
      }
      pluginsMap[pName].invocations += pInfo.invocations || 0;
      for (const [sName, sCount] of Object.entries(pInfo.skills || {})) {
        pluginsMap[pName].skills[sName] = (pluginsMap[pName].skills[sName] || 0) + sCount;
      }
    }

    // Tools
    for (const [tName, tInfo] of Object.entries(s.tools || {})) {
      if (!toolsMap[tName]) {
        toolsMap[tName] = { calls: 0, errors: 0 };
      }
      toolsMap[tName].calls += tInfo.calls || 0;
      toolsMap[tName].errors += tInfo.errors || 0;
    }
  }

  recentHumanSessions.sort((a, b) => b.lastStepAtMs - a.lastStepAtMs);
  const dailySeries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  const totalTokens = inputTokens + outputTokens;
  const cacheHitPct =
    totalTokens + cacheReadTokens > 0
      ? Number(((cacheReadTokens / (totalTokens + cacheReadTokens)) * 100).toFixed(1))
      : 0;

  return {
    humanSessions,
    subagentSessions,
    totalSessions: humanSessions + subagentSessions,
    totalPrompts,
    avgPromptsPerHumanSession:
      humanSessions > 0 ? Number((totalPrompts / humanSessions).toFixed(1)) : 0,
    totalPlannerTurns,
    totalToolCalls,
    totalToolErrors,
    toolSuccessRatePct:
      totalToolCalls > 0
        ? Number((((totalToolCalls - totalToolErrors) / totalToolCalls) * 100).toFixed(1))
        : 100,
    totalSubagentsSpawned,
    totalQuestionsAsked,
    totalActiveDurationMs,
    avgSessionActiveMs:
      humanSessions > 0 ? Math.round(totalActiveDurationMs / humanSessions) : 0,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      cacheRead: cacheReadTokens,
      total: totalTokens,
      cacheHitPct
    },
    hourlyDistribution,
    weekdayDistribution,
    dailySeries,
    workspaces: workspacesMap,
    models: modelsMap,
    slashCommands: slashCommandsMap,
    plugins: pluginsMap,
    tools: toolsMap,
    recentHumanSessions: recentHumanSessions.slice(0, 30)
  };
}

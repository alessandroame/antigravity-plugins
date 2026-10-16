#!/usr/bin/env node

/**
 * Telemetry & Usage Analytics Collector
 * Native zero-dependency batch ingestor for Antigravity PostInvocation and Stop hooks.
 * Also tracks multi-step ETA accuracy and computes workspace calibration factors.
 */

import {
  readFileSync,
  appendFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  readdirSync,
  statSync,
  renameSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join, basename, resolve } from 'node:path';

// Watchdog safety guard to prevent agent freeze
const WATCHDOG_TIMEOUT_MS = 10000;
const safetyWatchdog = setTimeout(() => {
  process.stdout.write('{}\n');
  process.exit(0);
}, WATCHDOG_TIMEOUT_MS);
safetyWatchdog.unref();

const CURSOR_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_EVENTS_FILE_BYTES = 5 * 1024 * 1024; // 5 MB cap before rotation

function pruneStaleStateAndRotateLogs(analyticsDir, currentConversationId) {
  try {
    const now = Date.now();
    const entries = readdirSync(analyticsDir);
    for (const name of entries) {
      if ((name.startsWith('.cursor_') || name.startsWith('.eta_')) && name.endsWith('.json')) {
        if (currentConversationId && name.includes(currentConversationId)) continue;
        const fullPath = join(analyticsDir, name);
        try {
          const st = statSync(fullPath);
          if (now - st.mtimeMs > CURSOR_TTL_MS) {
            unlinkSync(fullPath);
          }
        } catch {
          // Ignore concurrent access or missing file
        }
      }
    }

    const eventsFile = join(analyticsDir, 'events.ndjson');
    if (existsSync(eventsFile)) {
      const st = statSync(eventsFile);
      if (st.size > MAX_EVENTS_FILE_BYTES) {
        const archiveFile = join(analyticsDir, 'events.archive.ndjson');
        renameSync(eventsFile, archiveFile);
      }
    }
  } catch {
    // Non-blocking maintenance
  }
}

function getAnalyticsDir() {
  const custom = process.env.ANTIGRAVITY_ANALYTICS_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

function normalizePath(p) {
  if (!p) return '';
  return p
    .replace(/^["']|["']$/g, '')
    .replace(/\\+/g, '/')
    .replace(/\/+/g, '/')
    .toLowerCase();
}

function parseSkillAndPlugin(filePath) {
  if (!filePath) return null;
  const normalized = normalizePath(filePath);

  // Pattern 1: /plugins/<plugin-name>/skills/<skill-name>/...
  const pluginMatch = normalized.match(/(?:^|\/)plugins\/([^/]+)\/skills\/([^/]+)/);
  if (pluginMatch) {
    return { plugin: pluginMatch[1], skill: pluginMatch[2] };
  }

  // Pattern 2: /.agents/skills/<skill-name>/...
  const workspaceSkillMatch = normalized.match(/(?:^|\/)\.agents\/skills\/([^/]+)/);
  if (workspaceSkillMatch) {
    return { plugin: 'workspace', skill: workspaceSkillMatch[1] };
  }

  // Pattern 3: builtin/skills/<skill-name>/... or skills/<skill-name>/skill.md
  const genericSkillMatch = normalized.match(/(?:^|\/)skills\/([^/]+)\/skill\.md/);
  if (genericSkillMatch) {
    return { plugin: 'builtin', skill: genericSkillMatch[1] };
  }

  // Pattern 4: direct plugin reference (rules, configs, hooks)
  const directPluginMatch = normalized.match(/(?:^|\/)plugins\/([^/]+)(?:\/|$)/);
  if (directPluginMatch && directPluginMatch[1] !== 'plugins') {
    return { plugin: directPluginMatch[1], skill: null };
  }

  return null;
}

function extractToolCalls(step) {
  const calls = [];
  if (Array.isArray(step.tool_calls)) {
    for (const tc of step.tool_calls) {
      if (tc && tc.name) {
        calls.push(tc);
      }
    }
  }
  return calls;
}

function extractDeclaredEtaMs(step) {
  let toolText = '';
  if (Array.isArray(step.tool_calls)) {
    for (const tc of step.tool_calls) {
      if (tc?.args?.toolAction) toolText += ' ' + tc.args.toolAction;
      if (tc?.args?.toolSummary) toolText += ' ' + tc.args.toolSummary;
    }
  }
  if (!toolText) return null;

  // Match patterns like "【🟡 ETA tot ~45s】", "· ETA tot ~45s", "· ETA ~45s", "(~45s)"
  const match = toolText.match(
    /(?:【\s*(?:[🟢🟡🔴🟠]\s*)?(?:ETA(?:\s+tot)?:?\s*)?~?(\d+)s\s*】|·\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\b|\(\s*(?:ETA(?:\s+tot)?\s*)?~?(\d+)s\s*\)|\bETA(?:\s+tot)?:?\s*~?(\d+)s\b)/iu
  );
  if (!match) return null;
  const seconds = parseInt(match[1] || match[2] || match[3] || match[4], 10);
  if (Number.isNaN(seconds) || seconds <= 0) return null;
  return seconds * 1000;
}

function processTranscriptBatch(transcriptPath, lastIndex) {
  if (!existsSync(transcriptPath)) {
    return { newSteps: [], newLastIndex: lastIndex };
  }

  const raw = readFileSync(transcriptPath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const steps = [];

  for (const line of lines) {
    try {
      const step = JSON.parse(line);
      if (typeof step.step_index === 'number') {
        steps.push(step);
      }
    } catch {
      // Ignore corrupted lines
    }
  }

  steps.sort((a, b) => a.step_index - b.step_index);
  const newSteps = steps.filter((s) => s.step_index > lastIndex);
  const newLastIndex = steps.length > 0 ? steps[steps.length - 1].step_index : lastIndex;

  return { newSteps, newLastIndex };
}

function applyEtaMetrics(targetBucket, estimatedMs, actualMs) {
  if (!estimatedMs || !actualMs || estimatedMs <= 0 || actualMs <= 0) return;

  targetBucket.etaTrackedTasks = (targetBucket.etaTrackedTasks || 0) + 1;
  targetBucket.totalEstimatedMs = (targetBucket.totalEstimatedMs || 0) + estimatedMs;
  targetBucket.totalActualEtaTaskMs = (targetBucket.totalActualEtaTaskMs || 0) + actualMs;

  const sampleRatio = Math.max(0.4, Math.min(3.0, actualMs / estimatedMs));
  const prevFactor =
    typeof targetBucket.etaCalibrationFactor === 'number' && targetBucket.etaCalibrationFactor > 0
      ? targetBucket.etaCalibrationFactor
      : 1.0;

  // Exponential moving average (alpha = 0.3) clamped to [0.5, 2.5]
  const updated = prevFactor * 0.7 + sampleRatio * 0.3;
  targetBucket.etaCalibrationFactor = Number(Math.max(0.5, Math.min(2.5, updated)).toFixed(2));
}

function updateSummaryStore(summaryPath, record, etaOutcome) {
  let summary = {
    lastUpdated: new Date().toISOString(),
    global: {
      totalSessions: 0,
      totalInvocations: 0,
      totalSteps: 0,
      totalDurationMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      etaTrackedTasks: 0,
      totalEstimatedMs: 0,
      totalActualEtaTaskMs: 0,
      etaCalibrationFactor: 1.0,
      plugins: {},
      tools: {}
    },
    workspaces: {}
  };

  if (existsSync(summaryPath)) {
    try {
      const existing = JSON.parse(readFileSync(summaryPath, 'utf-8'));
      if (existing && existing.global) {
        summary = existing;
      }
    } catch {
      // Use defaults if corrupted
    }
  }

  summary.lastUpdated = new Date().toISOString();
  const g = summary.global;
  g.totalInvocations += 1;
  g.totalSteps = (g.totalSteps || 0) + (record.stepCount || 0);
  g.totalDurationMs += record.durationMs;
  g.totalInputTokens += record.tokens.input;
  g.totalOutputTokens += record.tokens.output;
  g.totalCacheReadTokens += record.tokens.cacheRead;

  // Workspace sub-tree
  const wsKey = record.workspace || 'default';
  if (!summary.workspaces[wsKey]) {
    summary.workspaces[wsKey] = {
      name: record.workspaceName || 'unknown',
      totalInvocations: 0,
      totalSteps: 0,
      totalDurationMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      etaTrackedTasks: 0,
      totalEstimatedMs: 0,
      totalActualEtaTaskMs: 0,
      etaCalibrationFactor: 1.0,
      plugins: {},
      tools: {}
    };
  }
  const ws = summary.workspaces[wsKey];
  ws.totalInvocations += 1;
  ws.totalSteps = (ws.totalSteps || 0) + (record.stepCount || 0);
  ws.totalDurationMs += record.durationMs;
  ws.totalInputTokens += record.tokens.input;
  ws.totalOutputTokens += record.tokens.output;
  ws.totalCacheReadTokens += record.tokens.cacheRead;

  if (etaOutcome && etaOutcome.estimatedMs > 0 && etaOutcome.actualMs > 0) {
    applyEtaMetrics(g, etaOutcome.estimatedMs, etaOutcome.actualMs);
    applyEtaMetrics(ws, etaOutcome.estimatedMs, etaOutcome.actualMs);
  }

  // Merge plugins
  for (const [pluginName, pData] of Object.entries(record.plugins)) {
    if (!g.plugins[pluginName]) {
      g.plugins[pluginName] = { invocations: 0, skills: {} };
    }
    g.plugins[pluginName].invocations += pData.invocations;
    for (const [skillName, sCount] of Object.entries(pData.skills)) {
      g.plugins[pluginName].skills[skillName] = (g.plugins[pluginName].skills[skillName] || 0) + sCount;
    }

    if (!ws.plugins[pluginName]) {
      ws.plugins[pluginName] = { invocations: 0, skills: {} };
    }
    ws.plugins[pluginName].invocations += pData.invocations;
    for (const [skillName, sCount] of Object.entries(pData.skills)) {
      ws.plugins[pluginName].skills[skillName] = (ws.plugins[pluginName].skills[skillName] || 0) + sCount;
    }
  }

  // Merge tools
  for (const [toolName, tData] of Object.entries(record.tools)) {
    if (!g.tools[toolName]) {
      g.tools[toolName] = { calls: 0, errors: 0 };
    }
    g.tools[toolName].calls += tData.calls;
    g.tools[toolName].errors += tData.errors;

    if (!ws.tools[toolName]) {
      ws.tools[toolName] = { calls: 0, errors: 0 };
    }
    ws.tools[toolName].calls += tData.calls;
    ws.tools[toolName].errors += tData.errors;
  }

  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
}

async function main() {
  const isFinalize = process.argv.includes('--finalize');
  let rawInput = '';

  for await (const chunk of process.stdin) {
    rawInput += chunk;
  }

  let payload = {};
  try {
    if (rawInput.trim()) {
      payload = JSON.parse(rawInput);
    }
  } catch {
    // Safe fallback if stdin is not JSON
  }

  const conversationId = payload.conversationId || 'unknown-session';
  const workspacePath = payload.workspacePaths?.[0] || process.cwd();
  const transcriptPath = payload.transcriptPath;

  const analyticsDir = getAnalyticsDir();
  mkdirSync(analyticsDir, { recursive: true });

  const cursorFile = join(analyticsDir, `.cursor_${conversationId}.json`);
  const etaStateFile = join(analyticsDir, `.eta_${conversationId}.json`);
  let lastIndex = -1;
  let savedInitialEtaMs = null;
  let savedPromptStartMs = null;
  let savedInitialEtaAtActiveSec = 0;

  if (existsSync(cursorFile)) {
    try {
      const cursor = JSON.parse(readFileSync(cursorFile, 'utf-8'));
      if (typeof cursor.lastIndex === 'number') {
        lastIndex = cursor.lastIndex;
      }
      if (typeof cursor.initialEtaMs === 'number') {
        savedInitialEtaMs = cursor.initialEtaMs;
      }
      if (typeof cursor.promptStartMs === 'number') {
        savedPromptStartMs = cursor.promptStartMs;
      }
      if (typeof cursor.initialEtaAtActiveSec === 'number') {
        savedInitialEtaAtActiveSec = cursor.initialEtaAtActiveSec;
      }
    } catch {
      // Ignore corrupted cursor
    }
  }

  let savedPausedDurationMs = 0;

  if (existsSync(etaStateFile)) {
    try {
      const etaState = JSON.parse(readFileSync(etaStateFile, 'utf-8'));
      if (!savedPromptStartMs && typeof etaState.promptStartMs === 'number') {
        savedPromptStartMs = etaState.promptStartMs;
      }
      if (!savedInitialEtaMs && typeof etaState.initialEtaSec === 'number') {
        savedInitialEtaMs = etaState.initialEtaSec * 1000;
      }
      if (typeof etaState.pausedDurationMs === 'number') {
        savedPausedDurationMs = etaState.pausedDurationMs;
      }
      if (typeof etaState.initialEtaAtActiveSec === 'number') {
        savedInitialEtaAtActiveSec = etaState.initialEtaAtActiveSec;
      }
    } catch {
      // Ignore state read errors
    }
  }

  if (transcriptPath && existsSync(transcriptPath)) {
    const { newSteps, newLastIndex } = processTranscriptBatch(transcriptPath, lastIndex);

    if (newSteps.length > 0) {
      const toolsMap = {};
      const pluginsMap = {};
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheReadTokens = 0;

      let minTime = null;
      let maxTime = null;

      for (const step of newSteps) {
        if (step.created_at) {
          const t = new Date(step.created_at).getTime();
          if (minTime === null || t < minTime) minTime = t;
          if (maxTime === null || t > maxTime) maxTime = t;

          const isUserStep =
            step.type === 'USER_INPUT' ||
            step.source === 'USER_EXPLICIT' ||
            step.type === 'CORTEX_STEP_TYPE_USER_INPUT';
          if (isUserStep && !savedPromptStartMs) {
            savedPromptStartMs = t;
            savedInitialEtaMs = null;
            savedInitialEtaAtActiveSec = 0;
          }
        }

        if (!savedInitialEtaMs) {
          const detectedEta = extractDeclaredEtaMs(step);
          if (detectedEta) {
            savedInitialEtaMs = detectedEta;
            if (savedPromptStartMs && step.created_at) {
              const stepTs = new Date(step.created_at).getTime();
              if (!Number.isNaN(stepTs) && stepTs >= savedPromptStartMs) {
                savedInitialEtaAtActiveSec = Math.max(
                  0,
                  Math.round((stepTs - savedPromptStartMs - savedPausedDurationMs) / 1000)
                );
              }
            }
          }
        }

        if (typeof step.input_tokens === 'number') inputTokens += step.input_tokens;
        if (typeof step.output_tokens === 'number') outputTokens += step.output_tokens;
        if (typeof step.cache_read_tokens === 'number') cacheReadTokens += step.cache_read_tokens;

        const calls = extractToolCalls(step);
        for (const tc of calls) {
          const tName = tc.name;
          if (!toolsMap[tName]) {
            toolsMap[tName] = { calls: 0, errors: 0 };
          }
          toolsMap[tName].calls += 1;

          // Detect skill / plugin
          if (tName === 'view_file' && tc.args?.AbsolutePath) {
            const parsed = parseSkillAndPlugin(tc.args.AbsolutePath);
            if (parsed) {
              const p = parsed.plugin;
              if (!pluginsMap[p]) {
                pluginsMap[p] = { invocations: 0, skills: {} };
              }
              pluginsMap[p].invocations += 1;
              if (parsed.skill) {
                pluginsMap[p].skills[parsed.skill] = (pluginsMap[p].skills[parsed.skill] || 0) + 1;
              }
            }
          }
        }

        // Error detection in content or status
        if (step.status === 'ERROR' || (step.content && /exited with code [^0]/i.test(step.content))) {
          const lastTool = calls.length > 0 ? calls[calls.length - 1].name : 'unknown';
          if (toolsMap[lastTool]) {
            toolsMap[lastTool].errors += 1;
          }
        }
      }

      const durationMs = minTime && maxTime && maxTime >= minTime ? maxTime - minTime : 0;

      let etaOutcome = null;
      if (isFinalize && savedInitialEtaMs && savedPromptStartMs) {
        const endTs = maxTime || Date.now();
        const totalActiveMs = Math.max(1000, endTs - savedPromptStartMs - savedPausedDurationMs);
        const remainingActualFromEstimateMs = Math.max(
          1000,
          totalActiveMs - savedInitialEtaAtActiveSec * 1000
        );
        etaOutcome = {
          estimatedMs: savedInitialEtaMs,
          actualMs: remainingActualFromEstimateMs
        };
      }

      const eventRecord = {
        ts: new Date().toISOString(),
        conversationId,
        workspace: workspacePath,
        workspaceName: basename(workspacePath),
        durationMs,
        etaEstimatedMs: etaOutcome ? etaOutcome.estimatedMs : null,
        etaActualMs: etaOutcome ? etaOutcome.actualMs : null,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          cacheRead: cacheReadTokens
        },
        plugins: pluginsMap,
        tools: toolsMap,
        stepCount: newSteps.length
      };

      // Append to events.ndjson
      const eventsFile = join(analyticsDir, 'events.ndjson');
      appendFileSync(eventsFile, JSON.stringify(eventRecord) + '\n', 'utf-8');

      // Update metrics-summary.json
      const summaryFile = join(analyticsDir, 'metrics-summary.json');
      updateSummaryStore(summaryFile, eventRecord, etaOutcome);

      // Save cursor (reset per-prompt ETA state on finalize, but preserve lastIndex)
      writeFileSync(
        cursorFile,
        JSON.stringify({
          lastIndex: newLastIndex,
          initialEtaMs: isFinalize ? null : savedInitialEtaMs,
          promptStartMs: isFinalize ? null : savedPromptStartMs,
          initialEtaAtActiveSec: isFinalize ? 0 : savedInitialEtaAtActiveSec,
          updatedAt: new Date().toISOString()
        }),
        'utf-8'
      );
    } else if (isFinalize) {
      // PostInvocation already ingested the steps of the final turn; finalize ETA metrics now
      if (savedInitialEtaMs && savedPromptStartMs) {
        const totalActiveMs = Math.max(1000, Date.now() - savedPromptStartMs - savedPausedDurationMs);
        const remainingActualFromEstimateMs = Math.max(
          1000,
          totalActiveMs - savedInitialEtaAtActiveSec * 1000
        );
        const etaOutcome = {
          estimatedMs: savedInitialEtaMs,
          actualMs: remainingActualFromEstimateMs
        };
        const eventRecord = {
          ts: new Date().toISOString(),
          conversationId,
          workspace: workspacePath,
          workspaceName: basename(workspacePath),
          durationMs: 0,
          etaEstimatedMs: etaOutcome.estimatedMs,
          etaActualMs: etaOutcome.actualMs,
          tokens: { input: 0, output: 0, cacheRead: 0 },
          plugins: {},
          tools: {},
          stepCount: 0
        };
        const eventsFile = join(analyticsDir, 'events.ndjson');
        appendFileSync(eventsFile, JSON.stringify(eventRecord) + '\n', 'utf-8');

        const summaryFile = join(analyticsDir, 'metrics-summary.json');
        updateSummaryStore(summaryFile, eventRecord, etaOutcome);
      }

      // Preserve lastIndex so subsequent prompts in the same conversation only read delta steps
      writeFileSync(
        cursorFile,
        JSON.stringify({
          lastIndex,
          initialEtaMs: null,
          promptStartMs: null,
          initialEtaAtActiveSec: 0,
          updatedAt: new Date().toISOString()
        }),
        'utf-8'
      );
    }
  }

  if (isFinalize) {
    if (existsSync(etaStateFile)) {
      try {
        unlinkSync(etaStateFile);
      } catch {
        // Ignore unlink errors
      }
    }
    pruneStaleStateAndRotateLogs(analyticsDir, conversationId);
  }

  // Antigravity hook stdout expectation
  process.stdout.write('{}\n');
  process.exit(0);
}

main().catch(() => {
  process.stdout.write('{}\n');
  process.exit(0);
});

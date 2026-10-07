#!/usr/bin/env node

/**
 * Telemetry & Usage Analytics Collector
 * Native zero-dependency batch ingestor for Antigravity PostInvocation and Stop hooks.
 */

import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename, resolve } from 'node:path';

// Watchdog safety guard to prevent agent freeze
const WATCHDOG_TIMEOUT_MS = 10000;
const safetyWatchdog = setTimeout(() => {
  process.stdout.write('{}\n');
  process.exit(0);
}, WATCHDOG_TIMEOUT_MS);
safetyWatchdog.unref();

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

function updateSummaryStore(summaryPath, record) {
  let summary = {
    lastUpdated: new Date().toISOString(),
    global: {
      totalSessions: 0,
      totalInvocations: 0,
      totalDurationMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
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
      totalDurationMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      plugins: {},
      tools: {}
    };
  }
  const ws = summary.workspaces[wsKey];
  ws.totalInvocations += 1;
  ws.totalDurationMs += record.durationMs;
  ws.totalInputTokens += record.tokens.input;
  ws.totalOutputTokens += record.tokens.output;
  ws.totalCacheReadTokens += record.tokens.cacheRead;

  // Merge plugins
  for (const [pluginName, pData] of Object.entries(record.plugins)) {
    // Global
    if (!g.plugins[pluginName]) {
      g.plugins[pluginName] = { invocations: 0, skills: {} };
    }
    g.plugins[pluginName].invocations += pData.invocations;
    for (const [skillName, sCount] of Object.entries(pData.skills)) {
      g.plugins[pluginName].skills[skillName] = (g.plugins[pluginName].skills[skillName] || 0) + sCount;
    }

    // Workspace
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
    // Global
    if (!g.tools[toolName]) {
      g.tools[toolName] = { calls: 0, errors: 0 };
    }
    g.tools[toolName].calls += tData.calls;
    g.tools[toolName].errors += tData.errors;

    // Workspace
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
  let lastIndex = -1;
  if (existsSync(cursorFile)) {
    try {
      const cursor = JSON.parse(readFileSync(cursorFile, 'utf-8'));
      if (typeof cursor.lastIndex === 'number') {
        lastIndex = cursor.lastIndex;
      }
    } catch {
      // Ignore corrupted cursor
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
          // Attribute error to last tool or generic
          const lastTool = calls.length > 0 ? calls[calls.length - 1].name : 'unknown';
          if (toolsMap[lastTool]) {
            toolsMap[lastTool].errors += 1;
          }
        }
      }

      const durationMs = minTime && maxTime && maxTime >= minTime ? maxTime - minTime : 0;

      const eventRecord = {
        ts: new Date().toISOString(),
        conversationId,
        workspace: workspacePath,
        workspaceName: basename(workspacePath),
        durationMs,
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
      updateSummaryStore(summaryFile, eventRecord);

      // Save cursor
      writeFileSync(cursorFile, JSON.stringify({ lastIndex: newLastIndex, updatedAt: new Date().toISOString() }), 'utf-8');
    }
  }

  if (isFinalize && existsSync(cursorFile)) {
    try {
      unlinkSync(cursorFile);
    } catch {
      // Ignore unlink errors
    }
  }

  // Antigravity hook stdout expectation
  process.stdout.write('{}\n');
  process.exit(0);
}

main().catch(() => {
  process.stdout.write('{}\n');
  process.exit(0);
});

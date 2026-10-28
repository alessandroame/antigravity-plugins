#!/usr/bin/env node

/**
 * Pattern Harvester & Automation Advisor — CLI & Incremental Scanner
 * Scans human conversation transcripts (transcript.jsonl), WORKLOG.md, and NOTES.md
 * to detect recurring tool-chain sequences, CLI skeletons, and interaction archetypes,
 * filtering against the installed catalog and computing KLM/GOMS ROI.
 *
 * Zero DOM/browser dependencies.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  analyzeSessionsForPatterns,
  DEFAULT_HARVESTER_CONFIG,
  extractLexicalSignature,
  generateCandidateScaffold,
  normalizePathToken
} from '../core/harvester-engine.mjs';

const isDirectEntry =
  Boolean(process.argv[1]) &&
  import.meta.url.replace(/\\/g, '/') === pathToFileURL(resolve(process.argv[1])).href.replace(/\\/g, '/');

// Process timeout guard (45s) as mandated by execution-guard
if (isDirectEntry) {
  setTimeout(() => {
    console.error('[FATAL TIMEOUT] pattern-harvester.mjs exceeded 45s limit.');
    process.exit(1);
  }, 45000).unref();
}

export function getAnalyticsDir() {
  const custom = process.env.ANTIGRAVITY_ANALYTICS_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

export function getBrainDir() {
  const custom = process.env.ANTIGRAVITY_BRAIN_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'brain');
}

export function resolveCatalogRoot() {
  if (process.env.ANTIGRAVITY_PLUGINS_ROOT) {
    return resolve(process.env.ANTIGRAVITY_PLUGINS_ROOT);
  }
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const candidate = resolve(scriptDir, '..', '..', '..');
  if (existsSync(join(candidate, 'scripts', 'validate.mjs'))) {
    return candidate;
  }
  const winDefault = 'c:/github/antigravity-plugins';
  if (existsSync(join(winDefault, 'scripts', 'validate.mjs'))) {
    return resolve(winDefault);
  }
  return resolve(process.cwd());
}

const SUBAGENT_HEAD_RX =
  /Skill Attive \((?:Alpha|Beta|Gamma|Delta|Epsilon|[^)]+)\)|Agisci esclusivamente come \*\*Subagent|Sei il? \*\*Subagent|Subagent (?:Alpha|Beta|Gamma|Delta|Epsilon)\b|Dialectical Mediator|You have been spawned as a subagent|<subagent_context>|\[Message\] timestamp=[^\]]+sender=[0-9a-f-]{36}/i;

/**
 * Checks whether a transcript file belongs to a primary human conversation (not a subagent).
 * Evaluates only the initial head of the transcript (step 0) to avoid false negatives when
 * subagents reply to a human parent session later in the conversation.
 * @param {string} transcriptPath
 * @returns {boolean}
 */
export function isHumanConversationTranscript(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return false;
  try {
    const head = readFileSync(transcriptPath, 'utf-8').slice(0, 12288);
    if (!head.includes('<USER_REQUEST>') && !head.includes('"source":"USER_EXPLICIT"')) {
      return false;
    }
    const firstUserIdx = head.indexOf('<USER_REQUEST>');
    const firstAgentMsgIdx = head.search(/\[Message\] timestamp=[^\]]+sender=[0-9a-f-]{36}/i);
    if (firstAgentMsgIdx !== -1 && (firstUserIdx === -1 || firstAgentMsgIdx < firstUserIdx)) {
      return false;
    }
    const headBeforeFirstTool =
      firstUserIdx !== -1 ? head.slice(0, firstUserIdx + 1500) : head.slice(0, 2500);
    if (SUBAGENT_HEAD_RX.test(headBeforeFirstTool)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads installed skills and plugins across the repository and global directory
 * so the anti-collision gate can deduplicate already covered workflows.
 * @param {string} [repoRoot]
 * @returns {Array<{ id: string, kind: 'skill' | 'plugin', pluginName?: string, description: string, tokens: string[], scriptNames?: string[] }>}
 */
export function loadInstalledCatalogEntries(repoRoot = resolveCatalogRoot()) {
  const entries = [];
  const seenIds = new Set();

  const pluginsDir = join(repoRoot, 'plugins');
  if (existsSync(pluginsDir)) {
    for (const pEnt of readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!pEnt.isDirectory() || pEnt.name.startsWith('.')) continue;
      const pDir = join(pluginsDir, pEnt.name);
      const manifestPath = join(pDir, 'plugin.json');
      const scriptNames = [];
      const scriptsDir = join(pDir, 'scripts');
      if (existsSync(scriptsDir)) {
        for (const sEnt of readdirSync(scriptsDir, { withFileTypes: true })) {
          if (sEnt.isFile()) scriptNames.push(sEnt.name);
        }
      }

      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
          const id = String(manifest.name || pEnt.name);
          const desc = String(manifest.description || '');
          const lex = extractLexicalSignature(`${id.replace(/-/g, ' ')} ${desc}`);
          entries.push({
            id,
            kind: 'plugin',
            pluginName: id,
            description: desc,
            tokens: lex.tokens,
            scriptNames
          });
          seenIds.add(`plugin:${id}`);
        } catch {
          // ignore malformed manifest
        }
      }

      const skillsDir = join(pDir, 'skills');
      if (existsSync(skillsDir)) {
        for (const skEnt of readdirSync(skillsDir, { withFileTypes: true })) {
          if (!skEnt.isDirectory()) continue;
          const skPath = join(skillsDir, skEnt.name, 'SKILL.md');
          if (!existsSync(skPath)) continue;
          try {
            const raw = readFileSync(skPath, 'utf-8').slice(0, 2000);
            const id = skEnt.name;
            const lex = extractLexicalSignature(`${id.replace(/-/g, ' ')} ${raw}`);
            entries.push({
              id,
              kind: 'skill',
              pluginName: pEnt.name,
              description: raw.slice(0, 300),
              tokens: lex.tokens,
              scriptNames
            });
            seenIds.add(`skill:${id}`);
          } catch {
            // ignore
          }
        }
      }
    }
  }

  // Also scan workspace .agents/skills/ and global ~/.gemini/config/skills/
  const extraSkillRoots = [
    join(repoRoot, '.agents', 'skills'),
    join(homedir(), '.gemini', 'config', 'skills')
  ];
  for (const sRoot of extraSkillRoots) {
    if (!existsSync(sRoot)) continue;
    try {
      for (const skEnt of readdirSync(sRoot, { withFileTypes: true })) {
        if (!skEnt.isDirectory()) continue;
        const id = skEnt.name;
        if (seenIds.has(`skill:${id}`)) continue;
        const skPath = join(sRoot, id, 'SKILL.md');
        if (!existsSync(skPath)) continue;
        const raw = readFileSync(skPath, 'utf-8').slice(0, 2000);
        const lex = extractLexicalSignature(`${id.replace(/-/g, ' ')} ${raw}`);
        entries.push({
          id,
          kind: 'skill',
          pluginName: 'workspace',
          description: raw.slice(0, 300),
          tokens: lex.tokens,
          scriptNames: []
        });
        seenIds.add(`skill:${id}`);
      }
    } catch {
      // ignore
    }
  }

  return entries;
}

/**
 * Parses a single human conversation transcript into structured turns.
 * @param {string} convId
 * @param {string} transcriptPath
 * @returns {{ convId: string, mtimeMs: number, turns: Array<{ userText: string, toolCalls: Array<{ name: string, args: Record<string, unknown> }>, invokedSkills: string[], totalTokens: number }> } | null}
 */
export function parseTranscriptToSessionRecord(convId, transcriptPath) {
  if (!isHumanConversationTranscript(transcriptPath)) return null;

  try {
    const st = statSync(transcriptPath);
    const rawLines = readFileSync(transcriptPath, 'utf-8').split(/\r?\n/);
    const turns = [];
    let currentTurn = null;

    for (const line of rawLines) {
      if (!line.trim()) continue;
      let step;
      try {
        step = JSON.parse(line);
      } catch {
        continue;
      }

      if (step.type === 'USER_INPUT' || step.source === 'USER_EXPLICIT') {
        const content = String(step.content || '');
        // Skip system wakeup messages injected as pseudo-inputs
        if (content.includes('<SYSTEM_MESSAGE>') && !content.includes('<USER_REQUEST>')) {
          continue;
        }
        const matchReq = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/i);
        const cleanUserText = (matchReq ? matchReq[1] : content).trim();
        if (!cleanUserText) continue;

        if (currentTurn && currentTurn.toolCalls.length > 0) {
          turns.push(currentTurn);
        }
        currentTurn = {
          userText: cleanUserText,
          toolCalls: [],
          invokedSkills: [],
          totalTokens: 0
        };
      } else if (step.type === 'PLANNER_RESPONSE' && currentTurn) {
        const inTok = Number(step.input_tokens || step.usage?.input_tokens || 0);
        const outTok = Number(step.output_tokens || step.usage?.output_tokens || 0);
        currentTurn.totalTokens += inTok + outTok;

        if (Array.isArray(step.tool_calls)) {
          for (const tc of step.tool_calls) {
            const tName = String(tc.name || tc.tool_name || '').trim();
            const rawArgs = tc.arguments || tc.args || {};
            let parsedArgs = {};
            if (typeof rawArgs === 'string') {
              try {
                parsedArgs = JSON.parse(rawArgs);
              } catch {
                parsedArgs = {};
              }
            } else if (rawArgs && typeof rawArgs === 'object') {
              parsedArgs = rawArgs;
            }

            if (tName) {
              currentTurn.toolCalls.push({ name: tName, args: parsedArgs });
              if (tName === 'read_file' || tName === 'view_file') {
                const p = normalizePathToken(String(parsedArgs.Path || parsedArgs.AbsolutePath || ''));
                const skMatch = p.match(/(?:^|\/)skills\/([a-z0-9-]+)\/skill\.md$/i);
                if (skMatch && !currentTurn.invokedSkills.includes(skMatch[1])) {
                  currentTurn.invokedSkills.push(skMatch[1]);
                }
              }
            }
          }
        }
      }
    }

    if (currentTurn && currentTurn.toolCalls.length > 0) {
      turns.push(currentTurn);
    }

    if (turns.length === 0) return null;
    return { convId, mtimeMs: st.mtimeMs, turns };
  } catch {
    return null;
  }
}

export function loadHarvesterState(analyticsDir = getAnalyticsDir()) {
  const statePath = join(analyticsDir, 'pattern-harvester-state.json');
  const fallback = {
    version: 1,
    lastHarvestAtMs: 0,
    humanSessionsSinceLastHarvest: 0,
    knownHumanSessions: {},
    dismissedPatterns: {},
    config: { ...DEFAULT_HARVESTER_CONFIG }
  };
  if (!existsSync(statePath)) return fallback;
  try {
    const parsed = JSON.parse(readFileSync(statePath, 'utf-8'));
    return {
      ...fallback,
      ...parsed,
      knownHumanSessions: parsed.knownHumanSessions || {},
      dismissedPatterns: parsed.dismissedPatterns || {},
      config: { ...DEFAULT_HARVESTER_CONFIG, ...(parsed.config || {}) }
    };
  } catch {
    return fallback;
  }
}

export function saveHarvesterState(state, analyticsDir = getAnalyticsDir()) {
  if (!existsSync(analyticsDir)) {
    mkdirSync(analyticsDir, { recursive: true });
  }
  const statePath = join(analyticsDir, 'pattern-harvester-state.json');
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
}

/**
 * Runs a full or incremental scan of recent human brain sessions and writes
 * recommendations to `~/.gemini/antigravity/analytics/pattern-recommendations.json`.
 *
 * @param {{
 *   days?: number,
 *   limit?: number,
 *   brainDir?: string,
 *   analyticsDir?: string,
 *   repoRoot?: string
 * }} [options]
 */
export function runPatternHarvestScan(options = {}) {
  const days = Number(options.days || 14);
  const limit = Number(options.limit || 40);
  const brainDir = options.brainDir || getBrainDir();
  const analyticsDir = options.analyticsDir || getAnalyticsDir();
  const repoRoot = options.repoRoot || resolveCatalogRoot();
  const nowMs = Date.now();
  const cutoffMs = nowMs - days * 24 * 3600 * 1000;

  const state = loadHarvesterState(analyticsDir);
  const catalogEntries = loadInstalledCatalogEntries(repoRoot);
  const candidatesFiles = [];

  if (existsSync(brainDir)) {
    for (const ent of readdirSync(brainDir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const tPath = join(brainDir, ent.name, '.system_generated', 'logs', 'transcript.jsonl');
      if (!existsSync(tPath)) continue;
      try {
        const st = statSync(tPath);
        if (st.mtimeMs >= cutoffMs) {
          candidatesFiles.push({ convId: ent.name, tPath, mtimeMs: st.mtimeMs });
        }
      } catch {
        // ignore
      }
    }
  }

  candidatesFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const selected = candidatesFiles.slice(0, limit);
  const sessions = [];

  for (const item of selected) {
    const rec = parseTranscriptToSessionRecord(item.convId, item.tPath);
    if (rec) {
      sessions.push(rec);
      state.knownHumanSessions[item.convId] = { mtimeMs: item.mtimeMs };
    }
  }

  const analysis = analyzeSessionsForPatterns(sessions, catalogEntries, {
    dismissedPatterns: state.dismissedPatterns,
    nowMs,
    config: state.config
  });

  state.lastHarvestAtMs = nowMs;
  state.humanSessionsSinceLastHarvest = 0;
  saveHarvesterState(state, analyticsDir);

  const reportPayload = {
    generatedAt: new Date(nowMs).toISOString(),
    generatedAtMs: nowMs,
    windowDays: days,
    catalogEntriesCount: catalogEntries.length,
    ...analysis
  };

  if (!existsSync(analyticsDir)) {
    mkdirSync(analyticsDir, { recursive: true });
  }
  const recPath = join(analyticsDir, 'pattern-recommendations.json');
  writeFileSync(recPath, `${JSON.stringify(reportPayload, null, 2)}\n`, 'utf-8');

  return reportPayload;
}

function formatTextReport(report) {
  const lines = [
    '=== PATTERN HARVESTER & AUTOMATION ADVISOR ===',
    `Data Scansione         : ${report.generatedAt}`,
    `Sessioni Umane Analizz.: ${report.analyzedSessionsCount} (finestra: ${report.windowDays} giorni)`,
    `Catalogo Installato    : ${report.catalogEntriesCount} voci (skill + plugin)`,
    `Pattern Valutati       : ${report.totalCandidatesEvaluated} (${report.actionableCount} promossi, ${report.ignoredCount} filtrati)`,
    ''
  ];

  if (!report.recommendations || report.recommendations.length === 0) {
    lines.push(
      'Esito: Nessun nuovo pattern supera la soglia ROI (>= 120s su 15 sessioni) e il Gate Anti-Collisione.',
      'Tutte le sequenze ricorrenti rilevate sono già coperte dal catalogo attivo o sotto soglia.'
    );
    return lines.join('\n');
  }

  lines.push('--- CANDIDATI AD ALTO ROI PROMOSSI ---');
  for (const [idx, rec] of report.recommendations.slice(0, 8).entries()) {
    lines.push(
      `${idx + 1}. [${rec.recommendationType}] ${rec.patternId} (${rec.patternType})`,
      `   Impronta   : ${rec.signature}`,
      `   Frequenza  : ${rec.occurrences} occorrenze in ${rec.distinctSessions} sessioni (media ${rec.avgStepsPerRun} step)`,
      `   ROI Stimato: ~${rec.savedSecondsPerRun}s/run | +${rec.netSavedSeconds15Sessions}s netti su 15 sessioni (${rec.roiMultiplier}x setup) | Score: ${rec.roiScore}`,
      `   Motivazione: ${rec.reason}`,
      ''
    );
  }

  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const isQuiet = args.includes('--quiet');
  const isJson = args.includes('--json');
  const analyticsDir = getAnalyticsDir();

  const dismissIdx = args.indexOf('--dismiss');
  if (dismissIdx !== -1 && args[dismissIdx + 1]) {
    const patternId = args[dismissIdx + 1].trim();
    const state = loadHarvesterState(analyticsDir);
    state.dismissedPatterns[patternId] = { dismissedAtMs: Date.now() };
    saveHarvesterState(state, analyticsDir);
    if (!isQuiet) {
      console.log(`Pattern '${patternId}' silenziato per ${state.config.dismissCooldownDays} giorni.`);
    }
    return;
  }

  const scaffoldIdx = args.indexOf('--scaffold');
  if (scaffoldIdx !== -1 && args[scaffoldIdx + 1]) {
    const patternId = args[scaffoldIdx + 1].trim();
    const recPath = join(analyticsDir, 'pattern-recommendations.json');
    const report = existsSync(recPath)
      ? JSON.parse(readFileSync(recPath, 'utf-8'))
      : runPatternHarvestScan({ analyticsDir });
    const candidate = (report.recommendations || []).find((r) => r.patternId === patternId);
    if (!candidate) {
      console.error(`Pattern '${patternId}' non trovato tra i candidati attivi.`);
      process.exit(1);
    }
    const slugIdx = args.indexOf('--slug');
    const customSlug = slugIdx !== -1 ? args[slugIdx + 1] : undefined;
    const scaffold = generateCandidateScaffold(candidate, { slug: customSlug });
    console.log(JSON.stringify(scaffold, null, 2));
    return;
  }

  const daysIdx = args.indexOf('--days');
  const days = daysIdx !== -1 && args[daysIdx + 1] ? Number(args[daysIdx + 1]) : 14;
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 && args[limitIdx + 1] ? Number(args[limitIdx + 1]) : 40;

  const report = runPatternHarvestScan({ days, limit, analyticsDir });
  if (isQuiet) return;

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatTextReport(report));
  }
}

if (isDirectEntry) {
  main();
}

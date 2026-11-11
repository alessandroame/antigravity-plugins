#!/usr/bin/env node
/**
 * Session Pattern & Cross-Workspace Self-Learning Engine (Headless Core)
 * Pure Node.js analyzer that inspects Antigravity session transcripts (transcript.jsonl)
 * to detect recurring user corrections, unprobed regressions, and experience-to-skill
 * evolution patterns, routing them to the Agent Training Ladder (L1 -> L2 -> L3).
 *
 * Also provides the Cross-Workspace Verification & Sync Bridge (--verify-and-sync) so
 * the agent can autonomously update `c:/github/antigravity-plugins` and propagate to
 * `~/.gemini/config/plugins/` even while working inside another repository (e.g. GlideMind).
 *
 * Zero DOM/browser dependencies.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discoverRepositoryTestFiles } from '../../engineering-workflow/core/review-guard-engine.mjs';

const UUID_DIR_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CLOUD_LOG_BYTES = 5 * 1024 * 1024;
const CLOUD_CATALOG_REPO_URL = 'https://github.com/alessandroame/antigravity-plugins.git';
const DEFAULT_CLOUD_SYNC_TTL_MS = 15 * 60 * 1000;

export function isDirectCliEntrypoint(metaUrl, argv1) {
  if (!argv1) return false;
  const metaPath = fileURLToPath(metaUrl).replace(/\\/g, '/').toLowerCase();
  const rawArgPath = resolve(argv1).replace(/\\/g, '/').toLowerCase();
  if (metaPath === rawArgPath) return true;
  try {
    const realMeta = realpathSync(fileURLToPath(metaUrl)).replace(/\\/g, '/').toLowerCase();
    const realArg = realpathSync(resolve(argv1)).replace(/\\/g, '/').toLowerCase();
    return realMeta === realArg;
  } catch {
    return false;
  }
}

export function getAnalyticsDir(customDir) {
  if (customDir) return resolve(customDir);
  if (process.env.ANTIGRAVITY_ANALYTICS_DIR) return resolve(process.env.ANTIGRAVITY_ANALYTICS_DIR);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

export function getBrainDirs(customDir) {
  if (customDir) return [resolve(customDir)];
  if (process.env.ANTIGRAVITY_BRAIN_DIR) return [resolve(process.env.ANTIGRAVITY_BRAIN_DIR)];
  const candidates = [
    join(homedir(), '.gemini', 'antigravity', 'brain'),
    join(homedir(), '.gemini', 'jetski', 'brain')
  ];
  const existing = candidates.filter((c) => existsSync(c));
  return existing.length > 0 ? existing : [candidates[0]];
}

const SUBAGENT_MARKERS_RX =
  /Skill Attive \((?:Alpha|Beta|Gamma|Delta|Epsilon)\)|Sei \*\*Subagent|Agisci esclusivamente come \*\*Subagent|Sfidante [AB]|Giudice Cieco/i;

const SKILL_EVOLUTION_RX =
  /\b(?:aggiorna(?:re)?\s+(?:la\s+|le\s+)?skill|aggiorna(?:re)?\s+(?:i\s+)?plugin\w*|in\s+base\s+all'esperienza|auto[- ]?apprendimento|rendere\s+la\s+modalit[aà]|ricordati\s+sempre|d'ora\s+in\s+poi|non\s+fare\s+mai|implementare\s+nei\s+plugin)\b/i;

const REGRESSION_FRICTION_RX =
  /\b(?:avviene\s+ancora|ancora\s+presente|non\s+funziona\s+ancora|stesso\s+errore|stesso\s+difetto|continua\s+a\s+non\s+funzionare|si\s+rompe\s+ancora|regression\w+|a\s+occhio)\b/i;

const READONLY_CLAUSE_RX =
  /\b(?:non\s+agire|[eè]\s+solo\s+una?\s+domanda|solo\s+una?\s+domanda|senza\s+modificare)\b/i;

const VISUAL_AUDIT_RX =
  /\b(?:screenshot|viewport|360x800|1280x800|overflow|sonda|geometr\w+|layout|responsive|interfaccia|canvas|svg)\b/i;

const CROSS_REPO_SYNC_RX =
  /\b(?:npm\s+run\s+sync|sync-to-global|aggiorna\s+i\s+plugin\w*|sincronizza\s+i\s+plugin)\b/i;

/**
 * Ensures the canonical `antigravity-plugins` repository is cloned locally in Cloud VMs
 * when working inside another project repository (e.g. GlideMind, ParagliderSim, Quiz_VDS-VL).
 * @param {string} [targetDir]
 * @returns {string | null}
 */
export function ensureCloudCatalogClone(targetDir) {
  const cloneDest = targetDir || join(homedir(), 'alessandroame', 'antigravity-plugins');
  if (existsSync(join(cloneDest, 'scripts', 'validate.mjs'))) {
    return resolve(cloneDest);
  }
  try {
    mkdirSync(dirname(cloneDest), { recursive: true });
    const res = spawnSync('git', ['clone', '--depth', '1', CLOUD_CATALOG_REPO_URL, cloneDest], {
      encoding: 'utf-8',
      timeout: 25000,
      windowsHide: true
    });
    if (res.status === 0 && existsSync(join(cloneDest, 'scripts', 'validate.mjs'))) {
      return resolve(cloneDest);
    }
  } catch {
    // Non-blocking fallback if offline
  }
  return null;
}

/**
 * Resolves the canonical `antigravity-plugins` repository root regardless of current working directory.
 * @param {string} [customRoot]
 * @param {{ autoCloneInCloud?: boolean }} [options]
 * @returns {string}
 */
export function resolveCatalogRepoRoot(customRoot, options = {}) {
  if (customRoot && existsSync(join(resolve(customRoot), 'scripts', 'validate.mjs'))) {
    return resolve(customRoot);
  }
  if (
    process.env.ANTIGRAVITY_PLUGINS_ROOT &&
    existsSync(join(resolve(process.env.ANTIGRAVITY_PLUGINS_ROOT), 'scripts', 'validate.mjs'))
  ) {
    return resolve(process.env.ANTIGRAVITY_PLUGINS_ROOT);
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const candidateFromScript = resolve(scriptDir, '..', '..', '..');
  if (existsSync(join(candidateFromScript, 'scripts', 'validate.mjs'))) {
    return candidateFromScript;
  }

  try {
    const syncStatePath = join(getAnalyticsDir(), 'plugin-sync-state.json');
    if (existsSync(syncStatePath)) {
      const parsed = JSON.parse(readFileSync(syncStatePath, 'utf-8'));
      if (parsed?.repoRoot && existsSync(join(resolve(parsed.repoRoot), 'scripts', 'validate.mjs'))) {
        return resolve(parsed.repoRoot);
      }
    }
  } catch {
    // Ignore malformed state file
  }

  const crossOsCandidates = [
    resolve(process.cwd(), '..', 'antigravity-plugins'),
    join(homedir(), 'alessandroame', 'antigravity-plugins'),
    join(homedir(), '.gemini', 'antigravity-plugins'),
    'c:/github/antigravity-plugins',
    join(homedir(), 'github', 'antigravity-plugins'),
    join(homedir(), 'antigravity-plugins'),
    '/tmp/antigravity-plugins',
    '/workspaces/antigravity-plugins'
  ];
  for (const candidate of crossOsCandidates) {
    if (existsSync(join(candidate, 'scripts', 'validate.mjs'))) {
      return resolve(candidate);
    }
  }

  if (options.autoCloneInCloud && existsSync('/shared/user/.gemini')) {
    const cloned = ensureCloudCatalogClone();
    if (cloned) return cloned;
  }

  return resolve(process.cwd());
}

/**
 * Triggers a non-blocking detached background sync (`git pull --ff-only` + `sync-to-global.mjs`)
 * when `~/.gemini/GEMINI.md` is missing or the last sync check is older than `ttlMs` (15m).
 * Ensures every Cloud project VM stays permanently aligned with `antigravity-plugins` `main`.
 * @param {{ ttlMs?: number, nowMs?: number, analyticsDir?: string, geminiBootstrapFile?: string, dryRun?: boolean }} [options]
 * @returns {{ triggered: boolean, reason: string }}
 */
export function triggerBackgroundCloudSyncIfNeeded(options = {}) {
  const nowMs = options.nowMs || Date.now();
  const ttlMs = options.ttlMs || DEFAULT_CLOUD_SYNC_TTL_MS;
  const geminiBootstrapFile =
    options.geminiBootstrapFile || join(homedir(), '.gemini', 'GEMINI.md');
  const syncStatePath = join(getAnalyticsDir(options.analyticsDir), 'plugin-sync-state.json');

  let shouldTrigger = !existsSync(geminiBootstrapFile);
  let reason = shouldTrigger ? 'missing-gemini-bootstrap' : 'up-to-date';

  if (!shouldTrigger) {
    try {
      if (!existsSync(syncStatePath)) {
        shouldTrigger = true;
        reason = 'missing-sync-state';
      } else {
        const parsed = JSON.parse(readFileSync(syncStatePath, 'utf-8'));
        const lastCheck = Number(parsed?.lastCheckAtMs) || 0;
        if (nowMs - lastCheck >= ttlMs) {
          shouldTrigger = true;
          reason = 'ttl-expired';
        }
      }
    } catch {
      shouldTrigger = true;
      reason = 'corrupt-sync-state';
    }
  }

  if (shouldTrigger && !options.dryRun) {
    try {
      const selfScript = fileURLToPath(import.meta.url);
      const child = spawn(process.execPath, [selfScript, '--background-sync'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    } catch {
      // Non-blocking background spawn
    }
  }

  return { triggered: shouldTrigger, reason };
}

/**
 * Executes atomic cross-workspace validation, unit testing, and global plugin sync.
 * Safe to invoke from any external project workspace (e.g. GlideMind).
 * @param {{ repoRoot?: string, dryRun?: boolean }} [options]
 * @returns {{ ok: boolean, repoRoot: string, steps: Array<{ step: string, status: number, output: string }> }}
 */
export function verifyAndSyncGlobalPlugins(options = {}) {
  const repoRoot = resolveCatalogRepoRoot(options.repoRoot, { autoCloneInCloud: !options.dryRun });
  const validateScript = join(repoRoot, 'scripts', 'validate.mjs');
  const syncScript = join(repoRoot, 'scripts', 'sync-to-global.mjs');

  if (!existsSync(validateScript)) {
    return {
      ok: false,
      repoRoot,
      steps: [{ step: 'locate_repo', status: 1, output: `validate.mjs not found at ${validateScript}` }]
    };
  }

  if (options.dryRun) {
    return {
      ok: true,
      repoRoot,
      steps: [{ step: 'dry_run', status: 0, output: `Resolved catalog root: ${repoRoot}` }]
    };
  }

  const steps = [];

  // Step 1: Validate all plugin manifests, byte caps (<= 6500 B), and markdown hygiene
  const valRes = spawnSync(process.execPath, [validateScript, '--all'], {
    cwd: repoRoot,
    encoding: 'utf-8',
    timeout: 20000
  });
  steps.push({
    step: 'validate_all',
    status: valRes.status ?? 1,
    output: (valRes.stdout || '') + (valRes.stderr || '')
  });
  if (valRes.status !== 0) {
    return { ok: false, repoRoot, steps };
  }

  // Step 2: Run all auto-discovered repository and plugin unit tests (zero hardcoded lists)
  const testFiles = discoverRepositoryTestFiles(repoRoot);

  if (testFiles.length > 0) {
    const testRes = spawnSync(process.execPath, ['--test', ...testFiles], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 40000
    });
    steps.push({
      step: 'unit_tests',
      status: testRes.status ?? 1,
      output: (testRes.stdout || '') + (testRes.stderr || '')
    });
    if (testRes.status !== 0) {
      return { ok: false, repoRoot, steps };
    }
  }

  // Step 3: Physical sync to ~/.gemini/config/plugins
  const syncRes = spawnSync(process.execPath, [syncScript], {
    cwd: repoRoot,
    encoding: 'utf-8',
    timeout: 40000
  });
  steps.push({
    step: 'sync_to_global',
    status: syncRes.status ?? 1,
    output: (syncRes.stdout || '') + (syncRes.stderr || '')
  });

  const gitOutboundStatus = inspectCatalogGitOutboundStatus(repoRoot);

  return {
    ok: syncRes.status === 0,
    repoRoot,
    gitOutboundStatus,
    steps
  };
}

/**
 * Checks whether `antigravity-plugins` has uncommitted plugin modifications or unpushed commits
 * so changes made while working inside another repository (e.g. GlideMind) are not stranded on Machine A.
 * @param {string} [customRoot]
 * @returns {{ dirty: boolean, uncommittedCount: number, unpushedCount: number, needsPushToOrigin: boolean }}
 */
export function inspectCatalogGitOutboundStatus(customRoot) {
  const repoRoot = resolveCatalogRepoRoot(customRoot);
  try {
    const porcelain = spawnSync('git', ['status', '--porcelain'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true
    });
    const uncommittedLines = (porcelain.stdout || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const ahead = spawnSync('git', ['rev-list', '--count', '@{u}..HEAD'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true
    });
    const unpushedCount =
      ahead.status === 0 ? parseInt((ahead.stdout || '0').trim(), 10) || 0 : 0;

    return {
      dirty: uncommittedLines.length > 0,
      uncommittedCount: uncommittedLines.length,
      unpushedCount,
      needsPushToOrigin: uncommittedLines.length > 0 || unpushedCount > 0
    };
  } catch {
    return {
      dirty: false,
      uncommittedCount: 0,
      unpushedCount: 0,
      needsPushToOrigin: false
    };
  }
}

/**
 * Classifies a single user prompt or observation into the Agent Training Ladder (L0..L3).
 * @param {unknown} rawText
 * @returns {{
 *   shouldLearn: boolean,
 *   ladderLevel: 'L0' | 'L1' | 'L2a' | 'L2b' | 'L3',
 *   category: 'NONE' | 'L3_INVARIANT_GUARD' | 'L2_SKILL_OR_RULE_EVOLUTION' | 'L1_PROJECT_MEMORY',
 *   targetPluginHint: string,
 *   crossRepoTarget: string,
 *   recommendedAction: string
 * }}
 */
export function classifySelfLearningCandidate(rawText) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  const catalogRoot = 'c:/github/antigravity-plugins';
  if (!text) {
    return {
      shouldLearn: false,
      ladderLevel: 'L0',
      category: 'NONE',
      targetPluginHint: 'none',
      crossRepoTarget: catalogRoot,
      recommendedAction: 'No self-learning action required.'
    };
  }

  const hasSkillEvolution = SKILL_EVOLUTION_RX.test(text);
  const hasRegression = REGRESSION_FRICTION_RX.test(text);
  const hasVisual = VISUAL_AUDIT_RX.test(text);

  if (hasRegression) {
    return {
      shouldLearn: true,
      ladderLevel: 'L3',
      category: 'L3_INVARIANT_GUARD',
      targetPluginHint: hasVisual ? 'engineering-workflow / laws-of-ux' : 'engineering-workflow',
      crossRepoTarget: catalogRoot,
      recommendedAction:
        'Encode a deterministic numeric/geometric invariant test (L3) alongside the code fix to prevent recurrence, update local MEMORY.md in-place (L1), and if universal, patch c:/github/antigravity-plugins and run session-miner.mjs --verify-and-sync.'
    };
  }

  if (hasSkillEvolution) {
    const isCodeCheckable = /\b(?:triage|soglia|byte|righe|banner|validat\w+|sonda|hook)\b/i.test(text);
    return {
      shouldLearn: true,
      ladderLevel: isCodeCheckable ? 'L3' : 'L2b',
      category: 'L2_SKILL_OR_RULE_EVOLUTION',
      targetPluginHint: /\bskizz\w*\b/i.test(text)
        ? 'skizzo'
        : /\b(?:skill|memoria|session\w*)\b/i.test(text)
          ? 'proactive-mentorship / cognitive-persistence'
          : 'skill-governance',
      crossRepoTarget: catalogRoot,
      recommendedAction:
        'Apply autonomous in-place update directly in c:/github/antigravity-plugins/plugins/ (even from external workspaces), then run session-miner.mjs --verify-and-sync.'
    };
  }

  return {
    shouldLearn: false,
    ladderLevel: 'L0',
    category: 'NONE',
    targetPluginHint: 'none',
    crossRepoTarget: catalogRoot,
    recommendedAction: 'Standard execution turn; no cross-session rule graduation needed.'
  };
}

/**
 * Analyzes an array of parsed session objects to extract empirical workflow statistics
 * and self-learning recommendations.
 * @param {Array<{ id: string, userPrompts: string[], isSubagent?: boolean }>} sessions
 */
export function analyzeSessionTranscripts(sessions) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  let totalParentSessions = 0;
  let skippedSubagentSessions = 0;
  let totalUserTurns = 0;
  let explicitSkizzoSessions = 0;
  let explicitSkizzoTurns = 0;

  const patternCounts = {
    sessionToPluginEvolution: 0,
    repeatedRegressionOrFriction: 0,
    readonlyQuestionWithClause: 0,
    crossRepoSync: 0,
    visualOrGeometryAudit: 0
  };

  const learningCandidates = [];

  for (const session of safeSessions) {
    if (!session || session.isSubagent) {
      skippedSubagentSessions++;
      continue;
    }
    const prompts = Array.isArray(session.userPrompts) ? session.userPrompts.filter(Boolean) : [];
    if (prompts.length === 0) continue;

    totalParentSessions++;
    if (prompts.some((p) => /(?:^|\s)\/skizzo\b/i.test(p))) {
      explicitSkizzoSessions++;
    }

    for (const prompt of prompts) {
      totalUserTurns++;
      if (/(?:^|\s)\/skizzo\b/i.test(prompt)) {
        explicitSkizzoTurns++;
      }
      if (SKILL_EVOLUTION_RX.test(prompt)) {
        patternCounts.sessionToPluginEvolution++;
      }
      if (REGRESSION_FRICTION_RX.test(prompt)) {
        patternCounts.repeatedRegressionOrFriction++;
      }
      if (READONLY_CLAUSE_RX.test(prompt)) {
        patternCounts.readonlyQuestionWithClause++;
      }
      if (CROSS_REPO_SYNC_RX.test(prompt)) {
        patternCounts.crossRepoSync++;
      }
      if (VISUAL_AUDIT_RX.test(prompt)) {
        patternCounts.visualOrGeometryAudit++;
      }

      const candidate = classifySelfLearningCandidate(prompt);
      if (candidate.shouldLearn && learningCandidates.length < 15) {
        learningCandidates.push({
          sessionId: session.id,
          excerpt: prompt.replace(/\s+/g, ' ').slice(0, 120),
          ...candidate
        });
      }
    }
  }

  const skizzoSessionRate =
    totalParentSessions > 0 ? Number(((explicitSkizzoSessions / totalParentSessions) * 100).toFixed(1)) : 0;

  return {
    totalParentSessions,
    skippedSubagentSessions,
    totalUserTurns,
    explicitSkizzoSessions,
    explicitSkizzoTurns,
    skizzoSessionRatePct: skizzoSessionRate,
    patternCounts,
    learningCandidates
  };
}

/**
 * Appends a structured turn event to `~/.gemini/antigravity/analytics/cloud-sessions-log.ndjson`
 * so Cloud VM turns (where `.system_generated/logs/transcript.jsonl` is not exposed on disk)
 * are tracked for `mapek`, `pattern-harvester`, and `session-miner.mjs`.
 *
 * @param {{
 *   conversationId?: string,
 *   workspace?: string,
 *   timestampMs?: number,
 *   userText?: string,
 *   toolCalls?: Array<{ name: string, args?: Record<string, unknown> }>,
 *   route?: string,
 *   tier?: string
 * }} event
 * @param {string} [customAnalyticsDir]
 */
export function recordCloudTurnEvent(event = {}, customAnalyticsDir) {
  try {
    const analyticsDir = getAnalyticsDir(customAnalyticsDir);
    mkdirSync(analyticsDir, { recursive: true });
    const logPath = join(analyticsDir, 'cloud-sessions-log.ndjson');
    if (existsSync(logPath)) {
      try {
        const st = statSync(logPath);
        if (st.size > MAX_CLOUD_LOG_BYTES) {
          renameSync(logPath, join(analyticsDir, 'cloud-sessions-log.archive.ndjson'));
        }
      } catch {
        // Ignore rotation race
      }
    }

    const nowMs = Number(event.timestampMs || Date.now());
    const convId =
      event.conversationId ||
      process.env.ANTIGRAVITY_CONVERSATION_ID ||
      `cloud-${new Date(nowMs).toISOString().slice(0, 10)}`;
    const workspace = event.workspace || basename(process.cwd()) || 'cloud-workspace';

    const record = {
      conversationId: String(convId),
      workspace: String(workspace),
      timestampMs: nowMs,
      createdAt: new Date(nowMs).toISOString(),
      userText: typeof event.userText === 'string' ? event.userText.trim() : '',
      toolCalls: Array.isArray(event.toolCalls) ? event.toolCalls : [],
      route: event.route || null,
      tier: event.tier || null
    };

    appendFileSync(logPath, `${JSON.stringify(record)}\n`, 'utf-8');
    return { ok: true, logPath, conversationId: record.conversationId };
  } catch {
    return { ok: false };
  }
}

/**
 * Synthesizes a JSONL transcript string from a Cloud conversation directory in `jetski/brain/.../<uuid>`
 * when `.system_generated/logs/transcript.jsonl` is not present on disk.
 *
 * @param {string} convDir
 * @param {string} convId
 * @returns {{ jsonl: string, mtimeMs: number, workspace: string } | null}
 */
function buildSyntheticJsonlFromCloudDir(convDir, convId) {
  try {
    const entries = readdirSync(convDir, { withFileTypes: true });
    let maxMtimeMs = 0;
    let workspace = '';
    const promptTexts = [];
    const toolCalls = [];

    for (const ent of entries) {
      const full = join(convDir, ent.name);
      if (ent.isFile() && ent.name.endsWith('.metadata.json')) {
        try {
          const st = statSync(full);
          if (st.mtimeMs > maxMtimeMs) maxMtimeMs = st.mtimeMs;
          const meta = JSON.parse(readFileSync(full, 'utf-8'));
          if (typeof meta.summary === 'string' && meta.summary.trim()) {
            promptTexts.push(meta.summary.trim());
          }
        } catch {
          // Ignore malformed metadata
        }
      } else if (ent.isFile() && ent.name.endsWith('.md')) {
        try {
          const st = statSync(full);
          if (st.mtimeMs > maxMtimeMs) maxMtimeMs = st.mtimeMs;
          const rawMd = readFileSync(full, 'utf-8').slice(0, 4096);
          const wsMatch = rawMd.match(/\/home\/antigravity\/[^/]+\/([^/)\s`"]+)/i);
          if (wsMatch && wsMatch[1] && !workspace) {
            workspace = wsMatch[1];
          }
          const headingMatch = rawMd.match(/^#\s+(.+)$/m);
          if (headingMatch && headingMatch[1] && promptTexts.length === 0) {
            promptTexts.push(headingMatch[1].trim());
          }
          toolCalls.push({
            name: 'write_to_file',
            args: { TargetFile: full }
          });
        } catch {
          // Ignore unreadable markdown
        }
      }
    }

    const tasksDir = join(convDir, '.system_generated', 'tasks');
    if (existsSync(tasksDir)) {
      const taskFiles = readdirSync(tasksDir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.log'))
        .map((e) => {
          const p = join(tasksDir, e.name);
          try {
            return { name: e.name, path: p, mtimeMs: statSync(p).mtimeMs };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.mtimeMs - b.mtimeMs);

      for (const tf of taskFiles) {
        if (tf.mtimeMs > maxMtimeMs) maxMtimeMs = tf.mtimeMs;
        try {
          const head = readFileSync(tf.path, 'utf-8').slice(0, 4096);
          const wsMatch = head.match(/\/home\/antigravity\/[^/]+\/([^/\s`"]+)/i);
          if (wsMatch && wsMatch[1] && !workspace) {
            workspace = wsMatch[1];
          }
          const cmdMatch = head.match(/^>\s*(.+)$/gm);
          const cmdLine =
            cmdMatch && cmdMatch.length > 0
              ? cmdMatch[cmdMatch.length - 1].replace(/^>\s*/, '').trim()
              : '';
          if (cmdLine) {
            toolCalls.push({
              name: 'run_command',
              args: { CommandLine: cmdLine }
            });
          }
        } catch {
          // Ignore locked task log
        }
      }
    }

    if (promptTexts.length === 0 && toolCalls.length === 0) {
      return null;
    }

    const effectiveMtime = maxMtimeMs || Date.now();
    const isoTs = new Date(effectiveMtime).toISOString();
    const userPrompt = promptTexts[0] || `Sessione Cloud (${workspace || convId.slice(0, 8)})`;
    const jsonlLines = [
      JSON.stringify({
        type: 'USER_INPUT',
        source: 'USER_EXPLICIT',
        created_at: isoTs,
        content: `Command Working Directory: /home/antigravity/${workspace || 'cloud-workspace'}\n<USER_REQUEST>${userPrompt}</USER_REQUEST>`
      }),
      JSON.stringify({
        type: 'PLANNER_RESPONSE',
        created_at: isoTs,
        tool_calls: toolCalls
      })
    ];

    return {
      jsonl: jsonlLines.join('\n'),
      mtimeMs: Math.round(effectiveMtime),
      workspace: workspace || 'cloud-workspace'
    };
  } catch {
    return null;
  }
}

/**
 * Discovers human conversation sessions across both Desktop (`~/.gemini/antigravity/brain`),
 * Cloud (`~/.gemini/jetski/brain/**`), and `analytics/cloud-sessions-log.ndjson`.
 *
 * @param {{ brainDir?: string, analyticsDir?: string, includeCloudLog?: boolean }} [options]
 * @returns {Array<{ conversationId: string, transcriptPath: string | null, syntheticJsonl: string | null, mtimeMs: number, workspace: string }>}
 */
export function discoverUnifiedBrainSessions(options = {}) {
  const roots = getBrainDirs(options.brainDir);
  const byId = new Map();

  function walkDir(dir, depth = 0) {
    if (depth > 5 || !existsSync(dir)) return;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (ent.name === '.system_generated' || ent.name === 'node_modules' || ent.name === 'scratch') continue;
      const full = join(dir, ent.name);
      const tPath = join(full, '.system_generated', 'logs', 'transcript.jsonl');

      if (existsSync(tPath)) {
        try {
          const st = statSync(tPath);
          byId.set(ent.name, {
            conversationId: ent.name,
            transcriptPath: tPath,
            syntheticJsonl: null,
            mtimeMs: Math.round(st.mtimeMs),
            workspace: ''
          });
        } catch {
          // Ignore inaccessible transcript
        }
        continue;
      }

      if (UUID_DIR_RX.test(ent.name)) {
        const synth = buildSyntheticJsonlFromCloudDir(full, ent.name);
        if (synth) {
          byId.set(ent.name, {
            conversationId: ent.name,
            transcriptPath: null,
            syntheticJsonl: synth.jsonl,
            mtimeMs: synth.mtimeMs,
            workspace: synth.workspace
          });
        }
        continue;
      }

      walkDir(full, depth + 1);
    }
  }

  for (const r of roots) {
    walkDir(r, 0);
  }

  const shouldReadCloudLog =
    options.includeCloudLog !== undefined ? Boolean(options.includeCloudLog) : !options.brainDir;

  if (shouldReadCloudLog) {
    const analyticsDir = getAnalyticsDir(options.analyticsDir);
    const cloudLogPath = join(analyticsDir, 'cloud-sessions-log.ndjson');
    if (existsSync(cloudLogPath)) {
      try {
        const grouped = new Map();
        const lines = readFileSync(cloudLogPath, 'utf-8').split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          try {
            const ev = JSON.parse(line);
            if (!ev || !ev.conversationId) continue;
            if (!grouped.has(ev.conversationId)) {
              grouped.set(ev.conversationId, []);
            }
            grouped.get(ev.conversationId).push(ev);
          } catch {
            // Skip malformed NDJSON line
          }
        }

        for (const [convId, events] of grouped.entries()) {
          if (byId.has(convId) && byId.get(convId).transcriptPath) continue;
          const jsonlLines = [];
          let latestMs = 0;
          let ws = 'cloud-workspace';

          for (const ev of events) {
            const ts = Number(ev.timestampMs || Date.now());
            if (ts > latestMs) latestMs = ts;
            if (ev.workspace) ws = ev.workspace;
            const iso = new Date(ts).toISOString();
            if (ev.userText) {
              jsonlLines.push(
                JSON.stringify({
                  type: 'USER_INPUT',
                  source: 'USER_EXPLICIT',
                  created_at: iso,
                  content: `Command Working Directory: /home/antigravity/${ws}\n<USER_REQUEST>${ev.userText}</USER_REQUEST>`
                })
              );
            }
            if (Array.isArray(ev.toolCalls) && ev.toolCalls.length > 0) {
              jsonlLines.push(
                JSON.stringify({
                  type: 'PLANNER_RESPONSE',
                  created_at: iso,
                  tool_calls: ev.toolCalls,
                  ...(ev.tokenUsage ? { token_usage: ev.tokenUsage } : {})
                })
              );
            }
          }

          if (jsonlLines.length > 0) {
            const existing = byId.get(convId);
            const combinedJsonl = existing?.syntheticJsonl
              ? `${existing.syntheticJsonl}\n${jsonlLines.join('\n')}`
              : jsonlLines.join('\n');
            byId.set(convId, {
              conversationId: convId,
              transcriptPath: null,
              syntheticJsonl: combinedJsonl,
              mtimeMs: Math.max(latestMs, existing?.mtimeMs || 0),
              workspace: ws
            });
          }
        }
      } catch {
        // Ignore unreadable cloud log
      }
    }
  }

  return [...byId.values()].sort((a, b) => b.mtimeMs - a.mtimeMs);
}

const PREVENTIVE_BYPASS_RX =
  /^(?:\/[a-z0-9-]+|s[iì]|no|ok|vai|procedi|fallo|applica(?:\s+il\s+piano)?|esegui(?:\s+il\s+piano)?|git\s+|npm\s+|node\s+|spiega(?:mi)?|mostra(?:mi)?|perch[eé]|come\s+(?:funziona|mai)|dove\s+si\s+trova|a\s+che\s+punto|non\s+vedo|qual\s+[eè]|quali\s+sono)\b/i;

const PREVENTIVE_MUTATION_INTENT_RX =
  /\b(?:sistema(?:re)?|modifica(?:re)?|rifai|rifare|cambia(?:re)?|migliora(?:re)?|aggiungi|aggiungere|crea(?:re)?|implementa(?:re)?|ottimizza(?:re)?|fixa(?:re)?|correggi|correggere|ristruttura(?:re)?|rifattorizza(?:re)?|refactor\w*)\b/i;

const FILE_OR_SYMBOL_ANCHOR_RX =
  /@[a-zA-Z0-9_./\\-]+|\b[a-zA-Z0-9_.-]+\.(?:[cm]?[jt]sx?|py|cs|dart|go|rs|md|json|html|css|scss|yml|yaml|sh)\b|`[^`]{2,50}`/i;

const VERIFICATION_CRITERIA_RX =
  /\b(?:test|validat\w+|sonda|probe|assert\w*|verific\w+|360x800|1280x800|senza\s+rompere|invariante|npm\s+test|dotnet\s+test)\b/i;

const BROAD_MULTI_COMPONENT_RX =
  /\b(?:tutt[oaie]|intera?\s+pagina|intero\s+progetto|architettura|flusso\s+completo|da\s+zero|pi[uù]\s+file|ovunque|generale|sistema\s+il\s+layout)\b/i;

/**
 * Evaluates a user prompt BEFORE execution (`NOTE-003` — Preventive Prompt Review Advisor).
 * Returns `needsReview: true` with an optimized Italian prompt draft and 1-click `ask_question`
 * options ONLY when the request is a broad/ambiguous code mutation lacking file anchors or verification criteria.
 *
 * @param {unknown} rawPrompt
 * @param {{ workspace?: string }} [options]
 */
export function evaluatePromptForPreventiveReview(rawPrompt, options = {}) {
  const clean = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  const defaultPass = {
    needsReview: false,
    score: 0,
    signals: [],
    frictionReasonsIt: [],
    recommendedAgyMove: null,
    improvedPromptDraftIt: null,
    reviewQuestionIt: null,
    reviewOptionsIt: []
  };

  if (!clean || clean.length < 4) return defaultPass;
  if (PREVENTIVE_BYPASS_RX.test(clean) || READONLY_CLAUSE_RX.test(clean)) return defaultPass;
  if (clean.endsWith('?') && !PREVENTIVE_MUTATION_INTENT_RX.test(clean)) return defaultPass;

  const hasMutationIntent = PREVENTIVE_MUTATION_INTENT_RX.test(clean);
  if (!hasMutationIntent) return defaultPass;

  const hasFileAnchor = FILE_OR_SYMBOL_ANCHOR_RX.test(clean);
  const hasVerification = VERIFICATION_CRITERIA_RX.test(clean);
  const isBroadScope = BROAD_MULTI_COMPONENT_RX.test(clean);
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  let score = 0;
  const signals = [];
  const frictionReasonsIt = [];

  if (!hasFileAnchor) {
    score += 2;
    signals.push('missing_file_anchor');
    frictionReasonsIt.push('Manca il riferimento esplicito ai file o moduli bersaglio (`@file`).');
  }
  if (wordCount < 15 && !hasFileAnchor) {
    score += 1;
    signals.push('terse_unanchored_mutation');
    frictionReasonsIt.push(`Richiesta sintetica (${wordCount} parole) ad alto rischio di modifiche fuori perimetro.`);
  }
  if (isBroadScope) {
    score += 1;
    signals.push('broad_multi_component_scope');
    frictionReasonsIt.push('Perimetro ampio o multi-componente senza confini di non-regressione.');
  }
  if (!hasVerification && (isBroadScope || !hasFileAnchor)) {
    score += 1;
    signals.push('missing_verification_oracle');
    frictionReasonsIt.push('Manca il criterio oggettivo di verifica finale (test unitari o sonda UI).');
  }

  if (score < 3) {
    return {
      ...defaultPass,
      score,
      signals
    };
  }

  const wsName = options.workspace || basename(process.cwd()) || 'progetto attivo';
  const isUiRelated = VISUAL_AUDIT_RX.test(clean) || /\b(?:ui|pagina| pulsante|bottone|pannell\w+| grafica|schermata|css|html)\b/i.test(clean);

  const recommendedAgyMove = isBroadScope
    ? {
        command: `/plan ${clean}`,
        reasonIt: 'Genera prima un piano di intervento verificato sui file esatti prima di toccare il codice.'
      }
    : {
        command: `/grill-me ${clean}`,
        reasonIt: 'Chiarisce in 1 turno i requisiti impliciti e i file bersaglio.'
      };

  const verificationClause = isUiRelated
    ? 'esegui i test automatici (`npm test`) e la sonda geometrica `ui-geometry-probe.js` su `360x800` e `1280x800` (`violations: 0`)'
    : 'esegui la suite di test automatici (`npm test`) e `diff-triage.mjs` verificando zero regressioni';

  const improvedPromptDraftIt =
    `${clean} — Perimetro: individua e limita le modifiche ai soli file strettamente necessari in \`${wsName}\` ` +
    `(elencando i \`@file\` prima di editarli), preserva le API e i test esistenti, e in chiusura ${verificationClause}.`;

  return {
    needsReview: true,
    score,
    signals,
    frictionReasonsIt,
    recommendedAgyMove,
    improvedPromptDraftIt,
    reviewQuestionIt:
      `[Plugin: proactive-mentorship] Problema rilevato nel prompt: ${frictionReasonsIt.join(' ')} Ho preparato una versione più precisa su \`${wsName}\` con file bersaglio e verifica automatica: come preferisci procedere?`,
    reviewOptionsIt: [
      '(Recommended) Esegui il prompt migliorato proposto',
      'Esegui direttamente il mio prompt originale senza modifiche',
      'Fai prima un piano dettagliato sui file coinvolti (/plan)'
    ]
  };
}

/**
 * Reads any pending `mapek` process decisions or high-ROI `pattern-harvester` candidates
 * from `~/.gemini/antigravity/analytics/` so Cloud turns can surface them without Desktop hooks.
 *
 * @param {string} [customAnalyticsDir]
 */
export function collectPendingSupervisionAdvisories(customAnalyticsDir) {
  const analyticsDir = getAnalyticsDir(customAnalyticsDir);
  let mapekDecision = null;
  let topPatternRecommendation = null;

  const pendingFile = join(analyticsDir, 'mapek-pending-decisions.json');
  if (existsSync(pendingFile)) {
    try {
      const data = JSON.parse(readFileSync(pendingFile, 'utf-8'));
      const list = Array.isArray(data?.decisions) ? data.decisions : [];
      const nowMs = Date.now();
      mapekDecision =
        list.find(
          (d) =>
            d &&
            d.status === 'PENDING_APPROVAL' &&
            Number(d.snoozedUntilMs || 0) <= nowMs
        ) || null;
    } catch {
      // Ignore malformed pending decisions
    }
  }

  const recFile = join(analyticsDir, 'pattern-recommendations.json');
  if (existsSync(recFile)) {
    try {
      const data = JSON.parse(readFileSync(recFile, 'utf-8'));
      const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];
      if (recs.length > 0) {
        topPatternRecommendation = recs[0];
      }
    } catch {
      // Ignore malformed pattern recommendations
    }
  }

  return {
    hasPendingAdvisories: Boolean(mapekDecision || topPatternRecommendation),
    mapekDecision,
    topPatternRecommendation
  };
}

/**
 * Scans the local and Cloud Antigravity brain directories and mines the most recent parent transcripts.
 * @param {string} [brainDir]
 * @param {{ limit?: number, analyticsDir?: string }} [options]
 */
export function mineBrainDirectory(brainDir, options = {}) {
  const limit = options.limit || 40;
  const discovered = discoverUnifiedBrainSessions({
    brainDir,
    analyticsDir: options.analyticsDir,
    includeCloudLog: !brainDir
  });

  if (discovered.length === 0) {
    return analyzeSessionTranscripts([]);
  }

  const parsedSessions = [];
  let parentsFound = 0;

  for (const entry of discovered) {
    if (parentsFound >= limit) break;
    try {
      const rawContent = entry.transcriptPath
        ? readFileSync(entry.transcriptPath, 'utf-8')
        : entry.syntheticJsonl || '';
      const lines = rawContent.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) continue;

      const firstLine = lines[0];
      if (SUBAGENT_MARKERS_RX.test(firstLine)) {
        parsedSessions.push({ id: entry.conversationId, userPrompts: [], isSubagent: true });
        continue;
      }

      const userPrompts = [];
      let isSubagent = false;

      for (const line of lines) {
        let step;
        try {
          step = JSON.parse(line);
        } catch {
          continue;
        }
        if (step.type === 'SYSTEM_MESSAGE' && SUBAGENT_MARKERS_RX.test(step.content || '')) {
          isSubagent = true;
          break;
        }
        if (step.type === 'USER_INPUT' && step.source === 'USER_EXPLICIT') {
          const raw = String(step.content || '')
            .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '')
            .replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, '')
            .replace(/<\/?USER_REQUEST>/g, '')
            .replace(/^Command Working Directory:[^\r\n]*\r?\n?/i, '')
            .trim();
          if (raw && !raw.includes('<SYSTEM_MESSAGE>')) {
            userPrompts.push(raw);
          }
        }
      }

      if (isSubagent) {
        parsedSessions.push({ id: entry.conversationId, userPrompts: [], isSubagent: true });
      } else if (userPrompts.length > 0) {
        parentsFound++;
        parsedSessions.push({ id: entry.conversationId, userPrompts, isSubagent: false });
      }
    } catch {
      // Ignore unreadable transcript files
    }
  }

  return analyzeSessionTranscripts(parsedSessions);
}

const isMain = isDirectCliEntrypoint(import.meta.url, process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--background-sync')) {
    const repoRoot = resolveCatalogRepoRoot(undefined, { autoCloneInCloud: true });
    const syncScript = join(repoRoot, 'scripts', 'sync-to-global.mjs');
    if (existsSync(syncScript)) {
      spawnSync(process.execPath, [syncScript, '--auto-pull', '--if-needed', '--quiet'], {
        cwd: repoRoot,
        encoding: 'utf-8',
        timeout: 30000,
        windowsHide: true
      });
    }
    process.exit(0);
  }
  if (args.includes('--verify-and-sync')) {
    const res = verifyAndSyncGlobalPlugins();
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: res.ok,
          repoRoot: res.repoRoot,
          gitOutboundStatus: res.gitOutboundStatus
        },
        null,
        2
      )}\n`
    );
    if (!res.ok) {
      for (const s of res.steps) {
        if (s.status !== 0) process.stderr.write(`[FAIL ${s.step}]\n${s.output}\n`);
      }
      process.exit(1);
    }
    process.exit(0);
  }

  const reviewIdx = args.indexOf('--review-prompt');
  if (reviewIdx !== -1 && args[reviewIdx + 1] !== undefined) {
    const rawPrompt = args[reviewIdx + 1];
    recordCloudTurnEvent({ userText: rawPrompt });
    const promptReview = evaluatePromptForPreventiveReview(rawPrompt);
    const selfLearning = classifySelfLearningCandidate(rawPrompt);
    const supervision = collectPendingSupervisionAdvisories();
    process.stdout.write(
      `${JSON.stringify(
        {
          promptReview,
          selfLearning,
          supervision
        },
        null,
        2
      )}\n`
    );
    process.exit(0);
  }

  const brainIdx = args.indexOf('--brain');
  const customBrain = brainIdx !== -1 && args[brainIdx + 1] ? args[brainIdx + 1] : undefined;
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 && args[limitIdx + 1] ? Number(args[limitIdx + 1]) : 40;
  const report = mineBrainDirectory(customBrain, { limit });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

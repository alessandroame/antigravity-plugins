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

import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SUBAGENT_MARKERS_RX =
  /Skill Attive \((?:Alpha|Beta|Gamma)\)|Sei \*\*Subagent|Agisci esclusivamente come \*\*Subagent|Sfidante [AB]|Giudice Cieco/i;

const SKILL_EVOLUTION_RX =
  /\b(?:aggiorna(?:re)?\s+(?:la\s+|le\s+)?skill|aggiorna(?:re)?\s+(?:i\s+)?plugin\w*|in\s+base\s+all'esperienza|auto[- ]?apprendimento|rendere\s+la\s+modalit[aà]|ricordati\s+sempre|d'ora\s+in\s+poi|non\s+fare\s+mai|implementare\s+nei\s+plugin)\b/i;

const REGRESSION_FRICTION_RX =
  /\b(?:avviene\s+ancora|ancora\s+presente|sembra\s+totalmente\s+assente|inchiodat\w+|scalin\w+|sparisc\w+|troppo\s+buono|a\s+occhio|non\s+funziona\s+ancora|stesso\s+errore)\b/i;

const READONLY_CLAUSE_RX =
  /\b(?:non\s+agire|[eè]\s+solo\s+una?\s+domanda|solo\s+una?\s+domanda|senza\s+modificare)\b/i;

const VISUAL_AUDIT_RX =
  /\b(?:screenshot|replay\s+3d|inquadratur\w+|camera|360x800|overflow|sonda|geometr\w+|layout)\b/i;

const CROSS_REPO_SYNC_RX =
  /\b(?:npm\s+run\s+sync|sync-to-global|aggiorna\s+i\s+plugin\w*|sincronizza\s+i\s+plugin)\b/i;

/**
 * Resolves the canonical `antigravity-plugins` repository root regardless of current working directory.
 * @param {string} [customRoot]
 * @returns {string}
 */
export function resolveCatalogRepoRoot(customRoot) {
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

  const defaultWinPath = 'c:/github/antigravity-plugins';
  if (existsSync(join(defaultWinPath, 'scripts', 'validate.mjs'))) {
    return resolve(defaultWinPath);
  }

  return resolve(process.cwd());
}

/**
 * Executes atomic cross-workspace validation, unit testing, and global plugin sync.
 * Safe to invoke from any external project workspace (e.g. GlideMind).
 * @param {{ repoRoot?: string, dryRun?: boolean }} [options]
 * @returns {{ ok: boolean, repoRoot: string, steps: Array<{ step: string, status: number, output: string }> }}
 */
export function verifyAndSyncGlobalPlugins(options = {}) {
  const repoRoot = resolveCatalogRepoRoot(options.repoRoot);
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

  // Step 2: Run core plugin unit tests
  const testFiles = [
    join(repoRoot, 'plugins', 'skizzo', 'tests', 'triage.test.mjs'),
    join(repoRoot, 'plugins', 'proactive-mentorship', 'tests', 'session-miner.test.mjs'),
    join(repoRoot, 'plugins', 'telemetry-analytics', 'tests', 'session-backfill.test.mjs')
  ].filter((f) => existsSync(f));

  if (testFiles.length > 0) {
    const testRes = spawnSync(process.execPath, ['--test', ...testFiles], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 20000
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
    timeout: 20000
  });
  steps.push({
    step: 'sync_to_global',
    status: syncRes.status ?? 1,
    output: (syncRes.stdout || '') + (syncRes.stderr || '')
  });

  return {
    ok: syncRes.status === 0,
    repoRoot,
    steps
  };
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
 * Scans the local Antigravity brain directory and mines the most recent parent transcripts.
 * @param {string} [brainDir]
 * @param {{ limit?: number }} [options]
 */
export function mineBrainDirectory(brainDir, options = {}) {
  const targetDir = brainDir || join(homedir(), '.gemini', 'antigravity', 'brain');
  const limit = options.limit || 40;
  if (!existsSync(targetDir)) {
    return analyzeSessionTranscripts([]);
  }

  const entries = readdirSync(targetDir)
    .map((id) => {
      const p = join(targetDir, id, '.system_generated', 'logs', 'transcript.jsonl');
      if (!existsSync(p)) return null;
      try {
        const st = statSync(p);
        return { id, path: p, mtimeMs: st.mtimeMs };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  const parsedSessions = [];
  let parentsFound = 0;

  for (const entry of entries) {
    if (parentsFound >= limit) break;
    try {
      const lines = readFileSync(entry.path, 'utf-8').trim().split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) continue;

      const firstLine = lines[0];
      if (SUBAGENT_MARKERS_RX.test(firstLine)) {
        parsedSessions.push({ id: entry.id, userPrompts: [], isSubagent: true });
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
            .trim();
          if (raw && !raw.includes('<SYSTEM_MESSAGE>')) {
            userPrompts.push(raw);
          }
        }
      }

      if (isSubagent) {
        parsedSessions.push({ id: entry.id, userPrompts: [], isSubagent: true });
      } else if (userPrompts.length > 0) {
        parentsFound++;
        parsedSessions.push({ id: entry.id, userPrompts, isSubagent: false });
      }
    } catch {
      // Ignore unreadable transcript files
    }
  }

  return analyzeSessionTranscripts(parsedSessions);
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    resolve(process.argv[1]).replace(/\\/g, '/').toLowerCase();

if (isMain) {
  if (process.argv.includes('--verify-and-sync')) {
    const res = verifyAndSyncGlobalPlugins();
    process.stdout.write(`${JSON.stringify({ ok: res.ok, repoRoot: res.repoRoot }, null, 2)}\n`);
    if (!res.ok) {
      for (const s of res.steps) {
        if (s.status !== 0) process.stderr.write(`[FAIL ${s.step}]\n${s.output}\n`);
      }
      process.exit(1);
    }
    process.exit(0);
  }
  const limitIdx = process.argv.indexOf('--limit');
  const limit = limitIdx !== -1 && process.argv[limitIdx + 1] ? Number(process.argv[limitIdx + 1]) : 40;
  const report = mineBrainDirectory(undefined, { limit });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

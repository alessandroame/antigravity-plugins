import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getAnalyticsDir(customAnalyticsDir) {
  if (customAnalyticsDir) {
    return path.resolve(customAnalyticsDir);
  }
  if (process.env.ANTIGRAVITY_ANALYTICS_DIR) {
    return path.resolve(process.env.ANTIGRAVITY_ANALYTICS_DIR);
  }
  return path.join(os.homedir(), '.gemini', 'antigravity', 'analytics');
}

/**
 * Verifies that `dir` is a canonical `antigravity-plugins` repository root and NEVER
 * a global configuration mirror (`~/.gemini/config`), preventing self-mirroring loops.
 * @param {string | null | undefined} dir
 * @returns {boolean}
 */
export function isCanonicalCatalogRepoRoot(dir) {
  if (!dir || typeof dir !== 'string') return false;
  const resolved = path.resolve(dir);
  const norm = resolved.replace(/\\/g, '/').toLowerCase();
  if (norm.includes('/.gemini/config')) return false;
  const pkgPath = path.join(resolved, 'package.json');
  const valPath = path.join(resolved, 'scripts', 'validate.mjs');
  const pluginsPath = path.join(resolved, 'plugins');
  if (!fs.existsSync(pkgPath) || !fs.existsSync(valPath) || !fs.existsSync(pluginsPath)) {
    return false;
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg?.name === 'antigravity-plugins';
  } catch {
    return false;
  }
}

/**
 * Resolves the canonical `antigravity-plugins` repository root even when invoked from
 * a copied script inside `~/.gemini/config/scripts/sync-to-global.mjs`.
 * @param {{ stateFile?: string, cwd?: string }} [options]
 * @returns {string}
 */
export function resolveDefaultRepoRoot(options = {}) {
  const fromScript = path.resolve(__dirname, '..');
  if (isCanonicalCatalogRepoRoot(fromScript)) {
    return fromScript;
  }
  if (
    process.env.ANTIGRAVITY_PLUGINS_ROOT &&
    isCanonicalCatalogRepoRoot(process.env.ANTIGRAVITY_PLUGINS_ROOT)
  ) {
    return path.resolve(process.env.ANTIGRAVITY_PLUGINS_ROOT);
  }
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  if (isCanonicalCatalogRepoRoot(cwd)) {
    return cwd;
  }
  const statePath =
    options.stateFile || path.join(getAnalyticsDir(), 'plugin-sync-state.json');
  if (fs.existsSync(statePath)) {
    try {
      const st = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      if (st?.repoRoot && isCanonicalCatalogRepoRoot(st.repoRoot)) {
        return path.resolve(st.repoRoot);
      }
    } catch {
      // Ignore unreadable sync state
    }
  }
  const candidates = [
    path.resolve(cwd, '..', 'antigravity-plugins'),
    path.join(os.homedir(), 'alessandroame', 'antigravity-plugins'),
    path.join(os.homedir(), '.gemini', 'antigravity-plugins'),
    'd:/Github/antigravity-plugins',
    'c:/github/antigravity-plugins',
    path.join(os.homedir(), 'github', 'antigravity-plugins'),
    path.join(os.homedir(), 'antigravity-plugins'),
    '/tmp/antigravity-plugins',
    '/workspaces/antigravity-plugins'
  ];
  for (const c of candidates) {
    if (isCanonicalCatalogRepoRoot(c)) {
      return path.resolve(c);
    }
  }
  return fromScript;
}

export const DEFAULT_REPO_ROOT = resolveDefaultRepoRoot();

/**
 * Reads the current Git HEAD SHA in < 1ms without spawning a child process.
 * @param {string} [repoRoot]
 * @returns {string}
 */
export function readGitHeadSha(repoRoot = DEFAULT_REPO_ROOT) {
  try {
    const headFile = path.join(repoRoot, '.git', 'HEAD');
    if (!fs.existsSync(headFile)) return 'no-git';
    const rawHead = fs.readFileSync(headFile, 'utf-8').trim();
    if (!rawHead.startsWith('ref:')) {
      return rawHead;
    }
    const refRel = rawHead.replace(/^ref:\s*/, '').trim();
    const refFile = path.join(repoRoot, '.git', refRel);
    if (fs.existsSync(refFile)) {
      return fs.readFileSync(refFile, 'utf-8').trim();
    }
    const packedRefs = path.join(repoRoot, '.git', 'packed-refs');
    if (fs.existsSync(packedRefs)) {
      const lines = fs.readFileSync(packedRefs, 'utf-8').split(/\r?\n/);
      for (const line of lines) {
        if (!line || line.startsWith('#') || line.startsWith('^')) continue;
        const [sha, ref] = line.trim().split(/\s+/);
        if (ref === refRel && sha) return sha;
      }
    }
    return rawHead;
  } catch {
    return 'unknown';
  }
}

/**
 * Computes a lightweight fingerprint of `plugins/` combining Git HEAD SHA, file count, and max mtimeMs.
 * @param {string} [repoRoot]
 * @returns {{ headSha: string, fileCount: number, maxMtimeMs: number, fingerprint: string }}
 */
export function computeCatalogFingerprint(repoRoot = DEFAULT_REPO_ROOT) {
  const pluginsDir = path.join(repoRoot, 'plugins');
  const headSha = readGitHeadSha(repoRoot);
  let fileCount = 0;
  let maxMtimeMs = 0;

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile()) {
        fileCount += 1;
        try {
          const st = fs.statSync(full);
          if (st.mtimeMs > maxMtimeMs) maxMtimeMs = Math.round(st.mtimeMs);
        } catch {
          // Ignore transient file access errors
        }
      }
    }
  }

  walk(pluginsDir);
  const fingerprint = `${headSha}:${fileCount}:${maxMtimeMs}`;
  return { headSha, fileCount, maxMtimeMs, fingerprint };
}

/**
 * Configures Git `core.hooksPath = .githooks` when both `.git` and `.githooks/` exist
 * so versioned `post-merge` and `post-checkout` hooks automatically keep plugins synced.
 * Never throws or fails in temporary test directories without `.git`.
 * @param {string} [repoRoot]
 * @returns {{ installed: boolean, alreadyConfigured: boolean, hooksPath: string | null, reason?: string }}
 */
export function installGitHooks(repoRoot = DEFAULT_REPO_ROOT) {
  try {
    const gitDir = path.join(repoRoot, '.git');
    const githooksDir = path.join(repoRoot, '.githooks');
    if (!fs.existsSync(gitDir) || !fs.existsSync(githooksDir)) {
      return {
        installed: false,
        alreadyConfigured: false,
        hooksPath: null,
        reason: 'missing-git-or-githooks'
      };
    }

    for (const hookName of ['post-merge', 'post-checkout']) {
      const hookFile = path.join(githooksDir, hookName);
      if (fs.existsSync(hookFile)) {
        try {
          fs.chmodSync(hookFile, 0o755);
        } catch {
          // Ignore chmod errors on non-POSIX mounts
        }
      }
    }

    const currentRes = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true
    });
    const currentPath = currentRes.status === 0 ? (currentRes.stdout || '').trim() : '';
    if (currentPath === '.githooks') {
      return { installed: true, alreadyConfigured: true, hooksPath: '.githooks' };
    }

    const setRes = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true
    });
    if (setRes.status === 0) {
      return { installed: true, alreadyConfigured: false, hooksPath: '.githooks' };
    }
    return {
      installed: false,
      alreadyConfigured: false,
      hooksPath: currentPath || null,
      reason: (setRes.stderr || setRes.stdout || 'git-config-failed').trim()
    };
  } catch (err) {
    return {
      installed: false,
      alreadyConfigured: false,
      hooksPath: null,
      reason: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Backward-compatible alias that ensures `.githooks` is configured as `core.hooksPath`.
 * @param {string} [repoRoot]
 * @returns {boolean}
 */
export function installGitPostMergeHook(repoRoot = DEFAULT_REPO_ROOT) {
  return installGitHooks(repoRoot).installed;
}

/**
 * Performs a safe fast-forward `git pull --ff-only` on `antigravity-plugins` before syncing,
 * skipping automatically when tracked files have uncommitted changes.
 * @param {string} [repoRoot]
 * @returns {{ attempted: boolean, ok: boolean, skippedDirty?: boolean, output: string }}
 */
export function pullCatalogFastForward(repoRoot = DEFAULT_REPO_ROOT) {
  try {
    const statusRes = spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true
    });
    if (statusRes.status === 0 && (statusRes.stdout || '').trim().length > 0) {
      return {
        attempted: false,
        ok: false,
        skippedDirty: true,
        output: 'Skipped fast-forward pull: dirty tracked working tree'
      };
    }

    const res = spawnSync('git', ['pull', '--ff-only', '--quiet'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 15000,
      windowsHide: true,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        ANTIGRAVITY_SKIP_GIT_HOOK: '1'
      }
    });
    return {
      attempted: true,
      ok: res.status === 0,
      output: ((res.stdout || '') + (res.stderr || '')).trim()
    };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      output: err instanceof Error ? err.message : String(err)
    };
  }
}

function walkSkillFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSkillFiles(full, results);
    else if (ent.isFile() && ent.name === 'SKILL.md') results.push(full);
  }
  return results;
}

function compactThirdPartyDescription(rawDesc, skillName) {
  const clean = rawDesc
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = clean.split(/(?<=\.)\s+/);
  const firstSentence = (sentences[0] || clean).replace(/:\s+/g, ' - ').replace(/,\s*which\b.*$/i, '.');
  const useSentence = sentences.find((s) => /\b(use|trigger|activate)\b/i.test(s));
  const defaultTrigger = `Use this skill when working with ${skillName} workflows.`;
  let triggerClause = useSentence
    ? useSentence.replace(/^use (it |this skill )?(whenever|when)/i, 'Use this skill when').replace(/:\s+/g, ' - ')
    : defaultTrigger;
  if (!/\buse this skill (when|to)\b/i.test(triggerClause)) {
    triggerClause = defaultTrigger;
  }
  const maxFirstLen = Math.max(80, 242 - triggerClause.length - 1);
  let lead = firstSentence;
  if (lead.length > maxFirstLen) {
    lead = lead.slice(0, maxFirstLen - 1).replace(/[,;:\s]+\S*$/, '') + '.';
  }
  let candidate = `${lead.replace(/\.?$/, '.')} ${triggerClause}`.replace(/\s+/g, ' ').trim();
  if (candidate.length > 245) {
    const fallbackLead = firstSentence.slice(0, 240 - defaultTrigger.length).replace(/[,;:\s]+\S*$/, '') + '.';
    candidate = `${fallbackLead} ${defaultTrigger}`;
  }
  return candidate;
}

export function loadSyncState(stateFile) {
  if (!fs.existsSync(stateFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch {
    return null;
  }
}

export function saveSyncState(stateFile, stateObj) {
  try {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(stateObj, null, 2) + '\n', 'utf-8');
  } catch {
    // Non-blocking state persistence
  }
}

/**
 * Synchronizes a directory tree in-place without calling chmod/chown (portable across Windows, POSIX, and FUSE/virtiofs).
 * Writes only modified files and removes stale target entries no longer present in `src`.
 * @param {string} src
 * @param {string} dest
 */
function syncDirectoryContents(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const srcEntries = fs.readdirSync(src);
    const srcSet = new Set(srcEntries);
    for (const existing of fs.readdirSync(dest)) {
      if (!srcSet.has(existing)) {
        try {
          fs.rmSync(path.join(dest, existing), { recursive: true, force: true });
        } catch {
          // Ignore locked handle on Windows
        }
      }
    }
    for (const ent of srcEntries) {
      syncDirectoryContents(path.join(src, ent), path.join(dest, ent));
    }
  } else if (st.isFile()) {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    if (fs.existsSync(dest)) {
      try {
        const destSt = fs.statSync(dest);
        if (destSt.size === st.size && destSt.mtimeMs >= st.mtimeMs - 50) {
          return;
        }
        const buf = fs.readFileSync(src);
        const existing = fs.readFileSync(dest);
        if (Buffer.compare(buf, existing) === 0) return;
        fs.writeFileSync(dest, buf);
        return;
      } catch {
        // Overwrite if unreadable
      }
    }
    const buf = fs.readFileSync(src);
    fs.writeFileSync(dest, buf);
  }
}

/**
 * Builds the persistent `~/.gemini/CLOUD_BOOTSTRAP.md` index for Antigravity Cloud VMs (`jetski`).
 * @param {Array<{ name: string, version: string, hasRules: boolean, skills: string[], scripts: string[] }>} catalogItems
 * @returns {string}
 */
export function buildCloudBootstrapContent(catalogItems = []) {
  const rows = catalogItems.map((item) => {
    const ruleCell = item.hasRules ? `\`~/.gemini/config/plugins/${item.name}/rules/AGENTS.md\`` : '—';
    const skillsCell = item.skills.length > 0 ? item.skills.map((s) => `\`/${s}\``).join(', ') : '—';
    const scriptsCell = item.scripts.length > 0 ? item.scripts.map((s) => `\`${s}\``).join(', ') : '—';
    return `| \`${item.name}\` (\`v${item.version}\`) | ${ruleCell} | ${skillsCell} | ${scriptsCell} |`;
  });

  return [
    '# Antigravity Cloud Cross-Project Bootstrap (`~/.gemini/GEMINI.md` & `~/.gemini/CLOUD_BOOTSTRAP.md`)',
    '',
    'Auto-generated by `scripts/sync-to-global.mjs` for `/shared/user/.gemini` Cloud sessions (`jetski`).',
    '',
    '## 1. Turn-1 Active Standards (Always-On)',
    '1. **Language & Sobriety (`engineering-sobriety`)**: Reply in plain Italian, opening directly with facts (`0` preambles, `0` decorative emojis). Above 8 lines, use Semantic Drill-Down (`L0` self-contained without unexplained acronyms -> `2..4` closed `L1` `<details>` with blank line after `</summary>` -> `L2` `<details>` for code/tables).',
    '2. **Pre-Turn Triage, Routing & Prompt Review (`skizzo` + `adaptive-router` + `proactive-mentorship`)**:',
    '   - **Zero Extra Round-Trip on `LOW` Turns**: On short confirmations or closings (`"si"`, `"ok"`, `"procedi"`, `"commit e push"`, `"chiudi lavorazione"`, `/memory-sync`, `/next-step`, `/take-note`), execute directly.',
    '   - On substantive requests, run `node ~/.gemini/config/plugins/skizzo/scripts/triage.mjs --prompt "<prompt>" && node ~/.gemini/config/plugins/adaptive-router/scripts/model-router.mjs --prompt "<prompt>"` in one call. If `promptReview.needsReview === true`, present `promptReview.improvedPromptDraftIt` via `ask_question` BEFORE editing. Surface pending `mapek` / `pattern-harvester` advisories and apply `L1..L3` self-learning on user corrections.',
    '3. **Verification & Telemetry (`execution-guard` + `engineering-workflow` + `telemetry-analytics`)**: Run tests and `diff-triage.mjs` after the last edit; emit `【🟢/🟡/🔴 ETA tot ~Ns】` in `toolSummary` when remaining work `>= 15s`; end every reply with `> Prompt #<N>: <in> in / <out> out · Contesto: <ctxPct>% (<ctx>) · Sessione: <sessPct>% (<totSessione>)`. Read `~/.gemini/skills/<skill>/SKILL.md` directly via `view_file`/`read_file` on Cloud FUSE.',
    '',
    '## 2. Conversational Triggers & Domain Contracts (Always-On Parity with Local IDE)',
    '- **Cognitive Persistence (`cognitive-persistence`)**: `"cosa facciamo adesso?"` / `/next-step` -> read `DESIDERATA.md` + `WORKLOG.md` + `MEMORY.md` + `gh-board-sync.mjs`; `"chiudi lavorazione"` / `"commit e push"` / `/memory-sync` -> update 3+1 files within byte ceilings, sync board, `set-chat-title.mjs`, commit/push; `"prendi nota"` / `/take-note` -> append ONLY to `NOTES.md`; `/review-notes` -> read-only code review + `ask_question`.',
    '- **Multi-Agent (`skizzo`)**: `AUTO` (`silentFastPass: true` on `score < 4`); on `score >= 4` or `/skizzo`, spawn `2..4` ranked subagents (`rankAndCapDomains`) + 4-column `<details>` matrix.',
    '- **UX & UI Gates (`engineering-workflow` + `laws-of-ux`)**: Red-Green-Refactor TDD, zero live external API calls in tests, and Gate 4 `ui-geometry-probe.js` (`360x800` & `1280x800`) with the **4-Measure Receipt**.',
    '- **On-Demand Skills (`code-inspector`, `ab-bench`)**: Load `/how-its-made` (`~/.gemini/skills/how-its-made/SKILL.md`) or `/ab-bench` (`~/.gemini/skills/ab-bench/SKILL.md`) when triggered.',
    '- **Governance (`mapek` + `pattern-harvester` + `skill-governance`)**: Write `L2a/L2b/L2c` in Hybrid `EN/IT`, run `session-miner.mjs --verify-and-sync`, and require `--confirm-user-approval` for `mapek`.',
    '',
    '## 3. Synchronized Global Plugin Catalog (`~/.gemini/config/plugins/`)',
    '',
    '| Plugin | Rule Path (`view_file`) | Skills (`~/.gemini/skills/<name>/SKILL.md`) | CLI Scripts (`scripts/`) |',
    '| :--- | :--- | :--- | :--- |',
    ...rows,
    ''
  ].join('\n');
}

/**
 * Synchronizes physical plugins from `antigravity-plugins` to `~/.gemini/config/plugins/`,
 * copies all plugin skills to `~/.gemini/skills/`, updates `~/.gemini/config/config.json`,
 * and writes both `~/.gemini/GEMINI.md` (injected into `<RULE[user_global]>` by Cloud `jetski`)
 * and `~/.gemini/CLOUD_BOOTSTRAP.md`, while removing any duplicate `~/.gemini/AGENTS.md`.
 * @param {{
 *   repoRoot?: string,
 *   globalPluginsDir?: string,
 *   globalSkillsDir?: string,
 *   globalConfigFile?: string,
 *   cloudBootstrapFile?: string,
 *   globalGeminiFile?: string,
 *   duplicateGlobalAgentsFile?: string,
 *   stateFile?: string,
 *   autoPull?: boolean,
 *   ifNeeded?: boolean,
 *   quiet?: boolean
 * }} [options]
 */
export function syncPluginsToGlobal(options = {}) {
  const analyticsDir = getAnalyticsDir();
  const stateFile = options.stateFile || path.join(analyticsDir, 'plugin-sync-state.json');
  const repoRoot = options.repoRoot
    ? path.resolve(options.repoRoot)
    : resolveDefaultRepoRoot({ stateFile });
  const normRepoRoot = repoRoot.replace(/\\/g, '/').toLowerCase();
  if (
    normRepoRoot.includes('/.gemini/config') ||
    (!options.repoRoot && !isCanonicalCatalogRepoRoot(repoRoot))
  ) {
    return {
      synced: false,
      skipped: true,
      reason: 'invalid-non-canonical-repo-root',
      syncedCount: 0,
      syncedSkillsCount: 0,
      compactedSkillsCount: 0,
      prunedDisabledSkillsCount: 0,
      fingerprint: 'invalid',
      headSha: 'no-git',
      pullResult: { attempted: false, ok: false, output: '' }
    };
  }
  const pluginsDir = path.join(repoRoot, 'plugins');
  const globalPluginsDir =
    options.globalPluginsDir || path.join(os.homedir(), '.gemini', 'config', 'plugins');
  const globalSkillsDir =
    options.globalSkillsDir || path.join(os.homedir(), '.gemini', 'skills');
  const globalConfigFile =
    options.globalConfigFile || path.join(os.homedir(), '.gemini', 'config', 'config.json');
  const cloudBootstrapFile =
    options.cloudBootstrapFile || path.join(os.homedir(), '.gemini', 'CLOUD_BOOTSTRAP.md');
  const bootstrapDir = path.dirname(cloudBootstrapFile);
  const globalGeminiFile =
    options.globalGeminiFile || path.join(bootstrapDir, 'GEMINI.md');
  const duplicateGlobalAgentsFile =
    options.duplicateGlobalAgentsFile || path.join(bootstrapDir, 'AGENTS.md');
  const globalScriptsDir = path.join(path.dirname(globalPluginsDir), 'scripts');
  const quiet = Boolean(options.quiet);
  const log = (...args) => {
    if (!quiet) console.log(...args);
  };

  const nowMs = Date.now();
  const prevState = loadSyncState(stateFile) || {};
  let pullResult = { attempted: false, ok: true, output: '' };

  if (options.autoPull) {
    pullResult = pullCatalogFastForward(repoRoot);
  }

  const catalogMeta = computeCatalogFingerprint(repoRoot);
  if (
    options.ifNeeded &&
    prevState.lastSyncedFingerprint === catalogMeta.fingerprint &&
    fs.existsSync(globalPluginsDir) &&
    fs.existsSync(cloudBootstrapFile) &&
    fs.existsSync(globalGeminiFile) &&
    !fs.existsSync(duplicateGlobalAgentsFile)
  ) {
    saveSyncState(stateFile, {
      ...prevState,
      lastCheckAtMs: nowMs,
      headSha: catalogMeta.headSha,
      syncedHeadSha: catalogMeta.headSha,
      repoRoot,
      lastPullOk: pullResult.ok
    });
    log(`   [SKIP] Global plugins already up-to-date (${catalogMeta.fingerprint})`);
    return {
      synced: false,
      skipped: true,
      syncedCount: 0,
      syncedSkillsCount: 0,
      compactedSkillsCount: 0,
      fingerprint: catalogMeta.fingerprint,
      headSha: catalogMeta.headSha,
      pullResult
    };
  }

  log('Synchronizing physical plugins to global Antigravity directory:');
  log(`   Source:      ${pluginsDir}`);
  log(`   Destination: ${globalPluginsDir}\n`);

  if (!fs.existsSync(globalPluginsDir)) {
    fs.mkdirSync(globalPluginsDir, { recursive: true });
  }
  if (!fs.existsSync(globalSkillsDir)) {
    fs.mkdirSync(globalSkillsDir, { recursive: true });
  }

  const pluginEntries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const syncedPluginNames = [];
  const disabledPluginNames = new Set();
  const bootstrapCatalogItems = [];
  let syncedSkillsCount = 0;

  for (const entry of pluginEntries) {
    if (!entry.isDirectory()) continue;
    const pluginName = entry.name;
    const src = path.join(pluginsDir, pluginName);
    const dest = path.join(globalPluginsDir, pluginName);
    const manifestFile = path.join(src, 'plugin.json');

    if (!fs.existsSync(manifestFile)) {
      continue;
    }

    let version = '1.0.0';
    try {
      const manifestData = JSON.parse(fs.readFileSync(manifestFile, 'utf-8').replace(/^\uFEFF/, ''));
      if (manifestData && typeof manifestData.version === 'string') {
        version = manifestData.version;
      }
      if (manifestData && manifestData.disabled === true) {
        disabledPluginNames.add(pluginName);
      }
    } catch {
      // Ignore malformed manifest during flag check
    }

    // Remove legacy symlink/junction before syncing physical files
    if (fs.existsSync(dest)) {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(dest);
      }
    }

    try {
      syncDirectoryContents(src, dest);
      log(`   [OK] Physically synchronized: ${pluginName}`);
    } catch (syncErr) {
      log(`   [WARN] Skipped read-only global mount for ${pluginName} (${syncErr.code || syncErr.message})`);
    }
    syncedPluginNames.push(pluginName);

    // Sync enabled plugin skills to ~/.gemini/skills/<skill-name> for Cloud VM persistence
    const pluginSkillsDir = path.join(src, 'skills');
    const skillNames = [];
    if (fs.existsSync(pluginSkillsDir)) {
      for (const sEntry of fs.readdirSync(pluginSkillsDir, { withFileTypes: true })) {
        if (!sEntry.isDirectory()) continue;
        const sSrc = path.join(pluginSkillsDir, sEntry.name);
        if (!fs.existsSync(path.join(sSrc, 'SKILL.md'))) continue;
        skillNames.push(sEntry.name);
        if (disabledPluginNames.has(pluginName)) continue;
        const sDest = path.join(globalSkillsDir, sEntry.name);
        try {
          syncDirectoryContents(sSrc, sDest);
          syncedSkillsCount++;
        } catch {
          // Ignore read-only skill target errors
        }
      }
    }

    const pluginScriptsDir = path.join(src, 'scripts');
    const scriptNames = [];
    if (fs.existsSync(pluginScriptsDir)) {
      for (const scEntry of fs.readdirSync(pluginScriptsDir, { withFileTypes: true })) {
        if (scEntry.isFile() && /\.(mjs|js)$/.test(scEntry.name)) {
          scriptNames.push(scEntry.name);
        }
      }
    }

    // Sync enabled plugin L2c subagents to ~/.gemini/agents/<agent>.md for Cloud/Local discovery
    const pluginAgentsDir = path.join(src, 'agents');
    if (!disabledPluginNames.has(pluginName) && fs.existsSync(pluginAgentsDir)) {
      const globalAgentsDir = options.globalAgentsDir || path.join(os.homedir(), '.gemini', 'agents');
      try {
        fs.mkdirSync(globalAgentsDir, { recursive: true });
        for (const agEntry of fs.readdirSync(pluginAgentsDir, { withFileTypes: true })) {
          if (!agEntry.isFile() || !agEntry.name.endsWith('.md')) continue;
          syncDirectoryContents(path.join(pluginAgentsDir, agEntry.name), path.join(globalAgentsDir, agEntry.name));
        }
      } catch {
        // Ignore read-only agent target errors
      }
    }

    bootstrapCatalogItems.push({
      name: pluginName,
      version,
      hasRules: fs.existsSync(path.join(src, 'rules', 'AGENTS.md')),
      skills: skillNames.sort(),
      scripts: scriptNames.sort()
    });
  }

  try {
    let parsedConfig = { plugins: {} };
    let configUpdated = !fs.existsSync(globalConfigFile);
    if (!configUpdated) {
      const rawConfig = fs.readFileSync(globalConfigFile, 'utf-8').replace(/^\uFEFF/, '');
      parsedConfig = JSON.parse(rawConfig);
      if (!parsedConfig.plugins || typeof parsedConfig.plugins !== 'object') {
        parsedConfig.plugins = {};
        configUpdated = true;
      }
    }
    for (const name of syncedPluginNames) {
      const shouldEnable = !disabledPluginNames.has(name);
      if (!parsedConfig.plugins[name]) {
        parsedConfig.plugins[name] = { enabled: shouldEnable };
        configUpdated = true;
        log(`   [OK] Registered in config.json: ${name} (enabled: ${shouldEnable})`);
      } else if (!shouldEnable && parsedConfig.plugins[name].enabled !== false) {
        parsedConfig.plugins[name].enabled = false;
        configUpdated = true;
        log(`   [OK] Disabled plugin in config.json: ${name} (disabled: true in plugin.json)`);
      }
    }
    const dormantHeavyPlugins = ['science', 'data-agent-kit-plugin', 'flutter', 'firebase', 'google_maps_platform'];
    for (const heavyName of dormantHeavyPlugins) {
      if (parsedConfig.plugins[heavyName] && parsedConfig.plugins[heavyName].enabled !== false) {
        parsedConfig.plugins[heavyName].enabled = false;
        configUpdated = true;
        log('   [OK] Disabled dormant high-token plugin in config.json: ' + heavyName);
      }
    }
    if (configUpdated) {
      fs.mkdirSync(path.dirname(globalConfigFile), { recursive: true });
      fs.writeFileSync(globalConfigFile, JSON.stringify(parsedConfig, null, 2) + '\n', 'utf-8');
    }
  } catch (err) {
    if (!quiet) {
      console.warn(`   [WARN] Could not update ${globalConfigFile}: ${err.message}`);
    }
  }

  const enabledCanonicalSkillNames = new Set();
  for (const item of bootstrapCatalogItems) {
    if (!disabledPluginNames.has(item.name)) {
      for (const s of item.skills) enabledCanonicalSkillNames.add(s);
    }
  }

  let prunedDisabledSkillsCount = 0;
  try {
    let cfgPlugins = {};
    if (fs.existsSync(globalConfigFile)) {
      const parsed = JSON.parse(fs.readFileSync(globalConfigFile, 'utf-8').replace(/^\uFEFF/, ''));
      cfgPlugins = parsed?.plugins || {};
    }
    const dormantHeavySet = new Set(['science', 'data-agent-kit-plugin', 'flutter', 'firebase', 'google_maps_platform']);
    for (const pEntry of fs.readdirSync(globalPluginsDir, { withFileTypes: true })) {
      if (!pEntry.isDirectory()) continue;
      const isDisabled =
        disabledPluginNames.has(pEntry.name) ||
        dormantHeavySet.has(pEntry.name) ||
        cfgPlugins[pEntry.name]?.enabled === false;
      if (!isDisabled) continue;
      const pSkillsDir = path.join(globalPluginsDir, pEntry.name, 'skills');
      if (!fs.existsSync(pSkillsDir)) continue;
      for (const sEntry of fs.readdirSync(pSkillsDir, { withFileTypes: true })) {
        if (!sEntry.isDirectory() || enabledCanonicalSkillNames.has(sEntry.name)) continue;
        const targetSkillDir = path.join(globalSkillsDir, sEntry.name);
        if (fs.existsSync(targetSkillDir)) {
          fs.rmSync(targetSkillDir, { recursive: true, force: true });
          prunedDisabledSkillsCount++;
        }
      }
    }
    if (prunedDisabledSkillsCount > 0) {
      log(`   [OK] Pruned ${prunedDisabledSkillsCount} leaked skills from disabled plugins in ${globalSkillsDir}`);
    }
  } catch {
    // Ignore transient global skills cleanup errors
  }

  try {
    const repoScriptsDir = path.join(repoRoot, 'scripts');
    if (fs.existsSync(repoScriptsDir)) {
      syncDirectoryContents(repoScriptsDir, globalScriptsDir);
    }
  } catch {
    // Non-blocking script sync
  }

  try {
    bootstrapCatalogItems.sort((a, b) => a.name.localeCompare(b.name));
    const bootstrapContent = buildCloudBootstrapContent(bootstrapCatalogItems);
    fs.mkdirSync(path.dirname(cloudBootstrapFile), { recursive: true });
    for (const targetFile of [cloudBootstrapFile, globalGeminiFile]) {
      if (!targetFile) continue;
      let shouldWrite = true;
      if (fs.existsSync(targetFile)) {
        const existing = fs.readFileSync(targetFile, 'utf-8');
        if (existing === bootstrapContent) shouldWrite = false;
      }
      if (shouldWrite) {
        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
        fs.writeFileSync(targetFile, bootstrapContent, 'utf-8');
        log(`   [OK] Updated Cloud bootstrap index: ${targetFile}`);
      }
    }
    if (duplicateGlobalAgentsFile && fs.existsSync(duplicateGlobalAgentsFile)) {
      const existingAgents = fs.readFileSync(duplicateGlobalAgentsFile, 'utf-8');
      if (existingAgents.includes('Antigravity Cloud Cross-Project Bootstrap')) {
        fs.rmSync(duplicateGlobalAgentsFile, { force: true });
        log(`   [OK] Removed duplicate global rule file: ${duplicateGlobalAgentsFile}`);
      }
    }
  } catch (err) {
    if (!quiet) {
      console.warn(`   [WARN] Could not write ${cloudBootstrapFile}: ${err.message}`);
    }
  }

  const canonicalSet = new Set(syncedPluginNames);
  let compactedSkillsCount = 0;
  for (const entry of fs.readdirSync(globalPluginsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || canonicalSet.has(entry.name)) continue;
    const skillFiles = walkSkillFiles(path.join(globalPluginsDir, entry.name));
    for (const skillFile of skillFiles) {
      const content = fs.readFileSync(skillFile, 'utf-8');
      const fmMatch = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
      if (!fmMatch) continue;
      const fmBody = fmMatch[2];
      const lines = fmBody.split(/\r?\n/);
      let skillName = path.basename(path.dirname(skillFile));
      let descStartIdx = -1;
      let descEndIdx = -1;
      let descText = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('name:')) {
          skillName = line.slice(5).trim().replace(/^['"]|['"]$/g, '');
        } else if (line.startsWith('description:')) {
          descStartIdx = i;
          const rest = line.slice(12).trim();
          if (rest === '>' || rest === '>-' || rest === '|') {
            const block = [];
            let j = i + 1;
            while (j < lines.length && (/^\s+/.test(lines[j]) || lines[j].trim() === '')) {
              if (lines[j].trim() !== '') block.push(lines[j].trim());
              j++;
            }
            descEndIdx = j - 1;
            descText = block.join(' ');
          } else {
            descEndIdx = i;
            descText = rest.replace(/^['"]|['"]$/g, '');
          }
          break;
        }
      }

      if (descStartIdx !== -1 && descText.length > 250) {
        const compacted = compactThirdPartyDescription(descText, skillName);
        const updatedLines = [
          ...lines.slice(0, descStartIdx),
          `description: ${compacted}`,
          ...lines.slice(descEndIdx + 1)
        ];
        const updatedContent =
          fmMatch[1] + updatedLines.join('\n') + fmMatch[3] + content.slice(fmMatch[0].length);
        try {
          fs.writeFileSync(skillFile, updatedContent, 'utf-8');
          compactedSkillsCount++;
          log(
            `   [OK] Compacted third-party skill description (${descText.length} -> ${compacted.length} chars): ${entry.name}/${skillName}`
          );
        } catch {
          // Ignore EPERM on read-only third-party global mounts
        }
      }
    }
  }

  const hooksResult = installGitHooks(repoRoot);
  if (hooksResult.installed) {
    log('   [OK] Verified Git hooks path (core.hooksPath = .githooks: post-merge, post-checkout)');
  }

  const latestState = loadSyncState(stateFile) || prevState;
  saveSyncState(stateFile, {
    ...latestState,
    lastSyncedAtMs: nowMs,
    lastCheckAtMs: nowMs,
    lastSyncedFingerprint: catalogMeta.fingerprint,
    headSha: catalogMeta.headSha,
    syncedHeadSha: catalogMeta.headSha,
    syncedPluginCount: syncedPluginNames.length,
    syncedSkillsCount,
    repoRoot,
    lastPullOk: pullResult.ok
  });

  log(
    `\nCompleted: ${syncedPluginNames.length} plugins synchronized in ${globalPluginsDir}, ${syncedSkillsCount} skills in ${globalSkillsDir} (${compactedSkillsCount} third-party skill descriptions compacted)`
  );

  return {
    synced: true,
    skipped: false,
    syncedCount: syncedPluginNames.length,
    syncedSkillsCount,
    compactedSkillsCount,
    prunedDisabledSkillsCount,
    fingerprint: catalogMeta.fingerprint,
    headSha: catalogMeta.headSha,
    pullResult
  };
}

const isMain = (() => {
  if (!process.argv[1]) return false;
  try {
    const a = fs.realpathSync(fileURLToPath(import.meta.url)).replace(/\\/g, '/').toLowerCase();
    const b = fs.realpathSync(path.resolve(process.argv[1])).replace(/\\/g, '/').toLowerCase();
    return a === b;
  } catch {
    return (
      fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
      path.resolve(process.argv[1]).replace(/\\/g, '/').toLowerCase()
    );
  }
})();

if (isMain) {
  const autoPull = process.argv.includes('--auto-pull');
  const ifNeeded = process.argv.includes('--if-needed');
  const quiet = process.argv.includes('--quiet');
  syncPluginsToGlobal({ autoPull, ifNeeded, quiet });
}

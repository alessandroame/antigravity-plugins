import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

function getAnalyticsDir() {
  if (process.env.ANTIGRAVITY_ANALYTICS_DIR) {
    return path.resolve(process.env.ANTIGRAVITY_ANALYTICS_DIR);
  }
  return path.join(os.homedir(), '.gemini', 'antigravity', 'analytics');
}

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
 * Installs an idempotent `.git/hooks/post-merge` hook so any manual or IDE `git pull`
 * inside `antigravity-plugins` automatically synchronizes `~/.gemini/config/plugins/`.
 * @param {string} [repoRoot]
 * @returns {boolean}
 */
export function installGitPostMergeHook(repoRoot = DEFAULT_REPO_ROOT) {
  try {
    const hooksDir = path.join(repoRoot, '.git', 'hooks');
    if (!fs.existsSync(hooksDir)) return false;
    const hookPath = path.join(hooksDir, 'post-merge');
    const marker = '# antigravity-plugins-auto-sync';
    const hookContent = [
      '#!/bin/sh',
      marker,
      'node "./scripts/sync-to-global.mjs" --if-needed --quiet >/dev/null 2>&1 || true',
      ''
    ].join('\n');

    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, 'utf-8');
      if (existing.includes(marker)) return true;
      return false;
    }

    fs.writeFileSync(hookPath, hookContent, { encoding: 'utf-8', mode: 0o755 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Performs a safe fast-forward `git pull --ff-only` on `antigravity-plugins` before syncing.
 * @param {string} [repoRoot]
 * @returns {{ attempted: boolean, ok: boolean, output: string }}
 */
export function pullCatalogFastForward(repoRoot = DEFAULT_REPO_ROOT) {
  try {
    const res = spawnSync('git', ['pull', '--ff-only', '--quiet'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 15000,
      windowsHide: true
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
    const buf = fs.readFileSync(src);
    if (fs.existsSync(dest)) {
      try {
        const existing = fs.readFileSync(dest);
        if (Buffer.compare(buf, existing) === 0) return;
      } catch {
        // Overwrite if unreadable
      }
    }
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
    '# Antigravity Cloud Cross-Project Bootstrap (`~/.gemini/CLOUD_BOOTSTRAP.md`)',
    '',
    'Auto-generated by `scripts/sync-to-global.mjs`. This file resides on the persistent `/shared/user/.gemini` volume shared across all sessions of all Cloud projects.',
    '',
    '## 1. Turn-1 Active Standards (Always-On)',
    '1. **Language & Sobriety (`engineering-sobriety`)**: Always reply in plain Italian, opening directly with facts/diagnosis (`0` sycophantic preambles, `0` decorative emojis in headings).',
    '2. **Semantic Drill-Down (`L0 -> L1 -> L2`)**: Above 8 lines, emit a self-contained `L0` summary (`0-Click`, no unexplained acronyms), `2..4` closed `<details>` `L1` drawers (`<summary><strong>N. Tema — Conclusione in 1 frase</strong></summary>` followed by a mandatory blank line), and nested `<details>` `L2` drawers for code, logs, or tables (`>= 4` cols or `> 4` rows).',
    '3. **Pre-Turn Triage & Model Routing (`skizzo` + `adaptive-router`)**:',
    '   - Run `node ~/.gemini/config/plugins/skizzo/scripts/triage.mjs --prompt "<prompt>"` (`FAST-PASS` vs `2..4` ranked subagents).',
    '   - Run `node ~/.gemini/config/plugins/adaptive-router/scripts/model-router.mjs --prompt "<prompt>"` (`LOW/MEDIUM/HIGH` effort & subagent model tier).',
    '4. **Verification & Delivery Gate (`execution-guard` + `engineering-workflow`)**: Run tests and `node ~/.gemini/config/plugins/engineering-workflow/scripts/diff-triage.mjs` after the last code edit before ending the turn.',
    '5. **Telemetry Badge & Token Footer (`telemetry-analytics`)**: Emit `【🟢/🟡/🔴 ETA tot ~Ns】` in `toolSummary` on the first visible operational tool when remaining work `>= 15s`, and end every reply with `> Prompt #<N>: <in> in / <out> out · Sessione: <totSessione>`.',
    '6. **Cloud FUSE Skill Resolution (Zero-Timeout)**: Do NOT call `list_skills` or `lookup_skill` if FUSE latency causes timeouts; read `~/.gemini/skills/<skill>/SKILL.md` or `~/.gemini/config/plugins/<plugin>/rules/AGENTS.md` directly via `view_file`.',
    '',
    '## 2. Synchronized Global Plugin Catalog (`~/.gemini/config/plugins/`)',
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
 * and writes `~/.gemini/CLOUD_BOOTSTRAP.md`.
 * @param {{
 *   repoRoot?: string,
 *   globalPluginsDir?: string,
 *   globalSkillsDir?: string,
 *   globalConfigFile?: string,
 *   cloudBootstrapFile?: string,
 *   stateFile?: string,
 *   autoPull?: boolean,
 *   ifNeeded?: boolean,
 *   quiet?: boolean
 * }} [options]
 */
export function syncPluginsToGlobal(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const pluginsDir = path.join(repoRoot, 'plugins');
  const globalPluginsDir =
    options.globalPluginsDir || path.join(os.homedir(), '.gemini', 'config', 'plugins');
  const globalSkillsDir =
    options.globalSkillsDir || path.join(os.homedir(), '.gemini', 'skills');
  const globalConfigFile =
    options.globalConfigFile || path.join(os.homedir(), '.gemini', 'config', 'config.json');
  const cloudBootstrapFile =
    options.cloudBootstrapFile || path.join(os.homedir(), '.gemini', 'CLOUD_BOOTSTRAP.md');
  const analyticsDir = getAnalyticsDir();
  const stateFile = options.stateFile || path.join(analyticsDir, 'plugin-sync-state.json');
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
    fs.existsSync(cloudBootstrapFile)
  ) {
    saveSyncState(stateFile, {
      ...prevState,
      lastCheckAtMs: nowMs,
      headSha: catalogMeta.headSha,
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

    // Sync plugin skills to ~/.gemini/skills/<skill-name> for Cloud VM persistence
    const pluginSkillsDir = path.join(src, 'skills');
    const skillNames = [];
    if (fs.existsSync(pluginSkillsDir)) {
      for (const sEntry of fs.readdirSync(pluginSkillsDir, { withFileTypes: true })) {
        if (!sEntry.isDirectory()) continue;
        const sSrc = path.join(pluginSkillsDir, sEntry.name);
        if (!fs.existsSync(path.join(sSrc, 'SKILL.md'))) continue;
        skillNames.push(sEntry.name);
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

  try {
    bootstrapCatalogItems.sort((a, b) => a.name.localeCompare(b.name));
    const bootstrapContent = buildCloudBootstrapContent(bootstrapCatalogItems);
    fs.mkdirSync(path.dirname(cloudBootstrapFile), { recursive: true });
    let shouldWriteBootstrap = true;
    if (fs.existsSync(cloudBootstrapFile)) {
      const existing = fs.readFileSync(cloudBootstrapFile, 'utf-8');
      if (existing === bootstrapContent) shouldWriteBootstrap = false;
    }
    if (shouldWriteBootstrap) {
      fs.writeFileSync(cloudBootstrapFile, bootstrapContent, 'utf-8');
      log(`   [OK] Updated Cloud bootstrap index: ${cloudBootstrapFile}`);
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

  const hookInstalled = installGitPostMergeHook(repoRoot);
  if (hookInstalled) {
    log('   [OK] Verified Git post-merge auto-sync hook (.git/hooks/post-merge)');
  }

  saveSyncState(stateFile, {
    lastSyncedAtMs: nowMs,
    lastCheckAtMs: nowMs,
    lastSyncedFingerprint: catalogMeta.fingerprint,
    headSha: catalogMeta.headSha,
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
    fingerprint: catalogMeta.fingerprint,
    headSha: catalogMeta.headSha,
    pullResult
  };
}

const isMain =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    path.resolve(process.argv[1]).replace(/\\/g, '/').toLowerCase();

if (isMain) {
  const autoPull = process.argv.includes('--auto-pull');
  const ifNeeded = process.argv.includes('--if-needed');
  const quiet = process.argv.includes('--quiet');
  syncPluginsToGlobal({ autoPull, ifNeeded, quiet });
}

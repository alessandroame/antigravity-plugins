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
 * Synchronizes physical plugins from `antigravity-plugins` to `~/.gemini/config/plugins/`.
 * @param {{
 *   repoRoot?: string,
 *   globalPluginsDir?: string,
 *   globalConfigFile?: string,
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
  const globalConfigFile =
    options.globalConfigFile || path.join(os.homedir(), '.gemini', 'config', 'config.json');
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
    fs.existsSync(globalPluginsDir)
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

  const pluginEntries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const syncedPluginNames = [];

  for (const entry of pluginEntries) {
    if (!entry.isDirectory()) continue;
    const pluginName = entry.name;
    const src = path.join(pluginsDir, pluginName);
    const dest = path.join(globalPluginsDir, pluginName);

    if (!fs.existsSync(path.join(src, 'plugin.json'))) {
      continue;
    }

    // Remove existing symlink/junction or directory before copying (with EBUSY fallback for active OS watchers)
    if (fs.existsSync(dest)) {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(dest);
      } else {
        try {
          fs.rmSync(dest, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        } catch {
          // Directory handle held by active IDE watcher on Windows: overwrite files in-place via cpSync
        }
      }
    }

    // Perform recursive physical directory copy (force: true overwrites existing files in-place)
    fs.cpSync(src, dest, { recursive: true, force: true });
    log(`   [OK] Physically synchronized: ${pluginName}`);
    syncedPluginNames.push(pluginName);
  }

  if (fs.existsSync(globalConfigFile)) {
    try {
      const rawConfig = fs.readFileSync(globalConfigFile, 'utf-8').replace(/^\uFEFF/, '');
      const parsedConfig = JSON.parse(rawConfig);
      if (!parsedConfig.plugins || typeof parsedConfig.plugins !== 'object') {
        parsedConfig.plugins = {};
      }
      let configUpdated = false;
      for (const name of syncedPluginNames) {
        if (!parsedConfig.plugins[name]) {
          parsedConfig.plugins[name] = { enabled: true };
          configUpdated = true;
          log(`   [OK] Registered in config.json: ${name} (enabled: true)`);
        }
      }
      if (configUpdated) {
        fs.writeFileSync(globalConfigFile, JSON.stringify(parsedConfig, null, 2) + '\n', 'utf-8');
      }
    } catch (err) {
      if (!quiet) {
        console.warn(`   [WARN] Could not update ${globalConfigFile}: ${err.message}`);
      }
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
        fs.writeFileSync(skillFile, updatedContent, 'utf-8');
        compactedSkillsCount++;
        log(
          `   [OK] Compacted third-party skill description (${descText.length} -> ${compacted.length} chars): ${entry.name}/${skillName}`
        );
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
    repoRoot,
    lastPullOk: pullResult.ok
  });

  log(
    `\nCompleted: ${syncedPluginNames.length} plugins synchronized in ${globalPluginsDir} (${compactedSkillsCount} third-party skill descriptions compacted)`
  );

  return {
    synced: true,
    skipped: false,
    syncedCount: syncedPluginNames.length,
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

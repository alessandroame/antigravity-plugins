#!/usr/bin/env node

/**
 * Safe Remote Git Auto-Update & Global Plugin Sync Engine
 * Checks `origin` with a strict network timeout and configurable cooldown,
 * fast-forwards (`git pull --ff-only`) only when the tracked working tree is clean,
 * avoids recursive hook triggers via `ANTIGRAVITY_SKIP_GIT_HOOK=1`,
 * and runs `syncPluginsToGlobal()` whenever `HEAD` advances or local alignment drifts.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_REPO_ROOT,
  getAnalyticsDir,
  installGitHooks,
  isCanonicalCatalogRepoRoot,
  loadSyncState,
  readGitHeadSha,
  resolveDefaultRepoRoot,
  saveSyncState,
  syncPluginsToGlobal
} from './sync-to-global.mjs';

export const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000;
export const DEFAULT_FETCH_TIMEOUT_MS = 7000;
export const DEFAULT_LOCK_STALE_MS = 60 * 1000;

function isDirectEntry() {
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
}

if (isDirectEntry()) {
  const safetyTimer = setTimeout(() => {
    process.exit(0);
  }, 45000);
  safetyTimer.unref();
}

function resolveCooldownMs(explicitCooldownMs) {
  if (typeof explicitCooldownMs === 'number' && Number.isFinite(explicitCooldownMs) && explicitCooldownMs >= 0) {
    return explicitCooldownMs;
  }
  const envVal = Number(process.env.ANTIGRAVITY_AUTO_UPDATE_COOLDOWN_MS);
  if (Number.isFinite(envVal) && envVal >= 0) {
    return envVal;
  }
  return DEFAULT_COOLDOWN_MS;
}

function runGitCmd(repoRoot, args, options = {}) {
  const res = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf-8',
    timeout: options.timeoutMs || 8000,
    windowsHide: true,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      ...(options.env || {})
    }
  });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
    timedOut: Boolean(res.error && res.error.code === 'ETIMEDOUT')
  };
}

/**
 * Acquires an atomic lockfile with stale-lock recovery to prevent concurrent background updates.
 * @param {string} lockFile
 * @param {number} [nowMs]
 * @param {number} [staleMs]
 * @returns {{ acquired: boolean, reason?: string }}
 */
export function acquireAutoUpdateLock(lockFile, nowMs = Date.now(), staleMs = DEFAULT_LOCK_STALE_MS) {
  try {
    fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  } catch {
    return { acquired: false, reason: 'lock-dir-error' };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = fs.openSync(lockFile, 'wx');
      try {
        fs.writeFileSync(
          fd,
          JSON.stringify({ pid: process.pid, acquiredAtMs: nowMs }) + '\n',
          'utf-8'
        );
      } finally {
        fs.closeSync(fd);
      }
      return { acquired: true };
    } catch (err) {
      if (err && err.code === 'EEXIST') {
        try {
          const raw = fs.readFileSync(lockFile, 'utf-8');
          const parsed = JSON.parse(raw);
          const acquiredAtMs = Number(parsed?.acquiredAtMs) || 0;
          if (nowMs - acquiredAtMs > staleMs) {
            fs.rmSync(lockFile, { force: true });
            continue;
          }
        } catch {
          try {
            const st = fs.statSync(lockFile);
            if (nowMs - st.mtimeMs > staleMs) {
              fs.rmSync(lockFile, { force: true });
              continue;
            }
          } catch {
            // Lock vanished concurrently, retry once
            continue;
          }
        }
        return { acquired: false, reason: 'lock-active' };
      }
      return { acquired: false, reason: err?.code || 'lock-error' };
    }
  }
  return { acquired: false, reason: 'lock-active' };
}

/**
 * Releases the auto-update lockfile.
 * @param {string} lockFile
 */
export function releaseAutoUpdateLock(lockFile) {
  try {
    fs.rmSync(lockFile, { force: true });
  } catch {
    // Non-blocking lock cleanup
  }
}

/**
 * Inspects local Git branch, `origin` remote availability, upstream ref, and tracked dirty files.
 * @param {string} repoRoot
 * @returns {{
 *   hasGit: boolean,
 *   detached: boolean,
 *   branch: string | null,
 *   hasOrigin: boolean,
 *   upstreamRef: string | null,
 *   isDirtyTracked: boolean,
 *   dirtyFiles: string[]
 * }}
 */
export function inspectGitSyncContext(repoRoot) {
  if (!repoRoot || !fs.existsSync(path.join(repoRoot, '.git'))) {
    return {
      hasGit: false,
      detached: false,
      branch: null,
      hasOrigin: false,
      upstreamRef: null,
      isDirtyTracked: false,
      dirtyFiles: []
    };
  }

  const branchRes = runGitCmd(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'], { timeoutMs: 3000 });
  const branchName = branchRes.ok ? branchRes.stdout : '';
  const detached = !branchName || branchName === 'HEAD';

  const originRes = runGitCmd(repoRoot, ['remote', 'get-url', 'origin'], { timeoutMs: 3000 });
  const hasOrigin = originRes.ok && Boolean(originRes.stdout);

  let upstreamRef = null;
  if (!detached) {
    const upRes = runGitCmd(
      repoRoot,
      ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
      { timeoutMs: 3000 }
    );
    if (upRes.ok && upRes.stdout) {
      upstreamRef = upRes.stdout;
    } else if (hasOrigin) {
      upstreamRef = `origin/${branchName}`;
    }
  }

  const statusRes = runGitCmd(repoRoot, ['status', '--porcelain', '--untracked-files=no'], {
    timeoutMs: 4000
  });
  const dirtyFiles = statusRes.ok && statusRes.stdout
    ? statusRes.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return {
    hasGit: true,
    detached,
    branch: detached ? null : branchName,
    hasOrigin,
    upstreamRef,
    isDirtyTracked: dirtyFiles.length > 0,
    dirtyFiles
  };
}

function buildSyncPassOptions(options, repoRoot, stateFile) {
  const pass = {
    repoRoot,
    stateFile,
    quiet: Boolean(options.quiet)
  };
  const passthroughKeys = [
    'globalPluginsDir',
    'globalSkillsDir',
    'globalConfigFile',
    'cloudBootstrapFile',
    'globalGeminiFile',
    'duplicateGlobalAgentsFile',
    'globalAgentsDir'
  ];
  for (const key of passthroughKeys) {
    if (options[key]) pass[key] = options[key];
  }
  return pass;
}

/**
 * Executes the cooldown-aware remote fetch, safe fast-forward pull, and global plugin sync.
 * @param {object} [options]
 * @returns {object}
 */
export function runGitAutoUpdate(options = {}) {
  const nowMs = typeof options.nowMs === 'number' ? options.nowMs : Date.now();
  const cooldownMs = resolveCooldownMs(options.cooldownMs);
  const fetchTimeoutMs =
    typeof options.fetchTimeoutMs === 'number' && options.fetchTimeoutMs > 0
      ? options.fetchTimeoutMs
      : DEFAULT_FETCH_TIMEOUT_MS;
  const analyticsDir = getAnalyticsDir(options.analyticsDir);
  const stateFile = options.stateFile || path.join(analyticsDir, 'plugin-sync-state.json');
  const lockFile = options.lockFile || path.join(path.dirname(stateFile), 'plugin-auto-update.lock');
  const repoRoot = options.repoRoot
    ? path.resolve(options.repoRoot)
    : resolveDefaultRepoRoot({ stateFile });
  const quiet = Boolean(options.quiet);
  const log = (...args) => {
    if (!quiet) console.log(...args);
  };

  if (
    repoRoot.replace(/\\/g, '/').toLowerCase().includes('/.gemini/config') ||
    (!options.repoRoot && !isCanonicalCatalogRepoRoot(repoRoot))
  ) {
    return {
      status: 'invalid_repo_root',
      updated: false,
      synced: false,
      repoRoot
    };
  }

  const lock = acquireAutoUpdateLock(lockFile, nowMs);
  if (!lock.acquired) {
    return {
      status: 'locked_skipped',
      updated: false,
      synced: false,
      repoRoot
    };
  }

  try {
    const prevState = loadSyncState(stateFile) || {};
    const localHeadSha = readGitHeadSha(repoRoot);
    const syncedHeadSha = prevState.syncedHeadSha || prevState.headSha || null;
    const globalPluginsDir =
      options.globalPluginsDir || path.join(os.homedir(), '.gemini', 'config', 'plugins');
    const needsLocalSync =
      !syncedHeadSha ||
      syncedHeadSha !== localHeadSha ||
      (options.globalPluginsDir ? !fs.existsSync(options.globalPluginsDir) : !fs.existsSync(globalPluginsDir));
    const syncOpts = buildSyncPassOptions(options, repoRoot, stateFile);

    const gitCtx = inspectGitSyncContext(repoRoot);
    if (!gitCtx.hasGit || gitCtx.detached || !gitCtx.hasOrigin || options.skipFetch) {
      let syncResult = null;
      if (needsLocalSync) {
        syncResult = syncPluginsToGlobal(syncOpts);
      }
      const status = !gitCtx.hasGit
        ? 'no_git'
        : gitCtx.detached
          ? 'detached_head'
          : !gitCtx.hasOrigin
            ? 'no_remote'
            : needsLocalSync
              ? 'synced_local'
              : 'up_to_date';
      return {
        status,
        updated: false,
        synced: Boolean(syncResult?.synced),
        headSha: localHeadSha,
        repoRoot,
        syncResult
      };
    }

    const lastRemoteCheckAtMs = Number(prevState.lastRemoteCheckAtMs || 0);
    const elapsedSinceRemoteCheck = nowMs - lastRemoteCheckAtMs;
    if (!options.force && lastRemoteCheckAtMs > 0 && elapsedSinceRemoteCheck < cooldownMs) {
      let syncResult = null;
      if (needsLocalSync) {
        syncResult = syncPluginsToGlobal(syncOpts);
      }
      const status = needsLocalSync ? 'synced_local_within_cooldown' : 'cooldown_active';
      log(`   [SKIP] Remote auto-update in cooldown (${Math.round((cooldownMs - elapsedSinceRemoteCheck) / 1000)}s remaining)`);
      return {
        status,
        updated: false,
        synced: Boolean(syncResult?.synced),
        headSha: localHeadSha,
        cooldownRemainingMs: cooldownMs - elapsedSinceRemoteCheck,
        repoRoot,
        syncResult
      };
    }

    const fetchRes = runGitCmd(repoRoot, ['fetch', '--quiet', 'origin', gitCtx.branch], {
      timeoutMs: fetchTimeoutMs
    });
    if (!fetchRes.ok) {
      let syncResult = null;
      if (needsLocalSync) {
        syncResult = syncPluginsToGlobal(syncOpts);
      }
      const latestState = loadSyncState(stateFile) || prevState;
      saveSyncState(stateFile, {
        ...latestState,
        lastCheckAtMs: nowMs,
        lastRemoteCheckAtMs: nowMs,
        lastRemoteCheckStatus: 'fetch_failed',
        lastRemoteError: fetchRes.timedOut ? 'fetch-timeout' : fetchRes.stderr || 'fetch-error',
        repoRoot
      });
      log(`   [WARN] Remote fetch failed (${fetchRes.timedOut ? 'timeout' : fetchRes.stderr || 'offline'})`);
      return {
        status: 'fetch_failed',
        updated: false,
        synced: Boolean(syncResult?.synced),
        headSha: localHeadSha,
        error: fetchRes.timedOut ? 'timeout' : fetchRes.stderr,
        repoRoot,
        syncResult
      };
    }

    const targetRef = gitCtx.upstreamRef || `origin/${gitCtx.branch}`;
    const verifyRef = runGitCmd(repoRoot, ['rev-parse', '--verify', '--quiet', targetRef], {
      timeoutMs: 3000
    });
    if (!verifyRef.ok) {
      let syncResult = null;
      if (needsLocalSync) {
        syncResult = syncPluginsToGlobal(syncOpts);
      }
      const latestState = loadSyncState(stateFile) || prevState;
      saveSyncState(stateFile, {
        ...latestState,
        lastCheckAtMs: nowMs,
        lastRemoteCheckAtMs: nowMs,
        lastRemoteCheckStatus: 'no_upstream',
        repoRoot
      });
      return {
        status: 'no_upstream',
        updated: false,
        synced: Boolean(syncResult?.synced),
        headSha: localHeadSha,
        repoRoot,
        syncResult
      };
    }

    const countsRes = runGitCmd(repoRoot, ['rev-list', '--left-right', '--count', `HEAD...${targetRef}`], {
      timeoutMs: 4000
    });
    let ahead = 0;
    let behind = 0;
    if (countsRes.ok && countsRes.stdout) {
      const parts = countsRes.stdout.split(/\s+/);
      ahead = parseInt(parts[0], 10) || 0;
      behind = parseInt(parts[1], 10) || 0;
    }

    if (behind > 0 && ahead === 0) {
      if (gitCtx.isDirtyTracked) {
        let syncResult = null;
        if (needsLocalSync) {
          syncResult = syncPluginsToGlobal(syncOpts);
        }
        const latestState = loadSyncState(stateFile) || prevState;
        saveSyncState(stateFile, {
          ...latestState,
          lastCheckAtMs: nowMs,
          lastRemoteCheckAtMs: nowMs,
          lastRemoteCheckStatus: 'skipped_dirty_worktree',
          pendingRemoteBehind: behind,
          repoRoot
        });
        log(`   [SKIP] Remote is ahead by ${behind} commit(s), skipped pull due to dirty tracked files.`);
        return {
          status: 'skipped_dirty_worktree',
          updated: false,
          synced: Boolean(syncResult?.synced),
          ahead,
          behind,
          dirtyFiles: gitCtx.dirtyFiles,
          headSha: localHeadSha,
          repoRoot,
          syncResult
        };
      }

      if (options.checkOnly) {
        const latestState = loadSyncState(stateFile) || prevState;
        saveSyncState(stateFile, {
          ...latestState,
          lastCheckAtMs: nowMs,
          lastRemoteCheckAtMs: nowMs,
          lastRemoteCheckStatus: 'update_available',
          pendingRemoteBehind: behind,
          repoRoot
        });
        return {
          status: 'update_available',
          updated: false,
          synced: false,
          ahead,
          behind,
          headSha: localHeadSha,
          repoRoot
        };
      }

      const pullRes = runGitCmd(repoRoot, ['pull', '--ff-only', '--quiet'], {
        timeoutMs: 15000,
        env: { ANTIGRAVITY_SKIP_GIT_HOOK: '1' }
      });
      if (!pullRes.ok) {
        const latestState = loadSyncState(stateFile) || prevState;
        saveSyncState(stateFile, {
          ...latestState,
          lastCheckAtMs: nowMs,
          lastRemoteCheckAtMs: nowMs,
          lastRemoteCheckStatus: 'pull_failed',
          lastRemoteError: pullRes.stderr || 'pull-ff-only-failed',
          repoRoot
        });
        log(`   [WARN] Fast-forward pull failed: ${pullRes.stderr || pullRes.stdout}`);
        return {
          status: 'pull_failed',
          updated: false,
          synced: false,
          ahead,
          behind,
          headSha: localHeadSha,
          error: pullRes.stderr || pullRes.stdout,
          repoRoot
        };
      }

      const newHeadSha = readGitHeadSha(repoRoot);
      const syncResult = syncPluginsToGlobal(syncOpts);
      const latestState = loadSyncState(stateFile) || prevState;
      saveSyncState(stateFile, {
        ...latestState,
        lastCheckAtMs: nowMs,
        lastRemoteCheckAtMs: nowMs,
        lastRemoteCheckStatus: 'updated',
        headSha: newHeadSha,
        syncedHeadSha: newHeadSha,
        pendingRemoteBehind: 0,
        lastRemoteError: null,
        pendingUpdateNotice: {
          fromSha: localHeadSha,
          toSha: newHeadSha,
          behind,
          updatedAtMs: nowMs,
          syncedCount: syncResult.syncedCount,
          syncedSkillsCount: syncResult.syncedSkillsCount,
          notifiedAtMs: null
        },
        repoRoot
      });

      log(
        `   [OK] Updated ${repoRoot} (${localHeadSha.slice(0, 7)} -> ${newHeadSha.slice(0, 7)}, +${behind}) and synchronized ${syncResult.syncedCount} plugins.`
      );
      return {
        status: 'updated',
        updated: true,
        synced: Boolean(syncResult.synced),
        fromSha: localHeadSha,
        toSha: newHeadSha,
        ahead,
        behind,
        repoRoot,
        syncResult
      };
    }

    if (behind > 0 && ahead > 0) {
      let syncResult = null;
      if (needsLocalSync) {
        syncResult = syncPluginsToGlobal(syncOpts);
      }
      const latestState = loadSyncState(stateFile) || prevState;
      saveSyncState(stateFile, {
        ...latestState,
        lastCheckAtMs: nowMs,
        lastRemoteCheckAtMs: nowMs,
        lastRemoteCheckStatus: 'diverged_skipped',
        pendingRemoteBehind: behind,
        repoRoot
      });
      log(`   [SKIP] Branch diverged (ahead ${ahead}, behind ${behind}); skipping automatic pull.`);
      return {
        status: 'diverged_skipped',
        updated: false,
        synced: Boolean(syncResult?.synced),
        ahead,
        behind,
        headSha: localHeadSha,
        repoRoot,
        syncResult
      };
    }

    let syncResult = null;
    if (needsLocalSync) {
      syncResult = syncPluginsToGlobal(syncOpts);
    }
    const latestState = loadSyncState(stateFile) || prevState;
    saveSyncState(stateFile, {
      ...latestState,
      lastCheckAtMs: nowMs,
      lastRemoteCheckAtMs: nowMs,
      lastRemoteCheckStatus: 'up_to_date',
      syncedHeadSha: localHeadSha,
      pendingRemoteBehind: 0,
      lastRemoteError: null,
      repoRoot
    });

    return {
      status: needsLocalSync ? 'synced_local' : 'up_to_date',
      updated: false,
      synced: Boolean(syncResult?.synced),
      ahead,
      behind: 0,
      headSha: localHeadSha,
      repoRoot,
      syncResult
    };
  } finally {
    releaseAutoUpdateLock(lockFile);
  }
}

function parseCliArgs(argv) {
  const opts = {
    force: argv.includes('--force'),
    checkOnly: argv.includes('--check-only'),
    skipFetch: argv.includes('--skip-fetch'),
    quiet: argv.includes('--quiet'),
    json: argv.includes('--json'),
    installHooks: argv.includes('--install-hooks'),
    detached: argv.includes('--detached')
  };
  const cdIdx = argv.indexOf('--cooldown-ms');
  if (cdIdx !== -1 && argv[cdIdx + 1] !== undefined) {
    const val = Number(argv[cdIdx + 1]);
    if (Number.isFinite(val) && val >= 0) opts.cooldownMs = val;
  }
  const repoIdx = argv.indexOf('--repo');
  if (repoIdx !== -1 && argv[repoIdx + 1]) {
    opts.repoRoot = path.resolve(argv[repoIdx + 1]);
  }
  return opts;
}

if (isDirectEntry()) {
  const args = process.argv.slice(2);
  const cliOpts = parseCliArgs(args);

  if (cliOpts.installHooks) {
    const repoRoot = cliOpts.repoRoot || resolveDefaultRepoRoot();
    const res = installGitHooks(repoRoot);
    if (cliOpts.json) {
      process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    } else if (res.installed) {
      console.log(`[OK] Git hooks path configured: core.hooksPath = ${res.hooksPath}`);
    } else {
      console.warn(`[WARN] Git hooks not installed: ${res.reason}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (cliOpts.detached) {
    const selfPath = fileURLToPath(import.meta.url);
    const forwardArgs = args.filter((a) => a !== '--detached');
    if (!forwardArgs.includes('--quiet')) forwardArgs.push('--quiet');
    try {
      const child = spawn(process.execPath, [selfPath, ...forwardArgs], {
        cwd: cliOpts.repoRoot || DEFAULT_REPO_ROOT,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    } catch {
      // Non-blocking detached launch
    }
    process.exit(0);
  }

  const result = runGitAutoUpdate(cliOpts);
  if (cliOpts.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}

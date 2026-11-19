import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const safetyTimer = setTimeout(() => {
  console.error('[FATAL TIMEOUT] git-auto-update.test.mjs exceeded 45s safety ceiling.');
  process.exit(1);
}, 45000);
safetyTimer.unref();

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1')), '..');

function runGit(cwd, args, env = {}) {
  const res = spawnSync('git', args, {
    cwd,
    encoding: 'utf-8',
    timeout: 10000,
    windowsHide: true,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_AUTHOR_NAME: 'Test User',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'Test User',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      ...env
    }
  });
  if (res.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed (${res.status}): ${res.stderr || res.stdout}`);
  }
  return (res.stdout || '').trim();
}

function createIsolatedCatalogEnv() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-auto-update-'));
  const bareOrigin = path.join(tmpRoot, 'origin.git');
  const seedClone = path.join(tmpRoot, 'seed');
  const workClone = path.join(tmpRoot, 'work');
  const fakeHome = path.join(tmpRoot, 'home');
  const analyticsDir = path.join(fakeHome, '.gemini', 'antigravity', 'analytics');
  const globalPluginsDir = path.join(fakeHome, '.gemini', 'config', 'plugins');
  const globalSkillsDir = path.join(fakeHome, '.gemini', 'skills');
  const globalConfigFile = path.join(fakeHome, '.gemini', 'config', 'config.json');
  const cloudBootstrapFile = path.join(fakeHome, '.gemini', 'CLOUD_BOOTSTRAP.md');
  const globalGeminiFile = path.join(fakeHome, '.gemini', 'GEMINI.md');
  const globalAgentsDir = path.join(fakeHome, '.gemini', 'agents');
  const stateFile = path.join(analyticsDir, 'plugin-sync-state.json');

  fs.mkdirSync(bareOrigin, { recursive: true });
  fs.mkdirSync(analyticsDir, { recursive: true });

  runGit(bareOrigin, ['init', '--bare', '-b', 'main']);
  runGit(tmpRoot, ['clone', bareOrigin, seedClone]);
  runGit(seedClone, ['checkout', '-b', 'main']);

  // Seed canonical repo structure with real scripts and .githooks
  fs.mkdirSync(path.join(seedClone, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(seedClone, '.githooks'), { recursive: true });
  fs.mkdirSync(path.join(seedClone, 'plugins', 'sample-plugin', 'skills', 'sample-skill'), { recursive: true });

  fs.writeFileSync(
    path.join(seedClone, 'package.json'),
    JSON.stringify({ name: 'antigravity-plugins', version: '1.0.0', type: 'module' }, null, 2) + '\n',
    'utf-8'
  );
  fs.writeFileSync(path.join(seedClone, 'scripts', 'validate.mjs'), '// test validator stub\n', 'utf-8');
  fs.copyFileSync(
    path.join(REPO_ROOT, 'scripts', 'sync-to-global.mjs'),
    path.join(seedClone, 'scripts', 'sync-to-global.mjs')
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, 'scripts', 'git-auto-update.mjs'),
    path.join(seedClone, 'scripts', 'git-auto-update.mjs')
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, '.githooks', 'post-merge'),
    path.join(seedClone, '.githooks', 'post-merge')
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, '.githooks', 'post-checkout'),
    path.join(seedClone, '.githooks', 'post-checkout')
  );

  fs.writeFileSync(
    path.join(seedClone, 'plugins', 'sample-plugin', 'plugin.json'),
    JSON.stringify({ name: 'sample-plugin', displayName: 'Sample', description: 'Test plugin', version: '1.0.0' }, null, 2) + '\n',
    'utf-8'
  );
  fs.writeFileSync(
    path.join(seedClone, 'plugins', 'sample-plugin', 'skills', 'sample-skill', 'SKILL.md'),
    '---\nname: sample-skill\ndescription: Use this skill when testing automated git plugin synchronization workflows.\n---\n\n# Sample v1\n',
    'utf-8'
  );

  runGit(seedClone, ['add', '.']);
  runGit(seedClone, ['commit', '-m', 'chore: seed catalog v1.0.0']);
  runGit(seedClone, ['push', '-u', 'origin', 'main']);
  runGit(bareOrigin, ['symbolic-ref', 'HEAD', 'refs/heads/main']);

  runGit(tmpRoot, ['clone', bareOrigin, workClone]);

  const syncOptions = {
    repoRoot: workClone,
    analyticsDir,
    stateFile,
    globalPluginsDir,
    globalSkillsDir,
    globalConfigFile,
    cloudBootstrapFile,
    globalGeminiFile,
    globalAgentsDir,
    quiet: true
  };

  const env = {
    HOME: fakeHome,
    USERPROFILE: fakeHome,
    ANTIGRAVITY_ANALYTICS_DIR: analyticsDir,
    ANTIGRAVITY_PLUGINS_ROOT: workClone
  };

  return {
    tmpRoot,
    bareOrigin,
    seedClone,
    workClone,
    fakeHome,
    analyticsDir,
    globalPluginsDir,
    globalSkillsDir,
    stateFile,
    syncOptions,
    env,
    cleanup() {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  };
}

function pushRemotePluginUpdate(seedClone, version, note = 'Update') {
  fs.writeFileSync(
    path.join(seedClone, 'plugins', 'sample-plugin', 'plugin.json'),
    JSON.stringify({ name: 'sample-plugin', displayName: 'Sample', description: 'Test plugin', version }, null, 2) + '\n',
    'utf-8'
  );
  fs.writeFileSync(
    path.join(seedClone, 'plugins', 'sample-plugin', 'skills', 'sample-skill', 'SKILL.md'),
    `---\nname: sample-skill\ndescription: Use this skill when testing automated git plugin synchronization workflows.\n---\n\n# Sample ${version}\n${note}\n`,
    'utf-8'
  );
  runGit(seedClone, ['add', '.']);
  runGit(seedClone, ['commit', '-m', `feat(sample): bump to ${version}`]);
  runGit(seedClone, ['push', 'origin', 'main']);
  return runGit(seedClone, ['rev-parse', 'HEAD']);
}

describe('Git Auto-Update & Native Hooks End-to-End (100% Offline Bare Origin)', () => {
  it('pulls fast-forward remote updates and synchronizes global plugins, skills, and pendingUpdateNotice', async () => {
    const { runGitAutoUpdate } = await import(pathToFileURL(path.join(REPO_ROOT, 'scripts', 'git-auto-update.mjs')).href);
    const ctx = createIsolatedCatalogEnv();
    try {
      const remoteSha = pushRemotePluginUpdate(ctx.seedClone, '1.1.0', 'Remote v1.1.0');
      const res = runGitAutoUpdate({
        ...ctx.syncOptions,
        nowMs: 1700000000000,
        force: true
      });

      assert.equal(res.status, 'updated');
      assert.equal(res.updated, true);
      assert.equal(res.synced, true);
      assert.equal(res.behind, 1);
      assert.equal(res.toSha, remoteSha);

      const installedManifest = JSON.parse(
        fs.readFileSync(path.join(ctx.globalPluginsDir, 'sample-plugin', 'plugin.json'), 'utf-8')
      );
      assert.equal(installedManifest.version, '1.1.0');

      const installedSkill = fs.readFileSync(
        path.join(ctx.globalSkillsDir, 'sample-skill', 'SKILL.md'),
        'utf-8'
      );
      assert.match(installedSkill, /Sample 1\.1\.0/);

      const savedState = JSON.parse(fs.readFileSync(ctx.stateFile, 'utf-8'));
      assert.equal(savedState.syncedHeadSha, remoteSha);
      assert.equal(savedState.lastRemoteCheckStatus, 'updated');
      assert.equal(savedState.pendingUpdateNotice?.toSha, remoteSha);
      assert.equal(savedState.pendingUpdateNotice?.notifiedAtMs, null);
    } finally {
      ctx.cleanup();
    }
  });

  it('respects cooldown unless --force is passed, while still aligning local HEAD mismatches', async () => {
    const { runGitAutoUpdate } = await import(pathToFileURL(path.join(REPO_ROOT, 'scripts', 'git-auto-update.mjs')).href);
    const ctx = createIsolatedCatalogEnv();
    try {
      const t0 = 1700000000000;
      const first = runGitAutoUpdate({ ...ctx.syncOptions, nowMs: t0, force: true });
      assert.equal(first.synced, true);

      const v2Sha = pushRemotePluginUpdate(ctx.seedClone, '1.2.0', 'Within cooldown');

      // Within 15m cooldown -> skips remote fetch
      const withinCooldown = runGitAutoUpdate({
        ...ctx.syncOptions,
        nowMs: t0 + 60 * 1000,
        cooldownMs: 15 * 60 * 1000
      });
      assert.equal(withinCooldown.status, 'cooldown_active');
      assert.equal(withinCooldown.updated, false);

      // Force bypasses cooldown -> pulls v1.2.0
      const forced = runGitAutoUpdate({
        ...ctx.syncOptions,
        nowMs: t0 + 60 * 1000,
        cooldownMs: 15 * 60 * 1000,
        force: true
      });
      assert.equal(forced.status, 'updated');
      assert.equal(forced.toSha, v2Sha);

      // Simulate local HEAD divergence from syncedHeadSha inside cooldown
      const v3Sha = pushRemotePluginUpdate(ctx.seedClone, '1.3.0', 'Local merge');
      runGit(ctx.workClone, ['pull', '--ff-only', '--quiet'], { ANTIGRAVITY_SKIP_GIT_HOOK: '1' });

      const localAlign = runGitAutoUpdate({
        ...ctx.syncOptions,
        nowMs: t0 + 120 * 1000,
        cooldownMs: 15 * 60 * 1000
      });
      assert.equal(localAlign.status, 'synced_local_within_cooldown');
      assert.equal(localAlign.synced, true);
      const installedManifest = JSON.parse(
        fs.readFileSync(path.join(ctx.globalPluginsDir, 'sample-plugin', 'plugin.json'), 'utf-8')
      );
      assert.equal(installedManifest.version, '1.3.0');
      assert.equal(runGit(ctx.workClone, ['rev-parse', 'HEAD']), v3Sha);
    } finally {
      ctx.cleanup();
    }
  });

  it('skips git pull safely when tracked working tree files are dirty (skipped_dirty_worktree)', async () => {
    const { runGitAutoUpdate } = await import(pathToFileURL(path.join(REPO_ROOT, 'scripts', 'git-auto-update.mjs')).href);
    const ctx = createIsolatedCatalogEnv();
    try {
      const t0 = 1700000000000;
      runGitAutoUpdate({ ...ctx.syncOptions, nowMs: t0, force: true });
      const beforeSha = runGit(ctx.workClone, ['rev-parse', 'HEAD']);

      pushRemotePluginUpdate(ctx.seedClone, '1.4.0', 'Should not overwrite dirty worktree');

      // Dirty a tracked file in workClone
      const trackedFile = path.join(ctx.workClone, 'plugins', 'sample-plugin', 'skills', 'sample-skill', 'SKILL.md');
      fs.appendFileSync(trackedFile, '\nLocal uncommitted edit\n', 'utf-8');

      const res = runGitAutoUpdate({ ...ctx.syncOptions, nowMs: t0 + 20 * 60 * 1000 });
      assert.equal(res.status, 'skipped_dirty_worktree');
      assert.equal(res.updated, false);
      assert.equal(res.behind, 1);
      assert.equal(runGit(ctx.workClone, ['rev-parse', 'HEAD']), beforeSha);
      assert.match(fs.readFileSync(trackedFile, 'utf-8'), /Local uncommitted edit/);
    } finally {
      ctx.cleanup();
    }
  });

  it('handles unreachable origin, diverged branches, and lockfiles without failing', async () => {
    const {
      runGitAutoUpdate,
      acquireAutoUpdateLock,
      releaseAutoUpdateLock
    } = await import(pathToFileURL(path.join(REPO_ROOT, 'scripts', 'git-auto-update.mjs')).href);
    const ctx = createIsolatedCatalogEnv();
    try {
      const t0 = 1700000000000;
      runGitAutoUpdate({ ...ctx.syncOptions, nowMs: t0, force: true });

      // 1. Active lockfile skips concurrent run
      const lockFile = path.join(ctx.analyticsDir, 'plugin-auto-update.lock');
      const lockRes = acquireAutoUpdateLock(lockFile, t0);
      assert.equal(lockRes.acquired, true);
      const lockedRun = runGitAutoUpdate({ ...ctx.syncOptions, lockFile, nowMs: t0 + 1000, force: true });
      assert.equal(lockedRun.status, 'locked_skipped');
      releaseAutoUpdateLock(lockFile);

      // 2. Diverged branch (local commit + remote commit) skips pull safely
      pushRemotePluginUpdate(ctx.seedClone, '1.5.0', 'Remote branch commit');
      fs.writeFileSync(path.join(ctx.workClone, 'LOCAL_ONLY.md'), 'local commit\n', 'utf-8');
      runGit(ctx.workClone, ['add', 'LOCAL_ONLY.md']);
      runGit(ctx.workClone, ['commit', '-m', 'feat: local diverge']);
      const divergedRes = runGitAutoUpdate({ ...ctx.syncOptions, nowMs: t0 + 20 * 60 * 1000, force: true });
      assert.equal(divergedRes.status, 'diverged_skipped');
      assert.equal(divergedRes.updated, false);

      // 3. Unreachable origin returns fetch_failed cleanly
      runGit(ctx.workClone, ['remote', 'set-url', 'origin', path.join(ctx.tmpRoot, 'missing-origin.git')]);
      const offlineRes = runGitAutoUpdate({
        ...ctx.syncOptions,
        nowMs: t0 + 40 * 60 * 1000,
        fetchTimeoutMs: 2500,
        force: true
      });
      assert.equal(offlineRes.status, 'fetch_failed');
      assert.equal(offlineRes.updated, false);
    } finally {
      ctx.cleanup();
    }
  });

  it('installs core.hooksPath = .githooks and fires post-merge and post-checkout hooks cleanly', async () => {
    const { installGitHooks, syncPluginsToGlobal } = await import(
      pathToFileURL(path.join(REPO_ROOT, 'scripts', 'sync-to-global.mjs')).href
    );
    const ctx = createIsolatedCatalogEnv();
    try {
      // Non-git temp dir should never throw
      const noGitDir = path.join(ctx.tmpRoot, 'no-git-dir');
      fs.mkdirSync(noGitDir, { recursive: true });
      const noGitInstall = installGitHooks(noGitDir);
      assert.equal(noGitInstall.installed, false);

      // Sync installs core.hooksPath = .githooks automatically
      const initialSync = syncPluginsToGlobal(ctx.syncOptions);
      assert.equal(initialSync.synced, true);
      assert.equal(runGit(ctx.workClone, ['config', '--get', 'core.hooksPath']), '.githooks');

      // Real `git pull` fires .githooks/post-merge -> updates isolated fakeHome global plugins!
      pushRemotePluginUpdate(ctx.seedClone, '2.0.0', 'Triggered by post-merge');
      runGit(ctx.workClone, ['pull', '--ff-only'], ctx.env);

      const postMergeManifest = JSON.parse(
        fs.readFileSync(path.join(ctx.globalPluginsDir, 'sample-plugin', 'plugin.json'), 'utf-8')
      );
      assert.equal(postMergeManifest.version, '2.0.0');

      // Branch checkout ($3 == 1) fires .githooks/post-checkout -> syncs branch HEAD
      runGit(ctx.seedClone, ['checkout', '-b', 'feature-branch']);
      pushRemotePluginUpdate(ctx.seedClone, '2.1.0-beta', 'Branch checkout sync');
      // Push feature-branch to origin
      runGit(ctx.seedClone, ['push', '-u', 'origin', 'feature-branch']);
      runGit(ctx.workClone, ['fetch', 'origin']);

      // Checkout feature-branch in workClone with remote check disabled in hook so we test synchronous HEAD sync deterministically
      runGit(ctx.workClone, ['checkout', '-b', 'feature-branch', 'origin/feature-branch'], {
        ...ctx.env,
        ANTIGRAVITY_SKIP_REMOTE_CHECK: '1'
      });

      const postCheckoutManifest = JSON.parse(
        fs.readFileSync(path.join(ctx.globalPluginsDir, 'sample-plugin', 'plugin.json'), 'utf-8')
      );
      assert.equal(postCheckoutManifest.version, '2.1.0-beta');

      // File checkout ($3 == 0) must NOT trigger sync
      fs.writeFileSync(
        path.join(ctx.globalPluginsDir, 'sample-plugin', 'plugin.json'),
        JSON.stringify({ name: 'sample-plugin', version: 'sentinel-untouched' }) + '\n',
        'utf-8'
      );
      fs.appendFileSync(
        path.join(ctx.workClone, 'plugins', 'sample-plugin', 'skills', 'sample-skill', 'SKILL.md'),
        '\nDirty file to revert\n',
        'utf-8'
      );
      runGit(
        ctx.workClone,
        ['checkout', '--', 'plugins/sample-plugin/skills/sample-skill/SKILL.md'],
        { ...ctx.env, ANTIGRAVITY_SKIP_REMOTE_CHECK: '1' }
      );
      const afterFileCheckout = JSON.parse(
        fs.readFileSync(path.join(ctx.globalPluginsDir, 'sample-plugin', 'plugin.json'), 'utf-8')
      );
      assert.equal(afterFileCheckout.version, 'sentinel-untouched');

      // ANTIGRAVITY_SKIP_GIT_HOOK=1 suppresses post-merge sync
      runGit(ctx.seedClone, ['checkout', 'main']);
      pushRemotePluginUpdate(ctx.seedClone, '2.2.0', 'Skip hook test');
      runGit(ctx.workClone, ['checkout', 'main'], {
        ...ctx.env,
        ANTIGRAVITY_SKIP_GIT_HOOK: '1'
      });
      runGit(ctx.workClone, ['pull', '--ff-only'], {
        ...ctx.env,
        ANTIGRAVITY_SKIP_GIT_HOOK: '1'
      });
      const afterSkippedPull = JSON.parse(
        fs.readFileSync(path.join(ctx.globalPluginsDir, 'sample-plugin', 'plugin.json'), 'utf-8')
      );
      assert.equal(afterSkippedPull.version, 'sentinel-untouched');

      // CLI --install-hooks works cleanly on a repo
      const cliHooks = spawnSync(
        process.execPath,
        [path.join(ctx.workClone, 'scripts', 'git-auto-update.mjs'), '--install-hooks', '--json'],
        { cwd: ctx.workClone, encoding: 'utf-8', env: { ...process.env, ...ctx.env } }
      );
      assert.equal(cliHooks.status, 0);
      assert.equal(JSON.parse(cliHooks.stdout).installed, true);
    } finally {
      ctx.cleanup();
    }
  });

  it('emits a one-time Italian metadata.user_markdown notice in router-pre-hook and stays silent on eta-injector', async () => {
    const ctx = createIsolatedCatalogEnv();
    try {
      const nowMs = Date.now();
      fs.writeFileSync(
        ctx.stateFile,
        JSON.stringify({
          headSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          syncedHeadSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          lastCheckAtMs: nowMs,
          lastRemoteCheckAtMs: nowMs,
          pendingUpdateNotice: {
            fromSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            toSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            behind: 2,
            updatedAtMs: nowMs,
            syncedCount: 16,
            syncedSkillsCount: 40,
            notifiedAtMs: null
          }
        }, null, 2) + '\n',
        'utf-8'
      );

      // 1. router-pre-hook emits 1-line Italian banner once and stamps notifiedAtMs
      const preHookPath = path.join(REPO_ROOT, 'plugins', 'adaptive-router', 'scripts', 'router-pre-hook.mjs');
      const payload = JSON.stringify({
        conversationId: 'conv-auto-update-test',
        invocationNum: 1,
        lastUserInput: 'controlla lo stato dei test'
      });
      const r1 = spawnSync(process.execPath, [preHookPath], {
        input: payload,
        encoding: 'utf-8',
        env: { ...process.env, ...ctx.env }
      });
      assert.equal(r1.status, 0);
      const out1 = JSON.parse(r1.stdout);
      assert.ok(Array.isArray(out1.injectSteps));
      const updateStep = out1.injectSteps.find((s) =>
        s?.systemMessage?.metadata?.user_markdown?.includes('Aggiornamento remoto')
      );
      assert.ok(updateStep, 'Expected 1-line Italian update notification in metadata.user_markdown');
      assert.equal(updateStep.systemMessage.systemMessage, '');

      const stateAfter = JSON.parse(fs.readFileSync(ctx.stateFile, 'utf-8'));
      assert.equal(typeof stateAfter.pendingUpdateNotice.notifiedAtMs, 'number');

      // 2. Second turn does NOT repeat the notification
      const r2 = spawnSync(process.execPath, [preHookPath], {
        input: payload,
        encoding: 'utf-8',
        env: { ...process.env, ...ctx.env }
      });
      assert.equal(r2.status, 0);
      const out2 = JSON.parse(r2.stdout);
      const repeatStep = (out2.injectSteps || []).find((s) =>
        s?.systemMessage?.metadata?.user_markdown?.includes('Aggiornamento remoto')
      );
      assert.equal(repeatStep, undefined);

      // 3. eta-injector --session-start always outputs {}
      const etaPath = path.join(REPO_ROOT, 'plugins', 'telemetry-analytics', 'scripts', 'eta-injector.mjs');
      const r3 = spawnSync(process.execPath, [etaPath, '--session-start'], {
        input: JSON.stringify({ conversationId: 'conv-session-start-test' }),
        encoding: 'utf-8',
        env: { ...process.env, ...ctx.env, NODE_ENV: 'test' }
      });
      assert.equal(r3.status, 0);
      assert.deepEqual(JSON.parse(r3.stdout), {});
    } finally {
      ctx.cleanup();
    }
  });
});

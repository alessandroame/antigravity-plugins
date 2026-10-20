#!/usr/bin/env node
/**
 * Multi-Project GitHub Kanban Synchronizer & Worktree Dependency Provisioner.
 * Supports --mock / LOCAL_ONLY fallback (< 3s) and enforces 45s process timeout guard.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  detectProjectTestCommand,
  mergeDesiderataWithSidecar,
  parseDesiderataTable,
  parseMobileIssueInput,
  planExecutionWave,
  planSafeInboxImport,
  reclaimStaleLocks,
  verifyTrustedTaskOrigin
} from './board-engine.mjs';

// Process-level 45s timeout guard (execution-guard compliance)
setTimeout(() => {
  console.error('[FATAL TIMEOUT] gh-board-sync.mjs exceeded 45s limit.');
  process.exit(1);
}, 45000).unref();

const SIDECAR_REL_PATH = '.agents/board-state.json';

/**
 * [CRITICO-2] Provisions dependencies inside an isolated Git Worktree in < 20ms using native directory junctions.
 * @param {string} mainRepoRoot
 * @param {string} worktreeRoot
 * @param {string[]} touchSet
 */
export function linkWorktreeDependencies(mainRepoRoot, worktreeRoot, touchSet = []) {
  if (Array.isArray(touchSet) && touchSet.includes('*')) {
    return Object.freeze({
      linked: false,
      linkedDirs: [],
      reason: 'SHARED_MANIFEST_MODIFIED_REQUIRES_CLEAN_INSTALL'
    });
  }

  const sharedFolders = ['node_modules', '.venv', 'venv'];
  const linkedDirs = [];

  for (const dir of sharedFolders) {
    const source = join(mainRepoRoot, dir);
    const target = join(worktreeRoot, dir);
    if (existsSync(source) && !existsSync(target)) {
      symlinkSync(source, target, 'junction');
      linkedDirs.push(dir);
    }
  }

  return Object.freeze({
    linked: linkedDirs.length > 0,
    linkedDirs: Object.freeze(linkedDirs),
    reason: null
  });
}

/**
 * Loads the sidecar metadata file (.agents/board-state.json) without polluting DESIDERATA.md.
 * @param {string} repoRoot
 */
export function loadSidecarState(repoRoot) {
  const fullPath = join(repoRoot, SIDECAR_REL_PATH);
  if (!existsSync(fullPath)) {
    return { version: 1, repoOwner: null, tasks: {} };
  }
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch {
    return { version: 1, repoOwner: null, tasks: {} };
  }
}

/**
 * Saves the sidecar metadata file (.agents/board-state.json).
 * @param {string} repoRoot
 * @param {object} state
 */
export function saveSidecarState(repoRoot, state) {
  const fullPath = join(repoRoot, SIDECAR_REL_PATH);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(fullPath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
}

/**
 * Scans first and second level directories of any host project for scope resolution.
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function scanRepoDirs(repoRoot) {
  const ignored = new Set(['.git', 'node_modules', '.venv', 'venv', 'dist', 'build', '.next', 'target']);
  const result = [];

  function walk(currentRel, depth) {
    if (depth > 3) return;
    const abs = currentRel ? join(repoRoot, currentRel) : repoRoot;
    let entries = [];
    try {
      entries = readdirSync(abs);
    } catch {
      return;
    }
    for (const name of entries) {
      if (ignored.has(name) || name.startsWith('.')) continue;
      const rel = currentRel ? `${currentRel}/${name}` : name;
      const full = join(repoRoot, rel);
      try {
        if (statSync(full).isDirectory()) {
          result.push(rel);
          walk(rel, depth + 1);
        }
      } catch {
        // Ignore broken symlinks
      }
    }
  }

  walk('', 1);
  return result.sort();
}

/**
 * Extracts the GitHub owner and repository slug from .git/config without network calls (< 5ms).
 * @param {string} repoRoot
 */
export function detectGitHubRemote(repoRoot) {
  const gitConfigPath = join(repoRoot, '.git', 'config');
  if (!existsSync(gitConfigPath)) return null;
  try {
    const raw = readFileSync(gitConfigPath, 'utf-8');
    const match = raw.match(/github\.com[:/]([^/\s]+)\/([^/\s.]+)(?:\.git)?/i);
    if (!match) return null;
    return { owner: match[1], repo: match[2], slug: `${match[1]}/${match[2]}` };
  } catch {
    return null;
  }
}

/**
 * Fetches open issues via GitHub CLI with a strict 3000ms timeout or mock fixture.
 * Falls back gracefully to LOCAL_ONLY mode on offline or missing gh CLI.
 * @param {object} options
 */
export function fetchRemoteIssuesSafe(options = {}) {
  if (options.mock || process.env.NODE_ENV === 'test') {
    return {
      mode: 'MOCK_OFFLINE',
      issues: options.mockIssues || []
    };
  }

  const remote = detectGitHubRemote(options.repoRoot || process.cwd());
  if (!remote) {
    return { mode: 'LOCAL_ONLY', reason: 'NO_GITHUB_REMOTE', issues: [] };
  }

  try {
    const stdout = execFileSync(
      'gh',
      [
        'issue',
        'list',
        '--state',
        'open',
        '--limit',
        '30',
        '--json',
        'number,title,body,author,labels,updatedAt'
      ],
      {
        cwd: options.repoRoot || process.cwd(),
        timeout: 3000,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      }
    );
    const parsed = JSON.parse(stdout);
    const normalized = parsed.map((item) => ({
      issueNumber: String(item.number),
      title: item.title,
      body: item.body || '',
      authorLogin: item.author?.login || '',
      labels: (item.labels || []).map((l) => l.name),
      updatedAt: item.updatedAt ? Date.parse(item.updatedAt) : 0
    }));
    return { mode: 'ONLINE_GH', remote, issues: normalized };
  } catch {
    return { mode: 'LOCAL_ONLY', reason: 'GH_UNAVAILABLE_OR_OFFLINE', remote, issues: [] };
  }
}

/**
 * Runs a full status/wave diagnostic on the current workspace.
 * @param {string} repoRoot
 * @param {object} opts
 */
export function runBoardSyncStatus(repoRoot, opts = {}) {
  const remoteInfo = detectGitHubRemote(repoRoot);
  const repoDirs = scanRepoDirs(repoRoot);
  const rootFiles = existsSync(repoRoot) ? readdirSync(repoRoot) : [];
  let pkgScripts = {};
  const pkgPath = join(repoRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      pkgScripts = JSON.parse(readFileSync(pkgPath, 'utf-8')).scripts || {};
    } catch {
      pkgScripts = {};
    }
  }

  const testCommand = detectProjectTestCommand(rootFiles, pkgScripts);
  const desiderataPath = join(repoRoot, 'DESIDERATA.md');
  const notesPath = join(repoRoot, 'NOTES.md');
  const sidecar = loadSidecarState(repoRoot);

  const rawDesiderata = existsSync(desiderataPath) ? readFileSync(desiderataPath, 'utf-8') : '';
  const parsedTable = parseDesiderataTable(rawDesiderata);
  const mergedCards = mergeDesiderataWithSidecar(parsedTable.cards, sidecar);
  const { cards: reclaimedCards, recoveredIds } = reclaimStaleLocks(mergedCards, Date.now());

  const readyQueue = reclaimedCards.filter((c) => c.column === 'Ready');
  const activeTasks = reclaimedCards.filter((c) => c.column === 'In Progress');
  const wave = planExecutionWave(readyQueue, activeTasks, repoDirs);

  const remoteResult = fetchRemoteIssuesSafe({ repoRoot, mock: opts.mock, mockIssues: opts.mockIssues });
  const owner = sidecar.repoOwner || remoteInfo?.owner || 'local-owner';

  const trustedRemoteIssues = remoteResult.issues.filter(
    (iss) => verifyTrustedTaskOrigin(iss, { repoOwner: owner }).trusted
  );

  const inboxRemote = trustedRemoteIssues
    .map((iss) => ({ ...iss, parsed: parseMobileIssueInput(iss.title, iss.labels) }))
    .filter((iss) => iss.parsed.status === 'inbox');

  const notesLineCount = existsSync(notesPath)
    ? readFileSync(notesPath, 'utf-8').split(/\r?\n/).length
    : 0;
  const inboxPlan = planSafeInboxImport(notesLineCount, inboxRemote);

  return {
    mode: remoteResult.mode,
    remote: remoteInfo,
    testCommand,
    repoDirsCount: repoDirs.length,
    recoveredStaleIds: recoveredIds,
    wave,
    inboxPlan
  };
}

function main() {
  const args = process.argv.slice(2);
  const isMock = args.includes('--mock');
  const repoRoot = resolve(process.cwd());

  if (args.includes('--record-touch-set')) {
    const idIdx = args.indexOf('--record-touch-set');
    const taskId = args[idIdx + 1];
    const filesArg = args[idIdx + 2] || '';
    if (!taskId) {
      console.error('Usage: gh-board-sync.mjs --record-touch-set <TASK-ID> "<file1,file2>"');
      process.exit(1);
    }
    const sidecar = loadSidecarState(repoRoot);
    const files = filesArg
      .split(',')
      .map((s) => s.trim().replace(/^@/, ''))
      .filter(Boolean);
    sidecar.tasks[taskId] = {
      ...(sidecar.tasks[taskId] || {}),
      verifiedTouchSet: files,
      updatedAtMs: Date.now()
    };
    saveSidecarState(repoRoot, sidecar);
    console.log(`[OK] Recorded verified Touch-Set for ${taskId} in ${SIDECAR_REL_PATH} (${files.length} files).`);
    return;
  }

  if (args.includes('--link-deps')) {
    const wtIdx = args.indexOf('--link-deps');
    const wtPath = args[wtIdx + 1];
    if (!wtPath) {
      console.error('Usage: gh-board-sync.mjs --link-deps <worktree-path>');
      process.exit(1);
    }
    const res = linkWorktreeDependencies(repoRoot, resolve(wtPath));
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  const report = runBoardSyncStatus(repoRoot, { mock: isMock });
  console.log('=== COGNITIVE PERSISTENCE & REMOTE KANBAN BRIDGE ===');
  console.log(`Mode             : ${report.mode}`);
  console.log(`GitHub Remote    : ${report.remote ? report.remote.slug : 'none (local-only)'}`);
  console.log(`Detected Test Cmd: ${report.testCommand || 'none'}`);
  console.log(`Project Dirs     : ${report.repoDirsCount} indexed`);
  console.log(`Parallel Ready   : ${report.wave.parallelStart.length} task(s)`);
  console.log(`Serialized Queue : ${report.wave.serializedBehind.length} task(s)`);
  console.log(`Safe Inbox Pull  : ${report.inboxPlan.imported.length} new / ${report.inboxPlan.deferredOnGithub.length} deferred`);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

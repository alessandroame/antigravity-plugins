#!/usr/bin/env node

/**
 * Git Diff Triage, Test-Tamper & Faux-Test CLI Auditor
 * Inspects working tree or branch Git diffs to detect modified/deleted test assertions,
 * tautological faux-tests, and high-risk lines (state, I/O, unsafe sinks, error handling)
 * so human and subagent reviewers skip mechanical noise.
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { analyzeGitDiffForReview } from '../core/review-guard-engine.mjs';

const safetyTimer = setTimeout(() => {
  console.error('[FATAL TIMEOUT] diff-triage.mjs exceeded 45s safety ceiling.');
  process.exit(1);
}, 45000);
safetyTimer.unref();

function parseCliArgs(argv) {
  const opts = {
    repo: process.cwd(),
    stagedOnly: false,
    baseRef: 'HEAD',
    allowTestEdits: false,
    json: false,
    maxHighlights: 20
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--repo' && argv[i + 1]) {
      opts.repo = resolve(argv[++i]);
    } else if (arg === '--staged') {
      opts.stagedOnly = true;
    } else if (arg === '--base' && argv[i + 1]) {
      opts.baseRef = argv[++i];
    } else if (arg === '--allow-test-edits') {
      opts.allowTestEdits = true;
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--max' && argv[i + 1]) {
      opts.maxHighlights = Math.max(5, parseInt(argv[++i], 10) || 20);
    }
  }
  return opts;
}

export function collectWorkspaceGitDiff(repoPath, options = {}) {
  const gitArgs = options.stagedOnly
    ? ['diff', '--cached', '--unified=1']
    : ['diff', options.baseRef || 'HEAD', '--unified=1'];

  const res = spawnSync('git', gitArgs, {
    cwd: repoPath,
    encoding: 'utf-8',
    timeout: 15000,
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true
  });

  if (res.status !== 0 && !res.stdout) {
    // Fallback for repos without commits yet
    const fallback = spawnSync('git', ['diff', '--unified=1'], {
      cwd: repoPath,
      encoding: 'utf-8',
      timeout: 15000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    });
    return fallback.stdout || '';
  }

  return res.stdout || '';
}

function printHumanReport(report, repoPath) {
  console.log(`=== DIFF TRIAGE & TEST INTEGRITY AUDIT (${report.status}) ===`);
  console.log(`Repository          : ${repoPath}`);
  console.log(`Modified Files      : ${report.summary.filesChanged}`);
  console.log(
    `Lines to Inspect    : ${report.summary.criticalHighlightCount} critical / ${report.summary.totalChangedLines} total (-${report.summary.reductionPercent}% noise)`
  );

  if (report.testTamperAlerts.length > 0) {
    console.log('\n[TEST TAMPER ALERTS]');
    for (const alert of report.testTamperAlerts) {
      console.log(` - [${alert.severity}] ${alert.message}`);
    }
  }

  if (report.fauxTestAlerts.length > 0) {
    console.log('\n[FAUX-TEST / SELF-MATCHING ALERTS]');
    for (const alert of report.fauxTestAlerts) {
      console.log(` - [${alert.type}] ${alert.file}:${alert.line} -> ${alert.snippet}`);
    }
  }

  if (report.criticalHighlights.length > 0) {
    console.log('\n[CRITICAL LINES REQUIRING REVIEW]');
    for (const hl of report.criticalHighlights) {
      console.log(` - [${hl.tag}] ${hl.file}:${hl.line} -> ${hl.snippet}`);
    }
  } else {
    console.log('\nNo high-risk state, I/O, or error-handling mutations detected in diff.');
  }
}

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  const diffText = collectWorkspaceGitDiff(opts.repo, opts);
  const report = analyzeGitDiffForReview(diffText, {
    allowTestEdits: opts.allowTestEdits,
    maxHighlights: opts.maxHighlights
  });

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report, opts.repo);
  }

  if (report.status === 'BLOCK') {
    process.exit(2);
  }
  process.exit(0);
}

const isDirectEntry =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectEntry) {
  main();
}

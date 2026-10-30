#!/usr/bin/env node

/**
 * Unified Static Validator & Auto-Discovered Unit Test Runner
 * Executes `scripts/validate.mjs --all` followed by `node --test` across ALL
 * `*.test.mjs` / `*.spec.mjs` files in `tests/` and `plugins/` (zero hardcoded lists).
 */

import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverRepositoryTestFiles } from '../plugins/engineering-workflow/core/review-guard-engine.mjs';

const safetyTimer = setTimeout(() => {
  console.error('[FATAL TIMEOUT] run-all-tests.mjs exceeded 45s safety ceiling.');
  process.exit(1);
}, 45000);
safetyTimer.unref();

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function main() {
  const validateScript = join(repoRoot, 'scripts', 'validate.mjs');
  console.log('=== [1/2] Static Plugin & Cognitive Governance Validation ===');
  const valRes = spawnSync(process.execPath, [validateScript, '--all'], {
    cwd: repoRoot,
    stdio: 'inherit',
    timeout: 20000
  });
  if (valRes.status !== 0) {
    process.exit(valRes.status ?? 1);
  }

  const testFiles = discoverRepositoryTestFiles(repoRoot);
  console.log(`=== [2/2] Auto-Discovered Unit Test Suites (${testFiles.length} files) ===`);
  for (const tf of testFiles) {
    console.log(` - ${relative(repoRoot, tf).replace(/\\/g, '/')}`);
  }

  if (testFiles.length === 0) {
    console.error('[ERROR] Zero test files discovered in repository.');
    process.exit(1);
  }

  const testRes = spawnSync(process.execPath, ['--test', ...testFiles], {
    cwd: repoRoot,
    stdio: 'inherit',
    timeout: 25000
  });

  process.exit(testRes.status ?? 1);
}

main();

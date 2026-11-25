import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DISCOVERY_PROFILES,
  EXIT_REASONS,
  buildDiscoveryVerdict,
  computeHypothesisDuplicateRate,
  computeParetoFrontier,
  createBlindVariantBatch,
  createDiscoveryBrief,
  dominates,
  evaluateOracleGate,
  evaluateStopCondition,
  renderDiscoveryReportMarkdown,
  sanitizeDiscoveryText,
  sanitizeVariantForBlindJudge,
  validateDiscoveryBrief
} from '../core/discovery-engine.mjs';
import { validateMarkdownHygiene } from '../../../scripts/validate.mjs';

describe('Oracle Alpha (Technical Purity, Math & Contracts — discovery-engine)', () => {
  it('T1: maintains 100% headless isolation in core/discovery-engine.mjs', () => {
    const src = readFileSync(new URL('../core/discovery-engine.mjs', import.meta.url), 'utf-8');
    const forbiddenTokens = [
      'window',
      'document',
      'HTMLElement',
      'navigator',
      'localStorage',
      'node:fs',
      'node:os',
      'fetch('
    ];
    for (const tok of forbiddenTokens) {
      assert.equal(src.includes(tok), false, `Headless core must not reference '${tok}'`);
    }
  });

  it('T2: builds and validates discovery briefs across quick, deep, and overnight profiles', () => {
    for (const profile of ['quick', 'deep', 'overnight']) {
      const brief = createDiscoveryBrief({
        goal: 'Improve routing precision',
        targetScope: ['plugins/skizzo/scripts/triage.mjs'],
        profile,
        createdAt: '2026-11-25T00:00:00.000Z'
      });
      assert.equal(brief.profile, profile);
      assert.deepEqual(brief.stopPolicy, DISCOVERY_PROFILES[profile]);
      const check = validateDiscoveryBrief(brief);
      assert.equal(check.valid, true, check.errors.join('; '));
    }

    const emptyGoal = createDiscoveryBrief({ goal: '', targetScope: ['a.mjs'] });
    assert.equal(validateDiscoveryBrief(emptyGoal).valid, false);

    const hardcodedPath = createDiscoveryBrief({
      goal: 'Valid goal',
      targetScope: ['C:/Users/aless/project/file.mjs']
    });
    const pathCheck = validateDiscoveryBrief(hardcodedPath);
    assert.equal(pathCheck.valid, false);
    assert.ok(pathCheck.errors.some((e) => e.includes('hardcoded user path')));
  });

  it('T3: strips mutator identity, worktree names, and banners before deterministic blind batching', () => {
    const variants = [
      {
        id: 'var-1',
        mutatorArchetype: 'distracted-user',
        worktreeBranch: 'worktree/var-1',
        summary:
          'Utente Distratto proposal on worktree/var-1 with branch: feat/x and [Alpha](conversation://abc123).',
        diffSummary: 'Autore: Mutatore A\nbranch=worktree-var-1\nClean diff summary.',
        renderedArtifacts: ['> [!IMPORTANT]\n> MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK`)\n\nRendered UI'],
        metrics: { empiricalScore: 0.85, complexityCost: 0.9 }
      },
      {
        id: 'var-2',
        mutatorArchetype: 'extreme-abolitionist',
        worktreeBranch: 'worktree/var-2',
        summary: 'Abolizionista cuts 45% controls via mutator-abolitionist.',
        diffSummary: 'Minimal patch.',
        metrics: { empiricalScore: 0.8, complexityCost: 0.5 }
      },
      {
        id: 'var-3',
        mutatorArchetype: 'domain-skeptic',
        worktreeBranch: 'worktree/var-3',
        summary: 'Scettico / Fuzzer checks null model.',
        diffSummary: 'Edge case fix.',
        metrics: { empiricalScore: 0.9, complexityCost: 1.0 }
      }
    ];

    const sanitizedText = sanitizeDiscoveryText(variants[0].summary);
    assert.equal(/Utente Distratto|worktree|conversation:\/\//i.test(sanitizedText), false);

    const cleanSingle = sanitizeVariantForBlindJudge(variants[0]);
    assert.equal('id' in cleanSingle, false);
    assert.equal('mutatorArchetype' in cleanSingle, false);
    assert.equal('worktreeBranch' in cleanSingle, false);

    const batch1 = createBlindVariantBatch(variants, 'fixed-seed-99');
    const batch2 = createBlindVariantBatch(variants, 'fixed-seed-99');
    assert.deepEqual(batch1, batch2);
    assert.deepEqual(
      batch1.blindCandidates.map((c) => c.blindLabel),
      ['Candidato A', 'Candidato B', 'Candidato C']
    );
    assert.deepEqual(Object.values(batch1.revealMap).sort(), ['var-1', 'var-2', 'var-3']);

    assert.throws(() => createBlindVariantBatch([{ id: '' }]), TypeError);
    assert.throws(() => createBlindVariantBatch([{ id: 'dup' }, { id: 'dup' }]), RangeError);
  });

  it('T4: filters variants failing any blocking oracle or technical sub-invariant', () => {
    const brief = createDiscoveryBrief({ goal: 'Test gate', targetScope: ['a.mjs'] });
    const passing = evaluateOracleGate(
      {
        id: 'ok-1',
        oracles: {
          'empirical-data': { passed: true },
          'invariance-fuzzing': { passed: true },
          'blind-cognitive': { passed: true },
          'technical-ab-bench': { passed: true }
        },
        technicalChecks: { testsPassed: true, probeViolations: 0, diffTamperCount: 0, invarianceFailures: 0 }
      },
      brief
    );
    assert.equal(passing.passedAllBlocking, true);
    assert.equal(passing.rejected, false);
    assert.equal(passing.passedOracleCount, 4);

    const failing = evaluateOracleGate(
      {
        id: 'bad-1',
        oracles: {
          'empirical-data': { passed: false, reason: 'Worse than baseline' },
          'invariance-fuzzing': { passed: true },
          'blind-cognitive': { passed: false, reason: 'Confused observer' },
          'technical-ab-bench': { passed: true }
        },
        technicalChecks: { testsPassed: false, probeViolations: 2, diffTamperCount: 1, invarianceFailures: 1 }
      },
      brief
    );
    assert.equal(failing.passedAllBlocking, false);
    assert.equal(failing.rejected, true);
    assert.ok(failing.failedBlockingOracles.includes('empirical-data'));
    assert.ok(failing.failedBlockingOracles.includes('blind-cognitive'));
    assert.ok(failing.failedBlockingOracles.includes('technical-ab-bench'));
    assert.ok(failing.failedBlockingOracles.includes('invariance-fuzzing'));
    assert.ok(failing.rejectionReasons.length >= 4);
  });

  it('T5: enforces mathematical Pareto dominance and baseline improvement delta', () => {
    const objectives = [
      { key: 'empiricalScore', direction: 'higher' },
      { key: 'complexityCost', direction: 'lower' }
    ];
    const baseline = { metrics: { empiricalScore: 0.7, complexityCost: 1.0 } };

    const a = { id: 'high-accuracy', metrics: { empiricalScore: 0.9, complexityCost: 0.9 } };
    const b = { id: 'low-cost', metrics: { empiricalScore: 0.8, complexityCost: 0.5 } };
    const c = { id: 'dominated', metrics: { empiricalScore: 0.75, complexityCost: 0.95 } };

    assert.equal(dominates(a, c, objectives), true);
    assert.equal(dominates(a, b, objectives), false);
    assert.equal(dominates(b, a, objectives), false);

    const res = computeParetoFrontier([a, b, c], objectives, baseline);
    assert.deepEqual(res.frontierIds.sort(), ['high-accuracy', 'low-cost']);
    assert.deepEqual(res.dominated.map((d) => d.id), ['dominated']);
    assert.equal(res.frontier[0].paretoRank, 1);
    assert.equal(res.dominated[0].paretoRank, 2);
    assert.ok(res.bestImprovementOverBaseline > 0);
  });

  it('T6: evaluates all 6 composite stop-policy outcomes including Jaccard duplicate collapse', () => {
    const policy = DISCOVERY_PROFILES.deep;

    assert.equal(
      evaluateStopCondition({ wavesCompleted: 1, elapsedMs: 60000 }, policy).exitReason,
      EXIT_REASONS.CONTINUE
    );
    assert.equal(
      evaluateStopCondition({ wavesCompleted: 2, consecutiveStagnantWaves: 2 }, policy).exitReason,
      EXIT_REASONS.PARETO_CONVERGED
    );
    assert.equal(
      evaluateStopCondition({ wavesCompleted: 1, satisficingOrthogonalCount: 2 }, policy).exitReason,
      EXIT_REASONS.TARGET_SATISFICED
    );
    const budgetStop = evaluateStopCondition({ wavesCompleted: 4, variantsPrototyped: 8 }, policy);
    assert.equal(budgetStop.exitReason, EXIT_REASONS.RESOURCE_BUDGET_REACHED);
    assert.ok(budgetStop.triggeredLimits.includes('maxWaves'));
    assert.ok(budgetStop.triggeredLimits.includes('maxVariants'));

    const dedupe = computeHypothesisDuplicateRate(
      [
        { id: 'h1', claim: 'simplify fast pass classification rule on short prompts' },
        { id: 'h2', claim: 'simplify fast pass classification rule on short prompts' },
        { id: 'h3', claim: 'simplify fast pass classification rule on short prompts' },
        { id: 'h4', claim: 'add separate fallback metric guard for long prompts' }
      ],
      [],
      0.7
    );
    assert.equal(dedupe.duplicates, 2);
    assert.equal(dedupe.duplicateRate, 0.5);

    const dedupeCollapse = computeHypothesisDuplicateRate(
      [
        { id: 'h1', claim: 'simplify fast pass classification rule' },
        { id: 'h2', claim: 'simplify fast pass classification rule' },
        { id: 'h3', claim: 'simplify fast pass classification rule' },
        { id: 'h4', claim: 'simplify fast pass classification rule' }
      ],
      [],
      0.7
    );
    assert.equal(dedupeCollapse.duplicateRate, 0.75);
    assert.equal(
      evaluateStopCondition(
        {
          wavesCompleted: 1,
          lastWaveHypothesisCount: dedupeCollapse.total,
          lastWaveDuplicateRate: dedupeCollapse.duplicateRate
        },
        policy
      ).exitReason,
      EXIT_REASONS.YIELD_COLLAPSE
    );
    assert.equal(
      evaluateStopCondition({ wavesCompleted: 2, consecutiveZeroYieldWaves: 2 }, policy).exitReason,
      EXIT_REASONS.YIELD_COLLAPSE
    );
    assert.equal(
      evaluateStopCondition({ elapsedMs: policy.maxWallClockMinutes * 60000 }, policy).exitReason,
      EXIT_REASONS.WALL_CLOCK_CAP
    );
  });
});

describe('Oracle Beta (Ergonomics, CLI End-to-End & Workflow Template)', () => {
  it('B1: renders compliant ~600px Italian Semantic Drill-Down with zero hygiene errors', () => {
    const brief = createDiscoveryBrief({
      goal: 'Improve triage accuracy',
      targetScope: ['plugins/skizzo/scripts/triage.mjs'],
      profile: 'quick',
      baseline: { metrics: { empiricalScore: 0.7, complexityCost: 1 } }
    });
    const variants = [
      {
        id: 'v-pass',
        mutatorArchetype: 'distracted-user',
        worktreeBranch: 'share/v-pass',
        fiveFingerScore: 5,
        metrics: { empiricalScore: 0.9, complexityCost: 0.8 },
        oracles: {
          'empirical-data': { passed: true },
          'invariance-fuzzing': { passed: true },
          'blind-cognitive': { passed: true },
          'technical-ab-bench': { passed: true }
        }
      },
      {
        id: 'v-reject',
        mutatorArchetype: 'domain-skeptic',
        oracles: {
          'empirical-data': { passed: false, reason: 'Regression' },
          'invariance-fuzzing': { passed: true },
          'blind-cognitive': { passed: true },
          'technical-ab-bench': { passed: true }
        }
      }
    ];
    const verdict = buildDiscoveryVerdict({
      brief,
      runState: { wavesCompleted: 1, satisficingOrthogonalCount: 1, elapsedMs: 45000 },
      variants,
      blindReveal: { 'Candidato A': 'v-pass' }
    });
    assert.equal(verdict.mainBranchUntouched, true);
    assert.equal(verdict.funnel.rejectionRatePct, 50);

    const md = renderDiscoveryReportMarkdown(verdict);
    const [l0] = md.split('<details>');
    assert.ok(l0.trim().split('\n').length <= 12);
    assert.ok(/<\/summary>\n\n\|/.test(md));
    assert.ok(/\n\n<details>\n<summary><strong>Audit Varianti Scartate/.test(md));
    const hygiene = validateMarkdownHygiene(md, 'discovery-report.md');
    assert.deepEqual(hygiene, []);
  });

  it('B2: executes discovery.mjs CLI end-to-end across all subcommands offline', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'discovery-cli-test-'));
    try {
      const cliPath = join(process.cwd(), 'plugins', 'ab-bench', 'scripts', 'discovery.mjs');
      const briefPath = join(tmp, 'brief.json');
      const statePath = join(tmp, 'state.json');
      const hypPath = join(tmp, 'hyps.json');
      const varPath = join(tmp, 'vars.json');
      const batchPath = join(tmp, 'batch.json');
      const verdictPath = join(tmp, 'verdict.json');
      const reportPath = join(tmp, 'report.md');

      const initRes = spawnSync(
        process.execPath,
        [cliPath, '--init-brief', '--goal', 'Test CLI', '--scope', 'a.mjs', '--profile', 'quick', '--out', briefPath],
        { encoding: 'utf-8' }
      );
      assert.equal(initRes.status, 0, initRes.stderr);
      assert.equal(existsSync(briefPath), true);

      writeFileSync(hypPath, JSON.stringify([{ id: 'h1', claim: 'clean cache handler' }]), 'utf-8');
      const dedupeRes = spawnSync(process.execPath, [cliPath, '--dedupe', '--hypotheses', hypPath], {
        encoding: 'utf-8'
      });
      assert.equal(dedupeRes.status, 0, dedupeRes.stderr);
      assert.equal(JSON.parse(dedupeRes.stdout).total, 1);

      writeFileSync(statePath, JSON.stringify({ wavesCompleted: 1, satisficingOrthogonalCount: 1 }), 'utf-8');
      const stopRes = spawnSync(
        process.execPath,
        [cliPath, '--check-stop', '--brief', briefPath, '--state', statePath],
        { encoding: 'utf-8' }
      );
      assert.equal(stopRes.status, 0, stopRes.stderr);
      assert.equal(JSON.parse(stopRes.stdout).exitReason, EXIT_REASONS.TARGET_SATISFICED);

      writeFileSync(
        varPath,
        JSON.stringify([
          {
            id: 'v1',
            mutatorArchetype: 'extreme-abolitionist',
            summary: 'Minimal fix',
            candidateFingers: [1, 1, 1, 1, 1],
            metrics: { empiricalScore: 0.9, complexityCost: 0.6 },
            oracles: {
              'empirical-data': { passed: true },
              'invariance-fuzzing': { passed: true },
              'blind-cognitive': { passed: true },
              'technical-ab-bench': { passed: true }
            }
          }
        ]),
        'utf-8'
      );
      const batchRes = spawnSync(
        process.execPath,
        [cliPath, '--sanitize-batch', '--variants', varPath, '--seed', 's1', '--out', batchPath],
        { encoding: 'utf-8' }
      );
      assert.equal(batchRes.status, 0, batchRes.stderr);

      const evalRes = spawnSync(
        process.execPath,
        [
          cliPath,
          '--evaluate',
          '--brief',
          briefPath,
          '--state',
          statePath,
          '--variants',
          varPath,
          '--reveal',
          batchPath,
          '--out-verdict',
          verdictPath,
          '--out-report',
          reportPath,
          '--json'
        ],
        { encoding: 'utf-8' }
      );
      assert.equal(evalRes.status, 0, evalRes.stderr);
      assert.equal(existsSync(verdictPath), true);
      assert.equal(existsSync(reportPath), true);

      const demoDir = join(tmp, 'demo');
      const demoRes = spawnSync(process.execPath, [cliPath, '--pilot-demo', '--out-dir', demoDir], {
        encoding: 'utf-8'
      });
      assert.equal(demoRes.status, 0, demoRes.stderr);
      const parsedDemo = JSON.parse(demoRes.stdout);
      assert.equal(parsedDemo.verdict.mainBranchUntouched, true);
      assert.equal(existsSync(join(demoDir, 'discovery-report.md')), true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('B3: verifies run_workflow Python template primitives and fail-safe wrappers', () => {
    const pyPath = join(
      process.cwd(),
      'plugins',
      'ab-bench',
      'references',
      'discovery_workflow_template.py'
    );
    const pySrc = readFileSync(pyPath, 'utf-8');
    for (const token of [
      'phase(',
      'parallel(',
      'agent(',
      'workspace=',
      'schema=',
      'try:',
      'except Exception',
      '"worktree", "remove"',
      '"worktree", "prune"',
      'patches',
      'linesAdded'
    ]) {
      assert.ok(pySrc.includes(token), `Python template missing '${token}'`);
    }
    assert.equal(/[cC]:[\\/]+Users[\\/]+(?!<)[a-zA-Z0-9._-]+[\\/]/.test(pySrc), false);
  });
});

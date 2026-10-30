import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  aggregateCrossSessionBottlenecks,
  analyzeSessionTrajectory,
  parseSessionTrajectoryFromJsonl
} from '../core/trajectory-analyzer.mjs';
import {
  buildDecisionProposal,
  routeBottleneckToPrimitive
} from '../core/primitive-router.mjs';
import {
  authorizeDecisionExecution,
  createInitialMasteryState,
  evaluatePostAdoptionRoi,
  formatDrillDownDecisionReport,
  reconcilePendingDecisions,
  updateOperatorMastery
} from '../core/mastery-ledger.mjs';
import {
  applyApprovedDecision,
  runReadOnlyMapekAnalysis,
  updateDecisionDisposition
} from '../scripts/mapek.mjs';
import { selectReadyDecisionForNotification } from '../scripts/mapek-pre-hook.mjs';
import { shouldTriggerBackgroundMapekScan } from '../scripts/mapek-stop-hook.mjs';
import { validateMarkdownHygiene, validatePlugin } from '../../../scripts/validate.mjs';

describe('MAPE-K Trajectory Process Miner (core/trajectory-analyzer.mjs)', () => {
  it('filters out subagent transcripts at step 0 and parses human JSONL trajectories', () => {
    const subagentJsonl = JSON.stringify({
      type: 'USER_INPUT',
      created_at: '2026-10-30T10:00:00Z',
      content: '<USER_REQUEST>Skill Attive (Alpha - Systems): esegui audit</USER_REQUEST>'
    });
    assert.equal(parseSessionTrajectoryFromJsonl(subagentJsonl, { conversationId: 'sub-1' }), null);

    const humanJsonl = [
      JSON.stringify({
        type: 'USER_INPUT',
        created_at: '2026-10-30T10:00:00Z',
        content: 'Command Working Directory: c:\\github\\glidemind\n<USER_REQUEST>Fixa il layout</USER_REQUEST>'
      }),
      JSON.stringify({
        type: 'PLANNER_RESPONSE',
        created_at: '2026-10-30T10:00:10Z',
        tool_calls: [{ name: 'edit_file', args: { Path: 'c:/github/glidemind/src/ui/map.js' } }],
        token_usage: { input_tokens: 40000, cache_read_tokens: 120000, output_tokens: 1200 }
      })
    ].join('\n');

    const parsed = parseSessionTrajectoryFromJsonl(humanJsonl, { conversationId: 'hum-1' });
    assert.ok(parsed);
    assert.equal(parsed.workspace, 'glidemind');
    assert.equal(parsed.turns.length, 1);
    assert.equal(parsed.peakContextTokens, 160000);
  });

  it('detects PREMATURE_IMPLEMENTATION_LOOP, UNANCHORED_CORRECTION_SPIRAL, and MISSING_VERIFICATION_ORACLE', () => {
    const session = {
      conversationId: 'conv-premature',
      workspace: 'glidemind',
      endedAtMs: 1700000000000,
      turns: [
        {
          userText: 'cambia tutta la schermata principale',
          toolCalls: [
            { name: 'edit_file', args: { Path: 'src/a.js' } },
            { name: 'edit_file', args: { Path: 'src/b.js' } },
            { name: 'edit_file', args: { Path: 'src/c.js' } }
          ]
        },
        {
          userText: 'non va ancora bene, riprova',
          toolCalls: [
            { name: 'edit_file', args: { Path: 'src/a.js' } },
            { name: 'edit_file', args: { Path: 'src/b.js' } }
          ]
        },
        {
          userText: 'ancora rotto, sistema',
          toolCalls: [
            { name: 'edit_file', args: { Path: 'src/a.js' } },
            { name: 'edit_file', args: { Path: 'src/b.js' } }
          ]
        }
      ]
    };

    const res = analyzeSessionTrajectory(session);
    const ids = res.episodes.map((e) => e.detectorId);
    assert.ok(ids.includes('PREMATURE_IMPLEMENTATION_LOOP'));
    assert.ok(ids.includes('UNANCHORED_CORRECTION_SPIRAL'));
    assert.ok(ids.includes('MISSING_VERIFICATION_ORACLE'));
    assert.ok(res.masterySignals.specClarity < 0.5);
    assert.ok(res.masterySignals.verificationDiscipline < 0.5);
  });

  it('detects CONTEXT_ENTROPY_DRIFT and HUMAN_ROUTER_MICROMANAGEMENT and aggregates across workspaces', () => {
    const buildEntropySession = (id, ws) => ({
      conversationId: id,
      workspace: ws,
      endedAtMs: 1700000100000,
      peakContextTokens: 175000,
      turns: Array.from({ length: 22 }, (_, i) => ({
        userText: `fai passo ${i}`,
        toolCalls: [{ name: 'edit_file', args: { Path: `src/mod${i % 2}.mjs` } }],
        inputTokens: 165000
      }))
    });

    const analyzed = [
      analyzeSessionTrajectory(buildEntropySession('s1', 'glidemind')),
      analyzeSessionTrajectory(buildEntropySession('s2', 'parameteo')),
      analyzeSessionTrajectory(buildEntropySession('s3', 'quiz-vds'))
    ];

    const clusters = aggregateCrossSessionBottlenecks(analyzed);
    const entropyCluster = clusters.find((c) => c.detectorId === 'CONTEXT_ENTROPY_DRIFT');
    const routerCluster = clusters.find((c) => c.detectorId === 'HUMAN_ROUTER_MICROMANAGEMENT');
    assert.ok(entropyCluster);
    assert.equal(entropyCluster.distinctWorkspaces, 3);
    assert.ok(routerCluster);
  });
});

describe('MAPE-K Primitive Router & Human-Gated Consent Ledger', () => {
  it('routes bottlenecks to L3, L2c (agents/*.md), L2b (SKILL.md), and PRUNE with rejected alternatives', () => {
    const l2cRoute = routeBottleneckToPrimitive({
      detectorId: 'CONTEXT_ENTROPY_DRIFT',
      requiresIsolatedContext: true
    });
    assert.equal(l2cRoute.targetLevel, 'L2c');
    assert.equal(l2cRoute.rejectedAlternativesIt.length, 2);

    const proposal = buildDecisionProposal(
      {
        detectorId: 'CONTEXT_ENTROPY_DRIFT',
        patternKey: 'process:context-entropy-drift',
        occurrences: 4,
        distinctSessions: 3,
        distinctWorkspaces: 2,
        workspaces: ['glidemind', 'parameteo'],
        totalWastedSeconds: 900,
        totalWastedTurns: 10,
        totalWastedTokens: 280000,
        projectedSavedSeconds15: 420,
        generalizedContract: {
          precondition: 'Peak context > 150k tokens',
          transformation: 'Delegate exploration to isolated subagent',
          falsifiableOracle: 'Peak context stays < 150k tokens'
        }
      },
      l2cRoute,
      1700000000000
    );

    assert.equal(proposal.status, 'PENDING_APPROVAL');
    assert.equal(proposal.requiresExplicitUserApproval, true);
    assert.match(proposal.targetArtifact.relativePath, /^plugins\/mapek\/agents\/.+\.md$/);

    // Ensure generated Drill-Down report passes CommonMark L3 hygiene check
    const reportMd = formatDrillDownDecisionReport({
      sessionsAnalyzed: 12,
      masteryState: createInitialMasteryState(),
      pendingDecisions: [proposal],
      ledgerEntries: []
    });
    const hygieneErrors = validateMarkdownHygiene(reportMd, 'digest.md');
    assert.deepEqual(hygieneErrors, []);
  });

  it('hard-blocks any file write without explicit user approval and executes only when approved', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'mapek-consent-test-'));
    try {
      const analyticsDir = join(tmp, 'analytics');
      const repoRoot = join(tmp, 'repo');
      mkdirSync(analyticsDir, { recursive: true });
      mkdirSync(join(repoRoot, 'plugins', 'mapek'), { recursive: true });
      writeFileSync(join(repoRoot, 'scripts_dummy'), '', 'utf-8');

      const route = routeBottleneckToPrimitive({
        detectorId: 'CONTEXT_ENTROPY_DRIFT',
        requiresIsolatedContext: true
      });
      const proposal = buildDecisionProposal(
        {
          detectorId: 'CONTEXT_ENTROPY_DRIFT',
          patternKey: 'process:context-entropy-drift',
          occurrences: 3,
          distinctSessions: 3,
          distinctWorkspaces: 2,
          workspaces: ['a', 'b'],
          totalWastedSeconds: 600,
          totalWastedTurns: 6,
          totalWastedTokens: 180000,
          projectedSavedSeconds15: 300
        },
        route,
        1700000000000
      );

      writeFileSync(
        join(analyticsDir, 'mapek-pending-decisions.json'),
        JSON.stringify({ schemaVersion: 1, decisions: [proposal] }, null, 2),
        'utf-8'
      );

      // 1. Attempt execution WITHOUT explicitUserApproval -> MUST FAIL with zero files created
      const blocked = applyApprovedDecision(proposal.decisionId, {
        explicitUserApproval: false,
        analyticsDir,
        repoRoot,
        skipGlobalSync: true
      });
      assert.equal(blocked.ok, false);
      assert.match(blocked.error, /HUMAN_CONSENT_REQUIRED/);
      assert.equal(existsSync(join(repoRoot, proposal.targetArtifact.relativePath)), false);

      // 2. Execute WITH explicitUserApproval: true -> MUST SUCCEED and record ACTIVE in ledger
      const approved = applyApprovedDecision(proposal.decisionId, {
        explicitUserApproval: true,
        analyticsDir,
        repoRoot,
        skipGlobalSync: true,
        nowMs: 1700000500000
      });
      assert.equal(approved.ok, true);
      assert.equal(existsSync(join(repoRoot, proposal.targetArtifact.relativePath)), true);

      const ledger = JSON.parse(readFileSync(join(analyticsDir, 'process-ledger.json'), 'utf-8'));
      assert.equal(ledger.entries.length, 1);
      assert.equal(ledger.entries[0].status, 'ACTIVE');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('tracks EMA operator mastery, enforces 30-day reject cooldown, and flags stale rules after 10 sessions', () => {
    const healthySessions = Array.from({ length: 6 }, (_, i) => ({
      conversationId: `ok-${i}`,
      endedAtMs: 1700000000000 + i * 1000,
      episodes: [],
      masterySignals: {
        specClarity: 1,
        verificationDiscipline: 1,
        contextHygiene: 1,
        delegationLeverage: 1,
        deterministicDebugging: 1
      }
    }));

    const mastery = updateOperatorMastery(createInitialMasteryState(), healthySessions);
    assert.equal(mastery.dimensions.specClarity.band, 'MASTERED');
    assert.ok(mastery.dimensions.specClarity.score >= 0.85);

    // Post-adoption ROI check: active artifact fails to reduce friction across 10 post-adoption sessions
    const activeLedger = [
      {
        decisionId: 'mapek-stale01',
        patternKey: 'process:missing-verification-oracle',
        detectorId: 'MISSING_VERIFICATION_ORACLE',
        targetLevel: 'L3',
        targetArtifact: { relativePath: 'plugins/mapek/scripts/guards/test-guard.mjs' },
        baselineFrictionRate: 0.3,
        status: 'ACTIVE',
        approvedAtMs: 1700000000000
      }
    ];
    const postSessions = Array.from({ length: 10 }, (_, i) => ({
      conversationId: `post-${i}`,
      endedAtMs: 1700000100000 + i * 1000,
      episodes: i < 4 ? [{ detectorId: 'MISSING_VERIFICATION_ORACLE' }] : []
    }));

    const roi = evaluatePostAdoptionRoi(activeLedger, postSessions);
    assert.equal(roi.updatedLedger[0].efficacyStatus, 'STALE_CANDIDATE');
    assert.equal(roi.pruningClusters.length, 1);
    assert.equal(roi.pruningClusters[0].isStaleArtifact, true);

    // Pre-hook notification cooldown & snooze behavior
    const ready = selectReadyDecisionForNotification(
      [{ decisionId: 'd1', status: 'PENDING_APPROVAL', snoozedUntilMs: 0, lastNotifiedAtMs: 0 }],
      1700000000000
    );
    assert.equal(ready.decisionId, 'd1');
    const suppressed = selectReadyDecisionForNotification(
      [{ decisionId: 'd1', status: 'PENDING_APPROVAL', snoozedUntilMs: 1700009999999, lastNotifiedAtMs: 0 }],
      1700000000000
    );
    assert.equal(suppressed, null);
    assert.equal(shouldTriggerBackgroundMapekScan({ lastAnalysisAtMs: 0 }).shouldTrigger, true);
  });
});

describe('Static Validator Extensions: L2c agents/*.md & CommonMark <details> Nesting', () => {
  it('catches >= 4-space indented <details>, > 2 nesting depth, and unclosed <details>', () => {
    const brokenMd = [
      '    <details>',
      '<summary>Indented</summary>',
      '',
      'Test',
      '</details>'
    ].join('\n');
    const errs = validateMarkdownHygiene(brokenMd, 'broken.md');
    assert.ok(errs.some((e) => e.includes('indentato di >= 4 spazi')));

    const tooDeepMd = [
      '<details>',
      '<summary>L1</summary>',
      '',
      '<details>',
      '<summary>L2</summary>',
      '',
      '<details>',
      '<summary>L3</summary>',
      '',
      'Body',
      '',
      '</details>',
      '',
      '</details>',
      '',
      '</details>'
    ].join('\n');
    const deepErrs = validateMarkdownHygiene(tooDeepMd, 'deep.md');
    assert.ok(deepErrs.some((e) => e.includes('oltre il limite massimo di 2 livelli')));
  });

  it('validates plugins/*/agents/*.md frontmatter and blocks built-in subagent collisions', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'agy-agent-val-'));
    try {
      const pDir = join(tmp, 'sample-plugin');
      mkdirSync(join(pDir, 'agents'), { recursive: true });
      writeFileSync(
        join(pDir, 'plugin.json'),
        JSON.stringify({ name: 'sample-plugin', description: 'Test plugin', version: '1.0.0' }),
        'utf-8'
      );
      writeFileSync(join(pDir, 'README.md'), '# Sample\n', 'utf-8');
      writeFileSync(
        join(pDir, 'agents', 'bad-agent.md'),
        ['---', 'name: research', 'description: "Too short"', 'tools:', '---', '', '# Body'].join('\n'),
        'utf-8'
      );

      const res = validatePlugin(pDir);
      assert.ok(res.errors.some((e) => e.includes("collisione P0 con subagent Built-in Antigravity 'research'")));
      assert.ok(res.errors.some((e) => e.includes('"description" mancante o troppo breve')));
      assert.ok(res.errors.some((e) => e.includes('"tools" deve essere una lista YAML non vuota')));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

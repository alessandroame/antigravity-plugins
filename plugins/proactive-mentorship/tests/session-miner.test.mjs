import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  classifySelfLearningCandidate,
  analyzeSessionTranscripts,
  resolveCatalogRepoRoot,
  verifyAndSyncGlobalPlugins,
  inspectCatalogGitOutboundStatus
} from '../scripts/session-miner.mjs';
import {
  readGitHeadSha,
  computeCatalogFingerprint
} from '../../../scripts/sync-to-global.mjs';
import {
  evaluateCrossMachineSyncNeed
} from '../../telemetry-analytics/scripts/eta-injector.mjs';

describe('Session Pattern & Cross-Workspace Self-Learning Engine (Alpha Technical & Beta Domain Oracles)', () => {
  it('routes recurring visual/numeric regressions to L3_INVARIANT_GUARD with crossRepoTarget', () => {
    const res = classifySelfLearningCandidate(
      'nel render in modalità regia avviene ancora che il parapendio sparisca.. inoltre le inquadrature mi paiono troppo ravvicinate'
    );
    assert.equal(res.shouldLearn, true);
    assert.equal(res.ladderLevel, 'L3');
    assert.equal(res.category, 'L3_INVARIANT_GUARD');
    assert.equal(res.crossRepoTarget, 'c:/github/antigravity-plugins');
    assert.match(res.targetPluginHint, /engineering-workflow/);
  });

  it('routes experience-to-skill workflow prompts to L2b or L3 skill/rule evolution', () => {
    const res = classifySelfLearningCandidate(
      'Vedo dei flussi dove periodicamente aggiorno le skill in base all\'esperienza svolta in una sessione. in generale sarei orientato al tuo auto apprendimento'
    );
    assert.equal(res.shouldLearn, true);
    assert.ok(['L2b', 'L3'].includes(res.ladderLevel));
    assert.equal(res.category, 'L2_SKILL_OR_RULE_EVOLUTION');
    assert.equal(res.crossRepoTarget, 'c:/github/antigravity-plugins');
  });

  it('keeps routine operational prompts at L0 with shouldLearn = false', () => {
    for (const routine of ['start server', 'git status', '', null]) {
      const res = classifySelfLearningCandidate(routine);
      assert.equal(res.shouldLearn, false);
      assert.equal(res.ladderLevel, 'L0');
      assert.equal(res.category, 'NONE');
    }
  });

  it('resolves the canonical antigravity-plugins catalog root from any workspace and supports dryRun verification', () => {
    const root = resolveCatalogRepoRoot();
    assert.match(root.replace(/\\/g, '/').toLowerCase(), /antigravity-plugins$/);

    const dry = verifyAndSyncGlobalPlugins({ dryRun: true });
    assert.equal(dry.ok, true);
    assert.equal(dry.steps[0].step, 'dry_run');
  });

  it('aggregates parent sessions, filters out subagents, and extracts learning candidates', () => {
    const mockSessions = [
      {
        id: 'session-parent-1',
        isSubagent: false,
        userPrompts: [
          '/skizzo valutare se rendere la modalità skizzo implicita e aggiornare le skill in base all\'esperienza',
          'in generale sarei orientato al tuo auto apprendimento'
        ]
      },
      {
        id: 'session-parent-2',
        isSubagent: false,
        userPrompts: [
          '/skizzo nel replay 3d avviene ancora che la vela sparisca',
          'è possibile eseguire un test sul replay 3d? non agire è solo una domanda',
          'aggiorna i plugins'
        ]
      },
      {
        id: 'session-subagent-alpha',
        isSubagent: true,
        userPrompts: ['Skill Attive (Alpha): plugin-analytics']
      }
    ];

    const summary = analyzeSessionTranscripts(mockSessions);
    assert.equal(summary.totalParentSessions, 2);
    assert.equal(summary.skippedSubagentSessions, 1);
    assert.equal(summary.totalUserTurns, 5);
    assert.equal(summary.explicitSkizzoSessions, 2);
    assert.equal(summary.skizzoSessionRatePct, 100);
    assert.ok(summary.patternCounts.sessionToPluginEvolution >= 2);
    assert.equal(summary.patternCounts.repeatedRegressionOrFriction, 1);
    assert.equal(summary.patternCounts.readonlyQuestionWithClause, 1);
    assert.equal(summary.patternCounts.crossRepoSync, 1);
    assert.ok(summary.learningCandidates.length >= 2);
  });

  it('evaluates cross-machine and cross-workspace sync need via HEAD SHA and TTL', () => {
    const root = resolveCatalogRepoRoot();
    const sha = readGitHeadSha(root);
    assert.match(sha, /^[0-9a-f]{40}$/);

    const fp = computeCatalogFingerprint(root);
    assert.equal(fp.headSha, sha);
    assert.ok(fp.fileCount > 10);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-sync-test-'));
    const stateFile = path.join(tmpDir, 'plugin-sync-state.json');
    const nowMs = 1700000000000;

    // 1. Missing state -> immediate sync + pull
    const d1 = evaluateCrossMachineSyncNeed({ repoRoot: root, stateFile, nowMs });
    assert.equal(d1.shouldSyncNow, true);
    assert.equal(d1.shouldSpawnBackgroundPull, true);
    assert.equal(d1.reason, 'initial-state-missing');

    // 2. Matching HEAD within 30m TTL -> no sync needed
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ headSha: sha, lastCheckAtMs: nowMs - 5 * 60 * 1000 }),
      'utf-8'
    );
    const d2 = evaluateCrossMachineSyncNeed({ repoRoot: root, stateFile, nowMs });
    assert.equal(d2.shouldSyncNow, false);
    assert.equal(d2.shouldSpawnBackgroundPull, false);
    assert.equal(d2.reason, 'up-to-date-within-ttl');

    // 3. Matching HEAD but TTL expired (> 30m) -> spawn background git pull --ff-only
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ headSha: sha, lastCheckAtMs: nowMs - 45 * 60 * 1000 }),
      'utf-8'
    );
    const d3 = evaluateCrossMachineSyncNeed({ repoRoot: root, stateFile, nowMs });
    assert.equal(d3.shouldSyncNow, false);
    assert.equal(d3.shouldSpawnBackgroundPull, true);
    assert.equal(d3.reason, 'ttl-expired-remote-check');

    // 4. Local HEAD SHA changed -> immediate sync
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ headSha: '0000000000000000000000000000000000000000', lastCheckAtMs: nowMs }),
      'utf-8'
    );
    const d4 = evaluateCrossMachineSyncNeed({ repoRoot: root, stateFile, nowMs });
    assert.equal(d4.shouldSyncNow, true);
    assert.equal(d4.reason, 'local-head-changed');

    const outbound = inspectCatalogGitOutboundStatus(root);
    assert.equal(typeof outbound.dirty, 'boolean');
    assert.equal(typeof outbound.uncommittedCount, 'number');
    assert.equal(typeof outbound.unpushedCount, 'number');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

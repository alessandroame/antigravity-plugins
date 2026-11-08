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
  inspectCatalogGitOutboundStatus,
  evaluatePromptForPreventiveReview,
  discoverUnifiedBrainSessions,
  recordCloudTurnEvent
} from '../scripts/session-miner.mjs';
import {
  readGitHeadSha,
  computeCatalogFingerprint,
  syncPluginsToGlobal,
  buildCloudBootstrapContent
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

  it('synchronizes plugins, skills, config.json, and CLOUD_BOOTSTRAP.md into isolated target directories', () => {
    const root = resolveCatalogRepoRoot();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-cloud-sync-'));
    const globalPluginsDir = path.join(tmpDir, 'config', 'plugins');
    const globalSkillsDir = path.join(tmpDir, 'skills');
    const globalConfigFile = path.join(tmpDir, 'config', 'config.json');
    const cloudBootstrapFile = path.join(tmpDir, 'CLOUD_BOOTSTRAP.md');
    const stateFile = path.join(tmpDir, 'analytics', 'plugin-sync-state.json');

    const res = syncPluginsToGlobal({
      repoRoot: root,
      globalPluginsDir,
      globalSkillsDir,
      globalConfigFile,
      cloudBootstrapFile,
      stateFile,
      quiet: true
    });

    assert.equal(res.synced, true);
    assert.ok(res.syncedCount >= 15);
    assert.ok(res.syncedSkillsCount >= 32);
    assert.equal(fs.existsSync(path.join(globalSkillsDir, 'model-router', 'SKILL.md')), true);
    assert.equal(fs.existsSync(globalConfigFile), true);
    assert.equal(fs.existsSync(cloudBootstrapFile), true);

    const cfg = JSON.parse(fs.readFileSync(globalConfigFile, 'utf-8'));
    assert.equal(cfg.plugins['adaptive-router'].enabled, true);

    const bootstrap = fs.readFileSync(cloudBootstrapFile, 'utf-8');
    assert.match(bootstrap, /Antigravity Cloud Cross-Project Bootstrap/);
    assert.match(bootstrap, /adaptive-router/);
    assert.match(bootstrap, /\/model-router/);

    const formatted = buildCloudBootstrapContent([
      { name: 'adaptive-router', version: '1.0.0', hasRules: true, skills: ['model-router'], scripts: ['model-router.mjs'] }
    ]);
    assert.match(formatted, /`adaptive-router` \(`v1\.0\.0`\)/);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('evaluates prompts preventively (NOTE-003), flagging unanchored broad mutations while passing anchored or read-only turns', () => {
    for (const direct of [
      'si',
      '/memory-sync',
      'non vedo più agire il plugin che analizza le sessioni è ancora attivo?',
      'modifica @src/ui/params.mjs aggiungendo il reset e lancia npm test'
    ]) {
      const passRes = evaluatePromptForPreventiveReview(direct);
      assert.equal(passRes.needsReview, false, `Expected needsReview=false for: ${direct}`);
    }

    const reviewRes = evaluatePromptForPreventiveReview('sistema tutta la pagina dei parametri e rifai il layout', {
      workspace: 'ParagliderSim'
    });
    assert.equal(reviewRes.needsReview, true);
    assert.ok(reviewRes.score >= 3);
    assert.ok(reviewRes.signals.includes('missing_file_anchor'));
    assert.match(reviewRes.improvedPromptDraftIt, /ParagliderSim/);
    assert.equal(reviewRes.reviewOptionsIt.length, 3);
  });

  it('discovers nested Cloud jetski brain sessions and cloud-sessions-log.ndjson entries', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-cloud-brain-'));
    try {
      const nestedConvDir = path.join(
        tmpRoot,
        'v1',
        'default',
        'jetski_remote_agents_3p',
        '9f1c2284-3606-4c8b-aa5a-bd0550bde9ae'
      );
      const tasksDir = path.join(nestedConvDir, '.system_generated', 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });
      fs.writeFileSync(
        path.join(nestedConvDir, 'implementation_plan.md.metadata.json'),
        JSON.stringify({ summary: 'Piano revisione polare e UI /params' }),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(tasksDir, 'task-1.log'),
        '> node scripts/validate.mjs --all\n/home/antigravity/alessandroame/antigravity-plugins\n',
        'utf-8'
      );

      const analyticsDir = path.join(tmpRoot, 'analytics');
      recordCloudTurnEvent(
        {
          conversationId: 'cloud-conv-extra',
          workspace: 'antigravity-plugins',
          userText: 'verifica lo stato di mapek',
          toolCalls: [{ name: 'run_command', args: { CommandLine: 'node plugins/mapek/scripts/mapek.mjs --digest' } }]
        },
        analyticsDir
      );

      const sessions = discoverUnifiedBrainSessions({
        brainDir: tmpRoot,
        analyticsDir,
        includeCloudLog: true
      });
      assert.equal(sessions.length, 2);
      assert.ok(sessions.some((s) => s.conversationId === '9f1c2284-3606-4c8b-aa5a-bd0550bde9ae' && s.syntheticJsonl));
      assert.ok(sessions.some((s) => s.conversationId === 'cloud-conv-extra' && s.syntheticJsonl));
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

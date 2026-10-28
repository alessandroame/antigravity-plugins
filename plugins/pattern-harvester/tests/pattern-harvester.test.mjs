import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeSessionsForPatterns,
  classifyAndScoreCandidate,
  classifyToolAction,
  compressToolSequenceRLE,
  computeJaccardSimilarity,
  computePatternId,
  evaluateCatalogOverlap,
  extractLexicalSignature,
  extractToolChainNgrams,
  generateCandidateScaffold,
  normalizeCommandSkeleton
} from '../core/harvester-engine.mjs';
import { evaluatePeriodicTrigger } from '../scripts/periodic-harvester-hook.mjs';

describe('Pattern Harvester Headless Core (harvester-engine.mjs)', () => {
  it('compresses contiguous tool calls via RLE and extracts actionable 3..5-grams', () => {
    const rawToolCalls = [
      { name: 'read_file', args: { Path: 'c:/repo/src/index.mjs' } },
      { name: 'read_file', args: { Path: 'c:/repo/src/utils.mjs' } },
      { name: 'edit_file', args: { Path: 'c:/repo/src/index.mjs' } },
      { name: 'edit_file', args: { Path: 'c:/repo/src/utils.mjs' } },
      { name: 'run_command', args: { CommandLine: 'node --test tests/app.test.mjs' } },
      { name: 'run_command', args: { CommandLine: 'node scripts/validate.mjs --all' } },
      { name: 'run_command', args: { CommandLine: 'node scripts/sync-to-global.mjs' } }
    ];

    const rle = compressToolSequenceRLE(rawToolCalls);
    assert.deepEqual(rle.rleTokens, [
      'READ:FILE+',
      'EDIT:FILE+',
      'EXEC:TEST',
      'EXEC:VALIDATE',
      'EXEC:SYNC'
    ]);
    assert.equal(rle.totalCalls, 7);
    assert.equal(rle.collapsedSteps, 2);

    const ngrams = extractToolChainNgrams(rle.rleTokens, 3, 5);
    const ngramStrings = ngrams.map((g) => g.ngram);
    assert.ok(ngramStrings.includes('READ:FILE+ -> EDIT:FILE+ -> EXEC:TEST'));
    assert.ok(
      ngramStrings.includes('READ:FILE+ -> EDIT:FILE+ -> EXEC:TEST -> EXEC:VALIDATE -> EXEC:SYNC')
    );

    // Pure read/search sequences without mutating or execution actions must be ignored
    const readOnlyNgrams = extractToolChainNgrams(['READ:FILE+', 'SEARCH:QUERY', 'READ:COGNITIVE']);
    assert.equal(readOnlyNgrams.length, 0);
  });

  it('normalizes CLI command skeletons preserving script basenames and flags', () => {
    const rawCmd =
      'node "C:\\Users\\aless\\project\\scripts\\validate.mjs" --all --id 4ed62dc7-2ae3-43ae-99be-1cfd7f150892 --port 8080';
    const skeleton = normalizeCommandSkeleton(rawCmd);

    assert.equal(skeleton, 'node <dir>/validate.mjs --all --id <uuid> --port <num>');
    assert.ok(!skeleton.includes('aless'));
    assert.ok(!skeleton.includes('4ed62dc7'));
  });

  it('extracts lexical tokens and 2-shingles and computes bounded Jaccard similarity', () => {
    const sigA = extractLexicalSignature(
      'Verifica i componenti audio e genera il pacchetto mp3 per il briefing'
    );
    const sigB = extractLexicalSignature(
      'Verifica i componenti audio e genera i file mp3 per la sessione'
    );

    assert.ok(sigA.tokens.includes('verifica'));
    assert.ok(sigA.tokens.includes('audio'));
    assert.ok(sigA.shingles.includes('verifica_componenti'));

    const sim = computeJaccardSimilarity(
      [...sigA.tokens, ...sigA.shingles],
      [...sigB.tokens, ...sigB.shingles]
    );
    assert.ok(sim >= 0.35 && sim <= 1, `Expected similarity in [0.35, 1], got ${sim}`);
    assert.equal(computeJaccardSimilarity([], []), 0);
  });

  it('detects catalog overlap for already covered workflows vs novel patterns', () => {
    const catalog = [
      {
        id: 'validate-plugins',
        kind: 'skill',
        pluginName: 'workspace',
        description: 'Esegue la validazione dei plugin con validate.mjs',
        tokens: ['validazione', 'plugin', 'validate', 'manifest'],
        scriptNames: ['validate.mjs']
      }
    ];

    const coveredCheck = evaluateCatalogOverlap(
      {
        keywords: ['validazione', 'plugin'],
        commandSkeletons: ['node <dir>/validate.mjs --all'],
        invokedSkills: ['validate-plugins'],
        hasPostSkillManualSteps: false
      },
      catalog
    );
    assert.equal(coveredCheck.status, 'ALREADY_COVERED');

    const novelCheck = evaluateCatalogOverlap(
      {
        keywords: ['database', 'migrazione', 'schema', 'postgres'],
        commandSkeletons: ['node <dir>/migrate-db.mjs --up'],
        invokedSkills: []
      },
      catalog
    );
    assert.equal(novelCheck.status, 'NOVEL');
  });

  it('enforces the KLM/GOMS ROI math invariant and 5-way decision routing matrix', () => {
    // Low frequency -> IGNORE
    const lowFreq = classifyAndScoreCandidate({
      patternType: 'TOOL_CHAIN',
      occurrences: 2,
      distinctSessions: 1,
      avgStepsPerRun: 3,
      overlapResult: { status: 'NOVEL', maxOverlap: 0, matchedEntry: null }
    });
    assert.equal(lowFreq.recommendationType, 'IGNORE');

    // High frequency sequential workflow -> NEW_SKILL
    const skillCand = classifyAndScoreCandidate({
      patternType: 'TOOL_CHAIN',
      occurrences: 4,
      distinctSessions: 3,
      avgStepsPerRun: 4,
      overlapResult: { status: 'NOVEL', maxOverlap: 0, matchedEntry: null }
    });
    assert.equal(skillCand.recommendationType, 'NEW_SKILL');
    // Mathematical invariant: savedSecondsPerRun = 18 + 4 * 11 = 62s; expectedRuns = max(4, round(3*1.5)=5) = 5; net = 62*5 - 40 = 270s
    assert.equal(skillCand.savedSecondsPerRun, 62);
    assert.equal(skillCand.netSavedSeconds15Sessions, 270);
    assert.ok(skillCand.roiMultiplier > 6);

    // Multi-component domain with hook/state requirement -> NEW_PLUGIN
    const pluginCand = classifyAndScoreCandidate({
      patternType: 'INTERACTION_ARCHETYPE',
      occurrences: 5,
      distinctSessions: 4,
      avgStepsPerRun: 5,
      requiresHookOrState: true,
      overlapResult: { status: 'NOVEL', maxOverlap: 0, matchedEntry: null }
    });
    assert.equal(pluginCand.recommendationType, 'NEW_PLUGIN');
  });

  it('discovers recurring patterns across sessions and respects 30-day dismissal cooldown', () => {
    const makeTurn = (prompt) => ({
      userText: prompt,
      totalTokens: 2400,
      invokedSkills: [],
      toolCalls: [
        { name: 'read_file', args: { Path: 'c:/app/schema.sql' } },
        { name: 'edit_file', args: { Path: 'c:/app/schema.sql' } },
        { name: 'run_command', args: { CommandLine: 'node scripts/check-schema.mjs --strict' } },
        { name: 'run_command', args: { CommandLine: 'node --test tests/schema.test.mjs' } }
      ]
    });

    const sessions = [
      { convId: 'sess-1', turns: [makeTurn('Aggiorna lo schema database e verifica migrazione sql')] },
      { convId: 'sess-2', turns: [makeTurn('Modifica lo schema database e verifica migrazione sql')] },
      { convId: 'sess-3', turns: [makeTurn('Controlla lo schema database e verifica migrazione sql')] }
    ];

    const report = analyzeSessionsForPatterns(sessions, []);
    assert.equal(report.analyzedSessionsCount, 3);
    assert.ok(report.actionableCount >= 1);

    const topRec = report.recommendations[0];
    assert.equal(topRec.recommendationType, 'NEW_SKILL');
    assert.ok(topRec.netSavedSeconds15Sessions >= 120);

    // Dismiss the top recommendation and verify it is filtered out within the 30-day window
    const nowMs = Date.now();
    const afterDismiss = analyzeSessionsForPatterns(sessions, [], {
      nowMs,
      dismissedPatterns: {
        [topRec.patternId]: { dismissedAtMs: nowMs - 1000 }
      }
    });
    assert.ok(!afterDismiss.recommendations.some((r) => r.patternId === topRec.patternId));
  });

  it('generates validate.mjs-compliant SKILL.md and plugin.json scaffolds', () => {
    const candidate = {
      patternId: computePatternId('TOOL_CHAIN', 'READ:FILE -> EDIT:FILE -> EXEC:TEST'),
      patternType: 'TOOL_CHAIN',
      signature: 'READ:FILE -> EDIT:FILE -> EXEC:TEST',
      recommendationType: 'NEW_SKILL',
      keywords: ['schema', 'migrazione', 'verifica'],
      commandSkeletons: ['node <dir>/check-schema.mjs --strict'],
      savedSecondsPerRun: 62,
      netSavedSeconds15Sessions: 270
    };

    const scaffold = generateCandidateScaffold(candidate, { slug: 'schema-migration-check' });
    assert.equal(scaffold.kind, 'SKILL');
    const skillMd = scaffold.files['skills/schema-migration-check/SKILL.md'];
    assert.ok(skillMd);

    const lines = skillMd.split(/\r?\n/);
    assert.ok(lines.length <= 200);
    assert.ok(skillMd.includes('name: schema-migration-check'));
    assert.ok(skillMd.includes('description: >-'));
    assert.ok(skillMd.includes('Utilizza questa skill quando'));

    const descLine = lines[3].trim();
    assert.ok(
      descLine.length >= 80 && descLine.length <= 250,
      `Expected description length in [80, 250], got ${descLine.length}`
    );
  });

  it('evaluates periodic Stop hook thresholds deterministically', () => {
    const nowMs = 1_700_000_000_000;

    // Initial scan triggers immediately
    assert.equal(
      evaluatePeriodicTrigger({ lastHarvestAtMs: 0, humanSessionsSinceLastHarvest: 0 }, nowMs)
        .shouldTrigger,
      true
    );

    // Below threshold (2 sessions, 2 hours elapsed) -> false
    assert.equal(
      evaluatePeriodicTrigger(
        {
          lastHarvestAtMs: nowMs - 2 * 3600 * 1000,
          humanSessionsSinceLastHarvest: 2,
          config: { periodicSessionThreshold: 5, periodicIntervalHours: 24 }
        },
        nowMs
      ).shouldTrigger,
      false
    );

    // Reached 5 sessions -> true
    assert.equal(
      evaluatePeriodicTrigger(
        {
          lastHarvestAtMs: nowMs - 2 * 3600 * 1000,
          humanSessionsSinceLastHarvest: 5,
          config: { periodicSessionThreshold: 5, periodicIntervalHours: 24 }
        },
        nowMs
      ).shouldTrigger,
      true
    );

    // Reached 24h interval with at least 1 new session -> true
    assert.equal(
      evaluatePeriodicTrigger(
        {
          lastHarvestAtMs: nowMs - 25 * 3600 * 1000,
          humanSessionsSinceLastHarvest: 1,
          config: { periodicSessionThreshold: 5, periodicIntervalHours: 24 }
        },
        nowMs
      ).shouldTrigger,
      true
    );
  });
});

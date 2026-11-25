#!/usr/bin/env node

/**
 * CLI Wrapper for the Oracle-Guided Discovery Loop Engine.
 * Supports brief initialization, hypothesis deduplication, stop-condition checks,
 * blind batch sanitization, full evaluation with /ab-bench 5-Finger integration,
 * and a deterministic offline --pilot-demo cycle.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDiscoveryVerdict,
  computeHypothesisDuplicateRate,
  createBlindVariantBatch,
  createDiscoveryBrief,
  evaluateStopCondition,
  renderDiscoveryReportMarkdown,
  validateDiscoveryBrief
} from '../core/discovery-engine.mjs';
import { evaluateVerdict, normalizePath } from './bench.mjs';

function readJsonFile(filePath, label) {
  const abs = resolve(normalizePath(filePath));
  if (!existsSync(abs)) {
    throw new Error(`Missing ${label} file: ${abs}`);
  }
  const raw = readFileSync(abs, 'utf-8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function writeTextFile(filePath, content) {
  const abs = resolve(normalizePath(filePath));
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf-8');
  return abs;
}

function enrichVariantsWithFiveFingerScores(variants, brief) {
  const baselineFingers = brief?.baseline?.fiveFingers;
  return (Array.isArray(variants) ? variants : []).map((variant) => {
    if (
      Array.isArray(variant.candidateFingers) &&
      Array.isArray(baselineFingers) &&
      !Number.isFinite(variant.fiveFingerScore)
    ) {
      const verdict = evaluateVerdict({
        metricsA: brief.baseline.metrics || {},
        metricsB: variant.metrics || {},
        scoresA: baselineFingers,
        scoresB: variant.candidateFingers,
        labelA: 'Baseline',
        labelB: variant.id || 'Variante'
      });
      return {
        ...variant,
        fiveFingerScore: verdict.scoreB,
        fiveFingerVerdict: verdict,
        metrics: {
          ...(variant.metrics || {}),
          fiveFingerScore: verdict.scoreB
        }
      };
    }
    return variant;
  });
}

function runPilotDemo(outDirArg) {
  const brief = createDiscoveryBrief({
    goal: 'Improve triage determinism and token economy without breaking edge cases',
    targetScope: ['plugins/skizzo/scripts/triage.mjs'],
    profile: 'quick',
    createdAt: '2026-11-25T00:00:00.000Z',
    baseline: {
      id: 'baseline',
      fiveFingers: [1, 1, 0, 1, 1],
      metrics: {
        empiricalScore: 0.72,
        invarianceRate: 0.9,
        cognitiveScore: 0.75,
        fiveFingerScore: 4,
        complexityCost: 1
      }
    }
  });

  const waveHypotheses = [
    {
      id: 'hyp-1',
      mutatorArchetype: 'distracted-user',
      claim: 'Reduce ambiguous fast-pass phrasing in short confirmation messages'
    },
    {
      id: 'hyp-2',
      mutatorArchetype: 'extreme-abolitionist',
      claim: 'Remove redundant fallback branch in explicit track parser without losing accuracy'
    },
    {
      id: 'hyp-3',
      mutatorArchetype: 'domain-skeptic',
      claim: 'Remove redundant fallback branch in explicit track parser without losing accuracy'
    }
  ];
  const dedupe = computeHypothesisDuplicateRate(waveHypotheses, [], brief.stopPolicy.maxDuplicateRate);

  const variants = [
    {
      id: 'var-distracted-1',
      mutatorArchetype: 'distracted-user',
      worktreeBranch: 'worktree/discovery-var-1',
      summary: 'Clarifies fast-pass classification on single-sentence operational prompts.',
      metrics: {
        empiricalScore: 0.86,
        invarianceRate: 1.0,
        cognitiveScore: 0.9,
        fiveFingerScore: 5,
        complexityCost: 0.95
      },
      candidateFingers: [1, 1, 1, 1, 1],
      oracles: {
        'empirical-data': { passed: true },
        'invariance-fuzzing': { passed: true },
        'blind-cognitive': { passed: true },
        'technical-ab-bench': { passed: true }
      }
    },
    {
      id: 'var-abolitionist-2',
      mutatorArchetype: 'extreme-abolitionist',
      worktreeBranch: 'worktree/discovery-var-2',
      summary: 'Cuts complexity by 45% while preserving core routing thresholds.',
      metrics: {
        empiricalScore: 0.81,
        invarianceRate: 0.95,
        cognitiveScore: 0.85,
        fiveFingerScore: 5,
        complexityCost: 0.55
      },
      candidateFingers: [1, 1, 1, 1, 1],
      oracles: {
        'empirical-data': { passed: true },
        'invariance-fuzzing': { passed: true },
        'blind-cognitive': { passed: true },
        'technical-ab-bench': { passed: true }
      }
    },
    {
      id: 'var-skeptic-rejected',
      mutatorArchetype: 'domain-skeptic',
      worktreeBranch: 'worktree/discovery-var-3',
      summary: 'Aggressive threshold reset that breaks mid-sentence read-only clause guard.',
      metrics: {
        empiricalScore: 0.6,
        invarianceRate: 0.4,
        cognitiveScore: 0.7,
        fiveFingerScore: 2,
        complexityCost: 0.8
      },
      oracles: {
        'empirical-data': { passed: false, reason: 'Accuracy dropped below baseline (0.60 < 0.72)' },
        'invariance-fuzzing': { passed: false, reason: 'Failed mid-sentence read-only guard' },
        'blind-cognitive': { passed: true },
        'technical-ab-bench': { passed: false, reason: 'triage.test.mjs regression' }
      },
      technicalChecks: { testsPassed: false, probeViolations: 0, diffTamperCount: 0 }
    }
  ];

  const blindBatch = createBlindVariantBatch(variants, 'pilot-demo-seed');
  const enriched = enrichVariantsWithFiveFingerScores(variants, brief);
  const runState = {
    wavesCompleted: 1,
    variantsPrototyped: enriched.length,
    subagentCalls: 7,
    totalTokens: 48000,
    elapsedMs: 120000,
    consecutiveStagnantWaves: 0,
    consecutiveZeroYieldWaves: 0,
    satisficingOrthogonalCount: 2,
    lastWaveDuplicateRate: dedupe.duplicateRate,
    lastWaveHypothesisCount: dedupe.total
  };

  const verdict = buildDiscoveryVerdict({
    brief,
    runState,
    variants: enriched,
    blindReveal: blindBatch.revealMap,
    generatedAt: '2026-11-25T00:05:00.000Z'
  });
  const markdown = renderDiscoveryReportMarkdown(verdict);

  if (outDirArg) {
    const outDir = resolve(normalizePath(outDirArg));
    writeTextFile(join(outDir, 'discovery-brief.json'), JSON.stringify(brief, null, 2) + '\n');
    writeTextFile(join(outDir, 'discovery-verdict.json'), JSON.stringify(verdict, null, 2) + '\n');
    writeTextFile(join(outDir, 'discovery-report.md'), markdown + '\n');
  }

  return { brief, dedupe, blindBatch, verdict, markdown };
}

function runCli() {
  const watchdog = setTimeout(() => {
    console.error('[FATAL TIMEOUT] discovery.mjs exceeded 45s limit.');
    process.exit(1);
  }, 45000);
  watchdog.unref();

  const args = process.argv.slice(2);
  const getArg = (flag, fallback = '') => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
  };

  if (args.includes('--init-brief')) {
    const goal = getArg('--goal', '');
    const scope = getArg('--scope', '');
    const profile = getArg('--profile', 'deep');
    const outPath = getArg('--out', '');
    const brief = createDiscoveryBrief({ goal, targetScope: scope, profile });
    const check = validateDiscoveryBrief(brief);
    if (!check.valid) {
      console.error(`Invalid brief: ${check.errors.join('; ')}`);
      process.exit(1);
    }
    const serialized = JSON.stringify(brief, null, 2) + '\n';
    if (outPath) {
      writeTextFile(outPath, serialized);
    }
    console.log(serialized);
    return;
  }

  if (args.includes('--dedupe')) {
    const hypPath = getArg('--hypotheses', '');
    const priorPath = getArg('--prior', '');
    const maxRateRaw = getArg('--max-duplicate-rate', '');
    const hypotheses = readJsonFile(hypPath, 'hypotheses');
    const prior = priorPath ? readJsonFile(priorPath, 'prior') : [];
    const maxRate = maxRateRaw ? Number(maxRateRaw) : undefined;
    const result = computeHypothesisDuplicateRate(hypotheses, prior, maxRate);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.includes('--check-stop')) {
    const brief = readJsonFile(getArg('--brief', ''), 'brief');
    const state = readJsonFile(getArg('--state', ''), 'state');
    const stop = evaluateStopCondition(state, brief.stopPolicy);
    console.log(JSON.stringify(stop, null, 2));
    return;
  }

  if (args.includes('--sanitize-batch')) {
    const variants = readJsonFile(getArg('--variants', ''), 'variants');
    const seed = getArg('--seed', '');
    const outPath = getArg('--out', '');
    const batch = createBlindVariantBatch(variants, seed || undefined);
    const serialized = JSON.stringify(batch, null, 2) + '\n';
    if (outPath) {
      writeTextFile(outPath, serialized);
    }
    console.log(serialized);
    return;
  }

  if (args.includes('--evaluate')) {
    const brief = readJsonFile(getArg('--brief', ''), 'brief');
    const state = readJsonFile(getArg('--state', ''), 'state');
    const rawVariants = readJsonFile(getArg('--variants', ''), 'variants');
    const revealPath = getArg('--reveal', '');
    const reveal = revealPath ? readJsonFile(revealPath, 'reveal') : {};
    const blindReveal = reveal.revealMap ? reveal.revealMap : reveal;
    const enriched = enrichVariantsWithFiveFingerScores(rawVariants, brief);
    const verdict = buildDiscoveryVerdict({
      brief,
      runState: state,
      variants: enriched,
      blindReveal
    });
    const markdown = renderDiscoveryReportMarkdown(verdict);

    const outVerdict = getArg('--out-verdict', '');
    const outReport = getArg('--out-report', '');
    if (outVerdict) {
      writeTextFile(outVerdict, JSON.stringify(verdict, null, 2) + '\n');
    }
    if (outReport) {
      writeTextFile(outReport, markdown + '\n');
    }

    if (args.includes('--markdown') && !args.includes('--json')) {
      console.log(markdown);
    } else {
      console.log(JSON.stringify({ verdict, markdown }, null, 2));
    }
    return;
  }

  if (args.includes('--pilot-demo')) {
    const outDir = getArg('--out-dir', '');
    const demo = runPilotDemo(outDir);
    if (args.includes('--markdown') && !args.includes('--json')) {
      console.log(demo.markdown);
    } else {
      console.log(JSON.stringify(demo, null, 2));
    }
    return;
  }

  console.log(
    'Usage: discovery.mjs [--init-brief --goal "<g>" --scope "<p1,p2>" --profile quick|deep|overnight] [--dedupe --hypotheses <f>] [--check-stop --brief <f> --state <f>] [--sanitize-batch --variants <f>] [--evaluate --brief <f> --state <f> --variants <f>] [--pilot-demo]'
  );
}

const isMain =
  process.argv[1] &&
  normalizePath(fileURLToPath(import.meta.url)).toLowerCase() ===
    normalizePath(resolve(process.argv[1])).toLowerCase();

if (isMain) {
  runCli();
}

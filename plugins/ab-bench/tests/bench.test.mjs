import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  parseTranscriptContent,
  parseTranscriptMetrics,
  createBlindAssignment,
  sanitizeForBlindJudge,
  parseBenchCommand,
  evaluateVerdict,
  appendBenchRecord,
  loadBenchHistory,
  aggregateStats,
  renderVerdictMarkdown,
  renderStatsMarkdown,
  MAX_HISTORY_BYTES
} from '../scripts/bench.mjs';

describe('Oracle Alpha (Technical Purity & Invariants)', () => {
  it('T1: parses valid JSONL transcript and calculates exact metrics', () => {
    const lines = [
      JSON.stringify({
        step_index: 1,
        created_at: '2026-10-17T20:00:00.000Z',
        status: 'DONE',
        input_tokens: 120,
        output_tokens: 30,
        tool_calls: [{ name: 'view_file' }, { name: 'run_command' }]
      }),
      JSON.stringify({
        step_index: 2,
        created_at: '2026-10-17T20:00:05.500Z',
        status: 'ERROR',
        input_tokens: 80,
        output_tokens: 20,
        tool_calls: [{ name: 'replace_file_content' }]
      }),
      JSON.stringify({
        step_index: 3,
        created_at: '2026-10-17T20:00:12.500Z',
        status: 'DONE',
        content: 'The command exited with code 1.',
        input_tokens: 100,
        output_tokens: 50,
        tool_calls: []
      })
    ].join('\n');

    const res = parseTranscriptContent(lines);
    assert.equal(res.exists, true);
    assert.equal(res.steps, 3);
    assert.equal(res.durationMs, 12500);
    assert.equal(res.toolCalls, 3);
    assert.equal(res.errors, 2);
    assert.equal(res.inputTokens, 300);
    assert.equal(res.outputTokens, 100);
    assert.equal(res.totalTokens, 400);
    assert.equal(res.corruptedLines, 0);
  });

  it('T2: handles corrupted JSONL lines, duplicates, and missing files gracefully', () => {
    const raw = [
      '\uFEFF{"step_index": 1, "created_at": "2026-10-17T20:00:00Z", "input_tokens": 10}',
      '{"step_index": 2, "truncated_json...',
      '   ',
      '{"step_index": 1, "created_at": "2026-10-17T20:00:04Z", "input_tokens": 25}'
    ].join('\r\n');

    const res = parseTranscriptContent(raw);
    assert.equal(res.steps, 1);
    assert.equal(res.corruptedLines, 1);
    assert.equal(res.inputTokens, 25);

    const missing = parseTranscriptMetrics('C:/non-existent-path/transcript.jsonl');
    assert.equal(missing.exists, false);
    assert.equal(missing.steps, 0);
    assert.equal(missing.durationMs, 0);
  });

  it('T3: creates deterministic SHA-256 blind X/Y assignments and balances swaps', () => {
    const b1 = createBlindAssignment('conv-alpha', 'conv-beta', 'seed-fixed-42');
    const b2 = createBlindAssignment('conv-alpha', 'conv-beta', 'seed-fixed-42');
    assert.deepEqual(b1, b2);

    let swapCount = 0;
    for (let i = 0; i < 100; i++) {
      const sample = createBlindAssignment('id-a', 'id-b', `seed-${i}`);
      if (sample.swapped) swapCount++;
      const ids = [sample.revealMap.X, sample.revealMap.Y].sort();
      assert.deepEqual(ids, ['id-a', 'id-b']);
    }
    assert.ok(swapCount > 25 && swapCount < 75, `Expected balanced swaps, got ${swapCount}`);

    assert.throws(() => createBlindAssignment('same', 'same'), RangeError);
    assert.throws(() => createBlindAssignment('', 'valid'), TypeError);
  });

  it('T4: enforces Cost/Value Efficiency Guard (>= 1.5x cost without finger gain)', () => {
    const equalScores = evaluateVerdict({
      metricsA: { steps: 10, durationMs: 10000 },
      metricsB: { steps: 16, durationMs: 22000 },
      scoresA: [1, 1, 1, 1, 0],
      scoresB: [1, 1, 1, 1, 0],
      labelA: 'Senza /skizzo',
      labelB: 'Con /skizzo'
    });
    assert.equal(equalScores.winnerSlot, 'A');
    assert.equal(equalScores.reason, 'EFFICIENCY_GUARD_A_WINS');
    assert.equal(equalScores.verdictCode, 'WASTED_EFFORT');

    const superiorB = evaluateVerdict({
      metricsA: { steps: 10, durationMs: 10000 },
      metricsB: { steps: 20, durationMs: 25000 },
      scoresA: [1, 1, 0, 0, 1],
      scoresB: [1, 1, 1, 1, 1],
      labelA: 'Senza /skizzo',
      labelB: 'Con /skizzo'
    });
    assert.equal(superiorB.winnerSlot, 'B');
    assert.equal(superiorB.reason, 'SCORE_SUPERIORITY_B');
    assert.equal(superiorB.verdictCode, 'WORTH_IT');
  });

  it('T5: executes tie-breaker cascade when scores match (< 1.5x bloat)', () => {
    const bySteps = evaluateVerdict({
      metricsA: { steps: 10, durationMs: 10000 },
      metricsB: { steps: 12, durationMs: 10000 },
      scoresA: [1, 1, 1, 1, 1],
      scoresB: [1, 1, 1, 1, 1]
    });
    assert.equal(bySteps.winnerSlot, 'A');
    assert.equal(bySteps.reason, 'TIE_BREAKER_FEWER_STEPS');

    const byDuration = evaluateVerdict({
      metricsA: { steps: 10, durationMs: 9500 },
      metricsB: { steps: 10, durationMs: 8000 },
      scoresA: [1, 1, 1, 1, 1],
      scoresB: [1, 1, 1, 1, 1]
    });
    assert.equal(byDuration.winnerSlot, 'B');
    assert.equal(byDuration.reason, 'TIE_BREAKER_FASTER_DURATION');

    const exactParity = evaluateVerdict({
      metricsA: { steps: 10, durationMs: 8000, errors: 0, totalTokens: 500 },
      metricsB: { steps: 10, durationMs: 8000, errors: 0, totalTokens: 500 },
      scoresA: [1, 1, 1, 1, 1],
      scoresB: [1, 1, 1, 1, 1]
    });
    assert.equal(exactParity.winnerSlot, 'TIE');
    assert.equal(exactParity.reason, 'EXACT_PARITY');
  });

  it('T6: rotates ab-bench-history.ndjson at 5 MB and aggregates O(N) stats', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'ab-bench-test-'));
    try {
      const historyFile = join(tempDir, 'ab-bench-history.ndjson');
      const archiveFile = join(tempDir, 'ab-bench-history.archive.ndjson');

      // Write dummy file slightly exceeding 5 MB
      writeFileSync(historyFile, 'x'.repeat(MAX_HISTORY_BYTES + 128), 'utf-8');

      appendBenchRecord(
        {
          winnerSlot: 'B',
          reason: 'SCORE_SUPERIORITY_B',
          scoreA: 3,
          scoreB: 5,
          stepRatio: 1.8,
          durationRatio: 2.1,
          labelA: 'Senza /skizzo',
          labelB: 'Con /skizzo'
        },
        tempDir
      );

      assert.equal(existsSync(archiveFile), true, 'Expected archive file after 5 MB rotation');
      const loaded = loadBenchHistory(tempDir);
      assert.equal(loaded.length, 1);

      const stats = aggregateStats(loaded);
      assert.equal(stats.totalBenchmarks, 1);
      assert.equal(stats.slotWins.B, 1);
      assert.equal(stats.averages.scoreDelta, 2);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('Oracle Beta (Domain Ergonomics & 5-Finger User Scenarios)', () => {
  it('B1: resolves Zero-Config Default (/ab-bench <prompt>) to Senza vs Con /skizzo', () => {
    const parsed = parseBenchCommand('/ab-bench Crea un calcolatore di sconto');
    assert.equal(parsed.mode, 'default-skizzo');
    assert.equal(parsed.skillName, 'skizzo');
    assert.equal(parsed.controlLabel, 'Senza /skizzo');
    assert.equal(parsed.treatmentLabel, 'Con /skizzo');
    assert.equal(parsed.prompt, 'Crea un calcolatore di sconto');
  });

  it('B2: accepts permissive CLI variations (Postel Law)', () => {
    const s1 = parseBenchCommand('/ab-bench   --skill   laws-of-ux   Crea barra filtri');
    assert.equal(s1.mode, 'skill');
    assert.equal(s1.skillName, 'laws-of-ux');
    assert.equal(s1.prompt, 'Crea barra filtri');

    const s2 = parseBenchCommand('/ab-bench “Prompt 1”   VS   “Prompt 2”');
    assert.equal(s2.mode, 'prompt-vs-prompt');
    assert.equal(s2.promptA, 'Prompt 1');
    assert.equal(s2.promptB, 'Prompt 2');

    const s3 = parseBenchCommand('/ab-bench --stats');
    assert.equal(s3.mode, 'stats');
  });

  it('B3: produces clear 3-second verdicts for Worth It, Wasted Time, and Over-Engineering', () => {
    const worthIt = evaluateVerdict({
      metricsA: { durationMs: 10000, steps: 4 },
      metricsB: { durationMs: 25000, steps: 9 },
      scoresA: [1, 1, 0, 0, 1],
      scoresB: [1, 1, 1, 1, 1]
    });
    assert.equal(worthIt.verdictHeadline, 'SÌ, VALEVA LA PENA');
    assert.deepEqual(worthIt.gainedFingers, ['Medio', 'Anulare']);

    const wasted = evaluateVerdict({
      metricsA: { durationMs: 10000, steps: 4 },
      metricsB: { durationMs: 28000, steps: 10 },
      scoresA: [1, 1, 1, 0, 1],
      scoresB: [1, 1, 1, 0, 1]
    });
    assert.equal(wasted.verdictHeadline, 'NO, TEMPO SPRECATO');

    const overEng = evaluateVerdict({
      metricsA: { durationMs: 12000, steps: 4 },
      metricsB: { durationMs: 30000, steps: 11 },
      scoresA: [1, 1, 1, 0, 1],
      scoresB: [1, 0, 1, 0, 1]
    });
    assert.equal(overEng.verdictHeadline, 'NO, DANNO DA OVER-ENGINEERING');
  });

  it('B4: strips plugin signatures before Blind Judge evaluation', () => {
    const raw = [
      '> [!IMPORTANT]',
      '> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK`)** — Subagent: [`Subagent Alpha`](conversation://1234)',
      '',
      'Ecco la soluzione validata con Oracolo Alpha e Subagent Beta.'
    ].join('\n');

    const clean = sanitizeForBlindJudge(raw);
    assert.equal(/SKIZZO/i.test(clean), false);
    assert.equal(/conversation:\/\//i.test(clean), false);
    assert.equal(/Subagent Alpha/i.test(clean), false);
  });

  it('B5: enforces ~600px chat ergonomics (0-Click <= 12 lines & blank line after </summary>)', () => {
    const verdict = evaluateVerdict({
      metricsA: { durationMs: 12400, steps: 4 },
      metricsB: { durationMs: 30100, steps: 9 },
      scoresA: [1, 1, 0, 0, 1],
      scoresB: [1, 1, 1, 1, 1]
    });
    const md = renderVerdictMarkdown(verdict, {
      metricsA: { durationMs: 12400, steps: 4 },
      metricsB: { durationMs: 30100, steps: 9 },
      idA: 'conv-a',
      idB: 'conv-b',
      idJudge: 'conv-j'
    });

    const [zeroClickPart] = md.split('<details>');
    const visibleLines = zeroClickPart.trim().split('\n');
    assert.ok(
      visibleLines.length <= 12,
      `Expected <= 12 visible lines before <details>, got ${visibleLines.length}`
    );
    assert.ok(visibleLines[0].startsWith('> [!IMPORTANT]'));
    assert.ok(
      /<\/summary>\n\n\|/.test(md),
      'Mandatory blank line after </summary> is missing'
    );
  });

  it('B6: renders actionable historical stats scoreboard', () => {
    const stats = aggregateStats([
      {
        winnerSlot: 'B',
        scoreA: 3,
        scoreB: 5,
        stepRatio: 2.0,
        durationRatio: 2.2,
        labelA: 'Senza /skizzo',
        labelB: 'Con /skizzo'
      },
      {
        winnerSlot: 'B',
        scoreA: 4,
        scoreB: 5,
        stepRatio: 1.8,
        durationRatio: 1.9,
        labelA: 'Senza /skizzo',
        labelB: 'Con /skizzo'
      },
      {
        winnerSlot: 'A',
        reason: 'EFFICIENCY_GUARD_A_WINS',
        scoreA: 4,
        scoreB: 4,
        stepRatio: 2.5,
        durationRatio: 2.6,
        labelA: 'Senza /skizzo',
        labelB: 'Con /skizzo'
      }
    ]);

    assert.equal(stats.winRateB, 67);
    const md = renderStatsMarkdown(stats);
    assert.ok(md.includes('67%'));
    assert.ok(/<\/summary>\n\n\|/.test(md));
  });
});

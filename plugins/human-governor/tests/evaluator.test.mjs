import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateOperatorBehavior,
  isWithinCurfew,
  computeContinuousStreakMinutes,
  countContextSwitches
} from '../core/evaluator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const safetyTimer = setTimeout(() => {
  console.error('[FATAL TIMEOUT] Test suite exceeded 45s');
  process.exit(1);
}, 45000);
safetyTimer.unref();

describe('Human Governor Headless Core (core/evaluator.mjs)', () => {
  it('contains zero DOM or browser globals in core/evaluator.mjs (Headless Gate)', () => {
    const src = readFileSync(join(__dirname, '..', 'core', 'evaluator.mjs'), 'utf-8');
    assert.equal(/\b(window|document|HTMLElement|localStorage|navigator)\b/.test(src), false);
  });

  it('detects overnight curfew windows accurately', () => {
    const start2230 = 22 * 60 + 30;
    const end0700 = 7 * 60;
    assert.equal(isWithinCurfew(23 * 60 + 15, start2230, end0700), true);
    assert.equal(isWithinCurfew(2 * 60 + 0, start2230, end0700), true);
    assert.equal(isWithinCurfew(17 * 60 + 40, start2230, end0700), false);
    assert.equal(isWithinCurfew(7 * 60 + 0, start2230, end0700), false);
  });

  it('flags CRITICAL when 6 concurrent WIP sessions are active within 30 minutes', () => {
    const nowMs = 1_700_000_000_000;
    const activeSessions = [
      { conversationId: 'conv-1', lastActiveMs: nowMs - 2 * 60_000 },
      { conversationId: 'conv-2', lastActiveMs: nowMs - 5 * 60_000 },
      { conversationId: 'conv-3', lastActiveMs: nowMs - 9 * 60_000 },
      { conversationId: 'conv-4', lastActiveMs: nowMs - 14 * 60_000 },
      { conversationId: 'conv-5', lastActiveMs: nowMs - 18 * 60_000 },
      { conversationId: 'conv-6', lastActiveMs: nowMs - 1 * 60_000 }
    ];

    const res = evaluateOperatorBehavior({
      nowMs,
      localMinutesOfDay: 15 * 60, // 15:00
      currentConversationId: 'conv-6',
      activeSessions,
      promptHistory: [{ conversationId: 'conv-6', timestampMs: nowMs }]
    });

    assert.equal(res.status, 'CRITICAL');
    assert.equal(res.metrics.activeWipCount, 6);
    assert.equal(res.violations.some((v) => v.code === 'EXCESSIVE_WIP'), true);
    assert.match(res.confrontationQuestionIt, /6 sessioni WIP attive in parallelo/);
    assert.match(res.confrontationQuestionIt, /sei veramente un pirla/i);
  });

  it('counts context switches across distinct conversations within 10 minutes', () => {
    const nowMs = 1_700_000_000_000;
    const events = [
      { conversationId: 'a', timestampMs: nowMs - 8 * 60_000 },
      { conversationId: 'b', timestampMs: nowMs - 6 * 60_000 },
      { conversationId: 'c', timestampMs: nowMs - 4 * 60_000 },
      { conversationId: 'a', timestampMs: nowMs - 2 * 60_000 },
      { conversationId: 'd', timestampMs: nowMs - 1 * 60_000 }
    ];
    assert.equal(countContextSwitches(events, nowMs, 10), 4);
  });

  it('resets continuous work streak when a break >= 20 minutes occurs', () => {
    const nowMs = 1_700_000_000_000;
    const timestampsWithBreak = [
      nowMs - 150 * 60_000,
      nowMs - 135 * 60_000,
      // 35 min break here
      nowMs - 100 * 60_000,
      nowMs - 85 * 60_000,
      nowMs - 70 * 60_000,
      nowMs - 55 * 60_000,
      nowMs - 40 * 60_000,
      nowMs - 25 * 60_000,
      nowMs - 10 * 60_000,
      nowMs
    ];
    assert.equal(computeContinuousStreakMinutes(timestampsWithBreak, nowMs, 20), 100);
  });
});

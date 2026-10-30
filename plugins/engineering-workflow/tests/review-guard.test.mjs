import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  analyzeGitDiffForReview,
  buildFourMeasureReceipt,
  discoverRepositoryTestFiles,
  validateSmokeFlowConfig,
  verifyTranscriptDeliveryGate
} from '../core/review-guard-engine.mjs';
import { buildInjectableProbeExpression } from '../scripts/ui-smoke-runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const CORE_FILE = resolve(__dirname, '..', 'core', 'review-guard-engine.mjs');
const DELIVERY_HOOK_SCRIPT = resolve(__dirname, '..', 'scripts', 'delivery-gate-hook.mjs');

describe('Review Guard, Test Integrity & Delivery Gate Engine', () => {
  it('maintains 100% headless purity in core/review-guard-engine.mjs', () => {
    const src = readFileSync(CORE_FILE, 'utf-8');
    for (const forbidden of ['window.', 'document.', 'HTMLElement', 'localStorage']) {
      assert.equal(
        src.includes(forbidden),
        false,
        `Forbidden browser global "${forbidden}" leaked into headless core`
      );
    }
  });

  it('auto-discovers all unit test suites across tests/ and plugins/*/tests/', () => {
    const discovered = discoverRepositoryTestFiles(REPO_ROOT);
    assert.ok(
      discovered.length >= 10,
      `Expected at least 10 test suites across repository, found ${discovered.length}`
    );
    const normalized = discovered.map((p) => p.replace(/\\/g, '/'));
    assert.ok(normalized.some((p) => p.endsWith('plugins/ab-bench/tests/bench.test.mjs')));
    assert.ok(normalized.some((p) => p.endsWith('plugins/human-governor/tests/evaluator.test.mjs')));
    assert.ok(normalized.some((p) => p.endsWith('tests/board-engine.test.mjs')));
    assert.ok(normalized.some((p) => p.endsWith('plugins/engineering-workflow/tests/review-guard.test.mjs')));
  });

  it('flags test tampering when existing assertions are deleted or altered alongside production code', () => {
    const tamperedDiff = [
      'diff --git a/src/pricing.mjs b/src/pricing.mjs',
      '@@ -10,2 +10,3 @@',
      '+export function computeTotal(price) {',
      '+  state.lastTotal = price * 0.9;',
      '+  return state.lastTotal;',
      'diff --git a/tests/pricing.test.mjs b/tests/pricing.test.mjs',
      '@@ -5,3 +5,1 @@',
      '-  assert.strictEqual(computeTotal(100), 100);',
      '-  assert.strictEqual(computeTotal(50), 50);'
    ].join('\n');

    const report = analyzeGitDiffForReview(tamperedDiff);
    assert.equal(report.status, 'BLOCK');
    assert.equal(report.testTamperAlerts.length, 1);
    assert.equal(report.testTamperAlerts[0].severity, 'HIGH');
    assert.equal(report.testTamperAlerts[0].removedAssertions, 2);
    assert.ok(report.criticalHighlights.some((h) => h.tag === 'STATE_MUTATION'));
    assert.ok(report.criticalHighlights.some((h) => h.tag === 'PUBLIC_CONTRACT'));
  });

  it('detects tautological faux-tests and assertion-free test blocks', () => {
    const fauxDiff = [
      'diff --git a/tests/faux.test.mjs b/tests/faux.test.mjs',
      '@@ -1,0 +1,4 @@',
      '+it("pretends to verify calculation", () => {',
      '+  const value = 42;',
      '+});',
      'diff --git a/tests/tautology.test.mjs b/tests/tautology.test.mjs',
      '@@ -1,0 +1,3 @@',
      '+it("always passes", () => {',
      '+  assert.ok(true);',
      '+});'
    ].join('\n');

    const report = analyzeGitDiffForReview(fauxDiff);
    assert.equal(report.status, 'BLOCK');
    assert.ok(report.fauxTestAlerts.some((a) => a.type === 'ASSERTION_FREE_TEST'));
    assert.ok(report.fauxTestAlerts.some((a) => a.type === 'TAUTOLOGICAL_ASSERTION'));
  });

  it('blocks unverified post-test code edits and passes once tests run after the final edit', () => {
    const unverifiedSteps = [
      { step_index: 1, type: 'USER_INPUT', source: 'USER_EXPLICIT', content: 'Fix parser bug' },
      {
        step_index: 2,
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'run_command', args: { CommandLine: 'npm test' } }]
      },
      { step_index: 3, status: 'DONE', content: 'Command exited with code 0.' },
      {
        step_index: 4,
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'edit_file', args: { Path: 'c:/project/src/parser.mjs' } }]
      }
    ];

    const blocked = verifyTranscriptDeliveryGate(unverifiedSteps);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.missingCodeVerification, true);
    assert.equal(blocked.lastCodeEditStep, 4);
    assert.equal(blocked.lastPassingTestStep, 2);

    const verifiedSteps = [
      ...unverifiedSteps,
      {
        step_index: 5,
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'run_command', args: { CommandLine: 'node --test tests/parser.test.mjs' } }]
      },
      { step_index: 6, status: 'DONE', content: 'Command exited with code 0.' }
    ];

    const passed = verifyTranscriptDeliveryGate(verifiedSteps);
    assert.equal(passed.ok, true);
    assert.equal(passed.missingCodeVerification, false);
  });

  it('requires UI geometry probe or smoke runner after UI edits (.css/.html) and ignores cognitive docs', () => {
    const uiUnprobed = [
      { step_index: 1, type: 'USER_INPUT', source: 'USER_EXPLICIT', content: 'Adjust HUD layout' },
      {
        step_index: 2,
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'edit_file', args: { Path: 'c:/app/ui/dashboard.css' } }]
      },
      {
        step_index: 3,
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'run_command', args: { CommandLine: 'npm test' } }]
      }
    ];

    const uiVerdict = verifyTranscriptDeliveryGate(uiUnprobed);
    assert.equal(uiVerdict.ok, false);
    assert.equal(uiVerdict.missingUiVerification, true);

    const uiProbed = [
      ...uiUnprobed,
      {
        step_index: 4,
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'call_mcp_tool', args: { ServerName: 'chrome-devtools', ToolName: 'evaluate_script' } }]
      }
    ];
    assert.equal(verifyTranscriptDeliveryGate(uiProbed).ok, true);

    const docsOnly = [
      { step_index: 1, type: 'USER_INPUT', source: 'USER_EXPLICIT', content: '/memory-sync' },
      {
        step_index: 2,
        type: 'PLANNER_RESPONSE',
        tool_calls: [{ name: 'edit_file', args: { Path: 'c:/repo/MEMORY.md' } }]
      }
    ];
    assert.equal(verifyTranscriptDeliveryGate(docsOnly).ok, true);
  });

  it('enforces the 1-retry circuit breaker in delivery-gate-hook.mjs Stop mode', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'ag-delivery-gate-'));
    try {
      const transcriptFile = join(tempDir, 'transcript.jsonl');
      const lines = [
        JSON.stringify({ step_index: 1, type: 'USER_INPUT', source: 'USER_EXPLICIT', content: 'Edit file' }),
        JSON.stringify({
          step_index: 2,
          type: 'PLANNER_RESPONSE',
          tool_calls: [{ name: 'edit_file', args: { Path: 'c:/app/core/engine.mjs' } }]
        })
      ];
      writeFileSync(transcriptFile, lines.join('\n') + '\n', 'utf-8');

      const payload = JSON.stringify({
        conversationId: 'test-conv-cb',
        terminationReason: 'NO_TOOL_CALL',
        fullyIdle: true,
        transcriptPath: transcriptFile
      });

      const firstRun = spawnSync(process.execPath, [DELIVERY_HOOK_SCRIPT], {
        input: payload,
        encoding: 'utf-8',
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: tempDir }
      });
      assert.equal(firstRun.status, 0);
      const firstJson = JSON.parse(firstRun.stdout.trim());
      assert.equal(firstJson.decision, 'continue');
      assert.ok(firstJson.reason.includes('[DELIVERY-GATE]'));

      // Second invocation with identical edit signature must trip circuit breaker and allow stop
      const secondRun = spawnSync(process.execPath, [DELIVERY_HOOK_SCRIPT], {
        input: payload,
        encoding: 'utf-8',
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: tempDir }
      });
      assert.equal(secondRun.status, 0);
      assert.deepEqual(JSON.parse(secondRun.stdout.trim()), {});
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  it('validates smoke-flow configs, builds injectable geometry probe IIFE, and computes 4-measure receipts', () => {
    const valid = validateSmokeFlowConfig({
      baseUrl: 'http://127.0.0.1:8080',
      viewports: [
        { name: 'mobile', width: 360, height: 800 },
        { name: 'raspberry', width: 800, height: 480 }
      ],
      flows: [
        {
          name: 'toggle-layer',
          path: '/',
          steps: [{ action: 'click', selector: '#btn-layer' }],
          assertVisibleSelector: '#panel-active'
        }
      ]
    });
    assert.equal(valid.valid, true);
    assert.equal(valid.normalized.viewports.length, 2);

    const expr = buildInjectableProbeExpression();
    assert.ok(expr.includes('function runUiGeometryProbe'));
    assert.equal(expr.includes('export function'), false);

    const receipt = buildFourMeasureReceipt([
      {
        viewport: 'mobile (360x800)',
        flow: 'toggle-layer',
        beforeProbe: { pass: true, primaryCanvasRatio: 0.68, violations: [] },
        afterProbe: { pass: true, primaryCanvasRatio: 0.64, violations: [] },
        consoleErrors: [],
        interactionSucceeded: true
      }
    ]);
    assert.equal(receipt.overallPass, true);
    assert.equal(receipt.measures.screenBudget.percentFree, 64);
    assert.equal(receipt.measures.geometryProbe.violationsCount, 0);
  });
});

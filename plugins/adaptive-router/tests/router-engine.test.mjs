import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  PROMPT_ARCHETYPES,
  applyOfficialDocsCalibration,
  classifyPromptRoute,
  cleanPollutedModelRegistry,
  createDefaultCapabilityRegistry,
  discoverCapabilitiesFromTranscript,
  evaluateUiModelAlignment,
  extractExplicitReasoningMode,
  extractLatestTurnSettingsChange,
  formatHumanModelLabel,
  importSwarmModelsCatalog,
  inferModeCapability,
  inferModelCapability,
  normalizeCanonicalModelId,
  resolveActiveUiModelFromTranscript,
  resolveLutRoute,
  resolveSafeSubagentModel,
  sanitizeModelSelectionName
} from '../core/router-engine.mjs';
import { probeBuiltinChecksumDrift, scanBrainForCapabilities } from '../scripts/model-router.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_SCRIPT = join(__dirname, '..', 'scripts', 'model-router.mjs');
const PRE_HOOK_SCRIPT = join(__dirname, '..', 'scripts', 'router-pre-hook.mjs');

describe('Adaptive Model & Effort Router Engine', () => {
  it('routes LOW, MEDIUM, and HIGH prompts with 100% accuracy across 20 benchmark cases', () => {
    const dataset = [
      // LOW (6 cases)
      { expected: 'LOW', model: 'flash_lite', effort: 'low', prompt: 'esegui i test' },
      { expected: 'LOW', model: 'flash_lite', effort: 'low', prompt: 'correggi il typo nel titolo di README.md' },
      { expected: 'LOW', model: 'flash_lite', effort: 'low', prompt: 'dove si trova il file validate.mjs?' },
      { expected: 'LOW', model: 'flash_lite', effort: 'low', prompt: '/memory-sync' },
      { expected: 'LOW', model: 'flash_lite', effort: 'low', prompt: 'rinomina la variabile maxT in maxTracks' },
      { expected: 'LOW', model: 'flash_lite', effort: 'low', prompt: 'aggiorna la versione a 1.2.1' },

      // MEDIUM (6 cases)
      {
        expected: 'MEDIUM',
        model: 'flash',
        effort: 'medium',
        prompt: "/how-its-made come funziona il calcolo dell'ETA in collector.mjs?"
      },
      {
        expected: 'MEDIUM',
        model: 'flash',
        effort: 'medium',
        prompt: 'spiegami il flusso di validazione del frontmatter YAML in scripts/validate.mjs'
      },
      {
        expected: 'MEDIUM',
        model: 'flash',
        effort: 'medium',
        prompt: 'aggiungi un test unitario per normalizePromptText quando riceve null o booleani'
      },
      {
        expected: 'MEDIUM',
        model: 'flash',
        effort: 'medium',
        prompt: 'gestisci il caso di file vuoto in parseTranscriptContent restituendo 0 token'
      },
      {
        expected: 'MEDIUM',
        model: 'flash',
        effort: 'medium',
        prompt: 'estendi il parser CLI di triage.mjs per supportare il flag --json'
      },
      {
        expected: 'MEDIUM',
        model: 'flash',
        effort: 'medium',
        prompt: 'correggi il bug sul path con spazi nella funzione normalizePath di bench.mjs'
      },

      // HIGH (8 cases, including readonly-start and micro-edit keyword edge cases)
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          'progetta un nuovo plugin per selezionare in base al prompt il miglior modello AI e il livello High/Medium/Low bilanciando UX, latenza e casi limite'
      },
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          "rifattorizza l'architettura di sincronizzazione tra sync-to-global.mjs, eta-injector.mjs e validate.mjs per evitare race condition su Windows"
      },
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          'come conviene strutturare il sistema di auto-apprendimento continuo tra session-miner, mapek e pattern-harvester riducendo i falsi positivi?'
      },
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          'analizza il problema di regressione multi-file per cui i subagent vengono contati come sessioni umane in governor-hook.mjs e session-backfill.mjs'
      },
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          'fai un piano per ottimizzare il consumo di token su tutte le regole e skill del repository mantenendo la compatibilità con il validatore'
      },
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          "valuta i pro e contro tra usare Connect-RPC locale o un hook PreInvocation per modulare l'effort del modello nell'interfaccia utente"
      },
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          "Come mai il parser va in race condition con la cache sulla vista mobile e quale strategia conviene per risolvere l'errore?"
      },
      {
        expected: 'HIGH',
        model: 'pro',
        effort: 'high',
        prompt:
          'Esegui la rifattorizzazione del motore core, rinomina le API nei plugin e ottimizza il fallback della cache sulla dashboard'
      }
    ];

    for (const item of dataset) {
      const res = classifyPromptRoute(item.prompt);
      assert.equal(res.tier, item.expected, `Failed tier on prompt: "${item.prompt}" (got ${res.tier})`);
      assert.equal(res.subagentModel, item.model, `Failed model on prompt: "${item.prompt}"`);
      assert.equal(res.effort, item.effort, `Failed effort on prompt: "${item.prompt}"`);
    }
  });

  it('infers capabilities of future unknown models and effort modes at day zero', () => {
    const ultra = inferModelCapability('Gemini 4.0 Ultra Thinking');
    assert.equal(ultra.tier, 'HIGH');
    assert.equal(ultra.effort, 'high');
    assert.equal(ultra.confidence, 'lexical');

    const haiku = inferModelCapability('Claude 5 Haiku Instant');
    assert.equal(haiku.tier, 'LOW');
    assert.equal(haiku.effort, 'low');
    assert.equal(haiku.confidence, 'lexical');

    const sonnet = inferModelCapability('Claude 4.5 Sonnet Standard');
    assert.equal(sonnet.tier, 'MEDIUM');
    assert.equal(sonnet.effort, 'medium');

    const opaque = inferModelCapability('Project-Nebula-X9');
    assert.equal(opaque.tier, 'MEDIUM');
    assert.equal(opaque.confidence, 'fallback');

    assert.equal(inferModeCapability('Ultra-Deep Reasoning').mappedTier, 'HIGH');
    assert.equal(inferModeCapability('Minimal Instant').mappedTier, 'LOW');
    assert.equal(inferModeCapability('Adaptive Auto').mappedTier, 'MEDIUM');
  });

  it('empirically recalibrates an opaque model once >= 5 samples are collected', () => {
    // Initially opaque codename -> MEDIUM fallback
    const initial = inferModelCapability('Nebula-V2', { samples: 2, avgDurationMs: 68000, avgOutputTokens: 2500 });
    assert.equal(initial.tier, 'MEDIUM');
    assert.equal(initial.confidence, 'fallback');

    // After 5 samples showing deep reasoning duration (68s) -> promoted to HIGH
    const calibratedHigh = inferModelCapability('Nebula-V2', {
      samples: 5,
      avgDurationMs: 68000,
      avgOutputTokens: 2500,
      errorRate: 0
    });
    assert.equal(calibratedHigh.tier, 'HIGH');
    assert.equal(calibratedHigh.confidence, 'empirical');

    // Fast model (< 18s, low tokens, low error rate) after 6 samples -> calibrated to LOW
    const calibratedLow = inferModelCapability('Nebula-Sprinter', {
      samples: 6,
      avgDurationMs: 11000,
      avgOutputTokens: 320,
      errorRate: 0.01
    });
    assert.equal(calibratedLow.tier, 'LOW');
    assert.equal(calibratedLow.confidence, 'empirical');
  });

  it('auto-discovers new models and modes from transcript <USER_SETTINGS_CHANGE> and PLANNER_RESPONSE', () => {
    const sampleTranscript = [
      JSON.stringify({
        step_index: 0,
        type: 'USER_INPUT',
        source: 'USER_EXPLICIT',
        created_at: '2026-11-07T12:00:00.000Z',
        content:
          '<USER_SETTINGS_CHANGE>\nChanged `Model Selection` from `Gemini 2.5 Flash` to `Gemini 4.0 Ultra`.\nChanged `Thinking Level` from `Medium` to `Extended Max`.\n</USER_SETTINGS_CHANGE>\n<USER_REQUEST>Progetta il nuovo archivio</USER_REQUEST>'
      }),
      JSON.stringify({
        step_index: 1,
        type: 'PLANNER_RESPONSE',
        source: 'MODEL',
        model: 'claude-5-haiku-mini',
        output_tokens: 280,
        created_at: '2026-11-07T12:00:12.000Z',
        tool_calls: [{ name: 'view_file' }]
      })
    ].join('\n');

    const res = discoverCapabilitiesFromTranscript(sampleTranscript);
    assert.ok(res.newlyDiscoveredModels.includes('Gemini 4.0 Ultra'));
    assert.ok(res.newlyDiscoveredModels.includes('claude-5-haiku-mini'));
    assert.ok(res.newlyDiscoveredModes.includes('Extended Max'));

    assert.equal(res.registry.models['gemini 4.0 ultra'].tier, 'HIGH');
    assert.equal(res.registry.models['claude-5-haiku-mini'].tier, 'LOW');
    assert.equal(res.registry.effortModes['extended max'].mappedTier, 'HIGH');
  });

  it('applies circuit-breaker fallback to inherit when a subagent tier is deprecated', () => {
    const reg = createDefaultCapabilityRegistry();
    assert.equal(resolveSafeSubagentModel('LOW', reg), 'flash_lite');

    reg.subagentTiers.flash_lite.status = 'deprecated';
    assert.equal(resolveSafeSubagentModel('LOW', reg), 'inherit');
  });

  it('detects UI model overprovisioning and underprovisioning mismatches', () => {
    const over = evaluateUiModelAlignment('LOW', 'Gemini 3.0 Ultra Pro');
    assert.equal(over.mismatchType, 'OVERPROVISIONED_UI_MODEL');
    assert.equal(over.uiModelTier, 'HIGH');

    const under = evaluateUiModelAlignment('HIGH', 'Claude 4 Haiku Mini');
    assert.equal(under.mismatchType, 'UNDERPROVISIONED_UI_MODEL');
    assert.equal(under.uiModelTier, 'LOW');

    const aligned = evaluateUiModelAlignment('MEDIUM', 'Gemini 2.5 Flash');
    assert.equal(aligned.mismatchType, 'NONE');
  });

  it('scans a brain directory end-to-end and executes CLI commands cleanly', () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'adaptive-router-test-'));
    try {
      const brainDir = join(tmpRoot, 'brain');
      const analyticsDir = join(tmpRoot, 'analytics');
      const builtinDir = join(tmpRoot, 'builtin');
      const convLogDir = join(brainDir, 'conv-123', '.system_generated', 'logs');
      mkdirSync(convLogDir, { recursive: true });
      mkdirSync(builtinDir, { recursive: true });

      writeFileSync(join(builtinDir, '.checksum'), 'sha256-future-v99\n', 'utf-8');
      writeFileSync(
        join(convLogDir, 'transcript.jsonl'),
        JSON.stringify({
          step_index: 0,
          type: 'USER_INPUT',
          source: 'USER_EXPLICIT',
          created_at: '2026-11-07T12:10:00.000Z',
          content:
            '<USER_SETTINGS_CHANGE>Changed `Model Selection` from `Default` to `Gemini 5.0 Deep Reasoner`.</USER_SETTINGS_CHANGE><USER_REQUEST>Test</USER_REQUEST>'
        }) + '\n',
        'utf-8'
      );

      const scanRes = scanBrainForCapabilities({ brainDir, analyticsDir, builtinDir });
      assert.equal(scanRes.scannedTranscripts, 1);
      assert.equal(scanRes.builtinChecksumDrifted, true);
      assert.ok(scanRes.newlyDiscoveredModels.includes('Gemini 5.0 Deep Reasoner'));
      assert.equal(scanRes.registry.models['gemini 5.0 deep reasoner'].tier, 'HIGH');

      const cliOut = execFileSync(
        process.execPath,
        [CLI_SCRIPT, '--prompt', 'esegui i test', '--ui-model', 'Gemini 5.0 Deep Reasoner'],
        {
          env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
          encoding: 'utf-8'
        }
      );
      const parsed = JSON.parse(cliOut);
      assert.equal(parsed.tier, 'LOW');
      assert.equal(parsed.alignment.mismatchType, 'OVERPROVISIONED_UI_MODEL');
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('sanitizes trailing <USER_SETTINGS_CHANGE> boilerplate and preserves explicit (Low)/(Medium)/(High) reasoning tiers', () => {
    const rawNotice =
      "Gemini 4 Carbon (Low). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.";
    assert.equal(sanitizeModelSelectionName(rawNotice), 'Gemini 4 Carbon (Low)');
    assert.deepEqual(extractExplicitReasoningMode('Gemini 4 Carbon (Low)'), {
      tier: 'LOW',
      effort: 'low',
      modeLabel: 'Low'
    });
    assert.deepEqual(extractExplicitReasoningMode('Gemini 4 Hydrogen (XHigh)'), {
      tier: 'HIGH',
      effort: 'high',
      modeLabel: 'XHigh'
    });

    // Explicit (Low) mode must NOT be promoted to HIGH even if empirical multi-tool duration > 55s
    const lowWithLongTurns = inferModelCapability('Gemini 4 Carbon (Low)', {
      samples: 12,
      avgDurationMs: 103000,
      avgOutputTokens: 5200,
      errorRate: 0.02
    });
    assert.equal(lowWithLongTurns.tier, 'LOW');
    assert.equal(lowWithLongTurns.effort, 'low');

    // Polluted registry entries are migrated cleanly
    const dirtyReg = createDefaultCapabilityRegistry();
    dirtyReg.models[
      "gemini 4 carbon (low). no need to comment on this change if the user doesn't ask about it"
    ] = {
      displayName: rawNotice,
      tier: 'HIGH',
      effort: 'high',
      source: 'auto-discovered',
      samples: 5,
      avgDurationMs: 103412,
      avgOutputTokens: 5253,
      errorRate: 0.042
    };
    const cleaned = cleanPollutedModelRegistry(dirtyReg);
    assert.ok(!cleaned.models["gemini 4 carbon (low). no need to comment on this change if the user doesn't ask about it"]);
    assert.equal(cleaned.models['gemini 4 carbon (low)'].tier, 'LOW');
    assert.equal(cleaned.models['gemini 4 carbon (low)'].displayName, 'Gemini 4 Carbon (Low)');
  });

  it('intercepts the FEAT-033 underprovisioned audit scenario end-to-end in router-pre-hook.mjs while staying silent on aligned turns', () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'adaptive-router-prehook-'));
    try {
      const analyticsDir = join(tmpRoot, 'analytics');
      const transcriptPath = join(tmpRoot, 'transcript.jsonl');
      mkdirSync(analyticsDir, { recursive: true });

      const lines = [
        JSON.stringify({
          step_index: 0,
          type: 'USER_INPUT',
          source: 'USER_EXPLICIT',
          created_at: '2026-11-13T18:25:21Z',
          content:
            "<USER_REQUEST>/next-step</USER_REQUEST><USER_SETTINGS_CHANGE>The user changed setting `Model Selection` from None to Gemini 4 Carbon (Low). No need to comment on this change if the user doesn't ask about it.</USER_SETTINGS_CHANGE>"
        })
      ];
      writeFileSync(transcriptPath, lines.join('\n') + '\n', 'utf-8');

      assert.equal(resolveActiveUiModelFromTranscript(transcriptPath), 'Gemini 4 Carbon (Low)');

      const auditPrompt =
        'fai un audit sul piano voglio essere sicuro che non modifichiamo cose magari più recenti';
      const preHookOut = execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
        input: JSON.stringify({
          conversationId: 'feat-033-conv',
          invocationNum: 1,
          modelName: 'auto',
          transcriptPath,
          lastUserInput: auditPrompt
        }),
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
        encoding: 'utf-8'
      });

      const hookJson = JSON.parse(preHookOut);
      assert.ok(Array.isArray(hookJson.injectSteps), 'Expected injectSteps on UNDERPROVISIONED_UI_MODEL');
      assert.match(
        hookJson.injectSteps[0].systemMessage.systemMessage,
        /UNDERPROVISIONED_UI_MODEL/
      );
      assert.match(
        hookJson.injectSteps[0].systemMessage.systemMessage,
        /Gemini 4 Carbon \(Low\)/
      );

      // Aligned LOW turn ("esegui i test") on Low mode -> silent {}
      const alignedOut = execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
        input: JSON.stringify({
          conversationId: 'feat-033-conv',
          invocationNum: 1,
          modelName: 'auto',
          transcriptPath,
          lastUserInput: 'esegui i test'
        }),
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
        encoding: 'utf-8'
      });
      assert.deepEqual(JSON.parse(alignedOut), {});
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('tracks PreInvocation contract hash across builtin .checksum updates and emits a one-time notice when the hook contract changes', () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'adaptive-router-harness-'));
    try {
      const analyticsDir = join(tmpRoot, 'analytics');
      const builtinDir = join(tmpRoot, 'builtin');
      const hooksDocDir = join(builtinDir, 'skills', 'agy-customizations', 'docs');
      mkdirSync(analyticsDir, { recursive: true });
      mkdirSync(hooksDocDir, { recursive: true });

      const hooksV1 = [
        '# Lifecycle Hooks',
        '### 4. `PreInvocation` Contract',
        'Output: `injectSteps` and `terminationBehavior`.',
        '### 5. `PostInvocation` Contract'
      ].join('\n');
      writeFileSync(join(builtinDir, '.checksum'), 'builtin:v1\n', 'utf-8');
      writeFileSync(join(hooksDocDir, 'hooks.md'), hooksV1, 'utf-8');

      const reg = createDefaultCapabilityRegistry();
      const firstProbe = probeBuiltinChecksumDrift(reg, builtinDir);
      assert.equal(firstProbe.drifted, true);
      assert.equal(Boolean(reg.pendingHarnessUpgradeNotice), false);

      // Routine checksum bump WITHOUT PreInvocation contract change -> no false-positive alert
      writeFileSync(join(builtinDir, '.checksum'), 'builtin:v2\n', 'utf-8');
      const secondProbe = probeBuiltinChecksumDrift(reg, builtinDir);
      assert.equal(secondProbe.drifted, true);
      assert.equal(secondProbe.contractChanged, false);
      assert.equal(Boolean(reg.pendingHarnessUpgradeNotice), false);

      // Checksum bump WITH PreInvocation contract change (e.g. modelOverride added!) -> triggers one-time notice
      const hooksV3 = [
        '# Lifecycle Hooks',
        '### 4. `PreInvocation` Contract',
        'Output: `injectSteps`, `terminationBehavior`, and `modelOverride` (`thinkingLevel`).',
        '### 5. `PostInvocation` Contract'
      ].join('\n');
      writeFileSync(join(builtinDir, '.checksum'), 'builtin:v3\n', 'utf-8');
      writeFileSync(join(hooksDocDir, 'hooks.md'), hooksV3, 'utf-8');

      const thirdProbe = probeBuiltinChecksumDrift(reg, builtinDir);
      assert.equal(thirdProbe.drifted, true);
      assert.equal(thirdProbe.contractChanged, true);
      assert.equal(thirdProbe.preInvocationModelOverrideSupported, true);
      assert.ok(reg.pendingHarnessUpgradeNotice);
      writeFileSync(
        join(analyticsDir, 'model-capabilities.json'),
        JSON.stringify(reg, null, 2) + '\n',
        'utf-8'
      );

      // First PreInvocation turn surfaces the harness update notice once
      const firstTurnOut = execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
        input: JSON.stringify({
          conversationId: 'conv-upgrade',
          invocationNum: 1,
          modelName: 'Gemini 4 Carbon (Medium)',
          lastUserInput: 'dove si trova validate.mjs?'
        }),
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
        encoding: 'utf-8'
      });
      const firstTurnJson = JSON.parse(firstTurnOut);
      assert.ok(Array.isArray(firstTurnJson.injectSteps));
      assert.match(firstTurnJson.injectSteps[0].systemMessage.systemMessage, /HARNESS_CONTRACT_UPDATED/);

      // Second PreInvocation turn stays silent (already notified)
      const secondTurnOut = execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
        input: JSON.stringify({
          conversationId: 'conv-upgrade',
          invocationNum: 1,
          modelName: 'Gemini 4 Carbon (Medium)',
          lastUserInput: 'dove si trova validate.mjs?'
        }),
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
        encoding: 'utf-8'
      });
      assert.deepEqual(JSON.parse(secondTurnOut), {});
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('normalizes canonical model IDs, formats human labels, and emits immediate inline user_markdown on model or mode changes', () => {
    assert.equal(
      normalizeCanonicalModelId('Gemini 4 Carbon (Medium)'),
      normalizeCanonicalModelId('gemini-4-carbon-medium')
    );
    assert.equal(
      normalizeCanonicalModelId('Claude Sonnet 5.5 (High)'),
      normalizeCanonicalModelId('claude-sonnet-5-5-high')
    );
    assert.equal(
      normalizeCanonicalModelId('Gemini 3.8 Flash (Low)'),
      normalizeCanonicalModelId('gemini-3.8-flash-low')
    );
    assert.equal(formatHumanModelLabel('gemini-4-carbon-medium'), 'Gemini 4 Carbon (Medium)');
    assert.equal(formatHumanModelLabel('claude-opus-5-5-high'), 'Claude Opus 5.5 (High)');
    assert.equal(formatHumanModelLabel('gemini-4-hydrogen-xhigh'), 'Gemini 4 Hydrogen (XHigh)');

    const tmpRoot = mkdtempSync(join(tmpdir(), 'adaptive-router-notify-'));
    try {
      const analyticsDir = join(tmpRoot, 'analytics');
      const transcriptPath = join(tmpRoot, 'transcript.jsonl');
      mkdirSync(analyticsDir, { recursive: true });

      // Turn 1: starts quietly with default model (no <USER_SETTINGS_CHANGE>) -> silent {}
      writeFileSync(
        transcriptPath,
        JSON.stringify({
          step_index: 0,
          type: 'USER_INPUT',
          source: 'USER_EXPLICIT',
          content: '<USER_REQUEST>esegui i test</USER_REQUEST>'
        }) + '\n',
        'utf-8'
      );
      assert.equal(extractLatestTurnSettingsChange(transcriptPath), null);

      const t1Out = execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
        input: JSON.stringify({
          conversationId: 'conv-notify',
          invocationNum: 1,
          modelName: 'gemini-4-carbon-low',
          transcriptPath,
          lastUserInput: 'esegui i test'
        }),
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
        encoding: 'utf-8'
      });
      assert.deepEqual(JSON.parse(t1Out), {});

      // Mid-turn or next-turn switch from Low to High (even on invocationNum: 2) -> immediate user_markdown!
      const t2Out = execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
        input: JSON.stringify({
          conversationId: 'conv-notify',
          invocationNum: 2,
          modelName: 'gemini-4-carbon-high',
          transcriptPath,
          lastUserInput: 'esegui i test'
        }),
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
        encoding: 'utf-8'
      });
      const t2Json = JSON.parse(t2Out);
      assert.ok(Array.isArray(t2Json.injectSteps));
      assert.equal(t2Json.injectSteps[0].systemMessage.systemMessage, '');
      assert.match(
        t2Json.injectSteps[0].systemMessage.metadata.user_markdown,
        /Gemini 4 Carbon \(Low\).*->.*Gemini 4 Carbon \(High\)/
      );

      // Subsequent invocation on the same High model (even in display format) -> no duplicate banner!
      const t3Out = execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
        input: JSON.stringify({
          conversationId: 'conv-notify',
          invocationNum: 3,
          modelName: 'Gemini 4 Carbon (High)',
          transcriptPath,
          lastUserInput: 'esegui i test'
        }),
        env: { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir },
        encoding: 'utf-8'
      });
      assert.deepEqual(JSON.parse(t3Out), {});
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('imports the Gemini UI roster from swarm models, flags uncalibrated new families once, and resolves the 6-archetype LUT after official-docs calibration', () => {
    const swarmPayload = {
      models: [
        'claude-opus-5-5-high',
        'gemini-3.8-flash-low',
        'gemini-3.8-flash-medium',
        'gemini-3.8-flash-high',
        'gemini-4-argon-low',
        'gemini-4-argon-medium',
        'gemini-4-argon-high',
        'gemini-4-carbon-low',
        'gemini-4-carbon-medium',
        'gemini-4-carbon-high',
        'gemini-4-hydrogen-low',
        'gemini-4-hydrogen-medium',
        'gemini-4-hydrogen-high',
        'gemini-4-hydrogen-xhigh',
        'gemini-pro-orchestrator',
        'gemini-pro-orchestrator-argon'
      ],
      display_names: {
        'claude-opus-5-5-high': 'Claude Opus 5.5 (High)',
        'gemini-3.8-flash-low': 'Gemini 3.8 Flash (Low)',
        'gemini-3.8-flash-medium': 'Gemini 3.8 Flash (Medium)',
        'gemini-3.8-flash-high': 'Gemini 3.8 Flash (High)',
        'gemini-4-argon-low': 'Gemini 4 Argon (Low)',
        'gemini-4-argon-medium': 'Gemini 4 Argon (Medium)',
        'gemini-4-argon-high': 'Gemini 4 Argon (High)',
        'gemini-4-carbon-low': 'Gemini 4 Carbon (Low)',
        'gemini-4-carbon-medium': 'Gemini 4 Carbon (Medium)',
        'gemini-4-carbon-high': 'Gemini 4 Carbon (High)',
        'gemini-4-hydrogen-low': 'Gemini 4 Hydrogen (Low)',
        'gemini-4-hydrogen-medium': 'Gemini 4 Hydrogen (Medium)',
        'gemini-4-hydrogen-high': 'Gemini 4 Hydrogen (High)',
        'gemini-4-hydrogen-xhigh': 'Gemini 4 Hydrogen (XHigh)',
        'gemini-pro-orchestrator': 'Orchestrator (Carbon)',
        'gemini-pro-orchestrator-argon': 'Orchestrator (Argon)'
      },
      quotas: {
        'gemini-4-carbon-high': { quota_remaining: '91%', quota_resets: '2026-11-13T23:25:04Z' }
      }
    };

    // Filter to Gemini UI families only (excluding Claude Opus per user preference)
    let reg = createDefaultCapabilityRegistry();
    const importRes = importSwarmModelsCatalog(reg, swarmPayload, { providerFilter: 'gemini-ui' });
    reg = importRes.registry;

    assert.equal(importRes.rosterChanged, true);
    assert.ok(!reg.availableRoster.includes('claude-opus-5-5-high'));
    assert.ok(reg.availableRoster.includes('gemini-4-hydrogen-xhigh'));
    assert.ok(reg.availableRoster.includes('gemini-pro-orchestrator'));
    assert.equal(reg.pendingDocCalibration.required, true);
    assert.ok(reg.pendingDocCalibration.uncalibratedFamilies.includes('Gemini 4 Hydrogen'));

    // Apply one-time official-docs calibration
    reg = applyOfficialDocsCalibration(reg, {
      sourceDocs: ['antigravity.google/docs', 'gemini-api-guides/latest-model.md'],
      calibratedFamilies: {
        'Gemini 4 Hydrogen': {
          roleClass: 'FAST_EXECUTION',
          officialSummaryIt: 'Successore rapido 2.5x di 3.8 Flash con modalità fino a XHigh per task operativi e subagent.'
        },
        'Gemini 4 Argon': {
          roleClass: 'EFFICIENT_CODING',
          officialSummaryIt: 'Modello frontier efficiente per sviluppo software quotidiano, feature e test.'
        },
        'Gemini 4 Carbon': {
          roleClass: 'FRONTIER_HEAVYWEIGHT',
          officialSummaryIt: 'Modello frontier massimo per architettura, audit avversariale e debugging complesso.'
        },
        'Orchestrator (Carbon)': {
          roleClass: 'DYNAMIC_ORCHESTRATOR',
          officialSummaryIt: 'Orchestratore dinamico Carbon+Hydrogen (-24% quota, -19% latenza) per piani multi-file.'
        },
        'Orchestrator (Argon)': {
          roleClass: 'DYNAMIC_ORCHESTRATOR',
          officialSummaryIt: 'Orchestratore dinamico Argon+Hydrogen per flussi multi-step efficienti.'
        },
        'Gemini 3.8 Flash': {
          roleClass: 'LEGACY_FAST',
          officialSummaryIt: 'Modello rapido di generazione precedente.'
        }
      },
      archetypeTargets: {
        R1_MECHANICAL_OPS: {
          primaryUiModel: 'Gemini 4 Hydrogen (Low)',
          alternativeUiModel: 'Gemini 3.8 Flash (Low)',
          subagentModel: 'flash_lite',
          subagentType: 'self'
        },
        R2_QUICK_LOOKUP_MICROEDIT: {
          primaryUiModel: 'Gemini 4 Hydrogen (Low)',
          alternativeUiModel: 'Gemini 3.8 Flash (Low)',
          subagentModel: 'flash_lite',
          subagentType: 'research'
        },
        R3_CODE_INSPECTION: {
          primaryUiModel: 'Gemini 4 Hydrogen (Medium)',
          alternativeUiModel: 'Gemini 4 Argon (Low)',
          subagentModel: 'flash',
          subagentType: 'research'
        },
        R4_SINGLE_MODULE_DEV: {
          primaryUiModel: 'Gemini 4 Argon (Medium)',
          alternativeUiModel: 'Gemini 4 Hydrogen (High)',
          subagentModel: 'flash',
          subagentType: 'self'
        },
        R5_MULTI_FILE_REFACTOR: {
          primaryUiModel: 'Orchestrator (Carbon)',
          alternativeUiModel: 'Gemini 4 Argon (High)',
          subagentModel: 'pro',
          subagentType: 'self'
        },
        R6_DEEP_ARCH_TRADEOFF: {
          primaryUiModel: 'Gemini 4 Carbon (High)',
          alternativeUiModel: 'Gemini 4 Hydrogen (XHigh)',
          subagentModel: 'pro',
          subagentType: 'research'
        }
      }
    });

    assert.equal(reg.pendingDocCalibration.required, false);
    assert.equal(Object.keys(PROMPT_ARCHETYPES).length, 6);

    // R6 audit on Hydrogen Low -> triggers 1-click UPGRADE recommending Gemini 4 Carbon (High) + subagent 'pro'
    const r6OnLow = classifyPromptRoute(
      'fai un audit sul piano voglio essere sicuro che non modifichiamo cose magari più recenti',
      { registry: reg, activeUiModel: 'gemini-4-hydrogen-low' }
    );
    assert.equal(r6OnLow.archetypeId, 'R6_DEEP_ARCH_TRADEOFF');
    assert.equal(r6OnLow.lutRoute.recommendedUiModel, 'Gemini 4 Carbon (High)');
    assert.equal(r6OnLow.lutRoute.executionSubagentModel, 'pro');
    assert.equal(r6OnLow.lutRoute.switchAction, 'ASK_1CLICK_UPGRADE');

    // R5 multi-file refactor on Orchestrator (Carbon) -> ALREADY ALIGNED (no popup!)
    const r5OnOrch = classifyPromptRoute(
      "rifattorizza l'architettura tra sync-to-global.mjs, eta-injector.mjs e validate.mjs",
      { registry: reg, activeUiModel: 'gemini-pro-orchestrator' }
    );
    assert.equal(r5OnOrch.archetypeId, 'R5_MULTI_FILE_REFACTOR');
    assert.equal(r5OnOrch.lutRoute.switchAction, 'NONE');

    // R1 mechanical ops ("commit e push" / "esegui i test") on Carbon High -> SILENT NONE (zero popup!)
    const r1OnCarbonHigh = resolveLutRoute('R1_MECHANICAL_OPS', reg, 'gemini-4-carbon-high');
    assert.equal(r1OnCarbonHigh.switchAction, 'NONE');

    // Now simulate a future unknown model appearing in swarm catalog ("gemini-5-xenon-high") -> re-triggers one-time doc calibration!
    const futureRes = importSwarmModelsCatalog(
      reg,
      {
        models: [...swarmPayload.models, 'gemini-5-xenon-high'],
        display_names: { ...swarmPayload.display_names, 'gemini-5-xenon-high': 'Gemini 5 Xenon (High)' }
      },
      { providerFilter: 'gemini-ui' }
    );
    assert.equal(futureRes.rosterChanged, true);
    assert.equal(futureRes.registry.pendingDocCalibration.required, true);
    assert.ok(futureRes.registry.pendingDocCalibration.uncalibratedFamilies.includes('Gemini 5 Xenon'));
  });

  it('executes end-to-end LUT hook & CLI lifecycle: one-time roster calibration notice, 2nd-turn 0-click downgrade hint, and session snooze', () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'adaptive-router-lut-e2e-'));
    try {
      const analyticsDir = join(tmpRoot, 'analytics');
      mkdirSync(analyticsDir, { recursive: true });
      const env = { ...process.env, ANTIGRAVITY_ANALYTICS_DIR: analyticsDir };

      const swarmFile = join(tmpRoot, 'swarm-models.json');
      writeFileSync(
        swarmFile,
        JSON.stringify({
          models: [
            'gemini-4-hydrogen-low',
            'gemini-4-argon-medium',
            'gemini-4-carbon-high',
            'gemini-pro-orchestrator'
          ],
          display_names: {
            'gemini-4-hydrogen-low': 'Gemini 4 Hydrogen (Low)',
            'gemini-4-argon-medium': 'Gemini 4 Argon (Medium)',
            'gemini-4-carbon-high': 'Gemini 4 Carbon (High)',
            'gemini-pro-orchestrator': 'Orchestrator (Carbon)'
          }
        }),
        'utf-8'
      );

      // 1. Sync swarm models -> marks uncalibrated families
      const syncOut = JSON.parse(
        execFileSync(process.execPath, [CLI_SCRIPT, '--sync-swarm-models', swarmFile], {
          env,
          encoding: 'utf-8'
        })
      );
      assert.equal(syncOut.rosterChanged, true);
      assert.ok(syncOut.uncalibratedFamilies.includes('Gemini 4 Hydrogen'));

      // 2. First PreInvocation turn injects CALIBRATE_MODEL_ROSTER_ONCE once, second turn is silent
      const t1 = JSON.parse(
        execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
          input: JSON.stringify({
            conversationId: 'conv-cal',
            invocationNum: 1,
            modelName: 'gemini-pro-orchestrator',
            lastUserInput: 'esegui i test'
          }),
          env,
          encoding: 'utf-8'
        })
      );
      assert.ok(Array.isArray(t1.injectSteps));
      assert.match(t1.injectSteps[0].systemMessage.systemMessage, /CALIBRATE_MODEL_ROSTER_ONCE/);

      const t2 = JSON.parse(
        execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
          input: JSON.stringify({
            conversationId: 'conv-cal',
            invocationNum: 1,
            modelName: 'gemini-pro-orchestrator',
            lastUserInput: 'esegui i test'
          }),
          env,
          encoding: 'utf-8'
        })
      );
      assert.deepEqual(t2, {});

      // 3. Apply calibration via CLI + inspect --lut Markdown output
      const calFile = join(tmpRoot, 'calibration.json');
      writeFileSync(
        calFile,
        JSON.stringify({
          sourceDocs: ['antigravity.google/docs'],
          calibratedFamilies: {
            'Gemini 4 Hydrogen': { roleClass: 'FAST_EXECUTION', officialSummaryIt: 'Veloce.' },
            'Gemini 4 Argon': { roleClass: 'EFFICIENT_CODING', officialSummaryIt: 'Coding.' },
            'Gemini 4 Carbon': { roleClass: 'FRONTIER_HEAVYWEIGHT', officialSummaryIt: 'Architettura.' },
            'Orchestrator (Carbon)': { roleClass: 'DYNAMIC_ORCHESTRATOR', officialSummaryIt: 'Dinamico.' }
          },
          archetypeTargets: {
            R2_QUICK_LOOKUP_MICROEDIT: {
              primaryUiModel: 'Gemini 4 Hydrogen (Low)',
              alternativeUiModel: 'Gemini 3.8 Flash (Low)',
              subagentModel: 'flash_lite',
              subagentType: 'research'
            },
            R6_DEEP_ARCH_TRADEOFF: {
              primaryUiModel: 'Gemini 4 Carbon (High)',
              alternativeUiModel: 'Gemini 4 Hydrogen (XHigh)',
              subagentModel: 'pro',
              subagentType: 'research'
            }
          }
        }),
        'utf-8'
      );
      const calOut = JSON.parse(
        execFileSync(process.execPath, [CLI_SCRIPT, '--apply-calibration', calFile], {
          env,
          encoding: 'utf-8'
        })
      );
      assert.equal(calOut.calibrated, true);
      assert.equal(calOut.pendingDocCalibration.required, false);

      const lutMd = execFileSync(process.execPath, [CLI_SCRIPT, '--lut'], {
        env,
        encoding: 'utf-8'
      });
      assert.match(lutMd, /Matrice LUT a 6 Archetipi/);
      assert.match(lutMd, /Gemini 4 Hydrogen \(Low\)/);

      // 4. 0-click downgrade hint fires only on the 2nd consecutive lightweight R2 turn on Carbon (High)
      const light1 = JSON.parse(
        execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
          input: JSON.stringify({
            conversationId: 'conv-over',
            invocationNum: 1,
            modelName: 'gemini-4-carbon-high',
            lastUserInput: 'dove si trova il file validate.mjs?'
          }),
          env,
          encoding: 'utf-8'
        })
      );
      assert.deepEqual(light1, {});

      const light2 = JSON.parse(
        execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
          input: JSON.stringify({
            conversationId: 'conv-over',
            invocationNum: 1,
            modelName: 'gemini-4-carbon-high',
            lastUserInput: 'correggi il typo nel titolo di README.md'
          }),
          env,
          encoding: 'utf-8'
        })
      );
      assert.ok(Array.isArray(light2.injectSteps));
      assert.match(
        light2.injectSteps[0].systemMessage.metadata.user_markdown,
        /Consigliato nel selettore: \*\*Gemini 4 Hydrogen \(Low\)\*\*/
      );

      // 5. Session snooze suppresses 1-click upgrade popup
      execFileSync(process.execPath, [CLI_SCRIPT, '--snooze-session', 'conv-snoozed'], {
        env,
        encoding: 'utf-8'
      });
      const snoozedOut = JSON.parse(
        execFileSync(process.execPath, [PRE_HOOK_SCRIPT], {
          input: JSON.stringify({
            conversationId: 'conv-snoozed',
            invocationNum: 1,
            modelName: 'gemini-4-hydrogen-low',
            lastUserInput: 'fai un audit approfondito sul piano architetturale'
          }),
          env,
          encoding: 'utf-8'
        })
      );
      assert.deepEqual(snoozedOut, {});
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

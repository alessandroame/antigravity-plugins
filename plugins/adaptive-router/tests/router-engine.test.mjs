import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  classifyPromptRoute,
  createDefaultCapabilityRegistry,
  discoverCapabilitiesFromTranscript,
  evaluateUiModelAlignment,
  inferModeCapability,
  inferModelCapability,
  resolveSafeSubagentModel
} from '../core/router-engine.mjs';
import { scanBrainForCapabilities } from '../scripts/model-router.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_SCRIPT = join(__dirname, '..', 'scripts', 'model-router.mjs');

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
});

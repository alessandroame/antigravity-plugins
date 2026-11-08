#!/usr/bin/env node

/**
 * Adaptive Model & Effort Router CLI & Registry Manager
 * Manages persistent capability registry (`model-capabilities.json`),
 * built-in checksum drift detection, session transcript scanning, and prompt routing inspection.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  classifyPromptRoute,
  createDefaultCapabilityRegistry,
  discoverCapabilitiesFromTranscript,
  inferModelCapability
} from '../core/router-engine.mjs';
import {
  classifySelfLearningCandidate,
  collectPendingSupervisionAdvisories,
  evaluatePromptForPreventiveReview,
  isDirectCliEntrypoint,
  recordCloudTurnEvent
} from '../../proactive-mentorship/scripts/session-miner.mjs';

export function getAnalyticsDir(customDir) {
  if (customDir) return resolve(customDir);
  if (process.env.ANTIGRAVITY_ANALYTICS_DIR) return resolve(process.env.ANTIGRAVITY_ANALYTICS_DIR);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

export function getBrainDir(customDir) {
  if (customDir) return resolve(customDir);
  if (process.env.ANTIGRAVITY_BRAIN_DIR) return resolve(process.env.ANTIGRAVITY_BRAIN_DIR);
  const candidates = [
    join(homedir(), '.gemini', 'antigravity', 'brain'),
    join(homedir(), '.gemini', 'jetski', 'brain')
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0];
}

export function getRegistryPath(analyticsDir) {
  return join(getAnalyticsDir(analyticsDir), 'model-capabilities.json');
}

export function loadCapabilityRegistry(analyticsDir) {
  const regPath = getRegistryPath(analyticsDir);
  const fallback = createDefaultCapabilityRegistry();
  if (!existsSync(regPath)) return fallback;
  try {
    const parsed = JSON.parse(readFileSync(regPath, 'utf-8'));
    return {
      ...fallback,
      ...parsed,
      subagentTiers: { ...fallback.subagentTiers, ...(parsed.subagentTiers || {}) },
      effortModes: { ...fallback.effortModes, ...(parsed.effortModes || {}) },
      models: { ...fallback.models, ...(parsed.models || {}) }
    };
  } catch {
    return fallback;
  }
}

export function saveCapabilityRegistry(registry, analyticsDir) {
  const dir = getAnalyticsDir(analyticsDir);
  mkdirSync(dir, { recursive: true });
  const regPath = getRegistryPath(dir);
  writeFileSync(regPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
  return regPath;
}

/**
 * Checks `~/.gemini/antigravity/builtin/.checksum` for IDE updates and probes built-in definitions
 * for newly added subagent model tiers.
 */
export function probeBuiltinChecksumDrift(registry, customBuiltinDir) {
  const builtinDir = customBuiltinDir || join(homedir(), '.gemini', 'antigravity', 'builtin');
  const checksumPath = join(builtinDir, '.checksum');
  if (!existsSync(checksumPath)) {
    return { drifted: false, checksum: registry.builtinChecksum || null };
  }

  try {
    const currentChecksum = readFileSync(checksumPath, 'utf-8').trim();
    const drifted = Boolean(currentChecksum && currentChecksum !== registry.builtinChecksum);
    if (drifted) {
      registry.builtinChecksum = currentChecksum;
      registry.updatedAtMs = Date.now();
    }
    return { drifted, checksum: currentChecksum };
  } catch {
    return { drifted: false, checksum: registry.builtinChecksum || null };
  }
}

/**
 * Scans recent `transcript.jsonl` files in the brain directory to auto-discover models and calibrate metrics.
 */
export function scanBrainForCapabilities(options = {}) {
  const analyticsDir = getAnalyticsDir(options.analyticsDir);
  const brainDir = getBrainDir(options.brainDir);
  let registry = loadCapabilityRegistry(analyticsDir);
  const allNewModels = [];
  const allNewModes = [];
  const allRecalibrated = [];
  let scannedTranscripts = 0;

  const drift = probeBuiltinChecksumDrift(registry, options.builtinDir);

  function walkTranscripts(dir, depth = 0) {
    if (depth > 5 || !existsSync(dir)) return;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        const directTranscript = join(full, '.system_generated', 'logs', 'transcript.jsonl');
        if (existsSync(directTranscript)) {
          try {
            const raw = readFileSync(directTranscript, 'utf-8');
            const res = discoverCapabilitiesFromTranscript(raw, registry);
            registry = res.registry;
            allNewModels.push(...res.newlyDiscoveredModels);
            allNewModes.push(...res.newlyDiscoveredModes);
            allRecalibrated.push(...res.recalibratedModels);
            scannedTranscripts += 1;
          } catch {
            // Skip unreadable transcript
          }
        } else if (ent.name !== '.system_generated' && ent.name !== 'node_modules') {
          walkTranscripts(full, depth + 1);
        }
      }
    }
  }

  walkTranscripts(brainDir, 0);
  saveCapabilityRegistry(registry, analyticsDir);

  return {
    scannedTranscripts,
    builtinChecksumDrifted: drift.drifted,
    newlyDiscoveredModels: [...new Set(allNewModels)],
    newlyDiscoveredModes: [...new Set(allNewModes)],
    recalibratedModels: [...new Set(allRecalibrated)],
    registry
  };
}

function formatStatusMarkdown(registry) {
  const models = Object.entries(registry.models || {});
  const modes = Object.entries(registry.effortModes || {});
  const tiers = Object.entries(registry.subagentTiers || {});

  const lines = [
    '# Stato Registro Capacità & Modelli (`adaptive-router`)',
    '',
    `- **Modelli censiti**: \`${models.length}\` · **Modalità Effort**: \`${modes.length}\` · **Tier Subagent**: \`${tiers.map(([k]) => k).join(', ')}\``,
    '',
    '| Modello | Fascia (`Tier`) | Effort | Origine | Campioni | Durata Media |',
    '| :--- | :---: | :---: | :---: | :---: | :---: |'
  ];

  for (const [key, m] of models) {
    const sec = m.avgDurationMs ? `${Math.round(m.avgDurationMs / 1000)}s` : 'n/d';
    lines.push(
      `| \`${m.displayName || key}\` | **\`${m.tier}\`** | \`${m.effort}\` | \`${m.source || 'seed'}\` | \`${m.samples || 0}\` | \`${sec}\` |`
    );
  }

  return lines.join('\n');
}

const isDirectEntry = isDirectCliEntrypoint(import.meta.url, process.argv[1]);

if (isDirectEntry) {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const doScan = args.includes('--scan');
  const doStatus = args.includes('--status');

  const promptIdx = args.indexOf('--prompt');
  const uiModelIdx = args.indexOf('--ui-model');
  const registerModelIdx = args.indexOf('--register-model');

  const activeUiModel = uiModelIdx !== -1 && args[uiModelIdx + 1] ? args[uiModelIdx + 1] : null;

  if (registerModelIdx !== -1 && args[registerModelIdx + 1]) {
    const rawM = args[registerModelIdx + 1].trim();
    const reg = loadCapabilityRegistry();
    const inferred = inferModelCapability(rawM);
    reg.models[rawM.toLowerCase()] = {
      displayName: rawM,
      tier: inferred.tier,
      effort: inferred.effort,
      confidence: inferred.confidence,
      source: 'manual-cli',
      samples: 0,
      avgDurationMs: inferred.tier === 'HIGH' ? 60000 : inferred.tier === 'LOW' ? 14000 : 28000,
      avgOutputTokens: inferred.tier === 'HIGH' ? 1600 : inferred.tier === 'LOW' ? 400 : 900,
      errorRate: 0
    };
    saveCapabilityRegistry(reg);
  }

  if (doScan) {
    const scanRes = scanBrainForCapabilities();
    if (asJson) {
      process.stdout.write(`${JSON.stringify(scanRes, null, 2)}\n`);
    } else {
      process.stdout.write(`${formatStatusMarkdown(scanRes.registry)}\n`);
    }
    process.exit(0);
  }

  if (doStatus) {
    const reg = loadCapabilityRegistry();
    if (asJson) {
      process.stdout.write(`${JSON.stringify(reg, null, 2)}\n`);
    } else {
      process.stdout.write(`${formatStatusMarkdown(reg)}\n`);
    }
    process.exit(0);
  }

  const rawPrompt =
    promptIdx !== -1 && args[promptIdx + 1]
      ? args[promptIdx + 1]
      : args.filter((a) => !a.startsWith('--')).join(' ');

  const reg = loadCapabilityRegistry();
  const route = classifyPromptRoute(rawPrompt, { registry: reg, activeUiModel });
  recordCloudTurnEvent({ userText: rawPrompt, tier: route.tier });
  const promptReview = evaluatePromptForPreventiveReview(rawPrompt);
  const selfLearning = classifySelfLearningCandidate(rawPrompt);
  const supervision = collectPendingSupervisionAdvisories();
  process.stdout.write(
    `${JSON.stringify(
      {
        ...route,
        promptReview,
        selfLearning,
        supervision
      },
      null,
      2
    )}\n`
  );
}

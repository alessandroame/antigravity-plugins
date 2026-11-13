#!/usr/bin/env node

/**
 * Adaptive Model & Effort Router CLI & Registry Manager
 * Manages persistent capability registry (`model-capabilities.json`),
 * built-in checksum drift detection, session transcript scanning, and prompt routing inspection.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  PROMPT_ARCHETYPES,
  applyOfficialDocsCalibration,
  classifyPromptRoute,
  cleanPollutedModelRegistry,
  createDefaultCapabilityRegistry,
  discoverCapabilitiesFromTranscript,
  extractModelBaseFamily,
  inferModelCapability,
  importSwarmModelsCatalog,
  resolveLutRoute,
  sanitizeModelSelectionName
} from '../core/router-engine.mjs';
import {
  classifySelfLearningCandidate,
  collectPendingSupervisionAdvisories,
  evaluatePromptForPreventiveReview,
  isDirectCliEntrypoint,
  recordCloudTurnEvent,
  triggerBackgroundCloudSyncIfNeeded
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
    return cleanPollutedModelRegistry({
      ...fallback,
      ...parsed,
      lutConfig: { ...fallback.lutConfig, ...(parsed.lutConfig || {}) },
      availableRoster: Array.isArray(parsed.availableRoster)
        ? parsed.availableRoster
        : fallback.availableRoster,
      swarmDisplayNames: { ...fallback.swarmDisplayNames, ...(parsed.swarmDisplayNames || {}) },
      liveQuotas: { ...fallback.liveQuotas, ...(parsed.liveQuotas || {}) },
      pendingRosterRefresh: {
        ...fallback.pendingRosterRefresh,
        ...(parsed.pendingRosterRefresh || {})
      },
      pendingDocCalibration: {
        ...fallback.pendingDocCalibration,
        ...(parsed.pendingDocCalibration || {})
      },
      lutCalibration: {
        ...fallback.lutCalibration,
        ...(parsed.lutCalibration || {}),
        calibratedFamilies: {
          ...(fallback.lutCalibration?.calibratedFamilies || {}),
          ...(parsed.lutCalibration?.calibratedFamilies || {})
        },
        archetypeTargets: {
          ...(fallback.lutCalibration?.archetypeTargets || {}),
          ...(parsed.lutCalibration?.archetypeTargets || {})
        }
      },
      subagentTiers: { ...fallback.subagentTiers, ...(parsed.subagentTiers || {}) },
      effortModes: { ...fallback.effortModes, ...(parsed.effortModes || {}) },
      models: { ...fallback.models, ...(parsed.models || {}) }
    });
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

export function inspectPreInvocationContract(builtinDir) {
  const hooksDocPath = join(builtinDir, 'skills', 'agy-customizations', 'docs', 'hooks.md');
  if (!existsSync(hooksDocPath)) {
    return { contractHash: null, preInvocationModelOverrideSupported: false };
  }

  try {
    const rawDoc = readFileSync(hooksDocPath, 'utf-8').replace(/\r\n/g, '\n');
    const secMatch = rawDoc.match(/###\s+4\.\s+`?PreInvocation`?\s+Contract([\s\S]*?)(?=\n###\s+5\.|\n##\s+|$)/i);
    const sectionText = (secMatch ? secMatch[0] : rawDoc).trim();
    const contractHash = createHash('sha256').update(sectionText).digest('hex').slice(0, 16);
    const preInvocationModelOverrideSupported =
      /\b(?:modelOverride|thinkingLevel|reasoningEffort|effortLevel|setModel|modelSelection)\b/i.test(
        sectionText
      );
    return { contractHash, preInvocationModelOverrideSupported };
  } catch {
    return { contractHash: null, preInvocationModelOverrideSupported: false };
  }
}

/**
 * Checks `~/.gemini/antigravity/builtin/.checksum` for IDE updates and hashes the `PreInvocation`
 * contract in `docs/hooks.md` to detect when programmatic model/effort override becomes available (`NOTE-004`).
 */
export function probeBuiltinChecksumDrift(registry, customBuiltinDir) {
  const builtinDir = customBuiltinDir || join(homedir(), '.gemini', 'antigravity', 'builtin');
  const checksumPath = join(builtinDir, '.checksum');
  if (!existsSync(checksumPath)) {
    return {
      drifted: false,
      contractChanged: false,
      preInvocationModelOverrideSupported: Boolean(registry.preInvocationModelOverrideSupported),
      checksum: registry.builtinChecksum || null
    };
  }

  try {
    const currentChecksum = readFileSync(checksumPath, 'utf-8').trim();
    const prevChecksum = registry.builtinChecksum || null;
    const drifted = Boolean(currentChecksum && currentChecksum !== prevChecksum);
    const contractInfo = inspectPreInvocationContract(builtinDir);

    const hadBaselineHash = Boolean(registry.preInvocationContractHash);
    const contractChanged = Boolean(
      hadBaselineHash &&
        contractInfo.contractHash &&
        contractInfo.contractHash !== registry.preInvocationContractHash
    );
    const newlyUnlockedOverride = Boolean(
      contractInfo.preInvocationModelOverrideSupported && !registry.preInvocationModelOverrideSupported
    );

    if (drifted || (!hadBaselineHash && contractInfo.contractHash)) {
      if (drifted && (contractChanged || newlyUnlockedOverride)) {
        registry.pendingHarnessUpgradeNotice = {
          detectedAtMs: Date.now(),
          previousChecksum: prevChecksum,
          currentChecksum,
          contractChanged,
          preInvocationModelOverrideSupported: contractInfo.preInvocationModelOverrideSupported,
          notifiedAtMs: null
        };
      }
      registry.builtinChecksum = currentChecksum;
      if (contractInfo.contractHash) {
        registry.preInvocationContractHash = contractInfo.contractHash;
      }
      registry.preInvocationModelOverrideSupported = Boolean(
        contractInfo.preInvocationModelOverrideSupported
      );
      registry.updatedAtMs = Date.now();
    }

    return {
      drifted,
      contractChanged,
      preInvocationModelOverrideSupported: Boolean(registry.preInvocationModelOverrideSupported),
      checksum: currentChecksum
    };
  } catch {
    return {
      drifted: false,
      contractChanged: false,
      preInvocationModelOverrideSupported: Boolean(registry.preInvocationModelOverrideSupported),
      checksum: registry.builtinChecksum || null
    };
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
    `- **Watchdog Harness (\`NOTE-004\`)**: checksum \`${registry.builtinChecksum ? registry.builtinChecksum.slice(0, 20) + '...' : 'n/d'}\` · hash \`PreInvocation\`: \`${registry.preInvocationContractHash || 'n/d'}\` · override modello pre-turno: \`${registry.preInvocationModelOverrideSupported ? 'DISPONIBILE' : 'IN ATTESA'}\``,
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

function parseJsonArgOrFile(rawArg) {
  if (!rawArg || typeof rawArg !== 'string') return {};
  const candidatePath = resolve(rawArg);
  if (existsSync(candidatePath)) {
    return JSON.parse(readFileSync(candidatePath, 'utf-8'));
  }
  return JSON.parse(rawArg);
}

export function formatLutMarkdown(registry, activeUiModel = null) {
  const roster = Array.isArray(registry.availableRoster) ? registry.availableRoster : [];
  const cal = registry.lutCalibration || {};
  const calibratedFamilies = cal.calibratedFamilies || {};
  const calibratedIso = cal.calibratedAtMs ? new Date(cal.calibratedAtMs).toISOString() : 'non calibrata';
  const docsList = Array.isArray(cal.sourceDocs) && cal.sourceDocs.length > 0
    ? cal.sourceDocs.join(', ')
    : 'nessuna fonte registrata';

  const variantsByFamily = new Map();
  for (const slug of roster) {
    const label = registry.swarmDisplayNames?.[slug.toLowerCase()] || slug;
    const fam = extractModelBaseFamily(label);
    if (!variantsByFamily.has(fam)) variantsByFamily.set(fam, []);
    variantsByFamily.get(fam).push(label);
  }

  const lines = [
    '# Tabella LUT Dinamica Prompt -> Modello + Modalità (`adaptive-router`)',
    '',
    `- **Filtro Provider**: \`${registry.lutConfig?.providerFilter || 'gemini-ui'}\` · **Varianti UI attive**: \`${roster.length}\` · **Stato calibrazione**: \`${registry.pendingDocCalibration?.required ? 'DA CALIBRARE' : 'ALLINEATA'}\``,
    `- **Ultima calibrazione documentazione ufficiale**: \`${calibratedIso}\` · **Fonti**: \`${docsList}\``,
    '',
    '## 1. Ruoli delle Famiglie Gemini / Orchestrator (Documentazione Ufficiale)',
    '',
    '| Famiglia UI | Classe Ruolo | Varianti Rilevate | Sintesi Ufficiale |',
    '| :--- | :---: | :---: | :--- |'
  ];

  const familyEntries = Object.entries(calibratedFamilies);
  if (familyEntries.length === 0) {
    lines.push('| *(in attesa di calibrazione)* | `n/d` | `0` | Esegui `--sync-swarm-models` + `--apply-calibration` |');
  } else {
    for (const [fam, info] of familyEntries) {
      const count = variantsByFamily.get(fam)?.length || 0;
      lines.push(
        `| **${fam}** | \`${info.roleClass}\` | \`${count}\` | ${info.officialSummaryIt || ''} |`
      );
    }
  }

  lines.push(
    '',
    '## 2. Matrice LUT a 6 Archetipi (`R1..R6`)',
    '',
    '| Archetipo | Fascia | Modello UI Consigliato | Alternativa UI | Subagent 1-Click |',
    '| :--- | :---: | :--- | :--- | :---: |'
  );

  for (const archKey of Object.keys(PROMPT_ARCHETYPES)) {
    const resolved = resolveLutRoute(archKey, registry, activeUiModel);
    lines.push(
      `| **\`${resolved.archetypeId}\`** (${resolved.archetypeLabelIt}) | **\`${resolved.targetTier}\`** | \`${resolved.recommendedUiModel}\` | \`${resolved.alternativeUiModel || '-'}\` | \`${resolved.executionSubagentType}\` (\`${resolved.executionSubagentModel}\`) |`
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
  const doLut = args.includes('--lut');

  const promptIdx = args.indexOf('--prompt');
  const uiModelIdx = args.indexOf('--ui-model');
  const registerModelIdx = args.indexOf('--register-model');
  const syncSwarmIdx = args.indexOf('--sync-swarm-models');
  const applyCalIdx = args.indexOf('--apply-calibration');
  const snoozeIdx = args.indexOf('--snooze-session');

  const activeUiModel =
    uiModelIdx !== -1 && args[uiModelIdx + 1]
      ? sanitizeModelSelectionName(args[uiModelIdx + 1])
      : null;

  if (snoozeIdx !== -1 && args[snoozeIdx + 1]) {
    const convId = args[snoozeIdx + 1].trim();
    const dir = getAnalyticsDir();
    mkdirSync(dir, { recursive: true });
    const routePath = join(dir, `.route_${convId}.json`);
    let existing = {};
    if (existsSync(routePath)) {
      try {
        existing = JSON.parse(readFileSync(routePath, 'utf-8'));
      } catch {
        existing = {};
      }
    }
    existing.conversationId = convId;
    existing.lutSnoozed = true;
    existing.updatedAtMs = Date.now();
    writeFileSync(routePath, JSON.stringify(existing) + '\n', 'utf-8');
    process.stdout.write(`${JSON.stringify({ snoozed: true, conversationId: convId })}\n`);
    process.exit(0);
  }

  if (args.includes('--ack-harness')) {
    const reg = loadCapabilityRegistry();
    reg.pendingHarnessUpgradeNotice = null;
    saveCapabilityRegistry(reg);
  }

  let didMutateLut = false;
  let syncSummary = null;

  if (syncSwarmIdx !== -1 && args[syncSwarmIdx + 1]) {
    const swarmPayload = parseJsonArgOrFile(args[syncSwarmIdx + 1]);
    const reg = loadCapabilityRegistry();
    const res = importSwarmModelsCatalog(reg, swarmPayload, { providerFilter: 'gemini-ui' });
    saveCapabilityRegistry(res.registry);
    didMutateLut = true;
    syncSummary = {
      rosterChanged: res.rosterChanged,
      uncalibratedFamilies: res.uncalibratedFamilies,
      rosterCount: res.registry.availableRoster.length
    };
  }

  if (applyCalIdx !== -1 && args[applyCalIdx + 1]) {
    const calPayload = parseJsonArgOrFile(args[applyCalIdx + 1]);
    const reg = loadCapabilityRegistry();
    const updatedReg = applyOfficialDocsCalibration(reg, calPayload);
    saveCapabilityRegistry(updatedReg);
    didMutateLut = true;
    syncSummary = {
      ...(syncSummary || {}),
      calibrated: true,
      pendingDocCalibration: updatedReg.pendingDocCalibration,
      rosterCount: updatedReg.availableRoster.length
    };
  }

  if (didMutateLut && !doLut && !doStatus && !doScan && promptIdx === -1) {
    process.stdout.write(`${JSON.stringify(syncSummary, null, 2)}\n`);
    process.exit(0);
  }

  if (registerModelIdx !== -1 && args[registerModelIdx + 1]) {
    const rawM = sanitizeModelSelectionName(args[registerModelIdx + 1]);
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

  if (doLut) {
    const reg = loadCapabilityRegistry();
    if (asJson) {
      process.stdout.write(
        `${JSON.stringify(
          {
            lutConfig: reg.lutConfig,
            availableRoster: reg.availableRoster,
            pendingDocCalibration: reg.pendingDocCalibration,
            lutCalibration: reg.lutCalibration
          },
          null,
          2
        )}\n`
      );
    } else {
      process.stdout.write(`${formatLutMarkdown(reg, activeUiModel)}\n`);
    }
    process.exit(0);
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
  triggerBackgroundCloudSyncIfNeeded();
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

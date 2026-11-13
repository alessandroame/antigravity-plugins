#!/usr/bin/env node

/**
 * Adaptive Router PreInvocation Hook (< 3ms hot path)
 * 1. Immediately notifies inline in chat (`metadata.user_markdown`, 0 LLM tokens) whenever
 *    the active model or reasoning mode (`Low`/`Medium`/`High`/`XHigh`) changes across turns or mid-turn.
 * 2. Surfaces one-time Antigravity `PreInvocation` contract updates (`HARNESS_CONTRACT_UPDATED`, `NOTE-004`).
 * 3. Intercepts severe reasoning underprovisioning (`UNDERPROVISIONED_UI_MODEL`: `HIGH` task on `LOW` UI mode).
 * Outputs `{}\n` on stdout on all unchanged, aligned turns to guarantee zero UI log noise.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  classifyPromptRoute,
  extractExplicitReasoningMode,
  extractLatestTurnSettingsChange,
  formatHumanModelLabel,
  inferModelCapability,
  normalizeCanonicalModelId,
  resolveActiveUiModelFromTranscript,
  sanitizeModelSelectionName
} from '../core/router-engine.mjs';
import {
  getAnalyticsDir,
  getBrainDir,
  loadCapabilityRegistry,
  saveCapabilityRegistry
} from './model-router.mjs';

const isDirectEntry =
  Boolean(process.argv[1]) &&
  import.meta.url.replace(/\\/g, '/') === pathToFileURL(resolve(process.argv[1])).href.replace(/\\/g, '/');

if (isDirectEntry) {
  const safetyWatchdog = setTimeout(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  }, 5000);
  safetyWatchdog.unref();
}

async function main() {
  let rawInput = '';
  for await (const chunk of process.stdin) {
    rawInput += chunk;
  }

  let payload = {};
  try {
    if (rawInput.trim()) payload = JSON.parse(rawInput);
  } catch {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const invocationNum = typeof payload.invocationNum === 'number' ? payload.invocationNum : 1;
  const promptText = typeof payload.lastUserInput === 'string' ? payload.lastUserInput : '';
  if (!promptText.trim()) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const injectSteps = [];

  try {
    const analyticsDir = getAnalyticsDir();
    mkdirSync(analyticsDir, { recursive: true });
    const registry = loadCapabilityRegistry(analyticsDir);
    const convId = payload.conversationId || 'latest';
    const routeStatePath = join(analyticsDir, `.route_${convId}.json`);
    const transcriptPath =
      payload.transcriptPath ||
      (payload.conversationId
        ? join(getBrainDir(), payload.conversationId, '.system_generated', 'logs', 'transcript.jsonl')
        : '');

    let prevRoute = null;
    if (existsSync(routeStatePath)) {
      try {
        prevRoute = JSON.parse(readFileSync(routeStatePath, 'utf-8'));
      } catch {
        prevRoute = null;
      }
    }

    const rawPayloadModel = sanitizeModelSelectionName(payload.modelName || payload.model || '');
    const validPayloadModel =
      rawPayloadModel && !/^(?:auto|none|default)$/i.test(rawPayloadModel) ? rawPayloadModel : '';
    const payloadHasExplicitMode = Boolean(
      validPayloadModel && extractExplicitReasoningMode(validPayloadModel)
    );
    const transcriptUiModel = payloadHasExplicitMode
      ? null
      : resolveActiveUiModelFromTranscript(transcriptPath);
    const activeUiModel = payloadHasExplicitMode
      ? validPayloadModel
      : transcriptUiModel || validPayloadModel || null;

    const currentCanonicalId = normalizeCanonicalModelId(activeUiModel);
    const currentHumanLabel = formatHumanModelLabel(activeUiModel);
    const prevCanonicalId =
      prevRoute?.canonicalModelId || normalizeCanonicalModelId(prevRoute?.activeUiModel || '');

    // Fast exit on subsequent invocations within the same turn when model/mode did not change
    if (invocationNum > 1 && (!currentCanonicalId || currentCanonicalId === prevCanonicalId)) {
      process.stdout.write('{}\n');
      process.exit(0);
    }

    const route = classifyPromptRoute(promptText, {
      registry,
      activeUiModel
    });

    const uiTierLabel =
      route.alignment.uiModelTier ||
      (activeUiModel ? inferModelCapability(activeUiModel).tier : 'AUTO');

    // 1. Immediate inline chat notification on actual model or reasoning mode switch (`metadata.user_markdown`, 0 LLM tokens)
    let switchedFromHuman = null;

    if (prevCanonicalId && currentCanonicalId && prevCanonicalId !== currentCanonicalId) {
      switchedFromHuman =
        prevRoute?.humanModelLabel || formatHumanModelLabel(prevRoute?.activeUiModel || '');
    } else if (!prevCanonicalId && invocationNum === 1) {
      const turnChange = extractLatestTurnSettingsChange(transcriptPath);
      if (turnChange && turnChange.fromModel && turnChange.toModel) {
        const fromId = normalizeCanonicalModelId(turnChange.fromModel);
        const toId = normalizeCanonicalModelId(turnChange.toModel);
        if (fromId && toId && fromId !== toId) {
          switchedFromHuman = formatHumanModelLabel(turnChange.fromModel);
        }
      }
    }

    if (switchedFromHuman && currentHumanLabel) {
      injectSteps.push({
        systemMessage: {
          systemMessage: '',
          metadata: {
            user_markdown: `> **[adaptive-router]** Cambio modalità/modello attivo: **${switchedFromHuman}** -> **${currentHumanLabel}** (\`${uiTierLabel}\`) · Archetipo LUT: **\`${route.archetypeId}\`** (\`${route.tier}\`)`
          }
        }
      });
    }

    const lutSnoozed = Boolean(prevRoute?.lutSnoozed);
    let consecutiveOverprovisioned = prevRoute?.consecutiveOverprovisioned || 0;
    if (route.lutRoute?.switchAction === 'SUGGEST_0CLICK_DOWNGRADE' && !lutSnoozed) {
      consecutiveOverprovisioned += 1;
    } else if (route.archetypeId !== 'R1_MECHANICAL_OPS') {
      consecutiveOverprovisioned = 0;
    }

    if (invocationNum === 1 && consecutiveOverprovisioned >= 2 && !lutSnoozed) {
      const altHint = route.lutRoute?.alternativeUiModel
        ? ` *(oppure **${route.lutRoute.alternativeUiModel}**)*`
        : '';
      injectSteps.push({
        systemMessage: {
          systemMessage: '',
          metadata: {
            user_markdown: `> **[adaptive-router · LUT]** Modello attivo **${currentHumanLabel || activeUiModel}** sovradimensionato per 2 turni leggeri consecutivi (\`${route.lutRoute.archetypeLabelIt}\`) · Consigliato nel selettore: **${route.lutRoute.recommendedUiModel}**${altHint}.`
          }
        }
      });
      consecutiveOverprovisioned = 0;
    }

    writeFileSync(
      routeStatePath,
      JSON.stringify({
        timestampMs: Date.now(),
        conversationId: convId,
        activeUiModel,
        canonicalModelId: currentCanonicalId || null,
        humanModelLabel: currentHumanLabel || null,
        lutSnoozed,
        consecutiveOverprovisioned,
        ...route
      }) + '\n',
      'utf-8'
    );

    if (invocationNum === 1) {
      if (registry.pendingHarnessUpgradeNotice && !registry.pendingHarnessUpgradeNotice.notifiedAtMs) {
        const notice = registry.pendingHarnessUpgradeNotice;
        notice.notifiedAtMs = Date.now();
        saveCapabilityRegistry(registry, analyticsDir);
        injectSteps.push({
          systemMessage: {
            systemMessage: `[ADAPTIVE-ROUTER: HARNESS_CONTRACT_UPDATED] Antigravity updated its PreInvocation hook contract (.checksum=${notice.currentChecksum}, modelOverrideSupported=${Boolean(notice.preInvocationModelOverrideSupported)}). Inform the user in 2 plain Italian lines prefixed with '[Plugin: adaptive-router]' so NOTE-004 automatic model/mode switching can be verified.`
          }
        });
      }

      const needsRosterRefresh = Boolean(
        registry.pendingRosterRefresh?.required && !registry.pendingRosterRefresh?.notifiedAtMs
      );
      const needsDocCalibration = Boolean(
        registry.pendingDocCalibration?.required && !registry.pendingDocCalibration?.notifiedAtMs
      );

      if (needsRosterRefresh || needsDocCalibration) {
        const nowMs = Date.now();
        if (needsRosterRefresh && registry.pendingRosterRefresh) {
          registry.pendingRosterRefresh.notifiedAtMs = nowMs;
        }
        if (needsDocCalibration && registry.pendingDocCalibration) {
          registry.pendingDocCalibration.notifiedAtMs = nowMs;
        }
        saveCapabilityRegistry(registry, analyticsDir);
        const uncalLabel =
          (registry.pendingDocCalibration?.uncalibratedFamilies || []).join(', ') ||
          'aggiornamento roster modelli';
        injectSteps.push({
          systemMessage: {
            systemMessage: `[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE] Model roster changed or contains uncalibrated Gemini families (${uncalLabel}). Perform a one-time LUT calibration: (1) call swarm{action:"models"} and pass its JSON to 'model-router.mjs --sync-swarm-models', (2) consult official Google/Antigravity documentation (gemini_search_docs / search_web on antigravity.google or blog.google) ONCE for any uncalibrated Gemini family, and (3) save calibrated roles and R1..R6 targets via 'model-router.mjs --apply-calibration'.`
          }
        });
      }

      const shouldAskLutUpgrade =
        !lutSnoozed &&
        !route.signals.includes('manual_force_low') &&
        (route.lutRoute?.switchAction === 'ASK_1CLICK_UPGRADE' ||
          route.alignment.mismatchType === 'UNDERPROVISIONED_UI_MODEL');

      if (shouldAskLutUpgrade) {
        const recUi = route.lutRoute?.recommendedUiModel || 'Gemini 4 Carbon (High)';
        const altUi = route.lutRoute?.alternativeUiModel;
        const subModel = route.lutRoute?.executionSubagentModel || 'pro';
        const subType = route.lutRoute?.executionSubagentType || 'self';
        const archLabel = route.lutRoute?.archetypeLabelIt || route.tier;
        const rationale = route.lutRoute?.rationaleIt || route.reason;
        injectSteps.push({
          systemMessage: {
            systemMessage: `[ADAPTIVE-ROUTER MISMATCH: UNDERPROVISIONED_UI_MODEL] [LUT_ARCHETYPE: ${route.archetypeId}] Active UI model '${currentHumanLabel || activeUiModel}' is underprovisioned for '${archLabel}' (${route.reason}). LUT target: '${recUi}'${altUi ? ` (alt: '${altUi}')` : ''} — ${rationale}. BEFORE deep analysis or editing files, call ask_question in plain Italian opening with '[Plugin: adaptive-router]' (merge into a single ask_question if proactive-mentorship also triggers) stating active model '${currentHumanLabel || activeUiModel}' vs LUT target '${recUi}', with options: '(Recommended) Esegui subito in 1-click sul profilo LUT (${recUi} tramite subagent ${subType} Model: ${subModel})', 'Ho passato il selettore modello su ${recUi}: procedi nel thread principale', 'Procedi comunque con ${currentHumanLabel || activeUiModel} per questo turno', 'Silenzia i suggerimenti LUT per questa sessione' (if chosen, run 'model-router.mjs --snooze-session ${convId}').`
          }
        });
      }
    }
  } catch {
    // Fail-safe: never block invocation
  }

  if (injectSteps.length > 0) {
    process.stdout.write(`${JSON.stringify({ injectSteps })}\n`);
    process.exit(0);
  }

  process.stdout.write('{}\n');
  process.exit(0);
}

if (isDirectEntry) {
  main();
}

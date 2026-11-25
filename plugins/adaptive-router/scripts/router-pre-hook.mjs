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
  countExplicitUserTurnsInTranscript,
  evaluateMixedSessionOrchestratorHint,
  extractExplicitReasoningMode,
  extractLatestTurnSettingsChange,
  extractModelBaseFamily,
  formatHumanModelLabel,
  inferModelCapability,
  isDynamicOrchestratorModel,
  isSubagentPromptOrTranscript,
  normalizeCanonicalModelId,
  resolveActiveUiModelFromTranscript,
  sanitizeModelSelectionName
} from '../core/router-engine.mjs';
import {
  getAnalyticsDir,
  getBrainDir,
  loadCapabilityRegistry,
  probeBuiltinChecksumDrift,
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
    const convId = payload.conversationId || 'latest';
    const routeStatePath = join(analyticsDir, `.route_${convId}.json`);
    const transcriptPath =
      payload.transcriptPath ||
      (payload.conversationId
        ? join(getBrainDir(), payload.conversationId, '.system_generated', 'logs', 'transcript.jsonl')
        : '');

    if (isSubagentPromptOrTranscript(promptText, transcriptPath) || isSubagentPromptOrTranscript(rawInput, null)) {
      process.stdout.write('{}\n');
      process.exit(0);
    }

    const registry = loadCapabilityRegistry(analyticsDir);

    let prevRoute = null;
    if (existsSync(routeStatePath)) {
      try {
        prevRoute = JSON.parse(readFileSync(routeStatePath, 'utf-8'));
      } catch {
        prevRoute = null;
      }
    }

    const explicitUserTurnCount = countExplicitUserTurnsInTranscript(transcriptPath);
    const hasInitialNumSteps = typeof payload.initialNumSteps === 'number';
    const isFollowUpAfterZero =
      invocationNum === 1 &&
      prevRoute?.lastInvocationNum === 0 &&
      (hasInitialNumSteps && typeof prevRoute?.lastInitialNumSteps === 'number'
        ? payload.initialNumSteps === prevRoute.lastInitialNumSteps
        : prevRoute?.lastUserInput === promptText);
    const isSameTurnAsyncWakeup =
      explicitUserTurnCount !== null &&
      typeof prevRoute?.lastExplicitUserTurnCount === 'number' &&
      prevRoute.lastExplicitUserTurnCount > 0 &&
      explicitUserTurnCount === prevRoute.lastExplicitUserTurnCount &&
      prevRoute?.lastUserInput === promptText;
    const isTurnStart =
      !isSameTurnAsyncWakeup &&
      (invocationNum === 0 || (invocationNum === 1 && !isFollowUpAfterZero));

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
    if (!isTurnStart && (!currentCanonicalId || currentCanonicalId === prevCanonicalId)) {
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
    } else if (!prevCanonicalId && isTurnStart) {
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
    const isOrchActive = isDynamicOrchestratorModel(activeUiModel, registry);
    let consecutiveOverprovisioned = prevRoute?.consecutiveOverprovisioned || 0;
    if (isTurnStart) {
      if (route.lutRoute?.switchAction === 'SUGGEST_0CLICK_DOWNGRADE' && !lutSnoozed && !isOrchActive) {
        consecutiveOverprovisioned += 1;
      } else if (route.archetypeId !== 'R1_MECHANICAL_OPS') {
        consecutiveOverprovisioned = 0;
      }
    }

    const prevTierHistory = Array.isArray(prevRoute?.tierHistory) ? prevRoute.tierHistory : [];
    const tierHistory =
      isTurnStart
        ? [...prevTierHistory, { tier: route.tier, archetypeId: route.archetypeId }].slice(-6)
        : prevTierHistory;

    const hasMismatchThisTurn = Boolean(
      !isOrchActive &&
        (route.lutRoute?.switchAction === 'ASK_1CLICK_UPGRADE' ||
          route.lutRoute?.switchAction === 'SUGGEST_0CLICK_DOWNGRADE' ||
          (route.alignment?.mismatchType && route.alignment.mismatchType !== 'NONE'))
    );
    let mismatchCountInSession = prevRoute?.mismatchCountInSession || 0;
    if (isTurnStart && hasMismatchThisTurn) {
      mismatchCountInSession += 1;
    }

    const shouldAskLutUpgrade = Boolean(
      isTurnStart &&
        !lutSnoozed &&
        !isOrchActive &&
        !route.signals.includes('manual_force_low') &&
        (route.lutRoute?.switchAction === 'ASK_1CLICK_UPGRADE' ||
          route.alignment.mismatchType === 'UNDERPROVISIONED_UI_MODEL')
    );

    let didEmitOverprovisionedBanner = false;
    if (isTurnStart && consecutiveOverprovisioned >= 2 && !lutSnoozed && !isOrchActive) {
      const altHint = route.lutRoute?.alternativeUiModel
        ? ` *(oppure **${route.lutRoute.alternativeUiModel}**)*`
        : '';
      const orchHint =
        uiTierLabel === 'HIGH'
          ? '**Orchestrator (Carbon)** / **Orchestrator (Argon)**'
          : '**Orchestrator (Argon)**';
      injectSteps.push({
        systemMessage: {
          systemMessage: '',
          metadata: {
            user_markdown: `> **[adaptive-router · LUT]** Modello attivo **${currentHumanLabel || activeUiModel}** sovradimensionato per 2 turni leggeri consecutivi (\`${route.lutRoute.archetypeLabelIt}\`) · Consigliato nel selettore: **${route.lutRoute.recommendedUiModel}**${altHint}, oppure ${orchHint} se alterni domande rapide e sviluppo.`
          }
        }
      });
      consecutiveOverprovisioned = 0;
      didEmitOverprovisionedBanner = true;
    }

    let orchestratorSuggestedAtMs = prevRoute?.orchestratorSuggestedAtMs || null;
    const mixedHint = evaluateMixedSessionOrchestratorHint({
      tierHistory,
      mismatchCountInSession,
      currentRoute: route,
      activeUiModel,
      registry,
      lutSnoozed,
      orchestratorSuggestedAtMs
    });

    if (
      isTurnStart &&
      mixedHint.shouldSuggest &&
      !shouldAskLutUpgrade &&
      !didEmitOverprovisionedBanner
    ) {
      injectSteps.push({
        systemMessage: {
          systemMessage: '',
          metadata: {
            user_markdown: `> **[adaptive-router · Orchestrator]** ${mixedHint.messageIt}`
          }
        }
      });
      orchestratorSuggestedAtMs = Date.now();
    } else if (shouldAskLutUpgrade && mixedHint.shouldSuggest && !orchestratorSuggestedAtMs) {
      orchestratorSuggestedAtMs = Date.now();
    }

    writeFileSync(
      routeStatePath,
      JSON.stringify({
        timestampMs: Date.now(),
        conversationId: convId,
        activeUiModel,
        canonicalModelId: currentCanonicalId || null,
        humanModelLabel: currentHumanLabel || null,
        lastInvocationNum: invocationNum,
        lastInitialNumSteps: hasInitialNumSteps ? payload.initialNumSteps : null,
        lastExplicitUserTurnCount:
          explicitUserTurnCount ?? prevRoute?.lastExplicitUserTurnCount ?? null,
        lastUserInput: promptText,
        lutSnoozed,
        consecutiveOverprovisioned,
        tierHistory,
        mismatchCountInSession,
        orchestratorSuggestedAtMs,
        ...route
      }) + '\n',
      'utf-8'
    );

    if (isTurnStart) {
      const syncStatePath = join(analyticsDir, 'plugin-sync-state.json');
      if (existsSync(syncStatePath)) {
        try {
          const syncState = JSON.parse(readFileSync(syncStatePath, 'utf-8'));
          const notice = syncState?.pendingUpdateNotice;
          if (notice && !notice.notifiedAtMs && notice.toSha) {
            notice.notifiedAtMs = Date.now();
            writeFileSync(syncStatePath, JSON.stringify(syncState, null, 2) + '\n', 'utf-8');
            const fromShort = String(notice.fromSha || '').slice(0, 7) || 'prev';
            const toShort = String(notice.toSha || '').slice(0, 7);
            const behindLabel =
              typeof notice.behind === 'number' && notice.behind > 0 ? `, +${notice.behind} commit` : '';
            const countLabel =
              typeof notice.syncedCount === 'number'
                ? `: ${notice.syncedCount} plugin e ${notice.syncedSkillsCount || 0} skill sincronizzati`
                : ' e plugin sincronizzati';
            injectSteps.push({
              systemMessage: {
                systemMessage: '',
                metadata: {
                  user_markdown: `> **[antigravity-plugins]** Aggiornamento remoto applicato (\`${fromShort}\` -> \`${toShort}\`${behindLabel})${countLabel}.`
                }
              }
            });
          }
        } catch {
          // Ignore unreadable sync state
        }
      }

      let registryDirty = false;
      const hadPrevChecksum = Boolean(registry.builtinChecksum);
      const drift = probeBuiltinChecksumDrift(registry);
      if (drift.drifted) {
        registryDirty = true;
        if (hadPrevChecksum) {
          registry.pendingRosterRefresh = {
            required: true,
            detectedAtMs: Date.now(),
            notifiedAtMs: null,
            notifiedConversationIds: []
          };
        }
      }

      if (activeUiModel && registry.lutCalibration?.calibratedAtMs) {
        const activeFamily = extractModelBaseFamily(activeUiModel);
        const calibratedMap = registry.lutCalibration.calibratedFamilies || {};
        if (
          activeFamily &&
          /^(?:gemini\b|orchestrator\b)/i.test(activeFamily) &&
          !calibratedMap[activeFamily]
        ) {
          const rosterHasActiveFamily = (registry.availableRoster || []).some(
            (slug) =>
              extractModelBaseFamily(registry.swarmDisplayNames?.[String(slug).toLowerCase()] || slug) ===
              activeFamily
          );
          if (
            !rosterHasActiveFamily &&
            Array.isArray(registry.availableRoster) &&
            registry.availableRoster.length > 0 &&
            !registry.pendingRosterRefresh?.required
          ) {
            registry.pendingRosterRefresh = {
              required: true,
              detectedAtMs: Date.now(),
              notifiedAtMs: null,
              notifiedConversationIds: []
            };
            registryDirty = true;
          }
          const prevUncal = Array.isArray(registry.pendingDocCalibration?.uncalibratedFamilies)
            ? registry.pendingDocCalibration.uncalibratedFamilies
            : [];
          const isNewlyDetectedFamily = !prevUncal.includes(activeFamily);
          if (isNewlyDetectedFamily || !registry.pendingDocCalibration?.required) {
            registry.pendingDocCalibration = {
              required: true,
              uncalibratedFamilies: [...new Set([...prevUncal, activeFamily])],
              detectedAtMs: Date.now(),
              notifiedAtMs: isNewlyDetectedFamily
                ? null
                : (registry.pendingDocCalibration?.notifiedAtMs ?? null),
              notifiedConversationIds: isNewlyDetectedFamily
                ? []
                : (Array.isArray(registry.pendingDocCalibration?.notifiedConversationIds)
                    ? registry.pendingDocCalibration.notifiedConversationIds
                    : [])
            };
            registryDirty = true;
          }
        }
      }

      if (registry.pendingHarnessUpgradeNotice && !registry.pendingHarnessUpgradeNotice.notifiedAtMs) {
        const notice = registry.pendingHarnessUpgradeNotice;
        notice.notifiedAtMs = Date.now();
        registryDirty = true;
        injectSteps.push({
          systemMessage: {
            systemMessage: `[ADAPTIVE-ROUTER: HARNESS_CONTRACT_UPDATED] Antigravity updated its PreInvocation hook contract (.checksum=${notice.currentChecksum}, modelOverrideSupported=${Boolean(notice.preInvocationModelOverrideSupported)}). Inform the user in 2 plain Italian lines prefixed with '[Plugin: adaptive-router]' so NOTE-004 automatic model/mode switching can be verified.`
          }
        });
      }

      const isPendingNotifiedForConv = (pendingState, currentConvId) => {
        if (!pendingState?.required) return true;
        if (currentConvId && currentConvId !== 'latest') {
          if (Array.isArray(pendingState.notifiedConversationIds)) {
            return pendingState.notifiedConversationIds.includes(currentConvId);
          }
          return false;
        }
        return Boolean(pendingState.notifiedAtMs);
      };
      const markPendingNotified = (pendingState, currentConvId, nowMs) => {
        if (!pendingState) return;
        pendingState.notifiedAtMs = nowMs;
        if (currentConvId && currentConvId !== 'latest') {
          const prevIds = Array.isArray(pendingState.notifiedConversationIds)
            ? pendingState.notifiedConversationIds
            : [];
          pendingState.notifiedConversationIds = [...new Set([...prevIds, currentConvId])].slice(-20);
        }
      };

      const needsRosterRefresh = Boolean(
        registry.pendingRosterRefresh?.required &&
          !isPendingNotifiedForConv(registry.pendingRosterRefresh, convId)
      );
      const needsDocCalibration = Boolean(
        registry.pendingDocCalibration?.required &&
          !isPendingNotifiedForConv(registry.pendingDocCalibration, convId)
      );

      if (needsRosterRefresh || needsDocCalibration) {
        const nowMs = Date.now();
        if (needsRosterRefresh && registry.pendingRosterRefresh) {
          markPendingNotified(registry.pendingRosterRefresh, convId, nowMs);
        }
        if (needsDocCalibration && registry.pendingDocCalibration) {
          markPendingNotified(registry.pendingDocCalibration, convId, nowMs);
        }
        registryDirty = true;
        const uncalLabel =
          (registry.pendingDocCalibration?.uncalibratedFamilies || []).join(', ') ||
          'aggiornamento roster modelli';
        injectSteps.push({
          systemMessage: {
            systemMessage: `[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE] Model roster changed or contains uncalibrated Gemini families (${uncalLabel}). Perform a one-time LUT calibration: (1) call swarm{action:"models"} and pass its JSON to 'model-router.mjs --sync-swarm-models', (2) consult official Google/Antigravity documentation (gemini_search_docs / search_web on antigravity.google or blog.google) ONCE for any uncalibrated Gemini family, and (3) save calibrated roles and R1..R6 targets via 'model-router.mjs --apply-calibration'.`
          }
        });
      }

      if (registryDirty) {
        saveCapabilityRegistry(registry, analyticsDir);
      }

      if (shouldAskLutUpgrade) {
        const recUi = route.lutRoute?.recommendedUiModel || 'Gemini 4 Carbon (High)';
        const altUi = route.lutRoute?.alternativeUiModel;
        const recOrch = route.lutRoute?.recommendedOrchestrator?.model || null;
        const subModel = route.lutRoute?.executionSubagentModel || 'pro';
        const subType = route.lutRoute?.executionSubagentType || 'self';
        const archLabel = route.lutRoute?.archetypeLabelIt || route.tier;
        const rationale = route.lutRoute?.rationaleIt || route.reason;
        const activeLabel = currentHumanLabel || activeUiModel;

        const orchChoiceLabel = recOrch
          ? recUi === recOrch
            ? `${recOrch}${altUi ? ` (oppure ${altUi})` : ''}`
            : `${recOrch} o ${recUi}`
          : recUi;
        const orchLead = recOrch
          ? recOrch.includes('Carbon')
            ? 'Carbon'
            : recOrch.includes('Neon')
              ? 'Neon'
              : 'Argon'
          : '';
        const orchNote = recOrch
          ? ` Consiglio sessione: ${recOrch} adatta in automatico ${orchLead} e Hydrogen evitando ulteriori conferme nei prossimi turni.`
          : '';
        const mixedNote = mixedHint.shouldSuggest ? ` (${mixedHint.reasonIt})` : '';

        injectSteps.push({
          systemMessage: {
            systemMessage: `[ADAPTIVE-ROUTER MISMATCH: UNDERPROVISIONED_UI_MODEL] [LUT_ARCHETYPE: ${route.archetypeId}] Active UI model '${activeLabel}' is underprovisioned for '${archLabel}' (${route.reason}). LUT target: '${recUi}'${altUi ? ` (alt: '${altUi}')` : ''}${recOrch ? `, Orchestrator: '${recOrch}'` : ''}${mixedNote} — ${rationale}.${orchNote} BEFORE deep analysis or editing files, call ask_question in plain Italian opening with '[Plugin: adaptive-router]' (merge into a single ask_question if proactive-mentorship also triggers) stating active model '${activeLabel}' vs LUT target '${recUi}' and the 1-line Orchestrator benefit, with max 4 options: '(Recommended) Esegui subito in 1-click tramite subagent ${subType} (Model: ${subModel})', 'Ho selezionato ${orchChoiceLabel} nel menu modello (auto-adattivo per tutta la sessione): procedi qui', 'Procedi comunque con ${activeLabel} per questo turno', 'Silenzia i suggerimenti LUT per questa sessione' (if chosen, run 'model-router.mjs --snooze-session ${convId}').`
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

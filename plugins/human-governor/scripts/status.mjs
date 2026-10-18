#!/usr/bin/env node

/**
 * Human Governor CLI Status & Configuration Utility
 * Usage:
 *   node scripts/status.mjs [--json]
 *   node scripts/status.mjs --max-wip <N>
 *   node scripts/status.mjs --curfew <HH:MM-HH:MM>
 *   node scripts/status.mjs --snooze <MINUTES>
 *   node scripts/status.mjs --toast <on|off>
 *   node scripts/status.mjs --reset
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  DEFAULT_CONFIG,
  evaluateOperatorBehavior,
  formatMinutesAsTime
} from '../core/evaluator.mjs';
import { loadGovernorState, discoverRecentBrainSessions } from './governor-hook.mjs';

const safetyTimeout = setTimeout(() => {
  console.error('[FATAL TIMEOUT] status.mjs exceeded 15s');
  process.exit(1);
}, 15000);
safetyTimeout.unref();

function getAnalyticsDir() {
  const custom = process.env.ANTIGRAVITY_ANALYTICS_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

function getBrainDir() {
  const custom = process.env.ANTIGRAVITY_BRAIN_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'brain');
}

function parseTimeToken(hhmm) {
  const match = String(hhmm).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hh = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function main() {
  const args = process.argv.slice(2);
  const analyticsDir = getAnalyticsDir();
  mkdirSync(analyticsDir, { recursive: true });
  const stateFile = join(analyticsDir, 'human-governor-state.json');

  let state = loadGovernorState(stateFile);
  const nowMs = Date.now();
  let mutated = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--max-wip' && args[i + 1]) {
      const val = parseInt(args[i + 1], 10);
      if (!Number.isNaN(val) && val >= 1 && val <= 10) {
        state.config.maxConcurrentWip = val;
        state.config.criticalConcurrentWip = Math.max(val + 2, 4);
        mutated = true;
      }
      i += 1;
    } else if (arg === '--curfew' && args[i + 1]) {
      const parts = args[i + 1].split('-');
      if (parts.length === 2) {
        const startMin = parseTimeToken(parts[0]);
        const endMin = parseTimeToken(parts[1]);
        if (startMin !== null && endMin !== null) {
          state.config.curfewStartMinutes = startMin;
          state.config.curfewEndMinutes = endMin;
          mutated = true;
        }
      }
      i += 1;
    } else if (arg === '--snooze' && args[i + 1]) {
      const mins = parseInt(args[i + 1], 10);
      if (!Number.isNaN(mins) && mins >= 0) {
        state.snoozeUntilMs = mins === 0 ? 0 : nowMs + mins * 60 * 1000;
        mutated = true;
      }
      i += 1;
    } else if (arg === '--toast' && args[i + 1]) {
      state.config.enableDesktopToast = args[i + 1].toLowerCase() === 'on';
      mutated = true;
      i += 1;
    } else if (arg === '--reset') {
      state = {
        config: { ...DEFAULT_CONFIG, ...state.config },
        activeSessions: {},
        promptHistory: [],
        lastAlertByConv: {},
        snoozeUntilMs: 0
      };
      mutated = true;
    }
  }

  const brainSessions = discoverRecentBrainSessions(
    getBrainDir(),
    nowMs,
    state.config.wipWindowMinutes
  );
  const topicByConvId = new Map();
  for (const bs of brainSessions) {
    const prev = state.activeSessions[bs.conversationId] || 0;
    state.activeSessions[bs.conversationId] = Math.max(prev, bs.lastActiveMs);
    if (bs.topic) {
      topicByConvId.set(bs.conversationId, bs.topic);
    }
  }

  if (mutated) {
    writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  const activeSessionsList = Object.entries(state.activeSessions).map(([cid, ts]) => ({
    conversationId: cid,
    lastActiveMs: ts,
    topic: topicByConvId.get(cid) || 'Sessione attiva'
  }));

  const nowDate = new Date(nowMs);
  const localMinutesOfDay = nowDate.getHours() * 60 + nowDate.getMinutes();

  const report = evaluateOperatorBehavior({
    nowMs,
    localMinutesOfDay,
    currentConversationId: '',
    activeSessions: activeSessionsList,
    promptHistory: state.promptHistory,
    config: state.config
  });

  const wipCutoffMs = nowMs - state.config.wipWindowMinutes * 60 * 1000;
  const activeConversationIds = activeSessionsList
    .filter((s) => s.lastActiveMs >= wipCutoffMs)
    .sort((a, b) => b.lastActiveMs - a.lastActiveMs)
    .map((s) => ({
      conversationId: s.conversationId,
      minutesAgo: Math.max(0, Math.round((nowMs - s.lastActiveMs) / 60000)),
      topic: s.topic
    }));

  const output = {
    status: report.status,
    snoozedUntil:
      state.snoozeUntilMs > nowMs ? new Date(state.snoozeUntilMs).toLocaleTimeString('it-IT') : null,
    config: {
      maxConcurrentWip: state.config.maxConcurrentWip,
      wipWindowMinutes: state.config.wipWindowMinutes,
      maxSwitchesPer10Min: state.config.maxSwitchesPer10Min,
      maxPromptsPerHour: state.config.maxPromptsPerHour,
      maxContinuousMinutes: state.config.maxContinuousMinutes,
      curfewWindow: `${formatMinutesAsTime(state.config.curfewStartMinutes)}-${formatMinutesAsTime(state.config.curfewEndMinutes)}`,
      enableDesktopToast: state.config.enableDesktopToast
    },
    metrics: report.metrics,
    activeConversations: activeConversationIds,
    violations: report.violations
  };

  if (args.includes('--json')) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log('=== HUMAN GOVERNOR & ANTI-WIP GUARD ===');
  console.log(`Stato Operatore        : ${output.status}`);
  console.log(`Orario Locale          : ${output.metrics.localTimeStr} (Coprifuoco: ${output.config.curfewWindow})`);
  console.log(`WIP Attivi (${output.config.wipWindowMinutes}m)      : ${output.metrics.activeWipCount} / max ${output.config.maxConcurrentWip}`);
  console.log(`Cambi Chat (ultimi 10m): ${output.metrics.switchesLast10Min} / max ${output.config.maxSwitchesPer10Min}`);
  console.log(`Prompt (ultima ora)    : ${output.metrics.promptsLast60Min} / max ${output.config.maxPromptsPerHour}`);
  console.log(`Streak Continua        : ${output.metrics.continuousStreakMinutes} min / max ${output.config.maxContinuousMinutes} min`);
  console.log(`Snooze Attivo          : ${output.snoozedUntil || 'Nessuno'}`);
  console.log(`Notifiche Desktop Win  : ${output.config.enableDesktopToast ? 'ON' : 'OFF'}`);

  if (output.activeConversations.length > 0) {
    console.log('\nSessioni WIP Attive nella Finestra:');
    for (const c of output.activeConversations) {
      console.log(`  - ${c.conversationId} (${c.minutesAgo}m fa): "${c.topic}"`);
    }
  }

  if (output.violations.length > 0) {
    console.log('\nViolazioni Rilevate:');
    for (const v of output.violations) {
      console.log(`  [${v.severity}] ${v.code}: ${v.messageIt}`);
    }
  } else {
    console.log('\nNessuna anomalia comportamentale rilevata.');
  }
}

main();

#!/usr/bin/env node

/**
 * Human Governor PreInvocation Hook
 * Monitors active WIP conversations, context-switching frequency, continuous work streaks,
 * and late-night curfew violations. Injects an ephemeral directive when thresholds are breached.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { DEFAULT_CONFIG, evaluateOperatorBehavior } from '../core/evaluator.mjs';

const isDirectEntry =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

// Rigid safety watchdog (5s) so the hook never blocks Antigravity
const WATCHDOG_TIMEOUT_MS = 5000;
if (isDirectEntry) {
  const safetyWatchdog = setTimeout(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  }, WATCHDOG_TIMEOUT_MS);
  safetyWatchdog.unref();
}

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

export function loadGovernorState(stateFile) {
  const fallback = {
    config: { ...DEFAULT_CONFIG },
    activeSessions: {},
    promptHistory: [],
    lastAlertByConv: {},
    snoozeUntilMs: 0
  };
  if (!existsSync(stateFile)) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(readFileSync(stateFile, 'utf-8'));
    return {
      config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
      activeSessions: parsed.activeSessions || {},
      promptHistory: Array.isArray(parsed.promptHistory) ? parsed.promptHistory : [],
      lastAlertByConv: parsed.lastAlertByConv || {},
      snoozeUntilMs: typeof parsed.snoozeUntilMs === 'number' ? parsed.snoozeUntilMs : 0
    };
  } catch {
    return fallback;
  }
}

const SUBAGENT_SIGNATURE_RX =
  /Skill Attive \((?:Alpha|Beta|Gamma)\)|Agisci esclusivamente come \*\*Subagent|Sei \*\*Subagent (?:Alpha|Beta|Gamma)|Subagent (?:Alpha|Beta|Gamma)\b|Dialectical Mediator & Conflict Resolver|You have been spawned as a subagent|<subagent_context>|Oracolo (?:di Test )?(?:Tecnico|di Dominio)|\[Message\] timestamp=[^\]]+sender=[0-9a-f-]{36}/i;

export function isSubagentTranscriptHead(headText) {
  if (typeof headText !== 'string' || !headText) return false;
  return SUBAGENT_SIGNATURE_RX.test(headText);
}

export function isHumanConversationTranscript(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return false;
  try {
    const head = readFileSync(transcriptPath, 'utf-8').slice(0, 12288);
    if (!head.includes('<USER_REQUEST>') && !head.includes('"source":"USER_EXPLICIT"')) {
      return false;
    }
    const firstUserIdx = head.indexOf('<USER_REQUEST>');
    const firstAgentMsgIdx = head.search(/\[Message\] timestamp=[^\]]+sender=[0-9a-f-]{36}/i);
    if (firstAgentMsgIdx !== -1 && (firstUserIdx === -1 || firstAgentMsgIdx < firstUserIdx)) {
      return false;
    }
    const headBeforeFirstTool = firstUserIdx !== -1 ? head.slice(0, firstUserIdx + 1500) : head.slice(0, 2500);
    if (isSubagentTranscriptHead(headBeforeFirstTool)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function discoverRecentBrainSessions(brainDir, nowMs, wipWindowMinutes) {
  const discovered = [];
  if (!existsSync(brainDir)) return discovered;

  const cutoffMs = nowMs - wipWindowMinutes * 60 * 1000;
  try {
    const entries = readdirSync(brainDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const convId = entry.name;
      const transcriptPath = join(brainDir, convId, '.system_generated', 'logs', 'transcript.jsonl');
      if (!existsSync(transcriptPath)) continue;

      try {
        const st = statSync(transcriptPath);
        if (st.mtimeMs < cutoffMs) continue;
        if (!isHumanConversationTranscript(transcriptPath)) continue;

        const head = readFileSync(transcriptPath, 'utf-8').slice(0, 8192);
        let topic = 'Sessione attiva';
        const reqMatch = head.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/);
        if (reqMatch && reqMatch[1]) {
          topic = reqMatch[1]
            .replace(/\\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 65);
        }

        discovered.push({
          conversationId: convId,
          lastActiveMs: Math.round(st.mtimeMs),
          topic
        });
      } catch {
        // Ignore locked or inaccessible transcript files
      }
    }
  } catch {
    // Ignore missing brain directory
  }
  return discovered;
}

function triggerDesktopBalloon(messageText) {
  if (process.platform !== 'win32' || process.env.NODE_ENV === 'test') return;
  try {
    const safeMsg = messageText.replace(/'/g, "''");
    const psScript = [
      'Add-Type -AssemblyName System.Windows.Forms;',
      'Add-Type -AssemblyName System.Drawing;',
      '$n = New-Object System.Windows.Forms.NotifyIcon;',
      '$n.Icon = [System.Drawing.SystemIcons]::Warning;',
      '$n.Visible = $true;',
      "$n.ShowBalloonTip(6000, 'Human Governor - Anti-WIP Guard', '" + safeMsg + "', [System.Windows.Forms.ToolTipIcon]::Warning);",
      'Start-Sleep -Milliseconds 6500;',
      '$n.Dispose();'
    ].join(' ');

    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', psScript],
      { detached: true, stdio: 'ignore', windowsHide: true }
    );
    child.unref();
  } catch {
    // Non-blocking notification best effort
  }
}

async function main() {
  let rawInput = '';
  for await (const chunk of process.stdin) {
    rawInput += chunk;
  }

  let payload = {};
  try {
    if (rawInput.trim()) {
      payload = JSON.parse(rawInput);
    }
  } catch {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const invocationNum = typeof payload.invocationNum === 'number' ? payload.invocationNum : 1;
  if (invocationNum > 1) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const promptText = typeof payload.prompt === 'string' ? payload.prompt : '';
  if (isSubagentTranscriptHead(promptText) || isSubagentTranscriptHead(rawInput)) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const brainDir = getBrainDir();
  const conversationId = payload.conversationId || 'unknown-session';
  const resolvedTranscriptPath =
    payload.transcriptPath ||
    join(brainDir, conversationId, '.system_generated', 'logs', 'transcript.jsonl');

  if (existsSync(resolvedTranscriptPath)) {
    if (!isHumanConversationTranscript(resolvedTranscriptPath)) {
      process.stdout.write('{}\n');
      process.exit(0);
    }
  } else if (!promptText.trim()) {
    // Subagents spawned without an existing user transcript or prompt text must be ignored
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const nowMs = Date.now();
  const analyticsDir = getAnalyticsDir();
  mkdirSync(analyticsDir, { recursive: true });

  const stateFile = join(analyticsDir, 'human-governor-state.json');
  const state = loadGovernorState(stateFile);
  const cfg = state.config;

  // Rebuild activeSessions strictly from verified human brain sessions to purge any subagent IDs
  const brainSessions = discoverRecentBrainSessions(brainDir, nowMs, cfg.wipWindowMinutes);
  const retentionCutoffMs = nowMs - 2 * 60 * 60 * 1000;
  const humanSessionIds = new Set(brainSessions.map((bs) => bs.conversationId));
  humanSessionIds.add(conversationId);

  const cleanActiveSessions = {};
  for (const bs of brainSessions) {
    const existing = state.activeSessions[bs.conversationId] || 0;
    cleanActiveSessions[bs.conversationId] = Math.max(existing, bs.lastActiveMs);
  }
  cleanActiveSessions[conversationId] = nowMs;
  state.activeSessions = cleanActiveSessions;

  const activeSessionsList = Object.entries(state.activeSessions).map(([cid, ts]) => ({
    conversationId: cid,
    lastActiveMs: ts
  }));

  state.promptHistory.push({ conversationId, timestampMs: nowMs });
  state.promptHistory = state.promptHistory.filter(
    (e) => e.timestampMs >= retentionCutoffMs && humanSessionIds.has(e.conversationId)
  );

  const nowDate = new Date(nowMs);
  const localMinutesOfDay = nowDate.getHours() * 60 + nowDate.getMinutes();

  const evaluation = evaluateOperatorBehavior({
    nowMs,
    localMinutesOfDay,
    currentConversationId: conversationId,
    activeSessions: activeSessionsList,
    promptHistory: state.promptHistory,
    config: cfg
  });

  const isSnoozed = state.snoozeUntilMs > nowMs;
  const lastAlert = state.lastAlertByConv[conversationId];
  const cooldownMs = (cfg.cooldownMinutes || 20) * 60 * 1000;
  const inCooldown =
    lastAlert &&
    nowMs - lastAlert.timestampMs < cooldownMs &&
    evaluation.metrics.activeWipCount <= (lastAlert.wipCount || 0);

  const shouldInject = evaluation.status !== 'OK' && !isSnoozed && !inCooldown;

  if (shouldInject) {
    state.lastAlertByConv[conversationId] = {
      timestampMs: nowMs,
      wipCount: evaluation.metrics.activeWipCount,
      status: evaluation.status
    };
  }

  try {
    writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Non-blocking persistence
  }

  if (!shouldInject) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  if (cfg.enableDesktopToast && !evaluation.metrics.inCurfew && evaluation.desktopToastTextIt) {
    triggerDesktopBalloon(evaluation.desktopToastTextIt);
  }

  const violationSummary = evaluation.violations.map((v) => `[${v.code}] ${v.messageIt}`).join(' | ');
  const directive =
    `[HUMAN-GOVERNOR ALERT — STATUS: ${evaluation.status}] ` +
    `Telemetria operatore: ${violationSummary}. ` +
    `REGOLA OBBLIGATORIA: Prima di eseguire il task richiesto dall'utente, invoca il tool ask_question ` +
    `riportando i numeri esatti appena rilevati (${evaluation.metrics.activeWipCount} WIP attivi, ` +
    `${evaluation.metrics.switchesLast10Min} cambi chat/10m, ${evaluation.metrics.promptsLast60Min} prompt/60m, ` +
    `${evaluation.metrics.continuousStreakMinutes} min consecutivi) e chiedigli letteralmente se vuole ` +
    `continuare a fare la scimmia di smistamento per i suoi LLM tenendo ${evaluation.metrics.activeWipCount} WIP aperti ` +
    `o se preferisce chiudere prima gli altri WIP / delegare questo task con /goal / silenziare l'avviso per 30 minuti.`;

  process.stdout.write(
    JSON.stringify({
      injectSteps: [
        {
          ephemeralMessage: directive
        }
      ]
    }) + '\n'
  );
  process.exit(0);
}

if (isDirectEntry) {
  main().catch(() => {
    process.stdout.write('{}\n');
    process.exit(0);
  });
}

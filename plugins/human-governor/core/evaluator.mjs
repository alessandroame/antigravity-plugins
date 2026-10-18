/**
 * Headless Behavioral & Cognitive Load Evaluator
 * Pure Node.js module with zero DOM or direct filesystem dependencies.
 * Evaluates concurrent WIP sessions, context-switching thrashing,
 * compulsive prompt frequency, continuous work streaks, and curfew hours.
 */

export const DEFAULT_CONFIG = Object.freeze({
  maxConcurrentWip: 2,
  criticalConcurrentWip: 4,
  wipWindowMinutes: 30,
  maxSwitchesPer10Min: 4,
  maxPromptsPerHour: 25,
  maxContinuousMinutes: 120,
  breakResetMinutes: 20,
  curfewStartMinutes: 22 * 60 + 30, // 22:30
  curfewEndMinutes: 7 * 60,        // 07:00
  cooldownMinutes: 20,
  enableDesktopToast: true
});

/**
 * Checks whether a local time (in minutes from midnight, 0..1439) falls inside the curfew interval.
 * @param {number} currentMinutesOfDay
 * @param {number} startMinutes
 * @param {number} endMinutes
 * @returns {boolean}
 */
export function isWithinCurfew(currentMinutesOfDay, startMinutes, endMinutes) {
  if (startMinutes === endMinutes) return false;
  if (startMinutes > endMinutes) {
    // Overnight interval, e.g., 22:30 (1350) -> 07:00 (420)
    return currentMinutesOfDay >= startMinutes || currentMinutesOfDay < endMinutes;
  }
  return currentMinutesOfDay >= startMinutes && currentMinutesOfDay < endMinutes;
}

/**
 * Formats minutes from midnight (0..1439) as HH:MM.
 * @param {number} totalMinutes
 * @returns {string}
 */
export function formatMinutesAsTime(totalMinutes) {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mm = String(normalized % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Computes the continuous active work streak in minutes from sorted prompt timestamps.
 * A gap >= breakResetMinutes resets the continuous work streak.
 * @param {number[]} sortedTimestampsMs
 * @param {number} nowMs
 * @param {number} breakResetMinutes
 * @returns {number}
 */
export function computeContinuousStreakMinutes(sortedTimestampsMs, nowMs, breakResetMinutes) {
  if (!Array.isArray(sortedTimestampsMs) || sortedTimestampsMs.length === 0) {
    return 0;
  }
  const breakGapMs = breakResetMinutes * 60 * 1000;
  let streakStartMs = sortedTimestampsMs[sortedTimestampsMs.length - 1];

  if (nowMs - streakStartMs > breakGapMs) {
    return 0;
  }

  for (let i = sortedTimestampsMs.length - 1; i > 0; i -= 1) {
    const newer = sortedTimestampsMs[i];
    const older = sortedTimestampsMs[i - 1];
    if (newer - older <= breakGapMs) {
      streakStartMs = older;
    } else {
      break;
    }
  }

  return Math.max(0, Math.round((nowMs - streakStartMs) / 60000));
}

/**
 * Counts how many times the user switched between distinct conversationIds within a time interval.
 * @param {Array<{conversationId: string, timestampMs: number}>} recentEvents
 * @param {number} nowMs
 * @param {number} intervalMinutes
 * @returns {number}
 */
export function countContextSwitches(recentEvents, nowMs, intervalMinutes = 10) {
  if (!Array.isArray(recentEvents) || recentEvents.length < 2) {
    return 0;
  }
  const cutoffMs = nowMs - intervalMinutes * 60 * 1000;
  const filtered = recentEvents
    .filter((e) => e && typeof e.timestampMs === 'number' && e.timestampMs >= cutoffMs && e.conversationId)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  let switches = 0;
  for (let i = 1; i < filtered.length; i += 1) {
    if (filtered[i].conversationId !== filtered[i - 1].conversationId) {
      switches += 1;
    }
  }
  return switches;
}

/**
 * Evaluates human operator telemetry and produces structured violations and Italian UI confrontation copy.
 * @param {object} input
 * @param {number} input.nowMs
 * @param {number} input.localMinutesOfDay
 * @param {string} input.currentConversationId
 * @param {Array<{conversationId: string, lastActiveMs: number, title?: string}>} input.activeSessions
 * @param {Array<{conversationId: string, timestampMs: number}>} input.promptHistory
 * @param {object} [input.config]
 * @returns {{
 *   status: 'OK' | 'WARN' | 'CRITICAL',
 *   metrics: {
 *     activeWipCount: number,
 *     switchesLast10Min: number,
 *     promptsLast60Min: number,
 *     continuousStreakMinutes: number,
 *     localTimeStr: string,
 *     inCurfew: boolean
 *   },
 *   violations: Array<{code: string, severity: 'WARN' | 'CRITICAL', messageIt: string}>,
 *   confrontationQuestionIt: string | null,
 *   desktopToastTextIt: string | null
 * }}
 */
export function evaluateOperatorBehavior(input) {
  const cfg = { ...DEFAULT_CONFIG, ...(input.config || {}) };
  const nowMs = input.nowMs || Date.now();
  const wipCutoffMs = nowMs - cfg.wipWindowMinutes * 60 * 1000;

  // Deduplicate active sessions within the WIP interval, ensuring currentConversationId is included
  const sessionMap = new Map();
  for (const s of input.activeSessions || []) {
    if (s && s.conversationId && s.lastActiveMs >= wipCutoffMs) {
      const prev = sessionMap.get(s.conversationId);
      if (!prev || s.lastActiveMs > prev.lastActiveMs) {
        sessionMap.set(s.conversationId, s);
      }
    }
  }
  if (input.currentConversationId) {
    sessionMap.set(input.currentConversationId, {
      conversationId: input.currentConversationId,
      lastActiveMs: nowMs
    });
  }

  const activeWipCount = sessionMap.size;
  const history = Array.isArray(input.promptHistory) ? input.promptHistory : [];
  const oneHourCutoffMs = nowMs - 60 * 60 * 1000;
  const promptsLast60Min = history.filter((e) => e.timestampMs >= oneHourCutoffMs).length;
  const switchesLast10Min = countContextSwitches(history, nowMs, 10);
  const sortedTimestamps = history.map((e) => e.timestampMs).sort((a, b) => a - b);
  const continuousStreakMinutes = computeContinuousStreakMinutes(
    sortedTimestamps,
    nowMs,
    cfg.breakResetMinutes
  );

  const localMinutesOfDay =
    typeof input.localMinutesOfDay === 'number'
      ? input.localMinutesOfDay
      : new Date(nowMs).getHours() * 60 + new Date(nowMs).getMinutes();
  const localTimeStr = formatMinutesAsTime(localMinutesOfDay);
  const inCurfew = isWithinCurfew(localMinutesOfDay, cfg.curfewStartMinutes, cfg.curfewEndMinutes);

  const violations = [];

  if (activeWipCount > cfg.maxConcurrentWip) {
    const isCritical = activeWipCount >= cfg.criticalConcurrentWip;
    violations.push({
      code: 'EXCESSIVE_WIP',
      severity: isCritical ? 'CRITICAL' : 'WARN',
      messageIt: `${activeWipCount} sessioni WIP attive in parallelo negli ultimi ${cfg.wipWindowMinutes} minuti (limite consigliato: ${cfg.maxConcurrentWip}).`
    });
  }

  if (switchesLast10Min >= cfg.maxSwitchesPer10Min) {
    violations.push({
      code: 'CONTEXT_THRASHING',
      severity: switchesLast10Min >= cfg.maxSwitchesPer10Min + 2 ? 'CRITICAL' : 'WARN',
      messageIt: `${switchesLast10Min} cambi di chat negli ultimi 10 minuti (ping-pong compulsivo tra contesti diversi).`
    });
  }

  if (promptsLast60Min > cfg.maxPromptsPerHour) {
    violations.push({
      code: 'DOPAMINE_PING_PONG',
      severity: 'WARN',
      messageIt: `${promptsLast60Min} prompt inviati nell'ultima ora (micro-gestione passo-passo invece di delegare con /goal).`
    });
  }

  if (continuousStreakMinutes >= cfg.maxContinuousMinutes) {
    violations.push({
      code: 'CONTINUOUS_MARATHON',
      severity: 'WARN',
      messageIt: `${continuousStreakMinutes} minuti consecutivi al terminale senza una pausa di almeno ${cfg.breakResetMinutes} minuti.`
    });
  }

  if (inCurfew) {
    violations.push({
      code: 'CURFEW_VIOLATION',
      severity: 'CRITICAL',
      messageIt: `Sessione avviata alle ${localTimeStr}, in pieno coprifuoco notturno (${formatMinutesAsTime(cfg.curfewStartMinutes)}-${formatMinutesAsTime(cfg.curfewEndMinutes)}).`
    });
  }

  let status = 'OK';
  if (violations.some((v) => v.severity === 'CRITICAL')) {
    status = 'CRITICAL';
  } else if (violations.length > 0) {
    status = 'WARN';
  }

  let confrontationQuestionIt = null;
  let desktopToastTextIt = null;

  if (violations.length > 0) {
    const summaryPoints = violations.map((v) => v.messageIt).join(' ');
    confrontationQuestionIt =
      `Rilevato sovraccarico da orchestratore: ${summaryPoints} ` +
      `Domanda di realtà: sei veramente un pirla che vuole fare la scimmia di smistamento per i suoi LLM, ` +
      `o possiamo chiudere i WIP in eccesso / delegare con /goal?`;

    desktopToastTextIt =
      `[Human Governor] ${violations[0].messageIt} ` +
      `Sicuro di non star facendo il passacarte dei tuoi LLM?`;
  }

  return {
    status,
    metrics: {
      activeWipCount,
      switchesLast10Min,
      promptsLast60Min,
      continuousStreakMinutes,
      localTimeStr,
      inCurfew
    },
    violations,
    confrontationQuestionIt,
    desktopToastTextIt
  };
}

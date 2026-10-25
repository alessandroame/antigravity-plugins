#!/usr/bin/env node

/**
 * Telemetry, Session Backfill & Personal Usage Analytics Reporter (v2.0)
 * Combines incremental hook telemetry (metrics-summary.json) with historical
 * local session mining (~/.gemini/antigravity/brain/) and generates Markdown,
 * JSON, CSV, or interactive HTML (<agent-embed>) dashboards.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  syncBrainSessionsIndex,
  aggregateSessionMetrics
} from '../core/session-backfill.mjs';

const WATCHDOG_TIMEOUT_MS = 25000;
const safetyWatchdog = setTimeout(() => {
  console.error('[FATAL TIMEOUT] report.mjs exceeded the safety timeout.');
  process.exit(1);
}, WATCHDOG_TIMEOUT_MS);
safetyWatchdog.unref();

const WEEKDAY_NAMES_IT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

function getAnalyticsDir() {
  const custom = process.env.ANTIGRAVITY_ANALYTICS_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${seconds}s`;
  const minutes = ms / 60000;
  if (minutes < 60) return `${minutes.toFixed(1)}m (${Math.round(ms / 1000)}s)`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours} h (${Math.round(minutes)}m)`;
}

function formatTokens(count) {
  const n = Number(count) || 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    global: false,
    workspace: null,
    days: null,
    sessionId: null,
    rebuild: false,
    noBackfill: false,
    htmlPath: null,
    json: false,
    csv: false,
    reset: false
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--global') options.global = true;
    else if (a === '--json') options.json = true;
    else if (a === '--csv') options.csv = true;
    else if (a === '--reset') options.reset = true;
    else if (a === '--rebuild') options.rebuild = true;
    else if (a === '--no-backfill') options.noBackfill = true;
    else if (a === '--workspace' && i + 1 < args.length) {
      options.workspace = resolve(args[++i]);
    } else if (a === '--days' && i + 1 < args.length) {
      const d = parseInt(args[++i], 10);
      if (!Number.isNaN(d) && d > 0) options.days = d;
    } else if (a === '--session' && i + 1 < args.length) {
      options.sessionId = args[++i];
    } else if (a === '--html' && i + 1 < args.length) {
      options.htmlPath = resolve(args[++i]);
    }
  }

  if (!options.global && !options.workspace) {
    options.workspace = resolve(process.cwd());
  }

  return options;
}

function mergePluginsMaps(livePlugins = {}, backfilledPlugins = {}) {
  const merged = {};
  const allKeys = new Set([...Object.keys(livePlugins), ...Object.keys(backfilledPlugins)]);
  for (const k of allKeys) {
    const lp = livePlugins[k] || { invocations: 0, skills: {} };
    const bp = backfilledPlugins[k] || { invocations: 0, skills: {} };
    const skills = {};
    const sKeys = new Set([...Object.keys(lp.skills || {}), ...Object.keys(bp.skills || {})]);
    for (const sk of sKeys) {
      skills[sk] = Math.max(lp.skills?.[sk] || 0, bp.skills?.[sk] || 0);
    }
    const skillSum = Object.values(skills).reduce((a, b) => a + b, 0);
    merged[k] = {
      invocations: Math.max(lp.invocations || 0, bp.invocations || 0, skillSum),
      skills
    };
  }
  return merged;
}

function mergeToolsMaps(liveTools = {}, backfilledTools = {}) {
  const merged = {};
  const allKeys = new Set([...Object.keys(liveTools), ...Object.keys(backfilledTools)]);
  for (const k of allKeys) {
    const lt = liveTools[k] || { calls: 0, errors: 0 };
    const bt = backfilledTools[k] || { calls: 0, errors: 0 };
    merged[k] = {
      calls: Math.max(lt.calls || 0, bt.calls || 0),
      errors: Math.max(lt.errors || 0, bt.errors || 0)
    };
  }
  return merged;
}

function generateHtmlDashboard(outputPath, indexData, liveSummary) {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const templatePath = join(scriptDir, '..', 'references', 'usage-dashboard-template.html');
  if (!existsSync(templatePath)) {
    throw new Error(`Dashboard template not found at ${templatePath}`);
  }

  const templateHtml = readFileSync(templatePath, 'utf-8');
  const sessions = Object.values(indexData?.sessions || {})
    .map((e) => e.summary)
    .filter(Boolean);

  const payload = {
    generatedAtMs: Date.now(),
    sessions,
    liveSummary: liveSummary || {}
  };

  const filledHtml = templateHtml.replace(
    '/*__PAYLOAD_JSON__*/ {}',
    JSON.stringify(payload)
  );

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, filledHtml, 'utf-8');
}

function renderMarkdownReport(combined, scopeLabel, syncStats) {
  const lines = [];
  lines.push(`# Report Utilizzo Antigravity & Telemetria: ${scopeLabel}\n`);

  const bf = combined.backfill;
  const lv = combined.live;

  const inputTokens = combined.isTimeFiltered
    ? bf.tokens.input
    : Math.max(lv.totalInputTokens || 0, bf.tokens.input || 0);
  const outputTokens = combined.isTimeFiltered
    ? bf.tokens.output
    : Math.max(lv.totalOutputTokens || 0, bf.tokens.output || 0);
  const cacheTokens = combined.isTimeFiltered
    ? bf.tokens.cacheRead
    : Math.max(lv.totalCacheReadTokens || 0, bf.tokens.cacheRead || 0);
  const totalDirectTokens = inputTokens + outputTokens;
  const cacheRatio =
    totalDirectTokens + cacheTokens > 0
      ? ((cacheTokens / (totalDirectTokens + cacheTokens)) * 100).toFixed(1)
      : '0.0';

  const pluginsMap = combined.isTimeFiltered
    ? bf.plugins
    : mergePluginsMaps(lv.plugins, bf.plugins);
  const toolsMap = combined.isTimeFiltered
    ? bf.tools
    : mergeToolsMaps(lv.tools, bf.tools);

  const totalToolCalls = Object.values(toolsMap).reduce((acc, t) => acc + (t.calls || 0), 0);
  const totalToolErrors = Object.values(toolsMap).reduce((acc, t) => acc + (t.errors || 0), 0);
  const toolSuccessPct =
    totalToolCalls > 0 ? (((totalToolCalls - totalToolErrors) / totalToolCalls) * 100).toFixed(1) : '100.0';

  // Peak hour & weekday calculation
  let peakHour = -1;
  let peakHourCount = 0;
  for (let h = 0; h < 24; h++) {
    if ((bf.hourlyDistribution[h] || 0) > peakHourCount) {
      peakHourCount = bf.hourlyDistribution[h];
      peakHour = h;
    }
  }
  let peakWeekday = -1;
  let peakWeekdayCount = 0;
  for (let w = 0; w < 7; w++) {
    if ((bf.weekdayDistribution[w] || 0) > peakWeekdayCount) {
      peakWeekdayCount = bf.weekdayDistribution[w];
      peakWeekday = w;
    }
  }

  const peakHourStr =
    peakHour >= 0 ? `\`${String(peakHour).padStart(2, '0')}:00–${String(peakHour).padStart(2, '0')}:59\` (${peakHourCount} prompt)` : '_N/D_';
  const peakDayStr =
    peakWeekday >= 0 ? `**${WEEKDAY_NAMES_IT[peakWeekday]}** (${peakWeekdayCount} prompt)` : '_N/D_';

  lines.push(`- **Sessioni Locali Analizzate (\`brain/\`)**: **${bf.humanSessions}** chat umane + \`${bf.subagentSessions}\` subagent (\`${syncStats.totalFiles}\` transcript indicizzati: \`${syncStats.scanned}\` nuovi/aggiornati, \`${syncStats.cached}\` in cache)`);
  lines.push(`- **Volumi Conversazione**: **${bf.totalPrompts}** prompt utente inviati (media \`${bf.avgPromptsPerHumanSession}\` prompt/sessione) | \`${bf.totalPlannerTurns}\` turni modello | \`${bf.totalSubagentsSpawned}\` subagent lanciati`);
  lines.push(`- **Tempo Attivo Netto (escluse pause > 15m)**: **${formatDuration(bf.totalActiveDurationMs)}** (media per chat umana: \`${formatDuration(bf.avgSessionActiveMs)}\`)`);
  lines.push(`- **Abitudini Orarie & Settimanali**: Fascia di picco ${peakHourStr} | Giorno più attivo ${peakDayStr}`);
  lines.push(
    `- **Token Consumati**: Input \`${formatTokens(inputTokens)}\` | Output \`${formatTokens(outputTokens)}\` | Cache Read \`${formatTokens(cacheTokens)}\` (**${cacheRatio}%** cache hit)`
  );
  lines.push(
    `- **Chiamate Tool di Sistema**: **${formatTokens(totalToolCalls)}** chiamate (\`${totalToolErrors}\` errori, tasso di successo **${toolSuccessPct}%**)\n`
  );

  // Per-Prompt Token Breakdown for Selected / Active Session
  const sel = bf.selectedSession;
  if (sel && Array.isArray(sel.promptsBreakdown) && sel.promptsBreakdown.length > 0) {
    const shortId = String(sel.conversationId || '').slice(0, 8);
    lines.push(
      `## Dettaglio Token per Singolo Prompt — Sessione \`${shortId}\` (\`${sel.workspaceName || 'Global'}\`)\n`
    );
    lines.push(
      '| # | Prompt (Estratto) | Turni | Tool | Durata Netta | Token Prompt (In / Out / Cache) | Contesto Raggiunto | Totale Sessione (In+Out / Cache) |'
    );
    lines.push('| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |');
    for (const p of sel.promptsBreakdown) {
      const cleanExcerpt = String(p.excerpt || '')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ')
        .slice(0, 58);
      lines.push(
        `| **#${p.promptNumber}** | ${cleanExcerpt} | ${p.plannerTurns} | ${p.toolCalls} | \`${formatDuration(p.durationMs)}\` | \`+${formatTokens(p.inputTokens)}\` / \`+${formatTokens(p.outputTokens)}\` / \`+${formatTokens(p.cacheReadTokens)}\` (${p.cacheHitPct}%) | **\`${formatTokens(p.contextTokens)}\`** | \`${formatTokens(p.cumulativeDirectTokens)}\` + \`${formatTokens(p.cumulativeCacheTokens)}\` cache |`
      );
    }
    lines.push('');
  }

  // Workspaces / Projects Breakdown (when in global mode)
  const wsEntries = Object.values(bf.workspaces || {}).sort((a, b) => b.prompts - a.prompts);
  if (wsEntries.length > 0) {
    lines.push('## Ripartizione per Progetto / Workspace\n');
    lines.push('| Progetto | Chat Umane | Subagent | Prompt Utente | Tempo Attivo Netto | Token (In+Out) |');
    lines.push('| :--- | :---: | :---: | :---: | :---: | :---: |');
    for (const w of wsEntries) {
      lines.push(
        `| \`${w.name}\` | **${w.humanSessions}** | ${w.subagentSessions} | ${w.prompts} | \`${formatDuration(w.activeDurationMs)}\` | \`${formatTokens(w.inputTokens + w.outputTokens)}\` |`
      );
    }
    lines.push('');
  }

  // Models & Slash Commands
  const modelEntries = Object.entries(bf.models || {}).sort((a, b) => b[1] - a[1]);
  const slashEntries = Object.entries(bf.slashCommands || {}).sort((a, b) => b[1] - a[1]);

  if (modelEntries.length > 0 || slashEntries.length > 0) {
    lines.push('## Modelli AI Selezionati & Comandi Slash\n');
    if (modelEntries.length > 0) {
      const mSummary = modelEntries.map(([m, c]) => `\`${m}\` (${c} turni)`).join(', ');
      lines.push(`- **Modelli AI Rilevati**: ${mSummary}`);
    }
    if (slashEntries.length > 0) {
      const sSummary = slashEntries
        .slice(0, 12)
        .map(([cmd, c]) => `\`${cmd}\` (**${c}**)`)
        .join(' · ');
      lines.push(`- **Top Slash Command**: ${sSummary}`);
    }
    lines.push('');
  }

  // ETA Accuracy & Calibration Section
  lines.push('## Stime ETA & Calibrazione Tempi\n');
  const etaTasks = lv.etaTrackedTasks || 0;
  const calibration = typeof lv.etaCalibrationFactor === 'number' ? lv.etaCalibrationFactor.toFixed(2) : '1.00';
  if (etaTasks === 0) {
    lines.push(
      `_Nessuna lavorazione multi-step con ETA completata ancora registrata (Fattore di calibrazione attivo: \`${calibration}x\`)._\n`
    );
  } else {
    const estMs = lv.totalEstimatedMs || 0;
    const actMs = lv.totalActualEtaTaskMs || 0;
    const driftPct = estMs > 0 ? (((actMs - estMs) / estMs) * 100).toFixed(1) : '0.0';
    const driftSign = Number(driftPct) > 0 ? `+${driftPct}%` : `${driftPct}%`;
    lines.push('| Task Multi-Step Tracciati | Somma ETA Stimata | Tempo Reale Effettivo | Scostamento Medio | Fattore Calibrazione |');
    lines.push('| :---: | :---: | :---: | :---: | :---: |');
    lines.push(
      `| **${etaTasks}** | \`${formatDuration(estMs)}\` | \`${formatDuration(actMs)}\` | **${driftSign}** | \`${calibration}x\` |\n`
    );
  }

  // Plugin Breakdown Table
  lines.push('## Ripartizione per Plugin & Skill\n');
  const plugins = Object.entries(pluginsMap);
  if (plugins.length === 0) {
    lines.push('_Nessun plugin o skill intercettata in questo ambito._\n');
  } else {
    plugins.sort((a, b) => b[1].invocations - a[1].invocations);
    lines.push('| Plugin | Invocazioni Totali | Dettaglio Skill / Componenti |');
    lines.push('| :--- | :---: | :--- |');
    for (const [pName, pInfo] of plugins) {
      const skillsDetail = Object.entries(pInfo.skills || {})
        .sort((a, b) => b[1] - a[1])
        .map(([sName, count]) => `\`${sName}\` (${count})`)
        .join(', ');
      lines.push(`| \`${pName}\` | **${pInfo.invocations}** | ${skillsDetail || '_Regole/Config_'} |`);
    }
    lines.push('');
  }

  // Tools Breakdown Table
  lines.push('## Utilizzo Tool di Sistema\n');
  const tools = Object.entries(toolsMap);
  if (tools.length === 0) {
    lines.push('_Nessun tool di sistema registrato._\n');
  } else {
    tools.sort((a, b) => b[1].calls - a[1].calls);
    lines.push('| Tool | Chiamate | Errori | Tasso di Successo |');
    lines.push('| :--- | :---: | :---: | :---: |');
    for (const [tName, tInfo] of tools) {
      const calls = tInfo.calls || 0;
      const errors = tInfo.errors || 0;
      const successRate = calls > 0 ? (((calls - errors) / calls) * 100).toFixed(1) : '100.0';
      lines.push(`| \`${tName}\` | ${calls} | ${errors} | **${successRate}%** |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function exportCsv(eventsFile) {
  const header =
    'Timestamp,SessionId,Workspace,DurationMs,EtaEstimatedMs,EtaActualMs,InputTokens,OutputTokens,CacheTokens,Plugins,Tools';
  if (!existsSync(eventsFile)) {
    console.log(header);
    return;
  }

  const raw = readFileSync(eventsFile, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  console.log(header);

  for (const line of lines) {
    try {
      const ev = JSON.parse(line);
      const pList = Object.keys(ev.plugins || {}).join(';');
      const tList = Object.keys(ev.tools || {}).join(';');
      console.log(
        `"${ev.ts}","${ev.conversationId}","${ev.workspaceName || ''}",${ev.durationMs || 0},${ev.etaEstimatedMs || ''},${ev.etaActualMs || ''},${ev.tokens?.input || 0},${ev.tokens?.output || 0},${ev.tokens?.cacheRead || 0},"${pList}","${tList}"`
      );
    } catch {
      // Ignore malformed lines
    }
  }
}

function main() {
  const options = parseArgs();
  const analyticsDir = getAnalyticsDir();
  const summaryFile = join(analyticsDir, 'metrics-summary.json');
  const eventsFile = join(analyticsDir, 'events.ndjson');
  const indexFile = join(analyticsDir, 'sessions-index.json');

  if (options.reset) {
    if (existsSync(summaryFile)) unlinkSync(summaryFile);
    if (existsSync(eventsFile)) unlinkSync(eventsFile);
    if (existsSync(indexFile)) unlinkSync(indexFile);
    if (existsSync(analyticsDir)) {
      const files = readdirSync(analyticsDir);
      for (const f of files) {
        if ((f.startsWith('.cursor_') || f.startsWith('.eta_')) && f.endsWith('.json')) {
          try {
            unlinkSync(join(analyticsDir, f));
          } catch {
            // Ignore unlink errors
          }
        }
      }
    }
    console.log(`[OK] Dati di telemetria e indice sessioni resettati con successo in ${analyticsDir}`);
    process.exit(0);
  }

  if (options.csv) {
    exportCsv(eventsFile);
    process.exit(0);
  }

  // 1. Run incremental backfill from ~/.gemini/antigravity/brain/
  let indexData = { sessions: {} };
  let syncStats = { scanned: 0, cached: 0, totalFiles: 0 };
  if (!options.noBackfill) {
    const syncRes = syncBrainSessionsIndex({
      analyticsDir,
      forceRebuild: options.rebuild
    });
    indexData = syncRes.index;
    syncStats = syncRes.stats;
  } else if (existsSync(indexFile)) {
    try {
      indexData = JSON.parse(readFileSync(indexFile, 'utf-8'));
    } catch {
      // Ignore read errors
    }
  }

  // 2. Load live metrics-summary.json
  let summary = { global: {}, workspaces: {} };
  if (existsSync(summaryFile)) {
    try {
      const parsed = JSON.parse(readFileSync(summaryFile, 'utf-8'));
      if (parsed && parsed.global) summary = parsed;
    } catch {
      // Ignore malformed summary
    }
  }

  // Backfill totalSessions into metrics-summary.json if it was 0
  const allAgg = aggregateSessionMetrics(indexData, {});
  if (existsSync(summaryFile) && summary.global && (!summary.global.totalSessions || summary.global.totalSessions < allAgg.humanSessions)) {
    summary.global.totalSessions = allAgg.humanSessions;
    for (const [wsKey, wsObj] of Object.entries(summary.workspaces || {})) {
      const normKey = wsKey.replace(/\\/g, '/').toLowerCase();
      const bfWs = Object.entries(allAgg.workspaces || {}).find(
        ([k]) => k.replace(/\\/g, '/').toLowerCase() === normKey
      );
      if (bfWs && (!wsObj.totalSessions || wsObj.totalSessions < bfWs[1].humanSessions)) {
        wsObj.totalSessions = bfWs[1].humanSessions;
      }
    }
    try {
      writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
    } catch {
      // Ignore write error
    }
  }

  if (options.htmlPath) {
    generateHtmlDashboard(options.htmlPath, indexData, summary);
  }

  let liveTarget = {};
  let scopeLabel = '';
  let backfillFilterWorkspace = null;

  if (options.global) {
    liveTarget = summary.global || {};
    scopeLabel = options.days
      ? `Globale — Ultimi ${options.days} Giorni`
      : 'Globale (Tutti i Workspace & Storico Sessioni)';
  } else {
    const normalizedTarget = options.workspace.replace(/\\/g, '/').toLowerCase();
    backfillFilterWorkspace = normalizedTarget;
    const wsMatch = Object.entries(summary.workspaces || {}).find(
      ([k]) => k.replace(/\\/g, '/').toLowerCase() === normalizedTarget
    );
    liveTarget = wsMatch ? wsMatch[1] : {};
    const wsName = liveTarget.name || basename(options.workspace);
    scopeLabel = options.days
      ? `Workspace [${wsName}] — Ultimi ${options.days} Giorni`
      : `Workspace [${wsName}]`;
  }

  const backfillAgg = aggregateSessionMetrics(indexData, {
    workspace: backfillFilterWorkspace,
    days: options.days,
    sessionId: options.sessionId
  });

  const combined = {
    scope: scopeLabel,
    syncStats,
    isTimeFiltered: Boolean(options.days),
    htmlDashboardPath: options.htmlPath || null,
    live: liveTarget,
    backfill: backfillAgg
  };

  if (options.json) {
    console.log(JSON.stringify(combined, null, 2));
    process.exit(0);
  }

  const markdown = renderMarkdownReport(combined, scopeLabel, syncStats);
  console.log(markdown);
}

main();

#!/usr/bin/env node

/**
 * Telemetry & Usage Analytics Reporter
 * Generates structured Markdown, JSON, or CSV reports from collected Antigravity telemetry,
 * including step latency and ETA estimation accuracy metrics.
 */

import { readFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, basename } from 'node:path';

// Watchdog safety guard
const WATCHDOG_TIMEOUT_MS = 10000;
const safetyWatchdog = setTimeout(() => {
  console.error('[FATAL TIMEOUT] report.mjs exceeded the safety timeout.');
  process.exit(1);
}, WATCHDOG_TIMEOUT_MS);
safetyWatchdog.unref();

function getAnalyticsDir() {
  const custom = process.env.ANTIGRAVITY_ANALYTICS_DIR;
  if (custom) return resolve(custom);
  return join(homedir(), '.gemini', 'antigravity', 'analytics');
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${seconds}s`;
  const minutes = (ms / 60000).toFixed(1);
  return `${minutes}m (${seconds}s)`;
}

function formatTokens(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return `${count}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    global: false,
    workspace: null,
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
    else if (a === '--workspace' && i + 1 < args.length) {
      options.workspace = resolve(args[++i]);
    }
  }

  if (!options.global && !options.workspace) {
    options.workspace = resolve(process.cwd());
  }

  return options;
}

function renderMarkdownReport(data, scopeLabel) {
  const lines = [];
  lines.push(`# Report Telemetria & Analytics: ${scopeLabel}\n`);

  const totalInvocations = data.totalInvocations || 0;
  const totalToolCalls = Object.values(data.tools || {}).reduce((acc, t) => acc + (t.calls || 0), 0);
  const totalSteps = Math.max(data.totalSteps || 0, totalToolCalls);
  const totalDurationMs = data.totalDurationMs || 0;
  const avgStepMs = totalSteps > 0 ? Math.round(totalDurationMs / totalSteps) : 0;

  lines.push(`- **Invocazioni Registrate**: \`${totalInvocations}\` (\`${totalSteps}\` step/tool registrati)`);
  lines.push(`- **Tempo Esecuzione Turni**: \`${formatDuration(totalDurationMs)}\` (media per step/tool: \`${formatDuration(avgStepMs)}\`)`);

  const totalTokens = (data.totalInputTokens || 0) + (data.totalOutputTokens || 0);
  const cacheTokens = data.totalCacheReadTokens || 0;
  const cacheRatio =
    totalTokens + cacheTokens > 0 ? ((cacheTokens / (totalTokens + cacheTokens)) * 100).toFixed(1) : '0.0';

  lines.push(
    `- **Token Consumati**: Input \`${formatTokens(data.totalInputTokens || 0)}\` | Output \`${formatTokens(data.totalOutputTokens || 0)}\` | Cache Read \`${formatTokens(cacheTokens)}\` (${cacheRatio}% cache hit)\n`
  );

  // ETA Accuracy & Calibration Section
  lines.push('## Stime ETA & Calibrazione Tempi\n');
  const etaTasks = data.etaTrackedTasks || 0;
  const calibration = typeof data.etaCalibrationFactor === 'number' ? data.etaCalibrationFactor.toFixed(2) : '1.00';
  if (etaTasks === 0) {
    lines.push(
      `_Nessuna lavorazione multi-step con ETA completata ancora registrata (Fattore di calibrazione attivo: \`${calibration}x\`)._\n`
    );
  } else {
    const estMs = data.totalEstimatedMs || 0;
    const actMs = data.totalActualEtaTaskMs || 0;
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
  const plugins = Object.entries(data.plugins || {});
  if (plugins.length === 0) {
    lines.push('_Nessun plugin o skill intercettata in questo ambito._\n');
  } else {
    plugins.sort((a, b) => b[1].invocations - a[1].invocations);
    lines.push('| Plugin | Invocazioni Totali | Dettaglio Skill / Componenti |');
    lines.push('| :--- | :---: | :--- |');
    for (const [pName, pInfo] of plugins) {
      const skillsDetail = Object.entries(pInfo.skills || {})
        .map(([sName, count]) => `\`${sName}\` (${count})`)
        .join(', ');
      lines.push(`| \`${pName}\` | **${pInfo.invocations}** | ${skillsDetail || '_Regole/Config_'} |`);
    }
    lines.push('');
  }

  // Tools Breakdown Table
  lines.push('## Utilizzo Tool di Sistema\n');
  const tools = Object.entries(data.tools || {});
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

  if (options.reset) {
    if (existsSync(summaryFile)) unlinkSync(summaryFile);
    if (existsSync(eventsFile)) unlinkSync(eventsFile);
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
    console.log(`[OK] Dati di telemetria resettati con successo in ${analyticsDir}`);
    process.exit(0);
  }

  if (options.csv) {
    exportCsv(eventsFile);
    process.exit(0);
  }

  if (!existsSync(summaryFile)) {
    console.log(`Nessun dato di telemetria disponibile in ${analyticsDir}.`);
    console.log("I dati vengono raccolti automaticamente durante l'esecuzione dell'agente con il plugin attivo.");
    process.exit(0);
  }

  let summary = null;
  try {
    summary = JSON.parse(readFileSync(summaryFile, 'utf-8'));
  } catch (err) {
    console.error(`Error reading ${summaryFile}: ${err.message}`);
    process.exit(1);
  }

  let targetData = null;
  let scopeLabel = '';

  if (options.global) {
    targetData = summary.global;
    scopeLabel = 'Globale (Tutti i Workspace)';
  } else {
    const normalizedTarget = options.workspace.replace(/\\/g, '/').toLowerCase();
    const wsMatch = Object.entries(summary.workspaces || {}).find(
      ([k]) => k.replace(/\\/g, '/').toLowerCase() === normalizedTarget
    );

    if (wsMatch) {
      targetData = wsMatch[1];
      scopeLabel = `Workspace [${targetData.name || basename(options.workspace)}]`;
    } else {
      targetData = {
        name: basename(options.workspace),
        totalInvocations: 0,
        totalSteps: 0,
        totalDurationMs: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        etaTrackedTasks: 0,
        totalEstimatedMs: 0,
        totalActualEtaTaskMs: 0,
        etaCalibrationFactor: 1.0,
        plugins: {},
        tools: {}
      };
      scopeLabel = `Workspace [${basename(options.workspace)}] (Nessun evento ancora registrato)`;
    }
  }

  if (options.json) {
    console.log(JSON.stringify(targetData, null, 2));
    process.exit(0);
  }

  const markdown = renderMarkdownReport(targetData, scopeLabel);
  console.log(markdown);
}

main();

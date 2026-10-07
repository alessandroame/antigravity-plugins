#!/usr/bin/env node

/**
 * Script per la ridenominazione automatica del titolo della sessione di chat in Antigravity.
 * Comunica direttamente con l'endpoint Connect-RPC locale di Antigravity Language Server
 * (LanguageServerService/UpdateConversationAnnotations) trasmettendo il token CSRF
 * e aggiornando in tempo reale il titolo della conversazione sia nella UI che su disco.
 *
 * Utilizzo:
 *   node set-chat-title.mjs --title "<titolo>" [--conversation-id "<id>"] [--port <porta>]
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import https from 'node:https';
import { execSync } from 'node:child_process';

function getHomeDir() {
  return process.env.USERPROFILE || process.env.HOME || '';
}

function resolveConversationId(explicitId) {
  if (explicitId && explicitId.trim().length > 0) {
    return explicitId.trim();
  }

  // Risoluzione automatica: scansione della cartella brain più recente
  const home = getHomeDir();
  const brainCandidates = [
    join(home, '.gemini', 'antigravity', 'brain'),
    join(home, '.gemini', 'antigravity-ide', 'brain')
  ];

  for (const brainDir of brainCandidates) {
    if (existsSync(brainDir)) {
      try {
        const entries = readdirSync(brainDir)
          .filter((d) => /^[a-f0-9-]{36}$/i.test(d))
          .map((d) => {
            const fullPath = join(brainDir, d);
            return { id: d, mtime: statSync(fullPath).mtimeMs };
          })
          .sort((a, b) => b.mtime - a.mtime);

        if (entries.length > 0) {
          return entries[0].id;
        }
      } catch {
        // Fallthrough se non leggibile
      }
    }
  }

  return null;
}

function findLsPort(explicitPort) {
  if (explicitPort && !isNaN(parseInt(explicitPort, 10))) {
    return parseInt(explicitPort, 10);
  }

  const home = getHomeDir();
  const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');

  // Strategia 1: Ispezione dei log principali di Antigravity
  const logPaths = [
    join(appData, 'Antigravity', 'logs', 'main.log'),
    join(home, 'Library', 'Logs', 'Antigravity', 'main.log'),
    join(home, '.config', 'Antigravity', 'logs', 'main.log')
  ];

  for (const logPath of logPaths) {
    if (existsSync(logPath)) {
      try {
        const content = readFileSync(logPath, 'utf-8');
        const matches = [...content.matchAll(/https:\/\/127\.0\.0\.1:(\d+)\//g)];
        if (matches.length > 0) {
          return parseInt(matches[matches.length - 1][1], 10);
        }
      } catch {
        // Prosegui al prossimo file
      }
    }
  }

  // Strategia 2 (Windows): Ricerca porte in ascolto tramite netstat / PowerShell
  if (process.platform === 'win32') {
    try {
      const psOutput = execSync(
        'powershell -NoProfile -Command "(Get-NetTCPConnection -State Listen | Where-Object { $_.OwningProcess -eq (Get-Process language_server -ErrorAction SilentlyContinue).Id } | Select-Object -ExpandProperty LocalPort) -join \',\'"',
        { timeout: 5000, encoding: 'utf-8' }
      ).trim();

      const candidatePorts = psOutput
        .split(',')
        .map((p) => parseInt(p.trim(), 10))
        .filter((p) => !isNaN(p) && p > 0);

      if (candidatePorts.length > 0) {
        return candidatePorts[0];
      }
    } catch {
      // Ignora e termina
    }
  }

  return null;
}

async function fetchCsrfToken(port) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://127.0.0.1:${port}/`,
      { rejectUnauthorized: false, timeout: 5000 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const match = body.match(/"csrfToken":\s*"([^"]+)"/);
          if (match && match[1]) {
            resolve(match[1]);
          } else {
            reject(new Error('CSRF token non presente nella configurazione frontend di Antigravity'));
          }
        });
      }
    );

    req.on('error', (err) => reject(new Error(`Connessione all'endpoint https://127.0.0.1:${port}/ fallita: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout nel recupero del CSRF token su porta ${port}`));
    });
  });
}

async function updateConversationTitle(port, csrf, conversationId, title) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      cascadeId: conversationId,
      annotations: {
        title: title
      }
    });

    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/exa.language_server_pb.LanguageServerService/UpdateConversationAnnotations',
      method: 'POST',
      rejectUnauthorized: false,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'x-codeium-csrf-token': csrf,
        'Connect-Protocol-Version': '1',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Chiamata RPC fallita con codice ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Errore di rete durante la richiesta RPC: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout durante la chiamata UpdateConversationAnnotations'));
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  const args = process.argv.slice(2);
  let title = '';
  let conversationId = '';
  let portArg = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[++i];
    } else if (args[i] === '--conversation-id' && args[i + 1]) {
      conversationId = args[++i];
    } else if (args[i] === '--port' && args[i + 1]) {
      portArg = args[++i];
    }
  }

  if (!title || title.trim().length === 0) {
    console.error('Uso: node set-chat-title.mjs --title "<titolo>" [--conversation-id "<id>"] [--port <porta>]');
    process.exit(1);
  }

  const targetId = resolveConversationId(conversationId);
  if (!targetId) {
    console.error('Errore: impossibile identificare l\'ID della conversazione bersaglio.');
    process.exit(1);
  }

  const port = findLsPort(portArg);
  if (!port) {
    console.error('Errore: impossibile rilevare la porta di ascolto di Antigravity Language Server.');
    process.exit(1);
  }

  const csrf = await fetchCsrfToken(port);
  await updateConversationTitle(port, csrf, targetId, title.trim());

  console.log(`[OK] Titolo della sessione "${targetId}" aggiornato a: "${title.trim()}"`);
}

run().catch((err) => {
  console.error(`[ERRORE] ${err.message}`);
  process.exit(1);
});

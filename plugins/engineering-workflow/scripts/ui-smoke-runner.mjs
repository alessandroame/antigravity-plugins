#!/usr/bin/env node

/**
 * Declarative Multi-Viewport Headless UI Flow & Geometry Probe Runner (Gate 4 Automation)
 * Executes saved interaction flows from `.agents/smoke-flows.json` (or `--url <url>`)
 * across Mobile (360x800), Embedded/Raspberry (800x480), and Desktop/Tablet (1280x800),
 * injecting `ui-geometry-probe.js` before and after user actions and producing
 * the canonical 4-Measure Receipt JSON with zero manual browser clicking.
 *
 * Dual Engine:
 *  1. Playwright (`playwright` / `playwright-core`) when installed in workspace
 *  2. Zero-dependency Native CDP Engine (Node 22+ `WebSocket` + local Chrome/Edge)
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildFourMeasureReceipt, validateSmokeFlowConfig } from '../core/review-guard-engine.mjs';

const safetyTimer = setTimeout(() => {
  console.error('[FATAL TIMEOUT] ui-smoke-runner.mjs exceeded 45s safety ceiling.');
  process.exit(1);
}, 45000);
safetyTimer.unref();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROBE_SCRIPT_PATH = resolve(
  __dirname,
  '..',
  'skills',
  'shift-left-governance',
  'scripts',
  'ui-geometry-probe.js'
);

const DEFAULT_TEMPLATE = {
  baseUrl: 'http://127.0.0.1:5173',
  viewports: [
    { name: 'mobile-360x800', width: 360, height: 800 },
    { name: 'embedded-800x480', width: 800, height: 480 },
    { name: 'desktop-1280x800', width: 1280, height: 800 }
  ],
  flows: [
    {
      name: 'initial-render-and-primary-action',
      path: '/',
      steps: [],
      assertVisibleSelector: 'body'
    }
  ]
};

function parseCliArgs(argv) {
  const opts = {
    repo: process.cwd(),
    configPath: '',
    url: '',
    init: false,
    validateOnly: false,
    json: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--repo' && argv[i + 1]) {
      opts.repo = resolve(argv[++i]);
    } else if (arg === '--config' && argv[i + 1]) {
      opts.configPath = resolve(argv[++i]);
    } else if (arg === '--url' && argv[i + 1]) {
      opts.url = argv[++i];
    } else if (arg === '--init') {
      opts.init = true;
    } else if (arg === '--validate-config' || arg === '--dry-run') {
      opts.validateOnly = true;
    } else if (arg === '--json') {
      opts.json = true;
    }
  }

  if (!opts.configPath) {
    opts.configPath = join(opts.repo, '.agents', 'smoke-flows.json');
  }
  return opts;
}

export function buildInjectableProbeExpression() {
  const src = readFileSync(PROBE_SCRIPT_PATH, 'utf-8');
  const cleanSrc = src.replace(/\bexport\s+function\s+runUiGeometryProbe\b/, 'function runUiGeometryProbe');
  return `(() => {\n${cleanSrc}\nreturn runUiGeometryProbe();\n})()`;
}

export function resolveFlowTargetUrl(baseUrl, flowPath) {
  if (!flowPath) return baseUrl;
  if (/^(?:https?|file):\/\//i.test(flowPath)) return flowPath;
  if (/^file:\/\//i.test(baseUrl)) {
    const cleanRel = flowPath.replace(/^\/+/, '');
    const baseDir = /\.html?(?:[?#].*)?$/i.test(baseUrl)
      ? baseUrl.replace(/\/[^/]+$/, '/')
      : baseUrl.endsWith('/')
        ? baseUrl
        : `${baseUrl}/`;
    return `${baseDir}${cleanRel}`;
  }
  return new URL(flowPath, baseUrl).toString();
}

function findLocalChromiumExecutable() {
  const candidates =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
          ]
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];

  for (const exe of candidates) {
    if (existsSync(exe)) return exe;
  }
  return null;
}

function allocateFreePort() {
  return new Promise((resolvePort, rejectPort) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', rejectPort);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => resolvePort(port));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForCdpTargetWs(port, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const pageTarget = Array.isArray(targets)
          ? targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
          : null;
        if (pageTarget) return pageTarget.webSocketDebuggerUrl;
      }
    } catch {
      // Browser still starting up
    }
    await sleep(120);
  }
  throw new Error(`Timed out waiting for headless browser CDP endpoint on port ${port}.`);
}

function createCdpClient(wsUrl) {
  return new Promise((resolveClient, rejectClient) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const listeners = new Map();

    ws.addEventListener('open', () => {
      resolveClient({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const id = nextId++;
            const timer = setTimeout(() => {
              if (pending.has(id)) {
                pending.delete(id);
                rej(new Error(`CDP timeout on ${method}`));
              }
            }, 10000);
            pending.set(id, { res, rej, timer });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        on(eventMethod, fn) {
          if (!listeners.has(eventMethod)) listeners.set(eventMethod, []);
          listeners.get(eventMethod).push(fn);
        },
        offAll(eventMethod) {
          listeners.delete(eventMethod);
        },
        close() {
          for (const [, p] of pending) clearTimeout(p.timer);
          pending.clear();
          try {
            ws.close();
          } catch {
            // Ignore close errors
          }
        }
      });
    });

    ws.addEventListener('error', (err) => {
      rejectClient(new Error(`CDP WebSocket error: ${err?.message || 'connection failed'}`));
    });

    ws.addEventListener('message', (evt) => {
      let msg;
      try {
        msg = JSON.parse(typeof evt.data === 'string' ? evt.data : String(evt.data));
      } catch {
        return;
      }
      if (typeof msg.id === 'number' && pending.has(msg.id)) {
        const entry = pending.get(msg.id);
        pending.delete(msg.id);
        clearTimeout(entry.timer);
        if (msg.error) entry.rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else entry.res(msg.result);
      } else if (msg.method && listeners.has(msg.method)) {
        for (const fn of listeners.get(msg.method)) {
          try {
            fn(msg.params || {});
          } catch {
            // Ignore listener exception
          }
        }
      }
    });
  });
}

async function evalInCdp(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res?.exceptionDetails) {
    const desc =
      res.exceptionDetails.exception?.description ||
      res.exceptionDetails.text ||
      'Runtime evaluation exception';
    throw new Error(desc);
  }
  return res?.result?.value;
}

async function waitForVisibleInCdp(cdp, selector, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  const safeSel = JSON.stringify(selector);
  while (Date.now() < deadline) {
    const visible = await evalInCdp(
      cdp,
      `(() => {
        const el = document.querySelector(${safeSel});
        if (!el) return false;
        const st = window.getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })()`
    );
    if (visible === true) return true;
    await sleep(100);
  }
  throw new Error(`Selector ${selector} did not become visible within ${timeoutMs}ms.`);
}

async function executeSmokeFlowsViaNativeCdp(normalizedConfig) {
  if (typeof globalThis.WebSocket !== 'function') {
    throw new Error('Node.js global WebSocket is unavailable (requires Node 22+).');
  }
  const exePath = findLocalChromiumExecutable();
  if (!exePath) {
    throw new Error('No local Chrome or Edge executable found for native CDP mode.');
  }

  const port = await allocateFreePort();
  const profileDir = mkdtempSync(join(tmpdir(), 'ag-ui-smoke-cdp-'));
  const probeExpr = buildInjectableProbeExpression();
  const runs = [];

  const child = spawn(
    exePath,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-popup-blocking',
      '--allow-file-access-from-files',
      'about:blank'
    ],
    { stdio: 'ignore', windowsHide: true }
  );

  let cdp = null;
  try {
    const wsUrl = await waitForCdpTargetWs(port);
    cdp = await createCdpClient(wsUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const vp of normalizedConfig.viewports) {
      for (const flow of normalizedConfig.flows) {
        const consoleErrors = [];
        cdp.offAll('Runtime.consoleAPICalled');
        cdp.offAll('Runtime.exceptionThrown');

        cdp.on('Runtime.consoleAPICalled', (params) => {
          if (params.type === 'error') {
            const text = (params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
            consoleErrors.push(text.trim() || 'console.error');
          }
        });
        cdp.on('Runtime.exceptionThrown', (params) => {
          const desc =
            params.exceptionDetails?.exception?.description ||
            params.exceptionDetails?.text ||
            'Uncaught page exception';
          consoleErrors.push(desc);
        });

        let interactionSucceeded = true;
        let beforeProbe = { pass: false, primaryCanvasRatio: null, violations: [{ type: 'NAVIGATION_FAILED' }] };
        let afterProbe = beforeProbe;

        try {
          await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 1,
            mobile: vp.width <= 480
          });

          const targetUrl = resolveFlowTargetUrl(normalizedConfig.baseUrl, flow.path);
          let loaded = false;
          cdp.offAll('Page.loadEventFired');
          cdp.on('Page.loadEventFired', () => {
            loaded = true;
          });

          await cdp.send('Page.navigate', { url: targetUrl });
          const navDeadline = Date.now() + 10000;
          while (!loaded && Date.now() < navDeadline) {
            await sleep(80);
          }
          await sleep(160);

          beforeProbe = await evalInCdp(cdp, probeExpr);

          for (const step of flow.steps) {
            const stepTimeout = typeof step.timeoutMs === 'number' ? step.timeoutMs : 5000;
            if (step.action === 'click') {
              await waitForVisibleInCdp(cdp, step.selector, stepTimeout);
              const safeSel = JSON.stringify(step.selector);
              await evalInCdp(
                cdp,
                `(() => {
                  const el = document.querySelector(${safeSel});
                  el.click();
                  return true;
                })()`
              );
              await sleep(140);
            } else if (step.action === 'fill') {
              await waitForVisibleInCdp(cdp, step.selector, stepTimeout);
              const safeSel = JSON.stringify(step.selector);
              const safeVal = JSON.stringify(String(step.value ?? ''));
              await evalInCdp(
                cdp,
                `(() => {
                  const el = document.querySelector(${safeSel});
                  el.focus();
                  el.value = ${safeVal};
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                })()`
              );
              await sleep(100);
            } else if (step.action === 'press') {
              const keyName = JSON.stringify(String(step.value || 'Enter'));
              await evalInCdp(
                cdp,
                `(() => {
                  const target = document.activeElement || document.body;
                  target.dispatchEvent(new KeyboardEvent('keydown', { key: ${keyName}, bubbles: true }));
                  target.dispatchEvent(new KeyboardEvent('keyup', { key: ${keyName}, bubbles: true }));
                  return true;
                })()`
              );
              await sleep(100);
            } else if (step.action === 'wait') {
              if (step.selector) {
                await waitForVisibleInCdp(cdp, step.selector, stepTimeout);
              } else {
                await sleep(Math.min(2000, stepTimeout));
              }
            }
          }

          if (flow.assertVisibleSelector) {
            await waitForVisibleInCdp(cdp, flow.assertVisibleSelector, 5000);
          }

          afterProbe = await evalInCdp(cdp, probeExpr);
        } catch (err) {
          interactionSucceeded = false;
          consoleErrors.push(`Flow execution error: ${err.message}`);
        }

        runs.push({
          viewport: `${vp.name} (${vp.width}x${vp.height})`,
          flow: flow.name,
          beforeProbe,
          afterProbe,
          consoleErrors,
          interactionSucceeded
        });
      }
    }
  } finally {
    if (cdp) cdp.close();
    try {
      child.kill();
    } catch {
      // Ignore already exited browser
    }
    await sleep(150);
    try {
      rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // Best-effort profile cleanup on Windows
    }
  }

  return buildFourMeasureReceipt(runs);
}

async function resolvePlaywrightChromium(repoPath) {
  const candidates = [repoPath, process.cwd(), resolve(__dirname, '..', '..', '..')];
  for (const base of candidates) {
    try {
      const req = createRequire(join(base, 'package.json'));
      for (const pkgName of ['playwright', 'playwright-core', '@playwright/test']) {
        try {
          const mod = req(pkgName);
          if (mod && mod.chromium) return mod.chromium;
        } catch {
          // Try next package
        }
      }
    } catch {
      // Try next base path
    }
  }
  return null;
}

async function executeSmokeFlows(normalizedConfig, repoPath) {
  const chromium = await resolvePlaywrightChromium(repoPath);
  if (!chromium) {
    return executeSmokeFlowsViaNativeCdp(normalizedConfig);
  }

  const probeExpr = buildInjectableProbeExpression();
  const runs = [];
  let browser = null;

  try {
    for (const opts of [{ headless: true }, { headless: true, channel: 'msedge' }, { headless: true, channel: 'chrome' }]) {
      try {
        browser = await chromium.launch(opts);
        break;
      } catch {
        // Fallback to next channel
      }
    }
    if (!browser) {
      return executeSmokeFlowsViaNativeCdp(normalizedConfig);
    }

    for (const vp of normalizedConfig.viewports) {
      for (const flow of normalizedConfig.flows) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height }
        });
        const page = await context.newPage();
        const consoleErrors = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', (err) => {
          consoleErrors.push(String(err?.message || err));
        });

        let interactionSucceeded = true;
        let beforeProbe = { pass: false, primaryCanvasRatio: null, violations: [{ type: 'NAVIGATION_FAILED' }] };
        let afterProbe = beforeProbe;

        try {
          const targetUrl = resolveFlowTargetUrl(normalizedConfig.baseUrl, flow.path);
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          beforeProbe = await page.evaluate(probeExpr);

          for (const step of flow.steps) {
            const stepTimeout = typeof step.timeoutMs === 'number' ? step.timeoutMs : 5000;
            if (step.action === 'click') {
              await page.click(step.selector, { timeout: stepTimeout });
            } else if (step.action === 'fill') {
              await page.fill(step.selector, String(step.value ?? ''), { timeout: stepTimeout });
            } else if (step.action === 'press') {
              await page.keyboard.press(String(step.value || 'Enter'));
            } else if (step.action === 'wait') {
              if (step.selector) {
                await page.waitForSelector(step.selector, { timeout: stepTimeout });
              } else {
                await page.waitForTimeout(Math.min(2000, stepTimeout));
              }
            }
          }

          if (flow.assertVisibleSelector) {
            await page.waitForSelector(flow.assertVisibleSelector, { state: 'visible', timeout: 5000 });
          }

          afterProbe = await page.evaluate(probeExpr);
        } catch (err) {
          interactionSucceeded = false;
          consoleErrors.push(`Flow execution error: ${err.message}`);
        } finally {
          await context.close();
        }

        runs.push({
          viewport: `${vp.name} (${vp.width}x${vp.height})`,
          flow: flow.name,
          beforeProbe,
          afterProbe,
          consoleErrors,
          interactionSucceeded
        });
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  return buildFourMeasureReceipt(runs);
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));

  if (opts.init) {
    mkdirSync(dirname(opts.configPath), { recursive: true });
    if (!existsSync(opts.configPath)) {
      writeFileSync(opts.configPath, JSON.stringify(DEFAULT_TEMPLATE, null, 2) + '\n', 'utf-8');
      console.log(`Initialized smoke-flow template at ${opts.configPath}`);
    } else {
      console.log(`Config already exists at ${opts.configPath}`);
    }
    process.exit(0);
  }

  let rawConfig = null;
  if (opts.url) {
    rawConfig = {
      baseUrl: opts.url,
      viewports: [
        { name: 'mobile-360x800', width: 360, height: 800 },
        { name: 'desktop-1280x800', width: 1280, height: 800 }
      ],
      flows: [{ name: 'direct-url-probe', path: '', steps: [], assertVisibleSelector: 'body' }]
    };
  } else if (existsSync(opts.configPath)) {
    rawConfig = JSON.parse(readFileSync(opts.configPath, 'utf-8'));
  } else {
    console.error(
      `[ERROR] Missing ${opts.configPath}. Run with --init to scaffold .agents/smoke-flows.json or pass --url <url>.`
    );
    process.exit(1);
  }

  const validation = validateSmokeFlowConfig(rawConfig);
  if (!validation.valid) {
    console.error('[INVALID SMOKE CONFIG]', validation.errors.join(' | '));
    process.exit(1);
  }

  if (opts.validateOnly) {
    if (opts.json) {
      console.log(JSON.stringify(validation, null, 2));
    } else {
      console.log(
        `[OK] Valid smoke-flow config (${validation.normalized.viewports.length} viewports, ${validation.normalized.flows.length} flows).`
      );
    }
    process.exit(0);
  }

  const receipt = await executeSmokeFlows(validation.normalized, opts.repo);
  if (opts.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log(`=== UI SMOKE & 4-MEASURE RECEIPT (${receipt.overallPass ? 'PASS' : 'FAIL'}) ===`);
    console.log(`Runs Executed       : ${receipt.measures.interactiveFlow.runsExecuted}`);
    console.log(`Geometry Violations : ${receipt.measures.geometryProbe.violationsCount}`);
    console.log(`Console Errors      : ${receipt.measures.interactiveFlow.consoleErrorsCount}`);
    console.log(
      `Primary Screen Free : ${receipt.measures.screenBudget.percentFree !== null ? receipt.measures.screenBudget.percentFree + '%' : 'N/A (no primary canvas)'}`
    );
    if (!receipt.overallPass) {
      for (const r of receipt.runs) {
        const vTotal = (r.beforeProbe?.violations?.length || 0) + (r.afterProbe?.violations?.length || 0);
        if (!r.interactionSucceeded || vTotal > 0 || r.consoleErrors.length > 0) {
          console.log(` - [ISSUE] ${r.viewport} :: ${r.flow} (violations=${vTotal}, errors=${r.consoleErrors.length})`);
          for (const v of [...(r.beforeProbe?.violations || []), ...(r.afterProbe?.violations || [])].slice(0, 5)) {
            console.log(`     * ${v.type}: ${v.element || ''} ${JSON.stringify(v)}`);
          }
          for (const ce of r.consoleErrors.slice(0, 3)) {
            console.log(`     * console: ${ce}`);
          }
        }
      }
    }
  }

  process.exit(receipt.overallPass ? 0 : 2);
}

const isDirectEntry =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectEntry) {
  main().catch((err) => {
    console.error(`[ERROR] ${err.message}`);
    process.exit(1);
  });
}

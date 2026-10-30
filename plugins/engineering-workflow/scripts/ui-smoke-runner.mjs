#!/usr/bin/env node

/**
 * Declarative Multi-Viewport Headless UI Flow & Geometry Probe Runner (Gate 4 Automation)
 * Executes saved interaction flows from `.agents/smoke-flows.json` (or `--url <url>`)
 * across Mobile (360x800), Embedded/Raspberry (800x480), and Desktop (1280x800),
 * injecting `ui-geometry-probe.js` before and after user actions and producing
 * the canonical 4-Measure Receipt JSON with zero manual browser clicking.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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
  try {
    const mod = await import('playwright');
    if (mod && mod.chromium) return mod.chromium;
  } catch {
    // Not globally resolvable via ESM
  }
  return null;
}

async function launchBrowserResilient(chromium) {
  const attempts = [
    { headless: true },
    { headless: true, channel: 'msedge' },
    { headless: true, channel: 'chrome' }
  ];
  let lastError = null;
  for (const launchOpts of attempts) {
    try {
      return await chromium.launch(launchOpts);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Unable to launch headless Chromium, Edge, or Chrome.');
}

async function executeSmokeFlows(normalizedConfig) {
  const chromium = await resolvePlaywrightChromium(process.cwd());
  if (!chromium) {
    throw new Error(
      'Playwright is not installed in this workspace. Install playwright or playwright-core to execute live headless flows.'
    );
  }

  const probeExpr = buildInjectableProbeExpression();
  const runs = [];
  let browser = null;

  try {
    browser = await launchBrowserResilient(chromium);

    for (const vp of normalizedConfig.viewports) {
      for (const flow of normalizedConfig.flows) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height }
        });
        const page = await context.newPage();
        const consoleErrors = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        page.on('pageerror', (err) => {
          consoleErrors.push(String(err?.message || err));
        });

        let interactionSucceeded = true;
        let beforeProbe = { pass: false, primaryCanvasRatio: null, violations: [{ type: 'NAVIGATION_FAILED' }] };
        let afterProbe = beforeProbe;

        try {
          const targetUrl = flow.path
            ? new URL(flow.path, normalizedConfig.baseUrl).toString()
            : normalizedConfig.baseUrl;

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
    if (browser) {
      await browser.close();
    }
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

  const receipt = await executeSmokeFlows(validation.normalized);
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

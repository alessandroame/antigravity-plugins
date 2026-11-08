#!/usr/bin/env node

/**
 * Adaptive Router PreInvocation Hook (< 3ms hot path)
 * Evaluates the incoming user prompt, persists the turn routing profile in `.route_<id>.json`,
 * and outputs `{}\n` on stdout to guarantee zero UI log noise on normal turns.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { classifyPromptRoute } from '../core/router-engine.mjs';
import { getAnalyticsDir, loadCapabilityRegistry } from './model-router.mjs';

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
  if (invocationNum > 1) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  const promptText = typeof payload.lastUserInput === 'string' ? payload.lastUserInput : '';
  if (!promptText.trim()) {
    process.stdout.write('{}\n');
    process.exit(0);
  }

  try {
    const analyticsDir = getAnalyticsDir();
    mkdirSync(analyticsDir, { recursive: true });
    const registry = loadCapabilityRegistry(analyticsDir);
    const route = classifyPromptRoute(promptText, {
      registry,
      activeUiModel: payload.model || null
    });

    const convId = payload.conversationId || 'latest';
    const routeStatePath = join(analyticsDir, `.route_${convId}.json`);
    writeFileSync(
      routeStatePath,
      JSON.stringify({
        timestampMs: Date.now(),
        conversationId: convId,
        ...route
      }) + '\n',
      'utf-8'
    );
  } catch {
    // Fail-safe: never block invocation
  }

  process.stdout.write('{}\n');
  process.exit(0);
}

if (isDirectEntry) {
  main();
}

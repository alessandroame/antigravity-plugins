---
name: shift-left-governance
description: >-
  Use this skill when configuring, implementing, or executing shift-left quality gates,
  multi-viewport UI geometry probes, and automated architectural compliance tests before delivery.
---

# Shift-Left Quality Gate & Governance Harness

Guides execution of the 5 **Shift-Left** quality gates: turning test integrity, headless isolation, and UI ergonomics into automated pre-delivery checks. Always reply to the user in plain Italian.

---

## 1. The 5 Sequential Verification Gates

Before declaring any task complete or proposing changes for commit:

```text
[Gate 1: Pre-Design] -> [Gate 2: Headless Core] -> [Gate 3: Suite + Diff Triage] -> [Gate 4: UI Smoke/Probe] -> [Gate 5: Transcript-Verified Receipt]
```

### Gate 1: Ex-Ante Pre-Design Compliance
Verify before opening code or markup:
1. **Occam's Razor**: Zero duplicate controls or routes vs global navigation.
2. **Touch Ergonomics**: Touch targets `>= 48 x 48 px`.
3. **Anti-Naked Numbers**: Every numeric metric paired with its unit using `white-space: nowrap`.
4. **Theme & Contrast**: WCAG 2.1 AA (`>= 4.5:1`).

### Gate 2: In-Flight Implementation Rigor
1. **Headless Core Purity**: `core/` or `src/core/` modules MUST have `0` references to `window`, `document`, `localStorage`, or CSS selectors.
2. **Storage Decoupling**: Inject `storageAdapter` (in-memory adapter in Node.js tests).
3. **Strict English in Code**: Identifiers, comments, exception logs, and tests in English.
4. **Zero Icon Clutter**: No decorative emojis in headings or controls.

### Gate 3: Auto-Discovered Test Suite, Test Integrity & `git diff` Triage
1. Run `npm test` ensuring discovery covers **all** `*.test.*` files in the repository.
2. Verify zero pre-existing assertions were weakened and filter high-risk hunks via [`scripts/diff-triage.mjs`](../../scripts/diff-triage.mjs) (or `/review-diff` on multi-file patches):
```bash
node ~/.gemini/config/plugins/engineering-workflow/scripts/diff-triage.mjs --repo "<workspace-root>"
```

### Gate 4: Multi-Viewport Browser Verification (`ui-smoke-runner.mjs` & `ui-geometry-probe.js`)
For every UI edit (`.html`, `.css`, `ui/`), NEVER close the task with `npm test` alone or visual eyeball judgment:
1. **Automated Multi-Viewport Check (`360x800` Mobile, `800x480` Embedded, `1280x800` Desktop)**: Run [`scripts/ui-smoke-runner.mjs`](../../scripts/ui-smoke-runner.mjs) if `.agents/smoke-flows.json` exists, or inject [`scripts/ui-geometry-probe.js`](./scripts/ui-geometry-probe.js):
```bash
node ~/.gemini/config/plugins/engineering-workflow/scripts/ui-smoke-runner.mjs --repo "<workspace-root>"
```
2. **60/40 Screen Budget & 3-Second Hierarchy**: Verify `>= 60%` free viewport height for primary canvas, max 4 cards above-the-fold on mobile, and `white-space: nowrap` on `value + unit`.
3. **Live User Flow (`Prima -> Click/Input -> Dopo`)**: Verify at least 1 real interaction visible without scrolling and `0` console errors.

### Gate 5: Transcript Certification (`Stop` Hook) & 4-Measure Receipt (in Italian)
The `Stop` hook [`scripts/delivery-gate-hook.mjs`](../../scripts/delivery-gate-hook.mjs) checks `transcript.jsonl` to ensure tests/probes ran **after** the last `edit_file`/`write_file`.
Present max 3–5 bullets at `L0` and attach the **Ricevuta a 4 Misure** inside `<details>` (`0 modifiche` if already compliant):
1. **Budget Schermo**: `%` libera per il contenuto primario (`>= 60%`).
2. **Scala Tipografica & Unità**: `Dato primario px` vs `Etichetta px` e unità inseparabili (`nowrap`).
3. **Esito Sonda (`ui-geometry-probe.js`)**: `overflow: 0, coveredControls: 0, clippedText: 0, smallTargets: 0`.
4. **Flusso Interattivo (`Prima -> Dopo`)**: azione eseguita, riscontro visivo senza scroll e `consoleErrors: 0`.

---

## 2. Governance Test Suite Template (`tests/governance.test.mjs`)

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Shift-Left Architectural Governance', () => {
  it('ensures core modules have zero DOM references', () => {
    if (!existsSync('core')) return;
    const files = readdirSync('core').filter((f) => f.endsWith('.js') || f.endsWith('.mjs'));
    const forbidden = ['document.', 'window.', 'HTMLElement'];
    for (const f of files) {
      const src = readFileSync(join('core', f), 'utf-8');
      for (const tok of forbidden) {
        assert.ok(!src.includes(tok), `Forbidden token "${tok}" in core/${f}`);
      }
    }
  });

  it('enforces Cognitive Memory Hygiene ceilings (MEMORY.md <= 200 lines, WORKLOG.md <= 300 lines)', () => {
    if (existsSync('MEMORY.md')) {
      const memoryLines = readFileSync('MEMORY.md', 'utf-8').split(/\r?\n/);
      assert.ok(memoryLines.length <= 200, `MEMORY.md exceeds 200-line ceiling (${memoryLines.length})`);
    }
    if (existsSync('WORKLOG.md')) {
      const worklogLines = readFileSync('WORKLOG.md', 'utf-8').split(/\r?\n/);
      assert.ok(worklogLines.length <= 300, `WORKLOG.md exceeds 300-line ceiling (${worklogLines.length})`);
    }
  });
});
```

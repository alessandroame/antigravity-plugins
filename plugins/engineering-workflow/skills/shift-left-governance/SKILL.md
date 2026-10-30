---
name: shift-left-governance
description: >-
  Use this skill when configuring, implementing, or executing shift-left quality gates
  and automated architectural compliance tests before code delivery.
---

# Shift-Left Quality Gate & Governance Harness

Questa skill guida l'impostazione e l'esecuzione del protocollo **Shift-Left**: trasformare i requisiti di qualità, integrità dei test, conformità architetturale ed ergonomia da audit manuali tardivi a guardie eseguibili prima e durante lo sviluppo.

---

## 1. I 5 Gate di Verifica Sequenziale

Prima di dichiarare completato qualsiasi task o proporre modifiche per il commit:

```
[Gate 1: Pre-Design] -> [Gate 2: Headless Core] -> [Gate 3: Suite + Diff Triage] -> [Gate 4: UI Smoke/Probe] -> [Gate 5: Transcript-Verified Receipt]
```

### Gate 1: Conformità Pre-Design (Ex-Ante)
Verificare preliminarmente all'apertura del codice o markup:
1. **Occam's Razor**: nessun controllo o rotta duplicata rispetto alla barra di navigazione globale.
2. **Touch Ergonomics**: target >= 48 x 48 px per elementi interattivi touch.
3. **Anti-Naked Numbers**: nessuna grandezza numerica isolata priva di unità di misura, con `white-space: nowrap` sul gruppo `valore + unità`.
4. **Theme & Contrast**: supporto preventivo per contrasti elevati (WCAG 2.1 AA >= 4.5:1).

### Gate 2: Rigore di Implementazione In-Flight
Durante la scrittura del codice:
1. **Headless Core Purity**: moduli in `core/` o `src/core/` privi al 100% di riferimenti a `window`, `document`, `localStorage` globale o selettori CSS.
2. **Storage Decoupling**: persistenza tramite `storageAdapter` iniettabile (in-memory adapter predefinito per Node.js).
3. **Strict English**: identificatori, commenti, log di eccezione e test in lingua inglese esclusiva.
4. **Zero Icon Clutter**: nessuna emoji o icona decorativa non funzionale in intestazioni o controlli.

### Gate 3: Test Suite Auto-Discovered, Integrità Test & Triage `git diff`
1. Eseguire `npm test` assicurandosi che la discovery includa **tutti** i file `*.test.*` del repository.
2. Verificare che nessun test esistente sia stato addomesticato e filtrare i punti ad alto rischio con [`scripts/diff-triage.mjs`](../../scripts/diff-triage.mjs) (oppure invocando la skill `/review-diff` per patch multi-file):
```bash
node c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/diff-triage.mjs --repo "<workspace-root>"
```

### Gate 4: Collaudo Browser Multi-Viewport (`ui-smoke-runner.mjs` & `ui-geometry-probe.js`)
Per ogni modifica UI (`.html`, `.css`, `ui/`), è vietato chiudere il task con il solo `npm test` o con un giudizio "a occhio":
1. **Esecuzione Automatica Multi-Viewport (`360x800` Mobile, `800x480` Embedded/Raspberry, `1280x800` Desktop)**: se il progetto espone `.agents/smoke-flows.json` (inizializzabile con `--init`), eseguire il runner headless [`scripts/ui-smoke-runner.mjs`](../../scripts/ui-smoke-runner.mjs), oppure eseguire [`scripts/ui-geometry-probe.js`](./scripts/ui-geometry-probe.js) via browser MCP:
```bash
node c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/ui-smoke-runner.mjs --repo "<workspace-root>"
```
2. **Budget Schermo 60/40 e Gerarchia in 3 Secondi**: verificare `>= 60%` di altezza viewport libera per il canvas primario, max 4 card *above-the-fold* su mobile e `white-space: nowrap` sui gruppi `valore + unità`.
3. **Flusso Utente (`Prima -> Click/Input -> Dopo`)**: verificare almeno 1 interazione reale visibile senza scrollare e con `0` errori console.

### Gate 5: Certificazione sul Transcript (`Stop` Hook) e Ricevuta a 4 Misure
L'hook `Stop` [`scripts/delivery-gate-hook.mjs`](../../scripts/delivery-gate-hook.mjs) controlla automaticamente `transcript.jsonl` prima della consegna: se un `edit_file` su codice o UI è avvenuto **dopo** l'ultimo test o sonda browser, riapre il ciclo (`decision: "continue"`) imponendo la riesecuzione.
La risposta finale espone in chiaro (*0-Click*) max 3–5 bullet e in `<details>` (*1-Click*) la **Ricevuta a 4 Misure** (`0 modifiche` se già conforme):
1. **Budget Schermo**: `%` libera per il contenuto primario (`>= 60%`).
2. **Scala Tipografica & Unità**: `Dato primario px` vs `Etichetta px` e unità inseparabili (`nowrap`).
3. **Esito Sonda (`ui-geometry-probe.js`)**: `overflow: 0, coveredControls: 0, clippedText: 0, smallTargets: 0`.
4. **Flusso Interattivo (`Prima -> Dopo`)**: azione eseguita, riscontro visivo senza scroll e `consoleErrors: 0`.

---

## 2. Template per Test Suite di Governance

Per introdurre la governance automatizzata in un nuovo progetto, creare un file `tests/governance.test.mjs`:

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

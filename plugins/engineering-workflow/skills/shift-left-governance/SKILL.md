---
name: shift-left-governance
description: >-
  Use this skill when configuring, implementing, or executing shift-left quality gates
  and automated architectural compliance tests before code delivery.
---

# Shift-Left Quality Gate & Governance Harness

Questa skill guida l'impostazione e l'esecuzione del protocollo **Shift-Left**: trasformare i requisiti di qualità, conformità architetturale ed ergonomia da audit tardivi a verifiche generative obbligatorie prima e durante lo sviluppo.

---

## 1. I 5 Gate di Verifica Sequenziale

Prima di dichiarare completato qualsiasi task o proporre modifiche per il commit:

```
[Gate 1: Pre-Design] ➔ [Gate 2: In-Flight Core/UI] ➔ [Gate 3: Automated Suite] ➔ [Gate 4: Browser Probe] ➔ [Gate 5: 4-Measure Receipt]
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

### Gate 3: Test Suite di Governance Automatizzata (`npm test`)
Verificare che la suite esegua asserzioni statiche sul codice:
```javascript
const coreFiles = readdirSync('core').filter(f => f.endsWith('.js'));
for (const file of coreFiles) {
  const content = readFileSync(join('core', file), 'utf-8');
  assert.ok(!content.includes('document.'), `DOM leak in core/${file}`);
}
```

### Gate 4: Collaudo Browser, Sonda Geometrica e Flusso Interattivo Reale
Per ogni modifica UI (`.html`, `.css`, `ui/`), è vietato chiudere il task con il solo `npm test` o con un giudizio "a occhio" sullo screenshot:
1. **Doppio Viewport Reale (`360x800` Mobile & `1280x800` Desktop)**: avviare il browser ed eseguire [`scripts/ui-geometry-probe.js`](./scripts/ui-geometry-probe.js) via `evaluate_script` o Playwright (`pass: true`, `0` overflow orizzontali, `0` controlli coperti da overlay `elementFromPoint`, `0` testi tagliati, touch target `>= 44px`).
2. **Budget Schermo 60/40 e Gerarchia in 3 Secondi**: verificare che mappe/grafici primari abbiano `>= 60%` dell'altezza viewport libera a riposo, massimo 4 card *above-the-fold* su mobile e `white-space: nowrap` sui gruppi `valore + unità` (`24 km/h`).
3. **Flusso Utente (`Prima -> Click/Input -> Dopo`)**: eseguire almeno 1 interazione reale, verificando che l'effetto del click sia visibile subito senza scrollare e con `0` errori console.

### Gate 5: Briefing di Consegna e Ricevuta Oggettiva a 4 Misure
La risposta di consegna espone in chiaro (*0-Click*) max 3–5 bullet e in `<details>` (*1-Click*) la **Ricevuta a 4 Misure** (se tutte le misure sono già regolari al primo controllo, applicare **0 modifiche** per il Rasoio di Occam):
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
    const files = readdirSync('core').filter(f => f.endsWith('.js'));
    const forbidden = ['document.', 'window.', 'HTMLElement'];
    for (const f of files) {
      const src = readFileSync(join('core', f), 'utf-8');
      for (const tok of forbidden) {
        assert.ok(!src.includes(tok), `Forbidden token "${tok}" in core/${f}`);
      }
    }
  });

  it('prevents banned decorative emojis in UI views', () => {
    if (!existsSync('ui')) return;
    const banned = ['📈', '🎙️', '⏱️', 'ℹ️', '🚀', '✨', '🔥', '🎉'];
    const scanDir = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) scanDir(fullPath);
        else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
          const src = readFileSync(fullPath, 'utf-8');
          for (const emoji of banned) {
            assert.ok(!src.includes(emoji), `Banned emoji "${emoji}" in ${fullPath}`);
          }
        }
      }
    };
    scanDir('ui');
  });

  it('enforces Cognitive Memory Hygiene ceilings (MEMORY.md <= 200 lines, WORKLOG.md <= 300 lines)', () => {
    if (existsSync('MEMORY.md')) {
      const memoryLines = readFileSync('MEMORY.md', 'utf-8').split(/\r?\n/);
      assert.ok(memoryLines.length <= 200, `MEMORY.md exceeds 200-line ceiling (${memoryLines.length})`);
      const h2Count = memoryLines.filter(l => l.startsWith('## ')).length;
      assert.ok(h2Count <= 8, `MEMORY.md has ${h2Count} H2 sections (max 8 domain sections allowed)`);
    }
    if (existsSync('WORKLOG.md')) {
      const worklogLines = readFileSync('WORKLOG.md', 'utf-8').split(/\r?\n/);
      assert.ok(worklogLines.length <= 300, `WORKLOG.md exceeds 300-line rolling window ceiling (${worklogLines.length})`);
    }
  });
});
```

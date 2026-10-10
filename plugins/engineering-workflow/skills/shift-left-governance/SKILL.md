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
[Gate 1: Pre-Design] ➔ [Gate 2: In-Flight Core/UI] ➔ [Gate 3: Automated Suite] ➔ [Gate 4: Geometry] ➔ [Gate 5: Briefing]
```

### Gate 1: Conformità Pre-Design (Ex-Ante)
Verificare preliminarmente all'apertura del codice o markup:
1. **Occam's Razor**: nessun controllo o rotta duplicata rispetto alla barra di navigazione globale.
2. **Touch Ergonomics**: target $\ge 48 \times 48\text{ px}$ per elementi interattivi touch.
3. **Anti-Naked Numbers**: nessuna grandezza numerica isolata priva di unità di misura, etichetta o contesto semantico.
4. **Theme & Contrast**: supporto preventivo per contrasti elevati (WCAG 2.1 AA $\ge 4.5:1$).

### Gate 2: Rigore di Implementazione In-Flight
Durante la scrittura del codice:
1. **Headless Core Purity**: moduli in `core/` o `src/core/` privi al 100% di riferimenti a `window`, `document`, `localStorage` globale o selettori CSS.
2. **Storage Decoupling**: persistenza tramite `storageAdapter` iniettabile (in-memory adapter predefinito per Node.js).
3. **Strict English**: identificatori, commenti, log di eccezione e test in lingua inglese esclusiva.
4. **Zero Icon Clutter**: nessuna emoji o icona decorativa non funzionale in intestazioni o controlli.

### Gate 3: Test Suite di Governance Automatizzata (`npm test`)
Verificare che la suite esegua asserzioni statiche sul codice:
```javascript
// Esempio asserzione isolamento core
const coreFiles = readdirSync('core').filter(f => f.endsWith('.js'));
for (const file of coreFiles) {
  const content = readFileSync(join('core', file), 'utf-8');
  assert.ok(!content.includes('document.'), `DOM leak in core/${file}`);
}
```

### Gate 4: Ispezione Geometrica e Viewport
1. **Mobile Width Resilience**: visualizzazione fluida su schermi 360px–390px senza barre di scorrimento orizzontali parassite.
2. **Dynamic Viewport**: impiego di unità `100dvh` per prevenire il troncamento da barre di navigazione mobili.
3. **Flexbox Clipping Guard**: inclusione di `min-width: 0` e `flex-shrink: 0` su contenitori con testo a rischio overflow.

### Gate 5: Briefing di Consegna con Evidenza Pre-Flight
La risposta di consegna deve riepilogare sinteticamente l'esito dei 5 Gate, certificando l'assenza di regressioni.

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
});
```

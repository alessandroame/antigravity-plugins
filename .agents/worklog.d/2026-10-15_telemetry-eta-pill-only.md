# [2026-10-15] ADR: Ottimizzazione Ergonomica ETA In-Flight (Solo Pill `toolAction` Auto-Comprimibili, v1.2.0)

### Contesto & Motivazione
L'uso empirico del protocollo ETA a doppio canale (v1.1.0) ha evidenziato tre criticità di leggibilità nella colonna di chat di Antigravity:
1. Le righe `[ETA residuo: ...]` emesse nel testo della chat durante i turni intermedi diventano messaggi permanenti che non possono sparire a lavoro concluso e spezzano il raggruppamento nativo degli step (`Explored file >`, `Edited files >`).
2. Anteporre `[ETA residuo: ~18s (Fine stimata: HH:MM:SS) | Elapsed: Ns | ...]` costringeva a leggere metriche secondarie prima di comprendere l'azione in corso.
3. L'analisi di `step.content` in `eta-injector.mjs` e `collector.mjs` poteva intercettare falsi positivi qualora il testo della conversazione citasse stringhe di esempio contenenti `~Ns`.

### Decisioni Architetturali
1. **Abolizione del Canale Testuale in Chat (`rules/AGENTS.md`)**:
   - Vietata l'emissione di qualsiasi riga `[ETA: ...]`, `[ETA residuo: ...]` o consuntivo `[Completato in ...]` nel corpo dei messaggi di chat.
2. **Esclusività delle Pill Auto-Comprimibili (`toolAction` / `toolSummary`) con Formato `Fase X/Y: Descrizione · ~Ns`**:
   - La fase e la descrizione dell'azione sono posizionate all'inizio, seguite dal tempo residuo stimato (`· ~Ns`), senza orario né `Elapsed`.
   - Sfrutta il comportamento nativo di Antigravity: `toolAction` è visibile in chiaro sopra `Working` mentre lo step è in corso e si comprime automaticamente nella riga grigia non appena lo step termina, facendo sparire l'ETA a lavoro finito.
3. **Estrazione ETA Esclusiva da `step.tool_calls` (`eta-injector.mjs` e `collector.mjs`)**:
   - Rimossa la scansione di `step.content`; la regex `(?:·\s*(?:ETA\s*)?~?(\d+)s\b|\(\s*(?:ETA\s*)?~?(\d+)s\s*\)|\bETA:?\s*~?(\d+)s\b)` legge unicamente `toolAction` e `toolSummary`.

### Impatto e Verifiche
- Validazione `npm test` (`node scripts/validate.mjs --all`) e sincronizzazione globale `npm run sync` completate.

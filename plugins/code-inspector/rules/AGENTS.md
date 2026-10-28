# Protocollo di Ispezione del Codice e Verifica del Flusso Esecutivo (`/how-its-made`)

Definisce gli standard per la ricostruzione e verifica a livello di codice delle funzionalità software.

## 1. Modello IPO a 5 Livelli (Ingresso -> Guardie -> Processo -> Payload -> Uscita)
1. **Punto di Ingresso**: trigger esatto (UI, route, CLI, funzione) con link `[simbolo](file:///percorso/file.ext#L10-L25)` e contratto parametri/precondizioni.
2. **Guardie e Uscite Anticipate**: clausole `if (!valid) return`, eccezioni e fallback su cache.
3. **Processo (3–7 Step con Etichetta Semantica)**:
   - `[PURE]`: calcolo/trasformazione deterministica senza side-effect.
   - `[STATE]`: mutazione di stato in memoria, store reattivi o cache.
   - `[I/O]`: interazione esterna (rete, DB, disco, `localStorage`, DOM).
4. **Tracciamento del Payload**: evoluzione `Input Grezzo` -> `Dato Validato` -> `Output / Effetto Finale`.
5. **Punto di Uscita e Test Coverage**: valore restituito, side-effect e file di test (`[nome.test.js](file:///...)`).

## 2. Widget Interattivo (`<agent-embed>`) e Cassetti Codice (`<details>`)
1. **Artefatto HTML a 2 Tab (`role="tablist"`)**: generare `<artifact_dir>/flow-inspector-<slug>.html` (`UserFacing: true`) da `references/flow-widget-template.html` ed esporlo con `<agent-embed src="file:///<artifact_dir>/flow-inspector-<slug>.html"></agent-embed>`:
   - **Tab 1 — `Albero Testuale` (default)**: albero monospace verticale (`<= 65` char/riga) con `◇ BIVIO` e rami `├── [NO] ──►` / `└── [SÌ] ──►`.
   - **Tab 2 — `Grafico a Blocchi`**: card con variabili tema, bivi `grid-cols-2` e badge `[PURE]`/`[STATE]`/`[I/O]`, seguendo i vincoli di layout e theming della skill nativa `generative_ui`.
2. **Verifica Numeri di Riga ed Estratti Chirurgici**: eseguire sempre `read_file` prima di citare `#Lxx-Lyy`; estrarre solo le **10–35 righe** pertinenti dentro `<details>`, lasciando **una riga vuota obbligatoria** dopo `</summary>`.

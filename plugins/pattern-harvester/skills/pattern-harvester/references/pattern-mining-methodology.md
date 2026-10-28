# Metodologia di Mining Strutturale e Calcolo ROI KLM (`pattern-harvester`)

Questo documento descrive gli algoritmi deterministici implementati in `core/harvester-engine.mjs` per individuare pattern ricorrenti senza overfitting sugli esempi.

---

## 1. Pipeline di Estrazione a 3 Canali

### Canale A — Compressione RLE e N-Grammi di Sequenze Tool (`TOOL_CHAIN`)
1. Ogni tool call all'interno di un turno umano viene mappata su un token semantico canonico:
   - `READ:SKILL`, `READ:COGNITIVE`, `READ:FILE`
   - `EDIT:COGNITIVE`, `EDIT:FILE`, `WRITE:TEST`, `WRITE:SKILL`, `WRITE:FILE`
   - `EXEC:VALIDATE`, `EXEC:SYNC`, `EXEC:TEST`, `EXEC:GIT`, `EXEC:NODE`, `EXEC:CMD`
   - `ORCHESTRATE:SUBAGENT`, `SEARCH:QUERY`, `INTERACT:ASK`, `SCHEDULE:TASK`
2. Le ripetizioni contigue dello stesso token vengono compresse via **Run-Length Encoding (RLE)** (es. 4 letture file seguite da 2 modifiche e un test diventano `READ:FILE+ -> EDIT:FILE+ -> EXEC:TEST`).
3. Dalle sequenze compresse con almeno 3 step vengono estratti tutti i `3-grammi`, `4-grammi` e `5-grammi` contenenti almeno un'azione operativa (`EDIT`, `WRITE`, `EXEC`, `ORCHESTRATE`, `SCHEDULE`).

### Canale B — Normalizzazione Scheletri Comandi CLI (`CLI_SEQUENCE`)
Per ogni comando eseguito tramite `run_command`:
- Gli UUID vengono sostituiti con `<uuid>`.
- I percorsi che puntano a script (`.mjs`, `.js`, `.py`, `.ps1`, `.sh`) vengono ridotti a `<dir>/<basename>` preservando il nome dello script e i flag CLI.
- I restanti path assoluti vengono sostituiti con `<path>`, le stringhe quotate con `"<str>"` e i numeri con `<num>`.
- I comandi atomici standard (`git status`, `git diff`, `npm test` isolato) vengono ignorati tramite `TRIVIAL_SINGLE_COMMANDS`.

### Canale C — Clustering Lessicale per Shingle Jaccard (`INTERACTION_ARCHETYPE`)
1. I prompt utente vengono ripuliti da tag XML, blocchi di codice, URL, path e stopword IT/EN.
2. Vengono estratti i token significativi (`>= 3` caratteri) e i **2-shingle** di parole adiacenti.
3. I turni vengono raggruppati con clustering greedy quando l'indice di similarità di Jaccard tra gli insiemi `{tokens U shingles}` è `>= 0.35`.

---

## 2. Modello KLM/GOMS per la Stima del Risparmio Netto (`classifyAndScoreCandidate`)

Per evitare la proliferazione di micro-skill che costano più tempo di manutenzione che beneficio reale:

- **Costo di Setup Una Tantum (`T_setup`)**: `40 secondi` (lettura proposta, conferma utente, generazione file e validazione).
- **Risparmio per Singola Esecuzione (`savedSecondsPerRun`)**:
  `18s` (digitazione prompt e inquadramento contesto risparmiati) + `11s x avgStepsPerRun` (passaggi manuali di orchestrazione tool/CLI risparmiati).
- **Proiezione su 15 Sessioni (`expectedRunsPer15Sessions`)**:
  `max(occurrences, round(distinctSessions x 1.5))`.
- **Risparmio Netto (`netSavedSeconds15Sessions`)**:
  `(savedSecondsPerRun x expectedRunsPer15Sessions) - 40s`.

Un pattern viene promosso a **`NEW_SKILL`** solo se `occurrences >= 3`, `distinctSessions >= 2` e `netSavedSeconds15Sessions >= 120s` (almeno `3x` il costo di setup). Per **`NEW_PLUGIN`** sono richiesti `occurrences >= 4`, `distinctSessions >= 3`, `netSavedSeconds15Sessions >= 240s` e la necessità di componenti multipli (hook/stato/subagent).

# [2026-10-16] ADR: Visibilità Persistente dell'ETA sui Checkpoint (`toolAction` + `toolSummary`), Soglia Max 2° Turno e Fix Finalizzazione `Stop` Hook

## Contesto & Motivazione
L'analisi dei log reali (`transcript.jsonl` delle sessioni GlideMind `00cebad8` e `28af2dc6`) a fronte della segnalazione dell'utente (*"non vedo mai comparire l'output dell'ETA"*) ha evidenziato tre cause tecniche:
1. **Scomparsa immediata di `toolAction` (< 1s)**: Nella UI di Antigravity, `toolAction` viene mostrato solo durante i millisecondi di esecuzione del tool (`0.2s–0.8s` per `view_file` o `replace_file_content`) e viene subito sostituito da `toolSummary`. Vietando l'ETA in `toolSummary`, le stime emesse dall'agente (es. `ETA tot ~35s` e `ETA tot ~40s` in `00cebad8`) scomparivano dallo schermo in meno di un secondo.
2. **Collasso di `Explored N files >` e Ricognizione Prolungata**: I tool `view_file` consecutivi vengono raggruppati e chiusi dentro `Explored N files >`, mentre durante sessioni di debug CSS (`28af2dc6`, 14+ turni di lettura) l'assenza di un tetto massimo di turni esplorativi posticipava indefinitamente la prima stima.
3. **Salto di `etaOutcome` su `Stop` (`newSteps.length === 0`) e Reset su Messaggi in Coda**: `PostInvocation` consuma gli step prima che scatti l'hook `Stop` (`--finalize`), per cui su `Stop` `newSteps.length` è `0` e `collector.mjs` saltava il salvataggio di `etaTrackedTasks`; inoltre, l'`unlinkSync(cursorFile)` su `Stop` forzava la ri-lettura dell'intero transcript al prompt successivo.

## Decisioni Architetturali
1. **Accoppiamento `toolAction` + `toolSummary` sui soli Checkpoint e Primo Tool Operativo (`rules/AGENTS.md`)**:
   - Obbligo di emettere la prima stima dell'intera lavorazione (`· ETA tot ~Ns`) **entro e non oltre il 2° turno di chiamate tool** (se il lavoro residuo è $\ge 15\text{s}$).
   - Inserimento di `· ETA tot ~Ns` sia in `toolAction` sia in `toolSummary` del singolo tool di svolta (ultimo tool nei batch `view_file`) e sul **primo tool operativo top-level** (`replace_file_content`, `write_to_file`, `run_command`), che resta sempre visibile in primo piano fuori dal cassetto `Explored N files >`.
   - Tutti gli altri tool restano privi di ETA finché la stima non varia di $\ge 15\text{s}$ o $\ge 30\%$.
2. **Fix Finalizzazione `Stop` e Conservazione `lastIndex` (`collector.mjs` & `eta-injector.mjs`)**:
   - Gestione esplicita di `else if (isFinalize)` in `collector.mjs` per registrare `etaOutcome` in `metrics-summary.json` anche quando `PostInvocation` ha già avanzato `lastIndex`.
   - Conservazione di `lastIndex` in `.cursor_<conversationId>.json` a fine task (azzerando solo i campi ETA di turno) ed esclusione dei messaggi utente accodati in-flight dal reset di `workStartMs`.

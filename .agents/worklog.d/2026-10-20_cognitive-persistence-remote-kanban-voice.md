# [2026-10-20] ADR: Kanban Remoto Universale, Coda Parallela Anti-Conflitto e Cattura Vocale in `cognitive-persistence` v1.5.0

## Contesto & Motivazione
L'utente necessitava di un gestore di attività software accessibile da remoto (smartphone / voce mentre è fuori sede) basato su Git, utilizzabile in qualsiasi progetto software senza mantenere server custom e capace di gestire lo scodamento parallelo dei task proteggendosi da conflitti sui file e senza introdurre nuovi comandi da imparare oltre a `/take-note`, `/review-notes`, `/next-step` e `/memory-sync`.

## Decisioni Architetturali
1. **Unificazione nei 4 Comandi Esistenti di `cognitive-persistence` (v1.5.0)**:
   - `/take-note`: cattura locale istantanea (`0ms` rete per evitare rumore su GitHub, push opzionale con `--remote`).
   - `/review-notes`: importa le idee create da smartphone/voce (`status:inbox`) rispettando il tetto di `115/120` righe di `NOTES.md` (`planSafeInboxImport`), analizza il codice reale e salva i `@file` verificati nel file sidecar `.agents/board-state.json` (così la cella `Note` di `DESIDERATA.md` resta sempre `<= 160` caratteri).
   - `/next-step`: sblocca i lock orfani oltre `45m` (`reclaimStaleLocks`), importa le schede in `Fai Ora` (`status:ready` o prefisso rapido `! modulo: titolo`) verificate con `verifyTrustedTaskOrigin` (`[P0-SEC]`), e calcola l'onda di esecuzione tramite `planExecutionWave` (avviando fino a 2 task disgiunti in Git Worktree isolati con collegamento istantaneo `< 20ms` di `node_modules`/`.venv` via `linkWorktreeDependencies`, e auto-serializzando i task in conflitto).
   - `/memory-sync`: verifica l'isolamento `git diff` del Worktree (`verifyWorktreeDiffIsolation` `[P0-ISO]`), consolida `DESIDERATA.md` e `WORKLOG.md` sul branch principale e chiude la scheda remota.
2. **Portabilità Universale Multi-Progetto (`[P0-PORT]`)**:
   - `resolveScopeToPaths` e `detectProjectTestCommand` scoprono dinamicamente le cartelle reali (`src/`, `src/features/`, `app/`, `packages/`, `services/`, `crates/`) e il test runner (`npm`, `pnpm`, `yarn`, `pytest`, `cargo`, `go`, `dotnet`) di qualunque repository ospite.
3. **Kit di Cattura Vocale Guidata (`references/voice-intake-kit.md`)**:
   - Supporta sia l'app Gemini Mobile (`Custom Gem` + `Gemini Live` con riquadro **Copia 1-Tap**, aggirando il bug dell'app GitHub Mobile che svuota i query param `?title=` e `?body=`) sia Google AI Studio (`Function Calling` 0-Click `submit_kanban_note` con Fine-Grained PAT `Issues: write`).

## Impatto e Conseguenze
- Implementati [`board-engine.mjs`](file:///c:/github/antigravity-plugins/plugins/cognitive-persistence/scripts/board-engine.mjs), [`gh-board-sync.mjs`](file:///c:/github/antigravity-plugins/plugins/cognitive-persistence/scripts/gh-board-sync.mjs), [`voice-intake-kit.md`](file:///c:/github/antigravity-plugins/plugins/cognitive-persistence/references/voice-intake-kit.md) e la suite [`tests/board-engine.test.mjs`](file:///c:/github/antigravity-plugins/tests/board-engine.test.mjs) (`15/15 test PASS` in `32ms`).
- Validazione globale `npm test` superata (`13/13 plugin OK`, `0 errori`, `0 avvisi`).

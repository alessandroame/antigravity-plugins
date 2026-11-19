# [2026-11-19] ADR: Valutazione Playbook AI-Native SDLC e Piano dei Tre Innesti Chirurgici (`sdlc-three-grafts`)

## Contesto & Motivazione
Valutata l'opportunità di adottare *The AI-Native SDLC Playbook* (Anthropic, Agosto 2026) rispetto all'architettura esistente di `antigravity-plugins`. Il catalogo copre già circa l'`80%` delle pratiche raccomandate (`MEMORY.md` + `GEMINI.md` con tetto `48 KB`, skill `SKILL.md` versionate, hook deterministici `delivery-gate-hook.mjs`, worktree isolati e subagenti `skizzo`) ed è più avanzato sul controllo dei costi in token (`telemetry-analytics`, `adaptive-router`) e sull'auto-apprendimento empirico (`pattern-harvester`, `mapek`). Adottare l'intera catena documentale aziendale (`intent.md -> spec.md -> plan.md -> REVIEW.md`) introdurrebbe burocrazia superflua per un operatore singolo.

## Decisioni Architetturali
1. **Scarto della sovrastruttura multi-ruolo** (`intent.md`, `spec.md`, pipeline cieche ad ogni merge) a favore del flusso leggero esistente (`NOTES.md` -> `DESIDERATA.md` -> `.agents/plans/*.md`).
2. **Pianificazione di 3 innesti chirurgici a `0` byte inline aggiuntivi** in [`.agents/plans/sdlc-three-grafts.md`](../plans/sdlc-three-grafts.md):
   - **Fase 1 (`engineering-workflow` `v1.4.0`)**: verifica deterministica di deriva `Piano <-> Diff` (`diff-triage.mjs --plan <file>`) per intercettare file dimenticati o modifiche fuori perimetro.
   - **Fase 2 (`skill-governance` `v1.1.0`)**: test di regressione automatica dell'attivazione delle skill (`skill-trigger-eval.mjs` su ranking deterministico `BM25`) per prevenire skill mute dopo refactoring delle `description`.
   - **Fase 3 (`execution-guard` `v1.1.0` + `cognitive-persistence` `v1.7.0`)**: motore deterministico a bande di controllo `1σ / 2σ / 3σ` (`metric-band-guard.mjs`) con `0` token a riposo, pacchetto diagnostico read-only a `2σ` e creazione task deduplicato su `gh-board-sync.mjs` a `3σ`.

## Impatto e Conseguenze
- Creato il piano esecutivo [`.agents/plans/sdlc-three-grafts.md`](../plans/sdlc-three-grafts.md) e aggiunte le 3 voci pianificate in [`DESIDERATA.md`](../../DESIDERATA.md).
- Validazione `node scripts/validate.mjs --all` superata (`16/16` plugin conformi, `0` errori, `0` avvisi, budget inline invariato a `34,7 KB`).

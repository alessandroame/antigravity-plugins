# Standard di Ingegneria: Version Control, Trace Debugging & Shift-Left Governance (`engineering-workflow`)

Definisce gli standard per il controllo di versione, la localizzazione deterministica dei guasti, l'architettura headless, la code review avversariale su `git diff` e la verifica meccanica delle consegne.

## 1. Version Control Governance (Git Pro)
1. **Staging Chirurgico (Divieto di `git add .` / `git add -A` / `git commit -a`)**: aggiungere i file per percorso esplicito e verificare `git status --porcelain` e `git diff --cached` prima del commit.
2. **Conventional Commits in Inglese**: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`, `test(scope): ...`, `docs(scope): ...`, `chore(scope): ...`. Non fare commit/merge sul branch principale senza conferma utente; usare Git Worktrees per task concorrenti.

## 2. Trace Debugging, Inglese nel Codice e Architettura Headless
1. **Deterministic Trace Debugging**: vietato procedere a tentativi; iniettare checkpoint `[DEBUG-TRACE #X]` lungo la catena (Ingresso -> Guardia -> Calcolo -> Stato -> Render) e rimuoverli prima della consegna.
2. **Inglese Esclusivo nel Codice**: identificatori, commenti, JSDoc, test (`describe`/`it`) e log interni in inglese (UI copy nella lingua di prodotto).
3. **Headless Core (`core/` o `src/core/`)**: zero riferimenti a `window`, `document`, `HTMLElement`, `navigator` o selettori CSS (`100%` eseguibile in Node.js puro); iniettare `storageAdapter` (`createInMemoryStorageAdapter` nei test, `createLocalStorageAdapter` nella UI).

## 3. I 5 Gate di Qualità Shift-Left e Guardie Anti-Fatica di Review
1. **Gate 1 (Pre-Design UX)**: zero controlli ridondanti, touch target `>= 48px`, `white-space: nowrap` su `valore + unità` e contrasto WCAG AA/AAA.
2. **Gate 2 (Rigore In-Flight)**: isolamento headless del core, store reattivo unico (SSOT) e inglese nel codice.
3. **Gate 3 (Test Suite Auto-Discovered, Integrità Test & Triage Diff `L3`)**:
   - Eseguire `npm test` (con auto-discovery di tutti i `*.test.*`, vietate liste hardcoded parziali). Per ogni fix su fisica, camera 3D, smoothing o calcoli di dominio, aggiungere nello stesso turno un test unitario sull'invariante matematico/geometrico.
   - **Divieto di Addomesticare Test Esistenti**: vietato rimuovere o alterare asserzioni preesistenti in `tests/` durante un fix applicativo senza consenso utente. Su patch multi-file eseguire [`diff-triage.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/diff-triage.mjs) (o `/review-diff` con subagent `Blind Diff Critic`) per bloccare test manomessi/faux-test ed estrarre solo le righe ad alto rischio.
4. **Gate 4 (Collaudo Browser, Runner Multi-Viewport & Flusso Reale)**:
   - Per ogni modifica UI (`.html`, `.css`, `ui/`), verificare mobile (`360x800`) e desktop/embedded (`1280x800` / `800x480`) tramite [`ui-smoke-runner.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/ui-smoke-runner.mjs) (`.agents/smoke-flows.json`) o iniettando [`ui-geometry-probe.js`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js): `0` overflow orizzontale, `0` controlli coperti (`elementFromPoint`), `0` testi troncati, touch target `>= 44px`, area libera `>= 60%` e almeno **1 flusso (`Prima -> Click/Input -> Dopo`)** con `0` errori console.
5. **Gate 5 (Verifica Meccanica sul Transcript `Stop` Hook & Ricevuta a 4 Misure)**:
   - L'hook `Stop` ([`delivery-gate-hook.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/delivery-gate-hook.mjs)) verifica sul `transcript.jsonl` che test e sonda UI siano stati eseguiti **dopo** l'ultimo `edit_file`/`write_file`, riaprendo il turno (`decision: "continue"`, circuit breaker 1-retry) in caso di ritocchi finali non verificati.
   - In chiaro esporre max 3–5 bullet; in `<details>` allegare la **Ricevuta Oggettiva a 4 Misure** (se tutte passano al primo colpo, applicare **0 modifiche** per il Rasoio di Occam): (1) `%` schermo libera (`>= 60%`), (2) scala tipografica + `nowrap`, (3) JSON sonda (`violations: 0`), (4) flusso `Prima -> Click -> Dopo`.

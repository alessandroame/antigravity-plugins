# Standard di Ingegneria: Version Control, Trace Debugging & Shift-Left Governance (`engineering-workflow`)

Definisce gli standard per il controllo di versione, la localizzazione deterministica dei guasti, l'architettura headless e il collaudo geometrico nel browser.

## 1. Version Control Governance (Git Pro)
1. **Staging Chirurgico (Divieto di `git add .` / `git add -A` / `git commit -a`)**: aggiungere i file per percorso esplicito e verificare `git status --porcelain` e `git diff --cached` prima del commit.
2. **Conventional Commits in Inglese**: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`, `test(scope): ...`, `docs(scope): ...`, `chore(scope): ...`. Non fare commit/merge sul branch principale senza conferma utente; usare Git Worktrees per task concorrenti.

## 2. Trace Debugging, Inglese nel Codice e Architettura Headless
1. **Deterministic Trace Debugging**: vietato procedere a tentativi; iniettare checkpoint `[DEBUG-TRACE #X]` lungo la catena (Ingresso -> Guardia -> Calcolo -> Stato -> Render) e rimuoverli prima della consegna.
2. **Inglese Esclusivo nel Codice**: identificatori, commenti, JSDoc, test (`describe`/`it`) e log interni in inglese (UI copy nella lingua di prodotto).
3. **Headless Core (`core/` o `src/core/`)**: zero riferimenti a `window`, `document`, `HTMLElement`, `navigator` o selettori CSS (`100%` eseguibile in Node.js puro); iniettare `storageAdapter` (`createInMemoryStorageAdapter` nei test, `createLocalStorageAdapter` nella UI).

## 3. I 5 Gate di Qualità Shift-Left
1. **Gate 1 (Pre-Design UX)**: zero controlli ridondanti, touch target `>= 48px`, `white-space: nowrap` su `valore + unità` e contrasto WCAG AA/AAA.
2. **Gate 2 (Rigore In-Flight)**: isolamento headless del core, store reattivo unico (SSOT) e inglese nel codice.
3. **Gate 3 (Test Suite & Invariante Numerico `L3`)**: eseguire `npm test`; per ogni fix su fisica, camera 3D, smoothing o calcoli di dominio, aggiungere nello stesso turno un test unitario che verifichi l'invariante matematico/geometrico (frustum, distanza camera, continuità derivata, rollio/beccheggio `!= 0`).
4. **Gate 4 (Collaudo Browser, Sonda Geometrica & Flusso Reale)**:
   - Per ogni modifica UI (`.html`, `.css`, `ui/`), aprire il browser reale su mobile (`360x800`) e desktop (`1280x800`).
   - Eseguire [`ui-geometry-probe.js`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js): `0` overflow orizzontale, `0` controlli coperti (`elementFromPoint`), `0` testi troncati (`scrollWidth > clientWidth`), touch target `>= 44px` e area libera mappa/canvas `>= 60%`.
   - Eseguire almeno **1 flusso interattivo (`Prima -> Click/Input -> Dopo`)** visibile senza scrollare e con `0` errori console.
5. **Gate 5 (Consegna 1-Click & Ricevuta a 4 Misure)**: in chiaro max 3–5 bullet; in `<details>` allegare la **Ricevuta Oggettiva a 4 Misure** (se tutte passano al primo colpo, applicare **0 modifiche** per il Rasoio di Occam): (1) `%` schermo libera (`>= 60%`), (2) scala tipografica (`Primario px` vs `Etichetta px`) + `nowrap`, (3) JSON sonda (`violations: 0`), (4) flusso `Prima -> Click -> Dopo`.

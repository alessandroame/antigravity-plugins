# Standard di Ingegneria: Version Control, Trace Debugging & Shift-Left Governance

Questo documento definisce gli standard per il controllo di versione, la localizzazione deterministica dei guasti e l'architettura headless.

---

## 1. Version Control Governance (Git Pro)

1. **Staging Chirurgico Obbligatorio (Divieto di `git add .` / `git add -A` / `git commit -a`)**:
   - Aggiungere i file singolarmente per percorso esplicito (`git add src/core/engine.js tests/engine.test.js`).
   - Verificare sempre `git status --porcelain` e `git diff --cached` prima del commit per escludere file temporanei o di scratch.
2. **Conventional Commits in Lingua Inglese**:
   - Formato obbligatorio: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`, `test(scope): ...`, `docs(scope): ...`, `chore(scope): ...`.
3. **Controllo Esplicito su Commit, Merge e Worktrees**:
   - Non eseguire commit o merge sul branch principale senza conferma dell'utente. Per task concorrenti, isolare il lavoro tramite Git Worktrees (`git worktree add ../<repo>-<topic> -b feature/<topic>`).

---

## 2. Deterministic Trace-Based Fault Localization

1. **Divieto di Debugging a Tentativi**: vietato modificare il codice procedendo a congetture non verificate.
2. **Iniezione Log Strutturati (`[DEBUG-TRACE #X]`)**: iniettare checkpoint numerati lungo la catena (Ingresso -> Guardia -> Calcolo -> Stato -> Render) per isolare il *Last Known Good Checkpoint*.
3. **Pulizia Obbligatoria (Trace Cleanup)**: rimuovere tutti i log `[DEBUG-TRACE]` prima della consegna o del commit.

---

## 3. Lingua Inglese Esclusiva nel Codice Sorgente

1. **Inglese Esclusivo nel Codice**: identificatori, file, commenti, JSDoc, descrizioni dei test (`describe`/`it`), asserzioni, eccezioni e log interni devono essere redatti esclusivamente in inglese.
2. **Distinzione UI Copy vs Conversazione**: le stringhe utente nell'interfaccia seguono la lingua di prodotto (es. italiano con chiavi i18n in inglese); la chat con l'utente segue la lingua dell'utente.

---

## 4. Architettura Headless Core e Disaccoppiamento DOM/Storage

1. **Headless Core (`core/` o `src/core/`)**: zero riferimenti a `window`, `document`, `HTMLElement`, `navigator` o selettori CSS. Tutti i moduli core devono essere eseguibili al 100% in Node.js puro senza JSDOM.
2. **Injectable Storage Adapter Pattern**: vietato accedere direttamente a `localStorage` o `IndexedDB` nel core; iniettare `storageAdapter` (`createInMemoryStorageAdapter` per Node.js/test, `createLocalStorageAdapter` nella shell UI).

---

## 5. I 5 Gate di Qualità Shift-Left

1. **Gate 1 (Pre-Design UX & Dominio)**: zero controlli ridondanti, touch target >= 48px, zero numeri isolati privi di unità (`white-space: nowrap` su `valore + unità`) e contrasto WCAG AA/AAA.
2. **Gate 2 (Rigore In-Flight)**: isolamento headless del core, store reattivo unico (SSOT) e inglese esclusivo nel codice.
3. **Gate 3 (Test Suite di Governance)**: eseguire test statici automatici (`npm test`) per validare assenza di DOM nel core, assenza di token vietati e integrità CSS.
4. **Gate 4 (Collaudo Browser, Sonda Geometrica & Flusso Reale)**:
   - Per ogni modifica UI (`.html`, `.css`, `ui/`), aprire il browser reale su mobile (`360x800`) e desktop (`1280x800`).
   - Eseguire la sonda [`ui-geometry-probe.js`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js): `0` overflow orizzontale, `0` controlli coperti da overlay (`elementFromPoint`), `0` testi troncati (`scrollWidth > clientWidth`), touch target `>= 44px` e area libera mappa/canvas `>= 60%`.
   - Eseguire almeno **1 flusso interattivo (`Prima -> Click/Input -> Dopo`)**, verificando che il cambio di stato sia visibile senza scrollare e con `0` errori in console.
5. **Gate 5 (Briefing di Consegna a 1-Click & Ricevuta a 4 Misure)**:
   - In chiaro (*0-Click*) max 3–5 bullet di 1 riga ed esito dei test; in `<details>` (*1-Click*) allegare la **Ricevuta Oggettiva a 4 Misure** (se tutte passano al primo colpo, applicare **0 modifiche** per il Rasoio di Occam): (1) `%` schermo libera per mappa/contenuto primario (`>= 60%`), (2) scala tipografica (`Dato primario px` vs `Etichetta px`) e unità inseparabili, (3) JSON della sonda geometrica (`violations: 0`), (4) esito del flusso `Prima -> Click -> Dopo`.

---

## 6. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"La modifica è di poche righe, non rieseguo i test."* | Eseguire sempre la test suite e riportare l'esito reale prima di chiudere il task. |
| *"I test Node.js (`npm test`) passano, consegno la UI senza aprire il browser."* | Node.js non esegue il layout CSS; ogni modifica UI richiede il Gate 4 nel browser reale. |
| *"Ho guardato lo screenshot e a occhio sembra tutto ok."* | Vietato il giudizio visivo generico: riportare la Ricevuta a 4 Misure e l'output di `ui-geometry-probe.js` (0 modifiche se già conforme). |
| *"Applico subito un fix probabile senza trace."* | Se la causa non è certa staticamente, usare `[DEBUG-TRACE #X]` per isolare il guasto. |
| *"Uso `git add .` per comodità."* | Vietato lo staging massivo: usare `git status --porcelain` e aggiungere file per percorso. |
| *"Lascio questo calcolo matematico nella vista UI."* | La logica di dominio appartiene al core headless testabile in Node.js puro. |

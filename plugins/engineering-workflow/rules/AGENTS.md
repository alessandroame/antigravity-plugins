# Standard di Ingegneria: Version Control Governance e Deterministic Trace Debugging

Questo documento definisce gli standard operativi per la gestione del codice sorgente, l'isolamento dei task e il protocollo di risoluzione dei difetti.

---

## 1. Version Control Governance (Git Pro)

1. **Staging Chirurgico Obbligatorio (Divieto di `git add .` o `git add -A`)**:
   - È tassativamente vietato eseguire comandi di aggiunta massiva non controllata (`git add .`, `git add -A`, `git commit -a`).
   - I file devono essere aggiunti singolarmente e selettivamente per percorso relativo:
     ```bash
     git add src/core/engine.js tests/engine.test.js
     ```
   - Eseguire sempre `git status --porcelain` e `git diff --cached` prima di impegnare qualsiasi commit per verificare l'assenza di file temporanei, dump o file di scratch.
2. **Conventional Commits in Lingua Inglese**:
   - I messaggi di commit devono seguire rigorosamente la specifica Conventional Commits in lingua inglese:
     - `feat(scope): concise description of new feature`
     - `fix(scope): concise description of bug fix`
     - `refactor(scope): internal architectural refactor without behavior changes`
     - `test(scope): addition or update of automated test suites`
     - `docs(scope): documentation, ADRs, or rule updates`
     - `chore(scope): build, dependencies, or tooling adjustments`
3. **Divieto di Commit, Merge o Push Autonomo su `main`**:
   - L'agente non deve **MAI** eseguire commit o merge sul branch principale senza l'esplicita conferma dell'utente.
   - Il ciclo di vita prevede:
     1. Sviluppo e verifica completa nel branch/worktree isolato.
     2. Presentazione all'utente del resoconto delle modifiche e delle istruzioni di test.
     3. Attesa del riscontro positivo dell'utente.
     4. Solo su conferma esplicita, esecuzione di staging, commit e merge.
4. **Isolamento Concorrente tramite Git Worktrees**:
   - Quando si opera su task complessi o in ambienti multi-sessione, non cambiare branch nel workspace primario.
   - Creare e utilizzare un Git Worktree dedicato (`git worktree add ../<repo>-<topic> -b feature/<topic>`).

---

## 2. Deterministic Trace-Based Fault Localization

Quando si riscontra un'anomalia di comportamento, un fallimento di test o un errore silente:

1. **Divieto di Debugging a Tentativi**:
   - È vietato modificare codice procedendo a congetture non dimostrate o applicando workaround superficiali.
2. **Iniezione Log Strutturati (`[DEBUG-TRACE #X]`)**:
   - Iniettare checkpoint numerati lungo la catena di esecuzione (Punto di ingresso evento $\to$ Precondizioni $\to$ Calcolo $\to$ Mutazione di stato $\to$ Render/Output).
3. **Isolamento della Finestra di Guasto**:
   - Eseguire il test per catturare la sequenza dei log.
   - Identificare l'ultimo checkpoint valido (*Last Known Good Checkpoint*). La causa radice si trova tassativamente tra l'ultimo checkpoint corretto e il primo assente o corrotto.
4. **Pulizia Obbligatoria (Trace Cleanup)**:
   - Prima di completare il task o proporre il commit, rimuovere completamente tutti i log temporanei `[DEBUG-TRACE]`. Il codice consegnato deve risultare pulito da tracce diagnostiche.

---

## 3. Standard di Codifica: Lingua Inglese Esclusiva nel Codice Sorgente

1. **Inglese Esclusivo nel Codice**:
   - Qualsiasi artefatto di codice sorgente deve essere redatto esclusivamente in lingua inglese:
     - **Identificatori**: nomi di variabili, costanti, funzioni, classi, metodi, proprietà, tipi, interfacce, file sorgente e directory di codice.
     - **Commenti e Annotazioni**: commenti inline (`//`), blocchi di commento (`/* */`), annotazioni TODO/FIXME, docstring e documentazione API (JSDoc, TSDoc, Docblocks).
     - **Test Automatizzati**: denominazioni e descrizioni delle suite (`describe`), dei casi di test (`it`, `test`), messaggi di asserzione, fixture e mock.
     - **Log Interni ed Eccezioni**: messaggi delle eccezioni (`throw new Error(...)`), log diagnostici (`console.error`, `console.warn`, `console.info`) e codici/chiavi di stato interni.
2. **Distinzione con Testi Utente (UI Copy & Localizzazione)**:
   - Le stringhe visibili all'utente finale nell'interfaccia (etichette pulsanti, messaggi UI, file di localizzazione/dizionari i18n) seguono la lingua target richiesta dalle specifiche di prodotto (es. italiano per GlideMind).
   - I commenti a corredo e le chiavi del dizionario i18n rimangono in lingua inglese (es. `t('flightSummary.title')`).
3. **Conversazione Agente-Utente**:
   - L'agente risponde nella lingua utilizzata dall'utente nella chat (es. italiano per dialoghi e spiegazioni), ma il codice prodotto o modificato durante il turno deve rispettare rigidamente la regola dell'inglese esclusivo.

---

## 4. Architettura Headless Core e Disaccoppiamento DOM/Storage

1. **Purezza del Dominio Computazionale (Headless Core)**:
   - I moduli che implementano logica di business, algoritmi matematici, parsing dati, validatori e wrapper API (`core/` o `src/core/`) devono essere rigorosamente **headless**:
     - Vietato qualsiasi riferimento diretto a oggetti del browser: `window`, `document`, `HTMLElement`, `navigator` o selettori CSS.
     - Devono risultare eseguibili e testabili al 100% in Node.js puro senza ricorrere a JSDOM o ambienti simulati.
2. **Injectable Storage Adapter Pattern**:
   - I moduli di stato o persistenza non devono accedere direttamente a `localStorage`, `sessionStorage` o `IndexedDB`.
   - Utilizzare il pattern dell'adapter iniettabile (`storageAdapter`), fornendo:
     - Un adapter predefinito in memoria (`createInMemoryStorageAdapter`) per esecuzione e test Node.js.
     - Un adapter browser (`createLocalStorageAdapter` o `createIndexedDBAdapter`) montato esclusivamente nella shell UI.

---

## 5. Protocollo di Qualità Shift-Left & Pre-Delivery Gates

1. **Principio Generativo Ex-Ante**:
   - I vincoli di qualità, ergonomia, accessibilità e conformità architetturale non devono essere rimandati ad audit tardivi o verifiche ex-post, ma fungere da **pre-condizioni vincolanti prima e durante la stesura del codice**.
2. **I 5 Gate di Qualità Shift-Left**:
   - **Gate 1 (Pre-Design UX & Dominio)**: validare preventivamente l'assenza di controlli ridondanti (Occam's razor), dimensioni minime dei touch target ($\ge 48\text{px}$), progressive disclosure (niente numeri isolati privi di unità/contesto) e palette ad alto contrasto.
   - **Gate 2 (Rigore di Implementazione In-Flight)**: verificare l'isolamento headless del core, l'unicità della sorgente di verità reattiva (SSOT) e la lingua inglese esclusiva nel codice.
   - **Gate 3 (Test Suite di Governance Automatizzata)**: incorporare test statici automatici (`npm test`) che scansionano i file sorgente verificando l'assenza di DOM nel core, l'assenza di token vietati, la conformità delle variabili CSS e l'integrità dei fallback.
   - **Gate 4 (Ispezione Geometrica & Visiva)**: verificare su viewport mobile ristretti (360px–390px) l'assenza di overflow orizzontale e troncamento flexbox (`min-width: 0`, `flex-shrink: 0`).
   - **Gate 5 (Briefing di Consegna con Evidenza Pre-Flight)**: certificare esplicitamente nella risposta all'utente il superamento dei gate prima di richiedere la conferma di commit o rilascio.


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

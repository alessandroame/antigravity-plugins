# Disciplina di Continuità Cognitiva e Memoria di Progetto

Questo documento prescrive la persistenza strutturata delle osservazioni in corso d'opera, delle decisioni architetturali, dei vincoli appresi e dello stato evolutivo del software per garantire continuità tra sessioni e chat indipendenti.

---

## 1. L'Architettura Cognitiva di Progetto (3+1 File Canonici)

Ogni progetto governato da questo plugin adotta tre file canonici per la conservazione della memoria più un buffer di staging pre-desiderata:

1. **`NOTES.md` (Buffer di Cattura In-Flight & Staging Pre-Desiderata)**:
   - Raccoglie osservazioni grezze, dubbi di UX, idee o anomalie notate dall'utente mentre usa l'applicazione o mentre è in corso un'altra lavorazione (`🟡 In Lavorazione`).
   - Separa il momento della cattura istantanea (`/take-note`) dal momento dell'analisi tecnica approfondita (`/review-notes`), evitando che un'analisi prematura su codice in mutazione inquini il contesto attivo.
2. **`MEMORY.md` (Vincoli Stabili & Lezioni Apprese — Max 200 Righe)**:
   - Registra esclusivamente invarianti architetturali e "lezioni apprese a caro prezzo" non ovvie (incompatibilità di librerie, insidie di rendering mobile, race condition, antipattern banditi). La cronologia degli interventi appartiene a `WORKLOG.md`, mai a `MEMORY.md`.
   - **Governance Anti-Bloat (Tetto Massimo 200 Righe & Partizionamento per Dominio)**:
     - `MEMORY.md` deve rimanere $\le 200\text{ righe}$ per preservare l'attenzione del modello (*context window hygiene*) durante `/next-step`.
     - È **tassativamente vietato l'append cronologico numerato** (`## 175. ...`, `## 176. ...`): il file è organizzato in **5–8 sezioni stabili di dominio** e va aggiornato **in-place**, fondendo le nuove regole con quelle affini o sostituendo i vincoli superati.
     - Ogni voce adotta il formato sintetico a 2 punti: `- **<Titolo Invariante>**:` seguito da `- *Insidia*: <sintomo e causa radice in 1 riga>` e `- *Regola*: <pattern vincolante in 1-2 righe>`.
3. **`WORKLOG.md` (Diario Cronologico a Finestra Mobile & Pointer Index — Max 300 Righe)**:
   - L'ADR esteso (*Contesto*, *Decisioni*, *Impatto*) risiede **esclusivamente** nel frammento granulare `.agents/worklog.d/YYYY-MM-DD_<argomento>.md`.
   - **Governance Rolling Window & Divieto di Copia Integrale**:
     - È **tassativamente vietato copiare per intero** il frammento di `worklog.d/` dentro `WORKLOG.md`: in `WORKLOG.md` va inserito solo un **Pointer Record compatto di 4–5 righe** (`Tipo`, link cliccabile al frammento `.agents/worklog.d/...` e 1–2 bullet di sintesi).
     - `WORKLOG.md` mantiene una **finestra mobile (rolling window)** degli **ultimi 10–15 interventi** ($\le 250\text{–}300\text{ righe}$), preceduta in testa da un blocco fisso `## Indice Sintetico delle Fasi Consolidate` (1 riga per macro-fase storica).
     - Quando `WORKLOG.md` supera le **300 righe** o i **15 interventi**, le voci più vecchie vengono ruotate in `.agents/archive/WORKLOG_v<N>_archive.md` e sintetizzate nell'indice di testa.
4. **`DESIDERATA.md` (Matrice di Stato delle Funzionalità)**:
   - Mappa le funzionalità validate e pianificate (`🔴 Pianificato` / `🔴 Prioritario`), in corso (`🟡 In Lavorazione`) o completate (`🟢 Completato`).
   - Fornisce all'agente entrante la visione d'insieme su cosa è già implementato e cosa resta da realizzare, evitando re-invenzioni o regressioni di requisiti.

---

## 2. Direttiva di Cattura In-Flight (`/take-note`) e Triage Differito (`/review-notes`)

1. **Isolamento Cognitivo in Fase di Cattura (`/take-note`)**:
   - Quando l'utente invoca `/take-note <testo>` (o chiede di annotare un pensiero per analisi futura mentre è aperta una lavorazione), l'agente **DEVE** salvare il testo verbatim in `NOTES.md` con ID progressivo (`NOTE-XXX`), data/ora e indicazione del task `🟡 In Lavorazione` attivo in `DESIDERATA.md`.
   - **Divieto di Analisi Prematura**: Durante `/take-note` è tassativamente vietato ispezionare il codice sorgente applicativo (`view_file`, `grep_search`), proporre soluzioni o deviare dal task attivo. L'agente risponde con una singola riga di conferma e riprende immediatamente la lavorazione in corso.
2. **Mostra ed Esegui Analisi Approfondita (`/review-notes`)**:
   - Quando l'utente invoca `/review-notes`, l'agente mostra il cruscotto delle note in stato `📥 Da Analizzare` in `NOTES.md`, consente di selezionare quale nota (o gruppo di note) esaminare ed esegue il task di analisi sul codice sorgente reale, verificando se le lavorazioni completate nel frattempo hanno impattato l'oggetto della nota.
   - Al termine dell'analisi congiunta con l'utente, la nota viene promossa in `DESIDERATA.md` (o implementata subito) e spostata nella sezione `✅ Analizzate & Consolidate` di `NOTES.md`.

---

## 3. Direttiva di Fine Task (End-of-Task Sync) e Compattazione `MEMORY.md` / `WORKLOG.md`

Al termine di ogni implementazione o correzione strutturale, l'agente non deve concludere il task senza aver sincronizzato lo stato cognitivo (`/memory-sync`):

1. **Frammento Esteso in `worklog.d/` e Pointer Record in `WORKLOG.md` (Log Rotation `> 300 righe`)**:
   - Redigere la scheda ADR completa in `.agents/worklog.d/YYYY-MM-DD_<argomento>.md`.
   - Inserire in `WORKLOG.md` unicamente il **Pointer Record di 4–5 righe** (senza duplicare il testo del frammento). Se `WORKLOG.md` supera le **300 righe** o i **15 interventi**, ruotare i record storici in `.agents/archive/WORKLOG_v<N>_archive.md` aggiornando l'*Indice Sintetico delle Fasi Consolidate*.
2. **Aggiornamento In-Place e Guardia Anti-Bloat di `MEMORY.md`**:
   - **Filtro di Rilevanza**: Registrare in `MEMORY.md` solo insidie tecniche non ovvie o nuovi invarianti architetturali (omettere fix ordinari già descritti in `WORKLOG.md`).
   - **Inserimento In-Place per Dominio**: Collocare o fondere la regola nella sezione di dominio esistente, rimuovendo contestualmente regole obsolete o superate dal refactoring.
   - **Graduazione nei Test Automatici**: Se il vincolo è verificabile staticamente (es. `shiftLeftGovernance.test.mjs`, `validate.mjs`), codificare il controllo nel test automatico e mantenere in `MEMORY.md` solo un richiamo compatto.
   - **Protocollo di Compattazione (`> 200 righe`)**: Se `MEMORY.md` supera le **200 righe** (o presenta una struttura ad append cronologico numerato), archiviare lo storico integrale in `.agents/archive/MEMORY_v<N>_archive.md` e distillare `MEMORY.md` per dominio riportandolo sotto le **120–150 righe**.
3. **Allineamento Matrice e Note**: Aggiornare lo stato corrispondente in `DESIDERATA.md` (`🟡 In Lavorazione` $\to$ `🟢 Completato`) e, se l'intervento chiude una nota di `NOTES.md`, marcarla come consolidata.

---

## 4. Direttiva di Avvio Task (Start-of-Task Intake)

All'inizio di una sessione di sviluppo o quando invocato tramite il comando slash `/next-step`, l'agente attiva la procedura di accoglienza requisiti:
1. **Scansione Matrice e Note**: Consulta `DESIDERATA.md` dando priorità a eventuali task `🟡 In Lavorazione`, altrimenti al primo task `🔴 Prioritario` / `🔴 Pianificato` (segnalando in modo non bloccante l'eventuale presenza di note aperte in `NOTES.md`).
2. **Consultazione Vincoli**: Ispeziona `MEMORY.md` per lezioni e vincoli attinenti (segnalando la necessità di compattazione se supera le 200 righe), e la finestra mobile di `WORKLOG.md` per lo storico recente (segnalando la rotazione se supera le 300 righe).
3. **Presa in Carico**: Commuta lo stato in `🟡 In Lavorazione` e produce il briefing operativo con prompt deterministico prima di avviare la modifica del codice.
4. **Ridenominazione Chat**: Rinomina la sessione di chat con il titolo dello step preso in carico (invocando `set-chat-title.mjs`), garantendo tracciabilità immediata nella sidebar di Antigravity.

---

## 5. Tabella di Anti-Razionalizzazione (Isolamento In-Flight, Memory Sync & Anti-Bloat)

| Razionalizzazione Interna dell'Agente (Vietata) | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Mentre eseguo `/take-note`, do una rapida occhiata con `view_file` al modulo citato dall'utente."* | Durante `/take-note` è tassativamente vietato ispezionare il codice o proporre soluzioni: salvare verbatim in `NOTES.md`, confermare in 1 riga e riprendere il task attivo. |
| *"L'intervento al codice è terminato e i test passano, posso rispondere subito senza aggiornare `WORKLOG.md` e `DESIDERATA.md`."* | Nessun task strutturale è concluso senza l'End-of-Task Sync (`/memory-sync`): creare il frammento ADR e allineare `WORKLOG.md`, `MEMORY.md` e `DESIDERATA.md`. |
| *"Aggiungo rapidamente la nuova lezione come `## N. ...` in fondo a `MEMORY.md` senza toccare le sezioni esistenti."* | Vietato l'append cronologico numerato in `MEMORY.md`: aggiornare o fondere le regole *in-place* per dominio mantenendo il file $\le 200\text{ righe}$ (archiviando in `.agents/archive/` e distillando se oltre soglia). |
| *"Copio l'intero frammento di `.agents/worklog.d/` dentro `WORKLOG.md` per fare prima."* | Vietata la copia integrale in `WORKLOG.md`: inserire solo un *Pointer Record* di 4–5 righe con link a `.agents/worklog.d/...`, mantenendo una finestra mobile di max 15 interventi ($\le 300\text{ righe}$) e ruotando l'eccedenza in `.agents/archive/WORKLOG_v<N>_archive.md`. |
| *"Inizio subito a modificare i file richiesti senza controllare `MEMORY.md`."* | All'avvio di un task, verificare sempre i vincoli stabili in `MEMORY.md` per evitare di reintrodurre bug o antipattern già risolti in passato. |

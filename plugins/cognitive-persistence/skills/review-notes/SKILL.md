---
name: review-notes
description: Mostra le note aperte in NOTES.md ed esegue la review tecnica e UX in sola lettura sul codice attendendo conferma utente prima di toccare backlog o file. Use this skill when the user runs /review-notes or asks to review saved notes.
---

# Review Notes: Cruscotto Note e Revisione Tecnica/UX in Sola Lettura

## 1. Obiettivo e Invariante di Sola Lettura

Fornire il comando di **revisione controllata** delle osservazioni raccolte in `NOTES.md` (incluse le idee inviate da mobile o via voce), riconciliando ogni nota con lo stato reale del codice sorgente prima di decidere se promuoverla in `DESIDERATA.md`, lasciarla aperta, scartarla o implementarla.

> **Invariante di Sola Lettura (`READ-ONLY` fino allo Step 4)**: durante gli **Step 1, 2 e 3** è **tassativamente vietato** invocare `edit_file` o `write_file` su codice sorgente, test, `DESIDERATA.md` o `NOTES.md`, così come avviare implementazioni o refactoring. Qualsiasi scrittura su file di progetto è consentita **esclusivamente dopo** la risposta esplicita dell'utente a `ask_question` nello **Step 4**.

---

## 2. Modalità di Invocazione

- **`/review-notes list`**: Modalità **solo cruscotto passivo** (`0` scritture, `0` sync remoti, `0` cambio titolo chat). Legge `NOTES.md` e `DESIDERATA.md`, mostra la tabella delle note aperte in `📥 Da Analizzare` e **si ferma subito**.
- **`/review-notes`**: Esegue il sync sicuro dell'inbox remota (`gh-board-sync.mjs`), mostra il cruscotto delle note `📥 Da Analizzare` e:
  - se sono presenti **`>= 2` note aperte**, chiede con `ask_question` quale nota sottoporre a review (o se fermarsi al solo elenco);
  - se è presente **`1` sola nota aperta**, esegue direttamente la review **in sola lettura** (Step 3), espone la scheda di analisi e **si ferma obbligatoriamente su `ask_question` allo Step 4** attendendo la decisione dell'utente.
- **`/review-notes NOTE-XXX` (es. `/review-notes NOTE-001` o `/review-notes 1`)**: Esegue la review **in sola lettura** sulla nota indicata, espone la scheda di analisi e **si ferma obbligatoriamente su `ask_question` allo Step 4**.
- **`/review-notes all` (o `/review-notes --all`)**: Esegue la review **in sola lettura** su tutte le note aperte presentando le relative schede in un unico report e **si ferma obbligatoriamente su `ask_question` allo Step 4** prima di toccare qualsiasi file.

---

## 3. Flusso Operativo Passo-Passo

### Step 1: Visualizzazione Cruscotto (`NOTES.md` + `DESIDERATA.md`) e Selezione
1. **Sync Remoto Protetto (Saltare se invocato `/review-notes list`)**:
   - Se il comando **non** è `/review-notes list`, esegui `node c:/github/antigravity-plugins/plugins/cognitive-persistence/scripts/gh-board-sync.mjs` (oppure `node plugins/cognitive-persistence/scripts/gh-board-sync.mjs`).
   - Lo script verifica l'autore proprietario (`verifyTrustedTaskOrigin`), degrada a `LOCAL_ONLY` in `< 3s` se offline e importa le sole Issue `status:inbox` che rispettano il tetto di **115/120 righe** di `NOTES.md`.
2. Leggi `NOTES.md` e `DESIDERATA.md` alla radice del workspace:
   - Se `NOTES.md` non esiste o non contiene voci sotto `## 📥 Da Analizzare (Open)`, notifica: *"Nessuna nota aperta in `NOTES.md`. Usa `/take-note <testo>` per annotare osservazioni durante l'uso dell'app."* e termina.
   - Se in `DESIDERATA.md` esiste un task `🟡 In Lavorazione`, segnala in testa: *"Attenzione: risulta ancora aperto il task `[Nome Task]`. La review terrà conto delle modifiche in corso."*
3. **Mostra sempre la Tabella Cruscotto delle Note Aperte**:
   | ID | Titolo Sintetico | Data Cattura | Lavorazione Attiva alla Cattura | Ambito Presunto |
   | :--- | :--- | :---: | :--- | :--- |
4. **Uscita Anticipata su `list` o Selezione Nota (`>= 2` Note)**:
   - Se l'utente ha invocato **`/review-notes list`**, **fermati qui** senza avviare lo Step 2 né lo Step 3.
   - Se sono presenti **`>= 2` note aperte** e l'utente non ha specificato `NOTE-XXX` o `all`, invoca `ask_question` in italiano chiaro:
     - `(Recommended) Esegui la review in sola lettura di tutte le N note aperte`
     - `Esegui la review solo di: "<Titolo Sintetico>"` (una voce per ciascuna nota aperta)
     - `Fermati qui: volevo solo consultare l'elenco delle note aperte`
   - Se l'utente sceglie *"Fermati qui"*, termina senza modificare nulla.

### Step 2: Ridenominazione Automatica della Chat
Solo quando inizia effettivamente la review (Step 3), aggiorna il titolo della conversazione:
```bash
node c:/github/antigravity-plugins/plugins/cognitive-persistence/scripts/set-chat-title.mjs --title "[Review Notes] Revisione <NOTE-ID / Note di Progetto>"
```

### Step 3: Ispezione Approfondita sul Codice (`SOLA LETTURA — ZERO MODIFICHE`)
> **Guardia Step 3**: usa esclusivamente strumenti di lettura e ricerca (`read_file`, `grep_search`, `find_by_name`). Vietato modificare codice, test, `NOTES.md` o `DESIDERATA.md`.

Per ciascuna nota selezionata, esegui l'analisi in 4 punti:
1. **Riconciliazione Delta Post-Lavorazione**:
   - Confronta `WORKLOG.md` e `DESIDERATA.md` con il campo `Lavorazione Attiva al Momento della Nota` per verificare se interventi successivi hanno già risolto, alterato o reso obsoleto il punto segnalato.
2. **Ispezione Chirurgica del Codice Sorgente**:
   - Individua moduli, funzioni e selettori CSS esatti coinvolti dalla nota e verifica i vincoli stabili in `MEMORY.md` (es. Headless Core, disaccoppiamento DOM, invarianti di dominio).
3. **Scrutinio UX & Architetturale (`laws-of-ux` & `proactive-mentorship`)**:
   - Valuta l'osservazione rispetto a ergonomia touch (`>= 48px`), carico cognitivo (Hick's Law, Progressive Disclosure), tenuta su `360px` e complessità; se l'idea annotata a caldo ha controindicazioni, proponi un'alternativa più pulita.
4. **Output della Scheda di Review**:
   - **Nota Originale (`[NOTE-XXX]`)**: sintesi fedele dell'osservazione registrata.
   - **Stato Reale nel Codice & Delta**: link cliccabili (`[File.js](file:///...#L10-L25)`) e stato attuale post-ultime lavorazioni.
   - **Valutazione & Proposta Tecnica/UX**: approccio consigliato, perimetro dei file da toccare (`Touch-Set`), rischi/casi limite ed eventuale motivo per scartarla se già risolta.

### Step 4: Gate Obbligatorio di Conferma Utente (`ask_question` Prima di Qualsiasi Scrittura)
Esposta la scheda di review (anche quando c'è **1 sola nota aperta** o con `--all`), **fermati obbligatoriamente** e invoca `ask_question` in italiano semplice per chiedere all'utente cosa fare:
- `(Recommended) Promuovi nel backlog (DESIDERATA.md) per lavorarla in seguito`
- `Lascia la nota aperta in NOTES.md senza modificare nulla (ci rifletto o ne discutiamo)`
- `Archivia / Scarta la nota (già risolta o non più necessaria)`
- `Implementa subito la soluzione proposta nella sessione corrente`

Applica l'azione scelta **solo dopo la risposta dell'utente**:
1. **Se sceglie "Promuovi nel backlog (`DESIDERATA.md`)"**:
   - Aggiungi `[TASK-XX]` in `## 1. Backlog Attivo` di `DESIDERATA.md` (`🔴 Prioritario` o `⚪ Pianificato`, cella `Note / Specifica` **<= 160 caratteri** senza lunghi path `@file`).
   - Registra il `Touch-Set` nel sidecar `.agents/board-state.json`:
     `node c:/github/antigravity-plugins/plugins/cognitive-persistence/scripts/gh-board-sync.mjs --record-touch-set TASK-XX "percorso/file1,percorso/file2"`
   - Rimuovi il blocco aperto da `## 📥 Da Analizzare` in `NOTES.md` e aggiungi in cima a `## ✅ Analizzate & Consolidate` una **singola riga** (`| NOTE-XXX | <Titolo> | YYYY-MM-DD | Promossa in DESIDERATA (<Modulo>) |`, esito `<= 120` char).
2. **Se sceglie "Lascia la nota aperta in `NOTES.md`"**:
   - Non modificare alcun file (`0` scritture su `NOTES.md`, `DESIDERATA.md` e codice); resta disponibile a discutere o affinare la proposta in chat.
3. **Se sceglie "Archivia / Scarta la nota"**:
   - Rimuovi il blocco da `## 📥 Da Analizzare` e inserisci una singola riga in `## ✅ Analizzate & Consolidate` di `NOTES.md` con esito `⚪ Archiviata (<Motivazione <= 120 char>)`.
4. **Se sceglie "Implementa subito nella sessione corrente"**:
   - Promuovi la voce in `## 1. Backlog Attivo` di `DESIDERATA.md` come `🟡 In Lavorazione`, esegui sviluppo e test, e a fine lavoro (`/memory-sync`) aggiorna `DESIDERATA.md` (`🟢 Completato`) e `NOTES.md` (1 riga in `✅ Analizzate & Consolidate`).
5. **Rotazione Storica di `NOTES.md` (solo nei casi 1, 3 e 4)**:
   - Preserva `> **Ultimo ID Assegnato**: NOTE-XXX` nell'header; se `## ✅ Analizzate & Consolidate` supera **10 righe** (o `NOTES.md` supera **120 righe**), ruota le chiuse meno recenti in `.agents/archive/NOTES_archive.md`.

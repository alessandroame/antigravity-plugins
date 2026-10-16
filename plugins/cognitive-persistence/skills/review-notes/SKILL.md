---
name: review-notes
description: Mostra le annotazioni aperte in NOTES.md ed esegue l'analisi approfondita sul codice per promuoverle in DESIDERATA.md. Use this skill when the user runs /review-notes or asks to list and analyze saved notes.
---

# Review Notes: Cruscotto Note ed Esecuzione Task di Analisi Approfondita

## 1. Obiettivo

Fornire il comando unificato per **mostrare le note raccolte** in `NOTES.md` ed **eseguire il task di analisi tecnica e UX approfondita** a lavorazione ferma (o su richiesta esplicita), riconciliando ogni osservazione con lo stato reale e aggiornato del codice sorgente prima di promuoverla in `DESIDERATA.md` o implementarla.

---

## 2. Modalità di Invocazione

- **`/review-notes` (o `/review-notes list`)**: Mostra il cruscotto riepilogativo di tutte le note in stato `📥 Da Analizzare` e presenta un selettore interattivo (`ask_question`) per scegliere su quale nota (o tutte) avviare subito il task di analisi.
- **`/review-notes NOTE-XXX` (es. `/review-notes NOTE-001` o `/review-notes 1`)**: Mostra i dettagli della nota specificata e avvia immediatamente il task di analisi approfondita sul codice.
- **`/review-notes all` (o `/review-notes --all`)**: Mostra il riepilogo ed esegue in sequenza l'analisi approfondita di tutte le note aperte in `NOTES.md`.

---

## 3. Flusso Operativo Passo-Passo

### Step 1: Scansione e Visualizzazione Cruscotto (`NOTES.md` + `DESIDERATA.md`)
1. Leggi `NOTES.md` e `DESIDERATA.md` alla radice del workspace.
   - Se `NOTES.md` non esiste o non contiene voci sotto `## 📥 Da Analizzare (Open)`, notifica: *"Nessuna nota aperta in `NOTES.md`. Usa `/take-note <testo>` per annotare pensieri durante l'uso dell'app."* e termina.
2. Verifica se in `DESIDERATA.md` esiste ancora un task `🟡 In Lavorazione`:
   - Se presente, segnala in testa: *"Attenzione: risulta ancora in corso il task `[Nome Task]`. L'analisi terrà conto delle modifiche parziali."*
3. **Mostra sempre all'utente la Tabella Cruscotto delle Note Aperte**:
   | ID | Titolo Sintetico | Data Cattura | Lavorazione Attiva alla Cattura | Ambito Presunto |
   | :--- | :--- | :---: | :--- | :--- |
4. Se l'utente ha invocato `/review-notes` senza specificare quale nota analizzare, usa il tool `ask_question` per chiedergli quale nota vuole sottoporre subito al task di analisi:
   - Opzione 1: `(Recommended) Analizza tutte le note aperte in sequenza`
   - Opzioni successive: `Analizza [NOTE-XXX]: <Titolo Sintetico>` per ciascuna nota aperta.

### Step 2: Ridenominazione Automatica della Chat
Appena selezionata la nota (o il gruppo di note) da analizzare, aggiorna il titolo della conversazione tramite lo script Connect-RPC del plugin:
```bash
node plugins/cognitive-persistence/scripts/set-chat-title.mjs --title "[Review Notes] Analisi <NOTE-ID / Note di Progetto>"
```
*(Se il plugin è invocato dalla configurazione globale utente, usa `node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --title "..."`)*.

### Step 3: Esecuzione del Task di Analisi Approfondita sul Codice
Per ciascuna nota selezionata, esegui un'ispezione rigorosa articolata in 4 punti:
1. **Riconciliazione Delta Post-Lavorazione**:
   - Controlla `WORKLOG.md` e `DESIDERATA.md` rispetto al campo `Lavorazione Attiva al Momento della Nota`.
   - Verifica se le lavorazioni completate dopo la cattura della nota hanno già modificato, risolto parzialmente o sostituito i componenti citati.
2. **Ispezione Chirurgica del Codice Sorgente**:
   - Usa `grep_search` e `view_file` per individuare i moduli, le funzioni e i selettori CSS esatti coinvolti dalla nota.
   - Verifica i vincoli architetturali in `MEMORY.md` (es. Headless Core, disaccoppiamento DOM, zero regressioni).
3. **Scrutinio UX & Architetturale (`laws-of-ux` & `proactive-mentorship`)**:
   - Valuta l'idea dell'utente rispetto a ergonomia touch ($\ge 48\text{px}$), carico cognitivo (Hick's Law, Progressive Disclosure) e pulizia visiva.
   - Se la soluzione ipotizzata a caldo nella nota (es. una specifica combo o posizionamento) presenta controindicazioni su mobile/outdoor, proponi l'alternativa tecnica superiore.
4. **Output della Scheda di Analisi**:
   Presenta per la nota una scheda strutturata:
   - **Nota Originale (`[NOTE-XXX]`)**: citazione del pensiero registrato.
   - **Stato Attuale nel Codice & Delta**: link cliccabili ai file (`[File.js](file:///...#L10-L25)`) e impatto delle ultime lavorazioni.
   - **Proposta Ingegneristica & UX**: soluzione raccomandata, file da toccare e casi limite gestiti.

### Step 4: Decisione Operativa e Consolidamento Anti-Bloat (`NOTES.md` $\to$ `DESIDERATA.md`)
Al termine dell'analisi, chiedi all'utente tramite `ask_question` come consolidare la nota analizzata:
1. **Promuovi in `DESIDERATA.md` (`🔴 Prioritario`, `🔴 Pianificato` o `⚪ Pianificato`)**:
   - Aggiungi la nuova riga formale nella sezione `## 1. Backlog Attivo & Funzionalità Pianificate` di `DESIDERATA.md` mantenendo la cella `Note / Specifica` **$\le 160\text{ caratteri}$** (pronta per essere eseguita con `/next-step`).
   - Rimuovi il blocco multi-riga della nota da `## 📥 Da Analizzare (Open)` in `NOTES.md` e inserisci in cima alla tabella `## ✅ Analizzate & Consolidate (Ultime 10 Risolte)` una **singola riga compatta** (`| NOTE-XXX | <Titolo> | YYYY-MM-DD | Promossa in DESIDERATA (<Sezione/Modulo>) |`, cella esito $\le 120\text{ char}$).
2. **Implementa Subito nella Sessione Corrente**:
   - Promuovi la voce nella sezione `## 1. Backlog Attivo` di `DESIDERATA.md` direttamente come `🟡 In Lavorazione`, avvia lo sviluppo e i test, e a fine task (`/memory-sync`) sposta la voce nella sezione `## 2. Funzionalità Completate` di `DESIDERATA.md` (`🟢 Completato`, cella $\le 160\text{ char}$) e consolida `NOTE-XXX` come singola riga nella tabella `✅ Analizzate & Consolidate` di `NOTES.md`.
3. **Archivia / Scarta (Già Risolta o Non Necessaria)**:
   - Rimuovi il blocco da `## 📥 Da Analizzare (Open)` e inserisci una singola riga nella tabella `## ✅ Analizzate & Consolidate` di `NOTES.md` con esito `⚪ Archiviata (<Motivazione <= 120 char>)`.
4. **Rotazione Storica di `NOTES.md` (`> 10 risolte` o `> 120 righe`)**:
   - Preserva sempre nell'header la riga `> **Ultimo ID Assegnato**: NOTE-XXX`.
   - Se la tabella `## ✅ Analizzate & Consolidate` supera le **10 righe** (o se `NOTES.md` supera le **120 righe** o contiene ancora vecchie schede risolte multi-riga), sposta le note risolte meno recenti in `.agents/archive/NOTES_archive.md`.

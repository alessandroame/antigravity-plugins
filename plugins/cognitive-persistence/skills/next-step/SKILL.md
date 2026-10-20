---
name: next-step
description: Avvia il prossimo step da DESIDERATA.md estraendo i vincoli da MEMORY.md e generando il briefing operativo. Use this skill when the user runs /next-step or asks to start the next planned task.
---

# Next Step: Runbook di Avvio Task da DESIDERATA e Scodamento Parallelo Kanban

## 1. Obiettivo

Fornire un punto di ingresso deterministico all'inizio di ogni sessione o task di sviluppo, sincronizzando eventuali task promossi sulla Kanban remota (`Fai Ora` / `! modulo: titolo`), pianificando lo scodamento parallelo conflict-aware (`planExecutionWave` su Git Worktree fino a `maxWIP = 2`), integrando i vincoli da `MEMORY.md` e generando il briefing esecutivo pronto all'uso.

---

## 2. Flusso Operativo di Avvio Task

```
[Invocazione /next-step o Avvio Sessione]
               │
               ▼
[1. Sync Kanban & Wave Plan] ──► gh-board-sync.mjs: reclaim lock >45m, pull Fai Ora (!),
               │                 calcola onda parallela vs serializzata (planExecutionWave)
               ▼
[2. Scansione DESIDERATA.md] ──► Ricerca task 🟡 In Lavorazione o 🔴 Prioritario / Pianificato
               │                  (+ check non bloccante di eventuali note aperte in NOTES.md)
               ▼
[3. Iniezione Contesto]      ──► Scansione MEMORY.md e WORKLOG.md (vincoli/lezioni)
               │
               ▼
[4. Generazione Briefing]    ──► Scheda task + Onda Parallela/Seriale + Prompt Esecutivo
               │
               ▼
[5. Transizione & Worktree]  ──► Aggiornamento DESIDERATA.md (🔴 ➔ 🟡 In Lavorazione)
               │                 + eventuale Git Worktree con junction dipendenze (--link-deps)
               ▼
[6. Ridenominazione Chat]    ──► Aggiornamento titolo chat via scripts/set-chat-title.mjs
```

---

## 3. Istruzioni Operative per l'Agente

Quando questa skill viene invocata (tramite comando slash `/next-step` o richiesta esplicita dell'utente):

### Step 1: Sync Kanban Remota, Scodamento Parallelo Conflict-Aware e Priorità `DESIDERATA.md`

1. **Riconciliazione Coda Remota e Calcolo Onda Parallela (`gh-board-sync.mjs`)**:
   - Esegui `node plugins/cognitive-persistence/scripts/gh-board-sync.mjs` (o `node ~/.gemini/config/plugins/cognitive-persistence/scripts/gh-board-sync.mjs`).
   - Lo script: (a) sblocca eventuali lock `🟡 In Lavorazione` rimasti orfani da oltre **45 minuti** (`reclaimStaleLocks` `[P1-LCK]`); (b) importa da GitHub Issues le schede promosse in `Fai Ora` (`status:ready` o prefisso rapido `! modulo: titolo` da smartphone, verificate con `verifyTrustedTaskOrigin` `[P0-SEC]`); (c) calcola l'onda di esecuzione tramite `planExecutionWave` incrociando i `verifiedTouchSet` di `.agents/board-state.json` (certificati da `/review-notes`) o le cartelle reali del progetto ospite (`resolveScopeToPaths` `[P0-PORT]`).
   - **Parallelo vs Auto-Serializzazione**: fino a **2 task con file/cartelle disgiunti** possono partire in parallelo in 2 Git Worktree isolati (`../<repo>-task-<id>`), collegando in `< 20ms` `node_modules`/`.venv` tramite `gh-board-sync.mjs --link-deps <worktree-path>` (`[CRITICO-2]`). I task che toccano gli stessi file o file globali condivisi vengono **serializzati automaticamente** (`queuedBehind`) aggiornando il commento di stato senza spam (`[P1-NOTIF]`). Se in esecuzione remota non presidiata emerge un dubbio bloccante, il task viene messo in pausa con notifica mobile (`status:blocked-input`, `[P0-UX]`) avanzando il successivo.
2. Leggi il file `DESIDERATA.md` situato alla radice del workspace (e controlla se esiste `NOTES.md`).
   - Se `DESIDERATA.md` non esiste, inizializzalo con la struttura standard a 2 tabelle (*Backlog Attivo* e *Completate*).
   - Se in `NOTES.md` sono presenti annotazioni in stato `📥 Da Analizzare`, includi una nota informativa non bloccante nel briefing: *"Promemoria: sono presenti N note aperte in `NOTES.md` (invoca `/review-notes` quando desideri analizzarle)."*
   - **Check Anti-Bloat `DESIDERATA.md` (`> 150 righe` / celle `> 160 char`) e `NOTES.md` (`> 120 righe`)**: Se `DESIDERATA.md` supera le **150 righe** (o presenta celle prolisse > 160 char) o `NOTES.md` supera le **120 righe**, segnala nel briefing la compattazione da eseguire durante il successivo `/memory-sync`.
3. Applica la seguente **regola gerarchica di risoluzione**:
   - **Priorità 1 (Ripresa Task Aperto)**: Cerca righe con stato `🟡 In Lavorazione`.
     - *Azione*: Se è presente un task in corso non scaduto, selezionalo prioritariamente (o mostra la coppia di task disgiunti in `parallelStart`).
   - **Priorità 2 (Nuovo Task Prioritario o Pianificato)**: Se nessun task è in corso, seleziona la **prima** riga (o coppia disgiunta in `parallelStart`) con stato `🔴 Prioritario` o `🔴 Pianificato` (o `⚪ Pianificato` se non vi sono `🔴`) nella sezione `## 1. Backlog Attivo`.
   - **Priorità 3 (Backlog Esaurito)**: Se tutti gli elementi sono `🟢 Completato`, notifica il completamento suggerendo `/review-notes` se vi sono note aperte in `NOTES.md`.

### Step 2: Estrazione del Contesto Cognitivo (`MEMORY.md` e `WORKLOG.md`)

1. Ispeziona `MEMORY.md`:
   - Cerca vincoli stabili, particolarità di runtime o antipattern banditi attinenti ai moduli impattati dal task selezionato.
   - **Check Guardia Anti-Bloat (`> 200 righe`)**: Se `MEMORY.md` supera le **200 righe**, segnala la necessità di compattazione per dominio durante `/memory-sync`.
2. Ispeziona la finestra mobile di `WORKLOG.md`:
   - Verifica lo stato delle ultime decisioni tecniche per garantire coerenza con il nuovo intervento.

### Step 3: Generazione del Briefing Operativo e del Prompt Esecutivo

Presenta all'utente una sintesi strutturata contenente:
1. **Scheda Desiderata Selezionato & Stato Coda Parallela**:
   - Titolo della funzionalità, modulo di appartenenza, `Touch-Set` rilevato (`VERIFIED_BY_REVIEW` o `FAST_TRACK_SCOPE`) ed eventuali task messi in coda seriale (`serializedBehind`).
2. **Vincoli e Regole Applicabili**:
   - Sintesi delle lezioni e vincoli estratti da `MEMORY.md` rilevanti per l'intervento.
3. **Prompt Esecutivo Ottimizzato**:
   - Un prompt deterministico pronto all'uso con riferimenti espliciti ai file bersaglio (`@file`), criteri di accettazione e comando di test rilevato (`detectProjectTestCommand`).

### Step 4: Transizione di Stato in `DESIDERATA.md`

1. Aggiorna la riga corrispondente in `DESIDERATA.md` da `🔴 Prioritario` / `⚪ Pianificato` a `🟡 In Lavorazione` mantenendo la cella `Note` <= 160 caratteri.

### Step 5: Ridenominazione Automatica del Titolo della Chat

1. Esegui il comando di aggiornamento titolo includendo obbligatoriamente `--conversation-id "<Conversation ID>"`:
   ```bash
   node plugins/cognitive-persistence/scripts/set-chat-title.mjs --conversation-id "<Conversation ID>" --title "<Codice/Titolo Step>"
   ```
   *(Se installato globalmente: `node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --conversation-id "<Conversation ID>" --title "..."`)*.

### Step 6: Avvio o Richiesta di Conferma

- Se l'utente ha invocato `/next-step` senza flag, presenta il briefing e chiedi conferma per procedere.
- Se l'utente specifica `--auto` o chiede di procedere subito, avvia direttamente l'intervento tecnico e chiudi a fine test con `/memory-sync`.

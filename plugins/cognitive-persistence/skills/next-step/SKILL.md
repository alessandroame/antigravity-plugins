---
name: next-step
description: >-
  Avvia la lavorazione del prossimo elemento di DESIDERATA.md. Scansiona la matrice di stato,
  estrae vincoli e lezioni apprese da MEMORY.md e genera il briefing operativo con prompt deterministico.
  Use this skill when the user runs /next-step, asks what to do next, or requests to pull and start the next planned task from DESIDERATA.md.
---

# Next Step: Runbook di Avvio Task da DESIDERATA

## 1. Obiettivo

Fornire un punto di ingresso deterministico all'inizio di ogni sessione o task di sviluppo, identificando automaticamente la prossima funzionalità pianificata in `DESIDERATA.md`, integrando le lezioni e i vincoli noti da `MEMORY.md` e generando un briefing esecutivo pronto all'uso prima di modificare il codice sorgente.

---

## 2. Flusso Operativo di Avvio Task

```
[Invocazione /next-step o Avvio Sessione]
               │
               ▼
[1. Scansione DESIDERATA.md] ──► Ricerca task 🟡 In Lavorazione o 🔴 Pianificato
               │
               ▼
[2. Iniezione Contesto]      ──► Scansione MEMORY.md e WORKLOG.md (vincoli/lezioni)
               │
               ▼
[3. Generazione Briefing]    ──► Scheda task + Prompt Esecutivo strutturato
               │
               ▼
[4. Transizione di Stato]    ──► Aggiornamento DESIDERATA.md (🔴 ➔ 🟡 In Lavorazione)
               │
               ▼
[5. Ridenominazione Chat]    ──► Aggiornamento titolo chat via scripts/set-chat-title.mjs
               │
               ▼
[6. Avvio Implementazione]   ──► Allineamento con l'utente e inizio sviluppo
```

---

## 3. Istruzioni Operative per l'Agente

Quando questa skill viene invocata (tramite comando slash `/next-step` o richiesta esplicita dell'utente):

### Step 1: Ispezione e Risoluzione Priorità di `DESIDERATA.md`

1. Leggi il file `DESIDERATA.md` situato alla radice del workspace.
   - Se il file non esiste, guida l'utente nella creazione della matrice o richiedi dove reperire l'elenco dei requisiti.
2. Applica la seguente **regola gerarchica di risoluzione**:
   - **Priorità 1 (Ripresa Task Aperto)**: Cerca righe con stato `🟡 In Lavorazione`.
     - *Azione*: Se è presente un task in corso, selezionalo prioritariamente. Segnala all'utente: *"Rilevato task non concluso da una sessione precedente: [Nome Feature]. È prioritario completare questo intervento prima di avviare nuovi task."*
   - **Priorità 2 (Nuovo Task Pianificato)**: Se nessun task è in corso, seleziona la **prima** riga con stato `🔴 Pianificato` procedendo dall'alto verso il basso della tabella.
   - **Priorità 3 (Backlog Esaurito)**: Se tutti gli elementi sono `🟢 Completato`:
     - *Azione*: Notifica all'utente che tutti i desiderata pianificati sono stati completati con successo. Non mutare lo stato e richiedi se si desidera definire nuovi requisiti.

### Step 2: Estrazione del Contesto Cognitivo (`MEMORY.md` e `WORKLOG.md`)

1. Ispeziona `MEMORY.md`:
   - Cerca vincoli stabili, particolarità di runtime o antipattern banditi che abbiano attinenza con i moduli o le tecnologie impattate dal task selezionato.
2. Ispeziona l'ultimo record in `WORKLOG.md` o i frammenti recenti in `.agents/worklog.d/`:
   - Verifica lo stato dell'architettura e delle ultime decisioni tecniche per garantire coerenza con il nuovo intervento.

### Step 3: Generazione del Briefing Operativo e del Prompt Esecutivo

Presenta all'utente una sintesi strutturata contenente:
1. **Scheda Desiderata Selezionato**:
   - Titolo della funzionalità e modulo di appartenenza.
   - Stato corrente (`🔴 Pianificato` $\to$ `🟡 In Lavorazione`).
2. **Vincoli e Regole Applicabili**:
   - Sintesi delle lezioni e vincoli estratti da `MEMORY.md` rilevanti per l'intervento.
3. **Prompt Esecutivo Ottimizzato**:
   - Un prompt deterministico pronto all'uso con riferimenti espliciti ai file bersaglio (`@file`), criteri di accettazione e test di verifica da eseguire.

### Step 4: Transizione di Stato in `DESIDERATA.md`

1. Aggiorna la riga corrispondente in `DESIDERATA.md`:
   - Modifica l'indicatore di stato da `🔴 Pianificato` a `🟡 In Lavorazione`.
   - Se opportuno, aggiungi una nota sintetica (es. `In corso nella sessione corrente`).
2. Mantieni intatta la struttura tabellare e le altre sezioni del documento.

### Step 5: Ridenominazione Automatica del Titolo della Chat

1. Recupera il titolo sintetico dello step identificato (es. `[1.3] Telemetria ed Event Tracking` o il nome della feature).
2. Esegui il comando di aggiornamento titolo richiamando lo script dedicato del plugin:
   ```bash
   node plugins/cognitive-persistence/scripts/set-chat-title.mjs --title "<Codice/Titolo Step>"
   ```
   *(Nota: se il plugin è installato globalmente nella configurazione utente, utilizzare `node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --title "..."`)*.
3. Lo script contatta l'endpoint Connect-RPC locale di Antigravity Language Server (`UpdateConversationAnnotations`), aggiornando istantaneamente il titolo sia nella visualizzazione a pannello laterale (sidebar) sia nello storage persistente di Antigravity.
4. Segnala all'utente nel briefing operativo l'avvenuta ridenominazione della sessione.

### Step 6: Avvio o Richiesta di Conferma

- Se l'utente ha invocato `/next-step` senza ulteriori flag, presenta il briefing con il prompt generato e chiedi conferma per procedere con l'implementazione del codice e dei relativi test.
- Se l'utente specifica argomenti come `--auto` o chiede esplicitamente di procedere subito, avvia direttamente l'intervento tecnico (creazione test, analisi codice, modifiche chirurgiche).
- **Chiusura del Ciclo (Ponte con `memory-sync`)**: Ricorda che al completamento dello sviluppo e al superamento di tutti i test, l'intervento dovrà essere finalizzato invocando la skill `/memory-sync`.


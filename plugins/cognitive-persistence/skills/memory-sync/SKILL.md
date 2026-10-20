---
name: memory-sync
description: Sincronizza la memoria di progetto a fine task creando il frammento ADR e aggiornando MEMORY.md, WORKLOG.md e DESIDERATA.md. Use this skill when the user runs /memory-sync or finishes a task.
---

# Project Memory & Knowledge Persistence Runbook

## 1. Obiettivo
Garantire che l'esperienza acquisita, i refactoring complessi e le decisioni architetturali non vadano perdute tra una sessione e l'altra, permettendo a qualsiasi sessione futura di comprendere istantaneamente lo stato del progetto e chiudendo in sicurezza eventuali Git Worktree paralleli e schede sulla Kanban remota.

---

## 2. Flusso di Sincronizzazione di Fine Task

```
[Verifica Test Superata: 100% + Guardia Worktree Diff P0-ISO]
               │
               ▼
[1. Scrittura Frammento] ──► Crea ADR esteso in .agents/worklog.d/YYYY-MM-DD_<topic>.md
               │
               ▼
[2. Pointer in WORKLOG]  ──► Aggiunge Pointer Record (4-5 righe) in WORKLOG.md (max 15 voci / <= 300 righe)
               │             + Log Rotation in .agents/archive/WORKLOG_v<N>_archive.md se oltre soglia
               ▼
[3. Sync MEMORY.md]      ──► Aggiornamento in-place per dominio (vietato append numerato)
               │             + Compattazione in .agents/archive/ se > 200 righe
               ▼
[4. Sync DESIDERATA/NOTES]──► Sposta feature in Completate (DESIDERATA <= 150 righe, cella <= 160 char)
               │             + Chiude eventuale NOTE-XXX / Issue GitHub e pulisce il Git Worktree
               ▼
[5. Resoconto all'Utente] ──► Presentazione delle modifiche e guida al collaudo
```

---

## 3. Formato dei Documenti e Governance Anti-Bloat

### A. Frammento ADR Esteso (`.agents/worklog.d/YYYY-MM-DD_<argomento>.md`) e Pointer Record in `WORKLOG.md`
Per evitare di duplicare centinaia di righe tra `.agents/worklog.d/` e `WORKLOG.md`:

1. **Scheda Granulare Estesa (`.agents/worklog.d/YYYY-MM-DD_<argomento>.md`)**:
   Contiene il dettaglio architetturale completo dell'intervento:
   ```markdown
   # [YYYY-MM-DD] ADR: Titolo dell'Intervento

   ## Contesto & Motivazione
   Descrizione sintetica del problema o requisito che ha reso necessario l'intervento.

   ## Decisioni Architetturali
   I pattern, le astrazioni o le modifiche strutturali adottate.

   ## Impatto e Conseguenze
   Moduli modificati, suite di test eseguite e comportamento verificato.
   ```
2. **Pointer Record in `WORKLOG.md` (Vietata la Copia Integrale — Max 4–5 righe per voce)**:
   In `WORKLOG.md` è **vietato incollare l'intero frammento**. Aggiungere solo un record puntatore sintetico:
   ```markdown
   ## YYYY-MM-DD — Titolo Sintetico dell'Intervento
   - **Tipo**: <Ambito / Categoria>
   - **Dettagli**: [`.agents/worklog.d/YYYY-MM-DD_<argomento>.md`](file:///.agents/worklog.d/YYYY-MM-DD_<argomento>.md)
   - **Sintesi**:
     - 1–2 bullet asciutti con file chiave toccati e decisione tecnica principale.
   ```
3. **Finestra Mobile (`Rolling Window`: Max 15 Interventi / <= 300 righe) e Log Rotation**:
   - `WORKLOG.md` mantiene in testa un blocco compatto `## Indice Sintetico delle Fasi Consolidate` (1 riga per macro-fase storica) seguito dagli **ultimi 10–15 Pointer Record**.
   - Se `WORKLOG.md` supera le **300 righe** o i **15 interventi** (o contiene ancora vecchi ADR copiati per intero), spostare le voci meno recenti in `.agents/archive/WORKLOG_v<N>_archive.md` e riassumerle nell'*Indice Sintetico delle Fasi Consolidate*.

### B. Governance di `MEMORY.md` (In-Place per Dominio & Tetto Max 200 Righe)
`MEMORY.md` non è un diario cronologico (ruolo già coperto da `WORKLOG.md`), ma un registro distillato di invarianti architetturali e insidie di runtime, letto ad ogni `/next-step`. Per prevenire la crescita incontrollata (*context bloat*):

1. **Filtro di Rilevanza (Zero Rumore Ordinario)**:
   - Non aggiungere voci in `MEMORY.md` per normali implementazioni di feature o fix banali già tracciati in `WORKLOG.md`.
   - Registrare solo **insidie tecniche non ovvie**, **incompatibilità di runtime/librerie** o **invarianti architetturali** che un agente futuro rischierebbe di violare.
2. **Divieto di Append Cronologico Numerato & Aggiornamento In-Place**:
   - È **tassativamente vietato** accodare sezioni numerate progressive (`## 175. ...`, `## 176. ...`) in fondo al file.
   - `MEMORY.md` deve essere strutturato in **5–8 sezioni stabili di dominio** (es. *Core & Matematica*, *API & Dominio*, *UI & Ergonomia*, *Persistenza*, *Test & Ambiente*).
   - Ogni nuova regola va inserita o fusa **in-place** nella sezione di dominio pertinente, **sostituendo o rimuovendo** contestualmente le regole precedenti rese obsolete dal nuovo intervento.
3. **Formato Compatto a 2 Righe (`Insidia` / `Regola`)**:
   ```markdown
   - **<Titolo Invariante / Componente>**:
     - *Insidia*: <1 riga: sintomo e causa radice tecnica>.
     - *Regola*: <1-2 righe: vincolo operativo obbligatorio e file/test di riferimento>.
   ```
4. **Graduazione nei Test Automatici (Shift-Left Governance)**:
   - Quando una lezione appresa è verificabile staticamente (es. assenza di DOM in `core/`, selettori CSS vietati, invarianti di configurazione), codificarla nel test di governance del progetto (es. `shiftLeftGovernance.test.mjs` o `validate.mjs`) e comprimere la voce in `MEMORY.md` a un richiamo di 1 riga.
5. **Tetto Massimo (`200 righe`) e Protocollo di Bonifica / Archiviazione**:
   - Prima di salvare `MEMORY.md`, verificare che il file non superi le **200 righe** complessive.
   - Se `MEMORY.md` supera le **200 righe** (o presenta ancora una struttura cronologica numerata `## 1..N`), eseguire la **Distillazione per Dominio**:
     1. Archiviare lo snapshot integrale corrente in `.agents/archive/MEMORY_v<N>_archive.md`.
     2. Riscrivere `MEMORY.md` raggruppando e fondendo i vincoli attivi in 5–8 sezioni di dominio sotto le **120–150 righe**, inserendo in testa il callout di governance con il link all'archivio e alla suite di test automatici:
        ```markdown
        > **Governance anti-bloat**: tetto massimo **200 righe**. Vietato l'append numerato: aggiornare le sezioni *in-place* sostituendo le regole superate. Storico pre-distillazione archiviato in [`.agents/archive/MEMORY_v1_archive.md`](file:///...).
        ```

### C. Governance Anti-Bloat di `DESIDERATA.md` (<= 150 righe) e `NOTES.md` (<= 120 righe)
1. **Partizionamento e Limite Cella in `DESIDERATA.md` (<= 150 righe, cella `Note` <= 160 char)**:
   - Strutturare `DESIDERATA.md` in due sezioni: `## 1. Backlog Attivo & Funzionalità Pianificate` (in alto, `🟡 In Lavorazione` / `🔴 Prioritario` / `⚪ Pianificato`) e `## 2. Funzionalità Completate & Consolidate` (in basso, `🟢 Completato`).
   - Spostare la funzionalità appena conclusa dalla tabella *Backlog Attivo* alla tabella *Completate* con stato `🟢 Completato` e una nota sintetica **<= 160 caratteri** (i dettagli risiedono in `WORKLOG.md`).
   - Se `DESIDERATA.md` supera le **150 righe** (o 40 righe completate), archiviare lo storico dettagliato in `.agents/archive/DESIDERATA_v<N>_archive.md` e consolidare i sotto-step passati in righe di macro-fase.
2. **Tabella Risolte a 1 Riga, Guardia Worktree (`[P0-ISO]`) e Chiusura Kanban (`NOTES.md` <= 120 righe)**:
   - Se il task è stato eseguito in un Git Worktree parallelo, verifica prima del merge con `verifyWorktreeDiffIsolation` (`board-engine.mjs`) che `git diff --name-only` non abbia toccato file appartenenti a un altro worktree attivo né i 4 file cognitivi globali (`Single-Writer Commit Phase`: l'aggiornamento di `DESIDERATA.md` e `WORKLOG.md` avviene solo sul branch principale a test superati).
   - Se l'intervento completato risolve una nota aperta `[NOTE-XXX]` in `NOTES.md` (o una Issue GitHub `#N`), rimuovere il blocco multi-riga da `## 📥 Da Analizzare (Open)` e aggiungere una **singola riga** in cima alla tabella `## ✅ Analizzate & Consolidate (Ultime 10 Risolte)` (`| NOTE-XXX | <Titolo> | YYYY-MM-DD | Completata in <File/Modulo> |`, esito <= 120 char), preservando nell'header `> **Ultimo ID Assegnato**: NOTE-XXX`, chiudendo la scheda remota e ruotando in `.agents/archive/NOTES_archive.md` le righe risolte oltre le 10 unità.

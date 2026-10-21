---
name: memory-sync
description: >-
  Sincronizza la memoria di progetto creando l'ADR, aggiornando MEMORY.md, WORKLOG.md e
  DESIDERATA.md e distillando l'esperienza in skill/regole L1-L3. Use this skill when the
  user runs /memory-sync or finishes a task.
---

# Project Memory, Knowledge Persistence & Experience-to-Skill Runbook

## 1. Obiettivo
Garantire che l'esperienza acquisita, i refactoring complessi e le decisioni architetturali non vadano perdute tra una sessione e l'altra, permettendo a qualsiasi sessione futura di comprendere istantaneamente lo stato del progetto, distillando automaticamente le lezioni trasversali in skill/regole (`L1..L3`) e chiudendo in sicurezza eventuali Git Worktree paralleli e schede sulla Kanban remota.

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
[3.5 Auto-Learn Skill]   ──► Distilla correzioni/pattern generici in L3 (test/sonde), L2b (SKILL.md) o L2a (AGENTS.md)
               │             + Esegue validate.mjs --all e npm run sync automatico verso ~/.gemini/config/plugins/
               ▼
[4. Sync DESIDERATA/NOTES]──► Sposta feature in Completate (DESIDERATA <= 150 righe, cella <= 160 char)
               │             + Chiude eventuale NOTE-XXX / Issue GitHub e pulisce il Git Worktree
               ▼
[5. Resoconto all'Utente] ──► Presentazione delle modifiche, ricevuta Auto-Apprendimento a 1 riga e guida al collaudo
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
   - Se `WORKLOG.md` supera le **300 righe** o i **15 interventi**, spostare le voci meno recenti in `.agents/archive/WORKLOG_v<N>_archive.md` e riassumerle nell'*Indice Sintetico delle Fasi Consolidate*.

### B. Governance di `MEMORY.md` (In-Place per Dominio & Tetto Max 200 Righe)
`MEMORY.md` è un registro distillato di invarianti architetturali e insidie di runtime, letto ad ogni `/next-step`:

1. **Filtro di Rilevanza (Zero Rumore Ordinario)**:
   - Registrare solo **insidie tecniche non ovvie**, **incompatibilità di runtime/librerie** o **invarianti architetturali** che un agente futuro rischierebbe di violare.
2. **Divieto di Append Cronologico Numerato & Aggiornamento In-Place**:
   - È **tassativamente vietato** accodare sezioni numerate progressive (`## 175. ...`) in fondo al file.
   - `MEMORY.md` deve essere strutturato in **5–8 sezioni stabili di dominio** aggiornate **in-place**, sostituendo le regole superate.
3. **Formato Compatto a 2 Righe (`Insidia` / `Regola`)**:
   ```markdown
   - **<Titolo Invariante / Componente>**:
     - *Insidia*: <1 riga: sintomo e causa radice tecnica>.
     - *Regola*: <1-2 righe: vincolo operativo obbligatorio e file/test di riferimento>.
   ```
4. **Graduazione Automatica Esperienza -> Skill/Regola (`Step 3.5: L1 -> L2 -> L3`)**:
   - Quando nella sessione corrente l'utente ha corretto l'agente, risolto una regressione ripetuta o evidenziato un pattern di workflow riutilizzabile:
     1. **Se specifico del progetto (`L1` + `L3` locale)**: aggiorna `MEMORY.md` *in-place* **e** codifica un test unitario d'invariante numerico/geometrico nel progetto.
     2. **Se trasversale ai plugin (`L2b` / `L2a` / `L3` globale)**: aggiorna autonomamente il plugin pertinente in `c:/github/antigravity-plugins/plugins/` (dando priorità a `L3` in `validate.mjs`/`triage.mjs`/`ui-geometry-probe.js` e `L2b` in `SKILL.md`, mantenendo `AGENTS.md <= 6.500 byte`), esegui `node scripts/validate.mjs --all` e lancia **`npm run sync`** (`scripts/sync-to-global.mjs`).
     3. Riporta nel resoconto finale la ricevuta di 1 riga (`Auto-Apprendimento Applicato: ... · Scrivi "annulla regola" per ripristinare`).
5. **Tetto Massimo (`200 righe`) e Protocollo di Bonifica / Archiviazione**:
   - Se `MEMORY.md` supera le **200 righe**, archiviare lo snapshot in `.agents/archive/MEMORY_v<N>_archive.md` e riscrivere `MEMORY.md` sotto le **120–150 righe**.

### C. Governance Anti-Bloat di `DESIDERATA.md` (<= 150 righe) e `NOTES.md` (<= 120 righe)
1. **Partizionamento e Limite Cella in `DESIDERATA.md` (<= 150 righe, cella `Note` <= 160 char)**:
   - Spostare la funzionalità conclusa dalla tabella *Backlog Attivo* alla tabella *Completate* con stato `🟢 Completato` e una nota sintetica **<= 160 caratteri**.
2. **Tabella Risolte a 1 Riga, Guardia Worktree (`[P0-ISO]`) e Chiusura Kanban (`NOTES.md` <= 120 righe)**:
   - Se il task è stato eseguito in un Git Worktree parallelo, verifica prima del merge con `verifyWorktreeDiffIsolation` (`board-engine.mjs`) che `git diff --name-only` non abbia toccato file di altri worktree attivi.
   - Se l'intervento risolve una nota aperta `[NOTE-XXX]` in `NOTES.md`, rimuovere il blocco da `## 📥 Da Analizzare (Open)` e aggiungere una **singola riga** in cima a `## ✅ Analizzate & Consolidate (Ultime 10 Risolte)` (esito <= 120 char).

---
name: review-notes
description: >-
  Use this skill when the user runs /review-notes or asks to review saved notes in NOTES.md,
  performing a strictly read-only code and UX review and waiting for ask_question confirmation.
---

# Review Notes: Read-Only Note Dashboard & Technical/UX Review (`/review-notes`)

## 1. Objective & Read-Only Invariant

Reconcile observations captured in `NOTES.md` (including mobile/voice notes) against actual source code before deciding whether to promote them to `DESIDERATA.md`, keep them open, archive them, or implement them. Always reply to the user in plain Italian.

> **Read-Only Invariant (`READ-ONLY` up to Step 4)**: During **Steps 1, 2, and 3**, it is **STRICTLY FORBIDDEN** to call `edit_file` or `write_file` on source code, tests, `DESIDERATA.md`, or `NOTES.md`, or to start implementations. Any file write is permitted **ONLY AFTER** the user's explicit response to `ask_question` in **Step 4**.

---

## 2. Invocation Modes

- **`/review-notes list`**: Purely passive dashboard mode (`0` writes, `0` remote syncs, `0` chat title changes). Reads `NOTES.md` and `DESIDERATA.md`, displays the `📥 Da Analizzare` table, and **stops immediately**.
- **`/review-notes`**: Runs protected inbox sync (`gh-board-sync.mjs`), displays the `📥 Da Analizzare` table, and:
  - IF **`>= 2` open notes** exist, asks via `ask_question` which note(s) to review (or whether to stop at the list);
  - IF **only `1` open note** exists, runs the **read-only** review (Step 3), presents the review card, and **MUST STOP on `ask_question` at Step 4**.
- **`/review-notes NOTE-XXX` / `/review-notes all` (`--all`)**: Runs the **read-only** review on the specified/all open notes and **MUST STOP on `ask_question` at Step 4** before touching any file.

---

## 3. Step-by-Step Procedure

### Step 1: Dashboard Display (`NOTES.md` + `DESIDERATA.md`) & Selection
1. **Protected Remote Sync (Skip on `/review-notes list`)**:
   - Run `node ~/.gemini/config/plugins/cognitive-persistence/scripts/gh-board-sync.mjs` (or `node plugins/cognitive-persistence/scripts/gh-board-sync.mjs`).
2. Read `NOTES.md` and `DESIDERATA.md`:
   - IF no open notes exist under `## 📥 Da Analizzare (Open)`, reply: *"Nessuna nota aperta in `NOTES.md`. Usa `/take-note <testo>` per annotare osservazioni durante l'uso dell'app."* and stop.
   - IF a task is `🟡 In Lavorazione` in `DESIDERATA.md`, warn at the top: *"Attenzione: risulta ancora aperto il task `[Nome Task]`. La review terrà conto delle modifiche in corso."*
3. **Render the Open Notes Dashboard Table**:
   | ID | Titolo Sintetico | Data Cattura | Lavorazione Attiva alla Cattura | Ambito Presunto |
   | :--- | :--- | :---: | :--- | :--- |
4. **Early Exit on `list` or Multi-Note Selection (`>= 2` Notes)**:
   - IF invoked as **`/review-notes list`**, **STOP HERE**.
   - IF **`>= 2` open notes** exist and no specific target was passed, invoke `ask_question` in Italian:
     - `(Recommended) Esegui la review in sola lettura di tutte le N note aperte`
     - `Esegui la review solo di: "<Titolo Sintetico>"`
     - `Fermati qui: volevo solo consultare l'elenco delle note aperte`

### Step 2: Chat Title Update
When entering Step 3, run:
```bash
node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --title "[Review Notes] Revisione <NOTE-ID / Note di Progetto>"
```

### Step 3: Deep Code Inspection (`READ-ONLY — ZERO EDITS`)
> **Step 3 Guard**: Use ONLY read/search tools (`view_file`/`read_file`, `grep_search`, `find_by_name`). NEVER edit code, tests, `NOTES.md`, or `DESIDERATA.md`.

For each selected note, evaluate and output in Italian:
1. **Post-Work Delta Reconciliation**: Check `WORKLOG.md` and `DESIDERATA.md` against `Lavorazione Attiva al Momento della Nota`.
2. **Surgical Source Inspection**: Locate exact modules, functions, and CSS selectors (`[File.js](file:///...#L10-L25)`) and check `MEMORY.md` invariants.
3. **UX & Architectural Scrutiny (`laws-of-ux` & `proactive-mentorship`)**: Check touch ergonomics (`>= 48px`), cognitive load, `360px` layout, and Occam's Razor.
4. **Review Card Output (in Italian)**:
   - **Nota Originale (`[NOTE-XXX]`)**
   - **Stato Reale nel Codice & Delta**
   - **Valutazione & Proposta Tecnica/UX** (including `Touch-Set`)

### Step 4: Mandatory User Confirmation Gate (`ask_question` Before Any Write)
After presenting the review card — even when only **1 open note** exists or with `--all` — you MUST **STOP** and invoke `ask_question` in plain Italian:
- `(Recommended) Promuovi nel backlog (DESIDERATA.md) per lavorarla in seguito`
- `Lascia la nota aperta in NOTES.md senza modificare nulla (ci rifletto o ne discutiamo)`
- `Archivia / Scarta la nota (già risolta o non più necessaria)`
- `Implementa subito la soluzione proposta nella sessione corrente`

Apply the chosen action **only after user confirmation**:
1. **Promuovi nel backlog (`DESIDERATA.md`)**: Add `[TASK-XX]` to `## 1. Backlog Attivo` (`Note <= 160` chars), record `Touch-Set` via `gh-board-sync.mjs --record-touch-set TASK-XX "file1,file2"`, and move `[NOTE-XXX]` to a 1-line entry in `## ✅ Analizzate & Consolidate` (`<= 120` chars).
2. **Lascia la nota aperta in `NOTES.md`**: Perform `0` writes.
3. **Archivia / Scarta la nota**: Move `[NOTE-XXX]` to `## ✅ Analizzate & Consolidate` as `⚪ Archiviata (<Motivazione <= 120 char>)`.
4. **Implementa subito**: Mark `🟡 In Lavorazione` in `DESIDERATA.md`, implement and test, then close via `/memory-sync`.
5. **Rotation**: Keep `> **Ultimo ID Assegnato**: NOTE-XXX` and rotate closed notes beyond 10 rows (or `> 120` lines) to `.agents/archive/NOTES_archive.md`.

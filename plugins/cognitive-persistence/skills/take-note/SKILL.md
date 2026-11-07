---
name: take-note
description: >-
  Use this skill when the user runs /take-note or asks to jot down notes for later analysis,
  capturing observations in NOTES.md with zero context switch and without inspecting code.
---

# Take Note: Zero Context-Switch In-Flight Capture Runbook (`/take-note`)

## 1. Objective & Isolation Guard

Instantly record thoughts, UX doubts, ideas, or anomalies into `NOTES.md` at the workspace root without interrupting the active task (`🟡 In Lavorazione`). Always reply to the user in plain Italian.

### Strict Anti-Premature-Analysis Guard (Mandatory Constraint)
1. **Zero Code Inspection**: During `/take-note`, it is **STRICTLY FORBIDDEN** to invoke code exploration or edit tools (`view_file`/`read_file` on source files, `grep_search`, `find_by_name`, `replace_file_content` on code).
2. **Only Authorized Files**: Read/write ONLY `NOTES.md` and read `DESIDERATA.md` (solely to extract the active `🟡 In Lavorazione` task title).
3. **Zero Premature Diagnosis**: NEVER diagnose, propose fixes, or debate technical merits during `/take-note`.

---

## 2. Step-by-Step Procedure

### Step 1: Input Parsing (Single or Multi-Note Batch)
1. Extract the text after `/take-note`. If multiple distinct items are pasted, split them into atomic notes while preserving the user's **exact verbatim text**.
2. IF `/take-note` is invoked without text, reply in 1 line: *"Scrivi pure il pensiero o l'elenco di note da registrare in `NOTES.md`."*

### Step 2: Passive Active-Task Detection (`DESIDERATA.md`)
1. If `DESIDERATA.md` exists, record any `🟡 In Lavorazione` row as `Lavorazione Attiva al Momento della Nota` (or `Nessun task attivo in lavorazione`).

### Step 3: Structured Persistence in `NOTES.md` & Header ID Counter
1. Read `NOTES.md` (or create it using the canonical template in Section 3).
2. Compute the next sequential `NOTE-XXX` from `> **Ultimo ID Assegnato**: NOTE-XXX` (ensuring it is `>=` the highest ID in the file) and **immediately update the header counter**.
3. Append the new note block(s) at the end of `## 📥 Da Analizzare (Open)`.

### Step 4: Ultra-Compact Confirmation, `--remote` Option & Task Resumption
1. **Local Default (`0ms` Network)**: Save only in `NOTES.md` unless `--remote` is specified (or dictated from mobile via [`references/voice-intake-kit.md`](../../references/voice-intake-kit.md) as a `status:inbox` GitHub Issue).
2. Reply in 1–2 Italian lines: `Registrata [NOTE-XXX] in NOTES.md (analisi differita a /review-notes).`
3. IF an operational task was in progress, **immediately resume** its next step without waiting.

---

## 3. Canonical `NOTES.md` Template (Max `120` Lines)

```markdown
# Annotazioni & Pensieri in Corso d'Opera (NOTES)

Buffer di cattura rapida a zero cambio di contesto (`/take-note`). Le osservazioni qui raccolte non sono ancora state analizzate sul codice: utilizza `/review-notes` a lavorazione conclusa per mostrarle, eseguire il task di analisi approfondita e promuoverle in `DESIDERATA.md`.
> **Governance anti-bloat**: tetto massimo **120 righe**. La sezione *Analizzate & Consolidate* mantiene al massimo le **ultime 10 note chiuse** in formato tabellare a 1 riga (storico in `.agents/archive/NOTES_archive.md`).
> **Ultimo ID Assegnato**: NOTE-001

---

## 📥 Da Analizzare (Open)

### [NOTE-001] <Titolo sintetico max 8 parole>
- **Stato**: `📥 Da Analizzare`
- **Data Cattura**: YYYY-MM-DD HH:mm
- **Lavorazione Attiva al Momento della Nota**: <Nome Task 🟡 In Lavorazione oppure "Nessuna">
- **Ambito Presunto**: <Componente o vista citata, dedotta dal solo testo>
- **Testo Originale**:
  > <Testo verbatim dell'utente>

---

## ✅ Analizzate & Consolidate (Ultime 10 Risolte)

| ID | Titolo Sintetico | Data | Esito & Destinazione (<= 120 char) |
| :--- | :--- | :---: | :--- |
```

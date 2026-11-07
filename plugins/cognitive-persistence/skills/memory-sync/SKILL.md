---
name: memory-sync
description: >-
  Use this skill when the user runs /memory-sync or finishes a task to create the ADR,
  update MEMORY.md, WORKLOG.md, and DESIDERATA.md, and distill experience into L1-L3 rules/skills.
---

# Project Memory, Knowledge Persistence & Experience-to-Skill Runbook (`/memory-sync`)

## 1. Objective
Persist architectural decisions, lessons learned, and task state across sessions while distilling reusable cross-workspace patterns into `L1..L3` rules/skills (in Hybrid EN/IT format) and cleanly closing parallel Git Worktrees and remote Kanban cards. Always reply to the user in plain Italian.

---

## 2. End-of-Task Synchronization Pipeline

```text
[100% Tests Green + Worktree Diff Guard P0-ISO]
                │
                ▼
[1. Write ADR Fragment]  ──► Create full ADR in .agents/worklog.d/YYYY-MM-DD_<topic>.md
                │
                ▼
[2. WORKLOG Pointer]     ──► Prepend 4-5 line Pointer Record in WORKLOG.md (max 15 entries / <= 300 lines / <= 20 KB)
                │             + Rotate overflow to .agents/archive/WORKLOG_v<N>_archive.md
                ▼
[3. Sync MEMORY.md]      ──► Update in-place by domain (NEVER append numbered entries; <= 200 lines / <= 16 KB)
                │
                ▼
[3.5 Auto-Learn Skill]   ──► Distill reusable patterns into L3 (tests/probes), L2b (SKILL.md) or L2a (AGENTS.md)
                │             in Hybrid EN/IT format + run validate.mjs --all and npm run sync
                ▼
[4. Sync DESIDERATA/NOTES]──► Move feature to Completate (DESIDERATA <= 150 lines, cell <= 160 chars)
                │             + Close NOTE-XXX / GitHub Issue and tear down Git Worktree
                ▼
[5. User Report (IT)]    ──► Present summary, 1-line Auto-Apprendimento receipt, and verification guide
```

---

## 3. Document Formats & Anti-Bloat Governance

### A. Full ADR Fragment (`.agents/worklog.d/YYYY-MM-DD_<argomento>.md`) & `WORKLOG.md` Pointer Record
1. **Granular ADR (`.agents/worklog.d/YYYY-MM-DD_<argomento>.md`)**:
   ```markdown
   # [YYYY-MM-DD] ADR: Titolo dell'Intervento

   ## Contesto & Motivazione
   Descrizione sintetica del problema o requisito che ha reso necessario l'intervento.

   ## Decisioni Architetturali
   I pattern, le astrazioni o le modifiche strutturali adottate.

   ## Impatto e Conseguenze
   Moduli modificati, suite di test eseguite e comportamento verificato.
   ```
2. **Pointer Record in `WORKLOG.md` (NEVER paste full ADR — Max 4–5 lines per entry)**:
   ```markdown
   ## YYYY-MM-DD — Titolo Sintetico dell'Intervento
   - **Tipo**: <Ambito / Categoria>
   - **Dettagli**: [`.agents/worklog.d/YYYY-MM-DD_<argomento>.md`](file:///.agents/worklog.d/YYYY-MM-DD_<argomento>.md)
   - **Sintesi**:
     - 1–2 bullet asciutti con file chiave toccati e decisione tecnica principale.
   ```
3. **Rolling Window (`<= 15` entries / `<= 300` lines / `<= 20 KB`)**:
   - Keep `## Indice Sintetico delle Fasi Consolidate` at the top followed by the **last 10–15 Pointer Records**, rotating older entries to `.agents/archive/WORKLOG_v<N>_archive.md`.

### B. `MEMORY.md` Governance (In-Place by Domain, `<= 200` Lines / `<= 16 KB`)
1. **Relevance Filter**: Record only **non-obvious technical pitfalls**, **runtime quirks**, or **architectural invariants**.
2. **No Chronological Appends**: Update **5–8 stable domain sections in-place**, replacing superseded rules:
   ```markdown
   - **<Titolo Invariante / Componente>**:
     - *Insidia*: <1 riga: sintomo e causa radice tecnica>.
     - *Regola*: <1-2 righe: vincolo operativo obbligatorio e file/test di riferimento>.
   ```
3. **Automatic Experience-to-Skill Graduation (`Step 3.5: L1 -> L2 -> L3`)**:
   - **Project-specific (`L1` + local `L3`)**: Update `MEMORY.md` *in-place* **and** add a local invariant unit test.
   - **Cross-plugin (`L2b` / `L2a` / global `L3`)**: Update the target plugin in `plugins/` using the **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)**, keeping `AGENTS.md <= 6,000 B`, then run `node scripts/validate.mjs --all` and `npm run sync`.
   - Emit the 1-line Italian receipt: `Auto-Apprendimento Applicato: ... · Scrivi "annulla regola" per ripristinare`.

### C. `DESIDERATA.md` (`<= 150` lines) & `NOTES.md` (`<= 120` lines)
1. **Move Completed Feature**: Move row from *Backlog Attivo* to *Completate* with `🟢 Completato` and `Note <= 160` chars.
2. **Worktree Isolation (`[P0-ISO]`) & Note Closure**:
   - IF executed in a parallel Git Worktree, verify via `verifyWorktreeDiffIsolation` (`board-engine.mjs`) before merge.
   - IF closing `[NOTE-XXX]`, remove from `## 📥 Da Analizzare (Open)` and prepend 1 row to `## ✅ Analizzate & Consolidate (Ultime 10 Risolte)` (`<= 120` chars).

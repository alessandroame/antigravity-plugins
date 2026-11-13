# Cognitive Continuity, Project Memory & Skill Auto-Distillation (`cognitive-persistence`)

Governs in-flight note capture, ADRs, domain constraints, and cross-workspace experience distillation into `L1..L3` rules/skills. Always reply to the user in plain Italian.

## 1. Cognitive Architecture (3+1 Canonical Files & Line/Byte Ceilings)
1. **`NOTES.md` (In-Flight Buffer — Max `120` Lines)**:
   - Maintains `> **Ultimo ID Assegnato**: NOTE-XXX`. Section `## ✅ Analizzate & Consolidate` keeps at most the **last 10 closed notes** as single-line table rows (`<= 120` chars), rotating older ones to `.agents/archive/NOTES_archive.md`.
2. **`MEMORY.md` (Stable Domain Constraints — Max `200` Lines & `<= 16 KB`)**:
   - Records only architectural invariants and non-obvious runtime pitfalls. **Numbered chronological appends are FORBIDDEN**: organize into **5–8 stable domain sections** updated **in-place** (`- **<Titolo>**:` -> `*Insidia*` + `*Regola*`).
3. **`WORKLOG.md` (Rolling Window & Pointer Index — Max `300` Lines & `<= 20 KB`)**:
   - Full ADRs live in `.agents/worklog.d/YYYY-MM-DD_<topic>.md`. In `WORKLOG.md`, insert only a **4–5 line Pointer Record** keeping the **last 10–15 entries** after `## Indice Sintetico delle Fasi Consolidate`, rotating older entries to `.agents/archive/WORKLOG_v<N>_archive.md`.
4. **`DESIDERATA.md` (Feature Matrix — Max `150` Lines & Cells `<= 160` chars)**:
   - Split into `## 1. Backlog Attivo` (`🔴`/`⚪`/`🟡`) and `## 2. Funzionalità Completate` (`🟢`). Above 150 lines, archive to `.agents/archive/DESIDERATA_v<N>_archive.md`.

## 2. `/take-note`, `/review-notes`, `/memory-sync`, `/next-step` & `/handoff` Workflows
1. **`/take-note` Isolation**: Save verbatim in `NOTES.md` incrementing `NOTE-XXX`. **NEVER inspect source code (`read_file`, `grep`)** during `/take-note`: confirm in 1 Italian line and resume the active task.
2. **Read-Only `/review-notes`**: Inspect `📥 Da Analizzare` notes against real code and present the review card. During `/review-notes`, **NEVER modify code, `NOTES.md`, or `DESIDERATA.md` before explicit user confirmation (`ask_question`)** on promoting to `DESIDERATA.md`, keeping open in `NOTES.md`, archiving, or implementing.
3. **`/memory-sync` & Cross-Workspace Auto-Distillation (`L1..L3`)**: Create the ADR in `.agents/worklog.d/`, add the Pointer Record in `WORKLOG.md`, update `MEMORY.md` *in-place* (plus `DESIDERATA.md`/`NOTES.md`), and IF a reusable cross-workspace pattern emerged, update the canonical plugin in `plugins/` in Hybrid EN/IT format (`L3` test/probe, `L2b` `SKILL.md`, or `L2a` `AGENTS.md <= 6,000 B`) and run `node ~/.gemini/config/plugins/proactive-mentorship/scripts/session-miner.mjs --verify-and-sync`.
4. **`/next-step` Launch**: Scan `DESIDERATA.md`, read `MEMORY.md` and `WORKLOG.md`, switch target task to `🟡 In Lavorazione`, and update chat title (`set-chat-title.mjs`).
5. **`/handoff` Session Bridge**: Persist the active plan in `docs/PLAN_<ID>_<slug>.md` and `DESIDERATA.md`, stage **only** current-session files by explicit path (`git add <file1> <file2>` — NEVER `git add .`/`-A` so concurrent sessions stay untouched) and create an English Conventional Commit, recommend the next session's Thinking Mode (`Low` / `Medium` / `High`), and emit a copy-pasteable Italian prompt anchored with `@file` paths.

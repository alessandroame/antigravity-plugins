---
name: next-step
description: >-
  Use this skill when the user runs /next-step or asks to start the next planned task
  from DESIDERATA.md, extracting constraints from MEMORY.md and generating the operational briefing.
---

# Next Step: Task Launch & Conflict-Aware Kanban Dequeue Runbook (`/next-step`)

## 1. Objective
Provide a deterministic entry point at the start of a session or task: reconcile remote Kanban cards (`Fai Ora` / `! modulo: titolo`), compute conflict-aware parallel waves (`planExecutionWave` up to `maxWIP = 2`), inject constraints from `MEMORY.md`, and present an actionable Italian briefing.

---

## 2. Execution Pipeline

```text
[Invoke /next-step]
        │
        ▼
[Step 1: Sync Kanban & Wave] ──► gh-board-sync.mjs: reclaim locks >45m, pull Fai Ora (!), compute wave
        │
        ▼
[Step 2: Scan DESIDERATA.md] ──► Select 🟡 In Lavorazione or top 🔴 Prioritario / ⚪ Pianificato
        │
        ▼
[Step 3: Context Injection]  ──► Extract relevant invariants from MEMORY.md & WORKLOG.md
        │
        ▼
[Step 4: Briefing (IT)]      ──► Present Task Card + Wave Status + Constraints + Ready Prompt
        │
        ▼
[Step 5: State & Worktree]   ──► Update DESIDERATA.md (🔴/⚪ -> 🟡 In Lavorazione, cell <= 160 chars)
        │
        ▼
[Step 6: Chat Rename]        ──► Run set-chat-title.mjs --conversation-id "<id>" --title "<step>"
```

---

## 3. Agent Execution Steps

### Step 1: Remote Kanban Sync, Parallel Wave Planning & `DESIDERATA.md` Priority
1. **Reconcile Remote Queue (`gh-board-sync.mjs`)**:
   - Run `node plugins/cognitive-persistence/scripts/gh-board-sync.mjs` (or `node ~/.gemini/config/plugins/cognitive-persistence/scripts/gh-board-sync.mjs`).
   - Reclaims orphaned `🟡 In Lavorazione` locks older than **45m** (`reclaimStaleLocks` `[P1-LCK]`), imports trusted `status:ready` / `! modulo: titolo` GitHub Issues (`verifyTrustedTaskOrigin` `[P0-SEC]`), and computes `planExecutionWave` using `.agents/board-state.json` `verifiedTouchSet`.
   - Up to **2 disjoint tasks** can run in parallel Git Worktrees (`../<repo>-task-<id>`) with `gh-board-sync.mjs --link-deps <worktree-path>` (`[CRITICO-2]`); overlapping tasks are auto-serialized (`queuedBehind`).
2. **Read `DESIDERATA.md` (and check `NOTES.md`)**:
   - IF `NOTES.md` has open items under `📥 Da Analizzare`, include a non-blocking note in Italian: *"Promemoria: sono presenti N note aperte in `NOTES.md` (invoca `/review-notes` quando desideri analizzarle)."*
   - **Priority Order**:
     1. **Resume Active**: Any row in `🟡 In Lavorazione`.
     2. **Next Planned**: First row in `🔴 Prioritario` (or `⚪ Pianificato`) under `## 1. Backlog Attivo`.
     3. **Backlog Empty**: All rows `🟢 Completato` -> notify user and suggest `/review-notes` if open notes exist.

### Step 2: Cognitive Context Extraction (`MEMORY.md` & `WORKLOG.md`)
1. Read `MEMORY.md` and extract domain invariants impacting the target modules (flagging if `> 200` lines / `> 16 KB`).
2. Inspect the rolling window of `WORKLOG.md` for recent architectural context.

### Step 3: Operational Briefing (User-Facing in Italian)
Present in plain Italian:
1. **Scheda Desiderata Selezionato & Stato Coda Parallela**: Feature title, module, `Touch-Set` (`VERIFIED_BY_REVIEW` or `FAST_TRACK_SCOPE`), and any `serializedBehind` tasks.
2. **Vincoli e Regole Applicabili**: Key invariants from `MEMORY.md`.
3. **Prompt Esecutivo Ottimizzato**: Ready-to-run prompt with `@file` targets, acceptance criteria, and detected test command (`detectProjectTestCommand`).

### Step 4: State Transition & Chat Rename
1. Update the selected row in `DESIDERATA.md` to `🟡 In Lavorazione` (`Note <= 160` chars).
2. Rename the conversation title:
   ```bash
   node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --conversation-id "<Conversation ID>" --title "<Codice/Titolo Step>"
   ```
3. IF invoked without `--auto`, ask user confirmation to proceed; IF `--auto` or explicitly requested, execute immediately and close with `/memory-sync`.

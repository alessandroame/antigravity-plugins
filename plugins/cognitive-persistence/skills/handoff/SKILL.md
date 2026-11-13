---
name: handoff
description: >-
  Use this skill when the user runs /handoff or asks to save the current plan,
  commit session changes, recommend the thinking mode, and generate a ready-to-paste prompt for a new session.
---

# Session Handoff: Plan Persistence, Surgical Commit & Next-Session Prompt (`/handoff`)

## 1. Objective
Close a planning or multi-phase session cleanly so a fresh conversation can start with zero context loss. Persist any in-flight plan into the repository, commit **only** current-session files without touching concurrent sessions, select the optimal **Thinking Mode** (`Low`, `Medium`, `High`), and output a self-contained Italian prompt. Always reply to the user in plain Italian.

---

## 2. Execution Pipeline

```text
[Invoke /handoff]
        │
        ▼
[Step 1: Persist Plan]      ──► Copy artifact plan to docs/PLAN_<ID>_<slug>.md + register in DESIDERATA.md
        │
        ▼
[Step 2: Surgical Commit]   ──► Run targeted tests, stage ONLY session files by explicit path, git commit
        │
        ▼
[Step 3: Thinking Routing]  ──► Evaluate next-task complexity -> recommend Bassa / Media / Alta + rationale
        │
        ▼
[Step 4: Handoff Pack (IT)] ──► Emit saved plan link + commit SHA + Thinking Mode + fenced prompt block
```

---

## 3. Agent Execution Steps

### Step 1: Repository Plan Persistence & `DESIDERATA.md` Registration
1. **Locate Active Plan**:
   - IF an artifact plan exists in `<appDataDir>/brain/<conversation-id>/implementation_plan.md` (or a draft plan was agreed in chat) and is not yet saved in the workspace, write it to `docs/PLAN_<ID>_<Topic_Slug>.md` using repository-relative file paths (replacing any stale or non-existent filenames after checking disk).
   - Determine `<ID>` sequentially from existing `docs/PLAN_FEAT-*` files and `DESIDERATA.md` rows.
2. **Update `DESIDERATA.md` (When Present)**:
   - Add or update the corresponding row under `## 1. Backlog Attivo` (`⚪ Pianificato` or `🟡 In Lavorazione`), keeping every table cell `<= 160` characters and total file length `<= 150` lines.

### Step 2: Concurrent-Safe Verification & Surgical Git Commit
1. **Inspect Working Tree Before Staging**:
   - Run `git status --porcelain` and `git branch --show-current`.
   - Partition modified/untracked paths into **Current-Session Files** vs **Concurrent-Session Files** (files edited by other active windows/worktrees). **NEVER touch, revert, or stage files belonging to another concurrent session.**
2. **Targeted Pre-Commit Verification**:
   - Run the unit tests and static validators covering the files modified in the current session **after** the last `write_file` / `edit_file` call so delivery quality gates pass cleanly.
3. **Explicit-Path Staging & Conventional Commit**:
   - Stage files strictly by explicit path (`git add <path1> <path2> ...`). **`git add .`, `git add -A`, and `git commit -a` are FORBIDDEN.**
   - Verify `git diff --cached --name-status` contains exclusively current-session files, then commit with an English Conventional Commit message (`feat(<scope>): ...`, `docs(<scope>): ...`, `fix(<scope>): ...`).
   - IF on `main`/`master` and the user did not explicitly ask to commit, pause and confirm first; when `/handoff` (or *"salva il piano e fai commit"*) is explicitly requested by the user, execute the commit directly on the active branch.

### Step 3: Next-Session Thinking Mode Selection (`Bassa` / `Media` / `Alta`)
Classify the upcoming planned work across structural complexity axes (without hardcoded project rules):
- **`Bassa` (`Low` — `T1_INSTANT`)**: Mechanical cleanup, documentation, config tweaks, or single-file micro-edits (`<= 2` files, zero algorithmic or coordinate-frame coupling).
- **`Media` (`Medium` — `T2_BALANCED`)**: Standard feature implementation, UI layout/component work, REST/WebSocket wiring, or single-module bugfixes with straightforward unit tests (`2–4` files, single domain).
- **`Alta` (`High` — `T3_DEEP`)**: Multi-file architectural refactoring (`>= 4` files), 3D/physics/math sign invariants across multiple coordinate frames, concurrency/lock-free state machines, or strict binary/geometric continuity constraints.

### Step 4: Handoff Delivery Format (User-Facing in Italian)
Reply concisely in plain Italian with these 3 elements:
1. **Stato Salvataggio & Commit**: Clickable link to `docs/PLAN_<ID>_<Slug>.md`, updated `DESIDERATA.md` entry, active branch name, and short Git commit hash (noting if unrelated dirty files from other sessions were left untouched).
2. **Modalità di Pensiero Consigliata**: State clearly **`Alta (High)`**, **`Media (Medium)`**, or **`Bassa (Low)`** with 1–2 plain-Italian sentences explaining the concrete technical reason for that choice on the next task.
3. **Prompt Pronto da Incollare**: Provide a single copy-pasteable `text` fenced code block containing:
   - Explicit `@docs/PLAN_<ID>_<Slug>.md` and target `@file` anchors in execution order;
   - Non-negotiable domain constraints extracted from `MEMORY.md` / `AGENTS.md`;
   - Exact verification commands and acceptance gates required before closing the next session.

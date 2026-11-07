---
name: worktree-lifecycle
description: >-
  Use this skill when initializing isolated Git Worktrees to prevent branch collisions
  across concurrent agent sessions, verify repository state, and perform clean teardown.
---

# Git Worktree Lifecycle Runbook

## 1. Purpose
Prevent branch-switching collisions across concurrent Antigravity sessions by isolating each feature branch in its own sibling directory via `git worktree`. Always reply to the user in plain Italian.

---

## 2. Operational Sequence

### Step 1: Pre-Flight Guard
Verify the repository has no conflicting untracked or uncommitted changes:
```bash
git status --porcelain
```
IF uncommitted user changes exist, ask the user before proceeding.

### Step 2: Worktree Creation
Create an isolated sibling directory for the feature branch:
```bash
git worktree add ../<repo>-<feature-name> -b feature/<feature-name>
```
Direct all subsequent file reads, edits, and commands to `../<repo>-<feature-name>`.

### Step 3: Implementation & Verification
1. Implement the required changes inside the worktree.
2. Run the full test and validation suite inside the worktree.
3. Present the Italian summary and verification commands/URLs to the user.

### Step 4: Consolidation & Surgical Commit (Post-Approval)
Once explicit user approval is obtained:
1. Stage only the relevant files by explicit path:
   ```bash
   git add <file1> <file2>
   git commit -m "feat(<scope>): <Conventional Commits description>"
   ```
2. Merge back into the main repository directory:
   ```bash
   git checkout main
   git merge feature/<feature-name>
   ```

### Step 5: Clean Teardown
Remove the worktree and delete the merged branch:
```bash
git worktree remove ../<repo>-<feature-name>
git branch -d feature/<feature-name>
```

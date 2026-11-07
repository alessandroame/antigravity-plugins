# Engineering Standards: Version Control, Trace Debugging & Shift-Left Governance (`engineering-workflow`)

Defines standards for surgical version control, deterministic fault localization, headless core isolation, adversarial `git diff` review, and mechanical delivery verification. Always reply to the user in plain Italian.

## 1. Version Control Governance (Git Pro)
1. **Surgical Staging (`git add .` / `git add -A` / `git commit -a` are FORBIDDEN)**: Stage files by explicit path and verify `git status --porcelain` and `git diff --cached` before committing.
2. **Conventional Commits in English**: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`, `test(scope): ...`, `docs(scope): ...`, `chore(scope): ...`. NEVER commit/merge to the main branch without user confirmation; use Git Worktrees for concurrent tasks.

## 2. Trace Debugging, English in Code & Headless Architecture
1. **Deterministic Trace Debugging**: Guessing is FORBIDDEN; inject numbered `[DEBUG-TRACE #X]` checkpoints along the causal chain (Entry -> Guard -> Compute -> State -> Render) and remove them before delivery.
2. **English-Only Code**: Identifiers, comments, JSDoc, tests (`describe`/`it`), and internal logs MUST be in English (UI copy follows product language).
3. **Headless Core (`core/` or `src/core/`)**: Zero references to `window`, `document`, `HTMLElement`, `navigator`, or CSS selectors (`100%` runnable in pure Node.js); inject `storageAdapter` (`createInMemoryStorageAdapter` in tests, `createLocalStorageAdapter` in UI).

## 3. The 5 Shift-Left Quality Gates & Review-Fatigue Guards
1. **Gate 1 (Pre-Design UX)**: Zero redundant controls, touch targets `>= 48px`, `white-space: nowrap` on `value + unit`, and WCAG AA/AAA contrast.
2. **Gate 2 (In-Flight Rigor)**: Headless core isolation, single reactive store (SSOT), and English in code.
3. **Gate 3 (Auto-Discovered Test Suite, Test Integrity & `L3` Diff Triage)**:
   - Run `npm test` (auto-discovering all `*.test.*`; partial hardcoded lists are FORBIDDEN). For every fix on physics, 3D camera, smoothing, or domain math, add an invariant unit test in the same turn.
   - **No Test Tampering**: NEVER delete or weaken pre-existing assertions in `tests/` during an app fix without user consent. On multi-file patches, run `node ~/.gemini/config/plugins/engineering-workflow/scripts/diff-triage.mjs` (or `/review-diff` with `Blind Diff Critic`) to block tampered/faux tests and highlight high-risk lines.
4. **Gate 4 (Browser Probe, Multi-Viewport Runner & Live User Flow)**:
   - For every UI edit (`.html`, `.css`, `ui/`), verify mobile (`360x800`) and desktop/embedded (`1280x800` / `800x480`) via `node ~/.gemini/config/plugins/engineering-workflow/scripts/ui-smoke-runner.mjs` (`.agents/smoke-flows.json`) or `~/.gemini/config/plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js`: `0` horizontal overflow, `0` covered controls (`elementFromPoint`), `0` clipped text, touch targets `>= 44px`, free canvas `>= 60%`, and at least **1 flow (`Prima -> Click/Input -> Dopo`)** with `0` console errors.
5. **Gate 5 (Transcript-Verified `Stop` Hook & 4-Measure Receipt)**:
   - The `Stop` hook (`~/.gemini/config/plugins/engineering-workflow/scripts/delivery-gate-hook.mjs`) checks `transcript.jsonl` to ensure tests and UI probes ran **after** the last `edit_file`/`write_file`, reopening the turn (`decision: "continue"`, 1-retry circuit breaker) on unverified late edits.
   - At `L0` show max 3–5 Italian bullets; inside `<details>` attach the **Ricevuta Oggettiva a 4 Misure** (apply **0 changes** if already compliant per Occam's Razor): (1) free screen `%` (`>= 60%`), (2) typographic scale + `nowrap`, (3) probe JSON (`violations: 0`), (4) `Prima -> Click -> Dopo` flow.

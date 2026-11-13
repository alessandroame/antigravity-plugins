---
name: model-router
description: >-
  Use this skill when the user invokes /model-router or asks to inspect, simulate,
  or calibrate the 6-archetype Prompt-to-Model LUT (LOW, MEDIUM, HIGH) and auto-discovered Gemini/Orchestrator models.
---

# Adaptive Model, Mode & LUT Router Runbook (`/model-router`)

## Step 1 — Operational Goal

Classify every user prompt in `< 0.5 ms` across the 6-archetype LUT (`R1_MECHANICAL_OPS` .. `R6_DEEP_ARCH_TRADEOFF`), maintain the Gemini/Orchestrator capability registry (`~/.gemini/antigravity/analytics/model-capabilities.json`), and perform one-time official-documentation calibration whenever the available model roster changes. Always reply to the user in plain Italian.

---

## Step 2 — CLI Execution Modes

When the user invokes `/model-router` (or when `[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE]` triggers), run [`model-router.mjs`](../../scripts/model-router.mjs):

1. **Inspect the 6-Archetype Calibrated LUT (`/model-router --lut` or `/model-router`)**:
   ```bash
   node plugins/adaptive-router/scripts/model-router.mjs --lut
   ```
   Renders the calibrated roles of the 6 Gemini/Orchestrator UI families (`Gemini 4 Carbon`, `Gemini 4 Argon`, `Gemini 4 Hydrogen`, `Orchestrator (Carbon)`, `Orchestrator (Argon)`, `Gemini 3.8 Flash`) and the `R1..R6` Prompt-to-Model+Mode matrix.

2. **Inspect Empirical Registry & Harness Watchdog (`/model-router --status`)**:
   ```bash
   node plugins/adaptive-router/scripts/model-router.mjs --status
   ```
   Displays registered model variants, explicit mode locks, sample counts, average turn duration, and `PreInvocation` contract hash status (`NOTE-004`).

3. **Sync Live Runtime Roster & Apply Official-Docs Calibration (`una tantum`)**:
   - Call `swarm{action:"models"}` to obtain `{ models, display_names, quotas }`.
   - Sync the Gemini UI roster (`providerFilter: 'gemini-ui'`):
     ```bash
     node plugins/adaptive-router/scripts/model-router.mjs --sync-swarm-models <swarm-json-file>
     ```
   - If `uncalibratedFamilies` is non-empty, consult official Google/Antigravity documentation (`gemini_search_docs` MCP and `search_web` on `antigravity.google` / `blog.google`) once to determine each new family's architectural role (`FAST_EXECUTION`, `EFFICIENT_CODING`, `FRONTIER_HEAVYWEIGHT`, `DYNAMIC_ORCHESTRATOR`), then persist:
     ```bash
     node plugins/adaptive-router/scripts/model-router.mjs --apply-calibration <calibration-json-file>
     ```

4. **Simulate Prompt Routing & Session Snooze**:
   ```bash
   node plugins/adaptive-router/scripts/model-router.mjs --prompt "<prompt text>" --ui-model "<active-model>"
   node plugins/adaptive-router/scripts/model-router.mjs --snooze-session "<conversationId>"
   ```

---

## Step 3 — 6-Archetype LUT & Anti-Noise Guarantees

1. **`R1_MECHANICAL_OPS` (`LOW`)**: Git, test runners, `/memory-sync`, `"sì"`, `"procedi"` -> `Gemini 4 Hydrogen (Low)`, `switchAction: 'NONE'` (`0` popups even on `Carbon (High)`).
2. **`R2_QUICK_LOOKUP_MICROEDIT` (`LOW`)**: File lookups, typos, renames -> `Gemini 4 Hydrogen (Low)` (`0-click` `user_markdown` hint only after `>= 2` consecutive turns on `High`).
3. **`R3_CODE_INSPECTION` (`MEDIUM`)**: `/how-its-made`, read-only flow explanations -> `Gemini 4 Hydrogen (Medium)` (alt `Gemini 4 Argon (Low)`).
4. **`R4_SINGLE_MODULE_DEV` (`MEDIUM`)**: Feature, bugfix, or unit test in `1–2` files -> `Gemini 4 Argon (Medium)` (1-click subagent `self` / `flash` if UI is stuck on `Low`).
5. **`R5_MULTI_FILE_REFACTOR` (`HIGH`)**: Multi-file refactoring (`>= 3` files) -> `Orchestrator (Carbon)` (alt `Gemini 4 Argon (High)`, 1-click subagent `self` / `pro`).
6. **`R6_DEEP_ARCH_TRADEOFF` (`HIGH`)**: Audits, architectural plans, multi-domain trade-offs -> `Gemini 4 Carbon (High)` (alt `Gemini 4 Hydrogen (XHigh)`, 1-click subagent `research` / `pro`).

---

## Step 4 — Semantic Drill-Down Presentation (`L0 -> L1`)

Present `/model-router` output in plain Italian starting at `L0` with calibration status and active model alignment, placing the full `R1..R6` LUT matrix and empirical telemetry inside closed `<details>` drawers (`L1`/`L2`) with a mandatory blank line after `</summary>`.

# Adaptive Model & Effort Routing Protocol (`adaptive-router`)

Governs dynamic cognitive profile assignment (`LOW`, `MEDIUM`, `HIGH`), operational effort budget on every turn, and future-proof model auto-discovery. Always communicate with the user in plain Italian.

## 1. Native Subagent Model Inheritance (`Model: 'inherit'`)
To guarantee full consistency between the UI settings chosen by the user and background tasks, subagent model routing follows the native Antigravity baseline:
1. **Always Default to `Model: 'inherit'`**: Subagents MUST inherit the exact model and reasoning mode selected in the UI (`Model: 'inherit'`). Never downscale subagents automatically to `flash` or `flash_lite` based on prompt heuristics, preserving the user's active reasoning depth (`Low`, `Medium`, `High`).
2. **Explicit Override Only**: Select an alternative model (`flash_lite`, `flash`, `pro`) ONLY when the user explicitly requests it in the prompt (e.g. *"con subagent veloci"*, *"usa flash per i subagent"*).
3. **Turn-Level Operational Budget**:
   - `LOW` Tier (`T1_INSTANT`): mechanical operations (`git`, `npm test`, `/memory-sync`, `commit e push`) -> `0` subagents, consolidated single-step execution.
   - `MEDIUM` Tier (`T2_BALANCED`): single-module edits, structured explanations (`/how-its-made`) -> max `4` tool turns.
   - `HIGH` Tier (`T3_DEEP`): multi-file refactoring, architectural trade-offs -> deep analysis with `skizzo` / subagents running on inherited UI model.

## 2. Future-Proof Auto-Discovery & UI Alignment
1. **Continuous Passive Discovery (`Stop` Hook)**: `router-stop-hook.mjs` detects newly released models and modes from `<USER_SETTINGS_CHANGE>` and `PLANNER_RESPONSE` records in `transcript.jsonl`, classifying them at Day 0 via lexical family inference (`lite/mini/haiku` -> `LOW`, `flash/sonnet` -> `MEDIUM`, `pro/ultra/opus/thinking` -> `HIGH`) and empirically self-calibrating after `>= 5` real turns.
2. **Discreet Mismatch Advisory**: when the user invokes `/model-router` or requests an efficiency audit, report any mismatch between the active UI model and task complexity (`OVERPROVISIONED_UI_MODEL` or `UNDERPROVISIONED_UI_MODEL`).

# Adaptive Model & Effort Routing Protocol (`adaptive-router`)

Governs dynamic cognitive profile assignment (`LOW`, `MEDIUM`, `HIGH`), subagent model selection (`flash_lite`, `flash`, `pro`, `inherit`), and operational effort budget on every turn, automatically adapting to newly released models and modes. Always communicate with the user in plain Italian.

## 1. User-Authorized Dynamic Subagent Model Routing (`invoke_subagent`)
With this plugin enabled, the user explicitly authorizes selecting the `Model` parameter of `invoke_subagent` according to the prompt tier instead of defaulting exclusively to `inherit`:
1. **`LOW` Tier (`T1_INSTANT` — Effort `low`)**:
   - **Trigger**: mechanical operations (`git`, `npm test`, `/memory-sync`), surgical single-file micro-edits (`<= 14` words), and quick lookups.
   - **Action**: `0` subagents (or `Model: 'flash_lite'` if strictly required), max `2` tool turns, direct concise execution.
2. **`MEDIUM` Tier (`T2_BALANCED` — Effort `medium`)**:
   - **Trigger**: structured code explanations (`/how-its-made`), single-module bugfixes, features, or unit tests without cross-domain conflicts (`score 2..3`).
   - **Action**: direct execution or subagent delegation with `Model: 'flash'`, max `4` tool turns, and targeted module verification.
3. **`HIGH` Tier (`T3_DEEP` — Effort `high`)**:
   - **Trigger**: architectural design, multi-file refactoring, race conditions, or multi-perspective trade-offs (`score >= 4`).
   - **Action**: delegate deep analysis or design tasks to subagents with `Model: 'pro'` (with automatic circuit-breaker fallback to `'inherit'` if a tier is marked inactive in `model-capabilities.json`).

## 2. Future-Proof Auto-Discovery & UI Alignment
1. **Continuous Passive Discovery (`Stop` Hook)**: `router-stop-hook.mjs` detects newly released models and modes from `<USER_SETTINGS_CHANGE>` and `PLANNER_RESPONSE` records in `transcript.jsonl`, classifying them at Day 0 via lexical family inference (`lite/mini/haiku` -> `LOW`, `flash/sonnet` -> `MEDIUM`, `pro/ultra/opus/thinking` -> `HIGH`) and empirically self-calibrating after `>= 5` real turns.
2. **Discreet Mismatch Advisory**: when the user invokes `/model-router` or requests an efficiency audit, report any mismatch between the active UI model and task complexity (`OVERPROVISIONED_UI_MODEL` or `UNDERPROVISIONED_UI_MODEL`).

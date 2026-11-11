---
name: model-router
description: >-
  Use this skill when the user invokes /model-router or asks to inspect, simulate,
  or calibrate model and effort routing (LOW, MEDIUM, HIGH) and auto-discovered AI models.
---

# Adaptive Model & Effort Router Runbook (`/model-router`)

## Step 1 — Operational Goal

Select the optimal cognitive profile (`T1_INSTANT / LOW`, `T2_BALANCED / MEDIUM`, `T3_DEEP / HIGH`) in `< 0.5 ms` for each user request and maintain the autonomous capability registry (`~/.gemini/antigravity/analytics/model-capabilities.json`). Always reply to the user in plain Italian.

---

## Step 2 — CLI Execution Modes

When the user invokes `/model-router` (or asks to inspect or configure model and effort routing), run [`model-router.mjs`](../../scripts/model-router.mjs):

1. **Inspect Capability Registry (`/model-router --status`)**:
   ```bash
   node plugins/adaptive-router/scripts/model-router.mjs --status
   ```
   Displays registered models, assigned cognitive tier (`LOW / MEDIUM / HIGH`), discovery source (`seed` vs `auto-discovered`), and empirical metrics.

2. **Scan Brain Transcripts & Auto-Discover Models (`/model-router --scan`)**:
   ```bash
   node plugins/adaptive-router/scripts/model-router.mjs --scan
   ```
   Scans `transcript.jsonl` files in `~/.gemini/antigravity/brain/`, extracts newly selected UI models or modes from `<USER_SETTINGS_CHANGE>`, checks Antigravity built-in `.checksum` drift, and recalibrates empirical thresholds.

3. **Simulate Prompt Routing (`/model-router "<prompt>"`)**:
   ```bash
   node plugins/adaptive-router/scripts/model-router.mjs --prompt "<prompt text>" --ui-model "<active-model>"
   ```
   Returns JSON with the selected profile (`tier`, `effort`, `subagentModel`, `maxToolTurns`, `recommendedSubagents`) and any UI model mismatch (`OVERPROVISIONED_UI_MODEL` or `UNDERPROVISIONED_UI_MODEL`).

---

## Step 3 — Three-Stage Future-Proofing Pipeline

1. **Stage 1 — Day-Zero Lexical Inference (`inferModelCapability`)**:
   - Classifies unknown model names immediately by family tokens:
     - `lite | nano | mini | haiku | instant | fast` -> **`LOW` (`effort: low`)**
     - `flash | sonnet | standard | balanced` -> **`MEDIUM` (`effort: medium`)**
     - `pro | ultra | opus | thinking | deep | max | reasoner` -> **`HIGH` (`effort: high`)**
     - Opaque codename -> **`MEDIUM` (safe `fallback`)**.
2. **Stage 2 — Empirical Self-Calibration (`>= 5` samples)**:
   - Once at least `5` turns are observed in transcripts, promotes or demotes the model tier based on real average duration (`avgDurationMs`), output volume (`avgOutputTokens`), and tool error rate (`errorRate`).
3. **Stage 3 — Subagent Circuit Breaker (`resolveSafeSubagentModel`)**:
   - If a subagent tier is deprecated or unavailable, automatically falls back to `Model: 'inherit'` with zero runtime errors.

---

## Step 4 — Semantic Drill-Down Presentation (`L0 -> L1`)

Present results in plain Italian starting at `L0` with a concise summary table of active models and routing decisions, placing empirical telemetry and diagnostic signals inside a `<details>` drawer (`L1`) with a mandatory blank line after `</summary>`.

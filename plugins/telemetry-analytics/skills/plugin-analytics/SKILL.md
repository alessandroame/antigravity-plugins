---
name: plugin-analytics
description: >-
  Use this skill when the user runs /plugin-analytics or asks for Antigravity usage stats,
  per-prompt token reports, active time, model/plugin breakdowns, and interactive HTML dashboards.
---

# Antigravity Personal Usage Monitor, Per-Prompt Token Report & Telemetry Analytics (`/plugin-analytics`)

 Incrementally mines local sessions in `~/.gemini/antigravity/brain/` (`transcript.jsonl`) and merges them with `metrics-summary.json` to generate per-prompt token reports (`Prompt #1..#N`), a structured Italian chat summary, and an interactive HTML Dashboard (`<agent-embed>`). Always reply to the user in plain Italian.

---

## 1. Activation Triggers
- User asks to inspect Antigravity usage (*"mostrami il mio utilizzo di Antigravity"*, *"quanti token ho consumato per ogni prompt?"*, *"quante ore/sessioni ho fatto?"*).
- User requests plugin/skill stats, token/cache breakdowns, or ETA calibration.
- Invoked via `/plugin-analytics`.

---

## 2. Step-by-Step Execution Procedure

1. **Run Backfill + Per-Prompt Token Report & HTML Dashboard**:
   Execute `report.mjs` via `run_command` (`WaitMsBeforeAsync: 10000`) passing `--global`, `--session <conversation_id>`, and `--html` pointing to `<artifact_dir>/antigravity-usage-dashboard.html`:

   ```bash
   node ~/.gemini/config/plugins/telemetry-analytics/scripts/report.mjs --global --session "<conversation_id>" --html "<artifact_dir>/antigravity-usage-dashboard.html"
   ```

   Supported flags:
   - Filter last `N` days: `--days 7` or `--days 30`
   - Inspect specific session prompts: `--session <partial-or-full-id>`
   - Current workspace only: omit `--global`
   - Force full rebuild ignoring cache: `--rebuild`

2. **Embed Interactive Dashboard (`<agent-embed>`)**:
   - `<artifact_dir>/antigravity-usage-dashboard.html` provides period/project filters and 5 tabs (`Tempi & Abitudini`, `Token & Modelli`, `Token per Prompt`, `Workflow & Plugin`, `Storico Sessioni`).
   - Embed in the reply (following built-in `generative_ui` constraints):
     ```html
     <agent-embed src="file:///<artifact_dir>/antigravity-usage-dashboard.html"></agent-embed>
     ```

3. **Chat Presentation (`0-Click` + `<details>` `1-Click` in Italian)**:
   - **Level 0-Click**: 3–5 concise Italian bullets with top KPIs (Human vs subagent sessions, Net active time & peak hour, Tokens + Cache Hit %, Active session Per-Prompt Token summary).
   - **Level 1-Click**: Wrap detailed tables (`Prompt #1..#N` table, Project Breakdown, Plugins/Skills, Tools) inside a closed `<details>` drawer with a mandatory blank line after `</summary>`.

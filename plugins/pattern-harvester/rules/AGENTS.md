# Periodic Pattern Discovery & Guided Automation Protocol (`pattern-harvester`)

Governs non-intrusive periodic mining of human work sessions (`transcript.jsonl`) to discover recurring high-ROI workflows and synthesize **Skills (`L2b`)**, **Rules/Guards (`L2a`/`L3`)**, or **Plugins** without duplicates. Always reply to the user in plain Italian.

## 1. Silent Cadence, Triggers & Anti-Collision (`0 bytes` When Idle)
1. **Passive Background (`Stop` Hook)**: `periodic-harvester-hook.mjs` runs every **`5` human sessions** (or **`24h`**) via detached `pattern-harvester.mjs --incremental --quiet`, saving candidates passing both the **ROI Filter (`>= 120s` over 15 sessions)** and **4-Tier Anti-Collision Gate (`overlap < 0.75`)** in `~/.gemini/antigravity/analytics/pattern-recommendations.json`. Emit **`0 bytes`** when no candidate qualifies.
2. **Explicit & Review Triggers**: On `/pattern-harvester` (or during `/memory-sync` and `/review-notes` when unreviewed recommendations exist), run `node ~/.gemini/config/plugins/pattern-harvester/scripts/pattern-harvester.mjs` and load skill `pattern-harvester` for the 5-way ROI matrix (`IGNORE`, `RULE_OR_GUARD`, `SKILL_EXTENSION`, `NEW_SKILL`, `NEW_PLUGIN`) and `--scaffold` / `--dismiss` (`30-day` cooldown) commands.
3. **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)**: Every scaffolded `L2a` rule, `L2b` skill, or `L2c` subagent MUST put imperative logic in English and user-facing templates, `<summary>`, `ask_question`, and triggers in Italian.

## 2. Chat Presentation (`[Plugin: pattern-harvester]`)
1. **Level 0-Click (`<= 12` lines)**: Always open with `[Plugin: pattern-harvester]` (in prose and any `ask_question`), state analyzed human sessions, and list at most the **top 3 candidates** with workflow name, plain-Italian rationale, classification, and net saved seconds.
2. **Level 1-Click (`<details>`)**: Wrap the 4-column table (`# Pattern & Frequenza | Sequenza / Scheletro | Destinazione | ROI Netto`) and scaffold draft inside `<details><summary><strong>Analisi Pattern Ricorrenti, Matrice ROI e Bozza Scaffold (Espandi)</strong></summary>` per `engineering-sobriety`.

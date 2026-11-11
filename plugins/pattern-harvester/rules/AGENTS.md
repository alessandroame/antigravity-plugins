# Periodic Pattern Discovery & Guided Automation Protocol (`pattern-harvester`)

Governs non-intrusive periodic mining of human work sessions (`transcript.jsonl`, tool-call chains, CLI skeletons, and interaction archetypes) to discover recurring high-ROI workflows and synthesize **Skills (`L2b`)**, **Rules/Guards (`L2a`/`L3`)**, or **Plugins** without duplicates or low-yield micro-automations. Always reply to the user in plain Italian.

## 1. Silent Periodic Cadence & Triggers (`/pattern-harvester`)
1. **Passive Background Monitoring (`Stop` Hook)**:
   - `periodic-harvester-hook.mjs` checks `~/.gemini/antigravity/analytics/pattern-harvester-state.json` at turn end (`< 5ms`, `stdout: "{}\n"`).
   - Every **`5` new human sessions** (or every **`24` hours**), it spawns detached `pattern-harvester.mjs --incremental --quiet`, saving validated candidates in `~/.gemini/antigravity/analytics/pattern-recommendations.json`.
   - **Default Silence (`0 bytes`)**: IF no pattern passes both the **ROI Filter (`>= 120s`)** and the **Anti-Collision Gate**, emit zero chat output.
2. **Explicit Invocation & Periodic Review**:
   - When the user invokes `/pattern-harvester` (or asks which recurring patterns can be automated), or during `/memory-sync` and `/review-notes` when unreviewed high-ROI recommendations exist, run `node ~/.gemini/config/plugins/pattern-harvester/scripts/pattern-harvester.mjs`.

## 2. Structural Abstraction, Anti-Overfitting & Hybrid Language Standard
1. **3 Deterministic Extraction Channels (`core/harvester-engine.mjs`)**:
   - **RLE Tool-Chain N-Grams (`TOOL_CHAIN`)**: Compresses contiguous identical tool calls (`READ:FILE+ -> EDIT:FILE+ -> EXEC:TEST -> EXEC:VALIDATE -> EXEC:SYNC`) and extracts recurring operational `3..5-grams` across distinct sessions.
   - **CLI Structural Skeletons (`CLI_SEQUENCE`)**: Normalizes `run_command` by replacing paths, UUIDs, strings, and numbers with placeholders (`<dir>/script.mjs`, `<path>`, `<str>`, `<num>`).
   - **Lexical Archetypes & Jaccard Shingles (`INTERACTION_ARCHETYPE`)**: Clusters user requests by Jaccard similarity (`>= 0.35`) over tokens and 2-shingles without hardcoded example regexes.
2. **4-Tier Anti-Collision Gate (`evaluateCatalogOverlap`)**:
   - Compares every candidate against built-in skills, catalog plugins (`~/.gemini/config/plugins/*`), global skills (`~/.gemini/config/skills/`), and workspace skills (`.agents/skills/`).
   - IF overlap `>= 0.75` (or the skill was already invoked without extra manual steps), mark `ALREADY_COVERED` and discard. Dismissed patterns (`--dismiss <patternId>`) enter a `30-day` cooldown.
3. **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)**: Every newly generated or scaffolded `L2a` rule (`rules/*.md`), `L2b` skill (`SKILL.md`), or `L2c` subagent (`agents/*.md`) MUST be produced natively in Hybrid EN/IT format (imperative logic and steps in English; user-facing templates, `<summary>` titles, `ask_question` options, and trigger keywords in Italian).

## 3. 5-Way ROI Decision Matrix (`T_saved = Expected_Occurrences * Saved_Seconds - 40s_setup` over 15 sessions)
- **`IGNORE` (`0 bytes`)**: `< 3` occurrences, `< 2` distinct sessions, `T_saved < 120s`, or `ALREADY_COVERED`.
- **`RULE_OR_GUARD` (`L2a` / `L3`)**: Repeated invariant/style correction in `>= 2` sessions -> rule in `rules/AGENTS.md` (`<= 6,000 B`) or static guard in `validate.mjs`.
- **`SKILL_EXTENSION` (`L2b + L3`)**: Partial overlap (`0.45..0.74`) or `>= 3` manual steps systematically executed after an existing skill -> extend skill *in-place* or add `scripts/` helper.
- **`NEW_SKILL` (`L2b On-Demand Runbook`)**: Sequential procedure with `>= 3` occurrences across `>= 2` sessions and `T_saved >= 120s` -> new `skills/<slug>/SKILL.md` (`<= 200` lines).
- **`NEW_PLUGIN` (`Multi-Component Bundle`)**: Autonomous domain with `>= 4` occurrences across `>= 3` sessions and `T_saved >= 240s` requiring `>= 2` components among rules, multiple skills, hooks, or scripts -> new `plugins/<slug>/`.

## 4. Presentation Format (`0-Click` + `<details>` `1-Click` in Italian)
1. **Level `0-Click` (`<= 12` lines)**: Show analyzed human session count and at most the **top 3 candidates** ranked by ROI with fingerprint, classification (`NEW_SKILL`, `SKILL_EXTENSION`, `NEW_PLUGIN`), and net saved seconds.
2. **Level `1-Click` (`<details>`)**: Wrap the 4-column table (`# Pattern & Frequenza | Sequenza / Scheletro | Destinazione | ROI Netto`) and `--scaffold <patternId>` draft inside `<details><summary><strong>Analisi Pattern Ricorrenti, Matrice ROI e Bozza Scaffold (Espandi)</strong></summary>` followed by a **mandatory blank line**.

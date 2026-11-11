---
name: pattern-harvester
description: >-
  Use this skill when the user invokes /pattern-harvester to scan work sessions and user-agent
  interactions for high-ROI recurring patterns and scaffold them into Skills, Rules, or Plugins.
---

# Pattern Harvester & Automation Advisor (`/pattern-harvester`)

Operational runbook to mine real work sessions (`transcript.jsonl`), detect recurring operational chains or manual interactions, filter catalog collisions, and scaffold new **Skills (`L2b`)**, **Extensions (`L3`)**, or **Plugins** in Hybrid EN/IT format. Always reply to the user in plain Italian.

---

## Step 1 — Run Incremental Scanner

1. Run the CLI analyzer on recent human conversations (default: last `14` days, up to `40` human sessions, excluding subagents at step 0):
   ```bash
   node ~/.gemini/config/plugins/pattern-harvester/scripts/pattern-harvester.mjs
   ```
2. For structured JSON output (to inspect granular metrics or sub-threshold patterns):
   ```bash
   node ~/.gemini/config/plugins/pattern-harvester/scripts/pattern-harvester.mjs --json
   ```

---

## Step 2 — Interpret ROI Decision Matrix & Anti-Collision Gate

See [`references/pattern-mining-methodology.md`](./references/pattern-mining-methodology.md) for full KLM/GOMS formulas. Every pattern detected across the 3 channels (`TOOL_CHAIN`, `CLI_SEQUENCE`, `INTERACTION_ARCHETYPE`) is routed to 1 of 5 outcomes:

1. **`IGNORE`**: `< 3` occurrences, `< 2` distinct sessions, net savings `< 120s` over 15 sessions (after `40s` setup cost), or overlap `>= 0.75` with an installed skill/plugin.
2. **`RULE_OR_GUARD` (`L2a` / `L3`)**: Repeated invariant/style correction across `>= 2` sessions -> encode as a static guard in `scripts/validate.mjs` or a rule in `rules/AGENTS.md` (Hybrid EN/IT).
3. **`SKILL_EXTENSION` (`L2b + L3`)**: Overlap `0.45..0.74` with an existing skill or `>= 3` manual steps systematically executed after a skill -> extend the skill or add a `scripts/` helper.
4. **`NEW_SKILL` (`L2b`)**: Multi-step procedure with `>= 3` occurrences across `>= 2` sessions and net savings `>= 120s` -> create a new `SKILL.md` (`<= 200` lines) in Hybrid EN/IT format.
5. **`NEW_PLUGIN`**: Multi-component domain with `>= 4` occurrences across `>= 3` sessions and net savings `>= 240s` requiring hooks, permanent rules, and dedicated scripts.

---

## Step 3 — Generate Pre-Validated Scaffold (`--scaffold`) or Dismiss (`--dismiss`)

1. **Generate Ready-to-Use Hybrid EN/IT Draft**:
   To generate files compliant with `scripts/validate.mjs` (`description` `80–250` chars with `>-`, `Use this skill when...`, zero unquoted inline `: `, Hybrid EN/IT body):
   ```bash
   node ~/.gemini/config/plugins/pattern-harvester/scripts/pattern-harvester.mjs --scaffold <patternId> --slug <kebab-case-name>
   ```
2. **Dismiss Unwanted Patterns (30-Day Cooldown)**:
   ```bash
   node ~/.gemini/config/plugins/pattern-harvester/scripts/pattern-harvester.mjs --dismiss <patternId>
   ```

---

## Step 4 — Chat Presentation (in Italian) & Catalog Sync

1. Show at **Level 0-Click** (max `3–5` Italian bullets) only promoted candidates with estimated net saved seconds.
2. Place the 4-column table (`# Pattern & Frequenza | Sequenza / Scheletro | Destinazione | ROI Netto`) and scaffold draft inside `<details>` (**Level 1-Click**, with a mandatory blank line after `</summary>`).
3. After user confirmation and writing files to the canonical `antigravity-plugins` repository, run verification and global sync:
   ```bash
   node ~/.gemini/config/plugins/proactive-mentorship/scripts/session-miner.mjs --verify-and-sync
   ```

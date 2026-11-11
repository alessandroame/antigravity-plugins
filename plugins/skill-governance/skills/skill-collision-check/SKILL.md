---
name: skill-collision-check
description: >-
  Use this skill when detecting name collisions, priority shadowing, semantic duplicates,
  and post-update built-in overlaps across workspace, plugin, global, and built-in skills.
---

# Skill Collision & Duplicate Detection Procedure (`skill-collision-check`)

Analyzes active customizations across all Antigravity hierarchy levels to detect name collisions, silent priority shadowing, semantic trigger overlaps, and post-update built-in duplication. Always present the report to the user in plain Italian.

---

## 1. Skill Source Hierarchy

Scan all skill directories across Antigravity's precedence tiers (`Workspace > Plugins > Global > Built-in`):
1. **Tier 1 — Project Workspace (Highest Priority)**: `<repo-root>/.agents/skills/`
2. **Tier 2 — Installed Plugins & Global Config**: `~/.gemini/config/plugins/*/skills/` and `~/.gemini/config/skills/`
3. **Tier 3 — System Built-in Skills**: `~/.gemini/antigravity/builtin/skills/`

---

## 2. Anomaly Classes

### Class 1: Direct Name Collision & Silent Shadowing (`P0`)
- **Cause**: Two skills share the exact same YAML `name`. The higher-priority tier silently shadows the lower one.
- **Fix**: Rename the custom skill in `kebab-case` with an explicit domain prefix.

### Class 2: Semantic Duplicates & Trigger Competition (`P1`)
- **Cause**: Distinct skill names target the same user intent in their `description`.
- **Fix**: Merge into one modular skill or specialize their `Use this skill when...` clauses to be mutually exclusive.

### Class 3: Normative Contradictions (`P0` / `P1`)
- **Cause**: A custom rule/skill prescribes tools or patterns conflicting with another active rule or native Antigravity behavior.
- **Fix**: Align with project governance and remove conflicting directives.

### Class 4: Orphaned References or Hardcoded Machine Paths (`P2`)
- **Cause**: `SKILL.md` references missing files or non-portable hardcoded paths (`C:\Users\...`, `/home/...`).
- **Fix**: Convert to relative repository paths or `~/.gemini/config/plugins/...`.

### Class 5: Post-Update Overlap with Native Antigravity Built-ins (`P1`)
- **Cause**: A custom rule/skill duplicates boilerplate or contradicts mechanisms guaranteed natively by Antigravity updates (e.g., native *Reactive Wakeup*, `generative_ui` CSS tokens, or built-in slash commands `/learn`, `/boost`, `/teamwork`, `/schedule`).
- **Fix**: Strip duplicated built-in boilerplate, delegate explicitly to built-in skills (`agy-customizations`, `plugin`, `generative_ui`, `automation`), and retain only differential value.

---

## 3. Inspection Workflow

1. **Inventory**: Enumerate all `SKILL.md`, `rules/*.md`, and `agents/*.md` files.
2. **Extract Metadata**: Parse YAML `name`, `description`, and hierarchy tier.
3. **Run Deterministic Content & Built-in Evolution Check (`validate.mjs`)**:
   ```bash
   node scripts/validate.mjs --all --report-builtin-overlaps
   ```
   Compares `rules/AGENTS.md`, `SKILL.md`, and `references/*.md` against the 19 built-in files (`scripts/builtin-baseline.json`), distinguishing **Explicit Delegation** (valid), **Boilerplate Duplication (`P1`)**, and **Normative Contradiction (`P0`)**. After verifying an Antigravity update, refresh the baseline via:
   ```bash
   node scripts/validate.mjs --update-builtin-baseline
   ```

---

## 4. Conflict Matrix Output (User-Facing in Italian)

Present the findings in plain Italian and wait for user confirmation before modifying repository files:

| Skill A (Percorso) | Skill B (Percorso) | Tipo Conflitto | Gravità | Azione Risolutiva Consigliata |
| :--- | :--- | :--- | :---: | :--- |
| `plugins/foo/skills/x` | `plugins/bar/skills/x` | Omonimia (Shadowing) | **P0** | Rinomina una delle due skill |
| `skills/check-code` | `skills/lint-audit` | Concorrenza Semantica | **P1** | Fondi o specializza i trigger |

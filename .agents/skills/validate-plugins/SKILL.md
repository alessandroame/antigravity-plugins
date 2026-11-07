---
name: validate-plugins
description: >-
  Use this skill when running the automated validation suite (scripts/validate.mjs) to check
  plugin manifests, rules, skills, subagents, Markdown hygiene, and cognitive file ceilings.
---

# Plugin Validation Procedure (`validate-plugins`)

Runs formal and structural compliance checks across all plugins, templates, and cognitive files in the repository. Always reply to the user in plain Italian.

---

## 1. Execution Commands

From the `antigravity-plugins` repository root:

```bash
# Validate all plugins in plugins/
node scripts/validate.mjs

# Validate all plugins, templates, built-in evolution, and cognitive files (MEMORY/WORKLOG/DESIDERATA/NOTES)
node scripts/validate.mjs --all

# Validate a specific plugin directory
node scripts/validate.mjs plugins/engineering-sobriety
```

---

## 2. Automated Checks Performed

1. **Manifest (`plugin.json`)**:
   - Valid JSON/JSONC syntax, unique lowercase `kebab-case` `name`, non-empty `description`, SemVer `version` (`X.Y.Z`), max 3 `suggestedPrompts`, valid relative `logo`, and zero unsupported top-level fields.
2. **Documentation (`README.md`)**:
   - Presence of human-readable `README.md` (in Italian).
3. **Rules (`rules/AGENTS.md` & `rules/*.md`)**:
   - Pure Markdown without YAML frontmatter for `rules/AGENTS.md`, `<= 6,000` bytes per plugin (`<= 60 KB` aggregate), GFM `<details>` hygiene (0–2 leading spaces, max depth 2, blank line after `</summary>`), no inline LaTeX formulas, and no hardcoded user paths.
4. **Skills (`skills/<name>/SKILL.md`) & Subagents (`agents/*.md`)**:
   - Valid YAML frontmatter (`name` in `kebab-case`, `description` within `[80, 250]` chars with `Use this skill when...` / `Use this skill to...`, no unquoted inline `: `), `SKILL.md <= 200` lines, `agents/*.md <= 180` lines, and zero collisions with built-in skills/subagents.
5. **External Configs (`mcp_config.json`, `hooks.json`) & Cognitive Ceilings (`--all`)**:
   - Valid JSON configs and strict line/byte caps on `MEMORY.md` (`<= 200` lines / `16 KB`), `WORKLOG.md` (`<= 300` lines / `20 KB`), `DESIDERATA.md` (`<= 150` lines), and `NOTES.md` (`<= 120` lines).

---

## 3. Common Error Fixes

- **`plugin.json non valido`**: Fix JSON syntax or trailing commas.
- **`"name" deve essere in kebab-case`**: Use lowercase letters, digits, and hyphens only.
- **`rules/AGENTS.md contiene frontmatter YAML`**: Strip `--- ... ---` from `rules/AGENTS.md`.
- **`lunghezza description fuori dal range [80, 250]`**: Rewrite `description` using `>-` block and `Use this skill when...` within `80–250` chars.

# Skill Quality, Governance & Token Optimization Standards (`skill-governance`)

Defines design principles, token economy, semantic uniqueness, and the **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)** for all rules, skills, and subagents in Antigravity. Always reply to the user in plain Italian.

## 1. System Prompt Economy (`SKILL.md` Frontmatter)
The YAML frontmatter (`name` and `description`) of every active skill is injected into the system prompt on **every turn**:
1. **`description` Length (`80–250` chars)**: MUST be between **80 and 250 characters** (`<= 45` tokens), with zero bullet lists or implementation details. Archive unused domain skills outside `~/.gemini/config/skills/`.
2. **Strict YAML Safety**: NEVER use unquoted `: ` on an inline `description` line; use a folded `>-` block or wrap in quotes.
3. **Explicit Directive Trigger**: ALWAYS start with or include *"Use this skill when..."* or *"Use this skill to..."* specifying target `/slash` commands, tools, or Italian conversational trigger phrases.

## 2. Progressive Disclosure, Anti-Overfitting & Built-in Collision Prevention
1. **`SKILL.md` Body `<= 200` Lines & Built-in Delegation**: Structure as a sequential runbook (`Step 1..N`), offloading schemas and long examples to `references/`, `examples/`, and `scripts/`. Delegate core Antigravity architecture (discovery, `plugin.json`, `hooks.json`) to built-in skills `agy-customizations` and `plugin` without duplicating their boilerplate.
2. **Unique `kebab-case` & Post-Update Collision Check**: Prevent `name` shadowing (`Workspace > Plugins > Global > Built-in`) and overlaps with native slash commands or built-in guarantees (`skill-collision-check`).
3. **Abstract Generalization (`Anti-Example Hardcoding`)**: When a user illustrates a general requirement with concrete examples (*"e.g. when doing X or Y"*), NEVER hardcode the user's specific examples as fixed lists or regexes in rules/skills/scripts; encode the abstract mechanism and delegate case detection, importance ranking, and dynamic instantiation to the LLM within structural bounds.

## 3. Hybrid Language Standard (`EN` Logic / `IT` User-Facing — Mandatory)
Every normative file (`rules/*.md`, `skills/*/SKILL.md`, `agents/*.md`) MUST follow this strict partition:
1. **Imperative Logic, Conditions, Thresholds & Tool Parameters (`EN`)**: Write all agent-directed rules, RFC-2119 imperatives (`MUST`, `NEVER`, `IF ... -> STOP`), and procedural steps (`Step 1..N`) in concise English (`~18–25%` byte reduction) and include `Always reply to the user in plain Italian.` to prevent language drift.
2. **Visible Templates, Banners, `<summary>`, `ask_question` Options & Subagent Markers (`IT` Verbatim)**: Keep all user-visible Markdown templates, banners (`MODALITÀ SKIZZO ATTIVA`, `VERDETTO AB-BENCH`), `<summary><strong>...</strong></summary>` titles, `ask_question` options, subagent filter markers (`Skill Attive (...)`, `Sfidante A/B`, `Giudice Cieco`), and `README.md` documentation in natural Italian.

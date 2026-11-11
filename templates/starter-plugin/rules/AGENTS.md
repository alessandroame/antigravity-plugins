# Starter Plugin Rules (`starter-plugin`)

Define the operational directives and domain constraints enforced when this plugin is active. Always reply to the user in plain Italian.

## 1. Hybrid Language Standard (`EN` Logic / `IT` User-Facing)
1. **Pure Markdown (`<= 6,000 B`)**: Keep `rules/AGENTS.md` in pure Markdown without YAML frontmatter so Antigravity injects it inline.
2. **Language Partition**: Write imperative logic, conditions, and tool parameters in concise English (`MUST`, `NEVER`, `IF ... -> STOP`), while keeping user-facing templates, `<summary><strong>...</strong></summary>` titles, and `ask_question` options verbatim in Italian.

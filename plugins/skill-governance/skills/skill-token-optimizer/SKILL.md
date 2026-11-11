---
name: skill-token-optimizer
description: >-
  Use this skill when optimizing a skill or rule token budget by compressing the YAML description,
  modularizing monolithic files into references/scripts, and applying the Hybrid EN/IT standard.
---

# Skill Token Budget Optimization Procedure (`skill-token-optimizer`)

Guides refactoring of heavy or monolithic skills and rules to minimize token consumption both in the always-on system prompt and in on-demand runbooks. Always reply to the user in plain Italian.

---

## 1. Token Consumption Diagnosis

Inspect the target `SKILL.md` or `rules/AGENTS.md`:
1. **Frontmatter Measurement**: Measure `description` length (`> 250` chars MUST be compressed into `[80, 250]` chars).
2. **Body Measurement**: Count lines (`SKILL.md > 200` lines, `agents/*.md > 180` lines) and bytes (`rules/AGENTS.md > 6,000 B`).

---

## 2. Step 1: Frontmatter Compression (System Prompt Economy)

Keep only the routing signals required to trigger the skill:

```yaml
---
name: <kebab-case-name>
description: >-
  Use this skill when <trigger 1>, <trigger 2>, or <Italian user keyword> to <core action in 10-15 words>.
---
```

- Strip introductory fluff and low-level implementation details.
- Preserve `/slash` commands and Italian user trigger keywords.

---

## 3. Step 2: Hybrid EN/IT Conversion & Progressive Disclosure Decomposition

1. **Apply Hybrid Language Standard (`EN` Logic / `IT` User-Facing)**:
   - Convert imperative logic, conditions, thresholds, and `Step 1..N` instructions to concise English (`~18–25%` byte reduction) with `Always reply to the user in plain Italian.`.
   - Keep all user-visible Markdown templates, banners, `<summary><strong>...</strong></summary>` titles, and `ask_question` options verbatim in Italian.
2. **Offload Heavy Blocks (`> 200` lines)**:

```text
skills/<skill-name>/
├── SKILL.md                   # Core sequential procedure only (<= 150-200 lines)
├── references/                # On-demand schemas, API catalogs, deep notes
├── examples/                  # On-demand code snippets and Before/After samples
└── scripts/                   # Executable CLI helpers (0 generation tokens)
```

Replace offloaded sections in `SKILL.md` with an explicit on-demand pointer (`Read references/<file>.md via view_file when needed`).

---

## 4. Step 3: Verification & Before/After Report (in Italian)

1. Verify all internal links and run full validation:
   ```bash
   npm run validate && npm test
   ```
2. Report the **Before vs After** byte/line savings to the user in plain Italian.

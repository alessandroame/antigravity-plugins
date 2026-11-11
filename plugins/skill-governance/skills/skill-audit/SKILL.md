---
name: skill-audit
description: >-
  Use this skill when auditing one or more skills, rules, or subagents to verify trigger clarity,
  YAML frontmatter, token budget, determinism, tool coupling, and Hybrid EN/IT Language compliance.
---

# Heuristic & Structural Skill Audit Procedure (`skill-audit`)

Evaluates a skill (or group of skills/rules/agents) for trigger quality, token economy, execution determinism, and compliance with the **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)**. Always present the audit report to the user in plain Italian.

---

## 1. Target Skill Resolution

Locate the target `SKILL.md` (or `rules/AGENTS.md` / `agents/*.md`) path:
- Workspace skill: `<target>/.agents/skills/<skill-name>/SKILL.md`
- Plugin skill: `<target>/plugins/<plugin-name>/skills/<skill-name>/SKILL.md`
- Global skill: `~/.gemini/config/skills/<skill-name>/SKILL.md`

Read the file using `view_file`.

---

## 2. 6-Dimensional Audit Matrix

### Dimension A: Trigger Quality & System Prompt Economy
- [ ] **Valid Frontmatter**: `---` delimiters enclose `name` and `description`.
- [ ] **`kebab-case` `name`**: Lowercase `kebab-case` with no spaces or special characters.
- [ ] **Character Budget**: `description` is strictly within **`80–250` characters** (no unquoted inline `: `).
- [ ] **Directive Clause**: Uses `"Use this skill when..."` or `"Use this skill to..."` while preserving `/slash` commands and Italian user trigger phrases.
- [ ] **Low Over-Triggering Risk**: Avoids vague catch-all terms.

### Dimension B: Architecture & Progressive Disclosure
- [ ] **File Size Ceiling**: `SKILL.md` is `<= 200` lines (`rules/AGENTS.md <= 6,000 B`, `agents/*.md <= 180` lines).
- [ ] **Modular Offloading**: Large schemas, tables, and examples live in `references/`, `examples/`, or `scripts/`.
- [ ] **No Dead Links**: All referenced relative files exist on disk.

### Dimension C: Procedural Determinism
- [ ] **Ordered Steps**: Structured into numbered steps (`Step 1`, `Step 2`, ...).
- [ ] **Portable Paths**: Uses relative paths or `~` (zero hardcoded machine/user paths like `/root/...`, `/home/...`, or `C:\Users\...`).

### Dimension D: Tool Coupling & Prerequisites
- [ ] **Declared Dependencies**: External CLIs (`git`, `node`) and MCP servers are explicitly stated.

### Dimension E: Verification Checkpoints
- [ ] **Expected Output & Resilience**: Critical steps define verifiable exit criteria and rollback actions on failure.

### Dimension F: Hybrid Language Standard (`EN` Logic / `IT` User-Facing)
- [ ] **English Imperative Logic**: Internal rules, conditions, thresholds, and `Step 1..N` instructions are written in concise English with an explicit directive to reply to the user in plain Italian (`Language Drift = 0`).
- [ ] **Italian Verbatim Templates**: User-facing banners, `<summary><strong>...</strong></summary>` titles (with mandatory blank line after `</summary>`), `ask_question` options, and subagent markers remain verbatim in Italian.

---

## 3. Quality Grading (`A` to `F`)

- **Grade A (Excellent)**: `0` critical findings, compact description (`80–250` chars), `<= 200` lines, 100% Hybrid EN/IT compliant.
- **Grade B (Good)**: Minor redundancies, all structural and language invariants respected.
- **Grade C (Needs Work)**: Verbose description (`> 250` chars), missing directive clause, or mixed prose in logic steps.
- **Grade D/F (Critical)**: Monolithic file (`> 200` lines), missing verification steps, trigger collision, or broken GFM `<details>`.

---

## 4. Audit Report Output (User-Facing in Italian)

Present a structured report in plain Italian:
1. **Scheda Riepilogativa**: Skill name, path, line/byte count, description length, Hybrid EN/IT status, and assigned grade.
2. **Evidenze e Anomalie Rilevate**: Bulleted findings ordered by severity (`P0` blocker/waste, `P1` structural, `P2` polish).
3. **Piano di Rimedio Proposto**: Concrete rewrite of `description` and modularization/Hybrid EN-IT conversion plan.

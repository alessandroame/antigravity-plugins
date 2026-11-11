---
name: install-plugin
description: >-
  Use this skill when installing or linking an antigravity-plugins plugin into another project,
  running automated conflict and duplicate skill/rule analysis and proposing cleanup actions.
---

# Plugin Installation & Conflict Audit Procedure (`install-plugin`)

Standardizes linking a catalog plugin to an external project while auditing pre-existing customizations to prevent shadowing, collisions, and redundancies. Always reply to the user in plain Italian.

---

## 1. Parameter Resolution
- **Source Plugin**: Verify existence in `plugins/<plugin-name>`.
- **Target Project**: Locate the root directory of the target project.

---

## 2. Pre/Post-Installation Overlap & Conflict Audit

Inspect existing customizations in the target workspace (`.agents/skills/`, `.agents/rules/`, `.agents/plugins/`):
1. **Name / ID Collisions (`P0`)**: Check whether local skills or files share the same YAML `name:` or folder name (which causes silent shadowing).
2. **Semantic Duplicates (`P1`)**: Identify loose prototype rules or skills that duplicate responsibilities now encapsulated in the plugin.
3. **Normative Contradictions (`P1`)**: Check whether existing local rules contradict the plugin's directives.

### Proposed Remediation Actions (User-Facing in Italian):
For each conflicting item, propose one of:
- **Deprecazione / Rimozione**: Exact duplicate or superseded local rule/skill.
- **Sfoltimento (Refactoring)**: Strip generic boilerplate covered by the plugin while keeping domain-specific project constraints.
- **Risoluzione Conflitto**: Sanitize project files violating the plugin's rules.

---

## 3. Physical Installation & Global Synchronization

> [!CAUTION]
> **No Directory Junctions for Plugins on Windows**:
> The Antigravity Language Server ignores NTFS junctions/reparse points on Windows, and does not load plugins from project-local `.agents/plugins/`. Plugins MUST be physically synced into `~/.gemini/config/plugins/`.

1. **Automated Global Sync (Recommended)**:
   From the `antigravity-plugins` root:
   ```bash
   npm run sync
   ```
   `scripts/sync-to-global.mjs` removes stale junctions, physically copies plugin directories into `~/.gemini/config/plugins/`, and updates `~/.gemini/config/config.json`.
2. **Workspace-Specific Skills (Non-Plugin)**:
   If a skill belongs strictly to a single project, copy it to `<target>/.agents/skills/<skill-name>/SKILL.md`.

---

## 4. User Report (in Italian)
Present a structured summary in plain Italian:
- Sync outcome (target path and enabled components).
- Table of conflicting or duplicate local skills/rules detected.
- Proposed cleanup plan, waiting for user confirmation before deleting or editing target project files.

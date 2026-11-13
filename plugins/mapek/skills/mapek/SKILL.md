---
name: mapek
description: >-
  Use this skill when the user invokes /mapek or requests a process audit to inspect
  Human-AI interaction bottlenecks, operator mastery, and human-gated L2a/L2b/L2c/L3 proposals.
---

# Human-Gated Process Supervisor Runbook (`/mapek`)

On-demand runbook to inspect the always-on supervisor (`mapek`), review operator mastery, evaluate `PENDING_APPROVAL` decisions, and audit post-adoption ROI. Refer to built-in skills `agy-customizations` and `plugin` for general Antigravity plugin/hook/subagent architecture. Always reply to the user in plain Italian.

---

## Step 1 — Read-Only Analysis Execution

1. Run incremental analysis on human sessions in `~/.gemini/antigravity/brain/` to generate the **Semantic Drill-Down (`L0 -> L1 -> L2`)** digest in Italian:
   ```bash
   node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --digest
   ```
2. To inspect structured JSON metrics (EMA mastery scores, workspace evidence, post-adoption ledger) or offload deep multi-project mining without polluting the main context, run `--json` or invoke the isolated subagent `mapek-analyst`.

---

## Step 2 — Drill-Down Presentation, Self-Identification & Mandatory Human Consent Gate

1. Present the report in plain Italian starting at **Level 0** with `[Plugin: mapek]`, explicitly naming any target file (`targetArtifact.relativePath`) and explaining in everyday Italian what concretely went wrong, placing metrics, discarded alternatives, mastery scores, and ledger history inside `<details>` drawers (**Level 1** and **Level 2**, with a mandatory blank line after `</summary>`).
2. IF one or more `PENDING_APPROVAL` decisions exist, **NEVER apply them autonomously**: MUST invoke `ask_question` using `userFacingQuestionIt` and `userFacingOptionsIt` so the question itself opens with `[Plugin: mapek]`, names the exact target file (`<file>`), and explains in clear detail what problem was observed and what will change:
   - `(Recommended) Sì, crea e attiva <file>` *(or `Sì, rimuovi <file> (non porta benefici)` when `PRUNE`)*:
     ```bash
     node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --apply <decisionId> --confirm-user-approval
     ```
   - `Mostrami prima il contenuto completo di <file>`:
     ```bash
     node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --show <decisionId>
     ```
   - `No, non mi serve / tienilo installato (non riproporlo per 30 giorni)`:
     ```bash
     node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --reject <decisionId>
     ```
   - `Chiedimelo di nuovo domani`:
     ```bash
     node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --snooze <decisionId>
     ```

---

## Step 3 — Post-Approval Verification & Hybrid EN/IT Enforcement

When approved by the user, `--apply <decisionId> --confirm-user-approval` enforces the **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)** on any generated `L2a`/`L2b`/`L2c` markdown artifact, runs `scripts/validate.mjs --all`, test suites, and global sync to `~/.gemini/config/plugins/` (with automatic rollback on failure), and records the baseline in `process-ledger.json` for 10-session ROI verification.

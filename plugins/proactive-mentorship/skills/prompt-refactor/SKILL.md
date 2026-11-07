---
name: prompt-refactor
description: >-
  Use this skill when a prompt has high-impact ambiguity, Antigravity workflow friction,
  regressions ("avviene ancora"), or agent corrections ("d'ora in poi") to apply L0-L3 self-learning.
---

# Prompt Refactoring, Antigravity Coaching & Autonomous Self-Learning Runbook

## 1. Objective & 3-Dimensional Architecture

Turns workflow friction (ambiguous prompt, recurring regression, or session lesson) into **immediate agent self-learning (`Zero-Prompt Self-Learning`)** across 3 dimensions (always replying to the user in plain Italian):
1. **Prompt Refactoring (1-Shot Determinism & Token Economy)**: Inject exact `@file` paths, bounded scope, and an objective verification command.
2. **Antigravity Workflow Coaching (Just-in-Time)**: Select the **single** native Antigravity shortcut that halves manual effort (see [agy-commands-and-context.md](./references/agy-commands-and-context.md)).
3. **Autonomous Self-Learning & Harness Engineering (`L0..L3`)**: Mine session lessons via [`scripts/session-miner.mjs`](./scripts/session-miner.mjs) and [agent-training-ladder.md](./references/agent-training-ladder.md), promoting them into `L3` tests/probes, `L2b` skills, `L2a` rules (in Hybrid EN/IT format), or `L1` `MEMORY.md`, followed by `validate.mjs --all` and `npm run sync`.

---

## 2. Sequential Operational Procedure (Step 1 -> Step 4)

### Step 1 — Anti-Noise Silence Gate
Check before emitting any coaching:
- Does the prompt already cite target `@file`/symbols, touch `<= 2` files, and present zero architectural risks, regressions, or self-learning triggers?
  - **YES**: **Stay silent (`0 bytes` of coaching)** and execute the requested task directly.
  - **NO**: Proceed to **Step 2**.

### Step 2 — Single Antigravity Move Selection (Hick's Law)
Select **at most 1 native command** matching the primary bottleneck:

| User Message Symptom | Priority Antigravity Move | Why It Saves Time & Tokens |
| :--- | :--- | :--- |
| **Broad requirement with implicit design choices** | `/grill-me <obiettivo>` | Interviews the user on logical gaps before writing wrong code. |
| **Edit across `>= 3` files or structural refactor** | `/plan <obiettivo>` | Produces an approvable action plan before touching source files. |
| **Critical tradeoff between technical purity and UX** | `/skizzo <obiettivo>` | Active by default in `Auto-Skizzo Silente` on `score >= 4` (`--force` to override). |
| **Terse draft prompt needing structure** | `/boost <bozza>` | Expands request with constraints, edge cases, and acceptance criteria. |
| **Long autonomous task with clear exit test** | `/goal <obiettivo e test>` | Iterates autonomously until all verification gates pass. |
| **Large project divisible across autonomous agents** | `/teamwork <obiettivo>` | Coordinates autonomous agents on independent modules. |
| **Chat exceeding 25–30 turns or topic switch** | `/compact` | Compresses history to free context window capacity. |
| **Doubt over which prompt or skill performs better** | `/ab-bench <compito>` | Runs a blind 5-Finger A/B challenge with real timing metrics. |

### Step 3 — Autonomous Self-Learning on the Agent Training Ladder (`L0..L3`)
WHEN the user corrects the agent, flags a regression (`"avviene ancora"`, `"non funziona"`), or says `"d'ora in poi"` / `"ricordati sempre"`:
1. **Deterministic Session Mining (`session-miner.mjs`)**:
   - Run `node ~/.gemini/config/plugins/proactive-mentorship/scripts/session-miner.mjs --limit 40` to extract recurring patterns and `L1..L3` candidates.
2. **Minimum Effective Rung Application (`Act -> Verify -> Sync -> 1-Line Receipt`)**:
   - **L0 (1-Shot Prompt + Before/After)**: Isolated single-turn ambiguity.
   - **L1 (`MEMORY.md` + Local Invariant Test)**: Repo-specific pitfall -> update `MEMORY.md` *in-place* **and** add a local numeric/geometric unit test.
   - **L2b (`skills/<name>/SKILL.md`) / L2a (`rules/AGENTS.md <= 6,000 B`)**: Reusable cross-workspace procedure or rule -> write natively in **Hybrid EN/IT format** (`EN` logic / `IT` user-facing templates).
   - **L3 (`scripts/validate.mjs`, `triage.mjs`, `ui-geometry-probe.js`, Unit Test — Zero-Token Guard)**: IF checkable in `< 20` lines, **always encode in `L3`**.
3. **Atomic Verification & Sync**:
   - Run `node ~/.gemini/config/plugins/proactive-mentorship/scripts/session-miner.mjs --verify-and-sync` (auto-rollback via `git checkout --` on validation failure).

### Step 4 — 1-Line Receipt (`0-Click`) & `<details>` (`1-Click`, in Italian)

```markdown
> [!IMPORTANT]
> **Auto-Apprendimento Applicato**: aggiornato `[target]` (`L3/L2`, `validate.mjs` + `npm run sync` OK) · Scrivi `"annulla regola"` per ripristinare.

<details>
<summary><strong>Dettagli Auto-Apprendimento, Mossa Antigravity & Kit Prompt (Espandi)</strong></summary>

- **Lezione / Regressione Intercettata**: [Causa radice tecnica o pattern emerso dalla sessione]
- **Intervento Applicato (`L1..L3`)**: [File aggiornati in-place e test `L3` aggiunto]
- **Mossa Antigravity Consigliata**: `[Comando esatto compilato]` — [1 riga sul vantaggio immediato]

#### Prompt Ottimizzato (Target Diretto & Verifica):
`[Versione ottimizzata con @percorso/file esatti e comando di test]`

</details>
```

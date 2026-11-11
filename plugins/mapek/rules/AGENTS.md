# Always-On Human-Gated Supervisor Protocol (`mapek`)

Governs continuous Human-AI process supervision (**Monitor -> Analyze -> Plan -> Human Gate -> Execute -> Knowledge**) without manual invocation. Always reply to the user in plain Italian.

## 1. Silent Continuous Observation & Zero Unapproved Edits
1. **Always-On Background (`0 bytes` When Idle)**:
   - The `Stop` hook (`mapek-stop-hook.mjs`) periodically runs read-only `mapek.mjs --analyze --quiet` on `~/.gemini/antigravity/brain/` transcripts, updating `operator-mastery.json`, post-10-session ROI (`process-ledger.json`), and `mapek-pending-decisions.json`.
   - **No Silent Writes**: NEVER create, modify, or delete `mapek`-inferred rules, skills, agents, or guards without explicit user approval.
2. **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)**: Every newly synthesized `L2a` rule (`rules/*.md`), `L2b` skill (`SKILL.md`), or `L2c` subagent (`agents/*.md`) MUST be generated natively in Hybrid EN/IT format (imperative logic and steps in English; user-facing templates, `<summary>` titles, and `ask_question` options verbatim in Italian).

## 2. Decision Presentation (`[MAPEK DECISION READY]`) & User Gate
WHEN `PreInvocation` (`mapek-pre-hook.mjs`) injects `[MAPEK DECISION READY — ID: <id>]` (or during `/memory-sync` or `/mapek` with `PENDING_APPROVAL` items):
1. **Semantic Drill-Down (`L0 -> L1 -> L2`) in Italian**:
   - **Level 0**: Explain in 2–3 plain Italian lines (no opaque acronyms) what was observed, the proposed action (`Controllo L3`, `Agente isolato agents/*.md`, `Skill SKILL.md`, `Regola`, or `Potatura regola inefficace`), and the target file.
   - **Level 1 (`<details>`)**: Use `<summary><strong>Tema — Conclusione</strong></summary>` followed by a mandatory blank line, listing measured metrics, discarded alternatives, and practical workflow guidance in Italian.
2. **Mandatory `ask_question` in Plain Italian (Zero Jargon)**:
   - Phrase the `ask_question` prompt in 1 simple Italian sentence stating **the practical problem observed and how the assistant will fix it** (NEVER include technical IDs `mapek-xxxx`, `.md`/`.mjs` filenames, `L2c`/`L3` codes, or *"Proposta Supervisore"* in the question or options; keep them inside `<details>`):
     - `(Recommended) Sì, attiva questo miglioramento automatico` -> run `node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --apply <id> --confirm-user-approval`.
     - `Fammi vedere prima i dettagli completi per modificarli` -> run `mapek.mjs --show <id>`.
     - `No, non mi serve (non riproporlo per 30 giorni)` -> run `mapek.mjs --reject <id>`.
     - `Chiedimelo di nuovo domani` -> run `mapek.mjs --snooze <id>`.
3. **Live Testless Spiral Interception**: IF `>= 3` consecutive edits occur on the same files without an intermediate test, STOP, warn the user in 2 Italian lines, and propose a deterministic check before proceeding.

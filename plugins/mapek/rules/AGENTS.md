# Always-On Human-Gated Supervisor Protocol (`mapek`)

Governs continuous Human-AI process supervision (**Monitor -> Analyze -> Plan -> Human Gate -> Execute -> Knowledge**) without manual invocation. Always reply to the user in plain Italian.

## 1. Silent Continuous Observation & Zero Unapproved Edits
1. **Always-On Background (`0 bytes` When Idle)**:
   - The `Stop` hook (`mapek-stop-hook.mjs`) periodically runs read-only `mapek.mjs --analyze --quiet` on `~/.gemini/antigravity/brain/` transcripts, updating `operator-mastery.json`, post-10-session ROI (`process-ledger.json`), and `mapek-pending-decisions.json`.
   - **No Silent Writes**: NEVER create, modify, or delete `mapek`-inferred rules, skills, agents, or guards without explicit user approval.
2. **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)**: Every newly synthesized `L2a` rule (`rules/*.md`), `L2b` skill (`SKILL.md`), or `L2c` subagent (`agents/*.md`) MUST be generated natively in Hybrid EN/IT format (imperative logic and steps in English; user-facing templates, `<summary>` titles, and `ask_question` options verbatim in Italian).

## 2. Decision Presentation (`[MAPEK DECISION READY]`), Self-Identification & User Gate
WHEN `PreInvocation` (`mapek-pre-hook.mjs`) injects `[MAPEK DECISION READY]` (or during `/memory-sync` or `/mapek` with `PENDING_APPROVAL` items):
1. **Mandatory Self-Identification, Exact Component Name & Detailed Plain-Italian Problem Inside `ask_question`**:
   - Because `ask_question` is displayed to the user **before** the assistant's Markdown reply, vague 1-sentence paraphrases (*"c'è uno strumento che non porta benefici"*) and hiding filenames or plugin identity are **STRICTLY FORBIDDEN**.
   - Every `ask_question` prompt from `mapek` MUST use `userFacingQuestionIt` (3–4 clear everyday-Italian lines) containing:
     1. **Plugin Identity**: MUST open with `[Plugin: mapek]`;
     2. **Exact Name of the Thing ("cosa")**: MUST state the exact target component/file path (`targetArtifact.relativePath`, e.g. `plugins/mapek/agents/autonomous-verification-runner.md`) and what it is (subagent, skill, or guard script);
     3. **Concrete Problem ("cosa non va bene") & Proposed Action**: MUST explain in plain, understandable Italian (zero opaque internal terms like *"tasso di attrito"* or *"artefatto"*) what concrete issue occurred across recent chats (with session/project counts or before/after numbers) and whether `mapek` proposes creating or deleting that exact file:
     - `(Recommended) Sì, crea e attiva <file>` *(or `Sì, rimuovi <file> (non porta benefici)` when `PRUNE`)* -> run `node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --apply <id> --confirm-user-approval`.
     - `Mostrami prima il contenuto completo di <file>` -> run `mapek.mjs --show <id>`.
     - `No, non mi serve / tienilo installato (non riproporlo per 30 giorni)` -> run `mapek.mjs --reject <id>`.
     - `Chiedimelo di nuovo domani` -> run `mapek.mjs --snooze <id>`.
2. **Semantic Drill-Down (`L0 -> L1 -> L2`) in Italian**:
   - **Level 0**: Open with `[Plugin: mapek]` and explain in 2–4 plain Italian lines the exact component (`targetArtifact.relativePath`), what concretely went wrong, and the outcome.
   - **Level 1 (`<details>`)**: Use `<summary><strong>Tema — Conclusione</strong></summary>` followed by a mandatory blank line, listing measured metrics, discarded alternatives, and practical workflow guidance in Italian.
3. **Live Testless Spiral Interception**: IF `>= 3` consecutive edits occur on the same files without an intermediate test, STOP, warn the user in 2 Italian lines prefixed with `[Plugin: mapek]`, and propose a deterministic check before proceeding.

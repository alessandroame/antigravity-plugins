# Always-On Human-Gated Supervisor Protocol (`mapek`)

Governs continuous Human-AI process supervision (**Monitor -> Analyze -> Plan -> Human Gate -> Execute -> Knowledge**). Always reply to the user in plain Italian.

## 1. Silent Observation & Zero Unapproved Edits
1. **Background (`0 bytes` Idle)**: `mapek-stop-hook.mjs` runs read-only `mapek.mjs --analyze --quiet` on `brain/` transcripts, updating `operator-mastery.json`, post-10-session ROI (`process-ledger.json`), and `mapek-pending-decisions.json`. **NEVER** create, modify, or delete `mapek` rules, skills, agents, or guards without explicit user approval.
2. **Hybrid Language (`EN` Logic / `IT` User-Facing)**: Synthesize every `L2a` rule, `L2b` skill, or `L2c` subagent with English imperative logic and verbatim Italian user-facing text.

## 2. User Gate (`[MAPEK DECISION READY]`) & Live Spiral Check
1. **Self-Identified `ask_question` (`userFacingQuestionIt`)**: Because `ask_question` renders **before** Markdown prose, vague paraphrases or hidden filenames are **FORBIDDEN**. Open with `[Plugin: mapek]`, name the exact `targetArtifact.relativePath` and type (subagent, skill, guard), and state in 3–4 plain Italian lines (zero internal jargon) the measured multi-session issue and whether `mapek` proposes creating or removing that file:
   - `(Recommended) Sì, crea e attiva <file>` *(or `Sì, rimuovi <file> (non porta benefici)` on `PRUNE`)* -> `node ~/.gemini/config/plugins/mapek/scripts/mapek.mjs --apply <id> --confirm-user-approval`
   - `Mostrami prima il contenuto completo di <file>` -> `mapek.mjs --show <id>`
   - `No, non mi serve / tienilo installato (non riproporlo per 30 giorni)` -> `mapek.mjs --reject <id>`
   - `Chiedimelo di nuovo domani` -> `mapek.mjs --snooze <id>`
2. **Chat Format**: Open `L0` with `[Plugin: mapek]` (2–4 plain Italian lines on `targetArtifact.relativePath`, issue, and outcome) + `L1` `<details>` with metrics and discarded alternatives per `engineering-sobriety`.
3. **Live Testless Spiral Stop**: IF `>= 3` consecutive edits hit the same files without an intermediate test, STOP, warn in 2 Italian lines prefixed with `[Plugin: mapek]`, and run a deterministic check first.

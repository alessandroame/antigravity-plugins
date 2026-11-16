# Dynamic Multi-Domain Dialectical Protocol, LLM Ranking & Mediator (`/skizzo`)

Governs adaptive multi-domain orchestration (**`2..4` subagents ranked by importance via LLM**) with **`Auto-Skizzo Silente` (`AUTO`)**, **Gate 0 (`FAST-PASS` vs `2..4` Agents)**, **Mediator**, and Italian output. Always reply to the user in plain Italian.

## 1. `Auto-Skizzo Silente` (`AUTO`), Sticky (`ON`) & Overrides
1. **Silent Default (`SKIZZO = AUTO`)**: Starts at `AUTO` (`MEDIATOR = OFF`). At Turn 1 (`plugins/skizzo/scripts/triage.mjs`, `0` pre-triage reads):
   - `FAST-PASS` (`score < 4` or bypass guards, without `/skizzo`): reply directly with **`0` subagents and `0 bytes` banner** (`silentFastPass: true`).
   - `score >= 4` (cross-domain tradeoffs): semantically discover and rank domains, launching **`2..4` parallel subagents (`DUAL-TRACK` / `TRI-TRACK` / `QUAD-TRACK`)** automatically.
2. **Sticky (`SKIZZO = ON`)**: `/skizzo`, `/skizzo on`, `/skizzo --mediator` (`-m`), or `/skizzo <task>` sets `ON` (`score >= 3`), emitting on `FAST-PASS`:
   `> [!NOTE]`
   `> MODALITÀ SKIZZO ATTIVA (FAST-PASS — Risposta rapida per <motivo>, ~90s risparmiati) · Resta attiva per i prossimi messaggi · Scrivi "forza skizzo" (o "/skizzo --force") per forzare gli agenti.`
3. **Overrides & Stop**: `"forza skizzo"` / `"con 3 agenti"` / `--force` / `-f` / `--tracks N` (`2..4`) forces subagents; `"senza skizzo"` / `--skip` / `--fast` forces `FAST-PASS`; `/skizzo stop` / `/skizzo off` / `stop skizzo` sets `OFF` and strips `[SKIZZO]` via `set-chat-title.mjs`.

## 2. Gate 0 Bypass & LLM Domain Ranking (`2 <= N <= 4`, `rankAndCapDomains`)
1. **`FAST-PASS` Cases (`0` Subagents)**: (A) Ops/Git/Test/Sync/Confirm (`/memory-sync`, `/take-note`, `/review-notes`, `/next-step`, `/validate-plugins`, `git`, `npm`, *"fallo"*, *"vai"*, *"procedi"*); (B) Read-Only (`/how-its-made`, *"spiega"*, *"dove si trova"*, *"non agire"*, *"è solo una domanda"*, *"senza modificare nulla"*); (C) Single-file micro-edits/renames.
2. **Dynamic Ranking & Occam Cap**: Zero hardcoded roles. Rank stakeholder/competency domains by (1) *Direct goal impact*, (2) *Dialectical tension*, (3) *Omission risk*. Start at `2` (`DUAL-TRACK`); add `3rd`/`4th` (hard cap `4`) **ONLY IF introducing an orthogonal constraint/oracle**.

## 3. 4-Phase Execution & Italian Output
1. **Phase 1 (Parallel Subagents, `<= 4` Turns, Zero Polling)**: Assign `Alpha`, `Beta` [, `Delta`, `Epsilon`] a `Role`, `Mandate`, `Oracle`, and **1–2 leaf skills** (never `skizzo`/`ab-bench`). Subagents open Line 1 with `Skill Attive (<trackId> - <Ruolo>): <id>` and cite `#Lxx-Lyy`. Immediately after `invoke_subagent`, **end turn (`0` tool calls; `schedule`/`manage_subagents` polling FORBIDDEN)**.
2. **Phase 2 (Critique / `--mediator`)**: Cross-critique or **`Subagent Gamma` (`research`)** querying tracks via `send_message` (max 1 round) for the **Lodo Arbitrale**.
3. **Phase 3 & 4 (Verified Check & Output)**: Run real tests / `diff-triage.mjs` / probes after last `edit_file` (no blind `PASS`). Open Line 1 with:
   `> [!IMPORTANT]`
   `> MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | TRI-TRACK | QUAD-TRACK — N Domini per Importanza) — Subagent: [1° <Ruolo Alpha>](conversation://<id-alpha>) · [2° <Ruolo Beta>](conversation://<id-beta>) [· [3° <Ruolo Delta>](conversation://<id-delta>) · [4° <Ruolo Epsilon>](conversation://<id-epsilon>)]`
   Show **Cosa cambia per te**, **Contributo dei domini attivati (in ordine di importanza)**, **Conflitto risolto tra i ruoli** — **Controlli**: `Tutti i test/oracoli superati (X/X OK)`, plus a `<details>` 4-column table (`# Dominio | Skill & Mandato | Proposta Chiave | Oracolo & Esito`).

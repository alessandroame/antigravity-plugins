# Dynamic Multi-Domain Dialectical Protocol, LLM Ranking & Mediator (`/skizzo`)

Governs adaptive multi-domain orchestration (**`2` to `4` custom subagents discovered and ranked by importance via LLM**) with **`Auto-Skizzo Silente` (`AUTO`)**, **Pre-Filter (`FAST-PASS` vs `2..4` Agents)**, **Skill Auto-Routing**, **Mediator**, and **Human-First** Italian output. Always reply to the user in plain Italian.

## 1. `Auto-Skizzo Silente` (`AUTO`), Sticky Persistence (`ON`) & Stop
1. **Silent Default at Chat Start (`SKIZZO = AUTO`, Zero Banners on Direct Turns)**:
   - Every chat starts in `SKIZZO = AUTO` (`MEDIATOR = OFF`). At Turn 1, **Gate 0** (`plugins/skizzo/scripts/triage.mjs`) evaluates the request with `0` pre-triage file reads:
   - IF `FAST-PASS` (`score < 4` or bypass guards) and the user did **not** type `/skizzo`, reply directly in Italian with **`0` subagents and `0 bytes` of banner** (`silentFastPass: true`).
   - IF `score >= 4` (multi-perspective decisions or cross-domain tradeoffs), the LLM semantically identifies the involved domains, ranks them by importance, and autonomously launches **`2` to `4` parallel subagents (`DUAL-TRACK`, `TRI-TRACK`, or `QUAD-TRACK`)** without requiring `/skizzo`.
2. **Sticky Persistence (`SKIZZO = ON`)**: When triggered via `/skizzo`, `/skizzo on`, `/skizzo --mediator` (`-m`), or `/skizzo <task>`, state switches to `SKIZZO = ON` (`score >= 3`), showing the `[!NOTE]` receipt on `FAST-PASS` turns (`silentFastPass: false`).
3. **Overrides & Stop**: `"forza skizzo"` / `"con 3 agenti"` / `--force` / `-f` / `--tracks N` (`2..4`) -> forces subagents; `"senza skizzo"` / `--skip` / `--fast` -> forces `FAST-PASS`; `/skizzo stop` / `/skizzo off` / `stop skizzo` -> sets `SKIZZO = OFF` and strips `[SKIZZO]` from chat title (`set-chat-title.mjs`).

## 2. Gate 0 & Dynamic LLM Domain Discovery (`0` vs `2..4` Ranked Subagents)
1. **Fast Path (`FAST-PASS` — `0` Subagents)**:
   - **Case A (Ops/Git/Test/Sync/Confirm)**: `/memory-sync`, `/take-note`, `/review-notes`, `/next-step`, `/validate-plugins`, `git`, `npm`, `start server`, or confirmations (*"fallo"*, *"vai"*, *"procedi"*).
   - **Case B (Read-Only / `"non agire"`)**: `/how-its-made`, *"spiega"*, *"dove si trova"*, *"non agire"*, *"è solo una domanda"*, *"senza modificare nulla"*.
   - **Case C (Single-Choice Micro-Edit)**: Typos, renames, or already-decided single-file constant/color tweaks.
   - **`FAST-PASS` Banner**: `0 bytes` when `silentFastPass: true` (`AUTO`); otherwise:
     `> [!NOTE]`
     `> MODALITÀ SKIZZO ATTIVA (FAST-PASS — Risposta rapida per <motivo>, ~90s risparmiati) · Resta attiva per i prossimi messaggi · Scrivi "forza skizzo" (o "/skizzo --force") per forzare gli agenti.`
2. **Semantic Discovery, Importance Ranking & Stopping Rule (`2 <= N <= 4`, `rankAndCapDomains`)**:
   - Zero hardcoded roles: past `FAST-PASS`, the LLM identifies all relevant stakeholder/competency domains (without forcing a coding role on non-software tasks) and ranks them by **descending importance**: (1) *Direct impact on goal*, (2) *Real dialectical tension*, (3) *Omission risk*.
   - Starts at `2` domains (`DUAL-TRACK`) and adds a `3rd` (`TRI-TRACK`) or `4th` (`QUAD-TRACK`, hard cap) **ONLY IF it introduces an orthogonal constraint/oracle not covered by the first two**.

## 3. 4-Phase Cycle (`DUAL-TRACK` / `TRI-TRACK` / `QUAD-TRACK`)
1. **Phase 1 (Parallel `2..4` Subagents, `<= 4` Tool Turns & Zero Polling)**: For each selected domain (`Alpha`, `Beta`, `Delta`, `Epsilon`), define `Role`, `Non-Negotiable Mandate`, `Verification Oracle`, and **1–2 leaf skills** (NEVER meta-skills `skizzo`/`ab-bench`) and launch at Turn 1. Each subagent MUST open Line 1 with **Skill Attive (<trackId> - <Ruolo>)**: `<id>` and finish in **max 4 tool turns** citing `#Lxx-Lyy`. Immediately after `invoke_subagent`, **end the turn (`0` tool calls, `0` bytes; `schedule` and `manage_subagents` polling are FORBIDDEN)**.
2. **Phase 2 (Cross-Critique or `--mediator`)**: Cross-Critique across the `2..4` roles or **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `research`, `<id-gamma>`)** querying them via `send_message` (max 1 round) and issuing the **Lodo Arbitrale**.
3. **Phase 3 & 4 (Anti-Self-Certification Post-Code Check & 4-Column "Human-First" Output in Italian)**:
   - **No Blind `PASS`**: After the last `edit_file`, run real tests, `diff-triage.mjs`, and/or domain probes and report measured outcomes in `Oracolo & Esito`.
   - **Line 1 Banner**:
     `> [!IMPORTANT]`
     `> MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | TRI-TRACK | QUAD-TRACK — N Domini per Importanza) — Subagent: [1° <Ruolo Alpha>](conversation://<id-alpha>) · [2° <Ruolo Beta>](conversation://<id-beta>) [· [3° <Ruolo Delta>](conversation://<id-delta>) · [4° <Ruolo Epsilon>](conversation://<id-epsilon>)]`
   - **Visible Body (Plain Italian, Zero Jargon/LaTeX outside `<details>`)**: Show **Cosa cambia per te**, **Contributo dei domini attivati (in ordine di importanza)**, and **Conflitto risolto tra i ruoli (e perché vince questa sintesi)** — **Controlli**: `Tutti i test/oracoli superati (X/X OK)`. Inside `<details>` (closed, blank line after `</summary>`), render a **fixed 4-column table** (`# Dominio | Skill & Mandato | Proposta Chiave | Oracolo & Esito`).

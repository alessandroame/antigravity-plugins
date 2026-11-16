# Proactive Mentorship, Preventive Prompt Review & Self-Learning Protocol (`L0..L3`)

Defines Preventive Prompt Review (`NOTE-003`), workflow coaching, and **Cross-Workspace Zero-Prompt Self-Learning (`L0..L3`)**. Always reply to the user in plain Italian.

## 1. Anti-Noise Gate & Preventive Prompt Review (`NOTE-003`)
1. **Default Silence (`0 bytes`)**: IF the prompt names a clear target (`@file`/symbol), touches `<= 2` files, or is a read-only question / confirmation / CLI command, **emitting the Mentorship box or interrupting execution is FORBIDDEN**.
2. **Preventive Review (`evaluatePromptForPreventiveReview`)**: When `promptReview.needsReview === true` (unanchored `< 15`-word or broad multi-component mutation without verification criteria), **BEFORE modifying files**, show `promptReview.improvedPromptDraftIt` and call `ask_question` opening with `[Plugin: proactive-mentorship]` (`promptReview.reviewQuestionIt`):
   - `(Recommended) Esegui il prompt migliorato proposto`
   - `Esegui direttamente il mio prompt originale senza modifiche`
   - `Fai prima un piano dettagliato sui file coinvolti (/plan)`
3. **In-Flight Triggers (max 1 move)**: (a) Architectural/regression risk (DOM in headless core, race condition, math/3D/layout fix without invariant test, broken `360px`); (b) AGY friction (`/compact`, `/grill-me`, `/boost`, `/skizzo`, `/teamwork`, `/goal`, `/ab-bench`); (c) User correction (`"avviene ancora"`, `"non funziona"`, `"ricordati sempre"`, `"d'ora in poi"` -> run `L0..L3` directly).

## 2. Cross-Workspace Continuous Self-Learning (`L0..L3`)
Apply the minimum effective rung across Desktop/Cloud sessions:
1. **L0 (`Freq == 1`)**: Prompt refactoring (`@file`, *Prima/Dopo*, test command).
2. **L1**: Update `MEMORY.md` *in-place* (`<= 200` lines, `<= 16 KB`) + local invariant unit test (`L3`).
3. **L2**: Update canonical `antigravity-plugins/plugins/<plugin>/` (`L2b` `SKILL.md <= 200` lines or `L2a` `AGENTS.md <= 6,000 B`) in **Hybrid EN/IT**.
4. **L3 (`0 Tokens`, Highest Priority)**: Encode `< 20`-line deterministic checks in `validate.mjs`, `triage.mjs`, `ui-geometry-probe.js`, or `session-miner.mjs`.
5. **Sync & Receipt**: Run `node ~/.gemini/config/plugins/proactive-mentorship/scripts/session-miner.mjs --verify-and-sync` and append:
   `Auto-Apprendimento Applicato: [target] (L3/L2, validate + sync OK) · Scrivi "annulla regola" per ripristinare.`

## 3. Mentorship Box (`0-Click` + `<details>` in Italian)
Emit `> [!IMPORTANT]` / `> **Scrutinio & Auto-Apprendimento**: [1 frase secca].` followed by `<details><summary><strong>Proactive Mentorship, Mossa Antigravity & Diff Auto-Apprendimento (Espandi)</strong></summary>` (per `engineering-sobriety`) with **Rischio**, **Auto-Apprendimento (`L1..L3`)**, **Mossa AGY Consigliata**, and **Prompt Ottimizzato**.

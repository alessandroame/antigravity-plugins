# Adaptive Model, Mode & LUT Routing Protocol (`adaptive-router`)

Governs Prompt-to-Model+Mode LUT routing (`R1..R6` across `LOW`, `MEDIUM`, `HIGH`), inline switch banners, 1-click confirmation, and one-time roster calibration. Always reply to the user in plain Italian.

## 1. Subagent Inheritance & Operational Budget
1. **Default `Model: 'inherit'`**: Subagents MUST use `Model: 'inherit'` unless (a) explicitly requested by the user, OR (b) confirmed in **1-click** via LUT `ask_question` (`TypeName: 'self' | 'research'`). On any non-inherited dispatch or `swarm` model switch, emit at top of reply:
   `> **[adaptive-router]** Cambio modello esecuzione: **<origine>** -> **subagent <tipo> (<Model>)**`
2. **Turn Budget**: `LOW` (`R1_MECHANICAL_OPS`, `R2_QUICK_LOOKUP_MICROEDIT`): `0` subagents, `<= 2` tool turns; `MEDIUM` (`R3_CODE_INSPECTION`, `R4_SINGLE_MODULE_DEV`): `<= 4` tool turns; `HIGH` (`R5_MULTI_FILE_REFACTOR`, `R6_DEEP_ARCH_TRADEOFF`): deep verification (`skizzo` / `self` / `research`).

## 2. Switch Banner & 1-Click LUT Confirmation (`PreInvocation`)
1. **Inline Banner (`metadata.user_markdown`, `0` Tokens)**: `router-pre-hook.mjs` renders `> **[adaptive-router]** Cambio modalità/modello attivo: **<precedente>** -> **<attuale>** ...` on UI model/mode switches and non-blocking hints after `>= 2` overprovisioned lightweight turns, staying `0-byte` silent on aligned turns, `Orchestrator (Carbon/Argon)`, and `R1_MECHANICAL_OPS`.
2. **1-Click Upgrade (`[ADAPTIVE-ROUTER MISMATCH: UNDERPROVISIONED_UI_MODEL]`)**: BEFORE deep analysis or edits, call `ask_question` in plain Italian opening with `[Plugin: adaptive-router]` (merging with `proactive-mentorship` if both fire on Turn 1):
   - `(Recommended) Esegui subito in 1-click sul profilo LUT (<Modello UI> tramite subagent <self|research> Model: <pro|flash>)` -> delegate via `invoke_subagent`.
   - `Ho passato il selettore modello su <Modello UI>: procedi nel thread principale`
   - `Procedi comunque con <Modello Attivo> per questo turno`
   - `Silenzia i suggerimenti LUT per questa sessione` -> run `node ~/.gemini/config/plugins/adaptive-router/scripts/model-router.mjs --snooze-session <conversationId>`.

## 3. One-Time Roster Calibration & Contract Watchdog (`NOTE-004`)
1. **`[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE]`**: Run `swarm{action:"models"}`, sync via `model-router.mjs --sync-swarm-models <json>`, consult official docs (`gemini_search_docs` / `search_web` on `antigravity.google` / `blog.google`) **once** for uncalibrated families, and persist via `model-router.mjs --apply-calibration <json>`.
2. **`[ADAPTIVE-ROUTER: HARNESS_CONTRACT_UPDATED]`**: Notify the user in 2 plain Italian lines prefixed with `[Plugin: adaptive-router]` when `docs/hooks.md` exposes native pre-turn model override.

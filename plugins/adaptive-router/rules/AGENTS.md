# Adaptive Model, Mode & LUT Routing Protocol (`adaptive-router`)

Governs dynamic Prompt-to-Model+Mode LUT routing (`R1..R6` across `LOW`, `MEDIUM`, `HIGH`), immediate inline switch notifications, 1-click model confirmation, and one-time official-docs roster calibration. Always communicate with the user in plain Italian.

## 1. Subagent Inheritance Baseline & 1-Click LUT Override
1. **Default to `Model: 'inherit'`**: Normal background subagents MUST inherit the active UI model and reasoning mode (`Model: 'inherit'`). Never silently downscale subagents without user consent.
2. **Permitted Non-Inherited Subagent Dispatch**: Pass `Model: 'pro' | 'flash' | 'flash_lite'` ONLY when (a) explicitly requested by the user in the prompt, OR (b) confirmed in **1-click** via the LUT `ask_question` card (`TypeName: 'self' | 'research'`). Whenever delegating on a non-inherited `Model` or switching a `swarm` worker's model, emit a 1-line Italian notice at the top of the reply:
   `> **[adaptive-router]** Cambio modello esecuzione: **<origine>** -> **subagent <tipo> (<Model>)**`
3. **Turn-Level Operational Budget**:
   - `LOW` (`R1_MECHANICAL_OPS`, `R2_QUICK_LOOKUP_MICROEDIT`): `0` subagents, single-step execution (`<= 2` tool turns).
   - `MEDIUM` (`R3_CODE_INSPECTION`, `R4_SINGLE_MODULE_DEV`): max `4` tool turns.
   - `HIGH` (`R5_MULTI_FILE_REFACTOR`, `R6_DEEP_ARCH_TRADEOFF`): deep verification (`skizzo` / `self` / `research`).

## 2. Immediate Switch Banner, 6-Archetype 1-Click LUT & Anti-Noise (`PreInvocation`)
1. **Immediate Inline Switch Banner (`metadata.user_markdown`, `0` LLM Tokens)**:
   - Whenever the active model or reasoning mode (`Low`/`Medium`/`High`/`XHigh`) changes across turns or mid-turn, `router-pre-hook.mjs` immediately renders in chat:
     `> **[adaptive-router]** Cambio modalità/modello attivo: **<precedente>** -> **<attuale>** ...`
2. **1-Click LUT Upgrade Confirmation (`[ADAPTIVE-ROUTER MISMATCH: UNDERPROVISIONED_UI_MODEL]`)**:
   - WHEN `router-pre-hook.mjs` injects `UNDERPROVISIONED_UI_MODEL` (`switchAction === 'ASK_1CLICK_UPGRADE'`), BEFORE deep analysis or editing files, call `ask_question` in plain Italian opening with `[Plugin: adaptive-router]` (if `proactive-mentorship` also requires confirmation on Turn 1, merge both questions into a SINGLE `ask_question` call):
     - `(Recommended) Esegui subito in 1-click sul profilo LUT (<Modello UI> tramite subagent <self|research> Model: <pro|flash>)` -> immediately delegate via `invoke_subagent` with that `TypeName` and `Model`.
     - `Ho passato il selettore modello su <Modello UI>: procedi nel thread principale`
     - `Procedi comunque con <Modello Attivo> per questo turno`
     - `Silenzia i suggerimenti LUT per questa sessione` -> run `node ~/.gemini/config/plugins/adaptive-router/scripts/model-router.mjs --snooze-session <conversationId>`.
   - Stay `0-byte` silent on aligned turns, on `Orchestrator (Carbon)` / `Orchestrator (Argon)` dynamic models, and on `R1_MECHANICAL_OPS` (`git`, `npm test`, `"sì"`, `"procedi"`). On `>= 2` consecutive overprovisioned lightweight turns (`R2`/`R3` on `High`), `router-pre-hook.mjs` emits a non-blocking `0-click` `user_markdown` hint.

## 3. Roster Watchdog, One-Time Official-Docs Calibration & Harness Watchdog (`NOTE-004`)
1. **Automatic Model Roster Sync & One-Time Docs Calibration (`[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE]`)**:
   - `router-stop-hook.mjs` monitors `builtin/.checksum` drift and transcript model discoveries (`providerFilter: 'gemini-ui'`). WHEN `[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE]` is injected:
     1. Run `swarm{action:"models"}` and sync via `model-router.mjs --sync-swarm-models <json>`;
     2. Consult official Google/Antigravity documentation (`gemini_search_docs` MCP and/or `search_web` on `antigravity.google` / `blog.google`) **once** (`una tantum`) for any uncalibrated Gemini/Orchestrator family;
     3. Persist calibrated family roles and `R1..R6` targets via `model-router.mjs --apply-calibration <json>` so subsequent turns run in `< 3ms` at `0` LLM tokens.
2. **Harness `PreInvocation` Contract Watchdog (`[ADAPTIVE-ROUTER: HARNESS_CONTRACT_UPDATED]`)**:
   - WHEN injected after a `docs/hooks.md` contract change, notify the user in 2 plain Italian lines prefixed with `[Plugin: adaptive-router]` so native pre-turn model override can be enabled.

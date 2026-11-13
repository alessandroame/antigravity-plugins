# [2026-11-13] ADR: Evoluzione `adaptive-router` v1.2.0 — Tabella LUT a 6 Archetipi, Banner Switch a `0` Token, Conferma 1-Click e Calibrazione Roster `Una Tantum`

## Contesto & Motivazione
Dall'esperienza operativa maturata nella sessione `FEAT-033` di `ParagliderSim` (`NOTE-004`), è emersa l'esigenza di:
1. Ricevere notifica immediata nell'output della chat a ogni cambio di modello o di modalità di ragionamento (`Low`, `Medium`, `High`, `XHigh`), sia tra turni sia a metà turno.
2. Intercettare il sottodimensionamento del modello UI e offrire in **1 click** un cambio effettivo del modello di esecuzione basato su una **tabella LUT dinamica** mappata su tutte le **6 famiglie Gemini / Orchestrator** presenti nel selettore UI di Antigravity (`Gemini 4 Carbon`, `Gemini 4 Argon`, `Gemini 4 Hydrogen`, `Orchestrator (Carbon)`, `Orchestrator (Argon)`, `Gemini 3.8 Flash`, escludendo Claude e GPT-OSS).
3. Aggiornare automaticamente via hook l'elenco dei modelli disponibili e calibrare **una tantum** i nuovi modelli consultando la documentazione ufficiale Google / Antigravity, mantenendo `0` token di costo sui turni ordinari.

## Decisioni Architetturali
1. **Banner Immediato a `0` Token (`PreInvocation` `metadata.user_markdown`)**:
   - `router-pre-hook.mjs` confronta l'ID canonico normalizzato (`normalizeCanonicalModelId`) tra `payload.modelName`, `.route_<id>.json` e l'ultimo blocco `<USER_SETTINGS_CHANGE>` del transcript (ignorando le transizioni iniziali da `None`/`Default`), iniettando `systemMessage: ""` + `metadata.user_markdown` per stampare istantaneamente la transizione senza consumare token LLM.
2. **Sanitizzazione `<USER_SETTINGS_CHANGE>`, Blocco Modi Espliciti & Watchdog Contratto `hooks.md`**:
   - `sanitizeModelSelectionName` rimuove il testo accessorio di sistema (`No need to comment...`) e `cleanPollutedModelRegistry` bonifica automaticamente eventuali chiavi storiche sporche in `model-capabilities.json`.
   - `extractExplicitReasoningMode` blocca il tier esplicito tra parentesi (`(Low)` -> `LOW`, `(Medium)` -> `MEDIUM`, `(High)`/`(XHigh)` -> `HIGH`) impedendo che turni multi-tool lenti promuovano erroneamente un modello `(Low)` a `HIGH`.
   - `probeBuiltinChecksumDrift` calcola l'hash SHA-256 della sezione `PreInvocation` di `builtin/skills/agy-customizations/docs/hooks.md`, notificando una sola volta (`HARNESS_CONTRACT_UPDATED`) quando Antigravity abiliterà l'override nativo pre-turno del selettore UI.
3. **Tabella LUT a 6 Archetipi (`R1..R6`), Conferma 1-Click Subagent/UI e Guardia Anti-Rumore**:
   - Introdotti i 6 archetipi `PROMPT_ARCHETYPES` (`R1_MECHANICAL_OPS` .. `R6_DEEP_ARCH_TRADEOFF`) e `resolveLutRoute` in `core/router-engine.mjs`.
   - Verificato empiricamente che `swarm{action:"model"}` opera solo dentro uno swarm attivo, mentre `invoke_subagent` (`TypeName: 'self' | 'research'`, `Model: 'pro' | 'flash' | 'flash_lite'`) consente il cambio effettivo del modello di esecuzione in **1 click** direttamente dalla prima opzione di `ask_question` (affiancata dall'indicazione della voce UI consigliata e dall'opzione `--snooze-session`).
   - Gli `Orchestrator` dinamici (`Orchestrator (Carbon)`, `Orchestrator (Argon)`) e le operazioni meccaniche `R1` restano sempre silenziosi (`switchAction: 'NONE'`), mentre il suggerimento `0-click` di downgrade scatta solo al 2° turno leggero consecutivo su `High`.
4. **Hook di Aggiornamento Roster + Calibrazione Documentazione Ufficiale `Una Tantum`**:
   - `importSwarmModelsCatalog` filtra il catalogo runtime di `swarm{action:"models"}` (`providerFilter: 'gemini-ui'`, `15` varianti attive) e segnala le famiglie non calibrate in `pendingDocCalibration`.
   - `router-stop-hook.mjs` sorveglia le variazioni di `builtin/.checksum` e i nuovi modelli nei transcript, facendo scattare una sola volta `[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE]` in `router-pre-hook.mjs` per sincronizzare il roster e applicare `applyOfficialDocsCalibration` (`--apply-calibration`).

## Impatto e Conseguenze
- **Moduli aggiornati**: `plugins/adaptive-router/core/router-engine.mjs`, `scripts/model-router.mjs`, `scripts/router-pre-hook.mjs`, `scripts/router-stop-hook.mjs`, `rules/AGENTS.md`, `skills/model-router/SKILL.md`, `plugin.json` (`1.2.0`), `README.md`, `DESIDERATA.md`, `NOTES.md`.
- **Verifica e Test**: `13/13` test unitari ed end-to-end verdi in `plugins/adaptive-router/tests/router-engine.test.mjs`, `107/107` test totali di repository (`npm test`), `16/16` plugin conformi (`validate.mjs --all`, `0` errori/avvisi), `diff-triage.mjs` `PASS` e sincronizzazione globale eseguita.

# 2026-10-28 — Progettazione e Implementazione Plugin `pattern-harvester` v1.0.0 (Mining Periodico Pattern di Lavoro e Interazione, Calcolo ROI KLM/GOMS e Scaffolding Pre-Validato)

- **Tipo**: Nuovo Plugin di Process & Workflow Mining Periodico (`plugins/pattern-harvester/` v1.0.0)
- **File Coinvolti**:
  - [`plugins/pattern-harvester/plugin.json`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/plugin.json)
  - [`plugins/pattern-harvester/hooks.json`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/hooks.json)
  - [`plugins/pattern-harvester/core/harvester-engine.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/core/harvester-engine.mjs)
  - [`plugins/pattern-harvester/scripts/pattern-harvester.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/pattern-harvester.mjs)
  - [`plugins/pattern-harvester/scripts/periodic-harvester-hook.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/periodic-harvester-hook.mjs)
  - [`plugins/pattern-harvester/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/rules/AGENTS.md)
  - [`plugins/pattern-harvester/skills/pattern-harvester/SKILL.md`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/skills/pattern-harvester/SKILL.md)
  - [`plugins/pattern-harvester/skills/pattern-harvester/references/pattern-mining-methodology.md`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/skills/pattern-harvester/references/pattern-mining-methodology.md)
  - [`plugins/pattern-harvester/README.md`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/README.md)
  - [`plugins/pattern-harvester/tests/pattern-harvester.test.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/tests/pattern-harvester.test.mjs)

## 1. Contesto e Motivazione Architetturale
Mentre `telemetry-analytics` aggrega contatori piatti di token/tool e `proactive-mentorship` (`session-miner.mjs`) intercetta reattivamente segnali lessicali di errore o correzione, mancava nell'ecosistema un motore dedicato a scoprire **periodicamente** le sequenze operative multi-step, le pipeline di comandi shell e gli archetipi di richiesta ripetuti con successo nelle sessioni di lavoro (`transcript.jsonl`) per proporne l'automazione tramite nuove Skill o Plugin.

## 2. Decisioni Progettuali Principali (`DUAL-TRACK` Alpha & Beta)
1. **Estrazione Strutturale a 3 Canali (`core/harvester-engine.mjs`)**:
   - **Canale 1 (`TOOL_CHAIN`)**: compressione Run-Length Encoding (RLE) delle chiamate contigue dello stesso tool e generazione di `3..5-grammi` contenenti almeno un'azione operativa strutturata (`EXEC:TEST`, `EXEC:VALIDATE`, `EXEC:SYNC`, `EXEC:GIT`, `EXEC:NODE`, `WRITE:TEST`, `WRITE:SKILL`, `EDIT:COGNITIVE`, `ORCHESTRATE:SUBAGENT`, `SCHEDULE:TASK`).
   - **Canale 2 (`CLI_SEQUENCE`)**: unwrapping dei valori doppiamente quotati in JSON (`unwrapTranscriptString`) e normalizzazione degli scheletri CLI (`<dir>/script.mjs`, `<path>`, `<uuid>`, `"<str>"`, `<num>`).
   - **Canale 3 (`INTERACTION_ARCHETYPE`)**: clustering per similarità di Jaccard (`>= 0.35`) su token lessicali e 2-shingle estratti dai prompt utente senza regex cablate su esempi specifici (`Anti-Example Hardcoding`).
2. **Gate Anti-Collisione e Modello ROI KLM/GOMS**:
   - Indicizzazione automatica delle skill/plugin installati (`loadInstalledCatalogEntries`) con assegnazione di `scriptBonus = 0.75` (`ALREADY_COVERED`) quando uno scheletro CLI invoca uno script già censito in `plugins/*/scripts/`.
   - Stima del risparmio netto su 15 sessioni (`savedSecondsPerRun = 18 + 11 * avgSteps`, `T_setup = 40s`) con instradamento deterministico su 5 esiti (`IGNORE`, `RULE_OR_GUARD`, `SKILL_EXTENSION`, `NEW_SKILL`, `NEW_PLUGIN`) e cooldown di 30 giorni sui pattern scartati (`--dismiss`).
3. **Controllo Periodico Silenzioso (`Stop` Hook)**:
   - `periodic-harvester-hook.mjs` verifica a fine turno (`< 5ms`, `stdout: "{}\n"`) il raggiungimento di `5` nuove sessioni umane (o `24` ore) e avvia `pattern-harvester.mjs --incremental --quiet` in background detached.

## 3. Verifica e Validazione
- Suite unitaria [`plugins/pattern-harvester/tests/pattern-harvester.test.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/tests/pattern-harvester.test.mjs): `8/8` test superati (`0` fallimenti).
- Validatore statico `node scripts/validate.mjs --all`: `14/14` plugin verificati con `0` errori e `0` avvisi.

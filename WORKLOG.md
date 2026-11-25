# Giornale Cronologico degli Interventi & ADR (WORKLOG)

Giornale a finestra mobile (rolling window, max **250–300 righe** / **ultimi 15 interventi**) delle decisioni architetturali e operative nel repository `antigravity-plugins`.
> **Archivio Storico**: Il diario cronologico esteso pre-compattazione è conservato in [`.agents/archive/WORKLOG_v1_archive.md`](file:///c:/github/antigravity-plugins/.agents/archive/WORKLOG_v1_archive.md) e nelle singole schede granulari in `.agents/worklog.d/`.

---

## Indice Sintetico delle Fasi Consolidate (Archiviate in `WORKLOG_v1_archive.md`)

- **Fase 1 (Catalogo Base, Validatore & Documentazione — 2026-10-07)**: Creazione dei 7 plugin fondativi (`engineering-sobriety`, `laws-of-ux`, `execution-guard`, `engineering-workflow`, `cognitive-persistence`, `proactive-mentorship`, `skill-governance`), template `starter-plugin` e validatore `scripts/validate.mjs`.
- **Fase 2 (Start-of-Task `/next-step`, Ridenominazione Connect-RPC & Telemetria Base — 2026-10-07)**: Introduzione di `/next-step`, script `set-chat-title.mjs` su Connect-RPC (`UpdateConversationAnnotations`) e plugin `telemetry-analytics` v1.0.0 (`collector.mjs`, `report.mjs`).
- **Fase 3 (Sync Fisico Globale Anti-Junction & Integrazione Audit GlideMind — 2026-10-09/10)**: Divieto di NTFS Directory Junctions su Windows con introduzione di `scripts/sync-to-global.mjs` (`npm run sync`), skill `shift-left-governance`, `ux-outdoor-and-field-ergonomics`, bando emoji decorative e guardia mock API esterne.
- **Fase 4 (Auto-Skizzo Silente, Auto-Apprendimento `L1..L3` & Bonifica Token Cross-Repo — 2026-10-21)**: Attivazione `Auto-Skizzo Silente` (`triage.mjs`), introduzione `session-miner.mjs`, tetti in byte su `MEMORY.md`/`WORKLOG.md`/`AGENTS.md` e filtro subagent in `governor-hook.mjs`.

---

## 2026-11-25 — Rilascio `ab-bench` v1.1.0 & Skill `/discovery-loop` (Motore Pareto, 4 Oracoli, Uscita Composita e Pilota Reale)
- **Tipo**: Estensione Plugin Pure-Skill (`0 B` inline), Core Headless, Workflow Python & Pilota End-to-End (`plugins/ab-bench/` v1.1.0, `README.md`, `DESIDERATA.md`, `MEMORY.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-25_ab-bench-v110-discovery-loop.md`](./.agents/worklog.d/2026-11-25_ab-bench-v110-discovery-loop.md)
- **Sintesi**:
  - Implementati [`discovery-engine.mjs`](./plugins/ab-bench/core/discovery-engine.mjs), CLI [`discovery.mjs`](./plugins/ab-bench/scripts/discovery.mjs), template `run_workflow` [`discovery_workflow_template.py`](./plugins/ab-bench/references/discovery_workflow_template.py) e skill [`discovery-loop/SKILL.md`](./plugins/ab-bench/skills/discovery-loop/SKILL.md) con politica di uscita composita a 5 condizioni (`quick`/`deep`/`overnight`), `9/9` test offline e pilota reale su `triage.mjs` (`TARGET_SATISFICED` in `1` ondata, `405.3s`, `main` intatto).

---

## 2026-11-24 — Studio Ciclo di Scoperta Orchestrato Guidato da Oracoli (`oracle-guided-discovery-loop`)
- **Tipo**: Studio Architetturale & Pianificazione Prioritaria (`.agents/plans/oracle-guided-discovery-loop.md`, `DESIDERATA.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-24_oracle-guided-discovery-loop-study.md`](./.agents/worklog.d/2026-11-24_oracle-guided-discovery-loop-study.md)
- **Sintesi**:
  - Codificato come prossima attività prioritaria il protocollo di scoperta da 1h+ a `0 B` inline basato su mutatori non convenzionali (utente distratto, abolizionista, scettico/fuzzer), worktree isolati (`run_workflow`), 4 oracoli oggettivi (dati reali, fuzzing, test cognitivo cieco su screenshot, sonde tecniche) e selezione umana finale.

---

## 2026-11-19 — Valutazione AI-Native SDLC Playbook e Piano dei 3 Innesti Chirurgici (`sdlc-three-grafts`)
- **Tipo**: Analisi Architetturale & Pianificazione Esecutiva (`.agents/plans/sdlc-three-grafts.md`, `DESIDERATA.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-19_ai-native-sdlc-three-grafts-plan.md`](./.agents/worklog.d/2026-11-19_ai-native-sdlc-three-grafts-plan.md)
- **Sintesi**:
  - Scartata la trafila multi-comitato (`intent.md -> spec.md -> REVIEW.md`, già coperta per ~`80%` dal catalogo) e progettati 3 innesti a `0 B` inline: deriva `Piano <-> Diff` (`engineering-workflow`), regressione trigger `SKILL.md` (`skill-governance`) e bande `1σ/2σ/3σ` (`execution-guard` + `gh-board-sync.mjs`).

---

## 2026-11-17 — Rilascio `laws-of-ux` v1.3.0: Architettura a 3 Livelli per Grafici Temporali Espressivi (`L2b` Skill + `L2c` Subagente + `L3` Sonda SVG)
- **Tipo**: Evoluzione Skill Multivariata, Subagente Critico `L2c` & Sonda Gate 4 `L3` (`plugins/laws-of-ux/` v1.3.0, `ui-geometry-probe.js`, `scripts/sync-to-global.mjs`, `MEMORY.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-17_expressive-charts-3-tier-laws-of-ux-v130.md`](./.agents/worklog.d/2026-11-17_expressive-charts-3-tier-laws-of-ux-v130.md)
- **Sintesi**:
  - Estesa `ux-telemetry-and-decision-charts` (`L2b`) e la sua reference con i 5 pilastri della codifica espressiva (canali ortogonali Bertin/Flowx, poligoni differenziali Playfair, bande d'incertezza e *floating range bars* su scala condivisa, interpolazione cubica monotona `Fritsch-Carlson`) e introdotto il subagente read-only `telemetry-chart-critic` (`L2c`) con sync automatico in `~/.gemini/agents/`.
  - Estesa `ui-geometry-probe.js` (`L3`) per intercettare `SVG_TEXT_OVERLAP`, `SVG_CURSOR_COLLISION` (`< 18px`) e `CHART_OVER_BOXING` (`> 1` bordo concentrico), con `111/111` test verdi e riallineamento completo di `~/.gemini` (`33` skill).

---

## 2026-11-16 — Snellimento Budget Regole Inline (`-32,7%`), Guardia `48 KB` (`defaultRulesBudget`) e Blocco Self-Mirroring `~/.gemini/config`
- **Tipo**: Ottimizzazione Token `Always-On`, Bugfix Sync Multi-Disco & Guardia Statica `L3` (`scripts/sync-to-global.mjs`, `scripts/validate.mjs`, `plugins/*`, `README.md`, `MEMORY.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-16_inline-rules-budget-and-anti-self-mirroring.md`](./.agents/worklog.d/2026-11-16_inline-rules-budget-and-anti-self-mirroring.md)
- **Sintesi**:
  - Portati `ab-bench` e `code-inspector` a skill pure (`0` B `Always-On`), compattati `pattern-harvester`, `skizzo`, `adaptive-router`, `proactive-mentorship`, `mapek` e `GEMINI.md` (`61,8 -> 41,6 KB`, `-32,7%`) e introdotto il tetto bloccante `MAX_AGGREGATE_INLINE_RULES_BYTES = 48000` in [`scripts/validate.mjs`](./scripts/validate.mjs).
  - Risolto il self-mirroring di `~/.gemini/config` su dischi `D:/Github/` tramite `isCanonicalCatalogRepoRoot` in [`sync-to-global.mjs`](./scripts/sync-to-global.mjs), [`eta-injector.mjs`](./plugins/telemetry-analytics/scripts/eta-injector.mjs) e [`session-miner.mjs`](./plugins/proactive-mentorship/scripts/session-miner.mjs), potando `127` skill di plugin disabilitati da `~/.gemini/skills/` (`109/109` test verdi).

---

## 2026-11-13 — Rilascio `adaptive-router` v1.2.0: Tabella LUT a 6 Archetipi, Banner Switch `0`-Token, Conferma 1-Click e Calibrazione Roster `Una Tantum` (`NOTE-004`)
- **Tipo**: Evoluzione Plugin Routing Dinamico, Hook `PreInvocation`/`Stop` & Calibrazione Ufficiale (`plugins/adaptive-router/` v1.2.0, `DESIDERATA.md`, `NOTES.md`, `MEMORY.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-13_adaptive-router-v120-lut-switch-banner.md`](./.agents/worklog.d/2026-11-13_adaptive-router-v120-lut-switch-banner.md)
- **Sintesi**:
  - Introdotta la LUT a 6 archetipi (`R1..R6`) calibrata sulla documentazione ufficiale per le 6 famiglie Gemini/Orchestrator (`15` varianti da `swarm{action:"models"}`, filtro `gemini-ui`), il banner immediato in chat a `0` token (`metadata.user_markdown`) sui cambi modello/modalità e la conferma a 1 click (`invoke_subagent` `self`/`research` + opzione `--snooze-session`) in [`router-pre-hook.mjs`](./plugins/adaptive-router/scripts/router-pre-hook.mjs).
  - Attivato il blocco dei modi espliciti `(Low)`/`(Medium)`/`(High)`/`(XHigh)`, l'hash SHA-256 del contratto `PreInvocation` (`hooks.md`) e il trigger `CALIBRATE_MODEL_ROSTER_ONCE` su aggiornamenti `.checksum` o nuove famiglie Gemini (`13/13` test in [`router-engine.test.mjs`](./plugins/adaptive-router/tests/router-engine.test.mjs), `107/107` suite globale).

---

## 2026-11-09 — Estensione Footer Token di Fine Risposta a 4 Valori con Dimensione Contesto (`Contesto: <ctx>`)
- **Tipo**: Evoluzione Regola Telemetria & Bootstrap Cloud (`plugins/telemetry-analytics/rules/AGENTS.md`, `scripts/sync-to-global.mjs`, `MEMORY.md`, `DESIDERATA.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-09_context-window-footer-telemetry-analytics.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-11-09_context-window-footer-telemetry-analytics.md)
- **Sintesi**:
  - Aggiornato il formato del footer automatico di fine risposta da 3 a 4 valori (`> Prompt #<N>: <in> in / <out> out · Contesto: <ctx> · Sessione: <totSessione>`) per esporre in tempo reale l'occupazione della finestra di contesto (`input_tokens + cache_read_tokens` dell'ultimo passo) in [`plugins/telemetry-analytics/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/rules/AGENTS.md) e nel bootstrap globale [`scripts/sync-to-global.mjs`](file:///c:/github/antigravity-plugins/scripts/sync-to-global.mjs).

---

## 2026-11-08 — Bootstrap Cloud Permanente (`~/.gemini/GEMINI.md`), Bonifica Ricettoni (`Anti-Illusion` & `Anti-Example Hardcoding`), Guardia L3 `mandatory-exit-oracle-check` e Taglio Consumo Token (`LOW` Tier)
- **Tipo**: Architettura Ibrida Desktop/Cloud, Bonifica Euristiche `Anti-Illusion`, Guardie L3 `mapek` & Ottimizzazione Token (`proactive-mentorship`, `skizzo`, `pattern-harvester`, `adaptive-router`, `engineering-workflow`, `telemetry-analytics`)
- **Dettagli**: [`.agents/worklog.d/2026-11-08_cloud-session-supervision-and-preventive-prompt-review.md`](file:///home/antigravity/alessandroame/antigravity-plugins/.agents/worklog.d/2026-11-08_cloud-session-supervision-and-preventive-prompt-review.md)
- **Sintesi**:
  - Risolto il mancato caricamento dei plugin nelle sessioni Cloud (`jetski`) compilando i contratti Always-On in `~/.gemini/GEMINI.md`, tagliando i round-trip CLI separati sui turni meccanici `LOW` (`commit e push`, `si`, `procedi`, `/memory-sync`), velocizzando la sincronizzazione FUSE (`size + mtimeMs` in [`sync-to-global.mjs`](file:///home/antigravity/alessandroame/antigravity-plugins/scripts/sync-to-global.mjs)) e attivando la guardia deterministica L3 [`mandatory-exit-oracle-check.mjs`](file:///home/antigravity/alessandroame/antigravity-plugins/plugins/mapek/scripts/guards/mandatory-exit-oracle-check.mjs) (`mapek-353df5ce`).
  - Bonificati 7 ricettoni cross-plugin: rimossi i `token_usage` sintetici (`18000/12000/950`) e il fallback `task:task-<num>.log` in [`session-miner.mjs`](file:///home/antigravity/alessandroame/antigravity-plugins/plugins/proactive-mentorship/scripts/session-miner.mjs) e [`harvester-engine.mjs`](file:///home/antigravity/alessandroame/antigravity-plugins/plugins/pattern-harvester/core/harvester-engine.mjs) (eliminato il falso positivo `pat-1e65506c77`), rimossi i vocaboli 3D di `GlideMind` da [`triage.mjs`](file:///home/antigravity/alessandroame/antigravity-plugins/plugins/skizzo/scripts/triage.mjs), azzerate le durate fittizie `25000ms` in [`router-engine.mjs`](file:///home/antigravity/alessandroame/antigravity-plugins/plugins/adaptive-router/core/router-engine.mjs) e generalizzata la guardia `HEURISTIC_ALIAS_OR_MAGIC_SCALE` in [`review-guard-engine.mjs`](file:///home/antigravity/alessandroame/antigravity-plugins/plugins/engineering-workflow/core/review-guard-engine.mjs).

---

## 2026-11-07 — Benchmark A/B Cieco (`GO`, `-21,6%` Byte) e Migrazione Universale allo Standard Ibrido `EN/IT` (`EN` Logic / `IT` User-Facing)
- **Tipo**: Migrazione Catalogo, Guardie Bilingui `L3` & Standard Permanente (`plugins/*`, `.agents/skills/*`, `templates/*`, `scripts/validate.mjs`, `MEMORY.md`, `DESIDERATA.md`)
- **Dettagli**: [`.agents/worklog.d/2026-11-07_hybrid-en-it-migration.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-11-07_hybrid-en-it-migration.md)
- **Sintesi**:
  - Eseguito il benchmark cieco `/ab-bench` su 3 scenari (`S1`, `S2`, `S3`) con verdetto **`GO`** (`-21,6%` byte combinati su `execution-guard` e `mapek`, `+1` dito guadagnato su `S2` `4/5 -> 5/5`, `lostFingers: []`, `Language Drift = 0`).
  - Convertiti in auto-discovery tutti i `56` file normativi (`19` `rules/*.md`, `35` `SKILL.md`, `2` `agents/*.md`) in **Hybrid EN/IT** (`EN` imperativo + `IT` contratto visibile/trigger, zero path hardcoded `c:/github/...`), adeguate le guardie bilingui `L3` e codificato lo standard permanente in `skill-governance`, `proactive-mentorship`, `mapek`, `pattern-harvester`, `starter-plugin` e `MEMORY.md`.

---

## 2026-10-30 — Automazione Pre-Review Cieca (`/review-diff`), Guardia Integrità Test, Runner UI Multi-Viewport e Gate `Stop` sul Transcript (`engineering-workflow` v1.3.0)
- **Tipo**: Guardie Eseguibili `L3`, Hook `Stop` & Pre-Review Avversariale (`plugins/engineering-workflow/` v1.3.0, `scripts/run-all-tests.mjs`, `package.json`, `session-miner.mjs`)
- **Dettagli**: [`.agents/worklog.d/2026-10-30_review-and-delivery-automation-gates.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-30_review-and-delivery-automation-gates.md)
- **Sintesi**:
  - Creato [`review-guard-engine.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/core/review-guard-engine.mjs) (`8/8` test in [`review-guard.test.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/tests/review-guard.test.mjs)) e [`run-all-tests.mjs`](file:///c:/github/antigravity-plugins/scripts/run-all-tests.mjs), unificando `npm test` e [`session-miner.mjs`](file:///c:/github/antigravity-plugins/plugins/proactive-mentorship/scripts/session-miner.mjs) con auto-discovery di tutte le `10` suite `*.test.mjs` più guardia contro manomissione test e faux-test in [`diff-triage.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/diff-triage.mjs) (`/review-diff`).
  - Attivato l'hook `Stop` [`delivery-gate-hook.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/delivery-gate-hook.mjs) (verifica sul transcript che test e sonda UI siano successivi all'ultimo `edit_file`, circuit breaker 1-retry) e il runner headless multi-viewport [`ui-smoke-runner.mjs`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/ui-smoke-runner.mjs) (`.agents/smoke-flows.json`).

---

## 2026-10-30 — Plugin Supervisore Sempre Attivo `mapek` v1.0.0 (Human-Gated MAPE-K, Subagent `L2c` `agents/*.md`) e Protocollo Semantic Drill-Down (`L0 -> L1 -> L2`)
- **Tipo**: Nuovo Plugin di Supervisione Processi, Validazione `L2c` & Ergonomia Output (`plugins/mapek/` v1.0.0, `plugins/engineering-sobriety/`, `scripts/validate.mjs`)
- **Dettagli**: [`.agents/worklog.d/2026-10-30_mapek-supervisor-and-semantic-drill-down.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-30_mapek-supervisor-and-semantic-drill-down.md)
- **Sintesi**:
  - Creato il supervisore sempre attivo [`mapek`](file:///c:/github/antigravity-plugins/plugins/mapek/README.md) (`Stop` + `PreInvocation` hook a `0` rumore, 5 detector di traiettoria in [`trajectory-analyzer.mjs`](file:///c:/github/antigravity-plugins/plugins/mapek/core/trajectory-analyzer.mjs), router `L3/L2c/L2b/L2a/PRUNE` in [`primitive-router.mjs`](file:///c:/github/antigravity-plugins/plugins/mapek/core/primitive-router.mjs), consenso umano obbligatorio `--confirm-user-approval` e audit post-10-sessioni in [`mastery-ledger.mjs`](file:///c:/github/antigravity-plugins/plugins/mapek/core/mastery-ledger.mjs)), applicando la prima decisione approvata `agents/autonomous-verification-runner.md` (`87/87` test verdi).
  - Codificato lo standard globale **Semantic Drill-Down (`L0 -> L1 -> L2`)** in [`engineering-sobriety/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/engineering-sobriety/rules/AGENTS.md) ed esteso [`scripts/validate.mjs`](file:///c:/github/antigravity-plugins/scripts/validate.mjs) alla validazione CommonMark dei `<details>` annidati e dei subagent `plugins/*/agents/*.md`.

---

## 2026-10-28 — Progettazione e Implementazione Plugin `pattern-harvester` v1.0.0 (Mining Periodico Pattern Operativi, ROI KLM/GOMS e Scaffolding `/pattern-harvester`)
- **Tipo**: Nuovo Plugin di Process & Workflow Mining Periodico (`plugins/pattern-harvester/` v1.0.0, `README.md`, `DESIDERATA.md`, `MEMORY.md`)
- **Dettagli**: [`.agents/worklog.d/2026-10-28_pattern-harvester-plugin.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-28_pattern-harvester-plugin.md)
- **Sintesi**:
  - Creato il plugin [`pattern-harvester`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/README.md) con motore headless [`harvester-engine.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/core/harvester-engine.mjs) (`8/8` test in [`pattern-harvester.test.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/tests/pattern-harvester.test.mjs)): estrazione a 3 canali (n-grammi RLE di tool call `3..5`, scheletri CLI con `unwrapTranscriptString` e clustering Jaccard su 2-shingle), deduplicazione sul catalogo installato e matrice decisionale ROI KLM/GOMS (`>= 120s` per `NEW_SKILL`, `>= 240s` per `NEW_PLUGIN`).
  - Configurato il controllo periodico silenzioso sull'evento `Stop` ([`periodic-harvester-hook.mjs`](file:///c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/periodic-harvester-hook.mjs), `< 5ms`, avvio detached ogni `5` sessioni umane o `24h`), la skill `/pattern-harvester` e il generatore di scaffold `--scaffold <patternId>` conforme a `scripts/validate.mjs`.

---

## 2026-10-28 — Guardia Portabilità Multi-Macchina (`HARDCODED_USER_PATH`), Shim `pwsh` e Audit `skill-collision-check` Cross-Workspace
- **Tipo**: Portabilità Multi-Macchina, Validatore Statico `L3` & Igiene Skill Workspace (`scripts/validate.mjs`, `plugins/*`, `c:/github/*`)
- **Dettagli**: [`.agents/worklog.d/2026-10-28_multi-machine-path-portability-and-workspace-audit.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-28_multi-machine-path-portability-and-workspace-audit.md)
- **Sintesi**:
  - Rimossi i puntamenti hardcoded `C:/Users/aless/` in 4 file dei plugin e in `GlideMind/.agents/rules/constraints.md` a favore del percorso canonico `c:/github/antigravity-plugins/plugins/...`, codificando la guardia statica `HARDCODED_USER_PATH` (`L3`) in [`scripts/validate.mjs`](file:///c:/github/antigravity-plugins/scripts/validate.mjs#L82-L100) e lo shim `pwsh.cmd` in `%LOCALAPPDATA%\Microsoft\WindowsApps`.
  - Eseguito `skill-collision-check` su `191` skill locali/globali (`0` collisioni `P0`), specializzando i trigger in `Quiz_VDS-VL`, compattando `14` `description` entro `[80, 250]` char (`Quiz_VDS-VL`, `WeatherNerdWearOs`, `AgentBridge`) e convertendo a `trigger: model_decision` le regole verticali di `ParaMeteo*`.


# Giornale Cronologico degli Interventi & ADR (WORKLOG)

Giornale a finestra mobile (rolling window, max **250–300 righe** / **ultimi 15 interventi**) delle decisioni architetturali e operative nel repository `antigravity-plugins`.
> **Archivio Storico**: Il diario cronologico esteso pre-compattazione è conservato in [`.agents/archive/WORKLOG_v1_archive.md`](file:///c:/github/antigravity-plugins/.agents/archive/WORKLOG_v1_archive.md) e nelle singole schede granulari in `.agents/worklog.d/`.

---

## Indice Sintetico delle Fasi Consolidate (Archiviate in `WORKLOG_v1_archive.md`)

- **Fase 1 (Catalogo Base, Validatore & Documentazione — 2026-10-07)**: Creazione dei 7 plugin fondativi (`engineering-sobriety`, `laws-of-ux`, `execution-guard`, `engineering-workflow`, `cognitive-persistence`, `proactive-mentorship`, `skill-governance`), template `starter-plugin` e validatore `scripts/validate.mjs`.
- **Fase 2 (Start-of-Task `/next-step`, Ridenominazione Connect-RPC & Telemetria Base — 2026-10-07)**: Introduzione di `/next-step`, script `set-chat-title.mjs` su Connect-RPC (`UpdateConversationAnnotations`) e plugin `telemetry-analytics` v1.0.0 (`collector.mjs`, `report.mjs`).
- **Fase 3 (Sync Fisico Globale Anti-Junction & Integrazione Audit GlideMind — 2026-10-09/10)**: Divieto di NTFS Directory Junctions su Windows con introduzione di `scripts/sync-to-global.mjs` (`npm run sync`), skill `shift-left-governance`, `ux-outdoor-and-field-ergonomics`, bando emoji decorative e guardia mock API esterne.

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

---

## 2026-10-25 — Evoluzione `telemetry-analytics` v2.0.0–v2.1.0 (Backfill Sessioni Locali `brain/`, Report Token per Prompt e Dashboard HTML)
- **Tipo**: Osservabilità Personale, Mining Transcript & Contabilità Token per Prompt (`plugins/telemetry-analytics/` v2.1.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-25_telemetry-analytics-v2-session-backfill-and-per-prompt-tokens.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-25_telemetry-analytics-v2-session-backfill-and-per-prompt-tokens.md)
- **Sintesi**:
  - Creato [`session-backfill.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/core/session-backfill.mjs) (`5/5` test in [`session-backfill.test.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/tests/session-backfill.test.mjs)) per indicizzare incrementalmente `~/.gemini/antigravity/brain/` (`sessions-index.json` schema `v3`, tempi attivi netti, abitudini orarie, modelli, slash command e `promptsBreakdown[]` per singolo prompt) e corretto il supporto `read_file`/`totalSessions` in [`collector.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/collector.mjs).
  - Introdotta la Dashboard HTML a 5 tab ([`usage-dashboard-template.html`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/references/usage-dashboard-template.html)), il flag `--session <id>` in [`report.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/report.mjs) e la regola del footer minimale a 3 valori in [`rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/rules/AGENTS.md) (`> Prompt #<N>: <in> in / <out> out · Sessione: <totSessione>`).

---

## 2026-10-22 — Evoluzione `skizzo` v1.7.0 (Orchestrazione Multi-Dominio Dinamica `2..4` Agenti Ordinati per Importanza dall'LLM, Audit `TRI-TRACK` e Regola `Anti-Example Hardcoding`)
- **Tipo**: Evoluzione Protocollo Multi-Agente, Ranking Dominio-Agnostico & Governance Skill (`plugins/skizzo/` v1.7.0, `plugins/skill-governance/`, `plugins/ab-bench/`)
- **Dettagli**: [`.agents/worklog.d/2026-10-22_skizzo-dynamic-multi-domain-ranking.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-22_skizzo-dynamic-multi-domain-ranking.md)
- **Sintesi**:
  - Sostituito il vincolo fisso a 2 ruoli con la scoperta semantica e l'ordinamento per importanza dei domini via LLM (`2..4` subagent: `DUAL-TRACK`, `TRI-TRACK`, `QUAD-TRACK` con regola di arresto del Rasoio di Occam e matrice in `<details>` trasposta a 4 colonne fisse per riga su `~600px`).
  - Introdotta [`rankAndCapDomains`](file:///c:/github/antigravity-plugins/plugins/skizzo/scripts/triage.mjs#L139-L194) in `triage.mjs` (`12/12` test verdi in [`triage.test.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/tests/triage.test.mjs)), esteso `sanitizeForBlindJudge` in [`bench.mjs`](file:///c:/github/antigravity-plugins/plugins/ab-bench/scripts/bench.mjs#L241-L253) agli slot `Delta`/`Epsilon` e codificato il divieto di overfitting sugli esempi (`Anti-Example Hardcoding`) in [`skill-governance/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/skill-governance/rules/AGENTS.md#L14).

---

## 2026-10-21 — Bonifica Inefficienze Token Cross-Repo (`-18.500 token/turno`), Regole Condizionali GlideMind, Tetti in Byte e Filtro Subagent in `human-governor`
- **Tipo**: Ottimizzazione Token Budget, Hook Governance & Validazione Statica (`plugins/*/rules/AGENTS.md`, `plugins/human-governor/scripts/governor-hook.mjs`, `scripts/validate.mjs`, `glidemind`)
- **Dettagli**: [`.agents/worklog.d/2026-10-21_token-efficiency-remediation-and-governor-subagent-filter.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-21_token-efficiency-remediation-and-governor-subagent-filter.md)
- **Sintesi**:
  - Archiviate `29` skill GCP/BigQuery inutilizzate in `~/.gemini/config/skills-disabled-gcp/`, compresse `10` description di plugin terzi (`<= 200` char), convertite a regole condizionali (`trigger: model_decision`) le `6` specifiche verticali di GlideMind (`-32,3 KB` Always-On) e compattati del `32,5%` i 12 file `plugins/*/rules/AGENTS.md` (tetto `<= 6.000 B`).
  - Esclusi i subagent dal conteggio WIP in [`governor-hook.mjs`](file:///c:/github/antigravity-plugins/plugins/human-governor/scripts/governor-hook.mjs) (`isHumanConversationTranscript`) e ruotati/compattati `WORKLOG.md` (`43,5 -> 14,8 KB`) e `MEMORY.md` (`26,3 -> 10,9 KB`) in GlideMind con guardie statiche `<= 16 KB` / `<= 20 KB`.

---

## 2026-10-21 — Modalità `Auto-Skizzo Silente` (`AUTO`), Mining Sessioni (`session-miner.mjs`) e Auto-Apprendimento Continuo (`L1..L3`)
- **Tipo**: Evoluzione Orchestrazione & Auto-Apprendimento (`skizzo` v1.6.0, `proactive-mentorship` v1.2.0, `cognitive-persistence` v1.6.0, `engineering-workflow` v1.2.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-21_auto-skizzo-silent-and-autonomous-self-learning.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-21_auto-skizzo-silent-and-autonomous-self-learning.md)
- **Sintesi**:
  - Attivata di serie in [`triage.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/scripts/triage.mjs) (`9/9 test PASS`) la modalità `Auto-Skizzo Silente` (`silentFastPass: true` a `0 byte` di banner sull'88% di turni diretti, auto-escalation `DUAL-TRACK` su `score >= 4`, guardia mid-sentence `non agire / solo una domanda`).
  - Creato [`session-miner.mjs`](file:///c:/github/antigravity-plugins/plugins/proactive-mentorship/scripts/session-miner.mjs) (`4/4 test PASS`) e integrato il ciclo di **Auto-Apprendimento Continuo (`L1..L3`)** con invarianti numerici anti-regressione, `validate.mjs --all`, `npm run sync` automatico e ricevuta a 1 riga.

---

## 2026-10-21 — Collaudo Browser Gate 4 (`ui-geometry-probe.js`) e Ricevuta Visiva a 4 Misure (`engineering-workflow`, `laws-of-ux`)
- **Tipo**: Evoluzione Governance Visiva & Verifica Browser (`plugins/engineering-workflow/`, `plugins/laws-of-ux/`)
- **Dettagli**: [`.agents/worklog.d/2026-10-21_ui-geometry-probe-and-4-measure-receipt.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-21_ui-geometry-probe-and-4-measure-receipt.md)
- **Sintesi**:
  - Introdotta la sonda browser [`ui-geometry-probe.js`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js) (`2/2 test PASS` in [`ui-geometry-probe.test.mjs`](file:///c:/github/antigravity-plugins/tests/ui-geometry-probe.test.mjs)) e la **Ricevuta Oggettiva a 4 Misure** (Budget schermo `>= 60%`, Gerarchia 3s + `nowrap` unità, Sonda `violations: 0`, Flusso `Prima -> Click -> Dopo` visibile senza scroll), vietando i giudizi generici "a occhio" e le quote artificiali di difetti (`0 modifiche` se già conforme).

---

## 2026-10-20 — Evoluzione `cognitive-persistence` v1.5.0 (Kanban Remoto Universale, Coda Parallela Anti-Conflitto e Kit Vocale Gemini Live / AI Studio)
- **Tipo**: Evoluzione Architettura Cognitiva & Esecuzione Parallela (`plugins/cognitive-persistence/` v1.5.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-20_cognitive-persistence-remote-kanban-voice.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-20_cognitive-persistence-remote-kanban-voice.md)
- **Sintesi**:
  - Integrato nei 4 comandi esistenti (`/take-note`, `/review-notes`, `/next-step`, `/memory-sync`) il ponte Kanban remoto Git-native universale ([`board-engine.mjs`](file:///c:/github/antigravity-plugins/plugins/cognitive-persistence/scripts/board-engine.mjs), [`gh-board-sync.mjs`](file:///c:/github/antigravity-plugins/plugins/cognitive-persistence/scripts/gh-board-sync.mjs), `15/15 test PASS` in [`board-engine.test.mjs`](file:///c:/github/antigravity-plugins/tests/board-engine.test.mjs)) con auto-discovery cartelle/test multi-stack, sidecar `.agents/board-state.json` (preservando i `<= 160` char di `DESIDERATA.md`), scodamento parallelo su 2 Git Worktree con junction dipendenze `< 20ms`, auto-serializzazione dei conflitti e kit vocale [`voice-intake-kit.md`](file:///c:/github/antigravity-plugins/plugins/cognitive-persistence/references/voice-intake-kit.md).

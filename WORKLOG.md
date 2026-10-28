# Giornale Cronologico degli Interventi & ADR (WORKLOG)

Giornale a finestra mobile (rolling window, max **250–300 righe** / **ultimi 15 interventi**) delle decisioni architetturali e operative nel repository `antigravity-plugins`.
> **Archivio Storico**: Il diario cronologico esteso pre-compattazione è conservato in [`.agents/archive/WORKLOG_v1_archive.md`](file:///c:/github/antigravity-plugins/.agents/archive/WORKLOG_v1_archive.md) e nelle singole schede granulari in `.agents/worklog.d/`.

---

## Indice Sintetico delle Fasi Consolidate (Archiviate in `WORKLOG_v1_archive.md`)

- **Fase 1 (Catalogo Base, Validatore & Documentazione — 2026-10-07)**: Creazione dei 7 plugin fondativi (`engineering-sobriety`, `laws-of-ux`, `execution-guard`, `engineering-workflow`, `cognitive-persistence`, `proactive-mentorship`, `skill-governance`), template `starter-plugin` e validatore `scripts/validate.mjs`.
- **Fase 2 (Start-of-Task `/next-step`, Ridenominazione Connect-RPC & Telemetria Base — 2026-10-07)**: Introduzione di `/next-step`, script `set-chat-title.mjs` su Connect-RPC (`UpdateConversationAnnotations`) e plugin `telemetry-analytics` v1.0.0 (`collector.mjs`, `report.mjs`).
- **Fase 3 (Sync Fisico Globale Anti-Junction & Integrazione Audit GlideMind — 2026-10-09/10)**: Divieto di NTFS Directory Junctions su Windows con introduzione di `scripts/sync-to-global.mjs` (`npm run sync`), skill `shift-left-governance`, `ux-outdoor-and-field-ergonomics`, bando emoji decorative e guardia mock API esterne.

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

---

## 2026-10-19 — Evoluzione Plugin `skizzo` v1.5.0 (Filtro Automatico a Priori `Gate 0: FAST-PASS vs DUAL-TRACK` e Motore `triage.mjs`)
- **Tipo**: Evoluzione Protocollo Multi-Agente & Ottimizzazione Latenza (`plugins/skizzo/` v1.5.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-19_skizzo-auto-triage-fast-pass.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-19_skizzo-auto-triage-fast-pass.md)
- **Sintesi**:
  - Introdotto il **Gate 0 di Triage Automatico a Priori** ([`triage.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/scripts/triage.mjs), `< 5ms`, `7/7 test PASS` in [`triage.test.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/tests/triage.test.mjs)) che mantiene `SKIZZO = ON` in sessione ma esegue `FAST-PASS` (`0` subagent, ~90–120s risparmiati + banner `[!NOTE]`) su comandi operativi/Git/memoria, sola lettura, conferme di piani già approvati e micro-edit, avviando `DUAL-TRACK` sulle scelte progettuali (con override `--force` e `--skip`).

---

## 2026-10-18 — Creazione Plugin `human-governor` v1.0.0 (Tutela Cognitiva, Limite WIP Contemporanei, Anti-Thrashing e Coprifuoco)
- **Tipo**: Nuovo Plugin di Governance Operatore & Hook `PreInvocation` (`plugins/human-governor/` v1.0.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-18_human-governor-plugin.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-18_human-governor-plugin.md)
- **Sintesi**:
  - Implementato il plugin `human-governor` (`/focus-audit`) con valutatore headless [`evaluator.mjs`](file:///c:/github/antigravity-plugins/plugins/human-governor/core/evaluator.mjs), hook `PreInvocation` [`governor-hook.mjs`](file:///c:/github/antigravity-plugins/plugins/human-governor/scripts/governor-hook.mjs) (rilevamento WIP concorrenti in `brain/`, context-thrashing, maratone e coprifuoco `22:30–07:00` con blocco `ask_question` e notifica Windows) e CLI [`status.mjs`](file:///c:/github/antigravity-plugins/plugins/human-governor/scripts/status.mjs) (`5/5 test PASS`).

---

## 2026-10-18 — Evoluzione Plugin `proactive-mentorship` v1.1.0 (Coaching Antigravity, Agent Training Ladder `L0..L3` e Guardie `L3` in `validate.mjs`)
- **Tipo**: Evoluzione Plugin & Validatore Statico (`plugins/proactive-mentorship/` v1.1.0, `scripts/validate.mjs`)
- **Dettagli**: [`.agents/worklog.d/2026-10-18_proactive-mentorship-agy-and-training.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-18_proactive-mentorship-agy-and-training.md)
- **Sintesi**:
  - Espanso `proactive-mentorship` al coaching *just-in-time* sui comandi Antigravity (`/grill-me`, `/plan`, `/compact`, `/goal`, `/learn`, `/skizzo`, `/ab-bench`) e all'Agent Training Ladder (`L0..L3`) con Gate Anti-Disturbo, prontuari in `references/` e guardie `L3` in `scripts/validate.mjs` (`</summary>` e `references/`).

---

## 2026-10-17 — Evoluzione Plugin `skizzo` v1.4.0 (Persistenza Sticky di Sessione, Stop Naturale, Output "Human-First") e `validateMarkdownHygiene`
- **Tipo**: Evoluzione Protocollo Multi-Agente & Validatore Statico (`plugins/skizzo/` v1.4.0, `scripts/validate.mjs`)
- **Dettagli**: [`.agents/worklog.d/2026-10-17_skizzo-session-persistence.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-17_skizzo-session-persistence.md), [`.agents/worklog.d/2026-10-17_skizzo-skill-declaration.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-17_skizzo-skill-declaration.md)
- **Sintesi**:
  - Resa la modalità `/skizzo` (`v1.4.0`) **persistente (sticky) per tutti i turni della sessione** anche quando l'utente non ripete `/skizzo` nei messaggi successivi, fino a fine chat o comando di stop (`/skizzo stop`, `/skizzo off`, `stop skizzo`, `ferma skizzo`), con auto-routing di 1–2 skill foglia, silenzio intermedio, formato **Human-First** a 4 punti e guardia `validateMarkdownHygiene`.

---

## 2026-10-17 — Creazione Plugin `ab-bench` v1.0.0 (Sfida Cieca A/B su 5 Dita, Sanitizer Anti-Bias e Rasoio di Occam)
- **Tipo**: Nuovo Plugin di Benchmarking Empirico (`plugins/ab-bench/` v1.0.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-17_ab-bench-plugin.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-17_ab-bench-plugin.md)
- **Sintesi**:
  - Implementato in modalità `/skizzo` il plugin `ab-bench` (`/ab-bench`, `--skill`, `--stats`) con motore headless [`bench.mjs`](file:///c:/github/antigravity-plugins/plugins/ab-bench/scripts/bench.mjs) (SHA-256 blind X/Y, sanitizer anti-bias, Test delle 5 Dita `0..5`, Rasoio di Occam sul tempo e rotazione storico a `5 MB`) verificato su 12/12 test (`Oracolo Alpha` + `Oracolo Beta`).

---

## 2026-10-16 — Creazione ed Evoluzione Plugin `skizzo` v1.1.0 (Dual-Track Tecnico vs Dominio, Mediatore Interattivo `--mediator` e Banner `conversation://`)
- **Tipo**: Nuovo Plugin & Orchestrazione Multi-Agente Avversariale (`plugins/skizzo/` v1.0.0 -> v1.1.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-16_skizzo-dual-track-plugin.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-16_skizzo-dual-track-plugin.md)
- **Sintesi**:
  - Implementato il plugin `skizzo` (dormiente di default, toggle `/skizzo` con titolo `[SKIZZO]` / `[SKIZZO+MED]`) che delega ogni task in parallelo a 2 subagent isolati (`Subagent Alpha` Tecnico vs `Subagent Beta` Dominio), con opzione `--mediator` (`Subagent Gamma` che negozia via `send_message` max 1 round sui disaccordi) e banner `[!IMPORTANT]` obbligatorio al rigo 1 con link cliccabili `conversation://<id>`.

---

## 2026-10-16 — Formato Ad Alto Contrasto "Badge + Semaforo" (`【🟢/🟡/🔴 ETA tot ~Ns】`) per `toolAction` e `toolSummary`
- **Tipo**: Telemetria & Ergonomia Visiva In-Flight (`telemetry-analytics` v1.5.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-16_eta-badge-semaphore-format.md`](file:///.agents/worklog.d/2026-10-16_eta-badge-semaphore-format.md)
- **Sintesi**:
  - Introdotto in [`plugins/telemetry-analytics/rules/AGENTS.md`](file:///plugins/telemetry-analytics/rules/AGENTS.md) il formato `【🟢/🟡/🔴 ETA tot ~Ns】` (`🟢` <= 20s, `🟡` 21–60s, `🔴` > 60s) per dare risalto cromatico e geometrico nei campi plain-text (`textContent`) dei tool, estendendo il parser in `collector.mjs` ed `eta-injector.mjs`.

---

## 2026-10-16 — Governance Anti-Bloat per `DESIDERATA.md`, `NOTES.md` e Storage Telemetria (`events.ndjson` / `.cursor_*`)
- **Tipo**: Context Engineering & Storage Hygiene (`cognitive-persistence` v1.4.0, `telemetry-analytics` v1.5.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-16_desiderata-notes-and-telemetry-anti-bloat.md`](file:///.agents/worklog.d/2026-10-16_desiderata-notes-and-telemetry-anti-bloat.md)
- **Sintesi**:
  - Codificato in `cognitive-persistence` il tetto di **150 righe** e **160 caratteri** per cella su `DESIDERATA.md` (split *Backlog Attivo* / *Completate*) e il tetto di **120 righe** su `NOTES.md` (contatore `Ultimo ID Assegnato` nell'header e tabella a 1 riga per le ultime 10 note chiuse, allineando `c:\github\glidemind\NOTES.md`).
  - Introdotto in `collector.mjs` il TTL Garbage Collection (`7 giorni`) per i file `.cursor_*.json`/`.eta_*.json` e la rotazione di `events.ndjson` oltre **5 MB**, estendendo `scripts/validate.mjs --all`.

---

## 2026-10-16 — Governance Anti-Bloat per `MEMORY.md` (In-Place per Dominio) e `WORKLOG.md` (Rolling Window & Pointer Index)
- **Tipo**: Context Engineering / Governance Memoria (`cognitive-persistence` v1.3.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-16_memory-anti-bloat-governance.md`](file:///.agents/worklog.d/2026-10-16_memory-anti-bloat-governance.md)
- **Sintesi**:
  - Formalizzato in [`plugins/cognitive-persistence/rules/AGENTS.md`](file:///plugins/cognitive-persistence/rules/AGENTS.md) e [`skills/memory-sync/SKILL.md`](file:///plugins/cognitive-persistence/skills/memory-sync/SKILL.md) il tetto di **200 righe** per `MEMORY.md` (5–8 sezioni di dominio aggiornate *in-place*, formato `Insidia`/`Regola`, archiviazione in `.agents/archive/MEMORY_v<N>_archive.md`).
  - Formalizzato per `WORKLOG.md` il modello **Rolling Window + Pointer Index** (<= 300 righe / max 15 voci da 4–5 righe con link a `.agents/worklog.d/`, divieto di copia integrale del frammento e rotazione in `.agents/archive/WORKLOG_v<N>_archive.md`) e reso `scripts/sync-to-global.mjs` resiliente a lock `EBUSY` su Windows.


# Giornale Cronologico degli Interventi & ADR (WORKLOG)

Giornale a finestra mobile (rolling window, max **250–300 righe** / **ultimi 15 interventi**) delle decisioni architetturali e operative nel repository `antigravity-plugins`.
> **Archivio Storico**: Il diario cronologico esteso pre-compattazione è conservato in [`.agents/archive/WORKLOG_v1_archive.md`](file:///c:/github/antigravity-plugins/.agents/archive/WORKLOG_v1_archive.md) e nelle singole schede granulari in `.agents/worklog.d/`.

---

## Indice Sintetico delle Fasi Consolidate (Archiviate in `WORKLOG_v1_archive.md`)

- **Fase 1 (Catalogo Base, Validatore & Documentazione — 2026-10-07)**: Creazione dei 7 plugin fondativi (`engineering-sobriety`, `laws-of-ux`, `execution-guard`, `engineering-workflow`, `cognitive-persistence`, `proactive-mentorship`, `skill-governance`), template `starter-plugin` e validatore `scripts/validate.mjs`.
- **Fase 2 (Start-of-Task `/next-step`, Ridenominazione Connect-RPC & Telemetria Base — 2026-10-07)**: Introduzione di `/next-step`, script `set-chat-title.mjs` su Connect-RPC (`UpdateConversationAnnotations`) e plugin `telemetry-analytics` v1.0.0 (`collector.mjs`, `report.mjs`).
- **Fase 3 (Sync Fisico Globale Anti-Junction & Integrazione Audit GlideMind — 2026-10-09/10)**: Divieto di NTFS Directory Junctions su Windows con introduzione di `scripts/sync-to-global.mjs` (`npm run sync`), skill `shift-left-governance`, `ux-outdoor-and-field-ergonomics`, bando emoji decorative e guardia mock API esterne.

---

## 2026-10-16 — Creazione ed Evoluzione Plugin `skizzo` v1.1.0 (Dual-Track Tecnico vs Dominio, Mediatore Interattivo `--mediator` e Banner `conversation://`)
- **Tipo**: Nuovo Plugin & Orchestrazione Multi-Agente Avversariale (`plugins/skizzo/` v1.0.0 $\to$ v1.1.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-16_skizzo-dual-track-plugin.md`](file:///c:/github/antigravity-plugins/.agents/worklog.d/2026-10-16_skizzo-dual-track-plugin.md)
- **Sintesi**:
  - Implementato il plugin `skizzo` (dormiente di default, toggle `/skizzo` con titolo `[SKIZZO]` / `[SKIZZO+MED]`) che delega ogni task in parallelo a 2 subagent isolati (`Subagent Alpha` Tecnico vs `Subagent Beta` Dominio), con opzione `--mediator` (`Subagent Gamma` che negozia via `send_message` max 1 round sui disaccordi) e banner `[!IMPORTANT]` obbligatorio al rigo 1 con link cliccabili `conversation://<id>`.

---

## 2026-10-16 — Formato Ad Alto Contrasto "Badge + Semaforo" (`【🟢/🟡/🔴 ETA tot ~Ns】`) per `toolAction` e `toolSummary`
- **Tipo**: Telemetria & Ergonomia Visiva In-Flight (`telemetry-analytics` v1.5.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-16_eta-badge-semaphore-format.md`](file:///.agents/worklog.d/2026-10-16_eta-badge-semaphore-format.md)
- **Sintesi**:
  - Introdotto in [`plugins/telemetry-analytics/rules/AGENTS.md`](file:///plugins/telemetry-analytics/rules/AGENTS.md) il formato `【🟢/🟡/🔴 ETA tot ~Ns】` (`🟢` $\le 20\text{s}$, `🟡` $21\text{–}60\text{s}$, `🔴` $> 60\text{s}$) per dare risalto cromatico e geometrico nei campi plain-text (`textContent`) dei tool, estendendo il parser in `collector.mjs` ed `eta-injector.mjs`.

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
  - Formalizzato per `WORKLOG.md` il modello **Rolling Window + Pointer Index** ($\le 300\text{ righe}$ / max 15 voci da 4–5 righe con link a `.agents/worklog.d/`, divieto di copia integrale del frammento e rotazione in `.agents/archive/WORKLOG_v<N>_archive.md`) e reso `scripts/sync-to-global.mjs` resiliente a lock `EBUSY` su Windows.

---

## 2026-10-16 — Visibilità Persistente dell'ETA sui Checkpoint (`toolAction` + `toolSummary`), Soglia Max 2° Turno e Fix Finalizzazione `Stop`
- **Tipo**: Telemetria & UX In-Flight (`telemetry-analytics` v1.4.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-16_eta-persistent-checkpoint-visibility.md`](file:///.agents/worklog.d/2026-10-16_eta-persistent-checkpoint-visibility.md)
- **Sintesi**:
  - Obbligo di emettere la prima stima (`· ETA tot ~Ns`) **entro il 2° turno** scrivendola sia in `toolAction` sia in `toolSummary` dell'ultimo tool di lettura del batch e del **primo tool operativo top-level** (`replace_file_content`, `write_to_file`, `run_command`).
  - Corretto `collector.mjs` per registrare `etaOutcome` su `Stop` (`--finalize`) anche quando `newSteps.length === 0` e preservare `lastIndex` in `.cursor_<id>.json`.

---

## 2026-10-15 — Audit Stato Installazione Plugin Globali e Sincronizzazione `config.json`
- **Tipo**: Infrastruttura & Discovery Runtime (`scripts/sync-to-global.mjs`)
- **Dettagli**: [`.agents/worklog.d/2026-10-15_global_and_project_plugin_sync_audit.md`](file:///.agents/worklog.d/2026-10-15_global_and_project_plugin_sync_audit.md)
- **Sintesi**:
  - Rimossa la junction residua su `telemetry-analytics`, sincronizzati fisicamente tutti i 9 plugin in `~/.gemini/config/plugins/` con abilitazione in `~/.gemini/config/config.json` e verificato il caricamento tramite endpoint RPC `GetAllPlugins`.

---

## 2026-10-15 — Integrazione Anti-Rationalization Tables e Posizionamento Agentic Harness Engineering
- **Tipo**: Governance Cognitiva & Documentazione (`engineering-workflow`, `execution-guard`, `code-inspector`, `cognitive-persistence`)
- **Dettagli**: [`.agents/worklog.d/2026-10-15_anti-rationalization-tables-and-harness-positioning.md`](file:///.agents/worklog.d/2026-10-15_anti-rationalization-tables-and-harness-positioning.md)
- **Sintesi**:
  - Integrate le *Anti-Rationalization Tables* nei 4 plugin operativi principali per bloccare le scorciatoie del modello su test, numeri di riga, task asincroni e cattura note, e bonificato `README.md` rimuovendo tutte le emoji decorative dalle intestazioni.

---

## 2026-10-15 — Silenziamento `ephemeralMessage` in `eta-injector.mjs` e Stima Riferita all'Intera Lavorazione
- **Tipo**: Telemetria & Pulizia Output (`telemetry-analytics` v1.2.0–1.3.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-15_telemetry-eta-pill-only.md`](file:///.agents/worklog.d/2026-10-15_telemetry-eta-pill-only.md), [`.agents/worklog.d/2026-10-15_telemetry-live-eta.md`](file:///.agents/worklog.d/2026-10-15_telemetry-live-eta.md)
- **Sintesi**:
  - Silenziato `stdout` (`{}\n`) in `eta-injector.mjs` per eliminare i blocchi `[TELEMETRY-ETA-CLOCK]` dagli output dei tool, sottraendo le pause `ask_question` dal calcolo di `Elapsed` e introducendo l'auto-calibrazione `etaCalibrationFactor`.

---

## 2026-10-15 — Creazione Plugin `code-inspector` e Comando `/how-its-made` con Widget Dual-Tab `<agent-embed>`
- **Tipo**: Nuovo Plugin / Ispezione Flussi Esecutivi (`plugins/code-inspector/`)
- **Dettagli**: [`.agents/worklog.d/2026-10-15_code-inspector-plugin.md`](file:///.agents/worklog.d/2026-10-15_code-inspector-plugin.md)
- **Sintesi**:
  - Implementato il protocollo IPO Esteso a 5 livelli (*Ingresso $\to$ Guardie $\to$ Processo `[PURE]/[STATE]/[I/O]` $\to$ Payload $\to$ Uscita & Test*) con selettore interattivo `<agent-embed>` dual-tab (`Albero Testuale` + `Grafico a Blocchi`) e cassetti `<details>` con estratti chirurgici verificati.

---

## 2026-10-15 — Buffer Pre-Desiderata `NOTES.md`, Cattura In-Flight (`/take-note`) e Triage Differito (`/review-notes`)
- **Tipo**: Architettura Cognitiva 3+1 (`cognitive-persistence` v1.2.0)
- **Dettagli**: [`.agents/worklog.d/2026-10-15_in-flight-notes-and-review-workflow.md`](file:///.agents/worklog.d/2026-10-15_in-flight-notes-and-review-workflow.md)
- **Sintesi**:
  - Introdotto il file canonico `NOTES.md` con cattura passiva a zero cambio di contesto (`/take-note`, divieto di lettura codice sorgente) e comando di analisi approfondita a lavorazione ferma (`/review-notes`) per la promozione controllata in `DESIDERATA.md`.

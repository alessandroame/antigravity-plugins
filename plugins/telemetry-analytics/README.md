# Telemetry, Usage Analytics & Live ETA (`telemetry-analytics`)

Plugin di osservabilità, telemetria e stima in-flight dei tempi di completamento (ETA) per Google Antigravity. Raccoglie in modo deterministico e a basso overhead metriche sull'utilizzo dei plugin, inietta l'orologio real-time nei turni dell'agente per mostrare l'ETA direttamente nelle pill dei tool (che si comprimono automaticamente a fine step) e auto-calibra le stime confrontando il tempo previsto con la durata effettiva.

---

## 1. Obiettivo Primario

Nel runtime di Antigravity, i plugin modulari operano come componenti integrati senza un layer nativo di reporting quantitativo né un orologio visibile all'LLM durante i sub-turni intermedi. Il plugin `telemetry-analytics` introduce un'infrastruttura completa:
- **Stima ETA In-Flight Auto-Comprimibile nelle Pill dei Tool**: Tramite l'hook `PreInvocation` (`scripts/eta-injector.mjs`), inietta nel contesto del modello l'ora corrente esatta, il tempo trascorso (`Elapsed`) dal prompt utente e la baseline storica. Per le lavorazioni multi-step ($\ge 2$ step/tool), l'agente formatta i badge `toolAction` e `toolSummary` come `Fase X/Y: Descrizione azione · ~Ns`, senza mai inquinare il testo della chat con righe ETA permanenti. Quando lo step termina, Antigravity comprime automaticamente la pill in `Explored file >` / `Edited files >`, facendo sparire l'ETA a lavoro concluso.
- **Auto-Calibrazione dell'Errore di Stima**: Alla chiusura del task (`Stop`), `collector.mjs` confronta l'ETA iniziale dichiarata nella prima pill con il tempo effettivo e aggiorna la media mobile esponenziale `etaCalibrationFactor` del workspace.
- **Calcolo dei Tempi di Esecuzione**: Misura la latenza effettiva wall-clock di ciascun turno, sessione e singolo step.
- **Riconoscimento di Plugin e Skill**: Identifica le skill attivate tramite pattern matching deterministico sui file `SKILL.md` letti dall'agente.
- **Affidabilità dei Tool ed Economia dei Token**: Traccia invocazioni, errori, success rate e cache-read ratio ad ogni turno.

---

## 2. Architettura Ibrida a Basso Overhead

```mermaid
flowchart TD
    subgraph AntigravityRuntime["Antigravity Runtime Loop"]
        PreInv["Hook PreInvocation"] -->|stdin JSON| EtaInj["scripts/eta-injector.mjs"]
        EtaInj -->|ephemeralMessage: Clock + Elapsed + Baseline| Turn["Turno LLM / Pill Tool Auto-Comprimibili<br/>(Fase X/Y: Azione · ~Ns)"]
        Turn --> PostInv["Hook PostInvocation / Stop"]
        PostInv -->|stdin JSON| Collector["scripts/collector.mjs"]
    end

    subgraph StorageLayer["Persistenza Ibrida Locale"]
        Collector -->|Append eventi + ETA outcome| NDJSON[("~/.gemini/antigravity/analytics/events.ndjson")]
        Collector -->|Aggiornamento metriche + Calibration| Summary[("~/.gemini/antigravity/analytics/metrics-summary.json")]
        Summary -.->|Lettura baseline storica| EtaInj
    end

    subgraph ReportingLayer["Visualizzazione & Analisi"]
        NDJSON --> Report["scripts/report.mjs"]
        Summary --> Report
        Report --> Skill1["Skill /plugin-analytics (Markdown Report)"]
        Report --> Skill2["Skill /telemetry-export (CSV / JSON)"]
    end
```

### Caratteristiche Architetturali
1. **Orologio Deterministico nei Sub-Turni (`PreInvocation`)**: L'LLM non tira mai a indovinare l'ora o il tempo trascorso; `eta-injector.mjs` legge il timestamp `created_at` dell'ultimo `USER_INPUT` da `transcript.jsonl` e calcola `Elapsed` al secondo.
2. **Scomparsa Automatica a Fine Lavoro**: Vietando l'emissione di righe ETA nel testo della chat e usando solo `toolAction`/`toolSummary`, l'indicatore è visibile sopra `Working` mentre l'agente opera e si comprime automaticamente appena lo step finisce.
3. **Fast-Path Silence**: Nessun indicatore ETA sulle risposte dirette o single-step (`< 10s`).
4. **Resilienza e Timeout**: Tutti gli script integrano watchdog rigidi di sicurezza (`WATCHDOG_TIMEOUT_MS`) con `.unref()` per garantire che il loop dell'agente non resti mai bloccato.

---

## 3. Struttura del Plugin

```text
plugins/telemetry-analytics/
├── plugin.json                    # Manifest del plugin (SemVer 1.2.0, 3 prompt)
├── README.md                      # Documentazione tecnica
├── hooks.json                     # Hook PreInvocation, PostInvocation e Stop
├── scripts/
│   ├── eta-injector.mjs           # Iniettore real-time dell'orologio ETA e baseline su PreInvocation
│   ├── collector.mjs              # Ingestore batch da transcript.jsonl e calcolo calibrazione ETA
│   └── report.mjs                 # Motore di aggregazione e reporting CLI
├── rules/
│   └── AGENTS.md                  # Regole di emissione ETA nelle pill dei tool, fast-path silence e sobrietà
└── skills/
    ├── plugin-analytics/
    │   └── SKILL.md               # Skill per consultare metriche e calibrazione ETA (/plugin-analytics)
    └── telemetry-export/
        └── SKILL.md               # Skill per esportare dati grezzi CSV/JSON (/telemetry-export)
```

---

## 4. Formato dell'Output ETA Durante le Lavorazioni

Per ogni task multi-step ($\ge 2$ step operativi), l'agente imposta `toolAction` e `toolSummary` con la fase e la descrizione al primo posto e il tempo residuo in coda:

- `Fase 1/3: Analisi script e configurazione · ~35s`
- `Fase 2/3: Aggiornamento parser e regole · ~18s`
- `Fase 3/3: Esecuzione test e sincronizzazione · ~8s`

Non viene stampata alcuna riga `[ETA: ...]` nel testo della chat: al termine di ciascuno step, Antigravity comprime automaticamente le pill nella barra grigia (`Explored file >`, `Edited files >`).

---

## 5. Comandi CLI Diretti

```bash
# Report del workspace corrente (include tabella Stime ETA & Calibrazione)
node plugins/telemetry-analytics/scripts/report.mjs

# Report globale aggregato
node plugins/telemetry-analytics/scripts/report.mjs --global

# Output JSON per automazioni
node plugins/telemetry-analytics/scripts/report.mjs --json

# Esportazione CSV (include colonne EtaEstimatedMs, EtaActualMs)
node plugins/telemetry-analytics/scripts/report.mjs --csv > export.csv

# Reset dei dati
node plugins/telemetry-analytics/scripts/report.mjs --reset
```

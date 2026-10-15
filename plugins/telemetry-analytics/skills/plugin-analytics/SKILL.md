---
name: plugin-analytics
description: >-
  Visualizza metriche e report sull'utilizzo dei plugin, accuratezza delle stime ETA, latenza dei turni e frequenza dei tool. Use this skill when the user asks for plugin usage statistics, ETA calibration, or invocations summary.
---

# Plugin Usage Analytics, Step Latency & ETA Calibration

Questa skill interroga il database locale della telemetria (`events.ndjson` e `metrics-summary.json`) per generare report strutturati sull'utilizzo dei plugin, sulla frequenza delle skill, sull'accuratezza delle stime ETA in-flight e sul comportamento dei tool di sistema.

---

## 1. Quando Attivare Questa Skill
- L'utente richiede statistiche sull'uso dei plugin ("mostrami le metriche dei plugin", "quante volte è stato usato laws-of-ux?").
- L'utente desidera verificare i tempi di esecuzione, la latenza media per step o lo scostamento tra ETA stimata e tempo reale (`etaCalibrationFactor`).
- L'utente richiede un controllo sui tassi di errore dei tool built-in (`run_command`, `replace_file_content`, ecc.).
- Attivabile anche tramite comando rapido `/plugin-analytics`.

---

## 2. Procedura di Esecuzione

1. **Esecuzione del Reporter**:
   Eseguire lo script `report.mjs` tramite `run_command` (con `WaitMsBeforeAsync: 10000`):

   - **Per il workspace corrente (Default)**:
     ```bash
     node plugins/telemetry-analytics/scripts/report.mjs
     ```

   - **Per la vista globale aggregata su tutti i progetti**:
     ```bash
     node plugins/telemetry-analytics/scripts/report.mjs --global
     ```

   - **Per ottenere l'output JSON grezzo**:
     ```bash
     node plugins/telemetry-analytics/scripts/report.mjs --json
     ```

2. **Presentazione all'Utente**:
   - Mostrare l'output Markdown direttamente all'utente.
   - Evidenziare lo scostamento medio tra ETA stimata e tempo effettivo, il fattore di calibrazione attivo e gli eventuali tool con errori o latenze elevate.

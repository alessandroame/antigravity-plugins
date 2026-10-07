---
name: telemetry-export
description: >-
  Esporta gli eventi di telemetria e le metriche di runtime in formato CSV o JSON per analisi esterne. Use this skill when the user wants to export, backup, or analyze telemetry raw data outside Antigravity.
---

# Telemetry Data Export & Backup

Questa skill consente di esportare i record grezzi o aggregati della telemetria archiviata in formato CSV o JSON per consentire ulteriori analisi in fogli di calcolo, database o strumenti di Business Intelligence.

---

## 1. Quando Attivare Questa Skill
- L'utente richiede di estrarre i dati grezzi degli eventi in CSV.
- L'utente desidera esportare o resettare i log storici di telemetria.
- Attivabile anche tramite comando `/telemetry-export`.

---

## 2. Comandi di Esportazione

1. **Esportazione in CSV**:
   Eseguire:
   ```bash
   node plugins/telemetry-analytics/scripts/report.mjs --csv > telemetry-export.csv
   ```

2. **Esportazione JSON Completo**:
   Eseguire:
   ```bash
   node plugins/telemetry-analytics/scripts/report.mjs --global --json > telemetry-summary.json
   ```

3. **Reset dei Dati di Telemetria**:
   Invocare solo su esplicita conferma dell'utente:
   ```bash
   node plugins/telemetry-analytics/scripts/report.mjs --reset
   ```

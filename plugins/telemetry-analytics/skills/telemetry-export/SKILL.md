---
name: telemetry-export
description: >-
  Use this skill when the user runs /telemetry-export or wants to export, backup, or reset
  raw Antigravity telemetry events and runtime metrics in CSV or JSON format.
---

# Telemetry Data Export & Backup (`/telemetry-export`)

Exports raw or aggregated local telemetry records to CSV or JSON for external spreadsheet, database, or BI analysis. Always reply to the user in plain Italian.

---

## 1. Activation Triggers
- User asks to export raw telemetry events to CSV or JSON.
- User asks to backup or reset historical telemetry logs.
- Invoked via `/telemetry-export`.

---

## 2. Export Commands

1. **Export to CSV**:
   ```bash
   node ~/.gemini/config/plugins/telemetry-analytics/scripts/report.mjs --csv > telemetry-export.csv
   ```

2. **Export Full JSON**:
   ```bash
   node ~/.gemini/config/plugins/telemetry-analytics/scripts/report.mjs --global --json > telemetry-summary.json
   ```

3. **Reset Telemetry Data (Requires Explicit User Confirmation)**:
   ```bash
   node ~/.gemini/config/plugins/telemetry-analytics/scripts/report.mjs --reset
   ```

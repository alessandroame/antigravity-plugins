---
name: focus-audit
description: >-
  Use this skill when the user invokes /focus-audit or asks to inspect or configure
  concurrent human WIP limits, chat context switching, continuous work streaks, and night curfew.
---

# Focus Audit & Human Governor Configuration (`/focus-audit`)

Inspects operator behavioral telemetry and configures anti-overload thresholds for `human-governor`. Always reply to the user in plain Italian.

---

## Step 1: Behavioral Telemetry Scan

Run the status script to inspect active human WIP sessions over the last 30 minutes, chat switches, and current settings:

```bash
node ~/.gemini/config/plugins/human-governor/scripts/status.mjs --json
```

- **Check**: JSON output includes `status` (`OK`, `WARN`, `CRITICAL`), `metrics`, `activeConversations`, and `violations`.

---

## Step 2: Threshold Configuration or Snooze (When Requested)

If the user asks to adjust thresholds or snooze alerts, run:

```bash
# Set max concurrent WIP limit (1..10, default 2)
node ~/.gemini/config/plugins/human-governor/scripts/status.mjs --max-wip 2

# Set night curfew window (HH:MM-HH:MM)
node ~/.gemini/config/plugins/human-governor/scripts/status.mjs --curfew 22:30-07:00

# Snooze alerts for N minutes (0 to re-enable immediately)
node ~/.gemini/config/plugins/human-governor/scripts/status.mjs --snooze 30

# Enable or disable desktop toast notifications
node ~/.gemini/config/plugins/human-governor/scripts/status.mjs --toast on
```

---

## Step 3: Diagnostic Report (User-Facing in Italian)

1. **Level 0 (`0-Click`)**:
   - Report overall status (`OK`, `WARN`, `CRITICAL`) and the 4 core metrics (`WIP attivi`, `cambi chat/10m`, `prompt/60m`, `streak continua`) in plain Italian.
   - IF `activeWipCount > maxConcurrentWip`, list open `[Conversazione](conversation://<id>)` links and ask which ones to close.
2. **Level 1 (`<details>`)**:
   - Render the full table of configured thresholds and active sessions detected in the time window (with a blank line after `</summary>`).

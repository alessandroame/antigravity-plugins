---
name: task-watchdog
description: >-
  Use this skill when a command slips into background, when configuring a schedule safety timer, or when diagnosing and terminating stalled async processes and zombie tasks.
---

# Task Watchdog & Anti-Freeze Runbook

## 1. Problem: Silent Background Task Stalls
When `run_command` exceeds `WaitMsBeforeAsync`, Antigravity moves execution to a background task (`task-<id>`). If a stall-prone process hangs indefinitely (DOM selector wait, open socket, unclosed child process), the session freezes unless guarded. Always reply to the user in plain Italian.

---

## 2. Dead-Man Switch Anti-Freeze (Paired with Native Reactive Wakeup)

Rely on native **Reactive Wakeup** for normal async completion (NEVER poll manually). WHEN a non-daemon stall-prone command slips into background (`task-<id>`):
1. **Schedule a safety wakeup timer** via `schedule`:
   ```json
   {
     "DurationSeconds": 90,
     "TimerCondition": "<task-id>",
     "Prompt": "Watchdog: Il task <task-id> ha superato il tempo previsto (90s). Esegui manage_task(Action='status', TaskId='<task-id>') per ispezionare i log e terminare se bloccato."
   }
   ```
2. **How `TimerCondition="<task-id>"` Works**:
   - **Normal exit**: IF `<task-id>` finishes within 90s, Antigravity **automatically cancels** the timer with zero noise.
   - **Stall/Freeze**: IF `<task-id>` is still stuck at 90s, the timer wakes the agent to inspect and terminate the zombie process.

---

## 3. Autonomous Diagnosis & Recovery Procedure

WHEN woken by the watchdog or inspecting a suspect background task:
1. **List active tasks**: Call `manage_task(Action="list")`.
2. **Inspect suspect task**: Call `manage_task(Action="status", TaskId="<task-id>")`.
3. **Read log tail**: Read the last lines of `logUri` via `view_file` to pinpoint the hanging instruction.
4. **Force kill**: Call `manage_task(Action="kill", TaskId="<task-id>")`.
5. **User report (in Italian)**: State on the first line of the reply which task was terminated and the root cause found.

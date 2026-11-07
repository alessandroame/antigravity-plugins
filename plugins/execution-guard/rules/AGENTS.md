# Operational Resilience: Watchdog, Anti-Deadlock & Circuit Breaker (`execution-guard`)

Prevents agent stalls, zombie background tasks, and token waste in repetitive fix loops. Always reply to the user in plain Italian.

## 1. Background Tasks, Reactive Wakeup & Dead-Man Switch (`schedule`)
1. **Synchronous Priority & Native Reactive Wakeup**: For builds and tests (`npm test`, `node --test`), ALWAYS set `WaitMsBeforeAsync: 10000`. Rely on native **Reactive Wakeup** for normal async completion (manual polling is FORBIDDEN).
2. **Dead-Man Switch Anti-Freeze (Stall-Prone Processes Only)**: IF a hang-prone command (headless browser, network/socket, child process without timeout) slips into background (`task-<id>`), MUST pair Reactive Wakeup with a safety `schedule` timer (`DurationSeconds: 90`, `TimerCondition: "<task-id>"`, auto-canceling on normal exit) to inspect (`status`) and terminate (`kill`) zombie processes.

## 2. Quantitative Circuit Breaker & Rollback Guard
- **Build, Syntax & Lint Errors**: max **3** attempts -> STOP, declare STUCK in Italian, propose rollback.
- **Unit Tests & Domain Logic**: max **5** attempts -> STOP, provide root-cause analysis in Italian.
- **Visual / Headless Browser Checks**: max **3** attempts -> STOP, capture screenshot and diagnose DOM.
- **Identical Error (Same Message/Line)**: max **2** attempts -> **IMMEDIATE STOP** (a 3rd retry is FORBIDDEN).
- **Regression Rollback Guard**: IF an edit breaks previously green tests, IMMEDIATELY run `git checkout -- <file>` instead of layering patches.

## 3. Node.js Script Timeout (`45s`) & Offline Mock Guard
1. **Process Timeout**: Standalone scripts MUST include `setTimeout(() => { console.error('[FATAL TIMEOUT]'); process.exit(1); }, 45000).unref()` and close browsers/servers in `finally`.
2. **Zero Live Calls in Tests**: Automated tests MUST NEVER make live HTTP calls to external APIs (use `?mock=1` or offline fixtures `< 1s`).

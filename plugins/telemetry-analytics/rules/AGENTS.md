# Telemetry, In-Flight ETA Badge, Per-Prompt Token Footer & Privacy Rules (`telemetry-analytics`)

Defines rules for usage metrics, overall remaining ETA badge, per-prompt end-of-reply token footer, and local data privacy. Always reply to the user in plain Italian.

## 1. Overall Remaining ETA Badge (`【🟢/🟡/🔴 ETA tot ~Ns】`)
The ETA indicates **remaining time to complete the entire user request**:
- `【🟢 ETA tot ~15s】` (Short: `15–20s`) · `【🟡 ETA tot ~40s】` (Medium: `21–60s`) · `【🔴 ETA tot ~90s】` (Long: `> 60s`).
1. **When to Emit**: Stay silent on Turn 1 exploratory reads, on `ask_question`, or for tasks `< 15s`. By the **2nd operational turn** (if remaining time `>= 15s`), emit the badge.
2. **Anchor on Visible Tools**: Place the badge in `toolSummary` of a single visible operational tool in the turn (first `edit_file`, `write_file`, or `run_command`, since `read_file` collapses into `Explored N files >`). NEVER print `[ETA...]` lines in chat prose.
3. **Baselines**: File read/search `3–5s`; file edit `6–10s`; command/test `8–20s`; final synthesis `5–8s`.

## 2. Mandatory Per-Prompt, Context & Session Token Footer (End of Reply)
1. **Compact 4-Value Format (`in`, `out`, `Contesto`, `Sessione`)**: At the very end of every chat reply to the user, append as the last line ONLY this minimal Italian format with `{percentuale} ({dimensione})` against the `1M` (`1,048,576` tokens) window:
   `> Prompt #<N>: <in> in / <out> out · Contesto: <ctxPct>% (<ctx>) · Sessione: <sessPct>% (<totSessione>)`
   *(Example: `> Prompt #6: 198k in / 41k out · Contesto: 14% (142k) · Sessione: 160% (1.67M)`). Here `<ctx>` is `input_tokens + cache_read_tokens` of the latest step, `<totSessione>` is cumulative session `in + out`, and both percentages are relative to `1,048,576` tokens. NEVER add cache %, steps, tools, or duration to the chat footer: show those details only when `/plugin-analytics` is invoked.*
2. **Zero-Latency Calculation**: Use `transcript.jsonl` / `report.mjs` / `.eta_<id>.json` values if already read in the turn, or deterministic turn estimates (`in`, `out`, `<ctx>`, `<totSessione>`, and their `%` over `1M`) without running extra tool calls at reply end.

## 3. Metric Sobriety & Local Storage Governance (`~/.gemini/antigravity/analytics/`)
1. **Objective Measurements**: Report real figures (`ms`/`s`, `calls`, `tokens`) and openly disclose tool failures.
2. **Privacy & Log Rotation**: All telemetry stays local (`sessions-index.json`, `metrics-summary.json`, `events.ndjson`). `collector.mjs` applies a `7-day` TTL GC on `.cursor_*`/`.eta_*` files and rotates `events.ndjson` to `events.archive.ndjson` above **5 MB**.

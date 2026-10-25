# [2026-10-25] ADR: Evoluzione `telemetry-analytics` v2.0.0–v2.1.0 (Backfill Incrementale Sessioni Locali `brain/`, Report Token per Singolo Prompt e Dashboard HTML `<agent-embed>`)

## Contesto & Motivazione
1. **Monitoraggio Storico Personale (`v2.0.0`)**: L'utente ha richiesto di monitorare il proprio utilizzo complessivo di Antigravity sfruttando le sessioni già presenti localmente in `~/.gemini/antigravity/brain/<id>/.system_generated/logs/transcript.jsonl`, senza partire da zero con i soli eventi futuri degli hook. Inoltre, `collector.mjs` tracciava solo il tool legacy `view_file` ignorando `read_file` e non aggiornava `totalSessions` in `metrics-summary.json`.
2. **Report Token per Singolo Prompt e Sobrietà del Footer (`v2.1.0`)**: L'utente ha richiesto di aggiungere la rendicontazione dei token consumati nella sessione per ogni singolo prompt (`Prompt #1..#N`), visualizzandola sia a fine risposta in chat (in formato minimale a 3 soli valori: `in`, `out` e `Sessione`) sia in forma estesa dentro `/plugin-analytics` e nella Dashboard HTML interattiva.

## Decisioni Architetturali
1. **Motore Headless di Backfill Incrementale (`core/session-backfill.mjs`, Schema `v3`)**:
   - Scansiona `~/.gemini/antigravity/brain/` e mantiene l'indice incrementale `~/.gemini/antigravity/analytics/sessions-index.json` invalidato tramite `mtimeMs` e `size` (`< 100ms` a regime su oltre 500 transcript).
   - Distingue le conversazioni umane dai subagent (`invoke_subagent`) ispezionando solo il primo step utente (`userPromptsCount === 1`) ed `extractUserRequest`, evitando falsi positivi quando un subagent risponde alla conversazione padre tramite `[Message]`.
   - Calcola il tempo attivo netto tagliando i gap inattivi `> 15 minuti` e sottraendo il tempo di attesa utente sui modal `ask_question`.
   - Ricostruisce per ogni prompt umano l'oggetto `promptsBreakdown[]` (`promptNumber`, `excerpt`, `plannerTurns`, `toolCalls`, `durationMs`, `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheHitPct`, picco finestra di contesto `contextTokens = max(input_tokens + cache_read_tokens)`, `cumulativeDirectTokens`, `cumulativeCacheTokens`).
2. **Separazione tra Footer Minimale in Chat (`3` Valori) e Report Analitico (`/plugin-analytics`)**:
   - In [`rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/rules/AGENTS.md), la riga obbligatoria a fine risposta espone esclusivamente `> Prompt #<N>: <in> in / <out> out · Sessione: <totSessione>`, evitando rumore visivo in chat.
   - Tutte le metriche estese per singolo prompt (cache hit, contesto raggiunto, step, tool, durata netta) sono esposte in [`report.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/report.mjs) (`--session <id>`) e nel 5° tab **`Token per Prompt`** di [`usage-dashboard-template.html`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/references/usage-dashboard-template.html).

## Impatto e Conseguenze
- **Moduli Creati / Aggiornati**:
  - [`plugins/telemetry-analytics/core/session-backfill.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/core/session-backfill.mjs)
  - [`plugins/telemetry-analytics/scripts/collector.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/collector.mjs)
  - [`plugins/telemetry-analytics/scripts/eta-injector.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/eta-injector.mjs)
  - [`plugins/telemetry-analytics/scripts/report.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/report.mjs)
  - [`plugins/telemetry-analytics/references/usage-dashboard-template.html`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/references/usage-dashboard-template.html)
  - [`plugins/telemetry-analytics/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/rules/AGENTS.md) & [`plugins/telemetry-analytics/skills/plugin-analytics/SKILL.md`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/skills/plugin-analytics/SKILL.md)
  - [`plugins/telemetry-analytics/tests/session-backfill.test.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/tests/session-backfill.test.mjs) (`5/5` test unitari verdi; `22/22` test totali verdi in `session-miner.mjs --verify-and-sync`).

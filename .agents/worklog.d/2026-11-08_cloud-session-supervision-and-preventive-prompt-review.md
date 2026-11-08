# 2026-11-08 — Ripristino Supervisione Sessioni Cloud (`mapek`, `pattern-harvester`, `proactive-mentorship`), Fix Symlink CLI e Revisione Preventiva Prompt (`NOTE-003`)

## Contesto & Diagnosi Root Cause
L'utente ha segnalato che i plugin di analisi sessioni e suggerimento miglioramenti (`proactive-mentorship`, `mapek`, `pattern-harvester`) non intervenivano più nelle sessioni Cloud Linux VM. L'ispezione diagnostica ha individuato 3 cause radice:
1. **Symlink CLI Guard (`~/.gemini -> /shared/user/.gemini`)**: Negli script ESM (`triage.mjs`, `session-miner.mjs`, `mapek.mjs`, `pattern-harvester.mjs`, `model-router.mjs`, `diff-triage.mjs`), il controllo `fileURLToPath(import.meta.url) === resolve(process.argv[1])` falliva quando invocato tramite `~/.gemini/config/plugins/...` perché `fileURLToPath` risolveva il symlink a `/shared/user/.gemini/...` mentre `resolve(process.argv[1])` manteneva `/home/antigravity/.gemini/...`, producendo `0` byte di output.
2. **Percorso Brain Cloud e Assenza di `transcript.jsonl`**: Sulle VM Cloud le sessioni risiedono in `~/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/<uuid>/` con `.metadata.json`, piani `.md` e `.system_generated/tasks/*.log` invece di `~/.gemini/antigravity/brain/<uuid>/.system_generated/logs/transcript.jsonl`.
3. **Mancanza di Innesco Hook `Stop` in Cloud e Assenza di Revisione Preventiva Prompt (`NOTE-003`)**: In Cloud gli hook IDE `Stop` non vengono eseguiti dal runtime e mancava il pre-screening preventivo dei prompt richiesta in `NOTE-003`.

## Interventi Eseguiti
- **`plugins/proactive-mentorship/scripts/session-miner.mjs` (v1.3.0)**:
  - Introdotto `isDirectCliEntrypoint(metaUrl, argv1)` basato su `realpathSync`.
  - Introdotti `discoverUnifiedBrainSessions`, `buildSyntheticJsonlFromCloudDir` e `recordCloudTurnEvent` (`~/.gemini/antigravity/analytics/cloud-sessions-log.ndjson` con rotazione a 5 MB).
  - Implementata `evaluatePromptForPreventiveReview(rawPrompt)` (`NOTE-003`, `--review-prompt`) e `collectPendingSupervisionAdvisories`.
- **`plugins/mapek/` (v1.1.0) & `plugins/pattern-harvester/` (v1.1.0)**:
  - Aggiornati `mapek.mjs`, `mapek-stop-hook.mjs`, `mapek-pre-hook.mjs`, `pattern-harvester.mjs` (`parseJsonlTextToSessionRecord`) e `periodic-harvester-hook.mjs` per usare `discoverUnifiedBrainSessions` e `isDirectCliEntrypoint`.
- **Innesco Automatico Turn-1 (`model-router.mjs`, `triage.mjs`, `sync-to-global.mjs`) e Fine Turno (`diff-triage.mjs`)**:
  - `model-router.mjs` registra il turno in `cloud-sessions-log.ndjson` ed espone `promptReview`, `selfLearning` e `supervision` nel JSON di Turn-1.
  - `diff-triage.mjs` registra i file toccati a fine turno e avvia in background `mapek-stop-hook.mjs` e `periodic-harvester-hook.mjs`.
  - `sync-to-global.mjs` rigenera automaticamente `~/.gemini/CLOUD_BOOTSTRAP.md` con il protocollo operativo di Turn-1 (`promptReview` via `ask_question`, `selfLearning` e `supervision`).

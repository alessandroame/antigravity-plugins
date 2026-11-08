# 2026-11-08 — Bootstrap Cloud Permanente (`~/.gemini/GEMINI.md`), Supervisione Sessioni (`mapek`, `pattern-harvester`, `proactive-mentorship`), Auto-Sync Cross-Progetto e Revisione Preventiva Prompt (`NOTE-003`)

## Contesto & Diagnosi Root Cause
L'utente ha segnalato che i plugin di analisi sessioni e suggerimento miglioramenti (`proactive-mentorship`, `mapek`, `pattern-harvester`) non intervenivano più nelle sessioni Cloud Linux VM e che in ogni nuova sessione Cloud su altri progetti (`Quiz_VDS-VL`, `ParagliderSim`, `GlideMind`) occorreva chiedere manualmente di installare/attivare i plugin. L'ispezione diagnostica ha individuato 5 cause radice:
1. **Iniezione `<RULE[user_global]>` su Cloud (`GEMINI.md` vs `CLOUD_BOOTSTRAP.md`)**: Il volume `/shared/user/.gemini` (`~/.gemini`) è condiviso tra tutti i progetti Cloud, ma il runtime `jetski` inietta nel system prompt solo `~/.gemini/GEMINI.md` (e `~/.gemini/AGENTS.md` se presente), ignorando `CLOUD_BOOTSTRAP.md` e `config/plugins/*/rules/AGENTS.md`.
2. **Assenza dei Trigger Conversazionali in `GEMINI.md` e Assenza di Auto-Sync Cross-Progetto**: Nelle VM di progetti esterni (`GlideMind`, `ParagliderSim`, `Quiz_VDS-VL`) il repository `antigravity-plugins` non è montato in `/home/antigravity/alessandroame/` e gli hook `PreInvocation` non vengono eseguiti dal runtime.
3. **Symlink CLI Guard (`~/.gemini -> /shared/user/.gemini`)**: Negli script ESM (`triage.mjs`, `session-miner.mjs`, `mapek.mjs`, `pattern-harvester.mjs`, `model-router.mjs`, `diff-triage.mjs`, `gh-board-sync.mjs`, `eta-injector.mjs`, `validate.mjs`), il controllo `fileURLToPath(import.meta.url) === resolve(process.argv[1])` falliva senza `realpathSync` su entrambi gli operandi.
4. **Percorso Brain Cloud, Assenza di `transcript.jsonl` e Timeout `504` di `/opt/antigravity/bin/gh`**: Sulle VM Cloud le sessioni risiedono in `~/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/<uuid>/` e il wrapper `gh` fallisce scaricando l'archivio da GitHub Releases.
5. **Mancanza di Innesco Hook `Stop` in Cloud e Assenza di Revisione Preventiva Prompt (`NOTE-003`)**: In Cloud gli hook IDE `Stop` non vengono eseguiti dal runtime e mancava il pre-screening preventivo dei prompt richiesto in `NOTE-003`.

## Interventi Eseguiti
- **`scripts/sync-to-global.mjs` & `~/.gemini/GEMINI.md`**:
  - `buildCloudBootstrapContent` compila ora gli standard di Turn-1, i **Trigger Conversazionali & Contratti Always-On** di tutti i 14 plugin attivi e il catalogo completo direttamente in `~/.gemini/GEMINI.md` (oltre a `CLOUD_BOOTSTRAP.md`), rimuovendo il duplicato `~/.gemini/AGENTS.md` e sincronizzando `scripts/` in `~/.gemini/config/scripts/`.
- **`plugins/proactive-mentorship/scripts/session-miner.mjs` (v1.3.0)**:
  - Introdotto `isDirectCliEntrypoint(metaUrl, argv1)` basato su `realpathSync` bilaterale, `ensureCloudCatalogClone` e `triggerBackgroundCloudSyncIfNeeded` (`--background-sync`, TTL `15m`).
  - Introdotti `discoverUnifiedBrainSessions`, `buildSyntheticJsonlFromCloudDir` e `recordCloudTurnEvent` (`~/.gemini/antigravity/analytics/cloud-sessions-log.ndjson` con rotazione a 5 MB).
  - Implementata `evaluatePromptForPreventiveReview(rawPrompt)` (`NOTE-003`, `--review-prompt`) e `collectPendingSupervisionAdvisories`.
- **`plugins/cognitive-persistence/` & `plugins/telemetry-analytics/`**:
  - In `gh-board-sync.mjs`: aggiunto il fast-path REST API via `$GH_TOKEN` (`https://api.github.com/repos/<slug>/issues`, `< 200ms`) e guardia CLI symlink-safe.
  - In `set-chat-title.mjs`: aggiunto il fallback Cloud su `~/.gemini/jetski/brain/<id>/.chat-title.json`.
  - In `session-backfill.mjs`: collegato `discoverUnifiedBrainSessions` per l'indicizzazione delle sessioni Cloud in `/plugin-analytics`.
- **`plugins/mapek/` (v1.1.0) & `plugins/pattern-harvester/` (v1.1.0)**:
  - Aggiornati `mapek.mjs`, `mapek-stop-hook.mjs`, `mapek-pre-hook.mjs`, `pattern-harvester.mjs` (`parseJsonlTextToSessionRecord`) e `periodic-harvester-hook.mjs` per usare `discoverUnifiedBrainSessions` e `isDirectCliEntrypoint`.
- **Innesco Automatico Turn-1 (`model-router.mjs`, `triage.mjs`) e Fine Turno (`diff-triage.mjs`)**:
  - `model-router.mjs` registra il turno in `cloud-sessions-log.ndjson`, avvia `triggerBackgroundCloudSyncIfNeeded` ed espone `promptReview`, `selfLearning` e `supervision` nel JSON di Turn-1.
  - `diff-triage.mjs` registra i file toccati a fine turno e avvia in background `mapek-stop-hook.mjs` e `periodic-harvester-hook.mjs`.

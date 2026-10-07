# [2026-10-07] ADR: Creazione del Plugin `telemetry-analytics` per Metriche d'Uso, Latenza e Invocazioni

## Contesto & Motivazione
I plugin e le skill di Antigravity operano all'interno del runtime senza una visibilità quantitativa sul tempo reale impiegato, sul volume di chiamate effettuate, sulla frequenza d'uso dei vari moduli e sui tassi di errore dei tool di sistema.
L'utente richiede un sistema di analytics/telemetria per tracciare tali metriche.
L'analisi architetturale ha evidenziato che l'approccio sincrono per-tool (`PreToolUse`/`PostToolUse`) genera un forte overhead di process spawning su Windows (~150ms a tool).
È stata quindi concordata un'architettura **ibrida**:
- Ingestione batch guidata da hook `PostInvocation` e `Stop` via parsing deterministico di `transcript.jsonl`.
- Persistenza globale aggregata (`~/.gemini/antigravity/analytics/`) con tag di workspace per filtrare report globali o specifici per repository.
- Consultazione ed esportazione tramite skill dedicate (`plugin-analytics`, `telemetry-export`) e script zero-dep.

## Decisioni Architetturali
1. **Nome e Collocazione**:
   - Cartella: `plugins/telemetry-analytics/` conforme al naming `domain-purpose`.
   - Manifest: `plugin.json` SemVer `1.0.0` con 3 `suggestedPrompts`.
2. **Ciclo di Ingestione (Hook `PostInvocation` & `Stop`)**:
   - `hooks.json` dichiara comandi `node ./scripts/collector.mjs` su `PostInvocation` e `Stop`.
   - `collector.mjs` legge il payload da stdin (`transcriptPath`, `workspacePaths`, `conversationId`, `invocationNum`).
   - Calcola il tempo trascorso (wall clock tra step prompt e fine turno), identifica i tool invocati, mappa l'accesso a skill/plugin (es. lettura di `SKILL.md`) ed estrae i token consumati.
   - Salva gli eventi in `events.ndjson` e aggiorna incrementalmente `metrics-summary.json`.
3. **Modalità Ibrida (Globale + Workspace)**:
   - Archiviazione di default in `~/.gemini/antigravity/analytics/`.
   - Record arricchiti con percorso e nome workspace, permettendo al report di isolare i dati del progetto corrente o mostrare l'aggregato cross-project.
4. **Tooling CLI e Skill di Reporting**:
   - `scripts/report.mjs`: Motore CLI con flag `--workspace`, `--global`, `--json`, `--csv`.
   - Skill `plugin-analytics`: Comando per la renderizzazione del report tabellare Markdown per l'utente.
   - Skill `telemetry-export`: Esportazione per ingestion in strumenti esterni.
5. **Regole Ingegneristiche (`rules/AGENTS.md`)**:
   - Rispetto dei principi di sobrietà metrica, trasparenza sui fallimenti e rispetto della privacy locale.

## Impatto e Conseguenze
- Validazione da eseguire tramite `scripts/validate.mjs`.
- Nessun rallentamento percettibile sul runtime (un solo parsing rapido a fine turno, anziché 2 processi shell per tool call).

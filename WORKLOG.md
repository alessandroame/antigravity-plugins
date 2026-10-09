# Giornale Cronologico degli Interventi & ADR (WORKLOG)

Questo documento traccia la cronologia consolidata delle decisioni architetturali (ADR) e delle evoluzioni strutturali del repository `antigravity-plugins`.

---

## [2026-10-09] ADR: Protocollo di Installazione Fisica Globale e Divieto Directory Junction su Windows

### Contesto & Motivazione
Durante il collaudo dell'attivazione dei plugin su progetti esterni (es. GlideMind), i comandi slash (tra cui `/next-step` e `/memory-sync`) risultavano assenti dall'autocompletamento della chat, nonostante i plugin fossero stati collegati tramite NTFS Directory Junction (`New-Item -ItemType Junction`).

### Diagnosi Empirica & Causa Radice
1. **Scarto Reparse Points su Windows**: Chiamate Connect-RPC al Language Server (`exa.language_server_pb.LanguageServerService/GetAllPlugins`) hanno dimostrato che il file scanner su Windows ignora i reparse points / Directory Junctions NTFS (trattati come link e scartati).
2. **Ambito di Discovery dei Plugin**: Antigravity non scansiona `.agents/plugins/` di progetto come root di plugin. I plugin sono scoperti unicamente nella cartella utente globale `~/.gemini/config/plugins/` e abilitati in `~/.gemini/config/config.json`.
3. **Cache Visuale dei Comandi Slash**: La webview Electron popola la lista dei comandi slash all'inizializzazione della finestra. Per visualizzare nuovi comandi slash nell'autocompletamento, dopo la sincronizzazione fisica è necessario ricaricare la finestra (`Developer: Reload Window`) o riavviare Antigravity.
4. **Collisioni tra Skill di Workspace e Plugin Globali**: La presenza di una copia locale loose in `<workspace>/.agents/skills/<name>` assieme al plugin globale genera duplicati visivi nella UI. Le skill distribuite tramite plugin globale non devono essere duplicate nel workspace.

### Decisioni Architetturali
1. **Divieto Assoluto di Directory Junction per i Plugin**: Bandito l'uso di junction o symlink per la registrazione dei plugin su Windows.
2. **Adozione di Sincronizzazione Fisica Automatizzata (`npm run sync`)**: Implementato lo script `scripts/sync-to-global.mjs` invocabile via `npm run sync`. Lo script rimuove eventuali vecchie junction e clona ricorsivamente le cartelle reali in `~/.gemini/config/plugins/`.
3. **Allineamento Documentazione e Regole**:
   - Aggiornato `README.md` con il runbook di sincronizzazione globale (`npm run sync`).
   - Aggiornato `MEMORY.md` (Sezione 4) registrando il vincolo permanente sul Language Server.
   - Aggiornato `.agents/skills/install-plugin/SKILL.md` (Sezione 3) rimuovendo le indicazioni errate sulle junction.

### Impatto e Verifiche
- Validazione automatica `npm test` verificata con 9/9 plugin OK, 0 errori e 0 avvisi.
- Riconoscimento immediato di tutti gli 8 plugin da parte del Language Server.
- Eliminati duplicati visivi nel menu di autocompletamento.

---

## [2026-10-07] ADR: Ridenominazione Automatica della Sessione di Chat in `/next-step`

### Contesto & Motivazione
Durante l'avvio di nuove sessioni con `/next-step`, Antigravity assegnava alla sessione un titolo generico ("Next Step Planning") basato sul prompt iniziale. Questo generava ambiguità nella cronologia della sidebar. Era necessario che `/next-step` aggiornasse programmaticamente il titolo della chat con la denominazione dello step preso in carico da `DESIDERATA.md`.

### Decisioni Architetturali
1. **Integrazione con Antigravity Language Server (Connect-RPC)**:
   - Identificato l'endpoint Connect-RPC locale `LanguageServerService/UpdateConversationAnnotations`.
   - Creato lo script autonomo `plugins/cognitive-persistence/scripts/set-chat-title.mjs` (Node.js nativo con zero dipendenze).
   - Risoluzione automatica della porta di Language Server e del token di autenticazione `x-codeium-csrf-token`.
   - Rilevamento automatico dell'ID di conversazione attivo da `~/.gemini/antigravity/brain/` quando non esplicitato da linea di comando.
2. **Aggiornamento Runbook `/next-step` e Regole**:
   - Aggiunto lo Step 5 ("Ridenominazione Automatica Titolo Chat") nel runbook di `plugins/cognitive-persistence/skills/next-step/SKILL.md`.
   - Aggiornato `rules/AGENTS.md` (punto 4 nella Direttiva di Avvio Task).
   - Documentato il componente e aggiornato il diagramma di flusso in `plugins/cognitive-persistence/README.md`.
3. **Allineamento Configurazione Globale**:
   - Replicati i file aggiornati in `~/.gemini/config/plugins/cognitive-persistence/`.

### Impatto e Verifiche
- Collaudo eseguito: sessione corrente ridenominata con successo e riscontrata sia via Connect-RPC che nel database locale `conversation_summaries.db`.
- Esecuzione `node scripts/validate.mjs` completata con 8/8 plugin validati e 0 anomalie.

---

## [2026-10-07] ADR: Introduzione del Comando Slash `/next-step` in `cognitive-persistence`


### Contesto & Motivazione
Il plugin `cognitive-persistence` forniva la skill `memory-sync` per la chiusura del task (End-of-Task Sync), ma necessitava di un punto di ingresso standardizzato e deterministico per l'avvio della sessione (Start-of-Task Intake). Era richiesta la capacità di scansionare automaticamente `DESIDERATA.md`, estrarre vincoli da `MEMORY.md`, generare il prompt esecutivo ed eseguire la transizione di stato verso `🟡 In Lavorazione`.

### Decisioni Architetturali
1. **Skill `next-step`**:
   - Creata la skill `plugins/cognitive-persistence/skills/next-step/SKILL.md` esposta come comando slash nativo `/next-step`.
   - Adottato il naming standard kebab-case (`next-step`) conforme alle specifiche di Antigravity e al validatore di repository.
2. **Logica di Risoluzione Priorità**:
   - Priorità 1: Ripresa prioritaria dei task già in stato `🟡 In Lavorazione` da sessioni precedenti.
   - Priorità 2: Selezione top-down del primo task nello stato `🔴 Pianificato`.
   - Priorità 3: Notifica di backlog esaurito se tutte le voci sono `🟢 Completato`.
3. **Iniezione Contesto Cognitivo e Generazione Prompt**:
   - Estrazione vincoli tecnici da `MEMORY.md` e contesto architetturale da `WORKLOG.md`.
   - Generazione di prompt esecutivo strutturato con riferimenti mirati (`@file`) e criteri di verifica/test.
4. **Allineamento Manifest, Regole e Documentazione**:
   - Aggiornato `plugin.json` (versione `1.1.0`, inserito `/next-step` nei `suggestedPrompts`).
   - Aggiunta in `rules/AGENTS.md` la sezione 3 ("Direttiva di Avvio Task - Start-of-Task Intake").
   - Aggiornato `README.md` del plugin con diagramma del ciclo integrato di sviluppo (Avvio $\to$ Sviluppo $\to$ Chiusura).
5. **Sincronizzazione Ambiente Globale**:
   - Allineata la copia globale in `~/.gemini/config/plugins/cognitive-persistence/`.

### Impatto e Verifiche
- Suite di validazione `scripts/validate.mjs` superata con 8 plugin validati, 0 errori e 0 avvisi.
- Ciclo di sviluppo governato da `cognitive-persistence` completato (avvio tramite `/next-step` e chiusura tramite `/memory-sync`).

---

## [2026-10-07] ADR: Documentazione Globale del Repository e Guide Dedicate per Ciascun Plugin

### Contesto & Motivazione
Il repository raccoglie 7 plugin modulari e 1 template per Google Antigravity. I README iniziali erano sintetici o incompleti, privi di dettagli operativi sul goal primario, sui problemi specifici risolti nel runtime di Antigravity, sulle sinergie tra componenti e sulle modalità di installazione avanzata (es. Directory Junctions su Windows).

### Decisioni Architetturali
1. **Root `README.md`**:
   - Esposizione formale dei 5 principi guida (modularità, two-phase token model, anti-sycophancy, resilienza operativa, continuità cognitiva).
   - Catalogo completo con percorsi relativi e sintesi degli obiettivi primari (Goal).
   - Sezione dettagliata per le 4 modalità di installazione (workspace, junction/symlink, globale, meta-skill).
   - Guida alla contribuzione e documentazione dei controlli di `scripts/validate.mjs`.
2. **Guide Dedicate per Singolo Plugin**:
   - `cognitive-persistence`: triade cognitiva (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`), schema ADR in `worklog.d/` e flusso End-of-Task Sync con Mermaid.
   - `engineering-sobriety`: pilastri anti-sycophancy, tabella di bonifica lessicale (banned vs replacement) e skill `tone-audit`.
   - `engineering-workflow`: staging chirurgico, Conventional Commits, ciclo Git Worktree e fault localization deterministica con breadcrumb trace.
   - `execution-guard`: watchdog reattivo su task asincroni (`schedule` e `TimerCondition`), massimali del circuit breaker salva-token e timeout Node.js.
   - `laws-of-ux`: 30 Laws of UX articolate in 7 skill tematiche, 5 regole contestuali e report euristico P0-P3.
   - `proactive-mentorship`: 4 pilastri di scrutinio critico (KISS/YAGNI, prompt, casi limite, standard), box di mentorship e skill `prompt-refactor`.
   - `skill-governance`: architettura token a due stadi, audit dimensionale (A-E), scomposizione a divulgazione progressiva e collision check.
   - `starter-plugin`: blueprint standardizzato per lo sviluppo rapido di nuovi plugin conformi a SemVer e al validatore.

### Impatto e Verifiche
- Tutti gli 8 plugin dispongono ora di documentazione approfondita.
- Esecuzione di `npm test` superata con esito positivo: 8/8 plugin validati, 0 errori, 0 avvisi.

---

## [2026-10-07] ADR: Ridenominazione Automatica della Sessione di Chat in `/next-step`

### Contesto & Motivazione
Durante l'avvio di una nuova sessione di sviluppo tramite il comando slash `/next-step`, Antigravity assegnava alla sessione un titolo generico ("Next Step Planning") basato sul prompt iniziale. Di conseguenza, nella sidebar dell'applicazione desktop e dell'IDE comparivano molteplici chat con identica titolazione, rendendo difficoltosa la rapida localizzazione e differenziazione degli interventi in corso o storici.

### Decisioni Architetturali
1. **Analisi del Runtime di Antigravity**:
   - Individuato il meccanismo interno di gestione dei metadati di sessione: le conversazioni sono archiviate in `conversation_summaries.db` e gestite dal processo locale `language_server.exe`.
   - Verificato che l'endpoint locale Connect-RPC `LanguageServerService/UpdateConversationAnnotations` (su porta dinamica `https://127.0.0.1:<port>/`) consente l'aggiornamento in tempo reale dei metadati di annotazione (`title`), notificando la UI reattiva Electron via stream `StreamCascadeSummariesReactiveUpdates`.
2. **Creazione dello Script di Ridenominazione (`set-chat-title.mjs`)**:
   - Creato lo script autonomo `plugins/cognitive-persistence/scripts/set-chat-title.mjs` con zero dipendenze esterne (solo moduli nativi Node.js: `fs`, `path`, `https`, `child_process`).
   - Implementata la risoluzione deterministica della porta tramite analisi di `main.log` e fallback su porte in ascolto di sistema.
   - Implementata l'estrazione automatica del token di autenticazione `x-codeium-csrf-token` dal file HTML dell'applicazione.
   - Supportata la risoluzione automatica della conversazione attiva tramite scansione cronologica di `~/.gemini/antigravity/brain/` quando `--conversation-id` non viene specificato.
3. **Integrazione nel Runbook di `/next-step`**:
   - Aggiornato `plugins/cognitive-persistence/skills/next-step/SKILL.md` introducendo lo "Step 5: Ridenominazione Automatica del Titolo della Chat" prima della conferma di avvio sviluppo.
   - Aggiornato `rules/AGENTS.md` inserendo il punto 4 nella "Direttiva di Avvio Task".
   - Aggiornati il diagramma di flusso e la tabella componenti in `plugins/cognitive-persistence/README.md`.
4. **Sincronizzazione Ambiente Globale**:
   - Replicati lo script e le definizioni aggiornate nella configurazione globale utente `~/.gemini/config/plugins/cognitive-persistence/`.

### Impatto e Verifiche
- Validazione automatica `scripts/validate.mjs` superata con esito positivo (8 plugin verificati, 0 errori, 0 avvisi).
- All'invocazione di `/next-step`, il titolo della chat nella barra laterale di Antigravity viene immediatamente rinominato con il nome dello step selezionato da `DESIDERATA.md`.

---

## [2026-10-07] ADR: Creazione del Plugin `telemetry-analytics` (Invocazioni, Latenza e Tool Metrics)

### Contesto & Motivazione
Nel runtime di Antigravity mancava un meccanismo trasparente e quantitativo per misurare il tempo di utilizzo effettivo dei plugin, la frequenza delle invocazioni di skill e i tassi di successo dei tool nativi. L'approccio ingenuo con hook sincroni per-tool (`PreToolUse`/`PostToolUse`) comportava un overhead di process spawning proibitivo su Windows (~150ms per tool). L'utente ha optato per un'architettura **ibrida** (storage centrale globale con tag di workspace).

### Decisioni Architetturali
1. **Plugin `telemetry-analytics`**:
   - Manifest SemVer `1.0.0` conforme alle specifiche con 3 suggested prompts.
   - Registrazione hook in `hooks.json` su `PostInvocation` e `Stop`, eliminando qualsiasi overhead durante l'esecuzione dei singoli tool call.
2. **Ingestore Batch `scripts/collector.mjs`**:
   - Zero dipendenze esterne (solo API native `node:fs`, `node:path`, `node:os`).
   - Normalizzazione rigorosa dei percorsi su Windows (`\\\\` -> `/`, quote stripping, boundary check `(?:^|\/)plugins\/`).
   - Rilevamento incrementale tramite file cursore `.cursor_<sessionId>.json` per evitare ricalcoli $O(N)$ sui log di transcript.
   - Watchdog di sicurezza rigido (`setTimeout` unref) conforme alle regole di `execution-guard`.
3. **Persistenza e Reporting Ibrido**:
   - Archiviazione in `~/.gemini/antigravity/analytics/` (`events.ndjson` e `metrics-summary.json`).
   - Script CLI `scripts/report.mjs` con supporto per `--workspace`, `--global`, `--json`, `--csv`, `--reset`.
   - Skill `plugin-analytics` (dashboard tabellare Markdown) e `telemetry-export` (esportazione CSV/JSON).
4. **Sincronizzazione Globale**:
   - Creata Directory Junction verso `~/.gemini/config/plugins/telemetry-analytics` per garantire disponibilità immediata a livello utente.

### Impatto e Verifiche
- Suite `npm test` superata con 9 plugin validati, 0 errori, 0 avvisi.
- Test end-to-end eseguito con successo sul transcript reale della sessione: rilevati correttamente tempo di esecuzione, token consumati (input, output, cache ratio), tool chiamati e plugin intercettati (`laws-of-ux`, `telemetry-analytics`, ecc.).


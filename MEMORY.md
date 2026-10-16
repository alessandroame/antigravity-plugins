# Vincoli Stabili & Lezioni Apprese (MEMORY)

Registro distillato per dominio dei vincoli architetturali e delle particolarità del runtime di Google Antigravity per `antigravity-plugins`.
> **Governance anti-bloat**: tetto massimo **200 righe**. Vietato l'append cronologico numerato: aggiornare le sezioni *in-place* sostituendo le regole superate. Le regole verificabili via codice risiedono in [`scripts/validate.mjs`](file:///c:/github/antigravity-plugins/scripts/validate.mjs).

---

## 1. Architettura Plugin, Regole & Skill Loader

- **Purezza Markdown delle Regole (`rules/AGENTS.md`)**:
  - *Insidia*: Inserire frontmatter YAML (`---`) in `rules/*.md` fa sì che il loader tratti il file come blocco raw anziché iniettarlo nel system prompt.
  - *Regola*: Zero blocchi `---` di apertura nei file sotto `rules/` (verificato da `scripts/validate.mjs`).
- **Frontmatter Obbligatorio delle Skill (`skills/<name>/SKILL.md`)**:
  - *Insidia*: Skill prive di `name` o `description` YAML non vengono indicizzate nella fase 1 del system prompt.
  - *Regola*: Includere sempre `name` (`kebab-case`) e `description` (80–250 caratteri con trigger esplicito `Use this skill when...`).
- **Vincoli Manifest (`plugin.json`)**:
  - *Insidia*: Più di 3 elementi in `suggestedPrompts` o `version` non SemVer rompono la validazione e la UI di avvio rapido.
  - *Regola*: Usare sempre versione `X.Y.Z` e massimo 3 `suggestedPrompts`.
- **Divieto di Directory Junctions su Windows & Sync Fisico (`npm run sync`)**:
  - *Insidia*: Il file scanner del Language Server su Windows ignora le NTFS Junctions (`d----l`) e non effettua discovery da `.agents/plugins/` nei workspace.
  - *Regola*: Vietato usare Junction/symlink per i plugin. Eseguire sempre `npm run sync` (`scripts/sync-to-global.mjs`) per clonare fisicamente i plugin in `~/.gemini/config/plugins/` e abilitarli in `~/.gemini/config/config.json`.
- **Plugin On-Demand, Dormienza Predefinita e Routing Peer-to-Peer (`shizzo`)**:
  - *Insidia*: Disabilitare un plugin in `~/.gemini/config/config.json` (`"enabled": false`) nasconde anche le sue skill (`/shizzo`); inoltre `send_message` è asincrono (richiede cessione del turno per il wakeup reattivo) e il `<subagent_reminder>` nativo spinge i subagent a usare l'ID del `parent` Orchestratore come `Recipient`.
  - *Regola*: Mantenere il plugin abilitato in `config.json` con *Clausola di Dormienza Predefinita* in `rules/AGENTS.md`; nella negoziazione `--mediator` (max 1 round), `Gamma` deve cedere il turno dopo aver inviato `send_message` ad `Alpha`/`Beta` per ricevere il wakeup reattivo prima di riferire al `parent`, e `Alpha`/`Beta` devono rispondere a `Recipient: "<id-gamma>"` (`sender`, non `parent`).

---

## 2. Parsing Transcript, Windows NTFS & Connect-RPC

- **Normalizzazione Percorsi nel Parsing di `transcript.jsonl`**:
  - *Insidia*: Gli argomenti tool su Windows contengono backslash raddoppiati (`\\\\`) e apici; `.replace(/\\/g, '/')` genera `//` e workspace come `antigravity-plugins` attivano match spuri su `plugins`.
  - *Regola*: Normalizzare con `p.replace(/^["']|["']$/g, '').replace(/\\+/g, '/').replace(/\/+/g, '/').toLowerCase()` e ancorare le regex con `(?:^|\/)plugins\/`.
- **Rilevamento Conversazione Attiva su NTFS (`transcript.jsonl` mtime)**:
  - *Insidia*: Su NTFS l'`mtime` di `brain/<conversation-id>` non si aggiorna quando viene scritto il file annidato `.system_generated/logs/transcript.jsonl`.
  - *Regola*: In `set-chat-title.mjs`, ordinare le sessioni leggendo `statSync(join(fullPath, '.system_generated', 'logs', 'transcript.jsonl')).mtimeMs`.
- **Ridenominazione Dinamica Chat via Connect-RPC (`set-chat-title.mjs`)**:
  - *Insidia*: Modificare direttamente `conversation_summaries.db` non aggiorna la sidebar Electron in tempo reale.
  - *Regola*: Invocare `POST https://127.0.0.1:<port>/exa.language_server_pb.LanguageServerService/UpdateConversationAnnotations` con `x-codeium-csrf-token` e payload `{"cascadeId": "<id>", "annotations": {"title": "<titolo>"}}`.

---

## 3. Ergonomia Chat (~600px), Markdown GFM & Visualizzazione Flussi

- **Riga Vuota Obbligatoria dopo `</summary>` in GFM**:
  - *Insidia*: Incollare codice recintato (` ``` `) o link Markdown subito dopo `</summary>` in `<details>` disattiva il parser Markdown di Antigravity.
  - *Regola*: Lasciare tassativamente **una riga vuota** subito dopo `</summary>` e prima di `</details>`.
- **Divieto di `flowchart LR` e Selettore Dual-Tab (`code-inspector`)**:
  - *Insidia*: Nella colonna di chat (~600px), i grafi `flowchart LR` con $\ge 4$ nodi scalano il testo a dimensioni illeggibili.
  - *Regola*: Usare il widget `<agent-embed>` dual-tab (`Albero Testuale` a spina verticale max 65 char + `Grafico a Blocchi`) o `flowchart TD` con etichette $\le 28$ char.

---

## 4. Telemetria Ibrida & Visibilità Stime ETA (`telemetry-analytics`)

- **Silenzio `PreInvocation` (`eta-injector.mjs`) e Timestamp Nativi**:
  - *Insidia*: Restituire `ephemeralMessage` in `PreInvocation` stampa log ripetitivi nella UI; calcolare `Elapsed` da `lastUserInputMs` include le pause utente su `ask_question`.
  - *Regola*: `eta-injector.mjs` deve emettere `{}\n` su `stdout`, sottraendo le pause `ask_question` in `.eta_<id>.json`.
- **Visibilità Persistente dell'ETA (`【🟢/🟡/🔴 ETA tot ~Ns】`), Finalizzazione `Stop` e Rotazione Storage**:
  - *Insidia*: `toolAction` dura $< 1\text{s}$ a schermo, i `view_file` collassano in `Explored N files >`, `· ETA` si confonde nel plain-text (`textContent`), su `Stop` (`--finalize`) `newSteps.length` è `0` e in `analytics/` si accumulano `.cursor_<id>.json` e `events.ndjson` senza limiti.
  - *Regola*: Emettere il badge ad alto contrasto `【🟢/🟡/🔴 ETA tot ~Ns】` (`🟢` $\le 20\text{s}$, `🟡` $21\text{–}60\text{s}$, `🔴` $> 60\text{s}$) entro il 2° turno (in `toolAction` + `toolSummary` dell'ultimo `view_file` e del primo tool operativo top-level). In `collector.mjs`, su `isFinalize` processare `etaOutcome` anche a `newSteps` vuoti, eliminare `.cursor_*`/`.eta_*` con `mtime > 7gg` e ruotare `events.ndjson` oltre `5 MB`.

---

## 5. Continuità Cognitiva & Governance Anti-Bloat (`cognitive-persistence`)

- **Isolamento In-Flight (`/take-note`) vs Analisi Differita (`/review-notes`)**:
  - *Insidia*: Ispezionare il codice durante `/take-note` inquina il contesto del task attivo e analizza file in mutazione.
  - *Regola*: Durante `/take-note` toccare solo `NOTES.md` (e leggere `DESIDERATA.md`), rimandando l'ispezione del codice a `/review-notes`.
- **Tetti Massimi e Rotazione dei 4 File Canonici (`MEMORY` $\le 200$, `WORKLOG` $\le 300$, `DESIDERATA` $\le 150$, `NOTES` $\le 120$)**:
  - *Insidia*: Append numerati in `MEMORY.md`, copie integrali di ADR in `WORKLOG.md`, mini-ADR nelle celle di `DESIDERATA.md` o schede risolte multi-riga perpetue in `NOTES.md` gonfiano il contesto letto ad ogni sessione.
  - *Regola*: `MEMORY.md` $\le 200\text{ righe}$ (*in-place* per dominio); `WORKLOG.md` $\le 300\text{ righe}$ (max 15 *Pointer Record* da 4–5 righe); `DESIDERATA.md` $\le 150\text{ righe}$ (split *Backlog Attivo*/*Completate*, celle `Note` $\le 160\text{ char}$); `NOTES.md` $\le 120\text{ righe}$ (header `Ultimo ID Assegnato` + tabella 1 riga max 10 risolte), con archiviazione eccedenze in `.agents/archive/` (verificato da `scripts/validate.mjs --all`).

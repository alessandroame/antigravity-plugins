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
- **Plugin On-Demand, Auto-Routing Skill, Silenzio Intermedio e Output Human-First (`skizzo`)**:
  - *Insidia*: Disabilitare un plugin in `config.json` nasconde `/skizzo`; quando un subagent finisce prima dell'altro l'Orchestratore rischia di stampare messaggi intermedi in chat; usare backtick escapati/LaTeX o gergo interno (`Contratto Esterno`, `Tesler/Postel`, `Oracolo Alpha`) rende l'output incomprensibile all'utente.
  - *Regola*: Mantenere `rules/AGENTS.md` <= 6.500 B con *Clausola di Dormienza*; assegnare 1–2 skill foglia (mai `skizzo`), attendere in silenzio (`0 byte`) finché entrambi i subagent non hanno concluso, ed esporre a 0-Click i 4 punti *Human-First* (*Cosa cambia per te*, *Comodità Beta*, *Problema evitato da Alpha*, *Disaccordo risolto*), confinando metriche e oracoli in `<details>`.

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

- **Riga Vuota Obbligatoria dopo `</summary>` e Igiene Code Span / LaTeX in GFM**:
  - *Insidia*: Incollare codice subito dopo `</summary>` disattiva il parser Markdown; annidare backtick escapati (`` `(Skill: \`...\`)` ``), asterischi dentro code span singoli (`` `**...**` ``) o formule LaTeX (`$\le ...$`) rompe il rendering e il font in chat.
  - *Regola*: Lasciare sempre una riga vuota dopo `</summary>`, usare un backtick singolo per ogni token separato e testo Unicode/ASCII normale (`<=`, `>=`, `->`, `x`), verificato da `validateMarkdownHygiene` in `scripts/validate.mjs`.
- **Divieto di `flowchart LR` e Selettore Dual-Tab (`code-inspector`)**:
  - *Insidia*: Nella colonna di chat (~600px), i grafi `flowchart LR` con >= 4 nodi scalano il testo a dimensioni illeggibili.
  - *Regola*: Usare il widget `<agent-embed>` dual-tab (`Albero Testuale` a spina verticale max 65 char + `Grafico a Blocchi`) o `flowchart TD` con etichette <= 28 char.

---

## 4. Telemetria Ibrida & Visibilità Stime ETA (`telemetry-analytics`)

- **Silenzio `PreInvocation` (`eta-injector.mjs`) e Timestamp Nativi**:
  - *Insidia*: Restituire `ephemeralMessage` in `PreInvocation` stampa log ripetitivi nella UI; calcolare `Elapsed` da `lastUserInputMs` include le pause utente su `ask_question`.
  - *Regola*: `eta-injector.mjs` deve emettere `{}\n` su `stdout`, sottraendo le pause `ask_question` in `.eta_<id>.json`.
- **Visibilità Persistente dell'ETA (`【🟢/🟡/🔴 ETA tot ~Ns】`), Finalizzazione `Stop` e Rotazione Storage**:
  - *Insidia*: `toolAction` dura < 1s a schermo, i `view_file` collassano in `Explored N files >`, `· ETA` si confonde nel plain-text (`textContent`), su `Stop` (`--finalize`) `newSteps.length` è `0` e in `analytics/` si accumulano `.cursor_<id>.json` e `events.ndjson` senza limiti.
  - *Regola*: Emettere il badge ad alto contrasto `【🟢/🟡/🔴 ETA tot ~Ns】` (`🟢` <= 20s, `🟡` 21–60s, `🔴` > 60s) entro il 2° turno (in `toolAction` + `toolSummary` dell'ultimo `view_file` e del primo tool operativo top-level). In `collector.mjs`, su `isFinalize` processare `etaOutcome` anche a `newSteps` vuoti, eliminare `.cursor_*`/`.eta_*` con `mtime > 7gg` e ruotare `events.ndjson` oltre `5 MB`.

---

## 5. Continuità Cognitiva & Governance Anti-Bloat (`cognitive-persistence`)

- **Isolamento In-Flight (`/take-note`) vs Analisi Differita (`/review-notes`)**:
  - *Insidia*: Ispezionare il codice durante `/take-note` inquina il contesto del task attivo e analizza file in mutazione.
  - *Regola*: Durante `/take-note` toccare solo `NOTES.md` (e leggere `DESIDERATA.md`), rimandando l'ispezione del codice a `/review-notes`.
- **Tetti Massimi e Rotazione dei 4 File Canonici (`MEMORY` <= 200, `WORKLOG` <= 300, `DESIDERATA` <= 150, `NOTES` <= 120)**:
  - *Insidia*: Append numerati in `MEMORY.md`, copie integrali di ADR in `WORKLOG.md`, mini-ADR nelle celle di `DESIDERATA.md` o schede risolte multi-riga perpetue in `NOTES.md` gonfiano il contesto letto ad ogni sessione.
  - *Regola*: `MEMORY.md` <= 200 righe (*in-place* per dominio); `WORKLOG.md` <= 300 righe (max 15 *Pointer Record* da 4–5 righe); `DESIDERATA.md` <= 150 righe (split *Backlog Attivo*/*Completate*, celle `Note` <= 160 char); `NOTES.md` <= 120 righe (header `Ultimo ID Assegnato` + tabella 1 riga max 10 risolte), con archiviazione eccedenze in `.agents/archive/` (verificato da `scripts/validate.mjs --all`).

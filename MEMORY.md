# Vincoli Stabili & Lezioni Apprese (MEMORY)

Registro distillato per dominio dei vincoli architetturali e delle particolarità del runtime di Google Antigravity per `antigravity-plugins`.
> **Governance anti-bloat**: tetto massimo **200 righe**. Vietato l'append cronologico numerato: aggiornare le sezioni *in-place* sostituendo le regole superate. Le regole verificabili via codice risiedono in [`scripts/validate.mjs`](file:///c:/github/antigravity-plugins/scripts/validate.mjs).

---

## 1. Architettura Plugin, Regole & Skill Loader

- **Purezza Markdown delle Regole (`rules/AGENTS.md <= 6.000 B`) e Regole Condizionali Workspace**:
  - *Insidia*: Inserire frontmatter YAML (`---`) in `plugins/*/rules/AGENTS.md` impedisce l'iniezione inline; al contrario, lasciare privi di frontmatter (`trigger: model_decision`) i file verticali `.agents/rules/*.md` di un workspace li inietta integralmente ad ogni turno (+8.000 token/turno).
  - *Regola*: Mantenere `plugins/*/rules/AGENTS.md` in markdown puro `<= 6.000 B` senza frontmatter (`validate.mjs`); usare `trigger: model_decision` + `description` + `globs` sui file verticali `.agents/rules/*.md` dei singoli progetti.
- **Frontmatter Obbligatorio delle Skill (`skills/<name>/SKILL.md`) e Igiene Catalogo Globale**:
  - *Insidia*: Skill prive di `name`/`description` non vengono indicizzate; d'altra parte lasciare decine di skill inutilizzate in `~/.gemini/config/skills/` o `description > 250` char nei plugin di terze parti brucia migliaia di token ad ogni turno.
  - *Regola*: Includere sempre `name` (`kebab-case`) e `description` (`80–250` caratteri con trigger `Use this skill when...`), e archiviare fuori da `~/.gemini/config/skills/` le skill di domini non attivi.
- **Vincoli Manifest (`plugin.json`)**:
  - *Insidia*: Più di 3 elementi in `suggestedPrompts` o `version` non SemVer rompono la validazione e la UI di avvio rapido.
  - *Regola*: Usare sempre versione `X.Y.Z` e massimo 3 `suggestedPrompts`.
- **Divieto di Directory Junctions su Windows & Sync Fisico (`npm run sync`)**:
  - *Insidia*: Il file scanner del Language Server su Windows ignora le NTFS Junctions (`d----l`) e non effettua discovery da `.agents/plugins/` nei workspace.
  - *Regola*: Vietato usare Junction/symlink per i plugin. Eseguire sempre `npm run sync` (`scripts/sync-to-global.mjs`) per clonare fisicamente i plugin in `~/.gemini/config/plugins/` e abilitarli in `~/.gemini/config/config.json`.
- **Modalità `Auto-Skizzo Silente` (`AUTO`), Orchestrazione Multi-Dominio Dinamica (`2..4` Agenti), `Anti-Example Hardcoding` e Auto-Apprendimento `L1..L3` (`skizzo`, `skill-governance`, `proactive-mentorship`)**:
  - *Insidia*: Cablare solo 2 ruoli fissi (Tecnico vs Utente) o trasformare in regex gli esempi conversazionali dell'utente (*overfitting sugli esempi*) irrigidisce `/skizzo`; d'altra parte mettere `3–4` agenti sulle colonne di una tabella in chat (`~600px`) genera 5–6 colonne illeggibili, mentre in `triage.mjs` usare `fileURLToPath(import.meta.url)` senza `.replace(/\\/g, '/')` rompe `isMain` su Windows.
  - *Regola*: Partire in `SKIZZO = AUTO` (`triage.mjs`: `silentFastPass: true` sui turni diretti, escalation su `score >= 4`); delegare all'LLM l'individuazione semantica e l'ordinamento per importanza dei domini (`rankAndCapDomains`, cap `2..4` con regola del Rasoio di Occam: aggiungere il `3°`/`4°` solo se introduce un oracolo ortogonale) esponendo la matrice in `<details>` a **4 colonne fisse con i domini sulle righe** (`12/12` test in `triage.test.mjs`). Vietato cablare esempi del prompt utente nelle skill/regole (`skill-governance/rules/AGENTS.md`).

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

## 3. Ergonomia Chat (~600px), Collaudo Visivo UI & Flussi

- **Riga Vuota Obbligatoria dopo `</summary>` e Igiene Code Span / LaTeX in GFM**:
  - *Insidia*: Incollare codice subito dopo `</summary>` disattiva il parser Markdown; annidare backtick escapati (`` `(Skill: \`...\`)` ``), asterischi dentro code span singoli (`` `**...**` ``) o formule LaTeX (`$\le ...$`) rompe il rendering e il font in chat.
  - *Regola*: Lasciare sempre una riga vuota dopo `</summary>`, usare un backtick singolo per ogni token separato e testo Unicode/ASCII normale (`<=`, `>=`, `->`, `x`), verificato da `validateMarkdownHygiene` in `scripts/validate.mjs`.
- **Divieto di `flowchart LR` e Selettore Dual-Tab (`code-inspector`)**:
  - *Insidia*: Nella colonna di chat (~600px), i grafi `flowchart LR` con >= 4 nodi scalano il testo a dimensioni illeggibili.
  - *Regola*: Usare il widget `<agent-embed>` dual-tab (`Albero Testuale` a spina verticale max 65 char + `Grafico a Blocchi`) o `flowchart TD` con etichette <= 28 char.
- **Collaudo Browser Gate 4 (`ui-geometry-probe.js`) e Ricevuta a 4 Misure (Zero Giudizi "A Occhio" e Zero Quote Artificiali)**:
  - *Insidia*: I test Node.js non verificano il layout CSS; guardare uno screenshot "a occhio" porta a bias di autoconferma (*"vedo i box -> tutto ok"* anche con mappe soffocate o bottoni coperti), mentre imporre una quota fissa di difetti da trovare viola il Rasoio di Occam facendo inventare problemi inesistenti.
  - *Regola*: Per ogni modifica UI eseguire nel browser (`360x800` e `1280x800`) [`ui-geometry-probe.js`](file:///c:/github/antigravity-plugins/plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js) e riportare la **Ricevuta a 4 Misure** (Budget schermo `>= 60%`, Gerarchia 3s + `nowrap` unità, Sonda `violations: 0`, Flusso `Prima -> Click -> Dopo` visibile senza scroll), applicando **0 modifiche** se già conforme.

---

## 4. Telemetria Ibrida & Visibilità Stime ETA (`telemetry-analytics`)

- **Silenzio `PreInvocation` (`eta-injector.mjs`) e Timestamp Nativi**:
  - *Insidia*: Restituire `ephemeralMessage` in `PreInvocation` stampa log ripetitivi nella UI; calcolare `Elapsed` da `lastUserInputMs` include le pause utente su `ask_question`.
  - *Regola*: `eta-injector.mjs` deve emettere `{}\n` su `stdout`, sottraendo le pause `ask_question` in `.eta_<id>.json`.
- **Visibilità Persistente dell'ETA (`【🟢/🟡/🔴 ETA tot ~Ns】`), Finalizzazione `Stop` e Rotazione Storage**:
  - *Insidia*: `toolAction` dura < 1s a schermo, i `view_file` collassano in `Explored N files >`, `· ETA` si confonde nel plain-text (`textContent`), su `Stop` (`--finalize`) `newSteps.length` è `0` e in `analytics/` si accumulano `.cursor_<id>.json` e `events.ndjson` senza limiti.
  - *Regola*: Emettere il badge ad alto contrasto `【🟢/🟡/🔴 ETA tot ~Ns】` (`🟢` <= 20s, `🟡` 21–60s, `🔴` > 60s) entro il 2° turno (in `toolAction` + `toolSummary` dell'ultimo `view_file` e del primo tool operativo top-level). In `collector.mjs`, su `isFinalize` processare `etaOutcome` anche a `newSteps` vuoti, eliminare `.cursor_*`/`.eta_*` con `mtime > 7gg` e ruotare `events.ndjson` oltre `5 MB`.

---

## 5. Continuità Cognitiva, Kanban Remoto & Governance Anti-Bloat (`cognitive-persistence`)

- **Isolamento In-Flight (`/take-note`) vs Analisi Differita (`/review-notes`)**:
  - *Insidia*: Ispezionare il codice durante `/take-note` inquina il contesto del task attivo e analizza file in mutazione.
  - *Regola*: Durante `/take-note` toccare solo `NOTES.md` (e leggere `DESIDERATA.md`), rimandando l'ispezione del codice a `/review-notes`.
- **Tetti Massimi in Righe e Byte dei 4 File Canonici (`MEMORY <= 16 KB`, `WORKLOG <= 20 KB`, `DESIDERATA <= 150 righe`, `NOTES <= 120 righe`) e Filtro Subagent in `human-governor`**:
  - *Insidia*: Righe molto lunghe (350+ char) gonfiano `MEMORY.md` (> 26 KB) e `WORKLOG.md` (> 43 KB) pur restando sotto il limite di righe; inoltre in `governor-hook.mjs` contare i transcript dei subagent (`Alpha`/`Beta`/`Gamma`) come sessioni umane attiva falsi positivi `CRITICAL` (`4–6 WIP`).
  - *Regola*: Imporre `MEMORY.md <= 200 righe / 16 KB`, `WORKLOG.md <= 300 righe / 20 KB` (max 12–15 *Pointer Record*), `DESIDERATA.md <= 150 righe` (celle `<= 160` char) e `NOTES.md <= 120 righe` (`validate.mjs --all`). In `governor-hook.mjs`, filtrare i subagent con `isHumanConversationTranscript(tPath)`.
- **Kanban Remoto Multi-Progetto, Sidecar `.agents/board-state.json` e Worktree Junctions (`board-engine.mjs`)**:
  - *Insidia*: Salvare percorsi `@file` lunghi dentro `DESIDERATA.md` sfora i 160 char; `git worktree add` non copia `node_modules`/`.venv`; l'app GitHub Mobile ignora `?title=`/`?body=` negli URL `issues/new`.
  - *Regola*: Salvare i `verifiedTouchSet` e i lock in `.agents/board-state.json` (`mergeDesiderataWithSidecar`), collegare `node_modules`/`.venv` nei worktree via junction (`linkWorktreeDependencies`) e usare su Gemini Live il blocco Copia 1-Tap o Function Calling API (`buildIssueFromVoicePayload`).

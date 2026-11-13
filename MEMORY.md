# Vincoli Stabili & Lezioni Apprese (MEMORY)

Registro distillato per dominio dei vincoli architetturali e delle particolarità del runtime di Google Antigravity per `antigravity-plugins`.
> **Governance anti-bloat**: tetto massimo **200 righe** e **16 KB**. Vietato l'append cronologico numerato: aggiornare le sezioni *in-place* sostituendo le regole superate. Le regole verificabili via codice risiedono in [`scripts/validate.mjs`](./scripts/validate.mjs).

---

## 1. Architettura Plugin, Regole & Skill Loader

- **Purezza Markdown delle Regole (`rules/AGENTS.md <= 6.000 B`), Standard Ibrido `EN/IT` e Regole Condizionali**:
  - *Insidia*: Inserire frontmatter YAML (`---`) in `plugins/*/rules/AGENTS.md` impedisce l'iniezione inline; scrivere la logica procedurale interna in italiano aumenta il consumo BPE (`~21%` byte in più), mentre tradurre in inglese i template visibili o i trigger conversazionali degrada l'UX italiana.
  - *Regola*: Mantenere `plugins/*/rules/AGENTS.md` in markdown puro `<= 6.000 B` senza frontmatter (`validate.mjs`), applicando lo **Standard Ibrido `EN/IT`** (`EN` per logica imperativa, condizioni e step tecnici; `IT` per output utente, template `L0/L1/L2`, `<summary>`, `ask_question`, marker e keyword di attivazione); usare `trigger: model_decision` + `description` + `globs` su `.agents/rules/*.md`.
- **Frontmatter Obbligatorio delle Skill (`skills/<name>/SKILL.md`) e Igiene Catalogo Globale**:
  - *Insidia*: Skill prive di `name`/`description` non vengono indicizzate; lasciare skill inutilizzate in `~/.gemini/config/skills/` o `description > 250` char brucia migliaia di token ad ogni turno.
  - *Regola*: Includere sempre `name` (`kebab-case`) e `description` (`80–250` char con `Use this skill when...`), e archiviare fuori da `~/.gemini/config/skills/` le skill di domini non attivi.
- **Vincoli Manifest (`plugin.json`), Supervisore `mapek` (`Human-Gated`), `[Plugin: <nome>]` in `ask_question` e Subagent `L2c`**:
  - *Insidia*: Auto-applicare in background regole/agenti dedotti dai log modifica il comportamento senza consenso; `ask_question` appare **prima** della risposta testuale, quindi omettere l'ID del plugin o i nomi dei file genera domande anonime incomprensibili. In `validate.mjs` liste YAML senza supporto array diventano `""`, e scrivere `plugins/*/` dentro `/** ... */` chiude il blocco JSDoc (`SyntaxError`).
  - *Regola*: Usare versione `X.Y.Z`, max 3 `suggestedPrompts`, consenso `--confirm-user-approval` in `mapek.mjs` (audit ROI post-10-sessioni in `process-ledger.json`), aprire ogni `ask_question` di plugin con `[Plugin: <nome>]` citando il file esatto (`userFacingQuestionIt`), validare `plugins/*/agents/*.md` in `scripts/validate.mjs` ed evitare `*/` nei commenti blocco JS.
- **Divieto di Directory Junctions su Windows, Auto-Sync Multi-Macchina (`HARDCODED_USER_PATH`) & Shim `pwsh`**:
  - *Insidia*: Il file scanner del Language Server su Windows ignora le NTFS Junctions (`d----l`) e i path assoluti `C:/Users/<utente>/` rompono i comandi cambiando macchina o in Cloud Linux VM.
  - *Regola*: [`scripts/sync-to-global.mjs`](./scripts/sync-to-global.mjs) installa `.git/hooks/post-merge`, salva `plugin-sync-state.json` ed è invocato da [`eta-injector.mjs`](./plugins/telemetry-analytics/scripts/eta-injector.mjs). Usare percorsi relativi (`plugins/...`) o `~` (`~/.gemini/config/plugins/...`) nei runbook (`HARDCODED_USER_PATH` in `validate.mjs`).
- **Modalità `Auto-Skizzo Silente` (`AUTO`), Orchestrazione Multi-Dominio (`2..4` Agenti) e `Anti-Example Hardcoding`**:
  - *Insidia*: Cablare solo 2 ruoli fissi o trasformare in regex gli esempi dell'utente (*overfitting*) irrigidisce `/skizzo`; mettere `3–4` agenti sulle colonne in chat (`~600px`) genera tabelle illeggibili.
  - *Regola*: Partire in `SKIZZO = AUTO` (`triage.mjs`: `silentFastPass: true` sui turni diretti, escalation su `score >= 4`), delegare all'LLM scoperta e ranking dei domini (`rankAndCapDomains`, cap `2..4`) esponendo la matrice in `<details>` a **4 colonne fisse con i domini sulle righe**, e vietare il cablaggio degli esempi utente (`skill-governance/rules/AGENTS.md`).
- **Routing LUT `adaptive-router` (`v1.2.0`), Banner `metadata.user_markdown` a `0` Token, `swarm` vs `invoke_subagent` e Modi Espliciti**:
  - *Insidia*: `<USER_SETTINGS_CHANGE>` appende boilerplate (`No need to comment...`) e transizioni iniziali `from None` (falsi banner al turno 1), i turni multi-tool lenti promuoverebbero un modello `(Low)` a `HIGH` se ricalibrato sulla durata, e `swarm{action:"model"}` fallisce fuori da uno swarm attivo (`no swarm member named ""`) mentre `PreInvocation` non espone ancora `modelOverride`.
  - *Regola*: Sanitizzare i nomi modello (`sanitizeModelSelectionName`), bloccare i tier tra parentesi (`extractExplicitReasoningMode`), emettere i banner di switch in `PreInvocation` con `systemMessage: ""` + `metadata.user_markdown` (`0` token, ignorando `from None`), sincronizzare il roster da `swarm{action:"models"}` (`providerFilter: 'gemini-ui'`) con calibrazione docs `una tantum` (`R1..R6`) ed eseguire lo switch a **1 click** tramite `invoke_subagent` (`self`/`research`).

---

## 2. Parsing Transcript, Cloud VM Symlinks, Windows NTFS & Connect-RPC

- **Bootstrap Cloud Permanente (`~/.gemini/GEMINI.md`), Fast-Path FUSE (`size+mtimeMs`), Taglio Round-Trip `LOW` e Discovery Sessioni**:
  - *Insidia*: Sulle VM Cloud (`jetski`) il runtime inietta solo `~/.gemini/GEMINI.md`; rileggere tutti i file su FUSE `/shared/user/.gemini` manda in timeout il sync; lanciare `triage.mjs` + `model-router.mjs` separati sui turni `LOW` raddoppia i token; iniettare fallback sintetici (`task:task-N.log` o `token_usage: 18000`) avvelena `pattern-harvester` e `adaptive-router`.
  - *Regola*: [`sync-to-global.mjs`](./scripts/sync-to-global.mjs) salta la lettura FUSE se `size + mtimeMs` combaciano e compila `~/.gemini/GEMINI.md` con `0` round-trip extra sui turni `LOW`; [`session-miner.mjs`](./plugins/proactive-mentorship/scripts/session-miner.mjs) e [`harvester-engine.mjs`](./plugins/pattern-harvester/core/harvester-engine.mjs) registrano solo comandi e token reali (filtrando `task:*.log`).
- **Normalizzazione Percorsi e Argomenti Doppiamente Quotati in `transcript.jsonl` (`pattern-harvester`, `telemetry-analytics`)**:
  - *Insidia*: Gli argomenti tool su Windows contengono backslash raddoppiati e valori stringa doppiamente quotati (`"\"node ...\""`), per cui sostituire `"[^"]*"` prima dell'unwrapping collassa il comando in `"<str>"`.
  - *Regola*: Usare `unwrapTranscriptString` prima di `normalizeCommandSkeleton`, richiedere almeno un token operativo strutturato negli n-grammi RLE (`extractToolChainNgrams`) e assegnare `scriptBonus = 0.75` (`ALREADY_COVERED`) agli script già censiti nel catalogo (`evaluateCatalogOverlap`).
- **Rilevamento Conversazione Attiva su NTFS (`transcript.jsonl` mtime) e Ridenominazione Connect-RPC (`set-chat-title.mjs`)**:
  - *Insidia*: Su NTFS l'`mtime` di `brain/<conversation-id>` non cambia quando viene scritto `.system_generated/logs/transcript.jsonl`, e modificare `conversation_summaries.db` non aggiorna la sidebar Electron in tempo reale.
  - *Regola*: Ordinare le sessioni da `statSync(join(fullPath, '.system_generated', 'logs', 'transcript.jsonl')).mtimeMs` e invocare `POST https://127.0.0.1:<port>/exa.language_server_pb.LanguageServerService/UpdateConversationAnnotations` con `x-codeium-csrf-token`.

---

## 3. Ergonomia Chat (~600px), Collaudo Visivo UI & Flussi

- **Piramide `Semantic Drill-Down` (`L0 -> L1 -> L2`), Riga Vuota dopo `</summary>` e Igiene CommonMark/LaTeX**:
  - *Insidia*: Incollare codice subito dopo `</summary>` disattiva il parser Markdown; annidare backtick escapati, asterischi nei code span o formule LaTeX (`$\le ...$`) rompe il rendering in chat.
  - *Regola*: Sopra le 8 righe usare `L0` auto-sufficiente (zero sigle opache) + `2..4` cassetti `L1` + eventuale prova `L2` (max profondità `2`, `0..2` spazi prima di `<details>`, riga vuota dopo `</summary>` e prima di `<details>` `L2`), testo Unicode (`<=`, `>=`, `->`) e backtick singoli puliti (`validateMarkdownHygiene`).
- **Divieto di `flowchart LR` e Selettore Dual-Tab (`code-inspector`)**:
  - *Insidia*: Nella colonna di chat (~600px), i grafi `flowchart LR` con >= 4 nodi scalano il testo a dimensioni illeggibili.
  - *Regola*: Usare il widget `<agent-embed>` dual-tab (`Albero Testuale` a spina verticale max 65 char + `Grafico a Blocchi`) o `flowchart TD` con etichette <= 28 char.
- **Collaudo Browser Gate 4 (`ui-geometry-probe.js`) e Ricevuta a 4 Misure (Zero Giudizi "A Occhio")**:
  - *Insidia*: I test Node.js non verificano il layout CSS; guardare uno screenshot "a occhio" porta a bias di autoconferma, mentre imporre una quota fissa di difetti viola il Rasoio di Occam.
  - *Regola*: Per ogni modifica UI eseguire su `360x800` e `1280x800` [`ui-geometry-probe.js`](./plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js) e riportare la **Ricevuta a 4 Misure** (Budget `>= 60%`, Gerarchia 3s + `nowrap`, Sonda `violations: 0`, Flusso `Prima -> Click -> Dopo`), applicando **0 modifiche** se già conforme.
- **Auto-Discovery Test, Guardia Integrità Asserzioni, `/review-diff` e Gate `Stop` sul Transcript (`engineering-workflow` v1.3.0)**:
  - *Insidia*: Liste di test cablate saltano nuove suite, patch che indeboliscono asserzioni in `tests/` mascherano regressioni e ritocchi `edit_file` dopo l'ultimo test invalidano le verifiche.
  - *Regola*: Usare `discoverRepositoryTestFiles` in [`run-all-tests.mjs`](./scripts/run-all-tests.mjs), filtrare i diff con [`diff-triage.mjs`](./plugins/engineering-workflow/scripts/diff-triage.mjs), eseguire i flussi multi-viewport con [`ui-smoke-runner.mjs`](./plugins/engineering-workflow/scripts/ui-smoke-runner.mjs) e verificare `edit_file < test/probe` su `Stop` tramite [`delivery-gate-hook.mjs`](./plugins/engineering-workflow/scripts/delivery-gate-hook.mjs).

---

## 4. Telemetria Ibrida, Session Backfill & Visibilità Stime ETA (`telemetry-analytics`)

- **Silenzio `PreInvocation` (`eta-injector.mjs`), Footer Token a 4 Valori e Calcolo Contesto**:
  - *Insidia*: Restituire `ephemeralMessage` in `PreInvocation` genera rumore UI; calcolare `Elapsed` da `lastUserInputMs` include le pause utente su `ask_question`; nei `PLANNER_RESPONSE` `input_tokens` esclude la cache.
  - *Regola*: `eta-injector.mjs` emette `{}\n` sottraendo le pause `ask_question` in `.eta_<id>.json`; `session-backfill.mjs` calcola il picco contesto come `max(input_tokens + cache_read_tokens)` (`promptsBreakdown[]`, schema `v3`). A fine risposta emettere solo `> Prompt #<N>: <in> in / <out> out · Contesto: <ctxPct>% (<ctx>) · Sessione: <sessPct>% (<totSessione>)` (su `1M`).
- **Classificazione Chat Umane vs Subagent e Supporto `read_file` (`session-backfill.mjs`, `collector.mjs`)**:
  - *Insidia*: I messaggi di ritorno dei subagent inseriscono marker `Skill Attive (Alpha...)` negli step `> 0` della chat padre; inoltre il runtime moderno usa `read_file` (`args.Path`) anziché `view_file`.
  - *Regola*: Determinare `isSubagent` esclusivamente sul primo step (`step 0` / `userPromptsCount === 1`) ed estrarre i path skill sia da `read_file` sia da `view_file`.
- **Visibilità Persistente dell'ETA (`【🟢/🟡/🔴 ETA tot ~Ns】`), Finalizzazione `Stop` e Rotazione Storage**:
  - *Insidia*: `toolAction` dura < 1s, i `read_file` collassano in `Explored N files >`, su `Stop` (`--finalize`) `newSteps.length` è `0` e in `analytics/` si accumulano `.cursor_*` ed `events.ndjson`.
  - *Regola*: Emettere `【🟢/🟡/🔴 ETA tot ~Ns】` entro il 2° turno in `toolSummary` del primo tool operativo visibile (`edit_file`, `write_file`, `run_command`); in `collector.mjs` processare `etaOutcome` su `isFinalize`, eliminare `.cursor_*`/`.eta_*` > 7gg e ruotare `events.ndjson` oltre `5 MB`.

---

## 5. Continuità Cognitiva, Kanban Remoto & Governance Anti-Bloat (`cognitive-persistence`)

- **Isolamento In-Flight (`/take-note`) vs Analisi Differita (`/review-notes`)**:
  - *Insidia*: Ispezionare il codice durante `/take-note` inquina il contesto del task attivo e analizza file in mutazione.
  - *Regola*: Durante `/take-note` toccare solo `NOTES.md` (e leggere `DESIDERATA.md`), rimandando l'ispezione del codice a `/review-notes`.
- **Tetti in Righe e Byte dei 4 File Canonici (`MEMORY <= 16 KB`, `WORKLOG <= 20 KB`, `DESIDERATA <= 150 righe`, `NOTES <= 120 righe`) e Filtro WIP**:
  - *Insidia*: Righe da 350+ char gonfiano `MEMORY.md` e `WORKLOG.md` oltre 16–20 KB pur restando sotto il limite righe; contare i subagent in `governor-hook.mjs` genera falsi positivi `WIP`.
  - *Regola*: Imporre i tetti in righe e byte (`validate.mjs --all`) e filtrare i subagent in `governor-hook.mjs` tramite `isHumanConversationTranscript(tPath)`.
- **Kanban Remoto Multi-Progetto, Sidecar `.agents/board-state.json` e Worktree Junctions (`board-engine.mjs`)**:
  - *Insidia*: Percorsi `@file` lunghi sforano i 160 char in `DESIDERATA.md`; `git worktree add` non copia `node_modules`/`.venv`; GitHub Mobile ignora `?title=`/`?body=` su `issues/new`.
  - *Regola*: Salvare `verifiedTouchSet` e lock in `.agents/board-state.json` (`mergeDesiderataWithSidecar`), collegare `node_modules`/`.venv` via junction (`linkWorktreeDependencies`) e usare su Gemini Live il blocco Copia 1-Tap o Function Calling API (`buildIssueFromVoicePayload`).

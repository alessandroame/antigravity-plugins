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
- **Visibilità Persistente dell'ETA con Badge + Semaforo (`【🟢/🟡/🔴 ETA tot ~Ns】`) e Finalizzazione `Stop`**:
  - *Insidia*: `toolAction` e `toolSummary` sono nodi `textContent` puri (HTML/CSS/ANSI vengono stampati letteralmente), `toolAction` dura $< 1\text{s}$ e i `view_file` collassano in `Explored N files >`; inoltre su `Stop` (`--finalize`) `newSteps.length` è `0` perché `PostInvocation` ha già avanzato `lastIndex`.
  - *Regola*: Emettere la prima stima entro il 2° turno usando parentesi lenticolari + semaforo semantico di fascia (`【🟢 ETA tot ~15s】` $\le 20\text{s}$, `【🟡 ETA tot ~40s】` $21\text{–}60\text{s}$, `【🔴 ETA tot ~90s】` $> 60\text{s}$) sia in `toolAction` sia in `toolSummary` dell'ultimo `view_file` del batch e del **primo tool operativo top-level** (`replace_file_content`, `write_to_file`, `run_command`). In `collector.mjs`, processare `etaOutcome` su `isFinalize` anche a `newSteps` vuoti e preservare `lastIndex` in `.cursor_<id>.json`.

---

## 5. Continuità Cognitiva & Governance Anti-Bloat (`cognitive-persistence`)

- **Isolamento In-Flight (`/take-note`) vs Analisi Differita (`/review-notes`)**:
  - *Insidia*: Ispezionare il codice durante `/take-note` inquina il contesto del task attivo e analizza file in mutazione.
  - *Regola*: Durante `/take-note` toccare solo `NOTES.md` (e leggere `DESIDERATA.md`), rimandando l'ispezione del codice a `/review-notes`.
- **Tetto Max 200 Righe (`MEMORY.md`) e Rolling Window Pointer Index (`WORKLOG.md` $\le 300$ Righe)**:
  - *Insidia*: Accodare sezioni numerate (`## N. ...`) in `MEMORY.md` o copiare per intero i frammenti di `.agents/worklog.d/` dentro `WORKLOG.md` gonfia entrambi i file oltre 1.000 righe, degradando l'attenzione del modello e duplicando informazioni.
  - *Regola*: `MEMORY.md` deve restare $\le 200\text{ righe}$ diviso in 5–8 sezioni di dominio aggiornate *in-place* (`Insidia`/`Regola`); `WORKLOG.md` deve restare $\le 300\text{ righe}$ (max 15 *Pointer Record* da 4–5 righe con link a `.agents/worklog.d/`), ruotando gli storici eccedenti in `.agents/archive/`.


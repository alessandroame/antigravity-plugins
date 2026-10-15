# Vincoli Stabili & Lezioni Apprese (MEMORY)

Questo documento registra vincoli stabili, particolarità del runtime di Google Antigravity e lezioni apprese a caro prezzo durante lo sviluppo della raccolta `antigravity-plugins`.

---

## 1. Regole dei Plugin (`rules/AGENTS.md`)
- **Problema Riscontrato**: L'inserimento di frontmatter YAML (`---`) all'inizio di `rules/AGENTS.md` o delle regole contestuali dei plugin causa anomalie di rendering o fa sì che il testo venga trattato come blocco raw anziché iniettato direttamente nel system prompt dell'agente.
- **Causa Radice**: Il loader dei plugin di Antigravity si aspetta che i file sotto `rules/` siano file Markdown puri. A differenza delle skill, le regole non richiedono metadati YAML.
- **Pattern Preventivo Obbligatorio**: `rules/AGENTS.md` e ogni file `.md` nella cartella `rules/` devono essere composti esclusivamente da Markdown standard senza alcun blocco `---` di apertura. Questa proprietà è verificata automaticamente da `scripts/validate.mjs`.

---

## 2. Skill on-Demand (`skills/<name>/SKILL.md`)
- **Problema Riscontrato**: Se una skill è sprovvista di `name` o `description` nel frontmatter YAML, non viene indicizzata nel catalogo del runtime Antigravity e non può essere attivata dall'agente.
- **Causa Radice**: La fase 1 del caricamento a due fasi (System Prompt Fisso) scansiona i blocchi frontmatter di tutte le cartelle in `skills/` per popolare la panoramica delle skill disponibili.
- **Pattern Preventivo Obbligatorio**: Ogni skill deve includere all'inizio del file `SKILL.md`:
  ```yaml
  ---
  name: <kebab-case-name>
  description: >-
    <Descrizione concisa e chiara tra 80 e 250 caratteri con trigger 'Use this skill when...'>
  ---
  ```

---

## 3. Manifest del Plugin (`plugin.json`)
- **Problema Riscontrato**: Fallimento della validazione o comportamenti inattesi se `suggestedPrompts` contiene più di 3 elementi o se `version` non è SemVer standard.
- **Causa Radice**: La UI di Antigravity riserva spazio per un massimo di 3 prompt di avvio rapido per ciascun plugin abilitato; stringhe di versione arbitrarie impediscono il corretto tracciamento degli aggiornamenti.
- **Pattern Preventivo Obbligatorio**: Mantenere la versione conforme a `X.Y.Z` e non definire più di 3 prompt in `suggestedPrompts`.

---

## 4. Divieto di Directory Junctions su Windows & Sincronizzazione Fisica Globale
- **Problema Riscontrato**: Collegare i plugin tramite Directory Junction (`New-Item -ItemType Junction`) in `.agents/plugins/` o in `~/.gemini/config/plugins/` causa il fallimento silenzioso del caricamento: il Language Server non indicizza i plugin né le relative skill, e i comandi slash (es. `/next-step`) non appaiono nell'autocompletamento dell'interfaccia utente.
- **Causa Radice**: 
  1. Il runtime e il file scanner del Language Server di Antigravity su Windows scartano a priori i reparse point / Junctions NTFS (trattati come symlink e ignorati per evitare loop di ricorsione).
  2. Antigravity non riconosce le directory `.agents/plugins/` all'interno dei singoli workspace come root di plugin: l'architettura dei plugin richiede che risiedano fisicamente nella directory utente globale `~/.gemini/config/plugins/` e siano registrati con `"enabled": true` in `~/.gemini/config/config.json`.
  3. L'interfaccia client (Electron / webview) popola la cache visuale dei comandi slash all'inizializzazione della finestra: dopo l'installazione di una nuova cartella fisica di plugin, è necessario ricaricare la finestra (`Developer: Reload Window`) o riavviare l'IDE.
- **Pattern Preventivo Obbligatorio**:
  - È tassativamente vietato l'uso di Directory Junction o collegamenti simbolici per i plugin su Windows.
  - Per installare e mantenere aggiornati i plugin durante lo sviluppo, eseguire sempre lo script di sincronizzazione fisica:
    ```bash
    npm run sync
    ```
    che clona ricorsivamente le directory reali da `plugins/` a `~/.gemini/config/plugins/`, rimuovendo automaticamente eventuali vecchi junction rimasti orfani.
  - Se una specifica skill deve essere confinata a un singolo workspace anziché esposta globalmente, deve essere posizionata come cartella fisica in `.agents/skills/<nome-skill>/`, mai in `.agents/plugins/`.

---

## 5. Normalizzazione Percorsi e Parsing Transcript su Windows
- **Problema Riscontrato**: Nel parsing di `transcript.jsonl`, gli argomenti dei tool (es. `AbsolutePath`) possono contenere backslash raddoppiati (`\\\\`) e stringhe racchiuse tra apici. Una sostituzione ordinaria `.replace(/\\/g, '/')` genera doppie barre (`//`), rompendo il matching delle regex. Inoltre, workspace con la parola `plugins` nel nome (es. `antigravity-plugins`) attivano match spuri se non delimitati da slash.
- **Causa Radice**: Serializzazione protojson/JSON su Windows e assenza di delimitatori di percorso `(?:^|\/)`.
- **Pattern Preventivo Obbligatorio**: Normalizzare sempre i percorsi eliminando apici, comprimendo backslash e slash multipli prima del matching:
  ```javascript
  p.replace(/^["']|["']$/g, '').replace(/\\+/g, '/').replace(/\/+/g, '/').toLowerCase();
  ```
  e vincolare tassativamente le espressioni regolari con prefissi `(?:^|\/)plugins\/`.

---

## 6. Aggiornamento Dinamico del Titolo Chat in Antigravity
- **Problema Riscontrato**: Antigravity non include un tool predefinito per rinominare le conversazioni; l'invocazione di prompt o skill come `/next-step` produce titoli generici ("Next Step Planning") nella sidebar, rendendo difficoltosa la navigazione storica tra chat.
- **Causa Radice**: Il processo locale `language_server` genera un riassunto del primo turno e aggiorna `conversation_summaries.db`. La modifica diretta del database SQLite non forza la notifica reattiva al frontend Electron.
- **Pattern Preventivo Obbligatorio**: Per aggiornare la titolazione di una sessione attiva in tempo reale, invocare l'endpoint Connect-RPC `https://127.0.0.1:<port>/exa.language_server_pb.LanguageServerService/UpdateConversationAnnotations` con metodo `POST`, header `x-codeium-csrf-token: <csrf>` (estratto dal runtime frontend) e payload `{"cascadeId": "<id>", "annotations": {"title": "<titolo>"}}`. L'operazione sincronizza contestualmente il database SQLite e invia lo stream reattivo alla sidebar dell'interfaccia utente.

---

## 7. Risoluzione Automatica della Conversazione Attiva su NTFS (`transcript.jsonl` mtime)
- **Problema Riscontrato**: Ordinare le directory `~/.gemini/antigravity/brain/<conversation-id>` utilizzando `statSync(fullPath).mtimeMs` della cartella padre seleziona l'ultima conversazione in cui è stato creato un artefatto alla radice, non la conversazione attualmente attiva.
- **Causa Radice**: Su filesystem NTFS (Windows), l'`mtime` di una directory padre varia solo quando vengono aggiunti o rimossi file figli diretti; la scrittura continua dei turni nel file annidato `.system_generated/logs/transcript.jsonl` non aggiorna l'`mtime` di `brain/<conversation-id>`.
- **Pattern Preventivo Obbligatorio**: Per identificare programmaticamente la sessione di chat attiva (es. in `set-chat-title.mjs`), leggere prioritariamente `statSync(join(fullPath, '.system_generated', 'logs', 'transcript.jsonl')).mtimeMs`, ripiegando sull'`mtime` della directory solo come fallback.

---

## 8. Rendering di Blocchi Codice e Link dentro `<details><summary>` in Markdown GFM
- **Problema Riscontrato**: Inserendo un blocco di codice recintato (` ``` `) o un link Markdown nella riga immediatamente successiva a `</summary>` all'interno di un elemento `<details>`, il parser Markdown della chat di Antigravity tratta il contenuto come blocco HTML grezzo e non formatta né la sintassi del codice né i collegamenti `file://`.
- **Causa Radice**: La specifica CommonMark / GitHub-Flavored Markdown (GFM) interrompe il contesto di blocco HTML `<details>` e riattiva il parsing Markdown interno solo dopo aver incontrato una riga vuota dopo il tag `</summary>`.
- **Pattern Preventivo Obbligatorio**: Nei selettori a espansione (es. skill `/how-its-made` del plugin `code-inspector`), lasciare sempre **una riga vuota** subito dopo `</summary>` e prima di `</details>`.

---

## 9. Illeggibilità dei Diagrammi Orizzontali (`flowchart LR`) nella Colonna di Chat
- **Problema Riscontrato**: I diagrammi `mermaid` con orientamento orizzontale (`flowchart LR`) composti da 4 o più nodi vengono rimpiccioliti drasticamente nella chat di Antigravity, rendendo le scritte microscopiche e schiacciando le frecce dei bivi.
- **Causa Radice**: Il pannello di chat ha una larghezza orizzontale fissa (~600px) e scorrimento verticale libero. Un grafo `LR` affianca tutti gli step in orizzontale, costringendo il contenitore SVG a scalare il fattore di zoom a $1/N$.
- **Pattern Preventivo Obbligatorio**:
  1. Vietare `flowchart LR` per flussi a più di 3 nodi in chat.
  2. Usare l'**Albero Decisionale a Spina Verticale (` ```text `)** (max 65 caratteri per riga, bivi marcati con `◇ BIVIO` e rami `├── [NO] ──►` / `└── [SÌ] ──►`), che mantiene il font monospace al 100% della dimensione nativa.
  3. Nei diagrammi `mermaid`, usare esclusivamente **`flowchart TD` (Top-Down)** spezzando i testi lunghi con `<br/>` (massimo 25–28 caratteri per riga) e distinguendo le forme (`([...])` per Ingresso/Uscita, `{...}` per Bivi, `[...]` per Step).




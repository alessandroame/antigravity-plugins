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

## 4. Installazione Concorrente su Windows (Directory Junctions)
- **Problema Riscontrato**: La duplicazione di cartelle (`cp -r`) disallinea il plugin installato rispetto al repository di sviluppo, richiedendo copie manuali a ogni modifica.
- **Causa Radice**: I filesystem Windows supportano le Directory Junctions (`New-Item -ItemType Junction`) che funzionano in modo trasparente anche senza privilegi di amministratore (a differenza dei symlink simbolici completi).
- **Pattern Preventivo Obbligatorio**: Nei workflow di sviluppo locale su Windows, consigliare l'uso di Directory Junctions verso `.agents/plugins/<nome-plugin>` per garantire sincronizzazione istantanea a costo zero.

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


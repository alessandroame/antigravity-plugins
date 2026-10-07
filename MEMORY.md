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

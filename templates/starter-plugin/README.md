# Starter Plugin Template

Template canonico di riferimento per la creazione rapida di nuovi plugin modulari in **Google Antigravity**, pre-configurato per rispettare gli standard di validazione del repository (`scripts/validate.mjs`).

---

## Obiettivo del Template (Goal)

Fornire un'architettura di partenza pronta all'uso per sviluppare nuovi plugin, garantendo:
- Struttura delle directory conforme ai requisiti di discovery del runtime Antigravity.
- Manifest `plugin.json` valido con campi standard e convenzioni SemVer.
- Regole markdown pure (`rules/AGENTS.md`) prive di frontmatter spurio.
- Skill di esempio con frontmatter YAML conforme (`name` e `description`).

---

## Anatomia del Plugin

```text
starter-plugin/
├── plugin.json                 # Manifest obbligatorio (metadati e prompt di avvio)
├── README.md                   # Documentazione delle funzionalità del plugin
├── rules/
│   └── AGENTS.md               # Regole di condotta attive nel system prompt (senza frontmatter)
└── skills/
    └── starter-action/
        └── SKILL.md            # Skill on-demand con frontmatter (name e description)
```

### Componenti Opzionali Aggiuntivi:
- `mcp_config.json`: per esporre server Model Context Protocol (MCP) bundled.
- `hooks.json`: per definire agganci al ciclo di vita della sessione agentica.
- `references/`: per esternalizzare documentazione tecnica o tabelle di riferimento.
- `examples/`: per guide operative o casi studio Before/After.

---

## Guida alla Creazione di un Nuovo Plugin

### 1. Duplicazione della Cartella
```bash
cp -r templates/starter-plugin plugins/<nome-plugin>
```
*Vincolo: il nome della cartella deve essere in formato kebab-case (es. `my-awesome-tool`).*

### 2. Personalizzazione di `plugin.json`
```json
{
  "name": "<nome-plugin>",
  "displayName": "<Titolo Utente>",
  "description": "<Descrizione concisa e chiara dello scopo>",
  "version": "1.0.0",
  "suggestedPrompts": [
    "<Prompt di avvio rapido 1>",
    "<Prompt di avvio rapido 2>"
  ]
}
```
*Regole di validazione:*
- `name` deve corrispondere al nome della cartella in kebab-case.
- `version` deve seguire il formato SemVer (es. `1.0.0`).
- `suggestedPrompts` non può contenere più di 3 elementi.

### 3. Definizione delle Regole e delle Skill
- Inserire le direttive vincolanti in `rules/AGENTS.md` (markdown puro, niente blocco `---`).
- Creare le skill necessarie in `skills/<nome-skill>/SKILL.md` assicurandosi di specificare `name` e `description` nel frontmatter YAML iniziale.

### 4. Verifica di Conformità
Eseguire la suite di test integrata per verificare la validità formale:
```bash
npm test
# oppure: node scripts/validate.mjs plugins/<nome-plugin>
```

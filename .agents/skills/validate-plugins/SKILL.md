---
name: validate-plugins
description: Esegue la suite di validazione automatica dei manifest e della struttura di tutti i plugin presenti nella raccolta (scripts/validate.mjs).
---

# Procedura di Validazione Plugin

Questa skill esegue il controllo formale e strutturale di conformità di tutti i plugin presenti nella directory `plugins/`.

---

## 1. Comando di Esecuzione

Dalla radice del repository `antigravity-plugins`:

```bash
# Valida tutti i plugin in plugins/
node scripts/validate.mjs

# Valida tutti i plugin inclusi i template
node scripts/validate.mjs --all

# Valida una cartella specifica
node scripts/validate.mjs plugins/engineering-sobriety
```

---

## 2. Controlli Effettuati dallo Script

1. **Manifest (`plugin.json`)**:
   - Validità sintattica (supporta JSON e JSONC con commenti rimossi).
   - Presenza e formato di `name`: stringa minuscola in `kebab-case`.
   - Unicità globale di `name` nel repository (per evitare scarti silenti nel loader di Antigravity).
   - Presenza di `description` (non vuota).
   - Formato SemVer di `version` (es. `1.0.0`).
   - `suggestedPrompts`: array di stringhe, massimo 3 elementi ammessi.
   - `logo`: percorso relativo esistente su disco con estensione valida (`.png`, `.svg`, `.jpg`, `.jpeg`, `.webp`).
   - Segnalazione di campi non supportati (es. `author`, `homepage`).

2. **Documentazione (`README.md`)**:
   - Presenza del file README esplicativo all'interno della cartella del plugin.

3. **Regole (`rules/AGENTS.md`)**:
   - Verifica che il file esista nella cartella `rules/`.
   - Verifica che sia markdown puro (privo di frontmatter YAML).

4. **Skill (`skills/<nome>/SKILL.md`)**:
   - Verifica dell'esistenza di `SKILL.md` per ogni sottocartella in `skills/`.
   - Verifica del frontmatter YAML con campi obbligatori `name` e `description`.

5. **Integrazioni Esterne (`mcp_config.json`, `hooks.json`)**:
   - Validità del JSON e dell'oggetto `mcpServers`.

---

## 3. Risoluzione Errori Comuni

- **`plugin.json non valido`**: correggere virgole mancanti o sintassi JSON nel file indicato.
- **`"name" deve essere in kebab-case`**: rinominare il campo `name` usando solo caratteri minuscoli e trattini (es. `my-awesome-plugin`).
- **`rules/AGENTS.md contiene frontmatter YAML`**: rimuovere il blocco iniziale `--- ... ---` dal file di regole (solo le skill richiedono il frontmatter).
- **`skills/<nome>/SKILL.md: frontmatter YAML mancante`**: aggiungere all'inizio del file YAML `name:` e `description:`.

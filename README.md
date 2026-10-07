# Antigravity Plugins

Raccolta di plugin modulari per Google Antigravity. Ciascun plugin pacchettizza in un unico bundle installabile: regole di condotta, procedure operative (skills), configurazioni MCP e lifecycle hooks.

---

## Catalogo Plugin

| Plugin | Descrizione | Componenti | Percorso |
| :--- | :--- | :--- | :--- |
| **[`engineering-sobriety`](./plugins/engineering-sobriety)** | Impone linguaggio sobrio e ingegneristico, elimina formule promozionali, convenevoli ed enfasi di marketing; prescrive trasparenza critica e divieto di test tautologici. | Regole (`rules/AGENTS.md`), Skill (`skills/tone-audit`) | [`plugins/engineering-sobriety`](./plugins/engineering-sobriety) |
| **[`laws-of-ux`](./plugins/laws-of-ux)** | Suite di design intelligence ed ergonomia basata sulle 30 Laws of UX (Gestalt, Fitts, Hick, Doherty, limiti cognitivi, accessibilità ed ergonomia touch). | 6 Regole, 7 Skill tematiche, Reference teoriche, Template di Audit | [`plugins/laws-of-ux`](./plugins/laws-of-ux) |
| **[`execution-guard`](./plugins/execution-guard)** | Garantisce resilienza operativa: watchdog anti-freeze su task asincroni, divieto di cessione cieca del turno, circuit breaker salva-token e rollback su regressioni. | Regole (`rules/AGENTS.md`), Skill (`skills/task-watchdog`, `skills/circuit-breaker`) | [`plugins/execution-guard`](./plugins/execution-guard) |
| **[`engineering-workflow`](./plugins/engineering-workflow)** | Standard di ingegneria del software: staging chirurgico Git, Conventional Commits, isolamento in Git Worktrees e localizzazione deterministica dei difetti con breadcrumb trace. | Regole (`rules/AGENTS.md`), Skill (`skills/worktree-lifecycle`, `skills/trace-debugging`) | [`plugins/engineering-workflow`](./plugins/engineering-workflow) |
| **[`cognitive-persistence`](./plugins/cognitive-persistence)** | Preserva la continuità architetturale e la memoria di progetto tra sessioni: frammenti di diario ADR (`worklog.d/`), lezioni apprese in `MEMORY.md` e matrice feature in `DESIDERATA.md`. | Regole (`rules/AGENTS.md`), Skill (`skills/memory-sync`) | [`plugins/cognitive-persistence`](./plugins/cognitive-persistence) |
| **[`proactive-mentorship`](./plugins/proactive-mentorship)** | Coaching architetturale e sui prompt: scrutinio critico preventivo (KISS/YAGNI/casi limite), assenza di adulazione (anti-sycophancy) e refactoring Before/After dei prompt. | Regole (`rules/AGENTS.md`), Skill (`skills/prompt-refactor`) | [`plugins/proactive-mentorship`](./plugins/proactive-mentorship) |
| **[`skill-governance`](./plugins/skill-governance)** | Governance per skill: audit trigger, ottimizzazione budget token, prevenzione collisioni/shadowing e scomposizione a divulgazione progressiva. | Regole (`rules/AGENTS.md`), 3 Skill (`skill-audit`, `skill-token-optimizer`, `skill-collision-check`), Reference, Esempi | [`plugins/skill-governance`](./plugins/skill-governance) |

---

## Modalità di Installazione

I plugin possono essere installati a livello di singolo workspace o globalmente per l'intero ambiente utente.

### 1. Installazione nel Workspace del Progetto (Consigliata per team)
Posizionare la cartella del plugin in `.agents/plugins/` alla radice del repository di destinazione:

```bash
# Esempio per engineering-sobriety
mkdir -p <percorso-repo>/.agents/plugins
cp -r plugins/engineering-sobriety <percorso-repo>/.agents/plugins/
```

### 2. Installazione Globale (Per tutti i progetti sulla macchina)
Copiare la cartella del plugin nella directory di configurazione utente di Antigravity:

```bash
# Linux/macOS
cp -r plugins/engineering-sobriety ~/.gemini/config/plugins/

# Windows (PowerShell)
Copy-Item -Recurse plugins/engineering-sobriety "$env:USERPROFILE\.gemini\config\plugins\"
```

*Nota: I nuovi plugin vengono rilevati all'avvio della sessione.*

---

## Creazione di un Nuovo Plugin

Per aggiungere un nuovo plugin alla raccolta:

1. Duplicare il template di base:
   ```bash
   cp -r templates/starter-plugin plugins/<nome-plugin>
   ```
2. Modificare il manifest `plugins/<nome-plugin>/plugin.json`:
   - `name`: identificativo univoco (kebab-case).
   - `displayName`: titolo mostrato nella UI di Antigravity.
   - `description`: sintesi chiara delle funzionalità.
   - `suggestedPrompts`: fino a 3 prompt di avvio consigliati.
3. Inserire le regole in `rules/AGENTS.md` e le eventuali skill in `skills/<nome-skill>/SKILL.md`.
4. Documentare il plugin nel proprio `README.md` e aggiungerlo alla tabella in questo file.
5. Verificare la conformità strutturale con la suite di test:
   ```bash
   npm test
   # oppure: node scripts/validate.mjs --all
   ```

---

## Validazione e Controllo Qualità

Il repository include uno script di validazione statica e conformità manifest in [`scripts/validate.mjs`](./scripts/validate.mjs):

```bash
# Esegue la validazione su tutti i plugin e i template
npm test

# Valida una cartella specifica
node scripts/validate.mjs plugins/engineering-sobriety
```

Controlli eseguiti automaticamente:
- Validità JSON/JSONC dei manifest (`plugin.json`, `mcp_config.json`, `hooks.json`).
- Nomenclatura kebab-case, unicità degli ID ed estensioni dei logo ammesse.
- Conformità SemVer delle versioni e massimo 3 `suggestedPrompts`.
- Assenza di frontmatter YAML in `rules/AGENTS.md` e presenza di frontmatter conforme nelle skill.

---

## Skill Interne di Repository (`.agents/skills/`)

Quando questo repository è aperto in Antigravity, sono disponibili due meta-skill dedicate agli sviluppatori della raccolta:
- **`install-plugin`**: procedura guidata per collegare un plugin a un progetto esterno (Directory Junction su Windows o dichiarazione in `plugins.json`) con audit preventivo delle regole concorrenti.
- **`validate-plugins`**: esecuzione guidata della suite di test interna.


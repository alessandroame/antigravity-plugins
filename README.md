# Antigravity Plugins

Raccolta modulare di plugin ufficiali e standard ingegneristici per **Google Antigravity**. Ciascun plugin pacchettizza in un'unica unità distribuibile e componibile: regole di comportamento permanente, procedure operative specialistiche (skills), cataloghi di riferimento, configurazioni MCP e lifecycle hooks.

---

## 🏛️ Filosofia e Principi Architetturali

L'ecosistema `antigravity-plugins` è progettato secondo i principi di **ingegneria del software deterministica applicata agli agenti autonomi**:

1. **Modularità e Indipendenza**: ogni plugin affronta un dominio specifico (ergonomia UX, resilienza operativa, disciplina Git, memoria contestuale) e può essere installato singolarmente o combinato con gli altri senza generare accoppiamenti rigidi.
2. **Efficienza dei Token (Two-Phase Model)**: riduzione drastica del consumo di token del system prompt tramite descrizioni concise e trigger semantici espliciti, delegando documentazione estesa e guide pratiche a file ausiliari caricati solo su effettiva necessità.
3. **Anti-Sycophancy e Sobrietà**: rifiuto sistematico del linguaggio promozionale, dell'adulazione passiva e dei convenevoli futili in favore di comunicazioni dirette, quantificabili e ancorate a evidenze empiriche.
4. **Resilienza Operativa**: prevenzione attiva degli stalli silenti in background tramite watchdog reattivi, circuit breaker quantitativi salva-token e rollback immediato su regressioni.
5. **Continuità Cognitiva**: eliminazione dell'amnesia tra sessioni diverse tramite la Triade Cognitiva di Progetto (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`).

---

## 📦 Catalogo Completo dei Plugin

| Plugin | Scopo Principale (Goal) | Componenti Chiave | Documentazione Dettagliata |
| :--- | :--- | :--- | :---: |
| **`engineering-sobriety`** | Elimina il linguaggio promozionale, i convenevoli e l'enfasi non tecnica; vieta test tautologici (self-matching) e impone trasparenza immediata sui limiti. | Regola attiva (`rules/AGENTS.md`), Skill (`tone-audit`) | [Leggi README](./plugins/engineering-sobriety/README.md) |
| **`laws-of-ux`** | Suite di design intelligence ed ergonomia basata sulle 30 Laws of UX (Gestalt, Fitts, Hick, Doherty, limiti cognitivi, touch ergonomics e accessibilità). | 6 Regole contestuali, 7 Skill tematiche, Riferimenti teorici, Template di Audit | [Leggi README](./plugins/laws-of-ux/README.md) |
| **`execution-guard`** | Garantisce resilienza operativa: watchdog anti-freeze su task asincroni, divieto di cessione cieca del turno, circuit breaker salva-token e rollback su regressioni. | Regola attiva (`rules/AGENTS.md`), 2 Skill (`task-watchdog`, `circuit-breaker`) | [Leggi README](./plugins/execution-guard/README.md) |
| **`engineering-workflow`** | Standard di ingegneria del software: staging chirurgico Git, Conventional Commits in inglese, isolamento in Git Worktrees e localizzazione difetti con breadcrumb trace. | Regola attiva (`rules/AGENTS.md`), 2 Skill (`worktree-lifecycle`, `trace-debugging`) | [Leggi README](./plugins/engineering-workflow/README.md) |
| **`cognitive-persistence`** | Preserva la continuità architetturale e la memoria di progetto tra sessioni: frammenti di diario ADR (`worklog.d/`), lezioni apprese in `MEMORY.md` e matrice in `DESIDERATA.md`. | Regola attiva (`rules/AGENTS.md`), Skill (`memory-sync`) | [Leggi README](./plugins/cognitive-persistence/README.md) |
| **`proactive-mentorship`** | Coaching architetturale e sui prompt: scrutinio critico preventivo (KISS/YAGNI/casi limite), assenza di adulazione (anti-sycophancy) e refactoring Before/After dei prompt. | Regola attiva (`rules/AGENTS.md`), Skill (`prompt-refactor`) | [Leggi README](./plugins/proactive-mentorship/README.md) |
| **`skill-governance`** | Governance per skill: audit dimensionale dei trigger (A-E), ottimizzazione budget token, prevenzione collisioni/shadowing e scomposizione a divulgazione progressiva. | Regola attiva (`rules/AGENTS.md`), 3 Skill (`skill-audit`, `skill-token-optimizer`, `skill-collision-check`), Reference, Esempi | [Leggi README](./plugins/skill-governance/README.md) |

---

## 🎯 Panoramica e Goal di Ciascun Plugin

### 1. `engineering-sobriety`
- **Goal**: Garantire un tono di lavoro professionale, asciutto e scientifico.
- **Cosa fa**: Sostituisce espressioni promozionali non quantificabili con parametri fisici e metriche oggettive, vincolando l'agente a iniziare le risposte direttamente dai fatti tecnici, senza preamboli né adulazione. Inoltre, vieta categoricamente i test unitari auto-convalidanti in cui l'algoritmo di verifica coincide con quello verificato.
- **Guida completa**: [`plugins/engineering-sobriety/README.md`](./plugins/engineering-sobriety/README.md)

### 2. `laws-of-ux`
- **Goal**: Trasformare i principi della psicologia cognitiva e dell'ergonomia di interazione in standard operativi per il frontend.
- **Cosa fa**: Espone 7 skill specialistiche e 5 regole contestuali che intervengono automaticamente durante la scrittura di layout, form, pulsanti touch, flussi asincroni e menu. Include una skill di audit euristico completo (`laws-of-ux-audit`) in grado di generare report gerarchici di gravità da P0 a P3.
- **Guida completa**: [`plugins/laws-of-ux/README.md`](./plugins/laws-of-ux/README.md)

### 3. `execution-guard`
- **Goal**: Rendere l'agente immune a stalli operativi e impedire lo spreco ricorsivo di token.
- **Cosa fa**: Impone l'esecuzione sincrona prioritaria (`WaitMsBeforeAsync: 10000`). Se un comando non-daemon scivola in background, attiva automaticamente un watchdog reattivo (`schedule` con `TimerCondition`) per risvegliare l'agente in caso di freeze. Stabilisce circuit breaker numerici su errori ripetuti (massimo 2 tentativi per errore identico) e impone il rollback immediato se una modifica introduce nuove regressioni.
- **Guida completa**: [`plugins/execution-guard/README.md`](./plugins/execution-guard/README.md)

### 4. `engineering-workflow`
- **Goal**: Elevare il flusso di version control e debugging agli standard dei migliori team di ingegneria del software.
- **Cosa fa**: Vieta comandi generici come `git add .` o commit autonomi sul branch `main`. Guida la creazione di rami di lavoro paralleli su cartelle isolate tramite Git Worktrees (`worktree-lifecycle`) per evitare collisioni tra sessioni concorrenti. Fornisce inoltre il runbook per la localizzazione scientifica dei difetti tramite l'iniezione temporanea di tracce diagnostiche numerate (`[DEBUG-TRACE #X]`).
- **Guida completa**: [`plugins/engineering-workflow/README.md`](./plugins/engineering-workflow/README.md)

### 5. `cognitive-persistence`
- **Goal**: Eliminare l'amnesia di contesto e preservare la conoscenza architetturale tra diverse sessioni di lavoro.
- **Cosa fa**: Prescrive la Triade Cognitiva di Progetto: `MEMORY.md` per lezioni apprese a caro prezzo e antipattern scoperti empiricamente; `WORKLOG.md` (alimentato da schede ADR granulari in `.agents/worklog.d/`) per la tracciabilità delle decisioni; `DESIDERATA.md` come matrice di stato delle feature. Impone la sincronizzazione obbligatoria prima di concludere qualsiasi task.
- **Guida completa**: [`plugins/cognitive-persistence/README.md`](./plugins/cognitive-persistence/README.md)

### 6. `proactive-mentorship`
- **Goal**: Far operare l'agente come Senior Architect e Coach di Prompt Engineering.
- **Cosa fa**: Anziché eseguire passivamente requisiti ambigui o sovradimensionati, l'agente esamina la richiesta sotto 4 lenti critiche (KISS/YAGNI, casi limite, standard e qualità del prompt) ed espone un box di mentorship con la proposta di prompt refactoring (Prima vs Dopo), massimizzando il determinismo e riducendo il perimetro dei file modificati.
- **Guida completa**: [`plugins/proactive-mentorship/README.md`](./plugins/proactive-mentorship/README.md)

### 7. `skill-governance`
- **Goal**: Governare l'efficienza dei token, la modularità e la qualità delle personalizzazioni di Antigravity.
- **Cosa fa**: Valuta le skill secondo una checklist di 5 assi (Trigger, Frontmatter, Taglia, Tool coupling, Verificabilità) assegnando un punteggio A-E, guida lo scorporo modulare di documenti pesanti verso cartelle ausiliarie e scansiona la gerarchia di installazione per individuare fenomeni di shadowing tra skill con lo stesso nome.
- **Guida completa**: [`plugins/skill-governance/README.md`](./plugins/skill-governance/README.md)

### 8. `telemetry-analytics`
- **Goal**: Fornire osservabilità, tracciamento dei tempi d'uso dei plugin e metriche sull'efficienza di esecuzione.
- **Cosa fa**: Raccoglie telemetria a basso overhead tramite parsing batch del log di sessione (`PostInvocation` e `Stop` hook) senza rallentare i singoli tool. Registra volume invocazioni per plugin/skill, latenza effettiva dei turni, tassi di successo dei tool nativi e consumo di token in modalità ibrida (globale e per singolo workspace).
- **Guida completa**: [`plugins/telemetry-analytics/README.md`](./plugins/telemetry-analytics/README.md)

---

## 📁 Struttura del Repository

```text
antigravity-plugins/
├── .agents/
│   └── skills/
│       ├── install-plugin/            # Meta-skill per installare/collegare plugin in altri repo
│       └── validate-plugins/          # Meta-skill per eseguire la suite di test interna
├── plugins/
│   ├── cognitive-persistence/         # Triade cognitiva e persistenza memoria
│   ├── engineering-sobriety/          # Sobrietà, bonifica lessicale e integrità test
│   ├── engineering-workflow/          # Git governance, worktrees e trace debugging
│   ├── execution-guard/               # Anti-freeze, watchdog e circuit breaker salva-token
│   ├── laws-of-ux/                    # Regole ed ergonomia basate sulle 30 Laws of UX
│   ├── proactive-mentorship/          # Scrutinio critico e prompt refactoring
│   ├── skill-governance/              # Audit, token optimization e collision check
│   └── telemetry-analytics/           # Telemetria ibrida, latenze, invocazioni plugin e tool
├── scripts/
│   └── validate.mjs                   # Motore di validazione statica e conformità manifest
├── templates/
│   └── starter-plugin/                # Template canonico per nuovi plugin
├── package.json                       # Configurazione npm e script di test
└── README.md                          # Questo documento
```

---

## 🚀 Modalità di Installazione dei Plugin

I plugin possono essere installati per un singolo progetto oppure a livello globale per tutti i workspace aperti sulla macchina.

### 1. Nel Workspace del Singolo Progetto (Consigliata per team)
Posizionare la cartella del plugin in `.agents/plugins/` alla radice del repository di destinazione:

```bash
# Esempio per engineering-sobriety su Linux/macOS
mkdir -p <percorso-progetto>/.agents/plugins
cp -r plugins/engineering-sobriety <percorso-progetto>/.agents/plugins/

# Esempio su Windows PowerShell
New-Item -ItemType Directory -Force -Path "<percorso-progetto>\.agents\plugins"
Copy-Item -Recurse plugins/engineering-sobriety "<percorso-progetto>\.agents\plugins\"
```

### 2. Tramite Directory Junction su Windows (Sviluppo Locale)
Se desideri che il progetto di destinazione utilizzi la versione più recente del plugin senza dover copiare i file a ogni aggiornamento:

```powershell
New-Item -ItemType Junction `
  -Path "<percorso-progetto>\.agents\plugins\engineering-sobriety" `
  -Target "c:\github\antigravity-plugins\plugins\engineering-sobriety"
```

### 3. A Livello Globale (Per tutti i progetti della macchina)
Copiare la cartella del plugin all'interno della directory di configurazione utente di Antigravity:

```bash
# Linux / macOS
cp -r plugins/engineering-sobriety ~/.gemini/config/plugins/

# Windows PowerShell
Copy-Item -Recurse plugins/engineering-sobriety "$env:USERPROFILE\.gemini\config\plugins\"
```

*Nota: I nuovi plugin vengono rilevati all'apertura o al riavvio della sessione.*

---

## 🛠️ Creazione di un Nuovo Plugin

Per aggiungere un nuovo componente alla raccolta:

1. **Duplicare il template iniziale**:
   ```bash
   cp -r templates/starter-plugin plugins/<nome-plugin>
   ```
2. **Configurare il manifest `plugins/<nome-plugin>/plugin.json`**:
   - `name`: identificativo univoco kebab-case (deve corrispondere esattamente alla cartella).
   - `displayName`: titolo human-readable mostrato nell'interfaccia.
   - `description`: sintesi chiara del goal e dei problemi risolti.
   - `version`: stringa SemVer valida (es. `1.0.0`).
   - `suggestedPrompts`: massimo 3 prompt di avvio rapido.
3. **Definire le regole e le skill**:
   - Regole in `rules/AGENTS.md` (markdown puro, niente frontmatter YAML).
   - Skill in `skills/<nome-skill>/SKILL.md` (frontmatter YAML obbligatorio con `name` e `description`).
4. **Documentare il plugin**:
   - Creare un `README.md` completo all'interno della cartella del plugin che ne illustri il goal, l'architettura, i prompt di esempio e le modalità di installazione.
5. **Verificare la conformità**:
   ```bash
   npm test
   # oppure per il singolo plugin:
   node scripts/validate.mjs plugins/<nome-plugin>
   ```

---

## 🧪 Validazione e Controllo Qualità

Il repository include uno script di verifica statica in [`scripts/validate.mjs`](./scripts/validate.mjs) invocato tramite `npm test`:

```bash
# Esegue la validazione su tutti i plugin e i template
npm test

# Valida una singola cartella
node scripts/validate.mjs plugins/engineering-sobriety
```

### Controlli Eseguiti Automaticamente:
- Presenza e validità JSON/JSONC del file `plugin.json`.
- Rispetto delle convenzioni kebab-case per i nomi e unicità degli identificatori.
- Rispetto dello standard SemVer per le versioni e limite massimo di 3 `suggestedPrompts`.
- Assenza di frontmatter YAML in `rules/AGENTS.md` (requisito del loader regole di Antigravity).
- Presenza e validità del frontmatter YAML (`name`, `description`) in ogni `SKILL.md`.
- Validità dei percorsi relativi per eventuali file di logo (formati ammessi: `.png`, `.svg`, `.jpg`, `.jpeg`, `.webp`).
- Presenza del file di documentazione `README.md` all'interno di ciascun plugin.

---

## 🧰 Meta-Skill Interne di Repository (`.agents/skills/`)

Quando questo repository è aperto direttamente in Antigravity, l'agente dispone di due skill operative a supporto della manutenzione:
- **`install-plugin`**: procedura per collegare o installare un plugin in un progetto esterno tramite Directory Junction o copia, eseguendo un audit preliminare per rilevare eventuali conflitti con regole preesistenti.
- **`validate-plugins`**: procedura per eseguire la suite di validazione e guidare la correzione immediata di manifest malformati o errori di sintassi.

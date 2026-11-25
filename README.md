# Antigravity Plugins

Framework modulare di **Agentic Harness Engineering**, **Context Engineering** e **Cognitive Persistence** per **Google Antigravity**. Ciascun plugin pacchettizza in un'unica unità distribuibile e componibile: regole di comportamento permanente (`rules/AGENTS.md`), procedure operative a divulgazione progressiva (`skills/<name>/SKILL.md` compatibili con lo standard `agentskills.io`), tabelle di anti-razionalizzazione, cataloghi di riferimento, configurazioni MCP e lifecycle hooks.

---

## Filosofia e Principi Architetturali

L'ecosistema `antigravity-plugins` applica i principi di **ingegneria del software deterministica agli agenti autonomi**:

1. **Modularità e Indipendenza**: ogni plugin governa un dominio specifico (ergonomia UX, resilienza operativa, disciplina Git, memoria contestuale, verifica del codice) e può essere installato singolarmente o combinato con gli altri senza accoppiamenti rigidi.
2. **Context Engineering & Progressive Disclosure (Two-Phase Model)**: riduzione del consumo di token del system prompt tramite frontmatter YAML concisi (80–250 caratteri) e trigger semantici espliciti, delegando documentazione estesa e guide pratiche a file ausiliari (`references/`, `examples/`, `scripts/`) caricati solo su effettiva necessità.
3. **Anti-Sycophancy, Sobrietà e Anti-Rationalization Tables**: rifiuto sistematico del linguaggio promozionale e dell'adulazione passiva, affiancato da tabelle di anti-razionalizzazione che intercettano e bloccano le giustificazioni con cui gli LLM tentano di saltare test, verifiche o letture statiche.
4. **Resilienza Operativa (Harness Guardrails)**: prevenzione attiva degli stalli silenti in background tramite watchdog reattivi, circuit breaker quantitativi salva-token e rollback immediato su regressioni.
5. **Continuità Cognitiva Cross-Session**: eliminazione dell'amnesia tra sessioni tramite l'architettura 3+1 (`NOTES.md`, `MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`).

---

## Catalogo Completo dei Plugin

| Plugin | Scopo Principale (Goal) | Componenti Chiave | Documentazione Dettagliata |
| :--- | :--- | :--- | :---: |
| **`engineering-sobriety`** | Elimina il linguaggio promozionale, i convenevoli e l'enfasi non tecnica; vieta test tautologici (self-matching) e impone trasparenza immediata sui limiti. | Regola attiva (`rules/AGENTS.md`), Skill (`tone-audit`) | [Leggi README](./plugins/engineering-sobriety/README.md) |
| **`laws-of-ux`** | Suite di design intelligence ed ergonomia basata sulle 30 Laws of UX (Gestalt, Fitts, Hick, Doherty, limiti cognitivi, touch ergonomics e accessibilità). | 6 Regole contestuali, 7 Skill tematiche, Riferimenti teorici, Template di Audit | [Leggi README](./plugins/laws-of-ux/README.md) |
| **`execution-guard`** | Garantisce resilienza operativa: watchdog anti-freeze su task asincroni, divieto di cessione cieca del turno, circuit breaker salva-token e rollback su regressioni. | Regola attiva (`rules/AGENTS.md`), 2 Skill (`task-watchdog`, `circuit-breaker`) | [Leggi README](./plugins/execution-guard/README.md) |
| **`engineering-workflow`** | Standard di ingegneria del software: staging chirurgico Git, Conventional Commits in inglese, isolamento in Git Worktrees e localizzazione difetti con breadcrumb trace. | Regola attiva (`rules/AGENTS.md`), 2 Skill (`worktree-lifecycle`, `trace-debugging`) | [Leggi README](./plugins/engineering-workflow/README.md) |
| **`cognitive-persistence`** | Preserva la continuità architetturale e gestisce i pensieri in corso d'opera: cattura in-flight in `NOTES.md` (`/take-note`), analisi differita (`/review-notes`), diario ADR (`WORKLOG.md`), lezioni in `MEMORY.md` e matrice `DESIDERATA.md` (`/next-step`). | Regola attiva (`rules/AGENTS.md`), 4 Skill (`take-note`, `review-notes`, `next-step`, `memory-sync`) | [Leggi README](./plugins/cognitive-persistence/README.md) |
| **`proactive-mentorship`** | Coaching architetturale, uso ottimale di Antigravity (comandi slash, contesto, subagent) e tecniche di addestramento degli agenti (Agent Training Ladder `L0..L3`, refactoring Before/After). | Regola attiva (`rules/AGENTS.md`), Skill (`prompt-refactor`), 2 Reference (`agy-commands-and-context`, `agent-training-ladder`) | [Leggi README](./plugins/proactive-mentorship/README.md) |
| **`skill-governance`** | Governance per skill: audit dimensionale dei trigger (A-E), ottimizzazione budget token, prevenzione collisioni/shadowing e scomposizione a divulgazione progressiva. | Regola attiva (`rules/AGENTS.md`), 3 Skill (`skill-audit`, `skill-token-optimizer`, `skill-collision-check`), Reference, Esempi | [Leggi README](./plugins/skill-governance/README.md) |
| **`telemetry-analytics`** | Osservabilità, telemetria locale e stima ETA in-flight: iniezione orologio real-time (`PreInvocation`), output ETA su variazione significativa, calibrazione scostamento e report CSV/JSON. | Regola attiva (`rules/AGENTS.md`), 2 Skill (`plugin-analytics`, `telemetry-export`), Hooks (`eta-injector`, `collector`) | [Leggi README](./plugins/telemetry-analytics/README.md) |
| **`code-inspector`** | Verifica a livello di codice delle funzionalità software tramite il modello IPO Esteso (Ingresso -> Guardie -> Processo -> Uscita), tracciamento payload, stato test e selettori `<details>` con il codice sorgente coinvolto. | Skill su richiesta (`/how-its-made`), Template HTML dual-tab, Esempio | [Leggi README](./plugins/code-inspector/README.md) |
| **`skizzo`** | Orchestrazione dialettica dinamica multi-dominio (`2..4` subagent ordinati per importanza via LLM) con `Auto-Skizzo Silente` (`AUTO`), filtro `FAST-PASS`, Mediatore opzionale (`Subagent Gamma` via `/skizzo --mediator`) e sintesi in italiano. | Regola attiva (`rules/AGENTS.md`), Skill (`/skizzo`), Motore triage (`scripts/triage.mjs`) | [Leggi README](./plugins/skizzo/README.md) |
| **`ab-bench`** | Confronto empirico alla cieca A/B (`/ab-bench`) sulle 5 Dita ed esplorazione multi-ondata guidata da 4 oracoli in worktree isolati (`/discovery-loop`) con frontiera di Pareto e uscita composita a 5 condizioni. | Skill pure (`/ab-bench`, `/discovery-loop`), Core (`core/discovery-engine.mjs`), CLI (`scripts/bench.mjs`, `scripts/discovery.mjs`), Template `run_workflow` | [Leggi README](./plugins/ab-bench/README.md) |
| **`human-governor`** | Tutela cognitiva dell'operatore umano contro il sovraccarico da orchestrazione asincrona: monitora i WIP contemporanei (`max 2`), il context-thrashing tra chat, la micro-gestione e il coprifuoco notturno (`22:30–07:00`), bloccando il turno con `ask_question`. | Regola attiva (`rules/AGENTS.md`), Skill (`/focus-audit`), Hook `PreInvocation` (`governor-hook.mjs`), Core (`evaluator.mjs`), CLI (`status.mjs`) | [Leggi README](./plugins/human-governor/README.md) |
| **`pattern-harvester`** | Scoperta periodica non intrusiva di pattern ricorrenti nelle lavorazioni e nelle interazioni (`transcript.jsonl`, n-grammi RLE di tool, scheletri CLI e cluster lessicali) con filtro anti-collisione sul catalogo attivo, calcolo ROI KLM/GOMS e generazione di scaffold `SKILL.md` o `plugin.json`. | Regola attiva (`rules/AGENTS.md`), Skill (`/pattern-harvester`), Hook `Stop` (`periodic-harvester-hook.mjs`), Core (`harvester-engine.mjs`), CLI (`pattern-harvester.mjs`) | [Leggi README](./plugins/pattern-harvester/README.md) |
| **`mapek`** | Supervisore sempre attivo a consenso umano dei processi di interazione Umano-AI (Monitor, Analyze, Plan, Gate Umano, Execute, Knowledge): rileva attriti multi-sessione, sintetizza Controlli `L3`, Agenti isolati `agents/*.md` (`L2c`), Skill o Regole, pota le regole inefficaci dopo 10 sessioni e comunica in Semantic Drill-Down chiedendo sempre conferma prima di agire. | Regola attiva (`rules/AGENTS.md`), Subagent (`agents/mapek-analyst.md`), Skill (`/mapek`), Hooks `PreInvocation` + `Stop`, Core (`trajectory-analyzer`, `primitive-router`, `mastery-ledger`) | [Leggi README](./plugins/mapek/README.md) |
| **`adaptive-router`** | Routing dinamico Prompt-to-Model+Mode su LUT a 6 archetipi (`R1..R6` su `LOW`, `MEDIUM`, `HIGH`), banner immediato a `0` token sui cambi modello UI, conferma a 1 click e calibrazione roster `una tantum`. | Regola attiva (`rules/AGENTS.md`), Skill (`/model-router`), Hooks `PreInvocation` + `Stop`, Core (`router-engine.mjs`), CLI (`model-router.mjs`) | [Leggi README](./plugins/adaptive-router/README.md) |

---

## Panoramica e Goal di Ciascun Plugin

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
- **Goal**: Eliminare l'amnesia di contesto, catturare osservazioni in-flight senza interrompere il lavoro attivo e preservare la conoscenza architetturale tra sessioni.
- **Cosa fa**: Governa l'architettura cognitiva 3+1: `NOTES.md` come buffer di cattura rapida a zero context-switch (`/take-note`) e di analisi differita sul codice (`/review-notes`); `MEMORY.md` per lezioni apprese a caro prezzo; `WORKLOG.md` (alimentato da schede ADR granulari in `.agents/worklog.d/`) per la tracciabilità delle decisioni; `DESIDERATA.md` come matrice di stato delle feature (`/next-step` e `/memory-sync`).
- **Guida completa**: [`plugins/cognitive-persistence/README.md`](./plugins/cognitive-persistence/README.md)

### 6. `proactive-mentorship`
- **Goal**: Far operare l'agente come Senior Architect, Antigravity Workflow Coach e Istruttore di Agent Training.
- **Cosa fa**: Tramite un Gate Anti-Disturbo che resta in silenzio sui prompt già chiari, intercetta richieste ambigue, sottoutilizzo dell'IDE o correzioni ripetute dell'utente ed espone in `<details>` il kit pronto da copiare: refactoring del prompt (*Prima vs Dopo*), la singola scorciatoia nativa di Antigravity (`/grill-me`, `/plan`, `/compact`, `/goal`, `/learn`, `/skizzo`, `/ab-bench`) e il gradino dell'Agent Training Ladder (`L0..L3`, da `MEMORY.md` a `SKILL.md` fino ai test automatici shift-left).
- **Guida completa**: [`plugins/proactive-mentorship/README.md`](./plugins/proactive-mentorship/README.md)

### 7. `skill-governance`
- **Goal**: Governare l'efficienza dei token, la modularità e la qualità delle personalizzazioni di Antigravity.
- **Cosa fa**: Valuta le skill secondo una checklist di 5 assi (Trigger, Frontmatter, Taglia, Tool coupling, Verificabilità) assegnando un punteggio A-E, guida lo scorporo modulare di documenti pesanti verso cartelle ausiliarie e scansiona la gerarchia di installazione per individuare fenomeni di shadowing tra skill con lo stesso nome.
- **Guida completa**: [`plugins/skill-governance/README.md`](./plugins/skill-governance/README.md)

### 8. `telemetry-analytics`
- **Goal**: Fornire osservabilità, stima ETA complessiva in-flight delle lavorazioni in corso e metriche sull'efficienza di esecuzione.
- **Cosa fa**: Governa l'emissione dell'ETA riferita all'intera lavorazione (`· ETA tot ~Ns` accoppiata in `toolAction` e `toolSummary` sui soli tool di checkpoint entro il 2° turno e sul primo tool operativo top-level, con zero rumore sui restanti step e zero iniezioni nei box di output). Raccoglie telemetria a basso overhead (`PostInvocation` e `Stop` hook) registrando l'accuratezza delle stime ETA (`etaCalibrationFactor`), il volume invocazioni per plugin/skill, i tassi di successo dei tool e il consumo di token.
- **Guida completa**: [`plugins/telemetry-analytics/README.md`](./plugins/telemetry-analytics/README.md)

### 9. `code-inspector`
- **Goal**: Consentire allo sviluppatore di ricordare, comprendere e verificare rapidamente a livello di codice come funziona una funzionalità software senza consumare token fissi nei turni ordinari.
- **Cosa fa**: Espone a divulgazione progressiva pura la skill `/how-its-made` (`0` byte di regola `Always-On`), che ricostruisce il flusso secondo il modello **Punto di Ingresso -> Guardie -> Processo -> Punto di Uscita**, classificando ciascun passaggio (`[PURE]`, `[STATE]`, `[I/O]`), generando il widget `<agent-embed>` dual-tab (`Albero Testuale` | `Grafico a Blocchi`) e fornendo selettori `<details>` con estratti verificati del codice sorgente.
- **Guida completa**: [`plugins/code-inspector/README.md`](./plugins/code-inspector/README.md)

### 10. `skizzo`
- **Goal**: Superare i compromessi del ragionamento monolitico scoprendo e ordinando per importanza i domini coinvolti (`2..4` subagent paralleli), con passaggio diretto silenzioso sui compiti lineari.
- **Cosa fa**: Parte in modalità `Auto-Skizzo Silente` (`SKIZZO = AUTO`): sui turni diretti (`score < 4` in `triage.mjs`) risponde con `0` subagent e `0` byte di banner; sui compromessi multi-dominio (`score >= 4` o `/skizzo`) avvia in parallelo da `2` a `4` subagent isolati (`DUAL-TRACK`, `TRI-TRACK`, `QUAD-TRACK` via `rankAndCapDomains`). Con `/skizzo --mediator` (`-m`) avvia nella Fase 2 `Subagent Gamma` per il lodo arbitrale, esponendo il banner `MODALITÀ SKIZZO ATTIVA` con link `conversation://<id>` e la matrice a 4 colonne fisse in `<details>`.
- **Guida completa**: [`plugins/skizzo/README.md`](./plugins/skizzo/README.md)

### 11. `ab-bench` (`v1.1.0`)
- **Goal**: Misurare empiricamente alla cieca se una skill, un plugin o una variante architetturale produca un valore reale superiore tramite sfida A/B (`/ab-bench`) o esplorazione multi-ondata guidata da oracoli (`/discovery-loop`).
- **Cosa fa**: Opera come plugin pure-skill (`0` byte `Always-On`): con `/ab-bench` confronta A vs B sulle **5 Dita** (`0..5`, Rasoio di Occam, storico in `ab-bench-history.ndjson`); con `/discovery-loop` orchestra mutatori divergenti in worktree isolati (`run_workflow`), filtra con 4 oracoli bloccanti, sanifica i candidati e restituisce la frontiera di Pareto con arresto composito (`quick` / `deep` / `overnight`) lasciando `main` intatto.
- **Guida completa**: [`plugins/ab-bench/README.md`](./plugins/ab-bench/README.md)

### 12. `human-governor`
- **Goal**: Impedire all'operatore umano di trasformarsi nel gestore di interrupt in tempo reale dei propri agenti, imponendo un tetto al numero di WIP concorrenti e proteggendo il recupero cognitivo.
- **Cosa fa**: Tramite l'hook `PreInvocation` (`governor-hook.mjs`) scansiona all'inizio del turno utente le conversazioni attive in `~/.gemini/antigravity/brain/` negli ultimi `30` minuti (filtrando solo le sessioni utente `<USER_REQUEST>`), conta i cambi di contesto in `10` minuti, la frequenza di prompt oraria, la durata continua senza pause e il coprifuoco (`22:30–07:00`). Al superamento delle soglie invia una notifica balloon su Windows e inietta `[HUMAN-GOVERNOR ALERT]`, obbligando l'agente a fermarsi con `ask_question` per chiedere all'utente se chiudere i WIP in eccesso, convertire il task in `/goal` o attivare uno snooze consapevole di `30` minuti (`/focus-audit`).
- **Guida completa**: [`plugins/human-governor/README.md`](./plugins/human-governor/README.md)

### 13. `pattern-harvester`
- **Goal**: Individuare periodicamente e senza rumore in chat le sequenze di lavoro, le pipeline di comandi shell e le interazioni ricorrenti che meritano di essere automatizzate tramite nuove Skill, Regole o Plugin.
- **Cosa fa**: Tramite un hook leggero su `Stop` (`periodic-harvester-hook.mjs`, `< 5ms`) avvia in background detached ogni `5` sessioni umane (o `24` ore) il motore headless `harvester-engine.mjs`. Quest'ultimo estrae n-grammi RLE di sequenze tool (`3..5-grammi`), scheletri strutturali di comandi CLI e cluster lessicali per similarità di Jaccard, scarta i flussi già coperti dal catalogo installato, calcola il risparmio netto di tempo su 15 sessioni secondo i parametri KLM/GOMS (`>= 120s` per una Skill, `>= 240s` per un Plugin) e genera lo scaffold pre-validato (`--scaffold <patternId>`) invocabile anche on-demand con `/pattern-harvester`.
- **Guida completa**: [`plugins/pattern-harvester/README.md`](./plugins/pattern-harvester/README.md)

### 14. `mapek`
- **Goal**: Osservare dall'alto e in modo continuo i processi di interazione tra l'operatore umano e l'AI per generalizzare controlli, agenti isolati, procedure e regole ad alto rendimento, guidando l'operatore senza mai modificare il sistema senza il suo consenso esplicito.
- **Cosa fa**: Sempre attivo tramite doppio hook (`Stop` per l'analisi periodica in sola lettura in background, `PreInvocation` silenzioso che interviene solo quando matura una decisione `PENDING_APPROVAL`), analizza le traiettorie bidirezionali su 5 detector di attrito, instrada ogni soluzione verso l'artefatto nativo più economico (inclusi i nuovi subagent dichiarativi `agents/*.md` `L2c`), mantiene il profilo di padronanza EMA (`operator-mastery.json`), verifica dopo 10 sessioni se una regola approvata riduce davvero il rework (`process-ledger.json`) ed espone ogni decisione in **Semantic Drill-Down (`L0 -> L1 -> L2`)** bloccandosi con `ask_question` prima di agire (`/mapek`).
- **Guida completa**: [`plugins/mapek/README.md`](./plugins/mapek/README.md)

### 15. `adaptive-router`
- **Goal**: Instradare in `< 3 ms` ogni richiesta sul profilo cognitivo ottimale (`LOW`, `MEDIUM`, `HIGH`) tramite una tabella LUT a 6 archetipi (`R1..R6`), notificando cambi modello a zero token.
- **Cosa fa**: Mantiene il roster dinamico delle famiglie Gemini/Orchestrator (`swarm{action:"models"}`, calibrazione documentale `una tantum`), emette banner immediati `metadata.user_markdown` a `0` token sui cambi modello/modalità in UI e propone in 1 click l'upgrade via `invoke_subagent` (`self`/`research`) sui turni sottodimensionati (`UNDERPROVISIONED_UI_MODEL`), restando silenzioso sui turni allineati (`/model-router`).
- **Guida completa**: [`plugins/adaptive-router/README.md`](./plugins/adaptive-router/README.md)

---

## Struttura del Repository

```text
antigravity-plugins/
├── .agents/
│   └── skills/
│       ├── install-plugin/            # Meta-skill per installare/collegare plugin in altri repo
│       └── validate-plugins/          # Meta-skill per eseguire la suite di test interna
├── plugins/
│   ├── ab-bench/                      # Sfida cieca A/B su 5 Dita (/ab-bench) e Giudice Cieco
│   ├── code-inspector/                # Verifica flusso IPO (/how-its-made) e selettori codice
│   ├── cognitive-persistence/         # Triade cognitiva e persistenza memoria
│   ├── engineering-sobriety/          # Sobrietà, bonifica lessicale e integrità test
│   ├── engineering-workflow/          # Git governance, worktrees e trace debugging
│   ├── execution-guard/               # Anti-freeze, watchdog e circuit breaker salva-token
│   ├── human-governor/                # Guardia WIP concorrenti (/focus-audit) e coprifuoco
│   ├── laws-of-ux/                    # Regole ed ergonomia basate sulle 30 Laws of UX
│   ├── pattern-harvester/             # Scoperta periodica pattern (/pattern-harvester) e scaffold ROI
│   ├── proactive-mentorship/          # Scrutinio critico e prompt refactoring
│   ├── skizzo/                        # Dual-Track dialettico Tecnico vs Dominio (/skizzo)
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

## Modalità di Installazione dei Plugin

I plugin di Antigravity operano a livello globale all'interno della directory di configurazione utente `~/.gemini/config/plugins/` e vengono attivati tramite il file `config.json`.

> [!WARNING]
> **Divieto di Junction NTFS / Reparse Points su Windows**:
> Il Language Server di Antigravity ignora i Directory Junctions e i symlink su Windows. I plugin devono essere sempre clonati o sincronizzati come **directory fisiche reali** all'interno di `~/.gemini/config/plugins/`.

### 1. Sincronizzazione Globale Rapida (Consigliata)
Per installare o aggiornare tutti i plugin del repository direttamente nella configurazione di Antigravity:

```bash
npm run sync
```

Questo comando (guidato da `scripts/sync-to-global.mjs`):
1. Rimuove eventuali vecchi Directory Junction rimasti orfani.
2. Copia fisicamente tutte le directory dei plugin in `~/.gemini/config/plugins/`.
3. Garantisce che il Language Server rilevi e carichi immediatamente tutte le skill e regole associate.

### 2. Copia Manuale del Singolo Plugin
Se desideri installare manualmente un singolo plugin:

```powershell
# Windows PowerShell (Copia Fisica)
Copy-Item -Recurse -Force plugins/cognitive-persistence "$HOME\.gemini\config\plugins\"
```

```bash
# Linux / macOS
cp -r plugins/cognitive-persistence ~/.gemini/config/plugins/
```

### 3. Rilevamento nell'Interfaccia Chat (Comandi Slash)
- Il Language Server di Antigravity scansiona `~/.gemini/config/plugins/` per estrarre le skill registrate.
- L'interfaccia client (Electron) carica la cache dei comandi slash (es. `/next-step`, `/memory-sync`, `/tone-audit`) all'avvio: dopo la prima sincronizzazione di un nuovo plugin, ricarica la finestra con `Ctrl+Shift+P` -> `Developer: Reload Window` (oppure riavvia Antigravity).

---

## Creazione di un Nuovo Plugin

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

## Validazione e Controllo Qualità

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

## Meta-Skill Interne di Repository (`.agents/skills/`)

Quando questo repository è aperto direttamente in Antigravity, l'agente dispone di due skill operative a supporto della manutenzione:
- **`install-plugin`**: procedura per collegare o installare un plugin in un progetto esterno tramite Directory Junction o copia, eseguendo un audit preliminare per rilevare eventuali conflitti con regole preesistenti.
- **`validate-plugins`**: procedura per eseguire la suite di validazione e guidare la correzione immediata di manifest malformati o errori di sintassi.

# Piano Esecutivo (Cloud-Ready): Benchmark A/B, Conversione Universale Ibrida EN/IT e Standard Permanente

> **Istruzione per l'Agente (Sessione Cloud o Locale)**: esegui questo piano sequenzialmente dalla **Fase 1** alla **Fase 3** in modalità autonoma (`/goal`), fermandoti solo se la Fase 1 restituisce `NO-GO`. Usa esclusivamente percorsi relativi o `~` (zero path assoluti di macchina/container `/root/...`, `/home/...` o `C:\Users\...`).

---

## 1. Regola Generale di Conversione: "In Inglese Dove Conviene"

Qualsiasi file normativo scoperto dinamicamente nel repository (`plugins/*/rules/*.md`, `plugins/*/skills/*/SKILL.md`, `plugins/*/agents/*.md`, `.agents/skills/*/SKILL.md`, `templates/*/rules/*.md`, `templates/*/skills/*/SKILL.md`) deve seguire questa partizione:

| Blocco Semantico | Lingua Target | Regola Chirurgica |
| :--- | :---: | :--- |
| **Logica Imperativa, Condizioni, Soglie e Parametri Tool** | **Inglese (`EN`)** | Tradurre tutta la prosa operativa usando imperativi RFC-2119 (`MUST`, `NEVER`, `IF ... -> STOP`) e i nomi esatti dei tool (`WaitMsBeforeAsync`, `TimerCondition`, `invoke_subagent`). Nelle righe che citano `<agent-embed>` e `100vh`/`h-screen`/`min-h-screen`, usare sempre `never` o `no` per rispettare `scripts/validate.mjs`. |
| **Procedura Tecnica Interna (`Step 1..N` in `SKILL.md` e `agents/*.md`)** | **Inglese (`EN`)** | Tradurre in inglese conciso gli step esecutivi destinati all'agente per ridurre il consumo di token on-demand. |
| **Direttiva di Lingua verso l'Utente** | **Inglese (`EN` esplicito)** | Dove la regola prescrive di generare testo libero per l'utente in chat, specificare `in plain Italian` / `reply in Italian` per azzerare il rischio di *language drift*. |
| **Template Visibili, Banner, `<summary>`, Opzioni `ask_question` e Marker Subagent** | **Italiano (`IT` Verbatim)** | **Vietato tradurre**: mantenere byte-per-byte in italiano i banner (`MODALITÀ SKIZZO ATTIVA`, `VERDETTO AB-BENCH`), i titoli `<summary><strong>...</strong></summary>`, le intestazioni di tabella visibili all'utente, le opzioni `ask_question` e i marker di filtro subagent (`Skill Attive (...)`, `Sfidante A`, `Sfidante B`, `Giudice Cieco`). |
| **Frontmatter YAML `description` (`80–250` caratteri) e Trigger Conversazionali** | **Inglese + Keyword `IT`** | Usare `Use this skill when...` o `Use this skill to...` in inglese (entro `80–250` caratteri, senza `: ` non quotati su righe inline) preservando i comandi `/slash` e le frasi spia in italiano che l'utente digita in chat (*"non agire"*, *"forza skizzo"*, *"avviene ancora"*, *"annulla regola"*). |
| **Documentazione Umana (`README.md`)** | **Italiano (`IT` Invariato)** | Non toccare i `README.md` (salvo allineare eventuali riferimenti se necessario): non vengono caricati nel system prompt (`0` token) e restano in italiano per la lettura umana. |

---

## Fase 1 — Benchmark Empirico A/B con Giudice Cieco (`GO / NO-GO`)

1. **Preparazione in Memoria (Zero Scritture nei Plugin Canonici)**:
   - Leggi lo stato attuale di `plugins/execution-guard/rules/AGENTS.md` (archetipo 1: logica operativa pura) e `plugins/mapek/rules/AGENTS.md` (archetipo 2: template UI e `ask_question` in italiano).
   - Genera in memoria (o in una cartella temporanea fuori da `plugins/`) le rispettive versioni **Ibride EN/IT** secondo la Sezione 1 e verifica che il risparmio statico di byte sia **`>= 18%`**.
2. **Esecuzione dei 3 Scenari di Stress in Isolamento (`invoke_subagent` `research`)**:
   - Lancia in parallelo `Sfidante A` (con la regola originale `IT` iniettata in `<RULE_UNDER_TEST priority="OVERRIDE">`) e `Sfidante B` (con la regola `Ibrida EN/IT` iniettata in `<RULE_UNDER_TEST priority="OVERRIDE">`) sui 3 scenari:
     - **S1 (Operativo & Circuit Breaker)**: comando browser headless scivolato in background (`task-42`) + 2° errore identico consecutivo alla stessa riga dopo aver rotto un test verde (`WaitMsBeforeAsync: 10000`, `schedule` con `DurationSeconds: 90` + `TimerCondition: "task-42"`, stop immediato al 2° tentativo senza 3° retry, `git checkout -- <file>`).
     - **S2 (Template UI & Zero Language Drift)**: iniezione di `[MAPEK DECISION READY — ID: mapek-9a2c]` per una proposta `PENDING_APPROVAL` di tipo `Controllo L3` su `scripts/validate.mjs` (verifica risposta 100% in italiano in `L0`, `<details>` con riga vuota post-`</summary>` e le 4 opzioni `ask_question` in italiano verbatim senza ID tecnici).
     - **S3 (Carico Combinato Multi-Regola)**: 3 modifiche consecutive senza test su `src/core/engine.mjs` + richiesta di creare uno script di test standalone che chiama un'API HTTP remota (intercettazione spirale in 2 righe italiane, rifiuto chiamate HTTP live con `?mock=1` e timeout `45000` `.unref()`).
   - Estrai il percorso filesystem dal `logAbsoluteUri` dei subagent (rimuovendo il prefisso `file:///` su Windows o `file://` su Linux Cloud) ed esegui il Subagent **Giudice Cieco** e il calcolo del verdetto con:
     `node plugins/ab-bench/scripts/bench.mjs --evaluate --seed <seed> --id-a <idA> --id-b <idB> --transcript-a <pathA> --transcript-b <pathB> --scores-x <sX> --scores-y <sY> --no-save --json`
3. **Gate Quantitativo (`GO / NO-GO`)**:
   - **GO**: risparmio byte `>= 18%`, punteggio 5 Dita `scoreB >= scoreA` in **3 scenari su 3** (`lostFingers.length === 0`), **`0` parole inglesi infiltrate** nel testo rivolto all'utente (`Language Drift = 0`) e `stepRatio <= 1.0`.
   - **NO-GO**: se anche un solo scenario perde 1 dito o risponde in inglese all'utente, interrompi l'esecuzione e riporta il report diagnostico.

---

## Fase 2 — Conversione Universale Dinamica di Tutti i Plugin Presenti

Superato il gate `GO` della Fase 1:

1. **Allineamento Guardie Statiche Bilingui (`L3`)**:
   - In `scripts/validate.mjs`: nella guardia su `<agent-embed>` e `100vh|h-screen|min-h-screen`, aggiorna la regex di negazione da `/\b(?:mai|never|vietato|no|divieto|evitare)\b/i` a `/\b(?:mai|never|not|no|avoid|forbid|forbidden|prohibited|vietato|divieto|evitare)\b/i`.
   - Scansiona tutti i file `plugins/*/tests/*.test.mjs` alla ricerca di asserzioni regex accoppiate a frasi normative in italiano dentro `rules/AGENTS.md` o `skills/*/SKILL.md` (incluso `plugins/cognitive-persistence/tests/cognitive-persistence-governance.test.mjs`) e rendi tali regex bilingui `(?:IT_pattern|EN_pattern)` senza indebolire alcun controllo.
2. **Auto-Discovery e Conversione Integrale**:
   - Scansiona dinamicamente con `fs.readdirSync` tutte le directory presenti in `plugins/`, `.agents/skills/` e `templates/` (includendo qualsiasi nuovo plugin aggiunto prima dell'avvio della sessione Cloud).
   - Per ciascun plugin/template scoperto:
     - Converti `rules/AGENTS.md` e ogni eventuale regola contestuale `rules/*.md` nel formato Ibrido EN/IT (verificando che `Buffer.byteLength <= 6000`).
     - Converti tutti i file `skills/*/SKILL.md` (frontmatter `description` in `[80, 250]` char con `Use this skill when...` + keyword italiane, corpo `<= 200` righe con logica/step in `EN` e template/output utente in `IT`).
     - Converti tutti i file subagent `agents/*.md` (`<= 180` righe, logica in `EN`, marker di apertura in `IT` se filtrati da `session-miner.mjs`).
3. **Verifica Continua dopo Ogni Lotto di 3–4 Plugin**:
   - Esegui `npm run validate` (`node scripts/validate.mjs --all`) e `npm test` (`node scripts/run-all-tests.mjs`), correggendo immediatamente qualsiasi violazione di igiene Markdown (`<details>`, righe vuote post-`</summary>`, lunghezza `description`, collisioni boilerplate).

---

## Fase 3 — Istituzionalizzazione Permanente ("D'ora in poi")

1. **Codifica dello Standard nelle Regole di Governance e Creazione**:
   - In `plugins/skill-governance/rules/AGENTS.md` e `plugins/skill-governance/skills/skill-audit/SKILL.md`: aggiungi la regola **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)** come requisito obbligatorio per la scrittura e l'audit di tutte le future regole (`rules/*.md`), skill (`SKILL.md`) e subagent (`agents/*.md`).
   - In `plugins/proactive-mentorship/rules/AGENTS.md`, `plugins/mapek/rules/AGENTS.md` e `plugins/pattern-harvester/rules/AGENTS.md` (e relativi script di scaffold se generano template markdown): prescrivi che ogni nuova regola `L2a`, skill `L2b` o agente `L2c` auto-distillato venga generato nativamente in formato Ibrido EN/IT.
   - Allinea `templates/starter-plugin/` al formato Ibrido EN/IT.
2. **Aggiornamento Memoria Architetturale e Chiusura**:
   - Registra il vincolo *in-place* in `MEMORY.md`, aggiorna lo stato del task in `DESIDERATA.md` a `🟢 Completato` ed esegui la verifica finale completa:
     `npm run validate && npm test && npm run sync`

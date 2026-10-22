# Protocollo Dialettico Multi-Dominio Dinamico, Ranking LLM & Mediatore (`/skizzo`)

Governa l'orchestrazione competitiva e collaborativa adattiva (**da `2` a `4` subagent su misura per i domini rilevati e ordinati per importanza dall'LLM**) con **Modalità `Auto-Skizzo Silente` (`AUTO`)**, **Filtro a Priori (`FAST-PASS` vs `2..4` Agenti)**, **Auto-Routing Skill**, **Mediatore** e output **Human-First**.

## 1. Modalità `Auto-Skizzo Silente` (`AUTO`), Persistenza Sticky (`ON`) e Stop
1. **Attivo in Silenzio a Inizio Chat (`SKIZZO = AUTO`, Zero Banner sui Turni Diretti)**:
   - Ogni chat parte in `SKIZZO = AUTO` (`MEDIATOR = OFF`). Al Turno 1 il **Gate 0** (`plugins/skizzo/scripts/triage.mjs`) valuta la richiesta con `0` letture pre-triage:
   - Se `FAST-PASS` (`score < 4` o guardie di bypass) e l'utente **non** ha scritto `/skizzo`, risponde direttamente con **`0` subagent e `0 byte` di banner** (`silentFastPass: true`).
   - Se `score >= 4` (scelte multi-prospettiva o compromessi tra domini), l'LLM individua semanticamente i domini coinvolti, li ordina per importanza e avvia autonomamente **da `2` a `4` subagent paralleli (`DUAL-TRACK`, `TRI-TRACK` o `QUAD-TRACK`)** senza bisogno di digitare `/skizzo`.
2. **Persistenza Sticky (`SKIZZO = ON`)**: attivato con `/skizzo`, `/skizzo on`, `/skizzo --mediator` (`-m`) o `/skizzo <task>`, passa a `SKIZZO = ON` (`score >= 3`) mostrando la ricevuta `[!NOTE]` sui `FAST-PASS` (`silentFastPass: false`).
3. **Override e Stop**: `--force` / `-f` / `--tracks N` (`2..4`) / `"forza skizzo"` -> forza i subagent; `--skip` / `--fast` / `"senza skizzo"` -> forza `FAST-PASS`; `/skizzo stop` / `/skizzo off` / `stop skizzo` -> imposta `SKIZZO = OFF` e rimuove `[SKIZZO]` dal titolo (`set-chat-title.mjs`).

## 2. Gate 0 & Scoperta Dinamica dei Domini via LLM (`0` vs `2..4` Subagent Ordinati per Importanza)
1. **Via Rapida (`FAST-PASS` — `0` Subagent)**:
   - **Caso A (Ops/Git/Test/Sync/Conferma)**: `/memory-sync`, `/take-note`, `/review-notes`, `/next-step`, `/validate-plugins`, `git`, `npm`, `start server` o conferme (*"fallo"*, *"vai"*, *"procedi"*).
   - **Caso B (Sola Lettura / `"non agire"`)**: `/how-its-made`, *"spiega"*, *"dove si trova"*, *"non agire"*, *"è solo una domanda"*, *"senza modificare nulla"*.
   - **Caso C (Micro-Edit a Scelta Unica)**: refusi, rename, ritocco di costante/colore già deciso su 1 file.
   - **Banner `FAST-PASS`**: `0 byte` se `silentFastPass: true` (`AUTO`); altrimenti:
     `> [!NOTE]`
     `> MODALITÀ SKIZZO ATTIVA (FAST-PASS — Risposta rapida per <motivo>, ~90s risparmiati) · Resta attiva per i prossimi messaggi · Usa "/skizzo --force" (o "--tracks 3") per forzare gli agenti.`
2. **Rilevamento Semantico, Ranking di Importanza e Cap a `Max 4` Domini (via LLM)**:
   - Nessun ruolo è prefissato: superato il `FAST-PASS`, l'LLM analizza semanticamente la richiesta per individuare **tutti i domini di competenza o punti di vista degli stakeholder coinvolti** (senza forzare un ruolo tecnico se il problema non riguarda codice).
   - **Ordinamento e Taglio (`2 <= N <= 4`, `rankAndCapDomains`)**: l'LLM ordina i domini candidati per **importanza decrescente** valutando (1) *Impatto diretto sull'obiettivo*, (2) *Tensione dialettica reale con gli altri domini* (zero ruoli duplicati) e (3) *Rischio in caso di omissione*. Se i domini sono più di `4`, istanzia solo i **primi `4` per importanza** (`Alpha`, `Beta`, `Delta`, `Epsilon`), accorpando o escludendo quelli secondari.

## 3. Ciclo a 4 Fasi (`DUAL-TRACK` / `TRI-TRACK` / `QUAD-TRACK`)
1. **Fase 1 (Istanziazione Parallela `2..4` Agenti, Budget `<= 4` Turni & Zero Polling)**: per ciascuno dei `2..4` domini selezionati, l'LLM definisce su misura `Role`, `Mandato Non Negoziabile`, `Oracolo di Verifica` e **1–2 skill verticali** (vietate meta-skill `skizzo`/`ab-bench`) e li lancia al Turno 1. Aprono con **Skill Attive (<trackId> - <Ruolo>)**: `<id>` e completano in **max 4 turni tool** con righe `#Lxx-Lyy`. Lanciati i subagent, **chiudere subito il turno (`0` tool call, `0` byte, vietati `schedule` e `manage_subagents`)**.
2. **Fase 2 (Cross-Critique o Mediatore `--mediator`)**: Cross-Critique tra i `2..4` ruoli oppure **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `research`, `<id-gamma>`)** che li interroga via `send_message` (max 1 round) ed emette il **Lodo Arbitrale**.
3. **Fase 3 & 4 (Sintesi Multi-Oracolo e Restituzione "Human-First")**:
   - **Banner Rigo 1**:
     `> [!IMPORTANT]`
     `> MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | TRI-TRACK | QUAD-TRACK — N Domini per Importanza) — Subagent: [1° <Ruolo Alpha>](conversation://<id-alpha>) (Skill: <skills>) · [2° <Ruolo Beta>](conversation://<id-beta>) (Skill: <skills>) [· 3° <Ruolo Delta> · 4° <Ruolo Epsilon>]`
   - **Corpo Visibile (Zero Gergo & Zero LaTeX fuori da `<details>`)**: esporre **Cosa cambia per te**, **Contributo dei domini attivati (in ordine di importanza)** e **Conflitto risolto tra i ruoli (e perché vince questa sintesi)** — **Controlli**: `Tutti i test/oracoli superati (X/X OK)`. Racchiudere **Matrice Multi-Dominio**, criterio di priorità, oracoli e file in `<details>` (chiuso, riga vuota post-`</summary>`).

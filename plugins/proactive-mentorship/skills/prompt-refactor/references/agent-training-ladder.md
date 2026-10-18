# Prontuario di Addestramento degli Agenti (`Agent Training Ladder L0..L3`)

Questo riferimento guida la trasformazione di una correzione dell'utente o di un'operazione manuale ripetitiva in un miglioramento permanente dell'agente (*Harness Engineering*), evitando che l'utente debba ripetere due volte la stessa istruzione.

---

## 1. Albero Decisionale Deterministico (`L0 -> L1 -> L2 -> L3`)

| Gradino | Quando Usarlo (Condizione) | Dove Vive | Costo Fisso in Token | Efficacia nel Tempo |
| :--- | :--- | :--- | :--- | :--- |
| **L0 — Prompt 1-Shot + Esempio Prima/Dopo** | L'errore o l'ambiguità riguarda solo il task corrente (`Freq == 1`). | Nel messaggio della chat corrente. | `0 token` nei turni futuri. | Risolve il singolo task. |
| **L1 — Invariante di Memoria (`MEMORY.md`)** | L'utente corregge una particolarità architetturale specifica di questo progetto (`Freq >= 2`), non verificabile con una semplice regex. | `MEMORY.md` (letto a inizio sessione / `/next-step`). | `0 token` nel System Prompt fisso. | Alta all'interno del progetto. |
| **L2a — Regola Sempre Attiva (`/learn` / `AGENTS.md`)** | L'utente corregge il comportamento generale, il tono o il metodo di lavoro dell'agente (`Freq >= 2`) che deve valere ad ogni singolo turno. | `rules/AGENTS.md` (o regola creata via `/learn`). | `100 - 500 token` ad ogni turno (tetto `<= 6.500 byte`). | Molto alta su tutte le chat. |
| **L2b — Skill Procedurale (`SKILL.md`)** | L'utente incolla o spiega a mano una checklist multi-step (`>= 3 passaggi`) per un compito ricorrente (es. audit, rilascio, migrazione). | `skills/<nome>/SKILL.md` + `references/`. | `<= 45 token` (solo `description` YAML; corpo letto on-demand). | Alta quando il task si ripresenta. |
| **L3 — Guardia Statica Shift-Left (`validate.mjs` / Test)** | La regola riguarda codice, formattazione, limiti di righe/byte o token vietati verificabili automaticamente in `< 20 righe` di codice. | `scripts/validate.mjs` o suite `npm test`. | **`0 token`** (eseguito fuori dal modello). | **100% Deterministica** (impossibile da ignorare). |

---

## 2. Template "Copia-Incolla" per i 4 Scenari Reali (Oracolo Beta)

### Scenario 1 — Contesto Saturo & Ricerca Cieca (`L0` + `/compact`)
- **Attrito Utente**: dopo molti turni l'utente scrive *"C'è ancora quel problema nel salvataggio, controlla i file"* senza indicare percorsi né test.
- **Kit da Fornire in `<details>`**:
  - **Mossa Antigravity Consigliata**: `/compact` — Comprime lo storico accumulato prima di avviare la nuova diagnosi.
  - **Prompt Ottimizzato**:
    `Verifica il flusso di salvataggio in @src/core/storage.js, isola la causa del mancato aggiornamento con trace deterministici e verifica che node --test tests/storage.test.js passi con 0 errori.`

### Scenario 2 — Task Complesso ma Vago (`L0` + `/grill-me` / `/plan`)
- **Attrito Utente**: l'utente chiede *"Rifacciamo la gestione dei permessi e dei ruoli dell'applicazione"* in una sola frase.
- **Kit da Fornire in `<details>`**:
  - **Mossa Antigravity Consigliata**: `/grill-me Voglio ridisegnare ruoli e permessi in @src/auth/: fammi fino a 4 domande mirate su gerarchia ruoli, persistenza e retrocompatibilità prima di proporre il piano.`
  - **Pillola di Addestramento (`L0 -> L1`)**: una volta concordati i vincoli col `/grill-me`, salvarli in `DESIDERATA.md` e `MEMORY.md` prima dell'esecuzione.

### Scenario 3 — Correzione Ripetuta all'Agente (`L1` / `L2a` / `L3`)
- **Attrito Utente**: l'utente scrive *"Te l'ho già detto: non usare chiamate HTTP reali nei test e non mettere emoji nei titoli!"*.
- **Kit da Fornire in `<details>`**:
  - **Mossa Antigravity Consigliata**: `/learn Vietato effettuare chiamate HTTP reali nei test automatici (usare sempre mock offline) e vietato inserire emoji decorative nei titoli.`
  - **Pillola di Addestramento (`L1` — Voce pronta per `MEMORY.md`)**:
    ```markdown
    - **Isolamento Offline dei Test e Sobrietà Titoli**:
      - *Insidia*: Chiamate HTTP live nei test causano errori 429/flakiness; le emoji nei titoli degradano la leggibilità tecnica.
      - *Regola*: Usare esclusivamente fixture/mock offline (`?mock=1`) nei test e testo privo di emoji decorative nei titoli Markdown/UI.
    ```
  - **Graduazione Shift-Left Consigliata (`L3` — Test Automatico)**: aggiungere un controllo statico nella suite di test che fallisca se nei file `*.test.js` compaiono URL `https://` non mockati.

### Scenario 4 — Procedura Manuale Ripetuta (`L2b` — Estrazione in `SKILL.md`)
- **Attrito Utente**: l'utente incolla per la 3ª volta una checklist manuale di 6 passaggi per verificare e rilasciare un componente.
- **Kit da Fornire in `<details>`**:
  - **Pillola di Addestramento (`L2b` — Bozza pronta per `.agents/skills/<nome-procedura>/SKILL.md`)**:
    ```markdown
    ---
    name: release-check
    description: >-
      Utilizza questa skill quando devi eseguire la checklist di verifica pre-rilascio del modulo, validando test, bundle size e sincronizzazione documentazione.
    ---

    # Runbook di Verifica Pre-Rilascio
    1. Esegui `npm test` verificando 0 fallimenti.
    2. Controlla l'assenza di file temporanei con `git status --porcelain`.
    3. Aggiorna `WORKLOG.md` e `DESIDERATA.md` tramite `/memory-sync`.
    ```
  - **Come usarla dalla volta successiva**: invece di reincollare gli step, basterà scrivere *"Esegui la skill `release-check` su `@src/modulo`"*.

---

## 3. Tecnica del Condizionamento per Contrasto (*Few-Shot Prima/Dopo*)

Quando l'agente sbaglia il formato dell'output (es. risposte troppo prolisse o stile del codice non conforme), insegnare all'utente che **1 coppia di esempi concreti (*Errato vs Atteso*) vale più di 50 righe di aggettivi astratti**:
- **Inefficace (Astratto)**: *"Sii più sintetico e scrivi messaggi di errore chiari."*
- **Efficace (Contrasto Deterministico da inserire nella Regola/Skill)**:
  - *Output Vietato*: `"Si è verificato un errore imprevisto nel sistema."`
  - *Output Atteso*: `"[ERR_AUTH_401] Token scaduto su POST /api/session — rinnova la sessione con refreshAuth()."`

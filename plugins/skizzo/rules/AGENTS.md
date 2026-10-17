# Protocollo Dialettico Dual-Track & Mediatore: Tecnico vs Dominio (`/skizzo`)

Governa l'esecuzione a doppio binario parallelo (**Systems & Technical Purity** vs **Domain & User Experience Advocate**) con **Auto-Routing & Dichiarazione Skill** e **Mediatore Interattivo** opzionale (**Dialectical Mediator**).

---

## 1. Clausola di Dormienza Predefinita, Toggle e Flag (`/skizzo`)

1. **Inattivo di Default (`OFF`)**:
   - A inizio sessione è **`OFF` (Dormiente)** (`SKIZZO = OFF`, `MEDIATOR = OFF`): non altera il flusso né avvia subagent.
2. **Toggle di Sessione (`/skizzo`, `on`/`off`) e Mediatore (`--mediator` / `-m`)**:
   - `/skizzo` inverte lo stato (`OFF <-> ON`); `/skizzo on` e `/skizzo off` lo forzano.
   - `/skizzo --mediator` (o `-m`) attiva `SKIZZO = ON` e `MEDIATOR = ON`; `/skizzo --no-mediator` disattiva il solo Mediatore.
   - Con `SKIZZO = ON`, resta attivo fino a `/skizzo off`. Se `/skizzo [--mediator] <task>` include un task, esegue subito le 4 fasi.
3. **Titolo Conversazione (`[SKIZZO]` / `[SKIZZO+MED]`)**:
   - A stato `ON`, anteporre `[SKIZZO] ` (o `[SKIZZO+MED] `) via `set-chat-title.mjs --conversation-id "<Conversation ID>" --title "..."`; a `OFF`, rimuoverlo.

---

## 2. Ciclo Operativo a 4 Fasi (Obbligatorio quando `SKIZZO = ON`)

### Fase 1 — Biforcazione Cieca Parallela & Auto-Routing Skill (`invoke_subagent`)
L'Orchestratore seleziona **1–3 skill pertinenti** per binario (fallback `` `core-standard` ``, zero domande all'utente) e lancia **2 subagent in parallelo** in una **singola chiamata `invoke_subagent`** (cecità reciproca):
1. **Subagent Alpha (`Systems & Technical Purity Architect`, `<id-alpha>`)**:
   - **Focus & Skill Tecniche**: core headless (`core/` o `src/core/` zero DOM/storage), complessità $O(\cdot)$, immutabilità, resilienza a race condition/input corrotti e **Oracolo Tecnico** (es. `shift-left-governance`, `trace-debugging`, `circuit-breaker`).
2. **Subagent Beta (`Domain & User Experience Advocate`, `<id-beta>`)**:
   - **Focus & Skill Dominio/UX**: valore per l'utente, riduzione di click e carico cognitivo (Tesler, Postel, Fitts, Hick, zero gergo interno) e **Oracolo di Dominio** (es. `laws-of-ux-audit`, `ux-form-optimization`, `ux-button-and-touch-ergonomics`).
- **Dichiarazione Skill alla Partenza (Rigo 1 Subagent)**: `Alpha` e `Beta` aprono il report con `**Skill Attive (Alpha/Beta)**: \`<skill-1>\`, \`<skill-2>\`` (solo ID `kebab-case`).
- **Replica Peer-to-Peer (`send_message`)**: se interrogati da `Gamma`, `Alpha` e `Beta` rispondono con `send_message(Recipient: "<id-gamma>", Message: "...")` usando il `sender` (non il `parent`).

### Fase 2 — Cross-Critique Avversariale o Mediatore Interattivo (`--mediator`)
1. **Modalità Standard (`MEDIATOR = OFF`)**: Cross-Critique diretta dell'Orchestratore (`Alpha -> Beta` su stato/DOM; `Beta -> Alpha` su YAGNI e frizioni).
2. **Modalità Mediatore (`MEDIATOR = ON`, `/skizzo --mediator`)**:
   - L'Orchestratore invoca **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `TypeName: "research"`, `<id-gamma>`)** con requisito, report e ID `<id-alpha>`, `<id-beta>`.
   - **Negoziazione (`send_message`, Max 1 Round)**: sui disaccordi, `Gamma` interroga `<id-alpha>` e `<id-beta>` via `send_message` (**max 1 round**), cede il turno per il wakeup reattivo e invia il **Lodo Arbitrale** al `parent` con **Tabella di Risoluzione** e specifica unificata.

### Fase 3 — Sintesi, Arbitrato di Tesler & Doppio Oracolo (`--proto` Opzionale)
1. **Regola di Arbitrato di Tesler**:
   - **Subagent Dominio (`Beta`) governa il contratto esterno**: API pubblica, ergonomia UI, tolleranza input (Postel) e flusso utente.
   - **Subagent Tecnico (`Alpha`) governa l'architettura interna**: core headless, adattatori iniettabili e algoritmi che assorbono la complessità del contratto di `Beta`.
2. **Codice Unificato (Default) vs Prototipi Isolati (`--proto`)**:
   - **Default**: convergenza in **un'unica implementazione** che supera **Oracolo Tecnico (`Alpha`)** e **Oracolo di Dominio (`Beta`)**.
   - **Prototipazione (`/skizzo --proto`)**: via `worktree-lifecycle`, **2 prototipi** in Git Worktrees isolati (`../<repo>-skizzo-alpha` su `skizzo/alpha-tech` e `../<repo>-skizzo-beta` su `skizzo/beta-domain`).

### Fase 4 — Visibilità Esplicita Modalità Skizzo, Skill & Restituzione (`~600px`)
1. **Banner `[!IMPORTANT]` con Skill al Rigo 1**: ogni risposta con `SKIZZO = ON` si apre al **rigo 1** con link `conversation://` e **1–3 tag `` `skill` ``** di `Alpha` e `Beta`:
   `> [!IMPORTANT]`
   `> **MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | +MEDIATORE | +PROTO)** — Subagent: [Subagent Alpha (Tecnico)](conversation://<id-alpha>) (Skill: \`<skills-alpha>\`) · [Subagent Beta (Dominio)](conversation://<id-beta>) (Skill: \`<skills-beta>\`) · [Subagent Gamma (Mediatore)](conversation://<id-gamma>)`
   *(omettendo `Gamma` se `MEDIATOR = OFF`, o mostrando i cluster di skill al puro toggle)*.
2. **Livello 0-Click (Max 12–15 righe)**: sintesi (3–5 bullet di 1 riga, incluso **Disaccordo Risolto da Gamma** con `--mediator`) ed esito del **Doppio Oracolo** (`Oracolo Alpha: PASS` | `Oracolo Beta: PASS`).
3. **Livello 1-Click (`<details>` Chiuso di Default)**: racchiudere **Matrice Dialettica** (aperta da `| **Skill Attive** |`) e log **Negoziazione (`Gamma <-> Alpha/Beta`)** in `<details><summary><strong>Matrice Dialettica Skizzo (Alpha Tecnico vs Beta Dominio & Arbitrato)</strong></summary>` con **riga vuota obbligatoria** dopo `</summary>`.

---

## 3. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Simulo Alpha, Beta o Gamma senza `invoke_subagent`."* | Con `SKIZZO = ON`, Fase 1 richiede `invoke_subagent` a 2 worker paralleli e `--mediator` richiede `Subagent Gamma` in Fase 2. |
| *"Il plugin `skizzo` è installato, applico il flusso senza `/skizzo`."* | Vale la *Clausola di Dormienza Predefinita*: resta `OFF` finché l'utente non attiva `/skizzo`. |
| *"Ometto banner `[!IMPORTANT]`, link `conversation://` o `(Skill: ...)`."* | Ogni output con `SKIZZO = ON` apre al rigo 1 con banner `[!IMPORTANT]`, link `conversation://<id>` e `(Skill: \`...\`)` di `Alpha` e `Beta`. |
| *"Verifico solo i test tecnici trascurando il dominio (o viceversa)."* | La consegna richiede il superamento congiunto del **Doppio Oracolo** (`Oracolo Alpha` + `Oracolo Beta`). |

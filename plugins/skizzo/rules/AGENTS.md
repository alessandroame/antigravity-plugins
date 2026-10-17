# Protocollo Dialettico Dual-Track & Mediatore: Tecnico vs Dominio (`/skizzo`)

Governa l'esecuzione a doppio binario parallelo (**Systems & Technical Purity** vs **Domain & User Experience Advocate**) con **Mediatore Interattivo** opzionale (**Dialectical Mediator**), eliminando i compromessi al ribasso del ragionamento monolitico.

---

## 1. Clausola di Dormienza Predefinita, Toggle e Flag (`/skizzo`)

1. **Inattivo di Default (`OFF`)**:
   - A inizio conversazione lo stato è **`OFF` (Dormiente)** (`SKIZZO = OFF`, `MEDIATOR = OFF`). Finché è `OFF`, non modifica il flusso standard né avvia subagent.
2. **Toggle di Sessione (`/skizzo`, `on`/`off`) e Mediatore (`--mediator` / `-m`)**:
   - `/skizzo` inverte lo stato (`OFF -> ON` o `ON -> OFF`); `/skizzo on` e `/skizzo off` lo forzano.
   - `/skizzo --mediator` (o `-m`) attiva `SKIZZO = ON` e `MEDIATOR = ON`; `/skizzo --no-mediator` disattiva il solo Mediatore lasciando attivo il Dual-Track.
   - Con `SKIZZO = ON`, resta attivo per tutti i task fino a `/skizzo off`. Se `/skizzo [--mediator] <task>` è invocato in un messaggio, attiva lo stato ed esegue subito le 4 fasi.
3. **Titolo Conversazione (`[SKIZZO]` / `[SKIZZO+MED]`)**:
   - A stato `ON`, anteporre `[SKIZZO] ` (o `[SKIZZO+MED] ` con `--mediator`) via `set-chat-title.mjs`; a stato `OFF`, rimuoverlo.

---

## 2. Ciclo Operativo a 4 Fasi (Obbligatorio quando `SKIZZO = ON`)

### Fase 1 — Biforcazione Cieca Parallela (`invoke_subagent` a 2 Worker Isolati)
L'Orchestratore lancia **sempre 2 subagent indipendenti in parallelo** in una **singola chiamata `invoke_subagent`** (cecità reciproca):
1. **Subagent Alpha (`Systems & Technical Purity Architect`, `<id-alpha>`)**:
   - **Focus**: core headless (`core/` o `src/core/` zero DOM/`window`/`localStorage`), complessità $O(\cdot)$, immutabilità, resilienza a race condition/input corrotti e **Oracolo di Test Tecnico** (unit test su invarianti, confini ed error paths).
2. **Subagent Beta (`Domain & User Experience Advocate`, `<id-beta>`)**:
   - **Focus**: valore di dominio per l'utente finale, riduzione radicale di click e carico cognitivo (Tesler, Postel, Fitts, Hick, zero gergo interno) e **Oracolo di Test di Dominio** (scenari end-to-end e criteri di accettazione).
- **Replica Peer-to-Peer (`send_message`)**: nei prompt di `Alpha` e `Beta` imporre di rispondere a `Subagent Gamma` con `send_message(Recipient: "<id-gamma>", Message: "...")` usando il `sender` del messaggio (non il `parent`).

### Fase 2 — Cross-Critique Avversariale o Mediatore Interattivo (`--mediator`)
1. **Modalità Standard (`MEDIATOR = OFF`)**: l'Orchestratore esegue la Cross-Critique incrociata (`Alpha -> Beta` su rischi architetturali/stato-UI; `Beta -> Alpha` su over-engineering YAGNI e frizioni d'uso).
2. **Modalità Mediatore Interattivo (`MEDIATOR = ON`, `/skizzo --mediator`)**:
   - L'Orchestratore invoca via `invoke_subagent` **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `TypeName: "research"`, `<id-gamma>`)** con requisito, report e `conversationId` (`<id-alpha>`, `<id-beta>`).
   - **Negoziazione Interattiva (`send_message`, Max 1 Round)**: sui disaccordi, `Subagent Gamma` interroga `<id-alpha>` e `<id-beta>` via `send_message` (**Circuit Breaker di max 1 round**), cede il turno per il wakeup reattivo delle risposte peer e invia il **Lodo Arbitrale** al `parent`.
   - `Subagent Gamma` restituisce la **Tabella di Risoluzione dei Disaccordi (`Alpha` vs `Beta` -> Verdetto `Gamma`)** e la specifica esecutiva unificata per la Fase 3.

### Fase 3 — Sintesi, Arbitrato di Tesler & Doppio Oracolo (`--proto` Opzionale)
1. **Regola di Arbitrato di Tesler**:
   - **Subagent Dominio (`Beta`) governa il contratto esterno**: API pubblica, ergonomia UI, tolleranza input (Postel) e flusso utente.
   - **Subagent Tecnico (`Alpha`) governa l'architettura interna**: core headless, adattatori iniettabili e algoritmi che assorbono la complessità del contratto di `Beta`.
2. **Codice Unificato (Default) vs Prototipi Isolati (`--proto`)**:
   - **Default**: convergenza in **un'unica implementazione** che supera **Oracolo Tecnico (`Alpha`)** e **Oracolo di Dominio (`Beta`)**.
   - **Prototipazione (`/skizzo --proto`)**: via `worktree-lifecycle`, **2 prototipi completi** in Git Worktrees isolati (`../<repo>-skizzo-alpha` su `skizzo/alpha-tech` e `../<repo>-skizzo-beta` su `skizzo/beta-domain`).

### Fase 4 — Visibilità Esplicita Modalità Skizzo & Restituzione (`~600px`)
1. **Banner `[!IMPORTANT]` Obbligatorio al Rigo 1**: ogni risposta con `SKIZZO = ON` si apre al **rigo 1** con:
   `> [!IMPORTANT]`
   `> **MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | +MEDIATORE | +PROTO)** — Subagent: [Subagent Alpha (Tecnico)](conversation://<id-alpha>) · [Subagent Beta (Dominio)](conversation://<id-beta>) · [Subagent Gamma (Mediatore)](conversation://<id-gamma>)`
   *(omettendo `Gamma` se `MEDIATOR = OFF`, o mostrando lo stato sessione al puro toggle)*.
2. **Livello 0-Click (Max 12–15 righe)**: sintesi (3–5 bullet di 1 riga, incluso **Disaccordo Risolto da Gamma** con `--mediator`) ed esito del **Doppio Oracolo** (`Oracolo Alpha: PASS` | `Oracolo Beta: PASS`).
3. **Livello 1-Click (`<details>` Chiuso di Default)**: racchiudere **Matrice Dialettica (`Alpha` vs `Beta` vs `Verdetto`)** e log **Negoziazione (`Gamma <-> Alpha/Beta`)** in `<details><summary><strong>Matrice Dialettica Skizzo (Alpha Tecnico vs Beta Dominio & Arbitrato)</strong></summary>` con **riga vuota obbligatoria** dopo `</summary>`.

---

## 3. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Simulo Alpha, Beta o Gamma senza `invoke_subagent`."* | Con `SKIZZO = ON`, Fase 1 richiede `invoke_subagent` a 2 worker paralleli e `--mediator` richiede `Subagent Gamma` in Fase 2. |
| *"Il plugin `skizzo` è installato, applico il flusso senza `/skizzo`."* | Vale la *Clausola di Dormienza Predefinita*: resta `OFF` finché l'utente non attiva `/skizzo`. |
| *"Ometto il banner `[!IMPORTANT] MODALITÀ SKIZZO ATTIVA` o i link `conversation://`."* | Con `SKIZZO = ON`, ogni output si apre al rigo 1 con il banner `[!IMPORTANT]` e i link `conversation://<id>` ai subagent. |
| *"Verifico solo i test tecnici trascurando il dominio (o viceversa)."* | La consegna richiede il superamento congiunto del **Doppio Oracolo** (`Oracolo Alpha` + `Oracolo Beta`). |

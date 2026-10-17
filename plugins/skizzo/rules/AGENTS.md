# Protocollo Dialettico Dual-Track & Mediatore: Tecnico vs Dominio (`/skizzo`)

Governa l'esecuzione a doppio binario parallelo (**Systems & Technical Purity** vs **Domain & User Experience Advocate**) con **Auto-Routing Skill**, **Mediatore Interattivo** opzionale e restituzione **Human-First** priva di gergo interno.

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

### Fase 1 — Biforcazione Cieca Parallela, Auto-Routing Skill & Silenzio Intermedio
L'Orchestratore seleziona **1–2 skill verticali** per binario (**vietato assegnare meta-skill** come `skizzo` o `ab-bench`; fallback `core-standard`, zero domande all'utente) e lancia **2 subagent in parallelo** in una **singola chiamata `invoke_subagent`**:
1. **Subagent Alpha (`Systems & Technical Purity Architect`, `<id-alpha>`)**:
   - **Focus & Skill Tecniche**: core headless (`core/` zero DOM/storage), complessità `O(1)`/`O(n)`, immutabilità, input corrotti e **Oracolo Tecnico** (es. `shift-left-governance`, `trace-debugging`, `circuit-breaker`).
2. **Subagent Beta (`Domain & User Experience Advocate`, `<id-beta>`)**:
   - **Focus & Skill Dominio/UX**: valore pratico, riduzione di click e fatica cognitiva e **Oracolo di Dominio** (es. `laws-of-ux-audit`, `ux-form-optimization`, `ux-button-and-touch-ergonomics`).
- **Dichiarazione Skill alla Partenza (Rigo 1 Subagent)**: `Alpha` e `Beta` aprono il report con **Skill Attive (Alpha/Beta)**: seguito dagli ID `kebab-case` (zero backtick escapati o asterischi nei backtick).
- **Barriera di Silenzio su Wakeup Parziale**: quando il primo subagent termina mentre l'altro è `running`, è **vietato stampare messaggi intermedi in chat**. Controllare con `manage_subagents` e terminare il turno con **0 byte di testo** finché entrambi non hanno risposto.
- **Replica Peer-to-Peer (`send_message`)**: se interrogati da `Gamma`, `Alpha` e `Beta` rispondono a `Recipient: "<id-gamma>"` (`sender`, non `parent`).

### Fase 2 — Cross-Critique o Mediatore Interattivo (`--mediator`)
1. **Modalità Standard (`MEDIATOR = OFF`)**: Cross-Critique diretta dell'Orchestratore (`Alpha -> Beta` su tenuta tecnica; `Beta -> Alpha` su semplicità d'uso).
2. **Modalità Mediatore (`MEDIATOR = ON`, `/skizzo --mediator`)**:
   - L'Orchestratore invoca **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `TypeName: "research"`, `<id-gamma>`)** con requisito, report e ID `<id-alpha>`, `<id-beta>`.
   - **Negoziazione (`send_message`, Max 1 Round)**: sui disaccordi, `Gamma` interroga `<id-alpha>` e `<id-beta>` (**max 1 round**), cede il turno in silenzio e invia il **Lodo Arbitrale** al `parent`.

### Fase 3 — Sintesi & Doppio Oracolo (`--proto` Opzionale)
1. **Arbitrato Tecnico/Utente**: l'esperienza esterna segue la semplicità di `Beta`; il motore headless di `Alpha` assorbe la complessità tecnica.
2. **Verifica Congiunta**: convergenza in un'unica implementazione (o 2 Git Worktrees con `/skizzo --proto`) che supera tutti i controlli di `Alpha` e `Beta`.

### Fase 4 — Restituzione "Human-First" (Zero Gergo Fuori da `<details>`)
1. **Banner `[!IMPORTANT]` al Rigo 1**: ogni risposta apre al **rigo 1** con link `conversation://` e le 1–2 skill verticali di `Alpha` e `Beta` (senza ripetere `skizzo`):
   `> [!IMPORTANT]`
   `> MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | +MEDIATORE | +PROTO) — Subagent: [Agente Tecnico (Alpha)](conversation://<id-alpha>) (Skill: <skills-alpha>) · [Agente Utente (Beta)](conversation://<id-beta>) (Skill: <skills-beta>) · [Mediatore (Gamma)](conversation://<id-gamma>)`
2. **Corpo Visibile Parla all'Umano (Vietato il Gergo Interno)**:
   - **Bando Gergo & LaTeX**: fuori da `<details>` è **vietato** usare sigle interne (`Contratto Esterno`, `Motore Interno`, `Tesler`, `Postel`, `0-Click`, `1-Click`, `Oracolo Alpha/Beta`, `YAGNI`), contabilità di file (`npm run sync`, `MEMORY.md`, byte/righe) o formule LaTeX.
   - **I 4 Punti Umani Obbligatori**: dopo 1 frase sul risultato, esporre sempre in italiano quotidiano:
     - **Cosa cambia per te**: cosa fa ora il sistema in pratica.
     - **Comodità difesa dall'Agente Utente (Beta)**: quale fatica o passaggio manuale è stato risparmiato.
     - **Problema evitato dall'Agente Tecnico (Alpha)**: quale errore o blocco è stato sventato dietro le quinte.
     - **Su cosa non erano d'accordo (e perché vince questa soluzione)**: il conflitto pratico risolto — **Controlli**: `Tutti i test superati (X/X OK)`.
3. **Dettagli Tecnici in `<details>` (Chiuso di Default)**: racchiudere **Matrice Dialettica**, oracoli tecnici e file modificati in `<details>` con **riga vuota obbligatoria** dopo `</summary>`.

---

## 3. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Stampo 'Ricevuto Alpha, attendo Beta' mentre Beta gira."* | Vietati messaggi intermedi su wakeup parziale: attendere in silenzio finché entrambi non hanno concluso. |
| *"Scrivo a 0-Click 'Contratto Esterno' o 'Oracolo Alpha PASS'."* | Fuori da `<details>` usare solo italiano quotidiano coi 4 punti umani (`Cosa cambia per te`, `Comodità Beta`, `Problema Alpha`, `Disaccordo risolto`). |
| *"Metto `skizzo` in `(Skill: ...)` o uso LaTeX/backtick escapati."* | Escludere `skizzo` dalle skill dei subagent; zero LaTeX inline e zero backtick annidati. |
| *"Simulo Alpha, Beta o Gamma senza `invoke_subagent`."* | Con `SKIZZO = ON`, Fase 1 richiede `invoke_subagent` a 2 worker paralleli e `--mediator` richiede `Subagent Gamma`. |

# Protocollo Dialettico Dual-Track & Mediatore: Tecnico vs Dominio (`/skizzo`)

Governa l'esecuzione parallela a doppio binario (**Systems & Technical Purity** vs **Domain & User Experience Advocate**) con **Auto-Routing Skill**, **Mediatore Interattivo** opzionale e restituzione **Human-First** priva di gergo interno.

---

## 1. Dormienza Iniziale, Persistenza Sticky in Sessione e Stop (`/skizzo`)

1. **Inattivo a Inizio Nuova Chat (`OFF`)**:
   - All'apertura di una nuova chat è **`OFF` (Dormiente)** (`SKIZZO = OFF`, `MEDIATOR = OFF`): non altera il flusso né avvia subagent.
2. **Persistenza Sticky per Tutta la Sessione (`ON` finché non fermato)**:
   - Attivato con `/skizzo`, `/skizzo on`, `/skizzo --mediator`/`-m` o col primo task `/skizzo <task>`, `SKIZZO = ON` (e `MEDIATOR = ON` con `--mediator`) **resta attivo per tutti i messaggi successivi della sessione** fino a fine chat o comando di stop.
   - **Verifica a Inizio Turno**: ad ogni nuovo messaggio (anche **senza** `/skizzo`), se nello storico della sessione è stato attivato `/skizzo` o compare `MODALITÀ SKIZZO ATTIVA` senza stop successivo, **eseguire sempre le 4 fasi**.
3. **Comandi di Stop (`/skizzo stop`, `/skizzo off`, `stop skizzo`)**:
   - Torna a `OFF` solo su stop esplicito: `/skizzo stop`, `/skizzo off`, `/skizzo` (a vuoto quando `ON`) o frase naturale (`stop skizzo`, `ferma skizzo`, `disattiva skizzo`, `esci da skizzo`). Se include un task (*"stop skizzo, fai X"*), disattivare subito, rimuovere `[SKIZZO]` dal titolo ed eseguire *X* nel flusso standard (`--no-mediator` spegne solo `Gamma`).
4. **Titolo Chat (`[SKIZZO]` / `[SKIZZO+MED]`)**:
   - A `ON`, anteporre `[SKIZZO] ` (o `[SKIZZO+MED] `) via `set-chat-title.mjs --conversation-id "<Conversation ID>" --title "..."`; allo stop, rimuoverlo.

---

## 2. Ciclo Operativo a 4 Fasi (Obbligatorio quando `SKIZZO = ON`)

### Fase 1 — Biforcazione Cieca Parallela, Auto-Routing Skill & Silenzio Intermedio
Selezionare **1–2 skill verticali** per binario (**vietate meta-skill** come `skizzo` o `ab-bench`; fallback `core-standard`, zero domande) e lanciare **2 subagent paralleli** in **una chiamata `invoke_subagent`**:
1. **Subagent Alpha (`Systems & Technical Purity Architect`, `<id-alpha>`)**: core headless (`core/` zero DOM/storage), complessità `O(1)`/`O(n)`, immutabilità e **Oracolo Tecnico** (`shift-left-governance`, `trace-debugging`, `circuit-breaker`).
2. **Subagent Beta (`Domain & User Experience Advocate`, `<id-beta>`)**: valore pratico, meno click/fatica e **Oracolo di Dominio** (`laws-of-ux-audit`, `ux-form-optimization`, `ux-button-and-touch-ergonomics`).
- **Dichiarazione Skill (Rigo 1 Subagent)**: `Alpha` e `Beta` aprono con **Skill Attive (Alpha/Beta)**: seguito dagli ID `kebab-case` (zero backtick escapati o asterischi nei backtick).
- **Barriera di Silenzio su Wakeup Parziale**: se un subagent termina mentre l'altro è `running`, **vietato stampare messaggi intermedi**. Controllare con `manage_subagents` e cedere il turno con **0 byte** finché entrambi non hanno risposto.
- **Replica Peer-to-Peer (`send_message`)**: se interrogati da `Gamma`, rispondere a `Recipient: "<id-gamma>"` (`sender`, non `parent`).

### Fase 2 — Cross-Critique o Mediatore Interattivo (`--mediator`)
1. **Standard (`MEDIATOR = OFF`)**: Cross-Critique dell'Orchestratore (`Alpha -> Beta` su tenuta tecnica; `Beta -> Alpha` su semplicità).
2. **Mediatore (`MEDIATOR = ON`, `/skizzo --mediator`)**: invocare **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `TypeName: "research"`, `<id-gamma>`)** con requisito, report e ID `<id-alpha>`, `<id-beta>`. Sui disaccordi, `Gamma` interroga `<id-alpha>` e `<id-beta>` via `send_message` (**max 1 round**), cede il turno in silenzio e invia il **Lodo Arbitrale** al `parent`.

### Fase 3 — Sintesi & Doppio Oracolo (`--proto` Opzionale)
L'esperienza esterna segue la semplicità di `Beta`; il motore headless di `Alpha` assorbe la complessità tecnica, convergendo in un'implementazione (o 2 Git Worktrees con `--proto`) che supera tutti i controlli di `Alpha` e `Beta`.

### Fase 4 — Restituzione "Human-First" (Zero Gergo Fuori da `<details>`)
1. **Banner `[!IMPORTANT]` al Rigo 1**: aprire al **rigo 1** con link `conversation://` e skill verticali (senza `skizzo`):
   `> [!IMPORTANT]`
   `> MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | +MEDIATORE | +PROTO) — Subagent: [Agente Tecnico (Alpha)](conversation://<id-alpha>) (Skill: <skills-alpha>) · [Agente Utente (Beta)](conversation://<id-beta>) (Skill: <skills-beta>) · [Mediatore (Gamma)](conversation://<id-gamma>)`
2. **Corpo Visibile Parla all'Umano (Vietato il Gergo Interno)**:
   - **Bando Gergo & LaTeX**: fuori da `<details>` è **vietato** usare sigle interne (`Contratto Esterno`, `Motore Interno`, `Tesler`, `Postel`, `0-Click`, `1-Click`, `Oracolo Alpha/Beta`, `YAGNI`), contabilità file (`npm run sync`, `MEMORY.md`, byte/righe) o LaTeX.
   - **I 4 Punti Umani Obbligatori**: dopo 1 frase sul risultato, esporre in italiano semplice:
     - **Cosa cambia per te**: cosa fa ora il sistema in pratica.
     - **Comodità difesa dall'Agente Utente (Beta)**: quale fatica o passaggio manuale è risparmiato.
     - **Problema evitato dall'Agente Tecnico (Alpha)**: quale errore o blocco è sventato dietro le quinte.
     - **Su cosa non erano d'accordo (e perché vince questa soluzione)**: il conflitto risolto — **Controlli**: `Tutti i test superati (X/X OK)`.
3. **Dettagli in `<details>` (Chiuso di Default)**: racchiudere **Matrice Dialettica**, oracoli e file in `<details>` con **riga vuota** dopo `</summary>`.

---

## 3. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Nel nuovo messaggio non c'è `/skizzo`, rispondo normale."* | `SKIZZO = ON` resta attivo per tutta la sessione fino a `/skizzo stop`, `/skizzo off` o `stop skizzo`. |
| *"Stampo 'Ricevuto Alpha, attendo Beta' mentre Beta gira."* | Vietati messaggi intermedi: attendere in silenzio (`0 byte`) finché entrambi non concludono. |
| *"Scrivo a 0-Click 'Contratto Esterno' o 'Oracolo Alpha'."* | Fuori da `<details>` usare solo italiano semplice coi 4 punti umani. |
| *"Metto `skizzo` in `(Skill: ...)` o uso LaTeX/backtick rotti."* | Escludere `skizzo` dalle skill; zero LaTeX inline e zero backtick annidati. |
| *"Simulo Alpha, Beta o Gamma senza `invoke_subagent`."* | Con `SKIZZO = ON`, lanciare sempre 2 worker paralleli via `invoke_subagent`. |

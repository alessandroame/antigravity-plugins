# Antigravity Plugin: Skizzo — Dual-Track Technical vs Domain Dialectics (`v1.4.0`)

Plugin di **Adversarial & Collaborative Dual-Track Engineering** per Google Antigravity. Mette in competizione e collaborazione parallela due subagent isolati con mandati complementari — **Agente Tecnico (`Subagent Alpha — Systems & Technical Purity`)** e **Agente Utente (`Subagent Beta — Domain & User Experience Advocate`)** — con auto-routing delle skill specialistiche, **persistenza automatica per l'intera sessione fino al comando di stop**, **Mediatore Interattivo** opzionale (`Subagent Gamma` tramite `/skizzo --mediator`) e restituzione finale **Human-First** in italiano semplice e priva di gergo da prompt engineer.

---

## Obiettivo del Plugin (Goal)

Quando un singolo agente sviluppa una funzionalità, tende inevitabilmente a un compromesso implicito fin dalle prime righe di ragionamento:
1. **Deriva Tecnocentrica**: un'architettura internamente elegante ma che espone complessità, configurazioni manuali o gergo implementativo all'utente finale.
2. **Deriva Superficiale (UI-First)**: un flusso utente apparentemente comodo ma costruito su accoppiamenti stato-DOM, validazioni fragili e assenza di isolamento headless.

Il plugin `skizzo` risolve questo limite strutturale tramite una **scissione controllata a 4 fasi** attivabile on-demand:
- **Dormiente a Inizio Nuova Chat (`OFF`)**: non consuma risorse e non altera il comportamento dell'agente finché non viene attivato.
- **Persistenza Sticky per Tutta la Sessione (`/skizzo`)**: una volta attivato (`ON`, sia da solo con `/skizzo` sia insieme al primo compito con `/skizzo <task>`), resta **bloccato e attivo automaticamente su tutti i messaggi successivi della conversazione** (senza dover riscrivere `/skizzo` a ogni turno) fino alla chiusura della chat o a un comando di stop (`/skizzo stop`, `/skizzo off`, `stop skizzo`, `ferma skizzo`).
- **Biforcazione Cieca Parallela, Auto-Routing Skill & Silenzio Intermedio (`invoke_subagent`)**: seleziona automaticamente 1–2 skill verticali per ciascun binario (escludendo meta-skill come `skizzo`), delega in parallelo a `Alpha` e `Beta` e attende in silenzio che entrambi abbiano concluso prima di scrivere in chat.
- **Mediatore Interattivo Opzionale (`/skizzo --mediator` o `-m`)**: avvia nella Fase 2 un terzo subagent isolato (`Subagent Gamma`) che analizza i conflitti, contro-interroga `Alpha` e `Beta` tramite `send_message` (max 1 round) e pronuncia il verdetto arbitrale.
- **Restituzione Human-First (Zero Gergo Fuori da `<details>`)**: si apre con il banner `> [!IMPORTANT] MODALITÀ SKIZZO ATTIVA` con link `conversation://` e skill attivate, seguito da **4 punti in italiano quotidiano** (*Cosa cambia per te*, *Comodità difesa dall'Agente Utente*, *Problema evitato dall'Agente Tecnico*, *Su cosa non erano d'accordo e chi ha vinto*), confinando la tabella tecnica nel cassetto `<details>`.

---

## Componenti del Plugin

| Componente | Tipo | Percorso | Funzione |
| :--- | :--- | :--- | :--- |
| **Protocollo Dual-Track, Persistenza Sticky & Human-First** | Regola attiva | [`rules/AGENTS.md`](./rules/AGENTS.md) | Definisce la persistenza sticky di sessione (controllo storico a inizio turno), i comandi di stop (`/skizzo stop`, `stop skizzo`, `/skizzo off`), l'auto-routing delle skill foglia, la barriera di silenzio e il formato Human-First a 4 punti. |
| **`skizzo`** | Skill on-demand (`/skizzo`) | [`skills/skizzo/SKILL.md`](./skills/skizzo/SKILL.md) | Runbook autosufficiente con persistenza multi-turno, auto-routing delle skill, prompt per `Alpha`, `Beta` e `Gamma` e template di consegna Human-First. |
| **Template Dialettico** | Reference ausiliario | [`skills/skizzo/references/dialectic-template.md`](./skills/skizzo/references/dialectic-template.md) | Modelli per il banner `[!IMPORTANT]`, i 4 punti umani visibili, la matrice `<details>` e la modalità `/skizzo --proto`. |

---

## Architettura del Ciclo a 4 Fasi (`/skizzo` & `/skizzo --mediator`)

```mermaid
flowchart TD
    CMD["Comando /skizzo [--mediator] [--proto]"] --> TOGGLE{"Stato Sessione"}
    TOGGLE -- "Attivazione" --> ON["Stato SKIZZO = ON (Sticky in Sessione)<br/>Titolo: [SKIZZO] o [SKIZZO+MED]"]
    TOGGLE -- "/skizzo stop | off | stop skizzo" --> OFF["Stato SKIZZO = OFF<br/>Ripristino titolo e flusso standard"]
    ON --> TASK["Tutti i Messaggi Successivi della Sessione<br/>(anche senza riscrivere /skizzo)"]
    TASK --> F1["Fase 1: Auto-Routing 1-2 Skill Foglia +<br/>invoke_subagent Parallelo"]
    F1 --> ALPHA["Agente Tecnico (Alpha)<br/>Solidità, Core Puro & Test"]
    F1 --> BETA["Agente Utente (Beta)<br/>Comodità, Meno Click & Chiarezza"]
    ALPHA --> WAIT["Barriera di Silenzio:<br/>Attende entrambi prima di scrivere"]
    BETA --> WAIT
    WAIT --> MED{"Flag --mediator<br/>Attivo?"}
    MED -- "No (Default)" --> F2A["Fase 2: Confronto Diretto<br/>dell'Orchestratore"]
    MED -- "Sì (--mediator)" --> GAMMA["Fase 2: invoke_subagent<br/>Mediatore (Gamma)"]
    GAMMA <-->|"send_message (Max 1 Round)"| ALPHA
    GAMMA <-->|"send_message (Max 1 Round)"| BETA
    F2A --> F3["Fase 3: Sintesi + Doppio Controllo"]
    GAMMA --> F3
    F3 --> F4["Fase 4: Banner [!IMPORTANT] +<br/>4 Punti Umani Chiari + Dettagli in details"]
```

### Le 5 Regole Cardine del Protocollo

1. **Persistenza Sticky Multi-Turno & Stop Naturale**:
   Una volta attivato `/skizzo` (anche direttamente col primo compito `/skizzo <task>`), la modalità resta attiva per tutti i messaggi successivi della stessa chat finché non viene chiusa la conversazione o inviato un comando di stop (`/skizzo stop`, `/skizzo off`, `stop skizzo`, `ferma skizzo`).
2. **Cecità Reciproca & Auto-Routing Skill Foglia in Fase 1**:
   L'Orchestratore assegna automaticamente 1–2 skill verticali a `Subagent Alpha` (tecniche) e `Subagent Beta` (dominio/UX), escludendo meta-skill come `skizzo`, e attende in silenzio che entrambi terminino prima di emettere testo in chat.
3. **Mediazione Interattiva in Fase 2 (`/skizzo --mediator`)**:
   Quando `--mediator` è attivo, `Subagent Gamma` contro-interroga `Alpha` e `Beta` tramite `send_message` (max 1 round) sui punti di disaccordo ed emette un verdetto motivato.
4. **Semplicità Fuori, Solidità Dentro in Fase 3 (Doppio Controllo)**:
   Ogni comodità richiesta dall'`Agente Utente (Beta)` viene mantenuta all'esterno e sostenuta dietro le quinte dal codice robusto progettato dall'`Agente Tecnico (Alpha)`, verificando i test di entrambi.
5. **Comunicazione Human-First in Fase 4**:
   Fuori dal menu `<details>` è bandito il gergo da prompt engineer: l'utente legge subito **Cosa cambia per te**, **Comodità difesa dall'Agente Utente**, **Problema evitato dall'Agente Tecnico** e **Su cosa non erano d'accordo**.

---

## Comandi e Prompt di Esempio

- `/skizzo` — Attiva la modalità a doppio agente (`[SKIZZO]`) in modo persistente per tutti i messaggi successivi della sessione (o la disattiva se invocato a vuoto quando è già attiva).
- `/skizzo stop` / `/skizzo off` / `stop skizzo` / `ferma skizzo` — Ferma la modalità persistente e ripristina il flusso normale della chat.
- `/skizzo --mediator` (o `/skizzo -m`) — Attiva la modalità persistente con il terzo agente Mediatore interattivo (`Subagent Gamma`, titolo `[SKIZZO+MED]`).
- `/skizzo --no-mediator` — Disattiva il solo Mediatore mantenendo attiva la modalità a 2 agenti.
- `/skizzo --mediator progetta e implementa il filtro di ricerca multi-criterio` — Lancia `Alpha` e `Beta` in parallelo, fa risolvere i disaccordi da `Gamma`, implementa la soluzione unificata e mantiene `SKIZZO+MED` attivo per i turni successivi.
- `/skizzo --proto rifattorizza il motore di calcolo tariffe` — Genera 2 prototipi completi in Git Worktrees isolati (`skizzo/alpha-tech` e `skizzo/beta-domain`) per il confronto empirico.

---

## Modalità di Installazione

Per sincronizzare e abilitare il plugin nella configurazione globale di Antigravity (`~/.gemini/config/plugins/`):

```bash
npm run sync
```

Dopo la prima sincronizzazione, ricaricare la finestra dell'IDE (`Ctrl+Shift+P` -> `Developer: Reload Window`) per rendere disponibile il comando slash `/skizzo` nell'autocompletamento della chat.

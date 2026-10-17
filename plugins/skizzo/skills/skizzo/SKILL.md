---
name: skizzo
description: >-
  Attiva o disattiva la modalità dual-track competitiva e collaborativa
  (Subagent Tecnico vs Subagent Dominio/Utente) con mediatore opzionale.
  Utilizza questa skill quando l'utente invoca /skizzo o richiede analisi dialettica parallela.
---

# Skizzo: Runbook di Orchestrazione Dual-Track & Mediatore (`/skizzo`)

## 1. Obiettivo, Ruoli e Semantica del Toggle di Sessione

Mette in competizione e collaborazione parallela due prospettive indipendenti per ogni task della sessione attiva, restituendo all'utente una sintesi **Human-First** chiara e priva di gergo interno:
- **Subagent Alpha (`Systems & Technical Purity Architect`)**: tecnicismo, purezza architetturale headless, prestazioni `O(1)`/`O(n)` e invarianti formali.
- **Subagent Beta (`Domain & User Experience Advocate`)**: valore pratico per l'utente finale, semplicità d'uso ed eliminazione di passaggi manuali inutili.
- **Subagent Gamma (`Dialectical Mediator & Conflict Resolver`, attivo con `--mediator` / `-m`)**: arbitro imparziale che interroga interattivamente `Alpha` e `Beta` via `send_message` (max 1 round) sui punti di disaccordo ed emette il lodo arbitrale vincolante.

> **Nota di Autosufficienza Telemetrica**: questo runbook contiene tutti i template operativi necessari. Non eseguire `view_file` secondari su `references/dialectic-template.md` durante il flusso standard per evitare doppi conteggi in `collector.mjs`.

---

## 2. Step 0: Persistenza Sticky di Sessione, Comandi di Stop, Flag `--mediator` e Titolo Chat

Quando l'utente invoca `/skizzo` (da solo, con `on`/`off`/`stop`, `--mediator`/`-m`, `--no-mediator`, `--proto` o seguito da un task) **oppure invia un qualsiasi messaggio successivo in una sessione in cui `/skizzo` è già stato attivato**:

1. **Persistenza Sticky per Tutta la Sessione (`SKIZZO` e `MEDIATOR`)**:
   - **Attivazione Permanente in Sessione**: `/skizzo` (quando `OFF`), `/skizzo on` o `/skizzo <task>` imposta `SKIZZO = ON`; `/skizzo --mediator` (o `-m`) imposta `SKIZZO = ON` e `MEDIATOR = ON`.
   - **Blocco Multi-Turno (`Sticky Session Latch`)**: una volta attivato (anche direttamente insieme al primo compito `/skizzo <task>`), lo stato `SKIZZO = ON` (e `MEDIATOR = ON` se era attivo `--mediator`) **resta bloccato e persistente per tutti i messaggi successivi dell'intera conversazione** fino alla chiusura della sessione o a un comando esplicito di stop — **anche quando nei turni successivi l'utente scrive normali richieste senza ripetere `/skizzo`**.
   - **Verifica a Inizio di Ogni Turno**: prima di rispondere a qualsiasi messaggio, se in un turno precedente della stessa conversazione è stato attivato `/skizzo` o compare il banner `MODALITÀ SKIZZO ATTIVA` senza un successivo comando di stop, **esegui obbligatoriamente lo Step 1 (Ciclo a 4 Fasi)**.
2. **Comandi di Stop e Disattivazione (`/skizzo stop`, `/skizzo off`, `stop skizzo`)**:
   - Torna a `SKIZZO = OFF` e `MEDIATOR = OFF` **esclusivamente** quando l'utente invia un comando di stop: `/skizzo stop`, `/skizzo off`, `/skizzo` (senza argomenti quando è già `ON`) o una richiesta naturale di stop in italiano/inglese (`stop skizzo`, `ferma skizzo`, `disattiva skizzo`, `esci da skizzo`, `chiudi skizzo`).
   - Se il messaggio di stop contiene anche una richiesta operativa (es. *"stop skizzo, ora sistema X"*), disattiva subito `SKIZZO = OFF`, rimuovi `[SKIZZO]` dal titolo ed esegui direttamente *"X"* in modalità standard (`--no-mediator` disattiva invece solo il Mediatore mantenendo `SKIZZO = ON`).
3. **Aggiornamento Visivo del Titolo Chat (`set-chat-title.mjs` con `--conversation-id` Obbligatorio)**:
   - Leggi `<Conversation ID>` dal blocco `<user_information>` della sessione corrente ed esegui:
     `node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --conversation-id "<Conversation ID>" --title "[SKIZZO] <Titolo>"`
   - **Divieto Esplicito**: è **vietato** invocare `set-chat-title.mjs` senza `--conversation-id "<Conversation ID>"`, per evitare race condition con sessioni concorrenti.
   - **Se `SKIZZO = ON` e `MEDIATOR = OFF`**: `--title "[SKIZZO] <Titolo o Tema>"`
   - **Se `SKIZZO = ON` e `MEDIATOR = ON`**: `--title "[SKIZZO+MED] <Titolo o Tema>"`
   - **Se `SKIZZO = OFF` (Stop)**: `--title "<Titolo senza prefisso [SKIZZO] o [SKIZZO+MED]>"`
4. **Risposta su Puro Toggle o Comando di Stop (Nessun Task Associato)**:
   - Se `SKIZZO = ON`, rispondi aprendo al **rigo 1** con il banner `> [!IMPORTANT]` (`MODALITÀ SKIZZO ATTIVA (DUAL-TRACK — Persistente in sessione fino a "/skizzo stop" o "stop skizzo")`), sintetizza in 2 righe in italiano semplice che resterà attiva da sola su tutti i messaggi successivi finché non deciderà di fermarla, e termina il turno.
   - Se il messaggio include un task (o se `SKIZZO = ON` era già attivo in sessione da un turno precedente), procedi allo **Step 1**.

---

## 3. Step 1: Biforcazione Cieca Parallela, Auto-Routing Skill & Silenzio Intermedio

Prima del lancio, l'Orchestratore seleziona automaticamente dal catalogo `<skills>` **1–2 skill verticali pertinenti** per ciascun subagent (**vietato assegnare meta-skill** come `skizzo` o `ab-bench`; fallback `core-standard` se nessuna skill verticale si applica):
- **Skill Tecniche (`<skills-alpha>`)**: es. `shift-left-governance`, `trace-debugging`, `circuit-breaker`, `worktree-lifecycle`, `skill-governance`.
- **Skill Dominio/UX (`<skills-beta>`)**: es. `laws-of-ux-audit`, `ux-form-optimization`, `ux-button-and-touch-ergonomics`, `ux-layout-and-visual-hierarchy`, `ux-outdoor-and-field-ergonomics`, o skill di dominio del progetto (es. `bigquery-sql`, `gemini-api-dev`).

Invoca **in un'unica chiamata `invoke_subagent`** due subagent paralleli indipendenti:
- **Modalità Standard (Design & Test -> Codice Unificato)**: `TypeName: "research"` per entrambi (`Role: "Systems & Technical Purity Architect"` per Alpha, `Role: "Domain & User Experience Advocate"` per Beta). Annota i due ID restituiti (`<id-alpha>` e `<id-beta>`).
- **Modalità Prototipazione (`/skizzo --proto`)**: secondo `worktree-lifecycle` (`git status --porcelain`), crea 2 Git Worktrees (`git worktree add ../<repo>-skizzo-alpha -b skizzo/alpha-tech` e `git worktree add ../<repo>-skizzo-beta -b skizzo/beta-domain`) e lancia 2 subagent con `TypeName: "self"` e `Workspace: "share"` ciascuno nel proprio worktree.
- **Barriera di Silenzio su Wakeup Parziale**: quando il primo subagent invia il proprio report mentre il secondo è ancora `running`, **non stampare alcun testo intermedio in chat** (vietato scrivere `Ricevuto il report di Alpha, attendo Beta`). Verifica lo stato con `manage_subagents(Action: 'list')` e termina il turno con **0 byte di testo** finché entrambi non hanno risposto.

### Prompt Template — Subagent Alpha (`Systems & Technical Purity Architect`)
```markdown
Agisci esclusivamente come **Subagent Alpha (Systems & Technical Purity Architect)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Skill Attive Assegnate**: [INSERIRE 1-2 SKILL TECNICHE FOGLIA, es. `shift-left-governance`, `trace-debugging` — MAI `skizzo`]

**Mandato Ingegneristico Esclusivo**:
1. **Dichiarazione Skill alla Partenza (Rigo 1 Obbligatorio)**: apri il tuo report iniziale al rigo 1 con **Skill Attive (Alpha)**: seguito dagli ID `kebab-case` (zero descrizioni prolisse; se necessario, leggi con `view_file` le `SKILL.md` assegnate).
2. Progetta l'architettura interna ottimizzando isolamento headless (`core/` zero DOM/storage), complessità `O(1)`/`O(n)`, determinismo, immutabilità e gestione rigorosa degli errori/race condition, senza compromessi accomodanti.
3. Definisci l'**Oracolo di Test Tecnico (Alpha)**: specifica (o implementa, se in worktree `--proto`) i test unitari puri che verificano invarianti matematici, confini di tipo, input malformati/vuoti e assenza di side-effect.
4. Restituisci nel report iniziale (al `parent` Orchestratore): Rigo 1 **Skill Attive (Alpha)**, (a) Architettura Headless & Contratti Interni, (b) Trappola tecnica principale evitata (spiegata anche in 1 frase comprensibile a un non-tecnico), (c) Specifica/Codice dell'Oracolo di Test Tecnico, (d) Punti non negoziabili.
5. **Regola di Replica Peer-to-Peer al Mediatore (`send_message`)**: se dopo il tuo report iniziale vieni risvegliato da un messaggio di contro-interrogazione del Mediatore (`Subagent Gamma`, identificato da `sender=<id-gamma>` nel `<SYSTEM_MESSAGE>`), rispondi invocando esplicitamente `send_message(Recipient: "<id-gamma>", Message: "...")` usando il `sender` del messaggio di `Gamma` (NON l'ID del `parent` Orchestratore), e termina subito il turno.
```

### Prompt Template — Subagent Beta (`Domain & User Experience Advocate`)
```markdown
Agisci esclusivamente come **Subagent Beta (Domain & User Experience Advocate)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Skill Attive Assegnate**: [INSERIRE 1-2 SKILL DOMINIO/UX FOGLIA, es. `laws-of-ux-audit`, `ux-form-optimization` — MAI `skizzo`]

**Mandato di Dominio & Utente Esclusivo**:
1. **Dichiarazione Skill alla Partenza (Rigo 1 Obbligatorio)**: apri il tuo report iniziale al rigo 1 con **Skill Attive (Beta)**: seguito dagli ID `kebab-case` (zero descrizioni prolisse; se necessario, leggi con `view_file` le `SKILL.md` assegnate).
2. Progetta la soluzione dal punto di vista esclusivo dell'utente finale: massimizza l'utilità immediata, sposta ogni calcolo sul software, accetta input permissivi ed elimina click, scelte inutili e gergo tecnico.
3. Definisci l'**Oracolo di Test di Dominio (Beta)**: specifica (o implementa, se in worktree `--proto`) i test di scenario/accettazione che provano che l'utente raggiunge il proprio obiettivo nel minor numero di passaggi e con feedback chiaro.
4. Restituisci nel report iniziale (al `parent` Orchestratore): Rigo 1 **Skill Attive (Beta)**, (a) Flusso Utente Ideale, (b) Comodità pratica difesa per l'utente (in 1 frase priva di gergo), (c) Specifica/Codice dell'Oracolo di Test di Dominio, (d) Frizioni tecniche da bandire.
5. **Regola di Replica Peer-to-Peer al Mediatore (`send_message`)**: se dopo il tuo report iniziale vieni risvegliato da un messaggio di contro-interrogazione del Mediatore (`Subagent Gamma`, identificato da `sender=<id-gamma>` nel `<SYSTEM_MESSAGE>`), rispondi invocando esplicitamente `send_message(Recipient: "<id-gamma>", Message: "...")` usando il `sender` del messaggio di `Gamma` (NON l'ID del `parent` Orchestratore), e termina subito il turno.
```

---

## 4. Step 2: Cross-Critique o Mediatore Interattivo (`Subagent Gamma`)

### Caso A — Modalità Standard (`MEDIATOR = OFF`)
L'Orchestratore confronta direttamente i report di `Alpha` e `Beta`:
1. **Vaglio `Alpha -> Beta`**: intercetta rischi di stato mutabile, accoppiamento DOM o casi limite scoperti nella proposta di `Beta`.
2. **Vaglio `Beta -> Alpha`**: intercetta astrazioni ridondanti, configurazioni manuali inutili o rigidità d'input nella proposta di `Alpha`.

### Caso B — Modalità Mediatore Interattivo (`MEDIATOR = ON`, `/skizzo --mediator`)
L'Orchestratore invoca via `invoke_subagent` un terzo subagent isolato (`TypeName: "research"`, `Role: "Dialectical Mediator & Conflict Resolver"`), annotandone l'ID `<id-gamma>`.

#### Prompt Template — Subagent Gamma (`Dialectical Mediator & Conflict Resolver`)
```markdown
Agisci come **Subagent Gamma (Dialectical Mediator & Conflict Resolver)** per risolvere i disaccordi tra due subagent:
- **Requisito Originale**: [INSERIRE TASK UTENTE]
- **Subagent Alpha (Tecnico)**: ID `<id-alpha>` — Report: [INSERIRE REPORT ALPHA]
- **Subagent Beta (Dominio/Utente)**: ID `<id-beta>` — Report: [INSERIRE REPORT BETA]

**Protocollo di Mediazione e Negoziazione Interattiva**:
1. Individua tutti i punti di disaccordo sostanziale tra `Alpha` e `Beta` (es. rigidità API vs tolleranza input, purezza core vs reattività UI, astrazioni vs semplicità).
2. **Negoziazione Interattiva (`send_message` — Max 1 Round + Turn Yield)**: se esistono conflitti aperti, invia tramite `send_message` a `<id-alpha>` e/o `<id-beta>` una domanda mirata di contro-interrogazione proponendo un punto di equilibrio (esperienza semplice all'esterno per Beta, complessità assorbita nel core headless per Alpha).
   - **Cessione del Turno per Reactive Wakeup**: subito dopo aver inviato le domande a `<id-alpha>` / `<id-beta>`, **interrompi le chiamate tool e termina il turno in silenzio** così da ricevere il wakeup reattivo con le loro risposte.
   - **Circuit Breaker Obbligatorio**: esegui **al massimo 1 round** di `send_message` verso `<id-alpha>` e `<id-beta>`.
3. Al ricevimento delle repliche (o subito se non vi erano conflitti), invia al **`parent` Orchestratore** tramite `send_message` il **Lodo Arbitrale Vincolante** contenente: (a) Sintesi del Round di Negoziazione, (b) Tabella di Risoluzione dei Disaccordi, (c) Specifica Esecutiva Unificata + Doppio Oracolo.
```

---

## 5. Step 3: Sintesi ed Esecuzione del Doppio Oracolo

1. **Unificazione**: preserva l'esperienza d'uso fluida e gli input permissivi chiesti da `Beta` incapsulando nel core puro headless di `Alpha` gli algoritmi, i parser e le guardie necessari.
2. **Verifica Empirica**: implementa il codice unificato (o i 2 worktree in modalità `--proto`) ed esegui i test verificando il passaggio al 100% dei controlli tecnici (`Alpha`) e di scenario utente (`Beta`).

---

## 6. Step 4: Formato Obbligatorio di Consegna "Human-First" (Zero Gergo a 0-Click + `<details>`)

Ogni risposta prodotta con `SKIZZO = ON` deve aprirsi al **rigo 1** con il banner `[!IMPORTANT]` seguito da una sintesi **in italiano quotidiano comprensibile a un non-tecnico** (fuori da `<details>` è **vietato** usare gergo interno come `Contratto Esterno`, `Motore Interno`, `Tesler/Postel`, `0-Click`, `1-Click`, `Oracolo Alpha/Beta`, `npm run sync`, `MEMORY.md` o formule LaTeX):

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK` | `+MEDIATORE` | `+PROTO`)** — Subagent: [`Agente Tecnico (Alpha)`](conversation://<id-alpha>) (Skill: `<skill-alpha-1>`, `<skill-alpha-2>`) · [`Agente Utente (Beta)`](conversation://<id-beta>) (Skill: `<skill-beta-1>`, `<skill-beta-2>`) · [`Mediatore (Gamma)`](conversation://<id-gamma>)

[Cosa è stato fatto: 1-2 frasi semplici in italiano quotidiano che spiegano il risultato concreto per l'utente, senza citare file interni o sigle teoriche.]

- **Cosa cambia per te**: [1 riga concreta su cosa puoi fare ora più facilmente o cosa vedi di nuovo rispetto a prima].
- **Comodità difesa dall'Agente Utente (Beta)**: [1 riga su quale fatica, scelta manuale o complicazione ti è stata risparmiata].
- **Problema evitato dall'Agente Tecnico (Alpha)**: [1 riga su quale errore nascosto, blocco o caso limite è stato prevenuto dietro le quinte].
- **Su cosa non erano d'accordo (e perché vince questa soluzione)**: [1 riga sul conflitto pratico tra Alpha e Beta e come è stato risolto] — **Controlli**: `Tutti i test superati (X/X OK)`.

<details>
<summary><strong>Dettagli Tecnici, Confronto tra gli Agenti e File Modificati</strong></summary>

| Punto Discusso | Proposta Tecnica (Alpha) | Proposta Lato Utente (Beta) | Scelta Finale (Perché è migliore) |
| :--- | :--- | :--- | :--- |
| **Skill Attive** | `<skill-alpha-1>`, `<skill-alpha-2>` | `<skill-beta-1>`, `<skill-beta-2>` | **Complementari**: [Sinergia tecnica + esperienza d'uso] |
| **Esperienza d'Uso** | [Proposta Alpha] | [Proposta Beta] | **Vince Beta**: [Motivazione pratica] |
| **Architettura Interna** | [Proposta Alpha] | [Proposta Beta] | **Vince Alpha**: [Motivazione tecnica] |
| **Casi Limite & Test** | [Guardie e test Alpha] | [Tolleranza e scenari Beta] | **Unificata**: [Copertura completa] |

- **Dietro le quinte (Cross-Critique / Negoziazione `Gamma <-> Alpha/Beta`)**: [Sintesi delle critiche incrociate o del round `send_message`].
- **Verifiche Tecniche & File Aggiornati**: `Oracolo Alpha: PASS` | `Oracolo Beta: PASS` — [Elenco file modificati, sync e metriche di validazione].

</details>
```

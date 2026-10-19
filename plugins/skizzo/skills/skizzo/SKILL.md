---
name: skizzo
description: >-
  Attiva la modalità dual-track competitiva e collaborativa (Subagent Tecnico vs
  Subagent Utente) con filtro automatico a priori (Fast-Pass vs Dual-Track) e mediatore.
  Utilizza questa skill quando l'utente invoca /skizzo o analisi dialettica.
---

# Skizzo: Runbook di Orchestrazione Dual-Track, Auto-Triage & Mediatore (`/skizzo`)

## 1. Obiettivo, Ruoli e Modalità `Auto-Smart` di Serie

Mette in competizione e collaborazione parallela due prospettive indipendenti quando una richiesta presenta reali scelte progettuali, mentre risponde **subito in modalità diretta (`FAST-PASS`, `0` subagent)** su comandi operativi, domande di lettura e micro-correzioni puntuali:
- **Subagent Alpha (`Systems & Technical Purity Architect`)**: purezza architetturale headless, complessità `O(1)`/`O(n)` e invarianti formali.
- **Subagent Beta (`Domain & User Experience Advocate`)**: valore pratico per l'utente finale, semplicità d'uso ed eliminazione di passaggi manuali inutili.
- **Subagent Gamma (`Dialectical Mediator & Conflict Resolver`, attivo con `--mediator` / `-m`)**: arbitro imparziale che interroga interattivamente `Alpha` e `Beta` via `send_message` (max 1 round) sui punti di disaccordo ed emette il lodo arbitrale vincolante.

> **Nota di Autosufficienza Telemetrica**: questo runbook contiene tutti i template operativi necessari. Non eseguire `view_file` secondari su `references/dialectic-template.md` durante il flusso standard per evitare doppi conteggi in `collector.mjs`.

---

## 2. Step 0: Persistenza Sticky, Override (`--force` / `--skip`), Stop e Titolo Chat

Quando l'utente invoca `/skizzo` (da solo, con `on`/`off`/`stop`, `--force`/`-f`, `--skip`/`--fast`, `--mediator`/`-m`, `--no-mediator`, `--proto` o seguito da un task) **oppure invia un qualsiasi messaggio successivo in una sessione in cui `/skizzo` è già stato attivato**:

1. **Persistenza Sticky per Tutta la Sessione (`SKIZZO` e `MEDIATOR`)**:
   - **Attivazione Permanente in Sessione**: `/skizzo` (quando `OFF`), `/skizzo on` o `/skizzo <task>` imposta `SKIZZO = ON`; `/skizzo --mediator` (o `-m`) imposta `SKIZZO = ON` e `MEDIATOR = ON`.
   - **Blocco Multi-Turno (`Sticky Session Latch`)**: una volta attivato, lo stato `SKIZZO = ON` **resta attivo per tutti i messaggi successivi dell'intera conversazione** (anche dopo un turno eseguito in `FAST-PASS` e anche senza ripetere `/skizzo`) fino alla chiusura della sessione o a un comando esplicito di stop.
2. **Override per Singolo Turno e Comandi di Stop**:
   - **Forza 2 Agenti (`--force` / `-f` / `"forza skizzo"` / `"usa skizzo"`)**: salta il filtro rapido e avvia obbligatoriamente i 2 subagent (`DUAL-TRACK`) anche su un task piccolo.
   - **Salta per 1 Turno (`--skip` / `--fast` / `"senza skizzo"` / `"risposta veloce"`)**: esegue il turno corrente in `FAST-PASS` (`0` subagent) mantenendo `SKIZZO = ON` per i turni successivi.
   - **Stop Completo (`/skizzo stop`, `/skizzo off`, `stop skizzo`, `ferma skizzo`)**: riporta `SKIZZO = OFF` e `MEDIATOR = OFF`, rimuovendo `[SKIZZO]` dal titolo.
3. **Aggiornamento Visivo del Titolo Chat (`set-chat-title.mjs` con `--conversation-id` Obbligatorio)**:
   - Leggi `<Conversation ID>` da `<user_information>` ed esegui:
     `node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --conversation-id "<Conversation ID>" --title "[SKIZZO] <Titolo>"` (o `[SKIZZO+MED]` con `--mediator`; rimuovi il prefisso allo stop).
4. **Risposta su Puro Toggle (Nessun Task Associato)**:
   - Se `SKIZZO = ON` senza task, apri al **rigo 1** con il banner `> [!IMPORTANT]` (`MODALITÀ SKIZZO ATTIVA (AUTO-SMART — Doppio agente sulle scelte di progetto, risposta rapida sulle modifiche dirette)`), spiega in 2 righe che resterà attiva fino a `/skizzo stop`, e termina il turno.

---

## 3. Step 0.5 (Gate 0): Filtro Automatico a Priori (`FAST-PASS` vs `DUAL-TRACK`, `< 5ms`)

Prima di avviare subagent (salvo `--force`), valuta in `< 5ms` il messaggio tramite le regole deterministiche di [`plugins/skizzo/scripts/triage.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/scripts/triage.mjs):

| Categoria del Messaggio | Scelta Automatica | Azione Operativa |
| :--- | :---: | :--- |
| **A. Operazioni Meccaniche, Git, Test, Memoria o Conferma Piano** (`/memory-sync`, `/take-note`, `git commit`, lancio test, *"fallo"*, *"procedi"*) | **`FAST-PASS` (`0` Subagent)** | Rispondi subito senza `invoke_subagent` (~90–120s risparmiati); mantieni `SKIZZO = ON`. |
| **B. Domande Informative o Sola Lettura** (*"spiega"*, *"dove si trova"*, *"mostrami"*, `/how-its-made`) | **`FAST-PASS` (`0` Subagent)** | Rispondi subito senza `invoke_subagent`; mantieni `SKIZZO = ON`. |
| **C. Micro-Correzioni Chirurgiche a Scelta Zero** (refuso, rename, cambio colore/costante/testo già deciso su 1 file) | **`FAST-PASS` (`0` Subagent)** | Applica subito la modifica senza `invoke_subagent`; mantieni `SKIZZO = ON`. |
| **D. Progettazione, Piani, Nuove Funzionalità, Input/UI o Refactoring (`>= 2` segnali di tensione)** | **`DUAL-TRACK` (`2` Subagent)** | Procedi allo **Step 1** lanciando `Alpha` e `Beta` in parallelo. |

### Template Obbligatorio quando scatta `FAST-PASS` (Rigo 1)
```markdown
> [!NOTE]
> **MODALITÀ SKIZZO ATTIVA (`FAST-PASS` — Risposta rapida per [comando operativo | domanda di lettura | modifica puntuale], ~90s risparmiati)** · Resta attiva per i prossimi messaggi · Usa `/skizzo --force` se vuoi comunque i 2 agenti.
```

---

## 4. Step 1: Biforcazione Cieca Parallela, Auto-Routing Skill & Silenzio Intermedio (`DUAL-TRACK`)

Seleziona dal catalogo `<skills>` **1–2 skill verticali pertinenti** per ciascun subagent (**vietato assegnare meta-skill** come `skizzo` o `ab-bench`; fallback `core-standard`) e invoca **in un'unica chiamata `invoke_subagent`** due subagent paralleli (`TypeName: "research"`, oppure `TypeName: "self"` in 2 Git Worktrees con `--proto`):
- **Barriera di Silenzio su Wakeup Parziale**: quando il primo subagent termina mentre il secondo è `running`, **non stampare alcun testo intermedio in chat**; verifica con `manage_subagents(Action: 'list')` e termina il turno con **0 byte** finché entrambi non hanno risposto.

### Prompt Template — Subagent Alpha (`Systems & Technical Purity Architect`)
```markdown
Agisci esclusivamente come **Subagent Alpha (Systems & Technical Purity Architect)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Skill Attive Assegnate**: [INSERIRE 1-2 SKILL TECNICHE FOGLIA, es. `shift-left-governance`, `trace-debugging` — MAI `skizzo`]

**Mandato Ingegneristico Esclusivo**:
1. **Dichiarazione Skill alla Partenza (Rigo 1 Obbligatorio)**: apri al rigo 1 con **Skill Attive (Alpha)**: seguito dagli ID `kebab-case`.
2. Progetta l'architettura interna ottimizzando isolamento headless (`core/` zero DOM/storage), complessità `O(1)`/`O(n)`, determinismo, immutabilità e gestione errori/race condition.
3. Definisci l'**Oracolo di Test Tecnico (Alpha)**: specifica i test unitari puri che verificano invarianti matematici, confini di tipo, input malformati/vuoti e assenza di side-effect.
4. Restituisci: Rigo 1 **Skill Attive (Alpha)**, (a) Architettura Headless & Contratti Interni, (b) Trappola tecnica principale evitata (anche in 1 frase per un non-tecnico), (c) Specifica/Codice dell'Oracolo di Test Tecnico, (d) Punti non negoziabili.
5. **Replica Peer-to-Peer al Mediatore (`send_message`)**: se risvegliato da `Subagent Gamma` (`sender=<id-gamma>`), rispondi con `send_message(Recipient: "<id-gamma>", Message: "...")` e termina il turno.
```

### Prompt Template — Subagent Beta (`Domain & User Experience Advocate`)
```markdown
Agisci esclusivamente come **Subagent Beta (Domain & User Experience Advocate)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Skill Attive Assegnate**: [INSERIRE 1-2 SKILL DOMINIO/UX FOGLIA, es. `laws-of-ux-audit`, `ux-form-optimization` — MAI `skizzo`]

**Mandato di Dominio & Utente Esclusivo**:
1. **Dichiarazione Skill alla Partenza (Rigo 1 Obbligatorio)**: apri al rigo 1 con **Skill Attive (Beta)**: seguito dagli ID `kebab-case`.
2. Progetta la soluzione dal punto di vista dell'utente finale: massimizza l'utilità immediata, sposta ogni calcolo sul software, accetta input permissivi ed elimina click, scelte inutili e gergo tecnico.
3. Definisci l'**Oracolo di Test di Dominio (Beta)**: specifica i test di scenario/accettazione che provano il minor numero di passaggi e feedback chiaro.
4. Restituisci: Rigo 1 **Skill Attive (Beta)**, (a) Flusso Utente Ideale, (b) Comodità pratica difesa per l'utente (in 1 frase priva di gergo), (c) Specifica/Codice dell'Oracolo di Test di Dominio, (d) Frizioni tecniche da bandire.
5. **Replica Peer-to-Peer al Mediatore (`send_message`)**: se risvegliato da `Subagent Gamma` (`sender=<id-gamma>`), rispondi con `send_message(Recipient: "<id-gamma>", Message: "...")` e termina il turno.
```

---

## 5. Step 2 & Step 3: Cross-Critique / Mediatore (`Gamma`) e Sintesi col Doppio Oracolo

1. **Modalità Standard (`MEDIATOR = OFF`)**: confronta i report (`Alpha -> Beta` su tenuta tecnica; `Beta -> Alpha` su semplicità).
2. **Modalità Mediatore (`MEDIATOR = ON`, `/skizzo --mediator`)**: invoca `Subagent Gamma` (`TypeName: "research"`, `Role: "Dialectical Mediator & Conflict Resolver"`, `<id-gamma>`) che contro-interroga `<id-alpha>` e `<id-beta>` via `send_message` (**max 1 round**), cede il turno in silenzio e invia il **Lodo Arbitrale** al `parent`.
3. **Sintesi & Doppio Oracolo**: unifica la semplicità esterna di `Beta` col core headless di `Alpha` verificando il passaggio al 100% dei test di entrambi.

---

## 6. Step 4: Formato Obbligatorio di Consegna "Human-First" (`DUAL-TRACK`)

Ogni risposta `DUAL-TRACK` si apre al **rigo 1** con il banner `[!IMPORTANT]` seguito da 4 punti **in italiano quotidiano comprensibile a un non-tecnico** (fuori da `<details>` è **vietato** usare gergo interno o LaTeX):

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK` | `+MEDIATORE` | `+PROTO`)** — Subagent: [`Agente Tecnico (Alpha)`](conversation://<id-alpha>) (Skill: `<skill-alpha-1>`, `<skill-alpha-2>`) · [`Agente Utente (Beta)`](conversation://<id-beta>) (Skill: `<skill-beta-1>`, `<skill-beta-2>`) · [`Mediatore (Gamma)`](conversation://<id-gamma>)

[1-2 frasi semplici in italiano quotidiano sul risultato concreto per l'utente.]

- **Cosa cambia per te**: [1 riga concreta su cosa puoi fare ora più facilmente].
- **Comodità difesa dall'Agente Utente (Beta)**: [1 riga su quale fatica o scelta manuale ti è stata risparmiata].
- **Problema evitato dall'Agente Tecnico (Alpha)**: [1 riga su quale errore nascosto o blocco è stato prevenuto].
- **Su cosa non erano d'accordo (e perché vince questa soluzione)**: [1 riga sul conflitto risolto] — **Controlli**: `Tutti i test superati (X/X OK)`.

<details>
<summary><strong>Dettagli Tecnici, Confronto tra gli Agenti e File Modificati</strong></summary>

| Punto Discusso | Proposta Tecnica (Alpha) | Proposta Lato Utente (Beta) | Scelta Finale (Perché è migliore) |
| :--- | :--- | :--- | :--- |
| **Skill Attive** | `<skill-alpha-1>`, `<skill-alpha-2>` | `<skill-beta-1>`, `<skill-beta-2>` | **Complementari**: [Sinergia] |
| **Esperienza d'Uso** | [Proposta Alpha] | [Proposta Beta] | **Vince Beta**: [Motivazione pratica] |
| **Architettura Interna** | [Proposta Alpha] | [Proposta Beta] | **Vince Alpha**: [Motivazione tecnica] |
| **Casi Limite & Test** | [Guardie Alpha] | [Scenari Beta] | **Unificata**: [Copertura completa] |

- **Dietro le quinte (Cross-Critique / Negoziazione `Gamma <-> Alpha/Beta`)**: [Sintesi].
- **Verifiche Tecniche & File Aggiornati**: `Oracolo Alpha: PASS` | `Oracolo Beta: PASS` — [File e metriche].

</details>
```

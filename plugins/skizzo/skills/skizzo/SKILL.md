---
name: skizzo
description: >-
  Attiva l'orchestrazione multi-dominio dinamica (da 2 a 4 subagent individuati e ordinati
  per importanza dall'LLM) con Auto-Skizzo Silente e Fast-Pass. Utilizza questa skill
  quando l'utente invoca /skizzo o emerge un bivio progettuale.
---

# Skizzo: Orchestrazione Multi-Dominio Dinamica, Ranking LLM & Mediatore (`/skizzo`)

## 1. Obiettivo, Rilevamento Domini via LLM (`2..4` Agenti) e Modalità `Auto-Skizzo Silente` (`AUTO`)

Mette in competizione e collaborazione parallela **da `2` a `4` subagent su misura** quando una richiesta presenta reali scelte multi-prospettiva (`score >= 4` in modalità implicita `AUTO`, `score >= 3` se attivato con `/skizzo`), mentre risponde **subito in modalità diretta (`FAST-PASS`, `0` subagent)** su comandi operativi, domande di lettura e micro-correzioni puntuali.

### Protocollo di Scoperta, Ordinamento per Importanza e Istanziazione dei Domini (via LLM)
Nessun ruolo è cablato a priori: quando il task supera il filtro `FAST-PASS`, l'agente padre usa il proprio ragionamento semantico per determinare **quanti** e **quali** agenti servono:
1. **Individuazione Aperta dei Domini**: analizza la richiesta e il contesto per estrarre tutte le discipline, le competenze specialistiche o i punti di vista degli stakeholder coinvolti (senza schemi rigidi e senza forzare un ruolo informatico se la decisione non riguarda codice).
2. **Ordinamento per Importanza e Taglio a `Max 4` (`rankAndCapDomains` — `2 <= N <= 4`)**:
   - Valuta ciascun dominio candidato secondo tre criteri:
     - **Impatto Primario (`importance`)**: quanto quel dominio è determinante per la riuscita del task;
     - **Tensione Dialettica (`tension`)**: quanto la sua prospettiva entra in sano conflitto con le altre (evitando cloni o ruoli ridondanti);
     - **Rischio di Omissione**: gravità degli errori se quel punto di vista venisse ignorato.
   - Ordina i domini per priorità decrescente e seleziona **solo i primi `N` (`2`, `3` o al massimo `4`: `Alpha`, `Beta`, `Delta`, `Epsilon`)**, accorpando o scartando i domini secondari oltre il 4° posto per non disperdere il contesto.
3. **Istanziazione su Misura**: per ciascuno dei `2..4` domini selezionati, definisce al volo **Titolo del Ruolo**, **Mandato Non Negoziabile**, **1–2 Skill verticali** dal catalogo `<skills>` e **Oracolo di Verifica**.
4. **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, attivo con `--mediator` / `-m`)**: arbitro imparziale che interroga i subagent attivi via `send_message` (max 1 round) ed emette il lodo arbitrale.

> **Nota di Autosufficienza Telemetrica**: questo runbook contiene tutti i template operativi necessari. Non eseguire `view_file` secondari su `references/dialectic-template.md` durante il flusso standard per evitare doppi conteggi in `collector.mjs`.

---

## 2. Step 0: Modalità `Auto-Skizzo Silente` (`AUTO`), Persistenza Sticky (`ON`), Override e Stop

1. **Modalità `Auto-Skizzo Silente` a Inizio Chat (`SKIZZO = AUTO`, Zero Banner sui Turni Normali)**:
   - Di default ogni chat parte in `SKIZZO = AUTO`. Al Turno 1 il **Gate 0** (`triage.mjs`) valuta la richiesta:
   - Se `FAST-PASS` implicito (`silentFastPass: true`): risponde direttamente con **`0` subagent e `0 byte` di banner** (nessun avviso `[!NOTE]`).
   - Se `score >= 4`: l'LLM individua i domini, li ordina per importanza (cap a `4`), avvia i `2..4` subagent in parallelo e aggiorna il titolo chat con `[SKIZZO] `.
2. **Persistenza Sticky Esplicita (`SKIZZO = ON`)**:
   - Quando l'utente invoca `/skizzo`, `/skizzo on`, `/skizzo --mediator` (o `-m`) o `/skizzo <task>`, lo stato passa a `SKIZZO = ON (Sticky)` per i messaggi successivi (soglia `score >= 3`, ricevuta `[!NOTE]` visibile sui `FAST-PASS`).
3. **Override per Singolo Turno, Numero di Agenti (`--tracks N`) e Stop**:
   - **Forza Skizzo o Numero Agenti (`--force` / `-f` / `--tracks 2|3|4` / `"forza skizzo"`)**: salta il filtro rapido e avvia obbligatoriamente i subagent per i `N` domini più importanti.
   - **Salta per 1 Turno (`--skip` / `--fast` / `"senza skizzo"` / `"vai veloce"`)**: esegue il turno corrente in `FAST-PASS` (`0` subagent).
   - **Stop Completo (`/skizzo stop`, `/skizzo off`, `stop skizzo`, `ferma skizzo`)**: imposta `SKIZZO = OFF` e rimuove `[SKIZZO]` dal titolo.
4. **Aggiornamento Visivo del Titolo Chat (`set-chat-title.mjs` con `--conversation-id` Obbligatorio)**:
   - Leggi `<Conversation ID>` da `<user_information>` ed esegui:
     `node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --conversation-id "<Conversation ID>" --title "[SKIZZO] <Titolo>"` (o `[SKIZZO+MED]` con `--mediator`).

---

## 3. Step 0.5 (Gate 0): Filtro a Priori (`FAST-PASS` vs `MULTI-TRACK`, `< 5ms`)

**Prima di leggere qualsiasi file del progetto (`0` chiamate `read_file` pre-triage)**, valuta al **Turno 1** in `< 5ms` il messaggio tramite [`plugins/skizzo/scripts/triage.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/scripts/triage.mjs):

| Categoria del Messaggio | Scelta Automatica | Azione Operativa |
| :--- | :---: | :--- |
| **A. Operazioni Meccaniche, Git, Test, Sync, Memoria o Conferma Piano** (`/memory-sync`, `/take-note`, `git`, `start server`, *"fallo"*, *"vai"*, *"procedi"*) | **`FAST-PASS` (`0` Subagent)** | Rispondi subito senza `invoke_subagent` (`0 byte` banner se `AUTO`, `[!NOTE]` se `ON`). |
| **B. Domande Informative o Clausola `"non agire / solo una domanda"`** (*"spiega"*, *"dove si trova"*, `/how-its-made`, *"non agire facciamo solo un piano"*) | **`FAST-PASS` (`0` Subagent)** | Rispondi subito senza `invoke_subagent` (`0 byte` banner se `AUTO`, `[!NOTE]` se `ON`). |
| **C. Micro-Correzioni Chirurgiche a Scelta Zero** (refuso, rename, cambio costante/colore già deciso su 1 file) | **`FAST-PASS` (`0` Subagent)** | Applica subito la modifica senza `invoke_subagent`. |
| **D. Decisioni e Progettazioni Multi-Dominio (`score >= 4` in `AUTO`, `>= 3` in `ON`)** | **`2..4` Subagent (`DUAL`/`TRI`/`QUAD-TRACK`)** | Rileva i domini via LLM, ordinali per importanza (`max 4`) e lancia i subagent allo **Step 1**. |

### Template quando scatta `FAST-PASS` in sessione Esplicita (`silentFastPass: false`)
*(Nota: se `silentFastPass: true` in modalità `AUTO` implicita, emettere `0 byte` di banner e rispondere normalmente).*
```markdown
> [!NOTE]
> **MODALITÀ SKIZZO ATTIVA (`FAST-PASS` — Risposta rapida per [comando operativo | domanda di lettura | modifica puntuale], ~90s risparmiati)** · Resta attiva per i prossimi messaggi · Usa `/skizzo --force` (o `--tracks 3`) per forzare gli agenti.
```

---

## 4. Step 1: Istanziazione Parallela dei `2..4` Domini Più Importanti & Silenzio Intermedio

Individuati e ordinati per importanza i `2..4` domini (`Alpha`, `Beta`, ed eventualmente `Delta`, `Epsilon`), assegna a ciascuno **1–2 skill verticali pertinenti** dal catalogo `<skills>` (**vietato assegnare meta-skill** come `skizzo` o `ab-bench`; fallback `core-standard`) e invoca **nello stesso turno** tutti i subagent in parallelo (`TypeName: "research"`, oppure `TypeName: "self"` in Git Worktrees con `--proto`):
- **Divieto di Polling (`0` `schedule` / `0` `manage_subagents`) e Silenzio su Wakeup Parziale**: appena invocati i subagent (e finché anche un solo subagent è ancora `running`), **non chiamare `schedule`, non chiamare `manage_subagents(Action: 'list')` e non stampare testo intermedio**; termina immediatamente il turno con **0 tool call e 0 byte**.

### Prompt Template Parametrico — Subagent `<trackId>` (`<Ruolo del Dominio #Rank>`)
```markdown
Agisci esclusivamente come **Subagent <trackId> (<Titolo del Ruolo di Dominio Istanziato> — Priorità #<Rank>)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Skill Attive Assegnate**: [INSERIRE 1-2 SKILL VERTICALI FOGLIA PERTINENTI AL DOMINIO — MAI `skizzo`]

**Mandato Esclusivo di Dominio (Budget Rigido: Max 4 Turni Tool)**:
1. **Dichiarazione Skill alla Partenza (Rigo 1 Obbligatorio)**: apri al rigo 1 con **Skill Attive (<trackId> - <Ruolo>)**: seguito dagli ID `kebab-case`.
2. **Budget di Ricerca Chirurgica (`<= 4` turni di tool)**: se il task tocca file del workspace, usa `grep_search` e letture mirate (`<= 150` righe per chiamata, zero scansioni integrali di file lunghi) per individuare in massimo 4 turni i punti esatti coinvolti (`#Lxx-Lyy`).
3. **Prospettiva Non Negoziabile**: valuta e progetta la soluzione difendendo rigorosamente i principi, i vincoli e gli interessi del tuo dominio specifico (`<Mandato su misura generato dall'LLM>`). Non annacquare la tua posizione per compiacere gli altri domini.
4. **Oracolo di Verifica (`<trackId>`)**: definisci il test, l'invariante o il criterio oggettivo che certifica il rispetto del tuo dominio.
5. **Formato Output**: restituisci (a) Proposta operativa (e file/righe `#Lxx-Lyy` se applicabile), (b) Beneficio concreto o rischio evitato dal tuo punto di vista (in 1 frase chiara senza gergo), (c) Specifica dell'Oracolo di Verifica, (d) Confini non negoziabili.
6. **Replica Peer-to-Peer al Mediatore (`send_message`)**: se risvegliato da `Subagent Gamma` (`sender=<id-gamma>`), rispondi con `send_message(Recipient: "<id-gamma>", Message: "...")` e termina il turno.
```

---

## 5. Step 2, Step 3 & Step 4: Cross-Critique / Mediatore (`Gamma`) e Consegna "Human-First"

1. **Cross-Critique / Mediatore**: confronta i report dei `2..4` subagent ordinati per importanza (o invoca `Subagent Gamma` con `--mediator` per contro-interrogarli via `send_message` in max 1 round) e sintetizza una soluzione che soddisfi **tutti gli oracoli attivi**.
2. **Formato Obbligatorio di Consegna "Human-First"**: apri al **rigo 1** con il banner `[!IMPORTANT]` elencando i domini istanziati in ordine di importanza, seguito dai punti chiave in italiano semplice (zero gergo o LaTeX fuori da `<details>`):

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK` | `TRI-TRACK` | `QUAD-TRACK` — `N` Domini per Importanza)** — Subagent: [`1° <Ruolo Alpha>`](conversation://<id-alpha>) (Skill: `<skills>`) · [`2° <Ruolo Beta>`](conversation://<id-beta>) (Skill: `<skills>`) [· `3° <Ruolo Delta>` · `4° <Ruolo Epsilon>`]

[1-2 frasi semplici in italiano quotidiano sul risultato concreto.]

- **Cosa cambia per te**: [1 riga concreta sul risultato pratico].
- **Contributo dei domini attivati (in ordine di importanza)**: [1 riga sintetica su cosa ha garantito ciascuno dei 2..4 ruoli istanziati].
- **Conflitto risolto tra i ruoli (e perché vince questa sintesi)**: [1 riga sul compromesso superato] — **Controlli**: `Tutti i test/oracoli superati (X/X OK)`.

<details>
<summary><strong>Dettagli Tecnici, Matrice Multi-Dominio Ordinata per Importanza e Verifiche</strong></summary>

| Punto Discusso | `1° <Ruolo Alpha>` | `2° <Ruolo Beta>` | [`3° <Ruolo Delta>` / `4° <Ruolo Epsilon>`] | Sintesi Finale |
| :--- | :--- | :--- | :--- | :--- |
| **Skill & Mandato** | `<skills-alpha>` | `<skills-beta>` | [`<skills-delta>`] | **Complementari**: [Sinergia] |
| **Proposta Chiave** | [Proposta Alpha] | [Proposta Beta] | [Proposta Delta] | **Scelta Unificata**: [Motivazione] |
| **Oracoli & Test** | [Oracolo Alpha] | [Oracolo Beta] | [Oracolo Delta] | **Verificati**: [Copertura completa] |

- **Domini considerati e criterio di priorità (`Max 4`)**: [Motivazione dell'ordinamento dei domini ed eventuali domini marginali accorpati/esclusi].
- **Dietro le quinte (Cross-Critique tra i `N` domini)**: [Sintesi dei punti di attrito risolti].
- **Verifiche & File Aggiornati**: [Stato oracoli e file toccati].

</details>
```

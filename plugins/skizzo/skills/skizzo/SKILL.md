---
name: skizzo
description: >-
  Attiva o disattiva la modalità dual-track competitiva e collaborativa
  (Subagent Tecnico vs Subagent Dominio/Utente) con mediatore opzionale.
  Utilizza questa skill quando l'utente invoca /skizzo o richiede analisi dialettica parallela.
---

# Skizzo: Runbook di Orchestrazione Dual-Track & Mediatore (`/skizzo`)

## 1. Obiettivo, Ruoli e Semantica del Toggle di Sessione

Mette in competizione e collaborazione parallela prospettive pure e indipendenti per ogni task della sessione attiva:
- **Subagent Alpha (`Systems & Technical Purity Architect`)**: tecnicismo, purezza architetturale headless, prestazioni $O(\cdot)$ e invarianti formali.
- **Subagent Beta (`Domain & User Experience Advocate`)**: valore percepito dall'utente finale, Legge di Tesler/Postel ed eliminazione dell'attrito operativo.
- **Subagent Gamma (`Dialectical Mediator & Conflict Resolver`, attivo con `--mediator` / `-m`)**: arbitro imparziale che interroga interattivamente `Alpha` e `Beta` via `send_message` (max 1 round) sui punti di disaccordo ed emette il lodo arbitrale vincolante.

> **Nota di Autosufficienza Telemetrica**: questo runbook contiene tutti i template operativi necessari. Non eseguire `view_file` secondari su `references/dialectic-template.md` durante il flusso standard per evitare doppi conteggi in `collector.mjs`.

---

## 2. Step 0: Gestione del Toggle (`ON`/`OFF`), Flag `--mediator` e Titolo Chat

Quando l'utente invoca `/skizzo` (da solo, con `on`/`off`, `--mediator`/`-m`, `--no-mediator`, `--proto` o seguito da un task):

1. **Determinazione Stato Sessione (`SKIZZO` e `MEDIATOR`)**:
   - `/skizzo` (senza argomenti): inverte `SKIZZO` (`OFF -> ON` o `ON -> OFF`).
   - `/skizzo off`: imposta `SKIZZO = OFF` e `MEDIATOR = OFF`.
   - `/skizzo on` o `/skizzo <task>`: imposta `SKIZZO = ON`.
   - `/skizzo --mediator` (o `-m`): imposta `SKIZZO = ON` e `MEDIATOR = ON`; `/skizzo --no-mediator` imposta `MEDIATOR = OFF`.
2. **Aggiornamento Visivo del Titolo Chat (`set-chat-title.mjs`)**:
   - **Se `SKIZZO = ON` e `MEDIATOR = OFF`**: `--title "[SKIZZO] <Titolo o Tema>"`
   - **Se `SKIZZO = ON` e `MEDIATOR = ON`**: `--title "[SKIZZO+MED] <Titolo o Tema>"`
   - **Se `SKIZZO = OFF`**: `--title "<Titolo senza prefisso [SKIZZO] o [SKIZZO+MED]>"`
3. **Risposta su Puro Toggle (Nessun Task Associato)**:
   - Se `SKIZZO = ON`, rispondi aprendo al **rigo 1** con il banner `> [!IMPORTANT]` (`**MODALITÀ SKIZZO ATTIVA (DUAL-TRACK)**` oppure `**MODALITÀ SKIZZO ATTIVA (DUAL-TRACK + MEDIATORE)**`), sintetizza in 2 righe il comportamento per i task successivi e termina il turno.
   - Se il messaggio include un task (o se `SKIZZO = ON` era già attivo in sessione), procedi allo **Step 1**.

---

## 3. Step 1: Biforcazione Cieca Parallela (`invoke_subagent` a 2 Worker)

Invoca **in un'unica chiamata `invoke_subagent`** due subagent paralleli indipendenti:
- **Modalità Standard (Design & Test -> Codice Unificato)**: `TypeName: "research"` per entrambi (`Role: "Systems & Technical Purity Architect"` per Alpha, `Role: "Domain & User Experience Advocate"` per Beta). Annota i due ID restituiti (`<id-alpha>` e `<id-beta>`).
- **Modalità Prototipazione (`/skizzo --proto`)**: secondo `worktree-lifecycle` (`git status --porcelain`), crea 2 Git Worktrees (`git worktree add ../<repo>-skizzo-alpha -b skizzo/alpha-tech` e `git worktree add ../<repo>-skizzo-beta -b skizzo/beta-domain`) e lancia 2 subagent con `TypeName: "self"` e `Workspace: "share"` ciascuno nel proprio worktree.

### Prompt Template — Subagent Alpha (`Systems & Technical Purity Architect`)
```markdown
Agisci esclusivamente come **Subagent Alpha (Systems & Technical Purity Architect)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Mandato Ingegneristico Esclusivo**:
1. Progetta l'architettura interna ottimizzando isolamento headless (`core/` zero DOM/storage), complessità $O(\cdot)$, determinismo, immutabilità e gestione rigorosa degli errori/race condition.
2. Non scendere a compromessi accomodanti: segnala ogni debito tecnico, accoppiamento improprio o rischio di regressione.
3. Definisci l'**Oracolo di Test Tecnico (Alpha)**: specifica (o implementa, se in worktree `--proto`) i test unitari puri che verificano invarianti matematici, confini di tipo, input malformati/vuoti e assenza di side-effect.
4. Restituisci nel report iniziale (al `parent` Orchestratore via `send_message`): (a) Architettura Headless & Contratti Interni, (b) Analisi Complessità & Rischi, (c) Specifica/Codice dell'Oracolo di Test Tecnico, (d) Punti non negoziabili verso il livello UI/Dominio.
5. **Regola di Replica Peer-to-Peer al Mediatore (`send_message`)**: se dopo il tuo report iniziale vieni risvegliato da un messaggio di contro-interrogazione del Mediatore (`Subagent Gamma`, identificato da `sender=<id-gamma>` nel `<SYSTEM_MESSAGE>`), rispondi invocando esplicitamente `send_message(Recipient: "<id-gamma>", Message: "...")` usando il `sender` del messaggio di `Gamma` (NON l'ID del `parent` Orchestratore), e termina subito il turno.
```

### Prompt Template — Subagent Beta (`Domain & User Experience Advocate`)
```markdown
Agisci esclusivamente come **Subagent Beta (Domain & User Experience Advocate)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Mandato di Dominio & Utente Esclusivo**:
1. Progetta la soluzione dal punto di vista esclusivo dell'utente finale del dominio: massimizza l'utilità immediata e riduci al minimo click, campi manuali e carico cognitivo.
2. Applica la Legge di Tesler (sposta ogni calcolo/normalizzazione possibile sul software), la Legge di Postel (accetta input permissivi) e l'ergonomia dei controlli (Fitts, Hick, chiarezza semantica senza gergo tecnico).
3. Definisci l'**Oracolo di Test di Dominio (Beta)**: specifica (o implementa, se in worktree `--proto`) i test di scenario/accettazione che provano che l'utente raggiunge il proprio obiettivo nel minor numero di passaggi e con feedback chiaro.
4. Restituisci nel report iniziale (al `parent` Orchestratore via `send_message`): (a) Flusso Utente & Contratto Esterno Ideale, (b) Complessità Assorbita dal Sistema (Tesler/Postel), (c) Specifica/Codice dell'Oracolo di Test di Dominio, (d) Frizioni tecniche o over-engineering da bandire.
5. **Regola di Replica Peer-to-Peer al Mediatore (`send_message`)**: se dopo il tuo report iniziale vieni risvegliato da un messaggio di contro-interrogazione del Mediatore (`Subagent Gamma`, identificato da `sender=<id-gamma>` nel `<SYSTEM_MESSAGE>`), rispondi invocando esplicitamente `send_message(Recipient: "<id-gamma>", Message: "...")` usando il `sender` del messaggio di `Gamma` (NON l'ID del `parent` Orchestratore), e termina subito il turno.
```

---

## 4. Step 2: Cross-Critique o Mediatore Interattivo (`Subagent Gamma`)

### Caso A — Modalità Standard (`MEDIATOR = OFF`)
L'Orchestratore confronta direttamente i report di `Alpha` e `Beta`:
1. **Vaglio `Alpha -> Beta`**: intercetta rischi di stato mutabile, accoppiamento DOM o casi limite scoperti nella proposta di `Beta`.
2. **Vaglio `Beta -> Alpha`**: intercetta astrazioni ridondanti (YAGNI), configurazioni manuali inutili o rigidità d'input nella proposta di `Alpha`.

### Caso B — Modalità Mediatore Interattivo (`MEDIATOR = ON`, `/skizzo --mediator`)
L'Orchestratore invoca via `invoke_subagent` un terzo subagent isolato (`TypeName: "research"`, `Role: "Dialectical Mediator & Conflict Resolver"`), annotandone l'ID `<id-gamma>`.
> **Nota sul Wakeup Asincrono**: mentre `Subagent Gamma` attende le risposte peer-to-peer da `Alpha`/`Beta`, `Gamma` cede temporaneamente il turno (`idle`) prima di inviare il Lodo Arbitrale finale all'Orchestratore. L'Orchestratore attende il messaggio di `Gamma` contenente il Lodo Arbitrale.

#### Prompt Template — Subagent Gamma (`Dialectical Mediator & Conflict Resolver`)
```markdown
Agisci come **Subagent Gamma (Dialectical Mediator & Conflict Resolver)** per risolvere i disaccordi tra due subagent:
- **Requisito Originale**: [INSERIRE TASK UTENTE]
- **Subagent Alpha (Tecnico)**: ID `<id-alpha>` — Report: [INSERIRE REPORT ALPHA]
- **Subagent Beta (Dominio/Utente)**: ID `<id-beta>` — Report: [INSERIRE REPORT BETA]

**Protocollo di Mediazione e Negoziazione Interattiva**:
1. Individua tutti i punti di disaccordo sostanziale tra `Alpha` e `Beta` (es. rigidità API vs tolleranza input, purezza core vs reattività UI, astrazioni vs semplicità).
2. **Negoziazione Interattiva (`send_message` — Max 1 Round + Turn Yield)**: se esistono conflitti aperti, invia tramite `send_message` a `<id-alpha>` e/o `<id-beta>` una domanda mirata di contro-interrogazione proponendo un punto di equilibrio secondo la Legge di Tesler (contratto esterno a Beta, complessità assorbita nel core headless di Alpha).
   - **Cessione del Turno per Reactive Wakeup**: poiché `send_message` è asincrono, subito dopo aver inviato le domande a `<id-alpha>` / `<id-beta>` **interrompi le chiamate tool e termina il turno** (senza ancora inviare il report al `parent` Orchestratore) così da ricevere il wakeup reattivo con le loro risposte.
   - **Circuit Breaker Obbligatorio**: esegui **al massimo 1 round** di `send_message` verso `<id-alpha>` e `<id-beta>`. Non avviare un secondo round di botta e risposta.
3. Nel turno successivo (al ricevimento delle repliche da `<id-alpha>` / `<id-beta>`, o subito al turno 1 se non vi erano conflitti), invia al **`parent` Orchestratore** tramite `send_message` il **Lodo Arbitrale Vincolante** contenente:
   - (a) **Sintesi del Round di Negoziazione (`Gamma <-> Alpha/Beta`)**: cosa è stato chiesto e quali concessioni hanno fatto `Alpha` e `Beta`.
   - (b) **Tabella di Risoluzione dei Disaccordi**: `Dimensione | Tesi Alpha | Tesi Beta | Verdetto Vincolante Gamma`.
   - (c) **Specifica Esecutiva Unificata + Doppio Oracolo**: architettura finale e lista completa dei test tecnici (`Alpha`) e di dominio (`Beta`) da superare.
```

---

## 5. Step 3: Sintesi (Arbitrato di Tesler) ed Esecuzione del Doppio Oracolo

1. **Applicazione dell'Arbitrato di Tesler (o del Lodo di `Subagent Gamma`)**:
   - **Contratto Esterno di `Beta`**: preserva l'esperienza d'uso fluida, gli input permissivi (Postel) e l'assenza di attrito.
   - **Motore Headless di `Alpha`**: incapsula nel core puro (zero dipendenze DOM/storage) gli algoritmi, i parser e le guardie per sostenere quel contratto.
2. **Implementazione e Verifica Empirica**:
   - Implementa il codice unificato (o i 2 worktree in modalità `--proto`) ed esegui la test suite verificando il passaggio al 100% di **Oracolo Alpha (Tecnico)** e **Oracolo Beta (Dominio)**.

---

## 6. Step 4: Formato Obbligatorio di Consegna (`Banner [!IMPORTANT]` + `0-Click` + `<details>`)

Ogni risposta prodotta con `SKIZZO = ON` deve aprirsi obbligatoriamente al **rigo 1** con il banner `[!IMPORTANT]` che espone la modalità attiva e i link cliccabili `conversation://` a tutti i subagent lanciati:

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK` | `+MEDIATORE` | `+PROTO`)** — Subagent: [`Subagent Alpha (Tecnico)`](conversation://<id-alpha>) · [`Subagent Beta (Dominio)`](conversation://<id-beta>) · [`Subagent Gamma (Mediatore)`](conversation://<id-gamma>)

[Sintesi esecutiva 1-2 frasi sull'implementazione convergente]

- **Contratto Esterno (Dominio Beta)**: [1 riga su flusso utente e complessità assorbita].
- **Motore Interno (Tecnico Alpha)**: [1 riga su architettura headless, complessità $O(\cdot)$ e guardie].
- **Disaccordo Risolto dal Mediatore (Gamma)**: [1 riga sul conflitto chiave mediato tra Alpha e Beta — *includere quando `--mediator` è attivo*].
- **Doppio Oracolo di Verifica**: `Oracolo Alpha (Tecnico): PASS` | `Oracolo Beta (Dominio): PASS`.

<details>
<summary><strong>Matrice Dialettica Skizzo (Alpha Tecnico vs Beta Dominio & Arbitrato)</strong></summary>

| Dimensione | Subagent Alpha (Tecnico) | Subagent Beta (Dominio/Utente) | Verdetto Arbitrale (Orchestratore / Gamma) |
| :--- | :--- | :--- | :--- |
| **Contratto & Flusso** | [Proposta Alpha] | [Proposta Beta] | **Vince Beta**: [Motivazione] |
| **Architettura Interna** | [Proposta Alpha] | [Proposta Beta] | **Vince Alpha**: [Motivazione] |
| **Casi Limite & Input** | [Guardie Alpha] | [Tolleranza Postel Beta] | **Convergenza**: [Soluzione] |
| **Oracolo di Test** | [Test Invarianti Alpha] | [Test Scenario Beta] | **Doppio Oracolo**: [File e righe] |

- **Cross-Critique / Negoziazione `Gamma <-> Alpha/Beta`**: [Sintesi delle critiche incrociate o del round di negoziazione `send_message` condotto dal Mediatore Gamma]

</details>
```

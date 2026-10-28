---
name: how-its-made
description: Ricostruisce e verifica il flusso di una funzionalità (Ingresso -> Processo -> Uscita) con selettori <details> del codice sorgente. Use this skill when the user runs /how-its-made or asks how a feature works at the code level.
---

# How It's Made: Runbook di Verifica Flusso e Ispezione Codice

## 1. Obiettivo e Pre-requisiti

Ricostruire in modo deterministico il funzionamento di una funzionalità software, fornendo allo sviluppatore una mappa strutturata **Punto di Ingresso -> Guardie -> Processo -> Punto di Uscita**, il tracciamento del payload, lo stato dei test e i selettori espandibili `<details>` con il codice sorgente reale.

- **Tool richiesti**: strumenti di ricerca e lettura file (`grep_search`, `find_by_name`, `view_file`).
- **Vincolo primario**: zero congetture. Ogni simbolo, percorso e intervallo di righe (`#Lstart-Lend`) deve essere verificato leggendo il file sorgente prima di produrre la risposta.

---

## 2. Flusso Operativo a 5 Passaggi

```text
[Richiesta /how-its-made <funzionalità/simbolo>]
               │
               ▼
[Step 1: Call-Chain Discovery] ──► Individuazione Entry Point, hop intermedi, Exit Point e Test
               │
               ▼
[Step 2: Diagramma & Tabella]  ──► Generazione schema Mermaid IPO + Tabella Ingresso/Processo/Uscita
               │
               ▼
[Step 3: Guardie & Payload]    ──► Mappatura Early Returns e trasformazione della struttura dati
               │
               ▼
[Step 4: Selettori <details>]  ──► Estrazione chirurgica del codice coinvolto per ogni step
               │
               ▼
[Step 5: Stato di Verifica]    ──► Collegamento ai test esistenti e segnalazione rami scoperti
```

---

## 3. Procedura Esecutiva passo-passo

### Step 1: Rilevamento Statico della Catena di Esecuzione (Call-Chain Discovery)
1. Se l'utente indica una funzionalità, un comando UI o una funzione:
   - Usa `grep_search` o `find_by_name` per localizzare il **Punto di Ingresso** (es. event listener, route handler, controller, entry function).
2. Usa `view_file` per seguire le chiamate dal punto di ingresso fino al **Punto di Uscita** (valore di ritorno, persistenza DB/storage, mutazione store o render UI).
3. Annota per ciascun passaggio:
   - Percorso assoluto del file e range esatto di righe (`L<inizio>-L<fine>`).
   - Natura dello step: `[PURE]` (calcolo puro), `[STATE]` (mutazione stato in memoria) o `[I/O]` (rete, disco, DB, DOM, storage).
   - Eventuali **clausole di guardia** (early returns, validazioni bloccanti, `throw`).
4. Cerca nella directory dei test (`tests/`, `test/`, `__tests__/`, `*.test.*`, `*.spec.*`) i test che invocano i simboli coinvolti.

### Step 2: Generazione del Selettore Visuale Interattivo (`<agent-embed>`) e Tabella IPO
1. Inizia la risposta direttamente con la sintesi tecnica (zero preamboli).
2. **Creazione del Widget HTML con Selettore di Modalità (`Albero Testuale` | `Grafico a Blocchi`)**:
   - Prendi come base [`references/flow-widget-template.html`](./references/flow-widget-template.html) e salva con `write_to_file` (`UserFacing: true`) il file `<artifact_dir>/flow-inspector-<slug>.html`.
   - Compila la **Vista 1 (`Albero Testuale`)** con l'albero monospace a spina verticale (max 65 caratteri/riga, bivi marcati con `◇ BIVIO N:` e rami `├── [NO] ──►` / `└── [SÌ] ──►`).
   - Compila la **Vista 2 (`Grafico a Blocchi`)** con i blocchi verticali per Ingresso, Bivi a 2 colonne (`Ramo [NO]` vs `Ramo [SÌ]`), Step di Processo (`[PURE]`, `[STATE]`, `[I/O]`) e Uscita.
   - Incorpora il widget nella risposta in chat (seguendo i vincoli di layout e theming della skill nativa `generative_ui`) tramite:
     `<agent-embed src="file:///<artifact_dir>/flow-inspector-<slug>.html"></agent-embed>`
3. Compila sotto il widget la tabella riassuntiva **Punto di Ingresso -> Processo -> Punto di Uscita** con link cliccabili `file://` ad ogni funzione.

### Step 3: Guardie (Early Returns) e Tracciamento del Payload
1. **Guardie e Uscite Anticipate**: elenca le condizioni che interrompono il flusso prima del completamento (condizione, linea di codice, effetto/valore restituito).
2. **Evoluzione del Payload**: mostra in un blocco compatto o tabella come cambia la forma dei dati da `Input Grezzo` -> `Stato Intermedio Normalizzato` -> `Output Emesso`.

### Step 4: Selettori a Espansione del Codice Coinvolto (`<details>`)
1. Per ciascun nodo della catena (Ingresso, Step di Processo, Uscita), genera un blocco espandibile `<details>` seguendo il template in [`references/inspection-template.md`](./references/inspection-template.md).
2. **Regola critica di rendering Markdown**:
   - Inserisci **sempre una riga vuota** subito dopo `</summary>` e prima di `</details>`. Senza la riga vuota, il blocco ` ``` ` non viene interpretato come codice.
3. Limita ciascuno snippet alle **10–35 righe** effettivamente rilevanti per quello step, indicando sopra il blocco il link cliccabile `[file.ext:L10-L32](file:///...)`.

### Step 5: Stato di Verifica e Copertura Test
1. Elenca i test automatizzati trovati con link `file://` ai singoli blocchi `describe` / `it`.
2. Evidenzia esplicitamente eventuali **lacune di verifica** (es. guardie non testate, rami di errore I/O privi di mock test).

---

## 4. Riferimenti Ausiliari e Controllo Qualità (Expected Output)

- **Template Widget HTML Selettore Modalità (`<agent-embed>`)**: consulta [`references/flow-widget-template.html`](./references/flow-widget-template.html).
- **Template strutturato di output Markdown**: consulta [`references/inspection-template.md`](./references/inspection-template.md).
- **Esempio completo di ispezione**: consulta [`examples/sample-inspection.md`](./examples/sample-inspection.md).
- **Checklist di Verifica Finale**:
  - [ ] Il widget `<agent-embed>` espone il selettore funzionante `Albero Testuale` | `Grafico a Blocchi`.
  - [ ] Tutti i link usano lo schema `file:///` con barre `/` e numeri di riga verificati (`#Lstart-Lend`).
  - [ ] Ogni step del processo dichiara il tag `[PURE]`, `[STATE]` o `[I/O]`.
  - [ ] Ogni blocco `<details>` contiene una riga vuota dopo `</summary>` e mostra solo l'estratto di codice pertinente.

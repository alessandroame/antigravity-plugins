# Protocollo di Ispezione del Codice e Verifica del Flusso Esecutivo

Questo documento definisce gli standard per la ricostruzione, la spiegazione e la verifica a livello di codice delle funzionalità software, ottimizzando il recupero del modello mentale da parte dello sviluppatore.

---

## 1. Architettura a Divulgazione Progressiva (Modello IPO Esteso)

Quando lo sviluppatore richiede di verificare, ricordare o comprendere il funzionamento di una funzionalità (o invoca `/how-its-made`), la risposta non deve mai consistere né in un riassunto astratto privo di riferimenti al codice, né in un dump massivo di interi file sorgente.

L'analisi deve seguire la struttura **IPO Estesa (Ingresso $\to$ Guardie $\to$ Processo $\to$ Uscita)** articolata in 5 livelli:

1. **Punto di Ingresso (Entry Point & Trigger)**:
   - Identificare il trigger esatto (evento UI, route HTTP, comando CLI, job schedulato o chiamata di funzione pubblica) con link cliccabile `[simbolo](file:///percorso/assoluto/file.ext#L10-L25)`.
   - Dichiarare il contratto di ingresso (parametri attesi, tipi e precondizioni).
2. **Guardie e Uscite Anticipate (Early Returns & Error Paths)**:
   - Elencare esplicitamente le clausole di guardia (`if (!valid) return`, eccezioni sollevate, permessi negati, fallback su cache) che possono interrompere il flusso prima che raggiunga la logica principale.
3. **Processo e Classificazione degli Step (Core Pipeline)**:
   - Scomporre l'esecuzione in una sequenza ordinata di **3–7 passaggi logici** (Legge di Miller), marcando ciascuno step con un'etichetta semantica obbligatoria:
     - `[PURE]`: trasformazione dati deterministica o calcolo matematico privo di effetti collaterali.
     - `[STATE]`: mutazione di variabili di stato in memoria, store reattivi o cache applicativa.
     - `[I/O]`: interazione con l'esterno (chiamate di rete, query DB, lettura/scrittura disco, `localStorage`, manipolazione DOM).
4. **Tracciamento del Payload (Data Shape Evolution)**:
   - Mostrare in modo sintetico come si trasforma la struttura dati lungo la pipeline:
     `Input Grezzo` $\to$ `Dato Validato / Normalizzato` $\to$ `Output / Effetto Finale`.
5. **Punto di Uscita e Stato di Verifica (Exit Point & Test Coverage)**:
   - Dichiarare il valore restituito e gli effetti collaterali prodotti (record salvati, eventi emessi, stato UI aggiornato).
   - Indicare i file di test esistenti che verificano la funzionalità (`[nome.test.js](file:///...)`) segnalando apertamente eventuali rami, guardie o casi limite privi di copertura automatica.

---

## 2. Selettore Interattivo di Modalità Visuale (`<agent-embed>`) e Leggibilità dei Bivi

Nella colonna di chat di Antigravity la larghezza orizzontale è limitata (~600px). I grafici orizzontali (`flowchart LR`) rimpiccioliscono il testo rendendolo illeggibile, mentre mostrare più grafici impilati allunga inutilmente la conversazione.

Per garantire scritte sempre leggibili al 100%, bivi chiari e la possibilità di commutare tra le due viste senza occupare spazio doppio, applicare obbligatoriamente questo standard:

1. **Selettore di Modalità a Tab tramite `<agent-embed>`**:
   - Generare un artefatto HTML compatto (`<artifact_dir>/flow-inspector-<slug>.html`, `UserFacing: true`) basato su `references/flow-widget-template.html` e incorporarlo inline nella risposta tramite:
     ```html
     <agent-embed src="file:///<artifact_dir>/flow-inspector-<slug>.html"></agent-embed>
     ```
   - Il widget deve esporre in alto a destra un selettore a tab (`role="tablist"`) con due viste mutuamente esclusive:
     - **Tab 1 — `Albero Testuale` (attiva di default)**: albero monospace a spina verticale (larghezza massima **65 caratteri** per riga) con `◇ BIVIO` e diramazioni esplicite `├── [NO] ──►` / `└── [SÌ] ──►`.
     - **Tab 2 — `Grafico a Blocchi`**: diagramma a card verticali stilizzato con variabili semantiche del tema (`--card`, `--background`, `--foreground`, `--border`, `--primary`), in cui ogni bivio mostra i due rami affiancati in una griglia a 2 colonne (`grid-cols-2`) e ogni step riporta il badge `[PURE]`, `[STATE]` o `[I/O]`.
2. **Vincoli di Dimensionamento e Theming del Widget**:
   - Usare `<script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>` e `<body class="bg-transparent ...">`.
   - Vietato usare `100vh`, `h-screen` o `min-h-screen` sul contenitore radice (causano il collasso dell'iframe `<agent-embed>`).
   - Mantenere il font minimo a `12px` (`text-xs`).

---

## 3. Selettori a Espansione del Codice Coinvolto (`<details>`)

Per consentire la verifica immediata del codice sorgente senza sovraccaricare la lettura della mappa architetturale, ogni step del flusso deve essere corredato da un **selettore nativo a espansione** (`<details><summary>`):

1. **Sintassi GFM Obbligatoria (Riga Vuota post-`<summary>`)**:
   - Il parser GitHub-Flavored Markdown richiede **tassativamente una riga vuota** subito dopo `</summary>` e prima di `</details>` per formattare correttamente blocchi di codice recintati (` ``` `) e link Markdown.
   - Formato vincolante:
     ```markdown
     <details>
     <summary><strong>Step N [TIPO] — NomeFunzione (file.js:L10-L28)</strong></summary>

     Riferimento: [`nomeFunzione`](file:///percorso/assoluto/file.js#L10-L28)

     ```javascript
     // Estratto chirurgico (10-35 righe) delle sole linee coinvolte
     ```

     </details>
     ```
2. **Estrazione Chirurgica degli Snippet**:
   - Non incollare mai file interi dentro `<details>`. Estrarre esclusivamente il segmento di 10–35 righe che implementa il punto di ingresso, la guardia, la trasformazione o il punto di uscita, mantenendo i commenti contestuali essenziali.
3. **Verificabilità Statica (Zero Congetture)**:
   - È vietato ricostruire un flusso a memoria o dedurre il comportamento solo dai nomi dei file. Prima di generare lo schema IPO, l'agente deve leggere i file sorgente coinvolti e verificare i numeri di riga reali.

---

## 4. Tabella di Anti-Razionalizzazione (Verifica Statica & Formato IPO)

| Razionalizzazione Interna dell'Agente (Vietata) | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Ho già letto questo file alcuni turni fa, posso citare i numeri di riga a memoria."* | Vietato ricostruire a memoria: eseguire `view_file` per verificare i numeri di riga effettivi prima di generare i link `#Lxx-Lyy` e gli estratti `<details>`. |
| *"Per completezza incollo l'intero file di 200 righe dentro il blocco `<details>`."* | Estrarre chirurgicamente solo il segmento di 10–35 righe pertinente allo step, preservando la leggibilità. |
| *"La funzione è semplice, posso spiegare il flusso a parole senza il widget `<agent-embed>`."* | Quando si ispeziona un flusso esecutivo secondo questo protocollo, il selettore a tab `<agent-embed>` e la scomposizione IPO a 5 livelli sono obbligatori. |
| *"Non serve lasciare una riga vuota dopo `</summary>`, il codice si vedrà comunque."* | Senza la riga vuota subito dopo `</summary>`, il parser GFM rompe il rendering dei blocchi di codice recintati e dei link Markdown. |

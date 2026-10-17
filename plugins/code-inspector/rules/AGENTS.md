# Protocollo di Ispezione del Codice e Verifica del Flusso Esecutivo

Questo documento definisce gli standard per la ricostruzione, spiegazione e verifica a livello di codice delle funzionalità software (`/how-its-made`).

---

## 1. Architettura a Divulgazione Progressiva (Modello IPO Esteso a 5 Livelli)

Quando lo sviluppatore richiede di verificare o comprendere il funzionamento di una funzionalità, strutturare l'analisi secondo il modello **Ingresso -> Guardie -> Processo -> Payload -> Uscita**:

1. **Punto di Ingresso (Entry Point & Trigger)**:
   - Identificare il trigger esatto (evento UI, route HTTP, CLI o funzione pubblica) con link cliccabile `[simbolo](file:///percorso/assoluto/file.ext#L10-L25)` e contratto di ingresso (parametri, tipi, precondizioni).
2. **Guardie e Uscite Anticipate (Early Returns & Error Paths)**:
   - Elencare le clausole di guardia (`if (!valid) return`, eccezioni, fallback su cache) che interrompono il flusso prima della logica principale.
3. **Processo e Classificazione degli Step (Core Pipeline)**:
   - Scomporre l'esecuzione in **3–7 passaggi logici** (Legge di Miller), marcando ogni step con etichetta semantica:
     - `[PURE]`: calcolo o trasformazione dati deterministica senza effetti collaterali.
     - `[STATE]`: mutazione di stato in memoria, store reattivi o cache applicativa.
     - `[I/O]`: interazione esterna (rete, DB, disco, `localStorage`, DOM).
4. **Tracciamento del Payload (Data Shape Evolution)**:
   - Mostrare la trasformazione dati lungo la pipeline: `Input Grezzo` -> `Dato Validato` -> `Output / Effetto Finale`.
5. **Punto di Uscita e Stato di Verifica (Exit Point & Test Coverage)**:
   - Dichiarare valore restituito, effetti collaterali e file di test che coprono la funzionalità (`[nome.test.js](file:///...)`), segnalando eventuali rami scoperti.

---

## 2. Selettore Interattivo di Modalità Visuale (`<agent-embed>`)

Per garantire leggibilità al 100% nella colonna di chat (`~600px`):
1. **Artefatto HTML a Tab**: generare `<artifact_dir>/flow-inspector-<slug>.html` (`UserFacing: true`) basato su `references/flow-widget-template.html` e incorporarlo tramite `<agent-embed src="file:///<artifact_dir>/flow-inspector-<slug>.html"></agent-embed>`.
2. **Due Viste Mutuamente Esclusive (`role="tablist"`)**:
   - **Tab 1 — `Albero Testuale` (default)**: albero monospace verticale (<= 65 char/riga) con `◇ BIVIO` e rami `├── [NO] ──►` / `└── [SÌ] ──►`.
   - **Tab 2 — `Grafico a Blocchi`**: card verticali con variabili del tema (`--card`, `--background`, `--foreground`, `--border`, `--primary`), bivi a 2 colonne (`grid-cols-2`) e badge `[PURE]`/`[STATE]`/`[I/O]`.
3. **Vincoli Tecnici**: usare `tailwindcss.min.js`, `<body class="bg-transparent ...">`, font minimo `12px` (`text-xs`) e **mai** `100vh`/`h-screen`/`min-h-screen` sul contenitore radice.

---

## 3. Selettori a Espansione del Codice (`<details>`) e Verifica Statica

1. **Formato GFM Obbligatorio (Riga Vuota post-`<summary>`)**:
   - Lasciare **una riga vuota** subito dopo `</summary>` e prima di `</details>` per non rompere i blocchi di codice recintati.
   - Estrarre chirurgicamente solo il segmento di **10–35 righe** coinvolto nello step (mai interi file), preceduto dal link cliccabile `#Lxx-Lyy`.
2. **Zero Congetture**: eseguire sempre `view_file` per verificare i numeri di riga reali prima di generare link ed estratti.

---

## 4. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Cito i numeri di riga a memoria senza rileggere il file."* | Eseguire `view_file` per verificare i numeri di riga esatti prima di creare i link `#Lxx-Lyy`. |
| *"Incollo l'intero file dentro `<details>`."* | Estrarre solo le 10–35 righe pertinenti allo step. |
| *"Spiego il flusso a parole senza `<agent-embed>` né riga vuota dopo `</summary>`."* | Il widget `<agent-embed>`, i 5 livelli IPO e la riga vuota post-`</summary>` sono obbligatori. |

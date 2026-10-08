# Laws of UX Engineering Rules

Quando progetti, scrivi codice o effettui la revisione di interfacce utente (HTML, CSS, JSX, TSX, Vue, Svelte, Flutter, SwiftUI, Android XML), applica le seguenti regole in base alla specifica problematica che stai affrontando:

---

## 1. Moduli, Input & Validazione Dati
- **Postel's Law (Robustness)**: Sii tollerante con i formati inseriti dall'utente (spazi nei numeri, prefissi telefonici, separatori data). Normalizza e formatta i dati in modo trasparente prima dell'invio.
- **Form Field Reduction (Benchmark Baymard)**: Riduci del 20-60% i campi non indispensabili (mantenere $\le 6-8$ campi per singolo step). Elimina campi opzionali superflui e adotta un layout a colonna singola per minimizzare l'affaticamento oculare.
- **Parkinson's Law & Autofill**: Riduci al minimo il tempo necessario a completare i campi fornendo sempre attributi semantici di completamento (`autocomplete="tel"`, `autocomplete="email"`, `autocomplete="shipping address-line1"`).
- **Law of Proximity**: Associa visivamente la label e i messaggi di hint/errore direttamente al campo input (spazio tra label e input <= 8px; spazio tra gruppi di campi >= 16-24px).
- **Tesler's Law (Conservazione della Complessità)**: Fai svolgere la complessità al codice anziché all'utente (deduzione della banca/circuito dal numero della carta, compilazione automatica città/provincia dal CAP).
- **Error Prevention (NN/G Euristica #5)**: Previeni gli errori tramite vincoli d'interfaccia (disabilita date non selezionabili, maschere di input) prima ancora di mostrare messaggi di errore post-invio.
- **Chunking**: Suddividi campi lunghi (IBAN, codici fiscali, carte di credito, numeri di serie) in gruppi visivi compatti (es. 4-4-4).

---

## 2. Layout, Raggruppamento Visivo & Card (Principi Gestalt)
- **Law of Proximity**: Gli elementi logicamente correlati devono trovarsi a una distanza significativamente minore rispetto a elementi scorrelati.
- **Law of Common Region**: Raggruppa i blocchi di informazione correlata (es. prodotti, commenti, opzioni) all'interno di confini visivi espliciti (card, sfondi dedicati, bordi ben definiti).
- **Law of Similarity**: Elementi con lo stesso ruolo funzionale devono condividere lo stesso stile visivo.
- **Law of Uniform Connectedness**: Usa connettori grafici (linee, frecce) per rappresentare flussi sequenziali (stepper, timeline, wizard).
- **Law of Prägnanz & Occam's Razor**: Elimina decorazioni, gradienti o divisori superflui. Riduci ogni elemento alla sua forma più semplice e leggibile.

---

## 3. Pulsanti, CTA & Target di Puntamento (Ergonomia)
- **Fitts's Law (Target Size & Spacing)**: I touch target devono misurare almeno **48×48 px** su dispositivi touch (con padding trasparente se l'icona è minore) e almeno **32×32 px** su desktop. Spaziatura minima di **8 px** tra target adiacenti per evitare click accidentali.
- **Reachability (Thumb Zone)**: Su mobile, posiziona le azioni principali nell'area raggiungibile dal pollice (parte inferiore dello schermo o bottom bar).
- **Von Restorff Effect (Isolamento dell'Azione Primaria)**: In ogni vista deve esistere **un solo pulsante primario prominente** ad alto contrasto. Le azioni secondarie devono essere outline o ghost button.

---

## 4. Reattività, Feedback & Latenza (Timing Hierarchy)
- **Doherty Threshold (< 400ms)**: Ogni interazione utente (tap, toggle, submit) deve mostrare un feedback visivo immediato entro 400 ms (stato active/pressed, micro-animazione, disabilitazione per prevenire doppi click).
- **Timing Hierarchy dei Caricamenti**:
  - **< 1 secondo**: feedback immediato, nessun loader visibile (evita flicker ingiustificato).
  - **1 - 3 secondi**: mostra uno spinner contestuale o skeleton element.
  - **3 - 10 secondi**: mostra una barra di avanzamento percentuale deterministica con indicatore di progresso.
  - **> 10 secondi**: fornisci una stima temporale esplicita e consenti l'esecuzione asincrona in background.
- **Skeleton Screens & Perceived Performance**: Per viste e feed asincroni, usa skeleton boxes pulsanti che anticipano la struttura del layout, azzerando il Cumulative Layout Shift (CLS).
- **User Control & Grace Period (Undo Pattern)**: Per operazioni critiche o invii (messaggi, eliminazioni), offri una finestra di grazia (5-10s) con pulsante "Annulla" (*Undo*) prima del commit definitivo (NN/G Euristica #3).
- **Peak-End Rule**: Cura attentamente la schermata di conferma finale (epilogo del flusso) per lasciare un'esperienza soddisfacente ed eliminare l'ansia post-invio o post-acquisto.

---

## 5. Navigazione, Tabelle & Riduzione delle Scelte
- **Hick's Law & Choice Overload**: Limita le opzioni visibili a 3-5 scelte essenziali. Nei menu lunghi, raggruppa le voci per categoria o implementa una ricerca rapida.
- **Recognition over Recall (NN/G Euristica #6)**: Nelle barre di ricerca, fornisci cronologia delle ricerche recenti, suggerimenti visuali e autocompletamento tollerante a typo/sinonimi.
- **Faceted Filtering (Benchmark Baymard)**: Nei cataloghi e tabelle dati complesse, implementa sempre le 5 categorie essenziali di filtro (categoria, specifiche/attributi, prezzo/valore, rating, stato/disponibilità).
- **Miller's Law (7 ± 2)**: Non presentare più di 5-7 informazioni non organizzate contemporaneamente.
- **Serial Position Effect**: Colloca i punti di navigazione più importanti all'inizio (Home/Dashboard) e alla fine (Profilo/Impostazioni) delle barre di navigazione.
- **Jakob's Law**: Rispetta le convenzioni web/mobile note (icona carrello o notifiche in alto a destra, logo cliccabile per tornare alla home, pattern di swipe standard).

---

## 6. Interfacce Autonome, Generative & AI (Nuovo Standard 2026)
- **Explainability (Show the Reasoning)**: Quando l'interfaccia o un agente genera un risultato autonomo, propone un suggerimento o precompila dati, mostra chiaramente il segnale di confidenza e la fonte/motivazione verificabile inline senza dover lasciare la schermata.
- **Cheap Takeover (Override a Basso Costo)**: Modificare, correggere o rifiutare un output generato deve costare meno sforzo e meno click rispetto a dover fare l'operazione manualmente da zero. Non costringere mai l'utente a resettare o ripartire daccapo per una singola modifica.
- **Safe Autonomy & Reversibility**: Nessuna azione distruttiva o transazione irreversibile deve essere eseguita dall'agente o dall'automazione senza esplicita conferma o possibilità immediata di ripristino.

---

## 7. Accessibilità Universale (WCAG POUR & Curb-Cut Effect)
- **Perceivable**: Contrasto testo minimo 4.5:1 (3:1 per testo grande), supporto modalità chiara/scura, zoom fino al 200% senza perdite di informazione.
- **Operable**: Interfaccia interamente navigabile via tastiera con focus state ben visibile (`outline: 2px solid ...`); nessun keyboard trap.
- **Understandable**: Gerarchia di intestazioni logica (`h1` -> `h2` -> `h3`), messaggi di errore chiari con istruzioni correttive dirette (NN/G Euristica #9).
- **Robust**: Compatibilità con screen reader, semantica HTML nativa prima di ricorrere ad attributi ARIA.


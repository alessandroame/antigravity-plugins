# Laws of UX Engineering Rules

Quando progetti, scrivi codice o effettui la revisione di interfacce utente (HTML, CSS, JSX, TSX, Vue, Svelte, Flutter, SwiftUI, Android XML), applica le seguenti regole in base alla specifica problematica che stai affrontando:

---

## 1. Moduli, Input & Validazione Dati
- **Postel's Law (Robustness)**: Sii tollerante con i formati inseriti dall'utente (spazi nei numeri, prefissi, formati data). Normalizza e formatta i dati in modo trasparente prima dell'invio.
- **Parkinson's Law & Autofill**: Riduci al minimo il tempo necessario a completare i campi fornendo sempre attributi semantici di completamento (`autocomplete="tel"`, `autocomplete="email"`, `autocomplete="shipping address-line1"`).
- **Law of Proximity**: Associa visivamente la label e i messaggi di hint/errore direttamente al campo input (spazio tra label e input <= 8px; spazio tra gruppi di campi >= 16-24px).
- **Tesler's Law (Conservazione della Complessità)**: Fai svolgere la complessità al codice anziché all'utente (deduzione della banca/circuito dal numero della carta, compilazione automatica città dal CAP).
- **Chunking**: Suddividi campi lunghi (IBAN, codici fiscali, numeri di serie) in gruppi visivi compatti.

---

## 2. Layout, Raggruppamento Visivo & Card (Principi Gestalt)
- **Law of Proximity**: Gli elementi logicamente correlati devono trovarsi a una distanza significativamente minore rispetto a elementi scorrelati.
- **Law of Common Region**: Raggruppa i blocchi di informazione correlata (es. prodotti, commenti, opzioni) all'interno di confini visivi espliciti (card, sfondi dedicati, bordi ben definiti).
- **Law of Similarity**: Elementi con lo stesso ruolo funzionale devono condividere lo stesso stile visivo.
- **Law of Uniform Connectedness**: Usa connettori grafici (linee, frecce) per rappresentare flussi sequenziali (stepper, timeline, wizard).
- **Law of Prägnanz & Occam's Razor**: Elimina decorazioni, gradienti o divisori superflui. Riduci ogni elemento alla sua forma più semplice e leggibile.

---

## 3. Pulsanti, CTA & Target di Puntamento (Ergonomia)
- **Fitts's Law (Target Size & Spacing)**: I touch target devono misurare almeno **48×48 px** su dispositivi touch (con padding trasparente se l'icona è minore) e almeno **32×32 px** su desktop. Spaziatura minima di **8 px** tra target adiacenti.
- **Reachability (Thumb Zone)**: Su mobile, posiziona le azioni principali nell'area raggiungibile dal pollice (parte inferiore dello schermo).
- **Von Restorff Effect (Isolamento dell'Azione Primaria)**: In ogni vista deve esistere **un solo pulsante primario prominente** ad alto contrasto. Le azioni secondarie devono essere outline o ghost button.

---

## 4. Reattività, Feedback & Latenza
- **Doherty Threshold (< 400ms)**: Ogni interazione utente (tap, toggle, submit) deve mostrare un feedback visivo immediato entro 400 ms (stato active, spinner, disabilitazione del pulsante per prevenire doppi click).
- **Skeleton Loading & Perceived Performance**: Per operazioni oltre 1 secondo, mostra Skeleton Screens per anticipare il layout ed evitare salti di pagina (Cumulative Layout Shift).
- **Peak-End Rule**: Cura attentamente la schermata di conferma finale (epilogo del flusso) per lasciare un'esperienza soddisfacente ed eliminare l'ansia post-acquisto o invio.

---

## 5. Navigazione, Tabelle & Riduzione delle Scelte
- **Hick's Law & Choice Overload**: Limita le opzioni visibili a 3-5 scelte essenziali. Nei menu lunghi, raggruppa le voci per categoria o implementa una barra di ricerca ad autocompletamento rapido.
- **Miller's Law (7 ± 2)**: Non presentare più di 5-7 informazioni non organizzate contemporaneamente.
- **Serial Position Effect**: Colloca i punti di navigazione più importanti all'inizio (Home/Dashboard) e alla fine (Profilo/Impostazioni) delle barre di navigazione.
- **Jakob's Law**: Rispetta le convenzioni web/mobile note (icona carrello in alto a destra, logo cliccabile per tornare alla home, pattern di swipe standard).

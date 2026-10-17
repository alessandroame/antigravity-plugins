# Laws of UX Engineering Rules

Applica queste regole durante la progettazione, scrittura o revisione di interfacce utente e nella formattazione delle risposte nella colonna di chat di Antigravity (`~600px`).

---

## 1. Moduli, Input & Validazione Dati
- **Postel's Law**: accetta input permissivi (spazi, separatori) e normalizza i dati in modo trasparente.
- **Form Field Reduction & Single Column**: mantieni <= 6–8 campi per step in layout a colonna singola.
- **Parkinson's Law & Autofill**: dichiara sempre attributi `autocomplete` semantici.
- **Proximity & Error Prevention**: distanza label-input <= 8px, tra gruppi >= 16–24px; previeni errori con vincoli UI nativi e suddividi stringhe lunghe (Chunking 4-4-4).
- **Tesler's Law**: sposta la complessità calcolabile sul software anziché sull'utente.

---

## 2. Layout, Raggruppamento Visivo & Card (Gestalt)
- **Proximity & Common Region**: raggruppa elementi correlati ravvicinandoli e racchiudendoli in card o confini espliciti (max 1 livello di contenimento perimetrale).
- **Similarity & Connectedness**: mantieni stile identico per funzioni uguali e usa connettori visivi per flussi sequenziali.
- **Prägnanz & Occam's Razor**: rimuovi decorazioni, gradienti o controlli ridondanti.

---

## 3. Pulsanti, CTA & Target di Puntamento (Ergonomia)
- **Fitts's Law**: touch target minimo **>= 48 x 48 px** su mobile/touch (>= 32 x 32 px desktop) con gap >= 8px.
- **Thumb Zone & Von Restorff Effect**: colloca le azioni primarie nella zona del pollice e mostra **un solo pulsante primario ad alto contrasto** per vista.

---

## 4. Reattività, Feedback & Latenza (Timing Hierarchy)
- **Doherty Threshold (< 400ms)**: fornisci feedback visivo immediato a ogni interazione (`:active`, disabilitazione anti-doppio tap).
- **Gerarchia Caricamenti**: < 1s nessun loader; 1–3s skeleton/spinner senza CLS; 3–10s barra di progresso; > 10s stima temporale ed esecuzione asincrona.
- **Undo & Peak-End Rule**: offri una finestra di annullamento (5–10s) sulle azioni distruttive e cura gli stati di conferma finale.

---

## 5. Navigazione, Tabelle & Riduzione delle Scelte
- **Hick's & Miller's Law**: limita le scelte di primo livello a 3–5 opzioni e i gruppi informativi a 5–7 elementi.
- **Serial Position & Jakob's Law**: posiziona le destinazioni chiave all'inizio e alla fine della barra di navigazione rispettando i pattern standard web/mobile.

---

## 6. Interfacce Autonome, Generative & Accessibilità (WCAG POUR)
- **Explainability, Cheap Takeover & Safe Autonomy**: esponi sempre la motivazione/fonte dei suggerimenti automatici, consenti l'override con 1 tap e richiedi conferma per azioni irreversibili.
- **WCAG 2.1 AA/AAA**: contrasto minimo `4.5:1` per testo normale (`3:1` grande, `7:1` per indicatori critici outdoor), navigabilità completa da tastiera con `:focus-visible` e semantica HTML nativa.

---

## 7. Standard Outdoor, Field & High-Glare (Uso con Guanti / Sole Diretto)
- **Touch Floor >= 48px**: estendi i controlli compatti tramite padding trasparente o `::before`.
- **Caroselli Monoriga (`touch-action: pan-x`)**: vieta il `flex-wrap` multi-riga per barre di filtri/date; usa scorrimento orizzontale con scroll-snap.
- **Cooperative Gestures & `100dvh`**: usa `touch-action: pan-y` sui canvas/mappe per non bloccare lo scroll verticale e adotta `100dvh` anziché `100vh`.
- **Dual High-Contrast Theme & Feedback Tri-Modale**: supporta tema chiaro/scuro ad alto contrasto e combina sempre **Colore + Testo Esplicito + Simbolo Funzionale** per ogni stato di sicurezza.

---

## 8. Ergonomia Cognitiva dell'Output in Chat (`~600px`)
- **Progressive Disclosure (0-Click + 1-Click `<details>`)**: esponi in chiaro solo la sintesi decisionale (`800–1.200` char, 3–5 bullet di 1 riga) e racchiudi tabelle, codice e dettagli in blocchi `<details>` chiusi di default.
- **Von Restorff Tipografico**: usa il grassetto solo sull'etichetta iniziale del bullet (<= 15% del testo) e isola a fine messaggio l'unica domanda o conferma per l'utente.

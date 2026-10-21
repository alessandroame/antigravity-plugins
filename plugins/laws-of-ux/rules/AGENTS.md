# Laws of UX Engineering Rules (`laws-of-ux`)

Applica queste regole nella progettazione/revisione di interfacce utente e nella colonna di chat di Antigravity (`~600px`).

## 1. Moduli, Layout (Gestalt) & Target Touch
- **Input & Form (Postel, Tesler, Chunking)**: accetta input permissivi normalizzandoli via software; mantieni `<= 6–8` campi per step in colonna singola con `autocomplete`, distanza label-input `<= 8px` e tra gruppi `>= 16–24px`.
- **Gerarchia in 3 Secondi (Anti-"Muro di Box")**: massimo **4 card/gruppi visibili *above-the-fold*** su mobile (`360x800`), max 1 livello di contenimento perimetrale, **3 livelli netti di scala tipografica** (Dato Primario Hero `24–32px bold` -> Secondario `14–16px` -> Etichetta/Unità `11–12px`) e `white-space: nowrap` sui gruppi `valore + unità` (`24 km/h`, `1850 m`).
- **Fitts's Law & Von Restorff**: touch target **`>= 48 x 48 px`** su mobile (`>= 32px` desktop) con gap `>= 8px`; un solo pulsante primario ad alto contrasto nella zona del pollice.

## 2. Reattività, Navigazione & Accessibilità (WCAG POUR)
- **Doherty Threshold (`< 400ms`) & Caricamenti**: feedback visivo immediato (`:active`, anti-doppio tap); `< 1s` nessun loader, `1–3s` skeleton senza CLS, `3–10s` progress bar, `> 10s` stima + asincrono; finestra di Undo (`5–10s`) sulle azioni distruttive.
- **Hick's & Miller's Law**: limita le scelte di primo livello a `3–5` opzioni e i gruppi informativi a `5–7` elementi.
- **Safe Autonomy & WCAG 2.1 AA/AAA**: esponi la fonte dei suggerimenti automatici con override in 1 tap (`Cheap Takeover`); contrasto `>= 4.5:1` testo normale (`>= 7:1` indicatori critici outdoor), `:focus-visible` e semantica nativa.

## 3. Standard Outdoor / High-Glare & Metro di Giudizio Visivo (4 Misure)
- **Budget Schermo 60/40 & `100dvh`**: nelle viste operative (mappe, meteogrammi, telemetria 3D), riserva **`>= 60%` dell'altezza viewport (`360x800`)** al canvas primario senza scroll; header, filtri e HUD flottanti `<= 40%` senza occludere controlli (`elementFromPoint`). Usa `100dvh`, `touch-action: pan-x` sui caroselli monoriga (vietato `flex-wrap`) e tema chiaro/scuro ad alto contrasto con feedback Tri-Modale (Colore + Testo + Simbolo).
- **Ricevuta di Collaudo a 4 Misure (Zero Giudizi "A Occhio")**: quando ispezioni uno screenshot nel browser è vietato dire *"sembra tutto ok"* senza misure o inventare difetti se i controlli passano (**0 modifiche** per il Rasoio di Occam). Valida sempre: (1) **Budget schermo** (`>= 60%` libero), (2) **Scala gerarchica in 3s** + `nowrap`, (3) **Sonda geometrica** (`0` sovrapposizioni `elementFromPoint`, `0` testi tagliati, `0` scroll orizzontali su `360x800`), (4) **Flusso `Prima -> Click -> Dopo`** visibile senza scrollare.

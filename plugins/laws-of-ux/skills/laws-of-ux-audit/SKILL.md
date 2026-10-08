---
name: laws-of-ux-audit
description: >-
  Use this skill to conduct a comprehensive UX Heuristic Audit of an existing screen,
  application, design system, or pull request across all 30 Laws of UX (Gestalt, ergonomics,
  cognitive load, behavior, and performance). Produces a prioritized remediation report (P0-P3).
---

# Laws of UX Heuristic Audit Skill

Questa skill esegue una diagnosi euristica a 360° su una schermata, un componente o un flusso utente completo, confrontandolo con tutte le **30 Laws of UX** (Jon Yablonski, [lawsofux.com](https://lawsofux.com/)).

## Quando Utilizzare
- L'utente chiede: *"Fai un audit UX di questa pagina / di questo flusso"*.
- Revisione di usabilità e accessibilità prima di un rilascio in produzione.
- Valutazione comparativa tra una vecchia e una nuova versione di una UI.

---

## Fasi dell'Audit Integrato (30 Laws of UX + 10 Euristiche NN/G + Benchmark Baymard)

### Fase 1: Modello Mentale & Coerenza (Jakob's Law, NN/G #2 e #4)
- **Convenzioni Esterne & Interne**: Il layout e i controlli rispettano i pattern consolidati di piattaforma (Jakob's Law, NN/G #4)?
- **Match con il Mondo Reale**: Terminologia e concetti riflettono il linguaggio dell'utente anziché tecnicismi interni di sistema (NN/G #2)?
- **Wayfinding**: L'utente sa sempre dove si trova all'interno del flusso e come tornare indietro senza ostacoli?

### Fase 2: Layout & Percezione Gestalt (Proximity, Common Region, Similarity, Connectedness, Prägnanz)
- **Raggruppamento Visivo**: I dati correlati sono raggruppati in card o confini visivi espliciti (Common Region)?
- **Distanze di Prossimità**: Le etichette e gli hint sono a $\le 8\text{ px}$ dal relativo campo e i gruppi distinti a $\ge 16-24\text{ px}$?
- **Rapporto Segnale/Rumore**: Sono stati eliminati elementi decorativi e divisori superflui (Prägnanz, Occam's Razor, NN/G #8)?

### Fase 3: Carico Cognitivo & Memoria (Miller, Chunking, Recognition over Recall, Serial Position, Von Restorff)
- **Recognition over Recall (NN/G #6)**: Le scelte sono visibili a schermo (ricerche recenti, autocompletamento visivo) senza richiedere sforzo di memoria mnemonica all'utente?
- **Filtri di Catalogo (Benchmark Baymard)**: Se l'interfaccia include cataloghi o elenchi densi, sono disponibili le 5 categorie chiave di filtro (categoria, specifiche, prezzo, rating, disponibilità)?
- **Gerarchia delle Azioni**: Esiste una sola CTA primaria prominente ad alto contrasto per vista (Von Restorff Effect)?

### Fase 4: Ergonomia, Form & Prevenzione Errori (Fitts, Postel, Parkinson, Baymard, NN/G #5)
- **Touch Target & Spaziatura (Fitts)**: I target touch misurano almeno $48\times 48\text{ px}$ su mobile e $32\times 32\text{ px}$ su desktop, distanziati di almeno $8\text{ px}$? Le azioni primarie sono nella Thumb Zone?
- **Potatura Campi & Colonna Singola (Baymard)**: Il form è strutturato a colonna singola? Il numero totale di campi per step è contenuto a $\le 6-8$ campi?
- **Tolleranza Input (Postel)**: Il sistema accetta formati elastici (spazi nei telefoni, formati data alternativi) e li normalizza?
- **Prevenzione Attiva (NN/G #5)**: Il sistema impedisce date non valide o selezioni incoerenti prima ancora del submit?

### Fase 5: Reattività, Latenza & Controllo (Doherty, Timing Hierarchy, Peak-End, NN/G #1 e #3)
- **Feedback Immediato**: Ogni tocco riceve feedback visivo entro 400ms (Doherty Threshold, NN/G #1)?
- **Gerarchia di Caricamento**: Nessun loader invasivo sotto 1s; spinner/skeleton tra 1-3s; progress bar deterministica tra 3-10s; stima esplicita + background per attese > 10s?
- **User Control & Undo (NN/G #3)**: Esiste una finestra di grazia (5-10s) con pulsante "Annulla" per azioni asincrone o invii critici?
- **Schermata Finale Rassicurante**: L'epilogo conferma chiaramente l'esito dell'operazione e le fasi successive (Peak-End Rule)?

### Fase 6: Trasparenza AI & Interfacce Autonome (Standard 2026 - Windmill #11)
- **Explainability (Show the Reasoning)**: Quando il sistema pre-compila campi, propone suggerimenti o genera contenuti in autonomia, ne espone la motivazione e la confidenza verificabile inline?
- **Cheap Takeover (Override a Basso Costo)**: Modificare o correggere l'output generato dall'AI costa meno sforzo e meno click rispetto a eseguire l'operazione da zero?
- **Autonomia Sicura**: Le azioni irreversibili o transazionali richiedono sempre conferma esplicita dell'utente?

---

## Schema del Report di Remediation (P0-P3)
Genera il report classificando i rilievi secondo la matrice di severità:
- **P0 - Critical (Blocker)**: Impossibilità di completare l'azione, touch target < 32px con click falliti, freeze senza feedback > 1s, assenza navigazione da tastiera (A11y Blocker), assenza di conferma su azioni distruttive.
- **P1 - High**: Form multi-colonna complessi (> 10 campi non suddivisi), assenza di filtri base in cataloghi densi, AI takeover costoso (costringe a riscrivere da capo), violazione palese delle convenzioni di piattaforma (Jakob).
- **P2 - Medium**: Assenza di attributi `autocomplete`, label distanti dagli input (> 10px), liste non raggruppate (> 7 elementi non chunked), ricerche prive di autocompletamento o gestione typo.
- **P3 - Low / Polish**: Micro-copy migliorabile, transizioni visive perfezionabili, valorizzazione dell'epilogo di conferma (Peak-End).

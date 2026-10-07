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

## Fasi dell'Audit

### Fase 1: Modello Mentale & Convenzioni (Jakob, Active User Paradox, Tesler)
- Il design rispetta le convenzioni note?
- L'utente può completare il task principale senza dover leggere manuali o tutorial prolissi?

### Fase 2: Layout & Percezione Gestalt (Proximity, Common Region, Similarity, Connectedness, Prägnanz)
- Gli elementi correlati sono vicini e racchiusi in regioni definite (card)?
- C'è coerenza visiva e assenza di rumore grafico superfluo?

### Fase 3: Carico Cognitivo & Memoria (Miller, Working Memory, Chunking, Cognitive Load, Serial Position, Von Restorff)
- Le informazioni complesse sono suddivise in blocchi di 5-7 elementi?
- Il sistema supporta il riconoscimento visivo invece di richiedere memoria di richiamo?
- La CTA primaria si isola chiaramente (Von Restorff)?

### Fase 4: Ergonomia & Azione Motoria (Fitts, Hick, Choice Overload, Postel)
- I touch target sono ampi (>= 48×48px touch / >= 32×32px desktop) e distanziati (>= 8px)?
- Il numero di opzioni concorrenti è contenuto?
- Il sistema accetta input flessibili e normalizzati?

### Fase 5: Reattività, Tempo & Coinvolgimento (Doherty, Goal-Gradient, Peak-End, Zeigarnik)
- C'è feedback visivo entro 400ms per ogni interazione?
- Ci sono skeleton loader o barre di avanzamento per attese superiori a 1 secondo?
- La schermata finale gratifica l'utente?

---

## Schema del Report di Remediation (P0-P3)
Genera il report classificando i rilievi secondo la matrice di severità:
- **P0 - Critical**: Blocco dell'azione, tap mancati (Fitts < 32px), freeze senza feedback (Doherty).
- **P1 - High**: Decision paralysis (Choice Overload), rottura di convenzioni critiche (Jakob).
- **P2 - Medium**: Spaziature incoerenti (Gestalt), liste non chunked (> 7 elementi).
- **P3 - Low / Polish**: Miglioramenti estetici, micro-copy, valorizzazione dell'epilogo (Peak-End).

---
description: >-
  Regola per menu, barre di navigazione, tabelle di confronto e filtri (Hick's Law, Choice Overload, Serial Position, Jakob's Law).
trigger: model_decision
globs: "**/*{nav,navbar,menu,sidebar,dropdown,filter,pricing,table}*.{html,jsx,tsx,vue,svelte,dart}"
---

# Navigation & Choice Architecture Rules

Quando progetti menu, navigazioni o schermate di scelta complessa (pricing):
1. **Riduzione Scelte (Hick's Law & Choice Overload)**: Non mostrare più di 3-5 opzioni principali simultaneamente. Usa categorie collassabili o navigazione progressiva.
2. **Recognition over Recall nelle Ricerche (NN/G Euristica #6)**: Le caselle di ricerca devono offrire cronologia delle ricerche recenti, autocompletamento visivo istantaneo e tolleranza verso errori di digitazione e sinonimi (evitando schermate vuote "Nessun risultato").
3. **Filtri Multipli Faccettati (Benchmark Baymard)**: Nei cataloghi e viste dati estese, implementa sempre le 5 categorie di filtro essenziali (categoria, attributi/specifiche, prezzo/range, recensioni/rating, disponibilità/stato) con conteggio risultati in tempo reale.
4. **Wayfinding & Tracciamento Posizione**: Comunica sempre all'utente dove si trova (stato attivo evidente nella barra, breadcrumb nei flussi profondi, indicatori di step nei wizard).
5. **Posizione Seriale (Serial Position Effect)**: Metti le azioni più importanti al primo e all'ultimo posto della barra o lista di navigazione.
6. **Convenzioni Note (Jakob's Law)**: Rispetta i pattern universali di navigazione (logo a sinistra/alto per Home, carrello/notifiche a destra, menu hamburger coerente su mobile).

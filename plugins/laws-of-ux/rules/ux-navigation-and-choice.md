---
description: >-
  Regola per menu, barre di navigazione, tabelle di confronto e filtri (Hick's Law, Choice Overload, Serial Position, Jakob's Law).
trigger: model_decision
globs: "**/*{nav,navbar,menu,sidebar,dropdown,filter,pricing,table}*.{html,jsx,tsx,vue,svelte,dart}"
---

# Navigation & Choice Architecture Rules

Quando progetti menu, navigazioni o schermate di scelta complessa (pricing):
1. **Riduzione Scelte (Hick's Law & Choice Overload)**: Non mostrare più di 3-5 opzioni principali simultaneamente. Usa categorie collassabili o ricerca ad autocompletamento.
2. **Posizione Seriale (Serial Position Effect)**: Metti le azioni più importanti al primo e all'ultimo posto della barra o lista di navigazione.
3. **Convenzioni Note (Jakob's Law)**: Rispetta i pattern universali di navigazione (logo a sinistra per Home, carrello/profilo a destra).

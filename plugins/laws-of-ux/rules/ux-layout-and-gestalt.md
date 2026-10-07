---
description: >-
  Regola per layout di pagina, raggruppamento visivo, card, dashboard e griglie basata sui principi Gestalt (Proximity, Common Region, Similarity, Connectedness, Prägnanz).
trigger: model_decision
globs: "**/*{layout,card,grid,list,container,view,page,dashboard}*.{html,jsx,tsx,vue,svelte,css,scss,dart}"
---

# Layout & Gestalt UX Rules

Quando crei o modifichi layout, card, griglie e dashboard:
1. **Contenitori Definiti (Law of Common Region)**: Racchiudi le entità logiche in card o sezioni con bordi o sfondi chiari.
2. **Spaziature Gerarchiche (Law of Proximity)**: Usa uno spazio interno minore tra elementi correlati rispetto allo spazio che separa card differenti.
3. **Consistenza Stile (Law of Similarity)**: Elementi con la stessa funzione devono avere la stessa grafica e colore in tutta l'applicazione.
4. **Flussi Connessi (Law of Uniform Connectedness)**: Usa linee e indicatori continui per mostrare step sequenziali.
5. **Semplicità Strutturale (Law of Prägnanz)**: Riduci decorazioni grafiche superflue; prediligi spaziature pulite.

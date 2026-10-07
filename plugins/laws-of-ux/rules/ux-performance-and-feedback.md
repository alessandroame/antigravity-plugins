---
description: >-
  Regola per stati di caricamento, feedback istantaneo, latenza e gestione errori (Doherty Threshold, Peak-End Rule).
trigger: model_decision
globs: "**/*{loader,spinner,skeleton,feedback,progress,toast,alert,modal,error}*.{html,jsx,tsx,vue,svelte,dart}"
---

# Feedback & Perceived Performance Rules

Quando gestisci caricamenti asincroni, salvataggi o feedback utente:
1. **Feedback < 400ms (Doherty Threshold)**: Rispondi immediatamente a ogni click dell'utente con una reazione visiva entro 400ms.
2. **Skeleton Screens**: Per caricamenti di pagina o tabelle, usa skeleton loader che anticipano la sagoma dei contenuti.
3. **Barre Determinate**: Per attese superiori a 2 secondi, mostra una barra di avanzamento stimata con messaggio informativo.
4. **Epilogo Gratificante (Peak-End Rule)**: Trasforma l'azione finale in un momento gratificante e privo di ambiguità (conferma chiara, link utili).

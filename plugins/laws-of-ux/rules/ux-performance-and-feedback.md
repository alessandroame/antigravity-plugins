---
description: >-
  Regola per stati di caricamento, feedback istantaneo, latenza e gestione errori (Doherty Threshold, Peak-End Rule).
trigger: model_decision
globs: "**/*{loader,spinner,skeleton,feedback,progress,toast,alert,modal,error}*.{html,jsx,tsx,vue,svelte,dart}"
---

# Feedback & Perceived Performance Rules

Quando gestisci caricamenti asincroni, salvataggi o feedback utente:
1. **Feedback Immediato < 400ms (Doherty Threshold)**: Rispondi a ogni tap/click con stato visivo istantaneo (active state, micro-transizione, pulsante disabilitato contro doppi click) entro 400ms.
2. **Gerarchia Temporale dei Caricamenti (Timing Hierarchy)**:
   - `< 1 secondo`: non mostrare loader o spinner invasivi per evitare flickering fastidioso.
   - `1 - 3 secondi`: mostra uno spinner contestuale inline o micro-indicatore.
   - `3 - 10 secondi`: mostra una barra di avanzamento percentuale deterministica con indicatore di progresso visibile.
   - `> 10 secondi`: fornisci stima di tempo rimanente e permetti all'utente di continuare altre attività (background execution con notifica di completamento).
3. **Skeleton Screens**: Per schermate complete, liste e card, usa skeleton loader pulsanti che replicano la sagoma dei contenuti ed eliminano il Cumulative Layout Shift (CLS).
4. **Finestra di Annullamento (Undo Grace Period - NN/G Euristica #3)**: Per operazioni asincrone critiche (invio messaggi, cancellazioni, archiviazioni), fornisci un intervallo temporale di 5-10s con pulsante "Annulla" prima del commit definitivo.
5. **Epilogo Gratificante & Recupero Errori (Peak-End Rule & NN/G #9)**: Rendi la schermata di conferma rassicurante e chiara; in caso di errore, fornisci spiegazioni in linguaggio umano con un'azione di rimedio immediata (es. "Riprova", "Verifica connessione").

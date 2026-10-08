---
name: ux-feedback-and-perceived-performance
description: >-
  Use this skill when handling asynchronous actions, API data loading, submit states,
  progress indicators, and system latencies. Applies the Doherty Threshold, Peak-End Rule,
  and Goal-Gradient Effect to keep users engaged and eliminate the perception of waiting.
---

# Feedback & Perceived Performance Skill

Questa skill permette di trasformare schermate lente, attese di rete o flussi asincroni in esperienze percepite come reattive, fluide e affidabili.

## Problemi Tipici Risolti da questa Skill
- Schermate bianche o congelate durante le chiamate API.
- Utenti che cliccano freneticamente 5 volte sul pulsante "Paga" o "Invia".
- Indicatori di caricamento generici che lasciano l'utente nel dubbio se il sistema sia bloccato.
- Epiloghi di processo freddi o privi di rassicurazione.

---

## Leggi Applicate & Regole Chiave

1. **Doherty Threshold (< 400ms)**:
   - Se il sistema risponde entro 400ms, l'utente mantiene la concentrazione e il suo ritmo operativo rimane elevato.
   - *Strategia*: Usa aggiornamenti ottimistici (optimistic UI) o mostra immediatamente lo stato "in corso" al click (< 100ms).

2. **Gerarchia dei Tempi di Attesa (Timing Hierarchy - UXPilot/Windmill)**:
   - **< 1 secondo**: feedback istantaneo; non mostrare spinner invasivi per non provocare sfarfallii visivi (flicker).
   - **1 - 3 secondi**: mostra uno spinner contestuale leggero o skeleton element inline.
   - **3 - 10 secondi**: mostra una barra di avanzamento percentuale deterministica (*Goal-Gradient Effect*). La ricerca dimostra che gli utenti tollerano un'attesa tre volte superiore se vedono un progresso chiaro.
   - **> 10 secondi**: fornisci una stima del tempo residuo (*"Circa 45 secondi rimanenti..."*) e consenti all'utente di passare ad altre schede (esecuzione asincrona in background con notifica di completamento).

3. **Perceived Performance & Skeleton Screens**:
   - Uno Skeleton Screen animato (pulsante o shimmer) trasmette la sensazione che la pagina si stia già componendo, riducendo l'attesa percepita rispetto a uno spinner isolato e azzerando il Cumulative Layout Shift (CLS).

4. **Finestra di Annullamento (Undo Grace Period - NN/G Euristica #3)**:
   - Nelle operazioni asincrone o invii critici (invio email/messaggi, eliminazione account, archiviazione dati), implementa una finestra temporale di 5-10 secondi in cui l'azione è trattenuta e l'utente vede un banner con pulsante "Annulla" (pattern Gmail). Dare il controllo all'utente per rimediare a un errore genera molta più fiducia rispetto a una trasmissione istantanea irreversibile.

5. **Peak-End Rule & Recupero Errori (NN/G Euristica #9)**:
   - Le persone giudicano un'esperienza ricordando il punto di picco e il momento finale.
   - *Strategia*: La schermata di completamento (es. dopo una registrazione o acquisto) deve essere celebrativa, chiara, riepilogativa e rassicurante. In caso di fallimento della rete, non mostrare schermate d'errore generiche ("Errore 500"): spiega chiaramente cosa è accaduto e fornisci un'azione di retry senza perdita dei dati inseriti.

---

## Procedura Operativa per l'Agente
1. **Applicazione della Timing Hierarchy**:
   - Assegna a ciascuna operazione asincrona il pattern visivo adeguato (micro-feedback < 1s, spinner 1-3s, progress bar 3-10s, background async > 10s).
2. **Disabilitazione e Stato Loading**: Quando si invia un form o si effettua un pagamento, disabilita il pulsante di submit e mostra uno stato inline con spinner per prevenire rage click e doppi addebiti.
3. **Skeleton UI al Posto di Schermi Vuoti**: Nei componenti che caricano elenchi, tabelle o schede profilo, definisci una sagoma skeleton con dimensioni e proporzioni conformi al dato reale.
4. **Implementazione Pattern Undo**: Nelle eliminazioni o invii asincroni, imposta un `setTimeout` reversibile con toast di notifica e pulsante "Annulla".
5. **Gestione Timeout ed Errori**: Se una richiesta supera i 5-8 secondi, mostra un messaggio cortese che rassicura l'utente con l'opzione di riprovare senza azzerare lo stato locale.

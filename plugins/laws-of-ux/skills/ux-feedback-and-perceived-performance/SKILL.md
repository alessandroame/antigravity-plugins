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

2. **Perceived Performance & Skeleton Screens**:
   - Uno Skeleton Screen animato (pulsante o shimmer) trasmette la sensazione che la pagina si stia già componendo, riducendo l'attesa percepita rispetto a uno spinner isolato.

3. **Peak-End Rule**:
   - Le persone giudicano un'esperienza ricordando il punto di picco e il momento finale.
   - *Strategia*: La schermata di completamento (es. dopo una registrazione o acquisto) deve essere celebrativa, chiara, riepilogativa e rassicurante.

4. **Goal-Gradient Effect**:
   - Più l'utente percepisce di essere vicino alla fine, più è motivato ad attendere e completare l'operazione.
   - *Strategia*: Usa barre di avanzamento determinate per operazioni lunghe (> 2 secondi).

---

## Procedura Operativa per l'Agente
1. **Disabilitazione e Stato Loading**: Quando si invia una form, disabilita il pulsante e mostra un micro-spinner o etichetta 'Salvataggio in corso...'.
2. **Skeleton UI al Posto di Schermi Vuoti**: Nei componenti che leggono dati (feed, tabelle, dettagli profilo), definisci un layout skeleton identico alle dimensioni del contenuto reale.
3. **Gestione Timeout ed Errori**: Se una richiesta supera i 5-8 secondi, mostra un messaggio cortese che rassicura l'utente con l'opzione di riprovare.

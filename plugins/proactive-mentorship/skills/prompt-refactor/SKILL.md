---
name: prompt-refactor
description: >-
  Metodologia operativa per analizzare e rifattorizzare prompt ambigui o sub-ottimali.
  Utilizza quando un requisito utente richiede maggiore determinismo, quando si identificano rischi di allucinazione
  o quando si vuole ottimizzare l'economia dei token tramite iniezioni mirate di file e test.
---

# Prompt Refactoring & Quality Runbook

## 1. Principi di Prompt Engineering per Agenti Autonomi
Un prompt formulato per un agente autonomo deve massimizzare due variabili:
1. **Determinismo 1-Shot**: L'agente deve possedere subito il perimetro esatto dei file coinvolti e il criterio di successo.
2. **Token Economy**: Evitare scansioni esplorative ampie dell'intero repository fornendo i percorsi esatti dei file sorgente e dei test.

---

## 2. Matrice di Refactoring: Da Debole a Ottimizzato

| Tipologia di Difetto | Formulazione Debole (🔴) | Versione Rifattorizzata (🟢) |
| :--- | :--- | :--- |
| **Istruzione Vaga** | *"Aggiungi la gestione errori nel modulo"* | *"Implementa la gestione dell'eccezione `NetworkError` in `src/api.js` restituendo `{ success: false, code: 503 }`"* |
| **Assenza di Criterio di Verifica** | *"Rifai il form di checkout"* | *"Aggiorna i campi di `CheckoutForm.jsx` secondo la Legge di Postel e verifica che `npm test checkout` passi con 0 errori"* |
| **Ambito Illimitato** | *"Rendi più veloce la pagina"* | *"Ottimizza il caricamento iniziale di `index.html` differendo gli script non critici e riducendo il tempo al Doherty Threshold (<400ms)"* |

---

## 3. Procedura Operativa per l'Agente

1. **Rilevamento Attrito**: Se la richiesta dell'utente contiene assunzioni implicite o genera un rischio di iterazioni a vuoto, fermarsi prima della scrittura del codice.
2. **Formulazione Box**: Comporre il blocco di Proactive Mentorship con il confronto *Prima vs Dopo*.
3. **Spiegazione dei Vantaggi**: Evidenziare perché la versione ottimizzata riduce il consumo di token e previene modifiche non richieste.
4. **Richiesta di Conferma**: Chiedere conferma prima di procedere se il perimetro del task cambia significativamente.

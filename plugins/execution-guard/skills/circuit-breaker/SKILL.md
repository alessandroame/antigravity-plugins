---
name: circuit-breaker
description: >-
  Salvaguardia salva-token e interruzione di loop agentici ricorsivi. Rileva errori invarianti,
  blocca tentativi iterativi a vuoto su test/build e applica rollback di sicurezza in caso di regressioni.
---

# Circuit Breaker Protocol & Loop Governor

## 1. Obiettivo
Durante la programmazione autonoma, gli agenti possono entrare in cicli ricorsivi di fix errati:
- Consumo esponenziale di token.
- Degrado della qualità del codice con hack e workaround temporanei.
- Tentativi ripetitivi basati sempre sulla medesima assunzione errata.

Questa skill stabilisce i circuit breaker quantitativi e il protocollo di interruzione.

---

## 2. Riconoscimento dell'Errore Invariante

1. **Tracciamento dell'Errore**:
   Prima di applicare una modifica correttiva, annotare il messaggio esatto, l'asserzione fallita e la riga di codice.
2. **Confronto Post-Modifica**:
   Se dopo la modifica il medesimo identico errore si ripresenta sulla stessa riga:
   - *Iterazione 1*: Ammesso formulare un approccio alternativo strutturato.
   - *Iterazione 2*: Se l'errore ricorre identico, **ATTIVARE IMMEDIATAMENTE IL CIRCUIT BREAKER**. Non tentare una terza volta.

---

## 3. Gestione Regressioni (Rollback Guard)

Se l'intervento correttivo causa il fallimento di test che precedentemente passavano con successo:
1. Annullare subito le ultime modifiche (`git checkout -- <file>` o ripristino del file).
2. Non tentare di "aggiustare la regressione" stratificando nuovo codice sullo stato corrotto.
3. Ripartire dall'ultimo stato funzionante verificato.

---

## 4. Procedura di Escalation per Stato STUCK

Quando scatta il circuit breaker:
1. Interrompere qualsiasi ulteriore modifica automatica ai file.
2. Presentare all'utente un report di escalation strutturato:
   - **Obiettivo Fallito**: File esatto, funzione o test non superato.
   - **Ipotesi Testate**: Sintesi dei tentativi effettuati nelle iterazioni precedenti.
   - **Causa Radice del Blocco**: Motivo per cui l'architettura o il contesto attuale rigetta la modifica.
   - **Due Alternative Architetturali**: Proporre 2 soluzioni pulite e strutturali (non workaround) chiedendo all'utente come preferisce procedere.

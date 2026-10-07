---
name: trace-debugging
description: >-
  Protocollo deterministico di localizzazione dei guasti tramite breadcrumb tracing e bisection debugging.
  Utilizza quando si verificano bug di interazione UI, discrepanze di stato, fallimenti di test o errori silenti.
---

# Trace-Based Fault Localization Runbook

## 1. Obiettivo
Sostituire tentativi casuali o congetture speculative con un metodo deterministico di tracciamento a ritroso che isola la causa radice del difetto in modo scientifico.

---

## 2. Flusso a 5 Passaggi

```
[Difetto Rilevato]
       │
       ▼
[1. Trace Instrumentation] ──► Iniezione log numerati lungo la catena causale
       │
       ▼
[2. Execution & Capture]   ──► Esecuzione del test/scenario e cattura output
       │
       ▼
[3. Fault Localization]    ──► Identificazione Last Known Good Checkpoint
       │
       ▼
[4. Targeted Resolution]   ──► Fix della sola finestra di codice isolata
       │
       ▼
[5. Cleanup & Verification] ──► Rimozione dei log [DEBUG-TRACE] e test finale
```

---

## 3. Guida Operativa

### Passo 1: Iniezione Checkpoint Numerati
Inserire log temporanei espliciti nei punti nodali del flusso:
```javascript
console.log('[DEBUG-TRACE #1] Evento innescato', { trigger, params });
console.log('[DEBUG-TRACE #2] Validazione precondizioni superata', { state });
console.log('[DEBUG-TRACE #3] Risultato computazione pura', { input, output });
console.log('[DEBUG-TRACE #4] Mutazione stato completata', { before, after });
console.log('[DEBUG-TRACE #5] Render/Aggiornamento interfaccia', { domResult });
```

### Passo 2: Esecuzione e Cattura
Eseguire il test unitario o la simulazione per catturare la sequenza temporale di emissione.

### Passo 3: Localizzazione del Guasto
1. Individuare il **Last Known Good Checkpoint** (il numero più alto che ha prodotto valori corretti).
2. La causa radice si trova rigorosamente tra l'ultimo checkpoint corretto e il successivo checkpoint mancante o corrotto.

### Passo 4: Risoluzione Mirata
Intervenire unicamente sul segmento isolato, evitando refactor a largo raggio mentre si risolve il bug specifico.

### Passo 5: Pulizia Totale e Verifica
- **Cancellazione log**: Rimuovere ogni occorrenza di `[DEBUG-TRACE]` dai file sorgente.
- **Verifica**: Eseguire la regressione completa per assicurare assenza di regressioni e console pulita.

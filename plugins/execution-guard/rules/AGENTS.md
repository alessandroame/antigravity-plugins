# Regole di Resilienza Operativa: Watchdog, Anti-Deadlock e Circuit Breaker (`execution-guard`)

Previene stalli dell'agente, task zombi in background e spreco di token in cicli di correzione ripetitivi.

## 1. Gestione Task Background e Watchdog (`schedule`)
1. **Priorità Sincrona**: per build e test (`npm test`, `node --test`), impostare sempre `WaitMsBeforeAsync: 10000`.
2. **Watchdog Obbligatorio (Divieto di Blind Turn Yielding)**: se un comando non-daemon scivola in background (`task-<id>`), invocare nello stesso turno `schedule` con `DurationSeconds: 90`, `TimerCondition: "<task-id>"` e `Prompt` di controllo (`manage_task(Action='status', TaskId='<task-id>')`). Terminare i task zombi (`Action='kill'`) dopo aver letto l'output.

## 2. Circuit Breaker Quantitativo e Rollback Guard
- **Errori di Build, Sintassi e Lint**: max **3** tentativi -> STOP, dichiarare STUCK, proporre rollback.
- **Test Unitari e Logica di Dominio**: max **5** tentativi -> STOP, fornire root-cause analysis.
- **Verifiche Visive / Headless Browser**: max **3** tentativi -> STOP, acquisire screenshot e diagnosticare il DOM.
- **Identico Errore (Stesso Messaggio/Linea)**: max **2** tentativi -> **INTERRUZIONE IMMEDIATA** (vietato un 3° tentativo).
- **Regression Rollback Guard**: se una modifica rompe test precedentemente verdi, eseguire subito `git checkout -- <file>` anziché stratificare patch.

## 3. Timeout Script Node.js (`45s`) e Mock Guard Offline
1. **Timeout di Processo**: negli script standalone impostare `setTimeout(() => { console.error('[FATAL TIMEOUT]'); process.exit(1); }, 45000).unref()` e chiudere browser/server in `finally`.
2. **Zero Chiamate Live nei Test**: i test automatici non devono mai effettuare chiamate HTTP reali verso API esterne (usare `?mock=1` / fixture offline `< 1s`).

# Regole di Resilienza Operativa: Watchdog, Anti-Deadlock e Circuit Breaker (`execution-guard`)

Previene stalli dell'agente, task zombi in background e spreco di token in cicli di correzione ripetitivi.

## 1. Gestione Task Background, Reactive Wakeup e Dead-Man Switch (`schedule`)
1. **Priorità Sincrona e Reactive Wakeup Nativo**: per build e test (`npm test`, `node --test`), impostare sempre `WaitMsBeforeAsync: 10000`. Per il normale completamento asincrono affidarsi al **Reactive Wakeup** nativo di Antigravity (vietato il polling manuale).
2. **Dead-Man Switch Anti-Freeze (Solo Processi a Rischio Stallo)**: se scivola in background (`task-<id>`) un comando soggetto a blocchi indefiniti (browser headless, socket/rete, child process senza timeout), affiancare al Reactive Wakeup un timer `schedule` di sicurezza (`DurationSeconds: 90`, `TimerCondition: "<task-id>"` che si auto-cancella se il task termina regolarmente) per ispezionare (`status`) e terminare (`kill`) eventuali processi zombi.

## 2. Circuit Breaker Quantitativo e Rollback Guard
- **Errori di Build, Sintassi e Lint**: max **3** tentativi -> STOP, dichiarare STUCK, proporre rollback.
- **Test Unitari e Logica di Dominio**: max **5** tentativi -> STOP, fornire root-cause analysis.
- **Verifiche Visive / Headless Browser**: max **3** tentativi -> STOP, acquisire screenshot e diagnosticare il DOM.
- **Identico Errore (Stesso Messaggio/Linea)**: max **2** tentativi -> **INTERRUZIONE IMMEDIATA** (vietato un 3° tentativo).
- **Regression Rollback Guard**: se una modifica rompe test precedentemente verdi, eseguire subito `git checkout -- <file>` anziché stratificare patch.

## 3. Timeout Script Node.js (`45s`) e Mock Guard Offline
1. **Timeout di Processo**: negli script standalone impostare `setTimeout(() => { console.error('[FATAL TIMEOUT]'); process.exit(1); }, 45000).unref()` e chiudere browser/server in `finally`.
2. **Zero Chiamate Live nei Test**: i test automatici non devono mai effettuare chiamate HTTP reali verso API esterne (usare `?mock=1` / fixture offline `< 1s`).

# Regole di Resilienza Operativa: Watchdog, Anti-Deadlock e Circuit Breaker

Questo documento definisce gli standard operativi vincolanti per prevenire stalli dell'agente, comandi zombi in background e spreco esponenziale di token in cicli di correzione ripetitivi.

---

## 1. Prevenzione Stalli e Gestione Task Background (Anti-Freeze)

1. **Priorità Esecuzione Sincrona**:
   - Per tutti i comandi di verifica, build, test e lint (`npm test`, `npx jest`, script ad-hoc), impostare sempre `WaitMsBeforeAsync: 10000` per massimizzare il completamento sincrono ed evitare la dispersione in background.
2. **Divieto di Cessione Cieca del Turno (Blind Turn Yielding)**:
   - È severamente vietato terminare il turno di risposta dell'agente con frasi di attesa passiva (es. *"Sto eseguendo in background, attendo il completamento..."*) senza un meccanismo attivo di risveglio programmato.
3. **Watchdog Obbligatorio su Task Asincroni (`schedule`)**:
   - Ogni volta che un comando o script non-daemon scivola in un task in background (`task-<id>`), l'agente **DEVE** chiamare nello stesso turno il tool `schedule`:
     ```json
     {
       "DurationSeconds": 90,
       "TimerCondition": "<task-id>",
       "Prompt": "Watchdog: Il task <task-id> ha superato il tempo atteso di runtime (90s). Esegui manage_task(Action='status', TaskId='<task-id>') per ispezionare i log e terminare se bloccato."
     }
     ```
   - **Comportamento**: Se il task termina con successo prima dei 90s, Antigravity cancella il timer automaticamente. Se il task si blocca, il timer si attiva risvegliando l'agente per la diagnosi e il ripristino autonomo.
4. **Pulizia dei Task Zombi**:
   - Nessun task temporaneo deve rimanere attivo al termine della lavorazione: invocare tempestivamente `manage_task(Action='kill', TaskId=...)` dopo aver recuperato i log o l'output.

---

## 2. Circuit Breaker Quantitativo Salva-Token

Durante la risoluzione autonoma di bug o test falliti, l'agente deve rispettare i seguenti massimali rigidi di iterazione:

| Categoria del Task | Massimale Iterazioni | Azione al Superamento del Limite |
| :--- | :---: | :--- |
| **Errori di Build, Sintassi e Lint** | **3** | STOP, dichiarare stato STUCK, proporre rollback |
| **Test Unitari e Logica di Dominio** | **5** | STOP, fornire root-cause analysis, chiedere guida all'utente |
| **Verifiche Visive / Headless Browser** | **3** | STOP, acquisire screenshot, diagnosticare ostacoli nel DOM |
| **Identico Errore (Stesso Messaggio/Linea)** | **2** | **INTERRUZIONE IMMEDIATA** (vietato tentare una 3ª volta) |

### Regression Rollback Guard
- Se una modifica al codice provoca il fallimento di test precedentemente funzionanti (introduzione di nuove regressioni):
  - Eseguire immediatamente il rollback della modifica (tramite ripristino file o `git checkout -- <file>`).
  - È vietato stratificare ulteriori modifiche correttive sopra uno stato già regredito.

---

## 3. Timeout Rigidi negli Script Node.js

Ogni script di test, crawler o automazione standalone deve contenere una guardia a livello di processo:

```javascript
const SCRIPT_TIMEOUT_MS = 45000;
const safetyWatchdog = setTimeout(() => {
  console.error(`[FATAL TIMEOUT] Script ha superato il timeout rigido di ${SCRIPT_TIMEOUT_MS / 1000}s. Uscita forzata.`);
  process.exit(1);
}, SCRIPT_TIMEOUT_MS);
safetyWatchdog.unref(); // Permette al runtime Node di uscire naturalmente se il lavoro termina prima
```

I processi figli generati (browser headless, WebSocket, server) devono essere sempre chiusi all'interno di un blocco `finally`, assicurando l'invocazione esplicita di `process.exit(0)` o `process.exit(1)`.

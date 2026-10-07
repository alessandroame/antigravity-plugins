---
name: task-watchdog
description: >-
  Previene stalli di esecuzione dell'agente e task zombi durante l'esecuzione di comandi asincroni,
  test lunghi o script headless. Utilizza quando un comando scivola in background, quando si configura un timer
  di sicurezza o quando si diagnostica un processo che non risponde.
---

# Task Watchdog & Anti-Freeze Runbook

## 1. Il Problema: Stalli Silenti dei Task in Background
Quando un comando eseguito con `run_command` supera il tempo di `WaitMsBeforeAsync`, Antigravity sposta l'esecuzione in un task in background (`task-<id>`).
Se tale processo si blocca (ad es. attesa indefinita su selettore DOM, WebSocket o child process non terminato):
- Il task non termina mai autonomamente.
- Antigravity non riceve notifiche di fine esecuzione.
- Se l'agente ha terminato il turno con "Attendo...", la sessione rimane congelata fino a un intervento manuale dell'utente.

---

## 2. La Regola Aurea: Mai Cedere il Turno Senza Watchdog

Ogni volta che un comando non-daemon scivola in background:
1. **Schedulare immediatamente un timer di risveglio** con il tool `schedule`:
   ```json
   {
     "DurationSeconds": 90,
     "TimerCondition": "<task-id>",
     "Prompt": "Watchdog: Il task <task-id> ha superato il tempo previsto (90s). Esegui manage_task(Action='status', TaskId='<task-id>') per ispezionare i log e terminare se bloccato."
   }
   ```
2. **Come opera `TimerCondition="<task-id>"`**:
   - **Completamento regolare**: Se il task termina prima dei 90s, Antigravity **cancella automaticamente** il timer. Nessun disturbo o messaggio extra.
   - **Stallo/Blocco**: Se il task si blocca, allo scadere dei 90s il timer si attiva, risvegliando l'agente per l'intervento correttivo.

---

## 3. Procedura Autonoma di Diagnosi e Recupero

Quando l'agente viene risvegliato dal watchdog o deve verificare lo stato di un task:

1. **Elenco dei task attivi**:
   Invocare `manage_task(Action="list")`.
2. **Ispezione del task sospetto**:
   Invocare `manage_task(Action="status", TaskId="<task-id>")`.
3. **Lettura del tail dei log**:
   Leggere le ultime righe del file indicato in `logUri` tramite `view_file` per localizzare l'istruzione in cui il processo si è fermato.
4. **Terminazione forzata**:
   Invocare `manage_task(Action="kill", TaskId="<task-id>")`.
5. **Report trasparente**:
   Dichiarare all'utente al primo rigo del messaggio il task terminato e la causa riscontrata.

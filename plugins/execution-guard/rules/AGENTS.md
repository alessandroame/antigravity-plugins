# Regole di Resilienza Operativa: Watchdog, Anti-Deadlock e Circuit Breaker

Questo documento definisce gli standard per prevenire stalli dell'agente, task zombi in background e spreco di token in cicli di correzione ripetitivi.

---

## 1. Prevenzione Stalli e Gestione Task Background (Anti-Freeze)

1. **Priorità Esecuzione Sincrona**: per comandi di verifica, build e test (`npm test`, `node --test`), impostare sempre `WaitMsBeforeAsync: 10000`.
2. **Divieto di Blind Turn Yielding**: vietato terminare il turno in attesa passiva di un comando in background senza un timer di risveglio attivo.
3. **Watchdog Obbligatorio su Task Asincroni (`schedule`)**:
   - Ogni volta che un comando non-daemon scivola in background (`task-<id>`), invocare nello stesso turno `schedule` con `DurationSeconds: 90`, `TimerCondition: "<task-id>"` e `Prompt` di controllo (`manage_task(Action='status', TaskId='<task-id>')`).
4. **Pulizia Task Zombi**: terminare i task temporanei (`manage_task(Action='kill', TaskId=...)`) subito dopo aver recuperato l'output.

---

## 2. Circuit Breaker Quantitativo Salva-Token

Rispettare i seguenti massimali rigidi di iterazione durante la correzione di bug o test:

| Categoria del Task | Max Iterazioni | Azione al Superamento |
| :--- | :---: | :--- |
| **Errori di Build, Sintassi e Lint** | **3** | STOP, dichiarare stato STUCK, proporre rollback |
| **Test Unitari e Logica di Dominio** | **5** | STOP, fornire root-cause analysis, chiedere guida |
| **Verifiche Visive / Headless Browser** | **3** | STOP, acquisire screenshot, diagnosticare il DOM |
| **Identico Errore (Stesso Messaggio/Linea)** | **2** | **INTERRUZIONE IMMEDIATA** (vietato un 3° tentativo) |

- **Regression Rollback Guard**: se una modifica rompe test precedentemente funzionanti, eseguire subito il rollback (`git checkout -- <file>`) anziché stratificare patch sopra uno stato regredito.

---

## 3. Timeout Rigidi negli Script Node.js e Mock Guard API Esterne

1. **Guardia Timeout di Processo (`45s`)**:
   - Negli script standalone impostare `setTimeout(() => { console.error('[FATAL TIMEOUT]'); process.exit(1); }, 45000).unref()` e chiudere browser/server in un blocco `finally`.
2. **Divieto di Chiamate Live nei Test Automatici**:
   - I test automatizzati e i crawler headless non devono **mai** effettuare chiamate HTTP reali verso API esterne soggette a rate limit (HTTP 429) o tariffazione (meteo, tile mappe, geocoding, LLM).
   - Usare sempre mock/fixture deterministiche offline (`?mock=1`, `NODE_ENV=test`), garantendo esecuzione offline < 1s.

---

## 4. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Il comando è in background ma finirà tra poco, chiudo il turno senza timer."* | Vietato il *blind turn yielding*: invocare sempre `schedule` con `TimerCondition: "<task-id>"` nello stesso turno. |
| *"Ho avuto lo stesso errore 2 volte, provo una 3ª modifica."* | Al 2° errore identico scatta lo stop obbligatorio del Circuit Breaker. |
| *"Il nuovo codice ha rotto un test, aggiungo una patch sopra."* | Scatta il *Regression Rollback Guard*: ripristinare lo stato funzionante prima di riprogettare. |
| *"Faccio una sola chiamata HTTP reale nel test automatico."* | I test automatici devono operare al 100% con mock/fixture offline (`?mock=1`). |

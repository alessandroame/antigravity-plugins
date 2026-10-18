# Protocollo di Tutela Cognitiva e Limite WIP Umano (`human-governor`)

Questo documento governa la protezione dell'operatore umano dal sovraccarico da orchestrazione asincrona: troppi WIP contemporanei, ping-pong compulsivo tra chat (`context thrashing`), micro-management al posto di `/goal` e sessioni in fascia di coprifuoco notturno.

---

## 1. Intercettazione Automatica Pre-Invocazione (`[HUMAN-GOVERNOR ALERT]`)

Il plugin monitora le sessioni attive in `~/.gemini/antigravity/brain/` e lo storico turni tramite l'hook `PreInvocation` (`scripts/governor-hook.mjs`). Quando l'hook inietta nel contesto il segnale `[HUMAN-GOVERNOR ALERT — STATUS: WARN|CRITICAL]`:

1. **Blocco Preventivo e Confronto Diretto (`ask_question` Obbligatorio)**:
   - **Vietato ignorare l'alert ed eseguire subito il task**.
   - Prima di qualsiasi analisi o modifica codice, invocare immediatamente `ask_question` riportando le metriche reali rilevate dall'hook (`WIP attivi`, `cambi chat/10m`, `prompt/60m`, `minuti consecutivi` o `orario in coprifuoco`).
   - Formulare la domanda in modo diretto e senza filtri diplomatici, come richiesto dall'utente:
     *"Rilevati [N] WIP attivi in parallelo [e/o violazione rilevata]. Sei veramente un pirla che vuole fare la scimmia di smistamento per i suoi LLM, o chiudiamo prima i WIP in eccesso?"*
2. **Opzioni Standard del Modal `ask_question`**:
   - `(Recommended) Parcheggia questo task: chiudo o consolido prima gli altri WIP con /take-note o /memory-sync`
   - `Converti questa richiesta in un task autonomo (/goal) così non devo fare da babysitter passo-passo`
   - `Procedi comunque (Modalità Pirla Consapevole): esegui il task e silencia l'avviso per 30 minuti`
3. **Gestione della Scelta dell'Utente**:
   - Se sceglie **Parcheggia**: salvare una riga in `NOTES.md` (se presente nel workspace) o fornire il riepilogo di una riga per riprendere più tardi e fermarsi.
   - Se sceglie **Converti in `/goal`**: strutturare il criterio di verifica finale ed eseguire la lavorazione fino a completamento senza richiedere micro-conferme intermedie.
   - Se sceglie **Procedi comunque**: eseguire `node C:/Users/aless/.gemini/config/plugins/human-governor/scripts/status.mjs --snooze 30` ed eseguire regolarmente il task richiesto.

---

## 2. Soglie Predefinite e Comandi di Configurazione (`/focus-audit`)

| Parametro | Soglia Default | Significato Operativo |
| :--- | :---: | :--- |
| **`maxConcurrentWip`** | **`2` sessioni** | Numero massimo di conversazioni attive negli ultimi `30` minuti (`CRITICAL` da `4+`). |
| **`maxSwitchesPer10Min`** | **`4` cambi** | Rimbalzi tra conversazioni distinte in `10` minuti (`Context Thrashing`). |
| **`maxPromptsPerHour`** | **`25` prompt/h** | Micro-gestione compulsiva passo-passo anziché delega strutturata. |
| **`maxContinuousMinutes`** | **`120` min** | Lavoro continuo senza una pausa di almeno `20` minuti. |
| **`curfewWindow`** | **`22:30–07:00`** | Fascia notturna in cui l'avvio di nuovi task fa scattare l'allerta `CRITICAL`. |

---

## 3. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Vedo `[HUMAN-GOVERNOR ALERT]` ma il task è veloce, rispondo senza `ask_question`."* | Se l'hook inietta l'alert, `ask_question` deve bloccare il flusso prima di eseguire il task. |
| *"Uso un tono formale ed edulcorato nella domanda di blocco."* | Rispettare il contratto di franchezza richiesto dall'utente citando i numeri esatti di WIP e cambi contesto. |
| *"L'utente ha scelto lo snooze ma non aggiorno lo stato su disco."* | Eseguire `status.mjs --snooze 30` per registrare realmente il silenziamento temporaneo. |

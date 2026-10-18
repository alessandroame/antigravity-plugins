# Prontuario Coaching Antigravity: Comandi Slash, Contesto e Subagent

Questo riferimento fornisce i pattern pronti all'uso per guidare l'utente nell'uso ottimale di Google Antigravity (AGY) esattamente nel momento in cui si manifesta un attrito di workflow.

---

## 1. Matrice Diagnostica: Dal Sintomo Utente al Comando Compilato

| Sintomo / Situazione Reale | Comando Consigliato | Template Pronto da Mostrare all'Utente (Copia-Incolla) |
| :--- | :--- | :--- |
| **Requisiti con buchi logici**: l'utente chiede una nuova feature complessa ma non specifica casi limite, permessi o formato dati. | `/grill-me` | `/grill-me Voglio implementare [feature] in @[file]: fammi le domande necessarie per chiarire i casi limite prima di scrivere codice.` |
| **Modifica rischiosa su più file**: l'utente chiede un refactoring che tocca architettura, stato e UI in un colpo solo. | `/plan` | `/plan Progetta la modifica di @[file-core] e @[file-ui] verificando l'impatto sui test esistenti prima di applicare le patch.` |
| **Tensione tra pulizia tecnica e semplicità d'uso**: la feature rischia di diventare troppo astratta o scomoda per l'utente finale. | `/skizzo` | `/skizzo Progetta [feature] bilanciando isolamento del motore interno e minimo numero di click per l'utente.` |
| **Prompt troppo sintetico**: l'utente scrive 4 parole (*"sistema la validazione form"*) lasciando tutto implicito. | `/boost` | `/boost Sistema la validazione in @[file] gestendo input sporchi e verificando i test.` |
| **Task lungo o iterativo (es. fix di una suite di test o migrazione)**: serve che l'agente non si fermi finché tutto non passa. | `/goal` | `/goal Porta al 100% di successo la suite [comando test] correggendo le regressioni in @[cartella] senza alterare le API pubbliche.` |
| **Sessione appesantita (> 25-30 turni) o cambio tema**: l'agente rallenta o confonde dettagli di task precedenti. | `/compact` | `/compact` *(seguito nel turno successivo dal nuovo prompt mirato con `@file`)* |
| **Correzione ripetuta all'agente**: l'utente segnala per la 2ª volta un errore di stile o di metodo dell'agente. | `/learn` | `/learn Quando modifichi [ambito], rispetta sempre [regola esplicita] e verifica con [comando].` |
| **Dubbio sul valore reale di una skill o di un prompt**: l'utente vuole sapere se una formulazione complessa vale il tempo speso. | `/ab-bench` | `/ab-bench --skill [nome-skill] [compito da testare alla cieca]` |
| **Controllo periodico o promemoria operativo**: l'utente vuole monitorare un processo o ripetere un check a intervalli regolari. | `/schedule` | `/schedule Verifica ogni [intervallo] lo stato di [target] e segnala eventuali anomalie.` |
| **Progetto ampio divisibile in sottocompiti indipendenti**: più moduli possono essere sviluppati in parallelo. | `/teamwork-preview` | `/teamwork-preview Suddividi l'implementazione di @[modulo-a] e @[modulo-b] tra agenti autonomi coordinati.` |

---

## 2. Igiene della Context Window e Uso di `@file` vs Subagent

1. **Iniezione Chirurgica con `@file`**:
   - *Problema*: scrivere *"cerca dove viene calcolato il prezzo e correggilo"* costringe l'agente a 4-6 chiamate di ricerca esplorative, consumando migliaia di token e alzando la latenza.
   - *Coaching*: mostrare sempre nel **Prompt Ottimizzato** la menzione diretta `@percorso/del/file.ext` (o il simbolo esatto) scoperta durante il turno corrente, così l'utente impara a puntare dritto al bersaglio.
2. **Isolamento delle Ricerche Esplorative nei Subagent (`research`)**:
   - *Problema*: leggere 15 file nella conversazione principale per capire come funziona una libreria inquina permanentemente la context window della sessione.
   - *Coaching*: quando l'utente deve fare un'indagine ampia prima di decidere, consigliare di delegare la ricognizione a un subagent `research` che restituisca solo una sintesi di 15 righe alla chat principale.
3. **Igiene del Cambio Contesto (`/compact` o Nuova Chat)**:
   - *Problema*: accodare 4 feature diverse nella stessa chat porta a *context poisoning* (vincoli del primo task applicati erroneamente al quarto).
   - *Coaching*: a fine task strutturale, suggerire `/memory-sync` seguito da `/compact` (o apertura di una nuova chat con `/next-step`).

# Regole di Telemetria, Stima ETA In-Flight e Riservatezza Dati

Questo documento definisce i criteri operativi per la gestione delle metriche di utilizzo dei plugin, il protocollo di emissione dell'ETA (Estimated Time of Arrival) durante le lavorazioni e la riservatezza dei dati nel runtime di Antigravity.

---

## 1. Principi di Trasparenza Metrica e Sobrietà
1. **Misurazioni Oggettive**:
   - Riportare i valori temporali in millisecondi (`ms`) o secondi (`s`), con metriche quantitative dimostrate (`calls`, `success rate`, `tokens`, `elapsed`).
   - Evitare qualsiasi aggettivazione enfatica o stime arbitrarie non ancorate ai log di esecuzione o all'orologio iniettato da `[TELEMETRY-ETA-CLOCK]`.
2. **Visibilità degli Errori**:
   - Dichiarare apertamente i fallimenti dei tool di sistema, gli scostamenti tra ETA stimata e tempo reale e i tassi di successo senza omissioni o arrotondamenti compiacenti.

---

## 2. Protocollo di Stima ETA In-Flight (Doppio Canale + Fast-Path Silence)

Ad ogni turno, l'hook `PreInvocation` (`eta-injector.mjs`) inietta un messaggio effimero `[TELEMETRY-ETA-CLOCK]` contenente l'ora attuale (`Now`), l'ora di avvio del prompt (`PromptStart`), il tempo trascorso (`Elapsed`), il numero di invocazione e i parametri storici (`Baseline` e `Calibration`).

### 2.1 Filtro Anti-Rumore per Risposte Corte (Fast-Path Silence)
- **Condizione di Silenzio**: Se il prompt dell'utente richiede una risposta conversazionale diretta (0 tool) o si risolve in un singolo passaggio immediato (`< 10s`, $\le 1$ tool call di sola lettura senza fasi successive), **non stampare alcuna riga ETA** in chat né prefissare i tool.

### 2.2 Emissione Obbligatoria su Lavorazioni Multi-Step ($\ge 2$ step operativi / tool)
Quando la richiesta richiede una lavorazione articolata ($\ge 2$ tool call, modifiche a file, esecuzione test, audit o più turni di ragionamento), applicare obbligatoriamente **entrambi i canali**:

1. **Canale 1 — Riga di Stato ETA in Chat (All'avvio e ai cambi di fase)**:
   - Prima di invocare il primo blocco di tool (e ad ogni successivo cambio di fase nei turni intermedi), emettere in chat una riga di stato compatta su singola linea:
     ```markdown
     `[ETA: ~45s (Fine stimata: 20:15:10) | Elapsed: 0s | Fase 1/3: Analisi codice e manifest]`
     ```
   - Nei turni intermedi successivi (`Invocation #2, #3...`), aggiornare la riga ricalcolando il tempo residuo sulla base dell'`Elapsed` reale fornito da `[TELEMETRY-ETA-CLOCK]`:
     ```markdown
     `[ETA residuo: ~20s (Fine stimata: 20:15:08) | Elapsed: 23s | Fase 2/3: Modifica script e regole]`
     ```
   - Nella risposta conclusiva di consegna della lavorazione, riportare in calce il consuntivo:
     ```markdown
     `[Completato in 39s | ETA iniziale: ~45s | Scostamento: -6s (-13.3%)]`
     ```

2. **Canale 2 — Avanzamento ed ETA nelle Pill dei Tool (`toolAction` e `toolSummary`)**:
   - Ogni chiamata ai tool (`view_file`, `replace_file_content`, `write_to_file`, `run_command`, ecc.) eseguita durante una lavorazione multi-step deve iniziare con il prefisso `[Fase/Tot · ETA ~Ns]`:
     - `toolAction`: `"[1/3 · ETA ~40s] Reading collector script"`
     - `toolSummary`: `"[1/3 · ETA ~40s] Read collector script"`

### 2.3 Baseline di Calcolo per la Stima
Per stimare l'ETA, sommare i pesi delle operazioni previste e moltiplicare per il fattore `Calibration` indicato da `[TELEMETRY-ETA-CLOCK]`:
- **Lettura / Ricerca** (`view_file`, `grep_search`, `find_by_name`): `3s – 5s` per batch parallelo.
- **Scrittura / Patch codice** (`replace_file_content`, `write_to_file`): `6s – 10s` per batch.
- **Comandi CLI / Suite di Test** (`run_command`): `8s – 20s` per comando.
- **Sintesi LLM per turno**: `4s – 7s` per invocazione.

---

## 3. Architettura Ibrida e Riservatezza Locale
1. **Confini di Persistenza**:
   - Tutti i dati di telemetria e i cursori di stato (`.cursor_*`, `.eta_*`) risiedono esclusivamente nel filesystem locale dell'utente (`~/.gemini/antigravity/analytics/`).
   - È severamente vietato trasmettere eventi di telemetria, payload di log o percorsi a endpoint di rete esterni.
2. **Isolamento Workspace**:
   - Quando si presentano report su richiesta dell'utente, limitare la visualizzazione predefinita al workspace corrente, a meno che l'utente non richieda esplicitamente la vista globale cross-project.

# Regole di Telemetria, Stima ETA In-Flight e Riservatezza Dati

Questo documento definisce i criteri operativi per la gestione delle metriche di utilizzo dei plugin, il protocollo di emissione dell'ETA (Estimated Time of Arrival) riferito all'intera lavorazione e la riservatezza dei dati nel runtime di Antigravity.

---

## 1. Principi di Trasparenza Metrica e Sobrietà
1. **Misurazioni Oggettive**:
   - Riportare i valori temporali in millisecondi (`ms`) o secondi (`s`), con metriche quantitative dimostrate (`calls`, `success rate`, `tokens`, `elapsed`).
   - Evitare qualsiasi aggettivazione enfatica o stime arbitrarie non ancorate ai log di esecuzione.
2. **Visibilità degli Errori**:
   - Dichiarare apertamente i fallimenti dei tool di sistema, gli scostamenti tra ETA stimata e tempo reale e i tassi di successo senza omissioni o arrotondamenti compiacenti.

---

## 2. Protocollo di Stima ETA Complessiva (Badge + Semaforo sui Checkpoint)

L'indicazione dell'ETA riguarda **esclusivamente il tempo residuo per completare l'intera lavorazione richiesta dall'utente**, mai la durata del singolo step o del singolo tool.

### 2.1 Formato Visivo Ad Alto Contrasto: Badge + Semaforo (`【🟢/🟡/🔴 ETA tot ~Ns】`)
Poiché la UI di Antigravity renderizza `toolAction` e `toolSummary` come nodi di testo puro (`textContent`) ignorando CSS, HTML o codici ANSI, l'ETA deve essere formattata con **parentesi lenticolari piene `【...】` + semaforo semantico di durata** per garantire risalto immediato:
- `【🟢 ETA tot ~15s】` — **Fascia Breve** ($15\text{s} \le \text{ETA} \le 20\text{s}$)
- `【🟡 ETA tot ~40s】` — **Fascia Media** ($21\text{s} \le \text{ETA} \le 60\text{s}$)
- `【🔴 ETA tot ~90s】` — **Fascia Lunga** ($\text{ETA} > 60\text{s}$)

### 2.2 Quando Emettere la Prima Stima (Soglia Massima 2° Turno)
1. **Silenzio al 1° Turno Esplorativo, Domande Utente e Task Brevi**:
   - Al **1° turno** di ricognizione iniziale (prima lettura file per inquadrare il problema), mentre si attende una risposta dall'utente (`ask_question`) o per lavorazioni rapide (`< 15s` complessivi), **non emettere alcuna ETA**.
2. **Obbligo di Prima Emissione entro il 2° Turno Operativo**:
   - **Entro e non oltre il 2° turno di chiamate tool** (o già al 1° turno se il perimetro è noto fin dal prompt), se il tempo totale residuo per completare l'intera lavorazione è $\ge 15\text{s}$, l'agente **DEVE** emettere la prima stima complessiva nel formato `【🟢/🟡/🔴 ETA tot ~Ns】`.
   - È vietato procrastinare la prima stima oltre il 2° turno anche durante sessioni di debug o ricerca multi-file.

### 2.3 Visibilità Persistente sui Soli Tool di Svolta (`toolAction` + `toolSummary` Accoppiati)
Nella UI di Antigravity, `toolAction` è visibile solo per poche centinaia di millisecondi durante l'esecuzione del tool e viene subito sostituito da `toolSummary`, mentre le letture consecutive (`view_file`) vengono collassate nel gruppo `Explored N files >`. Per garantire che l'ETA sia sempre visibile all'utente senza inquinare ogni riga dello storico:

1. **Accoppiamento `toolAction` + `toolSummary` sul Singolo Tool di Checkpoint**:
   - Quando si emette la prima stima o quando la stima viene ricalibrata, inserire il badge `【🟢/🟡/🔴 ETA tot ~Ns】` **sia in `toolAction` sia in `toolSummary` di un unico tool del turno**:
     - `toolAction`: `"<Descrizione azione> 【🟡 ETA tot ~40s】"`
     - `toolSummary`: `"<Descrizione azione> 【🟡 ETA tot ~40s】"`
   - Nei batch di sole letture (`view_file`), applicare il badge sull'**ultimo tool del batch** (così resta visibile più a lungo nello spinner e in fondo al gruppo).
2. **Ancoraggio Obbligatorio sul Primo Tool Operativo Top-Level (Uscita da `Explored files >`)**:
   - Poiché i gruppi `view_file` vengono chiusi automaticamente da Antigravity, al passaggio dalla ricognizione alla fase operativa (**primo `replace_file_content`, `write_to_file` o `run_command` di modifica/verifica**), riportare l'ETA residua aggiornata (`【🟢/🟡/🔴 ETA tot ~Ns】`) in `toolAction` e `toolSummary` di quel primo tool operativo (che resta sempre visibile in primo piano nella colonna di chat).
3. **Silenzio su Tutti gli Altri Tool e nel Testo Chat**:
   - Tutti gli altri tool del task devono mantenere `toolAction` e `toolSummary` privi di ETA.
   - Emettere un nuovo aggiornamento di `【🟢/🟡/🔴 ETA tot ~Ns】` **solo se** la previsione residua varia in modo significativo rispetto all'ultima stima visibile ($\ge 15\text{s}$ o $\ge 30\%$).
   - Non stampare righe `[ETA...]` nel corpo testuale dei messaggi di chat.

### 2.4 Baseline di Calcolo per l'Intera Lavorazione
Sommare il peso di tutti i passaggi rimanenti fino al termine dell'intera lavorazione:
- **Turno di lettura / ricerca**: `3s – 5s` per batch parallelo.
- **Turno di modifica file** (`replace_file_content`, `write_to_file`): `6s – 10s` per batch.
- **Comandi CLI / Suite di Test** (`run_command`): `8s – 20s` per comando.
- **Sintesi risposta finale LLM**: `5s – 8s`.

---

## 3. Architettura Ibrida, Governance Anti-Bloat e Riservatezza Locale
1. **Confini di Persistenza e Contenimento Disco (`~/.gemini/antigravity/analytics/`)**:
   - Tutti i dati di telemetria e i cursori di stato (`.cursor_*`, `.eta_*`) risiedono esclusivamente nel filesystem locale dell'utente.
   - Alla finalizzazione del task (`Stop` / `--finalize`), `collector.mjs` applica il **TTL Garbage Collection (`7 giorni`)** rimuovendo i file `.cursor_*.json` e `.eta_*.json` inattivi e ruota `events.ndjson` in `events.archive.ndjson` al superamento di **5 MB** (preservando le metriche cumulative in `metrics-summary.json`).
   - È severamente vietato trasmettere eventi di telemetria, payload di log o percorsi a endpoint di rete esterni.
2. **Isolamento Workspace**:
   - Quando si presentano report su richiesta dell'utente, limitare la visualizzazione predefinita al workspace corrente, a meno che l'utente non richieda esplicitamente la vista globale cross-project.

---

## 4. Tabella di Anti-Razionalizzazione (Visibilità ETA)

| Razionalizzazione Interna dell'Agente (Vietata) | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Sto ancora cercando la causa del bug nel CSS, aspetto di aver trovato la soluzione prima di emettere l'ETA."* | Vietato superare il 2° turno di tool senza stima: se il task dura $\ge 15\text{s}$, emettere la prima stima `【🟢/🟡/🔴 ETA tot ~Ns】` entro il 2° turno e ricalibrarla se necessario. |
| *"Metto `【🟡 ETA tot ~40s】` solo in `toolAction` e lascio `toolSummary` senza ETA."* | `toolAction` scompare dopo `< 1s` a fine tool: sul singolo tool di svolta/checkpoint, `【🟢/🟡/🔴 ETA tot ~Ns】` va scritto sia in `toolAction` sia in `toolSummary`. |
| *"Scrivo `· ETA tot ~40s` senza parentesi `【...】` né semaforo per fare prima."* | Senza il badge `【🟢/🟡/🔴 ETA tot ~Ns】` la stima si confonde con il testo del tool: usare sempre le parentesi lenticolari `【...】` e il semaforo di fascia (`🟢` $\le 20\text{s}$, `🟡` $21\text{–}60\text{s}$, `🔴` $> 60\text{s}$). |
| *"Ho già messo l'ETA su un `view_file`, non serve rimetterla sul primo `replace_file_content`."* | I `view_file` finiscono collassati dentro `Explored N files >`: riportare sempre la stima residua sul primo tool operativo top-level (`replace_file_content`, `write_to_file`, `run_command`). |

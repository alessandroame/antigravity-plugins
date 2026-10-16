# Regole di Telemetria, Stima ETA In-Flight e Riservatezza Dati

Questo documento definisce i criteri per la gestione delle metriche di utilizzo, il protocollo di emissione dell'ETA riferito all'intera lavorazione e la riservatezza dei dati locali.

---

## 1. Principi di Trasparenza Metrica e Sobrietà
1. **Misurazioni Oggettive**: riportare i tempi in `ms` o `s` con metriche quantitative dimostrate (`calls`, `success rate`, `tokens`, `elapsed`), senza stime arbitrarie né aggettivi enfatici.
2. **Visibilità degli Errori**: dichiarare apertamente i fallimenti dei tool e gli scostamenti tra ETA stimata e tempo reale.

---

## 2. Protocollo di Stima ETA Complessiva (`【🟢/🟡/🔴 ETA tot ~Ns】`)

L'ETA indica **esclusivamente il tempo residuo per completare l'intera lavorazione richiesta dall'utente**, mai la durata del singolo step.

### 2.1 Formato Visivo Ad Alto Contrasto: Badge + Semaforo
Usare parentesi lenticolari piene `【...】` e semaforo di fascia:
- `【🟢 ETA tot ~15s】` — **Fascia Breve** ($15\text{s} \le \text{ETA} \le 20\text{s}$)
- `【🟡 ETA tot ~40s】` — **Fascia Media** ($21\text{s} \le \text{ETA} \le 60\text{s}$)
- `【🔴 ETA tot ~90s】` — **Fascia Lunga** ($\text{ETA} > 60\text{s}$)

### 2.2 Quando Emettere la Prima Stima (Entro il 2° Turno)
1. **Silenzio al 1° Turno Esplorativo, Domande e Task Brevi**: al 1° turno di ricognizione, in attesa di `ask_question` o per task rapidi ($< 15\text{s}$), non emettere ETA.
2. **Obbligo entro il 2° Turno Operativo**: entro e non oltre il 2° turno di chiamate tool (o al 1° se il perimetro è già noto), se il tempo residuo totale è $\ge 15\text{s}$, emettere la stima `【🟢/🟡/🔴 ETA tot ~Ns】`.

### 2.3 Visibilità Persistente sui Tool di Svolta (`toolAction` + `toolSummary` Accoppiati)
1. **Accoppiamento sul Singolo Tool di Checkpoint**: scrivere il badge `【🟢/🟡/🔴 ETA tot ~Ns】` **sia in `toolAction` sia in `toolSummary`** di un unico tool del turno (sull'ultimo tool nei batch di soli `view_file`).
2. **Ancoraggio sul Primo Tool Operativo Top-Level**: poichè i gruppi `view_file` vengono collassati in `Explored N files >`, riportare l'ETA residua aggiornata in `toolAction` e `toolSummary` del **primo `replace_file_content`, `write_to_file` o `run_command`**.
3. **Silenzio sugli Altri Tool e in Chat**: lasciare privi di ETA tutti gli altri tool del turno; aggiornare la stima solo se varia di $\ge 15\text{s}$ o $\ge 30\%$; non stampare righe `[ETA...]` nel testo della chat.

### 2.4 Baseline di Calcolo per l'Intera Lavorazione
Sommare i passaggi residui: lettura/ricerca `3–5s` per batch; modifica file `6–10s` per batch; comandi CLI/test `8–20s`; sintesi risposta finale `5–8s`.

---

## 3. Governance Anti-Bloat e Riservatezza Locale (`~/.gemini/antigravity/analytics/`)
1. **Persistenza Locale e Rotazione**: tutti i dati risiedono solo in locale. A fine task (`collector.mjs`), il TTL Garbage Collection (`7 giorni`) rimuove i cursori `.cursor_*`/`.eta_*` inattivi e ruota `events.ndjson` in `events.archive.ndjson` oltre **5 MB**. Vietato trasmettere telemetria in rete.
2. **Isolamento Workspace**: limitare i report al workspace corrente salvo richiesta esplicita di vista globale.

---

## 4. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Cerco ancora il bug, emetterò l'ETA dopo."* | Vietato superare il 2° turno di tool senza stima se il task dura $\ge 15\text{s}$. |
| *"Metto l'ETA solo in `toolAction` e non in `toolSummary`."* | `toolAction` scompare a fine tool: sul tool di checkpoint l'ETA va sia in `toolAction` sia in `toolSummary`. |
| *"Ho messo l'ETA su `view_file`, non la rimetto su `replace_file_content`."* | I `view_file` collassano in `Explored files >`: riportare l'ETA sul primo tool operativo top-level. |

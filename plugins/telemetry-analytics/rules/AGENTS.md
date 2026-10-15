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

## 2. Protocollo di Stima ETA Complessiva (Solo se Attendibile e Variata)

L'indicazione dell'ETA riguarda **esclusivamente il tempo residuo per completare l'intera lavorazione richiesta dall'utente**, mai la durata del singolo step o del singolo tool. Deve comparire **solo quando la stima complessiva diventa attendibile** e **solo quando varia in modo significativo rispetto all'indicazione precedente**.

### 2.1 Quando la Stima è Attendibile (Divieto di Stima al Buio)
1. **Silenzio in Ricognizione, Domande Utente e Task Brevi**:
   - Durante i primi step esplorativi (lettura file per comprendere il problema) o mentre si attende una risposta dall'utente (`ask_question`), il perimetro dell'intera lavorazione non è ancora noto: **non emettere alcuna ETA**.
   - Se l'intera lavorazione richiede meno di `15s` complessivi o si risolve in una risposta diretta, **non emettere alcuna ETA**.
2. **Prima Emissione (Perimetro dell'Intera Lavorazione Definito)**:
   - Non appena l'agente ha acquisito gli elementi necessari e conosce il piano completo fino alla conclusione (file da modificare, test/comandi da eseguire), se il tempo totale residuo stimato è $\ge 15\text{s}$, emette la prima stima attendibile dell'**intera lavorazione** (`ETA tot ~Ns`).

### 2.2 Emissione Solo su Variazione Significativa (Zero Rumore sui Singoli Pezzi)
1. **Criterio di Variazione Rispetto all'Indicazione Precedente**:
   - Una volta emessa una stima (es. `ETA tot ~45s`), **non ripeterla** nei tool successivi.
   - Emettere un nuovo valore di `ETA tot ~Ns` **solo se e quando** la previsione residua per completare l'intera lavorazione è cambiata in modo significativo rispetto all'indicazione precedente (variazione $\ge 15\text{s}$ o $\ge 30\%$ dovuta a completamento di una macro-fase, imprevisti, test da correggere o cambio di portata).
2. **Canale Esclusivo (`toolAction` su Unico Tool) e Pulizia del Log (`toolSummary`)**:
   - **Divieto nel testo della chat**: non stampare mai righe `[ETA...]` nel corpo dei messaggi di chat.
   - **`toolSummary` sempre pulito**: non inserire **mai** l'ETA in `toolSummary`. Il registro storico dei singoli pezzi (`Explored files >`, `Edited files >`) deve contenere unicamente la descrizione tecnica dell'azione.
   - **`toolAction` solo su un singolo tool quando la stima cambia**: quando la stima diventa attendibile o cambia significativamente rispetto alla precedente, aggiungerla **solo in `toolAction`** del primo tool del batch:
     - `toolAction`: `"<Descrizione azione> · ETA tot ~40s"`
     - `toolSummary`: `"<Descrizione azione>"` (sempre senza ETA)

### 2.3 Baseline di Calcolo per l'Intera Lavorazione
Sommare il peso di tutti i passaggi rimanenti fino al termine dell'intera lavorazione e moltiplicare per `Calib` (se indicato da `[ETA-CLOCK]`):
- **Turno di lettura / ricerca**: `3s – 5s` per batch parallelo.
- **Turno di modifica file** (`replace_file_content`, `write_to_file`): `6s – 10s` per batch.
- **Comandi CLI / Suite di Test** (`run_command`): `8s – 20s` per comando.
- **Sintesi risposta finale LLM**: `5s – 8s`.

---

## 3. Architettura Ibrida e Riservatezza Locale
1. **Confini di Persistenza**:
   - Tutti i dati di telemetria e i cursori di stato (`.cursor_*`, `.eta_*`) risiedono esclusivamente nel filesystem locale dell'utente (`~/.gemini/antigravity/analytics/`).
   - È severamente vietato trasmettere eventi di telemetria, payload di log o percorsi a endpoint di rete esterni.
2. **Isolamento Workspace**:
   - Quando si presentano report su richiesta dell'utente, limitare la visualizzazione predefinita al workspace corrente, a meno che l'utente non richieda esplicitamente la vista globale cross-project.

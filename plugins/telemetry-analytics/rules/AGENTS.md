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

## 2. Protocollo di Stima ETA In-Flight (Solo Pill dei Tool + Auto-Compressione)

Ad ogni turno, l'hook `PreInvocation` (`eta-injector.mjs`) inietta un messaggio effimero `[TELEMETRY-ETA-CLOCK]` contenente l'ora attuale (`Now`), l'ora di avvio del prompt (`PromptStart`), il tempo trascorso (`Elapsed`), il numero di invocazione e i parametri storici (`Baseline` e `Calibration`).

### 2.1 Filtro Anti-Rumore per Risposte Corte (Fast-Path Silence)
- **Condizione di Silenzio**: Se il prompt dell'utente richiede una risposta conversazionale diretta (0 tool) o si risolve in un singolo passaggio immediato (`< 10s`, $\le 1$ tool call di sola lettura senza fasi successive), usare `toolAction` e `toolSummary` ordinari senza indicatore di fase né ETA.

### 2.2 Emissione Esclusiva nelle Pill dei Tool su Lavorazioni Multi-Step ($\ge 2$ step / tool)
Quando la richiesta richiede una lavorazione articolata ($\ge 2$ tool call, modifiche a file, esecuzione test, audit o più turni di ragionamento), applicare rigorosamente queste regole:

1. **Divieto Assoluto di Righe ETA nel Testo della Chat**:
   - È severamente vietato stampare righe `[ETA: ...]`, `[ETA residuo: ...]` o consuntivi `[Completato in ...]` nel corpo del messaggio della chat, sia durante i turni intermedi sia nella risposta finale.
   - Emettere testo nei turni intermedi impedisce ad Antigravity di raggruppare gli step e lascia blocchi di testo permanenti che non si comprimono a lavoro concluso.

2. **Formato Auto-Comprimibile nelle Pill dei Tool (`Fase X/Y: Descrizione · ~Ns`)**:
   - Ogni chiamata ai tool (`view_file`, `replace_file_content`, `write_to_file`, `run_command`, ecc.) eseguita durante una lavorazione multi-step deve formattare `toolAction` e `toolSummary` ponendo **la fase e la descrizione concisa dell'azione al primo posto**, seguite dal separatore `·` e dal tempo residuo stimato `~Ns`:
     - All'avvio (`Invocation #1`):
       - `toolAction`: `"Fase 1/3: Analisi script e configurazione · ~35s"`
       - `toolSummary`: `"Fase 1/3: Analisi script e configurazione · ~35s"`
     - Nei turni successivi (`Invocation #2, #3...`), aggiornare la fase e ricalcolare il tempo residuo in base all'`Elapsed` reale fornito da `[TELEMETRY-ETA-CLOCK]`:
       - `toolAction`: `"Fase 2/3: Aggiornamento parser e regole · ~18s"`
       - `toolSummary`: `"Fase 2/3: Aggiornamento parser e regole · ~18s"`
   - **Auto-Compressione Nativa a Fine Step**: Antigravity mostra `toolAction` in chiaro sopra l'indicatore `Working` mentre il tool è in esecuzione e **lo comprime automaticamente** nella riga di riepilogo (`Explored file >`, `Edited files >`, `Ran command >`) non appena lo step termina, facendo sparire l'ETA a lavoro ultimato.

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

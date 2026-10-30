# Annotazioni & Pensieri in Corso d'Opera (NOTES)

Buffer di cattura rapida a zero cambio di contesto (`/take-note`). Le osservazioni qui raccolte non sono ancora state analizzate sul codice: utilizza `/review-notes` a lavorazione conclusa per mostrarle, eseguire il task di analisi approfondita e promuoverle in `DESIDERATA.md`.
> **Governance anti-bloat**: tetto massimo **120 righe**. La sezione *Analizzate & Consolidate* mantiene al massimo le **ultime 10 note chiuse** in formato tabellare a 1 riga (storico in `.agents/archive/NOTES_archive.md`).
> **Ultimo ID Assegnato**: NOTE-002

---

## 📥 Da Analizzare (Open)

### [NOTE-001] Compatibilità sessioni notturne semiautomatiche senza interruzioni
- **Stato**: `📥 Da Analizzare`
- **Data Cattura**: 2026-10-30 21:13
- **Lavorazione Attiva al Momento della Nota**: Nessuna
- **Ambito Presunto**: `human-governor` (`governor-hook.mjs`), `mapek` (`mapek-pre-hook.mjs`), `skizzo`
- **Testo Originale**:
  > Voglio modificare il plugin che si occupa di gestire la modalità per cercare di renderlo compatibile con delle lavorazioni notturne che grazie agli altri plugin riesco a lanciare in modo semiautomatico senza il mio intervento. Cerco insomma un modo di riconoscere quelle sessioni e lasciarle andare avanti da sole senza interruzioni.
- **Domande Aperte da Riprendere**:
  1. *Segnali di avvio*: come partono i run notturni (`/goal`, `/next-step --auto`, `/automation`, `/schedule`, coda Kanban `gh-board-sync.mjs`, bridge esterno/CLI o modalità notturna manuale a tempo)?
  2. *Perimetro blocchi da silenziare*: disattivare tutti i blocchi `ask_question` in `PreInvocation` (`human-governor` coprifuoco `22:30-07:00` + WIP e proposte `mapek` rimandate al mattino) o intervenire anche su `skizzo`?

### [NOTE-002] Prevenzione branch Git disallineati e push dimenticati tra più PC
- **Stato**: `📥 Da Analizzare`
- **Data Cattura**: 2026-10-30 21:13
- **Lavorazione Attiva al Momento della Nota**: Nessuna
- **Ambito Presunto**: `engineering-workflow`, `cognitive-persistence` (`/memory-sync`), `telemetry-analytics` (`eta-injector.mjs`)
- **Testo Originale**:
  > Vorrei anche pensare a qualche cosa che mi aiuti nel processo di ogni volta che faccio una modifica su un computer, magari vado a dormire, poi vado a lavorare, quindi mi sposto di macchina, l'altro computer non ha fatto il push e io mi ritrovo con dei branch disallineati.
- **Domande Aperte da Riprendere**:
  1. *Strategia multi-macchina*: snapshot automatico a fine turno su ref ombra `wip/<pc>/<branch>` (senza sporcare `main`) + auto-push sui branch notturni con test verdi + check/fast-forward all'avvio sull'altro PC, oppure auto-commit/push diretto sul branch attivo, oppure sola guardia di avviso non distruttiva?

---

## ✅ Analizzate & Consolidate (Ultime 10 Risolte)

| ID | Titolo Sintetico | Data | Esito & Destinazione (<= 120 char) |
| :--- | :--- | :---: | :--- |

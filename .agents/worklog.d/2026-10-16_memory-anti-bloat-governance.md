# [2026-10-16] ADR: Governance Anti-Bloat per `MEMORY.md` (In-Place per Dominio) e `WORKLOG.md` (Rolling Window & Pointer Index) (`cognitive-persistence` v1.3.0)

## Contesto & Motivazione
Nel progetto `GlideMind` (e progressivamente anche in `antigravity-plugins`), sia `MEMORY.md` sia `WORKLOG.md` crescevano in modo lineare e illimitato:
1. **`MEMORY.md`**: veniva aggiornato tramite append cronologico numerato (`## 175. ...`, `## 176. ...`), superando le 1.000 righe e degradando l'attenzione del modello durante `/next-step`.
2. **`WORKLOG.md`**: il passo di "consolidamento" in `/memory-sync` portava l'agente a copiare per intero le 30–50 righe del frammento `.agents/worklog.d/YYYY-MM-DD_<topic>.md` dentro `WORKLOG.md`, duplicando al 100% file già presenti in `worklog.d/`.

## Decisioni Architetturali
1. **Governance di `MEMORY.md` (Tetto Max `200 righe` & Partizionamento per Dominio)**:
   - Vietato l'append cronologico numerato: `MEMORY.md` è suddiviso in **5–8 sezioni stabili di dominio** e va aggiornato **in-place** con formato compatto a 2 punti (`Insidia` / `Regola`), rimuovendo le regole superate e graduando i controlli statici nei test automatici (`shiftLeftGovernance.test.mjs`, `scripts/validate.mjs`).
   - Superate le 200 righe, lo snapshot integrale viene archiviato in `.agents/archive/MEMORY_v<N>_archive.md` e il file attivo viene distillato sotto le 120–150 righe.
2. **Governance di `WORKLOG.md` (Rolling Window $\le 300\text{ righe}$ / Max 15 Interventi & Pointer Record)**:
   - L'ADR esteso (*Contesto*, *Decisioni*, *Impatto*) risiede esclusivamente in `.agents/worklog.d/YYYY-MM-DD_<argomento>.md`.
   - Vietata la copia integrale in `WORKLOG.md`: vi entra solo un **Pointer Record di 4–5 righe** (`Tipo`, link cliccabile al frammento in `.agents/worklog.d/` e 1–2 bullet di sintesi).
   - `WORKLOG.md` mantiene in testa l'`## Indice Sintetico delle Fasi Consolidate` seguito dagli ultimi 10–15 interventi; le voci più vecchie vengono ruotate in `.agents/archive/WORKLOG_v<N>_archive.md`.

## Impatto e Conseguenze
- Aggiornati `plugins/cognitive-persistence/rules/AGENTS.md`, `skills/memory-sync/SKILL.md`, `skills/next-step/SKILL.md`, `README.md` e `plugin.json` (v1.3.0).
- Distillato `MEMORY.md` (da 116 a 74 righe) e compattato `WORKLOG.md` (da 365 a 90 righe, con archivio integrale in `.agents/archive/WORKLOG_v1_archive.md`) nel repository `antigravity-plugins`.
- Reso `scripts/sync-to-global.mjs` resiliente ai lock `EBUSY` su Windows e sincronizzato globalmente il plugin.

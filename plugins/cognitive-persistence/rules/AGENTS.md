# Disciplina di Continuità Cognitiva e Memoria di Progetto

Questo documento prescrive la persistenza strutturata delle osservazioni in-flight, delle decisioni architetturali (ADR), dei vincoli appresi e dello stato evolutivo del software tra sessioni indipendenti.

---

## 1. Architettura Cognitiva di Progetto (3+1 File Canonici)

1. **`NOTES.md` (Buffer In-Flight & Staging Pre-Desiderata — Max 120 Righe)**:
   - Cattura osservazioni grezze, dubbi UX o anomalie notate durante un'altra lavorazione (`🟡 In Lavorazione`), separando la cattura istantanea (`/take-note`) dall'analisi tecnica differita (`/review-notes`).
   - **Governance Anti-Bloat**: mantiene nell'header `> **Ultimo ID Assegnato**: NOTE-XXX`. La sezione `## ✅ Analizzate & Consolidate` conserva al massimo le **ultime 10 note chiuse** come **singola riga di tabella** (`| ID | Titolo | Data | Esito & Destinazione |`, esito $\le 120\text{ char}$), ruotando le più vecchie in `.agents/archive/NOTES_archive.md`.
2. **`MEMORY.md` (Vincoli Stabili & Lezioni Apprese — Max 200 Righe)**:
   - Registra esclusivamente invarianti architetturali e insidie non ovvie (incompatibilità, race condition, antipattern banditi). La cronologia appartiene a `WORKLOG.md`.
   - **Governance Anti-Bloat**: tetto $\le 200\text{ righe}$. **Vietato l'append cronologico numerato** (`## 175. ...`): organizzare in **5–8 sezioni stabili di dominio** aggiornate **in-place**, nel formato `- **<Titolo>**:` seguito da `- *Insidia*: <1 riga>` e `- *Regola*: <1-2 righe>`.
3. **`WORKLOG.md` (Diario Rolling Window & Pointer Index — Max 300 Righe)**:
   - L'ADR esteso (*Contesto*, *Decisioni*, *Impatto*) risiede solo in `.agents/worklog.d/YYYY-MM-DD_<argomento>.md`.
   - **Governance Rolling Window**: **vietato copiare per intero** il frammento in `WORKLOG.md`; inserire solo un **Pointer Record di 4–5 righe** (`Tipo`, link cliccabile al frammento e 1–2 bullet). Mantenere gli **ultimi 10–15 interventi** ($\le 300\text{ righe}$) preceduti da `## Indice Sintetico delle Fasi Consolidate`, ruotando l'eccedenza in `.agents/archive/WORKLOG_v<N>_archive.md`.
4. **`DESIDERATA.md` (Matrice di Stato Funzionalità — Max 150 Righe & Celle $\le 160\text{ char}$)**:
   - Strutturato in due tabelle: `## 1. Backlog Attivo & Funzionalità Pianificate` (`🔴 Prioritario` / `⚪ Pianificato` / `🟡 In Lavorazione`) e `## 2. Funzionalità Completate & Consolidate` (`🟢 Completato`).
   - **Governance Anti-Bloat**: ogni cella `Note` deve restare **$\le 160\text{ caratteri}$**. Oltre 150 righe (o $> 40$ feature completate), archiviare in `.agents/archive/DESIDERATA_v<N>_archive.md` consolidando per macro-fasi.

---

## 2. Cattura In-Flight (`/take-note`) e Triage Differito (`/review-notes`)

1. **Isolamento in Fase di Cattura (`/take-note`)**:
   - Salvare il testo verbatim in `NOTES.md` incrementando `NOTE-XXX`, con data/ora e task `🟡 In Lavorazione` attivo.
   - **Divieto di Analisi Prematura**: durante `/take-note` è vietato ispezionare il codice (`view_file`, `grep_search`) o deviare dal task attivo. Confermare in 1 riga e riprendere il lavoro.
2. **Analisi Approfondita (`/review-notes`)**:
   - Mostrare le note `📥 Da Analizzare`, eseguire l'analisi sul codice reale e, a esito condiviso, promuovere la voce in `DESIDERATA.md` (o implementarla) riducendola a 1 riga nella tabella `✅ Analizzate & Consolidate` di `NOTES.md`.

---

## 3. Fine Task (`/memory-sync`) e Avvio Task (`/next-step`)

1. **End-of-Task Sync (`/memory-sync`)**:
   - Creare l'ADR in `.agents/worklog.d/YYYY-MM-DD_<argomento>.md` e aggiungere il Pointer Record (4–5 righe) in `WORKLOG.md` (ruotando se $> 300\text{ righe}$).
   - Aggiornare `MEMORY.md` *in-place* per dominio solo se emergono nuovi invarianti non ovvi (graduando nei test statici i controlli automatizzabili; distillare in `.agents/archive/MEMORY_v<N>_archive.md` se $> 200\text{ righe}$).
   - Aggiornare `DESIDERATA.md` (`🟢 Completato`, cella $\le 160\text{ char}$) e chiudere eventuali note correlate in `NOTES.md`.
2. **Start-of-Task Intake (`/next-step`)**:
   - Scansionare `DESIDERATA.md` (priorità a `🟡 In Lavorazione`, poi `🔴`/`⚪`), verificare i vincoli in `MEMORY.md` e lo storico recente in `WORKLOG.md`, commutare lo stato in `🟡 In Lavorazione`, produrre il briefing operativo e rinominare la chat (`set-chat-title.mjs`).

---

## 4. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Durante `/take-note` do un'occhiata con `view_file` al file citato."* | Vietato ispezionare codice durante `/take-note`: salvare in `NOTES.md`, confermare in 1 riga e proseguire. |
| *"I test passano, rispondo senza aggiornare `WORKLOG.md` e `DESIDERATA.md`."* | Nessun task strutturale è concluso senza `/memory-sync` (ADR + `WORKLOG` + `MEMORY` + `DESIDERATA`). |
| *"Aggiungo la regola come `## N.` in fondo a `MEMORY.md`."* | Vietato l'append numerato: aggiornare *in-place* per dominio mantenendo `MEMORY.md` $\le 200\text{ righe}$. |
| *"Copio l'intero ADR dentro `WORKLOG.md` o scrivo note lunghe in `DESIDERATA.md`."* | In `WORKLOG.md` ($\le 300\text{ righe}$) va solo un Pointer Record di 4–5 righe; in `DESIDERATA.md` ($\le 150\text{ righe}$) celle $\le 160\text{ char}$. |

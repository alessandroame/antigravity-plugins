# Disciplina di Continuità Cognitiva, Memoria di Progetto e Auto-Distillazione Skill (`cognitive-persistence`)

Prescrive la persistenza delle osservazioni in-flight, degli ADR, dei vincoli appresi e della distillazione cross-workspace dell'esperienza in skill/regole (`L1..L3`).

## 1. Architettura Cognitiva (3+1 File Canonici & Tetti in Byte/Righe)
1. **`NOTES.md` (Buffer In-Flight — Max `120` Righe)**:
   - Mantiene `> **Ultimo ID Assegnato**: NOTE-XXX`. La sezione `## ✅ Analizzate & Consolidate` conserva al massimo le **ultime 10 note chiuse** come singola riga di tabella (`<= 120` char), ruotando le più vecchie in `.agents/archive/NOTES_archive.md`.
2. **`MEMORY.md` (Vincoli Stabili per Dominio — Max `200` Righe & `<= 16 KB`)**:
   - Registra solo invarianti architetturali e insidie non ovvie. **Vietato l'append cronologico numerato**: organizzare in **5–8 sezioni stabili di dominio** aggiornate **in-place** (`- **<Titolo>**:` -> `*Insidia*` + `*Regola*`).
3. **`WORKLOG.md` (Rolling Window & Pointer Index — Max `300` Righe & `<= 20 KB`)**:
   - L'ADR esteso risiede solo in `.agents/worklog.d/YYYY-MM-DD_<argomento>.md`. In `WORKLOG.md` inserire solo un **Pointer Record di 4–5 righe** mantenendo gli **ultimi 10–15 interventi** preceduti da `## Indice Sintetico delle Fasi Consolidate`, ruotando l'eccedenza in `.agents/archive/WORKLOG_v<N>_archive.md`.
4. **`DESIDERATA.md` (Matrice Funzionalità — Max `150` Righe & Celle `<= 160` char)**:
   - Diviso in `## 1. Backlog Attivo` (`🔴`/`⚪`/`🟡`) e `## 2. Funzionalità Completate` (`🟢`). Oltre 150 righe, archiviare in `.agents/archive/DESIDERATA_v<N>_archive.md`.

## 2. Workflow `/take-note`, `/review-notes`, `/memory-sync` e `/next-step`
1. **Isolamento `/take-note`**: salvare verbatim in `NOTES.md` incrementando `NOTE-XXX`. **Vietato ispezionare codice (`read_file`, `grep`)** durante `/take-note`: confermare in 1 riga e riprendere il task attivo.
2. **Triage `/review-notes`**: analizzare le note `📥 Da Analizzare` sul codice reale e promuoverle in `DESIDERATA.md` (o implementarle) riducendole a 1 riga in `NOTES.md`.
3. **Chiusura `/memory-sync` & Auto-Distillazione Cross-Workspace (`L1..L3`)**: creare l'ADR in `.agents/worklog.d/`, aggiungere il Pointer Record in `WORKLOG.md`, aggiornare `MEMORY.md` *in-place* (e `DESIDERATA.md`/`NOTES.md`), e se emerge un pattern trasversale aggiornare il sorgente canonico in `c:/github/antigravity-plugins/plugins/` (`L3` test/sonda, `L2b` `SKILL.md` o `L2a` `AGENTS.md <= 6.000 B`) eseguendo `node c:/github/antigravity-plugins/plugins/proactive-mentorship/scripts/session-miner.mjs --verify-and-sync`.
4. **Avvio `/next-step`**: scansionare `DESIDERATA.md`, leggere `MEMORY.md` e `WORKLOG.md`, commutare in `🟡 In Lavorazione` e rinominare la chat (`set-chat-title.mjs`).

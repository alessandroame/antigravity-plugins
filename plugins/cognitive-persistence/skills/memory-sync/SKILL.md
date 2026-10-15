---
name: memory-sync
description: Sincronizza la memoria di progetto a fine task creando il frammento ADR e aggiornando MEMORY.md, WORKLOG.md e DESIDERATA.md. Use this skill when the user runs /memory-sync or finishes a task.
---

# Project Memory & Knowledge Persistence Runbook

## 1. Obiettivo
Garantire che l'esperienza acquisita, i refactoring complessi e le decisioni architetturali non vadano perdute tra una sessione e l'altra, permettendo a qualsiasi sessione futura di comprendere istantaneamente lo stato del progetto.

---

## 2. Flusso di Sincronizzazione di Fine Task

```
[Verifica Test Superata: 100%]
               │
               ▼
[1. Scrittura Frammento] ──► Crea .agents/worklog.d/YYYY-MM-DD_<topic>.md
               │
               ▼
[2. Consolidamento Log]  ──► Unione cronologica in WORKLOG.md
               │
               ▼
[3. Sync MEMORY.md]      ──► Registrazione di lezioni apprese e antipattern
               │
               ▼
[4. Sync DESIDERATA.md]  ──► Aggiornamento stato feature (🟡 -> 🟢) e chiusura eventuale NOTE-XXX in NOTES.md
               │
               ▼
[5. Resoconto all'Utente] ──► Presentazione delle modifiche e guida al collaudo
```

---

## 3. Formato dei Documenti

### A. Frammento Worklog (`.agents/worklog.d/YYYY-MM-DD_<argomento>.md`)
```markdown
# [YYYY-MM-DD] ADR: Titolo dell'Intervento

## Contesto & Motivazione
Descrizione sintetica del problema o requisito che ha reso necessario l'intervento.

## Decisioni Architetturali
I pattern, le astrazioni o le modifiche strutturali adottate.

## Impatto e Conseguenze
Moduli modificati, suite di test eseguite e comportamento verificato.
```

### B. Voce in `MEMORY.md` (Lezioni Apprese)
Se è stata riscontrata una fragilità non ovvia:
- **Insidia Rilevata**: Comportamento imprevisto o limite di ambiente.
- **Causa Radice**: Spiegazione tecnica del fenomeno.
- **Pattern Preventivo Obbligatorio**: Regola architetturale da seguire in futuro.

### C. Matrice in `DESIDERATA.md` e Allineamento `NOTES.md`
- Aggiornare lo stato della riga corrispondente in `DESIDERATA.md` (`🟡 In Lavorazione` $\to$ `🟢 Completato`) aggiungendo una nota concisa con il riferimento all'implementazione.
- Se l'intervento completato risolve una nota aperta in `NOTES.md`, spostare la relativa scheda `[NOTE-XXX]` sotto `## ✅ Analizzate & Consolidate (Resolved)` con stato `✅ Completata (<Data>)`.

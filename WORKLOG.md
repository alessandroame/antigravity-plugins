# Giornale Cronologico degli Interventi & ADR (WORKLOG)

Questo documento traccia la cronologia consolidata delle decisioni architetturali (ADR) e delle evoluzioni strutturali del repository `antigravity-plugins`.

---

## [2026-10-07] ADR: Documentazione Globale del Repository e Guide Dedicate per Ciascun Plugin

### Contesto & Motivazione
Il repository raccoglie 7 plugin modulari e 1 template per Google Antigravity. I README iniziali erano sintetici o incompleti, privi di dettagli operativi sul goal primario, sui problemi specifici risolti nel runtime di Antigravity, sulle sinergie tra componenti e sulle modalità di installazione avanzata (es. Directory Junctions su Windows).

### Decisioni Architetturali
1. **Root `README.md`**:
   - Esposizione formale dei 5 principi guida (modularità, two-phase token model, anti-sycophancy, resilienza operativa, continuità cognitiva).
   - Catalogo completo con percorsi relativi e sintesi degli obiettivi primari (Goal).
   - Sezione dettagliata per le 4 modalità di installazione (workspace, junction/symlink, globale, meta-skill).
   - Guida alla contribuzione e documentazione dei controlli di `scripts/validate.mjs`.
2. **Guide Dedicate per Singolo Plugin**:
   - `cognitive-persistence`: triade cognitiva (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`), schema ADR in `worklog.d/` e flusso End-of-Task Sync con Mermaid.
   - `engineering-sobriety`: pilastri anti-sycophancy, tabella di bonifica lessicale (banned vs replacement) e skill `tone-audit`.
   - `engineering-workflow`: staging chirurgico, Conventional Commits, ciclo Git Worktree e fault localization deterministica con breadcrumb trace.
   - `execution-guard`: watchdog reattivo su task asincroni (`schedule` e `TimerCondition`), massimali del circuit breaker salva-token e timeout Node.js.
   - `laws-of-ux`: 30 Laws of UX articolate in 7 skill tematiche, 5 regole contestuali e report euristico P0-P3.
   - `proactive-mentorship`: 4 pilastri di scrutinio critico (KISS/YAGNI, prompt, casi limite, standard), box di mentorship e skill `prompt-refactor`.
   - `skill-governance`: architettura token a due stadi, audit dimensionale (A-E), scomposizione a divulgazione progressiva e collision check.
   - `starter-plugin`: blueprint standardizzato per lo sviluppo rapido di nuovi plugin conformi a SemVer e al validatore.

### Impatto e Verifiche
- Tutti gli 8 plugin dispongono ora di documentazione approfondita.
- Esecuzione di `npm test` superata con esito positivo: 8/8 plugin validati, 0 errori, 0 avvisi.

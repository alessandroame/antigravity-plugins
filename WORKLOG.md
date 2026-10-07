# Giornale Cronologico degli Interventi & ADR (WORKLOG)

Questo documento traccia la cronologia consolidata delle decisioni architetturali (ADR) e delle evoluzioni strutturali del repository `antigravity-plugins`.

---

## [2026-10-07] ADR: Introduzione del Comando Slash `/next-step` in `cognitive-persistence`

### Contesto & Motivazione
Il plugin `cognitive-persistence` forniva la skill `memory-sync` per la chiusura del task (End-of-Task Sync), ma necessitava di un punto di ingresso standardizzato e deterministico per l'avvio della sessione (Start-of-Task Intake). Era richiesta la capacità di scansionare automaticamente `DESIDERATA.md`, estrarre vincoli da `MEMORY.md`, generare il prompt esecutivo ed eseguire la transizione di stato verso `🟡 In Lavorazione`.

### Decisioni Architetturali
1. **Skill `next-step`**:
   - Creata la skill `plugins/cognitive-persistence/skills/next-step/SKILL.md` esposta come comando slash nativo `/next-step`.
   - Adottato il naming standard kebab-case (`next-step`) conforme alle specifiche di Antigravity e al validatore di repository.
2. **Logica di Risoluzione Priorità**:
   - Priorità 1: Ripresa prioritaria dei task già in stato `🟡 In Lavorazione` da sessioni precedenti.
   - Priorità 2: Selezione top-down del primo task nello stato `🔴 Pianificato`.
   - Priorità 3: Notifica di backlog esaurito se tutte le voci sono `🟢 Completato`.
3. **Iniezione Contesto Cognitivo e Generazione Prompt**:
   - Estrazione vincoli tecnici da `MEMORY.md` e contesto architetturale da `WORKLOG.md`.
   - Generazione di prompt esecutivo strutturato con riferimenti mirati (`@file`) e criteri di verifica/test.
4. **Allineamento Manifest, Regole e Documentazione**:
   - Aggiornato `plugin.json` (versione `1.1.0`, inserito `/next-step` nei `suggestedPrompts`).
   - Aggiunta in `rules/AGENTS.md` la sezione 3 ("Direttiva di Avvio Task - Start-of-Task Intake").
   - Aggiornato `README.md` del plugin con diagramma del ciclo integrato di sviluppo (Avvio $\to$ Sviluppo $\to$ Chiusura).
5. **Sincronizzazione Ambiente Globale**:
   - Allineata la copia globale in `~/.gemini/config/plugins/cognitive-persistence/`.

### Impatto e Verifiche
- Suite di validazione `scripts/validate.mjs` superata con 8 plugin validati, 0 errori e 0 avvisi.
- Ciclo di sviluppo governato da `cognitive-persistence` completato (avvio tramite `/next-step` e chiusura tramite `/memory-sync`).

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

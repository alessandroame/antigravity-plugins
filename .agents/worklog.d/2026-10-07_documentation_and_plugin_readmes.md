# [2026-10-07] ADR: Documentazione Globale del Repository e Guide Dedicate per Ciascun Plugin

## Contesto & Motivazione
Il repository conteneva un catalogo di 7 plugin modulari e 1 template di avvio, con README minimali o sintetici che non esplicitavano in modo approfondito l'obiettivo architetturale (Goal), i problemi risolti nei workflow agentici di Antigravity, i dettagli di implementazione delle regole e delle skill, i prompt consigliati e le sinergie operative.

## Decisioni Architetturali
1. **Rifacimento e Arricchimento di `README.md` alla Radice**:
   - Illustrati i 5 principi cardine dell'ecosistema (modularità, two-phase token model, anti-sycophancy, resilienza operativa, continuità cognitiva).
   - Inserita la tabella del catalogo con link diretti alla documentazione di ciascun plugin.
   - Redatte le schede di sintesi e di obiettivo (Goal) per tutti i 7 plugin.
   - Dettagliate le 4 modalità di installazione (workspace copia, directory junction Windows, installazione globale e install-plugin meta-skill).
   - Esplicitate le linee guida per la creazione di nuovi plugin e la suite di validazione automatica `scripts/validate.mjs`.

2. **Redazione Guide Dedicate Esaustive per Singolo Plugin**:
   - `plugins/cognitive-persistence/README.md`: documentata la Triade Cognitiva (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`), lo schema delle ADR granulari in `worklog.d/` e il ciclo di End-of-Task Sync con diagramma Mermaid.
   - `plugins/engineering-sobriety/README.md`: specificati i pilastri anti-sycophancy, la tabella completa di bonifica lessicale (banned vs replacement) e la skill `tone-audit`.
   - `plugins/engineering-workflow/README.md`: documentati lo staging chirurgico, Conventional Commits, il ciclo di vita dei Git Worktrees (`worktree-lifecycle`) e la localizzazione deterministica dei difetti con breadcrumb tracing (`trace-debugging`).
   - `plugins/execution-guard/README.md`: dettagliati il meccanismo watchdog con `schedule` e `TimerCondition`, le soglie del circuit breaker salva-token, il pattern del timeout Node.js e le skill `task-watchdog` e `circuit-breaker`.
   - `plugins/laws-of-ux/README.md`: allineata la documentazione con l'esplicitazione dell'obiettivo primario, le 7 skill, le 5 regole contestuali, gli esempi di prompt e le sinergie.
   - `plugins/proactive-mentorship/README.md`: documentati i 4 pilastri di scrutinio critico (KISS/YAGNI, prompt quality, casi limite, standard), il box di mentorship GitHub alert e la skill `prompt-refactor`.
   - `plugins/skill-governance/README.md`: dettagliato il modello a due stadi per l'efficienza dei token, la checklist di audit a 5 assi (A-E) e le skill di scomposizione modulare e verifica collisioni.
   - `templates/starter-plugin/README.md`: strutturata la guida passo-passo per la creazione di nuovi plugin conformi a `scripts/validate.mjs`.

## Impatto e Conseguenze
- Tutti gli 8 plugin (7 in `plugins/` e 1 template) dispongono ora di documentazione dedicata esaustiva e allineata agli standard di `engineering-sobriety`.
- La suite di validazione `npm test` (`node scripts/validate.mjs --all`) passa con 8 plugin verificati, 0 errori e 0 avvisi.

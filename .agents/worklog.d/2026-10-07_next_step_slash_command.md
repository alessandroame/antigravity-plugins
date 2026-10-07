# [2026-10-07] ADR: Introduzione del Comando Slash `/next-step` in `cognitive-persistence`

## Contesto & Motivazione
Il plugin `cognitive-persistence` forniva la skill `memory-sync` per la fase di chiusura del task (End-of-Task Sync), ma era sprovvisto di un punto di ingresso standardizzato e deterministico per l'avvio della sessione (Start-of-Task Intake). Era richiesta la capacità di scansionare automaticamente `DESIDERATA.md`, estrarre lezioni e vincoli da `MEMORY.md`, generare il prompt esecutivo ed eseguire la transizione di stato verso `🟡 In Lavorazione`.

## Decisioni Architetturali
1. **Creazione Skill `next-step`**:
   - Creata la skill `plugins/cognitive-persistence/skills/next-step/SKILL.md` registrata come comando slash nativo `/next-step`.
   - Adottato il naming standard kebab-case (`next-step`) conforme alle linee guida di Antigravity e al validatore di repository.
2. **Logica di Risoluzione Priorità**:
   - Priorità 1: Ripresa dei task già in stato `🟡 In Lavorazione` da sessioni precedenti per evitare dispersioni.
   - Priorità 2: Selezione top-down del primo task nello stato `🔴 Pianificato`.
   - Priorità 3: Notifica di backlog esaurito se tutte le voci sono `🟢 Completato`.
3. **Iniezione Contesto Cognitivo e Generazione Prompt**:
   - Estrazione vincoli da `MEMORY.md` e contesto da `WORKLOG.md`.
   - Generazione di prompt esecutivo con riferimenti mirati (`@file`) e criteri di collaudo.
4. **Allineamento Manifest e Regole**:
   - Aggiornato `plugin.json` (versione `1.1.0`, inserito `/next-step` nei `suggestedPrompts`).
   - Aggiunta in `rules/AGENTS.md` la "Sezione 3: Direttiva di Avvio Task (Start-of-Task Intake)".
   - Aggiornata la documentazione `README.md` del plugin con diagramma del ciclo integrato di sviluppo (Avvio $\to$ Sviluppo $\to$ Chiusura).
5. **Sincronizzazione Ambiente Globale**:
   - Sincronizzati i file aggiornati nella directory globale utente `~/.gemini/config/plugins/cognitive-persistence/`.

## Impatto e Conseguenze
- Validazione automatica `scripts/validate.mjs` superata con esito positivo: 8 plugin verificati, 0 errori, 0 avvisi.
- Ciclo di sviluppo governato da `cognitive-persistence` reso bidirezionale: `/next-step` all'inizio, `/memory-sync` alla fine.

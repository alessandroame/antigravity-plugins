# [2026-10-15] ADR: Integrazione Anti-Rationalization Tables e Posizionamento Agentic Harness Engineering

## Contesto & Motivazione
Dal confronto architetturale con i repository di riferimento nel dominio dell'**Agentic Harness Engineering** e del **Context Engineering** (`addyosmani/agent-skills`, `obra/superpowers`, `anthropics/skills`, `sevenschulte/agentic-harness`), è emerso che:
1. I modelli LLM tendono a formulare nel proprio *chain-of-thought* razionalizzazioni interne per aggirare i gate di verifica quando un task appare ridotto (es. omettere `npm test` per modifiche di poche righe, citare numeri di riga a memoria senza `view_file`, cedere il turno su task in background senza `schedule`, o ispezionare file durante `/take-note`).
2. `README.md` conteneva emoji decorative nelle intestazioni di sezione (`🏛️`, `📦`, `🎯`, `📁`, `🚀`, `🛠️`, `🧪`, `🧰`) in contrasto con la regola `engineering-sobriety/rules/AGENTS.md`, e `package.json` non esponeva i topic standard di indicizzazione open-source (`agentic-harness`, `context-engineering`, `agent-skills`, `agents-md`).

## Decisioni Architetturali
1. **Integrazione di Anti-Rationalization Tables nei 4 Plugin Operativi Chiave**:
   - Aggiunta la sezione *Tabella di Anti-Razionalizzazione (Razionalizzazione Interna Vietata $\to$ Vincolo Inaggirabile)* in:
     - `plugins/engineering-workflow/rules/AGENTS.md` (test obbligatori anche per 1 riga, divieto debugging senza trace, divieto `git add .`, isolamento core headless).
     - `plugins/execution-guard/rules/AGENTS.md` (divieto *blind turn yielding* senza `schedule`, stop al 2° errore identico, *Regression Rollback Guard*, mock obbligatori nei test).
     - `plugins/code-inspector/rules/AGENTS.md` (divieto citazione righe a memoria, estratti chirurgici 10–35 righe, obbligo `<agent-embed>`, riga vuota post-`</summary>`).
     - `plugins/cognitive-persistence/rules/AGENTS.md` (divieto `view_file` durante `/take-note`, obbligo End-of-Task Sync `/memory-sync`, lettura preliminare `MEMORY.md`).
2. **Bonifica `README.md` e Inquadramento Open-Source (`package.json`)**:
   - Rimosse tutte le emoji decorative dalle intestazioni `h2` di `README.md` e allineata la descrizione di `telemetry-analytics` al protocollo ETA vigente.
   - Esplicitati in apertura di `README.md` e nelle `keywords` di `package.json` i descrittori standard del dominio: `agentic-harness`, `context-engineering`, `agent-skills`, `antigravity-plugins`, `antigravity-skills`, `agents-md`, `ai-guardrails`, `cognitive-persistence`.

## Impatto e Verifiche
- Eseguita suite di validazione `npm test` (`node scripts/validate.mjs --all`): 10/10 plugin verificati, 0 errori, 0 avvisi.
- Eseguita sincronizzazione fisica globale `npm run sync` verso `~/.gemini/config/plugins/`.

# [2026-10-30] ADR: Plugin Supervisore Sempre Attivo a Consenso Umano (`mapek` v1.0.0), Validazione `L2c` (`agents/*.md`) e Protocollo Globale Semantic Drill-Down (`L0 -> L1 -> L2`)

## Contesto & Motivazione
1. **Chiusura dell'anello sopra i sensori esistenti**: `telemetry-analytics`, `human-governor`, `pattern-harvester` e `proactive-mentorship` coprivano contabilità token, limiti WIP, n-grammi sintattici di tool e reazioni intra-turno su regex statiche, ma mancava un supervisore d'anello esterno capace di:
   - analizzare in modo continuo le traiettorie bidirezionali `Umano <-> AI` tra sessioni e repository senza richiedere invocazioni manuali;
   - sintetizzare subagent dichiarativi nativi `plugins/*/agents/*.md` (`L2c`) a contesto isolato;
   - comunicare sempre le decisioni motivate chiedendo conferma esplicita prima di toccare qualunque file (*Human-Gated MAPE-K*);
   - misurare dopo 10 sessioni se una personalizzazione approvata riduce davvero l'attrito o va rimossa (*Garbage Collection* delle regole inefficaci).
2. **Ergonomia cognitiva dell'output (`Semantic Drill-Down`)**: il precedente formato di `engineering-sobriety` usava `<details>` solo come contenitore finale per log, codice e tabelle, costringendo l'utente a scorrere spiegazioni lineari su concetti già noti o esponendolo a sigle non spiegate in apertura.

## Decisioni Architetturali
1. **Protocollo Globale `Semantic Drill-Down` (`L0 -> L1 -> L2`) e Guardia CommonMark `L3`**:
   - Aggiornato [`plugins/engineering-sobriety/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/engineering-sobriety/rules/AGENTS.md) con sintesi `L0` auto-sufficiente priva di sigle opache, gate `<= 8` righe, `2..4` cassetti tematici `L1` con titolo auto-esplicativo (`Tema — Conclusione in 1 frase`) e prova tecnica `L2`.
   - Esteso [`scripts/validate.mjs`](file:///c:/github/antigravity-plugins/scripts/validate.mjs) per intercettare `<details>` indentati di `>= 4` spazi (che CommonMark converte in blocchi codice), righe vuote mancanti prima di `L2`, tag non bilanciati, profondità `> 2` e validazione formale della cartella `plugins/*/agents/*.md` (`L2c`).
2. **Plugin Sempre Attivo `mapek` v1.0.0 (`Human-Gated MAPE-K`)**:
   - **Core Headless (`plugins/mapek/core/`)**: `trajectory-analyzer.mjs` (5 detector strutturali bidirezionali + 5 segnali di padronanza), `primitive-router.mjs` (routing verso `L3` / `L2c` `agents/*.md` / `L2b` `SKILL.md` / `L2a` / `PRUNE` con alternative scartate esplicite) e `mastery-ledger.mjs` (media mobile esponenziale EMA `operator-mastery.json`, blocco hard `authorizeDecisionExecution` e verifica ROI post-10-sessioni in `process-ledger.json`).
   - **Doppio Hook Silenzioso (`hooks.json`)**: `mapek-stop-hook.mjs` (`< 5ms`, `stdout: "{}\n"`, analisi detached in sola lettura ogni 3 sessioni umane o 12h) e `mapek-pre-hook.mjs` (`{}\n` in assenza di proposte, iniezione `[MAPEK DECISION READY]` con blocco `ask_question` quando matura una proposta `PENDING_APPROVAL`).
   - **Subagent Dichiarativi `L2c`**: `agents/mapek-analyst.md` (analista read-only di generalizzazione induttiva) e `agents/autonomous-verification-runner.md` (prima proposta reale `[mapek-d79a8179]` emersa da 45 sessioni storiche su `antigravity-plugins` e `glidemind` e applicata dopo conferma utente).

## Impatto e Conseguenze
- **Validazione Statica**: `15/15` plugin conformi (`0` errori, `0` avvisi, regole inline totali `41.4 KB / 60 KB`).
- **Test Unitari**: `87/87` test verdi auto-scoperti su `11` suite (inclusi i nuovi test in `plugins/mapek/tests/mapek.test.mjs`).

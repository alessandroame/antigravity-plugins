# [2026-11-25] ADR: Bonifica Calchi Lessicali IT (`ondate`/`oracoli`) in `engineering-sobriety`, `ab-bench` e `skizzo`

## Contesto & Motivazione
Nei messaggi in chat generati durante l'esecuzione dei plugin `ab-bench` e `skizzo` emergevano calchi letterali dall'inglese (*"waves"* -> `ondate`, *"deterministic test oracles"* -> `oracoli deterministici`, `imbuto oracoli`, `budget deterministico`), rendendo artificioso il testo italiano rivolto all'utente. Le regole `Always-On` di `engineering-sobriety` bloccavano i termini promozionali (`cockpit`, `radar`, `tattico`), ma non coprivano questo gergo pseudo-accademico.

## Decisioni Architetturali
1. **Estensione regole e audit (`L2a`/`L2b`)**: aggiunte in `plugins/engineering-sobriety/rules/AGENTS.md` (e nella checklist `plugins/engineering-sobriety/skills/tone-audit/SKILL.md`) le sostituzioni obbligatorie verso l'italiano quotidiano (`cicli di prova`, `round`, `passate`, `test automatici`, `verifiche oggettive`, `controlli automatici`, `filtro verifiche`, `limite risorse`).
2. **Bonifica stringhe utente (`ab-bench` e `skizzo`)**: aggiornate le sole stringhe italiane visibili in `plugins/ab-bench/core/discovery-engine.mjs` (`ORACLE_STACK.labelIt`, `evaluateStopCondition.reasonIt`, `renderDiscoveryReportMarkdown`), `plugins/ab-bench/skills/discovery-loop/SKILL.md`, `plugins/skizzo/rules/AGENTS.md`, `plugins/skizzo/skills/skizzo/SKILL.md` e `plugins/skizzo/skills/skizzo/references/dialectic-template.md`, preservando invariati simboli esportati, chiavi JSON e regex difensive interne (`bench.mjs`, `router-engine.mjs`, `governor-hook.mjs`).
3. **Guardia automatica `L3`**: aggiunto il test `B4` in `plugins/ab-bench/tests/discovery-engine.test.mjs` per bloccare ogni regressione lessicale in etichette, motivi di arresto e report Markdown.

## Impatto e Conseguenze
- `npm run validate`: `16` plugin verificati, `0` errori, `0` avvisi (`35.3 KB` regole inline).
- `node --test` su tutti i `15` file di test del repo: `144/144` test verdi (`19` suite, `44.9s`).
- `diff-triage.mjs`: `PASS` (`0` righe critiche); sincronizzazione globale completata con `session-miner.mjs --verify-and-sync`.

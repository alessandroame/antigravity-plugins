# [2026-11-25] ADR: Implementazione `ab-bench` v1.1.0 & Skill `/discovery-loop` (`oracle-guided-discovery-loop`)

## Contesto & Decisione
Esteso il plugin [`ab-bench`](../../plugins/ab-bench/README.md) a `v1.1.0` aggiungendo la seconda skill pure on-demand `/discovery-loop` (`0 B` in `rules/AGENTS.md`, nessuna riga extra in `GEMINI.md`), sostituendo il vincolo fisso `>= 60` minuti con una **politica di uscita composita a 5 condizioni (`OR`)** in cui il tempo reale è solo un tetto massimo di sicurezza configurabile (`quick` `20m`, `deep` `60m`, `overnight` `120m`).

## Architettura Implementata
1. **Core Headless (`plugins/ab-bench/core/discovery-engine.mjs`)**:
   - Contratti `discovery-brief.json` e `discovery-verdict.json`, deduplica ipotesi tramite 2-shingle Jaccard (`computeHypothesisDuplicateRate`), sanificazione anti-bias (`sanitizeDiscoveryText`, `sanitizeVariantForBlindJudge`) e batching deterministico SHA-256 (`createBlindVariantBatch` -> `Candidato A..Z`).
   - Gate bloccante a 4 oracoli (`evaluateOracleGate`), frontiera multi-obiettivo di Pareto con distanza di affollamento (`computeParetoFrontier`), e valutatore deterministico della politica di arresto (`evaluateStopCondition`: `WALL_CLOCK_CAP`, `RESOURCE_BUDGET_REACHED`, `TARGET_SATISFICED`, `YIELD_COLLAPSE`, `PARETO_CONVERGED`).
2. **CLI & Workflow (`plugins/ab-bench/scripts/discovery.mjs`, `references/discovery_workflow_template.py`)**:
   - Subcomandi `--init-brief`, `--dedupe`, `--check-stop`, `--sanitize-batch`, `--evaluate` (integrato con le 5 Dita di `bench.mjs`) e `--pilot-demo`.
   - Template Python per `run_workflow` con wrapper `safe_run_agent` (`try/except`) in `parallel()`, worktree isolati `workspace="share"` e verifica sintattica via `ast.PyCF_ALLOW_TOP_LEVEL_AWAIT`.
3. **Skill On-Demand & Suite Offline**:
   - [`skills/discovery-loop/SKILL.md`](../../plugins/ab-bench/skills/discovery-loop/SKILL.md) (`< 100` righe, Hybrid EN/IT, delega a `run-workflow` e `generative_ui`) + `references/discovery-contracts.md`.
   - Suite offline `plugins/ab-bench/tests/discovery-engine.test.mjs` (`9/9` test verdi, `131/131` totali su `19` suite).

## Esito Pilota End-to-End (`plugins/skizzo/scripts/triage.mjs`)
- Eseguito pilota reale `run_workflow` in profilo `quick` su worktree isolati `workspace="share"` (`main` completamente invariato).
- Generati `3` prototipi (`distracted-user`, `extreme-abolitionist`, `domain-skeptic`), tutti idonei ai `4/4` oracoli (`0` scarti, `1` variante non-dominata in frontiera di Pareto: `var-skizzo-cli-surface-abolition-01`, `4/5` dita, `+100%` vs baseline, `complexityCost: 0`).
- Arresto anticipato automatico prima dell'ondata 2 per `TARGET_SATISFICED` in `405.3s` (`~6.8` min invece del tetto di `20` min).

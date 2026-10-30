# ADR: Automazione Pre-Review Cieca (`/review-diff`), Integrità Test, Runner UI Multi-Viewport e Certificazione Ricevute `Stop` Hook (`engineering-workflow` v1.3.0)

- **Data**: 2026-10-30
- **Ambito**: `plugins/engineering-workflow/` (`v1.3.0`), `scripts/run-all-tests.mjs`, `package.json`, `plugins/proactive-mentorship/scripts/session-miner.mjs`
- **Stato**: Consolidato e Sincronizzato

## 1. Problema e Contesto
L'uso intensivo di agenti AI sposta il collo di bottiglia umano dalla scrittura del codice alla verifica a freddo dei diff e al collaudo manuale ripetuto. Nell'ecosistema `antigravity-plugins` emergevano quattro lacune strutturali:
1. `npm test` in `package.json` eseguiva solo `scripts/validate.mjs --all` (zero unit test), mentre `verifyAndSyncGlobalPlugins` in `session-miner.mjs` cablava una lista fissa di 5 test saltandone 4.
2. Mancava una guardia automatica contro la rimozione/modifica silenziosa di asserzioni esistenti in `tests/` e contro i *faux-test* tautologici (`assert.ok(true)`).
3. Mancava una skill ex-post di code review avversariale in sola lettura su `git diff` prima della consegna all'umano.
4. La verifica Gate 4/Gate 5 poggiava su autodichiarazioni nel prompt senza runner multi-viewport dichiarativo né verifica meccanica sull'ordine temporale `edit_file < test/probe` nel `transcript.jsonl`.

## 2. Decisioni Architetturali e Componenti Implementati
1. **Core Headless [`review-guard-engine.mjs`](../../plugins/engineering-workflow/core/review-guard-engine.mjs)**:
   - `discoverRepositoryTestFiles`: discovery ricorsiva di tutti i file `*.test.*` / `*.spec.*` collegata a [`scripts/run-all-tests.mjs`](../../scripts/run-all-tests.mjs) (`npm test`) e a [`session-miner.mjs`](../../plugins/proactive-mentorship/scripts/session-miner.mjs).
   - `analyzeGitDiffForReview`: parser `git diff` con rilevamento `testTamperAlerts` (`HIGH`/`MEDIUM`), `fauxTestAlerts` (`TAUTOLOGICAL_ASSERTION`, `ASSERTION_FREE_TEST`) ed estrazione delle sole righe ad alto rischio (`STATE_MUTATION`, `IO_OR_PROCESS`, `ERROR_HANDLING`, `UNSAFE_SINK`, `PUBLIC_CONTRACT`, `UI_LAYOUT_GEOMETRY`).
   - `verifyTranscriptDeliveryGate`: analizzatore deterministico degli step del turno attivo in `transcript.jsonl`.
   - `validateSmokeFlowConfig` e `buildFourMeasureReceipt`: validazione flussi UI e aggregazione Ricevuta a 4 Misure.
2. **CLI [`diff-triage.mjs`](../../plugins/engineering-workflow/scripts/diff-triage.mjs) e Skill [`review-diff`](../../plugins/engineering-workflow/skills/review-diff/SKILL.md)**:
   - Filtra il rumore meccanico del diff ed esegue una pre-review cieca con subagent `research` (`Blind Diff Critic`).
3. **Hook `Stop` [`delivery-gate-hook.mjs`](../../plugins/engineering-workflow/scripts/delivery-gate-hook.mjs) ([`hooks.json`](../../plugins/engineering-workflow/hooks.json))**:
   - Intercetta `NO_TOOL_CALL` a fine turno umano: se codice o UI sono stati modificati senza un successivo test verde o sonda UI, restituisce `{"decision": "continue", "reason": "..."}` con circuit breaker a 1-retry per firma di modifica (zero rischio loop infiniti).
4. **Runner Headless Multi-Viewport [`ui-smoke-runner.mjs`](../../plugins/engineering-workflow/scripts/ui-smoke-runner.mjs)**:
   - Esegue flussi dichiarativi `.agents/smoke-flows.json` (`360x800`, `800x480` Embedded/Raspberry, `1280x800`) con fallback automatico sui canali browser locali (`msedge`/`chrome`) e iniezione automatica di `ui-geometry-probe.js`.

## 3. Verifica
- Suite unitaria [`review-guard.test.mjs`](../../plugins/engineering-workflow/tests/review-guard.test.mjs) (`8/8` test verdi) + esecuzione completa `npm test` (`10/10` suite auto-scoperte) + `session-miner.mjs --verify-and-sync`.

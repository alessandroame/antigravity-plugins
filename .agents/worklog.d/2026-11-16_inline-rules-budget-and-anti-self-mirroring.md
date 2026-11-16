# [2026-11-16] ADR: Snellimento Budget Regole Always-On (`-32,7%`), Guardia `defaultRulesBudget` (`48 KB`) e Blocco Self-Mirroring Globale

## Contesto & Motivazione
L'iniezione contemporanea di 14 file `plugins/*/rules/AGENTS.md` (`48.816` B) e del bootstrap globale `~/.gemini/GEMINI.md` (`12.948` B) raggiungeva `61.764` B (`~21.500` token BPE), superando il `defaultRulesBudget` nativo di Antigravity (`20.000` token) ed espellendo automaticamente `GEMINI.md` dall'iniezione inline. Inoltre, quando `eta-injector.mjs`, `session-miner.mjs` o `sync-to-global.mjs` venivano invocati dalla copia globale in `~/.gemini/config/` su una macchina con repository in `D:/Github/antigravity-plugins`, la risoluzione `resolve(scriptDir, '..', '..', '..')` scambiava `~/.gemini/config` per il repository sorgente, riversando `127` skill di plugin terzi disabilitati (`science`, `data-agent-kit-plugin`, `flutter`, `firebase`) dentro `~/.gemini/skills/` e gonfiando `GEMINI.md`.

## Decisioni Architetturali
1. **Divulgazione Progressiva Pura sui Comandi On-Demand**: Rimossi `plugins/ab-bench/rules/AGENTS.md` e `plugins/code-inspector/rules/AGENTS.md`, consolidando i vincoli nei rispettivi `SKILL.md` (`0` byte fissi nei turni ordinari).
2. **Deduplicazione Contratti `Always-On` e Bootstrap Compatto**: Eliminata la ripetizione delle regole di igiene `<details>` (già presidiate centralmente da `engineering-sobriety` e `validate.mjs`) in `pattern-harvester`, `skizzo`, `adaptive-router`, `proactive-mentorship`, `mapek` e in `buildCloudBootstrapContent` (`scripts/sync-to-global.mjs`).
3. **Guardia `isCanonicalCatalogRepoRoot` e Pulizia Skill Disabilitate**: Introdotta la verifica di `package.json` (`"name": "antigravity-plugins"`) e l'esclusione esplicita di `/.gemini/config` in `sync-to-global.mjs`, `eta-injector.mjs` e `session-miner.mjs`, aggiungendo la potatura automatica da `~/.gemini/skills/` delle skill appartenenti a plugin disabilitati (preservando le skill autonome dell'utente).
4. **Guardia Statica `MAX_AGGREGATE_INLINE_RULES_BYTES` (`48.000` B)**: Aggiornato `scripts/validate.mjs` per distinguere tra plugin attivi e `disabled: true`, sommare il peso reale di `~/.gemini/GEMINI.md` e bloccare sforamenti sopra `48 KB`.

## Impatto e Conseguenze
- Peso aggregato inline ridotto da `61.764` B (`60,3 KB`) a `41.580` B (`40,6 KB`, `-32,7%`: `35.673` B regole plugin attivi + `5.907` B `GEMINI.md`).
- Cartella globale `~/.gemini/skills/` ripulita da `175` a `49` skill (`-127` skill di plugin disabilitati rimosse).
- Riallineata la documentazione in `README.md` e aggiornato *in-place* `MEMORY.md`; suite globale verificata a `109/109` test verdi (`16/16` plugin validi, `0` avvisi).

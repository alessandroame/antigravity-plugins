# 2026-11-17 — Rilascio `laws-of-ux` v1.3.0: 3 Livelli per Grafici Temporali Espressivi (`L2b` Skill + `L2c` Subagente `telemetry-chart-critic` + `L3` Sonda SVG)

## Contesto & Obiettivo
Estendere la governance UX globale (`antigravity-plugins`) con un sistema completo a 3 livelli per la progettazione e verifica di serie temporali multivariate, meteogrammi, previsioni e cruscotti decisionali ad alta espressività percettiva, allineando il volume condiviso `~/.gemini` che era rimasto indietro a `laws-of-ux` v1.1.0.

## Modifiche Apportate
1. **Livello `L2b` — Skill `ux-telemetry-and-decision-charts` & Reference Matematica**:
   - Potenziato `plugins/laws-of-ux/skills/ux-telemetry-and-decision-charts/SKILL.md` con i **5 Pilastri della Codifica Multivariata Espressiva**: (1) Canali Visivi Ortogonali a 5 layer (Bertin/Flowx), (2) Poligoni Differenziali Bivariati di Playfair & *Color-by-Exception*, (3) Incertezza onesta tramite bande percentili/ensemble e *floating range bars* su scala globale condivisa (Weather Spark / Dark Sky), (4) Scale fenomenologiche e readout singolo `tabular-nums` (`0` Echo Effect), (5) Interpolazione cubica monotona `Fritsch-Carlson` e zero collisioni SVG.
   - Esteso `references/decision-support-foundations.md` con la matrice decisionale dei 6 pattern temporali e le formule esatte per tangenti monotone `Fritsch-Carlson` e intersezione lineare dei poligoni al cambio segno.
2. **Livello `L2c` — Subagente Read-Only `telemetry-chart-critic` & Sync `~/.gemini/agents/`**:
   - Creato `plugins/laws-of-ux/agents/telemetry-chart-critic.md` (`mainAgent: false`, `subagent: true`, strettamente read-only) per revisioni percettive e matematiche imparziali in finestra di contesto isolata.
   - Aggiornato `scripts/sync-to-global.mjs` per sincronizzare automaticamente `plugins/*/agents/*.md` dei plugin abilitati dentro `~/.gemini/agents/`.
3. **Livello `L3` — Sonda Deterministica Gate 4 (`ui-geometry-probe.js`)**:
   - Estesa `runUiGeometryProbe()` con 3 nuovi oracoli automatici per grafici SVG: `SVG_TEXT_OVERLAP` (intersezione bounding-box tra `<text>`), `SVG_CURSOR_COLLISION` (distanza `< 18px` da pillole `[data-chart-cursor]`) e `CHART_OVER_BOXING` (`> 1` contenitore bordato concentrico).
   - Aggiunto test TDD in `tests/ui-geometry-probe.test.mjs`.

## Verifica
- `node scripts/run-all-tests.mjs`: `16/16` plugin validati (`0` errori, `0` warning, budget regole inline `34.7 KB < 48 KB`), `111/111` test unitari verdi.
- `node scripts/sync-to-global.mjs`: `15` plugin, `33` skill e `3` subagenti sincronizzati in `~/.gemini`.

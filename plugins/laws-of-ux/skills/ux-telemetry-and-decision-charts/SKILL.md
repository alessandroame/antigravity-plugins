---
name: ux-telemetry-and-decision-charts
description: >-
  Use this skill when designing, refactoring, or auditing expressive multivariate time-series
  charts, forecasts, meteograms, telemetry timelines, or decision dashboards using orthogonal
  visual channels, Playfair deltas, and Color-by-Exception.
---

# Expressive Multivariate Time-Series, Telemetry & Decision-Support UX

Guides design, mathematical encoding, and decluttering of high-density temporal/spatial visualizations and operational decision-support interfaces (forecasts, meteograms, aviation EFBs, infrastructure observability, financial/industrial telemetry). Always reply to the user in plain Italian.

For human-factors foundations, pattern selection matrices, and shape-preserving geometry formulas, read [references/decision-support-foundations.md](references/decision-support-foundations.md).

---

## 1. 3-Level Situation Awareness & Anti-Mode-Confusion

1. **Sequential 3-Level Hierarchy (Endsley Situation Awareness)**:
   - **Level 1 — Immediate Verdict (`< 1s` Perception)**: Top summary answering current or selected-slot operational state via Tri-Modal encoding (Color + Functional Symbol + Plain-Language Label) and naming the single dominant limiting factor.
   - **Level 2 — Actionable Window (`< 3s` Comprehension)**: Contiguous timeline or spatial profile highlighting nominal vs critical intervals at a glance without switching views.
   - **Level 3 — Physical / Causal Detail (`On-Demand` Projection)**: Granular multi-variable diagnostics revealed progressively in-place (*Overview first, zoom and filter, then details-on-demand* — Shneiderman) rather than competing at equal visual weight with Level 1–2.
2. **Anti-Mode-Confusion Budget (FAA AC 120-76D / EASA AMC 20-25)**:
   - Keep **at most `1` primary axis or lens switcher** per section; ban orthogonal `2x2` mode matrices and cross-mode jump pills that reset spatial orientation.
   - Cap inline chart-header controls at **`<= 2` interactive pills**; move secondary layer toggles, baseline comparators, and legend guides into a single secondary sheet or collapsible drawer.

---

## 2. Five Pillars of Expressive Multivariate Encoding

1. **Orthogonal Visual Channels (*Layered Canvas*, Bertin / Flowx Principle)**:
   - NEVER superimpose `> 2` continuous line strokes inside a single panel or attach heterogeneous dual Y-axes (`left` vs `right` with unrelated units).
   - Encode up to 5 correlated variables without visual spaghetti by assigning each to a distinct perceptual channel from back to front:
     - `Layer 0` **Canvas Tint / Banding**: contextual cycle or state (e.g., daylight/night, market session, operating regime).
     - `Layer 1` **Stratified Silhouette**: volumetric density or multi-tier coverage (`opacity 0.12–0.28`).
     - `Layer 2` **Baseline Area / Bars**: cumulative or event magnitude anchored to the bottom baseline.
     - `Layer 3` **Bivariate Difference Polygons**: threshold exceedance or reference delta.
     - `Layer 4` **Foreground Spline + Synchronized Scrubber**: crisp primary trace (`1.75–2.5px`) with active point markers.
2. **Playfair Bivariate Deltas & Color-by-Exception (Tufte / Few)**:
   - Render nominal curves, grids, and reference envelopes in **neutral, low-saturation monochrome tokens**.
   - Reserve high-saturation semantic fills (`amber` caution, `red` critical, or `red/blue` directional delta) **exclusively** for segments breaching operational thresholds (`Δ Threshold`) or user-requested baseline comparisons (`Δ Reference`, e.g., `t - 24h`).
   - Suppress or dim (`opacity <= 0.25`) upper limit lines when peak series values remain below `70%` of the caution threshold.
3. **Honest Uncertainty & Range Encoding (Weather Spark / Dark Sky / Ensemble Principle)**:
   - Represent spread (`min–max`, gust/peak envelope, `10th–90th` / `25th–75th` percentiles, multi-model divergence) with graduated translucent ribbons (`opacity 0.12–0.22`) rather than false single-line determinism.
   - Render multi-day or multi-bucket summary intervals as **floating range bars** positioned on a **single shared global scale** (NEVER rescale each bar independently to `100%` width/height).
4. **Phenomenological Scales & Single Readout SSOT (*Magic Ink*)**:
   - Pair or replace abstract raw units with human-meaningful qualitative bands where appropriate for non-specialist comprehension.
   - Drive a single synchronized scrubber updating `font-variant-numeric: tabular-nums` side/header readouts (`white-space: nowrap` on `value + unit`, `1:1` indicator-to-series mapping, **`0` Echo Effect** across title + floating tooltip + footer).
5. **Shape-Preserving Math & Zero-Collision SVG/Canvas**:
   - Use **monotone cubic Hermite interpolation (`Fritsch-Carlson`)** for physical/operational series so curves NEVER overshoot above true maxima or dip below zero/minima (ban unconstrained Catmull-Rom / cubic Bézier smoothing on bounded metrics).
   - Compute exact segment intersections at threshold/reference crossings so differential polygons never bleed across baselines.
   - Suppress or repel inline SVG `<text>` annotations within `< 18px` of active cursor pills (`[data-chart-cursor]`) and maintain `0` pairwise `<text>` bounding-box overlaps.

---

## 3. Sequential Execution Runbook

- **Step 1 — Pattern & Channel Allocation**: Select the optimal visual structure from [references/decision-support-foundations.md](references/decision-support-foundations.md) (*Borderless Small Multiples*, *Layered Canvas*, *Playfair Difference*, *Horizon Chart*, *Percentile Fan*, or *2D Time×Level Matrix*) and map each variable to an orthogonal visual channel.
- **Step 2 — Control & Mode Pruning (KLM Cost Reduction)**: Verify at most **3 visual macro-zones** above-the-fold on `360x800` and consolidate header micro-toggles (`> 2`) into one secondary options drawer.
- **Step 3 — Pure Headless Geometry & Color-by-Exception**: Implement monotone spline math, shared-scale range mapping, and threshold/delta polygons in pure headless functions (`0` DOM coupling), applying saturated tokens strictly to out-of-envelope intervals.
- **Step 4 — Workspace Spec Alignment Check**: Inspect project-level chart rules (`.agents/rules/*chart*`). IF a local specification mandates anti-patterns that conflict with Steps 1–3, report the conflict in plain Italian and obtain user confirmation before modifying UI code.
- **Step 5 — Deterministic Gate 4 Probe & Optional Critic Review**: Run `ui-geometry-probe.js` at `360x800` and `1280x800` verifying `0` `SVG_TEXT_OVERLAP`, `0` `SVG_CURSOR_COLLISION`, `0` `CHART_OVER_BOXING`, and `>= 60%` primary canvas share. On complex multi-track redesigns, invoke the read-only `telemetry-chart-critic` subagent (or `/ab-bench`) for an independent perceptual critique.

---

## 4. Verification Thresholds & User-Facing Report Schema

| Metric | Target Threshold | Verification Method |
| :--- | :---: | :--- |
| **Primary Canvas Share** | `>= 60%` viewport height (`360x800`) | `ui-geometry-probe.js` |
| **Linear Traces per Panel** | `<= 2` strokes (`0` heterogeneous dual Y-axes) | SVG/Canvas series audit |
| **Header Micro-Toggles** | `<= 2` inline controls (`<= 1` mode switcher) | DOM / template inspection |
| **Saturated Color Usage** | `0` high-chroma fills on nominal in-range data | CSS token & SVG inspection |
| **SVG Collisions & Over-Boxing** | `0` `SVG_TEXT_OVERLAP`, `0` `SVG_CURSOR_COLLISION`, `0` `CHART_OVER_BOXING` | `ui-geometry-probe.js` |

Present audit or redesign findings to the user in plain Italian using this compact schema:

```markdown
### Audit Espressività Grafica & Supporto Decisionale: [Nome Vista]

- **Canali Visivi & Gerarchia (Livelli 1–3)**: [Allocazione layer sfondo/area/delta/traccia + cambi vista prima/dopo]
- **Rapporto Dati-Inchiostro, Incertezza & Colore per Eccezione**: [Soglie adattive, bande range/incertezza e pulizia box]
- **Verifica Geometrica & Fedeltà Matematica**: [Interpolazione monotona + esito sonda `360x800` / `1280x800`: `0` collisioni]
```

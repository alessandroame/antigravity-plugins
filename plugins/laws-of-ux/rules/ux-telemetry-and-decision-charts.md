---
description: >-
  Rules for multivariate time-series charts, meteograms, telemetry, and operational decision-support views (Endsley SA, Tufte Data-Ink, Color-by-Exception, Small Multiples).
trigger: model_decision
globs: "**/*{chart,forecast,telemetry,meteogram,series,trend,synoptic,soundings,analytics,metrics}*.{js,ts,jsx,tsx,vue,svelte,html,css,scss,dart}"
---

# Multivariate Time-Series & Decision-Support UX Rules

When designing, rendering, or refactoring time-series charts, meteograms, telemetry, and operational decision views:
1. **3-Level Situation Awareness (Endsley)**: Structure the view vertically from `< 1s` Go/No-Go verdict + limiting factor -> `< 3s` contiguous actionable window -> `On-Demand` causal diagnostics (Shneiderman).
2. **Anti-Mode-Confusion Budget**: Expose at most `1` primary view/lens switcher per section and `<= 2` inline controls in chart headers; consolidate layer toggles, baseline selectors, and guides into a secondary sheet or drawer.
3. **Color-by-Exception (Few & Aviation EFB)**: Render nominal series, axes, and envelopes in muted neutral tokens; apply high-saturation amber/red fills or strokes **only** where values breach operational thresholds.
4. **Borderless Small Multiples & Tabular Readouts (Tufte)**: Align correlated tracks over a single shared axis and synchronized scrubber with `0` nested inner boxes, `0` curve-occluding floating SVG tooltips, and `font-variant-numeric: tabular-nums` + `white-space: nowrap` on `value + unit` readouts.
5. **Language**: Always reply to the user in plain Italian.

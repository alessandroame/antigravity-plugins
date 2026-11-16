---
name: ux-telemetry-and-decision-charts
description: >-
  Use this skill when designing, auditing, or decluttering multivariate time-series charts,
  meteograms, telemetry, and operational decision-support dashboards using Endsley SA,
  Tufte Data-Ink, and Color-by-Exception.
---

# Multivariate Time-Series, Telemetry & Operational Decision-Support UX

Guides design, refactoring, and decluttering of high-density temporal/spatial visualizations and field decision-support interfaces (weather meteograms, aviation Electronic Flight Bags, telemetry, financial/industrial monitoring). Always reply to the user in plain Italian.

For empirical foundations, aviation display standards, and quantitative formulas, read [references/decision-support-foundations.md](references/decision-support-foundations.md).

---

## 1. 3-Level Situation Awareness & Anti-Mode-Confusion

1. **Sequential 3-Level Hierarchy (Endsley Situation Awareness)**:
   - **Level 1 — Immediate Verdict (`< 1s` Perception)**: Top summary answering current or selected-slot operational state via Tri-Modal encoding (Color + Functional Symbol + Plain-Language Label) and naming the single dominant limiting factor.
   - **Level 2 — Actionable Window (`< 3s` Comprehension)**: Contiguous timeline or spatial profile highlighting safe vs hazard intervals at a glance without switching views.
   - **Level 3 — Physical / Causal Detail (`On-Demand` Projection)**: Granular multi-variable diagnostics revealed progressively in-place (*Overview first, zoom and filter, then details-on-demand* — Shneiderman) rather than competing at equal visual weight with Level 1–2.
2. **Anti-Mode-Confusion Budget (FAA AC 120-76D / EASA AMC 20-25)**:
   - Keep **at most `1` primary axis or lens switcher** per section; ban orthogonal `2x2` mode matrices and cross-mode jump pills that reset spatial orientation.
   - Cap inline chart-header controls at **`<= 2` interactive pills**; move secondary layer toggles, baseline comparators, and legend guides into a single secondary sheet or collapsible drawer.

---

## 2. Data-Ink Ratio, Color-by-Exception & Small Multiples

1. **Color-by-Exception Discipline (Stephen Few & Aviation EFB Standards)**:
   - Render nominal curves, grids, and reference envelopes in **neutral, low-saturation monochrome tokens** (`<= 2` distinct base strokes per track).
   - Reserve high-saturation semantic colors (`amber` caution, `red` unflyable/critical) **exclusively for segments or slots that breach operational limits**, preventing "Christmas-tree" chromatic fatigue.
2. **Conditional Threshold & Differential Ink (Tufte Data-Ink Ratio)**:
   - Suppress or dim (`opacity <= 0.25`) upper limit lines when peak series values remain safely below `70%` of the caution threshold.
   - Avoid permanent full-width bicolor differential fills across nominal ranges; fill only out-of-envelope excursions or user-requested comparison deltas.
3. **Borderless Small Multiples & Tabular Readouts**:
   - Stack correlated time/altitude tracks over a **single shared axis** with **`0` nested inner boxes** (separate tracks via `12–16px` negative whitespace or `1px` low-opacity hairline).
   - Drive a single synchronized scrubber updating `font-variant-numeric: tabular-nums` side/header readouts (`Single Source of Truth`, `white-space: nowrap` on `value + unit`, `0` floating SVG tooltips occluding the active curve).

---

## 3. Operational Procedure

- **Step 1 — 5-Second Squint & Zone Audit**: Inspect the target view at `360x800` (mobile) and `1280x800` (desktop). Verify at most **3 distinct visual zones** above-the-fold (Verdict Header, Actionable Timeline/Window, Synchronized Primary Canvas `>= 60%` viewport height).
- **Step 2 — Control & Mode Pruning (KLM Cost Reduction)**: Count taps, mode switches, and eye fixations required to answer the user's core operational question. Consolidate header micro-toggles (`> 2`) into one secondary options sheet.
- **Step 3 — Chromatic & Structural Decluttering (Tufte Pass)**: Remove inner card borders, duplicate axis ticks, verbose descriptive footers, and permanent multi-color bands; apply *Color-by-Exception* strictly to threshold violations.
- **Step 4 — Workspace Spec Alignment Check**: Inspect project-level UI/chart rules (e.g., `.agents/rules/*chart*`). IF a local specification mandates permanent dual threshold lines, permanent bicolor fills, or multi-pill header rows that conflict with Steps 2–3, report the conflict in plain Italian and obtain user confirmation to update the local rule before modifying UI code.
- **Step 5 — Deterministic Geometry & Flow Verification**: Run `ui-geometry-probe.js` on mobile (`360x800`) and desktop (`1280x800`) to confirm `0` `elementFromPoint` occlusions, `0` horizontal overflow, `tabular-nums` alignment, and reduced tap/switch count.

---

## 4. Verification Thresholds & User-Facing Report Schema

| Metric | Target Threshold | Verification Method |
| :--- | :---: | :--- |
| **Primary Canvas Share** | `>= 60%` viewport height (`360x800`) | `ui-geometry-probe.js` |
| **Header Micro-Toggles** | `<= 2` inline controls per chart block | DOM / template inspection |
| **Simultaneous Active Modes** | `<= 1` primary switcher (no `2x2` mode matrix) | State & flow inspection |
| **Saturated Color Usage** | `0` high-chroma fills on nominal in-range data | CSS token & SVG inspection |
| **Inner Containment Levels** | Max `1` outer container (`0` nested chart boxes) | DOM hierarchy audit |

Present audit findings to the user in plain Italian using this compact schema:

```markdown
### Audit Densità Dati & Supporto Decisionale: [Nome Vista]

- **Gerarchia Decisionale (Livelli 1–3)**: [Esito + numero di cambi vista richiesti prima/dopo]
- **Rapporto Dati-Inchiostro & Colore per Eccezione**: [Elementi ridondanti o colori saturi nominali rilevati]
- **Allineamento Regole di Progetto**: [Conforme / Conflitto rilevato in `<file>`]
```

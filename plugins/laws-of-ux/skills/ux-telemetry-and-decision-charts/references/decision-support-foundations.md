# Empirical Foundations for Multivariate Time-Series & Decision-Support UIs

Reference companion for `ux-telemetry-and-decision-charts`. Summarizes human-factors research, aviation display standards, and quantitative heuristics for high-density operational interfaces.

---

## 1. Endsley Situation Awareness (SA) & Cognitive Demons

Mica Endsley (*Designing for Situation Awareness*, 2003/2011) models real-time operator decision-making across three hierarchical stages:
1. **Level 1 SA (Perception)**: Scanning key state variables without hunting across disconnected containers.
2. **Level 2 SA (Comprehension)**: Integrating variables against operational limits (e.g., crosswind vs capability envelope, margin to cloud base or capacity ceiling) to grasp immediate safety/viability.
3. **Level 3 SA (Projection)**: Extrapolating trends over upcoming hours or spatial segments.

### Classic SA Failure Modes ("SA Demons") in Dense Dashboards
- **Data Overload & Misplaced Salience**: Giving background grids, secondary deltas, nominal curves, and critical alerts equal chromatic saturation forces serial reading instead of pre-attentive pop-out (`< 200ms`).
- **Attentional Tunneling & Mode Error**: Splitting correlated variables across multiple tabs, lenses, or toggle combinations causes operators to misinterpret which scale or mode is active (*Mode Confusion*) and taxes working memory when comparing two views.
- **Requisite Memory Trap**: Requiring the user to memorize a metric from Tab A (e.g., surface condition at `14:00`) while switching to Tab B (e.g., vertical profile at `14:00`) violates Miller's working-memory bounds.

---

## 2. Aviation EFB Standards & Ecological Interface Design (EID)

1. **FAA AC 120-76D & EASA AMC 20-25 (Electronic Flight Bag Human Factors)**:
   - **Chromatic Restraint (*Color-by-Exception*)**: High-chroma amber and red are reserved strictly for caution and warning states. Normal operating data, terrain/envelope baselines, and structural UI chrome use muted, neutral palettes so any limit exceedance triggers immediate pre-attentive detection.
   - **Mode Clarity & Minimal Clutter**: Interactive controls adjacent to dynamic plots must be minimized; non-essential layer toggles belong in dedicated configuration sheets rather than crowding primary situational displays.
2. **Ecological Interface Design (Vicente & Rasmussen, 1992) & Proximity Compatibility Principle (Wickens & Carswell, 1995)**:
   - Variables that must be mentally integrated for a single go/no-go judgment belong in a **single shared coordinate frame** or **vertically aligned synchronized lanes** rather than separate toggleable modes.
   - Represent physical/operational constraints directly as geometric boundaries (e.g., shaded ceiling/hazard zones) rather than abstract numeric badges scattered across cards.

---

## 3. Quantitative Data Visualization Principles (Tufte, Few & Shneiderman)

1. **Data-Ink Ratio (Edward Tufte, *The Visual Display of Quantitative Information*)**:
   - Maximize the share of ink devoted to non-redundant data variation; strip *Chartjunk* and *Administrative Debris* (nested boxes, heavy gridlines, repeated time axes, echoed values in title + tooltip + footer).
   - **Small Multiples**: Stack `2–4` compact lanes sharing **one bottom time axis** and **one continuous vertical cursor**, separated by clean whitespace (`12–16px`) or a subtle hairline (`opacity <= 0.15`).
2. **Pre-Attentive Highlighting (Stephen Few, *Information Dashboard Design*)**:
   - Base series use calm neutral strokes; threshold breaches dynamically switch stroke/fill tokens to caution/critical only across the offending interval.
   - Numeric readouts use `font-variant-numeric: tabular-nums` in a fixed-width column so scrubbing across hours produces zero horizontal jitter.
3. **Visual Information-Seeking Mantra (Ben Shneiderman, 1996)**:
   - *Overview first* (verdict + contiguous diurnal window), *zoom and filter* (single smooth timeline scrubber), *then details-on-demand* (tap a track or expand a single inline drawer for raw diagnostics).

---

## 4. Objective Diagnostic Probes

1. **5-Second Squint Test**:
   - Blur the mobile viewport (`360x800`). Exactly `2–3` macro-regions should stand out (Verdict/Site header, Actionable window bar, Synchronized chart canvas). If the blurred screen looks like a uniform checkerboard of pills and rectangles, visual hierarchy is flat.
2. **Keystroke-Level Model (KLM — Card, Moran & Newell)**:
   - Count physical taps (`T`), mode switches (`M`), and scroll viewports (`S`) needed to answer: *(a) Can I operate today? (b) Which hours are safest? (c) Why does safety degrade at hour X?*
   - Target budget: `0` taps for (a)–(b) above-the-fold; `<= 1` tap/scrub action for (c).

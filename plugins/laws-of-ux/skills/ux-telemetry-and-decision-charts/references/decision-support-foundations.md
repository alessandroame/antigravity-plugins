# Empirical Foundations, Multivariate Timeline Patterns & Geometry Math

Reference companion for `ux-telemetry-and-decision-charts`. Summarizes human-factors research, aviation EFB display standards, taxonomy of multivariate timeline patterns, and shape-preserving mathematical algorithms.

---

## 1. Endsley Situation Awareness (SA) & Aviation EFB Standards

1. **Three-Stage Operator Loop (Mica Endsley, *Designing for Situation Awareness*)**:
   - **Level 1 SA (Perception)**: Scanning key state variables without hunting across disconnected containers.
   - **Level 2 SA (Comprehension)**: Integrating variables against operational limits to grasp immediate safety or viability.
   - **Level 3 SA (Projection)**: Extrapolating trends over upcoming hours or spatial segments.
2. **Classic SA Failure Modes ("SA Demons")**:
   - **Data Overload & Misplaced Salience**: Equal chromatic saturation across grids, nominal curves, and alerts destroys pre-attentive pop-out (`< 200ms`).
   - **Attentional Tunneling & Requisite Memory Trap**: Splitting coupled variables across separate tabs or `2x2` mode matrices forces operators to hold values in working memory across view switches.
3. **FAA AC 120-76D, EASA AMC 20-25 & Ecological Interface Design (Vicente & Rasmussen)**:
   - Reserve high-chroma amber/red strictly for caution/warning states (*Color-by-Exception*).
   - Encode physical/operational constraints directly as geometric boundaries inside a shared coordinate frame rather than scattered numeric badges.

---

## 2. Taxonomy of 6 Expressive Multivariate Timeline Patterns

Choose the visual architecture according to variable heterogeneity, vertical screen budget, and primary user question:

| Pattern | Coordinate & Channel Mapping | Best For | Mobile Pitfall to Avoid |
| :--- | :--- | :--- | :--- |
| **1. Borderless Stacked Small Multiples** | `2–4` vertically aligned lanes sharing **one bottom time axis** and **one continuous scrubber** (`0` nested borders, `12–16px` whitespace). | Comparing `2–4` coupled metrics with incompatible units (`km/h`, `m`, `mm/h`, `%`). | Repeating X-axis labels or borders on every lane; exceeding 4 lanes above-the-fold. |
| **2. Layered Orthogonal Canvas** *(Flowx / Bertin)* | Single panel combining `Layer 0` background tint (cycle/regime), `Layer 1` top/mid silhouette (density/cover), `Layer 2` bottom area/bars (volume), `Layer 4` crisp primary spline. | Condensing `3–5` physically coupled phenomena over multi-day horizons at a glance. | Drawing `> 2` competing line strokes or using arbitrary non-intuitive color codes without fixed readout. |
| **3. Playfair Bivariate Difference Chart** *(Playfair 1786 / Cleveland & McGill)* | Reference baseline (threshold or `t - 24h` curve) + exact clipped polygons filled only above/below reference. | Spotting threshold breaches (`Δ Limit`) or regime shifts (`Δ Yesterday` warm/cold fronts) in `< 1s`. | Permanent high-saturation fills when data is nominal; unclipped polygon bleed at crossings. |
| **4. Percentile Fan & Spread Ribbon** *(Weather Spark / Ensemble)* | Primary median/mean trace over nested translucent bands (`25th–75th` at `0.20` alpha, `10th–90th` or `min–max` at `0.10` alpha). | Communicating forecast uncertainty, gust spread, or historical anomaly context honestly. | Rendering multiple raw ensemble spaghetti lines at `1.0` opacity. |
| **5. Floating Range Bars & Horizon Strips** *(Dark Sky / Heer)* | Compact pills spanning `[min, max]` on a **global shared scale**, or multi-band color-sliced horizon strips (`18–28px` tall). | Multi-day summaries, 7-day overview headers, or scanning `10+` parallel sensors on mobile. | Rescaling each day's pill to equal width (destroys cross-day magnitude comparison). |
| **6. 2D Time × Level Cross-Section** *(Airgram / Vertical Profile)* | `X = Time`, `Y = Altitude / Depth / Tier`, background heatmap = intensity, sparse vector glyphs = direction/flow, terrain/floor mask at base. | Understanding vertical or structural evolution over time without flipping hours manually. | Overlapping vector glyphs or floating labels colliding with the active altitude/time cursor. |

---

## 3. Shape-Preserving & Exact-Clipping Mathematical Foundations

### A. Monotone Cubic Hermite Interpolation (`Fritsch-Carlson`, 1980)
Standard cubic splines and unconstrained Catmull-Rom / Bézier curves introduce artificial **overshoot**, inventing negative rainfall/wind or false peaks above real data. Always compute tangents `m_k` from secant slopes `delta_k = (y_{k+1} - y_k) / (x_{k+1} - x_k)`:
1. If `delta_{k-1} * delta_k <= 0` (local extremum or flat segment), set `m_k = 0`.
2. Otherwise compute initial tangent (harmonic or weighted mean) and clamp `alpha_k = m_k / delta_k`, `beta_k = m_{k+1} / delta_k`: if `alpha_k^2 + beta_k^2 > 9`, rescale `m_k = tau_k * alpha_k * delta_k` and `m_{k+1} = tau_k * beta_k * delta_k` with `tau_k = 3 / sqrt(alpha_k^2 + beta_k^2)`.
3. Convert each Hermite interval `[x_k, x_{k+1}]` with step `h = x_{k+1} - x_k` directly into an SVG cubic Bézier `C` command:
   - Control point 1: `(x_k + h / 3, y_k + m_k * h / 3)`
   - Control point 2: `(x_{k+1} - h / 3, y_{k+1} - m_{k+1} * h / 3)`

### B. Exact Linear Crossing for Differential Polygons
When building polygons between series `A(t)` and reference `R(t)` where `d_k = A_k - R_k` changes sign (`d_k * d_{k+1} < 0`), insert the exact zero-crossing vertex before splitting positive and negative polygons:
- `u = |d_k| / (|d_k| + |d_{k+1}|)`
- `x_cross = x_k + u * (x_{k+1} - x_k)` and `y_cross = A_k + u * (A_{k+1} - A_k)`

### C. Objective Perceptual & KLM Diagnostic Probes
1. **5-Second Squint Test**: Blur `360x800` viewport; `2–3` macro-regions must dominate rather than a uniform grid of boxes.
2. **KLM Tap/Switch Budget**: `0` taps above-the-fold to identify safe/critical windows; `<= 1` scrub or tap for causal detail.
3. **Gate 4 SVG Geometry Oracle (`ui-geometry-probe.js`)**: Enforce `effectiveFontPx >= 9.5`, `0` `SVG_TEXT_OVERLAP`, `0` `SVG_CURSOR_COLLISION` (`>= 18px` vertical clearance around `[data-chart-cursor]`), and `0` `CHART_OVER_BOXING` (`<= 1` bordered ancestor).

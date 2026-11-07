# Laws of UX Engineering Rules (`laws-of-ux`)

Apply these rules when designing or reviewing UIs and within the Antigravity chat column (`~600px`). Always reply to the user in plain Italian.

## 1. Forms, Layout (Gestalt) & Touch Targets
- **Inputs & Forms (Postel, Tesler, Chunking)**: Accept permissive inputs and normalize them in software; keep `<= 6–8` fields per step in a single-column layout with `autocomplete`, label-to-input gap `<= 8px`, and inter-group gap `>= 16–24px`.
- **3-Second Hierarchy (Anti-"Wall of Boxes")**: Max **4 visible cards/groups above-the-fold** on mobile (`360x800`), max 1 outer containment level, **3 distinct typographic tiers** (Primary Hero `24–32px bold` -> Secondary `14–16px` -> Label/Unit `11–12px`), and `white-space: nowrap` on `value + unit` groups (`24 km/h`, `1850 m`).
- **Fitts's Law & Von Restorff**: Touch targets **`>= 48 x 48 px`** on mobile (`>= 32px` desktop) with `>= 8px` gap; a single high-contrast primary CTA in the thumb zone.

## 2. Responsiveness, Navigation & Accessibility (WCAG POUR)
- **Doherty Threshold (`< 400ms`) & Loading Hierarchy**: Instant visual feedback (`:active`, anti-double-tap); `< 1s` no loader, `1–3s` CLS-free skeleton, `3–10s` deterministic progress bar, `> 10s` ETA + background execution; `5–10s` Undo grace window on destructive actions.
- **Hick's & Miller's Law**: Limit top-level choices to `3–5` options and information chunks to `5–7` items.
- **Safe Autonomy & WCAG 2.1 AA/AAA**: Expose the rationale/source of automated suggestions with 1-tap override (`Cheap Takeover`); contrast `>= 4.5:1` normal text (`>= 7:1` critical outdoor indicators), `:focus-visible`, and native semantics.

## 3. Outdoor / High-Glare Standards & 4-Measure Visual Receipt
- **60/40 Screen Budget & `100dvh`**: On operational views (maps, meteograms, 3D telemetry), reserve **`>= 60%` of viewport height (`360x800`)** for the primary canvas without scrolling; keep headers, filters, and floating HUDs `<= 40%` with zero control occlusion (`elementFromPoint`). Use `100dvh`, `touch-action: pan-x` on single-row carousels (NEVER use `flex-wrap`), and high-contrast light/dark themes with Tri-Modal feedback (Color + Text + Symbol).
- **4-Measure Verification Receipt (Zero Eyeball Judgments)**: When inspecting a browser screenshot, NEVER claim *"sembra tutto ok"* without metrics or invent artificial defects when checks pass (**0 changes** per Occam's Razor). ALWAYS validate and report in Italian: (1) **Budget schermo** (`>= 60%` free), (2) **Scala gerarchica in 3s** + `nowrap`, (3) **Sonda geometrica** (`0` `elementFromPoint` overlaps, `0` clipped text, `0` horizontal scroll on `360x800`), (4) **Flusso `Prima -> Click -> Dopo`** visible without scrolling.

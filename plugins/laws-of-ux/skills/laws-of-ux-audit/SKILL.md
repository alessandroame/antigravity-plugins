---
name: laws-of-ux-audit
description: >-
  Use this skill when conducting a UX Heuristic Audit of a screen, application, or design system across the 30 Laws of UX (Gestalt, ergonomics, cognitive load, performance) with P0-P3 remediation.
---

# Laws of UX Heuristic Audit Skill

Executes a 360-degree heuristic audit on a screen, component, or user flow against the **30 Laws of UX** (Jon Yablonski), **10 NN/G Heuristics**, and **Baymard Benchmarks**. Always present the audit report to the user in plain Italian.

## Activation Triggers
- User asks: *"Fai un audit UX di questa pagina / di questo flusso"*.
- Pre-release usability and accessibility review.
- Before/after UI comparison.

---

## Integrated 6-Phase Audit

### Phase 1: Mental Model & Consistency (Jakob's Law, NN/G #2 & #4)
- **Platform Conventions**: Do layout and controls follow familiar platform patterns?
- **Real-World Match**: Does copy use user language instead of internal system jargon?
- **Wayfinding**: Is current location and back-navigation immediately obvious?

### Phase 2: Layout & Gestalt Perception (Proximity, Common Region, Similarity, Connectedness, Prägnanz)
- **Visual Grouping**: Are related items bounded in clear cards/regions (max 1 outer containment level, max 4 cards above-the-fold on `360x800`)?
- **Proximity Spacing**: Are labels/hints `<= 8 px` from their input and distinct groups `>= 16–24 px` apart?
- **Signal-to-Noise Ratio**: Are decorative dividers and clutter stripped (Prägnanz, Occam's Razor, NN/G #8)?

### Phase 3: Cognitive Load & Memory (Miller, Chunking, Recognition over Recall, Serial Position, Von Restorff)
- **Recognition over Recall (NN/G #6)**: Are recent searches and visual autocomplete visible without memory recall?
- **Catalog Filters (Baymard)**: Are the 5 core filter facets (category, specs, price, rating, availability) present with live counts?
- **Action Hierarchy**: Is there a single high-contrast Primary CTA per view (Von Restorff)?

### Phase 4: Ergonomics, Forms & Error Prevention (Fitts, Postel, Parkinson, Baymard, NN/G #5)
- **Touch Targets & Spacing (Fitts)**: Are targets `>= 48x48 px` on mobile (`>= 32x32 px` desktop) with `>= 8 px` gap and primary CTAs in the Thumb Zone?
- **Field Pruning & Single Column (Baymard)**: Is the form single-column with `<= 6–8` fields per step?
- **Input Tolerance & Prevention (Postel, NN/G #5)**: Does it normalize permissive inputs and prevent invalid selections before submit?

### Phase 5: Responsiveness, Latency & Control (Doherty, Timing Hierarchy, Peak-End, NN/G #1 & #3)
- **Instant Feedback**: Visual feedback within `400ms`?
- **Loading Hierarchy**: `< 1s` no loader, `1–3s` spinner/skeleton, `3–10s` deterministic progress bar, `> 10s` ETA + background?
- **Undo Window (NN/G #3)**: `5–10s` `"Annulla"` grace window on critical/destructive actions?

### Phase 6: AI Transparency & Safe Autonomy
- **Explainability & Cheap Takeover**: Are automated suggestions explained inline and overridable in 1 tap?
- **Safe Autonomy**: Do irreversible actions require explicit user confirmation?

---

## Remediation Report Schema (`P0–P3`, User-Facing in Italian)
Classify findings in plain Italian by severity:
- **P0 - Critical (Blocker)**: Broken flow, touch target `< 32px`, unguarded freeze `> 1s`, missing keyboard A11y, or unconfirmed destructive action.
- **P1 - High**: Multi-column form (`> 10` unchunked fields), missing core filters, costly AI takeover, or broken platform conventions.
- **P2 - Medium**: Missing `autocomplete`, label gap `> 10px`, unchunked lists (`> 7` items), or search without typo tolerance.
- **P3 - Low / Polish**: Micro-copy, transitions, or Peak-End confirmation polish.

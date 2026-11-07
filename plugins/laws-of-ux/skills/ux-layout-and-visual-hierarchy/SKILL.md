---
name: ux-layout-and-visual-hierarchy
description: >-
  Use this skill when designing or refactoring page layouts, grids, dashboards, and cards using Gestalt Principles (Proximity, Common Region, Similarity, Connectedness, Pragnanz).
---

# Visual Layout & Gestalt Architecture Skill

Structures scannable, low-noise interfaces using Gestalt visual perception principles. Always reply to the user in plain Italian.

## Applied Laws & Core Rules

1. **Law of Proximity**:
   - Relative spacing communicates semantic relationship:
     - Related items (card title + date): tight gap (`4–8px`).
     - Items within the same section: medium gap (`16–24px`).
     - Independent sections: wide gap (`48–64px`).
2. **Law of Common Region**:
   - Bound items belonging to the same entity inside a single clear visual container (subtle background contrast or `1px` border; max 1 outer containment level).
3. **Law of Similarity**:
   - Elements sharing the same function MUST share identical visual styling (badges/chips, link colors, interactive affordances).
4. **Law of Uniform Connectedness**:
   - Use continuous visual connectors (lines, arrows, connected steppers) to represent sequential flows or hierarchies.
5. **Law of Prägnanz**:
   - Eliminate misaligned grids, accidental asymmetries, and redundant divider lines in favor of clean whitespace and a 3-tier typographic scale (Hero `24–32px bold`, Secondary `14–16px`, Label/Unit `11–12px` with `white-space: nowrap`).

---

## Agent Operational Procedure
1. **Spacing Scale Audit**: Verify CSS/Tailwind uses a consistent `4px`/`8px` spacing scale.
2. **Region Bounding**: Group scattered metrics into clean cards (max 4 visible cards above-the-fold on `360x800`).
3. **Similarity Normalization**: Unify `border-radius`, padding, and semantic colors across homologous elements.
4. **Decluttering**: Replace redundant divider lines with negative whitespace.

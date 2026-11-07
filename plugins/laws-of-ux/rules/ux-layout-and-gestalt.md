---
description: >-
  Rules for page layout, visual grouping, cards, dashboards, and grids based on Gestalt principles (Proximity, Common Region, Similarity, Connectedness, Pragnanz).
trigger: model_decision
globs: "**/*{layout,card,grid,list,container,view,page,dashboard}*.{html,jsx,tsx,vue,svelte,css,scss,dart}"
---

# Layout & Gestalt UX Rules

When creating or modifying layouts, cards, grids, and dashboards:
1. **Defined Containers (Law of Common Region)**: Group related entities inside cards or sections with clear borders or subtle background contrast (max 1 outer containment level).
2. **Hierarchical Spacing (Law of Proximity)**: Use tighter internal spacing (`4–8px`) between related items than the spacing separating distinct cards/sections (`16–24px` or `48–64px`).
3. **Style Consistency (Law of Similarity)**: Elements with the same function MUST share identical visual styling, border radius, and color semantics across the app.
4. **Connected Flows (Law of Uniform Connectedness)**: Use continuous lines, arrows, or step indicators to link sequential steps.
5. **Structural Simplicity (Law of Prägnanz)**: Strip superfluous decorative dividers and visual noise in favor of clean negative whitespace.

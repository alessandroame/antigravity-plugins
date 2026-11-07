---
name: ux-choice-and-navigation-design
description: >-
  Use this skill when designing or auditing navigation bars, dropdowns, filter sidebars, and decision screens using Hick Law, Occam Razor, and Serial Position Effect to prevent choice overload.
---

# Choice Architecture & Navigation Skill

Guides the design of menus, navigation bars, comparison tables, and filter sidebars to prevent decision paralysis and cognitive overload. Always reply to the user in plain Italian.

## Applied Laws & Core Rules

1. **Hick's Law (Decision Time)**:
   - Decision time grows logarithmically with the number and complexity of choices.
   - Cap top-level visible options at **`3–5` macro-choices**.
2. **Choice Overload (Paradox of Choice)**:
   - Highlight a recommended option (`"Consigliata"` / `"Più Popolare"`) and limit side-by-side comparisons to at most **3 items**.
3. **Recognition over Recall in Search (NN/G Heuristic #6 & Baymard)**:
   - Provide predictive visual autocomplete, recent searches (*Recently Searched/Viewed*), and typo/synonym tolerance so searches never dead-end on empty `"Nessun risultato"` views.
4. **Faceted Filtering (Baymard 5-Category Benchmark)**:
   - In catalogs and dense data tables, implement the **5 core filter categories**: (1) Category/Type, (2) Technical Specs/Attributes, (3) Price/Value Range, (4) Rating/Reviews, (5) Availability/Status.
   - Show live item counts per facet (`In Stock (42)`) and expose active filters as 1-click removable pills.
5. **Serial Position Effect (Primacy & Recency)**:
   - Place the most important navigation items at the **first and last** positions of the bar or menu.
6. **Jakob's Law & Wayfinding**:
   - Preserve universal web/mobile conventions and always mark the active route (`aria-current="page"`, breadcrumbs in deep flows).

---

## Agent Operational Procedure
1. **Option Count Audit**: Count simultaneous top-level choices; if `> 5–7`, group into categories or progressive disclosure.
2. **Search Bar Optimization**: Add recent search history, instant suggestion dropdown, and fallback suggestions on zero matches.
3. **5-Facet Filter Sidebar**: Structure filter panels around the 5 Baymard categories with live counts and reset pills.
4. **Navigation Bar Ordering**: Place core links first, profile/settings last, and secondary links inside an `"Altro"` overflow menu.

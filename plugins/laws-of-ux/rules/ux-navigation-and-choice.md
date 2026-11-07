---
description: >-
  Rules for menus, navigation bars, comparison tables, and filters (Hick's Law, Choice Overload, Serial Position, Jakob's Law).
trigger: model_decision
globs: "**/*{nav,navbar,menu,sidebar,dropdown,filter,pricing,table}*.{html,jsx,tsx,vue,svelte,dart}"
---

# Navigation & Choice Architecture Rules

When designing menus, navigation bars, or complex comparison/pricing screens:
1. **Choice Reduction (Hick's Law & Choice Overload)**: Show at most `3–5` primary top-level options simultaneously. Use collapsible categories or progressive disclosure.
2. **Recognition over Recall in Search (NN/G Heuristic #6)**: Search inputs MUST provide recent search history, instant visual autocomplete, and typo/synonym tolerance (avoiding dead-end "Nessun risultato" screens).
3. **Faceted Filtering (Baymard Benchmark)**: In catalogs and dense data views, provide the 5 core filter facets (category, specs/attributes, price/range, rating, availability/status) with live result counts and 1-click removable active filter pills.
4. **Wayfinding & Position Tracking**: Always indicate current location (`aria-current="page"`, active nav state, breadcrumbs in deep flows, wizard step indicators).
5. **Serial Position Effect**: Place the most important actions at the first and last positions of the navigation bar or list.
6. **Established Conventions (Jakob's Law)**: Respect universal platform navigation patterns (top-left logo for Home, right-aligned account/notifications, consistent mobile navigation).

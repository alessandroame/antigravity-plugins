---
description: >-
  Rules for buttons, CTAs, action bars, clickable icons, and touch targets (Fitts's Law, Von Restorff Effect, Doherty Threshold).
trigger: model_decision
globs: "**/*{button,btn,cta,icon-button,action-bar,fab,menu-item}*.{html,jsx,tsx,vue,svelte,css,scss,dart}"
---

# Button & Touch Ergonomics Rules

When creating or modifying buttons, CTAs, and interactive icons:
1. **Minimum Targets (Fitts's Law)**: At least **`48x48 px`** on touch devices (using transparent hit-area padding if the icon is smaller) and **`32x32 px`** on desktop; minimum **`8 px`** gap between adjacent buttons to prevent accidental taps.
2. **Thumb Zone Reachability**: On mobile, place primary and confirmation actions in the lower half of the screen (sticky bottom bar or reachable center float).
3. **Visual Hierarchy (Von Restorff Effect)**: Only ONE primary high-contrast CTA per screen; use outline or ghost styles for secondary/neutral actions.
4. **A11y (WCAG POUR)**: NEVER convey action meaning by color alone; provide explicit text labels or `aria-label`, WCAG AA contrast (`>= 4.5:1`), and clear `:focus-visible`.
5. **Instant Feedback & Anti-Double-Click (Doherty Threshold)**: Show visual feedback within `400ms` of tap/click and temporarily disable the button while pending to prevent duplicate submissions.
6. **Language**: Reply to the user in plain Italian.

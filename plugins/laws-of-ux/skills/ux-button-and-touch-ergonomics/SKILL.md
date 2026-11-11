---
name: ux-button-and-touch-ergonomics
description: >-
  Use this skill when designing, sizing, and styling buttons, CTAs, action bars, and touch targets using Fitts Law, Von Restorff Effect, and Doherty Threshold to prevent accidental taps.
---

# Button & Touch Ergonomics Skill

Guides ergonomic design of buttons, toolbars, and interactive controls across desktop and touch devices. Always reply to the user in plain Italian.

## Typical Problems Solved
- Undersized mobile buttons/icons causing miss-clicks.
- Competing primary buttons without clear visual hierarchy.
- Accidental taps on destructive actions (`"Elimina"` too close to `"Salva"`).
- Missing `:active` touch feedback or duplicate form submissions.

---

## Applied Laws & Core Rules

1. **Fitts's Law (Target Size & Distance)**:
   - **Minimum Size**: **`48x48 px`** on mobile (WCAG / Apple HIG / Material Design) and **`32x32 px`** on desktop.
   - **Minimum Gap**: At least **`8 px`** between adjacent clickable targets.
   - **Thumb Zone**: Place primary mobile actions in the lower half of the viewport.
2. **Von Restorff Effect (Primary Action Isolation)**:
   - Highlight **only ONE primary CTA** per screen with high contrast.
   - Style secondary actions as outline or neutral ghost buttons.
   - Separate destructive actions spatially and require confirmation or Undo.
3. **Aesthetic-Usability Effect**:
   - Crisp typography, consistent border radii, and immediate hover/pressed transitions increase user trust and error tolerance.

---

## Agent Operational Procedure
1. **Measure Touch Areas**: Inspect CSS/components to verify `min-height: 48px` and `min-width: 48px` (using transparent hit-area padding when the visible icon is `20–24px`).
2. **Verify Spacing**: Ensure `gap >= 8px` (`8–12px`) separates adjacent buttons.
3. **Audit Visual Hierarchy**: If multiple buttons share primary solid fills in the same group, demote secondary ones to outline and tertiary ones to ghost text.
4. **Interactive States**: Add `:hover`, `:focus-visible`, `:active` (`< 100ms`), and loading-disable states.

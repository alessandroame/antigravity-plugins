---
name: ux-feedback-and-perceived-performance
description: >-
  Use this skill when handling async actions, API loading, submit states, and system latencies using Doherty Threshold, Peak-End Rule, and skeleton screens to optimize perceived performance.
---

# Feedback & Perceived Performance Skill

Transforms slow network waits and async flows into responsive, predictable user experiences. Always reply to the user in plain Italian.

## Applied Laws & Core Rules

1. **Doherty Threshold (`< 400ms`)**:
   - Provide optimistic UI updates or an immediate `:active`/in-progress visual state within `< 100ms` of click/tap.
2. **Wait-Time Hierarchy (Timing Hierarchy)**:
   - **`< 1s`**: Instant feedback; NEVER show invasive spinners that cause visual flicker.
   - **`1–3s`**: Show a lightweight inline spinner or skeleton element.
   - **`3–10s`**: Show a deterministic percentage progress bar (*Goal-Gradient Effect*).
   - **`> 10s`**: Show remaining time estimate (*"Circa 45 secondi rimanenti..."*) and allow background execution with completion notification.
3. **Perceived Performance & Skeleton Screens**:
   - Use geometry-matched pulsing/shimmer Skeleton Screens instead of blank screens or isolated spinners to eliminate Cumulative Layout Shift (CLS).
4. **Undo Grace Period (NN/G Heuristic #3)**:
   - On critical async actions (sending messages, deleting items, archiving), hold execution for `5–10s` with a toast banner and `"Annulla"` button.
5. **Peak-End Rule & Error Recovery (NN/G Heuristic #9)**:
   - Make completion screens clear and reassuring; on network/server failure, explain the problem in plain Italian and provide a `"Riprova"` action that preserves local user input.

---

## Agent Operational Procedure
1. **Apply Timing Hierarchy**: Map each async operation to the matching visual pattern (`< 1s`, `1–3s`, `3–10s`, `> 10s`).
2. **Submit Lock & Inline Loading**: Disable submit buttons while pending to prevent rage clicks and duplicate transactions.
3. **Geometry-Matched Skeletons**: Define skeleton placeholders matching the exact dimensions of loaded cards/rows.
4. **Reversible Undo Toast**: Implement a reversible `5–10s` timeout with an `"Annulla"` action on destructive operations.

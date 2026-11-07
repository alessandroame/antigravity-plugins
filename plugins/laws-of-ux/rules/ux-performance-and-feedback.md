---
description: >-
  Rules for loading states, instant feedback, latency handling, and error recovery (Doherty Threshold, Peak-End Rule).
trigger: model_decision
globs: "**/*{loader,spinner,skeleton,feedback,progress,toast,alert,modal,error}*.{html,jsx,tsx,vue,svelte,dart}"
---

# Feedback & Perceived Performance Rules

When handling async loading, saves, or user feedback:
1. **Instant Feedback `< 400ms` (Doherty Threshold)**: Respond to every tap/click with an immediate visual state (`:active`, micro-transition, disabled submit button against double clicks) within `400ms`.
2. **Loading Timing Hierarchy**:
   - `< 1s`: Show NO invasive spinner/loader to avoid visual flicker.
   - `1–3s`: Show an inline contextual spinner or micro-indicator.
   - `3–10s`: Show a deterministic percentage progress bar.
   - `> 10s`: Provide remaining ETA and allow background execution with completion notification.
3. **Skeleton Screens**: For full screens, lists, and cards, use geometry-matched pulsing skeleton loaders to eliminate Cumulative Layout Shift (CLS).
4. **Undo Grace Period (NN/G Heuristic #3)**: For critical async operations (deletions, archiving, sends), provide a `5–10s` grace window with an `"Annulla"` button before final commit.
5. **Reassuring Epilogue & Error Recovery (Peak-End Rule & NN/G #9)**: Make completion screens clear and reassuring; on errors, explain the issue in plain human language with a 1-click retry action (`"Riprova"`) that preserves entered form data.

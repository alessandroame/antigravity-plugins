---
name: ux-form-optimization
description: >-
  Use this skill when designing or refactoring forms, input fields, wizards, and validation logic using Postel Law, Parkinson Law, Proximity, Tesler Law, and Chunking.
---

# Form & Data Input Optimization Skill

Optimizes forms, input fields, validation, and checkout/registration flows to minimize friction and abandonment. Always reply to the user in plain Italian.

## Applied Laws & Core Rules

1. **Postel's Law (Robustness Principle)**:
   - Accept permissive input formats (e.g., `+39 340 123 4567` or `3401234567`) and normalize whitespace/separators internally before submission.
2. **Baymard Benchmark (Field Pruning & Single Column)**:
   - Reduce field count by **20–60%**, capping each step at **`6–8` essential fields**.
   - Enforce a **single-column layout** to prevent ambiguous Z-pattern eye jumps. Mark rare optional fields with `(opzionale)`.
3. **Parkinson's Law & Mobile `inputmode`**:
   - Provide HTML `autocomplete` (`name`, `email`, `tel`, `shipping postal-code`) and touch `inputmode` (`numeric`, `tel`, `email`).
4. **Error Prevention & Inline Recovery (NN/G Heuristics #5 & #9)**:
   - Prevent invalid inputs upfront (disable past dates, derive country prefix).
   - Validate inline on `blur` (NEVER while the user is still typing) with constructive Italian messages (*"Inserisci un CAP di 5 cifre, es. 20121"*).
5. **Law of Proximity (Gestalt)**:
   - Keep `<label>` and hint/error text within `<= 8 px` of their input, and separate adjacent form groups by `>= 16–24 px`.
6. **Tesler's Law (Complexity Absorption)**:
   - Auto-derive city/province from postal code, card network from first 4 digits, and unify full name into a single field unless backend constraints forbid it.
7. **Chunking & Progressive Disclosure**:
   - Format long numbers into 4-digit or 3-digit visual blocks; split flows `> 8` fields into a multi-step wizard with clear progress indicator.

---

## Agent Operational Procedure
1. **Baymard Field Audit**: Prune superfluous fields to `<= 6–8` per screen and convert multi-column rows into a single vertical column.
2. **Accessible Labels**: Ensure every input has a visible `<label for="field-id">` (NEVER rely on `placeholder` alone).
3. **Autocomplete & Inputmode**: Add semantic `autocomplete` and `inputmode` attributes on every field.
4. **Non-Destructive Validation**: Normalize permissive inputs and validate on `blur`.
5. **Submit Protection**: Disable the submit button with inline loading state while submitting.

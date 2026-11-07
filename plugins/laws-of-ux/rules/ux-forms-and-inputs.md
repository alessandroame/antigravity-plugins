---
description: >-
  Rules for optimizing forms, input fields, data validation, wizards, and permissive formatting (Postel's Law, Parkinson's Law, Proximity, Tesler's Law, Chunking).
trigger: model_decision
globs: "**/*{form,input,login,signup,checkout,register,stepper,wizard}*.{html,jsx,tsx,vue,svelte,dart,swift,kt}"
---

# Form & Input Field UX Rules

When creating or modifying forms, inputs, and checkout/registration flows:
1. **Input Tolerance (Postel's Law)**: Accept any plausible input variation (spaces in phone numbers, country codes, credit cards) and sanitize/normalize automatically before submission.
2. **Field Reduction & Single-Column Layout (Baymard Benchmark)**: Keep `<= 6–8` fields per screen or step in a single-column layout to prevent zig-zag eye tracking. Eliminate non-critical optional fields (address line 2, fax, title).
3. **Autofill (Parkinson's Law)**: ALWAYS include semantic `autocomplete` (`autocomplete="tel"`, `autocomplete="email"`, `autocomplete="shipping address-line1"`) and mobile `inputmode` attributes.
4. **Visual Proximity (Law of Proximity)**: Keep `<label>` and error/hint text within `<= 8 px` of their input field; separate distinct field groups by `>= 16–24 px`.
5. **Complexity Absorption (Tesler's Law)**: Automatically derive inferable values (card network from BIN, city/province from postal code).
6. **Error Prevention (NN/G Heuristic #5)**: Use constraints and smart defaults (disable invalid past dates, preselect local currency) and validate inline on `blur` rather than while typing.
7. **Chunking**: Format long numeric strings into readable blocks (4-digit groups for cards/serials; spaced IBAN and phone formats).

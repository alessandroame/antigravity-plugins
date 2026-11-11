---
name: how-its-made
description: >-
  Use this skill when the user runs /how-its-made or asks how a feature works at the code level
  to trace Entry -> Guards -> Process -> Exit with interactive widgets and <details> code drawers.
---

# How It's Made: Code Flow Verification & Inspection Runbook

## 1. Objective & Prerequisites

Deterministically reconstruct how a software feature works, providing a structured **Punto di Ingresso -> Guardie -> Processo -> Punto di Uscita** map, payload transformation trace, test coverage status, and expandable `<details>` drawers with verified source snippets. Always write user-facing explanations in plain Italian.

- **Required Tools**: File search and read tools (`grep_search`, `find_by_name`, `view_file`).
- **Core Invariant**: Zero guessing. Verify every symbol, file path, and line range (`#Lstart-Lend`) by reading the source file before replying.

---

## 2. 5-Step Execution Pipeline

```text
[Request /how-its-made <feature/symbol>]
                │
                ▼
[Step 1: Call-Chain Discovery] ──► Locate Entry Point, intermediate hops, Exit Point & Tests
                │
                ▼
[Step 2: Widget & IPO Table]   ──► Generate <agent-embed> Dual-Tab Widget + IPO Summary Table
                │
                ▼
[Step 3: Guards & Payload]     ──► Map Early Returns and data structure transformations
                │
                ▼
[Step 4: <details> Drawers]    ──► Extract surgical 10-35 line code snippets per step
                │
                ▼
[Step 5: Verification Status]  ──► Link existing tests and highlight uncovered branches
```

---

## 3. Step-by-Step Procedure

### Step 1: Static Call-Chain Discovery
1. Use `grep_search` or `find_by_name` to locate the **Punto di Ingresso** (event listener, route handler, controller, entry function).
2. Use `view_file` to trace calls from entry to **Punto di Uscita** (return value, DB/storage write, store mutation, or UI render).
3. Record for each hop:
   - Exact file path and line range (`L<start>-L<end>`).
   - Step tag: `[PURE]` (pure calculation), `[STATE]` (in-memory state mutation), or `[I/O]` (network, disk, DB, DOM, storage).
   - **Guard clauses** (early returns, blocking validations, `throw`).
4. Search test directories (`tests/`, `test/`, `__tests__/`, `*.test.*`, `*.spec.*`) for tests covering the traced symbols.

### Step 2: Interactive Visual Selector (`<agent-embed>`) & IPO Table
1. Start the response directly with the technical synthesis in Italian (zero filler).
2. **Build Dual-Tab HTML Widget (`Albero Testuale` | `Grafico a Blocchi`)**:
   - Base on [`references/flow-widget-template.html`](./references/flow-widget-template.html) and write `<artifact_dir>/flow-inspector-<slug>.html` (`UserFacing: true`).
   - Populate **Tab 1 (`Albero Testuale`)** with a vertical monospace spine (max 65 chars/line, branches marked `◇ BIVIO N:` with `├── [NO] ──►` / `└── [SÌ] ──►`).
   - Populate **Tab 2 (`Grafico a Blocchi`)** with vertical cards for Ingresso, 2-column branches (`Ramo [NO]` vs `Ramo [SÌ]`), Process Steps (`[PURE]`, `[STATE]`, `[I/O]`), and Uscita.
   - Embed in chat (following built-in `generative_ui` layout/theming rules):
     `<agent-embed src="file:///<artifact_dir>/flow-inspector-<slug>.html"></agent-embed>`
3. Below the widget, render the **Punto di Ingresso -> Processo -> Punto di Uscita** Markdown table with clickable `file://` links.

### Step 3: Guards (Early Returns) & Payload Trace
1. **Guardie e Uscite Anticipate**: List conditions that abort or short-circuit execution (condition, line, returned value/effect).
2. **Evoluzione del Payload**: Show how data shape transforms from `Input Grezzo` -> `Stato Intermedio Normalizzato` -> `Output Emesso`.

### Step 4: Expandable Code Drawers (`<details>`)
1. For each hop (Ingresso, Process Step, Uscita), emit a `<details>` block following [`references/inspection-template.md`](./references/inspection-template.md).
2. **Critical GFM Hygiene**: ALWAYS insert a **blank line** immediately after `</summary>` and before `</details>`.
3. Restrict each snippet to the relevant **10–35 lines**, preceded by its clickable `[file.ext:L10-L32](file:///...)` link.

### Step 5: Verification Status & Test Coverage
1. Link automated tests (`file://` to `describe` / `it` blocks).
2. Explicitly flag **coverage gaps** (untested guards, unmocked I/O error branches).

---

## 4. Reference Templates & Quality Checklist

- **HTML Widget Template (`<agent-embed>`)**: [`references/flow-widget-template.html`](./references/flow-widget-template.html).
- **Markdown Output Template**: [`references/inspection-template.md`](./references/inspection-template.md).
- **Sample Inspection**: [`examples/sample-inspection.md`](./examples/sample-inspection.md).
- **Final Verification Checklist**:
  - [ ] `<agent-embed>` widget exposes working `Albero Testuale` | `Grafico a Blocchi` tabs.
  - [ ] All links use `file:///` with forward slashes `/` and verified `#Lstart-Lend` ranges.
  - [ ] Every process step declares `[PURE]`, `[STATE]`, or `[I/O]`.
  - [ ] Every `<details>` drawer has a blank line after `</summary>` and contains 10–35 lines.

# Code Inspection & Execution Flow Verification Protocol (`/how-its-made`)

Defines standards for deterministic code-level reconstruction and verification of software features. Always reply to the user in plain Italian.

## 1. 5-Stage Extended IPO Model (Entry -> Guards -> Process -> Payload -> Exit)
1. **Entry Point (`Punto di Ingresso`)**: Exact trigger (UI, route, CLI, function) with clickable `[symbol](file:///path/file.ext#L10-L25)` link and parameter/precondition contract.
2. **Guards & Early Returns (`Guardie e Uscite Anticipate`)**: `if (!valid) return` clauses, exceptions, and cache fallbacks.
3. **Process (`Processo`, 3–7 Steps with Semantic Tag)**:
   - `[PURE]`: Deterministic calculation/transformation without side effects.
   - `[STATE]`: In-memory state mutation, reactive store, or cache update.
   - `[I/O]`: External interaction (network, DB, disk, `localStorage`, DOM).
4. **Payload Trace (`Tracciamento del Payload`)**: Shape evolution `Input Grezzo` -> `Dato Validato` -> `Output / Effetto Finale`.
5. **Exit Point & Test Coverage (`Punto di Uscita e Test Coverage`)**: Return value, side effects, and test file links (`[name.test.js](file:///...)`).

## 2. Interactive Widget (`<agent-embed>`) & Surgical Code Drawers (`<details>`)
1. **Dual-Tab HTML Artifact (`role="tablist"`)**: Generate `<artifact_dir>/flow-inspector-<slug>.html` (`UserFacing: true`) from `references/flow-widget-template.html` and embed via `<agent-embed src="file:///<artifact_dir>/flow-inspector-<slug>.html"></agent-embed>`:
   - **Tab 1 — `Albero Testuale` (default)**: Vertical monospace spine (`<= 65` chars/line) with `◇ BIVIO` and branches `├── [NO] ──►` / `└── [SÌ] ──►`.
   - **Tab 2 — `Grafico a Blocchi`**: Theme-aware cards, `grid-cols-2` branches, and `[PURE]`/`[STATE]`/`[I/O]` badges, delegating layout/theming rules to built-in `generative_ui`.
2. **Verified Line Numbers & Surgical Snippets**: ALWAYS read files via `view_file`/`read_file` before citing `#Lxx-Lyy`; extract only the relevant **10–35 lines** inside `<details>`, leaving a **mandatory blank line** immediately after `</summary>`.

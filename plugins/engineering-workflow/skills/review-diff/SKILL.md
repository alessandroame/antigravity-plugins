---
name: review-diff
description: >-
  Use this skill when the user invokes /review-diff or before delivering multi-file changes
  to run deterministic git diff triage, detect tampered or faux tests, and launch a read-only Blind Diff Critic.
---

# Blind Adversarial Diff Review & Test Integrity Triage (`/review-diff`)

Reduces human code-review fatigue by filtering mechanical `git diff` noise, blocking silent tampering of existing tests, and delegating initial adversarial inspection to an isolated read-only subagent (`research`). Always reply to the user in plain Italian.

---

## Step 1: Deterministic Diff Triage & Test Integrity Guard (`0` LLM Tokens)

Run the triage script on the current repository before inspecting files manually:

```bash
node ~/.gemini/config/plugins/engineering-workflow/scripts/diff-triage.mjs --repo "<workspace-root>" --json
```

Evaluate the JSON output immediately:
1. **`testTamperAlerts` (`HIGH` / `MEDIUM`)**: IF an application edit deleted or weakened pre-existing assertions in `tests/` without explicit user request (`--allow-test-edits`), **BLOCK delivery** and restore the original test via `git checkout -- <test-file>` to verify whether the patch hides a regression.
2. **`fauxTestAlerts`**: IF tautological assertions (`assert.ok(true)`) or assertion-free `it()` blocks appear, replace them with independent oracle checks.
3. **`criticalHighlights` & `reductionPercent`**: Extract only high-risk hunks (`ERROR_HANDLING`, `UNSAFE_SINK`, `IO_OR_PROCESS`, `STATE_MUTATION`, `PUBLIC_CONTRACT`, `UI_LAYOUT_GEOMETRY`).

---

## Step 2: Read-Only Blind Diff Critic Subagent (`Blind Diff Critic`)

IF the diff touches `>= 2` code/UI files (or exceeds `40` modified lines), call `invoke_subagent` with `TypeName: "research"` and `Role: "Blind Diff Critic"`, passing **only** the user requirement and `diff-triage.mjs` output (without author justifications):

```markdown
Agisci come **Blind Diff Critic** in sola lettura sul repository `<workspace-root>`.
Requisito richiesto dall'utente: [INSERIRE REQUISITO]
Highlights critici estratti da diff-triage.mjs: [INSERIRE JSON SUMMARY + HIGHLIGHTS]

Mandato (Max 3 Turni Tool):
1. Leggi in modo chirurgico (`<= 120` righe) solo gli intorni `#Lxx-Lyy` indicati in `criticalHighlights` e i relativi test.
2. Cerca esclusivamente: (a) mutazioni di stato o side-effect non coperti da test, (b) casi limite o null/error silenti (`catch {}`), (c) accoppiamenti DOM nel core headless, (d) test accondiscendenti che replicano la formula del codice anziché verificare un invariante esterno.
3. Restituisci: verdetto (`APPROVATO` | `RICHIEDE_FIX`), elenco puntato delle sole righe `#Lxx-Lyy` che richiedono attenzione umana (max 5 punti) o `0` anomalie se i contratti reggono.
```

> Immediately after launching the subagent, end the turn with `0` extra tool calls and wait for native Reactive Wakeup.

---

## Step 3: Pre-Human Fix & Compact Output (`~600px`, in Italian)

1. IF `Blind Diff Critic` finds a real bug or uncovered edge case, fix it and re-run the test suite **before** presenting the work to the user.
2. Present the `0-Click` Italian verdict (analyzed files, filtered noise `%`, test integrity status, and max 3 human-attention points) with the full matrix inside `<details>`:

```markdown
Verdetto Pre-Review: **[APPROVATO | BLOCCATO]** — Rumore diff filtrato del `<X>%` (`<K>` punti critici su `<N>` righe modificate), integrità test `PASS`.

- **Integrità suite di test**: `0` asserzioni preesistenti rimosse, `0` faux-test rilevati.
- **Punti da verificare a vista**: [1-2 file `#Lxx-Lyy` con mutazioni di stato/contratti pubblici, oppure `Nessuna mutazione ad alto rischio`].

<details>
<summary><strong>Matrice Triage git diff e Audit Blind Diff Critic</strong></summary>

| File & Riga | Categoria Rischio | Esito Revisore Cieco | Azione Richiesta |
| :--- | :--- | :--- | :--- |
| [`file.mjs#L10-L25`](file:///percorso/file.mjs#L10-L25) | `STATE_MUTATION` | `PASS` — Coperto da test invariante | Lettura rapida (30s) |

</details>
```

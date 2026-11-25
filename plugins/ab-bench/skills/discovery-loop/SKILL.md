---
name: discovery-loop
description: >-
  Use this skill when the user invokes /discovery-loop or asks for multi-wave
  oracle-guided exploration in isolated worktrees with mutation archetypes,
  Pareto ranking, and blind 5-Finger selection.
---

# Discovery Loop: Oracle-Guided Multi-Wave Exploration (`/discovery-loop`)

## 1. Objective & Pure-Skill Boundaries

Run multi-wave exploration (`Mutation -> 4-Oracle Gate -> Pareto Selection`) in isolated worktrees without modifying `main` prior to explicit human approval. This skill carries `0 B` of always-on rules. Always reply to the user in plain Italian.

- Delegate Python workflow orchestration to built-in `run-workflow` using `../../references/discovery_workflow_template.py`.
- Delegate interactive comparison dashboards (if requested) to built-in `generative_ui` without duplicating its styling boilerplate.
- See [discovery-contracts.md](./references/discovery-contracts.md) for JSON contract schemas and profile thresholds.

---

## 2. Step 1: Initialize Brief & Exit Profile (`discovery.mjs --init-brief`)

Select one of the 3 exit profiles (`quick` = `20m` cap / `2` waves, `deep` = `60m` cap / `4` waves, `overnight` = `120m` cap / `6` waves). Wall-clock time is only a safety ceiling; the loop stops early on Pareto convergence, target satisfaction, resource cap, or yield collapse:

```bash
node ~/.gemini/config/plugins/ab-bench/scripts/discovery.mjs --init-brief --goal "<goal>" --scope "<rel-paths>" --profile <quick|deep|overnight> --out <scratch>/discovery-brief.json
```

---

## 3. Step 2: Execute Multi-Wave Orchestration (`run_workflow`)

Launch `run_workflow` with `ScriptPath` set to `plugins/ab-bench/references/discovery_workflow_template.py` and `Args`:
- `brief_path`: path to `discovery-brief.json`
- `output_dir`: conversation scratch output directory
- `mutator_model`: `"flash"` (divergent hypothesis generation)
- `builder_model`: `"inherit"` (isolated worktree implementation via `workspace="share"`)
- `judge_model`: `"inherit"` (blind cognitive + 5-Finger evaluation)

### Three Domain-Agnostic Mutation Archetypes
1. **Utente Distratto (`distracted-user`)**: inspects only rendered screens/outputs in `3-5s` without reading source code.
2. **Abolizionista (`extreme-abolitionist`)**: cuts `40-50%` of surface/controls/parameters while proving zero decision loss.
3. **Scettico / Fuzzer (`domain-skeptic`)**: challenges heuristics against a null model and extreme synthetic edge cases.

---

## 4. Step 3: 4-Oracle Filtering & Blind Evaluation (`discovery.mjs --evaluate`)

Before any candidate reaches the user, enforce all 4 blocking oracles (`empirical-data`, `invariance-fuzzing`, `blind-cognitive`, `technical-ab-bench`), normalize `complexityCost` uniformly from `git diff --numstat` (`1.0 + (added - deleted) / 100` clamped in `[0.1, 5.0]`), strip mutator/worktree labels via `--sanitize-batch`, and rank surviving non-dominated variants on the Pareto frontier (`--evaluate`).
- At completion, export surviving diffs to `<output_dir>/patches/*.patch` and automatically remove temporary `workflow-self-*` worktrees (`keep_worktrees: true` in `Args` to retain them).

---

## 5. Step 4: Human Selection Delivery (`~600px` Italian Drill-Down)

Present the verified summary in plain Italian (`L0` <= `12` lines + `L1`/`L2` `<details>` with blank line after every `</summary>`), keeping `main` untouched until the user chooses a candidate:

```markdown
> [!IMPORTANT]
> **DISCOVERY-LOOP (`[quick|deep|overnight]` — `[exitReason]`)**: [Motivo di uscita in 1 frase chiara].

- **Imbuto Oracoli**: `[N]` varianti generate -> `[M]` scartate dagli oracoli (`[P]%`) -> `[K]` in frontiera di Pareto.
- **Protezione Branch**: `main` invariato; nessuna modifica applicata senza conferma esplicita.
- **Selezione Umana**: scegli una delle varianti sopravvissute nei dettagli qui sotto oppure scarta il lotto.

<details>
<summary><strong>Analisi Comparativa Frontiera di Pareto, Telemetria Oracoli e Budget (Espandi)</strong></summary>

| Candidato | Archetipo | Oracoli | 5 Dita | Delta / Complessità |
| :--- | :--- | :---: | :---: | :--- |
| **Candidato A** (`[id]`) | `[archetipo]` | `4/4` | `[X]/5` | `+[D]%` · costo `[C]` |

<details>
<summary><strong>Audit Varianti Scartate e Istruzioni Worktree</strong></summary>

- **`[id-scartato]`** -> [Motivo oggettivo dell'oracolo].

</details>

</details>
```

---
name: review-diff
description: >-
  Esegue il triage deterministico di git diff, rileva test manomessi o faux-test
  e avvia un subagent revisore cieco in sola lettura. Utilizza questa skill quando
  l'utente invoca /review-diff o prima di consegnare modifiche multi-file.
---

# Blind Adversarial Diff Review & Test Integrity Triage (`/review-diff`)

Riduce il carico di code review umana filtrando il rumore meccanico di `git diff`, bloccando alterazioni silenziose dei test esistenti e delegando la prima ispezione critica a un subagent revisore cieco (`research`, sola lettura) privo dei bias dell'autore della patch.

---

## Step 1: Triage Deterministico e Guardia Integrità Test (`0` Token LLM)

Esegui lo script di triage sul repository corrente prima di aprire i file a mano:

```bash
node c:/github/antigravity-plugins/plugins/engineering-workflow/scripts/diff-triage.mjs --repo "<workspace-root>" --json
```

Valuta immediatamente l'output JSON:
1. **`testTamperAlerts` (`HIGH` / `MEDIUM`)**: se una modifica applicativa ha cancellato o alterato asserzioni preesistenti in `tests/` senza esplicita richiesta dell'utente (`--allow-test-edits`), **blocca la consegna** e ripristina il test originale con `git checkout -- <test-file>` per verificare se la patch nasconde una regressione.
2. **`fauxTestAlerts`**: se compaiono asserzioni tautologiche (`assert.ok(true)`) o blocchi `it()` privi di asserzioni, sostituiscili subito con verifiche su oracolo indipendente.
3. **`criticalHighlights` e `reductionPercent`**: estrai solo i blocchi classificati ad alto rischio (`ERROR_HANDLING`, `UNSAFE_SINK`, `IO_OR_PROCESS`, `STATE_MUTATION`, `PUBLIC_CONTRACT`, `UI_LAYOUT_GEOMETRY`).

---

## Step 2: Subagent Revisore Cieco (`Blind Diff Critic` — Sola Lettura)

Se il diff tocca `>= 2` file di codice/UI (o supera `40` righe modificate), invoca `invoke_subagent` con `TypeName: "research"` e `Role: "Blind Diff Critic"` passando **esclusivamente** l'obiettivo utente e l'output di `diff-triage.mjs` (senza giustificazioni dell'autore):

```markdown
Agisci come **Blind Diff Critic** in sola lettura sul repository `<workspace-root>`.
Requisito richiesto dall'utente: [INSERIRE REQUISITO]
Highlights critici estratti da diff-triage.mjs: [INSERIRE JSON SUMMARY + HIGHLIGHTS]

Mandato (Max 3 Turni Tool):
1. Leggi in modo chirurgico (`<= 120` righe) solo gli intorni `#Lxx-Lyy` indicati in `criticalHighlights` e i relativi test.
2. Cerca esclusivamente: (a) mutazioni di stato o side-effect non coperti da test, (b) casi limite o null/error silenti (`catch {}`), (c) accoppiamenti DOM nel core headless, (d) test accondiscendenti che replicano la formula del codice anziché verificare un invariante esterno.
3. Restituisci: verdetto (`APPROVATO` | `RICHIEDE_FIX`), elenco puntato delle sole righe `#Lxx-Lyy` che richiedono attenzione umana (max 5 punti) o `0` anomalie se i contratti reggono.
```

> Appena lanciato il subagent, termina il turno con `0` tool call aggiuntive attendendo il Reactive Wakeup nativo.

---

## Step 3: Correzione Pre-Umana e Restituzione Sintetica (`~600px`)

1. Se il `Blind Diff Critic` individua un difetto reale o un caso limite scoperto, correggilo subito ed esegui nuovamente la suite di test **prima** di presentare il lavoro all'utente.
2. Esponi in chat (*0-Click*) il verdetto sintetico (file analizzati, `%` di rumore scartato, stato integrità test e max 3 punti residui per l'occhio umano) racchiudendo la matrice completa in `<details>`:

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

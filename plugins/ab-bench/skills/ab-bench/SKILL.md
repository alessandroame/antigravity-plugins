---
name: ab-bench
description: >-
  Use this skill when the user invokes /ab-bench or asks to benchmark a prompt, skill, or plugin
  via a blind A/B comparison using the 5-Finger Test and real transcript timing metrics.
---

# A/B Bench: Blind 5-Finger Challenge Runbook (`/ab-bench`)

## 1. Objective & Command Parsing (`scripts/bench.mjs --parse`)

Empirically measure without bias whether a skill/plugin (e.g., `/skizzo`) or alternative prompt outperforms a baseline prompt on the same task. Always present final output to the user in plain Italian.

- **`/ab-bench <compito>`**: compares **Senza `/skizzo` (Controllo A)** vs **Con `/skizzo` (Trattamento B)**.
- **`/ab-bench --skill <nome> <compito>`**: compares **Senza `<nome>` (Controllo A)** vs **Con `<nome>` (Trattamento B)**.
- **`/ab-bench "<Prompt A>" vs "<Prompt B>"`**: compares **Prompt A** vs **Prompt B**.
- **`/ab-bench --stats`**: runs `node ~/.gemini/config/plugins/ab-bench/scripts/bench.mjs --stats` and displays the historical scoreboard.

---

## 2. Step 1: Parallel Challenger Execution (`invoke_subagent`)

Invoke two independent `research` subagents in a **single `invoke_subagent` call**:
1. **Control Subagent A (`Sfidante A`, `<id-a>`)**: Solves `<compito>` directly in a single pass without activating the tested plugin/skill.
2. **Treatment Subagent B (`Sfidante B`, `<id-b>`)**: Solves `<compito>` strictly applying the tested plugin/skill rules.

---

## 3. Step 2: Physical Measurement & Anonymization (`bench.mjs --prepare`)

Once both challengers complete, run `bench.mjs --prepare` with `<id-a>` and `<id-b>` to:
1. Extract real `durationMs`, `steps`, `toolCalls`, and tokens from `transcript.jsonl`.
2. Strip identifiable plugin signatures (`sanitizeForBlindJudge`, e.g., `MODALITÀ SKIZZO ATTIVA` banners or `conversation://` links).
3. Cryptographically assign blind labels **`Soluzione X`** and **`Soluzione Y`**.

---

## 4. Step 3: Blind 5-Finger Judge (`invoke_subagent`)

Invoke a third independent subagent (`Role: "Blind 5-Finger Judge"`, `TypeName: "research"`) passing **only** the task requirement and the anonymized `Soluzione X` and `Soluzione Y` texts:

```markdown
Agisci come **Giudice Cieco Indipendente**. Valuta `Soluzione X` e `Soluzione Y` sul seguente requisito:
[INSERIRE COMPITO]

Assegna esclusivamente `1` (SÌ) oppure `0` (NO) per ciascuna delle 5 Dita (vietati decimali):
1. **Pollice (Va al primo colpo)**: completa, eseguibile subito, zero crash o TODO lasciati a metà.
2. **Indice (Meno click / fatica)**: riduce al minimo passaggi manuali, click e scelte inutili per l'utente.
3. **Medio (Tolleranza input sporchi)**: normalizza spazi extra, separatori misti e formati imperfetti (Postel).
4. **Anulare (Tenuta casi limite)**: gestisce input vuoti, null, zero o viewport 360px senza rompersi.
5. **Mignolo (Logica pulita / separata)**: motore di calcolo isolato dalla grafica e verificato da test.

Restituisci un blocco JSON con `scoresX: [0|1, 0|1, 0|1, 0|1, 0|1]`, `scoresY: [0|1, 0|1, 0|1, 0|1, 0|1]` e una motivazione di 1 riga per ciascun dito.
```

---

## 5. Step 4: Verdict Calculation, History Logging & Output (`~600px`)

Run `node ~/.gemini/config/plugins/ab-bench/scripts/bench.mjs --evaluate` with judge scores and transcript metrics to log the result in `~/.gemini/antigravity/analytics/ab-bench-history.ndjson` and output the Italian progressive disclosure block (`0-Click` <= 12 lines + `<details>` with blank line after `</summary>`):

```markdown
> [!IMPORTANT]
> **VERDETTO AB-BENCH (`[Label B]` vs `[Label A]`)**: **[SÌ, VALEVA LA PENA | NO, TEMPO SPRECATO | NO, DANNO DA OVER-ENGINEERING]** — `[Label B]` ottiene **[B]/5 dita** contro **[A]/5** (`[Δ dita]`, `[Δ secondi]`).

- **Punteggio Uomo della Pietra**: `[Label A]`: **[A]/5 dita** (`[Ta]s`, `[Sa] step`) · `[Label B]`: **[B]/5 dita** (`[Tb]s`, `[Sb] step`).
- **Differenza pratica sulle 5 Dita**: [1 riga sulle dita guadagnate o perse e perché].
- **Rapporto Tempo / Beneficio**: [1 riga sul costo in secondi extra per dito guadagnato o sul risparmio di A].
- **Tracciabilità Cieca**: [`Sfidante A`](conversation://<id-a>) · [`Sfidante B`](conversation://<id-b>) · [`Giudice Cieco`](conversation://<id-judge>).

<details>
<summary><strong>Tabella delle 5 Dita, Metriche Fisiche e Verdetto del Giudice Cieco</strong></summary>

| Dito (Criterio Pratico) | [Label A] | [Label B] | Motivazione del Giudice Cieco |
| :--- | :---: | :---: | :--- |
| **1. Pollice** — Va al primo colpo | `[0/1]` | `[0/1]` | [Nota] |
| **2. Indice** — Meno click / fatica | `[0/1]` | `[0/1]` | [Nota] |
| **3. Medio** — Tolleranza input sporchi | `[0/1]` | `[0/1]` | [Nota] |
| **4. Anulare** — Tenuta casi limite | `[0/1]` | `[0/1]` | [Nota] |
| **5. Mignolo** — Logica pulita / separata | `[0/1]` | `[0/1]` | [Nota] |
| **TOTALE & TEMPI REALI** | **[A]/5** (`[Ta]s`) | **[B]/5** (`[Tb]s`) | **Vincitore: `[Vincitore]`** |

</details>
```

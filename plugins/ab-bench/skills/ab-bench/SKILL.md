---
name: ab-bench
description: >-
  Esegue un confronto cieco A/B tra un prompt base e una variante con plugin o skill
  tramite il Test delle 5 Dita e metriche reali di tempo. Utilizza questa skill quando
  l'utente invoca /ab-bench o chiede di misurare l'efficacia di un prompt o plugin.
---

# A/B Bench: Runbook di Sfida Cieca su 5 Dita (`/ab-bench`)

## 1. Obiettivo e Modalità di Attivazione

Misura in modo empirico e senza pregiudizi se l'uso di una skill/plugin (es. `/skizzo`) o di un prompt alternativo produce un risultato concretamente migliore rispetto al prompt base sullo stesso compito.

### Parsing del Comando (`scripts/bench.mjs --parse`)
- **`/ab-bench <compito>`**: confronta **Senza `/skizzo` (Controllo A)** vs **Con `/skizzo` (Trattamento B)**.
- **`/ab-bench --skill <nome> <compito>`**: confronta **Senza `<nome>` (Controllo A)** vs **Con `<nome>` (Trattamento B)**.
- **`/ab-bench "<Prompt A>" vs "<Prompt B>"`**: confronta **Prompt A** vs **Prompt B**.
- **`/ab-bench --stats`**: esegue `node ~/.gemini/config/plugins/ab-bench/scripts/bench.mjs --stats` e mostra il tabellone storico delle sfide passate.

---

## 2. Step 1: Esecuzione Parallela dei 2 Sfidanti (`invoke_subagent`)

Invoca in **un'unica chiamata `invoke_subagent`** due worker `research` indipendenti:
1. **Subagent Controllo A (`Baseline Challenger`, `<id-a>`)**:
   - Risolve `<compito>` direttamente in un singolo passaggio senza attivare il plugin/skill in esame.
2. **Subagent Trattamento B (`Enhanced Challenger`, `<id-b>`)**:
   - Risolve lo stesso `<compito>` applicando rigorosamente le regole del plugin/skill sotto test (es. per `skizzo`: esegue internamente l'analisi Tecnico Alpha + Dominio Beta + Sintesi di Tesler).

---

## 3. Step 2: Misura Fisica e Anonimizzazione (`bench.mjs --prepare`)

Al termine dei due sfidanti, esegui `bench.mjs --prepare` passando i due `conversationId` (`<id-a>` e `<id-b>`) e i testi delle due soluzioni per:
1. Estrarre dai rispettivi `transcript.jsonl` i tempi reali (`durationMs`), gli step, le chiamate tool e i token.
2. Rimuovere qualsiasi firma riconoscibile del plugin (`sanitizeForBlindJudge`, es. banner `MODALITÀ SKIZZO ATTIVA` o link `conversation://`).
3. Assegnare casualmente/crittograficamente le etichette cieche **`Soluzione X`** e **`Soluzione Y`**.

---

## 4. Step 3: Il Giudice Cieco sulle 5 Dita (`invoke_subagent`)

Invoca un terzo subagent indipendente (`Role: "Blind 5-Finger Judge"`, `TypeName: "research"`) passandogli **solo** il compito originale e i testi anonimizzati di `Soluzione X` e `Soluzione Y`:

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

## 5. Step 4: Calcolo Verdetto, Salvataggio Storico e Output (`~600px`)

Esegui `node ~/.gemini/config/plugins/ab-bench/scripts/bench.mjs --evaluate` passando i punteggi del giudice e le metriche per salvare la sfida in `~/.gemini/antigravity/analytics/ab-bench-history.ndjson` e stampare il verdetto nel formato a divulgazione progressiva (`0-Click` $\le 12\text{ righe}$ + `<details>` con riga vuota dopo `</summary>`):

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

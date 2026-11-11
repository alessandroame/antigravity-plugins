---
name: skizzo
description: >-
  Use this skill when the user invokes /skizzo or a multi-domain design tradeoff emerges
  to run dynamic 2-to-4 subagent orchestration ranked by LLM importance with Auto-Skizzo Silente.
---

# Skizzo: Dynamic Multi-Domain Orchestration, LLM Ranking & Mediator (`/skizzo`)

## 1. Objective, LLM Domain Discovery (`2..4` Agents) & `Auto-Skizzo Silente` (`AUTO`)

Orchestrates **`2` to `4` custom subagents** in parallel competition and collaboration when a task involves real multi-perspective tradeoffs (`score >= 4` in implicit `AUTO` mode, `score >= 3` when explicitly invoked via `/skizzo`), while replying **immediately in direct mode (`FAST-PASS`, `0` subagents)** on operational commands, read-only questions, and single-choice micro-edits. Always write user-facing output in plain Italian.

### Discovery, Importance Ranking & Stopping Rule (`2 <= N <= 4`)
Zero pre-wired roles: when a task passes `FAST-PASS`, the parent LLM determines **how many** and **which** agents are needed:
1. **Open Domain Identification**: Extract all disciplines, specialist competencies, or stakeholder perspectives involved (without forcing a coding role on non-software decisions).
2. **Importance Ranking (`rankAndCapDomains`)**:
   - Score each candidate domain on **Primary Impact (`importance`, `0..10`)**, **Dialectical Tension (`tension`, `0..10`)**, and **Omission Risk** (`priorityScore = importance * 2 + tension`).
3. **Occam's Razor Stopping Rule (`2 vs 3 vs 4` Agents)**:
   - **Start at `N = 2` (`DUAL-TRACK`)** with the top 2 conflicting domains.
   - **Add a `3rd` (`TRI-TRACK`) or `4th` (`QUAD-TRACK`, hard cap)** *only if* it introduces an **orthogonal structural constraint or verification oracle** not covered by the first two (or if explicitly requested via *"con 3 agenti"* / `--tracks 3`).
4. **Custom Instantiation**: For each selected domain (`Alpha`, `Beta`, `Delta`, `Epsilon`), define **Role Title**, **Non-Negotiable Mandate**, **1–2 leaf skills** from `<skills>` (NEVER `skizzo` or `ab-bench`), and **Verification Oracle**.
5. **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, active with `--mediator` / `-m`)**: Impartial arbiter querying active subagents via `send_message` (max 1 round).

> **Telemetry Self-Sufficiency**: This runbook contains all required templates. Do NOT call `view_file` on `references/dialectic-template.md` during normal execution.

---

## 2. Step 0: `Auto-Skizzo Silente` (`AUTO`), Sticky (`ON`), Overrides & Stop

1. **Default `SKIZZO = AUTO`**: At Turn 1, **Gate 0** (`plugins/skizzo/scripts/triage.mjs`) evaluates the prompt:
   - Implicit `FAST-PASS` (`silentFastPass: true`): reply directly with **`0` subagents and `0 bytes` of banner**.
   - `score >= 4`: rank domains (`max 4`), launch `2..4` subagents in parallel, and prefix chat title with `[SKIZZO] `.
2. **Explicit Sticky (`SKIZZO = ON`)**: `/skizzo`, `/skizzo on`, `/skizzo --mediator` (`-m`), or `/skizzo <task>` sets `SKIZZO = ON` (`score >= 3`, showing `[!NOTE]` on `FAST-PASS`).
3. **Natural Language / Flag Overrides & Stop**:
   - **Force**: *"forza skizzo"*, *"con 3 agenti"*, *"usa 4 domini"*, `--force`, `--tracks 2..4`.
   - **Skip 1 Turn**: *"senza skizzo"*, *"vai veloce"*, `--skip`, `--fast`.
   - **Stop**: `stop skizzo`, `ferma skizzo`, `/skizzo stop`, `/skizzo off` -> sets `SKIZZO = OFF` and removes `[SKIZZO]` from title via `node ~/.gemini/config/plugins/cognitive-persistence/scripts/set-chat-title.mjs --conversation-id "<Conversation ID>" --title "<Titolo>"`.

---

## 3. Step 0.5 (Gate 0): Pre-Filter (`FAST-PASS` vs `MULTI-TRACK`, `< 5ms`)

**Before reading any project file (`0` pre-triage `read_file` calls)**, evaluate Turn 1 via `plugins/skizzo/scripts/triage.mjs`:
- **A. Ops, Git, Test, Sync, Memory, or Plan Confirmation** (`/memory-sync`, `/take-note`, `git`, `start server`, *"fallo"*, *"vai"*, *"procedi"*) -> **`FAST-PASS` (`0` Subagents)**.
- **B. Informational Questions or `"non agire / solo una domanda"`** (*"spiega"*, *"dove si trova"*, `/how-its-made`, *"non agire facciamo solo un piano"*) -> **`FAST-PASS` (`0` Subagents)**.
- **C. Zero-Choice Surgical Micro-Edits** (typo, rename, single-file constant/color tweak) -> **`FAST-PASS` (`0` Subagents)**.
- **D. Multi-Domain Decisions (`score >= 4` in `AUTO`, `>= 3` in `ON`)** -> **`2..4` Subagents (`DUAL`/`TRI`/`QUAD-TRACK`)**.

### Explicit `FAST-PASS` Template (`silentFastPass: false` only)
```markdown
> [!NOTE]
> **MODALITÀ SKIZZO ATTIVA (`FAST-PASS` — Risposta rapida per [comando operativo | domanda di lettura | modifica puntuale], ~90s risparmiati)** · Resta attiva per i prossimi messaggi · Scrivi `"forza skizzo"` (o `/skizzo --force`) per forzare gli agenti.
```

---

## 4. Step 1: Parallel Instantiation of Top `2..4` Domains & Intermediate Silence

Launch all `2..4` subagents (`Alpha`, `Beta`, and optional `Delta`, `Epsilon`) in a **single `invoke_subagent` call** (`TypeName: "research"`):
- **Zero Polling & Partial-Wakeup Silence**: Immediately after `invoke_subagent` (and while any subagent is still `running`), **NEVER call `schedule`, NEVER call `manage_subagents(Action: 'list')`, and emit `0 bytes` of intermediate text**; end the turn immediately.

### Parametric Subagent Prompt Template — `<trackId>` (`<Ruolo del Dominio #Rank>`)
```markdown
Agisci esclusivamente come **Subagent <trackId> (<Titolo del Ruolo di Dominio Istanziato> — Priorità #<Rank>)** sul seguente requisito:
[INSERIRE TASK UTENTE]

**Skill Attive Assegnate**: [INSERIRE 1-2 SKILL VERTICALI FOGLIA PERTINENTI AL DOMINIO — MAI `skizzo`]

**Mandato Esclusivo di Dominio (Budget Rigido: Max 4 Turni Tool)**:
1. **Dichiarazione Skill alla Partenza (Rigo 1 Obbligatorio)**: apri al rigo 1 con **Skill Attive (<trackId> - <Ruolo>)**: seguito dagli ID `kebab-case`.
2. **Budget di Ricerca Chirurgica (`<= 4` turni di tool)**: se il task tocca file del workspace, usa `grep_search` e letture mirate (`<= 150` righe per chiamata, zero scansioni integrali di file lunghi) per individuare in massimo 4 turni i punti esatti coinvolti (`#Lxx-Lyy`).
3. **Prospettiva Non Negoziabile**: valuta e progetta la soluzione difendendo rigorosamente i principi, i vincoli e gli interessi del tuo dominio specifico (`<Mandato su misura generato dall'LLM>`). Non annacquare la tua posizione per compiacere gli altri domini.
4. **Oracolo di Verifica (`<trackId>`)**: definisci il test, l'invariante o il criterio oggettivo che certifica il rispetto del tuo dominio.
5. **Formato Output**: restituisci (a) Proposta operativa (e file/righe `#Lxx-Lyy` se applicabile), (b) Beneficio concreto o rischio evitato dal tuo punto di vista (in 1 frase chiara senza gergo), (c) Specifica dell'Oracolo di Verifica, (d) Confini non negoziabili.
6. **Replica Peer-to-Peer al Mediatore (`send_message`)**: se risvegliato da `Subagent Gamma` (`sender=<id-gamma>`), rispondi con `send_message(Recipient: "<id-gamma>", Message: "...")` e termina il turno.
```

---

## 5. Step 2, Step 3 & Step 4: Cross-Critique, Post-Edit Verification & "Human-First" Output (`~600px`)

1. **Cross-Critique / Mediator**: Synthesize a unified solution satisfying **all active oracles** (or invoke `Subagent Gamma` when `--mediator` is set).
2. **No Blind Self-Certification in Step 3**: After the final `edit_file`/`write_file`, run real verification commands (`npm test`, `diff-triage.mjs`, `ui-geometry-probe.js`) and report measured results in `Oracolo & Esito` (`PASS (0 tamper, 14/14 test)`).
3. **Mandatory "Human-First" Delivery Format (Fixed 4-Column Table inside `<details>`)**:

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK` | `TRI-TRACK` | `QUAD-TRACK` — `N` Domini per Importanza)** — Subagent: [`1° <Ruolo Alpha>`](conversation://<id-alpha>) · [`2° <Ruolo Beta>`](conversation://<id-beta>) [· [`3° <Ruolo Delta>`](conversation://<id-delta>) · [`4° <Ruolo Epsilon>`](conversation://<id-epsilon>)]

[1-2 frasi semplici in italiano quotidiano sul risultato concreto.]

- **Cosa cambia per te**: [1 riga concreta sul risultato pratico].
- **Contributo dei domini attivati (in ordine di importanza)**: [1 riga sintetica su cosa ha garantito ciascuno dei 2..4 ruoli istanziati].
- **Conflitto risolto tra i ruoli (e perché vince questa sintesi)**: [1 riga sul compromesso superato] — **Controlli**: `Tutti i test/oracoli superati (X/X OK)`.

<details>
<summary><strong>Dettagli Tecnici, Matrice Multi-Dominio Ordinata per Importanza e Verifiche</strong></summary>

| # Dominio (Per Importanza) | Skill & Mandato | Proposta Chiave | Oracolo & Esito |
| :--- | :--- | :--- | :--- |
| **1° `<Ruolo Alpha>`** | `<skills-alpha>` — [Mandato] | [Proposta Alpha] | `PASS` — [Oracolo Alpha] |
| **2° `<Ruolo Beta>`** | `<skills-beta>` — [Mandato] | [Proposta Beta] | `PASS` — [Oracolo Beta] |
| **[3° `<Ruolo Delta>`]** | `<skills-delta>` — [Mandato] | [Proposta Delta] | `PASS` — [Oracolo Delta] |
| **[4° `<Ruolo Epsilon>`]** | `<skills-epsilon>` — [Mandato] | [Proposta Epsilon] | `PASS` — [Oracolo Epsilon] |

- **Sintesi Unificata & Criterio di Priorità (`Max 4`)**: [Come sono state fuse le proposte e perché sono stati scelti questi `N` domini].
- **Dietro le quinte (Cross-Critique tra i `N` domini)**: [Sintesi dei punti di attrito risolti].
- **Verifiche & File Aggiornati**: [Stato oracoli e file toccati].

</details>
```

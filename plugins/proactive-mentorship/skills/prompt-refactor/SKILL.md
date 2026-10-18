---
name: prompt-refactor
description: >-
  Utilizza questa skill quando un prompt presenta ambiguità, attrito di workflow Antigravity o correzioni ricorrenti all'agente, applicando refactoring Before/After, comandi nativi AGY e addestramento L0-L3.
---

# Prompt Refactoring, Antigravity Coaching & Agent Training Runbook

## 1. Obiettivo e Architettura a 3 Dimensioni

Questa skill trasforma un momento di attrito (prompt vago, uso dispersivo dell'IDE o correzione ripetuta all'agente) in un kit **Copia-Incolla immediato** su 3 dimensioni:
1. **Prompt Refactoring (Determinismo 1-Shot & Token Economy)**: iniezione dei percorsi esatti `@file`, perimetro chiuso e comando oggettivo di verifica.
2. **Antigravity Workflow Coaching (Just-in-Time)**: selezione dell'**unica** scorciatoia nativa di Antigravity che dimezza i passaggi manuali per il task corrente (prontuario completo in [agy-commands-and-context.md](./references/agy-commands-and-context.md)).
3. **Agent Training & Harness Engineering (`L0..L3`)**: trasformazione delle correzioni ricorrenti dell'utente in memoria di progetto, regole `/learn`, skill procedurali o test automatici shift-left (prontuario completo in [agent-training-ladder.md](./references/agent-training-ladder.md)).

---

## 2. Procedura Operativa Sequenziale (Step 1 -> Step 4)

### Step 1 — Verifica del Gate Anti-Disturbo
Prima di emettere qualsiasi suggerimento, verifica la **Clausola di Silenzio**:
- Il prompt cita già il file bersaglio (`@file` o funzione), tocca `<= 2 file` e non presenta rischi architetturali né correzioni ripetute?
  - **SÌ**: **Taci (`0 byte` di coaching)** ed esegui direttamente il task richiesto.
  - **NO**: Procedi allo **Step 2**.

### Step 2 — Selezione della Singola Mossa Antigravity (Legge di Hick)
Identifica il collo di bottiglia principale dell'utente e seleziona **1 solo comando nativo** (consulta [agy-commands-and-context.md](./references/agy-commands-and-context.md) per i template compilati):

| Sintomo Rilevato nel Messaggio Utente | Mossa Antigravity Prioritaria | Perché Risparmia Tempo e Token |
| :--- | :--- | :--- |
| **Requisito ampio con scelte di design implicite** | `/grill-me <obiettivo>` | L'agente intervista l'utente sui buchi logici prima di scrivere codice errato. |
| **Modifica su `>= 3 file` o refactoring strutturale** | `/plan <obiettivo>` | Produce un piano d'azione approvabile prima di toccare il codice sorgente. |
| **Confronto critico tra purezza tecnica e UX** | `/skizzo <obiettivo>` | Mette in parallelo l'Agente Tecnico (`Alpha`) e l'Agente Utente (`Beta`). |
| **Prompt telegrafico di poche parole da strutturare** | `/boost <bozza>` | Espande la richiesta con vincoli, casi limite e criteri di accettazione. |
| **Task lungo autonomo con test di uscita chiaro** | `/goal <obiettivo e test>` | L'agente itera in autonomia finché tutti i controlli non sono verdi. |
| **Chat oltre 25-30 turni o cambio di argomento** | `/compact` | Comprime lo storico liberando la finestra di contesto dalle scorie precedenti. |
| **Correzione comportamentale ripetuta all'agente** | `/learn <regola>` | Persiste subito la correzione per le sessioni future senza ripeterla a mano. |
| **Dubbio su quale prompt o skill funzioni meglio** | `/ab-bench <compito>` | Esegue una sfida cieca A/B misurando il Test delle 5 Dita e il tempo reale. |

### Step 3 — Classificazione sull'Agent Training Ladder (`L0..L3`)
Se l'utente sta correggendo l'agente o ripetendo una procedura a mano, scegli il gradino minimo efficace (dettagli e template in [agent-training-ladder.md](./references/agent-training-ladder.md)):
1. **L0 (Prompt 1-Shot + Esempio Prima/Dopo)**: errore isolato dovuto a istruzione ambigua nel turno corrente.
2. **L1 (`MEMORY.md` — Vincolo di Progetto)**: insidia specifica di questo codebase non intercettabile con una semplice regex.
3. **L2a (`/learn` o `rules/AGENTS.md` — Regola Globale/Sempre Attiva)**: preferenza o divieto comportamentale valido su ogni turno.
4. **L2b (`skills/<nome>/SKILL.md` — Procedura Riutilizzabile)**: checklist manuale di `>= 3 passaggi` che l'utente incolla ripetutamente.
5. **L3 (`scripts/validate.mjs` o Test Unitario — Zero-Token Guard)**: errore verificabile via codice (`Regex`, `AST`, limite righe/byte, token vietati). **Regola d'Oro**: se può diventare un test `L3` in `< 20 righe`, non lasciarlo come testo in `L1`/`L2`.

### Step 4 — Confezionamento del Kit "Copia-Incolla" in `<details>`
Genera l'avviso di 1 riga a 0-Click e racchiudi in `<details>` (con **riga vuota obbligatoria dopo `</summary>`**) solo i blocchi pertinenti, già precompilati con i percorsi reali del repository:

```markdown
> [!IMPORTANT]
> **Scrutinio & Coaching**: [1 frase secca sul rischio/attrito e sull'unica mossa o regola consigliata].

<details>
<summary><strong>Proactive Mentorship, Mossa Antigravity & Agent Training (Espandi kit pronto all'uso)</strong></summary>

- **Rischio / Attrito Identificato**: [Causa tecnica, spreco di contesto o motivo dell'errore dell'agente]
- **Alternativa Più Snella**: [Soluzione tecnica o di workflow più diretta]
- **Mossa Antigravity Consigliata**: `[Comando esatto compilato, es. /grill-me ... | /compact | /plan ...]` — [1 riga sul vantaggio immediato]
- **Pillola di Addestramento Agente (`L0..L3`)**: [Comando `/learn ...`, blocco `MEMORY.md`, bozza `SKILL.md` o asserzione `L3` pronta da incollare]

#### Prompt Ricevuto:
`[Testo o sintesi del prompt iniziale]`

#### Prompt Ottimizzato (Target Diretto & Verifica):
`[Versione ottimizzata con @percorso/file esatti e comando di test]`

</details>
```

---

## 3. Compressione del Contesto per Payload LLM (Tabular Token Economy)

Quando un prompt o una chiamata LLM deve trasmettere serie storiche, metriche o elenchi strutturati:
- **Evitare Array JSON Verbosi**: non ripetere le chiavi JSON per decine di oggetti identici.
- **Usare Tabelle Pipe-Delimited Compatte**:
  ```text
  Time | Wind (km/h) | Gusts | Dir | Temp (C) | Rain
  10:00| 8           | 12    | S   | 18       | 0.0
  11:00| 12          | 18    | SSW | 21       | 0.0
  ```
- **Beneficio**: riduzione fino all'80% dei token consumati nel contesto e minore latenza di risposta.

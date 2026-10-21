---
name: prompt-refactor
description: >-
  Utilizza questa skill quando un prompt presenta ambiguità, attrito di workflow Antigravity,
  regressioni o correzioni all'agente, applicando auto-apprendimento continuo L0-L3,
  session-miner.mjs e refactoring Before/After.
---

# Prompt Refactoring, Antigravity Coaching & Autonomous Self-Learning Runbook

## 1. Obiettivo e Architettura a 3 Dimensioni

Questa skill trasforma un momento di attrito (prompt vago, regressione ricorrente o lezione emersa in sessione) in **auto-apprendimento immediato dell'agente (`Zero-Prompt Self-Learning`)** e in un kit operativo su 3 dimensioni:
1. **Prompt Refactoring (Determinismo 1-Shot & Token Economy)**: iniezione dei percorsi esatti `@file`, perimetro chiuso e comando oggettivo di verifica.
2. **Antigravity Workflow Coaching (Just-in-Time)**: selezione dell'**unica** scorciatoia nativa di Antigravity che dimezza i passaggi manuali per il task corrente (prontuario completo in [agy-commands-and-context.md](./references/agy-commands-and-context.md)).
3. **Autonomous Self-Learning & Harness Engineering (`L0..L3`)**: estrazione automatica delle lezioni apprese nella sessione (tramite [`scripts/session-miner.mjs`](./scripts/session-miner.mjs) e [agent-training-ladder.md](./references/agent-training-ladder.md)) con promozione diretta in test/sonde `L3`, skill `L2b`, regole `L2a` o `MEMORY.md` (`L1`), validazione `validate.mjs --all` e sincronizzazione `npm run sync`.

---

## 2. Procedura Operativa Sequenziale (Step 1 -> Step 4)

### Step 1 — Verifica del Gate Anti-Disturbo
Prima di emettere qualsiasi suggerimento, verifica la **Clausola di Silenzio**:
- Il prompt cita già il file bersaglio (`@file` o funzione), tocca `<= 2 file` e non presenta rischi architetturali né correzioni o lezioni da apprendere?
  - **SÌ**: **Taci (`0 byte` di coaching)** ed esegui direttamente il task richiesto.
  - **NO**: Procedi allo **Step 2**.

### Step 2 — Selezione della Singola Mossa Antigravity (Legge di Hick)
Identifica il collo di bottiglia principale dell'utente e seleziona **1 solo comando nativo** (consulta [agy-commands-and-context.md](./references/agy-commands-and-context.md) per i template compilati):

| Sintomo Rilevato nel Messaggio Utente | Mossa Antigravity Prioritaria | Perché Risparmia Tempo e Token |
| :--- | :--- | :--- |
| **Requisito ampio con scelte di design implicite** | `/grill-me <obiettivo>` | L'agente intervista l'utente sui buchi logici prima di scrivere codice errato. |
| **Modifica su `>= 3 file` o refactoring strutturale** | `/plan <obiettivo>` | Produce un piano d'azione approvabile prima di toccare il codice sorgente. |
| **Confronto critico tra purezza tecnica e UX** | `/skizzo <obiettivo>` | Attivo di serie in `Auto-Skizzo Silente` sui bivi `score >= 4` (forzabile con `--force`). |
| **Prompt telegrafico di poche parole da strutturare** | `/boost <bozza>` | Espande la richiesta con vincoli, casi limite e criteri di accettazione. |
| **Task lungo autonomo con test di uscita chiaro** | `/goal <obiettivo e test>` | L'agente itera in autonomia finché tutti i controlli non sono verdi. |
| **Chat oltre 25-30 turni o cambio di argomento** | `/compact` | Comprime lo storico liberando la finestra di contesto dalle scorie precedenti. |
| **Dubbio su quale prompt o skill funzioni meglio** | `/ab-bench <compito>` | Esegue una sfida cieca A/B misurando il Test delle 5 Dita e il tempo reale. |

### Step 3 — Auto-Apprendimento Autonomo sull'Agent Training Ladder (`L0..L3`)
Quando l'utente corregge l'agente, segnala una regressione (`"avviene ancora"`, `"non funziona"`) o chiede di analizzare le sessioni passate:
1. **Mining Deterministico delle Sessioni (`session-miner.mjs`)**:
   - Esegui `node plugins/proactive-mentorship/scripts/session-miner.mjs --limit 40` per estrarre le statistiche sui pattern ricorrenti (`sessionToPluginEvolution`, `repeatedRegressionOrFriction`, `readonlyQuestionWithClause`) e i candidati `L1..L3`.
2. **Applicazione Autonoma sul Gradino Minimo Efficace (`Act -> Verify -> Sync -> 1-Line Receipt`)**:
   - **L0 (Prompt 1-Shot + Esempio Prima/Dopo)**: ambiguità isolata nel turno corrente.
   - **L1 (`MEMORY.md` + Test Invariante Locale)**: insidia specifica di questo codebase -> aggiorna *in-place* `MEMORY.md` **e** aggiungi un test unitario numerico/geometrico nel progetto per bloccare la regressione.
   - **L2b (`skills/<nome>/SKILL.md` o `references/`)**: procedura riutilizzabile multi-step (`0 token` fissi nel System Prompt, `<= 200` righe).
   - **L2a (`rules/AGENTS.md` — Regola Sempre Attiva)**: preferenza universale -> aggiorna *in-place* compattando il file sotto `<= 6.500 byte`.
   - **L3 (`scripts/validate.mjs`, `triage.mjs`, `ui-geometry-probe.js`, Test Unitario — Zero-Token Guard)**: se può diventare un controllo eseguibile in `< 20 righe`, **codificalo sempre in `L3`**.
3. **Validazione e Sync Automatico**:
   - Esegui `node scripts/validate.mjs --all` e `npm run sync` (`scripts/sync-to-global.mjs`).
   - Se la validazione fallisce, applica il rollback immediato (`git checkout --`) senza lasciare file rotti.

### Step 4 — Ricevuta a 1 Riga (0-Click) e Dettagli in `<details>` (1-Click)
Mostra in chiaro una sola riga con la ricevuta dell'auto-apprendimento (e l'opzione `"annulla regola"`) e racchiudi il diff e il kit in `<details>` (con **riga vuota obbligatoria dopo `</summary>`**):

```markdown
> [!IMPORTANT]
> **Auto-Apprendimento Applicato**: aggiornato `[target]` (`L3/L2`, `validate.mjs` + `npm run sync` OK) · Scrivi `"annulla regola"` per ripristinare.

<details>
<summary><strong>Dettagli Auto-Apprendimento, Mossa Antigravity & Kit Prompt (Espandi)</strong></summary>

- **Lezione / Regressione Intercettata**: [Causa radice tecnica o pattern emerso dalla sessione]
- **Intervento Applicato (`L1..L3`)**: [File aggiornati in-place e test `L3` aggiunto]
- **Mossa Antigravity Consigliata**: `[Comando esatto compilato]` — [1 riga sul vantaggio immediato]

#### Prompt Ottimizzato (Target Diretto & Verifica):
`[Versione ottimizzata con @percorso/file esatti e comando di test]`

</details>
```

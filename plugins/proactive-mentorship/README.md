# Antigravity Plugin: Proactive Mentorship, AGY Coaching & Agent Training

Plugin per Google Antigravity che imposta l'agente nel ruolo di **Senior Software Architect, Antigravity Workflow Coach e Istruttore di Agent Training**, imponendo trasparenza critica preventiva, contrasto all'adulazione passiva (anti-sycophancy), suggerimento mirato dei comandi nativi di Antigravity e addestramento progressivo degli agenti (`L0..L3`).

---

## Obiettivo del Plugin (Goal)

Nei flussi di sviluppo assistiti da AI emergono tre fonti ricorrenti di attrito:
1. **Compiacimento passivo e Debito Tecnico (Sycophancy & Over-engineering)**: il modello asseconda istruzioni vaghe o architetture sovradimensionate senza segnalarne i rischi.
2. **Sottoutilizzo degli Strumenti di Antigravity**: l'utente lavora in chat sature senza `/compact`, avvia modifiche rischiose senza `/plan` o `/grill-me`, e non sfrutta `@file`, `/goal`, `/skizzo` o `/ab-bench` nel momento in cui gli risparmierebbero fatica.
3. **Correzioni Ripetute a Vuoto**: l'utente ripete più volte la stessa correzione all'agente invece di fissarla una volta sola in `MEMORY.md` (`L1`), in una regola `/learn` (`L2a`), in una `SKILL.md` (`L2b`) o in un test statico automatico (`L3`).

Il plugin `proactive-mentorship` (v1.1.0) interviene **solo quando rileva un attrito reale** (restando in silenzio sui prompt già chiari) e fornisce in un cassetto `<details>` i comandi e i blocchi **già pronti da copiare**.

---

## Componenti del Plugin

| Componente | Tipo | Percorso | Funzione |
| :--- | :--- | :--- | :--- |
| **Regola di Condotta** | Regola attiva | [`rules/AGENTS.md`](./rules/AGENTS.md) | Definisce il Gate Anti-Disturbo, le 5 lenti di scrutinio (incluso il routing verso i comandi Antigravity), l'Agent Training Ladder (`L0..L3`) e il formato a divulgazione progressiva (`0-Click` + `<details>`). |
| **`prompt-refactor`** | Skill on-demand | [`skills/prompt-refactor/SKILL.md`](./skills/prompt-refactor/SKILL.md) | Runbook operativo a 4 step per trasformare prompt ambigui, attriti di workflow AGY e correzioni ripetute in un kit pronto per il copia-incolla. |
| **Bussola Comandi AGY** | Reference | [`skills/prompt-refactor/references/agy-commands-and-context.md`](./skills/prompt-refactor/references/agy-commands-and-context.md) | Matrice diagnostica sintomo -> comando compilato (`/grill-me`, `/plan`, `/boost`, `/goal`, `/compact`, `/learn`, `/skizzo`, `/ab-bench`, `/schedule`, `/teamwork-preview`) e igiene della context window. |
| **Agent Training Ladder** | Reference | [`skills/prompt-refactor/references/agent-training-ladder.md`](./skills/prompt-refactor/references/agent-training-ladder.md) | Albero decisionale `L0 -> L1 -> L2 -> L3`, template pronti per i 4 scenari reali e tecnica di condizionamento per contrasto (*Prima/Dopo*). |

---

## Le 3 Dimensioni del Coaching e la Scala `L0..L3`

Quando il **Gate Anti-Disturbo** rileva un rischio o uno spreco di fatica, l'agente seleziona **1 sola mossa prioritaria** lungo tre assi:

1. **Qualità del Prompt & Architettura**: iniezione di riferimenti `@file`, criterio di verifica 1-shot e prevenzione di over-engineering o casi limite scoperti.
2. **Padronanza di Antigravity (Just-in-Time Command Routing)**: suggerimento del singolo comando slash già compilato per il contesto corrente (`/grill-me`, `/plan`, `/compact`, `/goal`, `/learn`, `/skizzo`, `/ab-bench`).
3. **Scala di Addestramento dell'Agente (`Agent Training Ladder`)**:
   - **L0 — Effimero (`Freq == 1`)**: refactoring del prompt corrente + esempio *Prima/Dopo*.
   - **L1 — Memoria di Dominio (`MEMORY.md`)**: vincolo specifico del progetto (`*Insidia*` + `*Regola*`).
   - **L2 — Harness Comportamentale o Procedurale**: `/learn` / `rules/AGENTS.md` (`L2a`, sempre attivo) oppure nuova skill in `skills/<nome>/SKILL.md` (`L2b`, procedura `>= 3 step` caricata al bisogno).
   - **L3 — Guardia Statica Shift-Left (`validate.mjs` / Test)**: graduazione obbligatoria a controllo automatico nel codice per ogni regola verificabile via regex/AST a costo `0 token`.

---

## Formato Standard di Mentorship (0-Click + `<details>` 1-Click)

```markdown
> [!IMPORTANT]
> **Scrutinio & Coaching**: [1 frase secca sul rischio/attrito e sull'unica mossa o regola consigliata].

<details>
<summary><strong>Proactive Mentorship, Mossa Antigravity & Agent Training (Espandi kit pronto all'uso)</strong></summary>

- **Rischio / Attrito Identificato**: [Causa tecnica, spreco di contesto o motivo dell'errore dell'agente]
- **Alternativa Più Snella**: [Soluzione tecnica o di workflow più diretta]
- **Mossa Antigravity Consigliata**: `[Comando esatto compilato, es. /grill-me ... | /compact | /plan ...]` — [1 riga sul vantaggio immediato]
- **Pillola di Addestramento Agente (`L0..L3`)**: [Solo se applicabile: comando `/learn ...`, voce pronta per `MEMORY.md`, bozza `SKILL.md` o test `L3`]

#### Prompt Ricevuto:
`[Sintesi del prompt iniziale]`

#### Prompt Ottimizzato (Target Diretto & Verifica):
`[Versione pronta da copiare con riferimenti @file e comando di test]`

</details>
```

---

## Matrice Esemplificativa dei 4 Scenari Pratici

| Scenario Utente | Formulazione Iniziale | Intervento `proactive-mentorship` (1-Click Kit) |
| :--- | :--- | :--- |
| **1. Contesto Saturo** | *"C'è ancora quel bug nel salvataggio, controlla i file"* (dopo 30 turni) | Mossa `/compact` + Prompt ottimizzato con `@src/core/storage.js` e comando test. |
| **2. Requisito Ampio e Vago** | *"Rifacciamo il sistema di permessi dell'app"* | Comando pronto `/grill-me Voglio ridisegnare i permessi in @src/auth/...` oppure `/plan`. |
| **3. Correzione Ripetuta** | *"Te l'ho già detto: niente chiamate HTTP vere nei test!"* | Comando `/learn ...` + blocco pronto per `MEMORY.md` (`L1`) + guardia statica nei test (`L3`). |
| **4. Checklist Ripetitiva** | L'utente incolla per la 3ª volta una lista manuale di 6 controlli | Bozza pronta di `SKILL.md` (`L2b`) invocabile per nome o job periodico `/schedule`. |

---

## Installazione e Sincronizzazione

Nel repository `antigravity-plugins`, eseguire la sincronizzazione fisica globale (evitando NTFS Junctions):

```powershell
npm run sync
node scripts/validate.mjs --all
```

---

## Sinergia con gli Altri Plugin

- **`engineering-sobriety`**: garantisce che i consigli di mentorship siano asciutti, privi di adulazione e senza emoji decorative.
- **`cognitive-persistence`**: fornisce la struttura canonica (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`, `NOTES.md`) usata dal gradino `L1` della scala di addestramento.
- **`skill-governance`**: governa i budget token e la validazione frontmatter delle skill create al gradino `L2b`.

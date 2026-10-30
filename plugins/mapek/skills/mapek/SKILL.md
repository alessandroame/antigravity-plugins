---
name: mapek
description: >-
  Supervisore sempre attivo dei processi di interazione Umano-AI che estrae colli di bottiglia,
  propone Regole, Skill o Agenti e chiede conferma prima di agire. Utilizza questa skill quando
  l'utente invoca /mapek o chiede un audit di processo.
---

# Supervisore di Processo a Consenso Umano (`/mapek`)

Runbook on-demand per ispezionare il supervisore sempre attivo (`mapek`), consultare il profilo di padronanza dell'operatore, esaminare le decisioni in attesa di approvazione e verificare l'efficacia reale delle regole installate. Per l'architettura generale di plugin, hook e subagent in Antigravity fare riferimento alle skill native `agy-customizations` e `plugin`.

---

## Step 1 — Esecuzione dell'Analisi in Sola Lettura

1. Eseguire la scansione incrementale sulle sessioni umane in `~/.gemini/antigravity/brain/` generando il rapporto già formattato in **Semantic Drill-Down (`L0 -> L1 -> L2`)**:
   ```powershell
   node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --digest
   ```
2. Se occorre ispezionare i dati strutturati JSON (punteggi EMA, evidenze per workspace e stato del registro post-adozione) o delegare un approfondimento multi-progetto senza appesantire la chat attiva, eseguire `--json` oppure invocare il subagent isolato `mapek-analyst`.

---

## Step 2 — Presentazione Drill-Down e Gate Obbligatorio di Consenso

1. Esporre all'utente il rapporto partendo dal **Livello 0** (sintesi chiara senza acronimi opachi), lasciando i dettagli su decisioni, alternative scartate, profilo di padronanza e storico nei cassetti `<details>` (**Livello 1** e **Livello 2**).
2. Se sono presenti una o più decisioni `PENDING_APPROVAL`, **non applicarle mai autonomamente**: invocare sempre `ask_question` per raccogliere la decisione esplicita dell'utente per ciascun `<decisionId>`:
   - **Approva e applica**:
     ```powershell
     node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --apply <decisionId> --confirm-user-approval
     ```
   - **Ispeziona / modifica bozza completa prima del consenso**:
     ```powershell
     node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --show <decisionId>
     ```
   - **Rifiuta con silenziamento di 30 giorni**:
     ```powershell
     node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --reject <decisionId>
     ```
   - **Rimanda di 24 ore**:
     ```powershell
     node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --snooze <decisionId>
     ```

---

## Step 3 — Verifica Post-Applicazione

Quando l'utente approva una proposta, `--apply <decisionId> --confirm-user-approval` esegue automaticamente la validazione globale (`scripts/validate.mjs --all`), la suite di test e la sincronizzazione fisica in `~/.gemini/config/plugins/` (con rollback immediato in caso di errore), registrando la baseline in `process-ledger.json` per la verifica di efficacia dopo 10 sessioni.

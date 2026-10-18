---
name: focus-audit
description: >-
  Monitora il numero di sessioni WIP contemporanee, i cambi di contesto tra chat,
  le maratone senza pause e il coprifuoco notturno. Utilizza questa skill quando
  l'utente invoca /focus-audit o chiede di verificare o configurare i limiti WIP.
---

# Focus Audit & Configurazione Human Governor (`/focus-audit`)

Questa procedura ispeziona la telemetria comportamentale dell'operatore umano e configura le soglie anti-sovraccarico del plugin `human-governor`.

---

## Step 1: Esecuzione della Scansione Comportamentale

Eseguire lo script di stato per leggere le sessioni WIP attive negli ultimi 30 minuti, i cambi di chat e la configurazione corrente:

```powershell
node "C:/Users/aless/.gemini/config/plugins/human-governor/scripts/status.mjs" --json
```

- **Verifica**: l'output JSON deve contenere `status` (`OK`, `WARN`, `CRITICAL`), `metrics`, `activeConversations` e `violations`.

---

## Step 2: Configurazione Soglie o Snooze (Se Richiesto)

Se l'utente chiede di modificare le soglie o silenziare temporaneamente gli avvisi, utilizzare i flag dedicati:

```powershell
# Impostare il limite massimo di WIP contemporanei (1..10, default 2)
node "C:/Users/aless/.gemini/config/plugins/human-governor/scripts/status.mjs" --max-wip 2

# Impostare la fascia di coprifuoco notturno (formato HH:MM-HH:MM)
node "C:/Users/aless/.gemini/config/plugins/human-governor/scripts/status.mjs" --curfew 22:30-07:00

# Silenziare gli avvisi per N minuti (0 per riattivare subito)
node "C:/Users/aless/.gemini/config/plugins/human-governor/scripts/status.mjs" --snooze 30

# Attivare o disattivare il banner di notifica desktop di Windows
node "C:/Users/aless/.gemini/config/plugins/human-governor/scripts/status.mjs" --toast on
```

---

## Step 3: Restituzione della Diagnosi Operativa

1. **In Chiaro (0-Click)**:
   - Riportare lo stato (`OK`, `WARN`, `CRITICAL`) e i 4 indicatori principali (`WIP attivi`, `cambi chat/10m`, `prompt/60m`, `streak continua`).
   - Se `activeWipCount > maxConcurrentWip`, elencare i link `[Conversazione](conversation://<id>)` delle sessioni aperte chiedendo quali chiudere subito.
2. **In `<details>` (1-Click)**:
   - Mostrare la tabella completa delle soglie configurate e delle sessioni rilevate nella finestra temporale.

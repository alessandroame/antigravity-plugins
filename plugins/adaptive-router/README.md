# Adaptive Model & Effort Router (`adaptive-router` v1.2.0)

Plugin autonomo per **Google Antigravity** che mappa ogni prompt su una **tabella LUT dinamica a 6 archetipi (`R1..R6`)** abbinata alle famiglie **Gemini 4 / Orchestrator / Gemini 3.8**, notifica istantaneamente nell'output della chat ogni cambio di modello o modalità, offre il **cambio esecuzione a 1 click** quando il modello attivo è sottodimensionato e aggiorna automaticamente la LUT consultando **una tantum la documentazione ufficiale** quando cambiano i modelli disponibili.

---

## 1. Come Funziona

1. **Tabella LUT Dinamica a 6 Archetipi (`< 0.5 ms`, Calibrata su Documentazione Ufficiale Google/Antigravity)**:
   - **`R1_MECHANICAL_OPS` (`LOW`)**: comandi Git, `npm test`, `/memory-sync`, conferme brevi -> **`Gemini 4 Hydrogen (Low)`** (`0` popup anche se il selettore è su `Carbon High`).
   - **`R2_QUICK_LOOKUP_MICROEDIT` (`LOW`)**: lookup rapidi, refusi, rinomine singole -> **`Gemini 4 Hydrogen (Low)`** (suggerimento inline `0-click` solo dopo `>= 2` turni leggeri consecutivi su `High`).
   - **`R3_CODE_INSPECTION` (`MEDIUM`)**: `/how-its-made` e spiegazioni strutturate read-only -> **`Gemini 4 Hydrogen (Medium)`** *(alt. `Gemini 4 Argon (Low)`)*.
   - **`R4_SINGLE_MODULE_DEV` (`MEDIUM`)**: sviluppo feature, bugfix e test su `1–2` file -> **`Gemini 4 Argon (Medium)`** *(alt. `Gemini 4 Hydrogen (High)`)*.
   - **`R5_MULTI_FILE_REFACTOR` (`HIGH`)**: refactoring coordinato su `>= 3` file -> **`Orchestrator (Carbon)`** *(swap nativo Carbon + Hydrogen, `-24%` quota e `-19%` latenza; alt. `Gemini 4 Argon (High)`)*.
   - **`R6_DEEP_ARCH_TRADEOFF` (`HIGH`)**: audit del piano, architettura complessa, trade-off multi-dominio -> **`Gemini 4 Carbon (High)`** *(alt. `Gemini 4 Hydrogen (XHigh)`)*.
2. **Notifica Immediata in Chat & Conferma 1-Click (`router-pre-hook.mjs`)**:
   - **Banner istantaneo a `0` token (`metadata.user_markdown`)**: a ogni cambio di modello o modalità (`Low`, `Medium`, `High`, `XHigh`) tra turni o a metà esecuzione, stampa subito la transizione nell'output della chat.
   - **Conferma a 1 Click (`ASK_1CLICK_UPGRADE`)**: se il modello UI attivo è sottodimensionato rispetto all'archetipo LUT, propone in 1 click di delegare subito l'esecuzione a `invoke_subagent` (`TypeName: 'self' | 'research'`, `Model: 'pro' | 'flash'`) oppure indica la voce esatta da selezionare nel menu UI, con opzione di silenziamento per l'intera sessione (`--snooze-session`).
   - **Riconoscimento nativo degli `Orchestrator`**: `Orchestrator (Carbon)` e `Orchestrator (Argon)` sono riconosciuti come orchestratori dinamici già allineati su `R1..R5` senza falsi avvisi.
3. **Hook di Aggiornamento Roster + Calibrazione Documentazione Ufficiale `Una Tantum`**:
   - `router-stop-hook.mjs` sorveglia le variazioni di `builtin/.checksum` e la comparsa di nuove famiglie Gemini nei transcript (`providerFilter: 'gemini-ui'`).
   - Quando rileva modelli nuovi non ancora calibrati, inietta una sola volta `[ADAPTIVE-ROUTER: CALIBRATE_MODEL_ROSTER_ONCE]`: l'agente interroga `swarm{action:"models"}`, consulta la documentazione ufficiale Google/Antigravity (`gemini_search_docs` + `antigravity.google`) **una tantum** e salva ruoli e target in `~/.gemini/antigravity/analytics/model-capabilities.json` (`0` token sui turni successivi).

---

## 2. Struttura del Plugin

```text
plugins/adaptive-router/
├── plugin.json                        # Manifest SemVer 1.2.0
├── hooks.json                         # Hook PreInvocation e Stop (< 5ms)
├── README.md                          # Documentazione architetturale e LUT
├── core/
│   └── router-engine.mjs              # LUT 6 archetipi, filtro roster Gemini UI e calibrazione docs
├── scripts/
│   ├── model-router.mjs               # CLI (--lut, --status, --scan, --sync-swarm-models, --apply-calibration)
│   ├── router-pre-hook.mjs            # Banner 0-token, guardia 1-click LUT e avviso calibrazione una tantum
│   └── router-stop-hook.mjs           # Scoperta passiva modelli e watchdog .checksum / roster
├── rules/
│   └── AGENTS.md                      # Protocollo LUT, ereditarietà subagent e calibrazione ufficiale
├── skills/
│   └── model-router/
│       └── SKILL.md                   # Runbook /model-router
└── tests/
    └── router-engine.test.mjs         # 13 test end-to-end (classificazione, LUT, hook, snooze e modelli futuri)
```

---

## 3. Comandi CLI

```bash
# Mostra la matrice LUT a 6 archetipi e i ruoli calibrati delle 6 famiglie Gemini/Orchestrator
node plugins/adaptive-router/scripts/model-router.mjs --lut

# Mostra il registro empirico dei modelli e lo stato del watchdog PreInvocation
node plugins/adaptive-router/scripts/model-router.mjs --status

# Sincronizza il catalogo runtime da swarm{action:"models"} e applica la calibrazione ufficiale
node plugins/adaptive-router/scripts/model-router.mjs --sync-swarm-models swarm.json --apply-calibration cal.json

# Simula l'archetipo LUT e l'azione 1-click/0-click per un prompt
node plugins/adaptive-router/scripts/model-router.mjs --prompt "Fai un audit sul piano architetturale" --ui-model "gemini-4-hydrogen-low"
```

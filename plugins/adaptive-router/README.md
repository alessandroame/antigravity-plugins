# Adaptive Model & Effort Router (`adaptive-router` v1.0.0)

Plugin autonomo per **Google Antigravity** che seleziona in base al prompt il miglior profilo di modello AI (`flash_lite`, `flash`, `pro` o `inherit`) e il livello di impegno operativo (`Low`, `Medium`, `High`), auto-aggiornandosi quando escono nuovi modelli o nuove modalità nell'IDE.

---

## 1. Come Funziona

1. **Classificazione Deterministica a 3 Fasce (`< 0.5 ms`)**:
   - **`LOW` (`T1_INSTANT`, effort `low`, subagent `flash_lite` / `0` subagent)**: comandi operativi (`git`, `npm test`, `/memory-sync`), micro-correzioni puntuali (`<= 14` parole) e lookup informativi rapidi.
   - **`MEDIUM` (`T2_BALANCED`, effort `medium`, subagent `flash`)**: spiegazioni strutturate del codice (`/how-its-made`), sviluppo feature, bugfix o test unitari su singolo modulo (`score 2..3`).
   - **`HIGH` (`T3_DEEP`, effort `high`, subagent `pro`)**: progettazione architetturale, refactoring multi-file, race condition o decisioni con trade-off multi-dominio (`score >= 4`).
2. **Meccanismo Future-Proof (Auto-Discovery & Auto-Calibrazione)**:
   - **Sonda Transcript (`<USER_SETTINGS_CHANGE>` & `PLANNER_RESPONSE`)**: intercetta automaticamente ogni nuovo modello o modalità selezionata dall'utente senza bisogno di aggiornare il codice del plugin.
   - **Inferenza Lessicale Giorno 0**: assegna immediatamente il nuovo modello alla fascia corretta (`lite/mini/haiku` -> `LOW`, `flash/sonnet` -> `MEDIUM`, `pro/ultra/opus/thinking` -> `HIGH`, fallback `MEDIUM`).
   - **Auto-Calibrazione Empirica (`>= 5` campioni)**: promuove o declassa automaticamente il modello in base alla latenza reale (`avgDurationMs`), al volume di output (`avgOutputTokens`) e al tasso di errore (`errorRate`).
   - **Circuit Breaker (`resolveSafeSubagentModel`)**: ripiega automaticamente su `Model: 'inherit'` se un tier subagent viene deprecato in versioni future del runtime.

---

## 2. Struttura del Plugin

```text
plugins/adaptive-router/
├── plugin.json                        # Manifest SemVer 1.0.0
├── hooks.json                         # Hook PreInvocation e Stop (< 5ms)
├── README.md                          # Documentazione architetturale
├── core/
│   └── router-engine.mjs              # Classificatore 3-tier + motore auto-discovery e calibrazione
├── scripts/
│   ├── model-router.mjs               # CLI per status, scansione transcript e test prompt
│   ├── router-pre-hook.mjs            # Hook PreInvocation silenzioso
│   └── router-stop-hook.mjs           # Hook Stop per scoperta passiva nuovi modelli
├── rules/
│   └── AGENTS.md                      # Regola di routing dinamico subagent ed effort
├── skills/
│   └── model-router/
│       └── SKILL.md                   # Skill /model-router
└── tests/
    └── router-engine.test.mjs         # Suite di test automatici (classificazione + modelli futuri)
```

---

## 3. Comandi CLI

```bash
# Mostra il registro dei modelli noti e auto-scoperti
node plugins/adaptive-router/scripts/model-router.mjs --status

# Scansiona i transcript locali per scoprire nuovi modelli e ricalibrare le metriche
node plugins/adaptive-router/scripts/model-router.mjs --scan

# Valuta quale modello ed effort vengono assegnati a un prompt specifico
node plugins/adaptive-router/scripts/model-router.mjs --prompt "Progetta un nuovo modulo di cache" --ui-model "gemini-2.5-flash-lite"
```

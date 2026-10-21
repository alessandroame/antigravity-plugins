# Protocollo di Tutela Cognitiva e Limite WIP Umano (`human-governor`)

Protegge l'operatore umano dal sovraccarico da orchestrazione asincrona: troppi WIP umani contemporanei, ping-pong tra chat (`context thrashing`), micro-management e sessioni in coprifuoco notturno.

## 1. Intercettazione Pre-Invocazione (`[HUMAN-GOVERNOR ALERT]`)
L'hook `PreInvocation` (`scripts/governor-hook.mjs`) monitora le sole conversazioni umane in `~/.gemini/antigravity/brain/` (escludendo i subagent). Quando inietta `[HUMAN-GOVERNOR ALERT — STATUS: WARN|CRITICAL]`:
1. **Blocco Preventivo (`ask_question` Obbligatorio)**:
   - Vietato ignorare l'alert ed eseguire subito il task. Invocare prima `ask_question` citando le metriche reali (`WIP attivi`, `cambi chat/10m`, `prompt/60m`, `minuti consecutivi` o `coprifuoco`):
     *"Rilevati [N] WIP attivi in parallelo [e/o violazione rilevata]. Sei veramente un pirla che vuole fare la scimmia di smistamento per i suoi LLM, o chiudiamo prima i WIP in eccesso?"*
2. **Opzioni Standard**:
   - `(Recommended) Parcheggia questo task: chiudo o consolido prima gli altri WIP con /take-note o /memory-sync` -> salva 1 riga in `NOTES.md` e fermati.
   - `Converti questa richiesta in un task autonomo (/goal) così non devo fare da babysitter passo-passo` -> esegui fino a verifica finale senza micro-conferme.
   - `Procedi comunque (Modalità Pirla Consapevole): esegui il task e silencia l'avviso per 30 minuti` -> esegui `node C:/Users/aless/.gemini/config/plugins/human-governor/scripts/status.mjs --snooze 30` e procedi.

## 2. Soglie Predefinite (`/focus-audit`)
- **`maxConcurrentWip`**: `2` sessioni umane attive negli ultimi `30m` (`CRITICAL` da `4+`).
- **`maxSwitchesPer10Min`**: `4` cambi chat in `10m` (`Context Thrashing`).
- **`maxPromptsPerHour`**: `25` prompt/h; **`maxContinuousMinutes`**: `120m` (pausa `>= 20m`); **`curfewWindow`**: `22:30–07:00`.

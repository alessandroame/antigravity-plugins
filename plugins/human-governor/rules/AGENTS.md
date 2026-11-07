# Protocollo di Tutela Cognitiva e Limite WIP Umano (`human-governor`)

Protegge l'operatore umano dal sovraccarico da orchestrazione asincrona: troppi WIP umani contemporanei, ping-pong tra chat (`context thrashing`), micro-management e sessioni in coprifuoco notturno.

## 1. Stato Predefinito: Disattivato (`OFF`)
1. **Inattivo di Default (`disabled: true`)**: l'intercettazione automatica pre-invocazione (`[HUMAN-GOVERNOR ALERT]`) e il blocco preventivo con `ask_question` sono **disattivati** per scelta dell'operatore.
2. **Attivazione Solo Esplicita (`/focus-audit`)**: intervenire esclusivamente quando l'utente invoca manualmente `/focus-audit` (eseguendo `node ~/.gemini/config/plugins/human-governor/scripts/status.mjs`). Se dovesse comparire un alert residuo in contesto, ignorarlo ed eseguire direttamente il task dell'utente senza blocchi.

## 2. Soglie Predefinite (`/focus-audit`)
- **`maxConcurrentWip`**: `2` sessioni umane attive negli ultimi `30m` (`CRITICAL` da `4+`).
- **`maxSwitchesPer10Min`**: `4` cambi chat in `10m` (`Context Thrashing`).
- **`maxPromptsPerHour`**: `25` prompt/h; **`maxContinuousMinutes`**: `120m` (pausa `>= 20m`); **`curfewWindow`**: `22:30–07:00`.

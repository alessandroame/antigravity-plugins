# Human Governor & Anti-WIP Guard (`human-governor`)

Plugin di tutela cognitiva per Antigravity che monitora in tempo reale il comportamento dell'operatore umano tramite un hook `PreInvocation` e impedisce di trasformarsi nel passacarte di smistamento dei propri LLM.

## Cosa Monitora

1. **WIP Contemporanei (`EXCESSIVE_WIP`)**: conta le conversazioni distinte attive in `~/.gemini/antigravity/brain/` negli ultimi `30` minuti (default: max `2` WIP contemporanei; stato `CRITICAL` da `4+`).
2. **Context Thrashing (`CONTEXT_THRASHING`)**: rileva quando cambi conversazione `>= 4` volte in `10` minuti facendo ping-pong tra tab diversi.
3. **Micro-Gestione Compulsiva (`DOPAMINE_PING_PONG`)**: rileva `> 25` prompt in un'ora quando fai da babysitter passo-passo invece di delegare con `/goal`.
4. **Maratona Continua (`CONTINUOUS_MARATHON`)**: rileva `>= 120` minuti consecutivi di prompting senza mai staccare per almeno `20` minuti.
5. **Coprifuoco Notturno (`CURFEW_VIOLATION`)**: blocca l'avvio di nuove lavorazioni nella fascia `22:30–07:00`.

## Come Interviene

Quando una soglia viene superata all'invio di un prompt (`invocationNum === 1`):
- Invia una notifica balloon nativa di Windows (se non sei in orario di coprifuoco).
- Inietta `[HUMAN-GOVERNOR ALERT]` nel turno corrente obbligando l'agente a fermarsi e aprire un modal `ask_question` che ti chiede se vuoi davvero tenere `N` WIP aperti o se preferisci chiudere gli altri, convertire il task in `/goal`, oppure silenziare l'avviso per 30 minuti.

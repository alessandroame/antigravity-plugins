# 2026-10-18 — Creazione Plugin `human-governor` v1.0.0 (Tutela Cognitiva, Limite WIP Contemporanei, Anti-Thrashing e Coprifuoco)

## Contesto
L'orchestrazione asincrona multi-chat espone l'operatore umano al rischio di trasformarsi nel gestore di interrupt in tempo reale dei propri agenti (fino a 6–7 sessioni WIP concorrenti, ping-pong compulsivo tra chat e lavoro in fascia notturna). Era necessario un meccanismo deterministico che monitorasse i comportamenti reali dell'operatore su disco (`~/.gemini/antigravity/brain/`) e intervenisse attivamente al superamento delle soglie.

## Decisioni Architetturali
1. **Motore Headless (`plugins/human-governor/core/evaluator.mjs`)**:
   - Modulo Node.js puro (`zero DOM/I/O`) che valuta 5 dimensioni comportamentali:
     - `EXCESSIVE_WIP`: numero di conversazioni reali attive negli ultimi `30` minuti (`maxConcurrentWip = 2`, `CRITICAL` da `4+`).
     - `CONTEXT_THRASHING`: rimbalzi tra `conversationId` distinti negli ultimi `10` minuti (`maxSwitchesPer10Min = 4`).
     - `DOPAMINE_PING_PONG`: frequenza oraria di prompt (`maxPromptsPerHour = 25`) sintomo di micro-gestione anziché delega con `/goal`.
     - `CONTINUOUS_MARATHON`: lavoro continuo senza pause di almeno `20` minuti (`maxContinuousMinutes = 120`).
     - `CURFEW_VIOLATION`: avvio di sessioni nella fascia notturna (`22:30–07:00`).
2. **Intercettazione `PreInvocation` (`scripts/governor-hook.mjs`)**:
   - Si attiva esclusivamente all'inizio del turno utente (`invocationNum <= 1`), scansionando i `transcript.jsonl` recenti in `~/.gemini/antigravity/brain/` che contengono `<USER_REQUEST>` (escludendo al 100% i subagent interni).
   - Al superamento delle soglie (rispettando `snoozeUntilMs` e `cooldownMinutes = 20`), invia una notifica balloon nativa di Windows e inietta `[HUMAN-GOVERNOR ALERT]` via `ephemeralMessage`.
3. **Regola di Confronto Diretto (`rules/AGENTS.md`) e CLI (`scripts/status.mjs`, `/focus-audit`)**:
   - Obbliga l'agente a bloccare l'esecuzione con `ask_question` riportando le metriche esatte e proponendo 3 scelte: parcheggiare/chiudere gli altri WIP, convertire il task in `/goal`, oppure attivare uno snooze consapevole di 30 minuti.

## Impatto e Verifica
- **Test Unitari**: `plugins/human-governor/tests/evaluator.test.mjs` (`5/5 PASS` in `55ms`, inclusa verifica statica di purezza headless).
- **Validazione Repository**: `npm test` (`scripts/validate.mjs --all`) e `npm run sync` (`scripts/sync-to-global.mjs`).

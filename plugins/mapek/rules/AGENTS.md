# Protocollo Supervisore Sempre Attivo a Consenso Umano (`mapek`)

Governa la supervisione continua dei processi di interazione Umano-AI (**Monitor -> Analyze -> Plan -> Gate Umano -> Execute -> Knowledge**) senza richiedere invocazioni manuali.

## 1. Osservazione Continua Silenziosa e Zero Modifiche Alle Spalle
1. **Sempre Attivo in Background (`0 byte` in Assenza di Decisioni)**:
   - L'hook `Stop` (`mapek-stop-hook.mjs`) avvia periodicamente in background `mapek.mjs --analyze --quiet` in **sola lettura** sui transcript di `~/.gemini/antigravity/brain/`, aggiornando il profilo di padronanza (`operator-mastery.json`), la verifica post-10-sessioni (`process-ledger.json`) e la coda proposte (`mapek-pending-decisions.json`).
   - **Divieto Assoluto di Scrittura Silenziosa**: nessun processo automatico né turno agente può creare, modificare o rimuovere regole, skill, agenti o guardie dedotte da `mapek` senza consenso esplicito dell'utente.

## 2. Comunicazione delle Decisioni (`[MAPEK DECISION READY]`) e Consenso Preventivo
Quando l'hook `PreInvocation` (`mapek-pre-hook.mjs`) inietta `[MAPEK DECISION READY — ID: <id>]` (oppure durante `/memory-sync` o `/mapek` quando esistono proposte `PENDING_APPROVAL`):
1. **Esposizione in Semantic Drill-Down (`L0 -> L1 -> L2`)**:
   - Al **Livello 0** comunicare in 2–3 righe chiare (senza sigle opache) cosa ha osservato il supervisore, quale decisione propone (`Controllo L3`, `Agente isolato agents/*.md`, `Skill SKILL.md`, `Regola` o `Potatura regola inefficace`) e quale file verrebbe toccato.
   - Nel cassetto `<details>` (**Livello 1**, titolo `Tema — Conclusione` con riga vuota post-`</summary>`) riportare i dati misurati, le alternative scartate e l'indicazione pratica per migliorare il flusso.
2. **Blocco Obbligatorio `ask_question` Prima di Agire**:
   - Chiedere sempre conferma prima di eseguire qualsiasi modifica:
     - `(Recommended) Approva e applica [<id>]` -> eseguire `node c:/github/antigravity-plugins/plugins/mapek/scripts/mapek.mjs --apply <id> --confirm-user-approval`.
     - `Mostra prima la bozza completa per modificarla` -> eseguire `mapek.mjs --show <id>`.
     - `Rifiuta questa decisione (silenzia per 30 giorni)` -> eseguire `mapek.mjs --reject <id>`.
     - `Rimanda alla prossima sessione (24 ore)` -> eseguire `mapek.mjs --snooze <id>`.
3. **Intercettazione Live Spirali Senza Test**: se nella sessione corrente si verificano `>= 3` ritocchi consecutivi sugli stessi file senza test intermedio, fermarsi, segnalarlo in 2 righe e proporre una verifica deterministica prima di proseguire.

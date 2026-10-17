# 2026-10-16 — Creazione ed Evoluzione Plugin `skizzo` v1.1.0 (Dual-Track Tecnico vs Dominio, Mediatore `--mediator` e Banner Esplicito)

## Contesto
Progettazione e implementazione di un plugin sperimentale (`plugins/skizzo/` v1.0.0 $\to$ v1.1.0) per mettere in competizione e collaborazione parallela prospettive pure su ogni task della sessione:
- **Subagent Alpha (`Systems & Technical Purity Architect`)**: focalizzato su isolamento headless (`core/` zero DOM/storage), complessità computazionale $O(\cdot)$, immutabilità, gestione race condition e unit test su invarianti.
- **Subagent Beta (`Domain & User Experience Advocate`)**: focalizzato sul punto di vista dell'utente finale del dominio, riduzione dell'attrito cognitivo (Legge di Tesler, Legge di Postel, Fitts, Hick) e test di scenario/accettazione.
- **Subagent Gamma (`Dialectical Mediator & Conflict Resolver`, attivo con `/skizzo --mediator` o `-m`)**: terzo subagent isolato incaricato di contro-interrogare `Alpha` e `Beta` sui punti di disaccordo ed emettere un lodo arbitrale vincolante.

## Decisioni Architetturali (ADR)
1. **Dormienza Predefinita in `rules/AGENTS.md` + Visibilità Slash Command**:
   - Poiché disabilitare un plugin in `~/.gemini/config/config.json` impedisce al Language Server di esporre il comando slash `/skizzo`, il plugin viene installato come attivo a livello di loader ma vincolato dalla **Clausola di Dormienza Predefinita** in `plugins/skizzo/rules/AGENTS.md` (stato iniziale `OFF` a inizio conversazione).
   - Il comando `/skizzo` (`on`/`off`, `--mediator`/`-m`, `--no-mediator`) agisce come toggle persistente di sessione e aggiorna il titolo della conversazione con il prefisso `[SKIZZO]` o `[SKIZZO+MED]` tramite `set-chat-title.mjs`.
2. **Biforcazione Cieca Parallela Obbligatoria (`invoke_subagent`)**:
   - Nella Fase 1 l'Orchestratore invoca sempre in parallelo 2 subagent indipendenti in una singola chiamata `invoke_subagent` per impedire compromessi prematuri.
3. **Mediatore Interattivo (`Subagent Gamma`) e Routing Peer-to-Peer via `send_message` (`v1.1.0`)**:
   - Quando `--mediator` è attivo, nella Fase 2 l'Orchestratore invoca `Subagent Gamma` (`TypeName: "research"`) passandogli i report e i `conversationId` di `Alpha` (`<id-alpha>`) e `Beta` (`<id-beta>`).
   - `Subagent Gamma` contro-interroga `<id-alpha>` e `<id-beta>` tramite `send_message` sui punti di disaccordo (**Circuit Breaker obbligatorio di max 1 round di replica**), cedendo subito il turno dopo l'invio per ricevere il wakeup reattivo delle risposte peer prima di trasmettere il Lodo Arbitrale finale al `parent` Orchestratore.
   - Poiché in Antigravity un subagent risvegliato in stato `idle` recapita il normale testo di fine turno solo al padre e il `<subagent_reminder>` nativo suggerisce di usare il `caller` (`parent`) come destinatario, nei prompt di `Alpha` e `Beta` è stata inserita la regola esplicita di rispondere a `Gamma` invocando `send_message(Recipient: "<id-gamma>", Message: "...")` (usando il `sender` del `<SYSTEM_MESSAGE>`, non il `parent`).
4. **Visibilità Esplicita in Output (`Banner [!IMPORTANT]` + Link `conversation://`, `v1.1.0`)**:
   - Ogni risposta prodotta mentre `SKIZZO = ON` deve aprirsi obbligatoriamente al **rigo 1** con il banner `> [!IMPORTANT] **MODALITÀ SKIZZO ATTIVA (...)` corredato dai link cliccabili `conversation://<id>` a tutti i subagent lanciati (`Alpha`, `Beta`, e `Gamma` quando `--mediator` è attivo).
5. **Arbitrato di Tesler, Doppio Oracolo e Flag `--proto`**:
   - Il Track Dominio (`Beta`) governa il contratto esterno e il flusso utente; il Track Tecnico (`Alpha`) governa l'architettura interna headless incaricata di assorbire la complessità.
   - Di default i due track convergono in un'unica implementazione codice verificata dal **Doppio Oracolo** (`Oracolo Alpha` + `Oracolo Beta`); con `/skizzo --proto` generano 2 prototipi completi in Git Worktrees isolati.
6. **Autosufficienza Telemetrica e Compattezza (`<= 6.500` byte)**:
   - `plugins/skizzo/rules/AGENTS.md` è mantenuto entro il tetto di `6.500` byte e `skills/skizzo/SKILL.md` ($\le 200$ righe) include direttamente i prompt di `Alpha`, `Beta` e `Gamma` e il template `<details>` per evitare doppi conteggi in `collector.mjs`.

## Impatto e Verifica
- Creati e aggiornati a `v1.1.0` `plugins/skizzo/plugin.json`, `plugins/skizzo/rules/AGENTS.md`, `plugins/skizzo/skills/skizzo/SKILL.md`, `plugins/skizzo/skills/skizzo/references/dialectic-template.md` e `plugins/skizzo/README.md`.
- Aggiornati `README.md`, `DESIDERATA.md`, `MEMORY.md` e `WORKLOG.md`.
- Eseguiti `node scripts/validate.mjs --all` e `npm run sync` con `0` errori e `0` avvisi.

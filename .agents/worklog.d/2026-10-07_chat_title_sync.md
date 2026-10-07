# [2026-10-07] ADR: Ridenominazione Automatica della Sessione di Chat in `/next-step`

## Contesto & Motivazione
Durante l'avvio di una nuova sessione di sviluppo tramite il comando slash `/next-step`, Antigravity assegnava alla sessione un titolo generico ("Next Step Planning") basato sul prompt iniziale. Di conseguenza, nella sidebar dell'applicazione desktop e dell'IDE comparivano molteplici chat con identica titolazione, rendendo difficoltosa la rapida localizzazione e differenziazione degli interventi in corso o storici.

## Decisioni Architetturali
1. **Analisi del Runtime di Antigravity**:
   - Individuato il meccanismo interno di gestione dei metadati di sessione: le conversazioni sono archiviate in `conversation_summaries.db` e gestite dal processo locale `language_server.exe`.
   - Verificato che l'endpoint locale Connect-RPC `LanguageServerService/UpdateConversationAnnotations` (su porta dinamica `https://127.0.0.1:<port>/`) consente l'aggiornamento in tempo reale dei metadati di annotazione (`title`), notificando la UI reattiva Electron via stream `StreamCascadeSummariesReactiveUpdates`.
2. **Creazione dello Script di Ridenominazione (`set-chat-title.mjs`)**:
   - Creato lo script autonomo `plugins/cognitive-persistence/scripts/set-chat-title.mjs` con zero dipendenze esterne (solo moduli nativi Node.js: `fs`, `path`, `https`, `child_process`).
   - Implementata la risoluzione deterministica della porta tramite analisi di `main.log` e fallback su porte in ascolto di sistema.
   - Implementata l'estrazione automatica del token di autenticazione `x-codeium-csrf-token` dal file HTML dell'applicazione.
   - Supportata la risoluzione automatica della conversazione attiva tramite scansione cronologica di `~/.gemini/antigravity/brain/` quando `--conversation-id` non viene specificato.
3. **Integrazione nel Runbook di `/next-step`**:
   - Aggiornato `plugins/cognitive-persistence/skills/next-step/SKILL.md` introducendo lo "Step 5: Ridenominazione Automatica del Titolo della Chat" prima della conferma di avvio sviluppo.
   - Aggiornato `rules/AGENTS.md` inserendo il punto 4 nella "Direttiva di Avvio Task".
   - Aggiornati il diagramma di flusso e la tabella componenti in `plugins/cognitive-persistence/README.md`.
4. **Sincronizzazione Ambiente Globale**:
   - Replicati lo script e le definizioni aggiornate nella configurazione globale utente `~/.gemini/config/plugins/cognitive-persistence/`.

## Impatto e Conseguenze
- Validazione automatica `scripts/validate.mjs` superata con esito positivo (8 plugin verificati, 0 errori, 0 avvisi).
- All'invocazione di `/next-step`, il titolo della chat nella barra laterale di Antigravity viene immediatamente rinominato con il nome dello step selezionato da `DESIDERATA.md`.
- Tracciabilità visiva e navigabilità migliorata tra sessioni concorrenti.

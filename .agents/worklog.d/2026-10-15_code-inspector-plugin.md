# [2026-10-15] ADR: Creazione Plugin `code-inspector` e Skill `/how-its-made` per Verifica Flusso e Codice

## Contesto & Motivazione
Quando uno sviluppatore riprende in mano un modulo software o deve verificare a livello di codice il comportamento di una funzionalità, le spiegazioni testuali ad alto livello risultano insufficienti (omettono guardie di uscita anticipata, mutazioni collaterali di stato e riferimenti puntuali alle linee), mentre il dump integrale dei file sorgente genera sovraccarico cognitivo. Era necessario un plugin dedicato che strutturasse la ricostruzione del flusso secondo il modello **Punto di Ingresso $\to$ Processo $\to$ Punto di Uscita** con selettori a espansione per ispezionare il codice coinvolto.

## Decisioni Architetturali
1. **Nuovo Plugin `code-inspector` (`plugins/code-inspector/`)**:
   - Progettato il protocollo **IPO Esteso (Ingresso $\to$ Guardie $\to$ Processo $\to$ Uscita)** in `rules/AGENTS.md` e nella skill `/how-its-made` (`skills/how-its-made/SKILL.md`).
2. **Quattro Dimensioni Diagnostiche Integrate**:
   - **Guardie e Uscite Anticipate (`Early Returns`)**: mappatura esplicita delle precondizioni che interrompono il flusso prima del processo.
   - **Classificazione Computazionale degli Step**: marcatura obbligatoria di ogni passaggio con `[PURE]`, `[STATE]` o `[I/O]`.
   - **Tracciamento del Payload (`Data Shape Evolution`)**: documentazione di come muta la struttura dati da `Input Grezzo` a `Output Finale`.
   - **Stato di Verifica (`Test Coverage`)**: collegamento diretto ai file di test esistenti e segnalazione dei rami privi di copertura.
3. **Selettori a Espansione in Markdown Nativo (`<details><summary>`)**:
   - Scelto il rendering nativo GFM in chat per garantire zero latenza aggiuntiva e link `file://` cliccabili verso i numeri di riga verificati (`#Lstart-Lend`), con estratti chirurgici di 10–35 righe per step.
   - Estratti il template standard in `references/inspection-template.md` e l'esempio reale in `examples/sample-inspection.md` in conformità al principio di divulgazione progressiva (`skill-governance`).
4. **Auto-Registrazione in `config.json` tramite `scripts/sync-to-global.mjs`**:
   - Esteso `scripts/sync-to-global.mjs` affinché registri automaticamente ogni nuovo plugin sincronizzato con `"enabled": true` in `~/.gemini/config/config.json`.

## Impatto e Verifiche
- Suite di validazione `npm test` (`node scripts/validate.mjs --all`): 10/10 plugin verificati, 0 errori, 0 avvisi.
- Sincronizzazione `npm run sync`: `code-inspector` copiato fisicamente in `~/.gemini/config/plugins/code-inspector` e abilitato in `config.json`.

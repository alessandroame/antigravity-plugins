# [2026-10-09] ADR: Protocollo di Installazione Fisica Globale e Divieto Junction NTFS

## Contesto & Motivazione
Durante il collaudo dell'attivazione dei plugin su progetti esterni (es. GlideMind), i comandi slash (tra cui `/next-step` e `/memory-sync`) risultavano assenti dall'interfaccia di autocompletamento della chat, nonostante i plugin fossero stati collegati tramite NTFS Directory Junction (`New-Item -ItemType Junction`).

## Diagnosi Empirica & Causa Radice
1. **Scarto Reparse Points su Windows**:
   L'ispezione tramite chiamate Connect-RPC al Language Server (`exa.language_server_pb.LanguageServerService/GetAllPlugins`) ha dimostrato che il file scanner su Windows ignora sistematicamente le Directory Junction NTFS e i symlink (interpretati come link ricorsivi e scartati). Quando un plugin è un junction, non viene caricato.
2. **Ambito di Discovery dei Plugin**:
   Antigravity non scansiona le cartelle `.agents/plugins/` dei singoli workspace come root di plugin. I plugin sono scoperti unicamente nella directory utente globale `~/.gemini/config/plugins/` e abilitati in `~/.gemini/config/config.json`.
3. **Cache Visuale dei Comandi Slash**:
   La webview Electron dell'interfaccia client popola la lista dei comandi slash all'inizializzazione della finestra. Per far apparire nuovi comandi nell'autocompletamento è necessario ricaricare la finestra (`Developer: Reload Window`) o riavviare Antigravity dopo la prima sincronizzazione fisica.
4. **Collisione Copie Locali vs Globali**:
   Se una skill è presente sia localmente in `<workspace>/.agents/skills/<name>` sia nel plugin globale, la UI mostra entrambe le occorrenze. Le skill fornite dai plugin globali non devono essere duplicate come cartelle loose nel workspace.

## Decisioni Architetturali
1. **Divieto Assoluto di Directory Junction per i Plugin**:
   Bandito qualsiasi uso di junction o symlink per la registrazione dei plugin su Windows.
2. **Adozione di Sincronizzazione Fisica Automatizzata (`npm run sync`)**:
   Implementato lo script `scripts/sync-to-global.mjs` invocabile via `npm run sync`. Lo script rimuove eventuali vecchie junction e clona ricorsivamente le cartelle reali in `~/.gemini/config/plugins/`.
3. **Allineamento Documentazione e Regole**:
   - Aggiornato `README.md` con le istruzioni di installazione corrette (`npm run sync` o copia reale in `~/.gemini/config/plugins/`).
   - Aggiornato `MEMORY.md` (Sezione 4) registrando la lezione appresa sul comportamento del Language Server con i reparse point.
   - Aggiornato `.agents/skills/install-plugin/SKILL.md` (Sezione 3) rimuovendo le indicazioni errate sulle junction.

## Impatto e Conseguenze
- Validazione automatica `npm test` verificata con esito 9/9 OK.
- Riconoscimento immediato al 100% di tutti gli 8 plugin da parte del Language Server di Antigravity.
- Tutti i comandi slash (`/next-step`, `/memory-sync`, `/tone-audit`, ecc.) risultano univoci, correttamente etichettati e stabili tra riavvii.

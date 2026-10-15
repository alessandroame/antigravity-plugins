# [2026-10-15] ADR: Integrazione Stima ETA In-Flight su Doppio Canale e Auto-Calibrazione in `telemetry-analytics` (v1.1.0)

## Contesto & Motivazione
Durante l'esecuzione di prompt articolati in più fasi, lo sviluppatore non disponeva di una stima dell'orario di fine lavorazione (ETA) né di un riscontro sull'avanzamento residuo in tempo reale. Inoltre, richiedere al solo modello LLM di stimare l'ETA tramite una regola testuale presenta un limite strutturale: il modello riceve l'orario solo al primo messaggio utente (`ADDITIONAL_METADATA`) ma è privo di un orologio durante i sub-turni intermedi post-tool.

## Decisioni Architetturali
1. **Integrazione Diretta in `telemetry-analytics` (v1.1.0)**:
   - Invece di introdurre un plugin separato con duplicazione della lettura di `transcript.jsonl`, il motore ETA è stato integrato direttamente in `telemetry-analytics`.
2. **Iniettore Real-Time su Hook `PreInvocation` (`scripts/eta-injector.mjs`)**:
   - Legge l'ultimo step `USER_INPUT` da `transcript.jsonl`, calcola i secondi trascorsi (`Elapsed`), estrae la latenza media storica per step e il fattore di calibrazione da `metrics-summary.json`, e inietta nel contesto un `ephemeralMessage` (`[TELEMETRY-ETA-CLOCK]`).
3. **Emissione ETA su Doppio Canale + Fast-Path Silence (`rules/AGENTS.md`)**:
   - **Fast-Path Silence**: nessun banner ETA per risposte corte o dirette (`< 10s`, 0–1 tool) per evitare rumore visivo.
   - **Canale 1 (Riga di Stato in Chat)**: emissione della riga `[ETA: ~Ns (Fine stimata: HH:MM:SS) | Elapsed: Ns | Fase X/Y: ...]` ad inizio lavorazione e ad ogni cambio di fase, con consuntivo finale `[Completato in Ns | ETA iniziale: ~Ns | Scostamento: ...]`.
   - **Canale 2 (Pill dei Tool)**: prefisso `[Fase/Tot · ETA ~Ns]` in `toolAction` e `toolSummary` per ogni chiamata a tool durante le lavorazioni multi-step.
4. **Auto-Calibrazione dell'Errore di Stima (`scripts/collector.mjs` & `scripts/report.mjs`)**:
   - Alla chiusura del task (`Stop`), `collector.mjs` confronta l'ETA iniziale dichiarata con la durata effettiva del prompt e aggiorna la media mobile esponenziale `etaCalibrationFactor` del workspace, esposta nel report `/plugin-analytics`.

## Impatto e Verifiche
- Validazione `npm test` (`node scripts/validate.mjs --all`): 10/10 plugin verificati, 0 errori, 0 avvisi.
- Collaudo `eta-injector.mjs` e `report.mjs` su transcript reale superato.
- Sincronizzazione fisica globale `npm run sync` completata.

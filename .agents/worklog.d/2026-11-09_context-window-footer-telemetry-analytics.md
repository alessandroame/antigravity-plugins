# 2026-11-09 — Estensione Footer Token di Fine Risposta a 4 Valori con Dimensione Contesto (`Contesto: <ctx>`)

- **Data**: 2026-11-09
- **Ambito**: `plugins/telemetry-analytics/rules/AGENTS.md`, `plugins/telemetry-analytics/README.md`, `scripts/sync-to-global.mjs`, `MEMORY.md`, `DESIDERATA.md`

## 1. Contesto e Motivazione
Durante l'ispezione della capienza della finestra di contesto di **Gemini 4 Argon** (`1.048.576` token unificati tra input, thinking e output), è emersa l'esigenza di avere sempre a vista la dimensione della finestra di contesto occupata a ogni turno (`input_tokens + cache_read_tokens` dell'ultimo passo) direttamente nel footer automatico di fine risposta, senza dover invocare manualmente `/plugin-analytics`.

## 2. Modifiche Implementate
1. **Regola Canonica (`plugins/telemetry-analytics/rules/AGENTS.md`)**:
   - Aggiornato il contratto da 3 a 4 valori con template `{percentuale} ({dimensione})` su `1M` (`1.048.576` token): `> Prompt #<N>: <in> in / <out> out · Contesto: <ctxPct>% (<ctx>) · Sessione: <sessPct>% (<totSessione>)`.
2. **Bootstrap Globale & Cloud (`scripts/sync-to-global.mjs`)**:
   - Allineato il punto 5 degli standard Always-On generati in `~/.gemini/GEMINI.md` e `~/.gemini/CLOUD_BOOTSTRAP.md`.
3. **Documentazione e Memoria (`plugins/telemetry-analytics/README.md`, `MEMORY.md`, `DESIDERATA.md`)**:
   - Allineati i riferimenti al formato a 4 valori con `Contesto: <ctx>`.

## 3. Verifica
- `node scripts/validate.mjs --all`: `16/16` plugin validi (`0` errori, `0` avvisi).
- `npm test`: `101/101` test unitari superati (`16` suite).
- `diff-triage.mjs`: `PASS` (`0` linee critiche).

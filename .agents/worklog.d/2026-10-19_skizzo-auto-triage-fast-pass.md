# 2026-10-19 — Evoluzione Plugin `skizzo` v1.5.0: Filtro Automatico a Priori (`Gate 0: FAST-PASS vs DUAL-TRACK`) e Motore Headless `triage.mjs`

## 1. Contesto
Quando la modalità `/skizzo` (`v1.4.0`) è attiva in sessione (`Sticky`), ogni messaggio successivo invocava incondizionatamente i 2 subagent (`Alpha` e `Beta`), introducendo `~90–120s` di latenza anche su comandi operativi (`git commit`, `/memory-sync`), domande di sola lettura, conferme esecutive (*"fallo"*, *"procedi"*) o micro-correzioni puntuali a scelta zero (refusi, rename, cambi di una costante). Inoltre `plugins/skizzo/rules/AGENTS.md` si trovava a `6.499 / 6.500 byte` (1 solo byte libero).

## 2. Decisioni Architetturali (Sintesi Dialettica `Alpha` + `Beta`)
1. **Filtro Automatico Predefinito in `/skizzo` (`Gate 0` a Priori in `< 5ms`, `0` Subagent su Task Diretti, Zero Flag `auto` Ridondanti)**:
   - `/skizzo` mantiene lo stato `SKIZZO = ON` persistente per tutta la sessione e antepone alla Fase 1 un **Gate 0 di Triage Automatico a Priori**:
     - **`FAST-PASS` (`0` Subagent, ~90–120s risparmiati)**: scatta su (A) operazioni meccaniche/Git/test/memoria o conferme esecutive di un piano già approvato (*"fallo"*, *"procedi"*), (B) domande di sola lettura/ispezione e (C) micro-correzioni chirurgiche a scelta unica. Risponde subito con il banner leggero `[!NOTE] MODALITÀ SKIZZO ATTIVA (FAST-PASS...)` e **mantiene `SKIZZO = ON`** per i turni successivi.
     - **`DUAL-TRACK` (`2` Subagent Paralleli)**: scatta automaticamente quando il task presenta almeno 2 segnali di tensione progettuale (Architettura/Piani/Multi-File, Esperienza Utente/Flussi/Mobile `360px`, Input Sporchi/Parsing/Casi Limite).
   - **Override Rapidi per Singolo Turno**: `--force` / `-f` (*"forza skizzo"*, *"usa skizzo"*) forza i 2 subagent anche su task piccoli; `--skip` / `--fast` (*"senza skizzo"*, *"risposta veloce"*) forza il `FAST-PASS` per 1 turno senza spegnere Skizzo.
2. **Motore Headless `triage.mjs` e Compattazione `AGENTS.md`**:
   - Creato [`plugins/skizzo/scripts/triage.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/scripts/triage.mjs) (`classifySkizzoTask`, `O(1)`, zero dipendenze DOM/storage) e la suite di test [`plugins/skizzo/tests/triage.test.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/tests/triage.test.mjs) (`7/7 test PASS` su Oracolo Alpha e Oracolo Beta).
   - Compattato [`plugins/skizzo/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/rules/AGENTS.md) sotto il tetto di `6.500 byte` includendo il Gate 0.

## 3. Impatto e Verifica
- `node --test plugins/skizzo/tests/triage.test.mjs`: `7/7 PASS` (`~5.8ms`).
- `node scripts/validate.mjs --all`: `13/13 plugin OK`, `0 errori`, `0 avvisi`.
- `npm run sync`: sincronizzato `skizzo` `v1.5.0` in `~/.gemini/config/plugins/skizzo`.

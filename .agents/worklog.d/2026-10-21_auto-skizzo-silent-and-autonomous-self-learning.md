# [2026-10-21] ADR: Modalità `Auto-Skizzo Silente` (`AUTO`), Mining Sessioni (`session-miner.mjs`) e Auto-Apprendimento Continuo (`L1..L3`)

## Contesto & Motivazione
Dall'analisi empirica su **508 transcript** in `~/.gemini/antigravity/brain/` (campione profondo sulle ultime 40 sessioni padre = 156 turni utente e 77 sessioni subagent):
1. L'utente attivava manualmente `/skizzo` nel **65% delle sessioni padre (`13/20`)**, ma sul totale dei 156 turni l'**87.8% (`137/156`)** richiede esecuzione rapida (`FAST-PASS`, mediana `66s` vs `244s` per `DUAL-TRACK`). Rendere `SKIZZO = ON` con banner sempre visibile inquinerebbe l'88% delle risposte normali.
2. Nel **23.1% dei turni (`36/156`)** e in **14 degli ultimi 30 commit**, l'utente trasformava manualmente un'esperienza vissuta in sessione in un aggiornamento di skill/regola; inoltre, 5 sessioni consecutive su *GlideMind* riguardavano regressioni 3D/camera prive di test invariante numerico (`L3`), e una domanda complessa con clausola finale *"non agire è solo una domanda"* non era protetta da guardia mid-sentence.

## Decisioni Architetturali
1. **Modalità `Auto-Skizzo Silente` (`SKIZZO = AUTO` di Serie in `plugins/skizzo` v1.6.0)**:
   - Esteso [`plugins/skizzo/scripts/triage.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/scripts/triage.mjs) con doppia soglia (`threshold = 4` se implicito `AUTO`, `threshold = 3` se esplicito/sticky `ON`), flag `silentFastPass: true` (che impone **`0 byte` di banner** sui `FAST-PASS` impliciti), guardia mid-sentence `READONLY_OVERRIDE_PATTERNS` (`non agire`, `solo una domanda`) e segnali di regressione 3D/dominio.
2. **Motore Headless di Mining Sessioni (`session-miner.mjs` in `plugins/proactive-mentorship` v1.2.0)**:
   - Creato [`plugins/proactive-mentorship/scripts/session-miner.mjs`](file:///c:/github/antigravity-plugins/plugins/proactive-mentorship/scripts/session-miner.mjs) per scansionare i transcript in `brain/`, filtrare i subagent e classificare i pattern in `L3_INVARIANT_GUARD` o `L2_SKILL_OR_RULE_EVOLUTION`.
3. **Protocollo di Auto-Apprendimento Continuo (`Zero-Prompt Self-Learning` `L1..L3`)**:
   - Integrato in `proactive-mentorship` (v1.2.0), `cognitive-persistence` (`/memory-sync` Step 3.5, v1.6.0) ed `engineering-workflow` (Gate 3 invariante numerico anti-regressione, v1.2.0) il flusso autonomo *Act -> Verify (`validate.mjs --all`) -> Sync (`npm run sync`) -> 1-Line Receipt* con opzione di rollback rapido (`"annulla regola"`).

## Impatto e Conseguenze
- **Test Unitari**: `9/9 PASS` in [`plugins/skizzo/tests/triage.test.mjs`](file:///c:/github/antigravity-plugins/plugins/skizzo/tests/triage.test.mjs) e `4/4 PASS` in [`plugins/proactive-mentorship/tests/session-miner.test.mjs`](file:///c:/github/antigravity-plugins/plugins/proactive-mentorship/tests/session-miner.test.mjs) (`13/13 PASS` totali).
- **Validazione & Sync**: `13/13 plugin OK` (`0 errori`, `0 avvisi` in `scripts/validate.mjs --all`) e sincronizzazione fisica completata in `~/.gemini/config/plugins/`.

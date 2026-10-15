# [2026-10-15] Audit Stato Installazione Plugin Globali / Progetto e Sincronizzazione Attuale

## Contesto & Motivazione
Verifica dello stato di installazione dei plugin di Antigravity sia a livello globale (`~/.gemini/config/plugins/`) che per progetto, a seguito degli aggiornamenti recenti del repository (inclusi i nuovi plugin `code-inspector` e `skill-governance`, il refactoring SemVer di `cognitive-persistence` v1.2.0, `laws-of-ux` v1.1.0 e `telemetry-analytics` v1.3.0).

## Diagnosi Empirica Rilevata
1. **Disallineamento Globale Pre-Sync**:
   - `code-inspector` (v1.0.0): assente nella configurazione globale.
   - `skill-governance` (v1.0.0): assente nella configurazione globale.
   - `telemetry-analytics` (v1.3.0): configurato come Directory Junction (`d----l`), ignorato dal Language Server di Antigravity su Windows (chiamata RPC `GetAllPlugins` restituiva solo 6 plugin).
   - `cognitive-persistence` e `laws-of-ux`: versioni obsolete (v1.1.0 e v1.0.0 rispettivamente).
   - Plugin di base (`engineering-sobriety`, `engineering-workflow`, `execution-guard`, `proactive-mentorship`): codice obsoleto fermo al 07/10/2026, privo delle sezioni anti-razionalizzazione e delle direttive di leggibilità chat.
2. **Ambito di Discovery per Progetto**:
   - Confermato il vincolo architetturale: Antigravity scansiona unicamente `~/.gemini/config/plugins/` per i plugin distribuiti. I singoli progetti non ospitano plugin autonomi, ma possono contenere skill di workspace o regole locali.
   - Audit progetti: identificati residui di vecchie skill/regole pre-plugin in progetti legacy (`ParaMeteo`, `Quiz_VDS-VL`, `WeatherNerdWearOs`) che sono ora gestiti a livello globale dai plugin ufficiali.

## Azioni Eseguite & Decisioni
1. **Esecuzione Sincronizzazione Fisica Globale (`npm run sync`)**:
   - Rimozione sicura del junction link `telemetry-analytics` e copia fisica ricorsiva di tutti i 9 plugin.
   - Registrazione con stato `"enabled": true` per tutti i 9 plugin in `~/.gemini/config/config.json`.
2. **Verifica RPC Language Server**:
   - Invocato l'endpoint Connect-RPC `GetAllPlugins`: tutti i 9 plugin risultano attivi e riconosciuti con `isGlobal: true` e `disabled: false`.
3. **Validazione Suite Interna**:
   - Eseguito `npm test` (`scripts/validate.mjs --all`): 10/10 superati con 0 errori e 0 avvisi.

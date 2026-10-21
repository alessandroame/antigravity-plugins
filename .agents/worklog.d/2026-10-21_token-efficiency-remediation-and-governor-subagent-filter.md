# 2026-10-21 — Bonifica Inefficienze Token Cross-Repo, Regole Condizionali, Tetti in Byte e Filtro Subagent in `human-governor`

## Contesto
In seguito all'audit quantitativo `/skizzo` sul consumo di token nei progetti aperti (`c:\github\antigravity-plugins`, `c:\github\glidemind`) e nella configurazione globale (`C:\Users\aless\.gemini\`), sono state identificate e risolte le principali fonti di spreco fisso per turno e per sessione:
1. `29` skill Google Cloud / BigQuery / Dataflow / Airflow / Python in `C:\Users\aless\.gemini\config\skills\` e `10` skill di plugin di terze parti con `description > 250` char bruciavano `~6.500 token/turno` nel catalogo `<skills>`.
2. I `6` file verticali in `c:\github\glidemind\.agents\rules\` (`32,3 KB`) erano privi di frontmatter YAML condizionale e venivano iniettati integralmente in ogni turno (`~8.090 token/turno`).
3. I file `rules/AGENTS.md` dei 12 plugin (`54,2 KB`) contenevano tabelle di anti-razionalizzazione duplicate rispetto alle sezioni prescrittive.
4. `governor-hook.mjs` in `plugins/human-governor` conteggiava i subagent effimeri (`Alpha`/`Beta`/`Gamma` di `/skizzo`) come sessioni WIP umane concorrenti, iniettando falsi positivi `[HUMAN-GOVERNOR ALERT — STATUS: CRITICAL]` nei subagent stessi.
5. `WORKLOG.md` (`43,5 KB`, `296` righe) e `MEMORY.md` (`26,3 KB`) in `c:\github\glidemind` non avevano un tetto in byte oltre al tetto in righe.

## Decisioni e Interventi Applicati
1. **Archiviazione Skill GCP e Compressione Frontmatter (`-6.517 token/turno`)**:
   - Spostate le `29` skill GCP/BigQuery non utilizzate in `C:\Users\aless\.gemini\config\skills-disabled-gcp\`, mantenendo attive solo `market-moat-audit`, `passive-economics-guard` e `workflow-time-calculator`.
   - Compresse sotto `<= 200` char le `description` di `10` skill di terze parti (`modern-web-guidance`, `chrome-extensions`, `google-maps-platform`, `gemini-api-dev`, `gemini-live-api-dev`, `gemini-omni-flash-api`, `android-cli`, `debug-optimize-lcp`, `cookie-debugging`, `chrome-devtools`).
2. **Conversione a Regole Condizionali in GlideMind (`-7.800 token/turno`)**:
   - Aggiunto frontmatter `trigger: model_decision` + `description` + `globs` ai 6 file verticali in `c:\github\glidemind\.agents\rules\` (`geodesy_webgl_3d_spec.md`, `ui_chart_design_spec.md`, `ui_design_system_spec.md`, `ui_layout_spec.md`, `novice_pilot_spec.md`, `comprensorio_locality_spec.md`), lasciando Always-On solo `constraints.md` (`38` righe).
3. **Compattazione `rules/AGENTS.md` dei 12 Plugin (`-4.200 token/turno`)**:
   - Compattati i 12 file `plugins/*/rules/AGENTS.md` da `54,2 KB` a `36,6 KB` (`-32,5%`) preservando il 100% delle regole operative e abbassando il tetto in `scripts/validate.mjs` da `6.500 B` a `6.000 B`.
4. **Filtro Subagent in `governor-hook.mjs` (`human-governor`)**:
   - Aggiunta `isHumanConversationTranscript(tPath)` in [`plugins/human-governor/scripts/governor-hook.mjs`](file:///c:/github/antigravity-plugins/plugins/human-governor/scripts/governor-hook.mjs) per escludere i subagent sia dall'iniezione dell'alert sia dal conteggio `state.activeSessions`.
5. **Rotazione `WORKLOG.md`, Compattazione `MEMORY.md` e Guardie in Byte (`L3`)**:
   - In `c:\github\glidemind`: ruotato `WORKLOG.md` da `43,5 KB` (`296` righe) a `14,8 KB` (`89` righe, archiviando le Fasi 6-bis e 7-septies..sexiesdecies in `.agents/archive/WORKLOG_v2_archive.md`) e compattato `MEMORY.md` da `26,3 KB` a `10,9 KB` (`109` righe).
   - Aggiunti i tetti `MEMORY.md <= 16.384 B` (`16 KB`) e `WORKLOG.md <= 20.480 B` (`20 KB`) in `scripts/validate.mjs` e `c:\github\glidemind\tests\ui\shiftLeftGovernance.test.mjs`.

## Verifica
- `node scripts/validate.mjs --all`: `13/13` plugin validati (`0` errori, `0` avvisi).
- `npm run sync`: `12/12` plugin sincronizzati in `C:\Users\aless\.gemini\config\plugins`.
- `node --test` su `antigravity-plugins` e `tests/ui/shiftLeftGovernance.test.mjs` su `glidemind`: `100%` pass.

# [2026-10-28] ADR: Guardia Portabilità Multi-Macchina (`HARDCODED_USER_PATH`), Shim `pwsh` e Audit `skill-collision-check` Cross-Workspace

## Contesto & Motivazione
Durante la sincronizzazione globale dei plugin sulla postazione Windows `nb176-polar-axis` (`C:\Users\aame\`), sono emerse tre criticità operative trasversali:
1. Il runtime di esecuzione comandi di Antigravity invoca `pwsh`, non presente di default in `%PATH%` sulle installazioni Windows dotate del solo `powershell.exe` (`5.1`), causando il fallimento di `run_command` (`exec: "pwsh": executable file not found in %PATH%`).
2. Quattro file dei plugin (`cognitive-persistence/rules/AGENTS.md`, `human-governor/rules/AGENTS.md`, `human-governor/skills/focus-audit/SKILL.md`, `proactive-mentorship/rules/AGENTS.md`) e `GlideMind/.agents/rules/constraints.md` contenevano riferimenti assoluti hardcoded al profilo utente della macchina originaria (`C:/Users/aless/.gemini/...`).
3. L'audit `skill-collision-check` sui 6 workspace locali (`c:/github/*`) ha evidenziato `14` skill con `description > 250` caratteri (`Quiz_VDS-VL`, `WeatherNerdWearOs`, `AgentBridge`), sovrapposizioni semantiche in `Quiz_VDS-VL` (`minimal-ui-ux`, `ui-audit-inspector`, `headless-pwa-tester`) rispetto ai plugin globali (`laws-of-ux`, `engineering-sobriety`, `shift-left-governance`) e `6` regole verticali prive di `trigger: model_decision` in `ParaMeteo` e relativi worktree.

## Decisioni Architetturali
1. **Shim Utente `pwsh.cmd` in `%LOCALAPPDATA%\Microsoft\WindowsApps`**:
   - Creato lo shim `pwsh.cmd` (`@powershell.exe %*`) nella directory `%LOCALAPPDATA%\Microsoft\WindowsApps` (già inclusa nel `%PATH%` utente di Windows) per garantire l'esecuzione trasparente di `run_command` sulle macchine prive di PowerShell 7 senza sporcare i repository Git.
2. **Normalizzazione Percorsi Canonici & Guardia Statica `HARDCODED_USER_PATH` (`L3` in `scripts/validate.mjs`)**:
   - Sostituiti tutti i puntamenti `C:/Users/aless/.gemini/config/plugins/...` con il percorso canonico condiviso `c:/github/antigravity-plugins/plugins/...` nei 4 file dei plugin e in `GlideMind/.agents/rules/constraints.md`.
   - Introdotta in [`scripts/validate.mjs`](file:///c:/github/antigravity-plugins/scripts/validate.mjs) la regex `HARDCODED_USER_PATH` (`/[cC]:[\\/]+Users[\\/]+(?!<)[a-zA-Z0-9._-]+[\\/]/`) dentro `validateMarkdownHygiene`, bloccando a `0 token` qualsiasi futuro inserimento di percorsi utente specifici di una singola macchina in regole, skill o `references/`.
3. **Bonifica `skill-collision-check` sui Workspace Locali (`P1`/`P2`)**:
   - Specializzate le skill di `Quiz_VDS-VL` sul solo dominio d'esame AeCI VDS-VL (griglia 30 bolle, scorciatoie `1, 2, 3, F, Spazio`) e compattate tutte le `14` `description` fuori budget (`Quiz_VDS-VL`, `WeatherNerdWearOs`, `AgentBridge`) nel range `[80, 250]` caratteri con trigger direttivo `Utilizza questa skill quando...`.
   - Aggiunto il frontmatter condizionale `trigger: model_decision` + `globs` alle regole verticali `geodesy_webgl_3d_spec.md` e `ui_layout_spec.md` in `ParaMeteo` e nei 2 worktree associati.

## Impatto e Conseguenze
- **File Modificati in `antigravity-plugins`**:
  - [`scripts/validate.mjs`](file:///c:/github/antigravity-plugins/scripts/validate.mjs)
  - [`plugins/cognitive-persistence/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/cognitive-persistence/rules/AGENTS.md)
  - [`plugins/human-governor/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/human-governor/rules/AGENTS.md)
  - [`plugins/human-governor/skills/focus-audit/SKILL.md`](file:///c:/github/antigravity-plugins/plugins/human-governor/skills/focus-audit/SKILL.md)
  - [`plugins/proactive-mentorship/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/proactive-mentorship/rules/AGENTS.md)
  - [`MEMORY.md`](file:///c:/github/antigravity-plugins/MEMORY.md), [`WORKLOG.md`](file:///c:/github/antigravity-plugins/WORKLOG.md), [`.agents/archive/WORKLOG_v1_archive.md`](file:///c:/github/antigravity-plugins/.agents/archive/WORKLOG_v1_archive.md)
- **Verifica**: `13/13` plugin validati con `0` errori e `0` avvisi (`validate.mjs --all`), `12/12` plugin sincronizzati in `~/.gemini/config/plugins/` e `0` violazioni di lunghezza `description` sulle `191` skill locali/globali.

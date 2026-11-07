# 2026-11-07 — Benchmark A/B Cieco (`GO`) e Migrazione Universale allo Standard Ibrido `EN/IT` (`EN` Logic / `IT` User-Facing)

## 1. Contesto e Obiettivo
- **Piano di riferimento**: [`.agents/plans/hybrid-en-it-migration.md`](file:///c:/github/antigravity-plugins/.agents/plans/hybrid-en-it-migration.md)
- **Problema**: Le regole `plugins/*/rules/*.md` e i runbook `SKILL.md` scritti interamente in italiano consumano circa il `20-23%` di byte/token BPE in più per la parte imperativa interna (condizioni `IF/THEN`, checklist, vincoli), mentre i path `c:/github/...` nei runbook riducono la portabilità immediata su ambienti Cloud Linux VM.
- **Obiettivo**: Validare empiricamente con `/ab-bench` (Test delle 5 Dita con Giudice Cieco) se la separazione **Logica Imperativa in Inglese (`EN`) + Contratto Visibile e Trigger Utente in Italiano (`IT`)** riduca i byte mantenendo o migliorando l'efficacia (`>= 18%` risparmio byte, `0` dita perse, `Language Drift = 0`), e in caso di `GO` convertire l'intero catalogo e codificare lo standard permanente.

## 2. Risultati Fase 1 — Benchmark A/B Cieco (`plugins/ab-bench/scripts/bench.mjs`)
- **Compressione Byte Misurata**:
  - `plugins/execution-guard/rules/AGENTS.md`: `2.073 B` -> `1.583 B` (`-490 B`, **`-23,6%`**)
  - `plugins/mapek/rules/AGENTS.md`: `2.875 B` -> `2.294 B` (`-581 B`, **`-20,2%`**)
  - **Media combinata**: **`-21,6%`** (superata la soglia `>= 18%`).
- **Esito Giudice Cieco sui 3 Scenari (`--no-save --json`)**:
  - **Scenario S1 (`execution-guard` + `engineering-sobriety`)**: Sfidante A (`IT`) `5/5` (`13,2s`) vs Sfidante B (`Hybrid EN/IT`) `5/5` (`14,1s`) -> `verdict: GO`, `lostFingers: []`, `Language Drift: 0`.
  - **Scenario S2 (`mapek` + `Semantic Drill-Down`)**: Sfidante A (`IT`) `4/5` (`23,0s`, perso `Indice` per omissione del comando `--confirm-user-approval`) vs Sfidante B (`Hybrid EN/IT`) `5/5` (`16,0s`, `-7,0s`) -> `verdict: GO`, `+1` dito guadagnato, `lostFingers: []`, `Language Drift: 0`.
  - **Scenario S3 (`skizzo` Gate 0 + `cognitive-persistence` `/take-note`)**: Sfidante A (`IT`) `5/5` (`18,9s`) vs Sfidante B (`Hybrid EN/IT`) `5/5` (`19,5s`) -> `verdict: GO`, `lostFingers: []`, `Language Drift: 0`.

## 3. Interventi Eseguiti (Fase 2 & Fase 3)
1. **Guardie Bilingui `L3`**:
   - Estesa la regex di negazione per `<agent-embed>` + `100vh|h-screen|min-h-screen` in `scripts/validate.mjs` (`/\b(?:mai|never|not|no|avoid|forbid|forbidden|prohibited|vietato|divieto|evitare)\b/i`).
   - Adeguate in forma bilingue `(?:IT|EN)` le regex strutturali in `plugins/cognitive-persistence/tests/cognitive-persistence-governance.test.mjs`.
2. **Conversione Universale Auto-Discovery (`56` file normativi)**:
   - Convertiti in **Hybrid EN/IT** tutti i `19` file `rules/*.md` (`plugins/*/rules/*.md` e `templates/starter-plugin/rules/AGENTS.md`) e tutti i `35` file `SKILL.md` (`plugins/*/skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`, `templates/starter-plugin/skills/*/SKILL.md`), oltre ai `2` subagent `plugins/mapek/agents/*.md`.
   - Sostituiti i path assoluti macchina/OS nei runbook con path relativi al repository (`plugins/...`) o basati su `~` (`~/.gemini/config/plugins/...`), garantendo portabilità multipiattaforma Windows + Cloud Linux VM.
3. **Standard Permanente "D'ora in poi"**:
   - Codificata la regola **Hybrid Language Standard (`EN` Logic / `IT` User-Facing)** in `skill-governance/rules/AGENTS.md`, `skill-governance/skills/skill-audit/SKILL.md` (Dimensione F), `proactive-mentorship/rules/AGENTS.md`, `mapek/rules/AGENTS.md`, `mapek/core/primitive-router.mjs`, `pattern-harvester/rules/AGENTS.md`, `pattern-harvester/core/harvester-engine.mjs`, `templates/starter-plugin/` e `MEMORY.md`.

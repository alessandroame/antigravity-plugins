# 2026-10-17 — Evoluzione Plugin `skizzo` v1.2.0: Auto-Routing & Dichiarazione Sintetica delle Skill alla Partenza

## Contesto
Nel flusso Dual-Track (`/skizzo`), i due subagent paralleli (`Subagent Alpha` per purezza tecnica e `Subagent Beta` per dominio/UX) ereditavano passivamente il catalogo `<skills>` nel system prompt senza un routing deterministico da parte dell'Orchestratore e senza dichiarare in modo visibile nell'output quali skill stessero effettivamente applicando al task. Inoltre `plugins/skizzo/rules/AGENTS.md` si trovava a `6.484 / 6.500 byte` (a soli `16 byte` dal limite del validatore statico).

## Decisioni Architetturali (Sintesi Dialettica `/skizzo`)
- **Stadio 1 — Auto-Routing Skill in Fase 1 (`Legge di Tesler & Postel`)**: l'Orchestratore seleziona automaticamente **1–3 skill pertinenti** per ciascun binario (`<skills-alpha>` tecniche, `<skills-beta>` dominio/UX, fallback `` `core-standard` ``, zero domande di configurazione all'utente) e le inietta nel campo `**Skill Attive Assegnate**:` dei Prompt Template in [`plugins/skizzo/skills/skizzo/SKILL.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/skills/skizzo/SKILL.md#L44-L82).
- **Stadio 2 — Dichiarazione Monoriga al Rigo 1 dei Subagent**: `Subagent Alpha` e `Subagent Beta` aprono obbligatoriamente il proprio report iniziale con `**Skill Attive (Alpha/Beta)**: \`<skill-1>\`, \`<skill-2>\`` (solo slug `kebab-case`, zero descrizioni prolisse).
- **Stadio 3 — Visibilità a 0-Click nel Banner `[!IMPORTANT]` e 1-Click nella Matrice `<details>`**:
  - Nel banner `[!IMPORTANT]` al rigo 1 dell'output dell'Orchestratore vengono esposti i tag `(Skill: \`...\`)` subito accanto ai link `conversation://<id-alpha>` e `conversation://<id-beta>` senza aggiungere righe extra al blocco `0-Click`.
  - Nella `Matrice Dialettica Skizzo` (`<details>`), la prima riga della tabella (`| **Skill Attive** |`) documenta la copertura ortogonale tra skill tecniche e skill di dominio.
- **Compattazione `rules/AGENTS.md`**: compattato [`plugins/skizzo/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/rules/AGENTS.md) sotto il tetto di `6.500 byte` (`validate.mjs`).

## Impatto & Verifica
- Aggiornati [`plugins/skizzo/plugin.json`](file:///c:/github/antigravity-plugins/plugins/skizzo/plugin.json) (`v1.2.0`), [`plugins/skizzo/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/rules/AGENTS.md), [`plugins/skizzo/skills/skizzo/SKILL.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/skills/skizzo/SKILL.md), [`plugins/skizzo/skills/skizzo/references/dialectic-template.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/skills/skizzo/references/dialectic-template.md) e [`plugins/skizzo/README.md`](file:///c:/github/antigravity-plugins/plugins/skizzo/README.md).
- Sincronizzato il plugin in `~/.gemini/config/plugins/skizzo` tramite `npm run sync` e superati `Oracolo Alpha (Tecnico)` e `Oracolo Beta (Dominio)`.

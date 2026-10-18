# 2026-10-18 — Evoluzione Plugin `proactive-mentorship` v1.1.0: Coaching Antigravity & Agent Training Ladder (`L0..L3`)

## Contesto
L'utente ha richiesto in modalità `/skizzo` e `/plan` di espandere il plugin `proactive-mentorship` per includere consigli proattivi sull'uso ottimale di Antigravity (comandi slash nativi, igiene della context window, delega a subagent, `@file`) e sulle tecniche di addestramento degli agenti (*Agent Training* / *Harness Engineering*).

## Decisioni Architetturali (Sintesi Dialettica `Alpha` vs `Beta`)
1. **Disaccoppiamento a 3 Livelli per Zero System Prompt Bloat (`Alpha`)**:
   - Mantenuta un'unica skill `prompt-refactor` (evitando l'overhead fisso di un secondo frontmatter YAML ad ogni turno) e compattata `rules/AGENTS.md` a `~3.800 byte` (sotto il tetto hard di `6.500 byte`), spostando i cataloghi estesi in `skills/prompt-refactor/references/agy-commands-and-context.md` e `skills/prompt-refactor/references/agent-training-ladder.md`.
2. **Gate Deterministico Anti-Disturbo & Legge di Hick (`Alpha` + `Beta`)**:
   - Clausola di silenzio (`0 byte`) quando il prompt utente specifica già `@file`/simbolo e tocca `<= 2 file` senza rischi architetturali; obbligo di proporre **1 sola Mossa Antigravity** e **1 sola Pillola di Addestramento** per intervento, con blocchi già compilati pronti per il copia-incolla dentro `<details>`.
3. **Agent Training Ladder (`L0..L3`) e Graduazione Shift-Left**:
   - Formalizzata la scala a 4 gradini: `L0` (Prompt 1-Shot + Esempio Prima/Dopo), `L1` (Invariante di progetto in `MEMORY.md`), `L2` (`L2a` regola sempre attiva via `/learn` o `AGENTS.md`; `L2b` procedura `>= 3 step` in `SKILL.md`) e `L3` (graduazione obbligatoria a test statico in `scripts/validate.mjs` a costo `0 token`).
4. **Estensione Validatore Statico (`scripts/validate.mjs` — `L3`)**:
   - Aggiunta la guardia strutturale GFM che verifica la presenza della riga vuota obbligatoria dopo ogni `</summary>` e il controllo di esistenza/igiene Markdown sui file `references/*.md` linkati nelle `SKILL.md`.

## Impatto e Verifiche
- Validazione eseguita con `node scripts/validate.mjs --all` (`0 errori`) e sincronizzazione fisica globale con `npm run sync`.

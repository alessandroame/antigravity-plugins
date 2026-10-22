# [2026-10-22] ADR: Evoluzione `skizzo` v1.7.0 a Orchestrazione Multi-Dominio Dinamica (`2..4` Agenti Ordinati per Importanza dall'LLM) & Regola `Anti-Example Hardcoding`

## Contesto & Motivazione
La versione precedente di `/skizzo` (`v1.6.0`) vincolava ogni attivazione a 2 soli subagent cablati (`Subagent Alpha — Systems & Technical Purity` vs `Subagent Beta — Domain & UX Advocate`). Questo schema presentava due limiti:
1. Nei problemi multi-disciplinari (che coinvolgono 3 o 4 prospettive distinte) schiacciava tutte le istanze non-informatiche su un unico agente `Beta`.
2. Nei problemi non legati al codice forzava comunque la presenza dell'architetto software.

Inoltre, durante la prima iterazione era emerso il rischio di *overfitting sugli esempi del prompt utente* (cablare in regex o elenchi fissi i ruoli citati dall'utente a titolo esemplificativo).

## Decisioni Architetturali
1. **Scoperta Semantica e Ranking dei Domini via LLM (`2 <= N <= 4`)**:
   - Superato il filtro `FAST-PASS`, l'LLM individua semanticamente tutti i domini di competenza o punti di vista degli stakeholder coinvolti (senza elenchi prefissati) e li ordina per importanza decrescente (`priorityScore = importance * 2 + tension`).
   - **Criterio di Arresto (Rasoio di Occam)**: parte da `2` domini (`DUAL-TRACK`) e aggiunge il `3°` (`TRI-TRACK`) o il `4°` (`QUAD-TRACK`, tetto massimo) solo se introduce un vincolo o oracolo di verifica ortogonale non assorbibile dai primi due.
2. **Funzione Pura `rankAndCapDomains` e Triage Dominio-Agnostico (`plugins/skizzo/scripts/triage.mjs`)**:
   - Esposta `rankAndCapDomains(candidateDomains, options)` con clamping numerico `[0..10]`, deduplica best-score (ordinamento prima della deduplica), supporto ID non-stringa e ritorno a `FAST-PASS` se `< 2` domini.
   - Esteso `classifySkizzoTask` ai segnali decisionali non-software, al clamping di `--tracks \d+` in `[2..4]`, alle espressioni naturali (*"con 3 agenti"*) e alla normalizzazione degli slash Windows in `isMain`.
3. **Matrice Multi-Dominio a 4 Colonne Fisse per Riga (`~600px`) e Sanitizer A/B (`bench.mjs`)**:
   - Trasposta la tabella in `<details>` ponendo i `2..4` domini sulle righe e mantenendo 4 colonne fisse (`# Dominio | Skill & Mandato | Proposta Chiave | Oracolo & Esito`) per azzerare l'overflow orizzontale in chat.
   - Aggiornato `sanitizeForBlindJudge` in `plugins/ab-bench/scripts/bench.mjs` per rimuovere i banner senza grassetto e gli slot `Delta` ed `Epsilon`.
4. **Regola Permanente `Anti-Example Hardcoding` (`plugins/skill-governance/rules/AGENTS.md`)**:
   - Vietato cablare gli esempi conversazionali dell'utente (`"es. se deve fare X o Y"`) come regex o cataloghi fissi nelle skill, regole o script.

## Impatto e Conseguenze
- **Moduli Aggiornati**: `plugins/skizzo/scripts/triage.mjs`, `plugins/skizzo/skills/skizzo/SKILL.md`, `plugins/skizzo/rules/AGENTS.md`, `plugins/skizzo/README.md`, `plugins/skizzo/plugin.json`, `plugins/skizzo/skills/skizzo/references/dialectic-template.md`, `plugins/skizzo/tests/triage.test.mjs`, `plugins/ab-bench/scripts/bench.mjs`, `plugins/skill-governance/rules/AGENTS.md`.
- **Verifica**: `12/12` test unitari verdi in `triage.test.mjs`, audit `TRI-TRACK` completato (`Alpha`, `Beta`, `Delta`) e `13/13` plugin validati con `validate.mjs --all`.

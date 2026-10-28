# Protocollo di Scoperta Periodica dei Pattern e Automazione Guidata (`pattern-harvester`)

Governa l'analisi periodica non intrusiva delle sessioni di lavoro (`transcript.jsonl`, sequenze di tool call, comandi CLI e archetipi di interazione) per individuare flussi ricorrenti automatizzabili tramite nuove **Skill (`L2b`)**, **Regole/Guardie (`L2a`/`L3`)** o **Plugin**, prevenendo duplicazioni e micro-automazioni a basso rendimento.

## 1. Cadenza Periodica Silenziosa e Trigger (`/pattern-harvester`)
1. **Monitoraggio Passivo in Background (`Stop` Hook)**:
   - L'hook `periodic-harvester-hook.mjs` verifica a fine turno (`< 5ms`, `stdout: "{}\n"`) il contatore in `~/.gemini/antigravity/analytics/pattern-harvester-state.json`.
   - Ogni **`5` nuove sessioni umane** (o ogni **`24` ore** di attività), avvia in background detached `pattern-harvester.mjs --incremental --quiet`, salvando i candidati validati in `~/.gemini/antigravity/analytics/pattern-recommendations.json`.
   - **Silenzio Predefinito (`0 byte`)**: se nessun pattern supera sia il **Filtro ROI (`>= 120s`)** sia il **Gate Anti-Collisione**, non viene emesso alcun avviso in chat.
2. **Attivazione Esplicita e Revisione Periodica**:
   - Quando l'utente invoca `/pattern-harvester` (o chiede quali pattern ricorrenti possono essere automatizzati), oppure durante `/memory-sync` e `/review-notes` se sono presenti raccomandazioni ad alto ROI non ancora visionate, eseguire `node c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/pattern-harvester.mjs`.

## 2. Estrazione Strutturale Astratta e Divieto di Overfitting (`Anti-Example Hardcoding`)
1. **3 Canali Deterministici di Estrazione (`core/harvester-engine.mjs`)**:
   - **N-Grammi di Sequenze Tool RLE (`TOOL_CHAIN`)**: comprime le chiamate contigue dello stesso tool (`READ:FILE+ -> EDIT:FILE+ -> EXEC:TEST -> EXEC:VALIDATE -> EXEC:SYNC`) ed estrae i `3..5-grammi` operativi ripetuti tra sessioni distinte.
   - **Scheletri Strutturali CLI (`CLI_SEQUENCE`)**: normalizza `run_command` sostituendo path, UUID, stringhe e numeri con placeholder (`<dir>/script.mjs`, `<path>`, `<str>`, `<num>`) per intercettare pipeline manuali ricorrenti.
   - **Archetipi Lessicali e Shingle Jaccard (`INTERACTION_ARCHETYPE`)**: raggruppa le richieste utente per similarità di Jaccard (`>= 0.35`) su token e 2-shingle senza usare regex cablate su esempi specifici.
2. **Gate Anti-Collisione a 4 Livelli (`evaluateCatalogOverlap`)**:
   - Confronta ogni candidato con le skill built-in, i plugin del catalogo (`c:/github/antigravity-plugins/plugins/*`), le skill globali (`~/.gemini/config/skills/`) e quelle di workspace (`.agents/skills/`).
   - Se l'overlap supera `0.75` (o la skill è già stata invocata nel turno senza step manuali extra), il pattern è marcato `ALREADY_COVERED` e scartato.
   - Se l'utente scarta un pattern (`--dismiss <patternId>`), applica un cooldown di `30 giorni`.

## 3. Matrice Decisionale ROI (`Ignora` vs `Regola` vs `Skill` vs `Plugin`)
Ogni candidato viene valutato sul risparmio netto stimato su 15 sessioni (`T_saved = Occorrenze_attese x Secondi_risparmiati - 40s_setup`):
- **`IGNORE` (`0 byte`)**: `< 3` occorrenze, `< 2` sessioni distinte, `T_saved < 120s` o flusso già coperto.
- **`RULE_OR_GUARD` (`L2a` / `L3`)**: vincolo o correzione ripetuta in `>= 2` sessioni -> regola in `rules/AGENTS.md` (`<= 6.000 B`) o guardia statica in `validate.mjs`.
- **`SKILL_EXTENSION` (`L2b + L3`)**: overlap parziale (`0.45..0.74`) o `>= 3` passaggi manuali eseguiti sistematicamente dopo una skill esistente -> estensione *in-place* della skill o nuovo script `scripts/`.
- **`NEW_SKILL` (`L2b Runbook On-Demand`)**: procedura sequenziale con `>= 3` occorrenze su `>= 2` sessioni e `T_saved >= 120s` -> nuova `skills/<slug>/SKILL.md` (`<= 200` righe).
- **`NEW_PLUGIN` (`Bundle Multi-Componente`)**: dominio autonomo con `>= 4` occorrenze su `>= 3` sessioni e `T_saved >= 240s` che richiede almeno 2 componenti tra regole, più skill, hook o script -> nuovo `plugins/<slug>/`.

## 4. Formato di Presentazione (0-Click + `<details>` 1-Click)
1. **Livello 0-Click (`<= 12` righe)**: esporre il numero di sessioni umane analizzate e al massimo i **top 3 candidati** ordinati per ROI indicando impronta, classificazione (`NEW_SKILL`, `SKILL_EXTENSION`, `NEW_PLUGIN`) e secondi risparmiati.
2. **Livello 1-Click (`<details>`)**: racchiudere la tabella completa a 4 colonne fisse (`# Pattern & Frequenza | Sequenza / Scheletro | Destinazione | ROI Netto`) e lo scaffold generato con `--scaffold <patternId>` dentro `<details><summary><strong> Analisi Pattern Ricorrenti, Matrice ROI e Bozza Scaffold (Espandi)</strong></summary>` lasciando una **riga vuota obbligatoria** dopo `</summary>`.

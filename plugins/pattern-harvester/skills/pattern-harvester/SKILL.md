---
name: pattern-harvester
description: >-
  Scansiona periodicamente le sessioni di lavoro e le interazioni utente-agente per rilevare pattern ricorrenti ad alto ROI e trasformarli in Skill, Regole o Plugin. Utilizza questa skill quando l'utente invoca /pattern-harvester.
---

# Pattern Harvester & Automation Advisor (`/pattern-harvester`)

Runbook operativo per analizzare le sessioni di lavoro reali (`transcript.jsonl`), individuare sequenze operative o interazioni manuali ripetute, filtrare le collisioni con il catalogo installato e generare lo scaffold di nuove **Skill (`L2b`)**, **Estensioni (`L3`)** o **Plugin**.

---

## Step 1 — Esecuzione dello Scanner Incrementale

1. Eseguire lo script CLI di analisi sulle conversazioni umane recenti (default: ultimi `14` giorni, fino a `40` sessioni umane, escludendo automaticamente i subagent allo step 0):
   ```powershell
   node c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/pattern-harvester.mjs
   ```
2. Per ottenere l'output strutturato JSON (utile per ispezionare metriche granulari o i pattern filtrati sotto soglia):
   ```powershell
   node c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/pattern-harvester.mjs --json
   ```

---

## Step 2 — Interpretazione della Matrice Decisionale ROI e Anti-Collisione

Consultare [`references/pattern-mining-methodology.md`](./references/pattern-mining-methodology.md) per le formule dettagliate. Ogni pattern rilevato nei 3 canali (`TOOL_CHAIN`, `CLI_SEQUENCE`, `INTERACTION_ARCHETYPE`) viene classificato in 5 esiti:

1. **`IGNORE`**: `< 3` occorrenze, `< 2` sessioni distinte, risparmio netto `< 120s` su 15 sessioni (dedotto il costo di setup `40s`) oppure overlap `>= 0.75` con una skill/plugin già installato.
2. **`RULE_OR_GUARD` (`L2a` / `L3`)**: correzione ripetuta su invarianti o stile in `>= 2` sessioni -> codificare come guardia statica in `scripts/validate.mjs` o regola in `rules/AGENTS.md`.
3. **`SKILL_EXTENSION` (`L2b + L3`)**: overlap `0.45..0.74` con una skill esistente oppure esecuzione sistematica di `>= 3` step manuali dopo l'invocazione della skill -> aggiornare la skill esistente o incapsulare gli step manuali in uno script `scripts/`.
4. **`NEW_SKILL` (`L2b`)**: procedura multi-step con `>= 3` occorrenze su `>= 2` sessioni e risparmio netto `>= 120s` -> creare una nuova `SKILL.md` (`<= 200` righe).
5. **`NEW_PLUGIN`**: dominio multi-componente con `>= 4` occorrenze su `>= 3` sessioni e risparmio netto `>= 240s` che richiede hook (`hooks.json`), regole permanenti e script dedicati.

---

## Step 3 — Generazione dello Scaffold Pre-Validato (`--scaffold`) o Silenziamento (`--dismiss`)

1. **Generazione Bozza Pronta all'Uso**:
   Per generare automaticamente i file conformi a `scripts/validate.mjs` (`description` YAML `80–250` caratteri con blocco `>-`, trigger `"Utilizza questa skill quando..."`, zero `: ` inline):
   ```powershell
   node c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/pattern-harvester.mjs --scaffold <patternId> --slug <nome-kebab-case>
   ```
2. **Silenziamento Pattern Non Desiderati (Cooldown 30 Giorni)**:
   Se l'utente decide di non automatizzare un pattern segnalato:
   ```powershell
   node c:/github/antigravity-plugins/plugins/pattern-harvester/scripts/pattern-harvester.mjs --dismiss <patternId>
   ```

---

## Step 4 — Presentazione in Chat e Sincronizzazione Catalogo

1. Mostrare in chiaro (**Livello 0-Click**, max `3–5` bullet) solo i candidati promossi con il relativo risparmio stimato in secondi.
2. Inserire nel cassetto `<details>` (**Livello 1-Click**, con riga vuota obbligatoria dopo `</summary>`) la tabella a 4 colonne fisse (`# Pattern & Frequenza | Sequenza / Scheletro | Destinazione | ROI Netto`) e la bozza dello scaffold.
3. Dopo la conferma utente e la scrittura dei file nel repository canonico `c:/github/antigravity-plugins`, eseguire sempre il ponte di verifica e sincronizzazione:
   ```powershell
   node c:/github/antigravity-plugins/plugins/proactive-mentorship/scripts/session-miner.mjs --verify-and-sync
   ```

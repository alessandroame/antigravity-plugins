# Standard di Qualità, Governance e Ottimizzazione delle Skill (`skill-governance`)

Definisce i principi di progettazione, economia dei token e univocità semantica per le skill in Antigravity.

## 1. Economia del System Prompt (`SKILL.md` Frontmatter)
Il frontmatter YAML (`name` e `description`) di ogni skill attiva viene iniettato nel system prompt di **ogni turno**:
1. **Lunghezza `description` (`80–250` caratteri)**: deve contare tra **80 e 250 caratteri** (`<= 45` token), senza elenchi né dettagli operativi. Archiviare fuori da `~/.gemini/config/skills/` le skill di domini inutilizzati.
2. **Sicurezza YAML Strict**: vietato usare `: ` in una `description` inline non quotata; usare il blocco folded `>-` o racchiudere tra virgolette.
3. **Trigger Direttivo Esplicito**: includere sempre *"Use this skill when..."*, *"Use this skill to..."* o *"Utilizza questa skill quando..."* indicando comandi slash, tool o file target.

## 2. Divulgazione Progressiva e Prevenzione Collisioni
1. **Corpo `SKILL.md` `<= 200` Righe**: strutturato come runbook sequenziale (Step 1..N); spostare schemi in `references/`, template in `examples/` e script in `scripts/`.
2. **Univocità `kebab-case` e Semantica**: evitare collisioni di `name` (shadowing silenzioso Workspace > Plugins > Global > Built-in) e trigger sovrapposti. Dichiarare output verificabile e timeout per comandi asincroni.

# Standard di Qualità, Governance e Ottimizzazione delle Skill

Questo documento definisce i principi di progettazione, economia dei token e univocità semantica per le skill in Antigravity.

---

## 1. Economia del System Prompt e Regole di Trigger (`SKILL.md` Frontmatter)

Il frontmatter YAML (`name` e `description`) di ogni skill attiva viene iniettato nel system prompt di **ogni turno**:
1. **Lunghezza della `description` (`80–250` caratteri)**:
   - La `description` deve contare tra **80 e 250 caratteri** ($\le 45\text{ token}$), senza elenchi né dettagli operativi che appartengono al corpo del file.
   - **Sicurezza YAML Strict**: non usare mai i due punti seguiti da spazio (`: `) in una `description` inline non quotata (altrimenti il parser YAML di Antigravity scarta silenziosamente la skill); usare il blocco folded `>-` o racchiudere tra virgolette.
2. **Formulazione Direttiva dei Trigger**:
   - Includere sempre la formula condizionale esplicita *"Use this skill when..."* / *"Use this skill to..."* oppure *"Utilizza questa skill quando..."*, specificando i contesti di attivazione (comandi slash, tool o file target).
   - Evitare trigger generici ("aiuta con il codice", "ottimizza file") che generano falsi positivi.

---

## 2. Architettura a Divulgazione Progressiva (Corpo $\le 200\text{ Righe}$)

Il corpo di `SKILL.md` viene letto on-demand tramite `view_file` solo all'attivazione:
1. **Taglia Massima di `SKILL.md`**: massimo **150–200 righe**, strutturato come runbook sequenziale (Step 1, Step 2, Step 3) con comandi e guardie di verifica.
2. **Estrazione di Asset Ausiliari**: spostare schemi/teoria in `references/`, template in `examples/` e script eseguibili in `scripts/`, richiamandoli per percorso relativo.

---

## 3. Prevenzione Collisioni, Shadowing e Determinismo

1. **Univocità Globale del Nome (`kebab-case`)**: due skill con lo stesso `name` attivano lo shadowing silenzioso (Workspace $>$ Plugins $>$ Global $>$ Built-in).
2. **Univocità Semantica**: evitare più skill con trigger sovrapposti sullo stesso intento operativo; fondere o specializzare i trigger.
3. **Check di Verifica e Guardia Anti-Deadlock**: dichiarare prerequisiti, output atteso verificabile e timeout espliciti per comandi asincroni.

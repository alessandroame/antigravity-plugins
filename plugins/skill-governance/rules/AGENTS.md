# Standard di Qualità, Governance e Ottimizzazione delle Skill

Questo documento definisce i principi di progettazione, economia dei token e univocità semantica per la creazione e manutenzione delle skill in Antigravity.

---

## 1. Economia del System Prompt e Regole di Trigger

In Antigravity, il frontmatter YAML di ogni skill attiva (`name` e `description`) viene iniettato nel system prompt di **ogni singolo turno** di conversazione:

1. **Vincolo di Lunghezza sulla `description`**:
   - La `description` deve avere una lunghezza compresa tra **80 e 250 caratteri** (massimo 40-50 token).
   - È vietato inserire nel frontmatter spiegazioni teoriche, elenchi puntati o la sintesi dell'intero workflow: questi dettagli appartengono al corpo del file.
2. **Formulazione Direttiva dei Trigger**:
   - La `description` deve dichiarare esplicitamente i casi d'uso con frasi condizionali chiare:
     - *"Use this skill when..."* oppure *"Utilizza questa skill quando..."*
   - Includere sia le azioni primarie sia i contesti di attivazione (es. nomi di tool, slash command o file tipici).
3. **Divieto di Trigger Troppo Generici**:
   - Evitare parole chiave onnicomprensive (es. "aiuta con il codice", "ottimizza file") che provocherebbero falsi positivi e attivazioni involontarie.

---

## 2. Architettura a Divulgazione Progressiva (Progressive Disclosure)

Il corpo del file `SKILL.md` viene letto on-demand dall'agente tramite `view_file` solo al momento dell'attivazione:

1. **Taglia Massima di `SKILL.md`**:
   - Il file principale non deve superare le **150–200 righe**.
   - Deve funzionare come runbook operativo: passaggi sequenziali ordinati (Step 1, Step 2, Step 3), comandi precisi e guardie di controllo.
2. **Estrazione di Asset Ausiliari**:
   - **Cataloghi, schemi e teoria** $\to$ estrarre nella sottocartella `references/` (es. `references/schema.json`, `references/theory.md`).
   - **Template di codice ed esempi d'uso** $\to$ estrarre nella sottocartella `examples/` (es. `examples/before-after.md`).
   - **Script riutilizzabili** $\to$ estrarre nella sottocartella `scripts/` (es. `scripts/helper.mjs`).
   - In `SKILL.md`, indicare all'agente di consultare i file ausiliari tramite percorsi relativi solo quando strettamente necessario.

---

## 3. Prevenzione Collisioni e Shadowing

1. **Univocità Globale del Nome**:
   - Il campo `name` deve essere univoco nell'intero ambiente in `kebab-case`.
   - Se due skill hanno lo stesso nome, Antigravity applica la gerarchia di precedenza (Workspace $>$ Plugins dichiarati $>$ Global $>$ Built-in) scartando silenziosamente la skill a priorità inferiore.
2. **Univocità Semantica del Dominio**:
   - Prima di creare una nuova skill, verificare che non esista già una procedura con lo stesso obiettivo in un plugin collegato o nella cartella `.agents/skills/`.
   - In caso di sovrapposizione parziale, preferire l'estensione della skill esistente o la modularizzazione tramite parametri anziché duplicare il componente.

---

## 4. Determinismo, Tool Coupling e Punti di Verifica

1. **Dichiarazione Pre-requisiti e Tool Necessari**:
   - Ogni skill deve dichiarare esplicitamente i comandi CLI o i tool integrati richiesti (es. `node >= 18`, `git`, server MCP specifici).
2. **Check di Verifica Obbligatori (Expected Output)**:
   - Al termine di ogni azione critica (build, test, migrazione dati), la skill deve prescrivere una verifica deterministica dell'output (es. codice di uscita, presenza del file generato, assenza di warning).
3. **Guardia Anti-Deadlock**:
   - Per comandi lenti o asincroni, prescrivere timeout e controlli di stato espliciti, evitando loop di polling aperti.

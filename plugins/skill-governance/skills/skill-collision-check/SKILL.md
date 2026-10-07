---
name: skill-collision-check
description: Rileva collisioni di nome, shadowing prioritario e duplicati semantici tra skill in workspace, plugin, configurazione globale e builtin.
---

# Procedura di Rilevamento Collisioni e Duplicati tra Skill

Questa skill analizza l'intero panorama di personalizzazioni attive per identificare omonimie, oscuramenti prioritari (shadowing) e sovrapposizioni concettuali che compromettono la prevedibilità del comportamento dell'agente.

---

## 1. Mappatura delle Sorgenti di Skill

Identificare tutte le directory di skill presenti nei livelli di configurazione di Antigravity:

1. **Livello 1: Workspace di Progetto (Priorità Massima)**:
   - `<repository-root>/.agents/skills/`
   - `<repository-root>/.agents/plugins/*/skills/`
2. **Livello 2: Configurazione Globale Macchina**:
   - `~/.gemini/config/skills/`
   - `~/.gemini/config/plugins/*/skills/`
3. **Livello 3: Skill Integrate di Sistema (Built-in)**:
   - Identificate dai riferimenti al percorso di sistema `/builtin/skills/`.

---

## 2. Tipologie di Anomalie da Rilevare

### Anomalia 1: Omonimia Diretta e Shadowing Silente (P0)
- **Definizione**: Due cartelle di skill diverse condividono lo stesso identico valore nel campo `name` del frontmatter YAML.
- **Impatto**: In Antigravity, il livello gerarchicamente superiore (es. Workspace) sovrascrive totalmente la skill globale o integrata con lo stesso nome, senza emettere warning. La versione a priorità inferiore non sarà mai invocata.
- **Risoluzione**: Rinominare la skill secondaria in `kebab-case` esplicitando il contesto (es. `custom-git-log` invece di `git-log`).

### Anomalia 2: Duplicati Semantici e Concorrenza di Trigger (P1)
- **Definizione**: Due skill con nomi diversi contengono trigger o descrizioni che intercettano lo stesso intento operativo (es. una skill `code-review` e una skill `pr-audit` che si attivano entrambe su "fai la review di questo codice").
- **Impatto**: Comportamento non-deterministico. L'LLM può alternare casualmente l'attivazione tra le due skill o invocare quella meno aggiornata.
- **Risoluzione**:
  - **Fusione (Merge)**: Unificare le due skill in una procedura modulare.
  - **Specializzazione**: Riscrivere le rispettive `description` specificando condizioni mutualmente esclusive.

### Anomalia 3: Contrasti Normativi e Incompatibilità (P1)
- **Definizione**: Le istruzioni operative di una skill prescrivono convenzioni o strumenti contrari a quelli di un'altra skill attiva contemporaneamente (es. una skill impone `npm` e l'altra impone `pnpm`).
- **Risoluzione**: Allineare gli standard al playbook di progetto o definire guardie di compatibilità condizionali.

### Anomalia 4: Skill Orfane o Puntamento Invalido (P2)
- **Definizione**: File `SKILL.md` che contengono comandi o script di supporto che non esistono sul disco o puntano a percorsi assoluti hardcoded riferiti ad altre macchine.
- **Risoluzione**: Convertire i percorsi assoluti in percorsi relativi al repository.

---

## 3. Flusso Operativo di Ispezione

1. **Scansione**: Censire tutte le sottocartelle contenenti un file `SKILL.md`.
2. **Estrazione Metadati**:
   - Estrarre `name` e `description` dal frontmatter YAML.
   - Tracciare il percorso assoluto e il livello gerarchico (Workspace vs Globale).
3. **Verifica Collisioni**:
   - Confrontare i valori di `name` in una mappa per rilevare collisioni esatte.
   - Confrontare i token chiave delle descrizioni per rilevare cluster semantici sovrapposti.
4. **Ispezione Script & Tool**:
   - Verificare che eventuali file referenziati nei comandi esistano su disco.

---

## 4. Report di Conflitto e Matrice di Risoluzione

Restituire all'utente una matrice strutturata:

| Skill A (Percorso) | Skill B (Percorso) | Tipo Conflitto | Gravità | Azione Risolutiva Consigliata |
| :--- | :--- | :--- | :---: | :--- |
| `plugins/foo/skills/x` | `plugins/bar/skills/x` | Omonimia (Shadowing) | **P0** | Rinomina una delle due skill |
| `skills/check-code` | `skills/lint-audit` | Concorrenza Semantica | **P1** | Fondi o specializza i trigger |

Attendere la conferma dell'utente prima di applicare modifiche strutturali ai file del repository.

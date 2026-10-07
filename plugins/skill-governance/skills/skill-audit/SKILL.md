---
name: skill-audit
description: Conduce un audit analitico di una o più skill: verifica chiarezza dei trigger, conformità del frontmatter, budget token, determinismo e accoppiamento con i tool.
---

# Procedura di Audit Euristico e Strutturale delle Skill

Questa skill analizza una skill specifica o un gruppo di skill per valutarne la qualità, l'efficienza nel consumo di token e l'affidabilità di esecuzione.

---

## 1. Risoluzione della Skill Target

Identificare il percorso assoluto della cartella della skill da sottoporre ad audit:
- Skill locale di progetto: `<target>/.agents/skills/<nome-skill>/SKILL.md`
- Skill di un plugin: `<target>/plugins/<nome-plugin>/skills/<nome-skill>/SKILL.md`
- Skill globale: `~/.gemini/config/skills/<nome-skill>/SKILL.md`

Leggere il file `SKILL.md` utilizzando `view_file`.

---

## 2. Matrice di Controllo Dimensionale

Analizzare la skill su 5 dimensioni critiche:

### Dimensione A: Qualità del Trigger & Economia del System Prompt
- [ ] **Presenza Frontmatter**: I delimitatori `---` racchiudono sia `name` che `description`.
- [ ] **Formato `name`**: Stringa in `kebab-case` minuscolo senza spazi o caratteri speciali.
- [ ] **Budget Caratteri**: La `description` misura tra 80 e 250 caratteri.
  - *Allarme*: Se $> 300$ caratteri, consuma token non necessari in ogni turno della sessione.
- [ ] **Clausola Condizionale**: Contiene formule esplicite ("*Use this skill when...*", "*Attiva questa skill quando...*").
- [ ] **Rischio Over-triggering**: La descrizione evita termini eccessivamente generici che causano attivazioni accidentali.

### Dimensione B: Architettura e Divulgazione Progressiva
- [ ] **Taglia del file `SKILL.md`**: Il file principale contiene meno di 200 righe.
- [ ] **Scomposizione Modulare**: Schemi JSON complessi, tabelle estese o esempi prolissi sono delegati a file ausiliari nelle cartelle `references/` o `examples/`.
- [ ] **Nessun Dead Code**: I riferimenti a file esterni puntano a percorsi effettivamente esistenti.

### Dimensione C: Determinismo della Procedura Operativa
- [ ] **Sequenza Ordinata**: I passaggi sono strutturati in Step numerati (`Step 1`, `Step 2`, ...).
- [ ] **Comandi Riproducibili**: I comandi di terminale indicano chiaramente cartella di lavoro (`Cwd`) e parametri.
- [ ] **Istruzioni Concrete**: Si forniscono istruzioni dirette anziché considerazioni teoriche generiche.

### Dimensione D: Tool Coupling & Pre-requisiti
- [ ] **Dichiarazione Dipendenze**: Dipendenze CLI esterne (es. `git`, `node`, `curl`, `jq`, `docker`) sono esplicitate nei pre-requisiti.
- [ ] **Server MCP**: Se la skill sfrutta tool MCP, il server MCP corrispondente è documentato o dichiarato nel plugin.

### Dimensione E: Verificabilità dei Risultati (Verification Checkpoints)
- [ ] **Expected Output**: I passaggi critici contengono criteri di verifica del successo (es. output atteso, codici di errore, file generati).
- [ ] **Resilienza**: Sono indicate le azioni correttive in caso di fallimento di uno step.

---

## 3. Calcolo del Punteggio di Qualità

Assegnare un punteggio sintetico in base alle non-conformità riscontrate:
- **Grado A (Eccellente)**: 0 rilievi critici, description compatta, divulgazione progressiva rispettata.
- **Grado B (Buono)**: Piccole ridondanze nella description o file tra 200 e 300 righe, passaggi chiari.
- **Grado C (Migliorabile)**: Description prolissa (>300 caratteri) o assenza di clausole condizionali; file tra 300 e 500 righe.
- **Grado D/F (Critico)**: Skill monolitica (>500 righe), assenza di passaggi di verifica, collisione evidente di trigger.

---

## 4. Output del Report di Audit

Fornire all'utente un report strutturato con:
1. **Scheda Riepilogativa**: Nome skill, percorso, conteggio righe, caratteri description, grado assegnato.
2. **Evidenze e Anomalie Rilevate**: Elenco puntato ordinato per gravità (P0: bloccante/spreco grave, P1: miglioramento strutturale, P2: rifinitura stilistica).
3. **Piano di Rimedio Proposto**: Proposta concreta di riscrittura della `description` e piano di modularizzazione.

# Antigravity Plugin: Skill Governance

Plugin per la governance, l'efficienza dei token e il controllo della qualità delle skill in **Google Antigravity**. Introduce protocolli di audit per i trigger, linee guida per l'architettura a divulgazione progressiva e procedure di risoluzione dei conflitti e dello shadowing tra personalizzazioni.

---

## Componenti Inclusi

| Componente | Tipo | Scopo e Funzionalità |
| :--- | :--- | :--- |
| **`rules/AGENTS.md`** | Regola | Standard obbligatori per la scrittura di skill: vincoli di lunghezza della description, soglia di righe per `SKILL.md` e divieto di ambiguità nei trigger. |
| **`skill-audit`** | Skill | Esegue un audit dimensionale (A-E) su trigger, frontmatter, taglia file, tool coupling e verificabilità con attribuzione di voto e priorità di intervento (P0-P2). |
| **`skill-token-optimizer`** | Skill | Guida alla rifattorizzazione pratica di skill monolitiche: condensazione della description per il system prompt e scorporo in `references/` ed `examples/`. |
| **`skill-collision-check`** | Skill | Mappatura gerarchica delle fonti (workspace, plugin, global, builtin) per rilevare omonimie (shadowing) e duplicati semantici. |
| **`references/`** | Riferimento | Specifiche architetturali sul modello di caricamento a due fasi e tabella metrica di benchmark. |
| **`examples/`** | Esempio | Caso studio Before vs After di rifattorizzazione modulare di una skill complessa. |

---

## Architettura e Modello dei Token

Antigravity carica le skill in due fasi distinte:

1. **Fase Globale (System Prompt)**: I campi `name` e `description` di **tutte le skill abilitate** risiedono stabilmente nel contesto di ogni turno.
   - *Target*: `description` compressa tra 80 e 250 caratteri con trigger condizionale esplicito (*"Use this skill when..."*).
2. **Fase Esecutiva (On-Demand)**: Il corpo di `SKILL.md` viene caricato solo all'effettiva attivazione.
   - *Target*: `SKILL.md` snello ($\le 150-200$ righe) che funge da runbook; tabelle e template delegati a cartelle ausiliarie.

---

## Modalità di Installazione

### 1. Nel Workspace di Progetto (Consigliata)
Copiare la cartella in `.agents/plugins/`:

```powershell
# Windows PowerShell
Copy-Item -Recurse plugins/skill-governance "<percorso-repo>\.agents\plugins\"
```

Oppure creare una Directory Junction su Windows:
```powershell
New-Item -ItemType Junction -Path "<percorso-repo>\.agents\plugins\skill-governance" -Target "c:\github\antigravity-plugins\plugins\skill-governance"
```

### 2. A Livello Globale (Tutti i progetti)
```powershell
Copy-Item -Recurse plugins/skill-governance "$env:USERPROFILE\.gemini\config\plugins\"
```

---

## Prompt di Avvio Rapido

- *"Esegui un audit completo di questa skill analizzando trigger e impronta token"*
- *"Rifattorizza questa skill monolitica applicando la divulgazione progressiva"*
- *"Verifica eventuali collisioni o duplicati tra le skill installate"*

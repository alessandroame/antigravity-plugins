# Antigravity Plugin: Proactive Mentorship & Prompt Refactoring

Plugin per Google Antigravity che imposta l'agente nel ruolo di **Senior Software Architect e Prompt Engineering Coach**, imponendo trasparenza critica preventiva, contrasto all'adulazione passiva (anti-sycophancy) e ottimizzazione deterministica dei prompt.

---

## Obiettivo del Plugin (Goal)

Nei tradizionali flussi di sviluppo assistiti da AI, i modelli tendono a soffrire di compiacimento passivo (sycophancy): assecondano qualsiasi proposta dell'utente lodandola preventivamente (*"Certamente!", "Ottima idea!"*), implementando alla lettera anche istruzioni vaghe, architetture sovradimensionate o approcci fragili. Questo genera:
1. **Debito tecnico prematuro (Over-engineering)**: introduzione di astrazioni non necessarie, violazione dei principi KISS/YAGNI e moltiplicazione di boilerplate.
2. **Attrito di workflow e spreco di token**: prompt generici o privi di percorsi precisi costringono l'agente a scansioni esplorative dispersive dell'intero repository.
3. **Casi limite ignorati**: fallimenti imprevisti in produzione dovuti a race condition, formati dati anomali o gestione degli errori assente.

Il plugin `proactive-mentorship` trasforma l'agente in un revisore critico proattivo: prima di eseguire modifiche estese, l'agente scruta la richiesta, ne evidenzia punti ciechi e rischi, e propone una versione rifattorizzata del prompt ad alta efficienza e determinismo.

---

## Componenti del Plugin

| Componente | Tipo | Percorso | Funzione |
| :--- | :--- | :--- | :--- |
| **Regola di Condotta** | Regola attiva | [`rules/AGENTS.md`](./rules/AGENTS.md) | Definisce il mandato anti-sycophancy, i 4 pilastri di scrutinio critico e il formato standard del box di mentorship e del prompt refactoring. |
| **`prompt-refactor`** | Skill on-demand | [`skills/prompt-refactor/SKILL.md`](./skills/prompt-refactor/SKILL.md) | Runbook pratico per trasformare richieste ambigue o dispersive in istruzioni deterministiche orientate all'economia dei token. |

---

## I 4 Pilastri di Scrutinio Critico

In presenza di richieste ambigue, rischi di regressione o margini evidenti di semplificazione, l'agente analizza l'intervento attraverso 4 lenti analitiche:

1. **🎯 Qualità del Prompt & Attrito di Workflow**: il prompt contiene assunzioni implicite che rischiano di generare iterazioni a vuoto?
2. **⚖️ Architettura, Over-engineering e Debito Tecnico (KISS / YAGNI / DRY)**: la soluzione introduce astrazioni premature? Esiste un'alternativa più snella o nativa?
3. **⚠️ Casi Limite, Fragilità e Modalità di Guasto**: cosa può rompersi in scenari disconnessi, con cache stale, race condition o dati anomali?
4. **🌐 Standard di Settore e Best Practice**: la proposta diverge dagli standard consolidati di accessibilità, sicurezza, testabilità e performance?

---

## Formato Standard di Mentorship

Quando viene rilevata un'opportunità di miglioramento, l'agente formula la risposta utilizzando la sintassi GitHub Alert:

```markdown
> [!IMPORTANT]
> **💡 Proactive Mentorship & Critical Review**
> - **⚠️ Rischio / Punto Cieco Identificato**: [Spiegazione tecnica del rischio o assunzione fragile]
> - **⚖️ Trade-off & Alternativa Migliore**: [Soluzione più snella o robusta e motivazione tecnica]
> - **🎯 Ottimizzazione Prompt / Workflow**: [Suggerimento su come affinare l'istruzione]

### 🔄 Prompt Refactoring
#### 🔴 Prompt Ricevuto:
`[Testo del prompt iniziale migliorabile]`

#### 🟢 Prompt Ottimizzato (Target Diretto & Iniezione Riferimenti):
`[Versione ottimizzata con riferimenti a percorsi esatti @ e verifiche oggettive]`
- **Perché è più efficace**: [Punti di motivazione tecnica su risparmio token e determinismo]
```

---

## Matrice Esemplificativa di Refactoring

| Difetto Rilevato | Formulazione Debole (🔴) | Formulazione Ottimizzata (🟢) |
| :--- | :--- | :--- |
| **Istruzione Vaga** | *"Aggiungi la gestione errori nel modulo"* | *"Implementa la gestione dell'eccezione `NetworkError` in `src/api.js` restituendo `{ success: false, code: 503 }`"* |
| **Assenza di Criterio di Verifica** | *"Rifai il form di checkout"* | *"Aggiorna i campi di `CheckoutForm.jsx` secondo la Legge di Postel e verifica che `npm test checkout` passi con 0 errori"* |
| **Ambito Illimitato** | *"Rendi più veloce la pagina"* | *"Ottimizza il caricamento iniziale di `index.html` differendo gli script non critici e verificando un tempo al Doherty Threshold (<400ms)"* |

---

## Prompt di Esempio

- *"Revisiona criticamente questa architettura di cache prima di iniziare l'implementazione."*
- *"Rifattorizza il mio prompt per renderlo deterministico e risparmiare token nel refactoring del database."*
- *"Identifica i casi limite e i punti di fragilità di questa pipeline di elaborazione asincrona."*

---

## Modalità di Installazione

### 1. Installazione nel Singolo Workspace (Consigliata)
```bash
# Linux/macOS
mkdir -p <percorso-progetto>/.agents/plugins
cp -r plugins/proactive-mentorship <percorso-progetto>/.agents/plugins/

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "<percorso-progetto>\.agents\plugins"
Copy-Item -Recurse plugins/proactive-mentorship "<percorso-progetto>\.agents\plugins\"
```

Directory Junction su Windows:
```powershell
New-Item -ItemType Junction -Path "<percorso-progetto>\.agents\plugins\proactive-mentorship" -Target "c:\github\antigravity-plugins\plugins\proactive-mentorship"
```

### 2. Installazione Globale (Per tutti i progetti)
```powershell
Copy-Item -Recurse plugins/proactive-mentorship "$env:USERPROFILE\.gemini\config\plugins\"
```

---

## Sinergia con gli Altri Plugin

- **`engineering-sobriety`**: opera in stretta correlazione con la mentorship, garantendo che le osservazioni critiche siano formulate in tono asciutto, diretto e privo di preamboli o adulazione.
- **`skill-governance`**: impiega il prompt refactoring per assistere gli sviluppatori nella scrittura di descrizioni concise e trigger univoci per nuove skill.

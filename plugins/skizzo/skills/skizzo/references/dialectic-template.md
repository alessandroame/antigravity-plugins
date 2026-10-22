# Template di Riferimento Multi-Dominio Dinamico, Auto-Triage & Mediatore (`/skizzo`)

Questo documento fornisce i template di riferimento per il **Banner Esplicito Modalità Skizzo (`[!IMPORTANT]` e `[!NOTE] FAST-PASS`)**, la **Matrice Multi-Dominio Ordinata per Importanza a 4 Colonne Fisse (`2..4` Agenti)**, il **Mediatore Interattivo (`/skizzo --mediator`)** e la variante di prototipazione parallela su Git Worktree (`/skizzo --proto`).

---

## 1. Template di Risposta per Attivazione / Disattivazione Toggle (`/skizzo`)

### Passaggio a `ON` Standard (`/skizzo` o `/skizzo on`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`MULTI-DOMINIO DINAMICO`)** — Persistente per tutta la sessione fino a `/skizzo stop` o `"stop skizzo"` | Titolo: `[SKIZZO]`

- **Scoperta e Ranking dei Domini via LLM (`2..4` Agenti)**: sulle scelte progettuali o multi-prospettiva, l'LLM individua i domini coinvolti, li ordina per importanza e istanzia da `2` a `4` subagent su misura (`Alpha`, `Beta`, `Delta`, `Epsilon`).
- **Risposta Rapida sulle Modifiche Dirette (`FAST-PASS`, ~90s risparmiati)**: per piccole correzioni, comandi operativi o domande di sola lettura ti risponde subito senza farti aspettare i subagent, restando attiva per i messaggi successivi (scrivi `"forza skizzo"` o `/skizzo --force` per forzare gli agenti).
- **Persistenza Automatica & Stop**: non serve riscrivere `/skizzo` nei prossimi messaggi; la modalità resta attiva fino a fine chat o finché non scrivi `/skizzo stop`, `/skizzo off` o `"stop skizzo"`.

Quale funzionalità o problema vuoi affrontare?
```

### Passaggio a `ON` con Mediatore Interattivo (`/skizzo --mediator` o `/skizzo -m`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`MULTI-DOMINIO + MEDIATORE`)** — Persistente per tutta la sessione fino a `/skizzo stop` o `"stop skizzo"` | Titolo: `[SKIZZO+MED]`

- **Lavoro Parallelo Indipendente (`2..4` Domini)**: l'LLM individua i domini più importanti e li fa lavorare in parallelo senza influenzarsi a vicenda, mentre sui comandi diretti risponde subito in modalità rapida (`FAST-PASS`).
- **Mediatore Interattivo (`Gamma`)**: un agente arbitro indipendente esamina i punti di disaccordo tra i domini, li interroga tramite `send_message` (max 1 round) ed emette il lodo arbitrale.

Quale requisito vuoi sottoporre ai domini con il Mediatore?
```

### Passaggio a `OFF` (`/skizzo stop`, `/skizzo off`, `stop skizzo` o `/skizzo`)
```markdown
**[SKIZZO: OFF]** — Modalità multi-dominio fermata (`SKIZZO = OFF`, `MEDIATOR = OFF`). Il flusso torna all'esecuzione normale e il prefisso `[SKIZZO]` / `[SKIZZO+MED]` è stato rimosso dal titolo della conversazione.
```

---

## 2. Template per Risposta Rapida `FAST-PASS` (Gate 0: `0` Subagent, ~90–120s risparmiati)

Quando `SKIZZO = ON` ma il Gate 0 rileva un comando operativo, una domanda di sola lettura o una micro-correzione puntuale (o l'utente usa `--skip`):

```markdown
> [!NOTE]
> **MODALITÀ SKIZZO ATTIVA (`FAST-PASS` — Risposta rapida per modifica puntuale / comando operativo, ~90s risparmiati)** · Resta attiva per i prossimi messaggi · Scrivi `"forza skizzo"` (o `/skizzo --force`) per forzare gli agenti.

[Risposta diretta ed esecuzione immediata del task senza attendere subagent.]
```

---

## 3. Template Completo di Consegna Task "Human-First" (`DUAL/TRI/QUAD-TRACK` + `<details>` a 4 Colonne)

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK` | `TRI-TRACK` | `QUAD-TRACK` — `N` Domini per Importanza)** — Subagent: [`1° <Ruolo Alpha>`](conversation://<id-alpha>) · [`2° <Ruolo Beta>`](conversation://<id-beta>) [· [`3° <Ruolo Delta>`](conversation://<id-delta>) · [`4° <Ruolo Epsilon>`](conversation://<id-epsilon>)]

[1-2 frasi semplici in italiano quotidiano sul risultato concreto.]

- **Cosa cambia per te**: [1 riga concreta in italiano semplice sul miglioramento pratico].
- **Contributo dei domini attivati (in ordine di importanza)**: [1 riga sintetica su cosa ha garantito ciascuno dei 2..4 ruoli istanziati].
- **Conflitto risolto tra i ruoli (e perché vince questa sintesi)**: [1 riga sul compromesso superato] — **Controlli**: `Tutti i test/oracoli superati (X/X OK)`.

<details>
<summary><strong>Dettagli Tecnici, Matrice Multi-Dominio Ordinata per Importanza e Verifiche</strong></summary>

| # Dominio (Per Importanza) | Skill & Mandato | Proposta Chiave | Oracolo & Esito |
| :--- | :--- | :--- | :--- |
| **1° `<Ruolo Alpha>`** | `<skills-alpha>` — [Mandato] | [Proposta Alpha] | `PASS` — [Oracolo Alpha] |
| **2° `<Ruolo Beta>`** | `<skills-beta>` — [Mandato] | [Proposta Beta] | `PASS` — [Oracolo Beta] |
| **[3° `<Ruolo Delta>`]** | `<skills-delta>` — [Mandato] | [Proposta Delta] | `PASS` — [Oracolo Delta] |
| **[4° `<Ruolo Epsilon>`]** | `<skills-epsilon>` — [Mandato] | [Proposta Epsilon] | `PASS` — [Oracolo Epsilon] |

- **Sintesi Unificata & Criterio di Priorità (`Max 4`)**: [Come sono state fuse le proposte e motivazione dell'ordinamento ed eventuali domini secondari accorpati/esclusi].
- **Dietro le quinte (Cross-Critique / Negoziazione `Gamma`)**: [Sintesi dei punti di attrito risolti].
- **Verifiche & File Aggiornati**: `Oracolo Alpha: PASS` | `Oracolo Beta: PASS` — [File e metriche].

</details>
```

---

## 4. Variante `/skizzo --proto` (Prototipi Paralleli in Git Worktrees Isolati — `worktree-lifecycle`)

Quando l'utente richiede di confrontare empiricamente implementazioni complete (`/skizzo --proto`):

1. **Pre-flight Guard & Setup Worktrees (`worktree-lifecycle`)**:
   ```powershell
   git status --porcelain
   git worktree add ../<repo>-skizzo-alpha -b skizzo/alpha-track
   git worktree add ../<repo>-skizzo-beta -b skizzo/beta-track
   ```
2. **Esecuzione Parallela (`invoke_subagent`)**: ciascun subagent (`TypeName: "self"`, `Workspace: "share"`) opera esclusivamente nel proprio worktree isolato.
3. **Tabella Comparativa Empirica e Teardown Pulito**:
   ```powershell
   git worktree remove ../<repo>-skizzo-alpha
   git worktree remove ../<repo>-skizzo-beta
   git branch -D skizzo/alpha-track skizzo/beta-track
   ```

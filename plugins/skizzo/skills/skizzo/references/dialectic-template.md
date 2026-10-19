# Template di Riferimento Dialettico, Auto-Triage & Mediatore (`/skizzo`)

Questo documento fornisce i template estesi di riferimento per il **Banner Esplicito Modalità Skizzo (`[!IMPORTANT]` e `[!NOTE] FAST-PASS`)**, la **Matrice Dialettica**, il **Mediatore Interattivo (`/skizzo --mediator`)** e la variante di prototipazione parallela su Git Worktree (`/skizzo --proto`).

---

## 1. Template di Risposta per Attivazione / Disattivazione Toggle (`/skizzo`)

### Passaggio a `ON` Standard (`/skizzo` o `/skizzo on`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`AUTO-SMART`)** — Persistente per tutta la sessione fino a `/skizzo stop` o `"stop skizzo"` | Titolo: `[SKIZZO]`

- **Doppio Agente sulle Scelte di Progetto (`DUAL-TRACK`)**: quando chiedi una nuova funzione, un piano o una modifica con più opzioni, l'`Agente Tecnico (Alpha)` e l'`Agente Utente (Beta)` lavorano in parallelo per unire solidità del codice e comodità d'uso.
- **Risposta Rapida sulle Modifiche Dirette (`FAST-PASS`, ~90s risparmiati)**: per piccole correzioni, comandi operativi o domande di sola lettura ti risponde subito senza farti aspettare i 2 agenti, restando comunque attiva per i messaggi successivi (usa `/skizzo --force` se vuoi forzare i 2 agenti).
- **Persistenza Automatica & Stop**: non serve riscrivere `/skizzo` nei prossimi messaggi; la modalità resta attiva fino a fine chat o finché non scrivi `/skizzo stop`, `/skizzo off` o `"stop skizzo"`.

Quale funzionalità o problema vuoi affrontare?
```

### Passaggio a `ON` con Mediatore Interattivo (`/skizzo --mediator` o `/skizzo -m`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`AUTO-SMART + MEDIATORE`)** — Persistente per tutta la sessione fino a `/skizzo stop` o `"stop skizzo"` | Titolo: `[SKIZZO+MED]`

- **Lavoro Parallelo Indipendente (`Alpha` vs `Beta`)**: sulle scelte di progetto l'`Agente Tecnico (Alpha)` e l'`Agente Utente (Beta)` progettano la soluzione senza influenzarsi a vicenda, mentre sui comandi diretti risponde subito in modalità rapida (`FAST-PASS`).
- **Mediatore Interattivo (`Gamma`)**: un terzo agente indipendente esamina i punti in cui `Alpha` e `Beta` non sono d'accordo, li interroga tramite `send_message` (max 1 round) e sceglie la soluzione migliore.

Quale funzionalità o problema vuoi sottoporre ai due agenti con il Mediatore?
```

### Passaggio a `OFF` (`/skizzo stop`, `/skizzo off`, `stop skizzo` o `/skizzo`)
```markdown
**[SKIZZO: OFF]** — Modalità a doppio agente fermata (`SKIZZO = OFF`, `MEDIATOR = OFF`). Il flusso torna all'esecuzione normale e il prefisso `[SKIZZO]` / `[SKIZZO+MED]` è stato rimosso dal titolo della conversazione.
```

---

## 2. Template per Risposta Rapida `FAST-PASS` (Gate 0: `0` Subagent, ~90–120s risparmiati)

Quando `SKIZZO = ON` ma il Gate 0 rileva un comando operativo, una domanda di sola lettura o una micro-correzione puntuale (o l'utente usa `--skip`):

```markdown
> [!NOTE]
> **MODALITÀ SKIZZO ATTIVA (`FAST-PASS` — Risposta rapida per modifica puntuale / comando operativo, ~90s risparmiati)** · Resta attiva per i prossimi messaggi · Usa `/skizzo --force` se vuoi comunque i 2 agenti.

[Risposta diretta ed esecuzione immediata del task senza attendere subagent.]
```

---

## 3. Template Completo di Consegna Task "Human-First" (`DUAL-TRACK` + `<details>` Tecnico)

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK + MEDIATORE`)** — Subagent: [`Agente Tecnico (Alpha)`](conversation://<id-alpha>) (Skill: `shift-left-governance`, `trace-debugging`) · [`Agente Utente (Beta)`](conversation://<id-beta>) (Skill: `laws-of-ux-audit`, `ux-form-optimization`) · [`Mediatore (Gamma)`](conversation://<id-gamma>)

Aggiornato `[simbolo/modulo](file:///percorso/file.ext#L1-L50)` unendo la comodità d'uso richiesta dall'`Agente Utente (Beta)` con le protezioni dai blocchi progettate dall'`Agente Tecnico (Alpha)`.

- **Cosa cambia per te**: [1 riga concreta in italiano semplice su cosa fa ora il programma o quale miglioramento vedi subito].
- **Comodità difesa dall'Agente Utente (Beta)**: [1 riga su quale fatica, configurazione manuale o passaggio inutile ti è stato risparmiato].
- **Problema evitato dall'Agente Tecnico (Alpha)**: [1 riga su quale errore nascosto, rallentamento o caso limite è stato intercettato e risolto dietro le quinte].
- **Su cosa non erano d'accordo (e perché vince questa soluzione)**: [1 riga sul conflitto pratico tra Alpha e Beta e come è stato risolto] — **Controlli**: `Tutti i test superati (N/N OK)`.

<details>
<summary><strong>Dettagli Tecnici, Confronto tra gli Agenti e File Modificati</strong></summary>

| Punto Discusso | Proposta Tecnica (Alpha) | Proposta Lato Utente (Beta) | Scelta Finale (Perché è migliore) |
| :--- | :--- | :--- | :--- |
| **Skill Attive** | `shift-left-governance`, `trace-debugging` | `laws-of-ux-audit`, `ux-form-optimization` | **Complementari**: rigore del motore interno + semplicità d'uso esterna |
| **Esperienza d'Uso** | Parametri espliciti obbligatori in ingresso | Input flessibile con valori predefiniti automatici | **Vince Beta**: il sistema accetta input semplici e li converte da solo dietro le quinte |
| **Architettura Interna** | Funzioni pure in `src/core/` separate dalla grafica | Aggiornamento immediato dello schermo senza attese | **Vince Alpha**: stato reattivo separato dal DOM con aggiornamento rapido (`< 50ms`) |
| **Errori & Casi Limite** | Blocco immediato su dati corrotti o doppi invii | Messaggi chiari in italiano con tasto Annulla (Undo) | **Unificata**: controllo rigoroso nel motore mappato in azioni di recupero semplici nella pagina |

- **Dietro le quinte (Negoziazione `Gamma <-> Alpha/Beta`)**: `Gamma` ha chiesto ad `Alpha` di gestire la pulizia degli input senza appesantire l'utente e a `Beta` di non salvare dati grezzi direttamente nel browser.
- **Verifiche Tecniche & File Aggiornati**: `Oracolo Alpha: PASS` | `Oracolo Beta: PASS` in `[file.test.js](file:///percorso/file.test.js#L1-L80)`.

</details>

La modalità `SKIZZO` resta attiva per i prossimi messaggi della sessione (scrivi `/skizzo stop` o `"stop skizzo"` quando vuoi fermarla).
```

---

## 4. Variante `/skizzo --proto` (Doppio Prototipo in Git Worktrees Isolati — `worktree-lifecycle`)

Quando l'utente richiede esplicitamente di confrontare empiricamente entrambe le implementazioni complete (`/skizzo --proto`):

1. **Pre-flight Guard & Setup Worktrees (`worktree-lifecycle`)**:
   ```powershell
   git status --porcelain
   git worktree add ../<repo>-skizzo-alpha -b skizzo/alpha-tech
   git worktree add ../<repo>-skizzo-beta -b skizzo/beta-domain
   ```
2. **Esecuzione Parallela (`invoke_subagent`)**:
   - `Subagent Alpha` (`TypeName: "self"`, `Role: "Systems & Technical Purity Architect"`, `Workspace: "share"`) opera esclusivamente dentro `../<repo>-skizzo-alpha`.
   - `Subagent Beta` (`TypeName: "self"`, `Role: "Domain & User Experience Advocate"`, `Workspace: "share"`) opera esclusivamente dentro `../<repo>-skizzo-beta`.
3. **Tabella Comparativa Empirica e Teardown Pulito**:
   - Eseguire i test in entrambi i worktree, esporre nel banner `[!IMPORTANT]` iniziale lo stato `MODALITÀ SKIZZO ATTIVA (DUAL-TRACK + PROTO)` con i link `conversation://` e, dopo la scelta o fusione sul branch principale, rimuovere i worktree e i branch temporanei:
   ```powershell
   git worktree remove ../<repo>-skizzo-alpha
   git worktree remove ../<repo>-skizzo-beta
   git branch -D skizzo/alpha-tech skizzo/beta-domain
   ```

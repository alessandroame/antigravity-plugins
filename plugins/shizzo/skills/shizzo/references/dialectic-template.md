# Template di Riferimento Dialettico & Mediatore (`/shizzo`)

Questo documento fornisce i template estesi di riferimento per il **Banner Esplicito Modalità Shizzo (`[!IMPORTANT]`)**, la **Matrice Dialettica**, il **Mediatore Interattivo (`/shizzo --mediator`)** e la variante di prototipazione parallela su Git Worktree (`/shizzo --proto`).

---

## 1. Template di Risposta per Attivazione / Disattivazione Toggle (`/shizzo`)

### Passaggio a `ON` Standard (`/shizzo` o `/shizzo on`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SHIZZO ATTIVA (`DUAL-TRACK`)** — Stato sessione: `SHIZZO = ON` | `MEDIATOR = OFF` | Titolo: `[SHIZZO]`

- **Subagent Alpha (Systems & Technical Purity)**: presidia isolamento headless, complessità $O(\cdot)$, immutabilità e test di invarianti.
- **Subagent Beta (Domain & User Advocate)**: presidia ergonomia d'uso, Legge di Tesler/Postel e test di scenario utente.
- **Opzioni di Sessione**: usa `/shizzo --mediator` (o `-m`) per abilitare il terzo subagent Mediatore (`Subagent Gamma`), `/shizzo --proto` per 2 prototipi in Git Worktree, `/shizzo off` per disattivare.

Quale requisito o funzionalità vuoi sottoporre al flusso Dual-Track?
```

### Passaggio a `ON` con Mediatore Interattivo (`/shizzo --mediator` o `/shizzo -m`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SHIZZO ATTIVA (`DUAL-TRACK + MEDIATORE`)** — Stato sessione: `SHIZZO = ON` | `MEDIATOR = ON` | Titolo: `[SHIZZO+MED]`

- **Biforcazione Parallela (`Alpha` vs `Beta`)**: `Subagent Alpha` (Tecnico) e `Subagent Beta` (Dominio) progettano in cecità reciproca nella Fase 1.
- **Mediatore Interattivo (`Subagent Gamma`)**: nella Fase 2 un terzo subagent isolato esamina i disaccordi, contro-interroga `Alpha` e `Beta` via `send_message` (max 1 round) ed emette il lodo arbitrale vincolante.

Quale requisito o funzionalità vuoi sottoporre al flusso Dual-Track con Mediatore?
```

### Passaggio a `OFF` (`/shizzo` o `/shizzo off`)
```markdown
**[SHIZZO: OFF]** — Modalità dialettica disattivata (`SHIZZO = OFF`, `MEDIATOR = OFF`). Il flusso operativo torna all'esecuzione standard a singolo binario e il prefisso `[SHIZZO]` / `[SHIZZO+MED]` è stato rimosso dal titolo della conversazione.
```

---

## 2. Template Completo di Consegna Task con Mediatore (`0-Click` + `1-Click`)

```markdown
> [!IMPORTANT]
> **MODALITÀ SHIZZO ATTIVA (`DUAL-TRACK + MEDIATORE`)** — Subagent: [`Subagent Alpha (Tecnico)`](conversation://<id-alpha>) · [`Subagent Beta (Dominio)`](conversation://<id-beta>) · [`Subagent Gamma (Mediatore)`](conversation://<id-gamma>)

Implementato `[simbolo/modulo](file:///percorso/file.ext#L1-L50)` tramite sintesi dialettica tra architettura headless (`Alpha`), flusso utente a zero attrito (`Beta`) e lodo arbitrale del Mediatore (`Gamma`).

- **Contratto Esterno (Dominio Beta)**: [1 riga su come l'utente interagisce e quale complessità viene normalizzata automaticamente].
- **Motore Interno (Tecnico Alpha)**: [1 riga sull'architettura pura headless, complessità $O(\cdot)$ e gestione casi limite].
- **Disaccordo Risolto dal Mediatore (Gamma)**: [1 riga sul conflitto chiave tra Alpha e Beta risolto tramite negoziazione `send_message`].
- **Doppio Oracolo di Verifica**: `Oracolo Alpha (Tecnico): N/N PASS` | `Oracolo Beta (Dominio): M/M PASS` in `[file.test.js](file:///percorso/file.test.js#L1-L80)`.

<details>
<summary><strong>Matrice Dialettica Shizzo (Alpha Tecnico vs Beta Dominio & Arbitrato Gamma)</strong></summary>

| Dimensione | Subagent Alpha (Systems & Purity) | Subagent Beta (Domain & User) | Verdetto Arbitrale (Mediatore Gamma) |
| :--- | :--- | :--- | :--- |
| **API / Interazione** | Input tipizzato rigido con parametri espliciti obbligatori | Input permissivo (Postel) con inferenza automatica dei default | **Vince Beta**: parser permissivo in ingresso che normalizza verso la struttura tipizzata di Alpha |
| **Core & Stato** | Funzioni pure `[PURE]` in `src/core/` con storage adapter iniettabile | Aggiornamento immediato della vista senza attese o ricaricamenti | **Vince Alpha**: store reattivo disaccoppiato dal DOM con optimistic update governato dal core |
| **Errori & Limiti** | Fallimento deterministico su payload corrotti o race condition | Messaggi azionabili in linguaggio di dominio con recupero stato (Undo) | **Convergenza**: result type tipizzato nel core mappato in azioni di ripristino non distruttive nella UI |
| **Oracolo di Test** | Unit test su invarianti matematici, input vuoti/null e concorrenza | Test di accettazione sullo scenario d'uso completo end-to-end | **Doppio Oracolo**: entrambi gli oracoli integrati nella test suite automatica |

- **Negoziazione `Gamma -> Alpha` (`send_message`, Round 1/1)**: richiesto ad `Alpha` se il parser permissivo potesse risiedere in un boundary puro senza inquinare il core; `Alpha` ha confermato fornendo la firma di normalizzazione deterministica.
- **Negoziazione `Gamma -> Beta` (`send_message`, Round 1/1)**: richiesto a `Beta` di sostituire il salvataggio sincrono diretto in `localStorage` con un evento verso lo store iniettabile; `Beta` ha accettato mantenendo invariata la latenza percepita ($< 50\text{ms}$).

</details>

Vuoi procedere con il prossimo requisito in modalità `SHIZZO` o disattivare il toggle con `/shizzo off`?
```

---

## 3. Variante `/shizzo --proto` (Doppio Prototipo in Git Worktrees Isolati — `worktree-lifecycle`)

Quando l'utente richiede esplicitamente di confrontare empiricamente entrambe le implementazioni complete (`/shizzo --proto`):

1. **Pre-flight Guard & Setup Worktrees (`worktree-lifecycle`)**:
   ```powershell
   git status --porcelain
   git worktree add ../<repo>-shizzo-alpha -b shizzo/alpha-tech
   git worktree add ../<repo>-shizzo-beta -b shizzo/beta-domain
   ```
2. **Esecuzione Parallela (`invoke_subagent`)**:
   - `Subagent Alpha` (`TypeName: "self"`, `Role: "Systems & Technical Purity Architect"`, `Workspace: "share"`) opera esclusivamente dentro `../<repo>-shizzo-alpha`.
   - `Subagent Beta` (`TypeName: "self"`, `Role: "Domain & User Experience Advocate"`, `Workspace: "share"`) opera esclusivamente dentro `../<repo>-shizzo-beta`.
3. **Tabella Comparativa Empirica e Teardown Pulito**:
   - Eseguire i test in entrambi i worktree, esporre nel banner `[!IMPORTANT]` iniziale lo stato `MODALITÀ SHIZZO ATTIVA (DUAL-TRACK + PROTO)` con i link `conversation://` e, dopo la scelta o fusione sul branch principale, rimuovere i worktree e i branch temporanei:
   ```powershell
   git worktree remove ../<repo>-shizzo-alpha
   git worktree remove ../<repo>-shizzo-beta
   git branch -D shizzo/alpha-tech shizzo/beta-domain
   ```

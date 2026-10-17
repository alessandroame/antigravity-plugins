# Template di Riferimento Dialettico & Mediatore (`/skizzo`)

Questo documento fornisce i template estesi di riferimento per il **Banner Esplicito Modalità Skizzo (`[!IMPORTANT]`)**, la **Matrice Dialettica**, il **Mediatore Interattivo (`/skizzo --mediator`)** e la variante di prototipazione parallela su Git Worktree (`/skizzo --proto`).

---

## 1. Template di Risposta per Attivazione / Disattivazione Toggle (`/skizzo`)

### Passaggio a `ON` Standard (`/skizzo` o `/skizzo on`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK`)** — Stato sessione: `SKIZZO = ON` | `MEDIATOR = OFF` | Titolo: `[SKIZZO]`

- **Subagent Alpha (Systems & Technical Purity)**: presidia isolamento headless, complessità $O(\cdot)$ e test di invarianti (auto-routing skill tecniche: `shift-left-governance`, `trace-debugging`, `circuit-breaker`).
- **Subagent Beta (Domain & User Advocate)**: presidia ergonomia d'uso, Legge di Tesler/Postel e test di scenario (auto-routing skill UX/dominio: `laws-of-ux-audit`, `ux-form-optimization`, `ux-button-and-touch-ergonomics`).
- **Opzioni di Sessione**: usa `/skizzo --mediator` (o `-m`) per abilitare il terzo subagent Mediatore (`Subagent Gamma`), `/skizzo --proto` per 2 prototipi in Git Worktree, `/skizzo off` per disattivare.

Quale requisito o funzionalità vuoi sottoporre al flusso Dual-Track?
```

### Passaggio a `ON` con Mediatore Interattivo (`/skizzo --mediator` o `/skizzo -m`)
```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK + MEDIATORE`)** — Stato sessione: `SKIZZO = ON` | `MEDIATOR = ON` | Titolo: `[SKIZZO+MED]`

- **Biforcazione Parallela & Auto-Routing Skill (`Alpha` vs `Beta`)**: `Subagent Alpha` (Tecnico) e `Subagent Beta` (Dominio) progettano in cecità reciproca nella Fase 1 dichiarando alla partenza le rispettive 1–3 skill attivate.
- **Mediatore Interattivo (`Subagent Gamma`)**: nella Fase 2 un terzo subagent isolato esamina i disaccordi, contro-interroga `Alpha` e `Beta` via `send_message` (max 1 round) ed emette il lodo arbitrale vincolante.

Quale requisito o funzionalità vuoi sottoporre al flusso Dual-Track con Mediatore?
```

### Passaggio a `OFF` (`/skizzo` o `/skizzo off`)
```markdown
**[SKIZZO: OFF]** — Modalità dialettica disattivata (`SKIZZO = OFF`, `MEDIATOR = OFF`). Il flusso operativo torna all'esecuzione standard a singolo binario e il prefisso `[SKIZZO]` / `[SKIZZO+MED]` è stato rimosso dal titolo della conversazione.
```

---

## 2. Template Completo di Consegna Task con Mediatore (`0-Click` + `1-Click`)

```markdown
> [!IMPORTANT]
> **MODALITÀ SKIZZO ATTIVA (`DUAL-TRACK + MEDIATORE`)** — Subagent: [`Subagent Alpha (Tecnico)`](conversation://<id-alpha>) (Skill: `shift-left-governance`, `trace-debugging`) · [`Subagent Beta (Dominio)`](conversation://<id-beta>) (Skill: `laws-of-ux-audit`, `ux-form-optimization`) · [`Subagent Gamma (Mediatore)`](conversation://<id-gamma>)

Implementato `[simbolo/modulo](file:///percorso/file.ext#L1-L50)` tramite sintesi dialettica tra architettura headless (`Alpha`), flusso utente a zero attrito (`Beta`) e lodo arbitrale del Mediatore (`Gamma`).

- **Contratto Esterno (Dominio Beta)**: [1 riga su come l'utente interagisce e quale complessità viene normalizzata automaticamente].
- **Motore Interno (Tecnico Alpha)**: [1 riga sull'architettura pura headless, complessità $O(\cdot)$ e gestione casi limite].
- **Disaccordo Risolto dal Mediatore (Gamma)**: [1 riga sul conflitto chiave tra Alpha e Beta risolto tramite negoziazione `send_message`].
- **Doppio Oracolo di Verifica**: `Oracolo Alpha (Tecnico): N/N PASS` | `Oracolo Beta (Dominio): M/M PASS` in `[file.test.js](file:///percorso/file.test.js#L1-L80)`.

<details>
<summary><strong>Matrice Dialettica Skizzo (Alpha Tecnico vs Beta Dominio & Arbitrato Gamma)</strong></summary>

| Dimensione | Subagent Alpha (Systems & Purity) | Subagent Beta (Domain & User) | Verdetto Arbitrale (Mediatore Gamma) |
| :--- | :--- | :--- | :--- |
| **Skill Attive** | `shift-left-governance`, `trace-debugging` | `laws-of-ux-audit`, `ux-form-optimization` | **Copertura Ortogonale**: rigore headless interno + ergonomia Postel/Tesler esterna |
| **API / Interazione** | Input tipizzato rigido con parametri espliciti obbligatori | Input permissivo (Postel) con inferenza automatica dei default | **Vince Beta**: parser permissivo in ingresso che normalizza verso la struttura tipizzata di Alpha |
| **Core & Stato** | Funzioni pure `[PURE]` in `src/core/` con storage adapter iniettabile | Aggiornamento immediato della vista senza attese o ricaricamenti | **Vince Alpha**: store reattivo disaccoppiato dal DOM con optimistic update governato dal core |
| **Errori & Limiti** | Fallimento deterministico su payload corrotti o race condition | Messaggi azionabili in linguaggio di dominio con recupero stato (Undo) | **Convergenza**: result type tipizzato nel core mappato in azioni di ripristino non distruttive nella UI |
| **Oracolo di Test** | Unit test su invarianti matematici, input vuoti/null e concorrenza | Test di accettazione sullo scenario d'uso completo end-to-end | **Doppio Oracolo**: entrambi gli oracoli integrati nella test suite automatica |

- **Negoziazione `Gamma -> Alpha` (`send_message`, Round 1/1)**: richiesto ad `Alpha` se il parser permissivo potesse risiedere in un boundary puro senza inquinare il core; `Alpha` ha confermato fornendo la firma di normalizzazione deterministica.
- **Negoziazione `Gamma -> Beta` (`send_message`, Round 1/1)**: richiesto a `Beta` di sostituire il salvataggio sincrono diretto in `localStorage` con un evento verso lo store iniettabile; `Beta` ha accettato mantenendo invariata la latenza percepita ($< 50\text{ms}$).

</details>

Vuoi procedere con il prossimo requisito in modalità `SKIZZO` o disattivare il toggle con `/skizzo off`?
```

---

## 3. Variante `/skizzo --proto` (Doppio Prototipo in Git Worktrees Isolati — `worktree-lifecycle`)

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

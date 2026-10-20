# Protocollo Dialettico Dual-Track, Auto-Triage & Mediatore (`/skizzo`)

Governa l'esecuzione parallela (**Systems & Technical Purity** vs **Domain & User Experience Advocate**) con **Filtro Automatico a Priori (`FAST-PASS` vs `DUAL-TRACK`)**, **Auto-Routing Skill**, **Mediatore Interattivo** e restituzione **Human-First**.

---

## 1. Dormienza, Persistenza Sticky `Auto-Smart` e Stop (`/skizzo`)

1. **Inattivo a Inizio Chat (`OFF`)**: all'apertura è `OFF` (`SKIZZO = OFF`, `MEDIATOR = OFF`).
2. **Persistenza Sticky in Sessione (`ON` finché non fermato)**:
   - Attivato con `/skizzo`, `/skizzo on`, `/skizzo --mediator` (`-m`) o `/skizzo <task>`, `SKIZZO = ON` **resta attivo per tutti i messaggi della sessione** (anche dopo un `FAST-PASS`).
   - **Verifica a Inizio Turno**: se nello storico è stato attivato `/skizzo` o compare `MODALITÀ SKIZZO ATTIVA` senza stop successivo, eseguire il **Gate 0**.
3. **Override (`--force` / `--skip`) e Stop (`/skizzo stop`)**:
   - **Forza 2 Agenti (`--force` / `-f` / `"forza skizzo"` / `"usa skizzo"`)**: salta il Gate 0 ed esegue il **Ciclo a 4 Fasi (`DUAL-TRACK`)**.
   - **Salta 1 Turno (`--skip` / `--fast` / `"senza skizzo"` / `"risposta veloce"`)**: esegue **`FAST-PASS` (`0` subagent)** mantenendo `SKIZZO = ON`.
   - **Stop (`/skizzo stop`, `/skizzo off`, `stop skizzo`, `ferma skizzo`)**: riporta `SKIZZO = OFF` e rimuove `[SKIZZO]` dal titolo (`--no-mediator` spegne solo `Gamma`).
4. **Titolo Chat (`[SKIZZO]` / `[SKIZZO+MED]`)**: a `ON`, anteporre `[SKIZZO] ` via `set-chat-title.mjs --conversation-id "<Conversation ID>" --title "..."`; allo stop, rimuoverlo.

---

## 2. Gate 0 — Triage Automatico a Priori al Turno 1 (`FAST-PASS` vs `DUAL-TRACK`, `< 5ms`)

Quando `SKIZZO = ON` (salvo `--force`), valutare *a priori* **al Turno 1 (`0` `read_file` pre-triage)** via `plugins/skizzo/scripts/triage.mjs`:

1. **Via Rapida (`FAST-PASS` — `0` Subagent, ~90–120s risparmiati, `SKIZZO` resta `ON`)**:
   - **Caso A (Ops, Git, Test, Memoria o Conferma Piano)**: `/memory-sync`, `/take-note`, `/review-notes`, `/next-step`, `/validate-plugins`, `git status/add/commit/diff`, test/sync o conferme (*"fallo"*, *"procedi"*, *"applica"*).
   - **Caso B (Sola Lettura / Dubbio Diagnostico)**: domande (*"spiega"*, *"dove si trova"*, *"mostrami"*, *"non comprendo"*, *"come mai"*, `/how-its-made`) senza scelte di design.
   - **Caso C (Micro-Edit o Taratura Puntuale)**: refusi, rename, ritocco di colore/costante/distanza/parametro già deciso su 1 file.
   - **Banner `FAST-PASS` (Rigo 1)**: rispondere senza `invoke_subagent` aprendo con:
     `> [!NOTE]`
     `> MODALITÀ SKIZZO ATTIVA (FAST-PASS — Risposta rapida per <motivo>, ~90s risparmiati) · Resta attiva per i prossimi messaggi · Usa "/skizzo --force" per forzare i 2 agenti.`
2. **Doppio Binario (`DUAL-TRACK` — `2` Subagent Paralleli, Zero Pre-Esplorazione)**:
   Scatta al Turno 1 (zero letture nel padre) con **>= 2 segnali di tensione** (o piano/nuova feature): **Architettura/Multi-File** (`>= 3` file, core + UI), **Esperienza Utente** (flussi, form, mobile `360px`, meno click) o **Input Sporchi/Casi Limite** (parsing, filtri, validazioni, concorrenza).

---

## 3. Ciclo a 4 Fasi (Quando il Gate 0 instrada a `DUAL-TRACK`)

### Fase 1 — Biforcazione Cieca Parallela, Budget `<= 4` Turni & Zero Polling
Selezionare **1–2 skill verticali** per binario (**vietate meta-skill** come `skizzo` o `ab-bench`; fallback `core-standard`) e lanciare **al Turno 1** i **2 subagent paralleli** in **una chiamata `invoke_subagent`**:
1. **Subagent Alpha (`Systems & Technical Purity Architect`, `<id-alpha>`)**: core headless (`core/` zero DOM/storage), complessità `O(1)`/`O(n)`, immutabilità e **Oracolo Tecnico**.
2. **Subagent Beta (`Domain & User Experience Advocate`, `<id-beta>`)**: valore pratico, meno click/fatica e **Oracolo di Dominio**.
- **Rigo 1, Budget `<= 4` Turni & Zero Polling**: aprono con **Skill Attive (Alpha/Beta)**: seguito dagli ID `kebab-case`, completano l'analisi in **max 4 turni tool** con righe `#Lxx-Lyy`. Lanciati i subagent (o se uno è `running`), **chiudere subito il turno (`0` tool call, `0` byte, vietati `schedule` e `manage_subagents`)**. Se interrogati da `Gamma`, rispondere a `Recipient: "<id-gamma>"`.

### Fase 2 — Cross-Critique o Mediatore (`--mediator`)
1. **Standard (`MEDIATOR = OFF`)**: Cross-Critique (`Alpha -> Beta` su tenuta tecnica; `Beta -> Alpha` su semplicità).
2. **Mediatore (`MEDIATOR = ON`)**: invocare **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `TypeName: "research"`, `<id-gamma>`)** che interroga `<id-alpha>` e `<id-beta>` via `send_message` (**max 1 round**), cede il turno in silenzio e invia il **Lodo Arbitrale** al `parent`.

### Fase 3 & Fase 4 — Sintesi, Doppio Oracolo e Restituzione "Human-First"
1. **Unificazione**: semplicità esterna di `Beta` sostenuta dal core headless di `Alpha` (`--proto` su 2 Git Worktrees se richiesto).
2. **Banner `[!IMPORTANT]` al Rigo 1**:
   `> [!IMPORTANT]`
   `> MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | +MEDIATORE | +PROTO) — Subagent: [Agente Tecnico (Alpha)](conversation://<id-alpha>) (Skill: <skills-alpha>) · [Agente Utente (Beta)](conversation://<id-beta>) (Skill: <skills-beta>) · [Mediatore (Gamma)](conversation://<id-gamma>)`
3. **Corpo Visibile (Zero Gergo & Zero LaTeX fuori da `<details>`)**: esporre in italiano semplice **Cosa cambia per te**, **Comodità difesa dall'Agente Utente (Beta)**, **Problema evitato dall'Agente Tecnico (Alpha)**, **Su cosa non erano d'accordo (e perché vince questa soluzione)** — **Controlli**: `Tutti i test superati (X/X OK)`. Racchiudere **Matrice Dialettica**, oracoli e file in `<details>` (chiuso di default, riga vuota dopo `</summary>`).

---

## 4. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Non c'è `/skizzo` o dopo `FAST-PASS`, rispondo normale."* | `SKIZZO = ON` resta attivo fino a `/skizzo stop`. |
| *"Leggo file pre-Gate 0 o uso `schedule`/`manage_subagents`."* | Zero letture pre-Gate 0 e zero polling (`0` tool call). |
| *"Lancio 2 subagent per typo, git o 'procedi'."* | Usare `FAST-PASS` (`0` subagent + banner `[!NOTE]`). |
| *"Chiedo se vuole `FAST-PASS` o `DUAL-TRACK`."* | Decidere a priori e indicare `/skizzo --force`. |
| *"Stampo 'Ricevuto Alpha' o uso gergo/LaTeX a 0-Click."* | Attendere in silenzio (`0 byte`); usare italiano semplice. |

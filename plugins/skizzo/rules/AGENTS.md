# Protocollo Dialettico Dual-Track, Auto-Skizzo Silente & Mediatore (`/skizzo`)

Governa l'esecuzione parallela (**Systems & Technical Purity** vs **Domain & User Experience Advocate**) con **Modalità `Auto-Skizzo Silente` (`AUTO`)**, **Filtro a Priori (`FAST-PASS` vs `DUAL-TRACK`)**, **Auto-Routing Skill**, **Mediatore** e output **Human-First**.

## 1. Modalità `Auto-Skizzo Silente` (`AUTO`), Persistenza Sticky (`ON`) e Stop
1. **Attivo in Silenzio a Inizio Chat (`SKIZZO = AUTO`, Zero Banner sui Turni Diretti)**:
   - Ogni chat parte in `SKIZZO = AUTO` (`MEDIATOR = OFF`). Al Turno 1 il **Gate 0** (`plugins/skizzo/scripts/triage.mjs`) valuta la richiesta con `0` letture pre-triage:
   - Se `FAST-PASS` (`score < 4` o guardie di bypass) e l'utente **non** ha scritto `/skizzo`, risponde direttamente con **`0` subagent e `0 byte` di banner** (`silentFastPass: true`).
   - Se `DUAL-TRACK` (`score >= 4`: scelte architetturali/multi-file + UX/casi limite o regressioni multi-sintomo), avvia autonomamente i **2 subagent paralleli (`Alpha` e `Beta`)** senza bisogno di digitare `/skizzo`.
2. **Persistenza Sticky (`SKIZZO = ON`)**: attivato con `/skizzo`, `/skizzo on`, `/skizzo --mediator` (`-m`) o `/skizzo <task>`, passa a `SKIZZO = ON` (`score >= 3`) mostrando la ricevuta `[!NOTE]` sui `FAST-PASS` (`silentFastPass: false`).
3. **Override e Stop**: `--force` / `-f` / `"forza skizzo"` -> forza `DUAL-TRACK`; `--skip` / `--fast` / `"senza skizzo"` -> forza `FAST-PASS`; `/skizzo stop` / `/skizzo off` / `stop skizzo` -> imposta `SKIZZO = OFF` e rimuove `[SKIZZO]` dal titolo (`set-chat-title.mjs`).

## 2. Gate 0 — Triage Automatico a Priori al Turno 1 (`FAST-PASS` vs `DUAL-TRACK`)
1. **Via Rapida (`FAST-PASS` — `0` Subagent)**:
   - **Caso A (Ops/Git/Test/Sync/Conferma)**: `/memory-sync`, `/take-note`, `/review-notes`, `/next-step`, `/validate-plugins`, `git`, `npm`, `start server` o conferme (*"fallo"*, *"procedi"*).
   - **Caso B (Sola Lettura / `"non agire"`)**: `/how-its-made`, *"spiega"*, *"dove si trova"*, *"non agire"*, *"è solo una domanda"*, *"senza modificare nulla"*.
   - **Caso C (Micro-Edit a Scelta Unica)**: refusi, rename, ritocco di costante/colore già deciso su 1 file.
   - **Banner `FAST-PASS`**: `0 byte` se `silentFastPass: true` (`AUTO`); altrimenti:
     `> [!NOTE]`
     `> MODALITÀ SKIZZO ATTIVA (FAST-PASS — Risposta rapida per <motivo>, ~90s risparmiati) · Resta attiva per i prossimi messaggi · Usa "/skizzo --force" per forzare i 2 agenti.`
2. **Doppio Binario (`DUAL-TRACK` — `2` Subagent Paralleli, Zero Pre-Esplorazione)**: scatta al Turno 1 con `score >= 4` in `AUTO` (`>= 3` in `ON`).

## 3. Ciclo a 4 Fasi (`DUAL-TRACK`)
1. **Fase 1 (Biforcazione Parallela, Budget `<= 4` Turni & Zero Polling)**: selezionare **1–2 skill verticali** per binario (vietate meta-skill `skizzo`/`ab-bench`; fallback `core-standard`) e lanciare al Turno 1:
   - **Subagent Alpha (`Systems & Technical Purity Architect`, `<id-alpha>`)**: core headless, complessità `O(1)`/`O(n)`, immutabilità e **Oracolo Tecnico**.
   - **Subagent Beta (`Domain & User Experience Advocate`, `<id-beta>`)**: valore pratico, meno click/fatica e **Oracolo di Dominio**.
   - Aprono con **Skill Attive (Alpha/Beta)**: `<id>`, completano in **max 4 turni tool** con righe `#Lxx-Lyy`. Lanciati i subagent, **chiudere subito il turno (`0` tool call, `0` byte, vietati `schedule` e `manage_subagents`)**.
2. **Fase 2 (Cross-Critique o Mediatore `--mediator`)**: Cross-Critique (`Alpha <-> Beta`) oppure **`Subagent Gamma` (`Dialectical Mediator & Conflict Resolver`, `research`, `<id-gamma>`)** che interroga Alpha/Beta via `send_message` (max 1 round) ed emette il **Lodo Arbitrale**.
3. **Fase 3 & 4 (Sintesi, Doppio Oracolo e Restituzione "Human-First")**:
   - **Banner Rigo 1**:
     `> [!IMPORTANT]`
     `> MODALITÀ SKIZZO ATTIVA (DUAL-TRACK | +MEDIATORE | +PROTO) — Subagent: [Agente Tecnico (Alpha)](conversation://<id-alpha>) (Skill: <skills-alpha>) · [Agente Utente (Beta)](conversation://<id-beta>) (Skill: <skills-beta>)`
   - **Corpo Visibile (Zero Gergo & Zero LaTeX fuori da `<details>`)**: esporre **Cosa cambia per te**, **Comodità difesa dall'Agente Utente (Beta)**, **Problema evitato dall'Agente Tecnico (Alpha)**, **Su cosa non erano d'accordo (e perché vince questa soluzione)** — **Controlli**: `Tutti i test superati (X/X OK)`. Racchiudere **Matrice Dialettica**, oracoli e file in `<details>` (chiuso, riga vuota post-`</summary>`).

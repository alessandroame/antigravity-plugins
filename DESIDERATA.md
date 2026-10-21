# Matrice di Stato delle Funzionalità (DESIDERATA)

Matrice di stato delle funzionalità, dei plugin e dei tool interni dell'ecosistema `antigravity-plugins`.
> **Governance anti-bloat**: tetto massimo **150 righe**; mantenere ogni cella `Note` entro **160 caratteri** (i dettagli risiedono in [WORKLOG.md](./WORKLOG.md) e `.agents/worklog.d/`).

---

## 1. Backlog Attivo & Funzionalità Pianificate

| Modulo / Funzionalità | Ambito | Stato | Note / Specifica di Riferimento (<= 160 char) |
| :--- | :---: | :---: | :--- |
| *Nessun task pendente nel backlog attivo* | — | `🟢 Completato` | Usa `/take-note` e `/review-notes` per promuovere nuovi desiderata. |

---

## 2. Funzionalità Completate & Consolidate

| Modulo / Funzionalità | Ambito | Stato | Note di Rilascio (<= 160 char) |
| :--- | :---: | :---: | :--- |
| `engineering-sobriety` | Plugin | `🟢 Completato` | Regole anti-hype, bonifica lessicale, zero emoji decorative e skill `tone-audit` ([README](./plugins/engineering-sobriety/README.md)). |
| `laws-of-ux` (v1.1.0) | Plugin | `🟢 Completato` | 30 leggi UX, Budget 60/40, Gerarchia 3s, Ricevuta Visiva a 4 Misure e `ux-outdoor-and-field-ergonomics` ([README](./plugins/laws-of-ux/README.md)). |
| `execution-guard` | Plugin | `🟢 Completato` | Watchdog anti-freeze, circuit breaker, timeout script e guardia mock API ([README](./plugins/execution-guard/README.md)). |
| `engineering-workflow` (v1.1.0) | Plugin | `🟢 Completato` | Git chirurgico, headless core, Gate 4 `ui-geometry-probe.js` e Ricevuta a 4 Misure ([README](./plugins/engineering-workflow/README.md)). |
| `cognitive-persistence` (v1.5.0) | Plugin | `🟢 Completato` | Architettura 3+1, Kanban remoto Git/Vocale, coda parallela anti-conflitto (`board-engine.mjs`) e kit vocale ([README](./plugins/cognitive-persistence/README.md)). |
| `proactive-mentorship` (v1.1.0) | Plugin | `🟢 Completato` | Coaching AGY (`/grill-me`, `/plan`, `/compact`), Agent Training `L0..L3` e refactoring prompt ([README](./plugins/proactive-mentorship/README.md)). |
| `skill-governance` | Plugin | `🟢 Completato` | Two-phase token model, audit dimensionale (A-E) e `skill-collision-check` ([README](./plugins/skill-governance/README.md)). |
| `telemetry-analytics` (v1.5.0) | Plugin | `🟢 Completato` | ETA sui checkpoint entro 2° turno, calibrazione errore, TTL cursori 7gg e rotazione `events.ndjson` 5 MB ([README](./plugins/telemetry-analytics/README.md)). |
| `code-inspector` | Plugin | `🟢 Completato` | Modello IPO Esteso, `/how-its-made`, widget `<agent-embed>` dual-tab e cassetti `<details>` ([README](./plugins/code-inspector/README.md)). |
| `skizzo` (v1.5.0) | Plugin | `🟢 Completato` | Sticky Auto-Smart (`FAST-PASS` < 5ms vs `DUAL-TRACK`), `triage.mjs`, `--force`/`--skip`, `--mediator` e Human-First ([README](./plugins/skizzo/README.md)). |
| `ab-bench` (v1.0.0) | Plugin | `🟢 Completato` | Sfida cieca A/B su 5 Dita (`/ab-bench`, `--skill`, `--stats`), sanitizer anti-bias, Rasoio di Occam e storico 5 MB ([README](./plugins/ab-bench/README.md)). |
| `human-governor` (v1.0.0) | Plugin | `🟢 Completato` | Guardia WIP (max 2), anti-thrashing, coprifuoco 22:30-07:00, hook `PreInvocation` e `/focus-audit` ([README](./plugins/human-governor/README.md)). |
| `starter-plugin` | Template | `🟢 Completato` | Blueprint standard per nuovi plugin con manifest SemVer valido ([README](./templates/starter-plugin/README.md)). |
| Validatore statico (`scripts/validate.mjs`) | Tooling | `🟢 Completato` | Verifica manifest, SemVer, regole, frontmatter skill, igiene Markdown/LaTeX e tetti righe dei 4 file cognitivi. |
| Sync fisico globale (`scripts/sync-to-global.mjs`) | Tooling | `🟢 Completato` | Clona i plugin in `~/.gemini/config/plugins/` (resiliente a `EBUSY`) e aggiorna `config.json`. |
| Meta-skill `install-plugin` & `validate-plugins` | Tooling | `🟢 Completato` | Installazione guidata con audit collisioni e validazione interattiva (`.agents/skills/`). |
| Posizionamento Agentic Harness (`README.md`) | Docs | `🟢 Completato` | Documentazione ecosistema, bonifica zero-emoji e allineamento triade cognitiva. |

---

Legenda Stati: `🟢 Completato` | `🟡 In Lavorazione` | `🔴 Prioritario` | `⚪ Pianificato`

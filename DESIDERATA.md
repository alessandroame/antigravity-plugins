# Matrice di Stato delle Funzionalità (DESIDERATA)

Matrice di stato delle funzionalità, dei plugin e dei tool interni dell'ecosistema `antigravity-plugins`.
> **Governance anti-bloat**: tetto massimo **150 righe**; mantenere ogni cella `Note` entro **160 caratteri** (i dettagli risiedono in [WORKLOG.md](./WORKLOG.md) e `.agents/worklog.d/`).

---

## 1. Backlog Attivo & Funzionalità Pianificate

| Modulo / Funzionalità | Ambito | Stato | Note / Specifica di Riferimento ($\le 160\text{ char}$) |
| :--- | :---: | :---: | :--- |
| *Nessun task pendente nel backlog attivo* | — | `🟢 Completato` | Usa `/take-note` e `/review-notes` per promuovere nuovi desiderata. |

---

## 2. Funzionalità Completate & Consolidate

| Modulo / Funzionalità | Ambito | Stato | Note di Rilascio ($\le 160\text{ char}$) |
| :--- | :---: | :---: | :--- |
| `engineering-sobriety` | Plugin | `🟢 Completato` | Regole anti-hype, bonifica lessicale, zero emoji decorative e skill `tone-audit` ([README](./plugins/engineering-sobriety/README.md)). |
| `laws-of-ux` | Plugin | `🟢 Completato` | 30 leggi UX, 6 regole, 8 skill (inclusa `ux-outdoor-and-field-ergonomics`) e audit P0-P3 ([README](./plugins/laws-of-ux/README.md)). |
| `execution-guard` | Plugin | `🟢 Completato` | Watchdog anti-freeze, circuit breaker, timeout script e guardia mock API ([README](./plugins/execution-guard/README.md)). |
| `engineering-workflow` | Plugin | `🟢 Completato` | Git chirurgico, worktrees, trace debugging, headless core e `shift-left-governance` ([README](./plugins/engineering-workflow/README.md)). |
| `cognitive-persistence` (v1.4.0) | Plugin | `🟢 Completato` | Architettura 3+1 e anti-bloat (`MEMORY` $\le 200$, `WORKLOG` $\le 300$, `DESIDERATA` $\le 150$, `NOTES` $\le 120$) ([README](./plugins/cognitive-persistence/README.md)). |
| `proactive-mentorship` | Plugin | `🟢 Completato` | Scrutinio critico preventivo, prompt refactoring Before/After e compressione token ([README](./plugins/proactive-mentorship/README.md)). |
| `skill-governance` | Plugin | `🟢 Completato` | Two-phase token model, audit dimensionale (A-E) e `skill-collision-check` ([README](./plugins/skill-governance/README.md)). |
| `telemetry-analytics` (v1.5.0) | Plugin | `🟢 Completato` | ETA sui checkpoint entro 2° turno, calibrazione errore, TTL cursori 7gg e rotazione `events.ndjson` 5 MB ([README](./plugins/telemetry-analytics/README.md)). |
| `code-inspector` | Plugin | `🟢 Completato` | Modello IPO Esteso, `/how-its-made`, widget `<agent-embed>` dual-tab e cassetti `<details>` ([README](./plugins/code-inspector/README.md)). |
| `skizzo` (v1.2.0) | Plugin | `🟢 Completato` | Toggle `/skizzo`, auto-routing e dichiarazione `(Skill: ...)` alla partenza, `--mediator` (`Gamma`) e `--proto` ([README](./plugins/skizzo/README.md)). |
| `ab-bench` (v1.0.0) | Plugin | `🟢 Completato` | Sfida cieca A/B su 5 Dita (`/ab-bench`, `--skill`, `--stats`), sanitizer anti-bias, Rasoio di Occam e storico 5 MB ([README](./plugins/ab-bench/README.md)). |
| `starter-plugin` | Template | `🟢 Completato` | Blueprint standard per nuovi plugin con manifest SemVer valido ([README](./templates/starter-plugin/README.md)). |
| Validatore statico (`scripts/validate.mjs`) | Tooling | `🟢 Completato` | Verifica manifest, SemVer, regole, frontmatter skill e tetti righe dei 4 file cognitivi. |
| Sync fisico globale (`scripts/sync-to-global.mjs`) | Tooling | `🟢 Completato` | Clona i plugin in `~/.gemini/config/plugins/` (resiliente a `EBUSY`) e aggiorna `config.json`. |
| Meta-skill `install-plugin` & `validate-plugins` | Tooling | `🟢 Completato` | Installazione guidata con audit collisioni e validazione interattiva (`.agents/skills/`). |
| Posizionamento Agentic Harness (`README.md`) | Docs | `🟢 Completato` | Documentazione ecosistema, bonifica zero-emoji e allineamento triade cognitiva. |

---

Legenda Stati: `🟢 Completato` | `🟡 In Lavorazione` | `🔴 Prioritario` | `⚪ Pianificato`

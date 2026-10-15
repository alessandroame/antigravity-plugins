# Matrice di Stato delle Funzionalità (DESIDERATA)

Questo documento traccia lo stato di sviluppo delle funzionalità, dei plugin e dei tool interni dell'ecosistema `antigravity-plugins`.

---

## Legenda di Stato
- `🔴 Pianificato`: Requisito architetturale identificato ma non ancora avviato.
- `🟡 In Lavorazione`: Sviluppo in corso, implementazione parziale o in attesa di test.
- `🟢 Completato`: Funzionalità implementata, validata con test e documentata.

---

## 1. Catalogo Plugin Ufficiali

| Plugin | Stato | Note di Rilascio & Documentazione |
| :--- | :---: | :--- |
| `engineering-sobriety` | `🟢 Completato` | Regole anti-hype, tabella bonifica lessicale, bando emoji decorative (zero icon clutter), skill `tone-audit`, [README](./plugins/engineering-sobriety/README.md). |
| `laws-of-ux` | `🟢 Completato` | 30 leggi, 6 regole, 8 skill (inclusa `ux-outdoor-and-field-ergonomics`), template di audit euristico P0-P3, [README](./plugins/laws-of-ux/README.md). |
| `execution-guard` | `🟢 Completato` | Watchdog anti-freeze, circuit breaker salva-token, timeout script, guardia mock API esterne, tabella di anti-razionalizzazione, [README](./plugins/execution-guard/README.md). |
| `engineering-workflow` | `🟢 Completato` | Staging chirurgico, Conventional Commits, worktrees, trace debugging, architettura headless core, skill `shift-left-governance`, tabella di anti-razionalizzazione, [README](./plugins/engineering-workflow/README.md). |
| `cognitive-persistence` | `🟢 Completato` | Architettura cognitiva 3+1 (`NOTES.md`, `MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`), cattura in-flight a zero context-switch (`/take-note`), cruscotto ed esecuzione analisi approfondita (`/review-notes`), avvio task (`/next-step`), ridenominazione chat (`set-chat-title.mjs`), sync fine task (`/memory-sync`), tabella di anti-razionalizzazione, [README](./plugins/cognitive-persistence/README.md). |
| `proactive-mentorship` | `🟢 Completato` | Scrutinio critico preventivo, prompt refactoring Before/After, tabular token compression, [README](./plugins/proactive-mentorship/README.md). |
| `skill-governance` | `🟢 Completato` | Two-phase token model, audit dimensionale (A-E), collision check, [README](./plugins/skill-governance/README.md). |
| `telemetry-analytics` | `🟢 Completato` | Telemetria ibrida (v1.4.0), stima ETA sull'intera lavorazione persistente sui soli checkpoint (`· ETA tot ~Ns` in `toolAction` + `toolSummary` entro il 2° turno e sul primo tool operativo top-level), tabella di anti-razionalizzazione, auto-calibrazione errore (`etaCalibrationFactor`), [README](./plugins/telemetry-analytics/README.md). |
| `code-inspector` | `🟢 Completato` | Modello IPO Esteso (Ingresso -> Guardie -> Processo -> Uscita), comando slash `/how-its-made`, widget `<agent-embed>` dual-tab, selettori `<details>`, tabella di anti-razionalizzazione, [README](./plugins/code-inspector/README.md). |
| `starter-plugin` (template) | `🟢 Completato` | Blueprint standard per nuovi plugin con manifest SemVer valido, [README](./templates/starter-plugin/README.md). |

---

## 2. Tooling e Infrastruttura Interna

| Modulo / Funzionalità | Stato | Note di Rilascio |
| :--- | :---: | :--- |
| Suite di validazione statica (`scripts/validate.mjs`) | `🟢 Completato` | Controllo manifest JSON, SemVer, kebab-case, regole Markdown e frontmatter skill. |
| Script sincronizzazione fisica (`scripts/sync-to-global.mjs`) | `🟢 Completato` | Clona fisicamente i plugin in `~/.gemini/config/plugins/` e li registra in `~/.gemini/config/config.json`. |
| Meta-skill `install-plugin` (`.agents/skills/install-plugin`) | `🟢 Completato` | Installazione guidata verso configurazione globale e audit collisioni per progetti esterni. |
| Meta-skill `validate-plugins` (`.agents/skills/validate-plugins`) | `🟢 Completato` | Esecuzione interattiva della suite di test interna. |
| Documentazione globale e posizionamento (`README.md`, `package.json`) | `🟢 Completato` | Inquadramento Agentic Harness & Context Engineering, bonifica zero-emoji nelle intestazioni, topic GitHub. |
| Triade cognitiva di repository (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`) | `🟢 Completato` | Allineata con End-of-Task Sync. |

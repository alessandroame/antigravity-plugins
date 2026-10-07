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
| `engineering-sobriety` | `🟢 Completato` | Regole anti-hype, tabella bonifica lessicale, skill `tone-audit`, [README](./plugins/engineering-sobriety/README.md). |
| `laws-of-ux` | `🟢 Completato` | 30 leggi, 6 regole, 7 skill, template di audit euristico P0-P3, [README](./plugins/laws-of-ux/README.md). |
| `execution-guard` | `🟢 Completato` | Watchdog anti-freeze, circuit breaker salva-token, timeout script, [README](./plugins/execution-guard/README.md). |
| `engineering-workflow` | `🟢 Completato` | Staging chirurgico, Conventional Commits, worktrees, trace debugging, [README](./plugins/engineering-workflow/README.md). |
| `cognitive-persistence` | `🟢 Completato` | Triade cognitiva (Memory/Worklog/Desiderata), ADR in `worklog.d/`, [README](./plugins/cognitive-persistence/README.md). |
| `proactive-mentorship` | `🟢 Completato` | Scrutinio critico preventivo, prompt refactoring Before/After, [README](./plugins/proactive-mentorship/README.md). |
| `skill-governance` | `🟢 Completato` | Two-phase token model, audit dimensionale (A-E), collision check, [README](./plugins/skill-governance/README.md). |
| `starter-plugin` (template) | `🟢 Completato` | Blueprint standard per nuovi plugin con manifest SemVer valido, [README](./templates/starter-plugin/README.md). |

---

## 2. Tooling e Infrastruttura Interna

| Modulo / Funzionalità | Stato | Note di Rilascio |
| :--- | :---: | :--- |
| Suite di validazione statica (`scripts/validate.mjs`) | `🟢 Completato` | Controllo manifest JSON, SemVer, kebab-case, regole Markdown e frontmatter skill. |
| Meta-skill `install-plugin` (`.agents/skills/install-plugin`) | `🟢 Completato` | Installazione guidata per progetti esterni con Directory Junction e audit collisioni. |
| Meta-skill `validate-plugins` (`.agents/skills/validate-plugins`) | `🟢 Completato` | Esecuzione interattiva della suite di test interna. |
| Documentazione globale di repository (`README.md`) | `🟢 Completato` | Visione architetturale, catalogo, modalità di installazione e contribuzione. |
| Triade cognitiva di repository (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`) | `🟢 Completato` | Allineata con End-of-Task Sync. |

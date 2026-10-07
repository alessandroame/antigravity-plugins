# Antigravity Plugin: Engineering Workflow & Trace Debugging

Plugin per Google Antigravity che impone standard professionali di **version control con Git**, **isolamento dei task multi-sessione** e **debugging deterministico basato su tracce causali**.

---

## Componenti

| Componente | Tipo | Scopo |
| :--- | :--- | :--- |
| [`rules/AGENTS.md`](./rules/AGENTS.md) | Regola attiva | Vieta l'uso di `git add .`, prescrive Conventional Commits in inglese, subordina commit/merge su `main` al consenso dell'utente e impone il fault localization scientifico. |
| [`skills/worktree-lifecycle`](./skills/worktree-lifecycle) | Skill on-demand | Procedura completa per creare, lavorare e smantellare Git Worktree per isolare ogni task di sviluppo. |
| [`skills/trace-debugging`](./skills/trace-debugging) | Skill on-demand | Metodologia a 5 passi di iniezione breadcrumb logs, identificazione del Last Known Good Checkpoint e bonifica post-fix. |

---

## Installazione

### Nel Workspace di Progetto
```bash
mkdir -p <percorso-repo>/.agents/plugins
cp -r plugins/engineering-workflow <percorso-repo>/.agents/plugins/
```

### Globale
```powershell
Copy-Item -Recurse plugins/engineering-workflow "$env:USERPROFILE\.gemini\config\plugins\"
```

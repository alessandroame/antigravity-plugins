# Antigravity Plugin: Cognitive Persistence & Project Memory

Plugin per Google Antigravity che implementa la **Triade Cognitiva di Continuità** (`MEMORY.md`, `WORKLOG.md`, `DESIDERATA.md`) per preservare decisioni architetturali, vincoli e lezioni apprese tra diverse sessioni di lavoro.

---

## Componenti

| Componente | Tipo | Scopo |
| :--- | :--- | :--- |
| [`rules/AGENTS.md`](./rules/AGENTS.md) | Regola attiva | Prescrive la disciplina di conservazione della memoria di progetto, la triade dei file e l'obbligo di aggiornamento a fine task. |
| [`skills/memory-sync`](./skills/memory-sync) | Skill on-demand | Procedura operativa per scrivere frammenti ADR in `.agents/worklog.d/`, consolidare `WORKLOG.md` e mantenere allineati `MEMORY.md` e `DESIDERATA.md`. |

---

## Installazione

### Nel Workspace di Progetto
```bash
mkdir -p <percorso-repo>/.agents/plugins
cp -r plugins/cognitive-persistence <percorso-repo>/.agents/plugins/
```

### Globale
```powershell
Copy-Item -Recurse plugins/cognitive-persistence "$env:USERPROFILE\.gemini\config\plugins\"
```

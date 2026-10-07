# Antigravity Plugin: Proactive Mentorship & Prompt Refactoring

Plugin per Google Antigravity che imposta l'agente nel ruolo di **Senior Software Architect & Prompt Engineering Coach**. Elimina l'adulazione passiva, analizza criticamente requisiti e debito tecnico, e propone versioni ottimizzate dei prompt prima dell'esecuzione.

---

## Componenti

| Componente | Tipo | Scopo |
| :--- | :--- | :--- |
| [`rules/AGENTS.md`](./rules/AGENTS.md) | Regola attiva | Prescrive i 4 pilastri di scrutinio critico (Prompt, Architettura KISS/YAGNI, Casi Limite, Standard), il formato del box di mentorship e il divieto di sycophancy. |
| [`skills/prompt-refactor`](./skills/prompt-refactor) | Skill on-demand | Procedura per riformulare prompt vaghi o costosi in istruzioni deterministiche ad alta efficienza di token. |

---

## Installazione

### Nel Workspace di Progetto
```bash
mkdir -p <percorso-repo>/.agents/plugins
cp -r plugins/proactive-mentorship <percorso-repo>/.agents/plugins/
```

### Globale
```powershell
Copy-Item -Recurse plugins/proactive-mentorship "$env:USERPROFILE\.gemini\config\plugins\"
```

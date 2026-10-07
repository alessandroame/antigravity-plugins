# Antigravity Plugin: Execution Guard & Anti-Freeze

Plugin per Google Antigravity progettato per garantire **resilienza operativa, eliminazione degli stalli in background e protezione salva-token** contro i loop agentici ricorsivi.

---

## Componenti

| Componente | Tipo | Scopo |
| :--- | :--- | :--- |
| [`rules/AGENTS.md`](./rules/AGENTS.md) | Regola attiva | Impone l'esecuzione sincrona prioritaria, il divieto di turno passivo senza watchdog, i massimali numerici per i loop e i timeout per gli script Node.js. |
| [`skills/task-watchdog`](./skills/task-watchdog) | Skill on-demand | Procedura operativa per monitorare, diagnosticare e terminare task bloccati in background tramite `manage_task`. |
| [`skills/circuit-breaker`](./skills/circuit-breaker) | Skill on-demand | Protocollo per rilevare errori invarianti, eseguire rollback su regressioni ed escalare all'utente con alternative architetturali. |

---

## Installazione

### Nel Workspace di Progetto
```bash
mkdir -p <percorso-repo>/.agents/plugins
cp -r plugins/execution-guard <percorso-repo>/.agents/plugins/
```

### Globale
```powershell
Copy-Item -Recurse plugins/execution-guard "$env:USERPROFILE\.gemini\config\plugins\"
```

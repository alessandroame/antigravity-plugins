# Starter Plugin Template

Template di riferimento per la creazione di nuovi plugin in Antigravity.

## Struttura

- `plugin.json`: metadati del plugin (nome, versione, prompt consigliati).
- `rules/AGENTS.md`: regole e convenzioni sempre attive con il plugin abilitato.
- `skills/<nome-skill>/SKILL.md`: skill on-demand esposte dal plugin.
- `mcp_config.json` (opzionale): definizione di eventuali server MCP associati.
- `hooks.json` (opzionale): agganci al ciclo di vita dell'agente.

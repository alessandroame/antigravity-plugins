# Engineering Sobriety & Anti-Hype Plugin

Plugin per Google Antigravity progettato per eliminare il linguaggio promozionale, i convenevoli e l'enfasi non tecnica durante le sessioni di pair programming e generazione codice.

## Contenuto del Plugin

- **Regole (`rules/AGENTS.md`)**:
  - Divieto di preamboli ed entusiasmi artificiali.
  - Blacklist terminologica e tabella di sostituzioni obbligatorie.
  - Pilastri di integrità tecnica (zero circular testing, trasparenza immediata sui limiti).
- **Skill (`skills/tone-audit/SKILL.md`)**:
  - Procedura per scansionare e bonificare codebase e documenti da hype, fuffa di marketing e test fittizi.

## Installazione

### Nel singolo workspace / progetto
Copiare la cartella del plugin all'interno della directory `.agents/plugins/` del progetto:
```bash
cp -r plugins/engineering-sobriety <percorso-progetto>/.agents/plugins/
```

### A livello globale (per tutti i progetti)
Copiare la cartella nella configurazione globale di Antigravity:
```bash
cp -r plugins/engineering-sobriety ~/.gemini/config/plugins/
```
*Nota: il riavvio della sessione rende effettivo il caricamento del nuovo plugin.*

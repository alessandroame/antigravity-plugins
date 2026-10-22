---
name: plugin-analytics
description: >-
  Analizza l'utilizzo di Antigravity estraendo metriche dalle sessioni locali (brain/), tempi attivi, token, modelli, plugin e dashboard HTML. Use this skill when the user asks for usage statistics, session analytics, or runs /plugin-analytics.
---

# Antigravity Personal Usage Monitor, Session Backfill & Telemetry Analytics

Questa skill esegue il mining incrementale delle sessioni locali in `~/.gemini/antigravity/brain/` (`transcript.jsonl`) unendole al database della telemetria (`metrics-summary.json`) per generare sia un riepilogo strutturato in chat sia una Dashboard HTML interattiva (`<agent-embed>`).

---

## 1. Quando Attivare Questa Skill
- L'utente chiede di monitorare il proprio uso di Antigravity ("mostrami il mio utilizzo di Antigravity", "quante ore/sessioni ho fatto?", "quali modelli o comandi slash uso di più?").
- L'utente richiede statistiche sull'uso dei plugin, delle skill, dei token/cache o sulla calibrazione ETA.
- Attivabile tramite comando rapido `/plugin-analytics`.

---

## 2. Procedura di Esecuzione (Step-by-Step)

1. **Esecuzione del Backfill + Generazione Report e Dashboard HTML**:
   Eseguire `report.mjs` tramite `run_command` (`WaitMsBeforeAsync: 10000`) passando `--global` e `--html` puntato alla cartella artefatti della conversazione corrente (`<artifact_dir>/antigravity-usage-dashboard.html`):

   ```bash
   node plugins/telemetry-analytics/scripts/report.mjs --global --html "<artifact_dir>/antigravity-usage-dashboard.html"
   ```

   Opzioni aggiuntive supportate:
   - Filtra sugli ultimi `N` giorni: `--days 7` oppure `--days 30`
   - Filtra sul solo workspace corrente: omettere `--global`
   - Forza la rianalisi completa di tutti i `transcript.jsonl` ignorando la cache: `--rebuild`

2. **Registrazione dell'Artefatto e Incorporamento `<agent-embed>`**:
   - L'artefatto generato in `<artifact_dir>/antigravity-usage-dashboard.html` contiene filtri interattivi per periodo (`7g`, `30g`, `Storico`) e per progetto, oltre a 4 tab (`Tempi & Abitudini`, `Token & Modelli`, `Workflow & Plugin`, `Storico Sessioni`).
   - Includere nella risposta il widget interattivo:
     ```html
     <agent-embed src="file:///<artifact_dir>/antigravity-usage-dashboard.html"></agent-embed>
     ```

3. **Presentazione Sobria in Chat (0-Click + `<details>` 1-Click)**:
   - **Livello 0-Click**: 3–5 bullet sintetici con i KPI principali (Sessioni umane vs subagent, Tempo attivo netto e fascia oraria di picco, Token + Cache Hit %, Top Progetti e Comandi Slash).
   - **Livello 1-Click**: racchiudere le tabelle di dettaglio (Ripartizione Progetti, Plugin/Skill, Tool) in un cassetto `<details>` chiuso di default con riga vuota obbligatoria subito dopo `</summary>`.

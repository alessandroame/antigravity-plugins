---
name: plugin-analytics
description: >-
  Analizza l'uso di Antigravity estraendo sessioni locali (brain/), token per prompt, tempi attivi, modelli, plugin e dashboard HTML. Use this skill when the user asks for usage stats, per-prompt token reports, or runs /plugin-analytics.
---

# Antigravity Personal Usage Monitor, Per-Prompt Token Report & Telemetry Analytics

Questa skill esegue il mining incrementale delle sessioni locali in `~/.gemini/antigravity/brain/` (`transcript.jsonl`) unendole al database della telemetria (`metrics-summary.json`) per generare il report dei token per singolo prompt (`Prompt #1..#N`), un riepilogo strutturato in chat e una Dashboard HTML interattiva (`<agent-embed>`).

---

## 1. Quando Attivare Questa Skill
- L'utente chiede di monitorare il proprio uso di Antigravity ("mostrami il mio utilizzo di Antigravity", "quanti token ho consumato per ogni prompt?", "quante ore/sessioni ho fatto?").
- L'utente richiede statistiche sull'uso dei plugin, delle skill, dei token per prompt/cache o sulla calibrazione ETA.
- Attivabile tramite comando rapido `/plugin-analytics`.

---

## 2. Procedura di Esecuzione (Step-by-Step)

1. **Esecuzione del Backfill + Generazione Report (con Token per Prompt) e Dashboard HTML**:
   Eseguire `report.mjs` tramite `run_command` (`WaitMsBeforeAsync: 10000`) passando `--global`, `--session <conversation_id>` (per mostrare il dettaglio `Prompt #1..#N` della sessione attiva) e `--html` puntato alla cartella artefatti della conversazione corrente (`<artifact_dir>/antigravity-usage-dashboard.html`):

   ```bash
   node plugins/telemetry-analytics/scripts/report.mjs --global --session "<conversation_id>" --html "<artifact_dir>/antigravity-usage-dashboard.html"
   ```

   Opzioni aggiuntive supportate:
   - Filtra sugli ultimi `N` giorni: `--days 7` oppure `--days 30`
   - Ispeziona i prompt di una specifica sessione: `--session <id-parziale-o-completo>`
   - Filtra sul solo workspace corrente: omettere `--global`
   - Forza la rianalisi completa di tutti i `transcript.jsonl` ignorando la cache: `--rebuild`

2. **Registrazione dell'Artefatto e Incorporamento `<agent-embed>`**:
   - L'artefatto generato in `<artifact_dir>/antigravity-usage-dashboard.html` contiene filtri interattivi per periodo (`7g`, `30g`, `Storico`) e per progetto, oltre a 5 tab (`Tempi & Abitudini`, `Token & Modelli`, `Token per Prompt`, `Workflow & Plugin`, `Storico Sessioni`).
   - Includere nella risposta il widget interattivo:
     ```html
     <agent-embed src="file:///<artifact_dir>/antigravity-usage-dashboard.html"></agent-embed>
     ```

3. **Presentazione Sobria in Chat (0-Click + `<details>` 1-Click)**:
   - **Livello 0-Click**: 3–5 bullet sintetici con i KPI principali (Sessioni umane vs subagent, Tempo attivo netto e fascia oraria di picco, Token + Cache Hit %, Riepilogo Token per Prompt della sessione attiva).
   - **Livello 1-Click**: racchiudere le tabelle di dettaglio (Tabella `Prompt #1..#N` della sessione, Ripartizione Progetti, Plugin/Skill, Tool) in un cassetto `<details>` chiuso di default con riga vuota obbligatoria subito dopo `</summary>`.

# [2026-10-16] ADR: Governance Anti-Bloat per `DESIDERATA.md`, `NOTES.md` e Storage Telemetria (`events.ndjson` / `.cursor_*`)

## Contesto & Motivazione
Dopo la codifica dei presidi anti-bloat per `MEMORY.md` ($\le 200\text{ righe}$ *in-place* per dominio) e `WORKLOG.md` ($\le 300\text{ righe}$ *Rolling Window + Pointer Index*), l'audit sugli altri file gestiti dai plugin ha evidenziato tre ulteriori punti di crescita illimitata:
1. **`DESIDERATA.md` (`cognitive-persistence`)**: la pratica adottata manualmente in GlideMind (partizionamento *Backlog Attivo* vs *Completate*, celle `Note` $\le 160\text{ caratteri}$ e consolidamento storico in `.agents/archive/DESIDERATA_v<N>_archive.md`) non era ancora prescritta nelle regole e skill del plugin.
2. **`NOTES.md` (`cognitive-persistence`)**: `/take-note` calcolava il prossimo ID `NOTE-XXX` scansionando l'intero file e `/review-notes` manteneva in perpetuo tutte le schede risolte multi-riga nella sezione `Analizzate & Consolidate`, gonfiando il file letto a ogni cattura.
3. **Storage di Telemetria (`telemetry-analytics`)**: `collector.mjs` lasciava sul disco un file `.cursor_<conversationId>.json` permanente per ogni chat e accodava indefinitamente righe a `events.ndjson` senza log rotation.

## Decisioni Architetturali
1. **Governance di `DESIDERATA.md` ($\le 150\text{ righe}$, celle $\le 160\text{ char}$)**:
   - Codificato in `plugins/cognitive-persistence/rules/AGENTS.md`, `skills/memory-sync/SKILL.md`, `skills/next-step/SKILL.md` e `skills/review-notes/SKILL.md` l'obbligo di suddividere `DESIDERATA.md` in `## 1. Backlog Attivo & Funzionalità Pianificate` e `## 2. Funzionalità Completate & Consolidate`, limitando ogni cella `Note` a **160 caratteri** e fissando il tetto a **150 righe** (con archiviazione in `.agents/archive/DESIDERATA_v<N>_archive.md`).
2. **Governance di `NOTES.md` ($\le 120\text{ righe}$, Contatore Header & Tabella Risolte a 1 Riga)**:
   - Introdotto nel template canonico di `skills/take-note/SKILL.md` il metadato di testa `> **Ultimo ID Assegnato**: NOTE-XXX` per la generazione deterministica degli ID senza dipendere dallo storico.
   - Trasformata la sezione `## ✅ Analizzate & Consolidate` in una tabella compatta a 1 riga per nota chiusa (massimo **10 righe**, esito $\le 120\text{ char}$), con rotazione in `.agents/archive/NOTES_archive.md` oltre soglia, e allineato immediatamente `c:\github\glidemind\NOTES.md`.
3. **TTL Garbage Collection (`7gg`) e Log Rotation (`5 MB`) in `telemetry-analytics` v1.5.0**:
   - Esteso `plugins/telemetry-analytics/scripts/collector.mjs` (`pruneStaleStateAndRotateLogs`) affinché sul trigger `--finalize` (`Stop`) elimini i file `.cursor_*.json` e `.eta_*.json` con `mtime > 7 giorni` e ruoti `events.ndjson` in `events.archive.ndjson` al superamento di **5 MB**.
4. **Validazione Statica (`scripts/validate.mjs --all`)**:
   - Aggiunto il controllo automatico sul tetto di 150 righe per `DESIDERATA.md` e 120 righe per `NOTES.md`.

## Impatto e Conseguenze
- **Plugin aggiornati**: `cognitive-persistence` (`v1.4.0`), `telemetry-analytics` (`v1.5.0`) e validatore `scripts/validate.mjs`.
- **Copertura completa**: Tutti i file persistenti creati o aggiornati dai plugin dispongono ora di limiti quantitativi espliciti e meccanismi automatici di rotazione.

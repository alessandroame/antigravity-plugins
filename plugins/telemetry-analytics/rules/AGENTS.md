# Regole di Telemetria, Stima ETA In-Flight e Riservatezza Dati (`telemetry-analytics`)

Definisce i criteri per le metriche di utilizzo, il badge di stima ETA complessiva e la riservatezza dei dati locali.

## 1. Stima ETA Complessiva (`【🟢/🟡/🔴 ETA tot ~Ns】`)
L'ETA indica **il tempo residuo per completare l'intera lavorazione richiesta dall'utente**:
- `【🟢 ETA tot ~15s】` (Fascia Breve: `15–20s`) · `【🟡 ETA tot ~40s】` (Fascia Media: `21–60s`) · `【🔴 ETA tot ~90s】` (Fascia Lunga: `> 60s`).
1. **Quando Emettere**: silenzio al 1° turno esplorativo, su `ask_question` o per task `< 15s`. Entro il **2° turno operativo** (se residuo `>= 15s`), emettere il badge.
2. **Ancoraggio sui Tool Visibili**: scrivere il badge in `toolSummary` di un singolo tool del turno (sul primo `edit_file`, `write_file` o `run_command`, poiché i `read_file` vengono collassati in `Explored N files >`). Non stampare righe `[ETA...]` nel testo della chat.
3. **Baseline**: lettura/ricerca `3–5s`; modifica file `6–10s`; comandi/test `8–20s`; sintesi finale `5–8s`.

## 2. Sobrietà Metrica e Governance Locale (`~/.gemini/antigravity/analytics/`)
1. **Misurazioni Oggettive**: riportare tempi reali (`ms`/`s`, `calls`, `tokens`) e dichiarare apertamente i fallimenti dei tool.
2. **Riservatezza e Rotazione**: tutti i dati restano in locale. `collector.mjs` applica il TTL Garbage Collection (`7 giorni`) sui cursori `.cursor_*`/`.eta_*` e ruota `events.ndjson` in `events.archive.ndjson` oltre **5 MB**.

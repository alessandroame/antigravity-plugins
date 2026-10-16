# 2026-10-16 — Formato Ad Alto Contrasto "Badge + Semaforo" (`【🟢/🟡/🔴 ETA tot ~Ns】`) in `telemetry-analytics` v1.5.0

- **Tipo**: Telemetria & Ergonomia Visiva In-Flight (`plugins/telemetry-analytics`)
- **Contesto**:
  - I campi `toolAction` e `toolSummary` dei tool in Antigravity sono renderizzati dal frontend come nodi di testo puro (`textContent`), ignorando tag HTML (`<span style="...">`), CSS inline o sequenze di escape ANSI.
  - Il precedente separatore `· ETA tot ~Ns` rischiava di confondersi visivamente con la descrizione testuale dell'azione del tool.
- **Decisioni**:
  - Introdotto in [`plugins/telemetry-analytics/rules/AGENTS.md`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/rules/AGENTS.md) il formato **Badge + Semaforo** `【🟢/🟡/🔴 ETA tot ~Ns】` basato su parentesi lenticolari piene `【...】` e indicatori cromatici semantici di durata (ammessi dalla regola di sobrietà in quanto indicatori funzionali di stato):
    - `🟢` Fascia Breve ($15\text{s} \le \text{ETA} \le 20\text{s}$)
    - `🟡` Fascia Media ($21\text{s} \le \text{ETA} \le 60\text{s}$)
    - `🔴` Fascia Lunga ($\text{ETA} > 60\text{s}$)
  - Estese le regex di estrazione in [`plugins/telemetry-analytics/scripts/collector.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/collector.mjs) (`extractDeclaredEtaMs`) e [`plugins/telemetry-analytics/scripts/eta-injector.mjs`](file:///c:/github/antigravity-plugins/plugins/telemetry-analytics/scripts/eta-injector.mjs) (`parseEtaSecondsFromToolCalls`) con flag Unicode `/iu` per supportare sia il formato `【🟢/🟡/🔴 ETA tot ~Ns】` (anche qualora `ETA tot` fosse abbreviato) sia i formati precedenti.
  - Aggiornato `plugins/telemetry-analytics/plugin.json` alla versione `1.5.0` e sincronizzata l'installazione globale tramite `npm run sync`.
- **Impatto**:
  - Massima visibilità cromatica e geometrica della stima ETA all'interno delle pill dei tool senza rompere il rendering plain-text di Antigravity.

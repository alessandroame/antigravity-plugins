# Protocollo di Valutazione Cieca A/B per Prompt, Skill e Plugin (`/ab-bench`)

Governa il confronto empirico alla cieca tra un prompt di controllo (**Sfidante A — Base**) e una variante potenziata (**Sfidante B — Trattamento**) tramite il **Test delle 5 Dita** e il rapporto tempo/beneficio.

## 1. Dormienza Predefinita e Trigger (`/ab-bench`)
1. **Inattivo di Default (`OFF`)**: dormiente finché l'utente non invoca `/ab-bench` o chiede un confronto A/B.
2. **Zero-Config Default**:
   - `/ab-bench <compito>`: confronta **Senza `/skizzo` (Controllo)** vs **Con `/skizzo` (Dual-Track)**.
   - `/ab-bench --skill <nome> <compito>`: confronta **Senza `<nome>`** vs **Con `<nome>`**.
   - `/ab-bench "<Prompt A>" vs "<Prompt B>"`: confronta le due formulazioni.
   - `/ab-bench --stats`: bilancio storico da `~/.gemini/antigravity/analytics/ab-bench-history.ndjson`.

## 2. Protocollo Cieco e Test delle 5 Dita
1. **Isolamento & Anonimizzazione (`Soluzione X` vs `Soluzione Y`)**: `A` e `B` girano in subagent isolati; `scripts/bench.mjs` rimuove firme/link e assegna le etichette cieche `Soluzione X`/`Y` prima del **Subagent Giudice Cieco** (vietato l'autogiudizio del padre).
2. **Scala Binaria (`0` o `1` per Dito, Totale `0..5`, vietati decimali o pareggi)**:
   - **Pollice (`Va al primo colpo`)**: zero errori di sintassi, crash o `TODO` incompleti.
   - **Indice (`Meno click / fatica`)**: minimo numero di passaggi manuali per l'utente.
   - **Medio (`Tolleranza input sporchi`)**: normalizza spazi extra, separatori misti e formati imperfetti.
   - **Anulare (`Tenuta casi limite`)**: gestisce input vuoti, valori estremi e viewport `360px` senza rompersi.
   - **Mignolo (`Logica pulita / separata`)**: motore di calcolo isolato dalla UI e verificato da test.
3. **Verdetto sul Tempo (Rasoio di Occam, tempi estratti da `transcript.jsonl` via `bench.mjs`)**:
   - `Dita(B) > Dita(A)` -> **SÌ, VALEVA LA PENA** (`Vince B`, indicando dita guadagnate e delta secondi).
   - `Dita(B) == Dita(A)` -> **NO, TEMPO SPRECATO** (`Vince A`, stesse dita in meno tempo/step).
   - `Dita(B) < Dita(A)` -> **NO, DANNO DA OVER-ENGINEERING** (`Vince A`).

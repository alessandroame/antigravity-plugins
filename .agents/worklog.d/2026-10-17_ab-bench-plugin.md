# 2026-10-17 — Creazione Plugin `ab-bench` v1.0.0 (Sfida Cieca A/B su 5 Dita con Giudice Cieco e Rasoio di Occam)

## Contesto
Per valutare in modo oggettivo se un prompt potenziato da una skill o plugin (es. `/skizzo`) produca un valore reale superiore rispetto a un prompt semplice di controllo, occorreva uno strumento generalizzabile che eliminasse il bias di conferma e tenesse conto del costo in tempo e step.

## Decisioni Architetturali (Eseguite in Modalità `/skizzo` Dual-Track)
1. **Contratto di Dominio (`Subagent Beta`) — Zero-Config & Test delle 5 Dita**:
   - Comando `/ab-bench <compito>` che assume automaticamente il confronto `Senza /skizzo` vs `Con /skizzo`, estendibile a qualsiasi skill (`/ab-bench --skill <nome> <compito>`) o coppia di prompt (`/ab-bench "A" vs "B"`).
   - Valutazione binaria stretta (`0` o `1`, totale `0..5`) sulle **5 Dita ("Uomo della Pietra")**: *1. Pollice (Va al primo colpo)*, *2. Indice (Meno click/fatica)*, *3. Medio (Tolleranza input sporchi)*, *4. Anulare (Tenuta casi limite)*, *5. Mignolo (Logica pulita/separata)*.
   - **Rasoio di Occam sul Tempo**: a parità di dita (`scoreB === scoreA`), vince la soluzione più semplice/veloce (`NO, TEMPO SPRECATO`).
2. **Architettura Headless (`Subagent Alpha`) — `plugins/ab-bench/scripts/bench.mjs`**:
   - Parsing resiliente di `transcript.jsonl` (`parseTranscriptMetrics`), sanitizer anti-bias (`sanitizeForBlindJudge`), assegnazione cieca deterministica SHA-256 (`createBlindAssignment` in `Soluzione X` e `Soluzione Y`), rotazione di `ab-bench-history.ndjson` oltre `5 MB` e aggregazione $O(N)$ per `/ab-bench --stats`.

## Impatto e Verifica (Doppio Oracolo)
- Creato e sincronizzato fisicamente `plugins/ab-bench/` in `~/.gemini/config/plugins/ab-bench/`.
- Superati **12/12 test** in `plugins/ab-bench/tests/bench.test.mjs` (`Oracolo Alpha: 6/6 PASS` | `Oracolo Beta: 6/6 PASS`) e validazione statica `scripts/validate.mjs --all` (`12 plugin verificati | 0 errori | 0 avvisi`).

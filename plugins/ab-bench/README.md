# A/B Bench & Discovery Loop (`ab-bench` v1.1.0) — Valutazione Cieca e Scoperta Guidata da Oracoli

Plugin pure-skill (`0` byte inline in `rules/AGENTS.md`) per Google Antigravity che integra due capacità complementari on-demand:
1. **`/ab-bench`**: confronto empirico alla cieca A/B (**Controllo A** vs **Trattamento B**, es. senza `/skizzo` vs con `/skizzo`) usando il **Test delle 5 Dita ("Uomo della Pietra")** e metriche fisiche estratte dai `transcript.jsonl`.
2. **`/discovery-loop`**: esplorazione multi-ondata guidata da oracoli (`Mutazione -> 4 Oracoli -> Frontiera di Pareto`) in worktree isolati (`run_workflow`), governata da una **politica di uscita composita a 5 condizioni (`OR`)** con 3 profili (`quick`, `deep`, `overnight`) senza mai alterare `main` prima della scelta umana.

---

## 1. Caratteristiche Principali

- **Zero-Config Default (`/ab-bench <prompt>`)**: lancia automaticamente la sfida tra esecuzione standard (senza `/skizzo`) ed esecuzione dialettica (`/skizzo`), senza chiedere parametri manuali.
- **Generalizzabile a Qualsiasi Skill o Prompt**:
  - `/ab-bench --skill <nome-skill> <prompt>`: misura il valore aggiunto di qualsiasi skill installata.
  - `/ab-bench "<Prompt A>" vs "<Prompt B>"`: confronta due formulazioni diverse di un prompt.
- **Discovery Loop (`/discovery-loop`) & Politica di Uscita Composita**:
  - **3 Archetipi Mutatori Agnostici al Dominio**: *Utente Distratto* (lettura cieca in `3-5s`), *Abolizionista* (taglio `40-50%` di superficie/controlli), *Scettico/Fuzzer* (modello nullo + casi limite).
  - **4 Oracoli Bloccanti**: Empirico (dati reali), Invarianza/Fuzzing, Cognitivo Cieco, Tecnico & 5 Dita (`/ab-bench`).
  - **5 Condizioni di Arresto (`OR`)**: `PARETO_CONVERGED`, `TARGET_SATISFICED`, `RESOURCE_BUDGET_REACHED`, `YIELD_COLLAPSE`, `WALL_CLOCK_CAP` (il tempo è solo un tetto massimo di sicurezza nei profili `quick` `20m`, `deep` `60m`, `overnight` `120m`).
- **Anonimizzazione Anti-Bias (`Soluzione X` vs `Soluzione Y` / `Candidato A..Z`)**: rimuove banner, archetipi mutatori, branch e firme dei plugin prima del Giudice Cieco.
- **Test delle 5 Dita + Rasoio di Occam**: punteggio binario intero (`0..5`) su *Pollice*, *Indice*, *Medio*, *Anulare*, *Mignolo*.
- **Storico Persistente (`/ab-bench --stats`)**: salva ogni sfida in `~/.gemini/antigravity/analytics/ab-bench-history.ndjson` (rotazione a `5 MB`).

---

## 2. Struttura del Plugin (`0 B` inline)

- `plugin.json`: manifesto del plugin (`v1.1.0`).
- `core/discovery-engine.mjs`: motore headless puro (zero DOM/FS/rete) per contratti brief, deduplica Jaccard, sanificazione anti-bias, gate a 4 oracoli, frontiera di Pareto e politica di uscita composita.
- `skills/ab-bench/SKILL.md`: runbook operativo a 4 fasi per `/ab-bench`.
- `skills/discovery-loop/SKILL.md` + `references/discovery-contracts.md`: runbook e contratti JSON per `/discovery-loop`.
- `references/discovery_workflow_template.py`: template Python per `run_workflow` (`parallel`, `workspace="share"`, `phase`).
- `scripts/bench.mjs`: motore CLI Node.js per parsing `transcript.jsonl`, anonimizzazione SHA-256, verdetto sulle 5 dita e aggregazione storico.
- `scripts/discovery.mjs`: CLI Node.js per `--init-brief`, `--dedupe`, `--check-stop`, `--sanitize-batch`, `--evaluate` e `--pilot-demo`.
- `tests/bench.test.mjs` & `tests/discovery-engine.test.mjs`: suite di test offline (`Oracolo Alpha` + `Oracolo Beta`).

---

## 3. Comandi CLI & Verifica

```bash
# Eseguire le test suite complete (bench + discovery-engine)
node --test plugins/ab-bench/tests/bench.test.mjs plugins/ab-bench/tests/discovery-engine.test.mjs

# Visualizzare il bilancio storico delle sfide A/B
node plugins/ab-bench/scripts/bench.mjs --stats

# Eseguire la demo offline deterministica del ciclo Discovery Loop
node plugins/ab-bench/scripts/discovery.mjs --pilot-demo --markdown
```

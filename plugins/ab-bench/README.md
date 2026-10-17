# A/B Bench (`ab-bench`) — Valutazione Cieca Prompt, Skill e Plugin

Plugin di benchmarking empirico per Google Antigravity che confronta alla cieca due approcci sullo stesso compito (**Controllo A** vs **Trattamento B**, es. senza `/skizzo` vs con `/skizzo`) usando il **Test delle 5 Dita ("Uomo della Pietra")** e metriche fisiche estratte dai `transcript.jsonl`.

---

## 1. Caratteristiche Principali

- **Zero-Config Default (`/ab-bench <prompt>`)**: lancia automaticamente la sfida tra esecuzione standard (senza `/skizzo`) ed esecuzione dialettica (`/skizzo`), senza chiedere parametri manuali.
- **Generalizzabile a Qualsiasi Skill o Prompt**:
  - `/ab-bench --skill <nome-skill> <prompt>`: misura il valore aggiunto di qualsiasi skill installata.
  - `/ab-bench "<Prompt A>" vs "<Prompt B>"`: confronta due formulazioni diverse di un prompt.
- **Anonimizzazione Anti-Bias (`Soluzione X` vs `Soluzione Y`)**: rimuove banner e firme dei plugin prima di sottoporre gli output al Subagent Giudice Cieco.
- **Test delle 5 Dita + Rasoio di Occam**: punteggio binario intero (`0..5`) su *Pollice* (va al primo colpo), *Indice* (meno click/fatica), *Medio* (tolleranza input sporchi), *Anulare* (tenuta casi limite), *Mignolo* (logica pulita/separata). A parità di dita vince sempre la soluzione più rapida e snella.
- **Storico Persistente (`/ab-bench --stats`)**: salva ogni sfida in `~/.gemini/antigravity/analytics/ab-bench-history.ndjson` (con rotazione automatica a `5 MB`) per mostrare il tasso di vittoria reale nel tempo.

---

## 2. Struttura del Plugin

- `plugin.json`: manifesto del plugin.
- `rules/AGENTS.md`: regole di dormienza predefinita, cecità del giudizio e scala binaria 0/1.
- `skills/ab-bench/SKILL.md`: runbook operativo a 4 fasi per `/ab-bench`.
- `scripts/bench.mjs`: motore headless puro e CLI Node.js per parsing `transcript.jsonl`, anonimizzazione SHA-256, verdetto sulle 5 dita e aggregazione storico.
- `tests/bench.test.mjs`: suite di test unitari e di dominio (`Oracolo Alpha` + `Oracolo Beta`).

---

## 3. Comandi CLI & Verifica

```bash
# Eseguire la test suite completa (Oracolo Alpha + Oracolo Beta)
node --test plugins/ab-bench/tests/bench.test.mjs

# Visualizzare il bilancio storico delle sfide
node plugins/ab-bench/scripts/bench.mjs --stats
```

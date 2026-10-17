# Protocollo di Valutazione Cieca A/B per Prompt, Skill e Plugin (`/ab-bench`)

Governa il confronto empirico alla cieca tra un prompt di controllo (**Sfidante A — Base**) e una variante potenziata con plugin, skill o riformulazione (**Sfidante B — Trattamento**), misurando il valore reale tramite il **Test delle 5 Dita** e il rapporto tempo/beneficio.

---

## 1. Clausola di Dormienza Predefinita e Trigger (`/ab-bench`)

1. **Inattivo di Default (`OFF`)**:
   - A inizio sessione il plugin è dormiente e non altera il flusso standard né avvia subagent finché l'utente non invoca `/ab-bench` o chiede esplicitamente un confronto A/B tra prompt/plugin.
2. **Zero-Config Default (Legge di Tesler & Postel)**:
   - `/ab-bench <compito>`: confronta automaticamente **Senza `/skizzo` (Controllo)** vs **Con `/skizzo` (Dual-Track)** senza richiedere flag aggiuntivi.
   - `/ab-bench --skill <nome> <compito>`: confronta **Senza `<nome>`** vs **Con `<nome>`**.
   - `/ab-bench "<Prompt A>" vs "<Prompt B>"`: confronta direttamente le due formulazioni.
   - `/ab-bench --stats`: mostra il bilancio storico aggregato da `~/.gemini/antigravity/analytics/ab-bench-history.ndjson`.

---

## 2. Invarianti del Protocollo Cieco e Test delle 5 Dita

1. **Isolamento Parallelo & Anonimizzazione (`Soluzione X` vs `Soluzione Y`)**:
   - I due sfidanti (`A` e `B`) vengono eseguiti in subagent isolati.
   - Prima di sottoporre gli output al **Subagent Giudice Cieco**, lo script `scripts/bench.mjs` rimuove qualsiasi firma o banner del plugin (es. `MODALITÀ SKIZZO ATTIVA` o link `conversation://`) e assegna in modo crittografico le etichette anonime `Soluzione X` e `Soluzione Y`.
2. **Scala Binaria delle 5 Dita (`0` o `1` per Dito, Totale `0..5`)**:
   - Vietati voti decimali, scale `1..10` o pesi arbitrari. Il Giudice Cieco assegna solo `1` (SÌ) o `0` (NO) su:
     1. **Pollice (`Va al primo colpo`)**: zero errori di sintassi, crash o `TODO` incompleti.
     2. **Indice (`Meno click / fatica`)**: minimo numero di passaggi manuali e scelte per l'utente.
     3. **Medio (`Tolleranza input sporchi`)**: normalizza spazi extra, separatori misti e formati imperfetti.
     4. **Anulare (`Tenuta casi limite`)**: gestisce input vuoti, valori estremi e schermi ridotti (`360px`) senza rompersi.
     5. **Mignolo (`Logica pulita / separata`)**: motore di calcolo isolato dalla UI e verificato da test.
3. **Regola del Verdetto sul Tempo (Rasoio di Occam)**:
   - **Se `Dita(B) > Dita(A)`**: **SÌ, VALEVA LA PENA** (`Vince B` indicando quali dita sono state guadagnate e il delta tempo in secondi).
   - **Se `Dita(B) == Dita(A)`**: **NO, TEMPO SPRECATO** (`Vince A` perché ottiene le stesse dita in meno tempo/step).
   - **Se `Dita(B) < Dita(A)`**: **NO, DANNO DA OVER-ENGINEERING** (`Vince A`).

---

## 3. Tabella di Anti-Razionalizzazione

| Razionalizzazione Vietata | Vincolo Inaggirabile (Rebuttal) |
| :--- | :--- |
| *"Giudico io stesso A e B senza lanciare il Subagent Giudice Cieco."* | Il giudizio deve provenire da un subagent indipendente su output anonimizzati (`Soluzione X`/`Y`). |
| *"Assegno 4.5/5 o dichiaro un pareggio diplomatico."* | Ogni dito vale solo `0` o `1`; a parità di dita vince sempre la soluzione più semplice/veloce (`A`). |
| *"Stimo a occhio i tempi e gli step senza eseguire `bench.mjs`."* | Tempi (`durationMs`) e step devono essere estratti dai file `transcript.jsonl` tramite `scripts/bench.mjs`. |

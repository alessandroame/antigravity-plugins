---
name: skill-token-optimizer
description: Ottimizza il consumo di token di una skill: condensa la description per il system prompt e scompone file monolitici in references, examples e scripts.
---

# Procedura di Ottimizzazione del Budget Token delle Skill

Questa skill guida l'agente nella rifattorizzazione di skill pesanti o monolitiche per minimizzare il consumo di token sia nel system prompt globale sia nel corpo del runbook on-demand.

---

## 1. Diagnosi del Consumo Token

Eseguire l'ispezione preliminare del file `SKILL.md`:
1. **Misurazione Frontmatter**:
   - Estrarre il blocco `description` e calcolarne la lunghezza in caratteri.
   - *Soglia critica*: Se supera i 250 caratteri, deve essere condensata.
2. **Misurazione Corpo del Runbook**:
   - Contare il numero di righe complessive del file.
   - *Soglia critica*: Se supera le 200 righe, identificare blocchi informativi candidati alla modularizzazione.

---

## 2. Fase 1: Compressione del Frontmatter (System Prompt Economy)

La `description` deve contenere solo le informazioni strettamente necessarie al motore di routing per decidere l'attivazione della skill:

### Schema di Riscrittura Ottimizzata:
```yaml
---
name: <kebab-case-name>
description: <Azione principale in 10-15 parole>. Use this skill when <condizione/trigger 1>, <trigger 2> or <trigger 3>.
---
```

### Regole di Compressione:
- Eliminare spiegazioni introduttive ("Questa skill è stata creata per permettere all'utente di...").
- Eliminare dettagli implementativi ("Utilizza la libreria X con il comando Y passando il parametro Z").
- Mantenere le parole chiave discriminanti e i casi d'uso concreti.

---

## 3. Fase 2: Scomposizione Architetturale a Divulgazione Progressiva

Quando `SKILL.md` supera le 200 righe, scorporare i contenuti secondo la seguente tassonomia:

```text
skills/<nome-skill>/
├── SKILL.md                   # Solo la procedura sequenziale essenziale (< 150 righe)
├── references/                # Consultati solo se l'agente necessita approfondimenti
│   ├── api-catalog.md         # Liste esaustive di endpoint, tabelle dati, schemi
│   └── architecture-notes.md  # Dettagli di design e vincoli
├── examples/                  # Consultati solo se l'utente richiede esempi
│   └── sample-usage.md        # Snippet di codice complessi, template, Before/After
└── scripts/                   # Script eseguibili dal terminale
    └── helper.mjs             # Automazioni complesse che risparmiano token di generazione
```

### Procedura di Scorporo:
1. Creare la directory target (`references/` o `examples/`) all'interno della cartella della skill.
2. Trasferire i blocchi di testo estesi, le tabelle di riferimento e i lunghi snippet di codice nei file dedicati.
3. Sostituire in `SKILL.md` il contenuto rimosso con un'istruzione di consultazione on-demand:
   ```markdown
   > Per consultare il catalogo completo dei parametri o esempi dettagliati:
   > leggere `references/api-catalog.md` con il tool `view_file`.
   ```

---

## 4. Fase 3: Riorganizzazione del Runbook Essenziale

Il file `SKILL.md` risultante deve contenere solo:
1. **Scopo Sintetico** (1 paragrafo).
2. **Pre-requisiti e Dipendenze** (elenco puntato).
3. **Flusso Operativo Numerato** (Step 1 $\to$ Step 2 $\to$ Step 3 con comandi diretti).
4. **Criteri di Validazione ed Expected Output**.
5. **Riferimenti ai file ausiliari**.

---

## 5. Verifica e Collaudo Finale

1. Verificare che i file creati abbiano percorsi validi e che i link interni funzionino.
2. Eseguire la suite di conformità del repository:
   ```bash
   npm test
   ```
3. Mostrare all'utente il bilancio Before vs After:
   - Caratteri della description risparmiati nel system prompt.
   - Righe di `SKILL.md` ridotte e file modulari generati.

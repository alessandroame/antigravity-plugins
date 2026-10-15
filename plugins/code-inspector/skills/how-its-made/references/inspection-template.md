# Template Canonico di Output per `/how-its-made`

Utilizza questa struttura Markdown per rispondere alle richieste di verifica a livello di codice di una funzionalità, garantendo scritte a grandezza 100% e bivi immediatamente leggibili.

---

```markdown
## Ispezione Flusso: `<Nome Funzionalità o Simbolo>`

**Sintesi Tecnica**: <1-2 frasi asciutte che descrivono cosa fa la funzionalità, dove entra e quale risultato produce>.

### 1. Mappa Interattiva dei Rami e dei Bivi (Ingresso -> Processo -> Uscita)

*(Genera prima il file `<artifact_dir>/flow-inspector-<slug>.html` a partire da [`references/flow-widget-template.html`](./flow-widget-template.html) con `UserFacing: true`, quindi incorporalo con `<agent-embed>`)*:

<agent-embed src="file:///<artifact_dir>/flow-inspector-<slug>.html"></agent-embed>

| Fase | Tipo | Simbolo e Riferimento | Ruolo nel Flusso |
| :--- | :---: | :--- | :--- |
| **Punto di Ingresso** | `[ENTRY]` | [`funzioneIngresso()`](file:///percorso/assoluto/file.js#L10-L22) | Riceve il trigger e avvia l'esecuzione. |
| **Step 1** | `[PURE]` | [`trasformaDati()`](file:///percorso/assoluto/core.js#L30-L55) | Normalizza e calcola il modello derivato. |
| **Step 2** | `[STATE]` / `[I/O]` | [`persistiStato()`](file:///percorso/assoluto/store.js#L12-L40) | Aggiorna lo stato e salva su storage. |
| **Punto di Uscita** | `[EXIT]` | [`funzioneIngresso()`](file:///percorso/assoluto/file.js#L20-L22) | Restituisce l'esito o emette l'evento finale. |

---

### 2. Guardie (Early Returns) ed Evoluzione del Payload

#### Guardie e Condizioni di Sbarramento
- **Guardia 1** ([`file.js:L12-L14`](file:///percorso/assoluto/file.js#L12-L14)): se `<condizione>` è vera, interrompe l'esecuzione restituendo `<valore/errore>` senza invocare il processo.

#### Tracciamento del Payload (Data Shape Evolution)
1. **Input Grezzo (`[ENTRY]`)**: `{ rawField: string, options?: object }`
2. **Stato Normalizzato (`[PURE]`)**: `{ normalizedId: string, timestamp: number, valid: true }`
3. **Output Finale (`[EXIT]`)**: `{ status: 'saved', recordId: string }`

---

### 3. Codice Coinvolto (Selettori a Espansione)

<details>
<summary><strong>Ingresso [ENTRY] — funzioneIngresso() (file.js:L10-L22)</strong></summary>

Sorgente: [`file.js:L10-L22`](file:///percorso/assoluto/file.js#L10-L22)

```javascript
// Snippet esatto (10-35 righe) del punto di ingresso e delle guardie
```

</details>

<details>
<summary><strong>Step 1 [PURE] — trasformaDati() (core.js:L30-L55)</strong></summary>

Sorgente: [`core.js:L30-L55`](file:///percorso/assoluto/core.js#L30-L55)

```javascript
// Snippet esatto (10-35 righe) della trasformazione pura
```

</details>

<details>
<summary><strong>Step 2 & Uscita [STATE / EXIT] — persistiStato() (store.js:L12-L40)</strong></summary>

Sorgente: [`store.js:L12-L40`](file:///percorso/assoluto/store.js#L12-L40)

```javascript
// Snippet esatto (10-35 righe) della mutazione e del punto di uscita
```

</details>

---

### 4. Stato di Verifica e Copertura Test

- **Test Attivi**:
  - [`feature.test.js:L15-L48`](file:///percorso/assoluto/tests/feature.test.js#L15-L48): verifica il flusso nominale (Happy Path).
- **Rami Scoperti / Punti di Attenzione**:
  - `<Indicazione esplicita di eventuali guardie o errori I/O privi di test dedicati>`.
```

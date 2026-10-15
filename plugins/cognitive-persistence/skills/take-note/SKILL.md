---
name: take-note
description: Cattura pensieri e osservazioni in NOTES.md a zero cambio di contesto senza interrompere il task attivo. Use this skill when the user runs /take-note or asks to jot down notes for later analysis.
---

# Take Note: Runbook di Cattura In-Flight a Zero Context-Switch

## 1. Obiettivo e Guardia di Isolamento

Registrare istantaneamente nel file `NOTES.md` (alla radice del workspace) pensieri, dubbi di UX, idee o anomalie emerse mentre l'utente usa l'applicazione o mentre è aperta una lavorazione in corso (`🟡 In Lavorazione`).

### Guardia Rigida Anti-Analisi Prematura (Mandatory Constraint)
1. **Zero Ispezione Codice**: Durante l'esecuzione di `/take-note` è **tassativamente vietato** invocare tool di esplorazione o modifica del codice sorgente applicativo (`view_file` su file di codice, `grep_search`, `find_by_name`, `replace_file_content` su sorgenti).
2. **Unici File Autorizzati**: L'agente può leggere/scrivere esclusivamente `NOTES.md` e leggere `DESIDERATA.md` (solo per estrarre il nome dell'eventuale task `🟡 In Lavorazione`).
3. **Zero Ipotesi Risolutive**: Non formulare diagnosi, non proporre fix e non discutere il merito tecnico della nota. La lavorazione attualmente aperta potrebbe modificare i moduli interessati rendendo precoce qualsiasi analisi.

---

## 2. Flusso Operativo Passo-Passo

### Step 1: Parsing dell'Input (Singola Nota o Batch Multi-Nota)
1. Estrai il testo fornito dall'utente dopo `/take-note` (o nel messaggio di richiesta).
2. Se l'utente ha incollato più pensieri distinti (separati da righe vuote o elenchi puntati), suddividili in annotazioni atomiche indipendenti, conservando per ciascuna il **testo originale esatto (verbatim)** senza alterarne il lessico.
3. Se il comando `/take-note` viene invocato senza testo, chiedi in una sola riga: *"Scrivi pure il pensiero o l'elenco di note da registrare in `NOTES.md`."*

### Step 2: Rilevamento Passivo del Contesto Attivo (`DESIDERATA.md`)
1. Se esiste `DESIDERATA.md` alla radice del workspace, verifica se è presente una riga con stato `🟡 In Lavorazione`.
2. Registra il nome di tale lavorazione come metadato `Lavorazione Attiva al Momento della Nota` (oppure `Nessun task attivo in lavorazione` se non ci sono task `🟡`). Questo metadato servirà a `/review-notes` per verificare se il lavoro in corso ha influenzato l'oggetto della nota.

### Step 3: Persistenza Strutturata in `NOTES.md`
1. Leggi `NOTES.md` alla radice del workspace (se non esiste, crealo con l'intestazione standard riportata nella sezione 3).
2. Calcola il prossimo identificativo univoco `NOTE-XXX` (es. `NOTE-001`, `NOTE-002`) cercando il numero più alto già presente nell'intero file `NOTES.md` (sia nella sezione `📥 Da Analizzare` sia nella sezione `✅ Analizzate & Consolidate`, così da non riutilizzare mai ID storici).
3. Appendi la nuova scheda (o le nuove schede) in fondo alla sezione `## 📥 Da Analizzare (Open)`.

### Step 4: Conferma Ultra-Compatta e Ripresa Lavorazione
1. Rispondi all'utente con una conferma sintetica (massimo 2-3 righe o micro-tabella con `ID` e `Titolo`):
   - Esempio: `Registrata [NOTE-004] in NOTES.md (analisi differita a /review-notes).`
2. Se nella sessione corrente era in corso un task operativo, **riprendi immediatamente** il passo successivo di quel task senza attendere ulteriori conferme.

---

## 3. Template Canonico di `NOTES.md`

```markdown
# Annotazioni & Pensieri in Corso d'Opera (NOTES)

Buffer di cattura rapida a zero cambio di contesto (`/take-note`). Le osservazioni qui raccolte non sono ancora state analizzate sul codice: utilizza `/review-notes` a lavorazione conclusa per mostrarle, eseguire il task di analisi approfondita e promuoverle in `DESIDERATA.md`.

---

## 📥 Da Analizzare (Open)

### [NOTE-001] <Titolo sintetico max 8 parole>
- **Stato**: `📥 Da Analizzare`
- **Data Cattura**: YYYY-MM-DD HH:mm
- **Lavorazione Attiva al Momento della Nota**: <Nome Task 🟡 In Lavorazione oppure "Nessuna">
- **Ambito Presunto**: <Componente o vista citata, dedotta dal solo testo>
- **Testo Originale**:
  > <Testo verbatim dell'utente>

---

## ✅ Analizzate & Consolidate (Resolved)
```

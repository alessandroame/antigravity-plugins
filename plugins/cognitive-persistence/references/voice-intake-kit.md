# Kit di Cattura Vocale Guidata (Gemini Live, Anti-Keep Guard & Google AI Studio)

Questo kit permette di dettare e rifinire idee o attività a voce (mentre cammini o guidi) per **qualsiasi tuo progetto software**, trasformando un pensiero abbozzato in una scheda pronta per [`/review-notes`](../skills/review-notes/SKILL.md) o [`/next-step`](../skills/next-step/SKILL.md).

---

## 1. Perché Gemini Live Apre Google Keep o Ignora le Istruzioni (Diagnosi & Rimedio)

> [!WARNING]
> **Le 2 Trappole dell'App Gemini su Smartphone (e come evitarle)**:
> 1. **Le parole `"Nota"`, `"Segna"`, `"Task"` e `"Salva"` attivano Google Keep**: su Android/iOS, appena pronunci la parola *"nota"* o *"salva"*, il router interno di Gemini intercetta l'audio e avvia l'estensione **Google Keep / Google Tasks** *prima* ancora di leggere le tue istruzioni.
> 2. **Gemini Live è solo audio e non stampa blocchi di codice finché la chiamata è aperta**: se incolli un prompt nella chat e poi apri Gemini Live, durante l'audio lui risponde a voce ma non può disegnare riquadri di codice finché non chiudi il Live.

### Come Evitare l'Intercettazione mantenendo Google Keep Attivo per l'Uso Personale

1. **Parola Chiave "Modalità Skizzo" + Vincolo Scoped su Keep in `Informazioni salvate`**:
   - Avviando il discorso con **"Modalità Skizzo"** (evitando *"fai una nota"*), **puoi lasciare l'estensione Google Keep ATTIVA** per le tue note personali o della spesa.
   - Il divieto `"in questa modalità non salvare nulla su Google Keep"` scritto dentro la regola di *Modalità Skizzo* serve solo a proteggerti **a metà conversazione**, nel caso ti scappi spontaneamente una frase come *"ok, segnalo"* o *"salva questo punto"* prima di chiudere la chiamata.
2. **Alternativa col Microfono della Tastiera dentro la Gem**:
   - Dentro un **Gem personalizzato**, tocca l'icona del **Microfono sulla tastiera** (non il tasto Live con le onde): lì il Gem segue al 100% le istruzioni e stampa subito il riquadro col pulsante **Copia**.

---

## 2. Metodo A: Regola Scoped "Modalità Skizzo" per Informazioni Salvate (`Saved Info`) + Gemini Live

Apri **Foto profilo -> Informazioni salvate** nell'app Gemini (o [`gemini.google.com/saved-info`](https://gemini.google.com/saved-info)), sostituisci la regola precedente e incolla questa versione (che lascia Google Keep libero per l'uso normale ma lo blocca durante **"Modalità Skizzo"**):

```text
Quando ti dico "Modalità Skizzo", agisci come architetto software vocale (e in questa modalità non salvare nulla su Google Keep o Google Tasks, nemmeno se dico "segnalo" o "salvalo"):
1. Aiutami a mettere a fuoco l'idea facendomi a voce AL MASSIMO 1 o 2 domande brevi (una alla volta, meno di 30 parole) per capire: quale schermata/file/modulo toccare, il comportamento desiderato e se è urgente (!).
2. Appena chiudo la chiamata vocale o ti dico "Prepara il blocco codice", scrivi SOLO un blocco di codice Markdown pronto da copiare nel formato:
! <modulo>: <Titolo sintetico max 70 caratteri>

> **Specifica DESIDERATA (<=140c)**: <Sintesi in 1 riga sotto i 140 caratteri>
### Contesto Vocale Raccolto
- Obiettivo: <1 frase>
- File o modulo: <percorso o "Da individuare">
- Criterio di verifica: <1 frase>
```

### Come usarlo in 3 passaggi senza che parta Google Keep
1. Avvia **Gemini Live** e inizia dicendo: **"Entra in Modalità Skizzo: sul mio progetto vorrei modificare..."** *(evita la parola "nota")*.
2. Rispondi a voce alla sua domanda di chiarimento.
3. **Chiudi Gemini Live** (tasto rosso `X`) e nella schermata della chat premi il microfono (o scrivi) **"Prepara il blocco codice"** -> Gemini genera nella chat scritta il riquadro con il pulsante **Copia**!

---

## 3. Metodo B: Google AI Studio (`Stream Realtime` — Zero Google Keep & Zero Tocchi)

Se vuoi parlare a voce senza che l'assistente consumer di Android interferisca con Google Keep, apri [`aistudio.google.com`](https://aistudio.google.com) -> **Stream Realtime** dal browser del telefono:
- In **System Instructions** incolli le regole qui sopra;
- In **Tools -> Function Calling** puoi aggiungere lo schema `submit_kanban_note` qui sotto (con un GitHub Fine-Grained Token limitato a `Issues: Read and write`) per inviare la scheda direttamente a GitHub.

```json
{
  "name": "submit_kanban_note",
  "description": "Invia la scheda rifinita a voce alla Kanban GitHub del progetto selezionato.",
  "parameters": {
    "type": "object",
    "required": ["repo", "mode", "scope", "title", "compactSpec", "verbatimTranscriptSummary"],
    "properties": {
      "repo": {
        "type": "string",
        "description": "Repository target nel formato owner/repo"
      },
      "mode": {
        "type": "string",
        "enum": ["INBOX_NOTE", "FAST_TRACK_READY"],
        "description": "INBOX_NOTE (passa da /review-notes) oppure FAST_TRACK_READY (aggiunge '!' e va in Fai Ora per /next-step)"
      },
      "scope": {
        "type": "string",
        "description": "Modulo o cartella target nel progetto (es. auth, cart, api, skizzo, global)"
      },
      "title": {
        "type": "string",
        "description": "Titolo sintetico imperativo (max 70 caratteri, senza prefissi)"
      },
      "compactSpec": {
        "type": "string",
        "description": "Specifica densa <= 140 caratteri pronta per la colonna Note di DESIDERATA.md"
      },
      "verbatimTranscriptSummary": {
        "type": "string",
        "description": "Riassunto fedele dei requisiti e casi limite emersi nel dialogo vocale"
      }
    }
  }
}
```

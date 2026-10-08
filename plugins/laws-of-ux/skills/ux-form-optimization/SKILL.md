---
name: ux-form-optimization
description: >-
  Use this skill when designing, reviewing, or refactoring forms, data input fields,
  registration/checkout wizards, and validation logic. Applies Postel's Law, Parkinson's Law,
  Law of Proximity, Tesler's Law, and Chunking to eliminate input friction and error rates.
---

# Form & Data Input Optimization Skill

Questa skill guida l'agente nell'ottimizzazione dell'esperienza d'uso per form, campi input, validazione e flussi di checkout o registrazione, riducendo l'attrito e il tasso di abbandono.

## Problemi Tipici Risolti da questa Skill
- Utenti che abbandonano form lunghi o complessi.
- Errori di validazione rigidi che frustrano l'utente (es. formati telefono, carte di credito, date).
- Mancanza di associazione visiva tra etichette, campi e messaggi d'errore.
- Mancato sfruttamento dei meccanismi di autocompletamento del browser e del sistema operativo.

---

## Leggi Applicate & Regole Chiave

1. **Postel's Law (Principio di Robustezza)**:
   - *Regola*: Accetta input in formati permissivi e normalizzali internamente prima dell'invio.
   - *Esempio*: Se un utente digita il numero di telefono come `+39 340 123 4567` o `3401234567`, non restituire errore: ripulisci gli spazi e salva il formato corretto.

2. **Benchmark Empirico Baymard (Riduzione Campi & Colonna Singola)**:
   - *Regola*: I form di checkout convenzionali contengono in media 11.8 campi; riduci i campi del **20-60%**, attestando il form su **6-8 campi essenziali** per singolo step.
   - *Layout*: Adotta rigorosamente un **layout a colonna singola**. I form su più colonne generano un percorso oculare a "Z" ambiguo che causa il salto involontario di campi obbligatori.
   - *Campi Opzionali*: Elimina o nascondi campi come "Azienda", "Riga indirizzo 2", "Prefisso titolo". Se un campo è opzionale, indicalo chiaramente con la dicitura `(opzionale)` anziché marcare con un asterisco rosso i 20 campi obbligatori.

3. **Parkinson's Law (Contrazione del Tempo) & Mobile Inputmode**:
   - *Regola*: Riduci la durata effettiva della compilazione a quella percepita come minima.
   - *Esempio*: Fornisci sempre attributi di autocompletamento HTML (`autocomplete="name"`, `autocomplete="email"`, `autocomplete="tel"`, `autocomplete="shipping postal-code"`) e attributi mobile dedicati (`inputmode="numeric"` o `inputmode="tel"` per aprire il tastierino numerico corretto).

4. **Error Prevention & Recovery (NN/G Euristiche #5 e #9)**:
   - *Regola*: Previeni l'errore a monte mediante vincoli logici (date passate disabilitate, selezione paese che preimposta prefisso e validazione CAP).
   - *Validazione Inline*: Valida il dato quando l'utente lascia il campo (`onBlur`), mai mentre sta ancora digitando. I messaggi d'errore devono essere costruttivi, spiegando chiaramente *cosa è andato storto* e *come risolverlo* (es. "Inserisci un CAP di 5 cifre, es. 20121").

5. **Law of Proximity (Gestalt)**:
   - *Regola*: L'etichetta (`<label>`) e il messaggio di aiuto (`hint-text`) devono trovarsi a distanza ravvicinata ($\le 8\text{ px}$) dal campo input relativo.
   - *Esempio*: La distanza tra form group adiacenti deve essere di almeno $16-24\text{ px}$ per non confondere l'appartenenza.

6. **Tesler's Law (Assorbimento della Complessità)**:
   - *Regola*: Non far fare all'utente calcoli o deduzioni che il software può eseguire automaticamente.
   - *Esempio*: Deduci la provincia e la città dal CAP inserito; deduci il circuito della carta dalle prime 4 cifre; unifica nome e cognome in un unico campo "Nome completo" se non strettamente separati dal backend.

7. **Chunking & Progressive Disclosure**:
   - *Regola*: Suddividi campi composti da molte cifre in blocchi leggibili (4 a 4 per le carte, 3 a 3 per i telefoni).
   - *Esempio*: Nei flussi lunghi (> 8 campi), crea uno stepper multi-passo a stadi logici (es. Spedizione -> Pagamento -> Revisione finale) con indicatore di progresso chiaro e possibilità di Guest Checkout senza registrazione forzata.

---

## Procedura Operativa per l'Agente
1. **Analisi e Potatura Campi (Audit Baymard)**: Conta il numero totale di input. Elimina campi superflui portando il totale a $\le 6-8$ campi per schermata. Converti layout multi-colonna in una colonna singola verticale.
2. **Accessibilità & Semantic HTML**: Assicurati che ogni input possieda una `<label>` visibile con `for="field-id"` e attributo `id` corrispondente. Non usare mai il solo `placeholder` come etichetta.
3. **Controllo Autocomplete & Inputmode**: Inserisci attributi `autocomplete` conformi e `inputmode` specifico per dispositivi touch.
4. **Validazione Non Distruttiva (Postel & NN/G #5)**: Implementa parsing tollerante a spazi e formattazioni; imposta validazione inline su evento `blur`.
5. **Prevenzione Conflitti & Doppi Invii**: Assicurati che il pulsante di submit si disabiliti durante l'invio mostrando stato di caricamento inline.

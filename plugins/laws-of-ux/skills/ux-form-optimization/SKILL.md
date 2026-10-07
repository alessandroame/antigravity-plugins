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

2. **Parkinson's Law (Contrazione del Tempo)**:
   - *Regola*: Riduci la durata effettiva della compilazione a quella percepita come minima.
   - *Esempio*: Fornisci sempre attributi di autocompletamento HTML (`autocomplete="name"`, `autocomplete="email"`, `autocomplete="tel"`, `autocomplete="postal-code"`).

3. **Law of Proximity (Gestalt)**:
   - *Regola*: L'etichetta (`<label>`) e il messaggio di aiuto (`hint-text`) devono trovarsi a distanza ravvicinata (4-8px) dal campo input relativo.
   - *Esempio*: La distanza tra form group adiacenti deve essere di almeno 20-24px per non confondere l'appartenenza.

4. **Tesler's Law (Assorbimento della Complessità)**:
   - *Regola*: Non far fare all'utente calcoli o deduzioni che il software può eseguire automaticamente.
   - *Esempio*: Deduci la provincia e la città dal CAP inserito; deduci il circuito della carta dalle prime 4 cifre.

5. **Chunking & Miller's Law**:
   - *Regola*: Suddividi campi composti da molte cifre in blocchi leggibili (4 a 4 per le carte, 3 a 3 per i telefoni).
   - *Esempio*: Nei form con oltre 10 campi, crea uno stepper multi-passo (es. Dati Personali -> Spedizione -> Pagamento).

---

## Procedura Operativa per l'Agente
1. **Analisi dei Campi**: Esamina tutti gli `input`, `select`, `textarea`. Verifica che ciascuno abbia una `<label>` esplicita collegata tramite attributo `for`/`id`.
2. **Controllo Autocomplete**: Aggiungi gli attributi `autocomplete` standard WCAG/HTML5.
3. **Controllo Validazione**: Sposta la validazione da "bloccante globale a fine pagina" a "validazione inline contestuale" al blur del campo (`onBlur`).
4. **Rimozione del superfluo (Occam's Razor)**: Verifica se ci sono campi opzionali eliminabili o rimandabili a un secondo momento.

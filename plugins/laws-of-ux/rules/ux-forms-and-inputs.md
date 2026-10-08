---
description: >-
  Regola per l'ottimizzazione di form, campi di input, validazione dati, wizard e formattazione permissiva (Postel's Law, Parkinson's Law, Proximity, Tesler's Law, Chunking).
trigger: model_decision
globs: "**/*{form,input,login,signup,checkout,register,stepper,wizard}*.{html,jsx,tsx,vue,svelte,dart,swift,kt}"
---

# Form & Input Field UX Rules

Quando crei o modifichi form, input e procedure di checkout/registrazione:
1. **Tolleranza degli Input (Postel's Law)**: Accetta qualsiasi variante plausibile (es. spazi nei numeri di telefono, prefissi internazionali, carte di credito) e pulisci/normalizza automaticamente i dati prima dell'invio.
2. **Riduzione Campi & Layout a Colonna Singola (Benchmark Baymard)**: Riduci del 20-60% i campi del form (mantenere $\le 6-8$ campi per schermata o step di checkout). Usa un layout a colonna singola per guidare lo sguardo ed evitare salti di riga confusi. Elimina campi opzionali non critici (es. seconda riga indirizzo, fax, titolo onorifico).
3. **Autofill (Parkinson's Law)**: Includi sempre attributi semantici per il completamento (`autocomplete="tel"`, `autocomplete="email"`, `autocomplete="shipping address-line1"`, ecc.).
4. **Prossimità Visiva (Law of Proximity)**: Mantieni la label e i messaggi di errore/hint a distanza ravvicinata ($\le 8\text{ px}$) dall'input field corrispondente; distanzia i gruppi logici di campi di almeno $16-24\text{ px}$.
5. **Assorbimento Complessità (Tesler's Law)**: Rileva automaticamente i dati derivabili (es. banca dal numero carta, città/provincia da CAP).
6. **Prevenzione Errori (NN/G Euristica #5)**: Usa vincoli restrittivi e smart defaults (disabilita date passate nei selettori, seleziona valuta locale) anziché attendere l'invio per notificare l'errore.
7. **Suddivisione a Blocchi (Chunking)**: Raggruppa codici lunghi in blocchi leggibili (4 cifre per volta su carte e seriali; formattazione leggibile di IBAN e telefoni).

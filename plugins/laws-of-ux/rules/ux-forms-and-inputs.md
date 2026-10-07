---
description: >-
  Regola per l'ottimizzazione di form, campi di input, validazione dati, wizard e formattazione permissiva (Postel's Law, Parkinson's Law, Proximity, Tesler's Law, Chunking).
trigger: model_decision
globs: "**/*{form,input,login,signup,checkout,register,stepper,wizard}*.{html,jsx,tsx,vue,svelte,dart,swift,kt}"
---

# Form & Input Field UX Rules

Quando crei o modifichi form, input e procedure di checkout/registrazione:
1. **Tolleranza degli Input (Postel's Law)**: Accetta qualsiasi variante plausibile (es. spazi nei numeri di telefono o carte di credito) e pulisci/normalizza automaticamente i dati.
2. **Autofill (Parkinson's Law)**: Includi sempre attributi semantici per il completamento (`autocomplete="tel"`, `autocomplete="email"`, ecc.).
3. **Prossimità (Law of Proximity)**: Mantieni la label a distanza ravvicinata (<= 8px) dall'input field corrispondente; distanzia i gruppi logici di almeno 20px.
4. **Assorbimento Complessità (Tesler's Law)**: Rileva automaticamente i dati derivabili (es. banca dal numero carta, città da CAP).
5. **Suddivisione a Blocchi (Chunking)**: Raggruppa codici lunghi in blocchi leggibili (4 cifre per volta).

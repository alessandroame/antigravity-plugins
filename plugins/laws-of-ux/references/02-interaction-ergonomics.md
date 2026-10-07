# 2. Interazione ed Ergonomia (Fattori Motori e Decisionali)

Questo pilastro riguarda l'efficienza con cui gli utenti eseguono fisicamente le azioni nell'interfaccia (mouse, tap touch, scorciatoie tastiera) e la rapidità con cui prendono decisioni.

---

## Fitts’s Law
> **Definizione**: The time to acquire a target is a function of the distance to and size of the target.

### Key Takeaways (Punti Chiave)
- Touch targets should be large enough for users to accurately select them.
- Touch targets should have ample spacing between them.
- Touch targets should be placed in areas of an interface that allow them to be easily acquired.

### Applicazione Pratica nel Codice & Design System
- **Dimensioni Minime di Tocco**: Target touch minimi di **48×48 px** con un'area di separazione di almeno **8 px** tra elementi interattivi.
- **Zone di Facile Raggiungimento (Thumb Zone)**: Su mobile, posiziona azioni critiche (navigation bar, FAB, sticky CTA) nella parte inferiore dello schermo.
- **Bordi dello Schermo su Desktop**: Gli angoli e i bordi dello schermo hanno 'dimensione infinita' per il cursore del mouse, rendendo barre dei menu e pulsanti a tutta altezza facilissimi da intercettare.

---

## Hick’s Law
> **Definizione**: The time it takes to make a decision increases with the number and complexity of choices.

### Key Takeaways (Punti Chiave)
- Minimize choices when response times are critical to decrease decision time.
- Break complex tasks into smaller steps in order to decrease cognitive load.
- Avoid overwhelming users by highlighting recommended options.
- Use progressive onboarding to minimize cognitive load for new users.
- Be careful not to simplify to the point of abstraction.

### Applicazione Pratica nel Codice & Design System
- **Tempo di Decisione Logaritmico**: Il tempo per prendere una decisione cresce logaritmicamente con il numero di alternative: `T = b * log2(n + 1)`.
- **Scomposizione dei Menu**: Non mostrare elenchi a discesa con 40 voci piatte. Raggruppa in sottocategorie gerarchiche o fornisci un campo di ricerca (autocomplete).
- **Progressive Disclosure**: Mostra solo le opzioni indispensabili all'inizio, offrendo impostazioni 'Avanzate' solo su richiesta esplicita.

---

## Choice Overload
> **Definizione**: The tendency for people to get overwhelmed when they are presented with a large number of options, often used interchangeably with the term paradox of choice.

### Key Takeaways (Punti Chiave)
- Too many options hurts users’ decision-making ability. How they feel about the experience as a whole can be significantly impacted as a result.
- When comparison is necessary, we can avoid choice overload by enabling side-by-side comparison of related items and options that require a decision (e.g. pricing tiers).
- We can avoid choice overload by optimizing our designs for the decision-making process and avoid overwhelming users by prioritizing the content that’s shown to them at any given moment (e.g. featured product), providing tools for narrowing down choices up front (e.g. search and filtering).

### Applicazione Pratica nel Codice & Design System
- **Paradosso della Scelta**: Troppe opzioni generano paralisi e rimpianto post-decisione.
- **Curated Defaults & Featured Options**: Evidenzia una 'Scelta consigliata' o 'Più popolare' (es. piani tariffari).
- **Tabelle di Comparazione Affiancata**: Quando l'utente deve scegliere tra alternative complesse, consenti il confronto affiancato di massimo 3 o 4 opzioni evidenziando le differenze chiave.

---

## Doherty Threshold
> **Definizione**: Productivity soars when a computer and its users interact at a pace (<400ms) that ensures that neither has to wait on the other.

### Key Takeaways (Punti Chiave)
- Provide system feedback within 400 ms in order to keep users’ attention and increase productivity.
- Use perceived performance to improve response time and reduce the perception of waiting.
- Animation is one way to visually engage people while loading or processing is happening in the background.
- Progress bars help make wait times tolerable, regardless of their accuracy.
- Purposefully adding a delay to a process can actually increase its perceived value and instill a sense of trust, even when the process itself actually takes much less time.

### Applicazione Pratica nel Codice & Design System
- **Tempo di Risposta < 400ms**: La soglia di Doherty stabilisce che se il sistema risponde entro 400ms, l'utente rimane concentrato e la produttività aumenta vertiginosamente.
- **Stati Ottimistici & Skeleton UI**: Per chiamate API che richiedono più tempo, aggiorna subito l'interfaccia (optimistic update) o mostra Skeleton Loader animati che simulano la struttura finale.
- **Progress Bar Determinate**: Per caricamenti oltre i 2 secondi, usa barre percentuali anche stimate per dare certezza visiva del progresso.

---

## Postel’s Law
> **Definizione**: Be liberal in what you accept, and conservative in what you send.

### Key Takeaways (Punti Chiave)
- Be empathetic to, flexible about, and tolerant of any of the various actions the user could take or any input they might provide.
- Anticipate virtually anything in terms of input, access, and capability while providing a reliable and accessible interface.
- The more we can anticipate and plan for in design, the more resilient the design will be.
- Accept variable input from users, translating that input to meet your requirements, defining boundaries for input, and providing clear feedback to the user.

### Applicazione Pratica nel Codice & Design System
- **Principio di Robustezza**: 'Sii tollerante in ciò che ricevi e rigoroso in ciò che emetti'.
- **Flessibilità nei Form**: Consenti l'inserimento di numeri telefonici con spazi, trattini o prefissi senza bloccare l'utente; formatta e pulisci i dati automaticamente prima dell'invio.
- **Normalizzazione Automatica**: Riconosci date scritte come `GG/MM/AAAA` o `AAAA-MM-DD` senza generare errori inutili.

---

## Tesler’s Law
> **Definizione**: Tesler's Law, also known as The Law of Conservation of Complexity, states that for any system there is a certain amount of complexity which cannot be reduced.

### Key Takeaways (Punti Chiave)
- All processes have a core of complexity that cannot be designed away and therefore must be assumed by either the system or the user.
- Ensure as much as possible of the burden is lifted from users by dealing with inherent complexity during design and development.
- Remember to not build products and services for an idealized, rational user, because people don’t always behave rationally in real life.
- Make guidance accessible and fit within the context of use so that it can help these active new users, no matter what path they choose to take (e.g., tooltips with helpful information).

### Applicazione Pratica nel Codice & Design System
- **Conservazione della Complessità**: Ogni processo ha una complessità intrinseca che non può essere eliminata; può solo essere spostata sullo sviluppo software o sull'utente.
- **Assorbimento da parte del Sistema**: Fai in modo che il software faccia il lavoro pesante (es. rilevamento automatico del circuito della carta di credito, compilazione città/provincia tramite CAP).

---

## Occam’s Razor
> **Definizione**: Among competing hypotheses that predict equally well, the one with the fewest assumptions should be selected.

### Key Takeaways (Punti Chiave)
- The best method for reducing complexity is to avoid it in the first place.
- Analyze each element and remove as many as possible, without compromising the overall function.
- Consider completion only when no additional items can be removed.

### Applicazione Pratica nel Codice & Design System
- **Rasoio di Occam**: La soluzione con meno presupposti ed elementi superflui è la migliore.
- **Audit di Eliminazione**: Esamina ogni pulsante, etichetta o decorazione grafica. Se la rimozione non altera la comprensione o il funzionamento della pagina, rimuovila.

---

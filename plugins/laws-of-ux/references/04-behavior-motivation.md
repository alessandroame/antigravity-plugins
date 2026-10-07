# 4. Comportamento, Motivazione e Percezione del Tempo

Questo pilastro esamina la psicologia comportamentale degli utenti: come si formano le loro abitudini, come percepiscono il tempo trascorso, cosa li spinge a completare i task e come ricordano l'esperienza complessiva.

---

## Jakob’s Law
> **Definizione**: Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know.

### Key Takeaways (Punti Chiave)
- Users will transfer expectations they have built around one familiar product to another that appears similar.
- By leveraging existing mental models, we can create superior user experiences in which the users can focus on their tasks rather than on learning new models.
- When making changes, minimize discord by empowering users to continue using a familiar version for a limited time.

### Applicazione Pratica nel Codice & Design System
- **Aderenza agli Standard di Settore**: Gli utenti passano il 99% del loro tempo su altri siti. Mantieni i pattern universali: icona carrello in alto a destra, logo cliccabile che riporta alla Home in alto a sinistra, lente d'ingrandimento per la ricerca.
- **Rinnovamento Senza Rottura**: Quando rinnovi una UI, mantieni intatte le affordance fondamentali per evitare shock e disorientamento.

---

## Mental Model
> **Definizione**: A compressed model based on what we think we know about a system and how it works.

### Key Takeaways (Punti Chiave)
- We form a working model in our minds around what we think we know about a system, especially about how it works, and then we apply that model to new situations where the system is similar.
- Match designs to the users’ mental models to improve their experience. This enables them to easily transfer their knowledge from one product or experience to another, without the need to first take the time to understand how the new system works.
- Good user experiences are made possible when the design of a product or service is in alignment with the user’s mental model. Take for example e-commerce websites, which use consistent patterns and conventions such product cards, virtual carts and checkout flows in order to conform to users’ expectations.
- The task of shrinking the gap between our own mental models and those of the users is one of the biggest challenges we face, and to achieve this goal we use a variety of user research methods (e.g. user interviews, personas, journey maps, empathy maps).

### Applicazione Pratica nel Codice & Design System
- **Allineamento tra Sistema e Aspettative**: Il modello mentale è la mappa concettuale che l'utente ha di come funziona il software. Progetta l'architettura informativa in modo che rifletta il linguaggio e i concetti dell'utente, non la struttura interna del database o delle API.

---

## Paradox of the Active User
> **Definizione**: Users never read manuals but start using the software immediately.

### Key Takeaways (Punti Chiave)
- Users are often motivated to complete their immediate tasks and therefore they don't want to spend time up front reading documentation.
- This paradox exist because users will save time in the long term if they take the time to optimize the system and learn more about it.
- Make guidance accessible throughout the product experience and design it to fit within the context of use so that it can help these active new users no matter what path they choose to take (e.g. tooltips with helpful information).

### Applicazione Pratica nel Codice & Design System
- **Nessuno Legge i Manuali**: Gli utenti si gettano immediatamente nell'uso attivo del software per raggiungere il loro obiettivo urgente.
- **Guida 'Just-in-Time'**: Elimina tutorial o walkthrough iniziali composti da 10 slide; inserisci invece onboarding contestuale, placeholder esplicativi e tooltip non invasivi esattamente al momento del bisogno.

---

## Goal-Gradient Effect
> **Definizione**: The tendency to approach a goal increases with proximity to the goal.

### Key Takeaways (Punti Chiave)
- The closer users are to completing a task, the faster they work towards reaching it.
- Providing artificial progress towards a goal will help to ensure users are more likely to have the motivation to complete that task.
- Provide a clear indication of progress in order to motivate users to complete tasks.

### Applicazione Pratica nel Codice & Design System
- **Accelerazione verso il Traguardo**: Più l'utente è vicino al completamento dell'obiettivo, più velocemente procede.
- **Progresso Artificiale (Endowed Progress Effect)**: Nei form o nelle raccolte punti, mostra il primo step già parzialmente avviato (es. 'Passo 1 di 4 completato al 25%') per dare slancio psicologico immediato.

---

## Flow
> **Definizione**: The mental state in which a person performing some activity is fully immersed in a feeling of energized focus, full involvement, and enjoyment in the process of the activity.

### Key Takeaways (Punti Chiave)
- Flow occurs when there is a balance between the difficulty of a task with the level of skill at the given task. It’s characterized by intense and focused concentration on the present, combined with a sense of total control.
- A task that’s too difficult leads to heighten frustration while a task that’s too easy can lead to boredom. Finding the right balance requires matching the challenge with skill of the user.
- Design for flow by providing the necessary feedback so that the user know what action has been done and what has been accomplished.
- Optimize for efficiency and system responsiveness by removing any unnecessary friction, and making content and features available for discovery to avoid disengagement with the interface.

### Applicazione Pratica nel Codice & Design System
- **Stato di Flusso**: Si ottiene quando la difficoltà del compito è perfettamente bilanciata con la competenza dell'utente, in assenza di attriti o distrazioni.
- **Zero Interruzioni Arbitrarie**: Evita pop-up, banner di consenso aggressivi o ricaricamenti di pagina durante flussi di lavoro immersivi (es. scrittura, elaborazione dati).

---

## Peak-End Rule
> **Definizione**: People judge an experience largely based on how they felt at its peak and at its end, rather than the total sum or average of every moment of the experience.

### Key Takeaways (Punti Chiave)
- Pay close attention to the most intense points and the final moments (the “end”) of the user journey.
- Identify the moments when your product is most helpful, valuable, or entertaining and design to delight the end user.
- Remember that people recall negative experiences more vividly than positive ones.

### Applicazione Pratica nel Codice & Design System
- **Picco ed Epilogo**: L'esperienza viene valutata non dalla media complessiva, ma dal momento di massima intensità emotiva (il 'picco') e dal momento finale (la conclusione).
- **Celebrazione del Successo**: Trasforma la schermata di conferma ('Ordine completato con successo!', 'Campagna inviata!') in un momento gratificante ed empatico.
- **Gestione Elegante degli Errori**: Se si verifica un errore 404 o un crash, fornisci una schermata utile con scorciatoie di ripristino e un tono di voce cordiale.

---

## Zeigarnik Effect
> **Definizione**: People remember uncompleted or interrupted tasks better than completed tasks.

### Key Takeaways (Punti Chiave)
- Invite content discovery by providing clear signifiers of additional content.
- Providing artificial progress towards a goal will help to ensure users are more likely to have the motivation to complete that task.
- Provide a clear indication of progress in order to motivate users to complete tasks.

### Applicazione Pratica nel Codice & Design System
- **Memoria dei Compiti Incompleti**: Le attività interrotte o incompiute rimangono impresse nella mente molto più a lungo di quelle concluse.
- **Checklist di Profilo e Gamification**: Mostra widget come 'Profilo completato al 70%' con 2 suggerimenti rapidi per raggiungere il 100%, incentivando il ritorno dell'utente.

---

## Parkinson’s Law
> **Definizione**: Any task will inflate until all of the available time is spent.

### Key Takeaways (Punti Chiave)
- Limit the time it takes to complete a task to what users expect it’ll take.
- Reducing the actual duration to complete a task from the expected duration will improve the overall user experience.
- Leverage features such as autofill to save the user time when providing critical information within forms. This allows for quick completion of purchases, bookings and other such functions while preventing task inflation.

### Applicazione Pratica nel Codice & Design System
- **Inflazione del Tempo**: Qualsiasi compito tenderà ad espandersi fino a occupare tutto il tempo disponibile.
- **Snellimento dei Flussi**: Riduci i passaggi inutili, sfrutta l'autocompletamento di browser e sistemi operativi (`autocomplete="shipping address-line1"`), riducendo la durata effettiva della procedura.

---

## Pareto Principle
> **Definizione**: The Pareto principle states that, for many events, roughly 80% of the effects come from 20% of the causes.

### Key Takeaways (Punti Chiave)
- Inputs and outputs are often not evenly distributed.
- A large group may contain only a few meaningful contributors to the desired outcome.
- Focus the majority of effort on the areas that will bring the largest benefits to the most users.

### Applicazione Pratica nel Codice & Design System
- **Regola 80/20**: L'80% del valore percepito o dell'uso reale deriva dal 20% delle funzionalità.
- **Focus sulle Feature Core**: Dai massima priorità visiva ed ergonomica a quel 20% di funzionalità essenziali usate quotidianamente, relegando il restante 80% in menu secondari.

---

## Aesthetic-Usability Effect
> **Definizione**: Users often perceive aesthetically pleasing design as design that’s more usable.

### Key Takeaways (Punti Chiave)
- An aesthetically pleasing design creates a positive response in people’s brains and leads them to believe the design actually works better.
- People are more tolerant of minor usability issues when the design of a product or service is aesthetically pleasing.
- Visually pleasing design can mask usability problems and prevent issues from being discovered during usability testing.

### Applicazione Pratica nel Codice & Design System
- **L'Estetica Influenza l'Usabilità**: Gli utenti tendono a percepire un design visivamente armonioso, curato e professionale come più usabile ed efficiente.
- **Tolleranza ai Piccoli Difetti**: Un'estetica raffinata aumenta la pazienza dell'utente di fronte a piccoli intoppi, ma attenzione: durante i test di usabilità può mascherare problemi strutturali!

---

# 3. Psicologia Cognitiva e Memoria di Lavoro

Questo pilastro analizza i vincoli biologici della mente umana: limiti di capacità della memoria a breve termine, filtri attentivi e bias cognitivi che guidano il comportamento degli utenti.

---

## Miller’s Law
> **Definizione**: The average person can only keep 7 (plus or minus 2) items in their working memory.

### Key Takeaways (Punti Chiave)
- Don’t use the “magical number seven” to justify unnecessary design limitations.
- Organize content into smaller chunks to help users process, understand, and memorize easily.
- Remember that short-term memory capacity will vary per individual, based on their prior knowledge and situational context.

### Applicazione Pratica nel Codice & Design System
- **Regola del 7 ± 2**: Non superare 5-9 elementi in un gruppo non categorizzato. Se un menu o una toolbar ha più di 7 elementi, suddividila con separatori semantici o sottomenu.
- **Nota di Rigore**: La legge di Miller non impone di limitare tutti i contenuti a 7 elementi, ma suggerisce di organizzare la complessità in blocchi gestibili.

---

## Working Memory
> **Definizione**: A cognitive system that temporarily holds and manipulates information needed to complete tasks.

### Key Takeaways (Punti Chiave)
- Working memory is limited to 4-7 chunks of information at any given moment with each chunk fades after 20-30 seconds. We use it to keep track of information in order to achieve tasks but we often have trouble remembering what information we’ve already seen. Designers must be mindful of this limit when displaying information to users and ensure it’s both necessary and relevant.
- Our brains are good at recognizing something we’ve seen before but not at keeping new information ready to be used. We can support recognition over recall by making it clear what information has already been viewed (e.g. visually differentiating visited links and providing breadcrumbs links).
- Place burden of memory on the system, not the user. We can lessen the burden of memorizing critical information by carrying it over from screen to screen when necessary (e.g. comparison tables that make comparing multiple items easy).

### Applicazione Pratica nel Codice & Design System
- **Persistenza Effimera**: La memoria di lavoro trattiene 4-7 chunks per 20-30 secondi prima di degradare.
- **Riconoscimento invece di Richiamo (Recognition over Recall)**: Mostra chiaramente lo stato precedente (es. link già visitati differenziati visivamente, breadcrumb navigazionali, riassunto delle selezioni attive nel checkout).

---

## Chunking
> **Definizione**: A process by which individual pieces of an information set are broken down and then grouped together in a meaningful whole.

### Key Takeaways (Punti Chiave)
- Chunking enables users to easily scan content. It allows them to easily identify the information that aligns with their goals and process that information to achieve their goals more quickly.
- Structuring content into visually distinct groups with a clear hierarchy enables designers to align information with how people evaluate and process digital content.
- Chunking can be used to help users understand underlying relationships by grouping content into distinctive modules, applying rules to separate content, and providing hierarchy.

### Applicazione Pratica nel Codice & Design System
- **Formattazione dei Dati**: Suddividi stringhe lunghe (IBAN, codici fiscali, numeri di carte di credito a 16 cifre in gruppi di 4: `XXXX XXXX XXXX XXXX`).
- **Scansionabilità del Testo**: Usa titoli chiari (H2, H3), elenchi puntati e paragrafi brevi (2-3 frasi) per facilitare lo scanning visivo (F-pattern).

---

## Cognitive Load
> **Definizione**: The amount of mental resources needed to understand and interact with an interface.

### Key Takeaways (Punti Chiave)
- When the amount of information coming in exceeds the space we have available, we struggle mentally to keep up — tasks become more difficult, details are missed, and we begin to feel overwhelmed.
- Intrinsic cognitive load refers to the effort required by users to carry around information relevant to their goal, absorb new information and keep track of their goals.
- Extraneous cognitive load refers to the mental processing that takes up resources but doesn't help users understand the content of an interface (e.g. distracting or unnecessary design elements).

### Applicazione Pratica nel Codice & Design System
- **Carico Intrinseco vs Estraneo**: Riduci a zero il 'carico cognitivo estraneo' (font illeggibili, contrasti bassi, animazioni superflue, icone misteriose prive di label).
- **Assistenza Contestuale**: Fornisci suggerimenti d'esempio (placeholder o hint text) direttamente dove l'utente deve inserire dati complessi.

---

## Cognitive Bias
> **Definizione**: A systematic error of thinking or rationality in judgment that influence our perception of the world and our decision-making ability.

### Key Takeaways (Punti Chiave)
- Rather than thinking through every situation, we conserve mental energy by developing rules of thumb to make decisions which are based on past experiences. These mental shortcuts increase our efficiency by enabling us to make quick decisions without the need to thoroughly analyze a situation but can also influence our decision-making processes and judgement without our awareness.
- Understanding of our own intrinsic biases may not eliminate them completely from our decision-making but it increases the chance that we can identify them in ourselves and others and serve as a safeguard against fallacious reasoning, unintentional discrimination or costly mistakes our decisions.
- Take for example our tendency to seek out, interpret, and recall information in a way that confirms their preconceived notions and ideas. This is known as confirmation bias, and it can make having a logical discussion about a polarizing hot-button issue with someone incredibly difficult.

### Applicazione Pratica nel Codice & Design System
- **Euristica di Giudizio**: Gli utenti usano scorciatoie mentali basate su esperienze pregresse.
- **Prevenire Errori Costosi**: Progetta interfacce inclusive e trasparenti, evitando pattern ingannevoli (dark patterns) e facilitando la verifica prima di azioni irreversibili.

---

## Selective Attention
> **Definizione**: The process of focusing our attention only to a subset of stimuli in an environment — usually those related to our goals.

### Key Takeaways (Punti Chiave)
- People often filter out information that isn’t relevant. This happens in order to maintain focus on information that is important or relevant to the task at hand. Designers must guide users’ attention, prevent them from being overwhelmed or distracted, and help them find relevant information or action.
- Banner Blindness is an example phenomenon of selection attention where visitors to a website consciously or unconsciously ignore banner-like information. Users have learned to ignore content that resembles ads, is close to ads, or appears in locations traditionally dedicated to ads. Avoid confusion by not styling content to look like ads or placing content and ads in the same visual section.
- Change blindness is another example phenomenon of selection attention that occurs when significant changes in an interface go unnoticed because due to the limitations of human attention and the lack of strong cues. Avoid this by analyzing your design for any competing changes that may happen at the same time and that may divert attention from each other.

### Applicazione Pratica nel Codice & Design System
- **Banner Blindness**: Gli utenti ignorano istintivamente qualsiasi elemento che assomigli visivamente a un banner promozionale o sia collocato nei tipici spazi pubblicitari. Evita di stilizzare comunicazioni importanti come pubblicità.
- **Change Blindness**: Se una modifica avviene a schermo senza un chiaro indicatore visivo o animazione di transizione, l'utente non la noterà. Usa badge numerici o toast notification per evidenziare aggiornamenti.

---

## Serial Position Effect
> **Definizione**: Users have a propensity to best remember the first and last items in a series.

### Key Takeaways (Punti Chiave)
- Placing the least important items in the middle of lists can be helpful because these items tend to be stored less frequently in long-term and working memory.
- Positioning key actions on the far left and right within elements such as navigation can increase memorization.

### Applicazione Pratica nel Codice & Design System
- **Primacy ed Recency Effect**: Le persone ricordano meglio il primo e l'ultimo elemento di una serie.
- **Architettura della Navigazione**: Colloca le azioni e i link più importanti all'inizio (Home, Dashboard) e alla fine (Profilo, Impostazioni, Logout) della barra di navigazione.

---

## Von Restorff Effect
> **Definizione**: The Von Restorff effect, also known as The Isolation Effect, predicts that when multiple similar objects are present, the one that differs from the rest is most likely to be remembered.

### Key Takeaways (Punti Chiave)
- Make important information or key actions visually distinctive.
- Use restraint when placing emphasis on visual elements to avoid them competing with one another and to ensure salient items don’t get mistakenly identified as ads.
- Don’t exclude those with a color vision deficiency or low vision by relying exclusively on color to communicate contrast.
- Carefully consider users with motion sensitivity when using motion to communicate contrast.

### Applicazione Pratica nel Codice & Design System
- **Effetto Isolamento**: L'elemento visivamente dissimile da un gruppo uniforme è quello che viene notato e ricordato per primo.
- **Pulsante Primario Unico**: In ogni schermata o modale deve esserci una sola Call to Action primaria con forte contrasto cromatico. Tutti gli altri bottoni devono essere secondari (outline) o terziari (ghost/text).
- **Accessibilità A11y**: Non usare solo il colore per evidenziare l'elemento: abbina variazioni di peso tipografico, icone o contorni visibili per garantire l'accessibilità a utenti daltonici.

---

# 1. Principi Gestalt nella UX (Layout & Percezione Visiva)

La psicologia della Gestalt indaga il modo in cui il cervello umano percepisce, raggruppa e organizza stimoli visivi caotici o complessi in configurazioni logiche e unitarie.
Applicare questi principi garantisce che l'utente comprenda la struttura della pagina a colpo d'occhio, senza sforzo cognitivo.

---

## Law of Proximity
> **Definizione**: Objects that are near, or proximate to each other, tend to be grouped together.

### Key Takeaways (Punti Chiave)
- Proximity helps to establish a relationship with nearby objects.
- Elements in close proximity are perceived to share similar functionality or traits.
- Proximity helps users understand and organize information faster and more efficiently.

### Applicazione Pratica nel Codice & Design System
- **Spaziatura Relativa**: Usa una scala di spazi coerente (es. sistema a 8pt). La spaziatura interna tra label e input field deve essere di 4-8px, mentre lo spazio tra form group adiacenti deve essere di 16-24px.
- **Raggruppamento di Contenuti**: I metadati di un articolo (data, autore) devono essere più vicini al titolo rispetto al testo dell'articolo successivo.

---

## Law of Common Region
> **Definizione**: Elements tend to be perceived into groups if they are sharing an area with a clearly defined boundary.

### Key Takeaways (Punti Chiave)
- Common region creates a clear structure and helps users quickly and effectively understand the relationship between elements and sections.
- Adding a border around an element or group of elements is an easy way to create common region.
- Common region can also be created by defining a background behind an element or group of elements.

### Applicazione Pratica nel Codice & Design System
- **Card e Box Contenitori**: Racchiudere elementi collegati all'interno di un contenitore visivo con bordo chiaro o sfondo differenziato (`background-color`, `border-radius`, `box-shadow` discreta).
- **Tabelle e Griglie**: Separare blocchi di dati complessi mediante righe alternate (zebra striping) o container delimitati per definire in modo inequivocabile l'appartenenza dei dati.

---

## Law of Similarity
> **Definizione**: The human eye tends to perceive similar elements as a complete picture, shape, or group, even if those elements are separated.

### Key Takeaways (Punti Chiave)
- Elements that are visually similar will be perceived as related.
- Color, shape, and size, orientation and movement can signal that elements belong to the same group and likely share a common meaning or functionality.
- Ensure that links and navigation systems are visually differentiated from normal text elements.

### Applicazione Pratica nel Codice & Design System
- **Stili di Pulsanti e Link**: Tutti i link di navigazione devono condividere lo stesso stile; tutti i pulsanti distruttivi (Elimina, Revoca) devono condividere il medesimo schema di colore/avviso.
- **Tag e Badge di Stato**: Badge con lo stesso significato (es. 'Completato', 'In Attesa') devono presentare forme, icone e pesi visivi identici in tutte le sezioni dell'app.

---

## Law of Uniform Connectedness
> **Definizione**: Elements that are visually connected are perceived as more related than elements with no connection.

### Key Takeaways (Punti Chiave)
- Group functions of a similar nature so they are visually connected via colors, lines, frames, or other shapes.
- Alternately, you can use a tangible connecting reference (line, arrow, etc) from one element to the next to also create a visual connection.
- Use uniform connectedness to show context or to emphasize the relationship between similar items.

### Applicazione Pratica nel Codice & Design System
- **Stepper e Flussi Sequenziali**: Connettere visivamente i passi numerati con linee continue o frecce orientate per comunicare il percorso di onboarding o checkout.
- **Tabs e Punti di Ancoraggio**: La tab attiva deve fondersi visivamente con il pannello di contenuto sottostante (bordo aperto verso il basso), mostrando continuità diretta.

---

## Law of Prägnanz
> **Definizione**: People will perceive and interpret ambiguous or complex images as the simplest form possible, because it is the interpretation that requires the least cognitive effort of us.

### Key Takeaways (Punti Chiave)
- The human eye likes to find simplicity and order in complex shapes because it prevents us from becoming overwhelmed with information.
- Research confirms that people are better able to visually process and remember simple figures than complex figures.
- The human eye simplifies complex shapes by transforming them into a single, unified shape.

### Applicazione Pratica nel Codice & Design System
- **Semplicità Geometrica**: La mente interpreta forme ambigue riducendole alla configurazione più semplice possibile. Riduci ornamenti superflui, gradienti complessi o sagome non standard.
- **Iconografia Riconoscibile**: Usa icone dai contorni netti, universali e ben bilanciati, evitando illustrazioni microscopiche o contorte.

---

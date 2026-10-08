---
name: ux-choice-and-navigation-design
description: >-
  Use this skill when designing, simplifying, or auditing navigation bars, dropdown menus,
  filter sidebars, pricing tables, and complex decision-making screens. Applies Hick's Law,
  Choice Overload, Occam's Razor, and Serial Position Effect to prevent decision paralysis.
---

# Choice Architecture & Navigation Skill

Questa skill guida l'agente nella progettazione di menu, navigazioni, comparazioni e configuratori di scelta, prevenendo la "paralisi decisionale" e l'affaticamento cognitivo.

## Problemi Tipici Risolti da questa Skill
- Menu chilometrici con decine di voci disordinate.
- Schermate di pricing o comparazione con troppe opzioni poco distinguibili.
- Filtri di ricerca eccessivi che disorientano l'utente anziché aiutarlo.
- Informazioni critiche sepolte in mezzo a liste anonime.

---

## Leggi Applicate & Regole Chiave

1. **Hick's Law (Tempo di Decisione)**:
   - Il tempo per compiere una scelta aumenta logaritmicamente con il numero e la complessità delle alternative.
   - Riduci le opzioni visibili primarie a 3-5 macro-scelte.

2. **Choice Overload (Paradosso della Scelta)**:
   - Troppe opzioni riducono la probabilità di acquisto/scelta e aumentano il rimpianto post-decisione.
   - *Strategia*: Evidenzia un'opzione "Consigliata" o "Più Popolare" (es. nei piani di abbonamento); consenti il confronto affiancato di massimo 3 elementi alla volta.

3. **Recognition over Recall nelle Ricerche (NN/G Euristica #6 & Baymard)**:
   - Non costringere l'utente a ricordare codici articolo, sintassi rigide o termini esatti.
   - Fornisci autocompletamento visivo predittivo, visualizzazione dei termini cercati di recente (*Recently Searched/Viewed*) e tolleranza semantica verso refusi e sinonimi (evitando il 61% di fallimenti riscontrati dal benchmark Baymard sui motori di ricerca interni).

4. **Filtri Multipli & Faccettati (Benchmark Baymard a 5 Categorie)**:
   - Nei cataloghi, elenchi complessi e tabelle dati, implementa sempre le **5 categorie essenziali di filtro**:
     1. *Categoria/Tipologia*.
     2. *Specifiche/Attributi tecnici*.
     3. *Prezzo/Fascia di valore*.
     4. *Valutazione/Rating recensioni*.
     5. *Disponibilità/Stato*.
   - Mostra il conteggio degli elementi risultanti per ciascun filtro (`es. In Stock (42)`) ed esponi i filtri attivi come tag/pill rimovibili con un click.

5. **Serial Position Effect (Primacy e Recency)**:
   - L'utente ricorda con massima facilità il primo e l'ultimo elemento di una sequenza.
   - *Strategia*: Posiziona le voci di navigazione e le opzioni primarie agli estremi della barra o del menu.

6. **Jakob's Law & Wayfinding**:
   - Rispetta le convenzioni universali della navigazione web/mobile (logo a sinistra per tornare alla home, menu hamburger coerente, carrello o notifiche a destra).
   - Includi sempre breadcrumb per navigazioni profonde e indicatori di stato attivo evidenti (`aria-current="page"`).

---

## Procedura Operativa per l'Agente
1. **Audit delle Opzioni**: Conta le alternative presentate simultaneamente all'utente. Se superano 5-7, raggruppale in categorie o introduci filtri a cascata.
2. **Ottimizzazione Search Bar**: Aggiungi cronologia ricerche recenti, dropdown con suggerimenti istantanei e gestione degli stati "Nessun risultato" con suggerimenti alternativi.
3. **Implementazione 5 Filtri Baymard**: Organizza le sidebar di filtraggio strutturandole nelle 5 categorie standard con indicatori di conteggio e pillole di reset rapido.
4. **Curated Recommendations**: Aggiungi un badge ('Scelta consigliata') per indirizzare la maggior parte degli utenti verso la scelta standard.
5. **Architettura della Barra di Navigazione**: Riorganizza i link: link core all'inizio, profilo/impostazioni alla fine, elementi secondari raggruppati in un menu 'Altro'.

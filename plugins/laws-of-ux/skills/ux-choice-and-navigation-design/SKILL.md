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
   - Riduci le opzioni principali a 3-5 macro-scelte.

2. **Choice Overload (Paradosso della Scelta)**:
   - Troppe opzioni riducono la probabilità di acquisto/scelta e aumentano il rimpianto post-decisione.
   - *Strategia*: Evidenzia un'opzione "Consigliata" o "Più Popolare" (es. nei piani di abbonamento); consenti il confronto affiancato di massimo 3 elementi alla volta.

3. **Serial Position Effect (Primacy e Recency)**:
   - L'utente ricorda con massima facilità il primo e l'ultimo elemento di una sequenza.
   - *Strategia*: Posiziona le voci di navigazione e le opzioni primarie agli estremi della barra o del menu.

4. **Occam's Razor**:
   - Tra più configurazioni alternative, scegli quella con il minor numero di assunzioni e il minor numero di elementi grafici.

---

## Procedura Operativa per l'Agente
1. **Audit delle Opzioni**: Conta le alternative presentate simultaneamente all'utente. Se superano 7, raggruppale in categorie o introduci filtri a cascata.
2. **Curated Recommendations**: Aggiungi un badge ('Scelta consigliata') per indirizzare la maggior parte degli utenti verso la scelta standard.
3. **Architettura della Barra di Navigazione**: Riorganizza i link: link core all'inizio, profilo/impostazioni alla fine, elementi secondari raggruppati in un menu 'Altro'.

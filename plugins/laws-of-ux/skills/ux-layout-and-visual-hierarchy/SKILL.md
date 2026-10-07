---
name: ux-layout-and-visual-hierarchy
description: >-
  Use this skill when designing, structuring, or refactoring page layouts, content grids,
  dashboards, cards, and component grouping. Applies Gestalt Principles (Proximity, Common Region,
  Similarity, Uniform Connectedness, and Prägnanz) to make visual structure immediately intuitive.
---

# Visual Layout & Gestalt Architecture Skill

Questa skill serve a strutturare interfacce chiare, scansionabili e prive di rumore visivo, applicando i principi fondamentali della percezione visiva umana (Gestalt).

## Problemi Tipici Risolti da questa Skill
- Schermate disordinate dove l'utente fatica a capire cosa è correlato a cosa.
- Card con bordi o padding disomogenei.
- Tabelle e liste dense dove le righe o i metadati si confondono.
- Eccesso di linee, separatori, gradienti o ombre che creano "visual noise".

---

## Leggi Applicate & Regole Chiave

1. **Law of Proximity**:
   - La spaziatura relativa comunica correlazione semantica:
     - Elementi correlati (es. titolo card + data) = spazio ridotto (es. 4-8px).
     - Elementi della stessa sezione = spazio medio (es. 16-24px).
     - Sezioni indipendenti = spazio ampio (es. 48-64px).

2. **Law of Common Region**:
   - Racchiudi elementi che appartengono alla stessa entità all'interno di un confine visivo netto (sfondo leggermente differenziato, bordo di 1px o raggruppamento card).

3. **Law of Similarity**:
   - Elementi con la stessa funzione devono avere la stessa apparenza visiva (es. tutti i filtri devono condividere lo stesso stile badge/chip; tutti i link devono avere lo stesso colore).

4. **Law of Uniform Connectedness**:
   - Per visualizzare percorsi, sequenze o gerarchie, usa connettori fisici continui (linee tra nodi, breadcrumb uniti da frecce, stepper collegati).

5. **Law of Prägnanz**:
   - L'occhio umano cerca sempre la figura più semplice e simmetrica possibile. Evita layout disallineati, asimmetrie accidentali o elementi visivi ambigui.

---

## Procedura Operativa per l'Agente
1. **Audit degli Spazi (Spacing Scale)**: Verifica che il codice CSS/Tailwind usi una scala di spaziatura coerente (es. multipli di 4 o 8px).
2. **Definizione delle Regioni**: Se una pagina ha molte informazioni sparse, raccoglile in card o box con bordo sottile e padding proporzionato.
3. **Normalizzazione delle Somiglianze**: Rendi coerenti forme, raccordi (`border-radius`) e colori di elementi omologhi.
4. **Semplificazione (Decluttering)**: Rimuovi linee divisorie ridondanti sostituendole con spazio bianco negativo (whitespace).

---
name: ux-button-and-touch-ergonomics
description: >-
  Use this skill when designing, sizing, positioning, and styling buttons, call-to-actions (CTAs),
  interactive icons, action bars, and touch targets. Applies Fitts's Law, Von Restorff Effect,
  and Doherty Threshold to maximize click accuracy and eliminate accidental taps.
---

# Button & Touch Ergonomics Skill

Questa skill guida l'agente nella progettazione ergonomica di pulsanti, toolbar e comandi interattivi su desktop e dispositivi touch.

## Problemi Tipici Risolti da questa Skill
- Pulsanti o icone minuscole su mobile che provocano "miss-clicks" o frustrazione.
- Pulsanti multipli che competono visivamente per l'attenzione senza una gerarchia chiara.
- Click accidentali su pulsanti distruttivi (es. "Elimina" troppo vicino a "Salva").
- Mancanza di feedback visivo al tocco o doppio invio involontario.

---

## Leggi Applicate & Regole Chiave

1. **Fitts's Law (Dimensione e Distanza del Target)**:
   - *Formula concettuale*: Il tempo per colpire un target dipende dalla sua dimensione e dalla distanza dalla posizione attuale della mano/cursore.
   - *Dimensioni Minime*: **48×48 px** su mobile (target touch conforme WCAG / Apple HIG / Material Design); almeno **32×32 px** su desktop.
   - *Distanziamento Minimo*: Almeno **8 px** di separazione tra elementi cliccabili contigui.
   - *Thumb Zone*: Su mobile, posiziona le azioni più frequenti nella parte inferiore dello schermo.

2. **Von Restorff Effect (Isolamento dell'Azione Primaria)**:
   - In ogni schermata, deve risaltare **un solo pulsante primario** (Primary CTA) ad alto contrasto.
   - Le azioni secondarie devono essere stilizzate come pulsanti neutri (outline o grigi).
   - Le azioni distruttive devono usare il rosso ma essere separate spazialmente o richiedere conferma.

3. **Aesthetic-Usability Effect**:
   - Un design rifinito (transizioni fluide allo stato hover/pressed, angoli smussati coerenti, tipografia nitida) aumenta la tolleranza e la fiducia dell'utente.

---

## Procedura Operativa per l'Agente
1. **Misura delle Aree di Tocco**: Ispeziona il CSS o il componente per verificare che `min-height: 48px` e `min-width: 48px` siano rispettati (utilizzando padding se l'icona è 20-24px).
2. **Verifica Spaziatura**: Assicurati che un `gap` di almeno 8-12px separi pulsanti adiacenti.
3. **Audit Gerarchia Visiva**: Se ci sono 3 pulsanti con sfondo blu acceso nello stesso gruppo, converti il secondo in outline e il terzo in ghost text.
4. **Stati Interattivi**: Aggiungi feedback visivo per `:hover`, `:focus-visible` (accessibilità tastiera) e `:active`.

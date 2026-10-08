---
description: >-
  Regola per pulsanti, CTA, barre di azioni, icone cliccabili e target touch (Fitts's Law, Von Restorff Effect, Doherty Threshold).
trigger: model_decision
globs: "**/*{button,btn,cta,icon-button,action-bar,fab,menu-item}*.{html,jsx,tsx,vue,svelte,css,scss,dart}"
---

# Button & Touch Ergonomics Rules

Quando crei o modifichi pulsanti, CTA e icone interattive:
1. **Target Minimi (Fitts's Law)**: Minimo **48×48 px** su dispositivi touch (con padding trasparente se l'icona è inferiore) e **32×32 px** su desktop; distanziamento minimo di **8 px** tra pulsanti contigui per azzerare i tap accidentali.
2. **Raggiungibilità del Pollice (Thumb Zone)**: Su mobile, posiziona le azioni primarie e di conferma nella metà inferiore dello schermo (sticky bottom bar o float centrale facilmente raggiungibile con una mano sola).
3. **Gerarchia Visiva (Von Restorff Effect)**: Solo un pulsante primario per schermata con contrasto marcato; usa stili outline o ghost per azioni secondarie e neutre.
4. **Accessibilità A11y (WCAG POUR)**: Non distinguere l'azione unicamente tramite colore; fornisci etichette testuali esplicite o `aria-label`, contrasto conforme WCAG AA (min 4.5:1) e stato `:focus-visible` chiaro.
5. **Feedback Immediato & Anti-Double-Click (Doherty Threshold)**: Mostra feedback visivo entro 400ms dal tap/click e disabilita temporaneamente il pulsante durante l'elaborazione per prevenire invii doppi o duplicati transazionali.

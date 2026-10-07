---
description: >-
  Regola per pulsanti, CTA, barre di azioni, icone cliccabili e target touch (Fitts's Law, Von Restorff Effect, Doherty Threshold).
trigger: model_decision
globs: "**/*{button,btn,cta,icon-button,action-bar,fab,menu-item}*.{html,jsx,tsx,vue,svelte,css,scss,dart}"
---

# Button & Touch Ergonomics Rules

Quando crei o modifichi pulsanti, CTA e icone interattive:
1. **Target Minimi (Fitts's Law)**: Minimo **48×48 px** su touch e **32×32 px** su desktop; distanziamento minimo di **8 px** tra pulsanti contigui.
2. **Gerarchia Visiva (Von Restorff Effect)**: Solo un pulsante primario per schermata con contrasto marcato; usa outline/ghost per azioni secondarie.
3. **Accessibilità A11y**: Non distinguere l'azione solo con il colore; aggiungi etichette chiare, contrasto conforme WCAG AA e focus ring visibile.
4. **Prevenzione Doppi Click (Doherty Threshold)**: Disabilita il pulsante non appena cliccato e mostra un indicatore di stato attivo.

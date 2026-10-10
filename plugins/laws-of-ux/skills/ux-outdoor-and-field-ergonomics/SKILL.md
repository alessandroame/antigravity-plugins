---
name: ux-outdoor-and-field-ergonomics
description: >-
  Use this skill when designing, reviewing, or styling touch interfaces for outdoor,
  field, harsh sunlight, high-glare, glove-operated, or wearable scenarios.
---

# Outdoor, Field & Harsh-Environment HMI Ergonomics

Questa skill guida l'ottimizzazione di interfacce web e mobile destinate all'uso sul campo, all'aperto, sotto luce solare diretta o in contesti operativi complessi (sport, logistica, nautica, cantieri).

---

## 1. Vincoli Operativi sul Campo (Field Operational Factors)

1. **Luce Solare Diretta e Riverbero**:
   - I riflessi riducono drasticamente il contrasto percepito e rendono invisibili i grigi chiari o le sottili ombreggiature.
2. **Uso con Guanti o Mani Fredde**:
   - Impossibilità di puntamento micrometrico (precisione $< 5\text{mm}$).
3. **Finestra Decisionale Rapida (< 3s)**:
   - L'operatore non può leggere testi lunghi; lo stato primario deve essere percepibile a colpo d'occhio (*glanceability*).
4. **Schermi Ristretti (360px–390px) e Vibrazioni**:
   - L'interfaccia deve prevenire click accidentali e trappole di gesto.

---

## 2. Pattern Implementativi di Riferimento

### A. Target Tattili Estesi ($\ge 48\text{px}$) con Hit-Area Trasparente
Quando un elemento visivo ha dimensioni compatte (es. icona $16\text{px}$ o badge), estendere l'area di tocco con uno pseudo-elemento senza alterare il layout:

```css
.field-touch-target {
  position: relative;
  min-height: 48px;
  min-width: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Espansione hit-area trasparente per elementi compatti */
.field-touch-compact {
  position: relative;
}
.field-touch-compact::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 48px;
  min-height: 48px;
}
```

### B. Caroselli Orizzontali a Riga Singola (`touch-action: pan-x`)
Evitare `flex-wrap: wrap` per filtri o pulsanti frequenti:

```css
.field-carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  gap: 8px;
  scrollbar-width: none;
}
.field-carousel::-webkit-scrollbar {
  display: none;
}
.field-carousel-item {
  scroll-snap-align: start;
  flex-shrink: 0;
}
```

### C. Prevenzione Trappole di Gesto su Grafici e Mappe
- **Grafici con scrubber orizzontale**: `touch-action: pan-y` (consente lo scorrimento verticale naturale della pagina se l'utente scorre in verticale).
- **Mappe e canvas 3D**: implementare modalità cooperativa a due dita (*cooperative gestures*) o pulsante esplicito di ingaggio cartografico.

### D. Viewport Dinamico Senza Barre Parassite
```css
/* Eliminazione clipping da barre mobili */
.field-viewport-container {
  min-height: 100dvh;
  height: 100dvh;
  box-sizing: border-box;
}
```

### E. Feedback Tri-Modale di Sicurezza
Non affidare la comunicazione dello stato critico unicamente alla tonalità cromatica:

```html
<!-- Pattern Corretto: Colore + Icona Funzionale + Testo Esplicito -->
<div class="status-badge status-warning" role="status">
  <span class="status-icon" aria-hidden="true">⚠</span>
  <span class="status-text">Attenzione: Vento Forte (24 km/h)</span>
</div>
```

---

## 3. Checklist di Verifica Pre-Rilascio

| Criterio | Soglia Minima | Verifica |
| :--- | :---: | :--- |
| **Touch Target** | $\ge 48 \times 48\text{ px}$ | Ispezione DOM box-model |
| **Contrasto Luce Solare** | $\ge 4.5:1$ (AA) / $\ge 7:1$ (AAA) | Lighthouse / a11y color contrast |
| **Overflow Orizzontale** | 0 pixel su 360px viewport | Test headless browser |
| **Feedback Interazione** | $< 100\text{ms}$ (stato `:active`) | Test manuale o reattività CSS |
| **Icon Clutter** | 0 emoji decorative nei titoli | Scansione codice |

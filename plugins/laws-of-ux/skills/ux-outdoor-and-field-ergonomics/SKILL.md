---
name: ux-outdoor-and-field-ergonomics
description: >-
  Use this skill when designing, reviewing, or styling touch interfaces for outdoor,
  field, harsh sunlight, high-glare, glove-operated, or wearable scenarios.
---

# Outdoor, Field & Harsh-Environment HMI Ergonomics

Guides optimization of web and mobile interfaces for outdoor, direct-sunlight, high-glare, and glove-operated field environments (aviation, sports, logistics, marine, construction). Always reply to the user in plain Italian.

---

## 1. Field Operational Constraints

1. **Direct Sunlight & Glare**: Washes out low-contrast grays and subtle shadows; requires WCAG AAA (`>= 7:1`) on critical telemetry.
2. **Glove / Cold-Hand Operation**: Precludes fine-grained pointing (`< 5mm`); requires `>= 48x48 px` touch targets with `>= 8px` gaps.
3. **Sub-3-Second Glanceability**: Operators cannot read long prose; primary state MUST be readable at a glance with `>= 60%` free canvas height on `360x800`.
4. **Narrow Viewports (`360px–390px`) & Vibration**: Prevent accidental taps and scroll/gesture traps.

---

## 2. Reference Implementation Patterns

### A. Extended Touch Targets (`>= 48px`) with Transparent Hit-Area
```css
.field-touch-target {
  position: relative;
  min-height: 48px;
  min-width: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

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

### B. Single-Row Horizontal Carousels (`touch-action: pan-x`)
NEVER use `flex-wrap: wrap` on frequent filter/time pills:
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

### C. Gesture-Trap Prevention on Charts & Maps
- **Horizontal-scrubber charts**: Set `touch-action: pan-y` to preserve vertical page scrolling.
- **Maps & 3D canvases**: Use two-finger cooperative gestures or an explicit map-lock toggle.

### D. Dynamic Viewport (`100dvh`) & Tri-Modal Safety Feedback
```css
.field-viewport-container {
  min-height: 100dvh;
  height: 100dvh;
  box-sizing: border-box;
}
```
```html
<!-- Tri-Modal Pattern: Color + Functional Symbol + Explicit Italian Text -->
<div class="status-badge status-warning" role="status">
  <span class="status-icon" aria-hidden="true">⚠</span>
  <span class="status-text">Attenzione: Vento Forte (24 km/h)</span>
</div>
```

---

## 3. Pre-Release Verification Checklist

| Criterion | Minimum Threshold | Verification |
| :--- | :---: | :--- |
| **Touch Target** | `>= 48 x 48 px` | DOM box-model probe |
| **Sunlight Contrast** | `>= 4.5:1` (AA) / `>= 7:1` (AAA) | Contrast check |
| **Horizontal Overflow** | `0 px` on `360px` viewport | `ui-geometry-probe.js` |
| **Interaction Feedback** | `< 100ms` (`:active` state) | CSS/UI smoke test |
| **Icon Clutter** | `0` decorative emojis in headings | Code scan |

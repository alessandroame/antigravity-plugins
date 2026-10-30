/**
 * Live Browser DOM-Geometry & Interaction Probe (Gate 4 Oracle)
 * Executable directly in Chrome DevTools MCP (evaluate_script), Playwright page.evaluate(),
 * or imported as a helper in automated browser tests.
 */

export function runUiGeometryProbe(win = globalThis.window, doc = globalThis.document) {
  const vw = win.innerWidth;
  const vh = win.innerHeight;
  const violations = [];

  const isVisible = (el) => {
    const s = win.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) {
      return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const describeElement = (el) => {
    const tag = (el.tagName || 'node').toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    const text = (el.textContent || '').trim().slice(0, 20);
    if (text) return `${tag}["${text}"]`;
    if (typeof el.className === 'string' && el.className.trim()) {
      return `${tag}.${el.className.trim().split(/\s+/)[0]}`;
    }
    return tag;
  };

  // 1. Horizontal Viewport Overflow
  const docScrollWidth = doc.documentElement ? doc.documentElement.scrollWidth : vw;
  if (docScrollWidth > vw + 1) {
    violations.push({
      type: 'VIEWPORT_OVERFLOW_X',
      scrollWidth: docScrollWidth,
      viewportWidth: vw
    });
  }

  // 2. Interactive Controls: Touch Target Floor, Text Clipping & Z-Index Occlusion
  const selector = 'button, a[href], input, select, textarea, [role="button"], [tabindex="0"]';
  const interactives = [...doc.querySelectorAll(selector)].filter(isVisible);

  for (const el of interactives) {
    const r = el.getBoundingClientRect();
    const label = describeElement(el);
    const style = win.getComputedStyle(el);

    if (vw <= 480 && (r.width < 44 || r.height < 44)) {
      violations.push({
        type: 'TOUCH_TARGET_TOO_SMALL',
        element: label,
        width: Math.round(r.width),
        height: Math.round(r.height)
      });
    }

    if (el.scrollWidth > el.clientWidth + 2 && (style.overflowX === 'hidden' || style.overflowX === 'clip')) {
      violations.push({
        type: 'TEXT_CLIPPED',
        element: label,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      });
    }

    const cx = Math.min(Math.max(r.left + r.width / 2, 1), vw - 1);
    const cy = Math.min(Math.max(r.top + r.height / 2, 1), vh - 1);
    if (r.top >= 0 && r.bottom <= vh && typeof doc.elementFromPoint === 'function') {
      const topEl = doc.elementFromPoint(cx, cy);
      if (topEl && topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
        violations.push({
          type: 'CONTROL_COVERED_BY_OVERLAY',
          element: label,
          coveredBy: describeElement(topEl)
        });
      }
    }
  }

  // 3. Primary Canvas / Map Breathing Room (>= 60% height or non-collapsed)
  const canvasNodes = [...doc.querySelectorAll('canvas, .leaflet-container, .mapboxgl-map, [data-map], [data-primary-canvas]')].filter(isVisible);
  let primaryCanvasRatio = null;

  for (const canvas of canvasNodes) {
    const r = canvas.getBoundingClientRect();
    const label = describeElement(canvas);
    if (r.width < 200 || r.height < 180) {
      violations.push({
        type: 'MAP_OR_CANVAS_CRUSHED',
        element: label,
        width: Math.round(r.width),
        height: Math.round(r.height)
      });
    }
    if (canvas.hasAttribute('data-primary-canvas') || canvas.matches('.leaflet-container, .mapboxgl-map, [data-map]')) {
      primaryCanvasRatio = Number((r.height / vh).toFixed(2));
      if (primaryCanvasRatio < 0.55) {
        violations.push({
          type: 'PRIMARY_CANVAS_SUFFOCATED',
          element: label,
          heightRatio: primaryCanvasRatio,
          minRequiredRatio: 0.6
        });
      }
    }
  }

  // 4. SVG Chart & Diagram Physical Text Legibility Floor (>= 9.5px rendered CSS pixels)
  const svgNodes = [...doc.querySelectorAll('svg')].filter(isVisible);
  for (const svg of svgNodes) {
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (!vb || vb.width < 120 || vb.height < 60) continue;
    const sr = svg.getBoundingClientRect();
    const scale = Math.min(sr.width / vb.width, sr.height / vb.height);
    for (const txt of svg.querySelectorAll('text')) {
      const content = (txt.textContent || '').trim();
      if (!content) continue;
      const rawFs = parseFloat(txt.getAttribute('font-size') || win.getComputedStyle(txt).fontSize || '12');
      const effectivePx = Number((rawFs * scale).toFixed(2));
      if (effectivePx > 0 && effectivePx < 9.5) {
        violations.push({
          type: 'SVG_TEXT_TOO_SMALL',
          element: describeElement(svg),
          text: content.slice(0, 24),
          effectiveFontPx: effectivePx,
          minRequiredPx: 9.5
        });
        break;
      }
    }
  }

  return {
    viewport: `${vw}x${vh}`,
    pass: violations.length === 0,
    interactiveCount: interactives.length,
    primaryCanvasRatio,
    violationCount: violations.length,
    violations: violations.slice(0, 20)
  };
}

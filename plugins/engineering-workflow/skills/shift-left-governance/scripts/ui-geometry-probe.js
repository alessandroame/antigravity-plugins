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

    let visLeft = Math.max(0, r.left);
    let visTop = Math.max(0, r.top);
    let visRight = Math.min(vw, typeof r.right === 'number' ? r.right : r.left + r.width);
    let visBottom = Math.min(vh, typeof r.bottom === 'number' ? r.bottom : r.top + r.height);

    let ancestor = el.parentElement;
    while (ancestor && ancestor !== doc.body && ancestor !== doc.documentElement) {
      const aStyle = win.getComputedStyle(ancestor);
      const clipsX = ['auto', 'scroll', 'hidden', 'clip'].includes(aStyle.overflowX);
      const clipsY = ['auto', 'scroll', 'hidden', 'clip'].includes(aStyle.overflowY);
      if (clipsX || clipsY) {
        const ar = ancestor.getBoundingClientRect();
        const arRight = typeof ar.right === 'number' ? ar.right : ar.left + ar.width;
        const arBottom = typeof ar.bottom === 'number' ? ar.bottom : ar.top + ar.height;
        if (clipsX) {
          visLeft = Math.max(visLeft, ar.left);
          visRight = Math.min(visRight, arRight);
        }
        if (clipsY) {
          visTop = Math.max(visTop, ar.top);
          visBottom = Math.min(visBottom, arBottom);
        }
      }
      ancestor = ancestor.parentElement;
    }

    if (visRight - visLeft >= 8 && visBottom - visTop >= 8 && typeof doc.elementFromPoint === 'function') {
      const cx = (visLeft + visRight) / 2;
      const cy = (visTop + visBottom) / 2;
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
      const minCanvasRatio = 0.55;
      if (primaryCanvasRatio < minCanvasRatio) {
        violations.push({
          type: 'PRIMARY_CANVAS_SUFFOCATED',
          element: label,
          heightRatio: primaryCanvasRatio,
          minRequiredRatio: minCanvasRatio
        });
      }
    }
  }

  // 4. SVG Chart & Diagram Legibility, Text/Cursor Anti-Collision & Over-Boxing
  const svgNodes = [...doc.querySelectorAll('svg')].filter(isVisible);
  const rectsIntersect = (a, b, pad = 0) => {
    const ar = typeof a.right === 'number' ? a.right : a.left + a.width;
    const ab = typeof a.bottom === 'number' ? a.bottom : a.top + a.height;
    const br = typeof b.right === 'number' ? b.right : b.left + b.width;
    const bb = typeof b.bottom === 'number' ? b.bottom : b.top + b.height;
    return a.left < br + pad && ar + pad > b.left && a.top < bb + pad && ab + pad > b.top;
  };

  for (const svg of svgNodes) {
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (!vb || vb.width < 120 || vb.height < 60) continue;
    const svgLabel = describeElement(svg);
    const sr = svg.getBoundingClientRect();
    const scale = Math.min(sr.width / vb.width, sr.height / vb.height);

    // 4a. Concentric bordered ancestor check (max 1 outer box around data charts)
    let borderedAncestors = 0;
    let anc = svg.parentElement;
    while (anc && anc !== doc.body && anc !== doc.documentElement) {
      const as = win.getComputedStyle(anc);
      const bw = parseFloat(as.borderTopWidth || as.borderWidth || '0');
      const bs = as.borderTopStyle || as.borderStyle || 'none';
      if (bw > 0 && bs !== 'none' && bs !== 'hidden') {
        borderedAncestors += 1;
      }
      anc = anc.parentElement;
    }
    if (borderedAncestors > 1) {
      violations.push({
        type: 'CHART_OVER_BOXING',
        element: svgLabel,
        borderedAncestors,
        maxAllowed: 1
      });
    }

    const visibleTexts = [];
    let reportedSmallText = false;
    for (const txt of svg.querySelectorAll('text')) {
      const content = (txt.textContent || '').trim();
      if (!content || !isVisible(txt)) continue;
      const rawFs = parseFloat(txt.getAttribute('font-size') || win.getComputedStyle(txt).fontSize || '12');
      const effectivePx = Number((rawFs * scale).toFixed(2));
      if (!reportedSmallText && effectivePx > 0 && effectivePx < 9.5) {
        violations.push({
          type: 'SVG_TEXT_TOO_SMALL',
          element: svgLabel,
          text: content.slice(0, 24),
          effectiveFontPx: effectivePx,
          minRequiredPx: 9.5
        });
        reportedSmallText = true;
      }
      if (!txt.hasAttribute || !txt.hasAttribute('data-chart-cursor')) {
        visibleTexts.push({ el: txt, text: content.slice(0, 24), rect: txt.getBoundingClientRect() });
      }
    }

    // 4b. Pairwise SVG text bounding-box overlap check
    let reportedOverlap = false;
    for (let i = 0; i < visibleTexts.length && !reportedOverlap; i++) {
      for (let j = i + 1; j < visibleTexts.length; j++) {
        if (rectsIntersect(visibleTexts[i].rect, visibleTexts[j].rect, -1)) {
          violations.push({
            type: 'SVG_TEXT_OVERLAP',
            element: svgLabel,
            textA: visibleTexts[i].text,
            textB: visibleTexts[j].text
          });
          reportedOverlap = true;
          break;
        }
      }
    }

    // 4c. Active cursor / pill clearance (< 18px vertical/horizontal collision guard)
    const cursors = [...svg.querySelectorAll('[data-chart-cursor], .gm-cursor-pill, .chart-cursor-pill')].filter(isVisible);
    let reportedCursorCollision = false;
    for (const cur of cursors) {
      if (reportedCursorCollision) break;
      const cr = cur.getBoundingClientRect();
      for (const item of visibleTexts) {
        if (cur.contains && cur.contains(item.el)) continue;
        if (rectsIntersect(item.rect, cr, 0) || (
          item.rect.left < (typeof cr.right === 'number' ? cr.right : cr.left + cr.width) &&
          (typeof item.rect.right === 'number' ? item.rect.right : item.rect.left + item.rect.width) > cr.left &&
          Math.abs((item.rect.top + item.rect.height / 2) - (cr.top + cr.height / 2)) < 18
        )) {
          violations.push({
            type: 'SVG_CURSOR_COLLISION',
            element: svgLabel,
            text: item.text
          });
          reportedCursorCollision = true;
          break;
        }
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

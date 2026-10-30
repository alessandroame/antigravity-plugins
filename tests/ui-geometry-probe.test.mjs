import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runUiGeometryProbe } from '../plugins/engineering-workflow/skills/shift-left-governance/scripts/ui-geometry-probe.js';

function createMockElement({
  tagName = 'BUTTON',
  id = '',
  className = '',
  textContent = 'Action',
  rect = { left: 16, top: 16, width: 48, height: 48, right: 64, bottom: 64 },
  scrollWidth = 48,
  clientWidth = 48,
  style = { display: 'block', visibility: 'visible', opacity: '1', overflowX: 'visible' },
  attrs = {},
  matchesSelector = false
} = {}) {
  return {
    tagName,
    id,
    className,
    textContent,
    scrollWidth,
    clientWidth,
    _style: style,
    getBoundingClientRect: () => rect,
    hasAttribute: (name) => Boolean(attrs[name]),
    matches: () => matchesSelector,
    contains: (other) => false
  };
}

describe('Gate 4 Live Browser UI Geometry Probe', () => {
  it('passes with 0 violations on a compliant 360x800 mobile layout (Occam Razor: zero false positives)', () => {
    const primaryBtn = createMockElement({
      id: 'fly-btn',
      rect: { left: 16, top: 20, width: 120, height: 48, right: 136, bottom: 68 }
    });
    const mapCanvas = createMockElement({
      tagName: 'DIV',
      id: 'glide-map',
      rect: { left: 0, top: 200, width: 360, height: 520, right: 360, bottom: 720 },
      attrs: { 'data-primary-canvas': true },
      matchesSelector: true
    });

    const mockWin = {
      innerWidth: 360,
      innerHeight: 800,
      getComputedStyle: (el) => el._style
    };
    const mockDoc = {
      documentElement: { scrollWidth: 360 },
      querySelectorAll: (sel) => (sel.includes('canvas') ? [mapCanvas] : [primaryBtn]),
      elementFromPoint: () => primaryBtn
    };

    const report = runUiGeometryProbe(mockWin, mockDoc);
    assert.equal(report.pass, true);
    assert.equal(report.violationCount, 0);
    assert.equal(report.primaryCanvasRatio, 0.65);
  });

  it('detects horizontal overflow, small touch targets, clipped text, overlay occlusion, and suffocated maps', () => {
    const tinyClippedBtn = createMockElement({
      id: 'filter-chip',
      rect: { left: 10, top: 40, width: 36, height: 28, right: 46, bottom: 68 },
      scrollWidth: 92,
      clientWidth: 36,
      style: { display: 'inline-block', visibility: 'visible', opacity: '1', overflowX: 'hidden' }
    });
    const floatingHud = createMockElement({ tagName: 'DIV', id: 'floating-hud' });
    const suffocatedMap = createMockElement({
      tagName: 'DIV',
      id: 'map-container',
      rect: { left: 0, top: 500, width: 360, height: 220, right: 360, bottom: 720 },
      attrs: { 'data-primary-canvas': true },
      matchesSelector: true
    });

    const mockWin = {
      innerWidth: 360,
      innerHeight: 800,
      getComputedStyle: (el) => el._style
    };
    const mockDoc = {
      documentElement: { scrollWidth: 412 },
      querySelectorAll: (sel) => (sel.includes('canvas') ? [suffocatedMap] : [tinyClippedBtn]),
      elementFromPoint: () => floatingHud
    };

    const report = runUiGeometryProbe(mockWin, mockDoc);
    assert.equal(report.pass, false);
    const types = report.violations.map((v) => v.type);
    assert.ok(types.includes('VIEWPORT_OVERFLOW_X'));
    assert.ok(types.includes('TOUCH_TARGET_TOO_SMALL'));
    assert.ok(types.includes('TEXT_CLIPPED'));
    assert.ok(types.includes('CONTROL_COVERED_BY_OVERLAY'));
    assert.ok(types.includes('PRIMARY_CANVAS_SUFFOCATED'));
  });

  it('does not emit false-positive overlay violations for scrolled-out pills in horizontal pan-x carousels', () => {
    const carouselTrack = {
      tagName: 'DIV',
      parentElement: null,
      _style: { display: 'flex', visibility: 'visible', opacity: '1', overflowX: 'auto', overflowY: 'hidden' },
      getBoundingClientRect: () => ({ left: 12, top: 60, width: 336, height: 52, right: 348, bottom: 112 })
    };
    const visiblePill = {
      ...createMockElement({
        id: 'pill-boiler',
        rect: { left: 16, top: 64, width: 140, height: 44, right: 156, bottom: 108 }
      }),
      parentElement: carouselTrack
    };
    const offscreenCarouselPill = {
      ...createMockElement({
        id: 'pill-tendalino',
        rect: { left: 390, top: 64, width: 130, height: 44, right: 520, bottom: 108 }
      }),
      parentElement: carouselTrack
    };

    const mockWin = {
      innerWidth: 360,
      innerHeight: 800,
      getComputedStyle: (el) => el._style
    };
    const mockDoc = {
      body: {},
      documentElement: { scrollWidth: 360 },
      querySelectorAll: (sel) => (sel.includes('canvas') ? [] : [visiblePill, offscreenCarouselPill]),
      elementFromPoint: () => visiblePill
    };

    const report = runUiGeometryProbe(mockWin, mockDoc);
    assert.equal(report.pass, true);
    assert.equal(report.violationCount, 0);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifySkizzoTask } from '../scripts/triage.mjs';

describe('Skizzo Auto-Triage Headless Engine (Alpha Technical & Beta Domain Oracles)', () => {
  it('routes operational, git, memory, and read-only prompts to FAST-PASS (score < 0)', () => {
    const prompts = [
      '/memory-sync',
      '/take-note controlla il contrasto su mobile',
      'git status e commit',
      'spiega come funziona validate.mjs',
      'dove si trova la regola di skizzo?',
      'fallo',
      'procedi'
    ];
    for (const prompt of prompts) {
      const res = classifySkizzoTask(prompt);
      assert.equal(res.route, 'FAST-PASS', `Expected FAST-PASS for: ${prompt}`);
      assert.ok(res.score < 0, `Expected negative guard score for: ${prompt}`);
      assert.equal(res.keepStickyOn, true);
      assert.ok(res.estimatedSavedSeconds >= 90);
    }
  });

  it('routes atomic single-choice mechanical edits to FAST-PASS (score < 3)', () => {
    const prompts = [
      'correggi il refuso nel titolo di README.md',
      'cambia il padding del bottone da 8px a 12px',
      'rinomina foo in bar dentro @utils.js',
      'cambia il colore primario in #2563eb'
    ];
    for (const prompt of prompts) {
      const res = classifySkizzoTask(prompt);
      assert.equal(res.route, 'FAST-PASS', `Expected FAST-PASS for: ${prompt}`);
      assert.ok(res.score < 3, `Expected score < 3 for: ${prompt}`);
      assert.equal(res.keepStickyOn, true);
    }
  });

  it('routes architectural plans, UX flows, and multi-signal features to DUAL-TRACK (score >= 3)', () => {
    const prompts = [
      'Vorrei migliorare skizzo. C\'è qualche modo per determinare a priori dove conviene usarlo in modalità skizzo e dove no? vorrei implementare una modalità auto insomma.. fai un piano',
      'Ora progettiamo un sistema per filtrare i report con input utente e salvarli nelle preferenze',
      'Progetta una nuova dashboard responsive su 360px con motore di ricerca headless e tolleranza agli errori di input'
    ];
    for (const prompt of prompts) {
      const res = classifySkizzoTask(prompt);
      assert.equal(res.route, 'DUAL-TRACK', `Expected DUAL-TRACK for: ${prompt}`);
      assert.ok(res.score >= 3, `Expected score >= 3 for: ${prompt}`);
      assert.equal(res.keepStickyOn, true);
    }
  });

  it('activates DUAL-TRACK+MEDIATOR when --mediator flag is present on a complex task', () => {
    const res = classifySkizzoTask('/skizzo --mediator progetta il nuovo filtro di ricerca con input permissivi e architettura pura');
    assert.equal(res.route, 'DUAL-TRACK+MEDIATOR');
    assert.ok(res.score >= 3);
  });

  it('handles malformed, whitespace, or empty inputs deterministically without throwing', () => {
    for (const bad of ['', '   ', null, undefined]) {
      const res = classifySkizzoTask(bad);
      assert.equal(res.route, 'FAST-PASS');
      assert.equal(res.score, 0);
      assert.equal(res.keepStickyOn, true);
    }
  });

  it('honors explicit --force and natural language force overrides on small tasks (Beta Scenario 3)', () => {
    const byFlag = classifySkizzoTask('/skizzo --force cambia il colore del pulsante primario');
    assert.equal(byFlag.route, 'DUAL-TRACK');
    assert.equal(byFlag.score, 99);

    const byNatural = classifySkizzoTask('usa skizzo per decidere il testo di questo bottone');
    assert.equal(byNatural.route, 'DUAL-TRACK');
  });

  it('honors explicit --skip and natural language fast overrides on complex tasks while keeping sticky state ON (Beta Scenario 4)', () => {
    const byFlag = classifySkizzoTask('/skizzo --skip progetta un nuovo modulo di autenticazione con form UI');
    assert.equal(byFlag.route, 'FAST-PASS');
    assert.equal(byFlag.keepStickyOn, true);

    const byNatural = classifySkizzoTask('fai una risposta veloce senza skizzo per questa funzione di calcolo e filtro UI');
    assert.equal(byNatural.route, 'FAST-PASS');
    assert.equal(byNatural.keepStickyOn, true);
  });
});

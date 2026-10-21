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
      'procedi',
      'start server',
      'aggiorna i plugins'
    ];
    for (const prompt of prompts) {
      const res = classifySkizzoTask(prompt);
      assert.equal(res.route, 'FAST-PASS', `Expected FAST-PASS for: ${prompt}`);
      assert.ok(res.score < 0, `Expected negative guard score for: ${prompt}`);
      assert.equal(res.keepStickyOn, true);
      assert.equal(res.silentFastPass, true, `Expected silentFastPass=true when implicit for: ${prompt}`);
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
      assert.equal(res.silentFastPass, true);
    }
  });

  it('routes architectural plans, UX flows, and multi-signal features to DUAL-TRACK (score >= 4 in implicit mode, >= 3 in sticky mode)', () => {
    const prompts = [
      'Vorrei migliorare skizzo. C\'è qualche modo per determinare a priori dove conviene usarlo in modalità skizzo e dove no? vorrei implementare una modalità auto insomma.. fai un piano',
      'Ora progettiamo un sistema per filtrare i report con input utente e salvarli nelle preferenze',
      'Progetta una nuova dashboard responsive su 360px con motore di ricerca headless e tolleranza agli errori di input',
      'nel render in modalità regia avviene ancora che il parapendio sparisca.. inoltre le inquadrature mi paiono troppo ravvicinate'
    ];
    for (const prompt of prompts) {
      const res = classifySkizzoTask(prompt, { stickySessionActive: false });
      assert.equal(res.route, 'DUAL-TRACK', `Expected implicit DUAL-TRACK for: ${prompt}`);
      assert.ok(res.score >= 4, `Expected score >= 4 for: ${prompt}`);
      assert.equal(res.silentFastPass, false);
      assert.equal(res.keepStickyOn, true);
    }
  });

  it('distinguishes between implicit FAST-PASS (silentFastPass: true) and explicit/sticky FAST-PASS (silentFastPass: false)', () => {
    const implicitRes = classifySkizzoTask('spiega come funziona validate.mjs', { stickySessionActive: false });
    assert.equal(implicitRes.route, 'FAST-PASS');
    assert.equal(implicitRes.silentFastPass, true);

    const stickyRes = classifySkizzoTask('spiega come funziona validate.mjs', { stickySessionActive: true });
    assert.equal(stickyRes.route, 'FAST-PASS');
    assert.equal(stickyRes.silentFastPass, false);

    const explicitCmdRes = classifySkizzoTask('/skizzo spiega come funziona validate.mjs');
    assert.equal(explicitCmdRes.route, 'FAST-PASS');
    assert.equal(explicitCmdRes.silentFastPass, false);
  });

  it('blocks false-positive DUAL-TRACK on complex questions containing mid-sentence read-only clauses (Alpha Oracle)', () => {
    const res = classifySkizzoTask(
      '/skizzo è possibile per te eseguire un test vero sull\'app per analizzare il replay 3d e migliorare l\'interfaccia utente? non agire è solo una domanda'
    );
    assert.equal(res.route, 'FAST-PASS');
    assert.ok(res.signals.includes('readonly_override_clause'));
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

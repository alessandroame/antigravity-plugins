import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  classifySkizzoTask,
  countUniqueFileMentions,
  formatCliResult,
  rankAndCapDomains
} from '../scripts/triage.mjs';
import { sanitizeForBlindJudge } from '../../ab-bench/scripts/bench.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TRIAGE_SCRIPT = join(__dirname, '..', 'scripts', 'triage.mjs');

describe('Skizzo Auto-Triage & Dynamic Domain Ranking Engine', () => {
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
      assert.equal(res.trackMode, 'FAST-PASS');
      assert.ok(res.score < 0, `Expected negative guard score for: ${prompt}`);
      assert.equal(res.keepStickyOn, true);
      assert.equal(res.silentFastPass, true, `Expected silentFastPass=true when implicit for: ${prompt}`);
      assert.equal(res.maxTracks, 0);
      assert.equal(res.personaSelection, 'NONE');
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
      assert.equal(res.trackMode, 'FAST-PASS');
      assert.ok(res.score < 3, `Expected score < 3 for: ${prompt}`);
      assert.equal(res.keepStickyOn, true);
      assert.equal(res.silentFastPass, true);
      assert.equal(res.personaSelection, 'NONE');
    }
  });

  it('routes both software and non-software multi-perspective decisions to LLM_DYNAMIC_RANKED (score >= 4 in implicit mode)', () => {
    const prompts = [
      'Vorrei migliorare skizzo. C\'è qualche modo per determinare a priori dove conviene usarlo in modalità skizzo e dove no? vorrei implementare una modalità auto insomma.. fai un piano',
      'Ora progettiamo un sistema per filtrare i report con input utente e salvarli nelle preferenze',
      'Progetta una nuova dashboard responsive su 360px con motore di ricerca headless e tolleranza agli errori di input',
      'Dobbiamo decidere come strutturare il percorso didattico bilanciando la sicurezza operativa, i rischi pratici e la facilità di apprendimento',
      'Imposta una strategia organizzativa valutando pro e contro, i vincoli di rischio e il punto di vista dei diversi ruoli coinvolti'
    ];
    for (const prompt of prompts) {
      const res = classifySkizzoTask(prompt, { stickySessionActive: false });
      assert.equal(res.route, 'DUAL-TRACK', `Expected implicit activation for: ${prompt}`);
      assert.equal(res.trackMode, 'MULTI-TRACK');
      assert.ok(res.score >= 4, `Expected score >= 4 for: ${prompt}`);
      assert.equal(res.minTracks, 2);
      assert.equal(res.maxTracks, 4);
      assert.equal(res.personaSelection, 'LLM_DYNAMIC_RANKED');
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

  it('blocks false-positive activation on complex questions containing mid-sentence read-only clauses', () => {
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
    assert.equal(res.personaSelection, 'LLM_DYNAMIC_RANKED');
  });

  it('handles malformed, whitespace, or empty inputs deterministically without throwing', () => {
    for (const bad of ['', '   ', null, undefined, '/skizzo --tracks 5']) {
      const res = classifySkizzoTask(bad);
      assert.equal(res.route, 'FAST-PASS');
      assert.equal(res.score, 0);
      assert.equal(res.keepStickyOn, true);
    }
  });

  it('honors explicit --force, --tracks N (including clamping out-of-range values), and natural language overrides', () => {
    const byFlag = classifySkizzoTask('/skizzo --force cambia il colore del pulsante primario');
    assert.equal(byFlag.route, 'DUAL-TRACK');
    assert.equal(byFlag.trackMode, 'MULTI-TRACK');
    assert.equal(byFlag.score, 99);
    assert.equal(byFlag.personaSelection, 'LLM_DYNAMIC_RANKED');

    const byTracks3 = classifySkizzoTask('/skizzo --tracks 3 valuta questo flusso');
    assert.equal(byTracks3.route, 'DUAL-TRACK');
    assert.equal(byTracks3.trackMode, 'TRI-TRACK');
    assert.equal(byTracks3.requestedTracks, 3);
    assert.equal(byTracks3.minTracks, 3);
    assert.equal(byTracks3.maxTracks, 3);

    const byTracks5Clamped = classifySkizzoTask('/skizzo --tracks 5 valuta questo flusso');
    assert.equal(byTracks5Clamped.route, 'DUAL-TRACK');
    assert.equal(byTracks5Clamped.trackMode, 'QUAD-TRACK');
    assert.equal(byTracks5Clamped.requestedTracks, 4);
    assert.equal(byTracks5Clamped.maxTracks, 4);

    const byTracks1Clamped = classifySkizzoTask('/skizzo --tracks 1 valuta questo flusso');
    assert.equal(byTracks1Clamped.route, 'DUAL-TRACK');
    assert.equal(byTracks1Clamped.trackMode, 'DUAL-TRACK');
    assert.equal(byTracks1Clamped.requestedTracks, 2);
    assert.equal(byTracks1Clamped.minTracks, 2);

    const byNatural3 = classifySkizzoTask('valuta questo bottone con 3 agenti');
    assert.equal(byNatural3.route, 'DUAL-TRACK');
    assert.equal(byNatural3.trackMode, 'TRI-TRACK');
    assert.equal(byNatural3.requestedTracks, 3);
  });

  it('honors explicit --skip and natural language fast overrides on complex tasks while keeping sticky state ON', () => {
    const byFlag = classifySkizzoTask('/skizzo --skip progetta un nuovo modulo di autenticazione con form UI');
    assert.equal(byFlag.route, 'FAST-PASS');
    assert.equal(byFlag.keepStickyOn, true);

    const byNatural = classifySkizzoTask('fai una risposta veloce senza skizzo per questa funzione di calcolo e filtro UI');
    assert.equal(byNatural.route, 'FAST-PASS');
    assert.equal(byNatural.keepStickyOn, true);
  });

  it('ranks arbitrary LLM-discovered domains by importance and tension, capping at max 4 agents (rankAndCapDomains)', () => {
    const candidates = [
      { role: 'Dominio Secondario Marginale', importance: 2, tension: 2 },
      { role: 'Prospettiva Utente Principiante', importance: 8, tension: 7 },
      { role: 'Architettura Core & Performance', importance: 9, tension: 8 },
      { role: 'Sostenibilità Economica', importance: 4, tension: 3 },
      { role: 'Specialista di Dominio Verticale', importance: 10, tension: 9 },
      { role: 'Ergonomia & Layout Visivo', importance: 7, tension: 6 }
    ];

    const ranked = rankAndCapDomains(candidates);
    assert.equal(ranked.trackCount, 4);
    assert.equal(ranked.trackMode, 'QUAD-TRACK');
    assert.deepEqual(
      ranked.selectedDomains.map((d) => d.trackId),
      ['Alpha', 'Beta', 'Delta', 'Epsilon']
    );
    assert.deepEqual(
      ranked.selectedDomains.map((d) => d.role),
      [
        'Specialista di Dominio Verticale',
        'Architettura Core & Performance',
        'Prospettiva Utente Principiante',
        'Ergonomia & Layout Visivo'
      ]
    );
    assert.equal(ranked.droppedDomains.length, 2);
    assert.equal(ranked.droppedDomains[0].role, 'Sostenibilità Economica');
  });

  it('clamps out-of-range metrics, preserves highest-scoring duplicate, and handles numeric IDs in rankAndCapDomains (Beta Oracle)', () => {
    const ranked = rankAndCapDomains([
      { id: 101, role: 'Dominio Duplicato', importance: 2, tension: 2 },
      { id: 102, role: 'Dominio Duplicato', importance: 99, tension: 99 },
      { id: null, role: 'Dominio Con Valori Nulli', importance: null, tension: '' },
      { id: false, role: 'Dominio Con Valori Negativi', importance: -20, tension: -5 }
    ]);

    assert.equal(ranked.trackCount, 3);
    assert.equal(ranked.trackMode, 'TRI-TRACK');
    assert.equal(ranked.selectedDomains[0].role, 'Dominio Duplicato');
    assert.equal(ranked.selectedDomains[0].importance, 10);
    assert.equal(ranked.selectedDomains[0].tension, 10);
    assert.equal(ranked.selectedDomains[0].priorityScore, 30);

    assert.equal(ranked.selectedDomains[1].role, 'Dominio Con Valori Nulli');
    assert.equal(ranked.selectedDomains[1].importance, 5);
    assert.equal(ranked.selectedDomains[1].tension, 5);
    assert.equal(ranked.selectedDomains[1].priorityScore, 15);

    assert.equal(ranked.selectedDomains[2].importance, 0);
    assert.equal(ranked.selectedDomains[2].priorityScore, 0);

    const single = rankAndCapDomains([{ role: 'Unico Dominio', importance: 8, tension: 5 }]);
    assert.equal(single.trackCount, 1);
    assert.equal(single.trackMode, 'FAST-PASS');
  });

  it('executes CLI entrypoint reliably on Windows with --tracks flag and sanitizes unbolded Skizzo banners in bench.mjs (Beta Oracle)', () => {
    const stdout = execFileSync(process.execPath, [TRIAGE_SCRIPT, '--tracks', '3', 'valuta questo flusso'], {
      encoding: 'utf-8'
    });
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.trackMode, 'TRI-TRACK');
    assert.equal(parsed.requestedTracks, 3);

    const rawBanner = [
      '> [!IMPORTANT]',
      '> MODALITÀ SKIZZO ATTIVA (TRI-TRACK — 3 Domini per Importanza) — Subagent: [1° Ruolo Alpha](conversation://abc) · [2° Ruolo Beta](conversation://def)',
      '',
      'Risposta pulita con Oracolo di Verifica (Delta) e Skill Attive (Alpha - Test).'
    ].join('\n');
    const clean = sanitizeForBlindJudge(rawBanner);
    assert.ok(!clean.includes('MODALITÀ SKIZZO'));
    assert.ok(!clean.includes('Delta'));
    assert.ok(!clean.includes('Alpha'));
    assert.match(clean, /Suite di Verifica/);
  });

  it('emits compact single-line CLI JSON (<=6 FAST-PASS / <=8 active keys, <=170B) with lossless reconstruction', () => {
    const fastPassStdout = execFileSync(process.execPath, [TRIAGE_SCRIPT, 'spiega come funziona validate.mjs'], {
      encoding: 'utf-8'
    });
    const activeStdout = execFileSync(process.execPath, [TRIAGE_SCRIPT, '--tracks', '3', 'valuta questo flusso'], {
      encoding: 'utf-8'
    });

    assert.equal(fastPassStdout.trimEnd().includes('\n'), false);
    assert.equal(activeStdout.trimEnd().includes('\n'), false);

    const fastPassOut = JSON.parse(fastPassStdout);
    const activeOut = JSON.parse(activeStdout);

    assert.ok(Object.keys(fastPassOut).length <= 6);
    assert.ok(Object.keys(activeOut).length <= 8);
    assert.ok(Buffer.byteLength(fastPassStdout, 'utf8') <= 170);
    assert.ok(Buffer.byteLength(activeStdout, 'utf8') <= 170);
    assert.equal(formatCliResult(classifySkizzoTask('spiega come funziona validate.mjs')).route, 'FAST-PASS');
  });

  it('routes explicit stop commands to FAST-PASS with keepStickyOn=false and silentFastPass=true', () => {
    for (const cmd of ['/skizzo stop', 'stop skizzo', '/skizzo off']) {
      const res = classifySkizzoTask(cmd);
      assert.equal(res.route, 'FAST-PASS');
      assert.equal(res.score, -100);
      assert.equal(res.keepStickyOn, false);
      assert.equal(res.silentFastPass, true);
      assert.ok(res.signals.includes('guard_stop'));

      const cliOut = JSON.parse(execFileSync(process.execPath, [TRIAGE_SCRIPT, cmd], { encoding: 'utf-8' }));
      assert.equal(cliOut.route, 'FAST-PASS');
      assert.equal(cliOut.keepStickyOn, false);
      assert.equal(cliOut.silentFastPass, true);
    }
  });

  it('keeps read-only questions with passive design nouns on FAST-PASS unless imperative design intent is present', () => {
    const readonlyPrompts = [
      'come funziona l architettura del plugin skizzo e il suo flusso?',
      'spiega come funziona il sistema per filtrare e i suoi compromessi'
    ];
    for (const prompt of readonlyPrompts) {
      const res = classifySkizzoTask(prompt, { stickySessionActive: false });
      assert.equal(res.route, 'FAST-PASS', `Expected FAST-PASS for: ${prompt}`);
      assert.ok(res.signals.includes('guard_readonly'));
    }

    const imperativeWithReadonlyOpener = classifySkizzoTask(
      'spiega come funziona auth.js e poi progetta un nuovo modulo con input utente e tolleranza agli errori',
      { stickySessionActive: false }
    );
    assert.equal(imperativeWithReadonlyOpener.route, 'DUAL-TRACK');
    assert.ok(imperativeWithReadonlyOpener.score >= 4);
  });

  it('routes multi-line console/stack-trace dumps with repeated filenames to FAST-PASS (H1.1)', () => {
    const prompt = [
      'Guarda questo errore in console:',
      'index-C-ZSovau.js:142 Uncaught TypeError: Cannot read properties of undefined (reading \'map\')',
      '    at renderList (index-C-ZSovau.js:142:18)',
      '    at commitHookEffectListMount (index-C-ZSovau.js:891:5)',
      'i18n.js:6743 [WARN] Missing translation key for fallback error validation'
    ].join('\n');

    const res = classifySkizzoTask(prompt);
    assert.equal(res.route, 'FAST-PASS');
    assert.ok(res.score < 4);
    assert.equal(res.uniqueFileMentions, 0);
    assert.ok(!res.signals.includes('multi_file_scope'));
  });

  it('deduplicates repeated mentions of the same @triage.mjs file via Set (H1.2)', () => {
    const prompt = 'Controlla @triage.mjs, aggiorna la validazione in @triage.mjs e verifica @triage.mjs';
    assert.equal(countUniqueFileMentions(prompt), 1);

    const res = classifySkizzoTask(prompt);
    assert.equal(res.route, 'FAST-PASS');
    assert.equal(res.uniqueFileMentions, 1);
    assert.ok(!res.signals.includes('multi_file_scope'));

    const multiRes = classifySkizzoTask(
      'Controlla @alpha.mjs, aggiorna la validazione in @beta.mjs e verifica @gamma.mjs'
    );
    assert.equal(multiRes.uniqueFileMentions, 3);
    assert.equal(multiRes.route, 'DUAL-TRACK');
    assert.ok(multiRes.signals.includes('multi_file_scope'));
  });

  it('strips fenced code blocks containing tension keywords inside a micro-edit (H1.3)', () => {
    const prompt = [
      'cambia il padding del bottone da 8px a 12px usando questo snippet:',
      '```css',
      '/* progetta architettura responsive 360px dashboard headless core',
      '   validazione input fallback concorrenza trade-off */',
      '.btn { padding: 12px; }',
      '```'
    ].join('\n');

    const res = classifySkizzoTask(prompt);
    assert.equal(res.route, 'FAST-PASS');
    assert.ok(res.score < 3);
    assert.ok(res.signals.includes('guard_micro_edit'));
  });

  it('ignores metalinguistic flag mentions while honoring command-head -f and -m (H1.4)', () => {
    const metaPrompts = [
      'correggi il testo del flag -f in README.md',
      'spiega cosa fa "--force"',
      'spiega cosa fa `--force`',
      'aggiorna la descrizione di "-m" in README.md'
    ];

    for (const prompt of metaPrompts) {
      const res = classifySkizzoTask(prompt);
      assert.equal(res.route, 'FAST-PASS', `Expected FAST-PASS for: ${prompt}`);
      assert.ok(res.score < 4);
      assert.ok(!res.signals.includes('manual_force'));
    }

    const headForce = classifySkizzoTask('/skizzo -f cambia il colore del pulsante primario');
    assert.equal(headForce.route, 'DUAL-TRACK');
    assert.equal(headForce.score, 99);
    assert.ok(headForce.signals.includes('manual_force'));

    const headMediator = classifySkizzoTask(
      '/skizzo -m progetta il nuovo filtro di ricerca con input permissivi e architettura pura'
    );
    assert.equal(headMediator.route, 'DUAL-TRACK+MEDIATOR');
  });
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, '..');

describe('cognitive-persistence shift-left governance invariants', () => {
  const agentsMd = readFileSync(join(pluginRoot, 'rules', 'AGENTS.md'), 'utf-8');
  const reviewSkillMd = readFileSync(
    join(pluginRoot, 'skills', 'review-notes', 'SKILL.md'),
    'utf-8'
  );

  it('enforces read-only review gate and explicit ask_question confirmation in rules/AGENTS.md', () => {
    assert.match(
      agentsMd,
      /\/review-notes.*(?:Vietato modificare codice,\s*`NOTES\.md`\s*o\s*`DESIDERATA\.md`\s*prima della conferma esplicita dell'utente|NEVER modify code,\s*`NOTES\.md`,?\s*or\s*`DESIDERATA\.md`\s*before explicit user confirmation)\s*\(`ask_question`\)/i,
      'rules/AGENTS.md must explicitly forbid mutating code, NOTES.md, or DESIDERATA.md during /review-notes before ask_question confirmation'
    );
    assert.ok(
      Buffer.byteLength(agentsMd, 'utf-8') <= 6000,
      'rules/AGENTS.md must stay within the 6,000-byte Always-On ceiling'
    );
  });

  it('enforces read-only Step 3, passive /review-notes list, and mandatory Step 4 ask_question in review-notes/SKILL.md', () => {
    assert.match(
      reviewSkillMd,
      /(?:Invariante di Sola Lettura|Read-Only Invariant)\s*\(`READ-ONLY` (?:fino allo|up to) Step 4\)/i,
      'SKILL.md must declare the hard READ-ONLY invariant up to Step 4'
    );
    assert.match(
      reviewSkillMd,
      /`\/review-notes list`.*0` (?:scritture|writes).*(?:si ferma subito|stops immediately)/i,
      'SKILL.md must guarantee /review-notes list is purely passive and stops immediately'
    );
    assert.match(
      reviewSkillMd,
      /Step 3:.*(?:SOLA LETTURA|READ-ONLY)/i,
      'Step 3 must be explicitly labeled read-only'
    );
    assert.match(
      reviewSkillMd,
      /Step 4:[\s\S]*(?:anche quando c'è \*\*1 sola nota aperta\*\*|even when (?:only )?\*\*1 open note\*\* exists)[\s\S]*(?:\*\*fermati obbligatoriamente\*\* e invoca|MUST \*\*STOP\*\* and invoke) `ask_question`/i,
      'Step 4 must require stopping on ask_question even when only 1 open note exists'
    );
    assert.doesNotMatch(
      reviewSkillMd,
      /(?:Esecuzione del Task di Analisi|Execute Analysis Task)/i,
      'SKILL.md must not use misleading task-execution phrasing for read-only code review'
    );
  });
});

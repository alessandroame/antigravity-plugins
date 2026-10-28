import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateContentAndSense,
  extractTechnicalConcepts,
  inspectBuiltinEvolution
} from '../scripts/validate.mjs';

describe('Content & Sense Overlap Engine (validate.mjs)', () => {
  it('allows explicit delegation to generative_ui when using <agent-embed>', () => {
    const md =
      'Esporre il widget con `<agent-embed src="file:///test.html"></agent-embed>` seguendo i vincoli della skill nativa `generative_ui`.';
    const errors = validateContentAndSense(md, 'rules/AGENTS.md', true);
    assert.equal(errors.length, 0);
  });

  it('flags P1 content error when <agent-embed> is prescribed without delegating to generative_ui', () => {
    const md = 'Incorpora il widget con `<agent-embed src="file:///test.html"></agent-embed>`.';
    const errors = validateContentAndSense(md, 'skills/my-skill/SKILL.md', false);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /senza delegare o riferirsi alla skill Built-in 'generative_ui'/);
  });

  it('flags P1 content duplication (hypocritical delegation) when repeating >= 3 low-level generative_ui tokens', () => {
    const md =
      'Usa `<agent-embed>` seguendo `generative_ui` con `tailwindcss.min.js`, `--card`, `--foreground` e `bg-transparent`.';
    const errors = validateContentAndSense(md, 'rules/AGENTS.md', true);
    assert.ok(errors.some((e) => e.includes("duplicazione contenuto P1 con skill Built-in 'generative_ui'")));
  });

  it('flags P0 normative contradictions and deprecated slash commands in content', () => {
    const md = [
      '| Caso | `/learn` | Consiglia `/learn` |',
      '| Team | `/teamwork-preview` | Usa teamwork-preview |',
      '## 2. La Regola Aurea: Mai Cedere il Turno Senza Watchdog',
      'Imposta `<agent-embed>` con `height: 100vh`.'
    ].join('\n');
    const errors = validateContentAndSense(md, 'skills/test/SKILL.md', true);
    assert.equal(errors.length, 4);
  });

  it('detects post-update built-in content drift and maps coupled user plugins', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'agy-builtin-test-'));
    try {
      const skillsDir = join(tmp, 'skills', 'generative_ui');
      mkdirSync(skillsDir, { recursive: true });
      writeFileSync(
        join(skillsDir, 'SKILL.md'),
        '# Generative UI\n## Constraints\nUse `<agent-embed>` and `tailwindcss.min.js`.\n',
        'utf-8'
      );
      const baselinePath = join(tmp, 'baseline.json');
      writeFileSync(
        baselinePath,
        JSON.stringify({
          checksum: 'old',
          fileCount: 1,
          files: {
            'generative_ui/SKILL.md': {
              sha256: '0000000000000000000000000000000000000000000000000000000000000000',
              bytes: 10,
              headings: ['# Generative UI'],
              concepts: ['<agent-embed>']
            }
          }
        }),
        'utf-8'
      );

      const fakePlugins = [
        {
          dirName: 'code-inspector',
          concepts: extractTechnicalConcepts('Usa `<agent-embed>` e `generative_ui`.')
        }
      ];

      const evo = inspectBuiltinEvolution(fakePlugins, baselinePath, tmp);
      assert.equal(evo.available, true);
      assert.equal(evo.driftWarnings.length, 1);
      assert.match(evo.driftWarnings[0], /Contenuto built-in modificato in 'generative_ui\/SKILL\.md'/);
      assert.match(evo.driftWarnings[0], /code-inspector/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

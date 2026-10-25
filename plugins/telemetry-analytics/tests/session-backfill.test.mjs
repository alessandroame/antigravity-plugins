import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseTranscriptContent,
  parseSkillAndPluginFromPath,
  extractWorkspaceCandidateFromPath,
  syncBrainSessionsIndex,
  aggregateSessionMetrics
} from '../core/session-backfill.mjs';

const safetyTimer = setTimeout(() => {
  console.error('[FATAL TIMEOUT] session-backfill.test.mjs exceeded 45s');
  process.exit(1);
}, 45000);
safetyTimer.unref();

describe('Telemetry Analytics v2.0 — Local Brain Session Backfill Core', () => {
  it('detects skills and plugins from both legacy view_file and quoted read_file paths', () => {
    const quotedReadPath =
      '"\\"C:\\\\Users\\\\aless\\\\.gemini\\\\config\\\\plugins\\\\laws-of-ux\\\\skills\\\\laws-of-ux-audit\\\\SKILL.md\\""';
    const parsed1 = parseSkillAndPluginFromPath(quotedReadPath);
    assert.deepEqual(parsed1, {
      plugin: 'laws-of-ux',
      skill: 'laws-of-ux-audit'
    });

    const workspaceSkillPath = 'c:/github/antigravity-plugins/.agents/skills/validate-plugins/SKILL.md';
    const parsed2 = parseSkillAndPluginFromPath(workspaceSkillPath);
    assert.deepEqual(parsed2, {
      plugin: 'workspace',
      skill: 'validate-plugins'
    });
  });

  it('infers workspace repository from project file paths while ignoring internal .gemini paths', () => {
    const internal = extractWorkspaceCandidateFromPath(
      'C:\\Users\\aless\\.gemini\\antigravity\\brain\\123\\plan.md'
    );
    assert.equal(internal, null);

    const repo = extractWorkspaceCandidateFromPath(
      '"\\"c:\\\\github\\\\GlideMind\\\\src\\\\core\\\\wind.mjs\\""'
    );
    assert.deepEqual(repo, {
      workspace: 'c:/github/glidemind',
      workspaceName: 'GlideMind'
    });
  });

  it('parses a human session transcript with active duration capping, models, slash commands, and tokens', () => {
    const lines = [
      JSON.stringify({
        step_index: 0,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        created_at: '2026-10-20T10:00:00.000Z',
        content:
          '<USER_REQUEST>\n/plan /skizzo ottimizza il calcolo termiche su GlideMind\n</USER_REQUEST>\n<USER_SETTINGS_CHANGE>\nThe user changed setting `Model Selection` from None to Gemini 4 Argon (High).\n</USER_SETTINGS_CHANGE>'
      }),
      JSON.stringify({
        step_index: 1,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        created_at: '2026-10-20T10:02:00.000Z', // +2 min active
        input_tokens: 12000,
        output_tokens: 800,
        cache_read_tokens: 24000,
        tool_calls: [
          {
            name: 'read_file',
            args: {
              Path: '"\\"c:\\\\github\\\\GlideMind\\\\src\\\\core\\\\thermal.js\\""'
            }
          },
          {
            name: 'read_file',
            args: {
              Path: '"\\"C:\\\\Users\\\\aless\\\\.gemini\\\\config\\\\plugins\\\\laws-of-ux\\\\skills\\\\laws-of-ux-audit\\\\SKILL.md\\""'
            }
          },
          {
            name: 'invoke_subagent',
            args: { Role: 'Domain Architect' }
          }
        ]
      }),
      JSON.stringify({
        step_index: 2,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        created_at: '2026-10-20T14:00:00.000Z', // +3h58m idle gap (> 15m, must be excluded from active time)
        content: '<USER_REQUEST>\n/memory-sync procedi pure\n</USER_REQUEST>'
      }),
      JSON.stringify({
        step_index: 3,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        created_at: '2026-10-20T14:03:00.000Z', // +3 min active
        input_tokens: 8000,
        output_tokens: 600,
        cache_read_tokens: 36000,
        tool_calls: [
          {
            name: 'edit_file',
            args: {
              Path: 'c:/github/GlideMind/src/core/thermal.js'
            }
          }
        ]
      })
    ];

    const summary = parseTranscriptContent(lines.join('\n'), 'conv-human-1');
    assert.equal(summary.isSubagent, false);
    assert.equal(summary.userPromptsCount, 2);
    assert.equal(summary.plannerTurnsCount, 2);
    assert.equal(summary.subagentsSpawnedCount, 1);
    assert.equal(summary.workspace, 'c:/github/glidemind');
    assert.equal(summary.workspaceName, 'GlideMind');

    // Active time should be 2m + 3m = 5m (300,000 ms), ignoring the ~4h break
    assert.equal(summary.activeDurationMs, 5 * 60 * 1000);

    // Tokens
    assert.equal(summary.tokens.input, 20000);
    assert.equal(summary.tokens.output, 1400);
    assert.equal(summary.tokens.cacheRead, 60000);

    // Models
    assert.ok(summary.modelsUsed['Gemini 4 Argon (High)'] >= 1);

    // Slash commands
    assert.equal(summary.slashCommands['/plan'], 1);
    assert.equal(summary.slashCommands['/skizzo'], 1);
    assert.equal(summary.slashCommands['/memory-sync'], 1);

    // Plugins credited via read_file and slash commands
    assert.equal(summary.plugins['laws-of-ux'].skills['laws-of-ux-audit'], 1);
    assert.equal(summary.plugins['skizzo'].skills['skizzo'], 1);
    assert.equal(summary.plugins['cognitive-persistence'].skills['memory-sync'], 1);

    // Per-prompt breakdown (v2.1)
    assert.equal(summary.promptsBreakdown.length, 2);
    const p1 = summary.promptsBreakdown[0];
    assert.equal(p1.promptNumber, 1);
    assert.equal(p1.plannerTurns, 1);
    assert.equal(p1.toolCalls, 3);
    assert.equal(p1.durationMs, 2 * 60 * 1000);
    assert.equal(p1.inputTokens, 12000);
    assert.equal(p1.outputTokens, 800);
    assert.equal(p1.cacheReadTokens, 24000);
    assert.equal(p1.contextTokens, 36000); // 12000 + 24000
    assert.equal(p1.cumulativeDirectTokens, 12800);
    assert.equal(p1.cumulativeCacheTokens, 24000);

    const p2 = summary.promptsBreakdown[1];
    assert.equal(p2.promptNumber, 2);
    assert.equal(p2.plannerTurns, 1);
    assert.equal(p2.toolCalls, 1);
    assert.equal(p2.durationMs, 3 * 60 * 1000);
    assert.equal(p2.inputTokens, 8000);
    assert.equal(p2.outputTokens, 600);
    assert.equal(p2.cacheReadTokens, 36000);
    assert.equal(p2.contextTokens, 44000); // 8000 + 36000
    assert.equal(p2.cumulativeDirectTokens, 21400);
    assert.equal(p2.cumulativeCacheTokens, 60000);
  });

  it('classifies subagent transcripts accurately', () => {
    const subLines = [
      JSON.stringify({
        step_index: 0,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        created_at: '2026-10-20T10:02:10.000Z',
        content: '<USER_REQUEST>\nSkill Attive (Alpha - UX Auditor): laws-of-ux-audit\n</USER_REQUEST>'
      }),
      JSON.stringify({
        step_index: 1,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        created_at: '2026-10-20T10:02:30.000Z',
        input_tokens: 5000,
        output_tokens: 300,
        cache_read_tokens: 0
      })
    ];

    const summary = parseTranscriptContent(subLines.join('\n'), 'conv-sub-1');
    assert.equal(summary.isSubagent, true);

    // Parent human session receiving a subagent reply in step 2 must remain isSubagent = false
    const parentWithReply = [
      JSON.stringify({
        step_index: 0,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        created_at: '2026-10-20T10:00:00.000Z',
        content: '<USER_REQUEST>/skizzo progetta nuova vista</USER_REQUEST>'
      }),
      JSON.stringify({
        step_index: 2,
        source: 'SYSTEM',
        type: 'SYSTEM_MESSAGE',
        created_at: '2026-10-20T10:01:00.000Z',
        content: '[Message] timestamp=2026-10-20T10:01:00Z sender=12345678-1234-1234-1234-1234567890ab content=Skill Attive (Alpha - UX)'
      })
    ];
    const parentSummary = parseTranscriptContent(parentWithReply.join('\n'), 'conv-parent-1');
    assert.equal(parentSummary.isSubagent, false);
  });

  it('synchronizes brain directory incrementally and aggregates metrics with filters', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'agy-telemetry-test-'));
    const brainDir = join(tempRoot, 'brain');
    const analyticsDir = join(tempRoot, 'analytics');

    try {
      const conv1Dir = join(brainDir, 'conv-1', '.system_generated', 'logs');
      const conv2Dir = join(brainDir, 'conv-2', '.system_generated', 'logs');
      mkdirSync(conv1Dir, { recursive: true });
      mkdirSync(conv2Dir, { recursive: true });

      writeFileSync(
        join(conv1Dir, 'transcript.jsonl'),
        JSON.stringify({
          step_index: 0,
          source: 'USER_EXPLICIT',
          type: 'USER_INPUT',
          created_at: '2026-10-22T09:00:00.000Z',
          content: '<USER_REQUEST>/next-step avvia task su GlideMind</USER_REQUEST>'
        }) +
          '\n' +
          JSON.stringify({
            step_index: 1,
            source: 'MODEL',
            type: 'PLANNER_RESPONSE',
            created_at: '2026-10-22T09:04:00.000Z',
            input_tokens: 10000,
            output_tokens: 500,
            cache_read_tokens: 20000,
            tool_calls: [{ name: 'read_file', args: { Path: 'c:/github/GlideMind/README.md' } }]
          }) +
          '\n',
        'utf-8'
      );

      writeFileSync(
        join(conv2Dir, 'transcript.jsonl'),
        JSON.stringify({
          step_index: 0,
          source: 'SYSTEM',
          type: 'SYSTEM_MESSAGE',
          created_at: '2026-10-22T09:01:00.000Z',
          content: 'Sei **Subagent Alpha**'
        }) + '\n',
        'utf-8'
      );

      // First run: scans 2 files
      const firstRun = syncBrainSessionsIndex({ brainDir, analyticsDir });
      assert.equal(firstRun.stats.scanned, 2);
      assert.equal(firstRun.stats.cached, 0);

      // Second run: hits incremental cache for all 2 files
      const secondRun = syncBrainSessionsIndex({ brainDir, analyticsDir });
      assert.equal(secondRun.stats.scanned, 0);
      assert.equal(secondRun.stats.cached, 2);

      const agg = aggregateSessionMetrics(secondRun.index, {});
      assert.equal(agg.humanSessions, 1);
      assert.equal(agg.subagentSessions, 1);
      assert.equal(agg.totalPrompts, 1);
      assert.equal(agg.workspaces['c:/github/glidemind'].humanSessions, 1);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

/**
 * Headless Review, Test Integrity & Transcript Delivery Verification Engine
 * Pure Node.js core module (zero browser globals) powering:
 *  1. Dynamic repository unit-test discovery (anti-hardcoding)
 *  2. Unified Git diff triage, test-tampering guard, and faux-test detection
 *  3. Transcript-verified delivery gate (ensuring tests/probes run AFTER final edits)
 *  4. Declarative UI smoke-flow config validation and 4-measure receipt aggregation
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const TEST_FILE_RX = /(?:^|\/)(?:tests?|__tests__)\/|\.(?:test|spec)\.[a-z0-9]+$/i;
const UI_FILE_RX = /\.(?:html|css|scss|sass|less|vue|svelte|jsx|tsx)$/i;
const UI_DIR_RX = /(?:^|\/)(?:ui|views|components|pages)\//i;
const COGNITIVE_OR_DOC_RX =
  /(?:^|\/)(?:README|MEMORY|WORKLOG|DESIDERATA|NOTES|CHANGELOG)\.md$|\.agents\/(?:worklog\.d|archive)\//i;
const TEMPLATE_HTML_RX = /(?:^|\/)references\/[^/]*template[^/]*\.html$/i;
const SCRATCH_OR_BRAIN_RX = /\/\.gemini\/antigravity\/brain\/|\/scratch\//i;
const VERIFIABLE_CODE_RX =
  /\.(?:m?js|cjs|ts|py|dart|go|rs|java|kt|rb|php|sh|ps1|json)$|(?:^|\/)(?:SKILL|AGENTS)\.md$/i;

const ASSERTION_TOKEN_RX =
  /\b(?:assert\.[a-zA-Z_]+|expect\s*\(|should\.[a-zA-Z_]+|assert_[a-z_]+|assertEquals|assertTrue|assertFalse)\b/;
const TEST_BLOCK_TOKEN_RX = /^\s*(?:it|test|describe)\s*\(/;
const TAUTOLOGY_ASSERT_RX =
  /\b(?:assert\.ok\s*\(\s*(?:true|1|'[^']+'|"[^"]+")\s*\)|assert\.(?:strictEqual|equal)\s*\(\s*(true|false|\d+)\s*,\s*\1\s*\)|expect\s*\(\s*(true|false|\d+)\s*\)\.toBe\s*\(\s*\1\s*\))/;

const RISK_PATTERNS = [
  {
    tag: 'ERROR_HANDLING',
    weight: 5,
    rx: /\b(?:catch\s*(?:\([^)]*\))?\s*\{|throw\s+new\s+|Promise\.reject)/
  },
  {
    tag: 'UNSAFE_SINK',
    weight: 5,
    rx: /\b(?:innerHTML\s*=|eval\s*\(|new\s+Function\s*\(|dangerouslySetInnerHTML)/
  },
  {
    tag: 'IO_OR_PROCESS',
    weight: 4,
    rx: /\b(?:fetch\s*\(|spawn(?:Sync)?\s*\(|exec(?:File)?(?:Sync)?\s*\(|writeFileSync|appendFileSync|unlinkSync|rmSync|process\.exit)/
  },
  {
    tag: 'STATE_MUTATION',
    weight: 3,
    rx: /\b(?:setState\s*\(|store\.|state\.[a-zA-Z0-9_]+\s*=|cursor\.[a-zA-Z0-9_]+\s*=|cache\.|setItem\s*\(|removeItem\s*\()/
  },
  {
    tag: 'PUBLIC_CONTRACT',
    weight: 2,
    rx: /^\s*export\s+(?:async\s+)?(?:function|class|const)\s+[a-zA-Z0-9_]+/
  },
  {
    tag: 'UI_LAYOUT_GEOMETRY',
    weight: 2,
    rx: /\b(?:z-index\s*:|overflow(?:-x|-y)?\s*:\s*(?:hidden|clip|scroll|auto)|position\s*:\s*(?:fixed|absolute)|100vh\b|100dvh\b)/i
  }
];

const TEST_COMMAND_RX =
  /\b(?:npm\s+test|npm\s+run\s+(?:test|validate)|pnpm\s+test|yarn\s+test|node\s+[^\r\n]*?(?:--test|validate\.mjs|run-all-tests\.mjs|session-miner\.mjs\s+[^\r\n]*?--verify-and-sync)|pytest|vitest|jest|playwright\s+test|flutter\s+test|dart\s+test|cargo\s+test|go\s+test)\b/i;

const UI_VERIFY_COMMAND_RX =
  /\b(?:ui-smoke-runner|ui-geometry-probe|playwright\s+test)\b/i;

const UI_VERIFY_MCP_TOOLS = new Set([
  'evaluate_script',
  'take_screenshot',
  'take_snapshot',
  'mcp_chrome-devtools_evaluate_script',
  'mcp_chrome-devtools_take_screenshot',
  'mcp_chrome-devtools_take_snapshot'
]);

const SUBAGENT_PROMPT_RX =
  /Skill Attive \((?:Alpha|Beta|Gamma|Delta|Epsilon)|Agisci esclusivamente come \*\*Subagent|Sei \*\*Subagent|Sfidante [AB]|Giudice Cieco|Blind Diff Critic/i;

/**
 * Unwraps escaped quotes and normalizes slashes for cross-platform path comparisons.
 * @param {string} raw
 * @returns {string}
 */
export function unwrapNormalizedPath(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  let text = raw.trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    try {
      if (text.startsWith('"')) text = JSON.parse(text);
      else text = text.slice(1, -1);
    } catch {
      text = text.slice(1, -1);
    }
  }
  return text.replace(/\\+/g, '/').replace(/\/+/g, '/').trim();
}

/**
 * Recursively discovers unit test files (*.test.mjs, *.test.js, *.spec.mjs, *.spec.js)
 * across a repository without hardcoded file lists.
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function discoverRepositoryTestFiles(repoRoot) {
  const root = resolve(repoRoot);
  const discovered = [];
  const ignoredDirs = new Set(['node_modules', '.git', 'archive', '.gemini', 'dist', 'build', 'coverage']);

  function walk(dir) {
    if (!existsSync(dir)) return;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ignoredDirs.has(ent.name)) continue;
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && /\.(?:test|spec)\.m?js$/i.test(ent.name)) {
        discovered.push(full);
      }
    }
  }

  walk(root);
  return discovered.sort((a, b) => a.localeCompare(b));
}

/**
 * Classifies a repository-relative path into review domains.
 * @param {string} filePath
 * @returns {'test' | 'docs' | 'ui' | 'code'}
 */
export function classifyFileDomain(filePath) {
  const norm = unwrapNormalizedPath(filePath);
  if (TEST_FILE_RX.test(norm)) return 'test';
  if (COGNITIVE_OR_DOC_RX.test(norm)) return 'docs';
  if ((UI_FILE_RX.test(norm) || UI_DIR_RX.test(norm)) && !TEMPLATE_HTML_RX.test(norm)) return 'ui';
  return 'code';
}

/**
 * Parses a unified Git diff and detects test tampering, faux-tests, and high-risk lines.
 * @param {string} diffText
 * @param {{ allowTestEdits?: boolean, maxHighlights?: number }} [options]
 */
export function analyzeGitDiffForReview(diffText, options = {}) {
  const allowTestEdits = Boolean(options.allowTestEdits);
  const maxHighlights = typeof options.maxHighlights === 'number' ? options.maxHighlights : 25;

  if (typeof diffText !== 'string' || !diffText.trim()) {
    return {
      status: 'PASS',
      summary: {
        filesChanged: 0,
        totalChangedLines: 0,
        criticalHighlightCount: 0,
        reductionPercent: 100
      },
      files: [],
      testTamperAlerts: [],
      fauxTestAlerts: [],
      criticalHighlights: []
    };
  }

  const lines = diffText.split(/\r?\n/);
  const fileMap = new Map();
  let currentFile = null;
  let newLineNum = 0;
  let totalChangedLines = 0;

  for (const rawLine of lines) {
    const gitHeader = rawLine.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (gitHeader) {
      const filePath = gitHeader[2].trim();
      currentFile = {
        file: filePath,
        domain: classifyFileDomain(filePath),
        addedCount: 0,
        removedCount: 0,
        addedLines: [],
        removedLines: []
      };
      fileMap.set(filePath, currentFile);
      newLineNum = 0;
      continue;
    }

    if (!currentFile) continue;

    const hunkHeader = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkHeader) {
      newLineNum = parseInt(hunkHeader[1], 10);
      continue;
    }

    if (rawLine.startsWith('+++ ') || rawLine.startsWith('--- ')) {
      continue;
    }

    if (rawLine.startsWith('+')) {
      const content = rawLine.slice(1);
      currentFile.addedCount += 1;
      totalChangedLines += 1;
      currentFile.addedLines.push({ line: newLineNum, content });
      newLineNum += 1;
    } else if (rawLine.startsWith('-')) {
      const content = rawLine.slice(1);
      currentFile.removedCount += 1;
      totalChangedLines += 1;
      currentFile.removedLines.push({ content });
    } else if (rawLine.startsWith(' ')) {
      newLineNum += 1;
    }
  }

  const files = [...fileMap.values()];
  const hasAppChanges = files.some((f) => f.domain === 'code' || f.domain === 'ui');
  const testTamperAlerts = [];
  const fauxTestAlerts = [];
  const candidateHighlights = [];

  for (const f of files) {
    if (f.domain === 'test') {
      const removedAssertions = f.removedLines.filter((l) => ASSERTION_TOKEN_RX.test(l.content)).length;
      const addedAssertions = f.addedLines.filter((l) => ASSERTION_TOKEN_RX.test(l.content)).length;
      const removedTestBlocks = f.removedLines.filter((l) => TEST_BLOCK_TOKEN_RX.test(l.content)).length;

      if (!allowTestEdits && (removedAssertions > 0 || removedTestBlocks > 0)) {
        const netAssertionDrop = removedAssertions > addedAssertions || removedTestBlocks > 0;
        const severity = netAssertionDrop ? 'HIGH' : hasAppChanges ? 'MEDIUM' : 'LOW';
        if (severity !== 'LOW') {
          testTamperAlerts.push({
            file: f.file,
            severity,
            removedAssertions,
            addedAssertions,
            removedTestBlocks,
            message: netAssertionDrop
              ? `Existing assertions or test blocks were deleted in ${f.file} (-${removedAssertions} assertions, -${removedTestBlocks} blocks).`
              : `Existing assertions were altered in ${f.file} alongside production changes (-${removedAssertions}/+${addedAssertions}). Verify oracle independence.`
          });
        }
      }

      for (const added of f.addedLines) {
        if (TAUTOLOGY_ASSERT_RX.test(added.content)) {
          fauxTestAlerts.push({
            file: f.file,
            line: added.line,
            type: 'TAUTOLOGICAL_ASSERTION',
            snippet: added.content.trim().slice(0, 100)
          });
        }
      }

      // Detect added single-block test definitions with zero assertions in the added lines of the file
      const addedTestBlocks = f.addedLines.filter((l) => /^\s*(?:it|test)\s*\(/.test(l.content));
      if (addedTestBlocks.length > 0 && addedAssertions === 0) {
        const hasThrowsOrRejects = f.addedLines.some((l) => /\b(?:rejects|throws)\b/.test(l.content));
        if (!hasThrowsOrRejects) {
          fauxTestAlerts.push({
            file: f.file,
            line: addedTestBlocks[0].line,
            type: 'ASSERTION_FREE_TEST',
            snippet: addedTestBlocks[0].content.trim().slice(0, 100)
          });
        }
      }
      continue;
    }

    if (f.domain === 'docs') continue;

    for (const added of f.addedLines) {
      const trimmed = added.content.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        continue;
      }
      for (const rule of RISK_PATTERNS) {
        if (rule.rx.test(added.content)) {
          candidateHighlights.push({
            file: f.file,
            line: added.line,
            tag: rule.tag,
            weight: rule.weight,
            snippet: trimmed.slice(0, 110)
          });
          break;
        }
      }
    }
  }

  candidateHighlights.sort((a, b) => b.weight - a.weight || a.file.localeCompare(b.file) || a.line - b.line);
  const criticalHighlights = candidateHighlights.slice(0, maxHighlights).map(({ weight: _w, ...rest }) => rest);

  const reductionPercent =
    totalChangedLines > 0
      ? Math.max(0, Math.round((1 - criticalHighlights.length / totalChangedLines) * 100))
      : 100;

  let status = 'PASS';
  if (fauxTestAlerts.length > 0 || testTamperAlerts.some((a) => a.severity === 'HIGH')) {
    status = 'BLOCK';
  } else if (testTamperAlerts.length > 0) {
    status = 'WARN';
  }

  return {
    status,
    summary: {
      filesChanged: files.length,
      totalChangedLines,
      criticalHighlightCount: criticalHighlights.length,
      reductionPercent
    },
    files: files.map((f) => ({
      file: f.file,
      domain: f.domain,
      addedCount: f.addedCount,
      removedCount: f.removedCount
    })),
    testTamperAlerts,
    fauxTestAlerts,
    criticalHighlights
  };
}

/**
 * Verifies on parsed transcript steps whether all code and UI modifications
 * in the active user turn were followed by a passing test/validation run and UI probe.
 * @param {Array<Record<string, any>>} steps
 * @returns {{
 *   ok: boolean,
 *   skippedReason: string | null,
 *   missingCodeVerification: boolean,
 *   missingUiVerification: boolean,
 *   lastCodeEditStep: number,
 *   lastUiEditStep: number,
 *   lastPassingTestStep: number,
 *   lastPassingUiVerifyStep: number,
 *   editedCodeFiles: string[],
 *   editedUiFiles: string[],
 *   reasonIt: string
 * }}
 */
export function verifyTranscriptDeliveryGate(steps) {
  const baseResult = {
    ok: true,
    skippedReason: null,
    missingCodeVerification: false,
    missingUiVerification: false,
    lastCodeEditStep: -1,
    lastUiEditStep: -1,
    lastPassingTestStep: -1,
    lastPassingUiVerifyStep: -1,
    editedCodeFiles: [],
    editedUiFiles: [],
    reasonIt: ''
  };

  if (!Array.isArray(steps) || steps.length === 0) {
    return { ...baseResult, skippedReason: 'empty_transcript' };
  }

  const sorted = [...steps].sort((a, b) => (a.step_index ?? 0) - (b.step_index ?? 0));

  // Subagent session detection on early steps
  const earlyText = JSON.stringify(sorted.slice(0, 3));
  if (SUBAGENT_PROMPT_RX.test(earlyText)) {
    return { ...baseResult, skippedReason: 'subagent_session' };
  }

  let lastUserIdx = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = sorted[i];
    const isUser =
      s.type === 'USER_INPUT' ||
      s.source === 'USER_EXPLICIT' ||
      s.type === 'CORTEX_STEP_TYPE_USER_INPUT';
    if (isUser) {
      lastUserIdx = i;
      break;
    }
  }

  if (lastUserIdx === -1) {
    return { ...baseResult, skippedReason: 'no_user_prompt' };
  }

  const turnSteps = sorted.slice(lastUserIdx + 1);
  if (turnSteps.length === 0) {
    return { ...baseResult, skippedReason: 'no_assistant_steps' };
  }

  let lastCodeEditStep = -1;
  let lastUiEditStep = -1;
  let lastPassingTestStep = -1;
  let lastPassingUiVerifyStep = -1;
  let lastSubagentSpawnStep = -1;
  let lastAskQuestionStep = -1;

  const codeFilesSet = new Set();
  const uiFilesSet = new Set();

  for (let i = 0; i < turnSteps.length; i++) {
    const step = turnSteps[i];
    const stepIdx = typeof step.step_index === 'number' ? step.step_index : i;
    const toolCalls = Array.isArray(step.tool_calls) ? step.tool_calls : [];

    // Look ahead one step to detect explicit command failure
    const nextStep = turnSteps[i + 1];
    const nextFailed =
      nextStep &&
      (nextStep.status === 'ERROR' ||
        (typeof nextStep.content === 'string' && /Command exited with code [^0]/i.test(nextStep.content)));

    for (const tc of toolCalls) {
      if (!tc || !tc.name) continue;
      const name = tc.name;
      const args = tc.args || {};

      if (name === 'invoke_subagent') {
        lastSubagentSpawnStep = stepIdx;
      }
      if (name === 'ask_question') {
        lastAskQuestionStep = stepIdx;
      }

      if (
        name === 'edit_file' ||
        name === 'write_file' ||
        name === 'replace_file_content' ||
        name === 'multi_replace_file_content'
      ) {
        const rawPath = unwrapNormalizedPath(args.Path || args.TargetFile || '');
        if (!rawPath || SCRATCH_OR_BRAIN_RX.test(rawPath) || COGNITIVE_OR_DOC_RX.test(rawPath)) {
          continue;
        }
        const domain = classifyFileDomain(rawPath);
        if (domain === 'ui') {
          lastUiEditStep = stepIdx;
          uiFilesSet.add(rawPath.split('/').slice(-2).join('/'));
          // UI files that contain logic (.jsx/.tsx/.vue/.svelte) also count as code if project has tests
          if (/\.(?:jsx|tsx|vue|svelte)$/i.test(rawPath)) {
            lastCodeEditStep = stepIdx;
            codeFilesSet.add(rawPath.split('/').slice(-2).join('/'));
          }
        } else if (domain === 'code' || domain === 'test') {
          if (VERIFIABLE_CODE_RX.test(rawPath) || domain === 'test') {
            lastCodeEditStep = stepIdx;
            codeFilesSet.add(rawPath.split('/').slice(-2).join('/'));
          }
        }
      }

      if (name === 'run_command' && !nextFailed) {
        const cmd = unwrapNormalizedPath(args.CommandLine || '');
        if (TEST_COMMAND_RX.test(cmd)) {
          lastPassingTestStep = stepIdx;
        }
        if (UI_VERIFY_COMMAND_RX.test(cmd)) {
          lastPassingUiVerifyStep = stepIdx;
        }
      }

      if (!nextFailed) {
        const mcpToolName = name === 'call_mcp_tool' ? String(args.ToolName || '') : name;
        if (UI_VERIFY_MCP_TOOLS.has(mcpToolName)) {
          lastPassingUiVerifyStep = stepIdx;
        }
      }
    }
  }

  // Do not block intermediate turns waiting on subagents or user answers
  const maxEditStep = Math.max(lastCodeEditStep, lastUiEditStep);
  if (lastAskQuestionStep > maxEditStep || (lastSubagentSpawnStep > maxEditStep && maxEditStep === -1)) {
    return { ...baseResult, skippedReason: 'awaiting_subagent_or_user' };
  }

  const missingCodeVerification = lastCodeEditStep >= 0 && lastPassingTestStep < lastCodeEditStep;
  const missingUiVerification = lastUiEditStep >= 0 && lastPassingUiVerifyStep < lastUiEditStep;
  const ok = !missingCodeVerification && !missingUiVerification;

  const reasons = [];
  if (missingCodeVerification) {
    reasons.push(
      `modifiche codice/config ([${[...codeFilesSet].slice(0, 4).join(', ')}]) successive o prive di esecuzione test/validazione`
    );
  }
  if (missingUiVerification) {
    reasons.push(
      `modifiche UI ([${[...uiFilesSet].slice(0, 4).join(', ')}]) prive di verifica sonda geometrica o ui-smoke-runner`
    );
  }

  const reasonIt = ok
    ? ''
    : `[DELIVERY-GATE] Rilevate ${reasons.join(' e ')}. Esegui la suite di test (es. npm test / validate) e/o la sonda geometrica UI dopo l'ultimo edit_file prima di consegnare la risposta finale.`;

  return {
    ok,
    skippedReason: null,
    missingCodeVerification,
    missingUiVerification,
    lastCodeEditStep,
    lastUiEditStep,
    lastPassingTestStep,
    lastPassingUiVerifyStep,
    editedCodeFiles: [...codeFilesSet],
    editedUiFiles: [...uiFilesSet],
    reasonIt
  };
}

/**
 * Validates declarative `.agents/smoke-flows.json` structure for headless multi-viewport UI testing.
 * @param {Record<string, any>} config
 * @returns {{ valid: boolean, errors: string[], normalized: Record<string, any> | null }}
 */
export function validateSmokeFlowConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Configuration must be a JSON object.'], normalized: null };
  }

  const baseUrl = typeof config.baseUrl === 'string' ? config.baseUrl.trim() : '';
  if (!baseUrl || !/^(?:https?|file):\/\//i.test(baseUrl)) {
    errors.push('Field "baseUrl" must be a valid http://, https://, or file:// URL.');
  }

  const defaultViewports = [
    { name: 'mobile', width: 360, height: 800 },
    { name: 'desktop', width: 1280, height: 800 }
  ];

  const rawViewports = Array.isArray(config.viewports) && config.viewports.length > 0
    ? config.viewports
    : defaultViewports;

  const viewports = [];
  for (const [idx, vp] of rawViewports.entries()) {
    if (
      !vp ||
      typeof vp.name !== 'string' ||
      typeof vp.width !== 'number' ||
      typeof vp.height !== 'number' ||
      vp.width < 200 ||
      vp.height < 200
    ) {
      errors.push(`viewports[${idx}] must define { name, width >= 200, height >= 200 }.`);
    } else {
      viewports.push({ name: vp.name.trim(), width: Math.round(vp.width), height: Math.round(vp.height) });
    }
  }

  const rawFlows = Array.isArray(config.flows) && config.flows.length > 0
    ? config.flows
    : [{ name: 'default-load', path: '', steps: [] }];

  const allowedActions = new Set(['click', 'fill', 'wait', 'press']);
  const flows = [];
  for (const [fIdx, flow] of rawFlows.entries()) {
    if (!flow || typeof flow.name !== 'string' || !flow.name.trim()) {
      errors.push(`flows[${fIdx}] must define a non-empty "name".`);
      continue;
    }
    const steps = Array.isArray(flow.steps) ? flow.steps : [];
    for (const [sIdx, st] of steps.entries()) {
      if (!st || !allowedActions.has(st.action)) {
        errors.push(`flows[${fIdx}].steps[${sIdx}] has unsupported action "${st?.action}".`);
      } else if ((st.action === 'click' || st.action === 'fill') && typeof st.selector !== 'string') {
        errors.push(`flows[${fIdx}].steps[${sIdx}] (${st.action}) requires a "selector" string.`);
      }
    }
    flows.push({
      name: flow.name.trim(),
      path: typeof flow.path === 'string' ? flow.path.trim() : '',
      steps,
      assertVisibleSelector: typeof flow.assertVisibleSelector === 'string' ? flow.assertVisibleSelector : null
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? { baseUrl, viewports, flows } : null
  };
}

/**
 * Aggregates multi-viewport geometry probe and interaction runs into the canonical 4-Measure Receipt.
 * @param {Array<{
 *   viewport: string,
 *   flow: string,
 *   beforeProbe: { pass: boolean, primaryCanvasRatio: number | null, violations: any[] },
 *   afterProbe: { pass: boolean, primaryCanvasRatio: number | null, violations: any[] },
 *   consoleErrors: string[],
 *   interactionSucceeded: boolean
 * }>} runs
 */
export function buildFourMeasureReceipt(runs) {
  const safeRuns = Array.isArray(runs) ? runs : [];
  let totalViolations = 0;
  let totalConsoleErrors = 0;
  let minCanvasRatio = null;
  let allFlowsPassed = safeRuns.length > 0;

  for (const r of safeRuns) {
    const vBefore = Array.isArray(r.beforeProbe?.violations) ? r.beforeProbe.violations.length : 0;
    const vAfter = Array.isArray(r.afterProbe?.violations) ? r.afterProbe.violations.length : 0;
    totalViolations += vBefore + vAfter;

    const cErrs = Array.isArray(r.consoleErrors) ? r.consoleErrors.length : 0;
    totalConsoleErrors += cErrs;

    for (const ratio of [r.beforeProbe?.primaryCanvasRatio, r.afterProbe?.primaryCanvasRatio]) {
      if (typeof ratio === 'number') {
        minCanvasRatio = minCanvasRatio === null ? ratio : Math.min(minCanvasRatio, ratio);
      }
    }

    if (!r.interactionSucceeded || !r.beforeProbe?.pass || !r.afterProbe?.pass || cErrs > 0) {
      allFlowsPassed = false;
    }
  }

  const screenBudgetPass = minCanvasRatio === null || minCanvasRatio >= 0.6;
  const overallPass = allFlowsPassed && screenBudgetPass && totalViolations === 0 && totalConsoleErrors === 0;

  return {
    overallPass,
    measures: {
      screenBudget: {
        pass: screenBudgetPass,
        minPrimaryCanvasRatio: minCanvasRatio,
        percentFree: minCanvasRatio !== null ? Math.round(minCanvasRatio * 100) : null
      },
      geometryProbe: {
        pass: totalViolations === 0,
        violationsCount: totalViolations
      },
      interactiveFlow: {
        pass: allFlowsPassed && totalConsoleErrors === 0,
        runsExecuted: safeRuns.length,
        consoleErrorsCount: totalConsoleErrors
      }
    },
    runs: safeRuns
  };
}

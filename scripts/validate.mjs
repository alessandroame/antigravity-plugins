#!/usr/bin/env node

/**
 * Antigravity Plugin Validator & Content/Sense Overlap Engine
 * Validates plugin directory structure, manifest conformity (plugin.json),
 * rules/AGENTS.md, skills/, semantic/content overlap against Built-in skills,
 * and post-update built-in content evolution (builtin-baseline.json).
 */

import { createHash } from 'node:crypto';
import { readdirSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

function loadBuiltinSkillNames() {
  const names = new Set([
    'agy-customizations',
    'antigravity-guide',
    'automation',
    'generative_ui',
    'migrate-workflows',
    'permissioned-github',
    'plugin',
    'run-workflow',
    'ui-plugin-navigation'
  ]);
  const builtinRoot = join(homedir(), '.gemini', 'antigravity', 'builtin', 'skills');
  if (existsSync(builtinRoot) && statSync(builtinRoot).isDirectory()) {
    for (const ent of readdirSync(builtinRoot, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const sf = join(builtinRoot, ent.name, 'SKILL.md');
      if (existsSync(sf)) {
        const m = readFileSync(sf, 'utf-8').match(/^name:\s*(.+)$/m);
        if (m) names.add(m[1].trim().replace(/^['"]|['"]$/g, ''));
      }
    }
  }
  return names;
}

const BUILTIN_SKILL_NAMES = loadBuiltinSkillNames();

const ALLOWED_TOP_LEVEL_FIELDS = new Set([
  'name',
  'displayName',
  'description',
  'version',
  'logo',
  'suggestedPrompts',
  'disabled'
]);

const ALLOWED_LOGO_EXTENSIONS = new Set(['.png', '.svg', '.jpg', '.jpeg', '.webp']);
const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

const BUILTIN_BOILERPLATE_SIGNATURES = [
  {
    domain: 'generative_ui',
    minMatches: 3,
    tokens: [
      'tailwindcss.min.js',
      '--card',
      '--foreground',
      '--muted-foreground',
      'bg-transparent',
      'min-h-screen',
      'h-screen',
      '100vh'
    ]
  },
  {
    domain: 'plugin',
    minMatches: 2,
    tokens: ['GetAllPlugins', 'JetboxWriteState', 'lsrpc', 'DeletePlugin', 'InstallCustomization']
  },
  {
    domain: 'automation',
    minMatches: 2,
    tokens: ['CRON_TZ=', 'agent_permissions', 'access_grants', 'sidecar://dashboard']
  }
];

const CONCEPT_ALLOWLIST_RX =
  /^(?:\/[a-z][a-z0-9-]+|<agent-embed>|UserFacing|TimerCondition|WaitMsBeforeAsync|Reactive Wakeup|PreInvocation|PostInvocation|PreToolUse|PostToolUse|SessionStart|Stop|ephemeralMessage|systemMessage|defaultRulesBudget|tailwindcss\.min\.js|--card|--foreground|--muted-foreground|--border|--primary|bg-transparent|min-h-screen|h-screen|100vh|100dvh|hooks\.json|mcp_config\.json|plugin\.json|skills\.json|plugins\.json|sidecar\.json|CRON_TZ|access_grants|run_workflow|trajectory|Streamable HTTP|customization:\/\/|sidecar:\/\/|generative_ui|agy-customizations|antigravity-guide|automation|migrate-workflows|permissioned-github|ui-plugin-navigation)$/i;

export function extractTechnicalConcepts(markdown) {
  const concepts = new Set();
  if (!markdown) return [];

  for (const m of markdown.matchAll(/`([^`\r\n]{2,60})`/g)) {
    const raw = m[1].trim();
    if (CONCEPT_ALLOWLIST_RX.test(raw)) {
      concepts.add(raw);
    }
    for (const slash of raw.matchAll(/(?:^|\s)(\/[a-z][a-z0-9-]{2,24})\b/g)) {
      concepts.add(slash[1]);
    }
  }

  const directPatterns = [
    /<agent-embed\b/gi,
    /(?:^|[\s`("|])(\/(?:compact|grill-me|boost|teamwork|goal|plan|learn|schedule|automation|plugin))\b/gm,
    /\bReactive Wakeup\b/gi,
    /\bTimerCondition\b/g,
    /\bWaitMsBeforeAsync\b/g,
    /\bDurationSeconds\b/g,
    /\bPreInvocation\b/g,
    /\bPostInvocation\b/g,
    /\bPreToolUse\b/g,
    /\bPostToolUse\b/g,
    /\bdefaultRulesBudget\b/g,
    /\bgenerative_ui\b/g,
    /\bagy-customizations\b/g,
    /\bantigravity-guide\b/g,
    /\bStreamable HTTP\b/gi,
    /\brun_workflow\b/g,
    /\bworkspace="branch"\b/g
  ];
  for (const rx of directPatterns) {
    for (const m of markdown.matchAll(rx)) {
      const tok = m[1] || m[0];
      concepts.add(tok === '<agent-embed' ? '<agent-embed>' : tok.trim());
    }
  }

  return [...concepts].sort();
}

export function validateContentAndSense(content, relPath, pluginHasGenerativeUiDelegation = false) {
  const errors = [];
  if (!content || relPath === 'README.md') return errors;
  const isMetaCollisionDoc = relPath.includes('skill-collision-check');

  const lines = content.split(/\r?\n/);

  // 1. Check undelegated <agent-embed> instruction in normative markdown
  if (!isMetaCollisionDoc && /<agent-embed\b/.test(content) && !relPath.includes('inspection-template.md')) {
    const mentionsGenUiLocally = /\bgenerative_ui\b/.test(content);
    if (!mentionsGenUiLocally && !pluginHasGenerativeUiDelegation) {
      errors.push(
        `${relPath}: prescrive '<agent-embed>' senza delegare o riferirsi alla skill Built-in 'generative_ui' (rischio disallineamento contenuto P1)`
      );
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 2. Check deprecated or conflicting slash commands and headings
    if (/\/teamwork-preview\b/.test(line)) {
      errors.push(
        `${relPath}:${lineNum}: comando slash deprecato '/teamwork-preview' nel contenuto. Usa il comando nativo '/teamwork'`
      );
    }
    if (!isMetaCollisionDoc && /\|\s*`\/learn`\s*\|/.test(line)) {
      errors.push(
        `${relPath}:${lineNum}: contraddizione normativa P0 su '/learn' (la tabella consiglia '/learn' passivo in conflitto con 'Auto-Learn L0..L3')`
      );
    }
    if (/Mai Cedere il Turno Senza Watchdog/i.test(line)) {
      errors.push(
        `${relPath}:${lineNum}: contraddizione normativa P0 col 'Reactive Wakeup' nativo nel titolo Watchdog`
      );
    }

    // 3. Check positive prescription of 100vh / h-screen on <agent-embed>
    if (
      !isMetaCollisionDoc &&
      /<agent-embed\b/.test(line) &&
      /\b(?:100vh|h-screen|min-h-screen)\b/.test(line) &&
      !/\b(?:mai|never|vietato|no|divieto|evitare)\b/i.test(line)
    ) {
      errors.push(
        `${relPath}:${lineNum}: contraddizione normativa P0 con 'generative_ui' (prescrive 100vh/h-screen su <agent-embed>)`
      );
    }

    // 4. Anti-Hypocritical Delegation: low-level built-in boilerplate duplicated in a single normative line
    if (!isMetaCollisionDoc) {
      for (const sig of BUILTIN_BOILERPLATE_SIGNATURES) {
        const matched = sig.tokens.filter((tok) => line.includes(tok));
        if (matched.length >= sig.minMatches) {
          errors.push(
            `${relPath}:${lineNum}: duplicazione contenuto P1 con skill Built-in '${sig.domain}' (${matched.length} token di implementazione ripetuti: ${matched.join(', ')}). Delega alla skill nativa senza ricopiarne il boilerplate`
          );
        }
      }
    }
  }

  return errors;
}

function stripJsonComments(text) {
  return text.replace(/^\uFEFF/, '').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseJsonSafe(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const clean = stripJsonComments(raw);
    return { data: JSON.parse(clean), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;
  const yamlBlock = match[1];
  const lines = yamlBlock.split(/\r?\n/);
  const result = { _unquotedColonError: false };
  let currentKey = null;
  let blockLines = [];

  for (const line of lines) {
    if (/^[a-zA-Z0-9_-]+:/.test(line)) {
      if (currentKey && blockLines.length > 0) {
        result[currentKey] = blockLines.join(' ').trim();
        blockLines = [];
      }
      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx).trim();
      const rawVal = line.slice(colonIdx + 1).trim();
      if (rawVal === '>-' || rawVal === '>' || rawVal === '|') {
        currentKey = key;
      } else {
        currentKey = null;
        const isQuoted = (rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"));
        if (!isQuoted && rawVal.includes(': ')) {
          result._unquotedColonError = true;
        }
        result[key] = rawVal.replace(/^['"]|['"]$/g, '');
      }
    } else if (currentKey && /^\s+/.test(line)) {
      blockLines.push(line.trim());
    }
  }
  if (currentKey && blockLines.length > 0) {
    result[currentKey] = blockLines.join(' ').trim();
  }
  return result;
}

const MULTI_TICK_SPAN = /(`{2,})([^\r\n]+?)\1/g;
const SINGLE_TICK_SPAN = /`((?:\\`|[^`\r\n])+)`/g;
const ESCAPED_BACKTICK_IN_SPAN = /\\`/;
const BOLD_INSIDE_SINGLE_SPAN = /\*\*[^*\r\n]+\*\*/;
const HARDCODED_USER_PATH = /[cC]:[\\/]+Users[\\/]+(?!<)[a-zA-Z0-9._-]+[\\/]/;
const INLINE_LATEX_FORMULA = /(?<!\\)\$(?!\s)([^$\r\n]*?(?:\\(?:le|ge|neq|times|to|rightarrow|approx|text|sim|pm|cdot)\b|[_^]|\b(?:<=|>=)\b|>[a-zA-Z0-9_.\s()-]+>)[^$\r\n]*?)(?<!\s)\$/;

export function validateMarkdownHygiene(content, relPath) {
  const hygieneErrors = [];
  const lines = content.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  let inspectFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const userPathMatch = line.match(HARDCODED_USER_PATH);
    if (userPathMatch) {
      hygieneErrors.push(`${relPath}:${lineNum}: percorso utente hardcoded '${userPathMatch[0]}' non portabile tra macchine. Usa 'c:/github/antigravity-plugins/...'`);
    }

    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const info = fenceMatch[2].trim().toLowerCase();
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
        inspectFence = info === 'markdown' || info === 'md';
        continue;
      } else if (marker[0] === fenceChar && marker.length >= fenceLen && info === '') {
        inFence = false;
        fenceChar = '';
        fenceLen = 0;
        inspectFence = false;
        continue;
      }
    }

    if (inFence && !inspectFence) continue;

    const lineWithoutMultiTicks = line.replace(MULTI_TICK_SPAN, '');

    for (const match of lineWithoutMultiTicks.matchAll(SINGLE_TICK_SPAN)) {
      const [fullSpan, inner] = match;
      if (ESCAPED_BACKTICK_IN_SPAN.test(inner)) {
        const cleanInner = inner.replace(/\\`/g, '');
        hygieneErrors.push(
          `${relPath}:${lineNum}: backtick annidato/escapato rotto in ${fullSpan}. Rimuovi i backtick interni o usa testo normale (es. ${cleanInner})`
        );
      }
      if (
        BOLD_INSIDE_SINGLE_SPAN.test(inner) &&
        inner.trim() !== '**...**' &&
        !/^[>-]\s+/.test(inner.trim())
      ) {
        const cleanBold = inner.replace(/\*\*/g, '');
        hygieneErrors.push(
          `${relPath}:${lineNum}: asterischi di grassetto dentro code span in ${fullSpan}. Sposta i backtick fuori o rimuovili (es. **${cleanBold}**)`
        );
      }
    }

    const lineWithoutCode = lineWithoutMultiTicks.replace(SINGLE_TICK_SPAN, '');
    const latexMatch = lineWithoutCode.match(INLINE_LATEX_FORMULA);
    if (latexMatch) {
      const rawFormula = latexMatch[0];
      const suggestedPlain = latexMatch[1]
        .replace(/\\text\{([^}]*)\}/g, '$1')
        .replace(/\\le\b\s*/g, '<= ')
        .replace(/\\ge\b\s*/g, '>= ')
        .replace(/\\neq\b\s*/g, '!= ')
        .replace(/\\times\b\s*/g, 'x ')
        .replace(/\\(to|rightarrow)\b\s*/g, '-> ')
        .replace(/\\(approx|sim)\b\s*/g, '~')
        .replace(/\s+/g, ' ')
        .trim();
      hygieneErrors.push(
        `${relPath}:${lineNum}: formula matematica LaTeX inline '${rawFormula}' (irregolare in chat). Usa simboli di testo normale: '${suggestedPlain}'`
      );
    }

    if (/<\/summary>\s*$/i.test(lineWithoutCode) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.trim() !== '' && !/^\s*<\/details>/i.test(nextLine)) {
        hygieneErrors.push(
          `${relPath}:${lineNum}: riga vuota obbligatoria mancante subito dopo </summary> (rompe il rendering GFM dei blocchi interni)`
        );
      }
    }
  }

  return hygieneErrors;
}

export function validatePlugin(pluginDir, existingNames = new Set(), seenSkillNames = new Map()) {
  const errors = [];
  const warnings = [];
  const dirName = pluginDir.split(/[\\/]/).pop();
  const pluginConcepts = new Set();
  let agentsRuleBytes = 0;

  // 1. plugin.json
  const manifestPath = join(pluginDir, 'plugin.json');
  if (!existsSync(manifestPath)) {
    errors.push('File obbligatorio mancante: plugin.json');
    return { dirName, errors, warnings, agentsRuleBytes, concepts: [] };
  }

  const { data: manifest, error: jsonErr } = parseJsonSafe(manifestPath);
  if (jsonErr) {
    errors.push(`plugin.json non valido: ${jsonErr}`);
    return { dirName, errors, warnings, agentsRuleBytes, concepts: [] };
  }

  if (!manifest.name) {
    errors.push('plugin.json: campo "name" mancante');
  } else {
    if (typeof manifest.name !== 'string' || !KEBAB_CASE_REGEX.test(manifest.name)) {
      errors.push(`plugin.json: "name" ('${manifest.name}') deve essere in kebab-case (minuscolo, trattini)`);
    }
    if (existingNames.has(manifest.name)) {
      errors.push(`plugin.json: nome duplicato '${manifest.name}' (già usato da un altro plugin)`);
    } else {
      existingNames.add(manifest.name);
    }
    if (manifest.name !== dirName) {
      warnings.push(`"name" ('${manifest.name}') differisce dal nome cartella ('${dirName}'). L'ID di installazione corrisponderà alla cartella.`);
    }
  }

  if (!manifest.description) {
    errors.push('plugin.json: campo "description" mancante');
  } else if (typeof manifest.description !== 'string' || manifest.description.trim().length === 0) {
    errors.push('plugin.json: "description" non può essere vuoto');
  }

  if (manifest.displayName !== undefined && (typeof manifest.displayName !== 'string' || manifest.displayName.trim().length === 0)) {
    errors.push('plugin.json: "displayName" deve essere una stringa non vuota');
  }

  if (manifest.version !== undefined && (typeof manifest.version !== 'string' || !SEMVER_REGEX.test(manifest.version))) {
    warnings.push(`plugin.json: "version" ('${manifest.version}') non rispetta il formato SemVer standard (es. 1.0.0)`);
  }

  if (manifest.suggestedPrompts !== undefined) {
    if (!Array.isArray(manifest.suggestedPrompts)) {
      errors.push('plugin.json: "suggestedPrompts" deve essere un array di stringhe');
    } else {
      if (manifest.suggestedPrompts.length > 3) {
        warnings.push(`plugin.json: definiti ${manifest.suggestedPrompts.length} suggestedPrompts. Antigravity mostra al massimo 3 prompt.`);
      }
      for (const [i, p] of manifest.suggestedPrompts.entries()) {
        if (typeof p !== 'string' || p.trim().length === 0) {
          errors.push(`plugin.json: suggestedPrompts[${i}] è vuoto o non valido`);
        }
      }
    }
  }

  if (manifest.logo !== undefined) {
    if (typeof manifest.logo !== 'string' || manifest.logo.startsWith('/') || manifest.logo.includes('://')) {
      errors.push('plugin.json: "logo" deve essere un percorso relativo locale (es. "assets/logo.svg")');
    } else {
      const ext = extname(manifest.logo).toLowerCase();
      if (!ALLOWED_LOGO_EXTENSIONS.has(ext)) {
        errors.push(`plugin.json: estensione logo '${ext}' non supportata (${[...ALLOWED_LOGO_EXTENSIONS].join(', ')})`);
      }
      const logoPath = join(pluginDir, manifest.logo);
      if (!existsSync(logoPath)) {
        errors.push(`plugin.json: file logo specificato '${manifest.logo}' non trovato sul disco`);
      }
    }
  }

  for (const key of Object.keys(manifest)) {
    if (!ALLOWED_TOP_LEVEL_FIELDS.has(key)) {
      warnings.push(`plugin.json: campo sconosciuto '${key}'. Verrà ignorato dal loader di Antigravity.`);
    }
  }

  // 2. README.md
  const readmePath = join(pluginDir, 'README.md');
  if (!existsSync(readmePath)) {
    warnings.push('README.md assente: consigliato per descrivere funzionalità e installazione.');
  }

  // 3. rules/
  const rulesDir = join(pluginDir, 'rules');
  let pluginHasGenerativeUiDelegation = false;
  if (existsSync(rulesDir)) {
    const agentsRule = join(rulesDir, 'AGENTS.md');
    if (!existsSync(agentsRule)) {
      warnings.push('rules/: cartella presente ma senza file "rules/AGENTS.md".');
    } else {
      const ruleContent = readFileSync(agentsRule, 'utf-8');
      agentsRuleBytes = Buffer.byteLength(ruleContent, 'utf-8');
      if (/\bgenerative_ui\b/.test(ruleContent)) {
        pluginHasGenerativeUiDelegation = true;
      }
      if (ruleContent.startsWith('---')) {
        warnings.push('rules/AGENTS.md: contiene frontmatter YAML. Le regole dei plugin devono essere markdown puro senza frontmatter.');
      }
      if (agentsRuleBytes > 6000) {
        errors.push(`rules/AGENTS.md: peso eccessivo (${agentsRuleBytes} byte > 6000 byte max). Compattare per preservare il token budget inline.`);
      }
    }
    const ruleEntries = readdirSync(rulesDir, { withFileTypes: true });
    for (const rEnt of ruleEntries) {
      if (rEnt.isFile() && rEnt.name.endsWith('.md')) {
        const rContent = readFileSync(join(rulesDir, rEnt.name), 'utf-8');
        const rel = `rules/${rEnt.name}`;
        errors.push(...validateMarkdownHygiene(rContent, rel));
        errors.push(...validateContentAndSense(rContent, rel, pluginHasGenerativeUiDelegation));
        for (const c of extractTechnicalConcepts(rContent)) pluginConcepts.add(c);
      }
    }
  }

  // 3b. plugin-level references/
  const pluginRefsDir = join(pluginDir, 'references');
  if (existsSync(pluginRefsDir) && statSync(pluginRefsDir).isDirectory()) {
    for (const refEnt of readdirSync(pluginRefsDir, { withFileTypes: true })) {
      if (refEnt.isFile() && refEnt.name.endsWith('.md')) {
        const refContent = readFileSync(join(pluginRefsDir, refEnt.name), 'utf-8');
        const rel = `references/${refEnt.name}`;
        errors.push(...validateMarkdownHygiene(refContent, rel));
        errors.push(...validateContentAndSense(refContent, rel, pluginHasGenerativeUiDelegation));
        for (const c of extractTechnicalConcepts(refContent)) pluginConcepts.add(c);
      }
    }
  }

  // 4. skills/
  const skillsDir = join(pluginDir, 'skills');
  if (existsSync(skillsDir) && statSync(skillsDir).isDirectory()) {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const skillFile = join(skillsDir, ent.name, 'SKILL.md');
        if (!existsSync(skillFile)) {
          errors.push(`skills/${ent.name}: manca il file SKILL.md`);
        } else {
          const content = readFileSync(skillFile, 'utf-8');
          const lineCount = content.split(/\r?\n/).length;
          if (lineCount > 200) {
            errors.push(`skills/${ent.name}/SKILL.md: supera il tetto di 200 righe (${lineCount} righe)`);
          }
          const relSkill = `skills/${ent.name}/SKILL.md`;
          errors.push(...validateMarkdownHygiene(content, relSkill));
          errors.push(...validateContentAndSense(content, relSkill, pluginHasGenerativeUiDelegation));
          for (const c of extractTechnicalConcepts(content)) pluginConcepts.add(c);

          for (const refMatch of content.matchAll(/\]\(\.?\/?(references\/[a-zA-Z0-9_./-]+\.md)\)/g)) {
            const refRel = refMatch[1];
            const refFull = join(skillsDir, ent.name, refRel);
            if (!existsSync(refFull)) {
              errors.push(`skills/${ent.name}/SKILL.md: riferimento mancante su disco '${refRel}'`);
            }
          }
          const refsDir = join(skillsDir, ent.name, 'references');
          if (existsSync(refsDir) && statSync(refsDir).isDirectory()) {
            for (const refEnt of readdirSync(refsDir, { withFileTypes: true })) {
              if (refEnt.isFile() && refEnt.name.endsWith('.md')) {
                const refContent = readFileSync(join(refsDir, refEnt.name), 'utf-8');
                const relRef = `skills/${ent.name}/references/${refEnt.name}`;
                errors.push(...validateMarkdownHygiene(refContent, relRef));
                errors.push(...validateContentAndSense(refContent, relRef, pluginHasGenerativeUiDelegation));
                for (const c of extractTechnicalConcepts(refContent)) pluginConcepts.add(c);
              }
            }
          }
          const fm = parseFrontmatter(content);
          if (!fm) {
            errors.push(`skills/${ent.name}/SKILL.md: frontmatter YAML mancante o malformato`);
          } else {
            if (fm._unquotedColonError) {
              errors.push(`skills/${ent.name}/SKILL.md: frontmatter contiene ': ' non quotato su riga inline (invalida il parser YAML strict di Antigravity)`);
            }
            if (!fm.name) {
              errors.push(`skills/${ent.name}/SKILL.md: "name" mancante nel frontmatter`);
            } else if (BUILTIN_SKILL_NAMES.has(fm.name)) {
              errors.push(`skills/${ent.name}/SKILL.md: collisione P0 (shadowing) con skill Built-in Antigravity '${fm.name}'`);
            } else if (seenSkillNames.has(fm.name) && dirName !== 'plugin-template') {
              errors.push(`skills/${ent.name}/SKILL.md: collisione P0 con skill omonima '${fm.name}' in '${seenSkillNames.get(fm.name)}'`);
            } else if (dirName !== 'plugin-template') {
              seenSkillNames.set(fm.name, dirName);
            }
            if (!fm.description) {
              errors.push(`skills/${ent.name}/SKILL.md: "description" mancante nel frontmatter`);
            } else {
              const dLen = fm.description.length;
              if (dLen < 80 || dLen > 250) {
                errors.push(`skills/${ent.name}/SKILL.md: lunghezza description (${dLen} char) fuori dal range [80, 250]`);
              }
              if (!/(Use this skill when|Use this skill to|Utilizza questa skill quando)/i.test(fm.description)) {
                errors.push(`skills/${ent.name}/SKILL.md: description priva di trigger direttivo ('Use this skill when...' / 'Utilizza questa skill quando...')`);
              }
            }
          }
        }
      }
    }
  }

  // 5. mcp_config.json
  const mcpPath = join(pluginDir, 'mcp_config.json');
  if (existsSync(mcpPath)) {
    const { data: mcp, error: mcpErr } = parseJsonSafe(mcpPath);
    if (mcpErr) {
      errors.push(`mcp_config.json: JSON non valido: ${mcpErr}`);
    } else if (!mcp.mcpServers || typeof mcp.mcpServers !== 'object') {
      errors.push('mcp_config.json: deve contenere un oggetto "mcpServers"');
    }
  }

  // 6. hooks.json
  const hooksPath = join(pluginDir, 'hooks.json');
  if (existsSync(hooksPath)) {
    const { data: hooksData, error: hookErr } = parseJsonSafe(hooksPath);
    if (hookErr) {
      errors.push(`hooks.json: JSON non valido: ${hookErr}`);
    } else if (hooksData) {
      const hookStr = JSON.stringify(hooksData);
      for (const c of extractTechnicalConcepts(hookStr)) pluginConcepts.add(c);
    }
  }

  return { dirName, errors, warnings, agentsRuleBytes, concepts: [...pluginConcepts].sort() };
}

export function buildBuiltinSnapshot(customBuiltinRoot) {
  const builtinBase = customBuiltinRoot || join(homedir(), '.gemini', 'antigravity', 'builtin');
  const skillsRoot = join(builtinBase, 'skills');
  if (!existsSync(skillsRoot)) return null;

  const checksumPath = join(builtinBase, '.checksum');
  const checksum = existsSync(checksumPath) ? readFileSync(checksumPath, 'utf-8').trim() : null;
  const files = {};

  function walkBuiltin(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        walkBuiltin(full);
      } else if (ent.isFile() && (ent.name.endsWith('.md') || ent.name.endsWith('.json'))) {
        const rel = relative(skillsRoot, full).replace(/\\/g, '/');
        const raw = readFileSync(full, 'utf-8');
        const norm = raw.replace(/\r\n/g, '\n');
        const sha256 = createHash('sha256').update(norm, 'utf-8').digest('hex');
        const headings = norm
          .split('\n')
          .filter((l) => /^#{1,3}\s+/.test(l))
          .map((l) => l.trim());
        const concepts = extractTechnicalConcepts(norm);
        files[rel] = {
          sha256,
          bytes: Buffer.byteLength(norm, 'utf-8'),
          headings,
          concepts
        };
      }
    }
  }

  walkBuiltin(skillsRoot);
  return { checksum, fileCount: Object.keys(files).length, files };
}

export function inspectBuiltinEvolution(pluginResults, baselinePath, customBuiltinRoot) {
  const current = buildBuiltinSnapshot(customBuiltinRoot);
  if (!current) {
    return { available: false, driftWarnings: [], couplingMatrix: [] };
  }

  const couplingMatrix = [];
  for (const [bFile, bMeta] of Object.entries(current.files)) {
    const bSet = new Set(bMeta.concepts);
    const coupledPlugins = [];
    for (const p of pluginResults) {
      if (p.dirName === 'plugin-template') continue;
      const shared = (p.concepts || []).filter((c) => bSet.has(c));
      if (shared.length > 0) {
        coupledPlugins.push({ plugin: p.dirName, shared });
      }
    }
    if (coupledPlugins.length > 0) {
      couplingMatrix.push({ builtinFile: bFile, coupledPlugins });
    }
  }

  const driftWarnings = [];
  if (baselinePath && existsSync(baselinePath)) {
    const { data: baseline } = parseJsonSafe(baselinePath);
    if (baseline && baseline.files) {
      for (const [bFile, bMeta] of Object.entries(current.files)) {
        const prev = baseline.files[bFile];
        const coupled = couplingMatrix.find((c) => c.builtinFile === bFile)?.coupledPlugins || [];
        const coupledSummary =
          coupled.length > 0
            ? coupled.map((c) => `${c.plugin} [${c.shared.slice(0, 4).join(', ')}]`).join(', ')
            : 'nessun plugin diretto';

        if (!prev) {
          driftWarnings.push(
            `[POST-UPDATE ANTIGRAVITY] Nuovo file built-in rilevato: '${bFile}' (concetti: ${bMeta.concepts.slice(0, 6).join(', ')}) -> Plugin accoppiati nel contenuto: ${coupledSummary}. Riallinea dopo verifica con: node scripts/validate.mjs --update-builtin-baseline`
          );
        } else if (prev.sha256 !== bMeta.sha256) {
          const prevHeadings = new Set(prev.headings || []);
          const prevConcepts = new Set(prev.concepts || []);
          const addedHeadings = bMeta.headings.filter((h) => !prevHeadings.has(h));
          const addedConcepts = bMeta.concepts.filter((c) => !prevConcepts.has(c));
          driftWarnings.push(
            `[POST-UPDATE ANTIGRAVITY] Contenuto built-in modificato in '${bFile}' (nuove sezioni: ${addedHeadings.join(' | ') || 'nessuna'}; nuovi concetti: ${addedConcepts.join(', ') || 'nessuno'}) -> Verifica i tuoi plugin accoppiati: ${coupledSummary}. Aggiorna baseline con: node scripts/validate.mjs --update-builtin-baseline`
          );
        }
      }
    }
  }

  return { available: true, current, driftWarnings, couplingMatrix };
}

function main() {
  const root = resolve(process.cwd());
  const args = process.argv.slice(2);
  const targetDirs = [];
  const baselinePath = join(root, 'scripts', 'builtin-baseline.json');

  if (args.includes('--update-builtin-baseline')) {
    const snap = buildBuiltinSnapshot();
    if (!snap) {
      console.error('Cartella built-in Antigravity non trovata su questa macchina.');
      process.exit(1);
    }
    writeFileSync(baselinePath, JSON.stringify(snap, null, 2) + '\n', 'utf-8');
    console.log(`Baseline built-in aggiornata (${snap.fileCount} file tracciati in scripts/builtin-baseline.json).`);
    if (!args.includes('--all') && !args.includes('--report-builtin-overlaps')) {
      process.exit(0);
    }
  }

  if (args.includes('--all')) {
    targetDirs.push(join(root, 'plugins'), join(root, 'templates'));
  } else if (args.length > 0 && !args[0].startsWith('-')) {
    targetDirs.push(resolve(root, args[0]));
  } else {
    targetDirs.push(join(root, 'plugins'));
  }

  const pluginDirs = [];
  for (const baseDir of targetDirs) {
    if (!existsSync(baseDir)) continue;
    const entries = readdirSync(baseDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory() && !ent.name.startsWith('.')) {
        pluginDirs.push(join(baseDir, ent.name));
      }
    }
  }

  if (pluginDirs.length === 0) {
    console.log('Nessun plugin trovato nella cartella plugins/.');
    process.exit(0);
  }

  console.log(`\nValidazione Plugin Antigravity (${pluginDirs.length} trovati)\n` + '='.repeat(50));

  const existingNames = new Set();
  const seenSkillNames = new Map();
  const pluginResults = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalRulesBytes = 0;

  for (const dir of pluginDirs) {
    const res = validatePlugin(dir, existingNames, seenSkillNames);
    pluginResults.push(res);
    totalErrors += res.errors.length;
    totalWarnings += res.warnings.length;
    if (res.dirName !== 'plugin-template') {
      totalRulesBytes += res.agentsRuleBytes || 0;
    }

    const status = res.errors.length === 0 ? '✔ OK' : '✖ FALLITO';
    console.log(`\n[${status}] ${res.dirName}`);

    for (const err of res.errors) {
      console.log(`   - ERRORE: ${err}`);
    }
    for (const warn of res.warnings) {
      console.log(`   - AVVISO: ${warn}`);
    }
    if (res.errors.length === 0 && res.warnings.length === 0) {
      console.log('   Nessuna anomalia riscontrata.');
    }
  }

  if (args.includes('--all') || args.includes('--report-builtin-overlaps')) {
    if (totalRulesBytes > 60000) {
      totalWarnings++;
      console.log(
        `\n[AVVISO BUDGET REGOLE] Peso aggregato rules/AGENTS.md (${totalRulesBytes} B) vicino o superiore al defaultRulesBudget nativo (20.000 token / ~60 KB)`
      );
    }

    const evo = inspectBuiltinEvolution(pluginResults, baselinePath);
    for (const dw of evo.driftWarnings) {
      totalWarnings++;
      console.log(`\n   - AVVISO: ${dw}`);
    }

    if (args.includes('--report-builtin-overlaps') && evo.available) {
      console.log('\nMatrice di Accoppiamento Contenuto (Built-in 19 File <-> Plugin Utente)\n' + '-'.repeat(70));
      for (const item of evo.couplingMatrix) {
        const list = item.coupledPlugins
          .map((cp) => `${cp.plugin} (${cp.shared.join(', ')})`)
          .join(' · ');
        console.log(` - ${item.builtinFile}\n     ↳ ${list}`);
      }
    }
  }

  if (args.includes('--all')) {
    const memoryPath = join(root, 'MEMORY.md');
    if (existsSync(memoryPath)) {
      const memRaw = readFileSync(memoryPath, 'utf-8');
      const memLines = memRaw.split(/\r?\n/);
      const memBytes = Buffer.byteLength(memRaw, 'utf-8');
      if (memLines.length > 200) {
        totalErrors++;
        console.log(`\n[✖ FALLITO] MEMORY.md: ${memLines.length} righe (tetto massimo: 200 righe)`);
      }
      if (memBytes > 16384) {
        totalErrors++;
        console.log(`\n[✖ FALLITO] MEMORY.md: ${memBytes} byte (tetto massimo: 16384 byte / 16 KB)`);
      }
    }
    const worklogPath = join(root, 'WORKLOG.md');
    if (existsSync(worklogPath)) {
      const wlRaw = readFileSync(worklogPath, 'utf-8');
      const wlLines = wlRaw.split(/\r?\n/);
      const wlBytes = Buffer.byteLength(wlRaw, 'utf-8');
      if (wlLines.length > 300) {
        totalErrors++;
        console.log(`\n[✖ FALLITO] WORKLOG.md: ${wlLines.length} righe (tetto massimo rolling window: 300 righe)`);
      }
      if (wlBytes > 20480) {
        totalErrors++;
        console.log(`\n[✖ FALLITO] WORKLOG.md: ${wlBytes} byte (tetto massimo: 20480 byte / 20 KB)`);
      }
    }
    const desiderataPath = join(root, 'DESIDERATA.md');
    if (existsSync(desiderataPath)) {
      const desLines = readFileSync(desiderataPath, 'utf-8').split(/\r?\n/);
      if (desLines.length > 150) {
        totalErrors++;
        console.log(`\n[✖ FALLITO] DESIDERATA.md: ${desLines.length} righe (tetto massimo: 150 righe)`);
      }
    }
    const notesPath = join(root, 'NOTES.md');
    if (existsSync(notesPath)) {
      const notesLines = readFileSync(notesPath, 'utf-8').split(/\r?\n/);
      if (notesLines.length > 120) {
        totalErrors++;
        console.log(`\n[✖ FALLITO] NOTES.md: ${notesLines.length} righe (tetto massimo: 120 righe)`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(
    `Riepilogo: ${pluginDirs.length} plugin verificati | ${totalErrors} errori | ${totalWarnings} avvisi | Regole inline: ${(totalRulesBytes / 1024).toFixed(1)} KB\n`
  );

  if (totalErrors > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}

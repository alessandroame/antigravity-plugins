#!/usr/bin/env node

/**
 * Antigravity Plugin Validator
 * Validates plugin directory structure, manifest conformity (plugin.json),
 * rules/AGENTS.md, skills/ and optional configs (mcp, hooks).
 */

import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

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

function stripJsonComments(text) {
  return text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
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

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;
  const yamlBlock = match[1];
  const result = {};
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      result[key] = val;
    }
  }
  return result;
}

function validatePlugin(pluginDir, existingNames) {
  const errors = [];
  const warnings = [];
  const dirName = pluginDir.split(/[\\/]/).pop();

  // 1. plugin.json
  const manifestPath = join(pluginDir, 'plugin.json');
  if (!existsSync(manifestPath)) {
    errors.push('File obbligatorio mancante: plugin.json');
    return { dirName, errors, warnings };
  }

  const { data: manifest, error: jsonErr } = parseJsonSafe(manifestPath);
  if (jsonErr) {
    errors.push(`plugin.json non valido: ${jsonErr}`);
    return { dirName, errors, warnings };
  }

  // Name check
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

  // Description check
  if (!manifest.description) {
    errors.push('plugin.json: campo "description" mancante');
  } else if (typeof manifest.description !== 'string' || manifest.description.trim().length === 0) {
    errors.push('plugin.json: "description" non può essere vuoto');
  }

  // DisplayName check
  if (manifest.displayName !== undefined && (typeof manifest.displayName !== 'string' || manifest.displayName.trim().length === 0)) {
    errors.push('plugin.json: "displayName" deve essere una stringa non vuota');
  }

  // Version check
  if (manifest.version !== undefined && (typeof manifest.version !== 'string' || !SEMVER_REGEX.test(manifest.version))) {
    warnings.push(`plugin.json: "version" ('${manifest.version}') non rispetta il formato SemVer standard (es. 1.0.0)`);
  }

  // Suggested Prompts check
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

  // Logo check
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

  // Disallowed / ignored fields
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
  if (existsSync(rulesDir)) {
    const agentsRule = join(rulesDir, 'AGENTS.md');
    if (!existsSync(agentsRule)) {
      warnings.push('rules/: cartella presente ma senza file "rules/AGENTS.md".');
    } else {
      const ruleContent = readFileSync(agentsRule, 'utf-8');
      if (ruleContent.startsWith('---')) {
        warnings.push('rules/AGENTS.md: contiene frontmatter YAML. Le regole dei plugin devono essere markdown puro senza frontmatter.');
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
          const fm = parseFrontmatter(content);
          if (!fm) {
            errors.push(`skills/${ent.name}/SKILL.md: frontmatter YAML mancante o malformato`);
          } else {
            if (!fm.name) errors.push(`skills/${ent.name}/SKILL.md: "name" mancante nel frontmatter`);
            if (!fm.description) errors.push(`skills/${ent.name}/SKILL.md: "description" mancante nel frontmatter`);
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
    const { error: hookErr } = parseJsonSafe(hooksPath);
    if (hookErr) {
      errors.push(`hooks.json: JSON non valido: ${hookErr}`);
    }
  }

  return { dirName, errors, warnings };
}

function main() {
  const root = resolve(process.cwd());
  const args = process.argv.slice(2);
  const targetDirs = [];

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
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const dir of pluginDirs) {
    const { dirName, errors, warnings } = validatePlugin(dir, existingNames);
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    const status = errors.length === 0 ? '✔ OK' : '✖ FALLITO';
    console.log(`\n[${status}] ${dirName}`);

    for (const err of errors) {
      console.log(`   - ERRORE: ${err}`);
    }
    for (const warn of warnings) {
      console.log(`   - AVVISO: ${warn}`);
    }
    if (errors.length === 0 && warnings.length === 0) {
      console.log('   Nessuna anomalia riscontrata.');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Riepilogo: ${pluginDirs.length} plugin verificati | ${totalErrors} errori | ${totalWarnings} avvisi\n`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();

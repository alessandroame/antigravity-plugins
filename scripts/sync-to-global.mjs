import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PLUGINS_DIR = path.join(REPO_ROOT, 'plugins');
const GLOBAL_PLUGINS_DIR = path.join(os.homedir(), '.gemini', 'config', 'plugins');

const GLOBAL_CONFIG_FILE = path.join(os.homedir(), '.gemini', 'config', 'config.json');

console.log('Synchronizing physical plugins to global Antigravity directory:');
console.log(`   Source:      ${PLUGINS_DIR}`);
console.log(`   Destination: ${GLOBAL_PLUGINS_DIR}\n`);

if (!fs.existsSync(GLOBAL_PLUGINS_DIR)) {
  fs.mkdirSync(GLOBAL_PLUGINS_DIR, { recursive: true });
}

const pluginEntries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
const syncedPluginNames = [];

for (const entry of pluginEntries) {
  if (!entry.isDirectory()) continue;
  const pluginName = entry.name;
  const src = path.join(PLUGINS_DIR, pluginName);
  const dest = path.join(GLOBAL_PLUGINS_DIR, pluginName);

  if (!fs.existsSync(path.join(src, 'plugin.json'))) {
    continue;
  }

  // Remove existing symlink/junction or directory before copying (with EBUSY fallback for active OS watchers)
  if (fs.existsSync(dest)) {
    const stat = fs.lstatSync(dest);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(dest);
    } else {
      try {
        fs.rmSync(dest, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      } catch {
        // Directory handle held by active IDE watcher on Windows: overwrite files in-place via cpSync
      }
    }
  }

  // Perform recursive physical directory copy (force: true overwrites existing files in-place)
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`   [OK] Physically synchronized: ${pluginName}`);
  syncedPluginNames.push(pluginName);
}

if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
  try {
    const rawConfig = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8').replace(/^\uFEFF/, '');
    const parsedConfig = JSON.parse(rawConfig);
    if (!parsedConfig.plugins || typeof parsedConfig.plugins !== 'object') {
      parsedConfig.plugins = {};
    }
    let configUpdated = false;
    for (const name of syncedPluginNames) {
      if (!parsedConfig.plugins[name]) {
        parsedConfig.plugins[name] = { enabled: true };
        configUpdated = true;
        console.log(`   [OK] Registered in config.json: ${name} (enabled: true)`);
      }
    }
    if (configUpdated) {
      fs.writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(parsedConfig, null, 2) + '\n', 'utf-8');
    }
  } catch (err) {
    console.warn(`   [WARN] Could not update ${GLOBAL_CONFIG_FILE}: ${err.message}`);
  }
}

function walkSkillFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSkillFiles(full, results);
    else if (ent.isFile() && ent.name === 'SKILL.md') results.push(full);
  }
  return results;
}

function compactThirdPartyDescription(rawDesc, skillName) {
  const clean = rawDesc
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = clean.split(/(?<=\.)\s+/);
  const firstSentence = (sentences[0] || clean).replace(/:\s+/g, ' - ').replace(/,\s*which\b.*$/i, '.');
  const useSentence = sentences.find((s) => /\b(use|trigger|activate)\b/i.test(s));
  const defaultTrigger = `Use this skill when working with ${skillName} workflows.`;
  let triggerClause = useSentence
    ? useSentence.replace(/^use (it |this skill )?(whenever|when)/i, 'Use this skill when').replace(/:\s+/g, ' - ')
    : defaultTrigger;
  if (!/\buse this skill (when|to)\b/i.test(triggerClause)) {
    triggerClause = defaultTrigger;
  }
  const maxFirstLen = Math.max(80, 242 - triggerClause.length - 1);
  let lead = firstSentence;
  if (lead.length > maxFirstLen) {
    lead = lead.slice(0, maxFirstLen - 1).replace(/[,;:\s]+\S*$/, '') + '.';
  }
  let candidate = `${lead.replace(/\.?$/, '.')} ${triggerClause}`.replace(/\s+/g, ' ').trim();
  if (candidate.length > 245) {
    const fallbackLead = firstSentence.slice(0, 240 - defaultTrigger.length).replace(/[,;:\s]+\S*$/, '') + '.';
    candidate = `${fallbackLead} ${defaultTrigger}`;
  }
  return candidate;
}

const canonicalSet = new Set(syncedPluginNames);
let compactedSkillsCount = 0;
for (const entry of fs.readdirSync(GLOBAL_PLUGINS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory() || canonicalSet.has(entry.name)) continue;
  const skillFiles = walkSkillFiles(path.join(GLOBAL_PLUGINS_DIR, entry.name));
  for (const skillFile of skillFiles) {
    const content = fs.readFileSync(skillFile, 'utf-8');
    const fmMatch = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
    if (!fmMatch) continue;
    const fmBody = fmMatch[2];
    const lines = fmBody.split(/\r?\n/);
    let skillName = path.basename(path.dirname(skillFile));
    let descStartIdx = -1;
    let descEndIdx = -1;
    let descText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('name:')) {
        skillName = line.slice(5).trim().replace(/^['"]|['"]$/g, '');
      } else if (line.startsWith('description:')) {
        descStartIdx = i;
        const rest = line.slice(12).trim();
        if (rest === '>' || rest === '>-' || rest === '|') {
          const block = [];
          let j = i + 1;
          while (j < lines.length && (/^\s+/.test(lines[j]) || lines[j].trim() === '')) {
            if (lines[j].trim() !== '') block.push(lines[j].trim());
            j++;
          }
          descEndIdx = j - 1;
          descText = block.join(' ');
        } else {
          descEndIdx = i;
          descText = rest.replace(/^['"]|['"]$/g, '');
        }
        break;
      }
    }

    if (descStartIdx !== -1 && descText.length > 250) {
      const compacted = compactThirdPartyDescription(descText, skillName);
      const updatedLines = [
        ...lines.slice(0, descStartIdx),
        `description: ${compacted}`,
        ...lines.slice(descEndIdx + 1)
      ];
      const updatedContent = fmMatch[1] + updatedLines.join('\n') + fmMatch[3] + content.slice(fmMatch[0].length);
      fs.writeFileSync(skillFile, updatedContent, 'utf-8');
      compactedSkillsCount++;
      console.log(`   [OK] Compacted third-party skill description (${descText.length} -> ${compacted.length} chars): ${entry.name}/${skillName}`);
    }
  }
}

console.log(`\nCompleted: ${syncedPluginNames.length} plugins synchronized in ${GLOBAL_PLUGINS_DIR} (${compactedSkillsCount} third-party skill descriptions compacted)`);

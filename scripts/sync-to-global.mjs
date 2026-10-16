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
    const rawConfig = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
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

console.log(`\nCompleted: ${syncedPluginNames.length} plugins synchronized in ${GLOBAL_PLUGINS_DIR}`);

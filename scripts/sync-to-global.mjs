import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PLUGINS_DIR = path.join(REPO_ROOT, 'plugins');
const GLOBAL_PLUGINS_DIR = path.join(os.homedir(), '.gemini', 'config', 'plugins');

console.log('🔄 Sincronizzazione plugin fisici verso Antigravity Globale:');
console.log(`   Sorgente:    ${PLUGINS_DIR}`);
console.log(`   Destinazione: ${GLOBAL_PLUGINS_DIR}\n`);

if (!fs.existsSync(GLOBAL_PLUGINS_DIR)) {
  fs.mkdirSync(GLOBAL_PLUGINS_DIR, { recursive: true });
}

const pluginEntries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
let syncedCount = 0;

for (const entry of pluginEntries) {
  if (!entry.isDirectory()) continue;
  const pluginName = entry.name;
  const src = path.join(PLUGINS_DIR, pluginName);
  const dest = path.join(GLOBAL_PLUGINS_DIR, pluginName);

  if (!fs.existsSync(path.join(src, 'plugin.json'))) {
    continue;
  }

  // Se la destinazione è un link o junction, rimuovila (Antigravity LS ignora reparse points)
  if (fs.existsSync(dest)) {
    const stat = fs.lstatSync(dest);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(dest);
    } else {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  }

  // Copia ricorsiva directory fisica
  fs.cpSync(src, dest, { recursive: true });
  console.log(`   [✔ OK] Sincronizzato fisicamente: ${pluginName}`);
  syncedCount++;
}

console.log(`\n🎉 Completato: ${syncedCount} plugin sincronizzati come directory reali in ${GLOBAL_PLUGINS_DIR}`);

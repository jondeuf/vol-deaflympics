import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = 'public/videos';
const out = {};

const cats = await readdir(root, { withFileTypes: true });
for (const dir of cats) {
  if (!dir.isDirectory()) continue;
  const cat = dir.name; // ex: basic, avion, etc.
  const files = await readdir(path.join(root, cat), { withFileTypes: true });
  out[cat] = files
    .filter(f => f.isFile() && f.name.toLowerCase().endsWith('.mp4'))
    .map(f => f.name);
}

await writeFile('public/videos/manifest.json', JSON.stringify(out, null, 2), 'utf8');
console.log('✅ manifest.json généré dans public/videos/');

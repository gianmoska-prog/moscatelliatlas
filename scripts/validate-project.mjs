import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }))).flat();
}

const files = await walk(root);
for (const file of files.filter((path) => path.endsWith('.json') && !path.includes('node_modules'))) {
  try { JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { failures.push(`${file}: ${error.message}`); }
}

const forbidden = [/(?:service[_-]?role|slack[_-]?bot[_-]?token|slack[_-]?signing[_-]?secret)\s*[:=]\s*['\"][^'\"]+/i];
for (const file of files.filter((path) => /\.(?:js|html|json|md|sql)$/.test(path) && !path.includes('node_modules') && !path.includes('assets\\vendor'))) {
  const source = await readFile(file, 'utf8');
  for (const pattern of forbidden) if (pattern.test(source)) failures.push(`${file}: possible server secret`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Atlas project validation passed.');

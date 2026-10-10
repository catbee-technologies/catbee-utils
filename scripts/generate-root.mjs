import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');

if (!existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

const modules = readdirSync(distDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .filter(entry => {
    const files = readdirSync(join(distDir, entry.name));
    return files.includes('index.mjs') && files.includes('index.cjs');
  })
  .map(entry => entry.name)
  .sort();

if (modules.length === 0) {
  console.error('Error: No compiled utilities found in dist directory.');
  process.exit(1);
}

const esm = modules.map(name => `export * from './${name}/index.mjs';`).join('\n');

const cjs = [
  "'use strict';",
  '',
  "Object.defineProperty(exports, '__esModule', { value: true });",
  "Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });",
  '',
  'function _exportStar(mod) {',
  '  Object.keys(mod).forEach(function (k) {',
  "    if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) {",
  '      Object.defineProperty(exports, k, {',
  '        enumerable: true,',
  '        get: function () { return mod[k]; }',
  '      });',
  '    }',
  '  });',
  '}',
  '',
  ...modules.map(name => `_exportStar(require('./${name}/index.cjs'));`)
].join('\n');

const declarations = modules.map(name => `export * from './${name}';`).join('\n');

const outputs = {
  'index.mjs': esm,
  'index.cjs': cjs,
  'index.d.ts': declarations
};

for (const [file, content] of Object.entries(outputs)) {
  writeFileSync(join(distDir, file), `${content}\n`);
}

console.log('-'.repeat(100));
console.log(`Generated root entries for ${modules.length} utilities.`);
console.log('-'.repeat(100));

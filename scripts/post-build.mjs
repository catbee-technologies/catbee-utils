import { readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const distDir = join(cwd, 'dist');

if (!existsSync(distDir)) {
  throw new Error(`Build failed: dist directory not found`);
}

// 1. Copy LICENSE and README.md
const licenseSrc = join(cwd, 'LICENSE');
const readmeSrc = join(cwd, 'README.md');

if (existsSync(licenseSrc)) {
  copyFileSync(licenseSrc, join(distDir, 'LICENSE'));
}

if (existsSync(readmeSrc)) {
  copyFileSync(readmeSrc, join(distDir, 'README.md'));
}

// 2. Build clean package.json
const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));

delete pkg.scripts;
delete pkg.devDependencies;

const filePatterns = ['mjs', 'cjs', 'd.ts'].map(ext => `**/*.${ext}`);

pkg.main = `index.cjs`;
pkg.module = `index.mjs`;
pkg.types = `index.d.ts`;
pkg.files = [...filePatterns, 'LICENSE', 'README.md'];
pkg.keywords = [
  'catbee',
  'catbee-utils',
  'utils',
  'utilities',
  'helper',
  'helpers',
  'tools',
  'typescript',
  'nodejs',
  'node',
  'esm',
  'commonjs',
  'express',
  'expressjs',
  'express-server',
  'developer-tools'
];

const exportsMap = {};
const entries = readdirSync(distDir, { withFileTypes: true }).filter(d => d.isDirectory());

function scanExports(dir, keyBase = '') {
  const items = readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const full = join(dir, item.name);
    const exportKey = keyBase ? `${keyBase}/${item.name}` : item.name;

    if (item.isDirectory()) {
      scanExports(full, exportKey);
    } else if (item.isFile()) {
      if (item.name.endsWith('.d.ts') && item.name !== 'index.d.ts') {
        rmSync(full);
      }
      if (item.name === 'index.mjs') {
        const baseKey = exportKey.replace(/\/index\.mjs$/, '');
        const key = `./${baseKey}`;

        exportsMap[key] = {
          types: `./${baseKey}/index.d.ts`,
          import: `./${exportKey}`,
          require: `./${exportKey.replace('index.mjs', 'index.cjs')}`
        };
      }
    }
  }
}

for (const dir of entries) {
  scanExports(join(distDir, dir.name), dir.name);
}

pkg.exports = {
  '.': {
    types: './index.d.ts',
    import: './index.mjs',
    require: './index.cjs'
  },
  ...exportsMap
};

// 3. Write final package.json into build dir
writeFileSync(join(distDir, 'package.json'), JSON.stringify(pkg, null, 2));

console.log('✔ Postbuild completed.');

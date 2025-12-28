import dts from 'rollup-plugin-dts';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = join(process.cwd(), 'src');
const modules = readdirSync(srcRoot, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const external = modules.map(m => `@catbee/utils/${m}`).concat('node:async_hooks', 'node:crypto', 'node:fs', 'node:https', 'node:http', 'node:path', 'node:stream', 'node:url');
const dtsPlugin = dts();

/** @type {import('rollup').RollupOptions[]} */
export default [
  ...modules.flatMap(m => [
    {
      input: `dist/${m}/index.d.ts`,
      output: { file: `dist/${m}/index.d.ts`, format: 'es' },
      plugins: [dtsPlugin],
      external,
    }
  ])
];

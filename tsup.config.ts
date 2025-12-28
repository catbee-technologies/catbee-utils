import { defineConfig, Options } from 'tsup';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const buildDir = 'dist/';

const external = ['@catbee/utils'];

const cwd = process.cwd();
const srcRoot = join(cwd, 'src');

const modules = readdirSync(srcRoot, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const getBaseConfig = ({ bundle = true, sourcemap = false }): Options => {
  const options: Options = {
    bundle,
    splitting: false,
    target: 'es2022',
    clean: true,
    minify: false,
    sourcemap,
    format: ['cjs', 'esm'],
    outExtension({ format }) {
      return format === 'esm' ? { js: '.mjs' } : { js: '.cjs' };
    },
    treeshake: 'recommended',
    external
  };
  return options;
};

const entryPoints = modules.flatMap((name: string): Options[] => [
  {
    ...getBaseConfig({ bundle: true, sourcemap: false }),
    entry: [`src/${name}/index.ts`],
    outDir: `${buildDir}${name}`
  }
]);

export default defineConfig([
  ...entryPoints,
  {
    ...getBaseConfig({ bundle: false, sourcemap: false }),
    entry: ['src/index.ts'],
    outDir: buildDir
  }
]);

import { defineConfig, Options } from 'tsup';
import { readdirSync } from 'fs';
import { join } from 'path';

const buildDir = 'dist/';

const external = ['@catbee/utils'];

const cwd = process.cwd();
const srcRoot = join(cwd, 'src');

const modules = readdirSync(srcRoot, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const getBaseConfig = (format: 'cjs' | 'esm', { bundle = true, sourcemap = false }): Options => {
  const options: Options = {
    bundle,
    splitting: false,
    target: 'es2022',
    clean: true,
    minify: false,
    sourcemap,
    outExtension({ format }) {
      return format === 'esm' ? { js: '.mjs' } : { js: '.cjs' };
    },
    esbuildOptions(options) {
      // options.platform = 'node';
      // options.external = ['pino', 'os', 'fs', 'path', 'worker_threads'];
      // options.banner = {
      //   js: licenseBanner
      // };
    },
    treeshake: 'recommended',
    external
  };

  if (format === 'esm') {
    options.format = 'esm';
    options.tsconfig = './tsconfig.esm.json';
    options.dts = false;
  } else {
    options.format = 'cjs';
    options.cjsInterop = true;
    options.tsconfig = './tsconfig.cjs.json';
    options.dts = true;
  }
  return options;
};

const entryPoints = modules.flatMap((name: string): Options[] => [
  {
    ...getBaseConfig('esm', { bundle: true, sourcemap: false }),
    entry: [`src/${name}/index.ts`],
    outDir: `${buildDir}${name}`,
    dts: false
  },
  {
    ...getBaseConfig('cjs', { bundle: true, sourcemap: false }),
    entry: [`src/${name}/index.ts`],
    outDir: `${buildDir}${name}`,
    dts: false
  }
]);

export default defineConfig([
  {
    ...getBaseConfig('esm', { bundle: false, sourcemap: false }),
    entry: ['src/index.ts'],
    outDir: buildDir,
    dts: false
  },
  {
    ...getBaseConfig('cjs', { bundle: false, sourcemap: false }),
    entry: ['src/index.ts'],
    outDir: buildDir,
    dts: false
  },
  ...entryPoints
]);

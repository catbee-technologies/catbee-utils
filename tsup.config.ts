import { defineConfig } from 'tsup';
import { join } from 'path';
import { readFileSync } from 'fs';

const licensePath = join(process.cwd(), 'LICENSE');
const licenseRaw = readFileSync(licensePath, 'utf-8');
const licenseBanner = `/*\n${licenseRaw
  .split('\n')
  .map(line => ` * ${line}`)
  .join('\n')}\n */`;

// const external = ['pino', 'os', 'fs', 'path', 'worker_threads'];

export default defineConfig([
  {
    // entry: ['src/**/*.ts'],
    entry: ['src/index.ts'],
    format: 'esm',
    outDir: 'build/esm',
    bundle: true,
    splitting: false,
    target: 'ES2022',
    clean: true,
    dts: {
      banner: licenseBanner,
    },
    esbuildOptions(options) {
      options.platform = 'node';
      // options.external = external;
      options.outExtension = { '.js': '.mjs' };
      options.banner = {
        js: licenseBanner
      };
    },
    tsconfig: './tsconfig.esm.json',
    treeshake: true,
    skipNodeModulesBundle: true
  },
  {
    // entry: ['src/**/*.ts'],
    entry: ['src/index.ts'],
    format: 'cjs',
    outDir: 'build/cjs',
    bundle: true,
    splitting: false,
    target: 'ES2022',
    clean: false,
    dts: false,
    esbuildOptions(options) {
      options.platform = 'node';
      // options.external = external;
      options.outExtension = { '.js': '.cjs' };
      options.banner = {
        js: licenseBanner
      };
    },
    tsconfig: './tsconfig.cjs.json',
    treeshake: true,
    cjsInterop: true,
    skipNodeModulesBundle: true
  }
]);

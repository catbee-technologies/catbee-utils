import { defineConfig, Options } from 'tsup';
import { join } from 'path';
import { readFileSync } from 'fs';

const licensePath = join(process.cwd(), 'LICENSE');
const licenseRaw = readFileSync(licensePath, 'utf-8');
const licenseBanner = `/*\n${licenseRaw
  .split('\n')
  .map(line => ` * ${line}`)
  .join('\n')}\n */`;

const baseConfig: Options = {
  // entry: ['src/**/*.ts'],
  entry: ['src/index.ts'],
  outDir: 'build',
  bundle: true,
  splitting: false,
  target: 'ES2022',
  clean: true,
  minify: false,
  // noExternal: ['reflect-metadata'],
  dts: false,
  outExtension({ format }) {
    return format === 'esm' ? { js: '.mjs' } : { js: '.cjs' };
  },
  esbuildOptions(options) {
    options.platform = 'node';
    // options.external = ['pino', 'os', 'fs', 'path', 'worker_threads'];
    options.banner = {
      js: licenseBanner
    };
  },
  treeshake: true,
  skipNodeModulesBundle: true
}

export default defineConfig([
  {
    ...baseConfig,
    format: 'esm',
    dts: false,
    tsconfig: './tsconfig.esm.json',
  },
  {
    ...baseConfig,
    format: 'cjs',
    dts: {
      banner: licenseBanner,
    },
    tsconfig: './tsconfig.cjs.json',
    cjsInterop: true,
  }
]);

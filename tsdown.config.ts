import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type UserConfig } from 'tsdown';

const srcDir = join(process.cwd(), 'src');

const modules = readdirSync(srcDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(srcDir, entry.name, 'index.ts')))
  .map(entry => entry.name);

const neverBundle = [/^@catbee\/utils(?:\/.*)?$/];

export default defineConfig(
  modules.map(
    (name, index) =>
      ({
        entry: {
          index: `src/${name}/index.ts`
        },
        outDir: `dist/${name}`,
        format: ['cjs', 'esm'] as ('cjs' | 'esm')[],
        platform: 'node' as const,
        target: 'es2022',
        hash: false,
        unbundle: false,
        deps: {
          neverBundle
        },
        dts: false,
        minify: false,
        outputOptions: {
          comments: false
        },
        clean: index === 0,
        checks: {
          bundlerTimings: false
        }
      }) as UserConfig
  )
);

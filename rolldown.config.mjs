import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { builtinModules } from 'node:module';
import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

const cwd = process.cwd();
const distRoot = join(cwd, 'dist');
const srcRoot = join(cwd, 'src');

const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));

const modules = readdirSync(srcRoot, { withFileTypes: true })
  .filter(
    entry =>
      entry.isDirectory() &&
      existsSync(join(srcRoot, entry.name, 'index.ts')) &&
      existsSync(join(distRoot, entry.name, 'index.d.ts'))
  )
  .map(entry => entry.name);

const dependencies = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {})
]);

const external = [
  // Package imports, including subpaths.
  ...[...dependencies].map(name => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/.*)?$`)),

  // Node.js built-in modules, including node: prefixed imports.
  ...builtinModules.flatMap(name => [name, `node:${name}`]),

  // Internal package imports.
  /^@catbee\/utils(?:\/.*)?$/
];

export default defineConfig(
  modules.map(name => ({
    input: join(distRoot, name, 'index.d.ts'),
    external,
    output: {
      dir: join(distRoot, name),
      format: 'es',
      entryFileNames: 'index.d.ts'
    },
    plugins: [
      dts({
        dtsInput: true,
        emitDtsOnly: true
      })
    ]
  }))
);

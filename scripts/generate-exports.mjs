import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, basename } from "path";

const root = process.cwd();
const utilsDir = join(root, "src/utils");
const typesDir = join(root, "src/types");

function buildExportEntry(pathBase) {
  return {
    import: {
      types: `./build/esm/${pathBase}.d.ts`,
      default: `./build/esm/${pathBase}.js`
    },
    require: {
      types: `./build/cjs/${pathBase}.d.ts`,
      default: `./build/cjs/${pathBase}.js`
    }
  };
};

const exportsMap = {
  ".": buildExportEntry("index")
};

// utils/*.ts → "./array", "./async", ...
for (const file of readdirSync(utilsDir)) {
  if (!file.endsWith(".ts")) continue;
  const name = basename(file, ".ts").replace(".utils", "");
  const basePath = `utils/${file.replace(".ts", "")}`;
  exportsMap[`./${name}`] = buildExportEntry(basePath);
}

// types/*.ts → "./types/..."
for (const file of readdirSync(typesDir)) {
  if (!file.endsWith(".ts")) continue;
  const name = basename(file, ".ts");
  const basePath = `types/${file.replace(".ts", "")}`;
  exportsMap[`./types/${name}`] = buildExportEntry(basePath);
}

// read + update package.json
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

pkg.exports = exportsMap;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ package.json exports updated dynamically");

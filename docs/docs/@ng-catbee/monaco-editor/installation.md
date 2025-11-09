---
id: installation
title: Installation and Configuration
sidebar_position: 2
---

## Installation

```bash
npm install @ng-catbee/monaco-editor --save
npm install monaco-editor --save # Optional: for local assets
```

## Configure `monaco-editor` library assets

By default, Monaco Editor is loaded lazily from the CDN (`https://cdn.jsdelivr.net/npm/monaco-editor`). You can also use local assets if preferred.

If you are using local monaco editor library, you could add the following to your `angular.json` file:

```json
"assets": [
  {
    "glob": "**/*",
    "input": "node_modules/monaco-editor/min/vs", // Path to `vs` folder in monaco-editor package
    "output": "/assets/monaco-editor/vs" // Make sure the path you set contains the `/vs` folder
  }
],
```
Or you can copy the `vs` folder from `node_modules/monaco-editor/min/` to your `src/assets/monaco-editor/` folder manually.

Then set the `baseUrl` option in the module configuration to point to your local assets:

```typescript
import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';

@NgModule({
  imports: [
    CatbeeMonacoEditorModule.forRoot({
      baseUrl: 'assets/monaco-editor/' // Path to the folder containing `vs` folder
    }),
  ],
})
export class AppModule {}
```

## Configuration Options
The `CatbeeMonacoEditorGlobalConfig` interface defines the configuration options for the Monaco Editor module, which can be provided using the `forRoot()` method of `CatbeeMonacoEditorModule` or via the `provideCatbeeMonacoEditor()`, as shown below:

```ts
{
  baseUrl: string; // Base URL for monaco-editor assets (default: 'https://cdn.jsdelivr.net/npm/monaco-editor/min')
  defaultOptions: MonacoEditorOptions; // Default editor options
  monacoPreLoad: () => void; // Callback before monaco is loaded
  monacoLoad: (monaco: typeof monaco) => void; // Callback after monaco is loaded
  autoFormatTime: number; // Time to auto format after init (default: 100ms)
  resizeDebounceTime: number; // Debounce time for resize events (default: 100ms)
}
```

### Example Configuration

```ts
import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';

CatbeeMonacoEditorModule.forRoot({
  baseUrl: 'assets/monaco-editor/', // Use local assets
  defaultOptions: { theme: 'vs-dark', language: 'typescript' },
  monacoLoad: (monaco) => {
    // Custom monaco configurations

    // 1. Define a custom theme
    monaco.editor.defineTheme('myCustomTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [{ background: '1E1E1E' }],
      colors: {
        'editor.background': '#1E1E1E',
      },
    });

    // 2. Set TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
    });

    // 3. Add extra libraries
    monaco.languages.typescript.typescriptDefaults.addExtraLibs([
      {
        content: 'declare var myGlobalVar: string;',
        filePath: 'file:///node_modules/@types/my-global-var/index.d.ts',
      },
    ]);
  },
  autoFormatTime: 200,
  resizeDebounceTime: 150,
}),
```

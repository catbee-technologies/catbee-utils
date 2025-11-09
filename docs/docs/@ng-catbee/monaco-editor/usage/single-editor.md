---
id: single-editor
title: Single Editor
sidebar_position: 2
---

## CatbeeMonacoEditorComponent Example

### 1. Using [(ngModel)]

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoEditorComponent, MonacoEditorOptions, MonacoEditor, MonacoKeyMod, MonacoKeyCode } from '@ng-catbee/monaco-editor';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoEditorComponent, FormsModule],
  template: `
    <ng-catbee-monaco-editor
      [height]="'400px'"
      [width]="'100%'"
      [options]="options"
      [(ngModel)]="code"
      [placeholder]="'Start typing your code here...'"
      (init)="onInit($event)"
      (optionsChange)="onOptionsChange($event)"
    />
  `,
})
export class AppComponent {
  options: MonacoEditorOptions = {
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false }
  };

  code = `function hello() {\n  console.log('Hello, world!');\n}`;
  onInit(editor: MonacoEditor) {
    console.log('Editor initialized:', editor);

    editor.addCommand(MonacoKeyMod.CtrlCmd | MonacoKeyCode.KEY_S, () => {
      console.log('Ctrl+S pressed - implement save logic here');
    });
  }

  onOptionsChange(newOptions: MonacoEditorOptions) {
    console.log('Editor options changed:', newOptions);
  }
}
```

### 2. Using Reactive Forms

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoEditorComponent, MonacoEditorOptions } from '@ng-catbee/monaco-editor';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CatbeeMonacoEditorComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ng-catbee-monaco-editor formControlName="code" [options]="options" />
    </form>
  `
})
export class AppComponent {
  form = new FormGroup({
    code: new FormControl('const x = 42;')
  });

  options: MonacoEditorOptions = {
    language: 'javascript',
    theme: 'vs-dark'
  };
}
```

### 3. Using Custom Model

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoEditorComponent, MonacoEditorOptions, CatbeeMonacoEditorModel } from '@ng-catbee/monaco-editor';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoEditorComponent],
  template: `
    <ng-catbee-monaco-editor
      [height]="'400px'"
      [width]="'100%'"
      [options]="options"
      [model]="model"
    />
  `
})
export class AppComponent {
  options: MonacoEditorOptions = {
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false }
  };

  model: CatbeeMonacoEditorModel = {
    value: `function hello() {\n  console.log('Hello, world!');\n}`,
    language: 'typescript'
  };
}
```


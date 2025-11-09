---
id: diff-editor
title: Diff Editor
sidebar_position: 3
---

## CatbeeMonacoDiffEditorComponent Example

### 1. Using [(ngModel)]

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoDiffEditorComponent, MonacoDiffEditorOptions, CatbeeMonacoDiffEditorModel, CatbeeMonacoDiffEditorEvent } from '@ng-catbee/monaco-editor';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoDiffEditorComponent, FormsModule],
  template: `
    <ng-catbee-monaco-diff-editor
      [height]="'400px'"
      [width]="'100%'"
      [options]="options"
      [(ngModel)]="diffModel"
      (editorDiffUpdate)="onDiffUpdate($event)"
      [originalEditable]="false"
      [disabled]="false"
      [language]="'javascript'"
    />
  `
})
export class AppComponent {
  options: MonacoDiffEditorOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false }
  };

  diffModel: CatbeeMonacoDiffEditorModel = {
    original: 'function hello() {\n\talert("Hello, world!");\n}',
    modified: 'function hello() {\n\talert("");\n}',
  };

  onDiffUpdate(event: CatbeeMonacoDiffEditorEvent) {
    console.log('Diff updated:', event.original, event.modified);
  }
}
```

### 2. Using Reactive Forms

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoDiffEditorComponent, MonacoDiffEditorOptions } from '@ng-catbee/monaco-editor';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CatbeeMonacoDiffEditorComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ng-catbee-monaco-diff-editor formControlName="code" [language]="'javascript'" />
    </form>
  `
})
export class AppComponent {
  form = new FormGroup({
    code: new FormControl({ 
      original: 'function hello() {\n\talert("Hello, world!");\n}', 
      modified: 'function hello() {\n\talert("");\n}'
    })
  });
}
```

### 3. Using Custom Model

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoDiffEditorComponent, MonacoDiffEditorOptions, CatbeeMonacoDiffEditorModel } from '@ng-catbee/monaco-editor';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoDiffEditorComponent],
  template: `
    <ng-catbee-monaco-diff-editor [model]="model" />
  `
})
export class AppComponent {
  model: CatbeeMonacoDiffEditorModel = {
    original: `function hello() {\n  console.log('Hello, world!');\n}`,
    modified: `function hello() {\n  console.log('Hello, Catbee!');\n}`
  };
}
```

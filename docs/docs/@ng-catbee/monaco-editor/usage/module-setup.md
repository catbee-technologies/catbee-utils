---
id: module-setup
title: Module Setup
sidebar_position: 1
---

## Import the Module

### 1. Use in NgModule
```typescript
import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';

@NgModule({
	imports: [
      CatbeeMonacoEditorModule.forRoot({
        // Customization options - OPTIONAL
      }),
  ]
})
export class AppModule {}
```

#### or

### 2. Use in Standalone Components
```typescript
import { provideCatbeeMonacoEditor } from '@ng-catbee/monaco-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeMonacoEditor({
      // Customization options - OPTIONAL
    })
  ]
};
```

#### or

### 3. Use in ApplicationConfig
```typescript
import { importProvidersFrom } from '@angular/core';
import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      CatbeeMonacoEditorModule.forRoot({
        // Customization options - OPTIONAL
      })
    )
  ]
};
```

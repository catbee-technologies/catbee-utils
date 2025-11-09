---
id: api-reference
title: API Reference
sidebar_position: 4
---

## `CatbeeMonacoEditorComponent`: Single editor

### Properties
| Property | Description | Type | Default |
|----------|-------------|------|---------|
| `[height]` | Height of Monaco Editor | `string` | `300px` |
| `[width]` | Width of Monaco Editor | `string` | `100%` |
| `[disabled]` | Disabled of monaco editor | `boolean` | `false` |
| `[placeholder]` | Placeholder of monaco editor, Can change the style via defining the `.monaco-editor-placeholder` CSS. | `string` | - |
| `[placeholderColor]` | Color of the placeholder text | `string` | `rgba(128, 128, 128, 0.6)` |
| `[showPlaceholderOnWhiteSpace]` | Show placeholder when editor is empty but contains whitespace characters | `boolean` | `false` |
| `[autoFormat]` | Whether to automatically format the document | `boolean` | `true` |
| `[options]` | Default options when creating editors | `MonacoEditorOptions` | - |
| `[initDelay]` | Delay initializing monaco editor in ms | `number` | `0` |
| `[model]` | Model of monaco editor | `CatbeeMonacoEditorModel` | - |
| `[reInitOnOptionsChange]` | Whether to re-initialize the editor instance when options change. By default, the editor will re-initialize only if the language option changes. Note: Some options (like language) may require re-initialization to take effect. | `boolean` | `false` |

### Events
| Event  | Description | Type |
|--------|-------------|------|
| `(init)` | Event emitted when the editor is initialized | `EventEmitter<MonacoEditor>` |
| `(reInit)` | Event emitted when the editor is re-initialized | `EventEmitter<MonacoEditor>` |
| `(initError)` | Event emitted when the editor initialization fails | `EventEmitter<unknown>` |
| `(editorResize)` | Event emitted when the editor is resized | `EventEmitter<{ width: number; height: number }>` |
| `(optionsChange)` | Event emitted when the editor options are changed | `EventEmitter<MonacoEditorOptions>` |
| `(editorFocus)` | Event emitted when the text inside this editor gained focus | `EventEmitter<void>` |
| `(editorBlur)` | Event emitted when the text inside this editor lost focus | `EventEmitter<void>` |
| `(editorScroll)` | Event emitted when the scroll in the editor has changed | `EventEmitter<MonacoEditorScrollEvent>` |
| `(editorCursorPositionChange)` | Event emitted when the cursor position has changed | `EventEmitter<MonacoEditorCursorPositionChangedEvent>` |
| `(editorCursorSelectionChange)` | Event emitted when the cursor selection has changed | `EventEmitter<MonacoEditorCursorSelectionChangedEvent>` |
| `(editorContextmenu)` | Event emitted when a context menu is triggered in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(editorPaste)` | Event emitted when a paste event occurs in the editor | `EventEmitter<MonacoEditorPasteEvent>` |
| `(editorKeyDown)` | Event emitted when a key is pressed down in the editor | `EventEmitter<MonacoEditorKeyboardEvent>` |
| `(editorKeyUp)` | Event emitted when a key is released in the editor | `EventEmitter<MonacoEditorKeyboardEvent>` |
| `(editorMouseDown)` | Event emitted when the mouse button is pressed down in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(editorMouseUp)` | Event emitted when the mouse button is released in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(editorMouseMove)` | Event emitted when the mouse is moved in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(editorMouseLeave)` | Event emitted when the mouse leaves the editor | `EventEmitter<MonacoEditorPartialMouseEvent>` |
| `(editorModelContentChange)` | Event emitted when the content of the current model has changed | `EventEmitter<MonacoModelContentChangedEvent>` |

## `CatbeeMonacoDiffEditorComponent`: Diff editor

### Properties
| Property | Description | Type | Default |
|----------|-------------|------|---------|
| `[height]` | Height of Monaco Editor | `string` | `300px` |
| `[width]` | Width of Monaco Editor | `string` | `100%` |
| `[disabled]` | Disables Modified Editor | `boolean` | `false` |
| `[options]` | Default options when creating editors | `MonacoDiffEditorOptions` | - |
| `[language]` | Language of both original and modified models | `string` | `plaintext` |
| `[initDelay]` | Delay initializing monaco editor in ms | `number` | `0` |
| `[model]` | Model of monaco editor | `CatbeeMonacoEditorModel` | - |
|
| `[originalEditable]` | Whether the original editor is editable | `boolean` | `false` |
| `[reInitOnOptionsChange]` | Whether to re-initialize the editor instance when options change. By default, the editor will re-initialize only if the language option changes. Note: Some options (like language) may require re-initialization to take effect. | `boolean` | `false` |

### Events
| Event  | Description | Type |
|--------|-------------|------|
| `(init)` | Event emitted when the editor is initialized | `EventEmitter<MonacoEditor>` |
| `(reInit)` | Event emitted when the editor is re-initialized | `EventEmitter<MonacoEditor>` |
| `(initError)` | Event emitted when the editor initialization fails | `EventEmitter<unknown>` |
| `(editorResize)` | Event emitted when the editor is resized | `EventEmitter<{ width: number; height: number }>` |
| `(optionsChange)` | Event emitted when the editor options are changed | `EventEmitter<MonacoEditorOptions>` |
| `(editorDiffUpdate)` | Event emitted when the diff information computed by this diff editor has been updated | `EventEmitter<CatbeeMonacoDiffEditorEvent>` |

---
id: types
title: Type Definitions
sidebar_position: 5
---

Below are the key exported types and interfaces available in @ng-catbee/monaco-editor for strong typing and IntelliSense support:

## Core Monaco Types
- **`Monaco`** — The Monaco namespace.
- **`MonacoEditor`** — The Monaco standalone code editor interface.
- **`MonacoEditorOptions`** — Configuration options for the Monaco standalone code editor.
- **`MonacoDiffEditor`** — The Monaco standalone diff editor interface.
- **`MonacoDiffEditorOptions`** — Configuration options for the Monaco standalone diff editor.

## Editor Events & Models
- **`MonacoModelContentChangedEvent`** — Event for content changes in a Monaco model.
- **`MonacoEditorKeyboardEvent`** — Event for keyboard interactions in the editor.
- **`MonacoEditorMouseEvent`** — Event for mouse interactions in the editor.
- **`MonacoEditorPartialMouseEvent`** — Partial mouse event type for editor mouse interactions.
- **`MonacoEditorLanguageChangedEvent`** — Event fired when the language of a model changes.
- **`MonacoEditorScrollEvent`** — Event for scroll position changes in the editor.
- **`MonacoEditorCursorPositionChangedEvent`** — Event for cursor position changes.
- **`MonacoEditorCursorSelectionChangedEvent`** — Event for cursor selection changes.
- **`MonacoEditorPasteEvent`** — Event for paste operations in the editor.

## Keyboard & Theme
- **`MonacoKeyCode`** — Enumeration for key codes used by Monaco.
- **`MonacoKeyMod`** — Enumeration for modifier keys (Ctrl, Alt, etc.).
- **`MonacoBuiltinTheme`** — Built-in Monaco editor theme type.
- **`MonacoEditorCustomThemeData`** — Interface for defining custom Monaco editor themes.

## Catbee-Specific Types
- **`CatbeeMonacoEditorModel`** — Model interface for the single editor component.
- **`CatbeeMonacoDiffEditorModel`** — Model interface for the diff editor component.
- **`CatbeeMonacoDiffEditorEvent`** — Event interface emitted by the diff editor component.

## Configuration Interface
- **`CatbeeMonacoEditorGlobalConfig`** — Global configuration options for the Catbee Monaco Editor module.

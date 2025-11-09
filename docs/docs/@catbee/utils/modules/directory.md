# Directory Utilities

Helpers for file and directory operations.  
These utilities provide async functions for creating, deleting, copying, moving, listing, watching, and analyzing directories and files.

## API Summary

- [**`ensureDir(dirPath: string): Promise<void>`**](#ensuredir) - Ensures a directory exists, creating parent directories if needed.
- [**`listFiles(dirPath: string, recursive?: boolean): Promise<string[]>`**](#listfiles) - List all files in a directory, optionally recursively.
- [**`deleteDirRecursive(dirPath: string): Promise<void>`**](#deletedirrecursive) - Delete a directory and all its contents recursively.
- [**`isDirectory(pathStr: string): Promise<boolean>`**](#isdirectory) - Check if a given path is a directory.
- [**`copyDir(src: string, dest: string): Promise<void>`**](#copydir) - Recursively copy a directory and its contents.
- [**`moveDir(src: string, dest: string): Promise<void>`**](#movedir) - Move a directory to a new location.
- [**`emptyDir(dirPath: string): Promise<void>`**](#emptydir) - Remove all files and subdirectories from a directory.
- [**`getDirSize(dirPath: string): Promise<number>`**](#getdirsize) - Get the total size (bytes) of all files in a directory.
- [**`watchDir(dirPath: string, callback: (eventType: "rename" | "change", filename: string | null) => void): () => void`**](#watchdir) - Watch a directory for file changes.
- [**`findFilesByPattern(pattern: string, options?: FindFilesByPatternOptions): Promise<string[]>`**](#findfilesbypattern) - Find files matching a glob pattern.
- [**`getSubdirectories(dirPath: string, recursive?: boolean): Promise<string[]>`**](#getsubdirectories) - List all subdirectories, optionally recursively.
- [**`ensureEmptyDir(dirPath: string): Promise<void>`**](#ensureemptydir) - Ensure a directory exists and is empty.
- [**`createTempDir(options?: CreateTempDirOptions): Promise<{ path: string, cleanup: () => Promise<void> }>`**](#createtempdir) - Create a temporary directory with optional cleanup.
- [**`findNewestFile(dirPath: string, recursive?: boolean): Promise<string | null>`**](#findnewestfile) - Find the newest file in a directory.
- [**`findOldestFile(dirPath: string, recursive?: boolean): Promise<string | null>`**](#findoldestfile) - Find the oldest file in a directory.
- [**`findInDir(dirPath: string, predicate: (path: string, stat: fs.Stats) => boolean | Promise<boolean>, recursive?: boolean): Promise<string[]>`**](#findindir) - Find files or directories matching a predicate.
- [**`watchDirRecursive(dirPath: string, callback: (eventType: "rename" | "change", filename: string) => void, includeSubdirs?: boolean): Promise<() => void>`**](#watchdirrecursive) - Watch a directory and its subdirectories for changes.
- [**`getDirStats(dirPath: string): Promise<DirStats>`**](#getdirstats) - Get file count, directory count, and total size.
- [**`walkDir(dirPath: string, options: WalkDirOptions): Promise<void>`**](#walkdir) - Walk through a directory hierarchy, calling a visitor function for each entry.

---

## Types & Interfaces

```ts
// Type for findFilesByPattern options
export interface FindFilesByPatternOptions {
  cwd?: string;
  dot?: boolean;
  nodir?: boolean;
}

// Type for createTempDir options
export interface CreateTempDirOptions {
  prefix?: string;
  parentDir?: string;
  cleanup?: boolean;
}

// Type for getDirStats result
export interface DirStats {
  fileCount: number;
  dirCount: number;
  totalSize: number;
}

// Type for walkDir options
export interface WalkDirOptions {
  visitorFn: (entry: {
    path: string;
    name: string;
    isDirectory: boolean;
    stats: import('fs').Stats;
  }) => boolean | void | Promise<boolean | void>;
  traversalOrder?: 'pre' | 'post';
}
```

---

## Function Documentation & Usage Examples

### `ensureDir()`
Ensures a directory exists, creating parent directories if needed.

**Method Signature:**
```ts
function ensureDir(dirPath: string): Promise<void>
```

**Parameters:**
- `dirPath`: The path of the directory to ensure.

**Returns:**
- A promise that resolves when the directory is ensured.

**Examples:**
```ts
import { ensureDir } from "@catbee/utils";

await ensureDir('./data/logs');
```

---

### `listFiles()`
List all files in a directory, optionally recursively.

**Method Signature:**
```ts
function listFiles(dirPath: string, recursive?: boolean): Promise<string[]>
```

**Parameters:**
- `dirPath`: The path of the directory to list files from.
- `recursive`: Whether to list files recursively (default: false).

**Returns:**
- A promise that resolves to an array of file paths.

**Examples:**
```ts
import { listFiles } from "@catbee/utils";

const files = await listFiles('./data', true); // recursive
```

---

### `deleteDirRecursive()`
Delete a directory and all its contents recursively.

**Method Signature:**
```ts
function deleteDirRecursive(dirPath: string): Promise<void>
```

**Parameters:**
- `dirPath`: The path of the directory to delete.

**Returns:**
- A promise that resolves when the directory is deleted.

**Examples:**
```ts
import { deleteDirRecursive } from "@catbee/utils";

await deleteDirRecursive('./old-backups');
```

---

### `isDirectory()`
Check if a given path is a directory.

**Method Signature:**
```ts
function isDirectory(pathStr: string): Promise<boolean>
```

**Parameters:**
- `pathStr`: The path to check.

**Returns:**
- A promise that resolves to `true` if the path is a directory, otherwise `false

**Examples:**
```ts
import { isDirectory } from "@catbee/utils";

const isDir = await isDirectory('./data');
```

---

### `copyDir()>`
Recursively copy a directory and its contents.

**Method Signature:**
```ts
function copyDir(src: string, dest: string): Promise<void>
```

**Parameters:**
- `src`: The source directory path.
- `dest`: The destination directory path.

**Returns:**
- A promise that resolves when the copy is complete.

**Examples:**
```ts
import { copyDir } from "@catbee/utils";

await copyDir('./src', './backup/src');
```

---

### `moveDir()`
Move a directory to a new location.

**Method Signature:**
```ts
function moveDir(src: string, dest: string): Promise<void>
```

**Parameters:**
- `src`: The source directory path.
- `dest`: The destination directory path.

**Returns:**
- A promise that resolves when the move is complete.

**Examples:**
```ts
import { moveDir } from "@catbee/utils";

await moveDir('./temp', './archive/temp');
```

---

### `emptyDir()`
Remove all files and subdirectories from a directory.

**Method Signature:**
```ts
function emptyDir(dirPath: string): Promise<void>
```

**Parameters:**
- `dirPath`: The path of the directory to empty.

**Returns:**
- A promise that resolves when the directory is emptied.

**Examples:**
```ts
import { emptyDir } from "@catbee/utils";

await emptyDir('./cache');
```

---

### `getDirSize()`
Get the total size (bytes) of all files in a directory.

**Method Signature:**
```ts
function getDirSize(dirPath: string): Promise<number>
```

**Parameters:**
- `dirPath`: The path of the directory to analyze.

**Returns:**
- A promise that resolves to the total size in bytes.

**Examples:**
```ts
import { getDirSize } from "@catbee/utils";

const size = await getDirSize('./uploads');
```

---

### `watchDir()`
Watch a directory for file changes.

**Method Signature:**
```ts
function watchDir(dirPath: string, callback: (eventType: "rename" | "change", filename: string | null) => void): () => void
```

**Parameters:**
- `dirPath`: The path of the directory to watch.
- `callback`: A function called on file changes with event type and filename.

**Returns:**
- A function to stop watching.

**Examples:**
```ts
import { watchDir } from "@catbee/utils";

const stop = watchDir('./data', (event, file) => {
  console.log(event, file);
});
// Call stop() to stop watching
```

---

### `findFilesByPattern()`
Find files matching a glob pattern.

**Method Signature:**
```ts
function findFilesByPattern(pattern: string, options?: FindFilesByPatternOptions): Promise<string[]>
```

**Parameters:**
- `pattern`: The glob pattern to match files.
- `options`: Optional settings:
  - `cwd`: The base directory to search (default: process.cwd()).
  - `dot`: Whether to include dotfiles (default: false).
  - `nodir`: Whether to exclude directories from results (default: true).

**Returns:**
- A promise that resolves to an array of matching file paths.

**Examples:**
```ts
import { findFilesByPattern } from "@catbee/utils";

const jpgs = await findFilesByPattern('**/*.jpg', { cwd: './images' });
```

---

### `getSubdirectories()`
List all subdirectories, optionally recursively.

**Method Signature:**
```ts
function getSubdirectories(dirPath: string, recursive?: boolean): Promise<string[]>
```

**Parameters:**
- `dirPath`: The path of the directory to list subdirectories from.
- `recursive`: Whether to list subdirectories recursively (default: false).

**Returns:**
- A promise that resolves to an array of subdirectory paths.

**Examples:**
```ts
import { getSubdirectories } from "@catbee/utils";

const dirs = await getSubdirectories('./projects', true); // recursive
```

---

### `ensureEmptyDir()`
Ensure a directory exists and is empty.

**Method Signature:**
```ts
function ensureEmptyDir(dirPath: string): Promise<void>
```

**Parameters:**
- `dirPath`: The path of the directory to ensure is empty.

**Returns:**
- A promise that resolves when the directory is ensured to be empty.

**Examples:**
```ts
import { ensureEmptyDir } from "@catbee/utils";
await ensureEmptyDir('./temp');
```

---

### `createTempDir()`
Create a temporary directory with optional cleanup.

**Method Signature:**
```ts
function createTempDir(options?: CreateTempDirOptions): Promise<{ path: string, cleanup: () => Promise<void> }>
```

**Parameters:**
- `options`: Optional settings:
  - `prefix`: Prefix for the temp directory name (default: 'tmp-').
  - `parentDir`: Parent directory to create the temp dir in (default: system temp dir).
  - `cleanup`: Whether to provide a cleanup function (default: true).

**Returns:**
- A promise that resolves to an object with:
  - `path`: The path of the created temp directory.
  - `cleanup`: A function to remove the temp directory.

**Examples:**
```ts
import { createTempDir } from "@catbee/utils";

const { path, cleanup } = await createTempDir({ prefix: 'session-' });
// ...use path...
await cleanup(); // remove temp dir
```

---

### `findNewestFile()`
Find the newest file in a directory.

**Method Signature:**
```ts
function findNewestFile(dirPath: string, recursive?: boolean): Promise<string | null>
```

**Parameters:**
- `dirPath`: The path of the directory to search.
- `recursive`: Whether to search subdirectories (default: false).

**Returns:**
- A promise that resolves to the path of the newest file, or null if no files are found.

**Examples:**
```ts
import { findNewestFile } from "@catbee/utils";

const newest = await findNewestFile('./logs', true);
```

---

### `findOldestFile()`
Find the oldest file in a directory.

**Method Signature:**
```ts
function findOldestFile(dirPath: string, recursive?: boolean): Promise<string | null>
```

**Parameters:**
- `dirPath`: The path of the directory to search.
- `recursive`: Whether to search subdirectories (default: false).

**Returns:**
- A promise that resolves to the path of the oldest file, or null if no files are found.

**Examples:**
```ts
import { findOldestFile } from "@catbee/utils";

const oldest = await findOldestFile('./logs', true);
```

---

### `findInDir()`
Find files or directories matching a predicate.

**Method Signature:**
```ts
function findInDir(dirPath: string, predicate: (path: string, stat: fs.Stats) => boolean | Promise<boolean>, recursive?: boolean): Promise<string[]>
```

**Parameters:**
- `dirPath`: The path of the directory to search.
- `predicate`: A function that takes a file path and its stats, returning true if it matches.
  - `path`: The file or directory path.
  - `stat`: The fs.Stats object for the path.
- `recursive`: Whether to search subdirectories (default: false).

**Returns:**
- A promise that resolves to an array of matching file or directory paths.

**Examples:**
```ts
import { findInDir } from "@catbee/utils";

const jpgs = await findInDir('./content', (p, stat) => p.endsWith('.jpg'), true);
```

---

### `watchDirRecursive()`
Watch a directory and its subdirectories for changes.

**Method Signature:**
```ts
function watchDirRecursive(dirPath: string, callback: (eventType: "rename" | "change", filename: string) => void, includeSubdirs?: boolean): Promise<() => void>
```

**Parameters:**
- `dirPath`: The path of the directory to watch.
- `callback`: A function called on file changes with event type and filename.
- `includeSubdirs`: Whether to watch subdirectories (default: true).

**Returns:**
- A promise that resolves to a function to stop watching.

**Examples:**
```ts
import { watchDirRecursive } from "@catbee/utils";

const stop = await watchDirRecursive('./data', (event, file) => {
  console.log(event, file);
});
// Call stop() to stop watching
```

---

### `getDirStats()`
Get file count, directory count, and total size.

**Method Signature:**
```ts
function getDirStats(dirPath: string): Promise<DirStats>
```

**Parameters:**
- `dirPath`: The path of the directory to analyze.

**Returns:**
- A promise that resolves to an object with:
  - `fileCount`: Number of files.
  - `dirCount`: Number of subdirectories.
  - `totalSize`: Total size in bytes of all files.

**Examples:**
```ts
import { getDirStats } from "@catbee/utils";

const stats = await getDirStats('./data');
console.log(stats.fileCount, stats.dirCount, stats.totalSize);
```

---

### `walkDir()`
Walk through a directory hierarchy, calling a visitor function for each entry.

**Method Signature:**
```ts
function walkDir(dirPath: string, options: WalkDirOptions): Promise<void>
```

**Parameters:**
- `dirPath`: The path of the directory to walk.
- `options`: An object with:
  - `visitorFn`: A function called for each entry with its path, name, isDirectory flag, and stats. Returning `false` skips descending into directories.
  - `traversalOrder`: 'pre' to call visitor before descending, 'post' after (default: 'pre'). 

**Returns:**
- A promise that resolves when the walk is complete.

**Examples:**
```ts
import { walkDir } from "@catbee/utils";

await walkDir('./data', {
  visitorFn: entry => {
    console.log(entry.path, entry.isDirectory);
  },
  traversalOrder: 'pre'
});
```

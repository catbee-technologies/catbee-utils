# File System Utilities

A comprehensive set of utilities for common file system operations including reading, writing, and manipulating files and directories. These utilities provide promise-based wrappers around Node.js fs operations with proper error handling and simplified interfaces.

## API Summary

- [**`fileExists(path: string): Promise<boolean>`**](#fileexists) - Checks if a file or directory exists.
- [**`readJsonFile<T>(path: string): Promise<T | null>`**](#readjsonfile) - Reads and parses a JSON file.
- [**`writeJsonFile(path: string, data: any, space?: number): Promise<void>`**](#writejsonfile) - Writes an object to a file as JSON.
- [**`deleteFileIfExists(path: string): Promise<void>`**](#deletefileifexists) - Deletes a file if it exists.
- [**`readTextFile(path: string, encoding?: string): Promise<string | null>`**](#readtextfile) - Reads a text file.
- [**`writeTextFile(path: string, content: string, encoding?: string): Promise<void>`**](#writetextfile) - Writes text content to a file.
- [**`appendTextFile(path: string, content: string, encoding?: string): Promise<void>`**](#appendtextfile) - Appends text content to a file.
- [**`copyFile(source: string, destination: string, overwrite?: boolean): Promise<void>`**](#copyfile) - Copies a file.
- [**`moveFile(oldPath: string, newPath: string): Promise<void>`**](#movefile) - Moves a file.
- [**`getFileStats(path: string): Promise<fs.Stats | null>`**](#getfilestats) - Gets file stats if the file exists.
- [**`createTempFile(options?: { content?: string }): Promise<string>`**](#createtempfile) - Creates a temporary file with optional content.
- [**`streamFile(source: string, destination: string): Promise<void>`**](#streamfile) - Streams a file from source to destination.
- [**`readDirectory(dirPath: string, options?: { withFileTypes?: boolean }): Promise<string[]>`**](#readdirectory) - Reads a directory and returns file names.
- [**`createDirectory(dirPath: string, recursive?: boolean): Promise<void>`**](#createdirectory) - Creates a directory if it doesn't exist.
- [**`safeReadJsonFile<T>(path: string): Promise<T | null>`**](#safereadjsonfile) - Safely reads and parses a JSON file with error details.
- [**`isFile(path: string): Promise<boolean>`**](#isfile) - Checks if a path points to a file (not a directory).
- [**`getFileSize(path: string): Promise<number | null>`**](#getfilesize) - Gets the size of a file in bytes.
- [**`readFileBuffer(path: string): Promise<Buffer | null>`**](#readfilebuffer) - Reads a file as a Buffer.

---

## Function Documentation & Usage Examples

### `fileExists`
Checks whether a file or directory exists at the given path.

**Method Signature:**
```ts
async function fileExists(path: string): Promise<boolean>
```

**Parameters:**
- `path` (string): The path to the file or directory.

**Returns:**
- `Promise<boolean>`: Resolves to true if the file or directory exists, false otherwise.

**Example:**
```ts
import { fileExists } from "@catbee/utils";

if (await fileExists('./config.json')) {
  console.log('Configuration file exists');
}
```

---

### `readJsonFile`

Reads and parses a JSON file from the specified path.

**Method Signature:**
```ts
async function readJsonFile<T = any>(path: string): Promise<T | null>
```

**Parameters:**
- `path` (string): The path to the JSON file.

**Returns:**
- `Promise<T | null>`: Resolves to the parsed JSON object or null if the file doesn't exist or parsing fails.

**Example:**
```ts
import { readJsonFile } from "@catbee/utils";

interface Config {
  apiKey: string;
  endpoint: string;
}

const config = await readJsonFile<Config>('./config.json');
if (config) {
  console.log(`Using API at ${config.endpoint}`);
}
```

---

### `writeJsonFile`
Writes a JavaScript object to a file as formatted JSON.

**Method Signature:**
```ts
async function writeJsonFile(path: string, data: any, space?: number): Promise<void>
```

**Parameters:**
- `path` (string): The path to the file where JSON should be written.
- `data` (any): The JavaScript object to serialize as JSON.
- `space` (number, optional): Number of spaces for indentation in the JSON file.

**Returns:**
- `Promise<void>`: Resolves when the file has been written.

**Example:**
```ts
import { writeJsonFile } from "@catbee/utils";

const data = {
  name: "Project",
  version: "1.0.0",
  dependencies: []
};

await writeJsonFile('./package.json', data, 2);
```

---

### `deleteFileIfExists`
Deletes a file if it exists.

**Method Signature:**
```ts
async function deleteFileIfExists(path: string): Promise<boolean>
```

**Parameters:**
- `path` (string): The path to the file to delete.

**Returns:**
- `Promise<boolean>`: Resolves to true if the file was deleted or didn't exist, false if deletion failed.

**Example:**
```ts
import { deleteFileIfExists } from "@catbee/utils";

const deleted = await deleteFileIfExists('./temp.log');
console.log(deleted ? 'File deleted or didn\'t exist' : 'Deletion failed');
```

---

### `readTextFile`
Reads a text file from the specified path.

**Method Signature:**
```ts
async function readTextFile(path: string, encoding?: BufferEncoding): Promise<string | null>
```

**Parameters:**
- `path` (string): The path to the text file.
- `encoding` (BufferEncoding, optional): The text encoding to use. Defaults to 'utf-8'.

**Returns:**
- `Promise<string | null>`: Resolves to the file content as a string, or null if the file doesn't exist or reading fails.

**Example:**
```ts
import { readTextFile } from "@catbee/utils";

const content = await readTextFile('./README.md');
if (content) {
  console.log('File content:', content.substring(0, 100) + '...');
}
```

---

### `writeTextFile`
Writes text content to a file.

**Method Signature:**
```ts
async function writeTextFile(path: string, content: string, encoding?: BufferEncoding): Promise<boolean>
```

**Parameters:**
- `path` (string): The path to the file where text should be written.
- `content` (string): The text content to write to the file.
- `encoding` (BufferEncoding, optional): The text encoding to use. Defaults to 'utf-8'.

**Returns:**
- `Promise<boolean>`: Resolves to true if the file was written successfully, false otherwise.

**Example:**
```ts
import { writeTextFile } from "@catbee/utils";

const success = await writeTextFile('./log.txt', 'Application started', 'utf-8');
if (success) {
  console.log('Log entry written');
}
```

---

### `appendTextFile`

Appends text content to a file.

**Method Signature:**
```ts
async function appendTextFile(path: string, content: string, encoding?: BufferEncoding): Promise<boolean>
```

**Parameters:**
- `path` (string): The path to the file where text should be appended.
- `content` (string): The text content to append to the file.
- `encoding` (BufferEncoding, optional): The text encoding to use. Defaults to 'utf-8'.

**Returns:**
- `Promise<boolean>`: Resolves to true if the content was appended successfully, false otherwise.

**Example:**
```ts
import { appendTextFile } from "@catbee/utils";

const success = await appendTextFile('./log.txt', '\nNew log entry at ' + new Date().toISOString());
if (success) {
  console.log('Log entry appended');
}
```

---

### `copyFile`
Copies a file from source to destination.

**Method Signature:**
```ts
async function copyFile(source: string, destination: string, overwrite?: boolean): Promise<boolean>
```

**Parameters:**
- `source` (string): The path to the source file.
- `destination` (string): The path to the destination file.
- `overwrite` (boolean, optional): Whether to overwrite the destination file if it exists. Defaults to false. 

**Returns:**
- `Promise<boolean>`: Resolves to true if the file was copied successfully, false otherwise.

**Example:**
```ts
import { copyFile } from "@catbee/utils";

const copied = await copyFile('./original.txt', './backup.txt', true);
console.log(copied ? 'File copied successfully' : 'Copy failed');
```

---

### `moveFile`
Renames/moves a file.

**Method Signature:**
```ts
async function moveFile(oldPath: string, newPath: string): Promise<boolean>
```

**Parameters:**
- `oldPath` (string): The current path of the file.
- `newPath` (string): The new path for the file.

**Returns:**
- `Promise<boolean>`: Resolves to true if the file was moved successfully, false otherwise.

**Example:**
```ts
import { moveFile } from "@catbee/utils";

const moved = await moveFile('./temp.txt', './processed/temp.txt');
console.log(moved ? 'File moved successfully' : 'Move failed');
```

---

### `getFileStats`
Gets file stats if the file exists.

**Method Signature:**
```ts
async function getFileStats(path: string): Promise<Stats | null>
```

**Parameters:**
- `path` (string): The path to the file. 

**Returns:**
- `Promise<Stats | null>`: Resolves to the file stats object if the file exists, or null if it doesn't.
  - `Stats` is the Node.js fs.Stats object containing file metadata.

**Example:**
```ts
import { getFileStats } from "@catbee/utils";

const stats = await getFileStats('./document.pdf');
if (stats) {
  console.log(`File size: ${stats.size} bytes`);
  console.log(`Last modified: ${stats.mtime}`);
}
```

---

### `createTempFile`
Creates a temporary file with optional content.

**Method Signature:**
```ts
interface TempFileOptions {
  prefix?: string;
  extension?: string;
  dir?: string;
  content?: string | Buffer;
}

async function createTempFile(options?: TempFileOptions): Promise<string>
```

**Parameters:**
- `options` (TempFileOptions, optional): Configuration options for the temporary file.
  - `prefix` (string, optional): Prefix for the temp file name.
  - `extension` (string, optional): File extension (e.g., '.txt').
  - `dir` (string, optional): Directory to create the temp file in. Defaults to the system temp directory.
  - `content` (string | Buffer, optional): Initial content to write to the temp file.

**Returns:**
- `Promise<string>`: Resolves to the path of the created temporary file. 

**Example:**
```ts
import { createTempFile } from "@catbee/utils";

const tempPath = await createTempFile({
  prefix: 'upload-',
  extension: '.json',
  content: JSON.stringify({ status: "processing" })
});
console.log(`Created temporary file at: ${tempPath}`);
```

---

### `streamFile`
Streams a file from source to destination.

**Method Signature:**
```ts
async function streamFile(source: string, destination: string): Promise<void>
```

**Parameters:**
- `source` (string): The path to the source file.
- `destination` (string): The path to the destination file.

**Returns:**
- `Promise<void>`: Resolves when the streaming is complete.

**Example:**
```ts
import { streamFile } from "@catbee/utils";

try {
  await streamFile('./largefile.mp4', './backup/largefile.mp4');
  console.log('File streamed successfully');
} catch (error) {
  console.error('Streaming failed:', error);
}
```

---

### `readDirectory`
Reads a directory and returns file names.

**Method Signature:**
```ts
interface ReadDirectoryOptions {
  fullPaths?: boolean;
  filter?: RegExp;
}

async function readDirectory(
  dirPath: string,
  options?: ReadDirectoryOptions
): Promise<string[]>
```

**Parameters:**
- `dirPath` (string): The path to the directory to read.
- `options` (ReadDirectoryOptions, optional): Options for reading the directory.
  - `fullPaths` (boolean, optional): If true, returns full paths instead of just file names. Defaults to false.
  - `filter` (RegExp, optional): A regular expression to filter file names.

**Returns:**
- `Promise<string[]>`: Resolves to an array of file names or paths in the directory.

**Example:**
```ts
import { readDirectory } from "@catbee/utils";

// Get all JavaScript files with full paths
const jsFiles = await readDirectory('./src', {
  fullPaths: true,
  filter: /\.js$/
});
console.log(`Found ${jsFiles.length} JavaScript files`);
```

---

### `createDirectory`
Creates a directory if it doesn't exist.

**Method Signature:**
```ts
async function createDirectory(dirPath: string, recursive?: boolean): Promise<boolean>
```

**Parameters:**
- `dirPath` (string): The path of the directory to create.
- `recursive` (boolean, optional): If true, creates parent directories as needed. Defaults to false.

**Returns:**
- `Promise<boolean>`: Resolves to true if the directory was created or already exists, false if creation failed.

**Example:**
```ts
import { createDirectory } from "@catbee/utils";

const created = await createDirectory('./uploads/images', true);
if (created) {
  console.log('Directory created successfully');
}
```

---

### `safeReadJsonFile`
Safely reads and parses a JSON file with error details.

**Method Signature:**
```ts
interface JsonReadResult<T> {
  data: T | null;
  error: Error | null;
}

async function safeReadJsonFile<T = any>(path: string): Promise<JsonReadResult<T>>
```

**Parameters:**
- `path` (string): The path to the JSON file.

**Returns:**
- `Promise<JsonReadResult<T>>`: Resolves to an object containing:
  - `data` (T | null): The parsed JSON object, or null if reading/parsing failed.
  - `error` (Error | null): An error object if an error occurred, or null if successful.  

**Example:**
```ts
import { safeReadJsonFile } from "@catbee/utils";

const { data, error } = await safeReadJsonFile('./config.json');
if (error) {
  console.error('Error reading config:', error.message);
} else {
  console.log('Config loaded:', data);
}
```

---

### `isFile`
Checks if a path points to a file (not a directory).

**Method Signature:**
```ts
async function isFile(path: string): Promise<boolean>
```

**Parameters:**
- `path` (string): The path to check. 

**Returns:**
- `Promise<boolean>`: Resolves to true if the path points to a file, false if it points to a directory or doesn't exist. 

**Example:**
```ts
import { isFile } from "@catbee/utils";

if (await isFile('./path/to/item')) {
  console.log('This is a file');
} else {
  console.log('This is not a file or doesn\'t exist');
}
```

---

### `getFileSize`
Gets the size of a file in bytes.

**Method Signature:**
```ts
async function getFileSize(path: string): Promise<number>
```

**Parameters:**
- `path` (string): The path to the file.

**Returns:**
- `Promise<number>`: Resolves to the file size in bytes, or -1 if the file doesn't exist.

**Example:**
```ts
import { getFileSize } from "@catbee/utils";

const size = await getFileSize('./document.pdf');
if (size >= 0) {
  console.log(`File size: ${size} bytes`);
} else {
  console.log('File not found');
}
```

---

### `readFileBuffer`
Reads a file as a Buffer.

**Method Signature:**
```ts
async function readFileBuffer(path: string): Promise<Buffer | null>
```

**Parameters:**
- `path` (string): The path to the file.

**Returns:**
- `Promise<Buffer | null>`: Resolves to a Buffer containing the file data, or null if the file doesn't exist or reading fails.

**Example:**
```ts
import { readFileBuffer } from "@catbee/utils";

const buffer = await readFileBuffer('./image.png');
if (buffer) {
  console.log(`Read ${buffer.length} bytes`);
}
```

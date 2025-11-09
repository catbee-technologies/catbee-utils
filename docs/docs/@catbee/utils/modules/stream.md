# Stream Utilities

Helpers for working with Node.js streams, including conversion between buffers/strings and streams, batching, throttling, and line splitting. All methods are fully typed.

## Functions

- [**`bufferToStream(data: Buffer | string): Readable`**](#buffertostream) - Converts a buffer or string to a readable stream.
- [**`streamToBuffer(stream: Readable): Promise<Buffer>`**](#streamtobuffer) - Converts a readable stream to a buffer.
- [**`streamToString(stream: Readable, encoding?: BufferEncoding): Promise<string>`**](#streamtostring) - Converts a readable stream to a string.
- [**`createThrottleStream(bytesPerSecond: number): Transform`**](#createthrottlestream) - Creates a transform stream that limits the rate of data flow.
- [**`createBatchStream(size: number, options?: { objectMode?: boolean }): Transform`**](#createbatchstream) - Creates a transform stream that batches data into chunks of specified size.
- [**`createLineStream(options?: { encoding?: BufferEncoding; includeNewlines?: boolean }): Transform`**](#createlinestream) - Creates a transform stream that splits text data by newlines.

---

## Interfaces & Types

```ts
import { Readable, Transform } from 'stream';

export type BufferEncoding = 'utf8' | 'ascii' | 'base64' | 'hex' | 'latin1' | 'ucs2' | 'utf16le';

export interface BatchStreamOptions {
  objectMode?: boolean;
}

export interface LineStreamOptions {
  encoding?: BufferEncoding;
  includeNewlines?: boolean;
}
```

---

## Function Documentation & Usage Examples

### `bufferToStream()`
Converts a buffer or string to a readable stream.

**Method Signature:**
```ts
function bufferToStream(data: Buffer | string): Readable
```

**Parameters:**
- `data` - Buffer or string to convert

**Returns:** 
- Readable stream containing the data

**Example:**
```ts
import { bufferToStream } from '@catbee/utils';
import fs from 'fs';

// Convert string to stream
const stringStream = bufferToStream('Hello world');

// Convert buffer to stream
const buffer = fs.readFileSync('example.txt');
const bufferStream = bufferToStream(buffer);

// Pipe to another destination
stringStream.pipe(fs.createWriteStream('output.txt'));
```

### `streamToBuffer()`
Converts a readable stream to a buffer.

**Method Signature:**
```ts
async function streamToBuffer(stream: Readable): Promise<Buffer>
```

**Parameters:**
- `stream` - Readable stream to convert

**Returns:** 
- Promise resolving to a buffer containing all stream data

**Example:**
```ts
import { streamToBuffer } from '@catbee/utils';
import fs from 'fs';

async function processFile() {
  const fileStream = fs.createReadStream('large-file.bin');
  
  try {
    // Convert the entire stream to a buffer
    const buffer = await streamToBuffer(fileStream);
    
    // Now you can work with the complete buffer
    console.log(`File size: ${buffer.length} bytes`);
    
    // Process binary data
    const header = buffer.slice(0, 8);
    console.log('File header:', header);
    
    return buffer;
  } catch (err) {
    console.error('Error processing file:', err);
  }
}
```

### `streamToString()`
Converts a readable stream to a string.

**Method Signature:**
```ts
async function streamToString(stream: Readable, encoding: BufferEncoding = 'utf8'): Promise<string>
```

**Parameters:**
- `stream` - Readable stream to convert
- `encoding` - Character encoding (default: 'utf8')

**Returns:** 
- Promise resolving to a string containing all stream data

**Example:**
```ts
import { streamToString } from '@catbee/utils';
import fs from 'fs';
import { request } from 'https';

// Reading from a file
async function readTextFile(path: string) {
  const fileStream = fs.createReadStream(path);
  const content = await streamToString(fileStream);
  return content;
}

// Reading from an HTTP response
async function fetchTextContent(url: string) {
  return new Promise<string>((resolve, reject) => {
    request(url, (res) => {
      streamToString(res)
        .then(resolve)
        .catch(reject);
    }).on('error', reject).end();
  });
}

// Using different encoding
async function readJapaneseFile(path: string) {
  const fileStream = fs.createReadStream(path);
  return await streamToString(fileStream, 'shift-jis');
}
```

### `createThrottleStream()`
Creates a transform stream that limits the rate of data flow.

**Method Signature:**
```ts
function createThrottleStream(bytesPerSecond: number): Transform
```

**Parameters:**
- `bytesPerSecond` - Maximum bytes per second

**Returns:** 
- Transform stream that throttles data flow

**Example:**
```ts
import { createThrottleStream } from '@catbee/utils';
import fs from 'fs';

// Limit download speed to simulate slow connection for testing
function createSlowDownload(source: string, destination: string, kbps: number) {
  const bytesPerSecond = kbps * 1024; // Convert to bytes
  
  fs.createReadStream(source)
    .pipe(createThrottleStream(bytesPerSecond))
    .pipe(fs.createWriteStream(destination))
    .on('finish', () => console.log('Download completed'));
}

// Example: Download a file at 100KB/s
createSlowDownload('large-file.zip', 'slow-download.zip', 100);
```

### `createBatchStream()`
Creates a transform stream that batches data into chunks of specified size.

**Method Signature:**
```ts
function createBatchStream(size: number, options: { objectMode?: boolean } = {}): Transform
```

**Parameters:**
- `size` - Size of each batch (items for object mode, bytes for binary mode)
- `options` - Stream options
  - `objectMode` - Whether to operate in object mode (default: false)

**Returns:** 
- Transform stream that batches data

**Example:**
```ts
import { createBatchStream, createLineStream } from '@catbee/utils';
import fs from 'fs';

// Process a large log file in batches of 100 lines
fs.createReadStream('server.log')
  .pipe(createLineStream())
  .pipe(createBatchStream(100, { objectMode: true }))
  .on('data', (batch: string[]) => {
    console.log(`Processing batch of ${batch.length} lines`);
    
    // Count errors in this batch
    const errorCount = batch.filter(line => line.includes('ERROR')).length;
    console.log(`Found ${errorCount} errors in this batch`);
  })
  .on('end', () => console.log('Processing complete'));

// Binary mode example - process file in 1MB chunks
fs.createReadStream('large-image.jpg')
  .pipe(createBatchStream(1024 * 1024))
  .on('data', (chunk: Buffer) => {
    console.log(`Processing ${chunk.length} byte chunk`);
    // Process binary chunk...
  });
```

### `createLineStream()`
Creates a transform stream that splits text data by newlines.

**Method Signature:**
```ts
function createLineStream(options: {
  encoding?: BufferEncoding;
  includeNewlines?: boolean;
} = {}): Transform
```

**Parameters:**
- `options` - Options for the line stream
  - `encoding` - Character encoding (default: 'utf8')
  - `includeNewlines` - Whether to include newline characters in output (default: false)

**Returns:** 
- Transform stream that emits lines

**Example:**
```ts
import { createLineStream } from '@catbee/utils';
import fs from 'fs';

// Count lines in a file
async function countLines(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(createLineStream())
      .on('data', () => lineCount++)
      .on('error', reject)
      .on('end', () => resolve(lineCount));
  });
}

// Parse CSV file line by line
function parseCsvFile(filePath: string) {
  const headers: string[] = [];
  
  fs.createReadStream(filePath)
    .pipe(createLineStream())
    .on('data', (line: string) => {
      if (!headers.length) {
        // First line is headers
        headers.push(...line.split(','));
      } else {
        // Process data line
        const values = line.split(',');
        const record = headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {} as Record<string, string>);
        
        console.log('Record:', record);
      }
    });
}

// Keep original newlines (useful for preserving exact formatting)
fs.createReadStream('config.txt')
  .pipe(createLineStream({ includeNewlines: true }))
  .on('data', (line: string) => {
    // Process each line with original newline characters
    console.log(`Line length with newline: ${line.length}`);
  });
```

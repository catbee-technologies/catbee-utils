/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies. https://catbee-utils.npm.hprasath.com/license
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Readable, Transform, TransformCallback } from 'stream';
import { BufferEncoding } from './crypto.utils';

/**
 * Convert a buffer or string to a readable stream.
 *
 * @param data - Buffer or string to convert
 * @returns Readable stream containing the data
 *
 * @example
 * ```typescript
 * const stream = bufferToStream(Buffer.from('Hello world'));
 * // or
 * const stream = bufferToStream('Hello world');
 * ```
 */
export function bufferToStream(data: Buffer | string): Readable {
  const readable = new Readable();
  readable.push(data);
  readable.push(null); // End of stream
  return readable;
}

/**
 * Convert a readable stream to a buffer.
 *
 * @param stream - Readable stream to convert
 * @returns Promise resolving to a buffer containing all stream data
 *
 * @example
 * ```typescript
 * const buffer = await streamToBuffer(fs.createReadStream('file.txt'));
 * console.log(buffer.toString()); // Contents of file.txt
 * ```
 */
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Convert a readable stream to a string.
 *
 * @param stream - Readable stream to convert
 * @param encoding - Character encoding (default: 'utf8')
 * @returns Promise resolving to a string containing all stream data
 *
 * @example
 * ```typescript
 * const content = await streamToString(fs.createReadStream('file.txt'));
 * console.log(content); // Contents of file.txt as string
 * ```
 */
export async function streamToString(stream: Readable, encoding: BufferEncoding = 'utf8'): Promise<string> {
  const buffer = await streamToBuffer(stream);
  return buffer.toString(encoding);
}

/**
 * Create a transform stream that limits the rate of data flow.
 *
 * @param bytesPerSecond - Maximum bytes per second
 * @returns Transform stream that throttles data flow
 */
export function createThrottleStream(bytesPerSecond: number): Transform {
  let bytesSent = 0;
  let startTime = Date.now();

  return new Transform({
    transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const targetBytes = bytesPerSecond * elapsedSeconds;
      const chunkSize = chunk.length;

      // If we've sent fewer bytes than our target, just send the chunk
      if (bytesSent + chunkSize <= targetBytes) {
        bytesSent += chunkSize;
        callback(null, chunk);
        return;
      }

      // Otherwise we need to throttle
      const delay = ((bytesSent + chunkSize) / bytesPerSecond - elapsedSeconds) * 1000;

      setTimeout(() => {
        bytesSent += chunkSize;
        callback(null, chunk);
      }, delay);
    }
  });
}

/**
 * Create a transform stream that batches data into chunks of specified size.
 *
 * @param size - Size of each batch (items for object mode, bytes for binary mode)
 * @param options - Stream options
 * @returns Transform stream that batches data
 *
 * @example
 * ```typescript
 * // Batch lines from a file into arrays of 100 lines each
 * createReadStream('large-file.txt')
 *   .pipe(createLineStream())
 *   .pipe(createBatchStream(100))
 *   .on('data', batch => console.log(`Processing batch of ${batch.length} lines`));
 * ```
 */
export function createBatchStream(size: number, options: { objectMode?: boolean } = {}): Transform {
  const objectMode = options.objectMode !== false;
  let batch: any[] = [];
  let buffers: Buffer[] = [];
  let bufferSize = 0;

  return new Transform({
    objectMode,
    transform(chunk, _encoding, callback) {
      if (objectMode) {
        batch.push(chunk);
        if (batch.length >= size) {
          this.push(batch);
          batch = [];
        }
      } else {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        buffers.push(buffer);
        bufferSize += buffer.length;

        // Emit batches of exact size
        let combined = Buffer.concat(buffers, bufferSize);
        while (combined.length >= size) {
          this.push(combined.slice(0, size));
          combined = combined.slice(size);
        }
        buffers = combined.length > 0 ? [combined] : [];
        bufferSize = combined.length;
      }

      callback();
    },

    flush(callback) {
      if (objectMode && batch.length > 0) {
        this.push(batch);
      } else if (!objectMode && buffers.length > 0 && bufferSize > 0) {
        let combined = Buffer.concat(buffers, bufferSize);
        while (combined.length >= size) {
          this.push(combined.slice(0, size));
          combined = combined.slice(size);
        }
        if (combined.length > 0) {
          this.push(combined);
        }
      }
      callback();
    }
  });
}

/**
 * Create a transform stream that splits text data by newlines.
 *
 * @param options - Options for the line stream
 * @returns Transform stream that emits lines
 *
 * @example
 * ```typescript
 * // Process a file line by line
 * createReadStream('file.txt')
 *   .pipe(createLineStream())
 *   .on('data', line => console.log(`Line: ${line}`));
 * ```
 */
export function createLineStream(
  options: {
    encoding?: BufferEncoding;
    includeNewlines?: boolean;
  } = {}
): Transform {
  const { encoding = 'utf8', includeNewlines = false } = options;
  let buffer = '';

  return new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      const str = buffer + (Buffer.isBuffer(chunk) ? chunk.toString(encoding) : chunk);
      const lines = str.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        this.push(includeNewlines ? line + '\n' : line);
      }

      callback();
    },

    flush(callback) {
      if (buffer) {
        this.push(buffer);
      }
      callback();
    }
  });
}

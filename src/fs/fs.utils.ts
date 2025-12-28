import type { BufferEncoding } from '@catbee/utils/crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';

/**
 * Checks whether a file or directory exists at the given path.
 *
 * @param {string} path - The file or directory path to check.
 * @returns {Promise<boolean>} Resolves to `true` if the path exists, `false` otherwise.
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await fsp.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads and parses a JSON file from the specified path.
 *
 * @typeParam T - The expected type of the parsed JSON object.
 * @param {string} path - The path to the JSON file.
 * @returns {Promise<T | null>} The parsed object, or `null` if reading or parsing fails.
 */
export async function readJsonFile<T = any>(path: string): Promise<T | null> {
  try {
    const data = await fsp.readFile(path, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Read and parse JSON file or return a provided default value on error.
 *
 * @typeParam T
 * @param {string} path - Path to JSON file
 * @param {T} defaultValue - Default value to return when read/parse fails
 * @returns {Promise<T>} Parsed JSON or defaultValue
 */
export async function readJsonOrDefault<T = any>(path: string, defaultValue: T): Promise<T> {
  const res = await safeReadJsonFile<T>(path);
  return res.data === null ? defaultValue : res.data;
}

/**
 * Writes a JavaScript object to a file as formatted JSON.
 *
 * @param {string} path - The destination file path.
 * @param {any} data - The object to serialize and write.
 * @param {number} [space=2] - Number of spaces for JSON formatting.
 * @returns {Promise<void>} Resolves when writing is complete.
 */
export async function writeJsonFile(path: string, data: any, space = 2): Promise<void> {
  const json = JSON.stringify(data, null, space);
  await fsp.writeFile(path, json, 'utf-8');
}

/**
 * Deletes a file if it exists.
 *
 * @param {string} path - The file path to delete.
 * @returns {Promise<boolean>} Resolves to `true` if the file was deleted or didn't exist, `false` if deletion failed.
 */
export async function deleteFileIfExists(path: string): Promise<boolean> {
  try {
    await fsp.unlink(path);
    return true;
  } catch (err: any) {
    if (err.code === 'ENOENT') return true;
    return false;
  }
}

/**
 * Reads a file from the specified path.
 *
 * @param {string} path - The path to the file.
 * @param {BufferEncoding} [encoding="utf-8"] - The encoding to use.
 * @returns {Promise<string | null>} The file contents, or `null` if reading fails.
 */
export async function readFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  return await fsp.readFile(path, encoding);
}

/**
 * Reads a file from the specified path synchronously.
 *
 * @param {string} path - The path to the file.
 * @param {BufferEncoding} [encoding="utf-8"] - The encoding to use.
 * @returns {string | null} The file contents, or `null` if reading fails.
 */
export function readFileSync(path: string, encoding: BufferEncoding = 'utf-8'): string {
  return fs.readFileSync(path, encoding);
}

/**
 * Safely reads a file and returns its content along with any error encountered.
 *
 * @param {string} path - The path to the file.
 * @param {BufferEncoding} [encoding="utf-8"] - The encoding to use.
 * @returns {Promise<{ data: string | null; error: Error | null }>} Object with data and error properties.
 */
export async function safeReadFile(
  path: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const data = await fsp.readFile(path, encoding);
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: new Error(`Failed to read file ${path}: ${error.message}`) };
  }
}

/**
 * Safely reads a file synchronously and returns its content along with any error encountered.
 *
 * @param {string} path - The path to the file.
 * @param {BufferEncoding} [encoding="utf-8"] - The encoding to use.
 * @returns {{ data: string | null; error: Error | null }} Object with data and error properties.
 */
export function safeReadFileSync(
  path: string,
  encoding: BufferEncoding = 'utf-8'
): { data: string | null; error: Error | null } {
  try {
    const data = fs.readFileSync(path, encoding);
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: new Error(`Failed to read file ${path}: ${error.message}`) };
  }
}

/**
 * Writes content to a file.
 *
 * @param {string} path - The destination file path.
 * @param {string} content - The text content to write.
 * @param {BufferEncoding} [encoding="utf-8"] - The encoding to use.
 * @returns {Promise<boolean>} Resolves to `true` if successful, `false` otherwise.
 */
export async function writeFile(path: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<boolean> {
  try {
    await fsp.writeFile(path, content, encoding);
    return true;
  } catch {
    return false;
  }
}

/**
 * Appends text content to a file.
 *
 * @param {string} path - The file path to append to.
 * @param {string} content - The text content to append.
 * @param {BufferEncoding} [encoding="utf-8"] - The encoding to use.
 * @returns {Promise<boolean>} Resolves to `true` if successful, `false` otherwise.
 */
export async function appendFile(path: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<boolean> {
  try {
    await fsp.appendFile(path, content, encoding);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies a file from source to destination.
 *
 * @param {string} source - Source file path.
 * @param {string} destination - Destination file path.
 * @param {boolean} [overwrite=false] - Whether to overwrite if destination exists.
 * @returns {Promise<boolean>} Resolves to `true` if successful, `false` otherwise.
 */
export async function copyFile(source: string, destination: string, overwrite = false): Promise<boolean> {
  try {
    const flags = overwrite ? 0 : fsp.constants.COPYFILE_EXCL;
    await fsp.copyFile(source, destination, flags);
    return true;
  } catch {
    return false;
  }
}

/**
 * Renames/moves a file.
 *
 * @param {string} oldPath - Current file path.
 * @param {string} newPath - New file path.
 * @returns {Promise<boolean>} Resolves to `true` if successful, `false` otherwise.
 */
export async function moveFile(oldPath: string, newPath: string): Promise<boolean> {
  try {
    await fsp.rename(oldPath, newPath);
    return true;
  } catch {
    // If rename fails (e.g., across devices), try copy+delete
    try {
      await fsp.copyFile(oldPath, newPath);
      await fsp.unlink(oldPath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Gets file stats if the file exists.
 *
 * @param {string} path - Path to the file.
 * @returns {Promise<fsp.Stats | null>} File stats object or null if file doesn't exist.
 */
export async function getFileStats(path: string): Promise<fs.Stats | null> {
  try {
    return await fsp.stat(path);
  } catch {
    return null;
  }
}

/**
 * Creates a temporary file with optional content.
 *
 * @param {object} [options] - Options for creating the temp file.
 * @param {string} [options.prefix="tmp-"] - Filename prefix.
 * @param {string} [options.extension=""] - File extension.
 * @param {string} [options.dir] - Directory to create the file in (defaults to OS temp dir).
 * @param {string | Buffer} [options.content] - Optional content to write to the file.
 * @returns {Promise<string>} Path to the created temporary file.
 */
export async function createTempFile({
  prefix = 'tmp-',
  extension = '',
  dir = tmpdir(),
  content
}: {
  prefix?: string;
  extension?: string;
  dir?: string;
  content?: string | Buffer;
} = {}): Promise<string> {
  const ext = extension ? (extension.startsWith('.') ? extension : `.${extension}`) : '';
  const filename = `${prefix}${randomUUID()}${ext}`;
  const filepath = path.join(dir, filename);

  if (content) {
    await fsp.writeFile(filepath, content);
  } else {
    await fsp.writeFile(filepath, '');
  }

  return filepath;
}

/**
 * Streams a file from source to destination.
 * Useful for large files to avoid loading the entire file into memory.
 *
 * @param {string} source - Source file path.
 * @param {string} destination - Destination file path.
 * @returns {Promise<void>} Resolves when streaming completes.
 * @throws {Error} If streaming fails.
 */
export async function streamFile(source: string, destination: string): Promise<void> {
  const readStream = fs.createReadStream(source);
  const writeStream = fs.createWriteStream(destination);

  try {
    await pipeline(readStream, writeStream);
  } catch (error) {
    // Ensure both streams are closed in case of error
    readStream.destroy();
    writeStream.destroy();
    throw error;
  }
}

/**
 * Reads a directory and returns file names.
 *
 * @param {string} dirPath - Path to the directory.
 * @param {object} [options] - Options for reading the directory.
 * @param {boolean} [options.fullPaths=false] - Whether to return full paths.
 * @param {RegExp} [options.filter] - Optional regex to filter files.
 * @returns {Promise<string[]>} Array of file names or paths.
 * @throws {Error} If directory cannot be read.
 */
export async function readDirectory(
  dirPath: string,
  options: { fullPaths?: boolean; filter?: RegExp } = {}
): Promise<string[]> {
  const files = await fsp.readdir(dirPath);

  let result = files;

  if (options.filter) {
    result = result.filter(file => options.filter!.test(file));
  }

  if (options.fullPaths) {
    result = result.map(file => path.join(dirPath, file));
  }

  return result;
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param {string} dirPath - Path to the directory.
 * @param {boolean} [recursive=true] - Whether to create parent directories.
 * @returns {Promise<boolean>} Resolves to `true` if successful, `false` otherwise.
 */
export async function createDirectory(dirPath: string, recursive = true): Promise<boolean> {
  try {
    await fsp.mkdir(dirPath, { recursive });
    return true;
  } catch (err: any) {
    // Consider it success if directory already exists
    return err.code === 'EEXIST';
  }
}

/**
 * Safely reads and parses a JSON file with error details.
 *
 * @typeParam T - The expected type of the parsed JSON object.
 * @param {string} path - The path to the JSON file.
 * @returns {Promise<{ data: T | null; error: Error | null }>} Object with data and error properties.
 */
export async function safeReadJsonFile<T = any>(path: string): Promise<{ data: T | null; error: Error | null }> {
  try {
    const content = await fsp.readFile(path, 'utf-8');
    try {
      const data = JSON.parse(content) as T;
      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: new Error(`Invalid JSON in file ${path}: ${error.message}`)
      };
    }
  } catch (error: any) {
    return {
      data: null,
      error: new Error(`Failed to read file ${path}: ${error.message}`)
    };
  }
}

/**
 * Checks if a path points to a file (not a directory).
 *
 * @param {string} path - Path to check.
 * @returns {Promise<boolean>} True if the path is a file, false otherwise.
 */
export async function isFile(path: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Gets the size of a file in bytes.
 *
 * @param {string} path - Path to the file.
 * @returns {Promise<number>} Size in bytes or -1 if file doesn't exist.
 */
export async function getFileSize(path: string): Promise<number> {
  try {
    const stat = await fsp.stat(path);
    return stat.size;
  } catch {
    return -1;
  }
}

/**
 * Reads a file as a Buffer.
 *
 * @param {string} path - Path to the file.
 * @returns {Promise<Buffer | null>} File contents as Buffer or null if reading fails.
 */
export async function readFileBuffer(path: string): Promise<Buffer | null> {
  try {
    return await fsp.readFile(path);
  } catch {
    return null;
  }
}

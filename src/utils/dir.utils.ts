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

import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { randomBytes } from 'crypto';

/**
 * Ensures that a directory exists, creating parent directories if needed (like `mkdir -p`).
 *
 * @param {string} dirPath - The directory path to ensure.
 * @returns {Promise<void>} Resolves when the directory exists.
 * @throws {Error} If directory cannot be created.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fsp.mkdir(dirPath, { recursive: true });
}

/**
 * Recursively lists all files in a directory.
 *
 * @param {string} dirPath - The base directory.
 * @param {boolean} [recursive=false] - Whether to recurse into subdirectories.
 * @returns {Promise<string[]>} Array of absolute file paths.
 * @throws {Error} If the directory cannot be read.
 */
export async function listFiles(dirPath: string, recursive = false): Promise<string[]> {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isFile()) {
      files.push(fullPath);
    } else if (recursive && entry.isDirectory()) {
      const nestedFiles = await listFiles(fullPath, true);
      files.push(...nestedFiles);
    }
  }

  return files;
}

/**
 * Deletes a directory and all its contents recursively (like `rm -rf`).
 *
 * @param {string} dirPath - Directory to delete.
 * @returns {Promise<void>} Resolves when deletion is complete.
 * @throws {Error} If deletion fails.
 */
export async function deleteDirRecursive(dirPath: string): Promise<void> {
  await fsp.rm(dirPath, { recursive: true, force: true });
}

/**
 * Checks whether a given path is a directory.
 *
 * @param {string} pathStr - Path to check.
 * @returns {Promise<boolean>} True if the path is a directory, else false.
 */
export async function isDirectory(pathStr: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(pathStr);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Recursively copies a directory and all its contents to a destination.
 *
 * @param {string} src - Source directory path.
 * @param {string} dest - Destination directory path.
 * @returns {Promise<void>} Resolves when copy is complete.
 * @throws {Error} If source does not exist or copy fails.
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Moves a directory to a new location by copying and deleting the original.
 *
 * @param {string} src - Source directory path.
 * @param {string} dest - Destination directory path.
 * @returns {Promise<void>} Resolves when move is complete.
 * @throws {Error} If copy or deletion fails.
 */
export async function moveDir(src: string, dest: string): Promise<void> {
  await copyDir(src, dest);
  await deleteDirRecursive(src);
}

/**
 * Empties a directory by deleting all files and subdirectories inside it.
 *
 * @param {string} dirPath - Path to the directory to empty.
 * @returns {Promise<void>} Resolves when the directory has been emptied.
 * @throws {Error} If files or subdirectories cannot be removed.
 */
export async function emptyDir(dirPath: string): Promise<void> {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await fsp.rm(entryPath, { recursive: true, force: true });
    } else {
      await fsp.unlink(entryPath);
    }
  }
}

/**
 * Calculates the total size (in bytes) of all files in a directory (recursive).
 *
 * @param {string} dirPath - Path to the directory.
 * @returns {Promise<number>} Total size in bytes.
 * @throws {Error} If any file stats cannot be read.
 */
export async function getDirSize(dirPath: string): Promise<number> {
  let total = 0;
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += await getDirSize(entryPath);
    } else {
      const stat = await fsp.stat(entryPath);
      total += stat.size;
    }
  }

  return total;
}

/**
 * Watches a directory for file changes and calls a callback on each event.
 *
 * @param {string} dirPath - Directory path to watch.
 * @param {(eventType: "rename" | "change", filename: string | null) => void} callback - Callback for each change event.
 * @returns {() => void} A function to stop watching the directory.
 */
export function watchDir(
  dirPath: string,
  callback: (eventType: 'rename' | 'change', filename: string | null) => void
): () => void {
  const watcher = fs.watch(dirPath, (eventType, filename) => {
    callback(eventType, filename);
  });

  return () => watcher.close();
}

/**
 * Finds files matching a glob pattern.
 *
 * @param {string} pattern - Glob pattern to match files.
 * @param {object} [options] - Options for glob pattern matching.
 * @param {string} [options.cwd] - Current working directory for relative patterns.
 * @param {boolean} [options.dot=false] - Include dotfiles in matches.
 * @param {boolean} [options.nodir=true] - Only match files, not directories.
 * @returns {Promise<string[]>} Array of matched file paths.
 * @throws {Error} If pattern matching fails.
 */
export async function findFilesByPattern(
  pattern: string,
  options: { cwd?: string; dot?: boolean; nodir?: boolean } = {}
): Promise<string[]> {
  const defaultOptions = { nodir: true, ...options };
  return glob(pattern, defaultOptions);
}

/**
 * Gets all subdirectories in a directory.
 *
 * @param {string} dirPath - The directory to search in.
 * @param {boolean} [recursive=false] - Whether to include subdirectories recursively.
 * @returns {Promise<string[]>} Array of absolute subdirectory paths.
 * @throws {Error} If directory cannot be read.
 */
export async function getSubdirectories(dirPath: string, recursive = false): Promise<string[]> {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const dirs = entries.filter(entry => entry.isDirectory()).map(entry => path.join(dirPath, entry.name));

  if (recursive && dirs.length > 0) {
    const nestedDirs = await Promise.all(dirs.map(dir => getSubdirectories(dir, true)));
    return [...dirs, ...nestedDirs.flat()];
  }

  return dirs;
}

/**
 * Ensures a directory exists and is empty.
 *
 * @param {string} dirPath - Path to the directory.
 * @returns {Promise<void>} Resolves when the directory exists and is empty.
 * @throws {Error} If directory cannot be created or emptied.
 */
export async function ensureEmptyDir(dirPath: string): Promise<void> {
  if (await isDirectory(dirPath)) {
    await emptyDir(dirPath);
  } else {
    try {
      await fsp.unlink(dirPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    await ensureDir(dirPath);
  }
}

/**
 * Creates a temporary directory with optional auto-cleanup.
 *
 * @param {object} [options] - Options for the temporary directory.
 * @param {string} [options.prefix='tmp-'] - Prefix for the directory name.
 * @param {string} [options.parentDir=os.tmpdir()] - Parent directory.
 * @param {boolean} [options.cleanup=false] - Whether to register cleanup on process exit.
 * @returns {Promise<{ path: string, cleanup: () => Promise<void> }>} Object with directory path and cleanup function.
 * @throws {Error} If directory cannot be created.
 */
export async function createTempDir(
  options: { prefix?: string; parentDir?: string; cleanup?: boolean } = {}
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const prefix = options.prefix || 'tmp-';
  const parentDir = options.parentDir || os.tmpdir();
  const dirName = `${prefix}${randomBytes(6).toString('hex')}`;
  const tempDirPath = path.join(parentDir, dirName);

  await ensureDir(tempDirPath);

  const cleanup = async () => {
    try {
      await deleteDirRecursive(tempDirPath);
    } catch {
      // Ignore cleanup errors
    }
  };

  if (options.cleanup) {
    process.once('exit', () => {
      try {
        fs.rmSync(tempDirPath, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors on exit
      }
    });

    // Handle signals for better cleanup
    ['SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'].forEach(signal => {
      process.once(signal as NodeJS.Signals, () => {
        cleanup().then(() => process.exit());
      });
    });
  }

  return { path: tempDirPath, cleanup };
}

/**
 * Finds the newest file in a directory.
 *
 * @param {string} dirPath - Directory to search.
 * @param {boolean} [recursive=false] - Whether to search subdirectories.
 * @returns {Promise<string | null>} Path to the newest file or null if no files.
 * @throws {Error} If directory cannot be read.
 */
export async function findNewestFile(dirPath: string, recursive = false): Promise<string | null> {
  const files = await listFiles(dirPath, recursive);
  if (files.length === 0) return null;

  const stats = await Promise.all(
    files.map(async file => ({
      path: file,
      mtime: (await fsp.stat(file)).mtime
    }))
  );

  return stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].path;
}

/**
 * Finds the oldest file in a directory.
 *
 * @param {string} dirPath - Directory to search.
 * @param {boolean} [recursive=false] - Whether to search subdirectories.
 * @returns {Promise<string | null>} Path to the oldest file or null if no files.
 * @throws {Error} If directory cannot be read.
 */
export async function findOldestFile(dirPath: string, recursive = false): Promise<string | null> {
  const files = await listFiles(dirPath, recursive);
  if (files.length === 0) return null;

  const stats = await Promise.all(
    files.map(async file => ({
      path: file,
      mtime: (await fsp.stat(file)).mtime
    }))
  );

  return stats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime())[0].path;
}

/**
 * Finds files or directories in a directory matching a predicate function.
 *
 * @param {string} dirPath - Directory to search.
 * @param {(path: string, stat: fs.Stats) => boolean | Promise<boolean>} predicate - Function to test each path.
 * @param {boolean} [recursive=false] - Whether to search subdirectories.
 * @returns {Promise<string[]>} Array of matching paths.
 * @throws {Error} If directory cannot be read.
 */
export async function findInDir(
  dirPath: string,
  predicate: (path: string, stat: fs.Stats) => boolean | Promise<boolean>,
  recursive = false
): Promise<string[]> {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    const stat = await fsp.stat(entryPath);

    if (await predicate(entryPath, stat)) {
      results.push(entryPath);
    }

    if (recursive && entry.isDirectory()) {
      const nestedResults = await findInDir(entryPath, predicate, true);
      results.push(...nestedResults);
    }
  }

  return results;
}

/**
 * Watches a directory recursively for file changes.
 *
 * @param {string} dirPath - Base directory path to watch.
 * @param {(eventType: "rename" | "change", filename: string) => void} callback - Callback for each change event.
 * @param {boolean} [includeSubdirs=true] - Whether to watch subdirectories.
 * @returns {Promise<() => void>} A function to stop watching the directory.
 * @throws {Error} If directory cannot be watched.
 */
export async function watchDirRecursive(
  dirPath: string,
  callback: (eventType: 'rename' | 'change', filename: string) => void,
  includeSubdirs = true
): Promise<() => void> {
  // Normalize the path to ensure consistent path separators
  const normalizedBasePath = path.normalize(dirPath);

  // Create watchers for the base dir and all subdirectories
  const watchers: fs.FSWatcher[] = [];

  // Helper function to add a watcher for a directory
  const addWatcher = (dir: string) => {
    try {
      const watcher = fs.watch(dir, (eventType, filename) => {
        if (!filename) return;

        const fullPath = path.join(dir, filename);
        // Make the path relative to the base directory
        const relativePath = path.relative(normalizedBasePath, fullPath);
        callback(eventType, relativePath);

        // If a new directory is created, we should watch it
        if (eventType === 'rename' && includeSubdirs) {
          setTimeout(async () => {
            try {
              if (await isDirectory(fullPath)) {
                addWatcher(fullPath);
              }
            } catch {
              // Ignore errors checking newly created items
            }
          }, 100);
        }
      });
      watchers.push(watcher);
    } catch {
      // Silently ignore directories we can't watch
    }
  };

  // Add watcher for the base directory
  addWatcher(normalizedBasePath);

  // If watching subdirectories, add watchers for all existing subdirectories
  if (includeSubdirs) {
    const subdirs = await getSubdirectories(normalizedBasePath, true);
    for (const subdir of subdirs) {
      addWatcher(subdir);
    }
  }

  // Return a function to close all watchers
  return () => {
    watchers.forEach(watcher => watcher.close());
  };
}

/**
 * Gets detailed directory statistics including file count, directory count, and size.
 *
 * @param {string} dirPath - Path to the directory.
 * @returns {Promise<{ fileCount: number, dirCount: number, totalSize: number }>} Directory statistics.
 * @throws {Error} If directory cannot be read.
 */
export async function getDirStats(
  dirPath: string
): Promise<{ fileCount: number; dirCount: number; totalSize: number }> {
  let fileCount = 0;
  let dirCount = 0;
  let totalSize = 0;

  async function processDir(currentPath: string): Promise<void> {
    const entries = await fsp.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        dirCount++;
        await processDir(entryPath);
      } else if (entry.isFile()) {
        fileCount++;
        const stat = await fsp.stat(entryPath);
        totalSize += stat.size;
      }
    }
  }

  await processDir(dirPath);

  return { fileCount, dirCount, totalSize };
}

/**
 * Walks through a directory hierarchy, calling a visitor function for each entry.
 *
 * @param {string} dirPath - Starting directory path.
 * @param {object} options - Options for walking the directory.
 * @param {(entry: { path: string, name: string, isDirectory: boolean, stats: fs.Stats }) => boolean | void | Promise<boolean | void>} options.visitorFn -
 *   Function called for each file/directory. Return false to skip a directory.
 * @param {'pre' | 'post'} [options.traversalOrder='pre'] - Whether to visit directories before or after their contents.
 * @throws {Error} If directory cannot be read.
 */
export async function walkDir(
  dirPath: string,
  options: {
    visitorFn: (entry: {
      path: string;
      name: string;
      isDirectory: boolean;
      stats: fs.Stats;
    }) => boolean | void | Promise<boolean | void>;
    traversalOrder?: 'pre' | 'post';
  }
): Promise<void> {
  const traversalOrder = options.traversalOrder || 'pre';
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    const stats = await fsp.stat(entryPath);
    const entryInfo = {
      path: entryPath,
      name: entry.name,
      isDirectory: entry.isDirectory(),
      stats
    };

    if (entry.isDirectory()) {
      // Pre-order: visit directory before its contents
      if (traversalOrder === 'pre') {
        const shouldContinue = await options.visitorFn(entryInfo);
        // If the visitor returns false, don't recurse into this directory
        if (shouldContinue !== false) {
          await walkDir(entryPath, options);
        }
      } else {
        // Post-order: visit directory after its contents
        await walkDir(entryPath, options);
        await options.visitorFn(entryInfo);
      }
    } else {
      // Files are always visited when encountered
      await options.visitorFn(entryInfo);
    }
  }

  if (traversalOrder === 'post') {
    // Only visit the root if this is the top-level call (not for subdirectories)
    // But since this function is always called recursively, always visit after children
    const stats = await fsp.stat(dirPath);
    const entryInfo = {
      path: dirPath,
      name: path.basename(dirPath),
      isDirectory: true,
      stats
    };
    await options.visitorFn(entryInfo);
  }
}

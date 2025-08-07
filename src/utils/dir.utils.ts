import fs from "fs";
import fsp from "fs/promises";
import path from "path";

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
export async function listFiles(
  dirPath: string,
  recursive = false,
): Promise<string[]> {
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
  callback: (eventType: "rename" | "change", filename: string | null) => void,
): () => void {
  const watcher = fs.watch(dirPath, (eventType, filename) => {
    callback(eventType, filename);
  });

  return () => watcher.close();
}

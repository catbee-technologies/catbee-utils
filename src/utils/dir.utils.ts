import fs from "fs";
import fsp from "fs/promises";
import path from "path";

/**
 * Ensures that a directory exists. Creates parent directories if needed.
 *
 * @param dirPath - The directory path to ensure.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fsp.mkdir(dirPath, { recursive: true });
}

/**
 * Recursively lists all files in a directory.
 *
 * @param dirPath - The base directory.
 * @param recursive - Whether to recurse into subdirectories (default: false).
 * @returns Array of absolute file paths.
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
 * Deletes a directory and all its contents recursively.
 *
 * @param dirPath - Directory to delete.
 */
export async function deleteDirRecursive(dirPath: string): Promise<void> {
  await fsp.rm(dirPath, { recursive: true, force: true });
}

/**
 * Checks whether a given path is a directory.
 *
 * @param pathStr - Path to check.
 * @returns True if the path is a directory.
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
 * @param src - Source directory path.
 * @param dest - Destination directory path.
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
 * @param src - Source directory path.
 * @param dest - Destination directory path.
 */
export async function moveDir(src: string, dest: string): Promise<void> {
  await copyDir(src, dest);
  await deleteDirRecursive(src);
}

/**
 * Empties a directory by deleting all files and subdirectories.
 *
 * @param dirPath - Path to the directory to empty.
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
 * Calculates the total size (in bytes) of all files in a directory.
 *
 * @param dirPath - Path to the directory.
 * @returns Total size in bytes.
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
 * Watches a directory for changes and calls a callback on each event.
 *
 * @param dirPath - Directory path to watch.
 * @param callback - Function to call on each change event.
 * @returns A function to stop watching.
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

import fs from "fs/promises";

/**
 * Checks whether a file or directory exists at the given path.
 *
 * @param {string} path - The file or directory path to check.
 * @returns {Promise<boolean>} Resolves to `true` if the path exists, `false` otherwise.
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
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
    const data = await fs.readFile(path, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Writes a JavaScript object to a file as formatted JSON.
 *
 * @param {string} path - The destination file path.
 * @param {any} data - The object to serialize and write.
 * @param {number} [space=2] - Number of spaces for JSON formatting.
 * @returns {Promise<void>} Resolves when writing is complete.
 */
export async function writeJsonFile(
  path: string,
  data: any,
  space = 2,
): Promise<void> {
  const json = JSON.stringify(data, null, space);
  await fs.writeFile(path, json, "utf-8");
}

/**
 * Deletes a file if it exists.
 *
 * @param {string} path - The file path to delete.
 * @returns {Promise<boolean>} Resolves to `true` if the file was deleted or didn't exist, `false` if deletion failed.
 */
export async function deleteFileIfExists(path: string): Promise<boolean> {
  try {
    await fs.unlink(path);
    return true;
  } catch (err: any) {
    if (err.code === "ENOENT") return true;
    return false;
  }
}

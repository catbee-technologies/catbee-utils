import fs from "fs/promises";

/**
 * Checks whether a file or directory exists at the given path.
 *
 * @param path - The file or directory path to check.
 * @returns A promise that resolves to `true` if the path exists, `false` otherwise.
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
 * @param path - The path to the JSON file.
 * @returns A promise that resolves to the parsed object or `null` if reading or parsing fails.
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
 * @param path - The destination file path.
 * @param data - The object to serialize and write.
 * @param space - Number of spaces for JSON formatting (default is 2).
 * @returns A promise that resolves when writing is complete.
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
 * @param path - The file path to delete.
 * @returns A promise that resolves to `true` if the file was deleted or didn't exist, `false` if deletion failed.
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

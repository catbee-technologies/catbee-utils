/**
 * Capitalizes the first character of a string.
 *
 * @param str - The input string.
 * @returns The string with the first character in uppercase.
 */
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Converts a string to kebab-case.
 *
 * @param str - The input string.
 * @returns The kebab-cased string.
 */
export const toKebabCase = (str: string): string =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();

/**
 * Converts a kebab-case or snake_case string to camelCase.
 *
 * @param str - The input string.
 * @returns The camelCased string.
 */
export const toCamelCase = (str: string): string =>
  str.replace(/[-_](.)/g, (_, c: string) => c.toUpperCase());

/**
 * Converts a string to a URL-friendly slug.
 *
 * @param str - The input string.
 * @returns The slugified string.
 */
export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/**
 * Truncates a string to a specific length, appending '...' if truncated.
 *
 * @param str - The input string.
 * @param len - The maximum length.
 * @returns The truncated string.
 */
export const truncate = (str: string, len: number): string =>
  str.length > len ? str.slice(0, len) + "..." : str;

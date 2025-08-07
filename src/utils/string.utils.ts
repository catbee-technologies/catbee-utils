/**
 * Capitalizes the first character of a string.
 *
 * @param {string} str - The input string.
 * @returns {string} The string with the first character in uppercase.
 */
export const capitalize = (str: string): string =>
  str.length === 0 ? "" : str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Converts a string to kebab-case (e.g., "FooBar test" → "foo-bar-test").
 *
 * @param {string} str - The input string.
 * @returns {string} The kebab-cased string.
 */
export const toKebabCase = (str: string): string =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase -> camel-Case
    .replace(/\s+/g, "-") // spaces to dash
    .replace(/_+/g, "-") // underscores to dash
    .toLowerCase();

/**
 * Converts a kebab-case or snake_case string to camelCase.
 *
 * @param {string} str - The input string.
 * @returns {string} The camelCased string.
 */
export const toCamelCase = (str: string): string =>
  str.replace(/[-_](.)/g, (_, c: string) => c.toUpperCase());

/**
 * Converts a string to a URL-friendly slug (lowercase, dashes, alphanumeric).
 *
 * @param {string} str - The input string.
 * @returns {string} The slugified string.
 */
export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove non-word
    .replace(/\s+/g, "-") // spaces to dash
    .replace(/-+/g, "-") // multiple dashes to one
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes

/**
 * Truncates a string to a specific length, appending '...' if truncated.
 *
 * @param {string} str - The input string.
 * @param {number} len - The maximum length.
 * @returns {string} The truncated string.
 */
export const truncate = (str: string, len: number): string =>
  str.length > len ? str.slice(0, len) + "..." : str;

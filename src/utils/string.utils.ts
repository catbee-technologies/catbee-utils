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

/**
 * Capitalizes the first character of a string.
 *
 * @param {string} str - The input string.
 * @returns {string} The string with the first character in uppercase.
 */
export function capitalize(str: string): string {
  return str.length === 0 ? '' : str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to kebab-case (e.g., "FooBar test" → "foo-bar-test").
 *
 * @param {string} str - The input string.
 * @returns {string} The kebab-cased string.
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase -> camel-Case
    .replace(/\s+/g, '-') // spaces to dash
    .replace(/_+/g, '-') // underscores to dash
    .toLowerCase();
}

/**
 * Converts a kebab-case or snake_case string to camelCase.
 *
 * @param {string} str - The input string.
 * @returns {string} The camelCased string.
 */
export function toCamelCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, c: string) => c.toUpperCase());
}

/**
 * Converts a string to a URL-friendly slug (lowercase, dashes, alphanumeric).
 *
 * @param {string} str - The input string.
 * @returns {string} The slugified string.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-word
    .replace(/\s+/g, '-') // spaces to dash
    .replace(/-+/g, '-') // multiple dashes to one
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}

/**
 * Truncates a string to a specific length, appending '...' if truncated.
 *
 * @param {string} str - The input string.
 * @param {number} len - The maximum length.
 * @returns {string} The truncated string.
 */
export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/**
 * Converts a string to PascalCase (e.g., "foo-bar" → "FooBar").
 *
 * @param {string} str - The input string.
 * @returns {string} The PascalCased string.
 */
export function toPascalCase(str: string): string {
  return capitalize(toCamelCase(str));
}

/**
 * Converts a string to snake_case (e.g., "FooBar test" → "foo_bar_test").
 *
 * @param {string} str - The input string.
 * @returns {string} The snake_cased string.
 */
export function toSnakeCase(str: string): string {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase -> camel_Case
    .replace(/\s+/g, '_') // spaces to underscore
    .replace(/-+/g, '_') // dashes to underscore
    .toLowerCase();
}

/**
 * Masks a string by replacing characters with a mask character.
 * Useful for hiding sensitive information like credit cards or passwords.
 *
 * @param {string} str - The string to mask.
 * @param {number} [visibleStart=0] - Number of characters to show at start.
 * @param {number} [visibleEnd=0] - Number of characters to show at end.
 * @param {string} [maskChar="*"] - Character to use for masking.
 * @returns {string} The masked string.
 */
export function mask(str: string, visibleStart: number = 0, visibleEnd: number = 0, maskChar: string = '*'): string {
  if (!str || str.length === 0) return '';
  if (visibleStart >= str.length) return str;

  const start = str.slice(0, visibleStart);
  const end = visibleEnd > 0 ? str.slice(-visibleEnd) : '';
  const masked = maskChar.repeat(Math.max(0, str.length - visibleStart - visibleEnd));

  return start + masked + end;
}

/**
 * Removes all HTML tags from a string.
 *
 * @param {string} str - The HTML string to process.
 * @returns {string} The string with HTML tags removed.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Performs case-insensitive string comparison.
 *
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {boolean} True if the strings are equal ignoring case.
 */
export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Reverses a string.
 *
 * @param {string} str - The string to reverse.
 * @returns {string} The reversed string.
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * Counts occurrences of a substring within a string.
 *
 * @param {string} str - The source string.
 * @param {string} substring - The substring to count.
 * @param {boolean} [caseSensitive=true] - Whether to perform case-sensitive counting.
 * @returns {number} Number of occurrences.
 */
export function countOccurrences(str: string, substring: string, caseSensitive: boolean = true): number {
  if (!caseSensitive) {
    str = str.toLowerCase();
    substring = substring.toLowerCase();
  }

  return str.split(substring).length - 1;
}

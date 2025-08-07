/**
 * Collection of common validation helpers for strings, numbers, email, UUID, etc.
 */

/**
 * Checks if a string is a valid email address.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid email, else false.
 */
export function isEmail(str: string): boolean {
  // RFC 5322 official standard is more complex—this is practical.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/**
 * Checks if a string is a valid UUID (versions 1-5).
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid UUID, else false.
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str,
  );
}

/**
 * Checks if a string is a valid URL.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid URL, else false.
 */
export function isURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a string is a valid international phone number (E.164 or common patterns).
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if looks like a phone number.
 */
export function isPhone(str: string): boolean {
  // E.164 or basic with spaces, dashes, parentheses
  return /^(\+?[1-9]\d{1,14}|(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?([-\s]?\d{3,4}){2,})$/.test(
    str,
  );
}

/**
 * Checks if a string is strictly alphanumeric (letters/numbers only).
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if alphanumeric.
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-z0-9]+$/i.test(str);
}

/**
 * Checks if a string or number can be safely parsed to a number.
 *
 * @param {string | number} value - The value to check.
 * @returns {boolean} True if the value is numeric.
 */
export function isNumeric(value: string | number): boolean {
  if (typeof value === "number") return !isNaN(value) && isFinite(value);
  return (
    typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))
  );
}

/**
 * Checks if a string is a valid hex color code (e.g. #FFF or #FFFFFF).
 *
 * @param {string} str - Input string.
 * @returns {boolean}
 */
export function isHexColor(str: string): boolean {
  return /^#([a-f0-9]{6}|[a-f0-9]{3})$/i.test(str);
}

/**
 * Checks if a string is a valid ISO8601 date string.
 *
 * @param {string} str - Input string.
 * @returns {boolean}
 */
export function isISODate(str: string): boolean {
  // YYYY-MM-DD, extended, or with time portion
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[\+|-]\d{2}:\d{2})?)?$/.test(
    str,
  );
}

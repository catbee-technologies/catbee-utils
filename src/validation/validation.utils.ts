import net from 'node:net';

const PORT_REGEX = /^[0-9]{1,5}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_ALLOWED_CHARS_REGEX = /^[+]?[0-9\s().-]+$/;
const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
const HEX_COLOR_REGEX = /^#([a-f0-9]{6}|[a-f0-9]{3})$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const DOT_ATOM_REGEX = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const QUOTED_LOCAL_REGEX = /^"([\s\x21\x23-\x5B\x5D-\x7E]|\\[\x20-\x7E])*"$/;
const TLD_REGEX = /^[A-Za-z]{2,63}$/;

/**
 * Collection of common validation helpers for strings, numbers, email, UUID, etc.
 */

/**
 * Checks if a string is a valid port number.
 *
 * @param str - The input string or number.
 * @returns True if valid port number, else false.
 */
export function isPort(value: string | number): boolean {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0 && value <= 65535;
  if (!value || typeof value !== 'string') return false;

  const str = value.trim();
  if (!PORT_REGEX.test(str)) return false;

  const port = Number(str);
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

/**
 * Checks if a string is a valid email address.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid email, else false.
 */
export function isEmail(str: string): boolean {
  if (!str || typeof str !== 'string' || str.length > 254) return false;

  const atIndex = str.indexOf('@');
  if (atIndex === -1 || atIndex !== str.lastIndexOf('@')) return false;

  const local = str.slice(0, atIndex);
  const domain = str.slice(atIndex + 1);

  if (!local || !domain) return false;

  if (!DOT_ATOM_REGEX.test(local) && !QUOTED_LOCAL_REGEX.test(local)) return false;

  if (domain.includes('..')) return false;

  const labels = domain.split('.');
  if (labels.some(l => !l.length)) return false;

  if (labels.length < 2) return false;

  const labelRegex = /^[A-Za-z0-9-]{1,63}$/;

  for (const label of labels) {
    if (!labelRegex.test(label)) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
  }

  const tld = labels[labels.length - 1];
  if (!TLD_REGEX.test(tld)) return false;

  return true;
}

/**
 * Checks if a string is a valid UUID (versions 1-5).
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid UUID, else false.
 */
export function isUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

/**
 * Checks if a string is a valid URL.
 *
 * @param {string} str - The input string.
 * @param {string[]} [allowedProtocols=['http', 'https', 'ws', 'wss']] - Allowed URL protocols.
 * @returns {boolean} True if valid URL, else false.
 */
export function isURL(str: string, allowedProtocols: string[] = ['http', 'https', 'ws', 'wss']): boolean {
  if (!str || typeof str !== 'string') return false;
  try {
    const url = new URL(str);
    return allowedProtocols.includes(url.protocol.replace(':', ''));
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
  if (!str || typeof str !== 'string') return false;
  const digits = str.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) return false;
  return PHONE_ALLOWED_CHARS_REGEX.test(str);
}

/**
 * Checks if a string is strictly alphanumeric (letters/numbers only).
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if alphanumeric.
 */
export function isAlphanumeric(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return ALPHANUMERIC_REGEX.test(str);
}

/**
 * Checks if a string or number can be safely parsed to a number.
 *
 * @param {string | number} value - The value to check.
 * @returns {boolean} True if the value is numeric.
 */
export function isNumeric(value: string | number): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (!value || typeof value !== 'string') return false;

  const str = value.trim();
  if (str === '' || str.length > 16) return false;
  const num = Number(str);
  return Number.isFinite(num);
}

/**
 * Checks if a string is a valid hex color code (e.g. #FFF or #FFFFFF).
 *
 * @param {string} str - Input string.
 * @returns {boolean}
 */
export function isHexColor(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return HEX_COLOR_REGEX.test(str);
}

/**
 * Checks if a string is a valid date string.
 *
 * @param {string} str - Input string.
 * @returns {boolean}
 */
export function isISODate(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  if (!ISO_DATE_REGEX.test(str)) return false;
  const date = new Date(str);
  return !Number.isNaN(date.getTime());
}

/**
 * Checks if a string matches a specified length range.
 *
 * @param {string} str - The input string.
 * @param {number} min - Minimum length (inclusive).
 * @param {number} max - Maximum length (inclusive).
 * @returns {boolean} True if string length is within range.
 */
export function isLengthBetween(str: string, min: number, max: number): boolean {
  if (typeof str !== 'string') return false;
  return str.length >= min && str.length <= max;
}

/**
 * Validates that a number is between specified min and max values (inclusive).
 *
 * @param {number} value - The number to validate.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {boolean} True if number is within range.
 */
export function isNumberBetween(value: number, min: number, max: number): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  return value >= min && value <= max;
}

/**
 * Checks if a string contains only alphabetic characters.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if alphabetic only.
 */
export function isAlpha(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Validates that a string contains at least one uppercase letter,
 * one lowercase letter, one number, and one special character.
 *
 * - Minimum length of 8 characters.
 * - At least one uppercase letter (A-Z).
 * - At least one lowercase letter (a-z).
 * - At least one digit (0-9).
 * - At least one special character e.g. !@#$%^&*()_+-=[]{};':"\\|,.<>?/
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if string meets password complexity requirements.
 */
export function isStrongPassword(str: string): boolean {
  if (str.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(str);
  const hasLowerCase = /[a-z]/.test(str);
  const hasNumbers = /[0-9]/.test(str);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(str);
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

/**
 * Checks if a string is a valid IPv4 address.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid IPv4 address.
 */
export function isIPv4(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const parts = str.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    if (p.length > 3 || (p.startsWith('0') && p.length > 1)) return false;
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

/**
 * Checks if a string is a valid IPv6 address.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid IPv6 address.
 */
export function isIPv6(str: string): boolean {
  if (!str || typeof str !== 'string' || str.length > 45) return false;
  try {
    return net.isIP(str) === 6;
  } catch {
    return false;
  }
}

/**
 * Validates a credit card number using the Luhn algorithm.
 *
 * @param {string} str - The credit card number string.
 * @returns {boolean} True if valid credit card number.
 */
export function isCreditCard(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const s = str.replace(/\D/g, '');
  if (s.length < 13 || s.length > 19) return false;

  let sum = 0;
  for (let i = 0, dbl = false; i < s.length; i++, dbl = !dbl) {
    let d = s.charCodeAt(s.length - 1 - i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Checks if a string is a valid JSON.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid JSON.
 */
export function isValidJSON(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard that checks if a value is an array.
 *
 * @template T Optional expected element type
 * @param {unknown} value - The value to check.
 * @param {(item: unknown) => boolean} [itemGuard] - Optional function to validate each item.
 * @returns {boolean} True if value is an array (with optional item validation).
 */
export function isArray<T = unknown>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  return !itemGuard || value.every(item => itemGuard(item));
}

/**
 * Checks if a string is a valid base64 encoded string.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid base64.
 */
export function isBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return BASE64_REGEX.test(str);
}

/**
 * Validates that an object has all required properties.
 *
 * @param {object} obj - The object to validate.
 * @param {string[]} requiredProps - Array of required property names.
 * @returns {boolean} True if all required properties exist.
 */
export function hasRequiredProps(obj: Record<string, unknown>, requiredProps: string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return requiredProps.every(prop => Object.prototype.hasOwnProperty.call(obj, prop) && obj[prop] != null);
}

/**
 * Validates a date is within a specified range.
 *
 * @param {Date} date - The date to validate.
 * @param {Date} [minDate] - Optional minimum date (inclusive).
 * @param {Date} [maxDate] - Optional maximum date (inclusive).
 * @returns {boolean} True if date is within range.
 */
export function isDateInRange(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return false;

  if (minDate && date < minDate) return false;
  if (maxDate && date > maxDate) return false;

  return true;
}

/**
 * Validates a string matches a specific regular expression pattern.
 *
 * @param {string} str - The input string.
 * @param {RegExp} pattern - Regular expression to test against.
 * @returns {boolean} True if string matches pattern.
 */
export function matchesPattern(str: string, pattern: RegExp): boolean {
  if (typeof str !== 'string') return false;
  return pattern.test(str);
}

/**
 * Validates data against multiple constraints.
 *
 * @param {unknown} value - The value to validate.
 * @param {Array<(value: unknown) => boolean>} validators - Array of validation functions.
 * @returns {boolean} True if value passes all validations.
 */
export function validateAll(value: unknown, validators: Array<(value: unknown) => boolean>): boolean {
  if (!Array.isArray(validators)) return false;
  return validators.every(fn => {
    try {
      return fn(value);
    } catch {
      return false;
    }
  });
}

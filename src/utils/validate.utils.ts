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
  const port = typeof value === 'string' ? Number(value.trim()) : value;
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

/**
 * Checks if a string is a valid email address.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid email, else false.
 */
export function isEmail(str: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return false;

  // Additional checks
  const [local, domain] = str.split('@');
  if (!local || !domain) return false;

  // Disallow consecutive dots in local or domain part
  if (local.includes('..') || domain.includes('..')) return false;

  return true;
}

/**
 * Checks if a string is a valid UUID (versions 1-5).
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid UUID, else false.
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
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
  if (typeof str !== 'string') return false;

  // Strip non-digit characters to count total digits
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length < 6 || digitsOnly.length > 15) return false;

  // Accept typical phone characters: +, digits, space, -, (, )
  return /^[+]?[\d\s().-]+$/.test(str);
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
  if (typeof value === 'string' && value.trim() === '') return false;
  const num = typeof value === 'number' ? value : Number(value);
  return typeof num === 'number' && isFinite(num);
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
 * Checks if a string is a valid date string.
 *
 * @param {string} str - Input string.
 * @returns {boolean}
 */
export function isISODate(str: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

  if (!isoRegex.test(str)) return false;

  const date = new Date(str);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(str.slice(0, 10));
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
  return value >= min && value <= max;
}

/**
 * Checks if a string contains only alphabetic characters.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if alphabetic only.
 */
export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Validates that a string contains at least one uppercase letter,
 * one lowercase letter, one number, and one special character.
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
  const parts = str.split('.');
  if (parts.length !== 4) return false;

  return parts.every(part => {
    const num = parseInt(part, 10);
    return part === num.toString() && num >= 0 && num <= 255;
  });
}

/**
 * Checks if a string is a valid IPv6 address.
 *
 * @param {string} str - The input string.
 * @returns {boolean} True if valid IPv6 address.
 */
export function isIPv6(str: string): boolean {
  // Simple but effective check for common IPv6 formats
  return /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/.test(
    str
  );
}

/**
 * Validates a credit card number using the Luhn algorithm.
 *
 * @param {string} str - The credit card number string.
 * @returns {boolean} True if valid credit card number.
 */
export function isCreditCard(str: string): boolean {
  // Remove non-digit characters
  const cardNumber = str.replace(/\D/g, '');
  if (cardNumber.length < 13 || cardNumber.length > 19) return false;

  // Luhn algorithm implementation
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
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
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str);
}

/**
 * Validates that an object has all required properties.
 *
 * @param {object} obj - The object to validate.
 * @param {string[]} requiredProps - Array of required property names.
 * @returns {boolean} True if all required properties exist.
 */
export function hasRequiredProps(obj: Record<string, unknown>, requiredProps: string[]): boolean {
  return requiredProps.every(
    prop => Object.prototype.hasOwnProperty.call(obj, prop) && obj[prop] !== undefined && obj[prop] !== null
  );
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
  if (!(date instanceof Date) || isNaN(date.getTime())) return false;

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
  return validators.every(validator => validator(value));
}

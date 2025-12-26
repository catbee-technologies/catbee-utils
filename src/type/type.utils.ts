/**
 * Check if a value is of a specific primitive type.
 *
 * @param value - Value to check
 * @param type - Type to check against
 * @returns Whether the value is of the specified type
 *
 * @example
 * ```typescript
 * isPrimitiveType('hello', 'string'); // true
 * isPrimitiveType(42, 'number'); // true
 * isPrimitiveType(true, 'boolean'); // true
 * isPrimitiveType(null, 'null'); // true
 * isPrimitiveType(undefined, 'undefined'); // true
 * isPrimitiveType({}, 'object'); // true
 * isPrimitiveType([], 'array'); // true
 * ```
 */
export function isPrimitiveType(
  value: unknown,
  type: 'string' | 'number' | 'boolean' | 'symbol' | 'bigint' | 'function' | 'object' | 'array' | 'null' | 'undefined'
): boolean {
  if (type === 'array') {
    return Array.isArray(value);
  }

  if (type === 'null') {
    return value === null;
  }

  if (type === 'undefined') {
    return value === undefined;
  }

  if (type === 'object') {
    // Only plain objects, not arrays or null
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  return typeof value === type;
}

/**
 * Get the primitive type of a value as a string.
 *
 * @param value - Value to get the type of
 * @returns String representing the type
 *
 * @example
 * ```typescript
 * getTypeOf('hello'); // 'string'
 * getTypeOf(42); // 'number'
 * getTypeOf([]); // 'array'
 * getTypeOf(null); // 'null'
 * ```
 */
export function getTypeOf(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Type guard for checking if a value is an array of a specific type.
 *
 * @param value - Value to check
 * @param itemTypeGuard - Function that checks if items are of the expected type
 * @returns True if the value is an array with items of the expected type
 *
 * @example
 * ```typescript
 * isArrayOf([1, 2, 3], (item): item is number => typeof item === 'number'); // true
 * isArrayOf(['a', 'b', 'c'], (item): item is string => typeof item === 'string'); // true
 * isArrayOf([1, '2', 3], (item): item is number => typeof item === 'number'); // false
 * ```
 */
export function isArrayOf<T>(value: unknown, itemTypeGuard: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  return value.every(item => itemTypeGuard(item));
}

/**
 * Convert a value to a string.
 *
 * @param value - Value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns String representation of the value
 */
export function toStr(value: unknown, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;

  try {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  } catch {
    return defaultValue;
  }
}

/**
 * Convert a value to a number.
 *
 * @param value - Value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns Numeric representation of the value
 */
export function toNum(value: unknown, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;

  if (typeof value === 'number') return value;

  try {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  } catch {
    return defaultValue;
  }
}

/**
 * Convert a value to a boolean.
 *
 * @param value - Value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns Boolean representation of the value
 */
export function toBool(value: unknown, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) return defaultValue;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const lowercased = value.toLowerCase();
    if (lowercased === 'true' || lowercased === 'yes' || lowercased === 'y' || lowercased === '1') {
      return true;
    }
    if (lowercased === 'false' || lowercased === 'no' || lowercased === 'n' || lowercased === '0') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
}

/**
 * Ensure a value matches the expected type, or provide a default.
 *
 * @param value - Value to check
 * @param expectedType - Expected primitive type
 * @param defaultValue - Default value to use if type doesn't match
 * @returns The value if it matches the type, otherwise the default
 *
 * @example
 * ```typescript
 * ensureType(42, 'number', 0); // 42
 * ensureType('42', 'number', 0); // 0
 * ensureType(undefined, 'string', 'default'); // 'default'
 * ```
 */
export function ensureType<T>(value: unknown, expectedType: string, defaultValue: T): T {
  if (getTypeOf(value) === expectedType) {
    return value as unknown as T;
  }
  return defaultValue;
}

/**
 * Check whether a value is neither null nor undefined.
 * Useful in filter chains and guards.
 *
 * @param value - Value to check
 * @returns True when value !== null && value !== undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check whether a value is empty.
 * Supports strings, arrays, maps, sets and plain objects.
 *
 * @param value - Value to inspect
 * @returns True when value is considered empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

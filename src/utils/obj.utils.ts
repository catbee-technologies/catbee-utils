/**
 * Checks whether the object has no own enumerable properties.
 *
 * @param {Record<any, any>} obj - The object to check.
 * @returns {boolean} True if the object is empty, false otherwise.
 */
export function isObjEmpty(obj: Record<any, any>): boolean {
  return !!obj && typeof obj === "object" && Object.keys(obj).length === 0;
}

/**
 * Returns a new object with only the specified keys picked.
 *
 * @template T
 * @template K
 * @param {T} obj - The source object.
 * @param {K[]} keys - Keys to pick from the object.
 * @returns {Pick<T, K>} New object with picked keys.
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<T, K>;
}

/**
 * Returns a new object with the specified keys omitted.
 *
 * @template T
 * @template K
 * @param {T} obj - The source object.
 * @param {K[]} keys - Keys to omit from the object.
 * @returns {Omit<T, K>} New object without omitted keys.
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K)),
  ) as Omit<T, K>;
}

/**
 * Deeply merges two objects (mutates and returns the target object, not pure).
 *
 * @template T
 * @param {T} target - The object to merge into (will be mutated).
 * @param {Partial<T>} source - The object to merge from.
 * @returns {T} The merged object (same as target).
 */
export function deepObjMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  for (const key in source) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal)
    ) {
      if (
        !targetVal ||
        typeof targetVal !== "object" ||
        Array.isArray(targetVal)
      ) {
        target[key] = {} as any;
      }
      deepObjMerge(target[key], sourceVal as any);
    } else {
      target[key] = sourceVal as T[Extract<keyof T, string>];
    }
  }
  return target;
}

/**
 * Flattens a nested object using dot notation for keys (e.g., `{a: {b: 1}}` → `{ "a.b": 1 }`).
 *
 * @template T
 * @param {T} obj - The object to flatten.
 * @param {string} [prefix=""] - Optional prefix for nested keys (used internally).
 * @returns {Record<string, any>} A new object with flattened keys.
 */
export function flattenObject<T extends Record<string, any>>(
  obj: T,
  prefix = "",
): Record<string, any> {
  return Object.entries(obj).reduce(
    (acc: Record<string, any>, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value, newKey));
      } else {
        acc[newKey] = value;
      }

      return acc;
    },
    {},
  );
}

/**
 * Safely gets the value of a deeply nested key in an object using dot/bracket notation path.
 *
 * @template T
 * @param {T} obj - The object to extract from.
 * @param {string} path - String path using dot and/or bracket notation (e.g., 'user.friends[0].name').
 * @returns {any} The value at the given path, or undefined if not found.
 */
export function getValueByPath<T extends object>(obj: T, path: string) {
  if (!obj || typeof obj !== "object") return undefined;

  // Convert path like "a.b[0].c" into ["a", "b", "0", "c"]
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1") // convert [0] to .0
    .split(".")
    .filter(Boolean); // remove empty strings

  return parts.reduce((acc: any, key: string) => acc?.[key], obj);
}

/**
 * Sets a value at a deeply nested key in an object using dot/bracket notation path.
 * Creates intermediate objects and arrays as needed.
 *
 * @template T
 * @param {T} obj - The object to modify.
 * @param {string} path - String path using dot and/or bracket notation (e.g., 'user.friends[0].name').
 * @param {any} value - The value to set at the path.
 * @returns {T} The modified object.
 */
export function setValueByPath<T extends object>(
  obj: T,
  path: string,
  value: any,
): T {
  if (!obj || typeof obj !== "object") return obj;

  // Convert path like "a.b[0].c" into ["a", "b", "0", "c"]
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1") // convert [0] to .0
    .split(".")
    .filter(Boolean); // remove empty strings

  // Handle empty path
  if (parts.length === 0) return obj;

  let current: any = obj;

  // Navigate to the parent of the target property
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const isArrayIndex = !isNaN(Number(parts[i + 1]));

    if (current[key] === undefined) {
      // Create intermediate object or array based on next key type
      current[key] = isArrayIndex ? [] : {};
    }

    current = current[key];
  }

  // Set the value at the final key
  const finalKey = parts[parts.length - 1];
  current[finalKey] = value;

  return obj;
}

/**
 * Performs a deep equality check between two objects.
 *
 * @param {any} a - First value to compare.
 * @param {any} b - Second value to compare.
 * @returns {boolean} True if values are deeply equal.
 */
export function isEqual(a: any, b: any): boolean {
  // Check if primitives or references to the same object
  if (a === b) return true;

  // Check if either is null/undefined or not an object
  if (
    a == null ||
    b == null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // If one is Date but the other isn't
  if (a instanceof Date || b instanceof Date) {
    return false;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    // Check each element
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }

    return true;
  }

  // If one is Array but the other isn't
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // Compare object keys
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  // Check if every key in A exists in B and has the same value
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]),
  );
}

/**
 * Filters object properties based on a predicate function.
 *
 * @template T
 * @param {T} obj - The source object.
 * @param {(value: any, key: string, obj: T) => boolean} predicate - Filter function.
 * @returns {Partial<T>} New object with filtered properties.
 */
export function filterObject<T extends object>(
  obj: T,
  predicate: (value: any, key: string, obj: T) => boolean,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => predicate(value, key, obj)),
  ) as Partial<T>;
}

/**
 * Maps object values to new values using a mapping function.
 *
 * @template T
 * @template U
 * @param {T} obj - The source object.
 * @param {(value: any, key: string, obj: T) => U} mapFn - Mapping function.
 * @returns {Record<keyof T, U>} New object with mapped values.
 */
export function mapObject<T extends object, U>(
  obj: T,
  mapFn: (value: any, key: string, obj: T) => U,
): Record<keyof T, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, mapFn(value, key, obj)]),
  ) as Record<keyof T, U>;
}

/**
 * Recursively freezes an object and all its properties.
 * Makes an object immutable.
 *
 * @template T
 * @param {T} obj - The object to freeze.
 * @returns {Readonly<T>} The frozen object.
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  // Freeze primitive properties
  Object.freeze(obj);

  // Recursively freeze nested objects
  for (const prop of Object.getOwnPropertyNames(obj)) {
    const value = (obj as any)[prop];
    if (
      value !== null &&
      typeof value === "object" &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  }

  return obj;
}

/**
 * Safely checks if a value is an object (not null, not array).
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} True if value is a non-null, non-array object.
 */
export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Gets all paths in an object using dot notation.
 *
 * @param {Record<string, any>} obj - Object to analyze.
 * @param {string} [parentPath=""] - Internal param for recursion.
 * @returns {string[]} Array of all paths in dot notation.
 */
export function getAllPaths(
  obj: Record<string, any>,
  parentPath: string = "",
): string[] {
  if (!isObject(obj)) return [];

  return Object.entries(obj).flatMap(([key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;

    if (isObject(value)) {
      return [currentPath, ...getAllPaths(value, currentPath)];
    }

    return [currentPath];
  });
}

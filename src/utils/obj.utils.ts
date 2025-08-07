/**
 * Checks whether the object has no own enumerable properties.
 *
 * @param {Record<any, any>} obj - The object to check.
 * @returns {boolean} True if the object is empty, false otherwise.
 */
export const isObjEmpty = (obj: Record<any, any>): boolean =>
  !!obj && typeof obj === "object" && Object.keys(obj).length === 0;

/**
 * Returns a new object with only the specified keys picked.
 *
 * @template T
 * @template K
 * @param {T} obj - The source object.
 * @param {K[]} keys - Keys to pick from the object.
 * @returns {Pick<T, K>} New object with picked keys.
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> =>
  Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<T, K>;

/**
 * Returns a new object with the specified keys omitted.
 *
 * @template T
 * @template K
 * @param {T} obj - The source object.
 * @param {K[]} keys - Keys to omit from the object.
 * @returns {Omit<T, K>} New object without omitted keys.
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K)),
  ) as Omit<T, K>;

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

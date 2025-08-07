import { getValueByPath } from "./obj.utils";

/**
 * Splits an array into chunks of the specified size.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The array to split into chunks.
 * @param {number} size - The number of elements per chunk.
 * @returns {T[][]} A new array containing chunked arrays.
 * @throws {TypeError} If array is not an array.
 * @throws {Error} If chunk size is not a positive integer.
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  if (!Array.isArray(array)) throw new TypeError("Expected an array");
  if (!array.length) return [];
  if (!Number.isInteger(size) || size <= 0)
    throw new Error("Chunk size must be a positive integer");
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
};

/**
 * Removes duplicate values from an array.
 * Optionally enforces uniqueness by a key function.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {(item: T) => unknown} [keyFn] - Optional function to determine uniqueness by key.
 * @returns {T[]} A new array with unique values.
 */
export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!Array.isArray(array) || array.length === 0) return [];
  if (!keyFn) return Array.from(new Set(array));
  const seen = new Set<unknown>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Deeply flattens a nested array to a single-level array.
 *
 * @template T The leaf type of array elements.
 * @param {any[]} array - The (possibly deeply nested) input array.
 * @returns {T[]} A deeply flattened array.
 */
export function flattenDeep<T>(array: any[]): T[] {
  if (!Array.isArray(array)) return [];
  return array.reduce<T[]>((acc, val) => {
    if (Array.isArray(val)) {
      acc.push(...flattenDeep<T>(val));
    } else {
      acc.push(val);
    }
    return acc;
  }, []);
}

/**
 * Returns a random element from an array, or undefined if empty.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @returns {T | undefined} A randomly selected item, or undefined if array is empty or not an array.
 */
export function random<T>(array: T[]): T | undefined {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/* eslint-disable no-redeclare */
/**
 * Groups items in an array by a key or key function.
 *
 * @template T The type of array elements.
 * @overload
 * @param {T[]} array - The array to group.
 * @param {keyof T} key - Property key to group by.
 * @returns {Record<string, T[]>}
 * @overload
 * @param {T[]} array - The array to group.
 * @param {(item: T) => string | number | symbol} keyFn - Function to generate group key from item.
 * @returns {Record<K, T[]>}
 * @param {T[]} array - The array to group.
 * @param {keyof T | ((item: T) => string | number | symbol)} keyOrFn - Property key or key-generating function.
 * @returns {Record<string | number | symbol, T[]>} An object mapping group keys to item arrays.
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]>;
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T[]>;
export function groupBy<T>(
  array: T[],
  keyOrFn: keyof T | ((item: T) => string | number | symbol),
): Record<string | number | symbol, T[]> {
  if (!Array.isArray(array) || array.length === 0) return {};
  const keyFn =
    typeof keyOrFn === "function"
      ? keyOrFn
      : (item: T) => item[keyOrFn as keyof T];
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item) as string | number | symbol;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string | number | symbol, T[]>,
  );
}
/* eslint-enable no-redeclare */

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @returns {T[]} A new shuffled array.
 * @throws {TypeError} If array is not an array.
 */
export function shuffle<T>(array: T[]): T[] {
  if (!Array.isArray(array)) throw new TypeError("Expected an array");
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Returns an array of property values from an array of objects.
 *
 * @template T The type of array elements.
 * @template K The object property to pluck.
 * @param {T[]} array - The input array.
 * @param {K} key - The property name to pluck.
 * @returns {T[K][]} Array of property values.
 */
export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
  if (!Array.isArray(array)) return [];
  return array.map((item) => item[key]);
}

/**
 * Returns values in array A that are not in array B.
 *
 * @template T The type of array elements.
 * @param {T[]} a - First array.
 * @param {T[]} b - Second array.
 * @returns {T[]} Elements in A that are not in B.
 */
export function difference<T>(a: T[], b: T[]): T[] {
  if (!Array.isArray(a) || !Array.isArray(b)) return [];
  const setB = new Set(b);
  return a.filter((item) => !setB.has(item));
}

/**
 * Returns common values between arrays A and B.
 *
 * @template T The type of array elements.
 * @param {T[]} a - First array.
 * @param {T[]} b - Second array.
 * @returns {T[]} Elements that exist in both arrays.
 */
export function intersect<T>(a: T[], b: T[]): T[] {
  if (!Array.isArray(a) || !Array.isArray(b)) return [];
  const setB = new Set(b);
  return a.filter((item) => setB.has(item));
}

/**
 * Sorts an array of objects by a nested key using Merge Sort (O(n log n)).
 * Missing/undefined keys are sorted to the "end" (asc) or "start" (desc).
 *
 * @template T The type of array elements (objects).
 * @param {T[]} array - Array of objects to sort.
 * @param {string | ((item: T) => any)} key - Dot-notated key (e.g., "profile.age") or function.
 * @param {"asc" | "desc"} [direction="asc"] - Sort direction: 'asc' or 'desc'.
 * @returns {T[]} A new sorted array.
 * @throws {TypeError} If array is not an array.
 */
export function mergeSort<T>(
  array: T[],
  key: string | ((item: T) => any),
  direction: "asc" | "desc" = "asc",
): T[] {
  if (!Array.isArray(array)) throw new TypeError("Expected array");
  if (array.length <= 1) return array.slice();

  const keyFn =
    typeof key === "function"
      ? key
      : (item: T) => getValueByPath(item as object, key);

  const compare = (a: T, b: T) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    // Sorts undefined/null last for "asc", first for "desc"
    if (aVal === bVal) return 0;
    if (aVal == null) return direction === "asc" ? 1 : -1;
    if (bVal == null) return direction === "asc" ? -1 : 1;
    return direction === "asc" ? (aVal < bVal ? -1 : 1) : aVal > bVal ? -1 : 1;
  };

  const merge = (left: T[], right: T[]): T[] => {
    const result: T[] = [];
    let i = 0,
      j = 0;
    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) result.push(left[i++]);
      else result.push(right[j++]);
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  };

  const sort = (arr: T[]): T[] => {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = sort(arr.slice(0, mid));
    const right = sort(arr.slice(mid));
    return merge(left, right);
  };
  return sort(array);
}

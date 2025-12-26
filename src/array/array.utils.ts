import { getValueByPath } from '@catbee/utils/obj';

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
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (!Array.isArray(array)) throw new TypeError('Expected an array');
  if (array.length === 0) return [];
  if (!Number.isInteger(size) || size <= 0) throw new Error('Chunk size must be a positive integer');
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Removes duplicate values from an array.
 * Optionally enforces uniqueness by a key function.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {(item: T) => unknown} [keyFn] - Optional function to determine uniqueness by key.
 * @returns {T[]} A new array with unique values.
 */
export function unique<T>(array: readonly T[], keyFn?: (item: T) => unknown): T[] {
  if (!Array.isArray(array) || array.length === 0) return [];
  if (!keyFn) return Array.from(new Set(array));
  const seen = new Set<unknown>();
  return array.filter(item => {
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
export function flattenDeep<T>(array: unknown[]): T[] {
  if (!Array.isArray(array)) return [];
  const result: T[] = [];
  for (const val of array) {
    if (Array.isArray(val)) {
      result.push(...flattenDeep<T>(val));
    } else {
      result.push(val as T);
    }
  }
  return result;
}

/**
 * Returns a random element from an array, or undefined if empty.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @returns {T | undefined} A randomly selected item, or undefined if array is empty or not an array.
 */
export function random<T>(array: readonly T[]): T | undefined {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  const idx = Math.floor(Math.random() * array.length);
  return array[idx];
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
export function groupBy<T, K extends string | number | symbol>(array: T[], keyFn: (item: T) => K): Record<K, T[]>;
export function groupBy<T>(
  array: T[],
  keyOrFn: keyof T | ((item: T) => string | number | symbol)
): Record<string | number | symbol, T[]> {
  if (!Array.isArray(array) || array.length === 0) return {};
  const keyFn = typeof keyOrFn === 'function' ? keyOrFn : (item: T) => item[keyOrFn as keyof T];
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item) as string | number | symbol;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string | number | symbol, T[]>
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
  if (!Array.isArray(array)) throw new TypeError('Expected an array');
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
export function pluck<T, K extends keyof T>(array: readonly T[], key: K): T[K][] {
  if (!Array.isArray(array)) return [];
  return array.map(item => item[key]);
}

/**
 * Returns values in array A that are not in array B.
 *
 * @template T The type of array elements.
 * @param {T[]} a - First array.
 * @param {T[]} b - Second array.
 * @returns {T[]} Elements in A that are not in B.
 */
export function difference<T>(a: readonly T[], b: readonly T[]): T[] {
  if (!Array.isArray(a) || !Array.isArray(b)) return [];
  const setB = new Set(b);
  return a.filter(item => !setB.has(item));
}

/**
 * Returns common values between arrays A and B.
 *
 * @template T The type of array elements.
 * @param {T[]} a - First array.
 * @param {T[]} b - Second array.
 * @returns {T[]} Elements that exist in both arrays.
 */
export function intersect<T>(a: readonly T[], b: readonly T[]): T[] {
  if (!Array.isArray(a) || !Array.isArray(b)) return [];
  const setB = new Set(b);
  return a.filter(item => setB.has(item));
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
export function mergeSort<T>(array: T[], key: string | ((item: T) => any), direction: 'asc' | 'desc' = 'asc'): T[] {
  if (!Array.isArray(array)) throw new TypeError('Expected array');
  if (array.length <= 1) return array.slice();

  const keyFn = typeof key === 'function' ? key : (item: T) => getValueByPath(item as object, key);

  const compare = (a: T, b: T) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    // Sorts undefined/null last for "asc", first for "desc"
    if (aVal === bVal) return 0;
    if (aVal == null) return direction === 'asc' ? 1 : -1;
    if (bVal == null) return direction === 'asc' ? -1 : 1;
    return direction === 'asc' ? (aVal < bVal ? -1 : 1) : aVal > bVal ? -1 : 1;
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

/**
 * Combines multiple arrays into a single array of grouped elements.
 * Output array length equals the length of the shortest input array.
 *
 * @example zip([1, 2], ['a', 'b']) => [[1, 'a'], [2, 'b']]
 * @param {...Array<T>[]} arrays - Two or more arrays to zip together.
 * @returns {Array<T[]>} Array of grouped elements.
 */
export function zip<T>(...arrays: ReadonlyArray<T>[]): T[][] {
  if (arrays.length === 0) return [];
  if (arrays.some(arr => !Array.isArray(arr))) {
    throw new TypeError('All arguments must be arrays');
  }
  const minLength = Math.min(...arrays.map(arr => arr.length));
  const result: T[][] = [];
  for (let i = 0; i < minLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  return result;
}

/**
 * Splits an array into two arrays based on a predicate function.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {(item: T, index: number, array: T[]) => boolean} predicate - Function to test each element.
 * @returns {[T[], T[]]} A tuple of two arrays: [matched, unmatched].
 */
export function partition<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean): [T[], T[]] {
  if (!Array.isArray(array)) return [[], []];

  return array.reduce(
    ([pass, fail], item, index) => {
      return predicate(item, index, array) ? [[...pass, item], fail] : [pass, [...fail, item]];
    },
    [[] as T[], [] as T[]]
  );
}

/**
 * Generates an array of numbers within a specified range.
 *
 * @param {number} start - Start of range (inclusive).
 * @param {number} end - End of range (exclusive).
 * @param {number} [step=1] - Step between numbers.
 * @returns {number[]} Array of numbers in range.
 */
export function range(start: number, end: number, step: number = 1): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step)) {
    throw new TypeError('Arguments must be finite numbers');
  }
  if (step === 0) throw new Error('Step cannot be zero');

  const isAscending = step > 0;
  if ((isAscending && start >= end) || (!isAscending && start <= end)) {
    return [];
  }

  const length = Math.max(Math.ceil((end - start) / step), 0);
  const result = new Array(length);

  for (let i = 0, value = start; i < length; i++, value += step) {
    result[i] = value;
  }

  return result;
}

/**
 * Returns the first n elements of an array.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {number} [n=1] - Number of elements to take.
 * @returns {T[]} New array with first n elements.
 */
export function take<T>(array: T[], n: number = 1): T[] {
  if (!Array.isArray(array) || n <= 0) return [];
  return array.slice(0, n);
}

/**
 * Takes elements from the array while predicate returns true.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {(item: T, index: number) => boolean} predicate - Function to test each element.
 * @returns {T[]} New array with taken elements.
 */
export function takeWhile<T>(array: T[], predicate: (item: T, index: number) => boolean): T[] {
  if (!Array.isArray(array)) return [];

  const result: T[] = [];
  for (let i = 0; i < array.length; i++) {
    if (!predicate(array[i], i)) break;
    result.push(array[i]);
  }

  return result;
}

/**
 * Removes all falsy values from an array.
 * False, null, 0, "", undefined, and NaN are falsy.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @returns {NonNullable<T>[]} New array with falsy values removed.
 */
export function compact<T>(array: T[]): NonNullable<T>[] {
  if (!Array.isArray(array)) return [];
  return array.filter(Boolean) as NonNullable<T>[];
}

/**
 * Counts array elements by a key function.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {(item: T) => string | number | symbol} keyFn - Function to generate count key.
 * @returns {Record<string, number>} Object with counts by key.
 */
export function countBy<T>(array: T[], keyFn: (item: T) => string | number | symbol): Record<string, number> {
  if (!Array.isArray(array)) return {};

  return array.reduce(
    (acc, item) => {
      const key = String(keyFn(item));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

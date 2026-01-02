import { getValueByPath } from '@catbee/utils/object';
import { randomBytes } from 'node:crypto';

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
  const result: T[] = [];
  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Deeply flattens a nested array to a single-level array (iterative, stack-based).
 *
 * @template T The leaf type of array elements.
 * @param {readonly unknown[]} array - The (possibly deeply nested) input array.
 * @returns {T[]} A deeply flattened array.
 */
export function flattenDeep<T>(array: readonly unknown[]): T[] {
  if (!Array.isArray(array)) return [];
  const result: T[] = [];
  const stack: unknown[] = [...array];
  while (stack.length) {
    const val = stack.pop();
    if (Array.isArray(val)) {
      stack.push(...val);
    } else {
      result.push(val as T);
    }
  }
  return result.reverse();
}

/**
 * Returns a random element from an array, or undefined if empty. Uses crypto-secure randomness
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @returns {T | undefined} A randomly selected item, or undefined if array is empty or not an array.
 *
 * @example
 * ```ts
 * securePick(['a','b','c']); // -> 'b'
 * ```
 */
export function random<T>(array: readonly T[]): T | undefined {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  return array[secureIndex(array.length)];
}

type StrNumSym = string | number | symbol;

/* eslint-disable no-redeclare */
/**
 * Groups items in an array by a nested key or key function.
 *
 * @template T The type of array elements.
 * @overload
 * @param {T[]} array - The array to group.
 * @param {keyof T} key - Property key to group by.
 * @returns {Record<string, readonly T[]>}
 * @overload
 * @param {T[]} array - The array to group.
 * @param {(item: T) => StrNumSym} keyFn - Function to generate group key from item.
 * @returns {Record<K, readonly T[]>}
 * @param {T[]} array - The array to group.
 * @param {keyof T | ((item: T) => StrNumSym)} keyOrFn - Nested property key or key selector.
 * @returns {Record<StrNumSym, readonly T[]>} Grouped result object.
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, readonly T[]>;
export function groupBy<T, K extends StrNumSym>(array: T[], keyFn: (item: T) => K): Record<K, readonly T[]>;
export function groupBy<T>(
  array: readonly T[],
  keyOrFn: keyof T | ((item: T) => StrNumSym)
): Record<string, readonly T[]> {
  if (!Array.isArray(array) || array.length === 0) return {};

  const keyFn =
    typeof keyOrFn === 'function' ? keyOrFn : (item: T) => String(getValueByPath(item as object, keyOrFn as string));

  const result: Record<string, T[]> = {};
  for (const item of array) {
    const key = String(keyFn(item));
    if (Object.hasOwn(result, key)) {
      result[key].push(item);
    } else {
      result[key] = [item];
    }
  }

  return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v as readonly T[]]));
}
/* eslint-enable no-redeclare */

/**
 * Shuffles an array using the Fisher-Yates algorithm. Uses crypto-secure randomness.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @returns {T[]} A new shuffled array.
 * @throws {TypeError} If array is not an array.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  if (!Array.isArray(array)) throw new TypeError('Expected an array');
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Returns an array of property values from an array of objects. Returns undefined for missing properties.
 *
 * @template T The type of array elements.
 * @template K The object property to pluck.
 * @param {T[]} array - The input array.
 * @param {K} key - The property name to pluck.
 * @returns {T[K][]} Array of property values.
 */
export function pluck<T, K extends keyof T>(array: readonly T[], key: K): T[K][] {
  if (!Array.isArray(array)) return [];
  return array.map(item => item?.[key]);
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
 * Missing/undefined keys are sorted to the "end" (asc) or "start" (desc").
 * Optionally accepts a custom compare function or collator.
 *
 * @template T The type of array elements (objects).
 * @param {T[]} array - Array of objects to sort.
 * @param {string | ((item: T) => any)} key - Dot-notated key (e.g., "profile.age") or function.
 * @param {"asc" | "desc"} [direction="asc"] - Sort direction: 'asc' or 'desc'.
 * @param {(a: T, b: T) => number} [compareFn] - Optional custom compare function.
 * @returns {T[]} A new sorted array.
 * @throws {TypeError} If array is not an array.
 */
export function mergeSort<T>(
  array: readonly T[],
  key: string | ((item: T) => unknown),
  direction: 'asc' | 'desc' = 'asc',
  compareFn?: (a: T, b: T) => number
): T[] {
  if (!Array.isArray(array)) throw new TypeError('Expected array');
  const arr = array.slice();
  if (arr.length <= 1) return arr;

  const keyFn = typeof key === 'function' ? key : (item: T) => getValueByPath(item as object, key);

  const collator = new Intl.Collator('en', { numeric: true });
  const compare =
    compareFn ??
    function (a: T, b: T): number {
      const aVal = keyFn(a);
      const bVal = keyFn(b);
      if (aVal === bVal) return 0;
      if (aVal == null) return direction === 'asc' ? 1 : -1;
      if (bVal == null) return direction === 'asc' ? -1 : 1;
      return direction === 'asc'
        ? collator.compare(String(aVal), String(bVal))
        : collator.compare(String(bVal), String(aVal));
    };

  const merge = (left: T[], right: T[]): T[] => {
    const result: T[] = [];
    let i = 0,
      j = 0;
    while (i < left.length && j < right.length) {
      result.push(compare(left[i], right[j]) <= 0 ? left[i++] : right[j++]);
    }
    while (i < left.length) result.push(left[i++]);
    while (j < right.length) result.push(right[j++]);
    return result;
  };

  const sort = (input: T[]): T[] => {
    const len = input.length;
    if (len <= 1) return input;
    const mid = len >> 1;
    const left = sort(input.slice(0, mid));
    const right = sort(input.slice(mid));
    return merge(left, right);
  };

  return sort(arr);
}

/**
 * Combines multiple arrays into a single array of grouped elements.
 * Output length equals the length of the shortest input array.
 *
 * This implementation ensures type safety and avoids holes in output.
 *
 * @example
 * ```ts
 * zip([1, 2], ['a', 'b']) => [[1, 'a'], [2, 'b']]
 * ```
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

/* eslint-disable no-redeclare */
/**
 * Splits an array into two arrays based on a predicate function.
 * Supports type-guard narrowing via overload.
 *
 * @template T The type of array elements.
 * @overload
 * @param {readonly T[]} array - The input array.
 * @param {(item: T, index: number, array: readonly T[]) => item is U} predicate - Type guard predicate.
 * @returns {[U[], Exclude<T, U>[]]} A tuple of two arrays: [matched, unmatched].
 * @overload
 * @param {readonly T[]} array - The input array.
 * @param {(item: T, index: number, array: readonly T[]) => boolean} predicate - Boolean predicate.
 * @returns {[T[], T[]]} A tuple of two arrays: [matched, unmatched].
 */
export function partition<T, U extends T>(
  array: readonly T[],
  predicate: (item: T, index: number, array: readonly T[]) => item is U
): [U[], Exclude<T, U>[]];
export function partition<T>(
  array: readonly T[],
  predicate: (item: T, index: number, array: readonly T[]) => boolean
): [T[], T[]];
export function partition<T>(
  array: readonly T[],
  predicate: (item: T, index: number, array: readonly T[]) => boolean
): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  if (!Array.isArray(array)) return [pass, fail];

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    (predicate(item, i, array) ? pass : fail).push(item);
  }

  return [pass, fail];
}
/* eslint-enable no-redeclare */

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

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(i);
  } else {
    for (let i = start; i > end; i += step) result.push(i);
  }
  return result;
}

/**
 * Returns the first `n` elements from an array.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {number} [n=1] - Number of elements to take.
 * @returns {T[]} New array with first n elements.
 */
export function take<T>(array: readonly T[], n: number = 1): T[] {
  if (!Array.isArray(array) || n <= 0) return [];
  return n >= array.length ? array.slice() : array.slice(0, n);
}

/**
 * Takes elements from an array while predicate returns true.
 *
 * @template T The type of array elements.
 * @param {readonly T[]} array - Input array.
 * @param {(item: T, index: number) => boolean} predicate - Condition function.
 * @returns {T[]} New array with taken elements.
 *
 * @example
 * ```ts
 * takeWhile([1,2,3,4], (n) => n < 3); // -> [1,2]
 * ```
 */
export function takeWhile<T>(array: readonly T[], predicate: (item: T, index: number) => boolean): T[] {
  const result: T[] = [];
  if (!Array.isArray(array)) return result;
  const len = array.length;
  for (let i = 0; i < len; i++) {
    const item = array[i];
    if (!predicate(item, i)) break;
    result.push(item);
  }

  return result;
}

/**
 * Removes all falsy values from an array.
 * `false`, `null`, `0`, `""`, `undefined`, and `NaN` are falsy.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @returns {NonNullable<T>[]} New array with falsy values removed.
 */
export function compact<T>(array: readonly T[]): NonNullable<T>[] {
  if (!Array.isArray(array)) return [];
  const result: NonNullable<T>[] = [];
  for (const v of array) {
    if (v) result.push(v as NonNullable<T>);
  }
  return result;
}

/**
 * Counts array elements by a key function.
 *
 * @template T The type of array elements.
 * @param {T[]} array - The input array.
 * @param {(item: T) => StrNumSym} keyFn - Function to generate count key.
 * @returns {Record<string, number>} Object with counts by key.
 */
export function countBy<T>(array: readonly T[], keyFn: (item: T) => StrNumSym): Record<string, number> {
  if (!Array.isArray(array)) return {};
  const result: Record<string, number> = {};
  for (const item of array) {
    const key = String(keyFn(item));
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

/**
 * Toggles an item in array (adds if not present, removes if present).
 *
 * @template T
 * @param {readonly T[]} array
 * @param {T} item
 * @returns {T[]} New array with item toggled.
 *
 * @example
 * ```ts
 * toggle([1,2,3], 2); // -> [1,3]
 * toggle([1,3], 2); // -> [1,3,2]
 * ```
 */
export function toggle<T>(array: readonly T[], item: T): T[] {
  if (!Array.isArray(array)) return [item];
  const exists = array.includes(item);
  if (exists) return array.filter(x => x !== item);
  return [...array, item];
}

/**
 * Returns a cryptographically secure random index for an array.
 * Used internally for secure pick/shuffle operations.
 *
 * @param {number} max Upper bound (exclusive).
 * @returns {number} A secure random integer in range `[0, max)`.
 * @throws {RangeError} If `max` is not a positive number.
 *
 * @example
 * ```ts
 * secureIndex(10); // -> 3 (unpredictable)
 * ```
 */
export function secureIndex(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError('Max must be a positive integer');

  const limit = 0xffffffff - (0xffffffff % max);
  let rand: number;
  do {
    rand = randomBytes(4).readUInt32BE(0);
  } while (rand >= limit);

  return rand % max;
}

/**
 * Returns a secure random element from an array using Node crypto.
 *
 * @template T
 * @param {readonly T[]} array
 * @returns {T | undefined}
 */
export const secureRandom = <T>(array: readonly T[]): T | undefined => {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  const idx = secureIndex(array.length);
  return array[idx];
};

/**
 * Returns the last element in the array that satisfies the provided testing function.
 *
 * @template T
 * @param {readonly T[]} array - The input array.
 * @param {(item: T, index: number, array: readonly T[]) => boolean} predicate - Function to test each element.
 * @returns {T | undefined} The found element, or undefined if not found.
 */
export function findLast<T>(
  array: readonly T[],
  predicate: (item: T, index: number, array: readonly T[]) => boolean
): T | undefined {
  if (!Array.isArray(array)) return undefined;
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) return array[i];
  }
  return undefined;
}

/**
 * Returns the index of the last element in the array that satisfies the provided testing function.
 *
 * @template T
 * @param {readonly T[]} array - The input array.
 * @param {(item: T, index: number, array: readonly T[]) => boolean} predicate - Function to test each element.
 * @returns {number} The index, or -1 if not found.
 */
export function findLastIndex<T>(
  array: readonly T[],
  predicate: (item: T, index: number, array: readonly T[]) => boolean
): number {
  if (!Array.isArray(array)) return -1;
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) return i;
  }
  return -1;
}

/**
 * Splits an array into chunks based on a predicate function.
 * Each chunk starts when predicate returns true.
 *
 * @template T
 * @param {readonly T[]} array - The input array.
 * @param {(item: T, index: number, array: readonly T[]) => boolean} predicate - Function to determine chunk boundaries.
 * @returns {T[][]} Array of chunked arrays.
 */
export function chunkBy<T>(
  array: readonly T[],
  predicate: (item: T, index: number, array: readonly T[]) => boolean
): T[][] {
  if (!Array.isArray(array) || array.length === 0) return [];
  const result: T[][] = [];
  let chunk: T[] = [];
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array) && chunk.length) {
      result.push(chunk);
      chunk = [];
    }
    chunk.push(array[i]);
  }
  if (chunk.length) result.push(chunk);
  return result;
}

/**
 * Removes all occurrences of a value from an array.
 *
 * @template T
 * @param {readonly T[]} array - The input array.
 * @param {T} value - Value to remove.
 * @returns {T[]} New array with value removed.
 */
export function remove<T>(array: readonly T[], value: T): T[] {
  if (!Array.isArray(array)) return [];
  // Removes all occurrences using strict equality
  return array.filter(item => item !== value);
}

/**
 * Checks if an array is sorted in ascending or descending order.
 *
 * @template T
 * @param {readonly T[]} array - The input array.
 * @param {'asc' | 'desc'} [direction='asc'] - Sort direction.
 * @param {(a: T, b: T) => number} [compareFn] - Optional compare function.
 * @returns {boolean} True if sorted, false otherwise.
 */
export function isSorted<T>(
  array: readonly T[],
  direction: 'asc' | 'desc' = 'asc',
  compareFn?: (a: T, b: T) => number
): boolean {
  if (!Array.isArray(array) || array.length <= 1) return true;
  const cmp = compareFn || ((a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0));
  for (let i = 1; i < array.length; i++) {
    const res = cmp(array[i - 1], array[i]);
    if ((direction === 'asc' && res > 0) || (direction === 'desc' && res < 0)) return false;
  }
  return true;
}

/**
 * Returns the first element of an array, or undefined if empty.
 *
 * @template T
 * @param {readonly T[]} array
 * @returns {T | undefined}
 */
export function headOfArr<T>(array: readonly T[]): T | undefined {
  return Array.isArray(array) && array.length > 0 ? array[0] : undefined;
}

/**
 * Returns the last element of an array, or undefined if empty.
 *
 * @template T
 * @param {readonly T[]} array
 * @returns {T | undefined}
 */
export function lastOfArr<T>(array: readonly T[]): T | undefined {
  return Array.isArray(array) && array.length > 0 ? array.at(-1) : undefined;
}

/**
 * Drops the first n elements from an array.
 *
 * @template T
 * @param {readonly T[]} array - The source array.
 * @param {number} n - Number of elements to drop.
 * @returns {T[]} Array with first n elements removed.
 *
 * @example
 * drop([1, 2, 3, 4, 5], 2); // [3, 4, 5]
 */
export function drop<T>(array: readonly T[], n: number): T[] {
  if (!Array.isArray(array) || n <= 0) return [...array];
  return array.slice(n);
}

/**
 * Drops elements from the start of an array while predicate returns true.
 *
 * @template T
 * @param {readonly T[]} array - The source array.
 * @param {(item: T, index: number) => boolean} predicate - Condition function.
 * @returns {T[]} Array with elements dropped.
 *
 * @example
 * dropWhile([1, 2, 3, 4, 1], x => x < 3); // [3, 4, 1]
 */
export function dropWhile<T>(array: readonly T[], predicate: (item: T, index: number) => boolean): T[] {
  if (!Array.isArray(array)) return [];
  let i = 0;
  while (i < array.length && predicate(array[i], i)) {
    i++;
  }
  return array.slice(i);
}

/**
 * Finds the element with the maximum value for a given key or function.
 *
 * @template T
 * @param {readonly T[]} array - The source array.
 * @param {keyof T | ((item: T) => number)} keyOrFn - Property key or function.
 * @returns {T | undefined} Element with maximum value.
 *
 * @example
 * maxBy([{a: 1}, {a: 5}, {a: 3}], 'a'); // {a: 5}
 * maxBy([{a: 1}, {a: 5}, {a: 3}], x => x.a); // {a: 5}
 */
export function maxBy<T>(array: readonly T[], keyOrFn: keyof T | ((item: T) => number)): T | undefined {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  const fn = typeof keyOrFn === 'function' ? keyOrFn : (item: T) => item[keyOrFn] as unknown as number;
  return array.reduce<T>((max, item) => (fn(item) > fn(max) ? item : max), array[0]);
}

/**
 * Finds the element with the minimum value for a given key or function.
 *
 * @template T
 * @param {readonly T[]} array - The source array.
 * @param {keyof T | ((item: T) => number)} keyOrFn - Property key or function.
 * @returns {T | undefined} Element with minimum value.
 *
 * @example
 * minBy([{a: 1}, {a: 5}, {a: 3}], 'a'); // {a: 1}
 * minBy([{a: 1}, {a: 5}, {a: 3}], x => x.a); // {a: 1}
 */
export function minBy<T>(array: readonly T[], keyOrFn: keyof T | ((item: T) => number)): T | undefined {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  const fn = typeof keyOrFn === 'function' ? keyOrFn : (item: T) => item[keyOrFn] as unknown as number;
  return array.reduce<T>((min, item) => (fn(item) < fn(min) ? item : min), array[0]);
}

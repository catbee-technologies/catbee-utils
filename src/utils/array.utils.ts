import { getValueByPath } from "./obj.utils";

/**
 * Splits an array into chunks of the specified size.
 *
 * @param arr - The array to chunk.
 * @param size - The number of elements per chunk.
 * @returns A new array of chunked arrays.
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (!Array.isArray(arr)) return [];
  if (size <= 0) throw new Error("Chunk size must be greater than zero");
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
};

/**
 * Removes duplicate values from an array.
 *
 * @param array - The input array.
 * @returns A new array with unique values.
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Deeply flattens a nested array of arbitrary depth.
 *
 * @param array - The input nested array.
 * @returns A deeply flattened array.
 */
export function flattenDeep<T>(array: any[]): T[] {
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
 * Returns a random element from an array.
 *
 * @param array - The input array.
 * @returns A randomly selected item, or undefined if empty.
 */
export function random<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Groups items in an array by a key selector.
 *
 * @param array - The input array.
 * @param keyFn - A function that returns the key for each item.
 * @returns An object mapping keys to grouped arrays.
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 *
 * @param array - The input array.
 * @returns A new shuffled array.
 */
export function shuffle<T>(array: T[]): T[] {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Returns values in A that are not in B.
 *
 * @param a - First array.
 * @param b - Second array.
 * @returns Elements in A that are not in B.
 */
export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((item) => !setB.has(item));
}

/**
 * Returns common values between A and B.
 *
 * @param a - First array.
 * @param b - Second array.
 * @returns Elements that exist in both arrays.
 */
export function intersect<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((item) => setB.has(item));
}

/**
 * Sorts an array of objects by a nested key using Merge Sort (O(n log n)).
 *
 * @template T - Object type of the array elements.
 * @param array - Array of objects to sort.
 * @param key - Dot-notated key to sort by (e.g. 'profile.age').
 * @param direction - Sort direction: 'asc' or 'desc'.
 * @returns A new sorted array.
 */
export function mergeSort<T extends object>(
  array: T[],
  key: string,
  direction: "asc" | "desc" = "asc",
): T[] {
  if (array.length <= 1) return array.slice();

  const compare = (a: T, b: T) => {
    const aVal = getValueByPath(a, key);
    const bVal = getValueByPath(b, key);

    if (aVal === bVal) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    return direction === "asc" ? (aVal < bVal ? -1 : 1) : aVal > bVal ? -1 : 1;
  };

  const merge = (left: T[], right: T[]): T[] => {
    const result: T[] = [];
    let i = 0,
      j = 0;

    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
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

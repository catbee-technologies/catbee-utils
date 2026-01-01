/**
 * Safely checks if a value is an object (not null, not array).
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} True if value is a non-null, non-array object.
 */
export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks whether the object has no own enumerable properties.
 *
 * @param {Record<any, any>} obj - The object to check.
 * @returns {boolean} True if the object is empty, false otherwise.
 */
export function isObjEmpty(obj: Record<any, any>): boolean {
  return isObject(obj) && Object.keys(obj).length === 0;
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
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map(key => [key, obj[key]])) as Pick<T, K>;
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
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

/**
 * Deeply merges multiple sources into the target object (mutates and returns the target, not pure).
 * Uses the project’s existing `deepClone` to handle all cloning and circular references.
 *
 * @template T
 * @param {T} target - The object to merge into (will be mutated)
 * @param {...any[]} sources - The objects to merge from
 * @returns {T} The merged object (same reference as target)
 */
export function deepObjMerge<T extends object>(target: T, ...sources: any[]): T {
  const seen = new WeakMap<object, any>();

  for (const s of sources) {
    target = mergeInto(target, s, seen);
  }

  return target;
}

function mergeInto(t: any, s: any, seen: WeakMap<object, any>): any {
  if (s === undefined) return t;
  if (typeof s === 'function' || typeof s === 'symbol') return s;

  if (Array.isArray(s)) {
    const cloned = deepClone(s);
    seen.set(s, cloned);
    return cloned;
  }

  if (s && typeof s === 'object') {
    if (seen.has(s)) return seen.get(s);

    if (
      s instanceof Date ||
      s instanceof Map ||
      s instanceof Set ||
      s instanceof RegExp ||
      s instanceof ArrayBuffer ||
      ArrayBuffer.isView(s)
    ) {
      const cloned = deepClone(s);
      seen.set(s, cloned);
      return cloned;
    }

    if (!t || typeof t !== 'object') {
      t = Object.create(Object.getPrototypeOf(s));
    }

    seen.set(s, t);

    for (const key of Reflect.ownKeys(s)) {
      if (key === '__proto__') continue;
      const sv = (s as any)[key];
      if (sv === undefined) continue;
      t[key] = mergeInto(t[key], sv, seen);
    }

    return t;
  }

  return s;
}

/**
 * Checks if a value is a plain object (i.e., not an array, null, or a built-in object).
 *
 * @param value - The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
export function isPlainObject(value: any): value is Record<string, any> {
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Flattens a nested object using dot notation for keys (e.g., `{a: {b: 1}}` -> `{ "a.b": 1 }`).
 *
 * @template T
 * @param {T} obj - The object to flatten.
 * @param {string} [prefix=""] - Optional prefix for nested keys (used internally).
 * @returns {Record<string, any>} A new object with flattened keys.
 */
export function flattenObject<T extends Record<string, any>>(obj: T, prefix = ''): Record<string, any> {
  return Object.entries(obj).reduce((acc: Record<string, any>, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (key === '__proto__') return acc; // Prevent prototype pollution

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = value;
    }

    return acc;
  }, {});
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
  if (!obj || typeof obj !== 'object') return undefined;

  // Convert path like "a.b[0].c" into ["a", "b", "0", "c"]
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1') // convert [0] to .0
    .split('.')
    .filter(Boolean); // remove empty strings

  return parts.reduce((acc: any, key: string) => acc?.[key], obj);
}

function ensureNextContainer(curr: any, nextIsIndex: boolean) {
  if (curr === undefined || typeof curr !== 'object' || curr === null) {
    return nextIsIndex ? [] : Object.create(null);
  }
  return curr;
}

/**
 * Sets a value at a deeply nested key in an object using dot/bracket notation path.
 * Secured against prototype pollution.
 *
 * @template T
 * @param {T} obj - The object to modify.
 * @param {string} path - Dot/bracket notation path (e.g., "user.friends[0].name").
 * @param {any} value - Value to assign.
 * @returns {T} The new object with the value set (original object is not mutated).
 */
export function setValueByPath<T extends object>(obj: T, path: string, value: any): T {
  if (!obj || typeof obj !== 'object') return obj;

  const clone = deepClone(obj);
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  if (parts.length === 0) return clone;

  const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
  let current: any = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (forbiddenKeys.has(key)) return clone;

    const nextKey = parts[i + 1];
    const nextIsIndex = !Number.isNaN(Number(nextKey));

    current[key] = ensureNextContainer(current[key], nextIsIndex);
    current = current[key];
  }

  const finalKey = parts.at(-1)!;
  if (forbiddenKeys.has(finalKey)) return clone;

  current[finalKey] = value;
  return clone;
}

/**
 * Performs a deep equality check between two objects.
 *
 * @param {any} a - First value to compare.
 * @param {any} b - Second value to compare.
 * @returns {boolean} True if values are deeply equal.
 */
export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;

  if (a instanceof Date && b instanceof Date) return equalDates(a, b);
  if (a instanceof RegExp && b instanceof RegExp) return equalRegExp(a, b);
  if (a instanceof Set && b instanceof Set) return equalSet(a, b);
  if (a instanceof Map && b instanceof Map) return equalMap(a, b);
  if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) return equalArrayBuffer(a, b);
  if (Array.isArray(a) && Array.isArray(b)) return equalArray(a, b);

  return equalPlainObjects(a, b);
}

function equalDates(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function equalRegExp(a: RegExp, b: RegExp): boolean {
  return a.source === b.source && a.flags === b.flags;
}

function equalSet(a: Set<any>, b: Set<any>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function equalMap(a: Map<any, any>, b: Map<any, any>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (!b.has(k)) return false;
    if (!isEqual(v, b.get(k))) return false;
  }
  return true;
}

function equalArrayBuffer(a: ArrayBuffer, b: ArrayBuffer): boolean {
  return isEqual(new Uint8Array(a), new Uint8Array(b));
}

function equalArray(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!isEqual(a[i], b[i])) return false;
  return true;
}

function equalPlainObjects(a: Record<string, any>, b: Record<string, any>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }
  return true;
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
  predicate: (value: any, key: string, obj: T) => boolean
): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([key, value]) => predicate(value, key, obj))) as Partial<T>;
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
  mapFn: (value: any, key: string, obj: T) => U
): Record<keyof T, U> {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, mapFn(value, key, obj)])) as Record<
    keyof T,
    U
  >;
}

function _deepClone<T>(value: T, seen: WeakMap<object, any>): T {
  // Primitive, function, or symbol
  if (typeof value === 'function' || typeof value === 'symbol') return value;

  // Primitive or null -> return as-is
  if (value === null || typeof value !== 'object') return value;

  // Circular reference -> return stored clone
  if (seen.has(value as object)) return seen.get(value as object) as T;

  // Delegate to specialized cloners
  if (Array.isArray(value)) return cloneArray(value as any, seen) as any;
  if (value instanceof Date) return cloneDate(value as any) as any;
  if (value instanceof Map) return cloneMap(value as any, seen) as any;
  if (value instanceof Set) return cloneSet(value as any, seen) as any;
  if (value instanceof RegExp) return cloneRegExp(value as any) as any;
  if (ArrayBuffer.isView(value)) return cloneArrayBufferView(value as any, seen) as any;
  if (value instanceof ArrayBuffer) return cloneArrayBuffer(value as any, seen) as any;

  return cloneObject(value as any, seen) as T;
}

function cloneArray<T>(arr: T[], seen: WeakMap<object, any>): T[] {
  const result: any[] = [];
  seen.set(arr as any, result);
  for (const item of arr) result.push(_deepClone(item, seen));
  return result as T[];
}

function cloneDate(d: Date): Date {
  const r = new Date(d.getTime());
  // Note: callers set seen where appropriate
  return r;
}

function cloneMap(m: Map<any, any>, seen: WeakMap<object, any>): Map<any, any> {
  const result = new Map();
  seen.set(m, result);
  for (const [k, v] of m) result.set(_deepClone(k, seen), _deepClone(v, seen));
  return result;
}

function cloneSet(s: Set<any>, seen: WeakMap<object, any>): Set<any> {
  const result = new Set();
  seen.set(s, result);
  for (const v of s) result.add(_deepClone(v, seen));
  return result;
}

function cloneRegExp(r: RegExp): RegExp {
  const result = new RegExp(r.source, r.flags);
  return result;
}

function cloneArrayBufferView(view: ArrayBufferView, seen: WeakMap<object, any>): any {
  if (view instanceof DataView) {
    const buf = _deepClone(view.buffer, seen) as ArrayBuffer;
    const clone = new DataView(buf, view.byteOffset, view.byteLength);
    seen.set(view as any, clone);
    return clone;
  }

  const typed: any = view as any;
  const buf = _deepClone(typed.buffer, seen) as ArrayBuffer;
  const clone = new typed.constructor(buf, typed.byteOffset, typed.length);
  seen.set(view as any, clone);
  return clone;
}

function cloneArrayBuffer(buf: ArrayBuffer, seen: WeakMap<object, any>): ArrayBuffer {
  const result = buf.slice(0);
  seen.set(buf as any, result);
  return result;
}

function cloneObject(obj: any, seen: WeakMap<object, any>): any {
  const result = Object.create(Object.getPrototypeOf(obj));
  seen.set(obj, result);

  for (const key of Reflect.ownKeys(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc?.get || desc?.set) {
      Object.defineProperty(result, key, {
        get: desc.get,
        set: desc.set,
        enumerable: desc.enumerable,
        configurable: desc.configurable
      });
    } else {
      Object.defineProperty(result, key, {
        value: _deepClone((obj as any)[key], seen),
        writable: desc?.writable ?? true,
        enumerable: desc?.enumerable ?? true,
        configurable: desc?.configurable ?? true
      });
    }
  }

  return result;
}

/**
 * Deeply clones any value.
 * Preserves functions and symbols by reference.
 * Handles circular references using `WeakMap`.
 *
 * @template T The type of the value being cloned.
 * @param value The value to deeply clone.
 * @returns A fully deep-cloned copy of the input.
 */
export function deepClone<T>(value: T): T {
  const seen = new WeakMap();
  return _deepClone(value, seen);
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
  for (const key of Reflect.ownKeys(obj)) {
    const val = (obj as any)[key];
    if (isObject(val) && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }

  return obj;
}

/**
 * Gets all paths in an object using dot notation.
 *
 * @param {Record<string, any>} obj - Object to analyze.
 * @param {string} [parentPath=""] - Internal param for recursion.
 * @returns {string[]} Array of all paths in dot notation.
 */
export function getAllPaths(obj: Record<string, any>, parentPath: string = ''): string[] {
  if (!isObject(obj)) return [];

  return Object.entries(obj).flatMap(([key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;

    if (isObject(value)) {
      return [currentPath, ...getAllPaths(value, currentPath)];
    }

    return [currentPath];
  });
}

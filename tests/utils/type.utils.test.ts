import {
  isPrimitiveType,
  getTypeOf,
  isArrayOf,
  toStr,
  toNum,
  toBool,
  ensureType,
  isDefined,
  isEmpty,
  isIterable,
  isAsyncIterable,
  assertType
} from '../../src/type';

describe('type.utils', () => {
  describe('isPrimitiveType', () => {
    it('detects string', () => {
      expect(isPrimitiveType('hello', 'string')).toBe(true);
      expect(isPrimitiveType(42, 'string')).toBe(false);
    });
    it('detects number', () => {
      expect(isPrimitiveType(42, 'number')).toBe(true);
      expect(isPrimitiveType('42', 'number')).toBe(false);
    });
    it('detects boolean', () => {
      expect(isPrimitiveType(true, 'boolean')).toBe(true);
      expect(isPrimitiveType(false, 'boolean')).toBe(true);
      expect(isPrimitiveType(0, 'boolean')).toBe(false);
    });
    it('detects null', () => {
      expect(isPrimitiveType(null, 'null')).toBe(true);
      expect(isPrimitiveType(undefined, 'null')).toBe(false);
    });
    it('detects undefined', () => {
      expect(isPrimitiveType(undefined, 'undefined')).toBe(true);
      expect(isPrimitiveType(null, 'undefined')).toBe(false);
    });
    it('detects array', () => {
      expect(isPrimitiveType([], 'array')).toBe(true);
      expect(isPrimitiveType({}, 'array')).toBe(false);
    });
    it('detects object', () => {
      expect(isPrimitiveType({}, 'object')).toBe(true);
      expect(isPrimitiveType([], 'object')).toBe(false);
    });
    it('detects function', () => {
      expect(isPrimitiveType(() => {}, 'function')).toBe(true);
      expect(isPrimitiveType({}, 'function')).toBe(false);
    });
  });

  describe('getTypeOf', () => {
    it('returns string for string', () => {
      expect(getTypeOf('abc')).toBe('string');
    });
    it('returns number for number', () => {
      expect(getTypeOf(123)).toBe('number');
    });
    it('returns boolean for boolean', () => {
      expect(getTypeOf(true)).toBe('boolean');
    });
    it('returns array for array', () => {
      expect(getTypeOf([1, 2])).toBe('array');
    });
    it('returns null for null', () => {
      expect(getTypeOf(null)).toBe('null');
    });
    it('returns undefined for undefined', () => {
      expect(getTypeOf(undefined)).toBe('undefined');
    });
    it('returns object for object', () => {
      expect(getTypeOf({})).toBe('object');
    });
    it('returns function for function', () => {
      expect(getTypeOf(() => {})).toBe('function');
    });
  });

  describe('isArrayOf', () => {
    it('returns true for array of numbers', () => {
      expect(isArrayOf([1, 2, 3], (item): item is number => typeof item === 'number')).toBe(true);
    });
    it('returns true for array of strings', () => {
      expect(isArrayOf(['a', 'b'], (item): item is string => typeof item === 'string')).toBe(true);
    });
    it('returns false for mixed array', () => {
      expect(isArrayOf([1, '2', 3], (item): item is number => typeof item === 'number')).toBe(false);
    });
    it('returns false for non-array', () => {
      expect(isArrayOf('not-an-array', (item): item is number => typeof item === 'number')).toBe(false);
    });
  });

  describe('toStr', () => {
    it('converts primitives to string', () => {
      expect(toStr(123)).toBe('123');
      expect(toStr(true)).toBe('true');
      expect(toStr(null)).toBe('');
      expect(toStr(undefined)).toBe('');
    });
    it('converts object to JSON string', () => {
      expect(toStr({ a: 1 })).toBe(JSON.stringify({ a: 1 }));
    });
    it('returns default value on error', () => {
      const circular: any = {};
      circular.self = circular;
      expect(toStr(circular, 'oops')).toBe('oops');
    });
  });

  describe('toNum', () => {
    it('converts string to number', () => {
      expect(toNum('42')).toBe(42);
      expect(toNum('not-a-number')).toBe(0);
    });
    it('returns number as is', () => {
      expect(toNum(99)).toBe(99);
    });
    it('returns default for null/undefined', () => {
      expect(toNum(null, 7)).toBe(7);
      expect(toNum(undefined, 8)).toBe(8);
    });
  });

  describe('toBool', () => {
    it('converts string to boolean', () => {
      expect(toBool('true')).toBe(true);
      expect(toBool('yes')).toBe(true);
      expect(toBool('1')).toBe(true);
      expect(toBool('false')).toBe(false);
      expect(toBool('no')).toBe(false);
      expect(toBool('0')).toBe(false);
      expect(toBool('random')).toBe(false);
    });
    it('converts number to boolean', () => {
      expect(toBool(1)).toBe(true);
      expect(toBool(0)).toBe(false);
      expect(toBool(-1)).toBe(true);
    });
    it('returns boolean as is', () => {
      expect(toBool(true)).toBe(true);
      expect(toBool(false)).toBe(false);
    });
    it('returns default for null/undefined', () => {
      expect(toBool(null, true)).toBe(true);
      expect(toBool(undefined, false)).toBe(false);
    });
  });

  describe('ensureType', () => {
    it('returns value if type matches', () => {
      expect(ensureType(42, 'number', 0)).toBe(42);
      expect(ensureType('abc', 'string', 'default')).toBe('abc');
    });
    it('returns default if type does not match', () => {
      expect(ensureType('42', 'number', 0)).toBe(0);
      expect(ensureType(undefined, 'string', 'default')).toBe('default');
    });
    it('works for arrays', () => {
      expect(ensureType([1, 2], 'array', [])).toEqual([1, 2]);
      expect(ensureType('not-an-array', 'array', [])).toEqual([]);
    });
  });

  describe('isDefined', () => {
    it('returns true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('returns false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('returns true for null and undefined', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('returns true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('returns false for non-empty array', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it('returns true for empty Map', () => {
      expect(isEmpty(new Map())).toBe(true);
    });

    it('returns false for non-empty Map', () => {
      const map = new Map();
      map.set('key', 'value');
      expect(isEmpty(map)).toBe(false);
    });

    it('returns true for empty Set', () => {
      expect(isEmpty(new Set())).toBe(true);
    });

    it('returns false for non-empty Set', () => {
      const set = new Set();
      set.add(1);
      expect(isEmpty(set)).toBe(false);
    });

    it('returns true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('returns false for non-empty object', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(123)).toBe(false);
    });
  });

  describe('isIterable', () => {
    it('returns true for arrays', () => {
      expect(isIterable([1, 2, 3])).toBe(true);
    });

    it('returns true for strings', () => {
      expect(isIterable('hello')).toBe(true);
    });

    it('returns true for Sets', () => {
      expect(isIterable(new Set([1, 2, 3]))).toBe(true);
    });

    it('returns true for Maps', () => {
      expect(isIterable(new Map())).toBe(true);
    });

    it('returns false for plain objects', () => {
      expect(isIterable({ a: 1 })).toBe(false);
    });

    it('returns false for null and undefined', () => {
      expect(isIterable(null)).toBe(false);
      expect(isIterable(undefined)).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isIterable(123)).toBe(false);
    });
  });

  describe('isAsyncIterable', () => {
    it('returns true for async generators', () => {
      async function* gen() {
        yield 1;
        yield 2;
      }
      expect(isAsyncIterable(gen())).toBe(true);
    });

    it('returns false for regular generators', () => {
      function* gen() {
        yield 1;
      }
      expect(isAsyncIterable(gen())).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isAsyncIterable([1, 2, 3])).toBe(false);
    });

    it('returns false for null and undefined', () => {
      expect(isAsyncIterable(null)).toBe(false);
      expect(isAsyncIterable(undefined)).toBe(false);
    });

    it('returns false for plain objects', () => {
      expect(isAsyncIterable({ a: 1 })).toBe(false);
    });
  });

  describe('assertType', () => {
    it('does not throw for valid type', () => {
      expect(() => assertType('hello', (v): v is string => typeof v === 'string')).not.toThrow();
      expect(() => assertType(123, (v): v is number => typeof v === 'number')).not.toThrow();
    });

    it('throws for invalid type', () => {
      expect(() => assertType('hello', (v): v is number => typeof v === 'number')).toThrow(TypeError);
    });

    it('throws with custom message', () => {
      expect(() => assertType(123, (v): v is string => typeof v === 'string', 'Expected string')).toThrow(
        'Expected string'
      );
    });

    it('throws default message if none provided', () => {
      expect(() => assertType('hello', (v): v is number => typeof v === 'number')).toThrow('Type assertion failed');
    });

    it('works with complex type guards', () => {
      interface User {
        name: string;
        age: number;
      }
      const isUser = (v: unknown): v is User => {
        return (
          typeof v === 'object' &&
          v !== null &&
          'name' in v &&
          'age' in v &&
          typeof (v as any).name === 'string' &&
          typeof (v as any).age === 'number'
        );
      };

      expect(() => assertType({ name: 'John', age: 30 }, isUser)).not.toThrow();
      expect(() => assertType({ name: 'John' }, isUser)).toThrow();
    });
  });
});

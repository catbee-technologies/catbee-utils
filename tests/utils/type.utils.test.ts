import { isPrimitiveType, getTypeOf, isArrayOf, toStr, toNum, toBool, ensureType } from '../../src/type';

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
});

import {
  isObjEmpty,
  pick,
  omit,
  deepObjMerge,
  flattenObject,
  getValueByPath,
  setValueByPath,
  isEqual,
  filterObject,
  mapObject,
  deepFreeze,
  isObject,
  getAllPaths
} from '../../src/utils/obj.utils';

describe('ObjUtils', () => {
  describe('isObjEmpty', () => {
    it('returns true for empty objects', () => {
      expect(isObjEmpty({})).toBe(true);
    });
    it('returns false for non-empty objects', () => {
      expect(isObjEmpty({ a: 1 })).toBe(false);
    });
    it('returns false for non-object values', () => {
      expect(isObjEmpty(null as any)).toBe(false);
      expect(isObjEmpty(undefined as any)).toBe(false);
      expect(isObjEmpty('' as any)).toBe(false);
      expect(isObjEmpty(5 as any)).toBe(false);
    });
    it('returns false for arrays', () => {
      expect(isObjEmpty([])).toBe(true); // [] is typeof object and has no keys
      expect(isObjEmpty([1])).toBe(false);
    });
  });

  describe('pick', () => {
    it('picks only specified keys', () => {
      const o = { a: 1, b: 2, c: 3 };
      expect(pick(o, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });
    it('returns undefined for missing keys', () => {
      const o = { a: 1 };
      expect(pick(o, ['b' as any, 'a'])).toEqual({ b: undefined, a: 1 });
    });
    it('works with empty key list', () => {
      expect(pick({ foo: 'bar' }, [])).toEqual({});
    });
    it('works with empty object', () => {
      expect(pick({}, ['x'] as any)).toEqual({ x: undefined });
    });
  });

  describe('omit', () => {
    it('omits specified keys only', () => {
      const o = { a: 1, b: 2, c: 3 };
      expect(omit(o, ['b'])).toEqual({ a: 1, c: 3 });
    });
    it('returns full object if keys not found', () => {
      const o = { x: 1, y: 2 };
      expect(omit(o, ['z' as any])).toEqual({ x: 1, y: 2 });
    });
    it('works with empty key list', () => {
      expect(omit({ a: 1 }, [])).toEqual({ a: 1 });
    });
    it('returns empty object if all keys are omitted', () => {
      expect(omit({ x: 1, y: 2 }, ['x', 'y'])).toEqual({});
    });
    it('does not mutate source object', () => {
      const o = { a: 1 };
      omit(o, ['a']);
      expect(o).toEqual({ a: 1 });
    });
  });

  describe('deepObjMerge', () => {
    it('should return target when no sources provided', () => {
      const target = { a: 1 };
      const result = deepObjMerge(target);
      expect(result).toBe(target);
    });

    it('should overwrite primitives', () => {
      const result = deepObjMerge({ a: 1 }, { a: 2, b: 'x' });
      expect(result).toEqual({ a: 2, b: 'x' });
    });

    it('should replace arrays instead of merging', () => {
      const result = deepObjMerge({ arr: [1, 2] }, { arr: [3] });
      expect(result.arr).toEqual([3]);
    });

    it('should clone Date objects', () => {
      const d = new Date();
      const result: any = deepObjMerge({}, { d });
      expect(result.d).not.toBe(d);
      expect(result.d.getTime()).toBe(d.getTime());
    });

    it('should clone RegExp objects', () => {
      const r = /abc/gi;
      const result: any = deepObjMerge({}, { r });
      expect(result.r).not.toBe(r);
      expect(result.r.source).toBe('abc');
      expect(result.r.flags).toBe('gi');
    });

    it('should clone Sets', () => {
      const s = new Set([1, { x: 2 }]);
      const result: any = deepObjMerge({}, { s });
      expect(result.s).not.toBe(s);
      expect([...result.s][1]).not.toBe([...s][1]);
      expect([...result.s]).toEqual([1, { x: 2 }]);
    });

    it('should clone Maps', () => {
      const m = new Map<any, any>([
        ['a', 1],
        ['b', { x: 2 }]
      ]);
      const result: any = deepObjMerge({}, { m });
      expect(result.m).not.toBe(m);
      expect(result.m.get('b')).not.toBe(m.get('b'));
      expect(result.m.get('b')).toEqual({ x: 2 });
    });

    it('should clone ArrayBuffer', () => {
      const buf = new ArrayBuffer(8);
      const result: any = deepObjMerge({}, { buf });
      expect(result.buf).not.toBe(buf);
      expect(result.buf.byteLength).toBe(8);
    });

    it('should clone TypedArrays', () => {
      const arr = new Uint8Array([1, 2, 3]);
      const result: any = deepObjMerge({}, { arr });
      expect(result.arr).not.toBe(arr);
      expect([...result.arr]).toEqual([1, 2, 3]);
    });

    it('should keep functions by reference', () => {
      const fn = jest.fn();
      const result: any = deepObjMerge({}, { fn });
      expect(result.fn).toBe(fn);
    });

    it('should handle circular references', () => {
      const obj: any = { name: 'a' };
      obj.self = obj;

      const result: any = deepObjMerge({}, obj);
      expect(result.self).toBe(result);
      expect(result.self.name).toBe('a');
    });

    it('should deeply merge plain objects', () => {
      const t = { nested: { a: 1, b: 2 } };
      const s = { nested: { b: 3, c: 4 } };
      const result: any = deepObjMerge({}, t, s);
      expect(result.nested).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should preserve prototype', () => {
      class Foo {
        x = 1;
        get y() {
          return 42;
        }
      }
      const foo = new Foo();
      const result: any = deepObjMerge({}, { foo });
      expect(Object.getPrototypeOf(result.foo)).toBe(Foo.prototype);
      expect(result.foo.y).toBe(42);
    });

    it('should ignore undefined values in source', () => {
      const result = deepObjMerge({ a: 1 }, { a: undefined, b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should apply multiple sources sequentially', () => {
      const result = deepObjMerge({ a: 1 }, { a: 2 }, { a: 3, b: 4 });
      expect(result).toEqual({ a: 3, b: 4 });
    });
  });

  describe('flattenObject', () => {
    it('flattens nested objects using dot notation', () => {
      const o = { a: { b: 1, c: { d: 2 } }, e: 3 };
      expect(flattenObject(o)).toEqual({ 'a.b': 1, 'a.c.d': 2, e: 3 });
    });
    it('does not flatten arrays', () => {
      expect(flattenObject({ x: [1, 2], y: { z: 3 } })).toEqual({
        x: [1, 2],
        'y.z': 3
      });
    });
    it('returns empty object when passed {}', () => {
      expect(flattenObject({})).toEqual({});
    });
    it('handles keys at root and at nested', () => {
      expect(flattenObject({ a: 1, b: { c: 2 } })).toEqual({ a: 1, 'b.c': 2 });
    });
    it('works with deep nesting', () => {
      expect(flattenObject({ a: { b: { c: { d: 1 } } }, z: 2 })).toEqual({
        'a.b.c.d': 1,
        z: 2
      });
    });
  });

  describe('getValueByPath', () => {
    const example = {
      a: { b: { c: 5 } },
      arr: [{ x: 1 }, { x: 2 }],
      'k.dot': { y: 9 }
    };

    it('gets value by dot notation', () => {
      expect(getValueByPath(example, 'a.b.c')).toBe(5);
    });
    it('gets value from array index (using bracket)', () => {
      expect(getValueByPath(example, 'arr[1].x')).toBe(2);
      expect(getValueByPath(example, 'arr[0].x')).toBe(1);
    });
    it('returns undefined when path is missing', () => {
      expect(getValueByPath(example, 'a.b.q')).toBeUndefined();
      expect(getValueByPath(example, 'arr[2].x')).toBeUndefined();
    });
    it('returns undefined for empty, null or non-object root', () => {
      expect(getValueByPath(undefined as any, 'a.b')).toBeUndefined();
      expect(getValueByPath(null as any, 'a.b')).toBeUndefined();
      expect(getValueByPath('str' as any, 'a')).toBeUndefined();
    });
    it('works with root key (no dot)', () => {
      expect(getValueByPath(example, 'a')).toEqual({ b: { c: 5 } });
      expect(getValueByPath({ foo: 9 }, 'foo')).toBe(9);
    });
  });

  describe('setValueByPath', () => {
    it('sets value at nested path (dot/bracket)', () => {
      const obj: any = { a: { b: [{ c: 1 }] } };
      expect(setValueByPath(obj, 'a.b[0].c', 42)).toBe(obj);
      expect(obj.a.b[0].c).toBe(42);
    });
    it('creates intermediate objects/arrays as needed', () => {
      const obj: any = {};
      setValueByPath(obj, 'x.y[0].z', 5);
      expect(obj.x.y[0].z).toBe(5);
    });
    it('returns original object if not object', () => {
      expect(setValueByPath(null as any, 'a.b', 1)).toBe(null);
      expect(setValueByPath('str' as any, 'a', 1)).toBe('str');
    });
    it('handles empty path', () => {
      const obj = { a: 1 };
      expect(setValueByPath(obj, '', 2)).toBe(obj);
    });
  });

  describe('isEqual', () => {
    it('returns true for deeply equal objects', () => {
      expect(isEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })).toBe(true);
    });
    it('returns false for different objects', () => {
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });
    it('handles arrays and primitives', () => {
      expect(isEqual([1, 2], [1, 2])).toBe(true);
      expect(isEqual([1, 2], [2, 1])).toBe(false);
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual(1, '1')).toBe(false);
    });
    it('handles Date objects', () => {
      expect(isEqual(new Date('2020-01-01'), new Date('2020-01-01'))).toBe(true);
      expect(isEqual(new Date('2020-01-01'), new Date('2021-01-01'))).toBe(false);
    });
    it('returns false for null/undefined', () => {
      expect(isEqual(null, {})).toBe(false);
      expect(isEqual(undefined, {})).toBe(false);
      expect(isEqual(null, null)).toBe(true);
    });
  });

  describe('filterObject', () => {
    it('filters properties by predicate', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(filterObject(obj, v => v > 1)).toEqual({ b: 2, c: 3 });
    });
    it('returns empty object if none match', () => {
      expect(filterObject({ a: 1 }, () => false)).toEqual({});
    });
  });

  describe('mapObject', () => {
    it('maps values using mapFn', () => {
      const obj = { a: 1, b: 2 };
      expect(mapObject(obj, v => v * 10)).toEqual({ a: 10, b: 20 });
    });
    it('passes key and obj to mapFn', () => {
      const obj = { x: 2 };
      expect(mapObject(obj, (v, k, _o) => k + v)).toEqual({ x: 'x2' });
    });
  });

  describe('deepFreeze', () => {
    it('freezes object and nested objects', () => {
      const obj = { a: { b: 2 } };
      const frozen = deepFreeze(obj);
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.a)).toBe(true);
      // Should not throw when accessing
      expect(frozen.a.b).toBe(2);
    });
  });

  describe('isObject', () => {
    it('returns true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
    });
    it('returns false for arrays, null, non-objects', () => {
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject(1)).toBe(false);
      expect(isObject('x')).toBe(false);
    });
  });

  describe('getAllPaths', () => {
    it('returns all dot notation paths', () => {
      const obj = { a: { b: { c: 1 } }, d: 2 };
      expect(getAllPaths(obj).sort()).toEqual(['a', 'a.b', 'a.b.c', 'd'].sort());
    });
    it('returns empty array for non-object', () => {
      expect(getAllPaths(null as any)).toEqual([]);
      expect(getAllPaths(1 as any)).toEqual([]);
    });
  });
});

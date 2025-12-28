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
  getAllPaths,
  deepClone
} from '../../src/obj';

describe('ObjUtils', () => {
  describe('isObjEmpty', () => {
    it('returns true for empty objects', () => {
      expect(isObjEmpty({})).toBe(true);
      expect(isObjEmpty(Object.create(null))).toBe(true);
    });
    it('returns false for filled objects', () => {
      expect(isObjEmpty({ a: 1 })).toBe(false);
      expect(isObjEmpty({ 0: 'a' })).toBe(false);
    });
    it('returns false for invalid inputs', () => {
      expect(isObjEmpty(null as any)).toBe(false);
      expect(isObjEmpty(undefined as any)).toBe(false);
      expect(isObjEmpty('string' as any)).toBe(false);
      expect(isObjEmpty(42 as any)).toBe(false);
    });
    it('arrays are not considered empty objects', () => {
      expect(isObjEmpty([])).toBe(false);
      expect(isObjEmpty([1, 2])).toBe(false);
    });
  });

  describe('pick', () => {
    it('picks only specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const out = pick(obj, ['a', 'c']);
      expect(out).toEqual({ a: 1, c: 3 });
      expect(out).not.toBe(obj);
    });
    it('returns undefined for missing keys', () => {
      expect(pick({ a: 1 } as any, ['a', 'b'])).toEqual({ a: 1, b: undefined });
    });
    it('works with empty key list', () => {
      expect(pick({ a: 1 }, [])).toEqual({});
    });
    it('works with empty object', () => {
      expect(pick({}, ['x'] as any)).toEqual({ x: undefined });
    });
    it('symbol keys', () => {
      const symA = Symbol('a');
      const obj: any = { [symA]: 5, b: 2 };
      const out = pick(obj, [symA]);
      expect(out[symA]).toBe(5);
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
    it('symbol keys', () => {
      const sym = Symbol('secret');
      const obj: any = { a: 1, [sym]: 9 };
      const out = omit(obj, [sym]);
      expect(out[sym]).toBeUndefined();
      expect(out.a).toBe(1);
    });
    it('omit all', () => {
      expect(omit({ x: 1, y: 2 }, ['x', 'y'])).toEqual({});
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
    it('deepObjMerge should preserve circular reference when merging into empty target', () => {
      const obj: any = { name: 'Hari' };
      obj.self = obj;

      const result = deepObjMerge({}, obj) as any;
      expect(result.self).toBe(result); // circular preserved to root
      expect(result.name).toBe('Hari'); // property copied
    });
    it('deepObjMerge should preserve nested circular references', () => {
      const a: any = { id: 1 };
      const b: any = { id: 2, ref: a };
      a.loop = b; // circular between a <-> b
      b.loop = b; // self circular

      const result = deepObjMerge({}, { a, b }) as any;

      expect(result.a.loop).toBe(result.b.loop); // cross circular maintained
      expect(result.b.loop).toBe(result.b); // self circular maintained
      expect(result.a.id).toBe(1);
      expect(result.b.id).toBe(2);
    });
    it('deepObjMerge should not break circular references when multiple sources are merged', () => {
      const x: any = { value: 10 };
      const y: any = { value: 20 };
      x.loop = x;
      y.loop = y;

      const result = deepObjMerge({}, x, y) as any;

      expect(result.loop).toBe(result); // last source circular preserved
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
    it('should not mutate source objects', () => {
      const s1 = { a: 1, nested: { x: 10 } };
      const s2 = { b: 2, nested: { y: 20 } };
      deepObjMerge({}, s1, s2);
      expect(s1).toEqual({ a: 1, nested: { x: 10 } });
      expect(s2).toEqual({ b: 2, nested: { y: 20 } });
    });
    it('should handle complex nested structures with circular references', () => {
      const a: any = { id: 1 };
      const b: any = { id: 2, refA: a };
      a.refB = b; // circular reference
      const c = { extra: 3 };
      const obj = { a, b, c, arr: [a, b] };
      const result = deepObjMerge({}, obj) as any;
      expect(result.a).not.toBe(a);
      expect(result.b).not.toBe(b);
      expect(result.a.refB).toBe(result.b);
      expect(result.b.refA).toBe(result.a);
      expect(result.c).toEqual({ extra: 3 });
      expect(result.arr[0]).toEqual(result.a);
      expect(result.arr[1]).toEqual(result.b);
    });
    it('should clone RegExp objects', () => {
      const regex = /test/gi;
      const result = deepObjMerge({}, { regex }) as any;
      expect(result.regex).not.toBe(regex);
      expect(result.regex.source).toBe(regex.source);
      expect(result.regex.flags).toBe(regex.flags);
    });
    it('should handle null and undefined values', () => {
      const result = deepObjMerge({ a: null }, { b: undefined, c: 3 }) as any;
      expect(result).toEqual({ a: null, c: 3 });
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
      expect(setValueByPath(obj, 'a.b[0].c', 42)).toEqual({ a: { b: [{ c: 42 }] } });
      expect(obj.a.b[0].c).toBe(1);
    });
    it('creates intermediate objects/arrays as needed', () => {
      const obj: any = {};
      expect(setValueByPath(obj, 'x.y[0].z', 5)).toEqual({ x: { y: [{ z: 5 }] } });
      expect(obj.x).toBeUndefined();
    });
    it('returns original object if not object', () => {
      expect(setValueByPath(null as any, 'a.b', 1)).toBe(null);
      expect(setValueByPath('str' as any, 'a', 1)).toBe('str');
    });
    it('handles empty path', () => {
      const obj = { a: 1 };
      expect(setValueByPath(obj, '', 2)).toEqual({ a: 1 });
      expect(obj.a).toBe(1);
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
      expect(isObject(Object.create(null))).toBe(true);
    });
    it('returns false for arrays, null, non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('x')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(() => {})).toBe(false); // functions are not typeof object
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

  describe('deepClone', () => {
    it('deeply clones objects', () => {
      const original = { a: { b: 2 }, c: [1, 2] };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.a).not.toBe(original.a);
      expect(cloned.c).not.toBe(original.c);
    });
    it('preserves functions and symbols by reference', () => {
      const fn = () => 42;
      const sym = Symbol('test');
      const original = { f: fn, s: sym };
      const cloned = deepClone(original);
      expect(cloned.f).toBe(fn);
      expect(cloned.s).toBe(sym);
    });
    it('handles circular references', () => {
      const obj: any = { name: 'circle' };
      obj.self = obj;
      const cloned = deepClone(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.name).toBe('circle');
      expect(cloned.self).toBe(cloned);
    });
    it('dates remain dates', () => {
      const d = new Date();
      const out = deepClone({ d } as any);
      expect(out.d instanceof Date).toBe(true);
      expect(out.d).not.toBe(d);
      expect(out.d.getTime()).toBe(d.getTime());
    });
    it('nested deep clone', () => {
      const obj: any = { a: { b: { c: { d: 1 } } } };
      const out = deepClone(obj);
      expect(out.a.b.c).not.toBe(obj.a.b.c);
      expect(out.a.b.c.d).toBe(1);
    });
    it('function references are preserved', () => {
      const fn = () => {};
      const obj: any = { a: fn };
      const out = deepClone(obj);
      expect(out.a).toBe(fn);
    });
    it('clones arrays correctly', () => {
      const arr = [1, { x: 2 }, [3]];
      const out = deepClone(arr);
      expect(out).toEqual(arr);
      expect(out).not.toBe(arr);
      expect(out[1]).not.toBe(arr[1]);
      expect(out[2]).not.toBe(arr[2]);
    });
    it('handles Map and Set', () => {
      const map = new Map();
      map.set('a', 1);
      map.set('b', { x: 2 });

      const set = new Set();
      set.add(1);
      set.add({ y: 3 });

      const obj: any = { map, set };
      const out = deepClone(obj);

      expect(out.map).not.toBe(map);
      expect(out.map.get('a')).toBe(1);
      expect(out.map.get('b')).toEqual({ x: 2 });
      expect(out.map.get('b')).not.toBe(map.get('b'));

      expect(out.set).not.toBe(set);
      expect(out.set.has(1)).toBe(true);
      expect(out.set.has({ y: 3 })).toBe(false); // different reference
      const found = [...out.set].find((v: any) => typeof v === 'object' && v.y === 3);
      expect(found).toEqual({ y: 3 });
      expect(found).not.toBe([...set][1]);
    });
    it('handles ArrayBuffer and TypedArrays', () => {
      const buffer = new ArrayBuffer(8);
      const uint8 = new Uint8Array([1, 2, 3]);

      const obj: any = { buffer, uint8 };
      const out = deepClone(obj);

      expect(out.buffer).not.toBe(buffer);
      expect(out.buffer.byteLength).toBe(8);

      expect(out.uint8).not.toBe(uint8);
      expect([...out.uint8]).toEqual([1, 2, 3]);
    });
    it('preserves prototype chain', () => {
      class Person {
        constructor(public name: string) {}
        greet() {
          return `Hello, ${this.name}`;
        }
      }

      const p = new Person('Alice');
      const obj: any = { person: p };
      const out = deepClone(obj);

      expect(out.person).not.toBe(p);
      expect(out.person.name).toBe('Alice');
      expect(out.person.greet()).toBe('Hello, Alice');
      expect(Object.getPrototypeOf(out.person)).toBe(Person.prototype);
    });
    it('handles complex nested structures with circular references', () => {
      const a: any = { id: 1 };
      const b: any = { id: 2, refA: a };
      a.refB = b; // circular reference

      const obj = { a, b, arr: [a, b] };
      const out = deepClone(obj);

      expect(out.a).not.toBe(a);
      expect(out.b).not.toBe(b);
      expect(out.a.refB).toBe(out.b);
      expect(out.b.refA).toBe(out.a);
      expect(out.arr[0]).toBe(out.a);
      expect(out.arr[1]).toBe(out.b);
    });
    it('clones RegExp objects', () => {
      const regex = /test/gi;
      const obj: any = { regex };
      const out = deepClone(obj);
      expect(out.regex).not.toBe(regex);
      expect(out.regex.source).toBe('test');
      expect(out.regex.flags).toBe('gi');
    });
    it('handles null and undefined values', () => {
      const obj: any = { a: null, b: undefined, c: 3 };
      const out = deepClone(obj);
      expect(out).toEqual(obj);
      expect(out).not.toBe(obj);
    });
    it('clones nested arrays of objects', () => {
      const obj: any = { arr: [{ x: 1 }, { y: 2 }] };
      const out = deepClone(obj);
      expect(out.arr).not.toBe(obj.arr);
      expect(out.arr[0]).not.toBe(obj.arr[0]);
      expect(out.arr[1]).not.toBe(obj.arr[1]);
      expect(out).toEqual(obj);
    });
    it('clones objects with symbol keys', () => {
      const sym = Symbol('key');
      const obj: any = { [sym]: 42, a: 1 };
      const out = deepClone(obj);
      expect(out).not.toBe(obj);
      expect(out[sym]).toBe(42);
      expect(out.a).toBe(1);
    });
    it('clones objects with non-enumerable properties', () => {
      const obj: any = {};
      Object.defineProperty(obj, 'hidden', {
        value: 'secret',
        enumerable: false,
        writable: true,
        configurable: true
      });
      const out = deepClone(obj);
      expect(out).not.toBe(obj);
      expect(Object.getOwnPropertyDescriptor(out, 'hidden')).toEqual(Object.getOwnPropertyDescriptor(obj, 'hidden'));
    });
    it('clones objects with getters/setters', () => {
      const obj: any = {
        _a: 1,
        get a() {
          return this._a;
        },
        set a(val) {
          this._a = val;
        }
      };
      const out = deepClone(obj);
      expect(out).not.toBe(obj);
      expect(out.a).toBe(1);
      out.a = 5;
      expect(out.a).toBe(5);
      expect(obj.a).toBe(1);
    });
    it('clones deeply nested mixed structures', () => {
      const obj: any = {
        level1: {
          level2: [{ level3a: new Date('2020-01-01') }, { level3b: /abc/gi }],
          level2b: new Set([1, 2, 3])
        },
        arr: [new Map([['key', 'value']]), { nested: { num: 42 } }]
      };
      const out = deepClone(obj);
      expect(out).not.toBe(obj);
      expect(out.level1).not.toBe(obj.level1);
      expect(out.level1.level2).not.toBe(obj.level1.level2);
      expect(out.level1.level2[0].level3a).not.toBe(obj.level1.level2[0].level3a);
      expect(out.level1.level2[0].level3a.getTime()).toBe(obj.level1.level2[0].level3a.getTime());
      expect(out.level1.level2[1].level3b).not.toBe(obj.level1.level2[1].level3b);
      expect(out.level1.level2[1].level3b.source).toBe('abc');
      expect(out.level1.level2[1].level3b.flags).toBe('gi');
      expect(out.level1.level2b).not.toBe(obj.level1.level2b);
      expect([...out.level1.level2b]).toEqual([1, 2, 3]);
      expect(out.arr).not.toBe(obj.arr);
      expect(out.arr[0]).not.toBe(obj.arr[0]);
      expect(out.arr[0].get('key')).toBe('value');
      expect(out.arr[1].nested).not.toBe(obj.arr[1].nested);
      expect(out.arr[1].nested.num).toBe(42);
    });
  });
});

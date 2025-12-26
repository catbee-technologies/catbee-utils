import {
  chunk,
  unique,
  flattenDeep,
  random,
  groupBy,
  shuffle,
  pluck,
  difference,
  intersect,
  mergeSort,
  zip,
  partition,
  range,
  take,
  takeWhile,
  compact,
  countBy
} from '../../src/array';

jest.mock('../../src/obj', () => ({
  getValueByPath: (obj: any, path: string) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj)
}));

describe('ArrayUtils', () => {
  describe('chunk', () => {
    it('chunks array correctly', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
    it('returns empty for empty array', () => {
      expect(chunk([], 3)).toEqual([]);
    });
    it('throws for non-array', () => {
      // @ts-expect-error
      expect(() => chunk({}, 2)).toThrow('Expected an array');
    });
    it('throws for non-positive size', () => {
      expect(() => chunk([1, 2], 0)).toThrow('Chunk size must be a positive integer');
      expect(() => chunk([1, 2], -1)).toThrow('Chunk size must be a positive integer');
      expect(() => chunk([1, 2], 1.2)).toThrow('Chunk size must be a positive integer');
    });
  });

  describe('unique', () => {
    it('removes duplicates', () => {
      expect(unique([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4]);
    });
    it('returns empty for empty input', () => {
      expect(unique([])).toEqual([]);
    });
    it('removes duplicates by keyFn', () => {
      const arr = [{ a: 1 }, { a: 2 }, { a: 1 }];
      expect(unique(arr, x => x.a)).toEqual([{ a: 1 }, { a: 2 }]);
    });
  });

  describe('flattenDeep', () => {
    it('flattens deeply', () => {
      expect(flattenDeep([1, [2, [3, [4]], 5]])).toEqual([1, 2, 3, 4, 5]);
      expect(flattenDeep([])).toEqual([]);
    });
    it('returns [] for non-array', () => {
      // @ts-expect-error
      expect(flattenDeep(null)).toEqual([]);
    });
  });

  describe('random', () => {
    it('returns a value from array or undefined', () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.49);
      expect(random([10, 20, 30])).toBe(20);
      expect(random([])).toBeUndefined();
      // @ts-expect-error
      expect(random(null)).toBeUndefined();
      jest.spyOn(global.Math, 'random').mockRestore();
    });
  });

  describe('groupBy', () => {
    it('groups by property key', () => {
      const arr = [
        { type: 'a', x: 1 },
        { type: 'b', x: 2 },
        { type: 'a', x: 3 }
      ];
      expect(groupBy(arr, 'type')).toEqual({
        a: [
          { type: 'a', x: 1 },
          { type: 'a', x: 3 }
        ],
        b: [{ type: 'b', x: 2 }]
      });
    });
    it('groups by keyFn', () => {
      const arr = ['a', 'aa', 'b'];
      expect(groupBy(arr, x => x.length)).toEqual({
        1: ['a', 'b'],
        2: ['aa']
      });
    });
    it('returns empty object for non-array/empty', () => {
      // @ts-expect-error
      expect(groupBy(null, 'x')).toEqual({});
      expect(groupBy([], 'x')).toEqual({});
    });
  });

  describe('shuffle', () => {
    it('shuffles array (not mutating original)', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result.sort()).toEqual(arr);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
      // Note: randomness prevents strict equal, but sort should match input.
    });
    it('throws if input is not an array', () => {
      // @ts-expect-error
      expect(() => shuffle(null)).toThrow('Expected an array');
    });
  });

  describe('pluck', () => {
    it('plucks values by key', () => {
      expect(pluck([{ a: 1 }, { a: 2 }, { a: 3 }], 'a')).toEqual([1, 2, 3]);
    });
    it('returns empty for non-array', () => {
      // @ts-expect-error
      expect(pluck(null, 'a')).toEqual([]);
    });
  });

  describe('difference', () => {
    it('returns items in a not in b', () => {
      expect(difference([1, 2, 3], [2, 4])).toEqual([1, 3]);
    });
    it('returns [] for non-arrays', () => {
      // @ts-expect-error
      expect(difference(null, [1])).toEqual([]);
      // @ts-expect-error
      expect(difference([1], null)).toEqual([]);
    });
  });

  describe('intersect', () => {
    it('returns common items', () => {
      expect(intersect([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });
    it('returns [] for non-arrays', () => {
      // @ts-expect-error
      expect(intersect(null, [1])).toEqual([]);
      // @ts-expect-error
      expect(intersect([1], null)).toEqual([]);
    });
  });

  describe('mergeSort', () => {
    const arrObjs = [
      { name: 'Orange', info: { val: 2 } },
      { name: 'Apple', info: { val: 3 } },
      { name: 'Banana', info: { val: 1 } },
      { name: 'Kiwi', info: {} },
      { name: 'Dragonfruit', info: null }
    ];
    it('sorts objects by nested key asc', () => {
      const sorted = mergeSort(arrObjs, 'info.val', 'asc');
      expect(sorted.map(x => x.name)).toEqual(['Banana', 'Orange', 'Apple', 'Kiwi', 'Dragonfruit']);
    });
    it('sorts by nested key desc', () => {
      const sorted = mergeSort(arrObjs, 'info.val', 'desc');
      expect(sorted.map(x => x.name)).toEqual(['Kiwi', 'Dragonfruit', 'Apple', 'Orange', 'Banana']);
    });
    it('uses key function', () => {
      const arr = [{ v: 3 }, { v: 1 }, { v: 2 }];
      expect(mergeSort(arr, x => x.v, 'asc')).toEqual([{ v: 1 }, { v: 2 }, { v: 3 }]);
    });
    it('handles array of length 1', () => {
      expect(mergeSort([{ a: 2 }], 'a')).toEqual([{ a: 2 }]);
    });
    it('throws for non-array', () => {
      // @ts-expect-error
      expect(() => mergeSort(null, 'x')).toThrow('Expected array');
    });
  });

  describe('zip', () => {
    it('zips arrays together', () => {
      expect(zip([1, 2], ['a', 'b'] as any)).toEqual([
        [1, 'a'],
        [2, 'b']
      ]);
      expect(zip([1, 2, 3], ['a'] as any)).toEqual([[1, 'a']]);
      expect(zip()).toEqual([]);
      expect(() => zip([1], null as any)).toThrow('All arguments must be arrays');
    });
  });

  describe('partition', () => {
    it('splits array by predicate', () => {
      expect(partition([1, 2, 3, 4], x => x % 2 === 0)).toEqual([
        [2, 4],
        [1, 3]
      ]);
    });
    it('returns [[], []] for non-array', () => {
      // @ts-expect-error
      expect(partition(null, () => true)).toEqual([[], []]);
    });
  });

  describe('range', () => {
    it('generates a range of numbers', () => {
      expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
      expect(range(5, 0, -2)).toEqual([5, 3, 1]);
      expect(range(0, 0)).toEqual([]);
    });
    it('throws for invalid args', () => {
      expect(() => range(NaN, 1)).toThrow();
      expect(() => range(0, 1, 0)).toThrow();
    });
  });

  describe('take', () => {
    it('returns first n elements', () => {
      expect(take([1, 2, 3], 2)).toEqual([1, 2]);
      expect(take([1, 2, 3], 0)).toEqual([]);
      expect(take([1, 2, 3])).toEqual([1]);
      expect(take([], 2)).toEqual([]);
      // @ts-expect-error
      expect(take(null, 2)).toEqual([]);
    });
  });

  describe('takeWhile', () => {
    it('takes elements while predicate is true', () => {
      expect(takeWhile([1, 2, 3, 0, 4], x => x > 0)).toEqual([1, 2, 3]);
      expect(takeWhile([1, 2, 3], () => false)).toEqual([]);
      // @ts-expect-error
      expect(takeWhile(null, () => true)).toEqual([]);
    });
  });

  describe('compact', () => {
    it('removes falsy values', () => {
      expect(compact([0, 1, false, 2, '', 3, null, undefined])).toEqual([1, 2, 3]);
      expect(compact([])).toEqual([]);
      // @ts-expect-error
      expect(compact(null)).toEqual([]);
    });
  });

  describe('countBy', () => {
    it('counts elements by key function', () => {
      expect(countBy(['a', 'b', 'a'], x => x)).toEqual({ a: 2, b: 1 });
      expect(countBy([1, 2, 3, 2], x => (x % 2 === 0 ? 'even' : 'odd'))).toEqual({
        odd: 2,
        even: 2
      });
    });
    it('returns {} for non-array', () => {
      // @ts-expect-error
      expect(countBy(null, () => 'x')).toEqual({});
    });
  });
});

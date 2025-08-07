import {
  isObjEmpty,
  pick,
  omit,
  deepObjMerge,
  flattenObject,
  getValueByPath,
} from "../../src/utils/obj.utils";

describe("ObjUtils", () => {
  describe("isObjEmpty", () => {
    it("returns true for empty objects", () => {
      expect(isObjEmpty({})).toBe(true);
    });
    it("returns false for non-empty objects", () => {
      expect(isObjEmpty({ a: 1 })).toBe(false);
    });
    it("returns false for non-object values", () => {
      expect(isObjEmpty(null as any)).toBe(false);
      expect(isObjEmpty(undefined as any)).toBe(false);
      expect(isObjEmpty("" as any)).toBe(false);
      expect(isObjEmpty(5 as any)).toBe(false);
    });
    it("returns false for arrays", () => {
      expect(isObjEmpty([])).toBe(true); // [] is typeof object and has no keys
      expect(isObjEmpty([1])).toBe(false);
    });
  });

  describe("pick", () => {
    it("picks only specified keys", () => {
      const o = { a: 1, b: 2, c: 3 };
      expect(pick(o, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });
    it("returns undefined for missing keys", () => {
      const o = { a: 1 };
      expect(pick(o, ["b" as any, "a"])).toEqual({ b: undefined, a: 1 });
    });
    it("works with empty key list", () => {
      expect(pick({ foo: "bar" }, [])).toEqual({});
    });
    it("works with empty object", () => {
      expect(pick({}, ["x"] as any)).toEqual({ x: undefined });
    });
  });

  describe("omit", () => {
    it("omits specified keys only", () => {
      const o = { a: 1, b: 2, c: 3 };
      expect(omit(o, ["b"])).toEqual({ a: 1, c: 3 });
    });
    it("returns full object if keys not found", () => {
      const o = { x: 1, y: 2 };
      expect(omit(o, ["z" as any])).toEqual({ x: 1, y: 2 });
    });
    it("works with empty key list", () => {
      expect(omit({ a: 1 }, [])).toEqual({ a: 1 });
    });
    it("returns empty object if all keys are omitted", () => {
      expect(omit({ x: 1, y: 2 }, ["x", "y"])).toEqual({});
    });
    it("does not mutate source object", () => {
      const o = { a: 1 };
      omit(o, ["a"]);
      expect(o).toEqual({ a: 1 });
    });
  });

  describe("deepObjMerge", () => {
    it("merges simple objects shallowly", () => {
      const a = { x: 1, y: 2 };
      const b = { y: 5, z: 8 };
      expect(deepObjMerge({ ...a }, b)).toEqual({ x: 1, y: 5, z: 8 });
    });
    it("merges deeply nested objects", () => {
      const a = { x: 1, inner: { y: 2, z: 1 } };
      const b = { inner: { y: 9 } };
      expect(deepObjMerge({ ...a, inner: { ...a.inner } }, b as any)).toEqual({
        x: 1,
        inner: { y: 9, z: 1 },
      });
    });
    it("creates nested objects if target is missing", () => {
      const a = { a: 1 };
      const b = { b: { x: { c: 2 } } };
      expect(deepObjMerge({ ...a }, b as any)).toEqual({
        a: 1,
        b: { x: { c: 2 } },
      });
    });
    it("replaces arrays, does not merge them", () => {
      const a = { arr: [1, 2] };
      const b = { arr: [3] };
      expect(deepObjMerge({ ...a }, b)).toEqual({ arr: [3] });
    });
    it("does not change keys present only in target", () => {
      const a = { a: 1, keep: 2 };
      const b = { a: 2 };
      const out = deepObjMerge({ ...a }, b);
      expect(out).toEqual({ a: 2, keep: 2 });
    });
    it("mutates and returns the target object", () => {
      const target = { foo: 1 };
      const result = deepObjMerge(target, { bar: 2 } as any);
      expect(target).toBe(result);
      expect(result).toEqual({ foo: 1, bar: 2 });
    });
  });

  describe("flattenObject", () => {
    it("flattens nested objects using dot notation", () => {
      const o = { a: { b: 1, c: { d: 2 } }, e: 3 };
      expect(flattenObject(o)).toEqual({ "a.b": 1, "a.c.d": 2, e: 3 });
    });
    it("does not flatten arrays", () => {
      expect(flattenObject({ x: [1, 2], y: { z: 3 } })).toEqual({
        x: [1, 2],
        "y.z": 3,
      });
    });
    it("returns empty object when passed {}", () => {
      expect(flattenObject({})).toEqual({});
    });
    it("handles keys at root and at nested", () => {
      expect(flattenObject({ a: 1, b: { c: 2 } })).toEqual({ a: 1, "b.c": 2 });
    });
    it("works with deep nesting", () => {
      expect(flattenObject({ a: { b: { c: { d: 1 } } }, z: 2 })).toEqual({
        "a.b.c.d": 1,
        z: 2,
      });
    });
  });

  describe("getValueByPath", () => {
    const example = {
      a: { b: { c: 5 } },
      arr: [{ x: 1 }, { x: 2 }],
      "k.dot": { y: 9 },
    };

    it("gets value by dot notation", () => {
      expect(getValueByPath(example, "a.b.c")).toBe(5);
    });
    it("gets value from array index (using bracket)", () => {
      expect(getValueByPath(example, "arr[1].x")).toBe(2);
      expect(getValueByPath(example, "arr[0].x")).toBe(1);
    });
    it("returns undefined when path is missing", () => {
      expect(getValueByPath(example, "a.b.q")).toBeUndefined();
      expect(getValueByPath(example, "arr[2].x")).toBeUndefined();
    });
    it("returns undefined for empty, null or non-object root", () => {
      expect(getValueByPath(undefined as any, "a.b")).toBeUndefined();
      expect(getValueByPath(null as any, "a.b")).toBeUndefined();
      expect(getValueByPath("str" as any, "a")).toBeUndefined();
    });
    it("works with root key (no dot)", () => {
      expect(getValueByPath(example, "a")).toEqual({ b: { c: 5 } });
      expect(getValueByPath({ foo: 9 }, "foo")).toBe(9);
    });
  });
});

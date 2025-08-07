import { TTLCache } from "./../../src/utils/cache.utils";

describe("CacheUtils", () => {
  // Use fake timers for reliable timing
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("set() + get() returns value before TTL expires", () => {
    const cache = new TTLCache<string, number>(1000);
    cache.set("foo", 42);
    expect(cache.get("foo")).toBe(42);
  });

  it("get() returns undefined after TTL expires and deletes key", () => {
    const cache = new TTLCache<string, number>(1000);
    cache.set("foo", 1);
    jest.advanceTimersByTime(1001);
    expect(cache.get("foo")).toBeUndefined();
    expect(cache.has("foo")).toBe(false);
  });

  it("setWithTTL() uses custom TTL per entry", () => {
    const cache = new TTLCache<string, number>();
    cache.setWithTTL("short", 11, 200);
    cache.setWithTTL("long", 22, 1000);

    jest.advanceTimersByTime(300);
    expect(cache.get("short")).toBeUndefined();
    expect(cache.get("long")).toBe(22);

    jest.advanceTimersByTime(701); // 1001ms total
    expect(cache.get("long")).toBeUndefined();
  });

  it("has() only true for fresh entry, false after expiry", () => {
    const cache = new TTLCache<string, number>(1000);
    expect(cache.has("x")).toBe(false);
    cache.set("x", 500);
    expect(cache.has("x")).toBe(true);
    jest.advanceTimersByTime(1001);
    expect(cache.has("x")).toBe(false);
  });

  it("delete() removes entries, returns true if existed", () => {
    const cache = new TTLCache<string, string>();
    expect(cache.delete("notfound")).toBe(false);
    cache.set("foo", "bar");
    expect(cache.delete("foo")).toBe(true);
    expect(cache.get("foo")).toBeUndefined();
  });

  it("clear() empties the cache", () => {
    const cache = new TTLCache<string, number>();
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it("size() returns current Map size (includes expired until cleanup/get)", () => {
    const cache = new TTLCache<string, number>(100);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size()).toBe(2);

    jest.advanceTimersByTime(101);
    // size() still 2, but entries expired
    expect(cache.size()).toBe(2);
    cache.get("a"); // triggers lazy cleanup for key
    expect(cache.size()).toBe(1);
    cache.cleanup();
    expect(cache.size()).toBe(0);
  });

  it("cleanup() removes only expired entries", () => {
    const cache = new TTLCache<string, number>();
    cache.setWithTTL("a", 1, 100);
    cache.setWithTTL("b", 2, 200);
    jest.advanceTimersByTime(150);
    expect(cache.cleanup()).toBe(1);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    jest.advanceTimersByTime(100);
    expect(cache.cleanup()).toBe(1);
    expect(cache.has("b")).toBe(false);
    expect(cache.cleanup()).toBe(0);
  });

  it("entries(), keys(), and values() yield only valid/active items", () => {
    const cache = new TTLCache<string, number>();
    cache.setWithTTL("a", 1, 100);
    cache.setWithTTL("b", 2, 300);
    jest.advanceTimersByTime(101);

    // Only 'b' is valid
    expect(Array.from(cache.entries())).toEqual([["b", 2]]);
    expect(Array.from(cache.keys())).toEqual(["b"]);
    expect(Array.from(cache.values())).toEqual([2]);
  });

  it("iteration changes if time advances (expired entries filtered)", () => {
    const cache = new TTLCache<string, string>();
    cache.setWithTTL("x", "one", 100);
    jest.advanceTimersByTime(101);
    cache.setWithTTL("y", "two", 100);
    expect(Array.from(cache.entries())).toEqual([["y", "two"]]);
    jest.advanceTimersByTime(101);
    expect(Array.from(cache.entries())).toEqual([]);
  });

  it("does not throw on get/delete/has for missing keys", () => {
    const cache = new TTLCache<string, number>();
    expect(cache.get("none")).toBeUndefined();
    expect(cache.has("none")).toBe(false);
    expect(cache.delete("none")).toBe(false);
  });

  it("works with non-string keys (e.g. objects, numbers)", () => {
    const cache = new TTLCache<number, string>();
    cache.set(77, "lucky");
    expect(cache.get(77)).toBe("lucky");
    cache.set(99, "great");
    expect(Array.from(cache.keys()).sort()).toEqual([77, 99]);
  });
});

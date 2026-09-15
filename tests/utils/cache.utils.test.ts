import { TTLCache } from '../../src/cache';

describe('TTLCache', () => {
  // Use a fake timer to control time progression
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      const cache = new TTLCache<string, number>();
      cache.set('key1', 123);
      expect(cache.get('key1')).toBe(123);
    });

    it('should return undefined for missing keys', () => {
      const cache = new TTLCache<string, number>();
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists with has()', () => {
      const cache = new TTLCache<string, number>();
      cache.set('key1', 123);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      const cache = new TTLCache<string, number>();
      cache.set('key1', 123);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('key1')).toBe(false); // Already deleted
    });

    it('should clear all entries', () => {
      const cache = new TTLCache<string, number>();
      cache.set('key1', 123);
      cache.set('key2', 456);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('TTL Expiration', () => {
    it('should expire entries after TTL', () => {
      const ttl = 1000; // 1 second
      const cache = new TTLCache<string, number>({ ttlMs: ttl });

      cache.set('key1', 123);
      expect(cache.get('key1')).toBe(123);

      // Advance time just before expiration
      jest.advanceTimersByTime(ttl - 1);
      expect(cache.get('key1')).toBe(123);

      // Advance time to expiration
      jest.advanceTimersByTime(2);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should allow custom TTL per entry', () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });

      cache.set('short', 123); // Default TTL (1s)
      cache.setWithTTL('long', 456, 5000); // 5s TTL

      // After 1s, short key expires but long key remains
      jest.advanceTimersByTime(1000 + 1);
      expect(cache.get('short')).toBeUndefined();
      expect(cache.get('long')).toBe(456);

      // After 5s total, both keys have expired
      jest.advanceTimersByTime(4000);
      expect(cache.get('long')).toBeUndefined();
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used items when max size is reached', () => {
      // Cache with max size of 3
      const cache = new TTLCache<string, number>({ maxSize: 3 });

      // Add 3 items (fills the cache)
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add a 4th item - should evict the least recently used (key2)
      cache.set('key4', 4);

      // key1, key3, and key4 should remain; key2 should be evicted
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    it('should evict expired items first before LRU items', () => {
      // Cache with max size of 3 and TTL of 1s
      const cache = new TTLCache<string, number>({ maxSize: 3, ttlMs: 1000 });

      cache.set('key1', 1);
      jest.advanceTimersByTime(1001); // Make key1 expire

      // Add three more items (key2, key3 and key4) - cache is full now
      cache.set('key2', 2);
      cache.set('key3', 3);
      cache.set('key4', 4);
      expect(cache.has('key1')).toBe(false); // Expired and evicted
      // Adding key5 should evict expired key1 first
      cache.set('key5', 5);

      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.has('key5')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    it('should update lastAccessed time when setting a key', () => {
      // Cache with max size of 3
      const cache = new TTLCache<string, number>({ maxSize: 3 });

      // Add 3 items
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      // Update key1 (making it most recently used)
      cache.set('key1', 11);

      // Add a 4th item - should evict key2 as least recently used
      cache.set('key4', 4);

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should correctly track LRU order with multiple operations', () => {
      // Cache with max size of 3
      const cache = new TTLCache<string, number>({ maxSize: 3 });

      // Fill the cache
      cache.set('A', 1); // Oldest
      cache.set('B', 2); // Middle
      cache.set('C', 3); // Newest

      // Access B, making A the least recently used
      cache.get('B');

      // Add D, which should evict A (the least recently used)
      cache.set('D', 4);

      expect(cache.has('A')).toBe(false);
      expect(cache.has('B')).toBe(true);
      expect(cache.has('C')).toBe(true);
      expect(cache.has('D')).toBe(true);

      // Now C is least recently used (B was accessed, D was just added)
      // Access B again
      cache.get('B');

      // Add E, which should evict C
      cache.set('E', 5);

      expect(cache.has('B')).toBe(true);
      expect(cache.has('C')).toBe(false);
      expect(cache.has('D')).toBe(true);
      expect(cache.has('E')).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove expired items with cleanup()', () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });

      cache.set('key1', 1);
      cache.set('key2', 2);

      // Advance time past expiration
      jest.advanceTimersByTime(1500);

      // Both items should be expired but still in the cache (lazy cleanup)
      expect(cache.size()).toBe(2);

      // Manual cleanup should remove expired items
      const removed = cache.cleanup();
      expect(removed).toBe(2);
      expect(cache.size()).toBe(0);
    });

    it('should run auto-cleanup at specified intervals', () => {
      const cache = new TTLCache<string, number>({
        ttlMs: 1000,
        autoCleanupMs: 2000 // Cleanup every 2s
      });

      cache.set('key1', 1);

      // Advance time past item expiration but before auto-cleanup
      jest.advanceTimersByTime(1500);
      expect(cache.size()).toBe(1);

      // Advance to auto-cleanup time
      jest.advanceTimersByTime(500);
      expect(cache.size()).toBe(0);

      // Clean up the interval
      cache.destroy();
    });
  });

  describe('Iterators', () => {
    it('should iterate over valid entries only', () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });

      cache.set('valid1', 1);
      cache.set('valid2', 2);
      cache.setWithTTL('expired', 3, 500);

      // Advance time to expire one item
      jest.advanceTimersByTime(750);

      const entries = [...cache.entries()];
      expect(entries.length).toBe(2);
      expect(entries).toContainEqual(['valid1', 1]);
      expect(entries).toContainEqual(['valid2', 2]);
    });

    it('should get cache statistics', () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000, maxSize: 10 });

      cache.set('valid1', 1);
      cache.set('valid2', 2);
      cache.setWithTTL('expired', 3, 500);

      // Advance time to expire one item
      jest.advanceTimersByTime(750);

      const stats = cache.stats();
      expect(stats.size).toBe(3);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(1);
      expect(stats.maxSize).toBe(10);
    });
  });

  describe('Async Operations', () => {
    it('should getOrCompute values', async () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });
      const producer = jest.fn().mockResolvedValue(42);

      // First call should compute
      const result1 = await cache.getOrCompute('key', producer);
      expect(result1).toBe(42);
      expect(producer).toHaveBeenCalledTimes(1);

      // Second call should use cached value
      const result2 = await cache.getOrCompute('key', producer);
      expect(result2).toBe(42);
      expect(producer).toHaveBeenCalledTimes(1);

      // After expiration, should compute again
      jest.advanceTimersByTime(1500);
      const result3 = await cache.getOrCompute('key', producer);
      expect(result3).toBe(42);
      expect(producer).toHaveBeenCalledTimes(2);
    });

    it('should deduplicate concurrent calls for the same key', async () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });
      let resolveProducer!: (value: number) => void;
      const producer = jest.fn(
        () =>
          new Promise<number>(resolve => {
            resolveProducer = resolve;
          })
      );

      const promise1 = cache.getOrCompute('key', producer);
      const promise2 = cache.getOrCompute('key', producer);

      // Flush microtask for Promise.resolve().then(producer)
      await Promise.resolve();

      // Both calls are in flight, producer should only be called once
      expect(producer).toHaveBeenCalledTimes(1);

      resolveProducer(100);

      const [res1, res2] = await Promise.all([promise1, promise2]);
      expect(res1).toBe(100);
      expect(res2).toBe(100);
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('should remove key from pending if producer rejects allowing subsequent retry', async () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });
      let rejectProducer!: (reason: unknown) => void;
      const failingProducer = jest.fn(
        () =>
          new Promise<number>((_, reject) => {
            rejectProducer = reject;
          })
      );

      const promise1 = cache.getOrCompute('key', failingProducer);
      const promise2 = cache.getOrCompute('key', failingProducer);

      // Flush microtask for Promise.resolve().then(failingProducer)
      await Promise.resolve();

      expect(failingProducer).toHaveBeenCalledTimes(1);

      rejectProducer(new Error('computation failed'));

      await expect(promise1).rejects.toThrow('computation failed');
      await expect(promise2).rejects.toThrow('computation failed');

      // After failure, subsequent call should retry with a new producer
      const successProducer = jest.fn().mockResolvedValue(200);
      const result = await cache.getOrCompute('key', successProducer);
      expect(result).toBe(200);
      expect(successProducer).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent calls for different keys independently', async () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });
      const producer1 = jest.fn().mockResolvedValue(1);
      const producer2 = jest.fn().mockResolvedValue(2);

      const [res1, res2] = await Promise.all([
        cache.getOrCompute('k1', producer1),
        cache.getOrCompute('k2', producer2)
      ]);

      expect(res1).toBe(1);
      expect(res2).toBe(2);
      expect(producer1).toHaveBeenCalledTimes(1);
      expect(producer2).toHaveBeenCalledTimes(1);
    });

    it('should respect custom ttl in getOrCompute', async () => {
      const cache = new TTLCache<string, number>({ ttlMs: 5000 });
      const producer = jest.fn().mockResolvedValue(42);

      await cache.getOrCompute('key', producer, 1000);
      expect(producer).toHaveBeenCalledTimes(1);

      // Advance past custom TTL
      jest.advanceTimersByTime(1001);

      await cache.getOrCompute('key', producer, 1000);
      expect(producer).toHaveBeenCalledTimes(2);
    });

    it('should handle synchronous producer return values and errors gracefully', async () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });
      const syncProducer = () => 99 as unknown as Promise<number>;

      const result = await cache.getOrCompute('syncKey', syncProducer);
      expect(result).toBe(99);

      const throwingProducer = () => {
        throw new Error('sync error');
      };

      await expect(
        cache.getOrCompute('throwKey', throwingProducer as unknown as () => Promise<number>)
      ).rejects.toThrow('sync error');
    });

    it('should cache the computed value for subsequent calls', async () => {
      const cache = new TTLCache<string, number>({ ttlMs: 1000 });
      const producer = jest.fn().mockResolvedValue(42);

      const result1 = await cache.getOrCompute('key', producer);
      const result2 = await cache.getOrCompute('key', producer);

      expect(result1).toBe(42);
      expect(result2).toBe(42);
      expect(producer).toHaveBeenCalledTimes(1);
    });
  });

  it('should set and get multiple entries with setMany and getMany', () => {
    const cache = new TTLCache<string, number>();
    cache.setMany([
      ['a', 1],
      ['b', 2],
      ['c', 3]
    ]);

    const values = cache.getMany(['a', 'b', 'c', 'd']);
    expect(values).toEqual([1, 2, 3, undefined]);
  });

  it('should iterate keys and values correctly', () => {
    const cache = new TTLCache<string, number>({ ttlMs: 1000 });
    cache.set('x', 10);
    cache.set('y', 20);
    cache.setWithTTL('expired', 30, 500);

    jest.advanceTimersByTime(750); // expire one key

    const keys = [...cache.keys()];
    expect(keys).toContain('x');
    expect(keys).toContain('y');
    expect(keys).not.toContain('expired');

    const values = [...cache.values()];
    expect(values).toContain(10);
    expect(values).toContain(20);
    expect(values).not.toContain(30);
  });

  it('should refresh an entry and extend its TTL', () => {
    const ttl = 1000;
    const cache = new TTLCache<string, number>({ ttlMs: ttl });
    cache.set('a', 1);

    jest.advanceTimersByTime(800);
    expect(cache.get('a')).toBe(1);

    // Refresh before expiration
    const refreshed = cache.refresh('a', 1000);
    expect(refreshed).toBe(true);

    jest.advanceTimersByTime(500);
    expect(cache.get('a')).toBe(1); // still valid

    // Advance beyond refreshed TTL
    jest.advanceTimersByTime(600);
    expect(cache.get('a')).toBeUndefined();

    // Refresh expired key should return false
    const refreshExpired = cache.refresh('a');
    expect(refreshExpired).toBe(false);
  });

  it('keys(), values(), and entries() should skip expired entries', () => {
    const cache = new TTLCache<string, number>({ ttlMs: 1000 });
    cache.set('a', 1);
    cache.setWithTTL('b', 2, 500);

    jest.advanceTimersByTime(600);

    const keys = [...cache.keys()];
    expect(keys).toEqual(['a']); // b expired

    const values = [...cache.values()];
    expect(values).toEqual([1]);

    const entries = [...cache.entries()];
    expect(entries).toEqual([['a', 1]]);
  });

  it('should consistently treat entries as expired at exact expiration time', () => {
    const ttl = 1000;
    const cache = new TTLCache<string, number>({ ttlMs: ttl });
    cache.set('key', 42);

    // Advance time to exact expiration moment
    jest.advanceTimersByTime(ttl);

    // Check stats before get() lazily removes it from the map
    expect(cache.stats().validEntries).toBe(0);
    expect(cache.stats().expiredEntries).toBe(1);

    expect(cache.get('key')).toBeUndefined();
    expect(cache.has('key')).toBe(false);
    expect([...cache.keys()]).toEqual([]);
    expect([...cache.values()]).toEqual([]);
    expect([...cache.entries()]).toEqual([]);
  });

  it('should update LRU order when refreshing an entry', () => {
    const cache = new TTLCache<string, number>({ maxSize: 2, ttlMs: 5000 });
    cache.set('first', 1);
    cache.set('second', 2);

    // Refresh 'first' to make it most recently used
    expect(cache.refresh('first')).toBe(true);

    // Adding 'third' should evict 'second' (which is now least recently used), not 'first'
    cache.set('third', 3);

    expect(cache.has('first')).toBe(true);
    expect(cache.has('second')).toBe(false);
    expect(cache.has('third')).toBe(true);
  });
});

/**
 * Represents a cached entry with a value and an expiration timestamp.
 */
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

/**
 * An in-memory cache with time-to-live (TTL) support for each entry.
 *
 * @typeParam K - Type of the key.
 * @typeParam V - Type of the value.
 *
 * @example
 * const cache = new TTLCache<string, number>(1000);
 * cache.set("x", 123);
 * const value = cache.get("x"); // 123
 */
export class TTLCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();

  /**
   * @param ttlMs - Default time-to-live in milliseconds for cache entries.
   */
  constructor(private ttlMs: number = 5 * 60 * 1000) {}

  /**
   * Sets a key-value pair in the cache with the default TTL.
   *
   * @param key - The key to set.
   * @param value - The value to associate with the key.
   */
  set(key: K, value: V): void {
    const expiresAt = Date.now() + this.ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieves the value for a given key if it hasn't expired.
   *
   * @param key - The key to retrieve.
   * @returns The cached value, or undefined if not found or expired.
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Checks if the key exists and hasn't expired.
   *
   * @param key - The key to check.
   * @returns `true` if key exists and is valid, otherwise `false`.
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Deletes a key from the cache.
   *
   * @param key - The key to delete.
   * @returns `true` if the key existed and was removed, `false` otherwise.
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns the number of entries currently in the cache.
   *
   * @returns Number of items in the cache.
   */
  size(): number {
    return this.cache.size;
  }
}

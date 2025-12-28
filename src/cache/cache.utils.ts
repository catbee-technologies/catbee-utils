import { getCatbeeGlobalConfig } from '@catbee/utils/config';

/**
 * Represents a cached entry with a value and an expiration timestamp.
 */
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  lastAccessed?: number; // Track last access time for LRU functionality
};

/**
 * Options for configuring a TTLCache instance.
 */
export interface TTLCacheOptions {
  /** Default time-to-live in milliseconds for cache entries */
  ttlMs?: number;
  /** Maximum number of entries to keep in cache (uses LRU eviction policy) */
  maxSize?: number;
  /** Auto-cleanup interval in milliseconds (disabled if 0 or negative) */
  autoCleanupMs?: number;
}

/**
 * An in-memory cache with time-to-live (TTL) support for each entry.
 *
 * @typeParam K - Type of the key.
 * @typeParam V - Type of the value.
 *
 * @example
 * const cache = new TTLCache<string, number>({ ttlMs: 1000 });
 * cache.set("x", 123);
 * const value = cache.get("x"); // 123
 */
export class TTLCache<K, V> {
  private readonly cache = new Map<K, CacheEntry<V>>();
  private readonly ttlMs: number;
  private readonly maxSize?: number;
  private cleanupInterval?: NodeJS.Timeout;

  /**
   * @param options - Configuration options for the cache
   */
  constructor(options: TTLCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? getCatbeeGlobalConfig().cache.defaultTtl;
    this.maxSize = options.maxSize;

    // Setup auto-cleanup if enabled
    const autoCleanupMs = options.autoCleanupMs;
    if (autoCleanupMs && autoCleanupMs > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, autoCleanupMs);
    }
  }

  /**
   * Sets a key-value pair in the cache with the default TTL.
   *
   * @param key - The key to set.
   * @param value - The value to associate with the key.
   */
  set(key: K, value: V): void {
    this.setWithTTL(key, value, this.ttlMs);
  }

  /**
   * Sets a key-value pair in the cache with a custom TTL.
   *
   * @param key - The key to set.
   * @param value - The value to associate with the key.
   * @param ttlMs - Time-to-live in milliseconds.
   */
  setWithTTL(key: K, value: V, ttlMs: number): void {
    const now = Date.now();
    const expiresAt = now + ttlMs;

    if (this.cache.has(key)) {
      this.cache.delete(key); // remove old entry to maintain LRU order
    }

    this.cache.set(key, { value, expiresAt, lastAccessed: now });

    if (this.maxSize && this.cache.size > this.maxSize) {
      this.evictLRU();
    }
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

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Update lastAccessed and move key to the end (most recently used)
    entry.lastAccessed = now;
    // Re-insert to end of Map to maintain LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Retrieves or computes a value if it's not in the cache or has expired.
   *
   * @param key - The key to retrieve
   * @param producer - Function to generate the value if not cached
   * @param ttlMs - Optional custom TTL for the computed value
   * @returns The cached or computed value
   */
  async getOrCompute(key: K, producer: () => Promise<V>, ttlMs?: number): Promise<V> {
    const value = this.get(key);
    if (value !== undefined) return value;

    const newValue = await producer();
    this.setWithTTL(key, newValue, ttlMs ?? this.ttlMs);
    return newValue;
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
   * Returns the number of entries currently in the cache (includes expired entries until next access/cleanup).
   *
   * @returns Number of items in the cache (may include expired keys).
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Set multiple key-value pairs at once with the default TTL.
   *
   * @param entries - Array of [key, value] tuples to set
   */
  setMany(entries: [K, V][]): void {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  /**
   * Get multiple values at once.
   *
   * @param keys - Array of keys to retrieve
   * @returns Array of values (undefined for keys that don't exist or expired)
   */
  getMany(keys: K[]): (V | undefined)[] {
    return keys.map(key => this.get(key));
  }

  /**
   * Removes all expired entries from the cache.
   *
   * @returns Number of entries removed.
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Returns an iterator of all current valid [key, value] pairs.
   *
   * @returns IterableIterator<[K, V]>
   */
  *entries(): IterableIterator<[K, V]> {
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() <= entry.expiresAt) {
        yield [key, entry.value];
      }
    }
  }

  /**
   * Returns an iterator of all current valid keys.
   *
   * @returns IterableIterator<K>
   */
  *keys(): IterableIterator<K> {
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() <= entry.expiresAt) {
        yield key;
      }
    }
  }

  /**
   * Returns an iterator of all current valid values.
   *
   * @returns IterableIterator<V>
   */
  *values(): IterableIterator<V> {
    for (const entry of this.cache.values()) {
      if (Date.now() <= entry.expiresAt) {
        yield entry.value;
      }
    }
  }

  /**
   * Extends the expiration of a key by the specified time or default TTL.
   *
   * @param key - The key to refresh
   * @param ttlMs - Optional new TTL in milliseconds (uses default if not specified)
   * @returns true if the key was found and refreshed, false otherwise
   */
  refresh(key: K, ttlMs?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    entry.expiresAt = now + (ttlMs ?? this.ttlMs);
    entry.lastAccessed = now;
    return true;
  }

  /**
   * Returns a snapshot of cache stats.
   *
   * @returns Object containing cache statistics
   */
  stats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      size: this.cache.size,
      validEntries: valid,
      expiredEntries: expired,
      maxSize: this.maxSize
    };
  }

  /**
   * Stop the auto-cleanup interval if it's running.
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Evict the least recently used entry from the cache.
   * @private
   */
  private evictLRU(): void {
    const now = Date.now();

    // Remove all expired items first
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // Evict oldest entries until within max size
    while (this.maxSize && this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey as K);
    }
  }
}

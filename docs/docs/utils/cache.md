# Cache Utilities

In-memory TTL cache with advanced features for efficient data caching and retrieval. Provides a flexible, type-safe cache class with TTL, LRU eviction, auto-cleanup, and batch operations.

## API Summary

- [**`TTLCache<K, V>`**](#function-documentation--usage-examples) - Generic class with key type `K` and value type `V`.
- [**`set(key: K, value: V, ttlMs?: number): void`**](#set) - Add or update a cache entry, optionally with a custom TTL.
- [**`get(key: K): V | undefined`**](#get) - Retrieve a value from cache.
- [**`has(key: K): boolean`**](#has) - Check if key exists in cache.
- [**`delete(key: K): boolean`**](#delete) - Remove a key from cache.
- [**`clear(): void`**](#clear) - Remove all entries from cache.
- [**`size(): number`**](#size) - Get the number of entries in cache.
- [**`cleanup(): void`**](#cleanup) - Remove expired entries.
- [**`keys(): K[]`**](#keys) - Get all valid keys in the cache.
- [**`values(): V[]`**](#values) - Get all valid values in the cache.
- [**`entries(): Array<[K, V]>`**](#entries) - Get all valid key-value pairs.
- [**`forEach(callbackFn: (value: V, key: K) => void): void`**](#foreach) - Execute function for each entry.
- [**`setMany(entries: [K, V][]): void`**](#setmany) - Set multiple entries at once.
- [**`getMany(keys: K[]): (V | undefined)[]`**](#getmany) - Get multiple values at once.
- [**`refresh(key: K, ttlMs?: number): boolean`**](#refresh) - Extend expiration of a key.
- [**`stats(): object`**](#stats) - Get cache statistics.
- [**`destroy(): void`**](#destroy) - Stop auto-cleanup interval.
- [**`getOrCompute(key: K, producer: () => Promise<V>, ttlMs?: number): Promise<V>`**](#getorcompute) - Get or compute a value if missing.

---

## Interfaces & Types

```ts
interface TTLCacheOptions {
  ttlMs?: number;          // Default TTL in milliseconds
  maxSize?: number;        // Maximum number of entries
  autoCleanupMs?: number;  // Auto cleanup interval
}
```

___

## Function Documentation & Usage Examples

```ts
import { TTLCache } from '@catbee/utils';

const cache = new TTLCache<string, number>({ ttlMs: 60000, maxSize: 1000, autoCleanupMs: 30000 });
```

### `set()`
Add or update a cache entry, optionally with a custom TTL.

**Method Signature:**
```ts
set(key: K, value: V, ttlMs?: number): void
```

**Parameters:**
- `key`: The cache key.
- `value`: The cache value.
- `ttlMs`: Optional time-to-live in milliseconds.

**Examples:**
```ts
cache.set("foo", 42);
cache.set("bar", 99, 5000); // custom TTL
```

---

### `get()`
Retrieve a value from cache or compute it if missing.

**Method Signature:**
```ts
get(key: K): V | undefined
```

**Parameters:**
- `key`: The cache key.

**Returns:** 
- The cached value or `undefined` if not found or expired.

**Examples:**
```ts
const value = cache.get("foo"); // 42
```

---

### `has()`
Check if key exists in cache.

**Method Signature:**
```ts
has(key: K): boolean
```

**Parameters:**
- `key`: The cache key.

**Returns:** 
- `true` if the key exists and is valid, otherwise `false`.

**Examples:**
```ts
if (cache.has("foo")) { /* ... */ }
```

---

### `delete()`
Remove a key from cache.

**Method Signature:**
```ts
delete(key: K): boolean
```

**Parameters:**
- `key`: The cache key.

**Returns:** 
- `true` if the key was found and removed, otherwise `false`.

**Examples:**
```ts
cache.delete("foo");
```

---

### `clear()`
Remove all entries from cache.

**Method Signature:**
```ts
clear(): void
```

**Examples:**
```ts
cache.clear();
```

---

### `size()`
Get the number of entries in cache.

**Method Signature:**
```ts
size(): number
```

**Returns:** 
- The count of valid entries in the cache.

**Examples:**
```ts
const count = cache.size();
```

---

### `cleanup()`
Remove expired entries.

**Method Signature:**
```ts
cleanup(): void
```

**Examples:**
```ts
const removed = cache.cleanup();
```

---

### `keys()`
Get all valid keys in the cache.

**Method Signature:**
```ts
*keys(): IterableIterator<K>
```

**Returns:** 
- An iterator over the valid keys in the cache.

**Examples:**
```ts
const keys = Array.from(cache.keys());
```

---

### `values()`
Get all valid values in the cache.

**Method Signature:**
```ts
*values(): IterableIterator<V>
```

**Returns:** 
- An iterator over the valid values in the cache.

**Examples:**
```ts
const values = Array.from(cache.values());
```

---

### `entries()`
Get all valid key-value pairs.

**Method Signature:**
```ts
*entries(): IterableIterator<[K, V]>
```

**Returns:** 
- An iterator over the valid key-value pairs in the cache.

**Examples:**
```ts
const entries = Array.from(cache.entries());
```

---

### `forEach()`
Execute function for each entry.

**Method Signature:**
```ts
forEach(callbackFn: (value: V, key: K) => void): void
```

**Parameters:**
- `callbackFn`: Function to execute for each entry.

**Examples:**
```ts
cache.forEach((value, key) => { console.log(key, value); });
```

---

### `setMany()`
Set multiple entries at once.

**Method Signature:**
```ts
setMany(entries: [K, V][]): void
```

**Parameters:**
- `entries`: Array of key-value pairs to set.

**Examples:**
```ts
cache.setMany([["a", 1], ["b", 2]]);
```

---

### `getMany()`
Get multiple values at once.

**Method Signature:**
```ts
getMany(keys: K[]): (V | undefined)[]
```

**Parameters:**
- `keys`: Array of cache keys to retrieve.

**Returns:** 
- An array of values or `undefined` for missing/expired keys.

**Examples:**
```ts
const values = cache.getMany(["a", "b", "x"]);
```

---

### `refresh()`
Extend expiration of a key.

**Method Signature:**
```ts
refresh(key: K, ttlMs?: number): boolean
```

**Parameters:**
- `key`: The cache key.
- `ttlMs`: Optional new time-to-live in milliseconds.

**Returns:** 
- `true` if the key was found and refreshed, otherwise `false`.

**Examples:**
```ts
cache.refresh("session", 600_000);
```

---

### `stats()`
Get cache statistics.

**Method Signature:**
```ts
stats(): object
```

**Returns:** 
- An object containing cache statistics like hits, misses, size, etc.

**Examples:**
```ts
const stats = cache.stats();
```

---

### `destroy()`
Stop auto-cleanup interval.

**Method Signature:**
```ts
destroy(): void
```

**Examples:**
```ts
cache.destroy();
```

---

### `getOrCompute()`
Get or compute a value if missing.

**Method Signature:**
```ts
getOrCompute(key: K, producer: () => Promise<V>, ttlMs?: number): Promise<V>
```

**Parameters:**
- `key`: The cache key.
- `producer`: Function to produce the value if not found.
- `ttlMs`: Optional time-to-live in milliseconds.

**Returns:**
- The cached or newly computed value.

**Examples:**
```ts
const value = await cache.getOrCompute("user:1", async () => fetchUserFromDb(1), 10_000);
```

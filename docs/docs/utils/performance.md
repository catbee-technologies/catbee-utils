# Performance Utilities

A collection of utilities for measuring, tracking, and optimizing performance in Node.js applications. Includes timing functions for synchronous and asynchronous code, memoization with TTL and cache size, decorators for timing, and memory usage tracking. All methods are fully typed.

## API Summary

- [**`timeSync<T>(fn: () => T, options?: TimingOptions): { result: T; timing: TimingResult }`**](#timesync) - Measures the execution time of a synchronous function.
- [**`timeAsync<T>(fn: () => Promise<T>, options?: TimingOptions): Promise<{ result: T; timing: TimingResult }>`**](#timeasync) - Measures the execution time of an asynchronous function.
- [**`timed(options?: TimingOptions)`**](#timed) - Method decorator for timing function execution.
- [**`memoize<T, Args extends any[]>(fn: (...args: Args) => T, options?: { ttl?: number; maxSize?: number; cacheKey?: (...args: Args) => string; autoCleanupMs?: number })`**](#memoize) - Caches function results with optional TTL and max cache size.
- [**`trackMemoryUsage<T>(fn: () => T, options?: { log?: boolean; label?: string }): { result: T; memoryUsage: { before: NodeJS.MemoryUsage; after: NodeJS.MemoryUsage; diff: Record<string, number> } }`**](#trackmemoryusage) - Tracks memory usage for a function execution.

---

## Interfaces & Types

```ts
export interface TimingOptions {
  label?: string;
  log?: boolean;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

export interface TimingResult {
  durationMs: number;
  durationSec: number;
  startTime: number;
  endTime: number;
  label: string;
}
```

### Memoization Options

```ts
{
  ttl?: number;
  maxSize?: number;
  cacheKey?: (...args: any[]) => string;
  autoCleanupMs?: number;
}
```

### Memory Usage Result

```ts
{
  before: NodeJS.MemoryUsage;
  after: NodeJS.MemoryUsage;
  diff: Record<string, number>;
}
```
___

## Function Documentation & Usage Examples

### `timeSync()`
Measures the execution time of a synchronous function.

**Method Signature:**
```ts
function timeSync<T>(fn: () => T, options?: TimingOptions): { result: T; timing: TimingResult }
```

**Parameters:**
- `fn`: The synchronous function to time.
- `options`: Optional timing options.
  - `label`: A label for the timing operation.
  - `log`: Whether to log the timing result.
  - `logLevel`: The log level to use if logging is enabled.

**Returns:**
- An object containing the result of the function and the timing information.

**Example:**
```ts
import { timeSync } from '@catbee/utils';

const { result, timing } = timeSync(() => {
  // Expensive operation
  return Array(1000000).fill(1).reduce((a, b) => a + b, 0);
}, { label: 'Sum calculation', log: true });

console.log(`Result: ${result}, took ${timing.durationMs}ms`);
```

---

### `timeAsync()`
Measures the execution time of an asynchronous function.

**Method Signature:**
```ts
function timeAsync<T>(fn: () => Promise<T>, options?: TimingOptions): Promise<{ result: T; timing: TimingResult }>
```

**Parameters:**
- `fn`: The asynchronous function to time.
- `options`: Optional timing options.
  - `label`: A label for the timing operation.
  - `log`: Whether to log the timing result.
  - `logLevel`: The log level to use if logging is enabled. 

**Returns:**
- A promise that resolves to an object containing the result of the function and the timing information.

**Example:**
```ts
import { timeAsync } from '@catbee/utils';

const { result, timing } = await timeAsync(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
}, { label: 'API Request', log: true });

console.log(`Fetched ${result.length} items in ${timing.durationSec.toFixed(2)}s`);
```

---

### `timed()`
Method decorator for timing function execution.

**Method Signature:**
```ts
function timed(options?: TimingOptions): MethodDecorator;
```

**Parameters:**
- `options`: Optional timing options.
  - `label`: A label for the timing operation.
  - `log`: Whether to log the timing result.
  - `logLevel`: The log level to use if logging is enabled.

**Returns:**
- A method decorator that wraps the original method to measure its execution time.

**Example:**
```ts
import { timed } from '@catbee/utils';

class DataService {
  @timed({ log: true, logLevel: 'info' })
  async fetchUserData(userId: string) {
    // Implementation...
    return { name: 'John', id: userId };
  }
}
```

---

### `memoize()`
Caches function results with optional TTL and max cache size.

**Method Signature:**
```ts
function memoize<T, Args extends any[]>(fn: (...args: Args) => T, options?: { ttl?: number; maxSize?: number; cacheKey?: (...args: Args) => string; autoCleanupMs?: number }): (...args: Args) => T;
```

**Parameters:**
- `fn`: The function to memoize.
- `options`: Optional memoization options.
  - `ttl`: Time-to-live for cache entries in milliseconds.
  - `maxSize`: Maximum number of entries in the cache.
  - `cacheKey`: A function to generate cache keys from arguments.
  - `autoCleanupMs`: Interval for automatic cache cleanup.

**Returns:**
- A new function that caches results of the original function.

**Example:**
```ts
import { memoize } from '@catbee/utils';

const calculateFactorial = memoize(
  (n: number): number => n <= 1 ? 1 : n * calculateFactorial(n - 1),
  { ttl: 5 * 60 * 1000, maxSize: 100 }
);

const result1 = calculateFactorial(20); // Slow, computes
const result2 = calculateFactorial(20); // Fast, cached
```

---


### `trackMemoryUsage()`
Tracks memory usage for a function execution.

**Method Signature:**
```ts
function trackMemoryUsage<T>(fn: () => T, options?: { log?: boolean; label?: string }): { result: T; memoryUsage: { before: NodeJS.MemoryUsage; after: NodeJS.MemoryUsage; diff: Record<string, number> } };
```

**Parameters:**
- `fn`: The function to track memory usage for.
- `options`: Optional tracking options.
  - `log`: Whether to log the memory usage result.
  - `label`: A label for the memory tracking operation.

**Returns:**
- An object containing the result of the function and memory usage information before and after execution.

**Example:**
```ts
import { trackMemoryUsage } from '@catbee/utils';

const { result, memoryUsage } = trackMemoryUsage(() => {
  const largeArray = Array(1000000).fill(0).map((_, i) => ({ id: i }));
  return largeArray.length;
}, { log: true, label: 'Large array creation' });

console.log(`Created ${result} items`);
console.log(`Memory increased by ${Math.round(memoryUsage.diff.heapUsed / 1024 / 1024)}MB`);
```

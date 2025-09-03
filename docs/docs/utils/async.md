# Async Utilities

Functions for handling asynchronous operations with better control flow and error handling. Includes helpers for sleep, debounce, throttle, retry, batching, concurrency, memoization, aborting, deferred promises, waterfall, rate limiting, circuit breaker, and more. All methods are fully typed.

## API Summary

- [**`sleep(ms: number): Promise<void>`**](#sleep) - Pauses execution for a given number of milliseconds.
- [**`debounce<T>(fn: T, delay: number): T & { cancel(): void; flush(): void }`**](#debounce) - Debounces function calls, only invoking after delay. Provides `.cancel()` and `.flush()` methods.
- [**`throttle<T>(fn: T, limit: number, opts: { leading?: boolean; trailing?: boolean }): (...args: Parameters<T>) => void`**](#throttle) - Throttles function calls to a maximum rate.
- [**`retry<T>(fn: () => Promise<T>, retries?: number, delay?: number, backoff?: boolean, onRetry?: (error: unknown, attempt: number) => void): Promise<T>`**](#retry) - Retries a promise-returning function with optional backoff.
- [**`withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>`**](#withtimeout) - Rejects promise if it takes longer than specified time.
- [**`runInBatches<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]>`**](#runinbatches) - Runs async tasks in batches with concurrency limit.
- [**`singletonAsync<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, drop?: boolean): (...args: TArgs) => Promise<TResult>`**](#singletonasync) - Ensures only one instance of an async function runs at a time.
- [**`settleAll<T>(tasks: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]>`**](#settleall) - Runs all tasks and returns their settled results.
- [**`createTaskQueue(limit: number): TaskQueue`**](#createtaskqueue) - Creates a queue to run tasks with concurrency control.
- [**`runInSeries<T>(tasks: (() => Promise<T>)[]): Promise<T[]>`**](#runinseries) - Runs async tasks one after another.
- [**`memoizeAsync<T, Args extends any[]>(fn: (...args: Args) => Promise<T>, options?: { ttl?: number; keyFn?: (args: Args) => string; }): (...args: Args) => Promise<T>`**](#memoizeasync) - Memoizes async function results.
- [**`abortable<T>(promise: Promise<T>, signal: AbortSignal, abortValue?: any): Promise<T>`**](#abortable) - Makes a promise abortable via AbortSignal.
- [**`createDeferred<T>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void]`**](#createdeferred) - Creates a deferred promise with resolve/reject.
- [**`waterfall<T>(fns: Array<(input: any) => Promise<any>>): (initialValue: any) => Promise<T>`**](#waterfall) - Runs async functions in sequence, passing result to next.
- [**`rateLimit<T>(fn: (...args: any[]) => Promise<T>, maxCalls: number, interval: number): (...args: any[]) => Promise<T>`**](#ratelimit) - Limits the rate of async function calls.
- [**`circuitBreaker<T>(fn: (...args: any[]) => Promise<T>, options?: CircuitBreakerOptions): (...args: any[]) => Promise<T>`**](#circuitbreaker) - Protects against cascading failures with a circuit breaker.
- [**`runWithConcurrency<T>(tasks: (() => Promise<T>)[], options: { concurrency?: number; onProgress?: (completed: number, total: number) => void, signal?: AbortSignal }): Promise<T[]>`**](#runwithconcurrency) - Runs async tasks with concurrency and progress control.

---

## Interfaces & Types

```ts
interface TaskQueue {
  <T>(taskFn: () => Promise<T>): Promise<T>;
  pause: () => void;
  resume: () => void;
  readonly length: number;
  readonly isPaused: boolean;
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  successThreshold?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onHalfOpen?: () => void;
}

enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}
```

___

## Function Documentation & Usage Examples

### `sleep()`
Pauses execution for a given number of milliseconds.

**Method Signature:**
```ts
function sleep(ms: number): Promise<void>
```

**Parameters:**
- `ms`: The number of milliseconds to sleep.

**Returns:**
- A promise that resolves after the specified time.

**Examples:**
```ts
import { sleep } from '@catbee/utils';

await sleep(1000); // pauses for 1 second
```

---

### `debounce()`
Debounces function calls, only invoking after delay. Provides `.cancel()` and `.flush()` methods.

**Method Signature:**
```ts
function debounce<T>(fn: T, delay: number): T & { cancel(): void; flush(): void }
```

**Parameters:**
- `fn`: The function to debounce.
- `delay`: The debounce delay in milliseconds.

**Returns:**
- A debounced version of the function with `cancel` and `flush` methods.

**Examples:**
```ts
import { debounce } from '@catbee/utils';

const log = debounce((msg: string) => console.log(msg), 300);
log('Hello');
log('World'); // Only 'World' will be logged after 300ms
log.cancel();
log.flush();
```

---

### `throttle()`
Throttles function calls to a maximum rate.

**Method Signature:**
```ts
function throttle<T>(fn: T, limit: number, opts?: { leading?: boolean; trailing?: boolean }): (...args: Parameters<T>) => void
```

**Parameters:**
- `fn`: The function to throttle.
- `limit`: The time window in milliseconds.
- `opts`: Options to control leading/trailing invocation.
  - `leading`: If true, invoke on the leading edge (default: true).
  - `trailing`: If true, invoke on the trailing edge (default: true).

**Returns:**
- A throttled version of the function.

**Examples:**
```ts
import { throttle } from '@catbee/utils';

const throttled = throttle(() => console.log('Tick'), 1000);
throttled(); // Will log immediately
throttled(); // Ignored if called within 1s
```

---

### `retry()`
Retries a promise-returning function with optional backoff.

**Method Signature:**
```ts
async function retry<T>(fn: () => Promise<T>, retries?: number, delay?: number, backoff?: boolean, onRetry?: (error: unknown, attempt: number) => void): Promise<T>
```

**Parameters:**
- `fn`: The async function to retry.
- `retries`: Maximum number of retries (default: 3).
- `delay`: Initial delay between retries in milliseconds (default: 0).
- `backoff`: Whether to use exponential backoff (default: false).
- `onRetry`: Optional callback invoked on each retry attempt.
  - `error`: The error from the failed attempt.
  - `attempt`: The current retry attempt number.

**Returns:**
- A promise that resolves with the function's result or rejects after all retries fail.

**Examples:**
```ts
import { retry } from '@catbee/utils';

const data = await retry(fetchData, 3, 500, true, (err, attempt) => {
  console.log(`Attempt ${attempt} failed: ${err.message}`);
});
```

---

### `withTimeout()`
Rejects promise if it takes longer than specified time.

**Method Signature:**
```ts
function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>
```

**Parameters:**
- `promise`: The promise to wrap with a timeout.
- `ms`: The timeout duration in milliseconds.
- `message`: Optional timeout error message.

**Returns:**
- A promise that resolves/rejects with the original promise or rejects with a timeout error.

**Examples:**
```ts
import { withTimeout } from '@catbee/utils';

await withTimeout(fetch('/api'), 2000, 'Request timed out');
```

---

### `runInBatches()`
Runs async tasks in batches with concurrency limit.

**Method Signature:**
```ts
function runInBatches<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]>
```

**Parameters:**
- `tasks`: An array of functions returning promises.
- `limit`: Maximum number of concurrent tasks.

**Returns:**
- A promise that resolves with an array of results.

**Examples:**
```ts
import { runInBatches } from '@catbee/utils';

const results = await runInBatches(tasks, 2);
```

---

### `singletonAsync()`
Ensures only one instance of an async function runs at a time.

**Method Signature:**
```ts
function singletonAsync<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, drop?: boolean): (...args: TArgs) => Promise<TResult>
```

**Parameters:**
- `fn`: The async function to wrap.
- `drop`: If true, subsequent calls while one is running will be dropped (default: false).

**Returns:**
- A function that returns a promise resolving to the result of the original function.

**Examples:**
```ts
import { singletonAsync } from '@catbee/utils';

const fetchOnce = singletonAsync(async (url: string) => fetch(url).then(r => r.json()));
```

---

### `settleAll()`
Runs all tasks and returns their settled results.

**Method Signature:**
```ts
function settleAll<T>(tasks: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]>
```

**Parameters:**
- `tasks`: An array of functions returning promises.

**Returns:**
- A promise that resolves with an array of settled results.

**Examples:**
```ts
import { settleAll } from '@catbee/utils';

const tasks = [
  () => Promise.resolve(1),
  () => Promise.reject(new Error('Failed')),
  () => Promise.resolve(3)
];
const results = await settleAll(tasks);
```

---

### `createTaskQueue()`
Creates a queue to run tasks with concurrency control.

**Method Signature:**
```ts
function createTaskQueue(limit: number): TaskQueue
```

**Parameters:**
- `limit`: Maximum number of concurrent tasks.

**Returns:**
- A `TaskQueue` instance with methods to add tasks, pause, and resume.

**Examples:**
```ts
import { createTaskQueue, sleep } from '@catbee/utils';

const queue = createTaskQueue(2);
queue(() => sleep(1000).then(() => 'A')).then(console.log);
queue.pause();  // Pause the queue
queue.resume(); // Resume the queue
```

---

### `runInSeries()`
Runs async tasks one after another.

**Method Signature:**
```ts
function runInSeries<T>(tasks: (() => Promise<T>)[]): Promise<T[]>
```

**Parameters:**
- `tasks`: An array of functions returning promises.

**Returns:**
- A promise that resolves with an array of results.


**Examples:**
```ts
import { runInSeries } from '@catbee/utils';

const tasks = [
  () => Promise.resolve(1),
  () => Promise.resolve(2),
  () => Promise.resolve(3)
];
const results = await runInSeries(tasks); // [1, 2, 3]
```

---

### `memoizeAsync()`
Memoizes async function results.

**Method Signature:**
```ts
function memoizeAsync<T, Args extends any[]>(fn: (...args: Args) => Promise<T>, options?: { ttl?: number; keyFn?: (args: Args) => string; }): (...args: Args) => Promise<T>
```

**Parameters:**
- `fn`: The async function to memoize.
- `options`: Optional settings:
  - `ttl`: Time-to-live for cache entries in milliseconds (default: infinite).
  - `keyFn`: Function to generate cache keys from arguments (default: JSON.stringify).

**Returns:**
- A memoized version of the async function.

**Examples:**
```ts
import { memoizeAsync } from '@catbee/utils';

const fetchUser = memoizeAsync(async (id: number) => fetch(`/user/${id}`).then(r => r.json()), { ttl: 60000 });
await fetchUser(1); // Fetched from API
await fetchUser(1); // Returned from cache
```

---

### `abortable()`
Makes a promise abortable via AbortSignal.

**Method Signature:**
```ts
function abortable<T>(promise: Promise<T>, signal: AbortSignal, abortValue?: any): Promise<T>
```

**Parameters:**
- `promise`: The promise to make abortable.
- `signal`: The AbortSignal to listen for abort events.
- `abortValue`: Optional value to resolve with if aborted (default: rejects with an error).

**Returns:**
- A promise that resolves/rejects with the original promise or resolves with `abortValue` if aborted.

**Examples:**
```ts
import { abortable } from '@catbee/utils';

const controller = new AbortController();
const promise = abortable(fetch('/api'), controller.signal, 'Aborted');
controller.abort();
```

---

### `createDeferred()`
Creates a deferred promise with resolve/reject.

**Method Signature:**
```ts
function createDeferred<T>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void]
```

**Returns:**
- A tuple containing the promise, resolve function, and reject function.

**Examples:**
```ts
import { createDeferred } from '@catbee/utils';

const [promise, resolve, reject] = createDeferred<number>();
setTimeout(() => resolve(42), 100);
const result = await promise; // 42
```

---

### `waterfall()`
Runs async functions in sequence, passing result to next.

**Method Signature:**
```ts
function waterfall<T>(fns: Array<(input: any) => Promise<any>>): (initialValue: any) => Promise<T>
```

**Parameters:**
- `fns`: An array of async functions that take the previous function's result as input.

**Returns:**
- A function that takes an initial value and returns a promise resolving to the final result.

**Examples:**
```ts
import { waterfall } from '@catbee/utils';

const pipeline = waterfall([
  async (x) => x + 1,
  async (x) => x * 2,
  async (x) => `Result: ${x}`
]);
const result = await pipeline(5); // "Result: 12"
```

---

### `rateLimit()`
Limits the rate of async function calls.

**Method Signature:**
```ts
function rateLimit<T>(fn: (...args: any[]) => Promise<T>, maxCalls: number, interval: number): (...args: any[]) => Promise<T>
```

**Parameters:**
- `fn`: The async function to rate limit.
- `maxCalls`: Maximum number of calls allowed within the interval.
- `interval`: Time window in milliseconds.

**Returns:**
- A rate-limited version of the function.

```ts
import { rateLimit } from '@catbee/utils';

const limitedFetch = rateLimit(fetch, 2, 1000);
await limitedFetch('/api/1');
```

---

### `circuitBreaker()`
Protects against cascading failures with a circuit breaker.

**Method Signature:**
```ts
function circuitBreaker<T>(fn: (...args: any[]) => Promise<T>, options?: CircuitBreakerOptions): (...args: any[]) => Promise<T>
```

**Parameters:**
- `fn`: The async function to wrap with a circuit breaker.
- `options`: Optional settings:
  - `failureThreshold`: Number of failures to open the circuit (default: 5).
  - `resetTimeout`: Time in milliseconds to wait before attempting to close the circuit (default: 10000).
  - `successThreshold`: Number of successful calls to close the circuit from half-open state (default: 2).
  - `onOpen`: Callback invoked when the circuit opens.
  - `onClose`: Callback invoked when the circuit closes.
  - `onHalfOpen`: Callback invoked when the circuit transitions to half-open.

**Returns:**
- A function that returns a promise resolving to the result of the original function or rejects if the circuit is open.

**Examples:**

```ts
import { circuitBreaker } from '@catbee/utils';

const protectedFetch = circuitBreaker(async (url) => fetch(url).then(r => r.json()), { failureThreshold: 3 });
```

---

### `runWithConcurrency()`
Runs async tasks with concurrency and progress control.

**Method Signature:**
```ts
function runWithConcurrency<T>(tasks: (() => Promise<T>)[], options?: { concurrency?: number; onProgress?: (completed: number, total: number) => void, signal?: AbortSignal }): Promise<T[]>
```

**Parameters:**
- `tasks`: An array of functions returning promises.
- `options`: Optional settings:
  - `concurrency`: Maximum number of concurrent tasks (default: 5).
  - `onProgress`: Optional callback invoked with completed and total task counts.
  - `signal`: Optional AbortSignal to cancel the operation.

**Returns:**
- A promise that resolves with an array of results.

**Examples:**
```ts
import { runWithConcurrency } from '@catbee/utils';

const results = await runWithConcurrency(tasks, { 
  concurrency: 2, onProgress: (done, total) => console.log(done, total) 
});
```

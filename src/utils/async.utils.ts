/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies. https://catbee-utils.npm.hprasath.com/license
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { getLogger } from './logger.utils';

/**
 * Delays execution for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} A Promise that resolves after the given time.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a debounced version of a function that delays its execution.
 * Provides `.cancel()` and `.flush()` methods.
 *
 * @template T
 * @param {T} fn - The function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {T & { cancel: () => void; flush: () => void }} A debounced function.
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: NodeJS.Timeout | null = null;
  let pendingArgs: Parameters<T> | null = null;

  function debounced(...args: Parameters<T>) {
    pendingArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...(pendingArgs as Parameters<T>));
      timer = null;
    }, delay);
  }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pendingArgs = null;
  };

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      fn(...(pendingArgs as Parameters<T>));
      timer = null;
      pendingArgs = null;
    }
  };

  return debounced as typeof debounced & {
    cancel: () => void;
    flush: () => void;
  };
}

/**
 * Creates a throttled version of a function that limits its execution rate.
 * Allows control over leading/trailing invocation.
 *
 * @template T
 * @param {T} fn - The function to throttle.
 * @param {number} limit - Minimum time between calls in milliseconds.
 * @param {{ leading?: boolean, trailing?: boolean }} [opts] - Options for leading/trailing edge throttling.
 * @returns {(...args: Parameters<T>) => void} A throttled function.
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number,
  opts: { leading?: boolean; trailing?: boolean } = {
    leading: true,
    trailing: false
  }
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timer: NodeJS.Timeout | null = null;
  let savedArgs: Parameters<T> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const { leading = true, trailing = false } = opts;

    if (!lastCall && !leading) lastCall = now;

    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastCall = now;
      fn(...args);
    } else if (trailing) {
      savedArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          lastCall = leading ? Date.now() : 0;
          timer = null;
          if (savedArgs) fn(...savedArgs);
        }, remaining);
      }
    }
  };
}

/**
 * Retries an asynchronous function a given number of times with optional delay/backoff.
 *
 * @template T
 * @param {() => Promise<T>} fn - The async function to retry.
 * @param {number} [retries=3] - Number of retry attempts.
 * @param {number} [delay=500] - Delay in milliseconds between retries.
 * @param {boolean} [backoff=false] - Use exponential backoff between attempts.
 * @param {(error: unknown, attempt: number) => void} [onRetry] - Callback for each retry attempt.
 * @returns {Promise<T>} The result of the async function if successful.
 * @throws {*} The last encountered error if all retries fail.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500,
  backoff = false,
  onRetry?: (error: unknown, attempt: number) => void
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      if (onRetry) onRetry(e, i + 1);
      await sleep(backoff ? delay * Math.pow(2, i) : delay);
    }
  }
  throw new Error('Retry failed'); // should never reach here
}

/**
 * Wraps a promise and rejects it if it doesn't resolve within the specified timeout.
 *
 * @template T
 * @param {Promise<T>} promise - The original promise.
 * @param {number} ms - Timeout in milliseconds.
 * @param {string} [message="Operation timed out"] - Optional timeout message.
 * @returns {Promise<T>} A promise that resolves or rejects within the timeout.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Operation timed out'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then(result => {
        clearTimeout(timeoutHandle);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timeoutHandle);
        reject(err);
      });
  });
}

/**
 * Executes async tasks in true batches.
 * Each batch runs in parallel, but batches run sequentially.
 * All tasks in a batch start at the same time, next batch waits for full completion.
 * NOTE: For more granular concurrency, use a "queue" or "pooled" approach.
 *
 * @template T
 * @param {Array<() => Promise<T>>} tasks - An array of functions that return Promises.
 * @param {number} limit - Number of tasks to run in parallel per batch.
 * @returns {Promise<T[]>} A promise that resolves to an array of resolved values.
 */
export async function runInBatches<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Wraps a function and ensures it is only called once at a time.
 * Calls made while one is in progress will wait for the same Promise.
 * Optionally, new calls can be dropped while in progress (drop=true).
 *
 * @template TArgs
 * @template TResult
 * @param {(...args: TArgs) => Promise<TResult>} fn - The async function to wrap.
 * @param {boolean} [drop=false] - If true, new calls while one is pending are rejected.
 * @returns {(...args: TArgs) => Promise<TResult>} A wrapped function with singleton behavior.
 */
export function singletonAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  drop: boolean = false
): (...args: TArgs) => Promise<TResult> {
  let promise: Promise<TResult> | null = null;

  return async (...args: TArgs) => {
    if (!promise) {
      promise = fn(...args).finally(() => {
        promise = null;
      });
    } else if (drop) {
      return Promise.reject(new Error('Busy: function already running'));
    }
    return promise;
  };
}

/**
 * Resolves a list of async tasks in parallel, returning both resolved and rejected results.
 *
 * @template T
 * @param {Array<() => Promise<T>>} tasks - Array of promise-returning functions.
 * @returns {Promise<PromiseSettledResult<T>[]>} Results including status and value/reason.
 */
export async function settleAll<T>(tasks: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(tasks.map(task => task()));
}

export interface TaskQueue {
  <T>(taskFn: () => Promise<T>): Promise<T>;
  pause: () => void;
  resume: () => void;
  readonly length: number;
  readonly isPaused: boolean;
}

/**
 * A simple task queue that executes async tasks with a concurrency limit.
 * Exposes pause, resume, and queue length getters.
 *
 * @param {number} limit - Maximum number of concurrent tasks.
 * @returns {function & { pause: () => void, resume: () => void, length: number, isPaused: boolean }}
 *   Enqueue function plus queue controls.
 */
export function createTaskQueue(limit: number): TaskQueue {
  const queue: (() => Promise<void>)[] = [];
  let activeCount = 0;
  let paused = false;

  const state = {
    /**
     * Pause task processing.
     */
    pause() {
      paused = true;
    },
    /**
     * Resume task processing.
     */
    resume() {
      paused = false;
      next();
    },
    /**
     * The current length of the queue.
     * @type {number}
     */
    get length() {
      return queue.length;
    },
    /**
     * Whether the queue is currently paused.
     * @type {boolean}
     */
    get isPaused() {
      return paused;
    }
  };

  const next = () => {
    if (paused || queue.length === 0 || activeCount >= limit) return;
    const task = queue.shift()!;
    activeCount++;
    task().finally(() => {
      activeCount--;
      next();
    });
  };

  /**
   * Enqueues a new async task to the queue.
   *
   * @template T
   * @param {() => Promise<T>} taskFn - The async task function.
   * @returns {Promise<T>} Promise resolving when task completes.
   */
  const enqueue = async function <T>(taskFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          const result = await taskFn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      next();
    });
  };

  enqueue.pause = state.pause;
  enqueue.resume = state.resume;
  Object.defineProperty(enqueue, 'length', {
    get: () => queue.length
  });
  Object.defineProperty(enqueue, 'isPaused', {
    get: () => paused
  });

  return enqueue as TaskQueue;
}

/**
 * Executes async functions sequentially and collects results.
 * Useful when order matters or tasks depend on each other.
 *
 * @template T
 * @param {Array<() => Promise<T>>} tasks - Array of promise-returning functions.
 * @returns {Promise<T[]>} Array of resolved values.
 */
export async function runInSeries<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

/**
 * Memoizes an async function, caching results for repeated calls with identical arguments.
 * Optional TTL (time-to-live) for cached entries.
 *
 * @template T Function return type
 * @template Args Function arguments types
 * @param {(...args: Args) => Promise<T>} fn - The async function to memoize
 * @param {object} [options] - Memoization options
 * @param {number} [options.ttl] - Cache TTL in milliseconds (optional)
 * @param {(args: Args) => string} [options.keyFn] - Custom key generator function
 * @returns {(...args: Args) => Promise<T>} Memoized function
 */
export function memoizeAsync<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: {
    ttl?: number;
    keyFn?: (args: Args) => string;
  } = {}
): (...args: Args) => Promise<T> {
  const cache = new Map<string, { value: T; expires: number }>();
  const { ttl, keyFn = JSON.stringify } = options;

  return async function (...args: Args): Promise<T> {
    const key = keyFn(args);
    const cached = cache.get(key);

    if (cached && (!ttl || Date.now() < cached.expires)) {
      return cached.value;
    }

    const result = await fn(...args);
    cache.set(key, {
      value: result,
      expires: ttl ? Date.now() + ttl : Infinity
    });

    return result;
  };
}

/**
 * Creates an abortable version of a promise that can be cancelled using an AbortController.
 *
 * @template T
 * @param {Promise<T>} promise - The promise to make abortable
 * @param {AbortSignal} signal - AbortSignal from AbortController
 * @param {any} [abortValue] - Value to use when rejecting on abort
 * @returns {Promise<T>} Promise that rejects if the signal is aborted
 */
export function abortable<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  abortValue: any = new Error('Operation aborted')
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(abortValue);
  }

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const abort = () => reject(abortValue);
      signal.addEventListener('abort', abort, { once: true });
      promise.finally(() => signal.removeEventListener('abort', abort));
    })
  ]);
}

/**
 * Creates a promise with external resolve/reject functions.
 * Useful for creating promises that can be resolved or rejected from outside.
 *
 * @template T
 * @returns {[Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void]}
 *   Tuple of [promise, resolve, reject]
 */
export function createDeferred<T>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void] {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return [promise, resolve, reject];
}

/**
 * Chains a series of async functions, passing the result of each to the next.
 * Similar to function composition but for async functions.
 *
 * @template T
 * @param {Array<(input: any) => Promise<any>>} fns - Array of async functions to compose
 * @returns {(input: any) => Promise<T>} Composed function
 */
export function waterfall<T>(fns: Array<(input: any) => Promise<any>>): (initialValue: any) => Promise<T> {
  return async (initialValue: any): Promise<T> => {
    return fns.reduce(async (acc, fn) => fn(await acc), Promise.resolve(initialValue)) as Promise<T>;
  };
}

/**
 * Creates a rate limiter that ensures functions aren't called more than
 * a specified number of times per interval.
 *
 * @template T
 * @param {(...args: any[]) => Promise<T>} fn - Function to rate limit
 * @param {number} maxCalls - Maximum calls allowed per interval
 * @param {number} interval - Time interval in milliseconds
 * @returns {(...args: any[]) => Promise<T>} Rate limited function
 */
export function rateLimit<T>(
  fn: (...args: any[]) => Promise<T>,
  maxCalls: number,
  interval: number
): (...args: any[]) => Promise<T> {
  const calls: number[] = [];

  return async function (...args: any[]): Promise<T> {
    const now = Date.now();
    calls.splice(0, calls.length, ...calls.filter(time => now - time < interval));

    if (calls.length >= maxCalls) {
      const oldestCall = calls[0];
      const delay = interval - (now - oldestCall);
      await sleep(Math.max(1, delay));
      // Remove potentially stale entries after sleep
      const currentTime = Date.now();
      calls.splice(0, calls.length, ...calls.filter(time => currentTime - time < interval));

      // If still at limit after sleep, wait for another cycle
      if (calls.length >= maxCalls) {
        const nextDelay = interval - (currentTime - calls[0]);
        await sleep(Math.max(1, nextDelay));
        calls.splice(0, calls.length, ...calls.filter(time => Date.now() - time < interval));
      }
    }

    calls.push(Date.now());
    return fn(...args);
  };
}

/**
 * Circuit breaker pattern implementation for protecting against cascading failures.
 * Tracks failures and prevents calling the function when too many failures occur.
 *
 * @param fn - Function to protect with circuit breaker
 * @param options - Circuit breaker options
 * @returns Function wrapped with circuit breaker logic
 *
 * @example
 * ```typescript
 * const protectedFetch = circuitBreaker(
 *   async (url) => {
 *     const response = await fetch(url);
 *     if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
 *     return response.json();
 *   },
 *   {
 *     failureThreshold: 3,
 *     resetTimeout: 30000,
 *     onOpen: () => console.log('Circuit breaker opened'),
 *     onClose: () => console.log('Circuit breaker closed')
 *   }
 * );
 *
 * // Will throw CircuitBreakerOpenError after failureThreshold consecutive failures
 * try {
 *   const data = await protectedFetch('https://api.example.com');
 * } catch (error) {
 *   if (error instanceof CircuitBreakerOpenError) {
 *     console.log('Service is currently unavailable, please try again later');
 *   }
 * }
 * ```
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time in milliseconds to wait before trying again (default: 10000) */
  resetTimeout?: number;
  /** Number of successful calls to close the circuit again (default: 1) */
  successThreshold?: number;
  /** Callback when circuit opens */
  onOpen?: () => void;
  /** Callback when circuit closes */
  onClose?: () => void;
  /** Callback when circuit enters half-open state */
  onHalfOpen?: () => void;
}

export function circuitBreaker<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: CircuitBreakerOptions = {}
): (...args: Args) => Promise<T> {
  const { failureThreshold = 5, resetTimeout = 10000, successThreshold = 1, onOpen, onClose, onHalfOpen } = options;

  let state = CircuitBreakerState.CLOSED;
  let failureCount = 0;
  let successCount = 0;
  let nextAttempt = Date.now();

  return async function (...args: Args): Promise<T> {
    if (state === CircuitBreakerState.OPEN) {
      if (Date.now() < nextAttempt) {
        throw new CircuitBreakerOpenError();
      }

      // Move to half-open state
      state = CircuitBreakerState.HALF_OPEN;
      if (onHalfOpen) onHalfOpen();
    }

    try {
      const result = await fn(...args);

      // On success in half-open state
      if (state === CircuitBreakerState.HALF_OPEN) {
        successCount++;
        if (successCount >= successThreshold) {
          successCount = 0;
          failureCount = 0;
          state = CircuitBreakerState.CLOSED;
          if (onClose) onClose();
        }
      } else {
        // Reset failure count on success in closed state
        failureCount = 0;
      }

      return result;
    } catch (error) {
      // Track failures
      failureCount++;

      // Check if we need to open the circuit
      if (
        (state === CircuitBreakerState.CLOSED || state === CircuitBreakerState.HALF_OPEN) &&
        failureCount >= failureThreshold
      ) {
        state = CircuitBreakerState.OPEN;
        nextAttempt = Date.now() + resetTimeout;
        if (onOpen) onOpen();
      }

      throw error;
    }
  };
}

/**
 * Run multiple async tasks with concurrency control.
 *
 * @param tasks - Array of async tasks to run
 * @param options - Concurrency options
 * @returns Promise that resolves when all tasks are complete
 *
 * @example
 * ```typescript
 *  const urls = ['https://example.com/1', 'https://example.com/2', many more ];
 *
 * // Process up to 5 requests at a time, with progress reporting
 * const results = await runWithConcurrency(
 *   urls.map(url => () => fetch(url).then(res => res.json())),
 *   {
 *     concurrency: 5,
 *     onProgress: (completed, total) => {
 *       console.log(`Progress: ${completed}/${total}`);
 *     }
 *   }
 * );
 * ```
 */
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  options: {
    /** Maximum number of tasks to run at once (default: 3) */
    concurrency?: number;
    /** Called whenever a task completes */
    onProgress?: (completed: number, total: number) => void;
    /** Abort signal to cancel execution */
    signal?: AbortSignal;
  } = {}
): Promise<T[]> {
  const { concurrency = 3, onProgress, signal } = options;
  const results: T[] = [];
  const totalTasks = tasks.length;
  let completed = 0;

  // If no tasks, return empty array
  if (totalTasks === 0) return results;

  // Check if execution is already aborted
  if (signal?.aborted) {
    throw new Error('Aborted');
  }

  return new Promise((resolve, reject) => {
    let taskIndex = 0;

    // Process next task function
    const processNext = async () => {
      // Get current task index and increment
      const currentTaskIndex = taskIndex++;

      // Skip if we've processed all tasks
      if (currentTaskIndex >= totalTasks) return;

      try {
        // Run the task
        const result = await tasks[currentTaskIndex]();

        // Check if aborted during task execution
        if (signal?.aborted) {
          reject(new Error('Aborted'));
          return;
        }

        // Store result and update counters
        results[currentTaskIndex] = result;
        completed++;

        // Call progress callback if provided
        if (onProgress) {
          try {
            onProgress(completed, totalTasks);
          } catch (err) {
            getLogger().error({ err }, 'Error in onProgress callback');
          }
        }
      } catch (error) {
        reject(error);
        return;
      }

      // Check if all tasks are completed
      if (completed === totalTasks) {
        resolve(results);
        return;
      }

      // Process next task
      processNext();
    };

    // Start initial batch of tasks
    const initialBatch = Math.min(concurrency, totalTasks);
    for (let i = 0; i < initialBatch; i++) {
      processNext();
    }

    // Set up abort handler
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          reject(new Error('Aborted'));
        },
        { once: true }
      );
    }
  });
}

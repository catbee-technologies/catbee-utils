/**
 * Delays execution for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} A Promise that resolves after the given time.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a debounced version of a function that delays its execution.
 * Provides `.cancel()` and `.flush()` methods.
 *
 * @template T
 * @param {T} fn - The function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {T & { cancel: () => void; flush: () => void }} A debounced function.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
) {
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
    trailing: false,
  },
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
  onRetry?: (error: unknown, attempt: number) => void,
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
  throw new Error("Retry failed"); // should never reach here
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
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = "Operation timed out",
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((result) => {
        clearTimeout(timeoutHandle);
        resolve(result);
      })
      .catch((err) => {
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
export async function runInBatches<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
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
  drop: boolean = false,
): (...args: TArgs) => Promise<TResult> {
  let promise: Promise<TResult> | null = null;

  return async (...args: TArgs) => {
    if (!promise) {
      promise = fn(...args).finally(() => {
        promise = null;
      });
    } else if (drop) {
      return Promise.reject(new Error("Busy: function already running"));
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
export async function settleAll<T>(
  tasks: (() => Promise<T>)[],
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(tasks.map((task) => task()));
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
    },
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
  Object.defineProperty(enqueue, "length", {
    get: () => queue.length,
  });
  Object.defineProperty(enqueue, "isPaused", {
    get: () => paused,
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
export async function runInSeries<T>(
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

/**
 * Delays execution for a specified number of milliseconds.
 *
 * @param ms - The number of milliseconds to sleep.
 * @returns A Promise that resolves after the given time.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a debounced version of a function that delays its execution.
 *
 * @param fn - The function to debounce.
 * @param delay - Delay in milliseconds.
 * @returns A debounced function.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Creates a throttled version of a function that limits its execution rate.
 *
 * @param fn - The function to throttle.
 * @param limit - Minimum time between calls in milliseconds.
 * @returns A throttled function.
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Retries an asynchronous function a given number of times with optional delay.
 *
 * @param fn - The async function to retry.
 * @param retries - Number of retry attempts (default: 3).
 * @param delay - Delay in milliseconds between retries (default: 500).
 * @returns The result of the async function if it succeeds.
 * @throws The last encountered error if all retries fail.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(delay);
    }
  }
  throw new Error("Retry failed"); // should never reach here
}

/**
 * Wraps a promise and rejects it if it doesn't resolve within the specified timeout.
 * @param promise - The original promise
 * @param ms - Timeout in milliseconds
 * @param message - Optional timeout message
 * @returns Promise that resolves/rejects within the timeout
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
 *
 * @param tasks - An array of functions that return Promises.
 * @param limit - Number of tasks to run in parallel per batch.
 * @returns A promise that resolves to an array of resolved values.
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
 *
 * @param fn - The async function to make singleton.
 * @returns A wrapped function with singleton behavior.
 */
export function singletonAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  let promise: Promise<TResult> | null = null;

  return async (...args: TArgs) => {
    if (!promise) {
      promise = fn(...args).finally(() => {
        promise = null;
      });
    }
    return promise;
  };
}

/**
 * Resolves a list of async tasks in parallel, returning both resolved and rejected results.
 * Useful for when you want all results and not fail fast.
 * @param tasks - Array of promise-returning functions
 * @returns Results including status and value/reason
 */
export async function settleAll<T>(
  tasks: (() => Promise<T>)[],
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(tasks.map((task) => task()));
}

/**
 * A simple task queue that executes async tasks with a concurrency limit.
 *
 * @param limit - Maximum number of concurrent tasks.
 * @returns A function to enqueue new tasks.
 */
export function createTaskQueue(limit: number) {
  const queue: (() => Promise<void>)[] = [];
  let activeCount = 0;

  const next = () => {
    if (queue.length === 0 || activeCount >= limit) return;
    const task = queue.shift()!;
    activeCount++;
    task().finally(() => {
      activeCount--;
      next();
    });
  };

  return async function enqueue<T>(taskFn: () => Promise<T>): Promise<T> {
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
}

/**
 * Executes async functions sequentially and collects results.
 * Useful when order matters or tasks depend on each other.
 * @param tasks - Array of promise-returning functions
 * @returns Array of resolved values
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

import { TTLCache } from '@catbee/utils/cache';
import { getLogger } from '@catbee/utils/logger';

/**
 * Options for timing function execution.
 */
export interface TimingOptions {
  /** Optional label for the timing (defaults to function name) */
  label?: string;
  /** Whether to log the timing (default: false) */
  log?: boolean;
  /** Log level to use if logging is enabled (default: 'debug') */
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Result of a timing operation.
 */
export interface TimingResult {
  /** Duration in milliseconds */
  durationMs: number;
  /** Duration in seconds */
  durationSec: number;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Label used for the timing */
  label: string;
}

/**
 * Measure the execution time of a synchronous function.
 *
 * @param fn - Function to measure
 * @param options - Timing options
 * @returns Result containing the return value and timing information
 *
 * @example
 * ```typescript
 * const { result, timing } = timeSync(() => {
 *   // Some expensive operation
 *   return computeResult();
 * }, { label: 'Computation', log: true });
 *
 * console.log(`Result: ${result}, took ${timing.durationMs}ms`);
 * ```
 */
export function timeSync<T>(fn: () => T, options: TimingOptions = {}): { result: T; timing: TimingResult } {
  const { label = fn.name || 'anonymous function', log = false, logLevel = 'debug' } = options;

  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();

  const durationMs = endTime - startTime;
  const durationSec = durationMs / 1000;

  const timing: TimingResult = {
    durationMs,
    durationSec,
    startTime,
    endTime,
    label
  };

  if (log) {
    const logger = getLogger();
    const message = `${label} completed in ${durationMs.toFixed(2)}ms`;

    switch (logLevel) {
      case 'trace':
        logger.trace({ timing }, message);
        break;
      case 'debug':
        logger.debug({ timing }, message);
        break;
      case 'info':
        logger.info({ timing }, message);
        break;
      case 'warn':
        logger.warn({ timing }, message);
        break;
      case 'error':
        logger.error({ timing }, message);
        break;
      default:
        logger.debug({ timing }, message);
        break;
    }
  }

  return { result, timing };
}

/**
 * Measure the execution time of an asynchronous function.
 *
 * @param fn - Async function to measure
 * @param options - Timing options
 * @returns Promise resolving to result and timing information
 *
 * @example
 * ```typescript
 * const { result, timing } = await timeAsync(async () => {
 *   // Some expensive async operation
 *   const data = await fetchData();
 *   return processData(data);
 * }, { label: 'API Request', log: true });
 *
 * console.log(`Fetched ${result.length} items in ${timing.durationSec.toFixed(2)}s`);
 * ```
 */
export async function timeAsync<T>(
  fn: () => Promise<T>,
  options: TimingOptions = {}
): Promise<{ result: T; timing: TimingResult }> {
  const { label = fn.name || 'anonymous async function', log = false, logLevel = 'debug' } = options;

  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();

  const durationMs = endTime - startTime;
  const durationSec = durationMs / 1000;

  const timing: TimingResult = {
    durationMs,
    durationSec,
    startTime,
    endTime,
    label
  };

  if (log) {
    const logger = getLogger();
    const message = `${label} completed in ${durationMs.toFixed(2)}ms`;

    switch (logLevel) {
      case 'trace':
        logger.trace({ timing }, message);
        break;
      case 'debug':
        logger.debug({ timing }, message);
        break;
      case 'info':
        logger.info({ timing }, message);
        break;
      case 'warn':
        logger.warn({ timing }, message);
        break;
      case 'error':
        logger.error({ timing }, message);
        break;
      default:
        logger.debug({ timing }, message);
        break;
    }
  }

  return { result, timing };
}

/**
 * Create a timing decorator for class methods.
 *
 * @param options - Timing options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class DataService {
 *   @timed({ log: true, logLevel: 'info' })
 *   async fetchData() {
 *     // ...implementation
 *   }
 * }
 * ```
 */
export function timed(options: TimingOptions = {}) {
  return function (target: any, propertyKeyOrContext: string | symbol | any, descriptor?: PropertyDescriptor): void {
    let propertyKey: string | symbol;
    let actualDescriptor: PropertyDescriptor;

    // ESNext decorator: second argument is context object
    if (typeof propertyKeyOrContext === 'object' && propertyKeyOrContext !== null && 'name' in propertyKeyOrContext) {
      propertyKey = propertyKeyOrContext.name;
      actualDescriptor = descriptor ?? Object.getOwnPropertyDescriptor(target, propertyKey)!;
    } else {
      // Legacy decorator: second argument is property key
      propertyKey = propertyKeyOrContext;
      actualDescriptor = descriptor ?? Object.getOwnPropertyDescriptor(target, propertyKey)!;
    }

    const originalMethod = actualDescriptor.value;

    actualDescriptor.value = function (...args: any[]) {
      const methodOptions = {
        ...options,
        label: options.label || `${target.constructor.name}.${String(propertyKey)}`
      };

      if (originalMethod.constructor.name === 'AsyncFunction') {
        return timeAsync(() => originalMethod.apply(this, args), methodOptions).then(({ result }) => result);
      } else {
        return timeSync(() => originalMethod.apply(this, args), methodOptions).result;
      }
    };

    // For legacy decorators, assign the new descriptor
    if (descriptor) {
      descriptor.value = actualDescriptor.value;
    } else {
      Object.defineProperty(target, propertyKey, actualDescriptor);
    }
    // No return needed for method decorators
  };
}

/**
 * Memoize function results with optional TTL and max cache size.
 *
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * // Cache results for 30 seconds, with a maximum of 100 entries
 * const cachedFetch = memoize(
 *   async (url) => {
 *     const response = await fetch(url);
 *     return response.json();
 *   },
 *   { ttl: 30000, maxSize: 100, cacheKey: (url) => url }
 * );
 * ```
 */
export function memoize<T, Args extends any[]>(
  fn: (...args: Args) => T,
  options: {
    /** Time-to-live in milliseconds (default: indefinite) */
    ttl?: number;
    /** Maximum cache size (default: unlimited) */
    maxSize?: number;
    /** Function to generate a cache key from arguments */
    cacheKey?: (...args: Args) => string;
    /** Auto-cleanup interval in milliseconds (default: disabled) */
    autoCleanupMs?: number;
  } = {}
) {
  const { ttl, maxSize, autoCleanupMs, cacheKey = (...args) => JSON.stringify(args) } = options;

  // Create a properly configured TTLCache instance
  const cache = new TTLCache<string, T>({
    ttlMs: ttl,
    maxSize: maxSize,
    autoCleanupMs: autoCleanupMs
  });

  return function (...args: Args): T {
    const key = cacheKey(...args);

    // Try to get from cache first - TTLCache handles expiration internally
    const cachedValue = cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // Calculate the value and store in cache with configured TTL
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
}

/**
 * Track memory usage for a function execution.
 *
 * @param fn - Function to track
 * @param options - Memory tracking options
 * @returns Result and memory usage information
 */
export function trackMemoryUsage<T>(
  fn: () => T,
  options: {
    /** Whether to log the memory usage (default: false) */
    log?: boolean;
    /** Label for the memory tracking (default: function name) */
    label?: string;
  } = {}
): { result: T; memoryUsage: { before: NodeJS.MemoryUsage; after: NodeJS.MemoryUsage; diff: Record<string, number> } } {
  const { log = false, label = fn.name || 'anonymous function' } = options;

  // Collect garbage before measuring (optional)
  if (global.gc) {
    global.gc();
  }

  const beforeMemory = process.memoryUsage();
  const result = fn();
  const afterMemory = process.memoryUsage();

  // Calculate differences
  const diff: Record<string, number> = {};
  for (const key in afterMemory) {
    if (Object.prototype.hasOwnProperty.call(afterMemory, key)) {
      diff[key] = (afterMemory as any)[key] - (beforeMemory as any)[key];
    }
  }

  if (log) {
    getLogger().info(
      {
        label,
        memoryBefore: beforeMemory,
        memoryAfter: afterMemory,
        memoryDiff: diff
      },
      `Memory usage for ${label}`
    );
  }

  return {
    result,
    memoryUsage: {
      before: beforeMemory,
      after: afterMemory,
      diff
    }
  };
}

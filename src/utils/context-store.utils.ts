import { AsyncLocalStorage } from "async_hooks";

/**
 * Type representing the store object used in AsyncLocalStorage.
 * Keys must be unique symbols to ensure isolation and prevent collisions.
 */
export interface Store {
  [key: symbol]: unknown;
}

/**
 * Predefined symbols used as keys in AsyncLocalStorage.
 * Add new symbols here to avoid duplication.
 */
export const StoreKeys = {
  LOGGER: Symbol("logger"),
  REQUEST_ID: Symbol("requestId"),
};

/**
 * Retrieves the current request ID from the async context, if available.
 *
 * @returns {string | undefined} The request ID string or undefined if not present in the current context.
 */
export function getRequestId(): string | undefined {
  return ContextStore.get<string>(StoreKeys.REQUEST_ID);
}

/**
 * ContextStore manages per-request scoped context using AsyncLocalStorage.
 * It allows storing and retrieving data across async calls (e.g., request ID, logger).
 *
 * Example (Express middleware):
 * ```
 * // Middleware to initialize context and logger
 * app.use((req, res, next) => {
 *   const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();
 *   ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
 *     ContextStore.set(StoreKeys.LOGGER, getLogger().child({ reqId: requestId }));
 *     next();
 *   });
 * });
 * ```
 */
export class ContextStore {
  /**
   * The underlying AsyncLocalStorage instance for context.
   * @private
   */
  private static readonly storage = new AsyncLocalStorage<Store>();

  /**
   * Returns the raw AsyncLocalStorage instance for advanced access.
   *
   * @returns {AsyncLocalStorage<Store>} The AsyncLocalStorage instance.
   */
  static getInstance(): AsyncLocalStorage<Store> {
    return this.storage;
  }

  /**
   * Retrieves a value from the async context store by symbol key.
   *
   * @typeParam T - The expected return type of the value.
   * @param {symbol} key - Unique symbol used as the store key.
   * @returns {T | undefined} The value found (typed) or undefined if not present.
   */
  static get<T>(key: symbol): T | undefined {
    const store = this.storage.getStore();
    return store?.[key] as T | undefined;
  }

  /**
   * Sets a value in the current context store by symbol key.
   *
   * @typeParam T - The value type to set.
   * @param {symbol} key - Unique symbol key.
   * @param {T} value - Value to set in context.
   * @throws {Error} If called outside an active context (not within a .run call or in the wrong async boundaries).
   */
  static set<T>(key: symbol, value: T): void {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error(
        `Failed to set ${String(key)}: AsyncLocalStorage store is not initialized.`,
      );
    }
    store[key] = value;
  }

  /**
   * Retrieves the entire context store object for the current async context.
   *
   * @returns {Store | undefined} The current store object or undefined if called outside a context.
   */
  static getAll(): Store | undefined {
    return this.storage.getStore();
  }

  /**
   * Initializes a new async context and executes a callback within it.
   * This must be called at the beginning of a request or logical async flow.
   *
   * @typeParam T - The callback's return type.
   * @param {Store} store - The initial key-value store object.
   * @param {() => T} callback - The function to run within the new context.
   * @returns {T} The result of the callback function.
   */
  static run<T>(store: Store, callback: () => T): T {
    return this.storage.run(store, callback);
  }
}

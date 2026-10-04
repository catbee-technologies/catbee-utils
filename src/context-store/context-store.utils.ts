import { AsyncLocalStorage } from 'node:async_hooks';
import type { Logger } from 'pino';

/**
 * Type representing the store object used in AsyncLocalStorage.
 * Keys must be unique symbols to ensure isolation and prevent collisions.
 */
export interface Store {
  [key: symbol]: unknown;
}

/**
 * Type-safe wrapper for accessing and modifying context values with specific types.
 *
 * @typeParam T - The value type.
 */
export class TypedContextKey<T> {
  /**
   * Creates a new typed context key.
   * @param symbol - The unique symbol for this key
   * @param defaultValue - Optional default value if key is not found
   */
  constructor(
    private readonly symbol: symbol,
    private readonly defaultValue?: T
  ) {}

  /**
   * Gets the current value for this key.
   * @returns The value or defaultValue if not found
   */
  get(): T | undefined {
    return ContextStore.get<T>(this.symbol) ?? this.defaultValue;
  }

  /**
   * Sets the value for this key.
   * @param value The value to set
   */
  set(value: T): void {
    ContextStore.set<T>(this.symbol, value);
  }

  /**
   * Checks if this key exists in the context.
   * @returns True if the key exists
   */
  exists(): boolean {
    return ContextStore.has(this.symbol);
  }

  /**
   * Deletes this key from the context.
   * @returns True if the key was deleted
   */
  delete(): boolean {
    return ContextStore.delete(this.symbol);
  }

  /**
   * Gets the symbol for this key.
   * @returns Symbol for this key
   */
  getSymbol(): symbol {
    return this.symbol;
  }
}

export type ContextKey<T = unknown> = symbol | TypedContextKey<T>;

/**
 * Predefined symbols used as keys in AsyncLocalStorage.
 * Add new symbols here to avoid duplication.
 */
export const StoreKeys = {
  LOGGER: Symbol('LOGGER'),
  REQUEST_ID: Symbol('REQUEST_ID'),
  CORRELATION_ID: Symbol('CORRELATION_ID'),
  USER_ID: Symbol('USER_ID'),
  TRANSACTION_ID: Symbol('TRANSACTION_ID'),
  TENANT_ID: Symbol('TENANT_ID'),
  TRACE_ID: Symbol('TRACE_ID'),
  SPAN_ID: Symbol('SPAN_ID'),
  MESSAGE_ID: Symbol('MESSAGE_ID'),
  MESSAGE_TYPE: Symbol('MESSAGE_TYPE'),
  QUEUE_NAME: Symbol('QUEUE_NAME')
} as const;

export const TypedStoreKeys = {
  LOGGER: new TypedContextKey<Logger>(StoreKeys.LOGGER),
  REQUEST_ID: new TypedContextKey<string>(StoreKeys.REQUEST_ID),
  CORRELATION_ID: new TypedContextKey<string>(StoreKeys.CORRELATION_ID),
  USER_ID: new TypedContextKey<string>(StoreKeys.USER_ID),
  TRANSACTION_ID: new TypedContextKey<string>(StoreKeys.TRANSACTION_ID),
  TENANT_ID: new TypedContextKey<string>(StoreKeys.TENANT_ID),
  TRACE_ID: new TypedContextKey<string>(StoreKeys.TRACE_ID),
  SPAN_ID: new TypedContextKey<string>(StoreKeys.SPAN_ID),
  MESSAGE_ID: new TypedContextKey<string>(StoreKeys.MESSAGE_ID),
  MESSAGE_TYPE: new TypedContextKey<string>(StoreKeys.MESSAGE_TYPE),
  QUEUE_NAME: new TypedContextKey<string>(StoreKeys.QUEUE_NAME)
} as const;

/**
 * Retrieves the current request ID from the async context, if available.
 *
 * @returns {string | undefined} The request ID string or undefined if not present in the current context.
 */
export function getRequestId(): string | undefined {
  return TypedStoreKeys.REQUEST_ID.get();
}

function resolveKey<T>(key: ContextKey<T>): symbol {
  return key instanceof TypedContextKey ? key.getSymbol() : key;
}

/**
 * Type-safe getter for common context values.
 *
 * @param key The store key symbol
 * @returns The typed value from the store
 */
export function getFromContext<T>(key: ContextKey<T>): T | undefined {
  const symbol = resolveKey(key);
  return ContextStore.get<T>(symbol);
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
 *     ContextStore.set(StoreKeys.LOGGER, getLogger().child({ requestId }));
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
  static get<T>(key: ContextKey<T>): T | undefined {
    const symbol = resolveKey(key);
    const store = this.storage.getStore();
    return store?.[symbol] as T | undefined;
  }

  /**
   * Sets a value in the current context store by symbol key.
   *
   * @typeParam T - The value type to set.
   * @param {symbol} key - Unique symbol key.
   * @param {T} value - Value to set in context.
   * @throws {Error} If called outside an active context (not within a .run call or in the wrong async boundaries).
   */
  static set<T>(key: ContextKey<T>, value: T): void {
    const symbol = resolveKey(key);
    const store = this.storage.getStore();
    if (!store) {
      throw new Error(`Failed to set ${String(symbol)}: AsyncLocalStorage store is not initialized.`);
    }
    store[symbol] = value;
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

  /**
   * Checks if a key exists in the current context store.
   *
   * @param {symbol} key - The symbol key to check.
   * @returns {boolean} True if the key exists, false otherwise.
   */
  static has(key: ContextKey): boolean {
    const symbol = resolveKey(key);
    const store = this.storage.getStore();
    return store !== undefined && symbol in store;
  }

  /**
   * Removes a value from the current context store by symbol key.
   *
   * @param {symbol} key - The symbol key to delete.
   * @returns {boolean} True if the key was deleted, false if the key wasn't found or no active context.
   * @throws {Error} If called outside an active context.
   */
  static delete(key: ContextKey): boolean {
    const symbol = resolveKey(key);
    const store = this.storage.getStore();
    if (!store) {
      throw new Error(`Failed to delete ${String(symbol)}: AsyncLocalStorage store is not initialized.`);
    }
    return delete store[symbol];
  }

  /**
   * Updates multiple values in the current context store at once.
   *
   * @param {Partial<Record<symbol, unknown>>} values - Object containing symbol keys and values to update.
   * @throws {Error} If called outside an active context.
   */
  static patch(values: Partial<Record<symbol, unknown>>): void {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error('Failed to patch: AsyncLocalStorage store is not initialized.');
    }
    Object.getOwnPropertySymbols(values).forEach(key => {
      store[key] = values[key];
    });
  }
  /**
   * Executes a callback with a temporary store value that only exists during execution.
   * Original store is restored after callback completes.
   *
   * @typeParam T - The callback's return type.
   * @param {symbol} key - The symbol key to temporarily set.
   * @param {unknown} value - The temporary value.
   * @param {() => T} callback - The function to execute with the temporary value.
   * @returns {T} The result of the callback function.
   * @throws {Error} If called outside an active context.
   */
  static withValue<T, V>(key: ContextKey<V>, value: V, callback: () => T): T {
    const symbol = resolveKey(key);
    const currentStore = this.storage.getStore();

    if (!currentStore) {
      throw new Error('Failed to set temporary value: AsyncLocalStorage store is not initialized.');
    }

    const newStore: Store = {
      ...currentStore,
      [symbol]: value
    };

    return this.storage.run(newStore, callback);
  }

  /**
   * Creates a new context that inherits values from the current context.
   *
   * @typeParam T - The callback's return type.
   * @param {Partial<Record<symbol, unknown>>} newValues - New values to add to or override in the context.
   * @param {() => T} callback - The function to execute in the new context.
   * @returns {T} The result of the callback function.
   */
  static extend<T>(newValues: Partial<Record<symbol, unknown>>, callback: () => T): T {
    const currentStore = this.storage.getStore() || {};

    // Create new store with current values plus new ones
    const newStore: Store = { ...currentStore };

    // Add new values
    Object.getOwnPropertySymbols(newValues).forEach(key => {
      newStore[key] = newValues[key];
    });

    // Run with extended store
    return this.storage.run(newStore, callback);
  }

  /**
   * Creates Express middleware that initializes a context for each request.
   *
   * @param {(req: any) => Partial<Record<symbol, unknown>>} initialValuesFactory - Function that returns initial context values.
   * @returns Express middleware function.
   */
  static createExpressMiddleware(initialValuesFactory: (req: any) => Partial<Record<symbol, unknown>> = () => ({})) {
    return (req: any, _res: any, next: any) => {
      const initialValues = initialValuesFactory(req);
      ContextStore.run(initialValues as Store, next);
    };
  }
}

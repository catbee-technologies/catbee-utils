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
 * @returns The request ID string or undefined if not present.
 */
export function getRequestId(): string | undefined {
  return ContextStore.get<string>(StoreKeys.REQUEST_ID);
}

/**
 * ContextStore manages per-request scoped context using AsyncLocalStorage.
 * It allows storing and retrieving data across async calls (e.g., request ID, logger).
 *
 * 🧪 Example (Express middleware usage):
 *
 * ```ts
 * // ✅ Recommended: Unified middleware to initialize context and logger
 * import { ContextStore, StoreKeys } from "./context-store";
 * import { getLogger } from "./logger";
 * import crypto from "crypto";
 *
 * export function setupRequestContext(req: Request, res: Response, next: NextFunction): void {
 *   const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();
 *
 *   ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
 *     const logger = getLogger().child({ reqId: requestId });
 *     ContextStore.set(StoreKeys.LOGGER, logger);
 *     logger.info("Request context initialized");
 *     next();
 *   });
 * }
 *
 * // In your app entry point
 * app.use(setupRequestContext);
 * ```
 *
 * 👇 Alternatively, split it into two separate middlewares:
 *
 * ```ts
 * // First: Initialize context with request ID
 * app.use((req, res, next) => {
 *   const requestId = req.headers["x-request-id"] || crypto.randomUUID();
 *   ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => next());
 * });
 *
 * // Second: Inject logger into the context
 * app.use((req, res, next) => {
 *   const logger = getLogger().child({ reqId: req.headers["x-request-id"] });
 *   ContextStore.set(StoreKeys.LOGGER, logger);
 *   logger.info("Request started");
 *   next();
 * });
 * ```
 */
export class ContextStore {
  private static readonly storage = new AsyncLocalStorage<Store>();

  /**
   * Returns the raw AsyncLocalStorage instance.
   */
  static getInstance(): AsyncLocalStorage<Store> {
    return this.storage;
  }

  /**
   * Retrieves a value from the store using the provided symbol key.
   *
   * @template T - The expected return type of the value.
   * @param key - Unique symbol used as the store key.
   * @returns The value or undefined if not present.
   */
  static get<T>(key: symbol): T | undefined {
    const store = this.storage.getStore();
    return store?.[key] as T | undefined;
  }

  /**
   * Sets a value in the current context by symbol key.
   *
   * @template T - The value type.
   * @param key - Unique symbol key.
   * @param value - Value to set in context.
   * @throws Error if called outside an active context (i.e., not within `run`).
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
   * Retrieves the entire context store object.
   */
  static getAll(): Store | undefined {
    return this.storage.getStore();
  }

  /**
   * Initializes a new async context and executes a callback within it.
   * This must be called at the beginning of a request or async flow.
   *
   * @param store - Initial key-value store object.
   * @param callback - The function to run within the context.
   * @returns The return value of the callback.
   */
  static run<T>(store: Store, callback: () => T): T {
    return this.storage.run(store, callback);
  }
}

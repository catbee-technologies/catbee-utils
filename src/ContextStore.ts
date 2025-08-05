import { AsyncLocalStorage } from "async_hooks";

/**
 * Type representing the store object used in AsyncLocalStorage.
 * Keys are unique symbols to ensure isolation and prevent accidental overrides.
 */
export interface Store {
  [key: symbol]: unknown;
}

/**
 * Central registry of known symbols used as keys in AsyncLocalStorage.
 * Add more symbols here to standardize store access across the app.
 */
export const StoreKeys = {
  LOGGER: Symbol("logger"),
};

/**
 * Helper class for interacting with per-request scoped AsyncLocalStorage.
 * All access is static, and symbol keys are used for namespacing.
 */
export class ContextStore {
  /** Internal AsyncLocalStorage instance */
  private static readonly storage = new AsyncLocalStorage<Store>();

  /**
   * Returns the AsyncLocalStorage instance.
   * Useful for advanced extensions (e.g. context propagation across boundaries).
   */
  static getInstance(): AsyncLocalStorage<Store> {
    return this.storage;
  }

  /**
   * Retrieves a value from the store by its symbol key.
   *
   * @template T - The expected return type.
   * @param key - Symbol used as the store key.
   * @returns The stored value or undefined if not present or store is uninitialized.
   */
  static get<T>(key: symbol): T | undefined {
    const store = this.storage.getStore();
    return store?.[key] as T | undefined;
  }

  /**
   * Sets a value in the current context store by symbol key.
   *
   * @template T - Type of value to store.
   * @param key - Symbol used as the store key.
   * @param value - Value to store.
   * @throws If store is not initialized (i.e., outside of a run context).
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
   * Returns the full store object (if available).
   *
   * @returns Current store or undefined if outside of a context.
   */
  static getAll(): Store | undefined {
    return this.storage.getStore();
  }

  /**
   * Runs a function within a new async context.
   * This initializes the store and is typically called per request.
   *
   * @param store - Initial store object.
   * @param callback - Function to execute within this context.
   * @returns Result of the callback.
   */
  static run<T>(store: Store, callback: () => T): T {
    return this.storage.run(store, callback);
  }
}

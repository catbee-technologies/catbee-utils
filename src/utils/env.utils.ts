/* eslint-disable n/no-process-env */

/**
 * Enum representing valid application environments.
 */
export enum Environment {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
  STAGING = "staging",
  TESTING = "testing",
}

/**
 * Utility class for accessing and managing environment variables.
 * Provides typed getters with fallback defaults and validation.
 */
export class Env {
  /**
   * Checks if the current NODE_ENV is 'development'.
   *
   * @returns {boolean} `true` if NODE_ENV is 'development', else `false`.
   */
  static isDev(): boolean {
    return (
      Env.get("NODE_ENV", Environment.DEVELOPMENT) === Environment.DEVELOPMENT
    );
  }

  /**
   * Sets an environment variable (only affects runtime memory).
   *
   * @param {string} key - The environment variable key.
   * @param {string} value - The value to set.
   */
  static set(key: string, value: string): void {
    process.env[key] = value;
  }

  /**
   * Returns all environment variables as an object.
   *
   * @returns {object} The current `process.env` object.
   */
  static getAll(): object {
    return process.env;
  }

  /**
   * Retrieves a string environment variable with a fallback default.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Value to return if the key is missing.
   * @returns {string | undefined} The env value or the fallback.
   */
  static get(key: string, defaultValue?: string): string | undefined {
    return process.env[key] ?? defaultValue;
  }

  /**
   * Retrieves a string environment variable and throws if it's missing.
   *
   * @param {string} key - The environment variable key.
   * @returns {string} The environment variable's value.
   * @throws {Error} If the variable is not defined.
   */
  static getRequired(key: string): string {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Required env ${key} is missing`);
    }
    return value;
  }

  /**
   * Retrieves an environment variable as a number, or returns a default.
   *
   * @param {string} key - The environment variable key.
   * @param {number} defaultValue - Fallback number if key is not present.
   * @returns {number} Parsed numeric value or default.
   * @throws {Error} If the value is not a valid number.
   */
  static getNumber(key: string, defaultValue: number): number {
    const value = process.env[key] ?? defaultValue;
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      throw new Error(`Env ${key} is not a number`);
    }
    return numberValue;
  }

  /**
   * Retrieves a required environment variable as a number.
   *
   * @param {string} key - The environment variable key.
   * @returns {number} Parsed number.
   * @throws {Error} If the value is missing or not a number.
   */
  static getNumberRequired(key: string): number {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Required env ${key} is missing`);
    }
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      throw new Error(`Required env ${key} is not a number`);
    }
    return numberValue;
  }

  /**
   * Retrieves an environment variable as a boolean.
   * Accepts `true`, `1`, `yes`, `on` as true; `false`, `0`, `no`, `off` as false.
   *
   * @param {string} key - The environment variable key.
   * @param {boolean} [defaultValue=false] - Optional fallback value if key is missing.
   * @returns {boolean} Parsed boolean.
   * @throws {Error} If the value is not a recognized boolean string.
   */
  static getBoolean(key: string, defaultValue = false): boolean {
    const value = (process.env[key] ?? defaultValue).toString().toLowerCase();
    if (["true", "1", "yes", "on"].includes(value)) return true;
    if (["false", "0", "no", "off"].includes(value)) return false;
    throw new Error(`Env variable ${key} is not a boolean`);
  }

  /**
   * Retrieves a required environment variable as a boolean.
   *
   * @param {string} key - The environment variable key.
   * @returns {boolean} Parsed boolean value.
   * @throws {Error} If missing or invalid.
   */
  static getBooleanRequired(key: string): boolean {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Required env ${key} is missing`);
    }
    return this.getBoolean(key); // reuse logic
  }

  /**
   * Parses a stringified JSON object from an environment variable.
   *
   * @typeParam T - The type to parse as (defaults to `object`).
   * @param {string} key - The environment variable key.
   * @param {T} defaultValue - Value to return if key is missing.
   * @returns {T} Parsed object or default.
   * @throws {Error} If the value is not valid JSON.
   */
  static getJSON<T extends object = object>(key: string, defaultValue: T): T {
    const v = process.env[key];
    if (v !== undefined) {
      try {
        return JSON.parse(v);
      } catch {
        throw new Error(`Env variable ${key} is not a valid JSON string`);
      }
    }
    return defaultValue;
  }

  /**
   * Parses a comma-separated string as an array.
   *
   * @typeParam T - The item type (optional, defaults to string).
   * @param {string} key - The environment variable key.
   * @param {T[]} [defaultValue=[]] - Array to return if value is empty or missing.
   * @param {string} [splitter=','] - Delimiter to split on.
   * @returns {string[] | T[]} An array of strings.
   */
  static getArray<T = string>(
    key: string,
    defaultValue: T[] = [],
    splitter = ",",
  ): string[] | T[] {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      return defaultValue;
    }
    return value
      .split(splitter)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Retrieves an enum-like environment variable value, validating against allowed values.
   *
   * @typeParam T - The allowed value type (string literal types).
   * @param {string} key - The environment variable key.
   * @param {T[]} allowedValues - Array of accepted string values.
   * @param {T} [defaultValue] - Optional fallback value.
   * @returns {T} The validated environment value.
   * @throws {Error} If missing or invalid.
   */
  static getEnum<T extends string>(
    key: string,
    allowedValues: T[],
    defaultValue?: T,
  ): T {
    const value = process.env[key] ?? defaultValue;
    if (!value || !allowedValues.includes(value as T)) {
      throw new Error(
        `Env ${key} must be one of ${allowedValues.join(", ")}. Received: ${value}`,
      );
    }
    return value as T;
  }

  /**
   * Checks whether the specified environment variable exists.
   *
   * @param {string} key - The environment variable key.
   * @returns {boolean} `true` if the variable is defined, otherwise `false`.
   */
  static has(key: string): boolean {
    return process.env[key] !== undefined;
  }

  /**
   * Deletes the given environment variable (useful in tests).
   *
   * @param {string} key - The environment variable key to delete.
   * @returns {void}
   */
  static delete(key: string): void {
    delete process.env[key];
  }
}

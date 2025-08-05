/* eslint-disable n/no-process-env */

/**
 * Utility class for accessing and managing environment variables.
 * Provides typed getters with default values and error handling.
 */
export class EnvHelper {
  /**
   * Sets an environment variable (only affects runtime memory, not .env files).
   *
   * @param key - The environment variable key.
   * @param value - The value to set.
   */
  static set(key: string, value: string): void {
    process.env[key] = value;
  }

  /**
   * Returns all environment variables as an object.
   *
   * @returns The current `process.env` object.
   */
  static getAll(): object {
    return process.env;
  }

  /**
   * Retrieves a string environment variable with a fallback default.
   *
   * @param key - The environment variable key.
   * @param defaultValue - Value to return if the key is missing.
   * @returns The environment variable's value or the fallback.
   */
  static get(key: string, defaultValue: string): string {
    let value = process.env[key];
    if (value === undefined) {
      return defaultValue;
    }
    return value;
  }

  /**
   * Retrieves a string environment variable and throws if it's missing.
   *
   * @param key - The environment variable key.
   * @returns The required environment variable's value.
   * @throws If the variable is not defined.
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
   * @param key - The environment variable key.
   * @param defaultValue - Fallback number if key is not present.
   * @returns Parsed numeric value or default.
   * @throws If the value is not a valid number.
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
   * @param key - The environment variable key.
   * @returns Parsed number.
   * @throws If the value is missing or not a number.
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
   * @param key - The environment variable key.
   * @param defaultValue - Optional fallback value if key is missing.
   * @returns Parsed boolean.
   * @throws If the value is not a recognized boolean string.
   */
  static getBoolean(key: string, defaultValue = false): boolean {
    const value = (process.env[key] ?? defaultValue).toString().toLowerCase();
    if (["true", "1", "yes", "on"].includes(value)) return true;
    if (["false", "0", "no", "off"].includes(value)) return false;
    throw new Error(`Env variable ${key} is not a boolean`);
  }

  /**
   * Parses a stringified JSON object from an environment variable.
   *
   * @param key - The environment variable key.
   * @param defaultValue - Value to return if key is missing.
   * @returns Parsed object or default.
   * @throws If the value is not a valid JSON string.
   */
  static getJSON(key: string, defaultValue: object) {
    const v = process.env[key];
    if (v !== undefined) {
      try {
        return JSON.parse(v);
      } catch {
        throw new Error(`Env variable ${key} is not a stringified JSON`);
      }
    }
    return defaultValue;
  }

  /**
   * Parses a comma-separated string as an array.
   *
   * @template T
   * @param key - The environment variable key.
   * @param defaultValue - Array to return if value is empty or missing.
   * @param splitter - Delimiter to split on (default is `,`).
   * @returns An array of strings (or type `T[]` if cast later).
   */
  static getArray<T>(
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
}

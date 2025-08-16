/* eslint-disable n/no-process-env */
import { existsSync } from 'fs';
import { isAbsolute, resolve } from 'path';
/**
 * Enum representing valid application environments.
 */
export enum Environment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  TESTING = 'testing'
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
    return Env.get('NODE_ENV', Environment.DEVELOPMENT) === Environment.DEVELOPMENT;
  }

  /**
   * Checks if the current NODE_ENV is 'production'.
   *
   * @returns {boolean} `true` if NODE_ENV is 'production', else `false`.
   */
  static isProd(): boolean {
    return Env.get('NODE_ENV') === Environment.PRODUCTION;
  }

  /**
   * Checks if the current NODE_ENV is 'testing'.
   *
   * @returns {boolean} `true` if NODE_ENV is 'testing', else `false`.
   */
  static isTest(): boolean {
    return Env.get('NODE_ENV') === Environment.TESTING;
  }

  /**
   * Checks if the current NODE_ENV is 'staging'.
   *
   * @returns {boolean} `true` if NODE_ENV is 'staging', else `false`.
   */
  static isStaging(): boolean {
    return Env.get('NODE_ENV') === Environment.STAGING;
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
    if (['true', '1', 'yes', 'on'].includes(value)) return true;
    if (['false', '0', 'no', 'off'].includes(value)) return false;
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
  static getArray<T = string>(key: string, defaultValue: T[] = [], splitter = ','): string[] | T[] {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      return defaultValue;
    }
    return value
      .split(splitter)
      .map(item => item.trim())
      .filter(item => item.length > 0);
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
  static getEnum<T extends string>(key: string, allowedValues: T[], defaultValue?: T): T {
    const value = process.env[key] ?? defaultValue;
    if (!value || !allowedValues.includes(value as T)) {
      throw new Error(`Env ${key} must be one of ${allowedValues.join(', ')}. Received: ${value}`);
    }
    return value as T;
  }

  /**
   * Retrieves a URL environment variable and validates it.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Optional fallback value.
   * @param {object} [options] - Validation options.
   * @param {string[]} [options.protocols] - Allowed protocols.
   * @param {boolean} [options.requireTld=true] - Whether TLD is required.
   * @returns {string} The validated URL.
   * @throws {Error} If URL is invalid.
   */
  static getUrl(
    key: string,
    defaultValue?: string,
    options: { protocols?: string[]; requireTld?: boolean } = {}
  ): string {
    const value = Env.get(key, defaultValue);
    if (!value) {
      throw new Error(`Env ${key} is missing or empty`);
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Env ${key} is not a valid URL`);
    }

    if (options.protocols && options.protocols.length > 0) {
      const protocol = url.protocol.replace(':', '');
      if (!options.protocols.includes(protocol)) {
        throw new Error(`Env ${key} must use one of the protocols: ${options.protocols.join(', ')}`);
      }
    }

    if (options.requireTld === true) {
      // Check if hostname has a TLD (contains at least one dot and doesn't end with a dot)
      // localhost, 127.0.0.1, etc. don't have TLDs
      const hostname = url.hostname;
      if (
        !hostname.includes('.') ||
        hostname === 'localhost' ||
        /^[\d.]+$/.test(hostname) || // IP address
        hostname.endsWith('.')
      ) {
        throw new Error(`Env ${key} must have a valid host with TLD`);
      }
    }

    return value;
  }

  /**
   * Retrieves an email environment variable and validates it.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Optional fallback value.
   * @returns {string} The validated email address.
   * @throws {Error} If email is invalid.
   */
  static getEmail(key: string, defaultValue?: string): string {
    const value = Env.get(key, defaultValue);

    if (!value) {
      if (defaultValue === undefined) {
        throw new Error(`Email env ${key} is missing`);
      }
      return defaultValue;
    }

    // Simple email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      throw new Error(`Env ${key} is not a valid email address`);
    }

    return value;
  }

  /**
   * Retrieves a path environment variable and validates it exists.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Optional fallback value.
   * @param {object} [options] - Validation options.
   * @param {boolean} [options.mustExist=false] - Whether path must exist.
   * @param {boolean} [options.makeAbsolute=true] - Convert relative paths to absolute.
   * @returns {string} The validated path.
   * @throws {Error} If path is invalid.
   */
  static getPath(
    key: string,
    defaultValue?: string,
    options: { mustExist?: boolean; makeAbsolute?: boolean } = {}
  ): string {
    const value = Env.get(key, defaultValue);

    if (!value) {
      if (defaultValue === undefined) {
        throw new Error(`Path env ${key} is missing`);
      }
      return defaultValue;
    }

    const path = options.makeAbsolute !== false && !isAbsolute(value) ? resolve(process.cwd(), value) : value;

    if (options.mustExist && !existsSync(path)) {
      throw new Error(`Path in env ${key} does not exist: ${path}`);
    }

    return path;
  }

  /**
   * Retrieves a port environment variable and validates it.
   *
   * @param {string} key - The environment variable key.
   * @param {number} [defaultValue=3000] - Optional fallback value.
   * @returns {number} The validated port number.
   * @throws {Error} If port is invalid.
   */
  static getPort(key: string, defaultValue: number = 3000): number {
    const port = Env.getNumber(key, defaultValue);

    if (port < 0 || port > 65535) {
      throw new Error(`Env ${key} must be a valid port number (0-65535)`);
    }

    return port;
  }

  /**
   * Retrieves a duration string and converts to milliseconds.
   * Supports formats like "1d", "2h", "30m", "45s", "100ms" or combinations like "1h30m".
   *
   * @param {string} key - The environment variable key.
   * @param {string|number} [defaultValue='0'] - Optional fallback value.
   * @returns {number} The duration in milliseconds.
   * @throws {Error} If duration format is invalid.
   */
  static getDuration(key: string, defaultValue: string | number = '0'): number {
    const value = Env.get(key, String(defaultValue));

    if (!value) return 0;

    // Handle plain number input (assume milliseconds)
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    // Parse duration string like "1d2h30m15s"
    const durationRegex = /(\d+d)?(\d+h)?(\d+m)?(\d+s)?(\d+ms)?/;
    const matches = value.match(durationRegex);

    if (!matches || matches[0] === '') {
      throw new Error(`Env ${key} has invalid duration format. Use 1d, 2h, 30m, 45s, or 100ms.`);
    }

    let ms = 0;

    if (matches[1]) ms += parseInt(matches[1], 10) * 86400000; // days
    if (matches[2]) ms += parseInt(matches[2], 10) * 3600000; // hours
    if (matches[3]) ms += parseInt(matches[3], 10) * 60000; // minutes
    if (matches[4]) ms += parseInt(matches[4], 10) * 1000; // seconds
    if (matches[5]) ms += parseInt(matches[5], 10); // milliseconds

    return ms;
  }

  /**
   * Gets all environment variables with sensitive values masked for safe logging.
   *
   * @param {string[]} [sensitiveKeys=['password', 'secret', 'key', 'token', 'auth']] - Keys to mask.
   * @returns {Record<string, string>} Environment variables with sensitive values masked.
   */
  static getSafeEnv(sensitiveKeys: string[] = ['password', 'secret', 'key', 'token', 'auth']): Record<string, string> {
    const safeEnv: Record<string, string> = {};

    for (const [key, value] of Object.entries(process.env)) {
      if (!value) continue;

      const isSensitive = sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()));

      safeEnv[key] = isSensitive ? '******' : value;
    }

    return safeEnv;
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

/* eslint-disable n/no-process-env */
import { existsSync, readFileSync } from 'fs';
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
 * Options for validating URL environment variables
 */
export interface UrlOptions {
  /** List of allowed protocols (e.g., ['http', 'https']) */
  protocols?: string[];
  /** Whether a top-level domain is required (default: true) */
  requireTld?: boolean;
  /** Whether to allow IP addresses (default: true) */
  allowIp?: boolean;
  /** Whether to allow localhost (default: true) */
  allowLocalhost?: boolean;
}

/**
 * Options for validating path environment variables
 */
export interface PathOptions {
  /** Whether the path must exist on the filesystem (default: false) */
  mustExist?: boolean;
  /** Whether to convert relative paths to absolute (default: true) */
  makeAbsolute?: boolean;
  /** List of allowed file extensions */
  allowedExtensions?: string[];
}

/**
 * Utility class for accessing and managing environment variables.
 * Provides typed getters with fallback defaults and validation.
 */
export class Env {
  // Cache for parsed values to avoid repeated parsing of complex values
  private static cache: Map<string, any> = new Map();

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
    return Env.get('NODE_ENV', Environment.DEVELOPMENT) === Environment.PRODUCTION;
  }

  /**
   * Checks if the current NODE_ENV is 'testing'.
   *
   * @returns {boolean} `true` if NODE_ENV is 'testing', else `false`.
   */
  static isTest(): boolean {
    return Env.get('NODE_ENV', Environment.DEVELOPMENT) === Environment.TESTING;
  }

  /**
   * Checks if the current NODE_ENV is 'staging'.
   *
   * @returns {boolean} `true` if NODE_ENV is 'staging', else `false`.
   */
  static isStaging(): boolean {
    return Env.get('NODE_ENV', Environment.DEVELOPMENT) === Environment.STAGING;
  }

  /**
   * Sets an environment variable (only affects runtime memory).
   *
   * @param {string} key - The environment variable key.
   * @param {string} value - The value to set.
   */
  static set(key: string, value: string): void {
    process.env[key] = value;

    // Clear all cached values for this key with any prefix
    this.cache.delete(key);
    for (const cacheKey of [...this.cache.keys()]) {
      if (cacheKey.includes(`:${key}`)) {
        this.cache.delete(cacheKey);
      }
    }
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
   * Supports variable expansion with ${VAR_NAME} syntax.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Value to return if the key is missing.
   * @returns {string} The env value or the fallback.
   *
   * @example
   * // If DATABASE_URL is "postgres://localhost:5432/${DB_NAME}"
   * // and DB_NAME is "myapp"
   * const url = Env.get('DATABASE_URL', ''); // "postgres://localhost:5432/myapp"
   */
  static get(key: string, defaultValue: string): string {
    let value = process.env[key] ?? defaultValue;

    // Expand ${VAR} references
    if (value && value.includes('${')) {
      value = value.replace(/\${([A-Za-z0-9_]+)}/g, (_, varName) => {
        return process.env[varName] ?? '';
      });
    }

    return value;
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
      throw new Error(`Required environment variable '${key}' is missing`);
    }
    return Env.get(key, ''); // Use get to handle variable expansion
  }

  /**
   * Retrieves a value using a default generating function if the key doesn't exist.
   * Useful for expensive default calculations.
   *
   * @param {string} key - The environment variable key.
   * @param {() => string} defaultFn - Function that generates default value.
   * @returns {string} The environment value or generated default.
   *
   * @example
   * const hostname = Env.getWithDefault('HOSTNAME', () => {
   *   // Only called if HOSTNAME is not set
   *   return require('os').hostname();
   * });
   */
  static getWithDefault(key: string, defaultFn: () => string): string {
    if (Env.has(key)) {
      return Env.get(key, '');
    }
    return defaultFn();
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
    if (this.cache.has(`number:${key}`)) {
      return this.cache.get(`number:${key}`);
    }

    const value = process.env[key];
    if (value === undefined) {
      return defaultValue;
    }

    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      throw new Error(`Environment variable '${key}' is not a valid number, got: "${value}"`);
    }

    this.cache.set(`number:${key}`, numberValue);
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
      throw new Error(`Required environment variable '${key}' is missing`);
    }

    return Env.getNumber(key, 0); // The default is ignored since we know the key exists
  }

  /**
   * Retrieves an integer environment variable and validates it.
   *
   * @param {string} key - The environment variable key.
   * @param {number} defaultValue - Fallback number if key is not present.
   * @param {object} [options] - Validation options.
   * @param {number} [options.min] - Minimum allowed value.
   * @param {number} [options.max] - Maximum allowed value.
   * @returns {number} The parsed integer.
   *
   * @example
   * // Require PORT to be between 1000 and 9999
   * const port = Env.getInteger('PORT', 3000, { min: 1000, max: 9999 });
   */
  static getInteger(key: string, defaultValue: number, options: { min?: number; max?: number } = {}): number {
    const num = Env.getNumber(key, defaultValue);
    const intValue = Math.floor(num);

    if (intValue !== num) {
      throw new Error(`Environment variable '${key}' must be an integer, got: ${num}`);
    }

    if (options.min !== undefined && intValue < options.min) {
      throw new Error(`Environment variable '${key}' must be at least ${options.min}, got: ${intValue}`);
    }

    if (options.max !== undefined && intValue > options.max) {
      throw new Error(`Environment variable '${key}' must be at most ${options.max}, got: ${intValue}`);
    }

    return intValue;
  }

  /**
   * Retrieves an environment variable as a boolean.
   * Accepts `true`, `1`, `yes`, `on` as true; `false`, `0`, `no`, `off` as false.
   *
   * @param {string} key - The environment variable key.
   * @param {boolean} [defaultValue=false] - Optional fallback value if key is missing.
   * @returns {boolean} Parsed boolean.
   * @throws {Error} If the value is not a recognized boolean string.
   *
   * @example
   * // If DEBUG=yes
   * const isDebug = Env.getBoolean('DEBUG', false); // true
   */
  static getBoolean(key: string, defaultValue = false): boolean {
    if (this.cache.has(`bool:${key}`)) {
      return this.cache.get(`bool:${key}`);
    }

    const value = process.env[key];
    if (value === undefined) {
      return defaultValue;
    }

    const lowerValue = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
      this.cache.set(`bool:${key}`, true);
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(lowerValue)) {
      this.cache.set(`bool:${key}`, false);
      return false;
    }

    throw new Error(
      `Environment variable '${key}' is not a valid boolean, got: "${value}". Use true/false, yes/no, 1/0, or on/off.`
    );
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
      throw new Error(`Required environment variable '${key}' is missing`);
    }
    return Env.getBoolean(key);
  }

  /**
   * Parses a stringified JSON object from an environment variable.
   *
   * @typeParam T - The type to parse as (defaults to `object`).
   * @param {string} key - The environment variable key.
   * @param {T} defaultValue - Value to return if key is missing.
   * @returns {T} Parsed object or default.
   * @throws {Error} If the value is not valid JSON.
   *
   * @example
   * // If CONFIG='{"debug":true,"api":{"url":"https://api.example.com"}}'
   * const config = Env.getJSON('CONFIG', { debug: false });
   * // { debug: true, api: { url: "https://api.example.com" }}
   */
  static getJSON<T extends object = object>(key: string, defaultValue: T): T {
    if (this.cache.has(`json:${key}`)) {
      return this.cache.get(`json:${key}`);
    }

    const v = process.env[key];
    if (v === undefined) {
      return defaultValue;
    }

    try {
      const parsed = JSON.parse(v);
      this.cache.set(`json:${key}`, parsed);
      return parsed;
    } catch (error) {
      throw new Error(`Environment variable '${key}' is not valid JSON: ${(error as Error).message}`);
    }
  }

  /**
   * Parses a comma-separated string as an array.
   *
   * @typeParam T - The item type (optional, defaults to string).
   * @param {string} key - The environment variable key.
   * @param {T[]} [defaultValue=[]] - Array to return if value is empty or missing.
   * @param {string} [splitter=','] - Delimiter to split on.
   * @param {(item: string) => T} [transform] - Optional function to transform each item.
   * @returns {T[]} An array of items.
   *
   * @example
   * // If ALLOWED_IPS=127.0.0.1,192.168.1.1,10.0.0.1
   * const ips = Env.getArray('ALLOWED_IPS');
   * // ["127.0.0.1", "192.168.1.1", "10.0.0.1"]
   *
   * // With transformation function
   * const ports = Env.getArray('PORTS', [], ',', (p) => parseInt(p, 10));
   */
  static getArray<T = string>(
    key: string,
    defaultValue: T[] = [] as unknown as T[],
    splitter = ',',
    transform?: (item: string) => T
  ): T[] {
    const cacheKey = `array:${key}:${splitter}:${transform ? 'transformed' : 'raw'}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const value = process.env[key];
    if (!value || value.trim() === '') {
      return defaultValue;
    }

    const items = value
      .split(splitter)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (transform) {
      try {
        const result = items.map(transform);
        this.cache.set(cacheKey, result);
        return result;
      } catch (error) {
        throw new Error(`Failed to transform items in '${key}': ${(error as Error).message}`);
      }
    }

    const result = items as unknown as T[];
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Parses a comma-separated list of numbers.
   *
   * @param {string} key - The environment variable key.
   * @param {number[]} [defaultValue=[]] - Default value if not present.
   * @param {string} [splitter=','] - Delimiter to split on.
   * @returns {number[]} Array of parsed numbers.
   *
   * @example
   * // If ALLOWED_PORTS=80,443,3000,8080
   * const ports = Env.getNumberArray('ALLOWED_PORTS');
   * // [80, 443, 3000, 8080]
   */
  static getNumberArray(key: string, defaultValue: number[] = [], splitter = ','): number[] {
    return Env.getArray(key, defaultValue, splitter, item => {
      const num = Number(item);
      if (isNaN(num)) {
        throw new Error(`Value "${item}" in array '${key}' is not a valid number`);
      }
      return num;
    });
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
   *
   * @example
   * // If LOG_LEVEL=debug
   * const level = Env.getEnum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'] as const, 'info');
   * // 'debug' (typed as 'debug' | 'info' | 'warn' | 'error')
   */
  static getEnum<T extends string>(key: string, allowedValues: readonly T[], defaultValue: T): T {
    const value = process.env[key];

    if (!value) {
      return defaultValue;
    }

    if (!allowedValues.includes(value as T)) {
      throw new Error(
        `Environment variable '${key}' must be one of: ${allowedValues.join(', ')}. Received: "${value}"`
      );
    }

    return value as T;
  }

  /**
   * Retrieves an enum-like numeric environment variable.
   *
   * @param {string} key - The environment variable key.
   * @param {number[]} allowedValues - Array of accepted values.
   * @param {number} defaultValue - Default value if not present.
   * @returns {number} The validated value.
   *
   * @example
   * // If NODE_VERSION=16
   * const version = Env.getNumberEnum('NODE_VERSION', [14, 16, 18], 16);
   */
  static getNumberEnum(key: string, allowedValues: number[], defaultValue: number): number {
    const value = Env.getNumber(key, defaultValue);

    if (!allowedValues.includes(value)) {
      throw new Error(`Environment variable '${key}' must be one of: ${allowedValues.join(', ')}. Received: ${value}`);
    }

    return value;
  }

  /**
   * Retrieves a URL environment variable and validates it.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Optional fallback value.
   * @param {UrlOptions} [options] - Validation options.
   * @returns {string} The validated URL.
   * @throws {Error} If URL is invalid.
   *
   * @example
   * // Validate API URL requires HTTPS
   * const apiUrl = Env.getUrl('API_URL', 'https://api.example.com', {
   *   protocols: ['https'],
   *   requireTld: true,
   *   allowIp: false
   * });
   */
  static getUrl(key: string, defaultValue: string, options: UrlOptions = {}): string {
    const cacheKey = `url:${key}:${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const value = Env.get(key, defaultValue);
    if (!value) {
      throw new Error(`URL environment variable '${key}' is missing or empty`);
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Environment variable '${key}' is not a valid URL: "${value}"`);
    }

    // Validate protocol
    if (options.protocols && options.protocols.length > 0) {
      const protocol = url.protocol.replace(':', '');
      if (!options.protocols.includes(protocol)) {
        throw new Error(
          `Environment variable '${key}' must use one of the protocols: ${options.protocols.join(', ')}. Got: ${protocol}`
        );
      }
    }

    // Validate hostname
    const { hostname } = url;
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    const isLocalhost = hostname === 'localhost';

    // Check if hostname is an IP address when not allowed
    if (isIp && options.allowIp === false) {
      throw new Error(`Environment variable '${key}' cannot be an IP address: "${hostname}"`);
    }

    // Check if hostname is localhost when not allowed
    if (isLocalhost && options.allowLocalhost === false) {
      throw new Error(`Environment variable '${key}' cannot be localhost`);
    }

    // Check for TLD requirement - include localhost in check if requireTld is true and allowLocalhost is false
    if (options.requireTld === true) {
      if (isLocalhost && options.allowLocalhost !== false) {
        // Localhost is allowed, so no TLD check needed for it
      } else if (isIp && options.allowIp !== false) {
        // IP is allowed, so no TLD check needed for it
      } else if (!hostname.includes('.') || hostname.endsWith('.')) {
        throw new Error(`Environment variable '${key}' must have a valid host with TLD: "${hostname}"`);
      }
    }

    this.cache.set(cacheKey, value);
    return value;
  }

  /**
   * Retrieves an email environment variable and validates it.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Optional fallback value.
   * @returns {string} The validated email address.
   * @throws {Error} If email is invalid.
   *
   * @example
   * const supportEmail = Env.getEmail('SUPPORT_EMAIL', 'support@example.com');
   */
  static getEmail(key: string, defaultValue: string): string {
    if (this.cache.has(`email:${key}`)) {
      return this.cache.get(`email:${key}`);
    }

    const value = Env.get(key, defaultValue);
    if (!value) {
      if (defaultValue === undefined) {
        throw new Error(`Email environment variable '${key}' is missing`);
      }
      return defaultValue;
    }

    // More comprehensive email validation regex
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(value)) {
      throw new Error(`Environment variable '${key}' is not a valid email address: "${value}"`);
    }

    this.cache.set(`email:${key}`, value);
    return value;
  }

  /**
   * Retrieves a path environment variable and validates it exists.
   *
   * @param {string} key - The environment variable key.
   * @param {string} [defaultValue] - Optional fallback value.
   * @param {PathOptions} [options] - Validation options.
   * @returns {string} The validated path.
   * @throws {Error} If path is invalid.
   *
   * @example
   * // Require that the path exists and is a .json file
   * const configPath = Env.getPath('CONFIG_PATH', './config.json', {
   *   mustExist: true,
   *   allowedExtensions: ['.json', '.yaml']
   * });
   */
  static getPath(key: string, defaultValue: string, options: PathOptions = {}): string {
    const cacheKey = `path:${key}:${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const value = Env.get(key, defaultValue);
    if (!value) {
      if (defaultValue === undefined) {
        throw new Error(`Path environment variable '${key}' is missing`);
      }
      return defaultValue;
    }

    const path = options.makeAbsolute !== false && !isAbsolute(value) ? resolve(process.cwd(), value) : value;

    // Validate path exists if required
    if (options.mustExist && !existsSync(path)) {
      throw new Error(`Path in environment variable '${key}' does not exist: "${path}"`);
    }

    // Validate file extension if specified
    if (options.allowedExtensions && options.allowedExtensions.length > 0) {
      const hasValidExtension = options.allowedExtensions.some(ext => path.toLowerCase().endsWith(ext.toLowerCase()));

      if (!hasValidExtension) {
        throw new Error(
          `Path in environment variable '${key}' must have one of these extensions: ${options.allowedExtensions.join(
            ', '
          )}. Got: "${path}"`
        );
      }
    }

    this.cache.set(cacheKey, path);
    return path;
  }

  /**
   * Retrieves a port environment variable and validates it.
   *
   * @param {string} key - The environment variable key.
   * @param {number} [defaultValue] - Optional fallback value.
   * @returns {number} The validated port number.
   * @throws {Error} If port is invalid.
   *
   * @example
   * const serverPort = Env.getPort('PORT', 3000);
   */
  static getPort(key: string, defaultValue: number): number {
    try {
      return Env.getInteger(key, defaultValue, { min: 0, max: 65535 });
    } catch (error) {
      // Rewrite the error message to match the expected pattern
      if ((error as Error).message.includes('must be at most 65535')) {
        throw new Error(`Environment variable '${key}' must be a valid port number (0-65535)`);
      }
      throw error;
    }
  }

  /**
   * Retrieves an ISO date string and converts it to a Date object.
   *
   * @param {string} key - The environment variable key.
   * @param {string|Date} [defaultValue] - Optional fallback value.
   * @returns {Date} The parsed Date object.
   *
   * @example
   * // If EXPIRY_DATE=2023-12-31T23:59:59Z
   * const expiryDate = Env.getDate('EXPIRY_DATE', new Date());
   */
  static getDate(key: string, defaultValue: string | Date = new Date()): Date {
    const value = Env.get(key, defaultValue instanceof Date ? defaultValue.toISOString() : defaultValue);

    if (!value) {
      return defaultValue instanceof Date ? defaultValue : new Date();
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`Environment variable '${key}' is not a valid date: "${value}"`);
    }

    return date;
  }

  /**
   * Retrieves a duration string and converts it to milliseconds.
   * Supports formats like "1d", "2h", "30m", "45s", "100ms" or combinations like "1h30m".
   *
   * @param {string} key - The environment variable key.
   * @param {string|number} [defaultValue='0'] - Optional fallback value.
   * @returns {number} The duration in milliseconds.
   * @throws {Error} If duration format is invalid.
   *
   * @example
   * // If CACHE_TTL=2h30m
   * const cacheTtlMs = Env.getDuration('CACHE_TTL', '1h');
   * // 9000000 (2.5 hours in milliseconds)
   */
  static getDuration(key: string, defaultValue: string | number = '0'): number {
    const cacheKey = `duration:${key}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const value = Env.get(key, String(defaultValue));
    if (!value) return 0;

    // Handle plain number input (assume milliseconds)
    if (/^\d+$/.test(value)) {
      const ms = parseInt(value, 10);
      this.cache.set(cacheKey, ms);
      return ms;
    }

    // Enhanced duration parsing with more precise regex
    const durationRegex = /^(?:(\d+)y)?(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?(?:(\d+)ms)?$/;
    const matches = value.match(durationRegex);

    if (!matches || matches[0] === '') {
      throw new Error(
        `Environment variable '${key}' has invalid duration format: "${value}". ` +
          `Use formats like 1y, 2w, 3d, 4h, 5m, 6s, or 7ms.`
      );
    }

    let ms = 0;

    if (matches[1]) ms += parseInt(matches[1], 10) * 31536000000; // years (approximate)
    if (matches[2]) ms += parseInt(matches[2], 10) * 604800000; // weeks
    if (matches[3]) ms += parseInt(matches[3], 10) * 86400000; // days
    if (matches[4]) ms += parseInt(matches[4], 10) * 3600000; // hours
    if (matches[5]) ms += parseInt(matches[5], 10) * 60000; // minutes
    if (matches[6]) ms += parseInt(matches[6], 10) * 1000; // seconds
    if (matches[7]) ms += parseInt(matches[7], 10); // milliseconds

    this.cache.set(cacheKey, ms);
    return ms;
  }

  /**
   * Gets all environment variables with sensitive values masked for safe logging.
   *
   * @param {string[]} [sensitiveKeys=['password', 'secret', 'key', 'token', 'auth']] - Keys to mask.
   * @returns {Record<string, string>} Environment variables with sensitive values masked.
   *
   * @example
   * console.log(Env.getSafeEnv(['password', 'secret', 'key']));
   * // { DATABASE_URL: "postgres://...", API_KEY: "******", ... }
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
   * Loads environment variables from a .env file.
   * Does not override existing variables.
   *
   * @param {string} [path='.env'] - Path to the .env file.
   * @returns {Record<string, string>} Loaded environment variables.
   *
   * @example
   * // Load variables from .env.development
   * Env.loadFromFile('.env.development');
   */
  static loadFromFile(path: string = '.env'): Record<string, string> {
    if (!existsSync(path)) {
      throw new Error(`Environment file not found: "${path}"`);
    }

    const content = readFileSync(path, 'utf8');
    const variables: Record<string, string> = {};
    const lines = content.split(/\r?\n/);

    let i = 0;
    while (i < lines.length) {
      let line = lines[i].trim();

      // Skip empty lines or comment-only lines
      if (!line || line.startsWith('#')) {
        i++;
        continue;
      }

      const match = line.match(/^([^=]+)=(.*)$/);
      if (!match) {
        i++;
        continue;
      }

      const key = match[1].trim();
      let value = match[2].trim();

      // Remove inline comment for unquoted values
      if (!/^['"]/.test(value)) {
        const hashIndex = value.indexOf(' #');
        if (hashIndex !== -1) {
          value = value.slice(0, hashIndex).trim();
        }
      }

      // Handle quoted values
      if ((value.startsWith('"') || value.startsWith("'")) && value.length > 1) {
        const quote = value[0];
        if (!value.endsWith(quote) || value.length === 1) {
          // multiline quoted
          let multilineValue = value.slice(1);
          i++;
          while (i < lines.length) {
            const nextLine = lines[i];
            if (nextLine.endsWith(quote)) {
              multilineValue += '\n' + nextLine.slice(0, -1);
              break;
            } else {
              multilineValue += '\n' + nextLine;
            }
            i++;
          }
          value = multilineValue;
        } else {
          // single-line quoted
          value = value.slice(1, -1);
        }
      } else {
        // Handle unquoted multiline: continue collecting until next key=value or empty line
        i++;
        while (i < lines.length && !lines[i].includes('=') && lines[i].trim() !== '') {
          value += '\n' + lines[i];
          i++;
        }
        i--; // adjust for outer loop
      }

      if (!process.env[key]) {
        process.env[key] = value;
        variables[key] = value;
      }

      i++;
    }

    return variables;
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
    this.cache.delete(key);

    // Also clear all cached variations of this key
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.includes(`:${key}`)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  /**
   * Clears the internal cache of parsed environment values.
   * Useful for testing or when environment variables might change.
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

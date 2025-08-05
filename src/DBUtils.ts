import type { ConnectionOptions } from "mysql2";
import * as fs from "fs";
import { EnvHelper } from "./EnvHelper";

/**
 * Flag indicating whether to use READ COMMITTED isolation level in DB transactions.
 * This is configured via the `DB_USE_READ_COMMITTED_ISOLATION` environment variable.
 */
export const USE_READ_COMMITTED_ISOLATION = EnvHelper.getBoolean(
  "DB_USE_READ_COMMITTED_ISOLATION",
  false,
);

/**
 * Loads the database password from a file or fallback value.
 *
 * @param passwordFilePath - Path to the file containing the DB password.
 * @param fallbackPassword - Fallback value from environment variable.
 * @returns The resolved database password.
 */
function getDbPassword(
  passwordFilePath: string,
  fallbackPassword: string,
): string {
  if (passwordFilePath) {
    return fs.readFileSync(passwordFilePath, "utf8").trim();
  }
  return fallbackPassword;
}

/**
 * Stores memoized MySQL connection options per prefix.
 */
const memoizedOptions: { [prefix: string]: ConnectionOptions } = {};

/**
 * Returns a memoized MySQL connection configuration.
 *
 * Environment variables used (prefix is optional):
 * - `${prefix}DB_USER` (required)
 * - `${prefix}DB_PASSWORD` or `${prefix}DB_PASSWORD_FILE` (one required)
 * - `${prefix}DB_HOST` (default: 'localhost')
 * - `${prefix}DB_PORT` (default: 3306)
 * - `${prefix}DB_NAME` (default: same as DB_USER)
 * - `${prefix}DB_CONN_OPTIONS` (optional JSON)
 *
 * @param prefix - Optional prefix for environment variable names.
 * @returns The resolved and memoized MySQL connection options.
 * @throws If neither DB_PASSWORD nor DB_PASSWORD_FILE is defined.
 */
export function getMysqlConnectionOptions(prefix = ""): ConnectionOptions {
  if (!memoizedOptions[prefix]) {
    const DB_PASSWORD = EnvHelper.get(`${prefix}DB_PASSWORD`, "");
    const DB_PASSWORD_FILE = EnvHelper.get(`${prefix}DB_PASSWORD_FILE`, "");

    if (!DB_PASSWORD && !DB_PASSWORD_FILE) {
      throw new Error(
        "Either DB_PASSWORD or DB_PASSWORD_FILE environment variable is required.",
      );
    }

    const DB_USER = EnvHelper.getRequired(`${prefix}DB_USER`);
    const DB_HOST = EnvHelper.get(`${prefix}DB_HOST`, "localhost");
    const DB_PORT = EnvHelper.getNumber(`${prefix}DB_PORT`, 3306);
    const DB_NAME = EnvHelper.get(`${prefix}DB_NAME`, DB_USER);
    const DB_CONN_OPTIONS = EnvHelper.getJSON(`${prefix}DB_CONN_OPTIONS`, {});

    const password = getDbPassword(DB_PASSWORD_FILE, DB_PASSWORD);

    const baseOptions: ConnectionOptions = {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password,
      database: DB_NAME,
    };

    // Merge additional custom options if provided
    if (Object.keys(DB_CONN_OPTIONS).length > 0) {
      Object.assign(baseOptions, DB_CONN_OPTIONS);
    }

    memoizedOptions[prefix] = baseOptions;
  }

  return memoizedOptions[prefix];
}

/**
 * Overrides or sets custom MySQL connection options for a specific prefix.
 *
 * @param prefix - Prefix to associate with the options.
 * @param options - The connection options to memoize.
 */
export function setMysqlConnectionOptions(
  prefix: string,
  options: ConnectionOptions,
): void {
  memoizedOptions[prefix] = options;
}

/**
 * Converts a given Date to a UTC-formatted MySQL-compatible string.
 *
 * The output format will be:
 * - `YYYY-MM-DD HH:mm:ss` (default)
 * - `YYYY-MM-DD HH:mm:ss.SSS` (if `mills` is true)
 *
 * MySQL expects datetime values in this string format when inserting or updating.
 *
 * @param date - The JavaScript Date object to convert.
 * @param mills - Whether to include milliseconds in the output (default: false).
 * @returns A string in MySQL datetime format using UTC time.
 *
 * @example
 * getDateAsUTCMysqlString(new Date()); // '2025-08-05 09:14:23'
 * getDateAsUTCMysqlString(new Date(), true); // '2025-08-05 09:14:23.123'
 */
export function getDateAsUTCMysqlString(date: Date, mills = false): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");
  const seconds = `${date.getUTCSeconds()}`.padStart(2, "0");
  const milliseconds = mills
    ? `.${`${date.getUTCMilliseconds()}`.padStart(3, "0")}`
    : "";

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${milliseconds}`;
}

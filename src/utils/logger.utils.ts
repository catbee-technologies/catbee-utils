import pino, { LoggerOptions, stdTimeFunctions } from "pino";
import type { Logger } from "pino"; // ⬅️ Type-only import to avoid runtime conflicts
import { Config } from "../config";
import { ContextStore, StoreKeys } from "./context-store.utils";

/**
 * Global symbol used to store the root logger in the global object.
 * Symbol.for ensures consistency across different modules in the same runtime.
 */
const GLOBAL_LOGGER_KEY = Symbol.for("logger");

/**
 * Use the appropriate global object depending on environment.
 * Node.js always uses `globalThis`, fallback for older runtimes.
 */
export const _globalThis = typeof globalThis === "object" ? globalThis : global;

// Cast global object to include our logger symbol key.
const _global = _globalThis as unknown as {
  [GLOBAL_LOGGER_KEY]: Logger;
};

/**
 * Initializes the global root logger based on configuration.
 * Sets formatters, timestamp formats, redaction, and log level.
 */
function setupLogger(): void {
  const logParams: LoggerOptions = {
    name: Config.Logger.name,
    level: Config.Logger.level,
    redact: {
      paths: ["req.authorization", "url"],
      censor(value, path) {
        if (path[0] === "url") {
          return value.replace(
            /access_token=[a-zA-Z0-9_-]*/,
            "access_token=***",
          );
        } else if (path[1] === "authorization") {
          return value.replace(/\s+(\S+)$/, " ***");
        }
        return "***";
      },
    },
  };

  // Enable ISO 8601 timestamps if configured
  if (Config.Logger.isoTimestamp) {
    logParams.timestamp = stdTimeFunctions.isoTime;
  }

  // Initialize the global logger
  _global[GLOBAL_LOGGER_KEY] = pino(logParams);
  _global[GLOBAL_LOGGER_KEY].debug("Logger initialized");
}

/**
 * Retrieves the current logger.
 * - Prefers request-scoped logger from AsyncLocalStorage
 * - Falls back to global root logger (singleton)
 * - Initializes global logger if not already set
 *
 * @returns Pino logger instance
 */
export function getLogger(): Logger {
  const logger = ContextStore.get<Logger>(StoreKeys.LOGGER);
  if (logger) {
    return logger;
  }

  if (!_global[GLOBAL_LOGGER_KEY]) {
    setupLogger();
  }

  return _global[GLOBAL_LOGGER_KEY];
}

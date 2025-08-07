import pino, { LoggerOptions, stdTimeFunctions } from "pino";
import type { Logger } from "pino"; // Type-only import
import { Config } from "../config";
import { ContextStore, StoreKeys } from "./context-store.utils";

/**
 * Symbol used to store the root logger in the Node.js global object.
 */
const GLOBAL_LOGGER_KEY = Symbol.for("logger");

/**
 * Use an object compatible with either modern or legacy global scopes.
 */
export const _globalThis = typeof globalThis === "object" ? globalThis : global;
const _global = _globalThis as unknown as { [GLOBAL_LOGGER_KEY]: Logger };

/**
 * Initializes the global root logger according to app configuration.
 *
 * - Sets log name, level, timestamp, and redaction for sensitive fields.
 * - Uses singleton in global symbol registry.
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

  if (Config.Logger.isoTimestamp) {
    logParams.timestamp = stdTimeFunctions.isoTime;
  }

  _global[GLOBAL_LOGGER_KEY] = pino(logParams);
  _global[GLOBAL_LOGGER_KEY].debug("Logger initialized");
}

/**
 * Retrieves the current logger instance:
 * - Returns a request-scoped logger from AsyncLocalStorage if available
 * - Falls back to the global (singleton) logger
 * - Initializes the global logger if not created yet
 *
 * @returns {Logger} The logger instance (request-bound or global root logger)
 */
export function getLogger(): Logger {
  const logger = ContextStore.get<Logger>(StoreKeys.LOGGER);
  if (logger) return logger;

  if (!_global[GLOBAL_LOGGER_KEY]) {
    setupLogger();
  }

  return _global[GLOBAL_LOGGER_KEY];
}

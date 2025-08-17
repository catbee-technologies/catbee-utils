import pino, { LoggerOptions, stdTimeFunctions } from 'pino';
import type { Logger as PinoLogger } from 'pino'; // Type-only import
import { Config } from '../config';
import { ContextStore, StoreKeys } from './context-store.utils';

/**
 * Symbol used to store the root logger in the Node.js global object.
 */
const GLOBAL_LOGGER_KEY = Symbol.for('logger');

/**
 * Logger type for application-wide logging.
 */
export type Logger = pino.Logger;

/**
 * Logger levels for application-wide logging.
 */
export type LoggerLevels = pino.Level;

/**
 * Use an object compatible with either modern or legacy global scopes.
 */
export const _globalThis = typeof globalThis === 'object' ? globalThis : global;
const _global = _globalThis as unknown as { [GLOBAL_LOGGER_KEY]: PinoLogger };

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
      paths: ['req.authorization', 'url'],
      censor(value, path) {
        if (path[0] === 'url') {
          return value.replace(/access_token=[a-zA-Z0-9_-]*/, 'access_token=***');
        } else if (path[1] === 'authorization') {
          return value.replace(/\s+(\S+)$/, ' ***');
        }
        return '***';
      }
    },
    timestamp: stdTimeFunctions.isoTime
  };

  _global[GLOBAL_LOGGER_KEY] = pino(logParams);
  _global[GLOBAL_LOGGER_KEY].debug('Logger initialized');
}

/**
 * Retrieves the current logger instance:
 * - Returns a request-scoped logger from AsyncLocalStorage if available
 * - Falls back to the global (singleton) logger
 * - Initializes the global logger if not created yet
 *
 * @returns {Logger} The logger instance (request-bound or global root logger)
 */
export function getLogger(): PinoLogger {
  const logger = ContextStore.get<PinoLogger>(StoreKeys.LOGGER);
  if (logger) return logger;

  if (!_global[GLOBAL_LOGGER_KEY]) {
    setupLogger();
  }

  return _global[GLOBAL_LOGGER_KEY];
}

/**
 * Creates a child logger with additional context.
 *
 * @param {Record<string, any>} bindings - Properties to attach to all log records
 * @param {Logger} [parentLogger] - Parent logger (defaults to current context logger or global)
 * @returns {Logger} Child logger with merged context
 */
export function createChildLogger(bindings: Record<string, any>, parentLogger?: PinoLogger): PinoLogger {
  const logger = parentLogger || getLogger();
  return logger.child(bindings);
}

/**
 * Creates a request-scoped logger with request ID and stores it in context
 *
 * @param {string} requestId - Unique request identifier
 * @param {object} [additionalContext] - Additional context to include in logs
 * @returns {Logger} Request-scoped logger instance
 */
export function createRequestLogger(requestId: string, additionalContext: Record<string, any> = {}): PinoLogger {
  const logger = createChildLogger({
    requestId,
    ...additionalContext
  });

  try {
    ContextStore.set(StoreKeys.LOGGER, logger);
  } catch {
    // Context not initialized, can't store logger
    logger.debug('Failed to store logger in context - AsyncLocalStorage not initialized');
  }

  return logger;
}

/**
 * Utility to safely log errors with proper stack trace extraction
 *
 * @param {Error|unknown} error - Error object to log
 * @param {string} [message] - Optional message to include
 * @param {Record<string, any>} [context] - Additional context properties
 */
export function logError(error: Error | unknown, message?: string, context?: Record<string, any>): void {
  const logger = getLogger();

  const errObj = error instanceof Error ? error : new Error(String(error));
  const logContext = {
    ...context,
    error: errObj
  };

  logger.error(logContext, message || errObj.message);
}

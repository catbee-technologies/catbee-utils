/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies. https://catbee-utils.npm.hprasath.com/license
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import pino, { LoggerOptions, stdTimeFunctions } from 'pino';
import type { Logger as PinoLogger } from 'pino'; // Type-only import
import { config } from '../config';
import { ContextStore, StoreKeys } from './context-store.utils';
import { Env } from './env.utils';

/**
 * Symbol used to store the root logger in the Node.js global object.
 */
const GLOBAL_LOGGER_KEY = Symbol.for('logger');

/**
 * Logger type for application-wide logging.
 */
export type Logger = PinoLogger;

/**
 * Logger levels for application-wide logging.
 */
export type LoggerLevels = pino.Level;

// Default sensitive fields
export const defaultSensitiveFields = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'auth',
  'jwt',
  'access_token',
  'client_secret',
  'session_token',
  'refresh_token'
];

/**
 * The global censor function used by the logger.
 */
let globalRedactCensor: (value: unknown, path: string[], sensitiveFields?: string[]) => string = (
  value,
  path,
  sensitiveFields = defaultSensitiveFields
) => {
  if (typeof value !== 'string') return '***';

  const lowerPath = path.map(p => p.toLowerCase());
  const lowerSensitiveFields = sensitiveFields.map(f => f.toLowerCase());

  if (lowerPath.some(p => lowerSensitiveFields.includes(p))) return '***';

  // Redact URLs
  if (lowerPath[0] === 'url') {
    return value.replace(new RegExp(`([?&](${lowerSensitiveFields.join('|')})=)[^&#]*`, 'gi'), '$1***');
  }

  if (lowerPath.some(p => p.includes('authorization') || p.includes('auth'))) {
    return value.replace(/^(\S+)\s+.+$/, '$1 ***') || '***';
  }

  // Redact sensitive fields - check each path segment against each sensitive field
  if (lowerPath.some(pathPart => lowerSensitiveFields.some(field => pathPart.includes(field)))) {
    return '***';
  }

  if (path.length > 0 && !['req', 'res', 'headers'].includes(lowerPath[0])) {
    return value;
  }

  return value;
};

/**
 * Sets the global redaction censor function used throughout the application for log redaction.
 *
 * Use this function to customize how sensitive data is redacted in logs. The provided function
 * will replace the default censor implementation.
 *
 * @example
 * ```typescript
 * // Custom censor that redacts only specific values
 * setRedactCensor((value, path, sensitiveFields) => {
 *   if (path.includes('password')) return '***';
 *   return value;
 * });
 * ```
 *
 * @param fn - The redaction censor function to use globally. This function receives:
 *   - value: The data value to potentially redact
 *   - path: Array of strings representing the path to the value in the object
 *   - sensitiveFields: Optional array of field names to consider sensitive
 * @returns void
 */
export function setRedactCensor(fn: (value: unknown, path: string[], sensitiveFields?: string[]) => string) {
  globalRedactCensor = fn;
}

/**
 * Gets the current global redaction censor function used for log redaction.
 *
 * This function is called internally by the logger when determining how to redact
 * sensitive information. It can also be used to access the current censor implementation
 * for composition or extension.
 *
 * @example
 * ```typescript
 * const currentCensor = getRedactCensor();
 * // Create an enhanced censor that extends the current one
 * setRedactCensor((value, path, fields) => {
 *   // Add custom logic before delegating to current censor
 *   if (someCondition) return customHandling();
 *   return currentCensor(value, path, fields);
 * });
 * ```
 *
 * @returns The current redaction censor function
 */
export function getRedactCensor() {
  return globalRedactCensor;
}

/**
 * Convenience function to redact sensitive data using the current global redact censor.
 *
 * This is a direct wrapper around the global censor function that simplifies usage
 * in application code without needing to access the censor function directly.
 *
 * @example
 * ```typescript
 * // Redact a potential sensitive value
 * const safeValue = redact(value, ['user', 'apiKey']);
 * ```
 *
 * @param value - The value to potentially redact
 * @param path - Array of strings representing the path to the value in the object
 * @param sensitiveFields - Optional array of field names to consider sensitive
 * @returns The redacted string value or "***" for redacted content
 */
export function redact(value: unknown, path: string[], sensitiveFields?: string[]) {
  return globalRedactCensor(value, path, sensitiveFields);
}

/**
 * Extends the current redaction function with additional fields to redact.
 *
 * This function wraps the existing censor while adding more fields to be considered
 * sensitive without replacing the entire redaction logic.
 *
 * @example
 * ```typescript
 * // Add custom fields to be redacted in all future redaction operations
 * addRedactFields(['customerId', 'accountNumber']);
 * ```
 *
 * @param fields - Array of additional field names to redact
 */
export function addRedactFields(fields: string[]) {
  const prev = globalRedactCensor;
  globalRedactCensor = (value, path, sensitiveFields = defaultSensitiveFields) =>
    prev(value, path, [...(sensitiveFields || []), ...fields]);
}

/**
 * Replaces the default list of sensitive fields with a new list.
 *
 * This is useful when you want complete control over what fields are considered
 * sensitive by default, rather than using the library's built-in list.
 *
 * @example
 * ```typescript
 * // Replace default sensitive fields with a custom list
 * setSensitiveFields(['password', 'ssn', 'creditCard']);
 * ```
 *
 * @param fields - Array of field names to set as the new default sensitive fields
 */
export function setSensitiveFields(fields: string[]) {
  defaultSensitiveFields.splice(0, defaultSensitiveFields.length, ...fields);
}

/**
 * Adds additional field names to the default sensitive fields list.
 *
 * This preserves the existing sensitive fields while adding new ones for
 * application-specific sensitive data.
 *
 * @example
 * ```typescript
 * // Add domain-specific sensitive fields to the default list
 * addSensitiveFields(['socialSecurityNumber', 'medicalRecordNumber']);
 * ```
 *
 * @param fields - Array of additional field names to add to the sensitive fields list
 */
export function addSensitiveFields(fields: string[]) {
  defaultSensitiveFields.push(...fields);
}

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
function setupLogger(isGlobal: boolean = true): PinoLogger {
  const logParams: LoggerOptions = {
    name: config.logger.name || '@catbee/utils',
    level: config.logger.level || 'info',
    redact: {
      paths: ['req.authorization', 'res.authorization', 'url', 'headers.authorization', 'headers.cookies'],
      censor: (value, path) => redact(value, path)
    },
    serializers: {
      req: pino.stdSerializers.req,
      request: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      response: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err
    },
    timestamp: stdTimeFunctions.isoTime
  };

  const logger =
    config.logger.pretty && Env.isDev()
      ? pino(
          logParams,
          pino.transport({
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              singleLine: config.logger.singleLine,
              levelFirst: true
            }
          })
        )
      : pino(logParams);

  if (isGlobal) {
    _global[GLOBAL_LOGGER_KEY] = logger;
    _global[GLOBAL_LOGGER_KEY]?.debug('Logger initialized');
  }

  return logger;
}

/**
 * Retrieves the current logger instance:
 * - Returns a request-scoped logger from AsyncLocalStorage if available
 * - Falls back to the global (singleton) logger
 * - Initializes the global logger if not created yet
 * - If newInstance is true, returns a fresh logger without any context
 *
 * @param {boolean} newInstance - If true, returns a fresh logger without any context
 * @returns {Logger} The logger instance (request-bound or global root logger or fresh instance)
 */
export function getLogger(newInstance: boolean = false): PinoLogger {
  if (newInstance) {
    return setupLogger(false);
  }

  const logger = ContextStore.get<PinoLogger>(StoreKeys.LOGGER);
  if (logger) return logger;

  if (!_global[GLOBAL_LOGGER_KEY]) {
    setupLogger();
  }

  return _global[GLOBAL_LOGGER_KEY];
}

/**
 * Returns a fresh logger instance without any request context.
 * This logger is used for logging messages that are not tied to a specific request.
 */
export const logger = getLogger(false);

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

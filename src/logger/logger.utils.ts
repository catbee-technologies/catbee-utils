import pino, { LoggerOptions, stdTimeFunctions } from 'pino';
import type { Logger as PinoLogger } from 'pino';
import { getCatbeeGlobalConfig } from '@catbee/utils/config';
import { ContextStore, StoreKeys } from '@catbee/utils/context-store';

/**
 * Symbol used to store the root logger in the Node.js global object.
 */
const GLOBAL_LOGGER_KEY = Symbol.for('logger');

/**
 * Logger type for application-wide logging.
 */
export type Logger = PinoLogger;

/**
 * Logger level for application-wide logging.
 */
export type LoggerLevel = pino.Level;

/**
 * Logger levels for application-wide logging.
 *
 * @deprecated Use `LoggerLevel` instead.
 */
export type LoggerLevels = LoggerLevel;

// Default sensitive fields
export const defaultSensitiveFields = [
  'password',
  'secret',
  'token',
  'api_key',
  'auth',
  'private_key',
  'public_key',
  'jwt',
  'access_token',
  'refresh_token',
  'session_token',
  'csrf_token',
  'authorization',
  'bearer',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'client_secret',
  'passphrase',
  'otp',
  'api_secret',
  'token_secret',
  'cookie',
  'cookies',
  'set-cookie',
  'session_id',
  'credit_card',
  'card_number',
  'cvv',
  'cvc',
  'ssn',
  'pin'
];

const requestSubPaths = [
  'authorization',
  'headers.authorization',
  'headers.cookie',
  'headers.cookies',
  'headers["set-cookie"]',
  'headers["x-api-key"]',
  'headers["x-auth-token"]',
  'headers["x-access-token"]',
  'body.password',
  'body.token',
  'body.secret',
  'query.token',
  'query.api_key',
  'query.apiKey',
  'url',
  'originalUrl'
];

const responseSubPaths = ['authorization', 'headers.authorization', 'headers["set-cookie"]'];

const commonHeaderPaths = [
  'headers.authorization',
  'headers.cookie',
  'headers.cookies',
  'headers["set-cookie"]',
  'headers["x-api-key"]',
  'headers["x-auth-token"]',
  'headers["x-access-token"]'
];

const defaultRedactPaths = [
  ...['req', 'request'].flatMap(p => requestSubPaths.map(sp => `${p}.${sp}`)),
  ...['res', 'response'].flatMap(p => responseSubPaths.map(sp => `${p}.${sp}`)),
  ...commonHeaderPaths,
  'url',
  'uri',
  'href',
  'redirect_uri',
  'redirectUri'
];

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildUrlRedactRegex(lowerSensitiveFields: string[]): RegExp | null {
  if (lowerSensitiveFields.length === 0) return null;
  const pattern = lowerSensitiveFields.map(escapeRegExp).join('|');
  return new RegExp(`([?&](${pattern})=)[^&#]*`, 'gi');
}

const URL_PATH_KEYS = new Set(['url', 'uri', 'href', 'originalurl', 'redirect_uri', 'redirecturi']);

let cachedExpandedFields: string[] | null = null;
let cachedLowerSensitiveFields: string[] | null = null;
let cachedLowerSensitiveSet: Set<string> | null = null;
let cachedNormalizedMultiWordFields: string[] | null = null;
let cachedUrlRegex: RegExp | null = null;

function invalidateSensitiveFieldsCache(): void {
  cachedExpandedFields = null;
  cachedLowerSensitiveFields = null;
  cachedLowerSensitiveSet = null;
  cachedNormalizedMultiWordFields = null;
  cachedUrlRegex = null;
}

function extractNormalizedMultiWordFields(fields: string[]): string[] {
  return Array.from(
    new Set(
      fields
        .map(f => f.replace(/[-]/g, '_'))
        .filter(f => f.includes('_'))
        .map(f => `_${f}_`)
    )
  );
}

function isSensitivePathSegment(
  segment: string,
  lowerFieldsSet: Set<string>,
  multiWordNormalizedList: string[]
): boolean {
  if (!segment || typeof segment !== 'string') return false;

  const lower = segment.toLowerCase();
  // 1. Exact match (O(1))
  if (lowerFieldsSet.has(lower)) return true;

  // 2. Token boundary check (splits on underscores, hyphens, and camelCase boundaries)
  const tokens = segment.split(/[_-]+|(?<=[a-z0-9])(?=[A-Z])/g).filter(Boolean);
  if (tokens.some(t => lowerFieldsSet.has(t.toLowerCase()))) return true;

  // 3. Multi-word fields check with delimiter boundaries (e.g. custom_api_key containing api_key)
  if (multiWordNormalizedList.length === 0) return false;
  const normalized = `_${segment
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[-]/g, '_')}_`;
  return multiWordNormalizedList.some(fNorm => normalized.includes(fNorm));
}

/**
 * Retrieves the expanded list of sensitive fields.
 *
 * This function expands the default sensitive fields into their various naming
 * conventions (e.g., camelCase, snake_case) and caches the result for efficiency.
 *
 * @returns Array of expanded sensitive field names
 */
export function getExpandedSensitiveFields(): string[] {
  if (!cachedExpandedFields) {
    cachedExpandedFields = expandSensitiveFields(defaultSensitiveFields);
    cachedLowerSensitiveFields = cachedExpandedFields.map(f => f.toLowerCase());
    cachedLowerSensitiveSet = new Set(cachedLowerSensitiveFields);
    cachedNormalizedMultiWordFields = extractNormalizedMultiWordFields(cachedLowerSensitiveFields);
    cachedUrlRegex = buildUrlRedactRegex(cachedLowerSensitiveFields);
  }
  return cachedExpandedFields;
}

/**
 * The global censor function used by the logger.
 */
let globalRedactCensor = (value: unknown, path: string[], sensitiveFields?: string[]): unknown => {
  if (typeof value !== 'string') return '***';

  const stringPath: string[] = path.filter((p): p is string => typeof p === 'string');
  const lowerPath: string[] = stringPath.map(p => p.toLowerCase());

  const isCustomFields = sensitiveFields !== undefined;
  if (!isCustomFields) {
    getExpandedSensitiveFields();
  }
  const lowerFieldsList = isCustomFields ? sensitiveFields.map(f => f.toLowerCase()) : cachedLowerSensitiveFields!;
  const lowerFieldsSet = isCustomFields ? new Set(lowerFieldsList) : cachedLowerSensitiveSet!;
  const multiWordList = isCustomFields
    ? extractNormalizedMultiWordFields(lowerFieldsList)
    : cachedNormalizedMultiWordFields!;

  // 1. Exact match against sensitive fields
  if (lowerPath.some(p => lowerFieldsSet.has(p))) return '***';

  // 2. Redact URLs (supports both root 'url', 'uri', 'href' and nested 'req.url', 'request.originalUrl', etc.)
  if (lowerPath.some(p => URL_PATH_KEYS.has(p) || p.includes('redirect_uri') || p.includes('redirecturi'))) {
    if (lowerFieldsList.length === 0) return value;
    const urlRegex = isCustomFields ? buildUrlRedactRegex(lowerFieldsList) : cachedUrlRegex;
    return urlRegex ? value.replace(urlRegex, '$1***') : value;
  }

  // 3. Delimiter and token-aware check against sensitive fields (e.g., custom_auth, userAuth, custom_api_key)
  if (stringPath.some(p => isSensitivePathSegment(p, lowerFieldsSet, multiWordList))) {
    return '***';
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
 * @deprecated Use addSensitiveFields instead.
 *
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
  addSensitiveFields(fields);
  const prev = globalRedactCensor;
  globalRedactCensor = (value, path, sensitiveFields = getExpandedSensitiveFields()) =>
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
  invalidateSensitiveFieldsCache();
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
  invalidateSensitiveFieldsCache();
}

/**
 * Global store interface containing the root logger singleton.
 */
type GlobalLoggerStore = {
  [GLOBAL_LOGGER_KEY]?: PinoLogger;
};

/**
 * Use an object compatible with either modern or legacy global scopes.
 */
export const _globalThis = typeof globalThis === 'object' ? globalThis : global;
const _global = _globalThis as typeof _globalThis & GlobalLoggerStore;

/**
 * Resets the cached root logger instance.
 * Useful for tests or dynamic reconfiguration.
 */
export function resetLogger(): void {
  delete _global[GLOBAL_LOGGER_KEY];
}

/**
 * Initializes the global root logger according to app configuration.
 *
 * - Sets log name, level, timestamp, and redaction for sensitive fields.
 * - Optionally writes logs to files with daily rotation when logger.dir is configured.
 * - Uses singleton in global symbol registry.
 */
function setupLogger(isGlobal: boolean = true): PinoLogger {
  const sensitiveFields = getExpandedSensitiveFields();
  const { logger: loggerConfig } = getCatbeeGlobalConfig();
  const paths = new Set([...defaultRedactPaths, ...sensitiveFields.flatMap(field => generateDeepPaths(field, 5))]);
  const logParams: LoggerOptions = {
    name: loggerConfig?.name ?? '@catbee/utils',
    level: loggerConfig?.level ?? 'info',
    redact: {
      paths: Array.from(paths),
      censor: (value, path) => redact(value, path) as string
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

  let logger: PinoLogger;

  // Determine if we need file logging
  const logDir = loggerConfig?.dir?.trim();
  const hasFileLogging = Boolean(logDir);
  const destination = logDir ? `${logDir.replace(/[/\\]+$/, '')}/app.log` : 'app.log';

  const prettyOptions: Record<string, unknown> = {
    colorize: loggerConfig?.colorize,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    singleLine: loggerConfig?.singleLine,
    levelFirst: true
  };

  const fileOptions: Record<string, unknown> = {
    destination,
    mkdir: true
  };

  if (hasFileLogging && loggerConfig?.pretty) {
    // Both file and pretty logging enabled - use multistream
    logger = pino(
      logParams,
      pino.transport({
        targets: [
          {
            target: 'pino-pretty',
            level: loggerConfig?.level ?? 'info',
            options: prettyOptions
          },
          {
            target: 'pino/file',
            level: loggerConfig?.level ?? 'info',
            options: fileOptions
          }
        ]
      })
    );
  } else if (hasFileLogging) {
    // Only file logging enabled
    logger = pino(
      logParams,
      pino.transport({
        target: 'pino/file',
        options: fileOptions
      })
    );
  } else if (loggerConfig?.pretty) {
    // Only pretty logging enabled
    logger = pino(
      logParams,
      pino.transport({
        target: 'pino-pretty',
        options: prettyOptions
      })
    );
  } else {
    // No transports, just standard pino
    logger = pino(logParams);
  }

  if (isGlobal) {
    _global[GLOBAL_LOGGER_KEY] = logger;
    logger.debug({ logDir: logDir || 'none' }, 'Global Logger Initialized');
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

  return _global[GLOBAL_LOGGER_KEY]!;
}

/**
 * Creates a child logger with additional context.
 *
 * @param {Record<string, unknown>} bindings - Properties to attach to all log records
 * @param {Logger} [parentLogger] - Parent logger (defaults to current context logger or global)
 * @returns {Logger} Child logger with merged context
 */
export function createChildLogger(bindings: Record<string, unknown>, parentLogger?: PinoLogger): PinoLogger {
  const logger = parentLogger ?? getLogger();
  return logger.child(bindings);
}

/**
 * Creates a request-scoped logger with request ID and stores it in context
 *
 * @param {string} requestId - Unique request identifier
 * @param {Record<string, unknown>} [additionalContext] - Additional context to include in logs
 * @returns {Logger} Request-scoped logger instance
 */
export function createRequestLogger(requestId: string, additionalContext: Record<string, unknown> = {}): PinoLogger {
  const logger = createChildLogger({
    requestId,
    ...additionalContext
  });

  let stored = false;
  try {
    if (typeof ContextStore.getAll !== 'function' || ContextStore.getAll() !== undefined) {
      ContextStore.set(StoreKeys.LOGGER, logger);
      stored = true;
    }
  } catch {
    // Context not initialized, can't store logger
  }

  if (!stored) {
    logger.debug('Failed to store logger in context - AsyncLocalStorage not initialized');
  }

  return logger;
}

/**
 * Utility to safely log errors with proper stack trace extraction
 *
 * @param {unknown} error - Error object to log
 * @param {string} [message] - Optional message to include
 * @param {Record<string, unknown>} [context] - Additional context properties
 */
export function logError(error: unknown, message?: string, context?: Record<string, unknown>): void {
  const logger = getLogger();

  const errObj = error instanceof Error ? error : new Error(String(error));
  const logContext = {
    ...context,
    error: errObj
  };

  logger.error(logContext, message || errObj.message);
}

/**
 * Expands multiple sensitive field names into their variants.
 * Useful to match fields like `api_key`, `apiKey`, `apikey`, `APIKEY`, etc.
 */
export function expandSensitiveFields(fields: string[]): string[] {
  const set = new Set<string>();

  for (const field of fields) {
    for (const v of expandSensitiveField(field)) {
      set.add(v);
    }
  }

  return Array.from(set);
}

/**
 * Generates multiple variants of a sensitive field name.
 * Useful to match fields like `api_key`, `apiKey`, `apikey`, `APIKEY`, etc.
 */
export function expandSensitiveField(field: string): string[] {
  if (!field || typeof field !== 'string') {
    return [];
  }

  const trimmed = field.trim();
  if (!trimmed) {
    return [field];
  }

  const parts = trimmed.split(/[_-]+|(?<=[a-z0-9])(?=[A-Z])/g).filter(Boolean);
  if (parts.length === 0) {
    return [field];
  }

  const lowerParts = parts.map(p => p.toLowerCase());
  const upperParts = parts.map(p => p.toUpperCase());

  const camel =
    lowerParts[0] +
    lowerParts
      .slice(1)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');

  const mergedLower = lowerParts.join('');
  const mergedUpper = upperParts.join('');

  const kebab = lowerParts.join('-');
  const snakeLower = lowerParts.join('_');
  const snakeUpper = upperParts.join('_');

  return Array.from(new Set([field, camel, mergedLower, mergedUpper, kebab, snakeLower, snakeUpper]));
}

/**
 * Generates wildcard paths up to the given depth.
 *
 * depth = 2 ->
 *  password
 *  *.password
 *  *.*.password
 */
export function generateDeepPaths(field: string, depth: number = 5): string[] {
  const set = new Set<string>([field]);

  let prefix = '';
  for (let i = 1; i <= depth; i++) {
    prefix = prefix ? `${prefix}.*` : '*';
    set.add(`${prefix}.${field}`);
  }

  return [...set];
}

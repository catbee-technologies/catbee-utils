import type { CatbeeConfig, CatbeeGlobalServerConfig } from '@catbee/utils/types';
import type { Logger, LoggerLevels } from '@catbee/utils/logger';
import { Env } from '@catbee/utils/env';
import { uuid } from '@catbee/utils/id';
import { deepClone, deepObjMerge } from '@catbee/utils/object';

/**
 * Extends Express Request interface to add request ID tracking.
 * Added by requestId middleware during request processing.
 */
declare global {
  namespace Express {
    interface Request {
      /** Unique request identifier (set by middleware) */
      id?: string;
      /** Logger instance for the request (set by middleware) */
      logger?: Logger;
      /** User information (set by authentication middleware) */
      user?: any;
    }
  }
}

/** Default Catbee server configuration loaded from environment variables. */
export const defaultServerConfig: CatbeeGlobalServerConfig = {
  port: Env.getNumber('SERVER_PORT', 0) || Env.getNumber('PORT', 3000),
  host: Env.get('SERVER_HOST', '') || Env.get('HOST', '0.0.0.0'),
  cors: Env.getBoolean('SERVER_CORS_ENABLE', false) ? {} : false,
  helmet: Env.getBoolean('SERVER_HELMET_ENABLE', false) ? {} : false,
  compression: Env.getBoolean('SERVER_COMPRESSION_ENABLE', false) ? {} : false,
  bodyParser: {
    json: { limit: Env.get('SERVER_BODY_PARSER_JSON_LIMIT', '1mb') },
    urlencoded: { extended: true, limit: Env.get('SERVER_BODY_PARSER_URLENCODED_LIMIT', '1mb') }
  },
  cookieParser: Env.getBoolean('SERVER_COOKIE_PARSER_ENABLE', false) ? {} : false,
  isMicroservice: Env.getBoolean('SERVER_IS_MICROSERVICE', false),
  appName: Env.get('SERVER_APP_NAME', Env.get('npm_package_name', 'catbee_server')),
  globalHeaders: Env.getJSON<Record<string, string>>('SERVER_GLOBAL_HEADERS', {}),
  rateLimit: {
    enable: Env.getBoolean('SERVER_RATE_LIMIT_ENABLE', false),
    windowMs: Env.getDuration('SERVER_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: Env.getNumber('SERVER_RATE_LIMIT_MAX', 100),
    message: Env.get('SERVER_RATE_LIMIT_MESSAGE', 'Too many requests, please try again later.'),
    standardHeaders: Env.getBoolean('SERVER_RATE_LIMIT_STANDARD_HEADERS', true),
    legacyHeaders: Env.getBoolean('SERVER_RATE_LIMIT_LEGACY_HEADERS', false)
  },
  requestLogging: {
    enable: Env.getBoolean('SERVER_REQUEST_LOGGING_ENABLE', Env.isDev()),
    ignorePaths: (req, _res) => {
      const skipPaths = ['/healthz', '/favicon.ico', '/metrics', '/docs', '/.well-known'];
      return skipPaths.some(path => req.path.startsWith(path));
    },
    skipNotFoundRoutes: Env.getBoolean('SERVER_REQUEST_LOGGING_SKIP_NOT_FOUND_ROUTES', true)
  },
  trustProxy: Env.getBoolean('SERVER_TRUST_PROXY_ENABLE', false),
  openApi: {
    enable: Env.getBoolean('SERVER_OPENAPI_ENABLE', false),
    mountPath: Env.get('SERVER_OPENAPI_MOUNT_PATH', '/docs'),
    verbose: Env.getBoolean('SERVER_OPENAPI_VERBOSE', false),
    withGlobalPrefix: Env.getBoolean('SERVER_OPENAPI_WITH_GLOBAL_PREFIX', false)
  },
  healthCheck: {
    path: Env.get('SERVER_HEALTH_CHECK_PATH', '/healthz'),
    detailed: Env.getBoolean('SERVER_HEALTH_CHECK_DETAILED_OUTPUT', true),
    withGlobalPrefix: Env.getBoolean('SERVER_HEALTH_CHECK_WITH_GLOBAL_PREFIX', false)
  },
  requestTimeout: Env.getDuration('SERVER_REQUEST_TIMEOUT_MS', 0),
  responseTime: {
    enable: Env.getBoolean('SERVER_RESPONSE_TIME_ENABLE', false),
    addHeader: Env.getBoolean('SERVER_RESPONSE_TIME_ADD_HEADER', true),
    logOnComplete: Env.getBoolean('SERVER_RESPONSE_TIME_LOG_ON_COMPLETE', false)
  },
  requestId: {
    headerName: Env.get('SERVER_REQUEST_ID_HEADER_NAME', 'x-request-id'),
    exposeHeader: Env.getBoolean('SERVER_REQUEST_ID_EXPOSE_HEADER', true),
    generator: () => uuid()
  },
  serviceVersion: {
    enable: Env.getBoolean('SERVER_SERVICE_VERSION_ENABLE', false),
    headerName: Env.get('SERVER_SERVICE_VERSION_HEADER_NAME', 'x-service-version'),
    version: Env.get('${npm_package_version}', '0.0.0')
  },
  skipHealthzChecksValidation: Env.getBoolean('SERVER_SKIP_HEALTHZ_CHECKS_VALIDATION', false)
} as const;

/** Default Catbee configuration loaded from environment variables. */
const defaultCatbeeConfig: CatbeeConfig = {
  logger: {
    level: Env.get('LOGGER_LEVEL', Env.isDev() || Env.isTest() ? 'debug' : 'info') as LoggerLevels,
    name: Env.get('LOGGER_NAME', Env.get('npm_package_name', '@catbee/utils')),
    pretty: Env.getBoolean('LOGGER_PRETTY', false),
    colorize: Env.getBoolean('LOGGER_PRETTY_COLORIZE', true),
    singleLine: Env.getBoolean('LOGGER_PRETTY_SINGLE_LINE', false),
    dir: Env.getPath('LOGGER_DIR', '', { mustExist: false })
  },
  cache: {
    defaultTtl: Env.getNumber('CACHE_DEFAULT_TTL_SECONDS', 3600) * 1000
  },
  server: defaultServerConfig
} as const satisfies CatbeeConfig;

/* Internal mutable configuration object */
let _config: CatbeeConfig = deepClone(defaultCatbeeConfig);

/**
 * Gets the global Catbee configuration.
 *
 * @returns The current Catbee configuration.
 */
export function getCatbeeGlobalConfig(): CatbeeConfig {
  return deepClone(_config);
}

/**
 * Gets the global Catbee configuration.
 *
 * @deprecated Use `getCatbeeGlobalConfig` from `@catbee/utils/config` instead.
 * @alias getCatbeeGlobalConfig
 * @returns The current Catbee configuration.
 */
export const getConfig = getCatbeeGlobalConfig;

/**
 * Sets the global Catbee configuration.
 * Merges the provided partial configuration with the existing one.
 *
 * @param value - Partial Catbee configuration to set
 */
export function setCatbeeGlobalConfig(value: Partial<CatbeeConfig>): void {
  _config = deepObjMerge(_config, value);
}

/**
 * Sets the global Catbee configuration.
 * Merges the provided partial configuration with the existing one.
 *
 * @deprecated Use `setCatbeeGlobalConfig` from `@catbee/utils/config` instead.
 * @alias setCatbeeGlobalConfig
 * @param value - Partial Catbee configuration to set
 */
export const setConfig = setCatbeeGlobalConfig;

/**
 * Sets the global Catbee server configuration.
 * Merges the provided partial server configuration with the existing one.
 *
 * @param value - Partial Catbee server configuration to set
 */
export function setCatbeeServerGlobalConfig(value: Partial<CatbeeGlobalServerConfig>): void {
  _config.server = deepObjMerge(_config.server, value);
}

/**
 * Gets the global Catbee server configuration.
 *
 * @returns The current Catbee server configuration.
 */
export function getCatbeeServerGlobalConfig(): CatbeeGlobalServerConfig {
  return getCatbeeGlobalConfig().server;
}

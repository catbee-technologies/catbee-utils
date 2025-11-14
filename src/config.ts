import { ServerConfig } from './types/server';
import { Env } from './utils/env.utils';
import { uuid } from './utils/id.utils';
import { Logger, LoggerLevels } from './utils/logger.utils';
import { deepObjMerge } from './utils/obj.utils';

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

/**
 * Application runtime configuration loaded from environment variables.
 */
export let config = {
  logger: {
    /**
     * Logging level (e.g., 'info', 'debug', 'warn', 'error').
     */
    level: Env.get('LOGGER_LEVEL', 'info') as LoggerLevels,

    /**
     * Name of the logger instance (defaults to npm package name).
     */
    name: Env.get('LOGGER_NAME', Env.get('npm_package_name', '@catbee/utils')),

    /**
     * Enables pretty-print logging in development.
     * Has no effect in production.
     */
    pretty: Env.getBoolean('LOGGER_PRETTY', true),

    /**
     * Enables colorized output for pretty-print (default: true)
     */
    colorize: Env.getBoolean('LOGGER_PRETTY_COLORIZE', true),

    /**
     * Single line output for pretty-print (default: false)
     */
    singleLine: Env.getBoolean('LOGGER_PRETTY_SINGLE_LINE', false)
  },

  cache: {
    /**
     * Default TTL (time to live) for cache entries in seconds
     */
    defaultTtl: Env.getNumber('CACHE_DEFAULT_TTL_SECONDS', 3600) * 1000
  },

  server: {
    /**
     * Skip healthz endpoint even if health checks are configured
     * Default: false
     * Set to true to return 200 OK for /healthz without checks
     * Useful in environments where a simple liveness probe is needed
     * without performing actual health checks
     * Example: Kubernetes liveness probe
     * Note: This does not disable the health check functionality itself
     *       Health checks can still be performed programmatically
     *       or via other endpoints if needed
     */
    skipHealthz: Env.getBoolean('SERVER_SKIP_HEALTHZ', false)
  }
};

export const defaultServerConfig = {
  port: 3000,
  host: '0.0.0.0',
  cors: false,
  helmet: false,
  compression: false,
  bodyParser: {
    json: { limit: '1mb' },
    urlencoded: { extended: true, limit: '1mb' }
  },
  cookieParser: false,
  isMicroservice: false,
  appName: 'express_app',
  globalHeaders: {},
  rateLimit: {
    enable: false,
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false
  },
  requestLogging: {
    enable: Env.isDev(),
    ignorePaths: (req, _res) => {
      const skipPaths = ['/healthz', '/favicon.ico', '/metrics', '/docs', '/.well-known'];
      return skipPaths.some(path => req.path.startsWith(path));
    },
    skipNotFoundRoutes: false
  },
  openApi: {
    enable: false,
    mountPath: '/docs',
    verbose: false,
    withGlobalPrefix: false
  },
  healthCheck: {
    path: '/healthz',
    detailed: true
  },
  requestTimeout: 30000,
  responseTime: {
    enable: false,
    addHeader: true,
    logOnComplete: false
  },
  requestId: {
    headerName: 'x-request-id',
    exposeHeader: true,
    generator: () => uuid()
  },
  metrics: {
    enable: false,
    path: '/metrics',
    withGlobalPrefix: false
  },
  serviceVersion: {
    enable: false,
    headerName: 'x-service-version',
    version: '0.0.0'
  }
} satisfies ServerConfig;

/**
 * Update the @catbee/utils configuration.
 * @param value Partial configuration object.
 */
export function setConfig(value: Partial<typeof config>): void {
  deepObjMerge(config, value);
}

/**
 * Get the current @catbee/utils configuration.
 * @returns The current configuration object.
 */
export function getConfig(): typeof config {
  return config;
}

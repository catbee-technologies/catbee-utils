import type { LoggerLevels } from '@catbee/utils/logger';

export interface CatbeeConfig {
  logger?: {
    /**
     * Logging level (e.g., 'info', 'debug', 'warn', 'error')
     * Environment variable: LOGGER_LEVEL
     * Default: 'info' in production, 'debug' in development
     */
    level?: LoggerLevels;
    /**
     * Name of the logger instance (defaults to npm package name)
     * Environment variable: LOGGER_NAME
     * Default: value of npm_package_name or '@catbee/utils'
     */
    name?: string;
    /**
     * Enables pretty-print logging in development.
     * Has no effect in production.
     * Environment variable: LOGGER_PRETTY
     * Default: true in development, false in production
     */
    pretty?: boolean;
    /**
     * Enables colorized output for pretty-print (default: true)
     * Environment variable: LOGGER_PRETTY_COLORIZE
     */
    colorize?: boolean;
    /**
     * Single line output for pretty-print (default: false)
     * Environment variable: LOGGER_PRETTY_SINGLE_LINE
     */
    singleLine?: boolean;
    /**
     * Directory to write log files to (if empty, file logging is disabled)
     * Environment variable: LOGGER_DIR
     * Eg: process.cwd() + '/logs'
     * Note: Directory must exist, it is not created automatically
     */
    dir?: string;
  };
  cache: {
    /**
     * Default TTL (time to live) for cache entries in milliseconds
     * Environment variable: CACHE_DEFAULT_TTL_SECONDS
     * Default: 3600000 (1 hour)
     */
    defaultTtl: number;
  };
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
     * Environment variable: SERVER_SKIP_HEALTHZ
     */
    skipHealthz: boolean;
  };
}

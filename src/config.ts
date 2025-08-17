import { Env } from './utils/env.utils';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

/**
 * Application runtime configuration loaded from environment variables.
 */
export const Config = {
  Logger: {
    /**
     * Logging level (e.g., 'info', 'debug', 'warn', 'error').
     */
    level: Env.get('LOGGER_LEVEL', 'info') as LogLevel,

    /**
     * Name of the logger instance (defaults to npm package name).
     */
    name: Env.get('LOGGER_NAME', Env.get('npm_package_name', '@catbee/utils'))
  },

  Http: {
    /**
     * Timeout for HTTP requests in milliseconds
     */
    timeout: Env.getNumber('HTTP_TIMEOUT', 30000)
  },

  Cache: {
    /**
     * Default TTL (time to live) for cache entries in seconds
     */
    defaultTtl: Env.getNumber('CACHE_DEFAULT_TTL', 300)
  }
};

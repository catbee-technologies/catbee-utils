import { Env } from './utils/env.utils';
import { deepObjMerge } from './utils/obj.utils';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

/**
 * Application runtime configuration loaded from environment variables.
 */
export let config = {
  logger: {
    /**
     * Logging level (e.g., 'info', 'debug', 'warn', 'error').
     */
    level: Env.get('LOGGER_LEVEL', 'info') as LogLevel,

    /**
     * Name of the logger instance (defaults to npm package name).
     */
    name: Env.get('LOGGER_NAME', Env.get('npm_package_name', '@catbee/utils')),

    /**
     * Enables pretty-print logging in development.
     * Has no effect in production.
     */
    pretty: Env.getBoolean('LOGGER_PRETTY', true)
  },

  http: {
    /**
     * Timeout for HTTP requests in milliseconds
     */
    timeout: Env.getNumber('HTTP_TIMEOUT', 30000)
  },

  cache: {
    /**
     * Default TTL (time to live) for cache entries in seconds
     */
    defaultTtl: Env.getNumber('CACHE_DEFAULT_TTL_SECONDS', 3600) * 1000
  }
};

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

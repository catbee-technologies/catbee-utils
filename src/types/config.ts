import type { LoggerLevels } from '@catbee/utils/logger';
import { CatbeeGlobalServerConfig } from './server';

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
  /** Server configuration */
  server: CatbeeGlobalServerConfig;
}

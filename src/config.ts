/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies
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

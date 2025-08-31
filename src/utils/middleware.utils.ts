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

import { uuid } from './id.utils';
import { HttpStatusCodes } from './http-status-codes';
import { createFinalErrorResponse, ErrorResponse } from './response.utils';
import { getLogger } from './logger.utils';
import type { Request, Response, NextFunction } from 'express';
import { ContextStore, StoreKeys } from './context-store.utils';
import { RequestTimeoutException } from './exception.utils';
import { ApiErrorResponse } from '../types/api-response';

export type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Attaches a unique request ID to each request.
 * Useful for request tracing and correlation between logs.
 *
 * @param {object} [options] - Configuration options
 * @param {string} [options.headerName='X-Request-ID'] - Header name for request ID
 * @param {boolean} [options.exposeHeader=true] - Whether to expose the header in response
 * @param {() => string} [options.generator] - Custom ID generator function
 * @returns {Middleware} Express-compatible middleware
 */
export function requestId(options?: {
  headerName?: string;
  exposeHeader?: boolean;
  generator?: () => string;
}): Middleware {
  const headerName = options?.headerName || 'X-Request-ID';
  const exposeHeader = options?.exposeHeader !== false;
  const generateId = options?.generator || uuid;

  return (req, res, next) => {
    // Use existing request ID from header or generate a new one
    const existingId = req.headers[headerName.toLowerCase()];
    const id = (existingId as string) || generateId();

    // Attach ID to request object
    req.id = id;

    // Add ID to response headers
    if (exposeHeader) {
      res.setHeader(headerName, id);
    }

    next();
  };
}

/**
 * Measures request processing time and logs or adds it to response headers.
 *
 * @param {object} [options] - Configuration options
 * @param {boolean} [options.addHeader=true] - Whether to add X-Response-Time header
 * @param {boolean} [options.logOnComplete=false] - Whether to log timing info
 * @returns {Middleware} Express-compatible middleware
 */
export function responseTime(options?: { addHeader?: boolean; logOnComplete?: boolean }) {
  const addHeader = options?.addHeader !== false;
  const logOnComplete = options?.logOnComplete === true;

  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();

    // Function to calculate duration
    const getDuration = () => {
      const diff = process.hrtime(start);
      return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    };

    if (addHeader) {
      // Ensure header is set before response is sent
      const originalWriteHead = res.writeHead;
      res.writeHead = function (...args: any[]) {
        res.setHeader('X-Response-Time', `${getDuration()}ms`);
        return originalWriteHead.apply(this, args as any);
      };
    }

    if (logOnComplete) {
      res.on('finish', () => {
        getLogger().info(`${req.method} ${req.url} - ${getDuration()}ms`);
      });
    }

    next();
  };
}

/**
 * Request timeout middleware.
 * Aborts requests that take too long to process.
 *
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Middleware} Express-compatible middleware
 */
export function timeout(timeoutMs: number = 30000): Middleware {
  return (_req, res, next) => {
    // Set timeout for the request
    const timer = setTimeout(() => {
      const response = new RequestTimeoutException('Request timed out');
      res.status(HttpStatusCodes.REQUEST_TIMEOUT).json(response);
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
}

/**
 * Creates an Express middleware that initializes a per-request context.
 *
 * @param {object} [options] - Optional configuration
 * @param {string} [options.headerName='x-request-id'] - Header to look for request ID
 * @param {boolean} [options.autoLog=true] - Whether to log automatically when context is initialized
 * @returns {(req: Request, res: Response, next: NextFunction) => void} Express middleware function
 */
export function setupRequestContext(options: { headerName?: string; autoLog?: boolean } = {}): Middleware {
  const { headerName = 'x-request-id', autoLog = true } = options;
  return (req, _res, next) => {
    // Generate or use existing request ID
    const requestId = (req.headers[headerName] as string) || req?.['id'] || uuid();

    ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
      // Create a child logger for this request
      const childLogger = getLogger().child({
        requestId,
        method: req.method,
        url: req.originalUrl || req.url
      });

      req.logger = childLogger;

      // Store logger in context
      ContextStore.set(StoreKeys.LOGGER, childLogger);

      if (autoLog) {
        req.logger.info('Request context initialized');
      }

      next();
    });
  };
}

export interface ErrorHandlerOptions {
  /** Whether to log errors (default: true) */
  logErrors?: boolean;
  /** Whether to include error details in non-production (default: false) */
  includeDetails?: boolean;
}

/**
 * Global error handling middleware with enhanced features.
 *
 * @param {ErrorHandlerOptions} options - Error handler options
 * @param {boolean} [options.logErrors=true] - Whether to log errors
 * @param {boolean} [options.includeDetails=false] - Whether to include error details in non-production
 * @returns Error middleware
 *
 * @example
 * import express from 'express';
 * import { errorHandler } from '@catbee/utils';
 *
 * const app = express();
 *
 * // Your routes
 * app.get('/ping', (req, res) => {
 *   throw new Error('Something went wrong');
 * });
 *
 * // Error handler (must be last middleware)
 * app.use(errorHandler({ includeDetails: true }));
 *
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 */
export function errorHandler(options?: ErrorHandlerOptions) {
  const logErrors = options?.logErrors !== false;
  const includeDetails = options?.includeDetails === true;

  return (err: any, req: Request, res: Response, _next: NextFunction) => {
    // Determine status code
    const status = err?.status || err?.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR;

    // Log error if enabled
    if (logErrors) {
      getLogger().error({ err }, `${err.message || 'Unknown error'}`);
    }

    // Handle ErrorResponse instances (our custom error class)
    if (err instanceof ErrorResponse) {
      const result: ApiErrorResponse = {
        error: true,
        message: err.message,
        timestamp: err.timestamp,
        requestId: err?.requestId || req?.id || uuid(),
        status,
        path: req.originalUrl || req.url
      };

      if (includeDetails && err?.stack) {
        result.stack = err.stack.split('\n').map((line: string) => line.trim());
      }
      return res.status(status).json(result);
    }

    // Handle any other errors
    return res
      .status(status)
      .json(createFinalErrorResponse(req, status, err?.message || 'Internal Server Error', err, { includeDetails }));
  };
}

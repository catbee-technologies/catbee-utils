import { config } from '../config';
import { uuid } from './id.utils';
import { HttpStatusCodes } from './http-status-codes';
import { ErrorResponse } from './response.utils';
import { Env } from './env.utils';
import { getLogger } from './logger.utils';
import type { Request, Response, NextFunction } from 'express';
import { ContextStore, StoreKeys } from './context-store.utils';

export type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Attaches a unique request ID to each request.
 * Useful for request tracing and correlation between logs.
 *
 * @param {object} [options] - Configuration options
 * @param {string} [options.headerName='X-Request-ID'] - Header name for request ID
 * @param {boolean} [options.exposeHeader=true] - Whether to expose the header in response
 * @returns {Middleware} Express-compatible middleware
 */
export function requestId(options?: { headerName?: string; exposeHeader?: boolean }): Middleware {
  const headerName = options?.headerName || 'X-Request-ID';
  const exposeHeader = options?.exposeHeader !== false;

  return (req, res, next) => {
    // Use existing request ID from header or generate a new one
    const existingId = req.headers[headerName.toLowerCase()];
    const id = (existingId as string) || uuid();

    // Attach ID to request object
    (req as any).id = id;

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

    if (addHeader) {
      // Wrap res.end to set header just before sending response
      const originalEnd = res.end;
      res.end = function (chunk?: any, encoding?: any, cb?: any) {
        const diff = process.hrtime(start);
        const duration = diff[0] * 1e3 + diff[1] * 1e-6;
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        return originalEnd.call(this, chunk, encoding, cb);
      };
    }

    if (logOnComplete) {
      res.on('finish', () => {
        const diff = process.hrtime(start);
        const duration = diff[0] * 1e3 + diff[1] * 1e-6;
        getLogger().info(`${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
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
export function timeout(timeoutMs: number = config.http.timeout): Middleware {
  return (req, res, next) => {
    // Set timeout for the request
    const timer = setTimeout(() => {
      res.status(408).json({
        error: true,
        message: 'Request timeout',
        status: 408,
        timestamp: new Date().toISOString()
      });
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

      // Store logger in context
      ContextStore.set(StoreKeys.LOGGER, childLogger);

      if (autoLog) {
        childLogger.info('Request context initialized');
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
      getLogger().error({ error: err }, `${err.message || 'Unknown error'}`);
    }

    // Handle ErrorResponse instances (our custom error class)
    if (err instanceof ErrorResponse) {
      return res.status(status).json({
        error: err.error,
        message: err.message,
        timestamp: err.timestamp,
        requestId: err.requestId || (req as any).id || uuid(),
        path: req.originalUrl || req.url
      });
    }

    const createErrorResponse = (message: string, req: Request, error: any, options?: { includeDetails?: boolean }) => {
      const isDev = Env.isDev();
      const includeDetails = options?.includeDetails && isDev;

      const response: Record<string, any> = {
        error: true,
        message,
        timestamp: new Date().toISOString(),
        requestId: error?.requestId || (req as any).id || uuid(),
        path: req.originalUrl || req.url
      };

      // Include error code if present
      if (error?.code) {
        response.code = error.code;
      }

      // Include stack trace in development mode if requested
      if (includeDetails && error?.stack) {
        response.stack = error.stack.split('\n').map((line: string) => line.trim());
      }

      return response;
    };

    // Handle any other errors
    return res.status(status).json(
      createErrorResponse(err?.message || 'Internal Server Error', req, err, {
        includeDetails
      })
    );
  };
}

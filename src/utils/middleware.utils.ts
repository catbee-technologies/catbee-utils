import { randomUUID } from "crypto";
import { Config } from "../config";
import { uuid } from "./id.utils";
import { HttpStatusCodes } from "./http-status-codes";
import { ErrorResponse } from "./response.utils";
import { Env } from "./env.utils";

/**
 * Type definitions for Express-compatible middleware
 */
export type Request = {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
  ip?: string;
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
  [key: string]: any;
};

export type Response = {
  status: (code: number) => Response;
  json: (data: any) => void;
  send: (data: any) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  [key: string]: any;
};

export type NextFunction = (err?: Error | any) => void;

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

/**
 * Attaches a unique request ID to each request.
 * Useful for request tracing and correlation between logs.
 *
 * @param {object} [options] - Configuration options
 * @param {string} [options.headerName='X-Request-ID'] - Header name for request ID
 * @param {boolean} [options.exposeHeader=true] - Whether to expose the header in response
 * @returns {Middleware} Express-compatible middleware
 */
export function requestId(options?: {
  headerName?: string;
  exposeHeader?: boolean;
}): Middleware {
  const headerName = options?.headerName || "X-Request-ID";
  const exposeHeader = options?.exposeHeader !== false;

  return (req, res, next) => {
    // Use existing request ID from header or generate a new one
    const existingId = req.headers[headerName.toLowerCase()];
    const id = (existingId as string) || randomUUID();

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
export function responseTime(options?: {
  addHeader?: boolean;
  logOnComplete?: boolean;
}): Middleware {
  const addHeader = options?.addHeader !== false;
  const logOnComplete = options?.logOnComplete === true;

  return (req, res, next) => {
    const start = process.hrtime();

    // Function to calculate elapsed time
    const calculateDuration = (): number => {
      const diff = process.hrtime(start);
      return diff[0] * 1e3 + diff[1] * 1e-6; // Convert to ms
    };

    // Handle response completion
    res.on("finish", () => {
      const duration = calculateDuration();

      if (addHeader) {
        res.setHeader("X-Response-Time", `${duration.toFixed(2)}ms`);
      }

      if (logOnComplete) {
        const { method, url } = req;
        // eslint-disable-next-line no-console
        console.info(`${method} ${url} - ${duration.toFixed(2)}ms`);
      }
    });

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
export function timeout(timeoutMs: number = Config.Http.timeout): Middleware {
  return (req, res, next) => {
    // Set timeout for the request
    const timer = setTimeout(() => {
      res.status(408).json({
        error: true,
        message: "Request timeout",
        status: 408,
        timestamp: new Date().toISOString(),
      });
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on("finish", () => {
      clearTimeout(timer);
    });

    next();
  };
}

/**
 * Creates a standardized error response object for API errors.
 *
 * @param {string} message - Error message
 * @param {Request} req - Express request object
 * @param {any} error - Original error object
 * @param {object} [options] - Additional options
 * @param {boolean} [options.includeDetails=false] - Whether to include error details in non-production
 * @returns {object} Formatted error response
 */
const createErrorResponse = (
  message: string,
  req: Request,
  error: any,
  options?: { includeDetails?: boolean },
) => {
  const isDev = Env.isDev();
  const includeDetails = options?.includeDetails && isDev;

  const response: Record<string, any> = {
    error: true,
    message,
    timestamp: new Date().toISOString(),
    requestId: error?.requestId || req.id || uuid(),
    path: req.originalUrl || req.url,
  };

  // Include error code if present
  if (error?.code) {
    response.code = error.code;
  }

  // Include stack trace in development mode if requested
  if (includeDetails && error?.stack) {
    response.stack = error.stack.split("\n").map((line: string) => line.trim());
  }

  return response;
};

/**
 * Global error handling middleware with enhanced features.
 *
 * @param {object} [options] - Error handler options
 * @param {boolean} [options.logErrors=true] - Whether to log errors
 * @param {boolean} [options.includeDetails=false] - Whether to include error details in non-production
 * @param {Function} [options.logger=console.error] - Custom logging function
 * @returns {(err: any, req: Request, res: Response, next: NextFunction) => void} Error middleware
 */
export function errorHandler(options?: {
  logErrors?: boolean;
  includeDetails?: boolean;
  logger?: (message: string, error: any) => void;
}) {
  const logErrors = options?.logErrors !== false;
  const includeDetails = options?.includeDetails === true;
  // eslint-disable-next-line no-console
  const logger = options?.logger || console.error;

  return (err: any, req: Request, res: Response, _next: NextFunction) => {
    // Determine status code
    const status =
      err?.status || err?.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR;

    // Log error if enabled
    if (logErrors) {
      const logMessage = `[ERROR] ${req.method} ${req.originalUrl || req.url}: ${err.message || "Unknown error"}`;
      logger(logMessage, err);
    }

    // Handle ErrorResponse instances (our custom error class)
    if (err instanceof ErrorResponse) {
      return res.status(status).json({
        error: err.error,
        message: err.message,
        timestamp: err.timestamp,
        requestId: err.requestId || req.id || uuid(),
        path: req.originalUrl || req.url,
      });
    }

    // Handle any other errors
    return res.status(status).json(
      createErrorResponse(err?.message || "Internal Server Error", req, err, {
        includeDetails,
      }),
    );
  };
}

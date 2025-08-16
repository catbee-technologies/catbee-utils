import { randomUUID } from 'crypto';
import { ApiResponse } from '../types/api-response';
import { getRequestId } from './context-store.utils';

/**
 * Standard HTTP response wrapper for successful responses.
 * Implements the `ApiResponse<T>` interface and sets default values.
 *
 * @typeParam T - The shape of the data returned in the response.
 */
export class SuccessResponse<T> implements ApiResponse<T> {
  /** Message describing the result of the operation. */
  message: string = 'Success';

  /** Whether the response is an error. Always false in success responses. */
  error: boolean = false;

  /** The payload returned from the API. */
  data: T | null = null;

  /** Timestamp when the response was generated, in ISO format. */
  timestamp: string = new Date().toISOString();

  /** Unique identifier for this response, useful for request tracing. */
  requestId: string = getRequestId() ?? randomUUID();

  /**
   * Constructs a new success response.
   *
   * @param {string} message - Optional message to override the default.
   * @param {T} [data] - Optional data payload.
   */
  constructor(message: string, data?: T) {
    if (message) this.message = message;
    this.data = data ?? null;
  }
}

/**
 * Wrapper for error responses that extends the native `Error` object.
 * Implements `ApiResponse` but omits the `data` field (which should not be present in errors).
 */
export class ErrorResponse extends Error implements Omit<ApiResponse<never>, 'data'> {
  /** HTTP status code associated with the error (e.g., 404, 500). */
  status: number;

  /** Indicates that this is an error. Always true. */
  error: boolean = true;

  /** Timestamp when the error occurred, in ISO format. */
  timestamp: string = new Date().toISOString();

  /** Unique identifier for this error instance. */
  requestId: string = getRequestId() ?? randomUUID();

  /**
   * Constructs a new error response.
   *
   * @param {string} message - The error message to display or log.
   * @param {number} [status=500] - Optional HTTP status code (defaults to 500).
   */
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Response with paginated data extending the standard success response.
 * Useful for APIs that return large collections of data.
 *
 * @typeParam T - The shape of each item in the paginated collection.
 */
export class PaginatedResponse<T> extends SuccessResponse<T[]> {
  /** Total number of items across all pages */
  total: number;

  /** Current page number (1-based) */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there's a next page available */
  hasNext: boolean;

  /** Whether there's a previous page available */
  hasPrevious: boolean;

  /**
   * Constructs a new paginated response.
   *
   * @param {T[]} items - The current page of items.
   * @param {Object} pagination - Pagination information.
   * @param {number} pagination.total - Total number of items across all pages.
   * @param {number} pagination.page - Current page number (1-based).
   * @param {number} pagination.pageSize - Number of items per page.
   * @param {string} [message="Success"] - Optional custom message.
   */
  constructor(items: T[], pagination: { total: number; page: number; pageSize: number }, message: string = 'Success') {
    super(message, items);

    this.total = pagination.total;
    this.page = pagination.page;
    this.pageSize = pagination.pageSize;

    this.totalPages = Math.ceil(this.total / this.pageSize);
    this.hasNext = this.page < this.totalPages;
    this.hasPrevious = this.page > 1;
  }
}

/**
 * Specialized response for operations that don't return data (HTTP 204).
 */
export class NoContentResponse extends SuccessResponse<null> {
  /**
   * Constructs a new no-content response.
   *
   * @param {string} [message="Operation completed successfully"] - Optional custom message.
   */
  constructor(message: string = 'Operation completed successfully') {
    super(message, null);
  }
}

/**
 * Specialized response for redirects.
 */
export class RedirectResponse {
  /** The URL to redirect to */
  redirectUrl: string;

  /** HTTP status code for the redirect (301, 302, 303, 307, 308) */
  statusCode: number;

  /** Whether the response is a redirect */
  isRedirect: boolean = true;

  /** Unique identifier for this response */
  requestId: string = getRequestId() ?? randomUUID();

  /**
   * Constructs a new redirect response.
   *
   * @param {string} url - The URL to redirect to.
   * @param {number} [statusCode=302] - HTTP status code for the redirect.
   */
  constructor(url: string, statusCode: number = 302) {
    this.redirectUrl = url;
    this.statusCode = statusCode;
  }
}

/**
 * Creates a standard success response.
 *
 * @typeParam T - The shape of the data returned in the response.
 * @param {T} data - The data to include in the response.
 * @param {string} [message="Success"] - Optional custom message.
 * @returns {SuccessResponse<T>} A properly formatted success response.
 */
export function createSuccessResponse<T>(data: T, message: string = 'Success'): SuccessResponse<T> {
  return new SuccessResponse<T>(message, data);
}

/**
 * Creates a standard error response.
 *
 * @param {string} message - The error message.
 * @param {number} [statusCode=500] - HTTP status code for the error.
 * @returns {ErrorResponse} A properly formatted error response.
 */
export function createErrorResponse(message: string, statusCode: number = 500): ErrorResponse {
  return new ErrorResponse(message, statusCode);
}

/**
 * Creates a paginated response from array data.
 *
 * @typeParam T - The shape of each item in the collection.
 * @param {T[]} allItems - The complete array of items to paginate.
 * @param {number} page - The requested page (1-based).
 * @param {number} pageSize - The number of items per page.
 * @param {string} [message="Success"] - Optional custom message.
 * @returns {PaginatedResponse<T>} A properly formatted paginated response.
 */
export function createPaginatedResponse<T>(
  allItems: T[],
  page: number,
  pageSize: number,
  message: string = 'Success'
): PaginatedResponse<T> {
  // Ensure valid pagination parameters
  const validPage = Math.max(1, page);
  const validPageSize = Math.max(1, pageSize);

  // Calculate slice indices
  const startIndex = (validPage - 1) * validPageSize;
  const endIndex = startIndex + validPageSize;

  // Get current page items
  const pageItems = allItems.slice(startIndex, endIndex);

  return new PaginatedResponse<T>(
    pageItems,
    {
      total: allItems.length,
      page: validPage,
      pageSize: validPageSize
    },
    message
  );
}

/**
 * Adapter to convert API responses to Express.js response format.
 *
 * @param {any} res - Express response object.
 * @param {SuccessResponse<any> | ErrorResponse | RedirectResponse} apiResponse - API response instance.
 */
export function sendResponse(res: any, apiResponse: SuccessResponse<any> | ErrorResponse | RedirectResponse): void {
  // Handle redirects
  if ('redirectUrl' in apiResponse) {
    res.redirect(apiResponse.statusCode, apiResponse.redirectUrl);
    return;
  }

  // Handle errors
  if ('error' in apiResponse && apiResponse.error) {
    const errorResponse = apiResponse as ErrorResponse;
    res.status(errorResponse.status).json({
      error: true,
      message: errorResponse.message,
      timestamp: errorResponse.timestamp,
      requestId: errorResponse.requestId
    });
    return;
  }

  // Handle success responses
  const successResponse = apiResponse as SuccessResponse<any>;

  // No content (204) shouldn't return a body
  if (successResponse instanceof NoContentResponse) {
    res.status(204).end();
    return;
  }

  res.status(200).json(successResponse);
}

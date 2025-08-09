import { HttpStatusCodes } from "./http-status-codes";
import { getLogger } from "./logger.utils";
import { ErrorResponse } from "./response.utils";

/**
 * Generic HTTP error class used for custom exceptions with any status code.
 * Inherit this when you need to throw errors dynamically at runtime.
 */
export class HttpError extends ErrorResponse {
  /**
   * Creates a new HTTP error instance.
   * @param status - A valid HTTP status code (e.g., 400, 500).
   * @param message - The error message to return to the client.
   */
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Represents a 500 Internal Server Error.
 * Use this for unexpected backend errors that are not caused by the client.
 */
export class InternalServerErrorException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Internal server error".
   */
  constructor(message: string = "Internal server error") {
    super(message);
    this.status = HttpStatusCodes.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Represents a 401 Unauthorized Error.
 * Indicates that authentication is required and has failed or not been provided.
 */
export class UnauthorizedException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Unauthorized".
   */
  constructor(message: string = "Unauthorized") {
    super(message);
    this.status = HttpStatusCodes.UNAUTHORIZED;
  }
}

/**
 * Represents a 400 Bad Request Error.
 * Indicates that the client has sent invalid data (e.g., malformed request body).
 */
export class BadRequestException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Bad request".
   */
  constructor(message: string = "Bad request") {
    super(message);
    this.status = HttpStatusCodes.BAD_REQUEST;
  }
}

/**
 * Represents a 404 Not Found Error.
 * Used when a requested resource (e.g., user, file) could not be located.
 */
export class NotFoundException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Resource not found".
   */
  constructor(message: string = "Resource not found") {
    super(message);
    this.status = HttpStatusCodes.NOT_FOUND;
  }
}

/**
 * Represents a 403 Forbidden Error.
 * Indicates that the client is authenticated but not allowed to access the resource.
 */
export class ForbiddenException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Forbidden".
   */
  constructor(message: string = "Forbidden") {
    super(message);
    this.status = HttpStatusCodes.FORBIDDEN;
  }
}

/**
 * Represents a 409 Conflict Error.
 * Commonly used when a resource already exists or a versioning conflict occurs.
 */
export class ConflictException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Conflict".
   */
  constructor(message: string = "Conflict") {
    super(message);
    this.status = HttpStatusCodes.CONFLICT;
  }
}

/**
 * Represents a 502 Bad Gateway Error.
 * Used when the server receives an invalid response from an upstream server.
 */
export class BadGatewayException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Bad Gateway".
   */
  constructor(message: string = "Bad Gateway") {
    super(message);
    this.status = HttpStatusCodes.BAD_GATEWAY;
  }
}

/**
 * Represents a 429 Too Many Requests Error.
 * Returned when the client has hit a rate limit.
 */
export class TooManyRequestsException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Too many requests".
   */
  constructor(message: string = "Too many requests") {
    super(message);
    this.status = HttpStatusCodes.TOO_MANY_REQUESTS;
  }
}

/**
 * Represents a 503 Service Unavailable Error.
 * Indicates that the server is temporarily unavailable (e.g., for maintenance).
 */
export class ServiceUnavailableException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Service Unavailable".
   */
  constructor(message: string = "Service Unavailable") {
    super(message);
    this.status = HttpStatusCodes.SERVICE_UNAVAILABLE;
  }
}

/**
 * Represents a 504 Gateway Timeout Error.
 * Returned when the server acting as a gateway times out waiting for a response.
 */
export class GatewayTimeoutException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Gateway Timeout".
   */
  constructor(message: string = "Gateway Timeout") {
    super(message);
    this.status = HttpStatusCodes.GATEWAY_TIMEOUT;
  }
}

/**
 * Represents a 422 Unprocessable Entity Error.
 * Used when the server understands the content type but cannot process the contained instructions.
 */
export class UnprocessableEntityException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Unprocessable Entity".
   * @param details - Optional validation details or additional error context.
   */
  constructor(
    message: string = "Unprocessable Entity",
    public details?: Record<string, any>,
  ) {
    super(message);
    this.status = HttpStatusCodes.UNPROCESSABLE_ENTITY;
  }
}

/**
 * Represents a 405 Method Not Allowed Error.
 * Used when the request method is not supported for the requested resource.
 */
export class MethodNotAllowedException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Method Not Allowed".
   * @param allowedMethods - Optional array of allowed HTTP methods.
   */
  constructor(
    message: string = "Method Not Allowed",
    public allowedMethods?: string[],
  ) {
    super(message);
    this.status = HttpStatusCodes.METHOD_NOT_ALLOWED;
  }
}

/**
 * Represents a 406 Not Acceptable Error.
 * Used when the server cannot produce a response matching the client's accepted content types.
 */
export class NotAcceptableException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Not Acceptable".
   */
  constructor(message: string = "Not Acceptable") {
    super(message);
    this.status = HttpStatusCodes.NOT_ACCEPTABLE;
  }
}

/**
 * Represents a 408 Request Timeout Error.
 * Used when the server times out waiting for the client to send a request.
 */
export class RequestTimeoutException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Request Timeout".
   */
  constructor(message: string = "Request Timeout") {
    super(message);
    this.status = HttpStatusCodes.REQUEST_TIMEOUT;
  }
}

/**
 * Represents a 415 Unsupported Media Type Error.
 * Used when the request's Content-Type is not supported.
 */
export class UnsupportedMediaTypeException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Unsupported Media Type".
   */
  constructor(message: string = "Unsupported Media Type") {
    super(message);
    this.status = HttpStatusCodes.UNSUPPORTED_MEDIA_TYPE;
  }
}

/**
 * Represents a 413 Payload Too Large Error.
 * Used when the request body exceeds server limits.
 */
export class PayloadTooLargeException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Payload Too Large".
   */
  constructor(message: string = "Payload Too Large") {
    super(message);
    this.status = HttpStatusCodes.PAYLOAD_TOO_LARGE;
  }
}

/**
 * Represents a 507 Insufficient Storage Error.
 * Used when the server has insufficient storage to complete the request.
 */
export class InsufficientStorageException extends ErrorResponse {
  /**
   * @param message - Optional custom message. Defaults to "Insufficient Storage".
   */
  constructor(message: string = "Insufficient Storage") {
    super(message);
    this.status = HttpStatusCodes.INSUFFICIENT_STORAGE;
  }
}

/**
 * Checks if an error is an instance of HttpError or its subclasses.
 *
 * @param error - The error to check.
 * @returns True if the error is an HttpError, false otherwise.
 */
export function isHttpError(error: unknown): error is ErrorResponse {
  return error instanceof ErrorResponse;
}

/**
 * Creates an HTTP error with the specified status code and message.
 * Factory function for creating appropriate HTTP error instances.
 *
 * @param status - HTTP status code.
 * @param message - Optional custom error message.
 * @returns An instance of the appropriate HTTP error class.
 */
export function createHttpError(
  status: number,
  message?: string,
): ErrorResponse {
  switch (status) {
    case HttpStatusCodes.BAD_REQUEST:
      return new BadRequestException(message);
    case HttpStatusCodes.UNAUTHORIZED:
      return new UnauthorizedException(message);
    case HttpStatusCodes.FORBIDDEN:
      return new ForbiddenException(message);
    case HttpStatusCodes.NOT_FOUND:
      return new NotFoundException(message);
    case HttpStatusCodes.METHOD_NOT_ALLOWED:
      return new MethodNotAllowedException(message);
    case HttpStatusCodes.NOT_ACCEPTABLE:
      return new NotAcceptableException(message);
    case HttpStatusCodes.REQUEST_TIMEOUT:
      return new RequestTimeoutException(message);
    case HttpStatusCodes.CONFLICT:
      return new ConflictException(message);
    case HttpStatusCodes.GONE:
      return new HttpError(HttpStatusCodes.GONE, message || "Gone");
    case HttpStatusCodes.PAYLOAD_TOO_LARGE:
      return new PayloadTooLargeException(message);
    case HttpStatusCodes.UNSUPPORTED_MEDIA_TYPE:
      return new UnsupportedMediaTypeException(message);
    case HttpStatusCodes.UNPROCESSABLE_ENTITY:
      return new UnprocessableEntityException(message);
    case HttpStatusCodes.TOO_MANY_REQUESTS:
      return new TooManyRequestsException(message);
    case HttpStatusCodes.INTERNAL_SERVER_ERROR:
      return new InternalServerErrorException(message);
    case HttpStatusCodes.BAD_GATEWAY:
      return new BadGatewayException(message);
    case HttpStatusCodes.SERVICE_UNAVAILABLE:
      return new ServiceUnavailableException(message);
    case HttpStatusCodes.GATEWAY_TIMEOUT:
      return new GatewayTimeoutException(message);
    case HttpStatusCodes.INSUFFICIENT_STORAGE:
      return new InsufficientStorageException(message);
    default:
      return new HttpError(status, message || `HTTP Error ${status}`);
  }
}

/**
 * Type guard to check if an object has specific error properties.
 *
 * @param error - The object to check.
 * @returns True if object has error-like structure.
 */
export function hasErrorShape(
  error: unknown,
): error is { message: string; status?: number; code?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}

/**
 * Safely extracts message from any error type.
 *
 * @param error - Any error object or value.
 * @returns A string error message.
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (hasErrorShape(error)) {
    return error.message;
  }

  return "Unknown error occurred";
}

/**
 * Wraps a function and transforms any errors into HTTP errors.
 * Useful for API handlers to ensure consistent error responses.
 *
 * @param handler - The async function to wrap.
 * @returns A function that always returns or throws an HTTP error.
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (isHttpError(error)) {
        throw error;
      }

      // Log the original error (consider using a proper logger)
      getLogger().error("Caught error in handler:", error);

      // Extract status code if it exists, otherwise use 500
      let status = HttpStatusCodes.INTERNAL_SERVER_ERROR;
      if (hasErrorShape(error) && typeof error.status === "number") {
        status = error.status;
      }

      // Create appropriate HTTP error
      throw createHttpError(status, getErrorMessage(error));
    }
  };
}

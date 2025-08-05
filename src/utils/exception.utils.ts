import { HttpStatusCodes } from "./http-status-codes";
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

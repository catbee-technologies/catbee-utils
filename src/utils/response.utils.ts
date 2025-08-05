import { randomUUID } from "crypto";
import { ApiResponse } from "../types/api-response";
import { getRequestId } from "./context-store.utils";

/**
 * Standard HTTP response wrapper for successful responses.
 * Implements the `ApiResponse<T>` interface and sets default values.
 *
 * @template T - The shape of the data returned in the response.
 */
export class SuccessResponse<T> implements ApiResponse<T> {
  /** Message describing the result of the operation. */
  message: string = "Success";

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
   * @param message - Optional message to override the default.
   * @param data - Optional data payload.
   */
  constructor(message: string, data?: T) {
    if (message) this.message = message;
    this.data = data ?? null;
  }
}

/**
 * Wrapper for error responses that extends the native `Error` object.
 * Implements `ApiResponse` without the `data` field.
 */
export class ErrorResponse extends Error implements Omit<ApiResponse, "data"> {
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
   * @param message - The error message to display or log.
   * @param status - Optional HTTP status code (defaults to 500).
   */
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Generic API response format.
 * Used to wrap any successful or failed response from the server.
 */
export interface ApiResponse<T = any> {
  /** Payload returned from the API. Can be any shape depending on the endpoint. */
  data: T | null;

  /** Indicates whether an error occurred (true = error, false = success). */
  error: boolean;

  /** Human-readable message to describe the result or error. */
  message: string;

  /** Unique request ID for traceability in logs (e.g., from a middleware). */
  requestId: string;

  /** ISO timestamp when the response was generated. */
  timestamp: string;
}

/**
 * Generic pagination structure used for paged lists (e.g., /users?page=1).
 */
export interface Pagination<T = any> {
  /** List of records for the current page. */
  content: T[];

  /** Metadata about the pagination state. */
  pagination: {
    /** Total number of records across all pages. */
    totalRecords: number;

    /** Total number of pages available. */
    totalPages: number;

    /** Current page number (1-based index). */
    page: number;

    /** Number of records per page. */
    limit: number;

    /** Field by which the data is sorted. */
    sortBy: string;

    /** Sort order: ascending or descending. */
    sortOrder: "asc" | "desc";
  };
}

/**
 * Alias for paginated API response.
 * Allows semantic naming like `PaginationResponse<User>` or `PaginationResponse<Post>`.
 */
export type PaginationResponse<T = any> = Pagination<T>;

/**
 * Error response structure with additional metadata.
 * Used for providing richer error information to clients.
 */
export interface ApiErrorResponse extends Omit<ApiResponse<never>, "data"> {
  /** Error always true for error responses */
  error: true;

  /** HTTP status code */
  status: number;

  /** Error code for client-side error handling */
  code?: string;

  /** Optional detailed validation errors */
  details?: Record<string, string[]>;

  /** Link to error documentation */
  docUrl?: string;
}

/**
 * Success response structure with strongly typed data.
 * Used for providing successful responses to clients.
 */
export interface ApiSuccessResponse<T = any> extends ApiResponse<T> {
  /** Error always false for success responses */
  error: false;

  /** HTTP status code (usually 200) */
  status?: number;
}

/**
 * Response structure for batch operations.
 * Used when multiple operations are performed in a single request.
 */
export interface BatchResponse<T = any> {
  /** Overall success/failure indicator */
  success: boolean;

  /** Total number of operations */
  total: number;

  /** Number of successful operations */
  successful: number;

  /** Number of failed operations */
  failed: number;

  /** Results of individual operations */
  results: Array<{
    /** Identifier for this operation */
    id: string | number;

    /** Success/failure indicator for this operation */
    success: boolean;

    /** Response data for this operation */
    data?: T;

    /** Error information if this operation failed */
    error?: {
      message: string;
      code?: string;
    };
  }>;
}

/**
 * Response structure for asynchronous operations.
 * Used when the operation will complete in the future.
 */
export interface AsyncOperationResponse {
  /** Always true for async operations */
  async: true;

  /** Job or task ID to check status later */
  jobId: string;

  /** Estimated completion time in seconds (if known) */
  estimatedTime?: number;

  /** URL to check status */
  statusUrl: string;
}

/**
 * Response structure for streaming operations.
 * Used when data is returned as a stream rather than all at once.
 */
export interface StreamResponse {
  /** Stream identifier */
  streamId: string;

  /** Stream type (e.g., 'json', 'binary') */
  streamType: string;

  /** Total size in bytes (if known) */
  totalSize?: number;

  /** Chunk size in bytes */
  chunkSize: number;
}

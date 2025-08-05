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

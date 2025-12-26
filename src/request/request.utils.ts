import { Request } from 'express';
import type { SortDirection, WithPagination } from '@catbee/utils/response';
import { BadRequestException } from '@catbee/utils/exception';

/**
 * Options for parsing and validating request parameters.
 */
export interface ValidationOptions {
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;

  /** Custom error message for validation failures */
  errorMessage?: string;

  /** Default value to use if parameter is missing */
  defaultValue?: any;

  /** Whether the parameter is required */
  required?: boolean;
}

/**
 * Result of a parameter validation operation.
 */
export interface ValidationResult<T> {
  /** Whether validation was successful */
  isValid: boolean;

  /** The validated and potentially transformed value */
  value: T | null;

  /** Error message if validation failed */
  error?: string;
}

/**
 * Extracts pagination, sorting, and optional search params from a request.
 *
 * @param req - Express request
 * @returns Object containing validated pagination, sorting, and additional query params
 */
export const getPaginationParams = <T = {}>(req: Request): WithPagination<T> => {
  const query = req.query as Record<string, string | string[]>;

  // Extract page & limit
  const { page, limit } = extractPaginationParams(query, 1, 20, 100);
  const { sortBy, sortOrder } = extractSortParams(query, []);

  // Optional search param
  const search = typeof query.search === 'string' ? query.search : undefined;

  return {
    ...(query as T),
    page,
    limit,
    sortBy,
    sortOrder: sortOrder as SortDirection,
    search
  };
};

/**
 * Safely parses a string parameter to a number.
 *
 * @param value - String value to parse
 * @param options - Validation options
 * @returns Validation result containing the parsed number or error
 */
export function parseNumberParam(value: string | undefined, options: ValidationOptions = {}): ValidationResult<number> {
  const { throwOnError = false, errorMessage = 'Invalid number parameter', defaultValue, required = false } = options;

  // Handle undefined case
  if (value === undefined) {
    if (required) {
      const error = `Required number parameter is missing`;
      if (throwOnError) throw new BadRequestException(error);
      return { isValid: false, value: null, error };
    }

    return {
      isValid: defaultValue !== undefined,
      value: defaultValue !== undefined ? defaultValue : null,
      error: defaultValue === undefined ? 'Missing parameter with no default' : undefined
    };
  }

  // Parse and validate the number
  const num = Number(value);
  if (isNaN(num)) {
    if (throwOnError) throw new BadRequestException(errorMessage);
    return { isValid: false, value: null, error: errorMessage };
  }

  return { isValid: true, value: num };
}

/**
 * Safely parses a string parameter to a boolean.
 *
 * @param value - String value to parse
 * @param options - Validation options
 * @returns Validation result containing the parsed boolean or error
 */
export function parseBooleanParam(
  value: string | undefined,
  options: ValidationOptions = {}
): ValidationResult<boolean> {
  const { throwOnError = false, errorMessage = 'Invalid boolean parameter', defaultValue, required = false } = options;

  // Handle undefined case
  if (value === undefined) {
    if (required) {
      const error = `Required boolean parameter is missing`;
      if (throwOnError) throw new BadRequestException(error);
      return { isValid: false, value: null, error };
    }

    return {
      isValid: defaultValue !== undefined,
      value: defaultValue !== undefined ? defaultValue : null,
      error: defaultValue === undefined ? 'Missing parameter with no default' : undefined
    };
  }

  // Parse the boolean value with various allowed formats
  const lowercaseValue = value.toLowerCase();
  if (['true', 't', 'yes', 'y', '1'].includes(lowercaseValue)) {
    return { isValid: true, value: true };
  }

  if (['false', 'f', 'no', 'n', '0'].includes(lowercaseValue)) {
    return { isValid: true, value: false };
  }

  if (throwOnError) throw new BadRequestException(errorMessage);
  return { isValid: false, value: null, error: errorMessage };
}

/**
 * Extracts pagination parameters from request query parameters.
 *
 * @param query - Query parameters object
 * @param defaultPage - Default page number if not specified (defaults to 1)
 * @param defaultLimit - Default per page size if not specified (defaults to 20)
 * @param maxLimitSize - Maximum allowed per page size (defaults to 100)
 * @returns Object containing validated page and limit
 */
export function extractPaginationParams(
  query: Record<string, string | string[]>,
  defaultPage: number = 1,
  defaultLimit: number = 20,
  maxLimitSize: number = 100
): { page: number; limit: number } {
  // Parse page parameter
  const pageParam = typeof query.page === 'string' ? query.page : undefined;
  const pageResult = parseNumberParam(pageParam, { defaultValue: defaultPage });

  // Parse limit parameter
  const limitParam = typeof query.limit === 'string' ? query.limit : undefined;
  const limitResult = parseNumberParam(limitParam, { defaultValue: defaultLimit });

  // Ensure valid values (handle 0 → fallback to default)
  const page = pageResult.value && pageResult.value > 0 ? pageResult.value : defaultPage;

  const limit = limitResult.value && limitResult.value > 0 ? Math.min(limitResult.value, maxLimitSize) : defaultLimit;

  return { page, limit };
}

/**
 * Extracts sorting parameters from request query parameters.
 *
 * @param query - Query parameters object
 * @param allowedFields - Array of field names that are allowed to be sorted
 * @param defaultSort - Default sort configuration if not specified
 * @returns Object containing sort field and direction
 */
export function extractSortParams(
  query: Record<string, string | string[]>,
  allowedFields: string[],
  defaultSort: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  let sortBy = defaultSort.sortBy;
  let sortOrder: 'asc' | 'desc' = defaultSort.sortOrder;

  // Extract from `sortBy` or `sort`
  if (typeof query.sortBy === 'string') {
    sortBy = query.sortBy;
  } else if (Array.isArray(query.sortBy)) {
    sortBy = query.sortBy[0];
  } else if (typeof query.sort === 'string') {
    sortBy = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    sortOrder = query.sort.startsWith('-') ? 'desc' : 'asc';
  } else if (Array.isArray(query.sort)) {
    sortBy = query.sort[0].startsWith('-') ? query.sort[0].slice(1) : query.sort[0];
    sortOrder = query.sort[0].startsWith('-') ? 'desc' : 'asc';
  }

  // Explicit sortOrder (overrides inferred one if valid)
  if (typeof query.sortOrder === 'string') {
    const order = query.sortOrder.toLowerCase();
    if (order === 'asc' || order === 'desc') {
      sortOrder = order;
    }
  }

  // Validate field
  if (allowedFields.length && !allowedFields.includes(sortBy)) {
    sortBy = defaultSort.sortBy;
  }

  return { sortBy, sortOrder };
}

/**
 * Extracts filter parameters from query parameters based on allowed filter fields.
 *
 * @param query - Query parameters object
 * @param allowedFilters - Array of field names that are allowed to be used as filters
 * @returns Object containing the filters as key-value pairs
 */
export function extractFilterParams(
  query: Record<string, string | string[]>,
  allowedFilters: string[]
): Record<string, string | string[]> {
  const filters: Record<string, string | string[]> = {};

  // Find filter parameters in the query
  for (const field of allowedFilters) {
    if (field in query) {
      filters[field] = query[field];
    }
  }

  return filters;
}

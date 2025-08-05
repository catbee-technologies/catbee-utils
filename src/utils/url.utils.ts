import { URL, URLSearchParams } from "url";

/**
 * Appends query parameters to a given URL.
 *
 * @param url - The base URL to which query parameters will be appended.
 * @param params - A record of key-value pairs to append as query parameters.
 * @returns The new URL string with query parameters appended.
 *
 * @example
 * appendQueryParams('https://example.com', { page: 1, limit: 10 });
 * // → 'https://example.com/?page=1&limit=10'
 */
export function appendQueryParams(
  url: string,
  params: Record<string, string | number>,
): string {
  const urlObj = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    urlObj.searchParams.set(key, value.toString());
  }
  return urlObj.toString();
}

/**
 * Parses a query string into a key-value object.
 *
 * @param query - The query string (with or without leading '?').
 * @returns A record representing the parsed query parameters.
 *
 * @example
 * parseQueryString('?page=1&limit=10');
 * // → { page: '1', limit: '10' }
 */
export function parseQueryString(query: string): Record<string, string> {
  const cleanQuery = query.startsWith("?") ? query.slice(1) : query;
  return Object.fromEntries(new URLSearchParams(cleanQuery));
}

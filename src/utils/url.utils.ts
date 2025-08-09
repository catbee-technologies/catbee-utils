import { URL, URLSearchParams } from "url";

/**
 * Appends query parameters to a given URL.
 *
 * @param {string} url - The base URL to which query parameters will be appended.
 * @param {Record<string, string | number>} params - Key-value pairs to add as query parameters.
 * @returns {string} The new URL string with query parameters appended.
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
 * @param {string} query - The query string (with or without leading '?').
 * @returns {Record<string, string>} Object representing parsed query parameters.
 *
 * @example
 * parseQueryString('?page=1&limit=10');
 * // → { page: '1', limit: '10' }
 */
export function parseQueryString(query: string): Record<string, string> {
  const cleanQuery = query.startsWith("?") ? query.slice(1) : query;
  // Object.fromEntries guarantees string values in result
  return Object.fromEntries(new URLSearchParams(cleanQuery)) as Record<
    string,
    string
  >;
}

/**
 * Validates if a string is a valid URL.
 *
 * @param {string} url - The URL string to validate.
 * @param {boolean} [requireHttps=false] - If true, requires the URL to use HTTPS.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
export function isValidUrl(
  url: string,
  requireHttps: boolean = false,
): boolean {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol || !parsedUrl.hostname) return false;
    if (requireHttps && parsedUrl.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts the domain name from a URL.
 *
 * @param {string} url - The URL to extract the domain from.
 * @param {boolean} [removeSubdomains=false] - If true, removes subdomains (returns root domain only).
 * @returns {string} The domain name.
 *
 * @example
 * getDomain('https://api.example.com/path');
 * // → 'api.example.com'
 *
 * getDomain('https://api.example.com/path', true);
 * // → 'example.com'
 */
export function getDomain(
  url: string,
  removeSubdomains: boolean = false,
): string {
  try {
    const { hostname } = new URL(url);

    if (!removeSubdomains) {
      return hostname;
    }

    // Extract root domain (remove subdomains)
    const parts = hostname.split(".");
    if (parts.length <= 2) return hostname;

    // Handle special cases like co.in, com.au
    const secondLevelDomains = ["co", "com", "org", "net", "gov", "edu", "ac"];
    const sld = parts[parts.length - 2];

    if (secondLevelDomains.includes(sld) && parts.length > 2) {
      return parts.slice(-3).join(".");
    }

    return parts.slice(-2).join(".");
  } catch {
    return "";
  }
}

/**
 * Joins URL paths properly handling slashes.
 *
 * @param {...string[]} segments - URL path segments to join.
 * @returns {string} Joined URL path.
 *
 * @example
 * joinPaths('https://example.com/', '/api/', '/users');
 * // → 'https://example.com/api/users'
 */
export function joinPaths(...segments: string[]): string {
  let result = segments
    .filter((s) => s !== undefined && s !== null)
    .map((segment, index) => {
      if (index === 0) return segment.replace(/\/+$/, "");
      return segment.replace(/^\/+|\/+$/g, "");
    })
    .filter(Boolean)
    .join("/");
  if (segments[0] === "" && !result.startsWith("/")) result = "/" + result;
  return result;
}

/**
 * Normalizes a URL by resolving relative paths, handling protocol-relative URLs, etc.
 *
 * @param {string} url - The URL to normalize.
 * @param {string} [base] - Optional base URL for resolving relative URLs.
 * @returns {string} Normalized URL.
 *
 * @example
 * normalizeUrl('HTTP://Example.COM/foo/../bar');
 * // → 'http://example.com/bar'
 */
export function normalizeUrl(url: string, base?: string): string {
  try {
    // Handle protocol-relative URLs
    if (url.startsWith("//")) {
      url = `https:${url}`;
    }

    // Resolve relative URLs against a base
    const parsedUrl = base ? new URL(url, base) : new URL(url);

    // Normalize
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+/g, "/"); // Collapse multiple slashes
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, ""); // Remove trailing slash
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

    return parsedUrl.toString();
  } catch {
    return url; // Return original if invalid
  }
}

/**
 * Creates a URL builder for constructing URLs with a base URL.
 *
 * @param {string} baseUrl - The base URL to build upon.
 * @returns {Object} URL builder methods.
 *
 * @example
 * const api = createUrlBuilder('https://api.example.com');
 * api.path('/users', { active: true });
 * // → 'https://api.example.com/users?active=true'
 */
export function createUrlBuilder(baseUrl: string) {
  return {
    /**
     * Creates a full URL with the given path and query parameters.
     *
     * @param {string} path - The path to append to the base URL.
     * @param {Record<string, any>} [params] - Query parameters to add.
     * @returns {string} The complete URL.
     */
    path(path: string, params?: Record<string, any>): string {
      const url = joinPaths(baseUrl, path);
      return params
        ? appendQueryParams(url, params as Record<string, string | number>)
        : url;
    },

    /**
     * Creates a full URL with query parameters but no additional path.
     *
     * @param {Record<string, any>} params - Query parameters to add.
     * @returns {string} The complete URL with query parameters.
     */
    query(params: Record<string, any>): string {
      return appendQueryParams(
        baseUrl,
        params as Record<string, string | number>,
      );
    },
  };
}

/**
 * Extracts specific query parameters from a URL.
 *
 * @param {string} url - The URL to extract parameters from.
 * @param {string[]} paramNames - Names of parameters to extract.
 * @returns {Record<string, string>} Object containing the extracted parameters.
 */
export function extractQueryParams(
  url: string,
  paramNames: string[],
): Record<string, string> {
  try {
    const parsedUrl = new URL(url);
    const result: Record<string, string> = {};

    for (const name of paramNames) {
      const value = parsedUrl.searchParams.get(name);
      if (value !== null) {
        result[name] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

/**
 * Removes specified query parameters from a URL.
 *
 * @param {string} url - The URL to modify.
 * @param {string[]} paramsToRemove - Names of parameters to remove.
 * @returns {string} URL with parameters removed.
 */
export function removeQueryParams(
  url: string,
  paramsToRemove: string[],
): string {
  try {
    const parsedUrl = new URL(url);

    for (const param of paramsToRemove) {
      parsedUrl.searchParams.delete(param);
    }

    return parsedUrl.toString();
  } catch {
    return url;
  }
}

/**
 * Gets the file extension from a URL path.
 *
 * @param {string} url - The URL to examine.
 * @returns {string} The file extension (without dot) or empty string if none found.
 *
 * @example
 * getExtension('https://example.com/document.pdf?v=1');
 * // → 'pdf'
 */
export function getExtension(url: string): string {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\.([^./\\?#]+)$/);
    return match ? match[1].toLowerCase() : "";
  } catch {
    // If URL parsing fails, try a simpler approach
    const match = url.match(/\.([^./\\?#]+)$/);
    return match ? match[1].toLowerCase() : "";
  }
}

/**
 * Parses URL query parameters into a strongly-typed object.
 *
 * @template T Expected type of the query parameters
 * @param {string} url - The URL to parse.
 * @param {Record<keyof T, (val: string) => any>} [converters] - Type converters for params.
 * @returns {Partial<T>} Typed query parameters.
 *
 * @example
 * parseTypedQueryParams<{page: number, q: string}>('https://example.com?page=2&q=test', {
 *   page: Number,
 *   q: String
 * });
 * // → { page: 2, q: 'test' }
 */
export function parseTypedQueryParams<T extends Record<string, any>>(
  url: string,
  converters?: Record<keyof T, (val: string) => any>,
): Partial<T> {
  try {
    const { searchParams } = new URL(url);
    const result = {} as Partial<T>;

    for (const [key, value] of searchParams.entries()) {
      if (converters && key in converters) {
        try {
          result[key as keyof T] = converters[key as keyof T](value);
        } catch {
          // Skip on conversion error
        }
      } else {
        result[key as keyof T] = value as any;
      }
    }

    return result;
  } catch {
    return {};
  }
}

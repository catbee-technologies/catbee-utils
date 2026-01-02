import { isValidUrl, normalizeUrl, sanitizeUrl } from './url.utils';

/**
 * UrlBuilder class for fluent URL construction and manipulation.
 * Provides a chainable API for building complex URLs.
 * All methods return a new instance, making it immutable.
 *
 * @example
 * ```typescript
 * // Build a URL from scratch
 * const url = new UrlBuilder()
 *   .protocol('https')
 *   .host('api.example.com')
 *   .path('/users')
 *   .queryParam('page', 1)
 *   .queryParam('limit', 10)
 *   .build();
 *
 * // Modify an existing URL
 * const modified = UrlBuilder.from('https://example.com/old')
 *   .path('/new')
 *   .addQueryParams({ active: true, sort: 'name' })
 *   .toString();
 *
 * // Chain operations
 * const api = new UrlBuilder()
 *   .https()
 *   .host('api.example.com')
 *   .appendPath('v1', 'users', '123')
 *   .hash('profile')
 *   .build();
 * ```
 */
export class UrlBuilder {
  private readonly url: URL;

  /**
   * Creates a new UrlBuilder instance.
   * @param baseUrl - Initial URL (default: 'http://localhost')
   */
  constructor(baseUrl: string = 'http://localhost') {
    try {
      this.url = new URL(baseUrl);
      // Normalize multiple consecutive slashes in pathname
      this.url.pathname = this.url.pathname.replace(/\/+/g, '/');
    } catch {
      // If invalid, create a minimal valid URL
      this.url = new URL('http://localhost');
    }
  }

  /**
   * Create a UrlBuilder from an existing URL.
   * @param url - URL string to build from
   */
  static from(url: string): UrlBuilder {
    return new UrlBuilder(url);
  }

  /**
   * Create a UrlBuilder with HTTP protocol.
   * @param host - Host name
   * @param path - Optional path
   */
  static http(host: string, path?: string): UrlBuilder {
    const builder = new UrlBuilder(`http://${host}`);
    return path ? builder.path(path) : builder;
  }

  /**
   * Create a UrlBuilder with HTTPS protocol.
   * @param host - Host name
   * @param path - Optional path
   */
  static https(host: string, path?: string): UrlBuilder {
    const builder = new UrlBuilder(`https://${host}`);
    return path ? builder.path(path) : builder;
  }

  /**
   * Clone this UrlBuilder instance.
   */
  clone(): UrlBuilder {
    return new UrlBuilder(this.url.toString());
  }

  // ========== Protocol Methods ==========

  /**
   * Set the protocol.
   * @param protocol - Protocol (e.g., 'http', 'https', 'ftp')
   */
  protocol(protocol: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.protocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Set protocol to HTTP.
   */
  http(): UrlBuilder {
    return this.protocol('http');
  }

  /**
   * Set protocol to HTTPS.
   */
  https(): UrlBuilder {
    return this.protocol('https');
  }

  // ========== Host/Domain Methods ==========

  /**
   * Set the hostname.
   * @param hostname - Host name
   */
  host(hostname: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.hostname = hostname;
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Set the hostname (alias for host).
   * @param hostname - Host name
   */
  hostname(hostname: string): UrlBuilder {
    return this.host(hostname);
  }

  /**
   * Set the port.
   * @param port - Port number
   */
  port(port: number | string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.port = port.toString();
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Remove the port.
   */
  removePort(): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.port = '';
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Set subdomain.
   * @param subdomain - Subdomain to set
   */
  subdomain(subdomain: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    const parts = newUrl.hostname.split('.');

    if (parts.length >= 2) {
      const domain = parts.slice(-2).join('.');
      newUrl.hostname = subdomain ? `${subdomain}.${domain}` : domain;
    } else {
      newUrl.hostname = subdomain ? `${subdomain}.${newUrl.hostname}` : newUrl.hostname;
    }

    return new UrlBuilder(newUrl.toString());
  }

  // ========== Path Methods ==========

  /**
   * Set the path.
   * @param path - Path to set
   */
  path(path: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.pathname = path.startsWith('/') ? path : `/${path}`;
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Append path segments.
   * @param segments - Path segments to append
   */
  appendPath(...segments: string[]): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    const currentPath = newUrl.pathname.replace(/\/$/, '');
    const newSegments = segments.map(s => s.replace(/(^\/)|(\/$)/g, '')).filter(Boolean);
    newUrl.pathname = [currentPath, ...newSegments].join('/');
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Prepend path segments.
   * @param segments - Path segments to prepend
   */
  prependPath(...segments: string[]): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    const currentPath = newUrl.pathname.replace(/^\//, '');
    const newSegments = segments.map(s => s.replace(/(^\/)|(\/$)/g, '')).filter(Boolean);
    newUrl.pathname = '/' + [...newSegments, currentPath].join('/');
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Replace a path segment at a specific index.
   * @param index - Index of the segment to replace
   * @param segment - New segment value
   */
  replacePathSegment(index: number, segment: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    const segments = newUrl.pathname.split('/').filter(Boolean);

    if (index >= 0 && index < segments.length) {
      segments[index] = segment;
      newUrl.pathname = '/' + segments.join('/');
    }

    return new UrlBuilder(newUrl.toString());
  }

  // ========== Query Parameter Methods ==========

  /**
   * Set a single query parameter.
   * @param key - Parameter key
   * @param value - Parameter value
   */
  queryParam(key: string, value: string | number | boolean | null | undefined): UrlBuilder {
    const newUrl = new URL(this.url.toString());

    if (value === null || value === undefined) {
      newUrl.searchParams.delete(key);
    } else {
      newUrl.searchParams.set(key, String(value));
    }

    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Add multiple query parameters.
   * @param params - Object of key-value pairs
   */
  addQueryParams(params: Record<string, string | number | boolean | null | undefined>): UrlBuilder {
    let builder = new UrlBuilder(this.url.toString());

    for (const [key, value] of Object.entries(params)) {
      builder = builder.queryParam(key, value);
    }

    return builder;
  }

  /**
   * Set query parameters (replaces all existing params).
   * @param params - Object of key-value pairs
   */
  setQueryParams(params: Record<string, string | number | boolean>): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.search = '';

    for (const [key, value] of Object.entries(params)) {
      newUrl.searchParams.set(key, String(value));
    }

    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Remove a query parameter.
   * @param key - Parameter key to remove
   */
  removeQueryParam(key: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.searchParams.delete(key);
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Remove multiple query parameters.
   * @param keys - Parameter keys to remove
   */
  removeQueryParams(keys: string[]): UrlBuilder {
    const newUrl = new URL(this.url.toString());

    for (const key of keys) {
      newUrl.searchParams.delete(key);
    }

    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Clear all query parameters.
   */
  clearQueryParams(): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.search = '';
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Append a value to an array-style query parameter.
   * @param key - Parameter key
   * @param value - Value to append
   */
  appendQueryParam(key: string, value: string | number): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.searchParams.append(key, String(value));
    return new UrlBuilder(newUrl.toString());
  }

  // ========== Hash/Fragment Methods ==========

  /**
   * Set the hash/fragment.
   * @param hash - Hash value (with or without #)
   */
  hash(hash: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.hash = hash.startsWith('#') ? hash : `#${hash}`;
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Remove the hash/fragment.
   */
  removeHash(): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.hash = '';
    return new UrlBuilder(newUrl.toString());
  }

  // ========== Username/Password Methods ==========

  /**
   * Set username for basic auth.
   * @param username - Username
   */
  username(username: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.username = username;
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Set password for basic auth.
   * @param password - Password
   */
  password(password: string): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.password = password;
    return new UrlBuilder(newUrl.toString());
  }

  /**
   * Set both username and password for basic auth.
   * @param username - Username
   * @param password - Password
   */
  auth(username: string, password: string): UrlBuilder {
    return this.username(username).password(password);
  }

  /**
   * Remove authentication credentials.
   */
  removeAuth(): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.username = '';
    newUrl.password = '';
    return new UrlBuilder(newUrl.toString());
  }

  // ========== Getter Methods ==========

  /**
   * Get the protocol.
   */
  getProtocol(): string {
    return this.url.protocol;
  }

  /**
   * Get the hostname.
   */
  getHost(): string {
    return this.url.hostname;
  }

  /**
   * Get the hostname (alias).
   */
  getHostname(): string {
    return this.url.hostname;
  }

  /**
   * Get the port.
   */
  getPort(): string {
    return this.url.port;
  }

  /**
   * Get the path.
   */
  getPath(): string {
    return this.url.pathname;
  }

  /**
   * Get path segments as an array.
   */
  getPathSegments(): string[] {
    return this.url.pathname.split('/').filter(Boolean);
  }

  /**
   * Get a query parameter value.
   * @param key - Parameter key
   */
  getQueryParam(key: string): string | null {
    return this.url.searchParams.get(key);
  }

  /**
   * Get all query parameters as an object.
   */
  getQueryParams(): Record<string, string> {
    return Object.fromEntries(this.url.searchParams.entries());
  }

  /**
   * Get all values for a query parameter (for array-style params).
   * @param key - Parameter key
   */
  getQueryParamAll(key: string): string[] {
    return this.url.searchParams.getAll(key);
  }

  /**
   * Get the hash/fragment.
   */
  getHash(): string {
    return this.url.hash;
  }

  /**
   * Get the search/query string (including ?).
   */
  getSearch(): string {
    return this.url.search;
  }

  /**
   * Get the origin (protocol + host + port).
   */
  getOrigin(): string {
    return this.url.origin;
  }

  /**
   * Get the username.
   */
  getUsername(): string {
    return this.url.username;
  }

  /**
   * Get the password.
   */
  getPassword(): string {
    return this.url.password;
  }

  // ========== Validation Methods ==========

  /**
   * Check if the URL is valid.
   */
  isValid(): boolean {
    return isValidUrl(this.url.toString());
  }

  /**
   * Check if the URL uses HTTPS.
   */
  isHttps(): boolean {
    return this.url.protocol === 'https:';
  }

  /**
   * Check if the URL uses HTTP.
   */
  isHttp(): boolean {
    return this.url.protocol === 'http:';
  }

  /**
   * Check if a query parameter exists.
   * @param key - Parameter key
   */
  hasQueryParam(key: string): boolean {
    return this.url.searchParams.has(key);
  }

  /**
   * Check if the URL has a hash/fragment.
   */
  hasHash(): boolean {
    return this.url.hash.length > 0;
  }

  /**
   * Check if the URL has authentication credentials.
   */
  hasAuth(): boolean {
    return this.url.username.length > 0 || this.url.password.length > 0;
  }

  // ========== Transformation Methods ==========

  /**
   * Normalize the URL.
   */
  normalize(): UrlBuilder {
    return new UrlBuilder(normalizeUrl(this.url.toString()));
  }

  /**
   * Sanitize the URL.
   * @param allowedProtocols - Allowed protocols
   */
  sanitize(allowedProtocols?: string[]): UrlBuilder | null {
    const sanitized = sanitizeUrl(this.url.toString(), allowedProtocols);
    return sanitized ? new UrlBuilder(sanitized) : null;
  }

  /**
   * Convert to lowercase hostname.
   */
  lowercaseHost(): UrlBuilder {
    const newUrl = new URL(this.url.toString());
    newUrl.hostname = newUrl.hostname.toLowerCase();
    return new UrlBuilder(newUrl.toString());
  }

  // ========== Conversion Methods ==========

  /**
   * Build and return the URL string.
   */
  build(): string {
    return this.url.toString();
  }

  /**
   * Get the URL string (alias for build).
   */
  toString(): string {
    return this.url.toString();
  }

  /**
   * Get the URL object.
   */
  toURL(): URL {
    return new URL(this.url.toString());
  }

  /**
   * Convert to JSON string.
   */
  toJSON(): string {
    return this.url.toString();
  }

  /**
   * Get the href (same as toString).
   */
  href(): string {
    return this.url.href;
  }

  /**
   * Export as an object with all URL components.
   */
  toObject(): {
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    username: string;
    password: string;
    origin: string;
    href: string;
    queryParams: Record<string, string>;
  } {
    return {
      protocol: this.url.protocol,
      hostname: this.url.hostname,
      port: this.url.port,
      pathname: this.url.pathname,
      search: this.url.search,
      hash: this.url.hash,
      username: this.url.username,
      password: this.url.password,
      origin: this.url.origin,
      href: this.url.href,
      queryParams: this.getQueryParams()
    };
  }
}

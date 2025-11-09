/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies. https://catbee.npm.hprasath.com/license
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { deepObjMerge } from '../utils/obj.utils';
import { ServerConfig } from '../types/server';
import { defaultServerConfig } from '../config';
import { isPort } from '../utils/validate.utils';

/**
 * Builder class for creating and configuring an Express server configuration.
 *
 * This class provides a fluent interface to configure all aspects of the Express server
 * including security settings, middleware, routing, and more.
 *
 * @example
 * ```typescript
 * const serverConfig = new ServerConfigBuilder()
 *   .withPort(3000)
 *   .withHost('localhost')
 *   .enableCors()
 *   .enableHelmet()
 *   .build();
 * ```
 */

export const BUILD_MARKER = Symbol.for('catbee.express.server.build');

export class ServerConfigBuilder {
  private config: Partial<ServerConfig> = {};

  /**
   * Validates that a port number is valid and usable.
   *
   * @private
   * @param port - The port number to validate
   * @throws {Error} If port is not an integer or is outside the valid range (1-65535)
   */
  private validatePort(port: number): void {
    if (!isPort(port)) {
      throw new Error(`Port must be a valid number between 1 and 65535, got: ${port}`);
    }
  }

  /**
   * Sets the port the server will listen on.
   *
   * @param port - The port number (1-65535)
   * @returns The builder instance for chaining
   * @throws {Error} If port is invalid
   * @default 3000 (can be overridden via PORT env variable)
   *
   * @example
   * ```typescript
   * builder.withPort(3000)
   * ```
   */
  withPort(port: number): this {
    this.validatePort(port);
    this.config.port = port;
    return this;
  }

  /**
   * Sets the hostname the server will bind to.
   *
   * @param host - The hostname (e.g., 'localhost', '0.0.0.0', '127.0.0.1')
   * @returns The builder instance for chaining
   * @default '0.0.0.0' (can be overridden via HOST env variable)
   *
   * @example
   * ```typescript
   * builder.withHost('0.0.0.0') // Listen on all interfaces
   * ```
   */
  withHost(host: string): this {
    this.config.host = host;
    return this;
  }

  /**
   * Configures Cross-Origin Resource Sharing (CORS) for the server.
   *
   * @param opts - CORS options object or boolean (true to enable with defaults, false to disable)
   * @returns The builder instance for chaining
   * @default false (CORS is disabled by default)
   *
   * @example
   * ```typescript
   * // Enable CORS with default options
   * builder.withCors(true)
   *
   * // Configure CORS with specific options
   * builder.withCors({
   *   origin: ['https://example.com'],
   *   methods: ['GET', 'POST']
   * })
   * ```
   */
  withCors(opts: ServerConfig['cors']): this {
    this.config.cors = opts;
    return this;
  }

  /**
   * Enables CORS with default settings
   *
   * @returns The builder instance for chaining
   */
  enableCors(): this {
    return this.withCors(true);
  }

  /**
   * Disables CORS
   *
   * @returns The builder instance for chaining
   */
  disableCors(): this {
    return this.withCors(false);
  }

  /**
   * Configures the Helmet middleware for setting HTTP security headers.
   *
   * @param opts - Helmet options object or boolean (true to enable with defaults, false to disable)
   * @returns The builder instance for chaining
   * @default false (Helmet is disabled by default)
   *
   * @example
   * ```typescript
   * // Enable Helmet with default settings
   * builder.withHelmet(true)
   *
   * // Configure Helmet with specific options
   * builder.withHelmet({
   *   contentSecurityPolicy: false,
   *   xssFilter: true
   * })
   * ```
   */
  withHelmet(opts: ServerConfig['helmet']): this {
    this.config.helmet = opts;
    return this;
  }

  /**
   * Enables Helmet with default settings
   *
   * @returns The builder instance for chaining
   */
  enableHelmet(): this {
    return this.withHelmet(true);
  }

  /**
   * Disables Helmet
   *
   * @returns The builder instance for chaining
   */
  disableHelmet(): this {
    return this.withHelmet(false);
  }

  /**
   * Configures response compression middleware.
   *
   * @param opts - Compression options object or boolean (true to enable with defaults, false to disable)
   * @returns The builder instance for chaining
   * @default false (Compression is disabled by default)
   *
   * @example
   * ```typescript
   * // Enable compression with default settings
   * builder.withCompression(true)
   *
   * // Configure compression with specific options
   * builder.withCompression({
   *   level: 6,
   *   threshold: 1024
   * })
   * ```
   */
  withCompression(opts: ServerConfig['compression']): this {
    this.config.compression = opts;
    return this;
  }

  /**
   * Enables compression with default settings
   *
   * @returns The builder instance for chaining
   */
  enableCompression(): this {
    return this.withCompression(true);
  }

  /**
   * Disables compression
   *
   * @returns The builder instance for chaining
   */
  disableCompression(): this {
    return this.withCompression(false);
  }

  /**
   * Configures rate limiting to protect against brute-force attacks.
   *
   * @param opts - Rate limit configuration options
   * @returns The builder instance for chaining
   * @default { enable: false, windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests', standardHeaders: true, legacyHeaders: false }
   *
   * @example
   * ```typescript
   * builder.withRateLimit({
   *   enable: true,
   *   windowMs: 15 * 60 * 1000, // 15 minutes
   *   max: 100 // limit each IP to 100 requests per windowMs
   * })
   * ```
   */
  withRateLimit(opts: Partial<ServerConfig['rateLimit']>): this {
    this.mergeConfig('rateLimit', opts as NonNullable<ServerConfig['rateLimit']>);
    return this;
  }

  /**
   * Enables rate limiting with default or custom settings
   *
   * @param opts - Optional rate limit configuration (max requests, window, etc.)
   * @returns The builder instance for chaining
   */
  enableRateLimit(opts: Omit<Partial<NonNullable<ServerConfig['rateLimit']>>, 'enable'> = {}): this {
    return this.setEnabled('rateLimit', true, opts);
  }

  /**
   * Disables rate limiting
   *
   * @returns The builder instance for chaining
   */
  disableRateLimit(): this {
    return this.setEnabled('rateLimit', false);
  }

  /**
   * Configures HTTP request logging middleware.
   *
   * @param opts - Request logging configuration options
   * @returns The builder instance for chaining
   * @default { enable: true in dev/false in prod, ignorePaths: ['/healthz', '/favicon.ico', '/metrics', '/docs', '/.well-known'], skipNotFoundRoutes: false }
   *
   * @example
   * ```typescript
   * builder.withRequestLogging({
   *   enable: true,
   *   ignorePaths: ['/health', '/metrics'],
   *   skipNotFoundRoutes: true
   * })
   * ```
   */
  withRequestLogging(opts: Partial<NonNullable<ServerConfig['requestLogging']>>): this {
    this.mergeConfig('requestLogging', opts as NonNullable<ServerConfig['requestLogging']>);
    return this;
  }

  /**
   * Enables request logging with default or custom settings
   *
   * @param opts - Optional request logging configuration
   * @returns The builder instance for chaining
   */
  enableRequestLogging(opts: Omit<Partial<NonNullable<ServerConfig['requestLogging']>>, 'enable'> = {}): this {
    return this.setEnabled('requestLogging', true, opts);
  }

  /**
   * Disables request logging
   *
   * @returns The builder instance for chaining
   */
  disableRequestLogging(): this {
    return this.setEnabled('requestLogging', false);
  }

  /**
   * Configures server metrics collection and endpoints.
   *
   * @param opts - Metrics configuration options
   * @returns The builder instance for chaining
   * @default { enable: false, path: '/metrics', withGlobalPrefix: false }
   *
   * @example
   * ```typescript
   * builder.withMetrics({
   *   enable: true,
   *   path: '/metrics'
   * })
   * ```
   */
  withMetrics(opts: Partial<NonNullable<ServerConfig['metrics']>>): this {
    this.mergeConfig('metrics', opts as NonNullable<ServerConfig['metrics']>);
    return this;
  }

  /**
   * Enables Prometheus metrics collection and endpoint
   *
   * @param opts - Optional metrics configuration
   * @returns The builder instance for chaining
   */
  enableMetrics(opts: Omit<Partial<NonNullable<ServerConfig['metrics']>>, 'enable'> = {}): this {
    return this.setEnabled('metrics', true, opts);
  }

  /**
   * Disables Prometheus metrics
   *
   * @returns The builder instance for chaining
   */
  disableMetrics(): this {
    return this.setEnabled('metrics', false);
  }

  /**
   * Configures server health check endpoint.
   *
   * @param opts - Health check configuration options
   * @returns The builder instance for chaining
   * @default { path: '/healthz', detailed: true, withGlobalPrefix: false }
   *
   * @example
   * ```typescript
   * builder.withHealthCheck({
   *   path: '/health',
   *   detailed: true
   * })
   * ```
   */
  withHealthCheck(opts: Partial<NonNullable<ServerConfig['healthCheck']>>): this {
    this.mergeConfig('healthCheck', opts as NonNullable<ServerConfig['healthCheck']>);
    return this;
  }

  /**
   * Configures OpenAPI/Swagger documentation for the API.
   *
   * @param opts - OpenAPI configuration options
   * @returns The builder instance for chaining
   * @default { enable: false, mountPath: '/docs', verbose: false, withGlobalPrefix: false }
   *
   * @example
   * ```typescript
   * builder.withOpenApi({
   *   enable: true,
   *   path: '/api-docs',
   *   filePath: './openapi.yaml'
   * })
   * ```
   */
  withOpenApi(opts: Partial<NonNullable<ServerConfig['openApi']>>): this {
    this.mergeConfig('openApi', opts as NonNullable<ServerConfig['openApi']>);
    return this;
  }

  /**
   * Enables OpenAPI documentation with required file path
   *
   * @param filePath - Path to OpenAPI specification file (required)
   * @param opts - Optional OpenAPI configuration
   * @returns The builder instance for chaining
   */
  enableOpenApi(
    filePath: string,
    opts: Omit<Partial<NonNullable<ServerConfig['openApi']>>, 'enable' | 'filePath'> = {}
  ): this {
    this.setEnabled('openApi', true, { filePath, ...opts });
    return this;
  }

  /**
   * Disables OpenAPI documentation
   *
   * @returns The builder instance for chaining
   */
  disableOpenApi(): this {
    return this.setEnabled('openApi', false);
  }

  /**
   * Configures the server as a microservice with versioning.
   *
   * @param opts - Microservice configuration options including app name and service version
   * @returns The builder instance for chaining
   * @default { isMicroservice: false, appName: 'express_app' }
   *
   * @example
   * ```typescript
   * builder.withMicroService({
   *   appName: 'user-service',
   *   serviceVersion: {
   *     enable: true,
   *     version: '1.2.3'
   *   }
   * })
   * ```
   */
  withMicroService(opts: {
    appName: NonNullable<ServerConfig['appName']>;
    serviceVersion: Partial<NonNullable<ServerConfig['serviceVersion']>>;
  }): this {
    this.config.isMicroservice = true;
    this.config.appName = opts.appName;

    this.mergeConfig('serviceVersion', opts.serviceVersion as NonNullable<ServerConfig['serviceVersion']>);
    return this;
  }

  /**
   * Configures the trust proxy settings to determine if X-Forwarded-* headers should be trusted.
   *
   * @param opts - Trust proxy configuration options
   * @returns The builder instance for chaining
   * @default false
   *
   * @example
   * ```typescript
   * // Trust proxy headers (useful when behind a load balancer)
   * builder.withTrustProxy(true)
   * ```
   */
  withTrustProxy(opts: NonNullable<ServerConfig['trustProxy']>): this {
    this.config.trustProxy = opts;
    return this;
  }

  /**
   * Configures the request ID middleware for tracing requests across services.
   *
   * @param opts - Request ID configuration options
   * @returns The builder instance for chaining
   * @default { headerName: 'x-request-id', exposeHeader: true }
   *
   * @example
   * ```typescript
   * builder.withRequestId({
   *   headerName: 'X-Request-Id',
   *   generator: () => crypto.randomUUID()
   * })
   * ```
   */
  withRequestId(opts: Partial<NonNullable<ServerConfig['requestId']>>): this {
    this.mergeConfig('requestId', opts as NonNullable<ServerConfig['requestId']>);
    return this;
  }

  /**
   * Configures the response time middleware for measuring request processing times.
   *
   * @param opts - Response time configuration options
   * @returns The builder instance for chaining
   * @default { enable: false, addHeader: true, logOnComplete: false }
   *
   * @example
   * ```typescript
   * builder.withResponseTime({
   *   enable: true,
   *   addHeader: true,
   *   logOnComplete: true
   * })
   * ```
   */
  withResponseTime(opts: Partial<NonNullable<ServerConfig['responseTime']>>): this {
    this.mergeConfig('responseTime', opts as NonNullable<ServerConfig['responseTime']>);
    return this;
  }

  /**
   * Enables response time tracking with default or custom settings
   *
   * @param opts - Optional response time configuration
   * @returns The builder instance for chaining
   */
  enableResponseTime(opts: Omit<Partial<NonNullable<ServerConfig['responseTime']>>, 'enable'> = {}): this {
    this.setEnabled('responseTime', true, opts);
    return this;
  }

  /**
   * Disables response time tracking
   *
   * @returns The builder instance for chaining
   */
  disableResponseTime(): this {
    return this.setEnabled('responseTime', false);
  }

  /**
   * Configures the body parser middleware options for parsing request bodies.
   *
   * @param opts - Body parser configuration options
   * @returns The builder instance for chaining
   * @default { json: { limit: '1mb' }, urlencoded: { extended: true, limit: '1mb' } }
   *
   * @example
   * ```typescript
   * builder.withBodyParser({
   *   json: {
   *     limit: '1mb'
   *   },
   *   urlencoded: {
   *     extended: true,
   *     limit: '1mb'
   *   }
   * })
   * ```
   */
  withBodyParser(opts: NonNullable<ServerConfig['bodyParser']>): this {
    this.config.bodyParser = deepObjMerge({}, this.config.bodyParser ?? {}, opts);
    return this;
  }

  /**
   * Configures cookie parsing middleware.
   *
   * @param opts - Cookie parser options or boolean (true to enable with defaults, false to disable)
   * @returns The builder instance for chaining
   * @default false
   *
   * @example
   * ```typescript
   * // Enable cookie parsing with default options
   * builder.withCookies(true)
   *
   * // Enable cookie parsing with specific options
   * builder.withCookies({
   *   secret: 'your-secret-key',
   *   secure: true
   * })
   * ```
   */
  withCookies(opts: ServerConfig['cookieParser']): this {
    this.config.cookieParser = opts;
    return this;
  }

  /**
   * Adds a static folder to serve files from.
   *
   * @param folder - Static folder configuration
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withStaticFolder({
   *   path: '/assets',
   *   directory: './public',
   *   options: { maxAge: '1d' }
   * })
   * ```
   */
  withStaticFolder(folder: NonNullable<ServerConfig['staticFolders']>[number]): this {
    if (!folder.path) throw new Error('Static folder requires a path');
    const folders = [...(this.config.staticFolders ?? []), folder];
    this.config.staticFolders = Array.from(new Map(folders.map(f => [f.path, f])).values());
    return this;
  }

  /**
   * Sets global headers to be included in all responses.
   *
   * @param headers - Object containing header name/value pairs or functions that return values
   * @returns The builder instance for chaining
   * @default {}
   *
   * @example
   * ```typescript
   * builder.withGlobalHeaders({
   *   'X-Powered-By': 'Catbee',
   *   'Server-Time': () => new Date().toISOString()
   * })
   * ```
   */
  withGlobalHeaders(headers: NonNullable<ServerConfig['globalHeaders']>): this {
    this.mergeConfig('globalHeaders', headers);
    return this;
  }

  /**
   * Sets a global prefix for all routes.
   *
   * @param prefix - The prefix to prepend to all routes (e.g., '/api/v1')
   * @returns The builder instance for chaining
   * @default '/'
   *
   * @example
   * ```typescript
   * builder.withGlobalPrefix('/api/v1')
   * ```
   */
  withGlobalPrefix(prefix: string): this {
    this.config.globalPrefix = prefix;
    return this;
  }

  /**
   * Applies custom configuration overrides directly.
   *
   * @param overrides - Custom configuration options to merge
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withCustom({
   *   port: 8080,
   *   customMiddleware: myMiddlewareFunction
   * })
   * ```
   */
  withCustom(overrides: Partial<ServerConfig>): this {
    this.config = deepObjMerge({}, this.config, overrides);
    return this;
  }

  /**
   * Configures HTTPS server options.
   *
   * @param opts - HTTPS configuration (key, cert, ca, passphrase, etc.)
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withHttps({
   *   key: './localhost-key.pem',
   *   cert: './localhost-cert.pem'
   * })
   * ```
   */
  withHttps(opts: NonNullable<ServerConfig['https']>): this {
    this.config.https = opts;
    return this;
  }

  /**
   * Builds and returns the final server configuration.
   *
   * This method merges the user-specified configuration with default values,
   * ensures all sections with 'enable' flags are properly structured, and
   * produces the final configuration to be used by the server.
   *
   * @returns The complete ServerConfig object
   *
   * @example
   * ```typescript
   * const config = new ServerConfigBuilder()
   *   .withPort(3000)
   *   .withHost('localhost')
   *   .withCors(true)
   *   .build();
   * ```
   */
  build(): Readonly<ServerConfig> {
    const config = deepObjMerge({}, defaultServerConfig, this.config) as ServerConfig;

    // Common validation
    if (config.openApi?.enable && !config.openApi.filePath) {
      throw new Error('OpenAPI is enabled but no filePath is specified');
    }

    return Object.freeze({
      ...config,
      [BUILD_MARKER]: true
    });
  }

  private mergeConfig<K extends keyof ServerConfig>(key: K, value: Partial<NonNullable<ServerConfig[K]>>): void {
    const current =
      typeof this.config[key] === 'object' && this.config[key] !== null
        ? (this.config[key] as NonNullable<ServerConfig[K]>)
        : {};
    this.config[key] = deepObjMerge({}, current, value) as NonNullable<ServerConfig[K]>;
  }

  private setEnabled<K extends keyof ServerConfig>(
    key: K,
    enable: boolean,
    overrides: Partial<NonNullable<ServerConfig[K]>> = {}
  ): this {
    this.mergeConfig(key, { ...overrides, enable });
    return this;
  }
}

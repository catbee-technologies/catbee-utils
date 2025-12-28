import type { Express, json, NextFunction, urlencoded, Request, Response } from 'express';
import type http from 'node:http';
import type { ExpressServer } from '@catbee/utils/server';
import type { HelmetOptions } from 'helmet';
import type { CompressionOptions } from 'compression';
import type { CookieParseOptions } from 'cookie-parser';
import type { CorsOptions } from 'cors';
import type { ToggleConfig } from './common';

/**
 * Server configuration for Catbee HTTP/Express server.
 * Designed with secure and high-performance defaults for production use.
 * All features remain fully overridable by consumers.
 */
export interface CatbeeServerConfig {
  /** Server port
   *  - **default**: `3000`
   *  - **env**: `SERVER_PORT` || `PORT`
   */
  port: number;

  /** Host address to bind the server
   *  - **default**: `'0.0.0.0'`
   *  - **env**: `SERVER_HOST` || `HOST`
   */
  host?: string;

  /** CORS configuration toggle or options
   *  - **default**: `false`
   *  - **env**: `SERVER_CORS_ENABLE`
   *  - `true` -> enable with default settings
   *  - `CorsOptions` -> enable with custom settings
   *
   *  **example**:
   *  ```ts
   *  cors: {
   *    origin: 'https://example.com',
   *    methods: ['GET', 'POST'],
   *    credentials: true
   *  }
   *  ```
   */
  cors?: ToggleConfig<CorsOptions>;

  /** Helmet security headers toggle or options
   *  - **default**: `false`
   *  - **env**: `SERVER_HELMET_ENABLE`
   *  - `true` -> enable with default settings
   *  - `HelmetOptions` -> enable with custom settings
   *
   *  **example**:
   *  ```ts
   *  helmet: {
   *    contentSecurityPolicy: {
   *      directives: {
   *        defaultSrc: ["'self'"],
   *        scriptSrc: ["'self'", 'trusted.com']
   *      }
   *    }
   *  }
   *  ```
   */
  helmet?: ToggleConfig<HelmetOptions>;

  /** HTTP response compression toggle or options
   *  - **default**: `false`
   *  - **env**: `SERVER_COMPRESSION_ENABLE`
   *  - `true` -> enable with default settings
   *  - `CompressionOptions` -> enable with custom settings
   *
   *  **example**:
   *  ```ts
   *  compression: { level: 6 }
   *  ```
   */
  compression?: ToggleConfig<CompressionOptions>;

  /** Body parser configuration for incoming requests
   *  - **default**: `{ json: { limit: '1mb' }, urlencoded: { extended: true, limit: '1mb' } }`
   *  - **env**:
   *    - `SERVER_BODY_PARSER_JSON_LIMIT`
   *    - `SERVER_BODY_PARSER_URLENCODED_LIMIT`
   */
  bodyParser?: {
    /** JSON body parser options
     *  - **default**: `{ limit: '1mb' }`
     */
    json?: Parameters<typeof json>[0];

    /** URL-encoded body parser options
     *  - **default**: `{ extended: true, limit: '1mb' }`
     */
    urlencoded?: Parameters<typeof urlencoded>[0];
  };

  /** Cookie parser toggle or options
   *  - **default**: `false`
   *  - **env**: `SERVER_COOKIE_PARSER_ENABLE`
   *  - `true` -> enable with default decode
   *  - `CookieParseOptions` -> enable with custom settings
   *
   *  **example**:
   *  ```ts
   *  cookieParser: {
   *    decode: (val) => decodeURIComponent(val)
   *  }
   *  ```
   */
  cookieParser?: ToggleConfig<CookieParseOptions>;

  /** Trust proxy configuration
   *  - **default**: `false`
   *  - **env**: `SERVER_TRUST_PROXY_ENABLE`
   *  - `true` -> trust first proxy
   *  - `number` -> trust N proxies
   *  - `string | string[]` -> trust specific proxy IP(s)
   */
  trustProxy?: boolean | number | string | string[];

  /** Static folder serving configuration
   *  - **path**: file system path to serve
   *  - **route**: URL route prefix (default: "/")
   *  - **maxAge**: cache max age (default: 0)
   *  - **etag**: enable ETag headers (default: true)
   *  - **immutable**: enable immutable caching (default: false)
   *  - **lastModified**: enable last-modified caching (default: true)
   *  - **cacheControl**: enable Cache-Control headers (default: true)
   */
  staticFolders?: Array<{
    /** URL mount path prefix
     *  - **default**: `/`
     */
    path?: string;

    /** Local directory path to serve (required) */
    directory: string;

    /** Cache-Control max-age value
     *  - **default**: `0`
     */
    maxAge?: string;

    /** Enable ETag header
     *  - **default**: `true`
     */
    etag?: boolean;

    /** Immutable caching
     *  - **default**: `false`
     */
    immutable?: boolean;

    /** Last-Modified header support
     *  - **default**: `true`
     */
    lastModified?: boolean;

    /** Include Cache-Control header
     *  - **default**: `true`
     */
    cacheControl?: boolean;
  }>;

  /** Enable microservice mode
   *  - **default**: `false`
   *  - **env**: `SERVER_IS_MICROSERVICE`
   */
  isMicroservice?: boolean;

  /** Application/service name used for logs, headers, and metrics
   *  - **default**: `'catbee_server'`
   *  - **env**: `SERVER_APP_NAME` or `npm_package_name`
   */
  appName?: string;

  /** Global headers applied to all responses
   *  - **default**: {}
   *  - **env**: `SERVER_GLOBAL_HEADERS` (JSON)
   */
  globalHeaders?: Record<string, string | (() => string)>;

  /** Rate limiting settings
   *  - **enable**: `false` - **env**: `SERVER_RATE_LIMIT_ENABLE`
   *  - **windowMs**: `900000` (15 minutes) - **env**: `SERVER_RATE_LIMIT_WINDOW_MS`
   *  - **max**: `100` - **env**: `SERVER_RATE_LIMIT_MAX`
   *  - **message**: `'Too many requests'` - **env**: `SERVER_RATE_LIMIT_MESSAGE`
   *  - **standardHeaders**: `true` - **env**: `SERVER_RATE_LIMIT_STANDARD_HEADERS`
   *  - **legacyHeaders**: `false` - **env**: `SERVER_RATE_LIMIT_LEGACY_HEADERS`
   */
  rateLimit?: {
    /** Enable rate-limiting
     *  - **default**: `false`
     *  - **env**: `SERVER_RATE_LIMIT_ENABLE`
     */
    enable: boolean;

    /** Window duration in ms
     *  - **default**: `900000` (15 minutes)
     *  - **env**: `SERVER_RATE_LIMIT_WINDOW_MS`
     */
    windowMs?: number;

    /** Max requests per window
     *  - **default**: `100`
     *  - **env**: `SERVER_RATE_LIMIT_MAX`
     */
    max?: number;

    /** Custom message when limit is reached
     *  - **default**: `'Too many requests'`
     *  - **env**: `SERVER_RATE_LIMIT_MESSAGE`
     */
    message?: string;

    /** Include standard rate-limit headers
     *  - **default**: `true`
     *  - **env**: `SERVER_RATE_LIMIT_STANDARD_HEADERS`
     */
    standardHeaders?: boolean;

    /** Include legacy rate-limit headers
     *  - **default**: `false`
     *  - **env**: `SERVER_RATE_LIMIT_LEGACY_HEADERS`
     */
    legacyHeaders?: boolean;
  };

  /** Request logging configuration
   *  - **enable**: `true` in `development`, `false` in `production` - **env**: `SERVER_REQUEST_LOGGING_ENABLE`
   *  - **ignorePaths**: skips `/healthz`, `/favicon.ico`, `/metrics`, `/docs`, `/.well-known`
   *  - **skipNotFoundRoutes**: `false` - **env**: `SERVER_REQUEST_LOGGING_SKIP_NOT_FOUND_ROUTES`
   */
  requestLogging?: {
    /** Enable request logging
     *  - **default**: `true` in `development`, `false` in `production`
     *  - **env**: `SERVER_REQUEST_LOGGING_ENABLE`
     */
    enable: boolean;

    /** Ignore specific paths or apply custom logic to skip logging */
    ignorePaths?: string[] | ((req: Request, res: Response) => boolean);

    /** Skip 404 routes from logs
     *  - **default**: `false`
     *  - **env**: `SERVER_REQUEST_LOGGING_SKIP_NOT_FOUND_ROUTES`
     */
    skipNotFoundRoutes?: boolean;
  };

  /** Health-check configuration
   *  - **path**: `/healthz`
   *  - **detailed**: `true`
   *  - **withGlobalPrefix**: `false`
   */
  healthCheck?: {
    /** Health-check endpoint path
     *  - **default**: `'/healthz'`
     *  - **env**: `SERVER_HEALTH_CHECK_PATH`
     */
    path?: string;
    /** Include detailed check results in the response
     *  - **default**: `true`
     *  - **env**: `SERVER_HEALTH_CHECK_DETAILED_OUTPUT`
     */
    detailed?: boolean;

    /** Apply global route prefix
     *  - **default**: `false`
     *  - **env**: `SERVER_HEALTH_CHECK_WITH_GLOBAL_PREFIX`
     */
    withGlobalPrefix?: boolean;

    /** Custom health checks */
    checks?: Array<{
      /** Name of the health check */
      name: string;
      /** Check function that returns boolean or Promise<boolean> */
      check: () => Promise<boolean> | boolean;
    }>;
  };

  /** Request timeout in ms
   *  - **default**: `30000` (30 seconds)
   *  - **env**: `SERVER_REQUEST_TIMEOUT_MS`
   */
  requestTimeout?: number;

  /** Response timing configuration
   *  - **enable**: `false`
   *  - **addHeader**: `true`
   *  - **logOnComplete**: `false`
   */
  responseTime?: {
    /** Enable timing
     * - **default**: `false`
     * - **env**: `SERVER_RESPONSE_TIME_ENABLE`
     */
    enable: boolean;
    /** Add X-Response-Time header
     * - **default**: `true`
     * - **env**: `SERVER_RESPONSE_TIME_ADD_HEADER`
     */
    addHeader?: boolean;
    /** Log completion time
     * - **default**: `false`
     * - **env**: `SERVER_RESPONSE_TIME_LOG_ON_COMPLETE`
     */
    logOnComplete?: boolean;
  };

  /** Request ID tracking configuration
   *  - **enable**: `false` - **env**: `SERVER_REQUEST_ID_ENABLE`
   *  - **headerName**: `'x-request-id'` - **env**: `SERVER_REQUEST_ID_HEADER_NAME`
   *  - **exposeHeader**: `true` - **env**: `SERVER_REQUEST_ID_EXPOSE_HEADER`
   *  - **generator**: `uuid()`
   */
  requestId?: {
    /** Header name for request tracing
     *  - **default**: `'x-request-id'`
     *  - **env**: `SERVER_REQUEST_ID_HEADER_NAME`
     */
    headerName?: string;

    /** Expose request ID in response headers
     *  - **default**: `true`
     *  - **env**: `SERVER_REQUEST_ID_EXPOSE_HEADER`
     */
    exposeHeader?: boolean;

    /** Function to generate request ID
     *  - **default**: `uuid()`
     */
    generator?: () => string;
  };

  /** Global route prefix for all endpoints
   *  - **default**: `/`
   */
  globalPrefix?: string;

  /** OpenAPI/Swagger documentation config
   *  - **enable**: `false` - **env**: `SERVER_OPENAPI_ENABLE`
   *  - **mountPath**: `'/docs'` - **env**: `SERVER_OPENAPI_MOUNT_PATH`
   *  - **verbose**: `false` - **env**: `SERVER_OPENAPI_VERBOSE`
   *  - **withGlobalPrefix**: `false` - **env**: `SERVER_OPENAPI_WITH_GLOBAL_PREFIX`
   */
  openApi?: {
    /** Enable OpenAPI spec serving
     *  - **default**: `false`
     *  - **env**: `SERVER_OPENAPI_ENABLE`
     */
    enable: boolean;

    /** Mount path for API docs UI
     *  - **default**: `'/docs'`
     *  - **env**: `SERVER_OPENAPI_MOUNT_PATH`
     */
    mountPath?: string;

    /** Local OpenAPI spec file path (required if enabled)
     *  - **env**: `SERVER_OPENAPI_FILE_PATH`
     */
    filePath?: string;

    /** Verbose OpenAPI logs
     *  - **default**: `false`
     *  - **env**: `SERVER_OPENAPI_VERBOSE`
     */
    verbose?: boolean;

    /** Apply global prefix to docs route
     *  - **default**: `false`
     *  - **env**: `SERVER_OPENAPI_WITH_GLOBAL_PREFIX`
     */
    withGlobalPrefix?: boolean;
  };

  /** Prometheus metrics config
   * - **enable**: `false` - **env**: `SERVER_METRICS_ENABLE`
   * - **path**: `'/metrics'` - **env**: `SERVER_METRICS_PATH`
   * - **withGlobalPrefix**: `false` - **env**: `SERVER_METRICS_WITH_GLOBAL_PREFIX`
   */
  metrics?: {
    /** Enable metrics endpoint
     *  - **default**: `false`
     *  - **env**: `SERVER_METRICS_ENABLE`
     */
    enable: boolean;

    /** Metrics endpoint path
     *  - **default**: `'/metrics'`
     *  - **env**: `SERVER_METRICS_PATH`
     */
    path?: string;

    /** Apply global prefix
     *  - **default**: `false`
     *  - **env**: `SERVER_METRICS_WITH_GLOBAL_PREFIX`
     */
    withGlobalPrefix?: boolean;
  };

  /** Service version header config
   * - **enable**: `false` - **env**: `SERVER_SERVICE_VERSION_ENABLE`
   * - **headerName**: `'x-service-version'` - **env**: `SERVER_SERVICE_VERSION_HEADER_NAME`
   * - **version**: `'0.0.0'` - **env**: `SERVER_SERVICE_VERSION`
   */
  serviceVersion?: {
    /** Enable version header
     *  - **default**: `false`
     */
    enable: boolean;

    /** Header name
     *  - **default**: `'x-service-version'`
     *  - **env**: `SERVER_SERVICE_VERSION_HEADER_NAME`
     */
    headerName?: string;

    /** Version value
     *  - **default**: `'0.0.0'`
     *  - **env**: `SERVER_SERVICE_VERSION`
     */
    version?: string | (() => string);
  };

  /**
   * HTTPS configuration (if provided, server will use HTTPS)
   * Requires 'key' and 'cert' at minimum.
   * @command - to generate self-signed certificates
   * ```bash
   * choco install mkcert
   * mkcert -key-file localhost-key.pem -cert-file localhost-cert.pem localhost 127.0.0.1 ::1
   * ```
   */
  https?: {
    /** SSL private key file path (PEM) */
    key: string;
    /** SSL certificate file path (PEM) */
    cert: string;
    /** Optional CA bundle path (PEM) */
    ca?: string;
    /** Optional private key passphrase */
    passphrase?: string;
    /** Additional Node.js `https.ServerOptions` */
    [key: string]: any;
  };
}

/**
 * Lifecycle hooks for Catbee server runtime.
 * Allows injecting custom behavior without modifying Catbee core internals.
 */
export interface CatbeeServerHooks {
  /** Called before middleware & routes initialize */
  beforeInit?: (server: ExpressServer) => Promise<void> | void;
  /** Called after middleware & routes initialize */
  afterInit?: (server: ExpressServer) => Promise<void> | void;
  /** Called before server starts listening */
  beforeStart?: (app: Express) => Promise<void> | void;
  /** Called after server is ready */
  afterStart?: (server: http.Server) => Promise<void> | void;
  /** Called before graceful shutdown */
  beforeStop?: (server: http.Server) => Promise<void> | void;
  /** Called after server stops */
  afterStop?: () => Promise<void> | void;
  /** Custom error handler (overrides Catbee default if provided) */
  onError?: (error: Error, req: Request, res: Response, next: NextFunction) => void;
  /** Called when a request is received (middleware-style injection) */
  onRequest?: (req: Request, res: Response, next: NextFunction) => void;
  /** Called before response is sent */
  onResponse?: (req: Request, res: Response, next: NextFunction) => void;
}

/* Additional server configuration options not covered in CatbeeServerConfig */
export interface GlobalServerAddons {
  /**
   * Skip healthz endpoint even if health checks are configured
   *  - **default**: `false`
   *  - **env**: `SERVER_SKIP_HEALTHZ`
   *
   * @additionalInfo
   * Set to true to return `200 OK` for `/healthz` without checks
   * Useful in environments where a simple liveness probe is needed
   * without performing actual health checks
   * Example: Kubernetes liveness probe
   * Note: This does not disable the health check functionality itself
   *       Health checks can still be performed programmatically
   *       or via other endpoints if needed
   */
  skipHealthz: boolean;
}

/** Combined global server configuration type */
export type CatbeeGlobalServerConfig = CatbeeServerConfig & GlobalServerAddons;

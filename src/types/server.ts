import type { Express, json, NextFunction, urlencoded, Request, Response } from 'express';
import type { ExpressServer } from '@catbee/utils/server';
import type { HelmetOptions } from 'helmet';
import type { CompressionOptions } from 'compression';
import type { CookieParseOptions } from 'cookie-parser';
import type { CorsOptions } from 'cors';
import type http from 'http';
import type { ToggleConfig } from './common';

/**
 * Server configuration interface with smart defaults and full customization.
 * All options are designed with security and performance best practices.
 * Most options can be overridden via environment variables.
 */
export interface ServerConfig {
  /** Port the server should listen on (default: 3000, env: PORT)
   *  - default: 3000
   */
  port: number;
  /** Optional host address for binding (default: '0.0.0.0', env: HOST)
   *  - default: '0.0.0.0'
   */
  host?: string;

  /** CORS configuration (default: false disables CORS, or provide options object)
   *  - default: false
   */
  cors?: ToggleConfig<CorsOptions>;

  /** Enable Helmet security headers (default: false disables Helmet, or provide options object)
   *  - default: false
   */
  helmet?: ToggleConfig<HelmetOptions>;

  /** Enable gzip/deflate compression (default: false disables compression, or provide options object)
   *  - default: false
   */
  compression?: ToggleConfig<CompressionOptions>;

  /** Request body parsing with size limits
   *  - json: { limit: '1mb' }
   *  - urlencoded: { extended: true, limit: '1mb' }
   */
  bodyParser?: {
    /** JSON parser (default: { limit: '1mb' }) */
    json?: Parameters<typeof json>[0];
    /** URL-encoded parser (default: { extended: true, limit: '1mb' }) */
    urlencoded?: Parameters<typeof urlencoded>[0];
  };

  /** Enable cookie parsing with options (default: false)
   *  - default: false
   */
  cookieParser?: ToggleConfig<CookieParseOptions>;

  /** Trust proxy headers (default: false)
   *  - default: false
   */
  trustProxy?: boolean;

  /** Static file serving configuration for assets, uploads, etc.
   *  - path: file system path to serve
   *  - route: URL route prefix (default: "/")
   *  - maxAge: cache max age (default: 0)
   *  - etag: enable ETag headers (default: true)
   *  - immutable: enable immutable caching (default: false)
   *  - lastModified: enable last-modified caching (default: true)
   *  - cacheControl: enable Cache-Control headers (default: true)
   */
  staticFolders?: Array<{
    /** URL route prefix (default: "/") */
    path?: string;
    /** File system path to serve */
    directory: string;
    /** Cache-Control: max-age=<duration> (default: 0) */
    maxAge?: string;
    /** Enable ETag headers (default: true) */
    etag?: boolean;
    /** Enable immutable caching (default: false) */
    immutable?: boolean;
    /** Enable last-modified caching (default: true) */
    lastModified?: boolean;
    /** Enable Cache-Control headers (default: true) */
    cacheControl?: boolean;
  }>;

  /** Enable microservice mode (default: false)
   *  - default: false
   */
  isMicroservice?: boolean;

  /** Service name for headers/metrics (default: 'express_app', env: APP_NAME)
   *  - default: 'express_app'
   */
  appName?: string;

  /** Global response headers (default: {})
   *  - default: {}
   */
  globalHeaders?: Record<string, string | (() => string)>;

  /** Rate limiting settings
   *  - enable: false
   *  - windowMs: 15 * 60 * 1000
   *  - max: 100
   *  - message: 'Too many requests'
   *  - standardHeaders: true
   *  - legacyHeaders: false
   */
  rateLimit?: {
    /** Enable rate limiting (default: false) */
    enable: boolean;
    /** Time window in ms (default: 900000 - 15 minutes) */
    windowMs?: number;
    /** Max requests per window (default: 100) */
    max?: number;
    /** Rate limit message (default: 'Too many requests') */
    message?: string;
    /** Add standard headers (default: true) */
    standardHeaders?: boolean;
    /** Add legacy headers (default: false) */
    legacyHeaders?: boolean;
  };

  /** Request logging configuration
   *  - enable: true in dev, false in prod
   *  - ignorePaths: skips /healthz, /favicon.ico, /metrics, /docs, /.well-known
   *  - skipNotFoundRoutes: false
   */
  requestLogging?: {
    /** Enable request logging (default: true in dev, false in prod) */
    enable: boolean;
    /** Ignore paths function or string[] (default: skips /healthz, /favicon.ico, /metrics, /docs, /.well-known) */
    ignorePaths?: string[] | ((req: Request, res: Response) => boolean);
    /** Skip logging for not found routes (default: false) */
    skipNotFoundRoutes?: boolean;
  };

  /** Health check settings
   *  - path: '/healthz'
   *  - detailed: true
   *  - withGlobalPrefix: false
   */
  healthCheck?: {
    /** Health check path (default: '/healthz') */
    path?: string;
    /** Custom checks (default: []) */
    checks?: Array<{
      name: string;
      check: () => Promise<boolean> | boolean;
    }>;
    /** Show detailed checks status in response (default: true) */
    detailed?: boolean;
    /** Include in global prefix (default: false) */
    withGlobalPrefix?: boolean;
  };

  /** Request timeout in ms (default: 30000 - 30 seconds)
   *  - default: 30000
   */
  requestTimeout?: number;

  /** Response timing configuration
   *  - enable: false
   *  - addHeader: true
   *  - logOnComplete: false
   */
  responseTime?: {
    /** Enable timing (default: false) */
    enable: boolean;
    /** Add X-Response-Time header (default: true) */
    addHeader?: boolean;
    /** Log completion time (default: false) */
    logOnComplete?: boolean;
  };

  /** Request ID configuration
   *  - headerName: 'x-request-id'
   *  - exposeHeader: true
   *  - generator: uuid()
   */
  requestId?: {
    /** Header name (default: 'x-request-id') */
    headerName?: string;
    /** Add to response headers (default: true) */
    exposeHeader?: boolean;
    /** ID generator (default: uuid()) */
    generator?: () => string;
  };

  /** Global route prefix (default: '/')
   *  - default: '/'
   */
  globalPrefix?: string;

  /** OpenAPI documentation
   *  - enable: false
   *  - mountPath: '/docs'
   *  - verbose: false
   *  - withGlobalPrefix: false
   */
  openApi?: {
    /** Enable docs (default: false) */
    enable: boolean;
    /** UI path (default: '/docs') */
    mountPath?: string;
    /** Spec file path (required if enabled) */
    filePath?: string;
    /** Enable verbose logs (default: false) */
    verbose?: boolean;
    /** Include in global prefix (default: false) */
    withGlobalPrefix?: boolean;
  };

  /** Prometheus metrics
   *  - enable: false
   *  - path: '/metrics'
   *  - withGlobalPrefix: false
   */
  metrics?: {
    /** Enable metrics (default: false) */
    enable: boolean;
    /** Metrics path (default: '/metrics') */
    path?: string;
    /** Include in global prefix (default: false) */
    withGlobalPrefix?: boolean;
  };

  /** Service version header
   *  - enable: false
   *  - headerName: 'x-service-version'
   *  - version: '0.0.0'
   */
  serviceVersion?: {
    /** Enable version header (default: false) */
    enable: boolean;
    /** Header name (default: 'x-service-version') */
    headerName?: string;
    /** Version value (default: '0.0.0') */
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
    /** Path to SSL private key file (PEM) */
    key: string;
    /** Path to SSL certificate file (PEM) */
    cert: string;
    /** Optional path to CA bundle file (PEM) */
    ca?: string;
    /** Optional passphrase for the private key */
    passphrase?: string;
    /** Any other https.ServerOptions */
    [key: string]: any;
  };
}

/**
 * Server lifecycle hooks for custom behavior injection.
 * Allows extending server functionality without modifying core code.
 * All hooks can be async and support error handling.
 */
export interface ServerHooks {
  /** Called before any middleware or routes are initialized - good for early setup */
  beforeInit?: (server: ExpressServer) => Promise<void> | void;
  /** Called after middleware and routes are set up - good for final configuration */
  afterInit?: (server: ExpressServer) => Promise<void> | void;
  /** Called just before the server starts listening - good for last-minute checks */
  beforeStart?: (app: Express) => Promise<void> | void;
  /** Called after the server starts successfully - good for announcing readiness */
  afterStart?: (server: http.Server) => Promise<void> | void;
  /** Called before graceful shutdown begins - good for cleanup preparation */
  beforeStop?: (server: http.Server) => Promise<void> | void;
  /** Called after server has stopped - good for final cleanup */
  afterStop?: () => Promise<void> | void;
  /** Custom global error handler - overrides the default error handling */
  onError?: (error: Error, req: Request, res: Response, next: NextFunction) => void;
  /** Called at the start of each request - good for request preprocessing */
  onRequest?: (req: Request, res: Response, next: NextFunction) => void;
  /** Called before response is sent - good for response modification */
  onResponse?: (req: Request, res: Response, next: NextFunction) => void;
}

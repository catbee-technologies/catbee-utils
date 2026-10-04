import express from 'express';
import http from 'node:http';
import https from 'node:https';
import { Socket } from 'node:net';
import { HttpStatusCodes } from '@catbee/utils/http-status-codes';
import { createFinalErrorResponse } from '@catbee/utils/response';
import { errorHandler, requestId, responseTime, setupRequestContext, timeout } from '@catbee/utils/middleware';
import { Env } from '@catbee/utils/env';
import { getLogger } from '@catbee/utils/logger';
import { ServiceUnavailableException, NotFoundException } from '@catbee/utils/exception';
import { getCatbeeServerGlobalConfig } from '@catbee/utils/config';
import { deepObjMerge, isPlainObject } from '@catbee/utils/object';
import { fileExists, readFileSync, readFile } from '@catbee/utils/fs';
import { CatbeeServerConfig, CatbeeServerHooks } from '@catbee/utils/types';
import { isPort, isHostname } from '@catbee/utils/validation';
import { optionalRequire } from '@catbee/utils/async';
import { BUILD_MARKER } from './server.builder';
import { uuid } from '@catbee/utils/id';
import { HealthzServer } from '@catbee/utils/healthz-server';
import type { Express, Request, Response, NextFunction, Router } from 'express';
import type { CatbeeHealthzServerConfig, HealthzAddressInfo, NamedCheck } from '@catbee/utils/healthz-server';

/**
 * Generate standardized error message for missing dependencies.
 */
export const getDependencyErrorMessage = (packageName: string, context?: string) => {
  const ctxPart = context ? `for ${context}` : '';
  const spacer = ctxPart ? ` ${ctxPart}` : '';
  return `Missing required dependency${spacer}: ${packageName}. Please install it to proceed.`;
};

/**
 * Map of critical dependencies to their error messages.
 */
export const DependencyErrors = {
  express: getDependencyErrorMessage('express'),
  helmet: getDependencyErrorMessage('helmet'),
  cors: getDependencyErrorMessage('cors'),
  compression: getDependencyErrorMessage('compression'),
  'express-rate-limit': getDependencyErrorMessage('express-rate-limit'),
  'cookie-parser': getDependencyErrorMessage('cookie-parser'),
  '@scalar/express-api-reference': getDependencyErrorMessage('@scalar/express-api-reference')
};

const SUPPORTED_HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const);

/**
 * Production-ready Express server with enterprise features.
 *
 * Core Features:
 * - Security: Helmet, CORS, rate limiting, timeouts
 * - Monitoring: Request logs, health checks
 * - Performance: Compression, caching, static files
 * - Reliability: Graceful shutdown, error handling
 * - Developer UX: OpenAPI docs, debugging tools
 * - Extensibility: Hooks, middleware, custom routes
 *
 * Designed for microservices and production workloads.
 * Includes K8s readiness probes and zero-downtime support.
 */
export class ExpressServer {
  /** HTTP server instance (null when not running) */
  protected server: http.Server | https.Server | null = null;
  /** Merged configuration with defaults applied */
  protected config: CatbeeServerConfig;
  /** User-defined lifecycle hooks */
  protected hooks: CatbeeServerHooks;
  /** Global API prefix (from config) */
  protected globalPrefix: string;
  /** Primary root router mounted to the application */
  private readonly rootRouter: Router;
  /** Set of registered sub-routers to prevent duplicate mounting */
  private readonly mountedRouters = new Set<Router>();
  /** Express app instance */
  private readonly app: Express;
  /** Set of active WebSocket connections */
  private readonly connections = new Set<Socket>();
  /** Flag indicating if the server is shutting down */
  private isShuttingDown = false;
  /** Flag indicating if graceful shutdown handlers are registered */
  private gracefulShutdownRegistered = false;
  /** Map of registered signal listeners for clean teardown */
  private readonly signalListeners = new Map<NodeJS.Signals, () => Promise<void>>();
  /** Running address info for the Healthz probe server */
  private healthzAddress?: HealthzAddressInfo | null;
  /** Named checks queued for Healthz liveness probe */
  private readonly healthzChecks: NamedCheck[] = [];
  /** Named checks queued for Healthz readiness probe */
  private readonly healthzReadinessChecks: NamedCheck[] = [];

  /** Promise that resolves when initialization (middleware + routes) is complete */
  private readonly initPromise: Promise<void>;
  /** In-flight start promise to protect against concurrent start() calls */
  private startPromise?: Promise<http.Server | https.Server>;

  /**
   * Initializes server with intelligent defaults and security best practices.
   * All settings can be customized via config and hooks.
   *
   * Default Security:
   * - Secure headers (Helmet)
   * - Rate limiting
   * - Request timeouts
   * - Body size limits
   * - CORS protection
   *
   * Default Monitoring:
   * - Request/Response logging
   * - Health checks
   * - Request tracing
   */
  constructor(config: Partial<CatbeeServerConfig>, hooks: CatbeeServerHooks = {}) {
    if (this.hasBuildMarker(config)) {
      this.config = deepObjMerge({}, config) as Required<CatbeeServerConfig>;
    } else {
      // Deep merge config with user overrides
      this.config = deepObjMerge({}, getCatbeeServerGlobalConfig(), config) as Required<CatbeeServerConfig>;
    }

    // Normalize host (strip brackets from IPv6 addresses for server.listen compatibility)
    if (this.config.host) {
      this.config.host = this.normalizeHost(this.config.host);
    }

    if (!isPort(this.config.port, true)) {
      const msg = `Port must be a valid number between 0 and 65535, got: ${this.config.port}`;
      getLogger().error(msg);
      throw new Error(msg);
    }

    // Normalize healthzServer toggle if boolean
    if (typeof this.config.healthzServer === 'boolean') {
      this.config.healthzServer = {
        ...HealthzServer.getDefaultConfig(),
        enable: this.config.healthzServer
      };
    }

    // Healthz probe checks
    if (this.config.healthzServer && typeof this.config.healthzServer === 'object') {
      if (this.config.healthzServer.checks) {
        this.healthzChecks.push(...this.config.healthzServer.checks);
      }
      if (this.config.healthzServer.readinessChecks) {
        this.healthzReadinessChecks.push(...this.config.healthzServer.readinessChecks);
      }
    }

    // Set global prefix (normalize to empty string or "/prefix" without trailing slash)
    this.globalPrefix = this.normalizePath(this.config.globalPrefix ?? '', false);

    this.hooks = hooks;
    this.app = express();
    this.rootRouter = express.Router();

    // Store initialization promise to prevent race conditions with start()
    this.initPromise = this.initialize();
  }

  /**
   * Execute a lifecycle hook safely with comprehensive error handling.
   * Prevents hook failures from crashing the server while logging issues.
   *
   * @param hook Name of the lifecycle hook to execute
   * @param args Arguments to pass to the hook function
   */
  private async runHook<T extends keyof CatbeeServerHooks>(hook: T, ...args: unknown[]) {
    try {
      const fn = this.hooks[hook];
      if (fn) await (fn as (...args: unknown[]) => unknown)(...args);
    } catch (err) {
      getLogger().error({ err, hook }, `Error executing ${hook as string} hook:`);
    }
  }

  /**
   * Initialize the Express server with middleware and routes.
   */
  private async initialize(): Promise<void> {
    await this.runHook('beforeInit', this);

    // Set up middleware stack (order is critical)
    await this.setupMiddleware();

    // Allow users to run custom logic before routes are registered (e.g. for adding global middleware, modifying app instance, etc.)
    await this.runHook('beforeRoutes', this.app);

    // Set up default routes and error handling
    await this.setupRoutes();

    await this.runHook('afterInit', this);
  }

  /**
   * Configure and register all middlewares in the optimal order.
   *
   * Middleware Order (CRITICAL - don't change without understanding implications):
   * 1.  Basic server configuration (trust proxy, x-powered-by)
   * 2.  Request ID generation (for tracing)
   * 3.  Request context setup (for logging correlation)
   * 4.  Timeout protection (prevents hanging requests)
   * 5.  Response time tracking (for performance monitoring)
   * 6.  Request logging (after ID/context setup)
   * 7.  Custom request hooks
   * 8.  Security middleware (rate limiting, CORS, Helmet)
   * 9.  Response compression
   * 10. Static file serving
   * 11. Request parsing (body parsing, cookies)
   * 12. API documentation (OpenAPI)
   * 13. Global headers
   * 14. Custom response hooks
   */
  protected async setupMiddleware(): Promise<void> {
    if (this.config.https) {
      await this.validateHttpsFiles();
    }

    this.setupBasicMiddleware();
    this.setupSecurityMiddleware();
    this.setupGlobalHeaders();
    this.setupTimeoutMiddleware();
    this.setupResponseTimeMiddleware();
    this.setupRateLimitingMiddleware();
    this.setupRequestLoggingMiddleware();
    this.setupCompressionMiddleware();
    this.setupStaticFilesMiddleware();
    this.setupBodyParsingMiddleware();
    this.setupCookieParsingMiddleware();
    await this.setupOpenApiMiddleware();
    this.setupResponseHook();
  }

  /**
   * Set up basic middleware (trust proxy, request ID, context).
   */
  private setupBasicMiddleware(): void {
    this.app.disable('x-powered-by');

    if (this.config.trustProxy) {
      this.app.set('trust proxy', true);
    }

    // Request ID generation - must be first for proper tracing
    this.app.use(
      requestId({
        headerName: this.config.requestId?.headerName,
        exposeHeader: this.config.requestId?.exposeHeader,
        generator: this.config.requestId?.generator || uuid
      })
    );

    // Request context setup for logging correlation
    this.app.use(
      setupRequestContext({
        headerName: this.config.requestId?.headerName,
        autoLog: false
      })
    );

    // Early shutdown-awareness middleware (lets load balancers drain connections gracefully)
    this.app.use((_req: Request, res: Response, next: NextFunction) => {
      if (this.isShuttingDown) {
        res.setHeader('Connection', 'close');
        res
          .status(HttpStatusCodes.SERVICE_UNAVAILABLE)
          .json(new ServiceUnavailableException('Server is shutting down'));
        return;
      }
      next();
    });
  }

  /**
   * Set up security middleware (Helmet, CORS).
   */
  private setupSecurityMiddleware(): void {
    // Helmet middleware should come early
    if (this.config.helmet) {
      const helmet = optionalRequire('helmet');
      if (!helmet) {
        this.throwDependencyError('helmet');
      }

      if (typeof this.config.helmet === 'object') {
        this.app.use(helmet(this.config.helmet));
      } else {
        this.app.use(helmet());
      }
    }

    // CORS middleware should be early
    if (this.config.cors) {
      const cors = optionalRequire('cors');
      if (!cors) {
        this.throwDependencyError('cors');
      }
      this.app.use(cors(this.config.cors === true ? {} : this.config.cors));
    }
  }

  /**
   * Set up global headers middleware.
   */
  private setupGlobalHeaders(): void {
    const hasCustomHeaders = Boolean(this.config.globalHeaders && Object.keys(this.config.globalHeaders).length > 0);
    const isMicroservice = Boolean(this.config.isMicroservice);
    const hasServiceVersion = Boolean(this.config.serviceVersion?.enable);

    if (!hasCustomHeaders && !isMicroservice && !hasServiceVersion) {
      return;
    }

    this.app.use((_req, res, next) => {
      if (this.config.globalHeaders) {
        for (const [key, value] of Object.entries(this.config.globalHeaders)) {
          res.setHeader(key, typeof value === 'function' ? value() : value);
        }
      }
      if (this.config.isMicroservice) {
        res.setHeader('X-Microservice', this.config.appName || 'express_app');
      }
      if (this.config.serviceVersion?.enable) {
        const version =
          typeof this.config.serviceVersion?.version === 'function'
            ? this.config.serviceVersion.version()
            : this.config.serviceVersion?.version;

        res.setHeader(this.config.serviceVersion?.headerName || 'x-service-version', version || '0.0.0');
      }
      next();
    });
  }

  /**
   * Set up request timeout middleware.
   */
  private setupTimeoutMiddleware(): void {
    if (this.config.requestTimeout) {
      this.app.use(timeout(this.config.requestTimeout));
    }
  }

  /**
   * Set up response time tracking middleware.
   */
  private setupResponseTimeMiddleware(): void {
    if (this.config.responseTime?.enable) {
      this.app.use(
        responseTime({
          addHeader: this.config.responseTime.addHeader,
          logOnComplete: this.config.responseTime.logOnComplete
        })
      );
    }
  }

  /**
   * Set up rate limiting middleware.
   */
  private setupRateLimitingMiddleware(): void {
    if (this.config.rateLimit?.enable) {
      const rateLimit = optionalRequire('express-rate-limit');
      if (!rateLimit) {
        this.throwDependencyError('express-rate-limit');
      }

      this.app.use(
        rateLimit({
          windowMs: this.config.rateLimit.windowMs ?? 15 * 60 * 1000,
          max: this.config.rateLimit.max ?? 100,
          handler: (req: Request, res: Response) => {
            const status = HttpStatusCodes.TOO_MANY_REQUESTS;
            const response = createFinalErrorResponse(
              req,
              status,
              this.config.rateLimit?.message || 'Too many requests'
            );
            res.status(status).json(response);
          },
          standardHeaders: this.config.rateLimit.standardHeaders ?? true,
          legacyHeaders: this.config.rateLimit.legacyHeaders ?? false
        })
      );
    }
  }

  /**
   * Set up request logging middleware.
   */
  private setupRequestLoggingMiddleware(): void {
    if (this.config.requestLogging?.enable) {
      this.app.use((req, res, next) => {
        if (typeof this.config.requestLogging?.ignorePaths === 'function') {
          const skip = this.config.requestLogging?.ignorePaths?.(req, res);
          if (skip) return next();
        } else if (Array.isArray(this.config.requestLogging?.ignorePaths)) {
          const skip = this.config.requestLogging?.ignorePaths?.some(path => req.path.startsWith(path));
          if (skip) return next();
        }

        const logger = getLogger();
        const incomingRequestMetaData = {
          method: req.method,
          url: req.originalUrl || req.url,
          ip: req.ip
        };
        logger.info(incomingRequestMetaData, 'Incoming Request');
        next();
      });
    }

    // Custom request preprocessing hook
    if (this.hooks.onRequest) {
      this.app.use(this.hooks.onRequest);
    }
  }

  /**
   * Set up response compression middleware.
   */
  private setupCompressionMiddleware(): void {
    if (this.config.compression) {
      const compression = optionalRequire('compression');
      if (!compression) {
        this.throwDependencyError('compression');
      }

      if (typeof this.config.compression === 'object') {
        this.app.use(compression(this.config.compression));
      } else {
        this.app.use(compression());
      }
    }
  }

  /**
   * Set up static file serving middleware.
   */
  private setupStaticFilesMiddleware(): void {
    if (this.config.staticFolders) {
      this.config.staticFolders.forEach(folder => {
        this.app.use(
          this.normalizePath(folder.path ?? '/'),
          express.static(folder.directory, {
            maxAge: folder.maxAge || 0,
            etag: folder.etag !== false,
            immutable: folder.immutable === true,
            lastModified: folder.lastModified !== false,
            cacheControl: folder.cacheControl !== false
          })
        );
        getLogger().info(`Serving static folder: ${folder.directory} at path ${folder.path || '/'}`);
      });
    }
  }

  /**
   * Set up body parsing middleware.
   */
  private setupBodyParsingMiddleware(): void {
    if (isPlainObject(this.config.bodyParser)) {
      if (this.config.bodyParser.json) {
        this.app.use(express.json(this.config.bodyParser.json));
      }
      if (this.config.bodyParser.urlencoded) {
        this.app.use(express.urlencoded(this.config.bodyParser.urlencoded));
      }
    } else if (this.config.bodyParser === true) {
      const globalBodyParserConfig = getCatbeeServerGlobalConfig().bodyParser;
      if (isPlainObject(globalBodyParserConfig)) {
        if (globalBodyParserConfig.json) {
          this.app.use(express.json(globalBodyParserConfig.json));
        }
        if (globalBodyParserConfig.urlencoded) {
          this.app.use(express.urlencoded(globalBodyParserConfig.urlencoded));
        }
      }
    }
  }

  /**
   * Set up cookie parsing middleware.
   */
  private setupCookieParsingMiddleware(): void {
    if (this.config.cookieParser) {
      const cookieParser = optionalRequire('cookie-parser');
      if (!cookieParser) {
        this.throwDependencyError('cookie-parser');
      }

      if (typeof this.config.cookieParser === 'object') {
        this.app.use(cookieParser(undefined, this.config.cookieParser));
      } else {
        this.app.use(cookieParser());
      }
    }
  }

  /**
   * Set up OpenAPI documentation middleware.
   */
  private async setupOpenApiMiddleware(): Promise<void> {
    if (this.config.openApi?.enable) {
      try {
        const openApiMountPath = this.normalizePath(
          this.config.openApi.mountPath ?? '/docs',
          this.config.openApi.withGlobalPrefix
        );
        const openApiFilePath = this.config.openApi.filePath;
        if (!openApiFilePath) {
          const msg = 'OpenAPI file path is required';
          getLogger().error(msg);
          throw new Error(msg);
        }
        const isOpenApiFilePathExists = await fileExists(openApiFilePath);
        if (!isOpenApiFilePathExists) {
          const msg = `OpenAPI spec file not found at ${openApiFilePath}`;
          getLogger().error(msg);
          throw new Error(msg);
        }

        if (this.config.openApi?.verbose) {
          getLogger().info(`Mounting OpenAPI docs at ${openApiMountPath}`);
          getLogger().info(`Using OpenAPI spec file at ${openApiFilePath}`);
        }

        const apiReference = optionalRequire('@scalar/express-api-reference')?.apiReference;
        if (!apiReference) {
          this.throwDependencyError(
            '@scalar/express-api-reference',
            getDependencyErrorMessage('@scalar/express-api-reference', 'OpenAPI docs')
          );
        }

        this.app.use(
          openApiMountPath,
          apiReference({
            spec: {
              content: await readFile(openApiFilePath, 'utf8')
            }
          } as any)
        );
        if (this.config.openApi?.verbose) {
          getLogger().info(`Mounted OpenAPI docs at ${openApiMountPath}`);
        }
      } catch (err) {
        getLogger().error({ err }, 'Failed to mount OpenAPI docs');
      }
    }
  }

  /**
   * Set up response preprocessing hook (applies global prefix if set).
   */
  private setupResponseHook(): void {
    if (this.hooks.onResponse) {
      this.app.use(this.globalPrefix, this.hooks.onResponse);
    }
  }

  /**
   * Configure server routes and error handling.
   * Sets up in following order:
   *
   * 1. Built-in routes (health)
   * 2. Application routes
   * 3. 404 handler
   * 4. Error handler
   */
  protected async setupRoutes(): Promise<void> {
    // Application routes
    this.app.use(this.globalPrefix, this.rootRouter);

    // Allow users to run custom logic after routes are registered but before error handling is set up
    await this.runHook('afterRoutes', this.app);

    // 404 handler (must be after all other routes)
    this.app.use((req: Request, res: Response) => {
      const status = HttpStatusCodes.NOT_FOUND;
      const response = createFinalErrorResponse(req, status, `Route ${req.method.toUpperCase()} ${req.path} not found`);
      res.status(status).json(response);
    });

    // Global error handler (must be the last middleware)
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      // Check if this is a 404 error that should be handled with special logging rules
      const isNotFoundError = err instanceof NotFoundException;
      const shouldSkipLogging =
        !this.hooks.onError &&
        isNotFoundError &&
        this.config.requestLogging?.enable &&
        this.config.requestLogging.skipNotFoundRoutes === true;
      if (this.hooks.onError) {
        // Use custom error handler if provided
        this.hooks.onError(err, req, res, next);
      } else {
        // Default error handler with logging
        const errorHandlerMiddleware = errorHandler({
          logErrors: !shouldSkipLogging,
          includeDetails: Env.isDev() // Only show stack traces in development
        });
        errorHandlerMiddleware(err, req, res, next);
      }
    });
  }

  /**
   * Whether the Healthz probe server is enabled.
   */
  public isHealthzServerEnabled(): boolean {
    if (typeof this.config.healthzServer === 'boolean') {
      return this.config.healthzServer;
    }
    return this.config.healthzServer?.enable === true;
  }

  /**
   * Get the graceful shutdown delay in milliseconds configured for HealthzServer.
   */
  private getHealthzShutdownDelay(): number {
    return typeof this.config.healthzServer === 'object' ? (this.config.healthzServer.shutdownDelayMs ?? 0) : 0;
  }

  /**
   * Register a new health check function for monitoring service dependencies on the Healthz probe server.
   *
   * By default, external dependencies (DB, Redis, etc.) are registered as `readiness` checks.
   * Can also be registered as `liveness` or `both`.
   *
   * Examples:
   * - Database connectivity
   * - External service availability
   * - File system access
   * - Memory/CPU usage checks
   *
   * @param name Unique identifier for the check (used in detailed responses)
   * @param check Function returning boolean or Promise<boolean> indicating health (supports optional AbortSignal)
   * @param options Target probe type ('readiness' | 'liveness' | 'both') or options object
   * @returns This instance for method chaining
   */
  public registerHealthCheck(
    name: string,
    check: (signal?: AbortSignal) => Promise<boolean> | boolean,
    options?: 'readiness' | 'liveness' | 'both' | { type?: 'readiness' | 'liveness' | 'both' }
  ): this {
    const probeType = typeof options === 'string' ? options : (options?.type ?? 'readiness');
    const namedCheck: NamedCheck = { name, check };

    // Sync to HealthzServer probe checks
    if (probeType === 'liveness' || probeType === 'both') {
      this.healthzChecks.push(namedCheck);
    }
    if (probeType === 'readiness' || probeType === 'both') {
      this.healthzReadinessChecks.push(namedCheck);
    }

    // Register dynamically if HealthzServer is already running
    HealthzServer.registerCheck(namedCheck, probeType);

    return this;
  }

  /**
   * Mark the service as ready / not-ready for traffic on the Healthz probe server.
   *
   * @param ready Whether the service is ready to receive traffic
   * @returns This instance for method chaining
   */
  public setReady(ready: boolean): this {
    HealthzServer.setReady(ready);
    return this;
  }

  /**
   * Whether the service is currently marked as ready for traffic on the Healthz probe server.
   */
  public isReady(): boolean {
    return HealthzServer.isReady();
  }

  /**
   * Mark application startup as completed on the Healthz probe server (switches `/startupz` to 200).
   *
   * @returns This instance for method chaining
   */
  public markStartupComplete(): this {
    HealthzServer.markStartupComplete();
    return this;
  }

  /**
   * Whether application startup has completed on the Healthz probe server.
   */
  public isStartupComplete(): boolean {
    return HealthzServer.isStartupComplete();
  }

  /**
   * Get the running HealthzServer instance (if started).
   */
  public getHealthzServer(): HealthzServer | undefined {
    return HealthzServer.getInstance();
  }

  /**
   * Get the address info of the running HealthzServer (if started).
   */
  public getHealthzAddress(): HealthzAddressInfo | null | undefined {
    return this.healthzAddress;
  }

  /**
   * Returns whether the service is currently marked as ready for traffic on the Healthz probe server.
   * Useful for readiness checks in deployment tooling.
   *
   * @returns `true` when ready, otherwise `false`.
   */
  public ready(): boolean {
    return HealthzServer.isReady();
  }

  /**
   * Get the underlying Express application instance.
   * Use this for advanced Express features not exposed by this wrapper.
   *
   * @returns The raw Express app instance
   */
  public getApp(): Express {
    return this.app;
  }

  /**
   * Get the active HTTP/HTTPS server instance.
   * Returns null if the server is not currently running.
   *
   * @returns The HTTP/HTTPS server instance or null
   */
  public getServer(): http.Server | https.Server | null {
    return this.server;
  }

  /**
   * Start the HTTP server and begin listening for requests.
   *
   * This method:
   * - Protects against concurrent start() invocations
   * - Awaits server initialization (middleware + routes)
   * - Executes beforeStart hooks
   * - Creates the HTTP/HTTPS server instance
   * - Sets up error handling and connection tracking BEFORE listening
   * - Executes onServerCreated hook BEFORE listening
   * - Binds to the configured host/port
   * - Executes afterStart hooks on successful listen
   * - Cleans up server reference and listeners on startup failure
   *
   * @returns Promise resolving to the running HTTP server instance
   * @throws Error if server fails to start or port is already in use
   */
  public async start(): Promise<http.Server | https.Server> {
    if (this.server) {
      getLogger().warn('Server is already running, returning existing instance');
      return this.server;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = this.doStart();

    try {
      return await this.startPromise;
    } finally {
      this.startPromise = undefined;
    }
  }

  /**
   * Internal implementation of server startup.
   */
  private async doStart(): Promise<http.Server | https.Server> {
    // Ensure initialization (middleware + routes) completed before starting
    await this.initPromise;

    // Start Healthz probe server first if enabled (probes respond immediately while server boots)
    if (this.isHealthzServerEnabled()) {
      const healthzConfig: CatbeeHealthzServerConfig = {
        ...(typeof this.config.healthzServer === 'object' ? this.config.healthzServer : {}),
        handleSignals: false,
        checks: [...this.healthzChecks],
        readinessChecks: [...this.healthzReadinessChecks]
      };
      const addr = await HealthzServer.start(healthzConfig);
      if (!addr) {
        throw new Error('Healthz probe server failed to start (already running in this process)');
      }
      this.healthzAddress = addr;
    }

    try {
      await this.runHook('beforeStart', this.app);

      const server = this.createServerInstance();
      this.server = server;

      return await new Promise<http.Server | https.Server>((resolve, reject) => {
        let isListening = false;

        // Unified error listener handling both startup failure and runtime errors
        server.on('error', async (err: Error) => {
          if (!isListening) {
            getLogger().error({ err }, 'Server failed to start');

            try {
              server.removeAllListeners();
              server.close();
              if (HealthzServer.isRunning()) {
                await HealthzServer.stop().catch(() => {});
              }
            } catch {
              // Ignore errors during failure cleanup
            }

            this.server = null;
            this.healthzAddress = null;
            this.connections.clear();
            reject(err);
          } else {
            getLogger().error({ err }, 'Server runtime error');
          }
        });

        // 1. Set up connection tracking BEFORE listening
        this.setupConnectionTracking();

        // 2. Run onServerCreated hook BEFORE listening
        Promise.resolve(this.runHook('onServerCreated', server))
          .then(() => {
            // 3. Start listening ONLY after hooks and handlers are attached
            const onListening = async () => {
              try {
                this.logServerStartInfo();
                await this.runHook('afterStart', server);

                // Mark startup complete and ready on Healthz probe server
                if (this.isHealthzServerEnabled()) {
                  HealthzServer.markStartupComplete();
                  HealthzServer.setReady(true);
                }

                isListening = true;
                resolve(server);
              } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                getLogger().error({ err: error }, 'Server startup failed');

                // Clean up main server + health server
                if (HealthzServer.isRunning()) {
                  await HealthzServer.stop().catch(() => {});
                }

                try {
                  server.removeAllListeners();
                  server.close();
                } catch {
                  // Ignore errors during failure cleanup
                }

                this.server = null;
                this.healthzAddress = null;
                this.connections.clear();

                reject(error);
              }
            };

            const listenArgs: [number, (string | undefined)?, (() => void)?] = [
              this.config.port,
              this.config.host,
              onListening
            ];

            server.listen(...(listenArgs as any));
          })
          .catch(err => {
            server.emit('error', err instanceof Error ? err : new Error(String(err)));
          });
      });
    } catch (err) {
      if (HealthzServer.isRunning()) {
        await HealthzServer.stop().catch(() => {});
      }
      this.healthzAddress = null;
      this.server = null;
      this.connections.clear();
      throw err;
    }
  }

  /**
   * Create HTTP or HTTPS server instance (without listening).
   */
  private createServerInstance(): http.Server | https.Server {
    if (this.config.https) {
      const httpsOptions: https.ServerOptions = {
        ...this.config.https,
        key: readFileSync(this.config.https.key),
        cert: readFileSync(this.config.https.cert)
      };
      if (this.config.https.ca) {
        httpsOptions.ca = readFileSync(this.config.https.ca);
      }
      if (this.config.https.passphrase) {
        httpsOptions.passphrase = this.config.https.passphrase;
      }
      return https.createServer(httpsOptions, this.app);
    }

    return http.createServer(this.app);
  }

  /**
   * Set up connection tracking for graceful shutdown.
   */
  private setupConnectionTracking(): void {
    this.server!.on('connection', (conn: Socket) => {
      this.connections.add(conn);
      conn.on('close', () => this.connections.delete(conn));
    });
  }

  /**
   * Log server startup information.
   */
  private logServerStartInfo(): void {
    const protocol = this.config.https ? 'https' : 'http';
    const port = this.getPort();
    const host = this.formatHostForUrl(this.config.host || 'localhost');
    const url = `${protocol}://${host}:${port}`;
    getLogger().info(`Server running on ${url}`);

    if (this.healthzAddress) {
      getLogger().info(
        `Healthz probe server running on http://${this.healthzAddress.address}:${this.healthzAddress.port}`
      );
    }
    if (this.config.openApi?.enable) {
      getLogger().info(
        `API docs available at ${url}${this.normalizePath(this.config.openApi.mountPath as string, this.config.openApi.withGlobalPrefix)}`
      );
    }
  }

  /**
   * Stop the HTTP server gracefully.
   *
   * This method:
   * - Executes beforeStop hooks
   * - Stops accepting new connections
   * - Waits for existing connections to finish
   * - Closes the server
   * - Executes afterStop hooks
   * - Logs shutdown information
   *
   * Graceful shutdown ensures:
   * - No requests are dropped
   * - Resources are properly cleaned up
   * - Monitoring systems are notified
   */
  public async stop(force = false): Promise<void> {
    if (!this.server && !HealthzServer.isRunning()) {
      getLogger().warn('Stop called but server is not running');
      return;
    }
    if (this.isShuttingDown) {
      getLogger().warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;

    // Immediately mark unready on Healthz server to pull pod from load balancer endpoints
    if (HealthzServer.isRunning()) {
      HealthzServer.setReady(false);
    }

    if (this.server) {
      await this.runHook('beforeStop', this.server);
    }

    try {
      // Graceful drain delay before closing server connections (if configured and not forced)
      const shutdownDelay = this.getHealthzShutdownDelay();
      if (shutdownDelay > 0 && !force && HealthzServer.isRunning()) {
        getLogger().info(`Waiting ${shutdownDelay}ms for load balancer to drain traffic...`);
        await new Promise<void>(resolve => setTimeout(resolve, shutdownDelay));
      }

      if (this.server) {
        await this.gracefulShutdown(force);
      }
    } finally {
      if (HealthzServer.isRunning()) {
        await HealthzServer.stop();
        this.healthzAddress = null;
      }
      this.isShuttingDown = false;
    }
  }

  /**
   * Perform graceful server shutdown with timeout.
   */
  private async gracefulShutdown(force = false): Promise<void> {
    const shutdownTimeout = 10_000; // 10s max wait

    const server = this.server!;
    let timer: NodeJS.Timeout | undefined;
    let afterStopCalled = false;

    const runAfterStop = async () => {
      if (afterStopCalled) return;
      afterStopCalled = true;
      await this.runHook('afterStop');
    };

    // Close idle connections immediately so keep-alive sockets don't stall shutdown
    server.closeIdleConnections?.();

    const serverClosePromise = new Promise<void>((resolve, reject) => {
      server.close(async err => {
        if (timer) clearTimeout(timer);
        if (err) {
          getLogger().error({ err }, 'Error during server shutdown');
          reject(err);
          return;
        }
        this.server = null; // Clear the server reference after it has been closed

        getLogger().info('Server stopped gracefully');
        await runAfterStop();
        resolve();
      });
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Shutdown timeout')), shutdownTimeout);
    });

    try {
      await Promise.race([serverClosePromise, timeoutPromise]);
    } catch (err) {
      if (timer) clearTimeout(timer);
      getLogger().warn({ err }, 'Graceful shutdown timed out');

      if (!force) {
        throw err;
      }

      getLogger().warn('Escalating to forced shutdown');

      server.closeIdleConnections?.();
      server.closeAllConnections?.();

      await this.destroyConnections();
      this.server = null;
      getLogger().info('Forced shutdown completed');
      await runAfterStop();
    }
  }

  /**
   * Enable graceful shutdown on OS signals for production deployment.
   *
   * This is essential for:
   * - Container orchestration (Docker, Kubernetes)
   * - Process managers (PM2, systemd)
   * - Load balancer health checks
   * - Zero-downtime deployments
   *
   * @param signals Array of process signals to listen for (default: SIGINT, SIGTERM)
   */
  public enableGracefulShutdown(signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']): this {
    if (this.gracefulShutdownRegistered) {
      getLogger().warn('Graceful shutdown handlers are already registered');
      return this;
    }

    let signalHandled = false;

    signals.forEach(signal => {
      const handler = async () => {
        if (signalHandled) {
          getLogger().warn(`Ignoring duplicate ${signal}`);
          return;
        }

        signalHandled = true;

        getLogger().info(`Received ${signal}, initiating graceful shutdown...`);

        try {
          this.disableGracefulShutdown();
          await this.stop(false);
          process.exit(0);
        } catch (err) {
          getLogger().fatal({ err }, 'Shutdown failed');
          process.exit(1);
        }
      };

      this.signalListeners.set(signal, handler);
      process.on(signal, handler);
    });

    this.gracefulShutdownRegistered = true;
    return this;
  }

  /**
   * Unregister graceful shutdown signal listeners.
   * Useful for testing and dynamic server lifecycles to prevent memory and listener leaks.
   */
  public disableGracefulShutdown(): this {
    if (!this.gracefulShutdownRegistered) {
      return this;
    }

    for (const [signal, handler] of this.signalListeners.entries()) {
      process.removeListener(signal, handler);
    }

    this.signalListeners.clear();
    this.gracefulShutdownRegistered = false;
    return this;
  }

  /**
   * Destroy all active connections (gracefully if possible).
   * If a connection does not close cleanly, it will be force-destroyed.
   */
  private async destroyConnections(): Promise<void> {
    if (!this.connections.size) {
      return;
    }

    const sockets = [...this.connections];

    await Promise.allSettled(
      sockets.map(
        socket =>
          new Promise<void>(resolve => {
            socket.end();

            let timer: NodeJS.Timeout | undefined;

            const cleanup = () => {
              if (timer) clearTimeout(timer);
              socket.removeListener('close', onClose);
              socket.removeListener('error', onError);
              resolve();
            };

            const onClose = () => cleanup();
            const onError = () => {
              socket.destroy();
              cleanup();
            };

            timer = setTimeout(() => {
              socket.destroy();
              cleanup();
            }, 1000);

            socket.once('close', onClose);
            socket.once('error', onError);
          })
      )
    );

    this.connections.clear();
    getLogger().info(`Closed ${sockets.length} active connection(s)`);
  }

  /**
   * Mount a base router onto the server's root router.
   *
   * Note: This attaches the supplied router to the root router pipeline.
   * Duplicate mounting of the same router instance is ignored.
   *
   * @param router The Express router instance to mount
   * @returns This instance for method chaining
   */
  public addBaseRouter(router: Router): this {
    if (this.mountedRouters.has(router)) {
      return this;
    }
    this.mountedRouters.add(router);
    this.rootRouter.use(router);
    return this;
  }

  /**
   * Alias for `addBaseRouter` (maintained for backward compatibility).
   * Mounts the supplied router onto the server's root router.
   *
   * @param router The Express router instance to mount
   * @returns This instance for method chaining
   */
  public setBaseRouter(router: Router): this {
    return this.addBaseRouter(router);
  }

  /**
   * Create and register a new router (only used if not injecting one externally - use `setBaseRouter` instead).
   */
  public createRouter(prefix: string = ''): Router {
    const router = express.Router();
    const path = this.normalizePath(prefix, true);
    this.rootRouter.use(path, router);
    return router;
  }

  /**
   * Register a new route handler with support for multiple HTTP methods.
   * The route is automatically registered under the globalPrefix if set.
   *
   * @param methods Array of HTTP methods (get, post, put, delete, etc.)
   * @param path Route path with Express path patterns support
   * @param handlers One or more Express request handlers (middleware + final handler)
   * @returns This instance for method chaining
   */
  public registerRoute(
    methods: Array<keyof Pick<Express, 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'>>,
    path: string,
    ...handlers: Array<express.RequestHandler>
  ): this {
    const fullPath = this.normalizePath(path, true);
    const routerToUse = this.rootRouter;

    methods.forEach(m => {
      const method = m.toLowerCase() as typeof m;
      if (!SUPPORTED_HTTP_METHODS.has(method) || typeof routerToUse[method] !== 'function') {
        throw new Error(`Unsupported HTTP method: ${m}`);
      }
      (routerToUse[method] as Function)(fullPath, ...handlers);
    });
    return this;
  }

  /**
   * Register a GET route handler.
   */
  public get(path: string, ...handlers: express.RequestHandler[]): this {
    return this.registerRoute(['get'], path, ...handlers);
  }

  /**
   * Register a POST route handler.
   */
  public post(path: string, ...handlers: express.RequestHandler[]): this {
    return this.registerRoute(['post'], path, ...handlers);
  }

  /**
   * Register a PUT route handler.
   */
  public put(path: string, ...handlers: express.RequestHandler[]): this {
    return this.registerRoute(['put'], path, ...handlers);
  }

  /**
   * Register a DELETE route handler.
   */
  public delete(path: string, ...handlers: express.RequestHandler[]): this {
    return this.registerRoute(['delete'], path, ...handlers);
  }

  /**
   * Register a PATCH route handler.
   */
  public patch(path: string, ...handlers: express.RequestHandler[]): this {
    return this.registerRoute(['patch'], path, ...handlers);
  }

  /**
   * Register an OPTIONS route handler.
   */
  public options(path: string, ...handlers: express.RequestHandler[]): this {
    return this.registerRoute(['options'], path, ...handlers);
  }

  /**
   * Register a HEAD route handler.
   */
  public head(path: string, ...handlers: express.RequestHandler[]): this {
    return this.registerRoute(['head'], path, ...handlers);
  }

  /**
   * Register custom middleware with optional path restriction.
   *
   * Use this for:
   * - Adding authentication to specific routes
   * - Custom logging or validation
   * - Request transformation
   * - Third-party middleware integration
   *
   * @param path Optional path prefix or middleware function if no path
   * @param middleware Middleware handler (required if path is provided)
   * @returns This instance for method chaining
   */
  public registerMiddleware(path: string | express.RequestHandler, middleware?: express.RequestHandler): this {
    const routerToUse = this.rootRouter;
    if (typeof path === 'string') {
      const normalizedPath = this.normalizePath(path);
      if (normalizedPath) {
        routerToUse.use(normalizedPath, middleware as express.RequestHandler);
      } else {
        routerToUse.use(middleware as express.RequestHandler);
      }
    } else {
      routerToUse.use(path);
    }
    return this;
  }

  /**
   * Register one or more middleware functions to be applied globally.
   * This is a simpler alternative to registerMiddleware when you just want
   * to add middleware without path restrictions.
   *
   * @param middlewares One or more Express middleware functions
   * @returns This instance for method chaining
   */
  public useMiddleware(...middlewares: express.RequestHandler[]): this {
    middlewares.forEach(middleware => {
      this.rootRouter.use(middleware);
    });
    return this;
  }

  /**
   * Get server configuration
   *
   * @return {*}  {CatbeeServerConfig}
   */
  public getConfig(): CatbeeServerConfig {
    return this.config;
  }

  /**
   * Get the port the server is listening on.
   * Returns the actual port if server is running (useful when config.port was 0),
   * otherwise returns the configured port.
   *
   * @returns The port number
   */
  public getPort(): number {
    const address = this.server?.address();
    if (address && typeof address === 'object' && 'port' in address) {
      return address.port;
    }
    return this.config.port;
  }

  /**
   * Get the full URL the server is running on.
   * Returns the actual URL if server is running (useful when config.port was 0),
   * otherwise returns the configured URL.
   *
   * @returns The full server URL (e.g., "http://localhost:3000")
   */
  public getUrl(): string {
    const protocol = this.config.https ? 'https' : 'http';
    const port = this.getPort();
    const host = this.formatHostForUrl(this.config.host || 'localhost');
    return `${protocol}://${host}:${port}`;
  }

  /**
   * Check if the server is configured for dynamic port assignment.
   * Returns true if the original port configuration was 0.
   *
   * @returns True if using dynamic port assignment, false otherwise
   */
  public isPortDynamic(): boolean {
    return this.config.port === 0;
  }

  /**
   * Check if the server is currently running and listening for requests.
   *
   * @returns True if server is running, false otherwise
   */
  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  /**
   * Get the host address the server is bound to.
   *
   * @returns The host address
   */
  public getHost(): string {
    return this.config.host || 'localhost';
  }

  /**
   * Get the protocol the server is using ('http' or 'https').
   *
   * @returns The protocol string
   */
  public getProtocol(): string {
    return this.config.https ? 'https' : 'http';
  }

  /**
   * Check if the server is configured to use HTTPS.
   *
   * @returns True if using HTTPS, false otherwise
   */
  public isHttps(): boolean {
    return this.config.https !== undefined;
  }

  /**
   * Set a new port for the server.
   * Can only be called before the server starts listening.
   * Useful for testing scenarios where you need to change the port dynamically.
   *
   * @param port - The new port number (0-65535)
   * @throws Error if server is already running or port is invalid
   */
  public setPort(port: number): void {
    if (this.server) {
      throw new Error('Cannot change port after server has started');
    }
    if (!isPort(port, true)) {
      throw new Error(`Port must be a valid number between 0 and 65535, got: ${port}`);
    }
    this.config.port = port;
  }

  /**
   * Set a new host for the server.
   * Can only be called before the server starts listening.
   * Useful for testing scenarios where you need to change the host dynamically.
   *
   * @param host - The new host (e.g., "localhost", "0.0.0.0", "127.0.0.1", "::1", or "[::1]")
   * @throws {Error} If server is already running or host is invalid
   */
  public setHost(host: string): void {
    if (this.server) {
      throw new Error('Cannot change host after server has started');
    }
    const normalizedHost = this.normalizeHost(host);
    if (!isHostname(normalizedHost)) {
      throw new Error(`Host must be a valid hostname or IP address, got: ${host}`);
    }
    this.config.host = normalizedHost;
  }

  /**
   * Wait until server initialization (middleware + routes) has completed.
   * Useful for integration tests that inspect app before starting.
   */
  public async waitUntilReady(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Normalize host by stripping surrounding brackets from IPv6 addresses.
   * This ensures the host value is compatible with server.listen().
   * Brackets are URL syntax only and must be removed for Node.js binding.
   */
  private normalizeHost(host: string): string {
    // Strip surrounding brackets from IPv6 addresses (e.g., "[::1]" -> "::1")
    if (host.startsWith('[') && host.endsWith(']')) {
      return host.slice(1, -1);
    }
    return host;
  }

  /**
   * Format host for use in URLs.
   * Wraps IPv6 addresses in brackets per RFC 3986.
   */
  private formatHostForUrl(host: string): string {
    // IPv6 addresses contain colons and need to be wrapped in brackets
    // Since we normalize at input (strip brackets), we never have pre-bracketed hosts
    if (host.includes(':')) {
      return `[${host}]`;
    }
    return host;
  }

  private normalizePath(path: string, withGlobalPrefix = false): string {
    const sanitize = (p: string): string => {
      return (
        '/' +
        p
          .trim()
          .replace(/^\/+/, '') // remove leading slashes
          .replace(/\/{2,}/g, '/') // collapse multiple slashes
          .replace(/\/+$/, '')
      ); // remove trailing slash
    };

    // Resolve global prefix if enabled
    const prefix = withGlobalPrefix && this.globalPrefix ? sanitize(this.globalPrefix) : '';

    // If path is invalid, default to prefix or root
    if (typeof path !== 'string' || !path.trim()) {
      return prefix || '/';
    }

    return sanitize(prefix + '/' + path);
  }

  private async validateHttpsFiles() {
    if (!(await fileExists(this.config.https!.key))) {
      const msg = `HTTPS key file not found: ${this.config.https!.key}`;
      getLogger().error(msg);
      throw new Error(msg);
    }
    if (!(await fileExists(this.config.https!.cert))) {
      const msg = `HTTPS cert file not found: ${this.config.https!.cert}`;
      getLogger().error(msg);
      throw new Error(msg);
    }
    if (this.config.https!.ca && !(await fileExists(this.config.https!.ca))) {
      const msg = `HTTPS CA file not found: ${this.config.https!.ca}`;
      getLogger().error(msg);
      throw new Error(msg);
    }
  }

  private hasBuildMarker(config: Partial<CatbeeServerConfig>): boolean {
    if ((config as CatbeeServerConfig & { [BUILD_MARKER]?: boolean })?.[BUILD_MARKER]) {
      return true;
    }
    return false;
  }

  private throwDependencyError(packageName: keyof typeof DependencyErrors, msg?: string): never {
    getLogger().error({ command: `npm install ${packageName}` }, msg || DependencyErrors[packageName]);
    throw new Error(msg || DependencyErrors[packageName]);
  }
}

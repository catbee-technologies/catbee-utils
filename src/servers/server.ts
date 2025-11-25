import express, { Express, Request, Response, NextFunction, Router } from 'express';
import http from 'http';
import https from 'https';
import { HttpStatusCodes } from '../utils/http-status-codes';
import { createFinalErrorResponse, SuccessResponse } from '../utils/response.utils';
import { errorHandler, requestId, responseTime, setupRequestContext, timeout } from '../utils/middleware.utils';
import { Env } from '../utils/env.utils';
import { getLogger } from '../utils/logger.utils';
import { InternalServerErrorException, ServiceUnavailableException } from '../utils/exception.utils';
import { NotFoundException } from '../utils/exception.utils';
import fs from 'fs';
import { defaultCatbeeConfig, defaultServerConfig } from '../config';
import { deepObjMerge } from '../utils/obj.utils';
import { fileExists } from '../utils/fs.utils';
import { Socket } from 'net';
import { ServerConfig, ServerHooks } from '../types/server';
import { BUILD_MARKER } from './server.builder';
import { isPort } from '../utils/validate.utils';

/**
 * Production-ready Express server with enterprise features.
 *
 * Core Features:
 * - Security: Helmet, CORS, rate limiting, timeouts
 * - Monitoring: Request logs, metrics, health checks
 * - Performance: Compression, caching, static files
 * - Reliability: Graceful shutdown, error handling
 * - Developer UX: OpenAPI docs, debugging tools
 * - Extensibility: Hooks, middleware, custom routes
 *
 * Designed for microservices and production workloads.
 * Includes K8s readiness probes and zero-downtime support.
 */
export class ExpressServer {
  /** Prometheus client registry for metrics collection */
  private register: any = null;
  /** HTTP server instance (null when not running) */
  protected server: http.Server | https.Server | null = null;
  /** Merged configuration with defaults applied */
  protected config: ServerConfig;
  /** User-defined lifecycle hooks */
  protected hooks: ServerHooks;
  /** Global API prefix (from config) */
  protected globalPrefix: string;
  /** Internal fallback router */
  private rootRouter: Router;
  /** User-supplied router */
  private externalRouter?: Router;
  /** Internal Express app instance */
  private app: Express;
  /** Set of active WebSocket connections */
  private connections = new Set<Socket>();
  /** Flag indicating if the server is shutting down */
  private isShuttingDown = false;
  /**
   * Collection of registered health check functions.
   * These are executed when the health check endpoint is accessed.
   */
  private healthChecks: Array<{ name: string; check: () => Promise<boolean> | boolean }> = [];

  /** Prometheus metrics for monitoring */
  private requestCounter?: any;
  private routeTimings?: any;
  private requestSizes?: any;
  private clientIPs?: any;

  /** Promise that resolves when initialization (middleware + routes) is complete */
  private initPromise: Promise<void>;

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
   * - Prometheus metrics
   * - Health checks
   * - Request tracing
   */
  constructor(config: Partial<ServerConfig>, hooks: ServerHooks = {}) {
    if (ExpressServer.isBuiltServerConfig(config)) {
      this.config = config as Required<ServerConfig>;
    } else {
      // Deep merge config with user overrides
      this.config = deepObjMerge({}, defaultServerConfig, config) as Required<ServerConfig>;
    }

    if (!isPort(this.config.port)) {
      getLogger().error(`Port must be a valid number between 1 and 65535, got: ${this.config.port}`);
      process.exit(1);
    }

    // Sanitize app name for metrics (replace invalid characters with underscore)
    const safeAppName = (this.config.appName || 'express_app').toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (this.config.metrics?.enable) {
      const client = ExpressServer.optionalRequire('prom-client');
      if (!client) {
        getLogger().error(
          { command: 'npm install prom-client' },
          'prom-client is required for metrics but not installed. Please add it to your dependencies'
        );
        process.exit(1);
      }
      this.register = new client.Registry();
      // Initialize Prometheus metrics with sanitized names
      this.requestCounter = new client.Counter({
        name: `${safeAppName}_http_requests_total`,
        help: 'Total HTTP requests',
        labelNames: ['method', 'route', 'status'],
        registers: [this.register]
      });
      this.routeTimings = new client.Histogram({
        name: `${safeAppName}_http_request_duration_seconds`,
        help: 'Duration of HTTP requests by route',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        registers: [this.register]
      });
      this.requestSizes = new client.Histogram({
        name: `${safeAppName}_http_request_size_bytes`,
        help: 'Size of HTTP request bodies',
        labelNames: ['method', 'route'],
        buckets: [100, 1000, 10000, 100000, 1000000],
        registers: [this.register]
      });
      this.clientIPs = new client.Counter({
        name: `${safeAppName}_http_client_ip_total`,
        help: 'Client IP request counter',
        labelNames: ['ip', 'method'],
        registers: [this.register]
      });
      // Default system metrics (CPU, memory, event loop lag, etc.)
      client.collectDefaultMetrics({
        register: this.register,
        prefix: `${safeAppName}_`
      });
    }

    // Health checks
    if (config.healthCheck?.checks) {
      this.healthChecks.push(...config.healthCheck.checks);
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
  private async runHook<T extends keyof ServerHooks>(hook: T, ...args: unknown[]) {
    try {
      const fn = this.hooks[hook];
      if (fn) await (fn as (...args: unknown[]) => unknown).apply(null, args);
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

    // Basic middleware should be first
    this.app.disable('x-powered-by');

    if (this.config.trustProxy) {
      this.app.set('trust proxy', true);
    }

    // Request ID generation - must be first for proper tracing
    this.app.use(
      requestId({
        headerName: this.config.requestId?.headerName,
        exposeHeader: this.config.requestId?.exposeHeader,
        generator: this.config.requestId?.generator
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
        return res
          .status(HttpStatusCodes.SERVICE_UNAVAILABLE)
          .json(new ServiceUnavailableException('Server is shutting down'));
      }
      next();
      return;
    });

    // Security middleware should come early
    if (this.config.helmet) {
      const helmet = ExpressServer.optionalRequire('helmet');
      if (!helmet) {
        getLogger().error(
          { command: 'npm install helmet' },
          'helmet is required but not installed. Please add it to your dependencies'
        );
        process.exit(1);
      }

      if (typeof this.config.helmet === 'object') {
        this.app.use(helmet(this.config.helmet));
      } else {
        this.app.use(helmet());
      }
    }

    // CORS middleware should be early
    if (this.config.cors) {
      const cors = ExpressServer.optionalRequire('cors');
      if (!cors) {
        getLogger().error(
          { command: 'npm install cors' },
          'cors is required but not installed. Please add it to your dependencies'
        );
        process.exit(1);
      }
      this.app.use(cors(this.config.cors === true ? {} : this.config.cors));
    }

    // Global headers
    this.app.use((_req, res, next) => {
      if (this.config.globalHeaders) {
        for (const key in this.config.globalHeaders) {
          const value = this.config.globalHeaders[key];
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

    // Global request timeout protection
    if (this.config.requestTimeout) {
      this.app.use(timeout(this.config.requestTimeout));
    }

    // Response time tracking for performance monitoring
    if (this.config.responseTime?.enable) {
      this.app.use(
        responseTime({
          addHeader: this.config.responseTime.addHeader,
          logOnComplete: this.config.responseTime.logOnComplete
        })
      );
    }

    // Rate limiting should be early to prevent unnecessary processing
    if (this.config.rateLimit?.enable) {
      const rateLimit = ExpressServer.optionalRequire('express-rate-limit');
      if (!rateLimit) {
        getLogger().error(
          { command: 'npm install express-rate-limit' },
          'express-rate-limit is required but not installed. Please add it to your dependencies'
        );
        process.exit(1);
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

    // Request logging with filtering
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
          requestId: req.id,
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

    // Response compression for better performance
    if (this.config.compression) {
      const compression = ExpressServer.optionalRequire('compression');
      if (!compression) {
        getLogger().error(
          { command: 'npm install compression' },
          'compression is required but not installed. Please add it to your dependencies'
        );
        process.exit(1);
      }

      if (typeof this.config.compression === 'object') {
        this.app.use(compression(this.config.compression));
      } else {
        this.app.use(compression());
      }
    }

    // Static file serving (do NOT normalize filesystem path; only normalize route)
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

    // Request body parsing with size limits
    if (this.config.bodyParser) {
      if (this.config.bodyParser.json) {
        this.app.use(express.json(this.config.bodyParser.json));
      }
      if (this.config.bodyParser.urlencoded) {
        this.app.use(express.urlencoded(this.config.bodyParser.urlencoded));
      }
    }

    // Cookie parser middleware
    if (this.config.cookieParser) {
      const cookieParser = ExpressServer.optionalRequire('cookie-parser');
      if (!cookieParser) {
        getLogger().error(
          { command: 'npm install cookie-parser' },
          'cookie-parser is required but not installed. Please add it to your dependencies'
        );
        process.exit(1);
      }

      if (typeof this.config.cookieParser === 'object') {
        this.app.use(cookieParser(undefined, this.config.cookieParser));
      } else {
        this.app.use(cookieParser());
      }
    }

    // OpenAPI docs via @scalar/express-api-reference
    if (this.config.openApi?.enable) {
      try {
        const openApiMountPath = this.normalizePath(
          this.config.openApi.mountPath ?? '/docs',
          this.config.openApi.withGlobalPrefix
        );
        const openApiFilePath = this.config.openApi.filePath;
        if (!openApiFilePath) {
          getLogger().error('OpenAPI file path is required');
          process.exit(1);
        }
        const isOpenApiFilePathExists = await fileExists(openApiFilePath);
        if (!isOpenApiFilePathExists) {
          getLogger().error(`OpenAPI spec file not found at ${openApiFilePath}`);
          process.exit(1);
        }

        if (this.config.openApi?.verbose) {
          getLogger().info(`Mounting OpenAPI docs at ${openApiMountPath}`);
          getLogger().info(`Using OpenAPI spec file at ${openApiFilePath}`);
        }

        const apiReference = ExpressServer.optionalRequire('@scalar/express-api-reference').apiReference;
        if (!apiReference) {
          getLogger().error(
            { command: 'npm install @scalar/express-api-reference' },
            '@scalar/express-api-reference is required for OpenAPI docs but not installed. Please add it to your dependencies'
          );
          process.exit(1);
        }

        this.app.use(
          openApiMountPath,
          apiReference({
            spec: {
              content: await fs.promises.readFile(openApiFilePath, 'utf8')
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

    // Custom response preprocessing hook (apply global prefix if set)
    if (this.hooks.onResponse) {
      this.app.use(this.globalPrefix, this.hooks.onResponse);
    }

    if (this.config.metrics?.enable) {
      // Add metrics tracking middleware
      this.app.use((req, res, next) => {
        const start = process.hrtime();
        // Track client IPs
        this.clientIPs?.inc({ ip: req.ip, method: req.method });

        // Track request sizes (parse safely)
        const cl = req.headers['content-length'];
        if (cl) {
          const size = Number(cl);
          if (!Number.isNaN(size) && size >= 0) {
            const route = this.normalizeRouteForMetrics(req, res);
            this.requestSizes?.observe({ method: req.method, route }, size);
          }
        }

        res.once('finish', () => {
          const [seconds, nanoseconds] = process.hrtime(start);
          const finalRoute = this.normalizeRouteForMetrics(req, res);
          this.requestCounter?.inc({
            method: req.method,
            route: finalRoute,
            status: res.statusCode.toString()
          });
          this.routeTimings?.observe(
            {
              method: req.method,
              route: finalRoute,
              status: res.statusCode.toString()
            },
            seconds + nanoseconds / 1e9
          );
        });

        next();
      });
    }
  }

  /**
   * Configure server routes and error handling.
   * Sets up in following order:
   *
   * 1. Built-in routes (health, metrics)
   * 2. Application routes
   * 3. 404 handler
   * 4. Error handler
   */
  protected async setupRoutes(): Promise<void> {
    // Health check endpoint
    const healthCheckPath = this.normalizePath(
      this.config.healthCheck?.path || '/healthz',
      this.config.healthCheck?.withGlobalPrefix
    );

    this.app.get(healthCheckPath, async (_req: Request, res: Response) => {
      try {
        if (!this.healthChecks.length || defaultCatbeeConfig.server.skipHealthz) {
          return res.status(HttpStatusCodes.OK).json(new SuccessResponse('OK'));
        }

        const checkResults = await Promise.allSettled(
          this.healthChecks.map(async ({ name, check }) => {
            try {
              const status = await Promise.resolve(check());
              return { name, status, error: null };
            } catch (error) {
              return { name, status: false, error: (error as Error).message };
            }
          })
        );

        const results = checkResults.map(result => {
          if (result.status === 'fulfilled') return result.value;
          return { name: 'unknown', status: false, error: result.reason };
        });

        const allOk = results.every(r => r.status);
        const status = allOk ? HttpStatusCodes.OK : HttpStatusCodes.SERVICE_UNAVAILABLE;
        const response = new SuccessResponse(allOk ? 'OK' : 'Service unavailable');
        if (!allOk) response.error = true;
        if (this.config.healthCheck?.detailed) response.data = { checks: results };
        return res.status(status).json(response);
      } catch {
        return res
          .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
          .json(new InternalServerErrorException('Health check failed'));
      }
    });

    // Metrics endpoint
    if (this.config.metrics?.enable) {
      const metricsPath = this.normalizePath(
        this.config.metrics.path ?? '/metrics',
        this.config.metrics?.withGlobalPrefix
      );
      this.app.get(metricsPath, async (_req, res) => {
        res.set('Content-Type', this.register.contentType);
        res.end(await this.register.metrics());
      });
    }

    // Application routes
    const routerToUse = this.externalRouter || this.rootRouter;
    this.app.use(this.globalPrefix, routerToUse);

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
   * Register a new health check function for monitoring service dependencies.
   *
   * Health checks are executed when the health endpoint is accessed and
   * help determine if the service is ready to handle requests.
   *
   * Examples:
   * - Database connectivity
   * - External service availability
   * - File system access
   * - Memory/CPU usage checks
   *
   * @param name Unique identifier for the check (used in detailed responses)
   * @param check Function returning boolean or Promise<boolean> indicating health
   * @returns This instance for method chaining
   */
  public registerHealthCheck(name: string, check: () => Promise<boolean> | boolean): this {
    this.healthChecks.push({ name, check });
    return this;
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
   * - Executes beforeStart hooks
   * - Binds to the configured host/port
   * - Sets up error handling for startup failures
   * - Executes afterStart hooks on success
   * - Logs startup information
   *
   * @returns Promise resolving to the running HTTP server instance
   * @throws Error if server fails to start or port is already in use
   */
  public async start(): Promise<http.Server | https.Server> {
    // Ensure initialization (middleware + routes) completed before starting
    await this.initPromise;
    await this.runHook('beforeStart', this.app);

    return new Promise<http.Server | https.Server>((resolve, reject) => {
      try {
        // Prepare listen arguments with optional host parameter
        const listenArgs: [number, (string | undefined)?, (() => void)?] = [
          this.config.port,
          this.config.host,
          async () => {
            const protocol = this.config.https ? 'https' : 'http';
            const url = `${protocol}://${this.config.host}:${this.config.port}`;
            getLogger().info(`Server running on ${url}`);
            if (this.config.healthCheck?.path) {
              getLogger().info(
                `Health check available at ${url}${this.normalizePath(this.config.healthCheck.path, this.config.healthCheck.withGlobalPrefix)}`
              );
            }
            if (this.config.metrics?.enable && this.config.metrics.path) {
              getLogger().info(
                `Metrics available at ${url}${this.normalizePath(this.config.metrics.path, this.config.metrics.withGlobalPrefix)}`
              );
            }
            if (this.config.openApi?.enable) {
              getLogger().info(
                `API docs available at ${url}${this.normalizePath(this.config.openApi.mountPath as string, this.config.openApi.withGlobalPrefix)}`
              );
            }
            if (this.server) await this.runHook('afterStart', this.server);
            resolve(this.server as http.Server | https.Server);
          }
        ];

        if (this.config.https) {
          const httpsOptions: https.ServerOptions = {
            ...this.config.https,
            key: fs.readFileSync(this.config.https.key),
            cert: fs.readFileSync(this.config.https.cert)
          };
          if (this.config.https.ca) {
            httpsOptions.ca = fs.readFileSync(this.config.https.ca);
          }
          if (this.config.https.passphrase) {
            httpsOptions.passphrase = this.config.https.passphrase;
          }
          this.server = https.createServer(httpsOptions, this.app).listen(...(listenArgs as any));
        } else {
          // Start the HTTP server
          this.server = this.app.listen(...(listenArgs as any));
        }

        // Track connections
        this.server.on('connection', (conn: Socket) => {
          this.connections.add(conn);
          conn.on('close', () => this.connections.delete(conn));
        });

        // Handle server startup errors (port in use, permission denied, etc.)
        this.server.on('error', err => {
          getLogger().error({ err }, 'Server failed to start');
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
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
    if (!this.server) {
      getLogger().warn('Stop called but server is not running');
      return;
    }
    if (this.isShuttingDown) {
      getLogger().warn('Stop called while shutdown is already in progress');
      return;
    }

    this.isShuttingDown = true;
    await this.runHook('beforeStop', this.server);

    const shutdownTimeout = 10_000; // 10s max wait

    const serverClosePromise = new Promise<void>((resolve, reject) => {
      this.server!.close(async err => {
        if (err) {
          getLogger().error({ err }, 'Error while closing server');
          reject(err);
          return;
        }
        this.server = null;
        this.isShuttingDown = false;

        getLogger().info('Server stopped gracefully');
        await this.runHook('afterStop');
        resolve();
      });
    });

    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Shutdown timeout')), shutdownTimeout)
    );

    try {
      await Promise.race([serverClosePromise, timeoutPromise]);
    } catch (err) {
      getLogger().error({ err }, 'Graceful shutdown timed out');
      if (force) {
        getLogger().warn('Forcing connection destroy due to shutdown timeout');
      }
    } finally {
      // Always clean up connections
      await this.destroyConnections();
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
    signals.forEach(signal => {
      process.on(signal, async () => {
        getLogger().info(`Received ${signal}, initiating graceful shutdown...`);
        try {
          await this.stop();
          process.exit(0);
        } catch (err) {
          getLogger().error({ err }, 'Error during graceful shutdown, forcing stop...');
          try {
            await this.stop(true); // fallback to forced shutdown
            process.exit(1);
          } catch (forceError) {
            getLogger().fatal({ forceError }, 'Forced shutdown failed, exiting hard');
            process.exit(1);
          }
        }
      });
    });
    return this;
  }

  /**
   * Set an externally created base router.
   * This will override the internal rootRouter.
   */
  public setBaseRouter(router: Router): this {
    this.externalRouter = router;
    return this;
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
    const methodMap: {
      [K in keyof Pick<
        Express,
        'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
      >]: (typeof this.app)[K];
    } = {
      get: this.app.get.bind(this.app),
      post: this.app.post.bind(this.app),
      put: this.app.put.bind(this.app),
      delete: this.app.delete.bind(this.app),
      patch: this.app.patch.bind(this.app),
      options: this.app.options.bind(this.app),
      head: this.app.head.bind(this.app)
    };
    methods.forEach(m => {
      const fn = methodMap[m];
      if (fn) {
        fn(fullPath, ...handlers);
      } else {
        throw new Error(`Unsupported HTTP method: ${m}`);
      }
    });
    return this;
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
    if (typeof path === 'string') {
      const normalizedPath = this.normalizePath(path);
      if (normalizedPath) {
        this.app.use(normalizedPath, middleware as express.RequestHandler);
      } else {
        this.app.use(middleware as express.RequestHandler);
      }
    } else {
      this.app.use(path);
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
      this.app.use(middleware);
    });
    return this;
  }

  /**
   * Get Prometheus registry (to add custom counters/histograms)
   *
   * @return {*}  {client.Registry}
   */
  public getMetricsRegistry() {
    if (!this.config.metrics?.enable) {
      throw new Error('Metrics are not enabled in the server configuration');
    }
    return this.register as typeof import('prom-client').Registry;
  }

  /**
   * Get server configuration
   *
   * @return {*}  {ServerConfig}
   */
  public getConfig(): ServerConfig {
    return this.config;
  }

  /**
   * Wait until server initialization (middleware + routes) has completed.
   * Useful for integration tests that inspect app before starting.
   */
  public async waitUntilReady(): Promise<void> {
    await this.initPromise;
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

  private normalizeRouteForMetrics(req: Request, res: Response): string {
    // Prevent high cardinality metrics by normalizing routes
    if ((req as any)?.route?.path) {
      // Use Express route pattern instead of actual URL
      return (req as any).route.path;
    }
    // Group common patterns
    if (res.statusCode === 404) return '/404';
    const path = (req.path || 'unknown').split('?')[0];
    // Replace IDs and UUIDs with placeholders
    return path
      .replace(/\/[0-9]+/g, '/:id')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:uuid');
  }

  /**
   * Destroy all active connections (gracefully if possible).
   * If a connection does not close cleanly, it will be force-destroyed.
   */
  private async destroyConnections(): Promise<void> {
    const total = this.connections.size;
    if (total === 0) {
      getLogger().debug('No active connections to close');
      return;
    }

    const timeoutMs = 5000;
    await Promise.race([
      Promise.all(
        Array.from(this.connections).map(
          conn =>
            new Promise<void>(resolve => {
              conn.end(() => {
                if (!conn.destroyed) conn.destroy();
                resolve();
              });
              conn.on('error', () => {
                conn.destroy();
                resolve();
              });
            })
        )
      ),
      new Promise<void>(resolve => setTimeout(resolve, timeoutMs))
    ]);

    this.connections.clear();
    getLogger().info(`Closed ${total} active connections`);
  }

  private async validateHttpsFiles() {
    if (!(await fileExists(this.config.https!.key))) {
      getLogger().error(`HTTPS key file not found: ${this.config.https!.key}`);
      process.exit(1);
    }
    if (!(await fileExists(this.config.https!.cert))) {
      getLogger().error(`HTTPS cert file not found: ${this.config.https!.cert}`);
      process.exit(1);
    }
    if (this.config.https!.ca && !(await fileExists(this.config.https!.ca))) {
      getLogger().error(`HTTPS CA file not found: ${this.config.https!.ca}`);
      process.exit(1);
    }
  }

  private static isBuiltServerConfig(config: Partial<ServerConfig>): boolean {
    if ((config as any)[BUILD_MARKER]) {
      return true;
    }
    return false;
  }

  private static optionalRequire<T = any>(name: string): T | null {
    try {
      return require(name);
    } catch {
      return null;
    }
  }
}

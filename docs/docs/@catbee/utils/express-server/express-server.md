# Express Server

Enterprise-grade Express server builder for secure, reliable, and observable APIs.

## API Summary

- [**`ServerConfigBuilder`**](#serverconfigbuilder) - fluent builder for server configuration.
- [**`ExpressServer`**](#expressserver) - main server class with lifecycle hooks and utilities.
- [**`registerHealthCheck(name: string, fn: () => Promise<boolean> | boolean)`**](#health-checks) - add health checks for dependencies.
- [**`enableGracefulShutdown([signals])`**](#graceful-shutdown) - enable graceful shutdown on process signals.
- [**`createRouter(prefix: string)`**](#create-router) - create a namespaced router.
- [**`setBaseRouter(router: Router)`**](#set-global-base-router) - set a global base router for all routes.
- [**`registerRoute(methods: string[], path: string, ...handlers: RequestHandler[])`**](#register-middleware) - register route handlers.
- [**`registerMiddleware(path: string, middleware: RequestHandler)`**](#register-middleware) - add custom middleware.
- [**`useMiddleware(...middlewares: RequestHandler[])`**](#register-middleware) - apply global middleware.
- [**`getMetricsRegistry(): MetricsRegistry`**](#metrics) - access Prometheus metrics registry.

---

## Features Covered

- **Security**
  - CORS (Cross-Origin Resource Sharing)
  - Helmet (HTTP security headers)
  - Rate limiting (express-rate-limit)
  - Request timeouts
  - Body size limits
  - Cookie parsing
  - Trust proxy support

- **Monitoring**
  - Request logging (customizable, skip paths, skip not found)
  - Prometheus metrics (via prom-client)
  - Health checks (custom and built-in)
  - Request tracing (request ID middleware)
  - Response time tracking

- **Performance**
  - Compression (gzip/deflate)
  - Static file serving (multiple folders, cache control)
  - Efficient body parsing

- **Reliability**
  - Graceful shutdown (signal handling, connection draining)
  - Error handling (custom/global error handler)
  - 404 handler

- **Developer Experience**
  - OpenAPI documentation (via @scalar/express-api-reference)
  - Lifecycle hooks for extensibility
  - Global headers
  - Microservice mode (service name/version headers)
  - Custom routers and middleware

- **Extensibility**
  - Lifecycle hooks (beforeInit, afterInit, beforeStart, afterStart, beforeStop, afterStop, onRequest, onResponse, onError)
  - Custom configuration overrides
  - Custom middleware and routes

---

## Libraries Used

- **express** - Core web server framework
- **helmet** - Security headers
- **cors** - CORS support
- **compression** - Response compression
- **cookie-parser** - Cookie parsing
- **express-rate-limit** - Rate limiting
- **prom-client** - Prometheus metrics
- **@scalar/express-api-reference** - OpenAPI documentation UI
- **uuid** - Request ID generation
- **fs** - File system utilities
- **http/https** - Node.js server modules

---

## Interfaces & Types

### ServerConfig

```ts
interface ServerConfig {
  port: number; // default: 3000
  host?: string; // default: '0.0.0.0'
  cors?: boolean | CorsOptions; // default: false
  helmet?: boolean | HelmetOptions; // default: false
  compression?: boolean | CompressionOptions; // default: false
  bodyParser?: {
    json?: { limit: string }; // default: { limit: '1mb' }
    urlencoded?: { extended: boolean; limit: string }; // default: { extended: true, limit: '1mb' }
  };
  cookieParser?: boolean | CookieParseOptions; // default: false
  trustProxy?: boolean; // default: false
  staticFolders?: Array<{
    path?: string; // default: '/'
    directory: string;
    maxAge?: string; // default: undefined
    etag?: boolean; // default: true
    immutable?: boolean; // default: false
    lastModified?: boolean; // default: true
    cacheControl?: boolean; // default: true
  }>;
  isMicroservice?: boolean; // default: false
  appName?: string; // default: 'express_app'
  globalHeaders?: Record<string, string | (() => string)>; // default: {}
  rateLimit?: {
    enable: boolean; // default: false
    windowMs?: number; // default: 900000
    max?: number; // default: 100
    message?: string; // default: 'Too many requests'
    standardHeaders?: boolean; // default: true
    legacyHeaders?: boolean; // default: false
  };
  requestLogging?: {
    enable: boolean; // default: true in dev, false in prod
    ignorePaths?: string[] | ((req: Request, res: Response) => boolean); // default: skips /healthz, /favicon.ico, /metrics, /docs, /.well-known
    skipNotFoundRoutes?: boolean; // default: false
  };
  healthCheck?: {
    path?: string; // default: '/healthz'
    checks?: Array<{ name: string; check: () => Promise<boolean> | boolean }>;
    detailed?: boolean; // default: true
    withGlobalPrefix?: boolean; // default: false
  };
  requestTimeout?: number; // default: 30000
  responseTime?: {
    enable: boolean; // default: false
    addHeader?: boolean; // default: true
    logOnComplete?: boolean; // default: false
  };
  requestId?: {
    headerName?: string; // default: 'x-request-id'
    exposeHeader?: boolean; // default: true
    generator?: () => string; // default: uuid()
  };
  globalPrefix?: string; // default: ''
  openApi?: {
    enable: boolean; // default: false
    mountPath?: string; // default: '/docs'
    filePath?: string;
    verbose?: boolean; // default: false
    withGlobalPrefix?: boolean; // default: false
  };
  metrics?: {
    enable: boolean; // default: false
    path?: string; // default: '/metrics'
    withGlobalPrefix?: boolean; // default: false
  };
  serviceVersion?: {
    enable: boolean; // default: false
    headerName?: string; // default: 'x-service-version'
    version?: string | (() => string); // default: '0.0.0'
  };
  https?: {
    key: string;
    cert: string;
    ca?: string;
    passphrase?: string;
    [key: string]: any;
  };
}
```

### ServerHooks

```ts
interface ServerHooks {
  beforeInit?: (server: ExpressServer) => Promise<void> | void;
  afterInit?: (server: ExpressServer) => Promise<void> | void;
  beforeStart?: (app: Express) => Promise<void> | void;
  afterStart?: (server: http.Server) => Promise<void> | void;
  beforeStop?: (server: http.Server) => Promise<void> | void;
  afterStop?: () => Promise<void> | void;
  onError?: (error: Error, req: Request, res: Response, next: NextFunction) => void;
  onRequest?: (req: Request, res: Response, next: NextFunction) => void;
  onResponse?: (req: Request, res: Response, next: NextFunction) => void;
}
```

---

## Environment Variables for Logging

| Environment Variable        | Default Value                  | Description                                 |
|-----------------------------|--------------------------------|---------------------------------------------|
| `LOGGER_LEVEL`              | `info`                         | Log level for the application               |
| `LOGGER_NAME`               | `process.env.npm_package_name` | Name of the logger                          |
| `LOGGER_PRETTY`             | `true`                         | Enable pretty logging                       |
| `LOGGER_PRETTY_COLORIZE`    | `true`                         | Enable colorized output for pretty-print    |
| `LOGGER_PRETTY_SINGLE_LINE` | `false`                        | Enable single-line logging                  |
| `SERVER_SKIP_HEALTHZ`       | `false`                        | Skip health checks route, always return 200 |

## Default Values

| Option                | Default Value               | Description                                 |
|-----------------------|-----------------------------|---------------------------------------------|
| `port`                | `3000`                      | Port for the server                         |
| `host`                | `'0.0.0.0'`                 | Host for the server                         |
| `cors`                | `false`                     | Enable CORS                                 |
| `helmet`              | `false`                     | Enable Helmet security headers              |
| `compression`         | `false`                     | Enable response compression                  |
| `bodyParser.json`     | `{ limit: '1mb' }`          | JSON body parser options                    |
| `bodyParser.urlencoded` | `{ extended: true, limit: '1mb' }` | URL-encoded body parser options            |
| `cookieParser`        | `false`                     | Enable cookie parsing                       |
| `trustProxy`          | `false`                     | Enable proxy trust                           |
| `staticFolders`       | `[]`                        | Static file serving folders                 |
| `isMicroservice`      | `false`                     | Enable microservice mode                    |
| `appName`             | `'express_app'`             | Name of the application                     |
| `globalHeaders`       | `{}`                        | Global headers to include in all responses  |
| `rateLimit.enable`    | `false`                     | Enable rate limiting                        |
| `rateLimit.windowMs`  | `900000` (15 min)           | Time window for rate limiting               |
| `rateLimit.max`       | `100`                       | Maximum number of requests in the window    |
| `rateLimit.message`   | `'Too many requests'`       | Rate limit exceeded message                 |
| `requestLogging.enable` | `true` (dev), `false` (prod) | Enable request logging                     |
| `requestLogging.ignorePaths` | `['/healthz', '/favicon.ico', '/metrics', '/docs', '/.well-known']` | Paths to ignore for request logging |
| `healthCheck.path`    | `'/healthz'`                | Health check endpoint                       |
| `healthCheck.detailed`| `true`                      | Enable detailed health check response      |
| `requestTimeout`      | `30000` (30 sec)            | Request timeout duration                    |
| `responseTime.enable` | `false`                     | Enable response time tracking               |
| `responseTime.addHeader` | `true`                   | Add response time header                    |
| `responseTime.logOnComplete` | `false`              | Log response time on completion             |
| `requestId.headerName`| `'x-request-id'`            | Request ID header name                      |
| `requestId.exposeHeader` | `true`                   | Expose Request ID header                    |
| `metrics.enable`      | `false`                     | Enable metrics collection                   |
| `metrics.path`        | `'/metrics'`                | Metrics endpoint path                       |
| `serviceVersion.enable` | `false`                   | Enable service versioning                   |
| `serviceVersion.headerName` | `'x-service-version'` | Service version header name                 |
| `serviceVersion.version` | `'0.0.0'`                | Service version                             |
| `openApi.enable`      | `false`                     | Enable OpenAPI documentation                 |
| `openApi.mountPath`   | `'/docs'`                   | OpenAPI documentation mount path            |
| `openApi.verbose`     | `false`                     | Enable verbose OpenAPI documentation        |
| `openApi.withGlobalPrefix` | `false`                | Use global prefix for OpenAPI routes        |
| `globalPrefix`        | `''`                        | Global prefix for all routes                |

---

## Features

- **Security:** CORS, Helmet, rate limiting, timeouts, body size limits
- **Monitoring:** Request logging, Prometheus metrics, health checks
- **Performance:** Compression, static files
- **Reliability:** Graceful shutdown, error handling
- **Developer UX:** OpenAPI docs, debugging
- **Extensibility:** Lifecycle hooks, middleware, custom routes

---

## Usage Example

```ts
import { ServerConfigBuilder, ExpressServer } from "@catbee/utils";

// Build server config with all major features
const config = new ServerConfigBuilder()
  .withPort(3000)
  .withHost('0.0.0.0')
  .enableCors()
  .enableHelmet()
  .enableCompression()
  .enableRateLimit({ max: 50, windowMs: 60000 })
  .enableRequestLogging({ ignorePaths: ['/healthz', '/metrics'] })
  .enableMetrics({ path: '/metrics' })
  .withHealthCheck({ path: '/health', detailed: true })
  .enableOpenApi('./openapi.yaml', { mountPath: '/docs' })
  .withStaticFolder({ path: '/assets', directory: './public/assets', maxAge: '1d' })
  .withGlobalHeaders({
    'X-Powered-By': 'Catbee',
    'X-Server-Time': () => new Date().toISOString()
  })
  .withGlobalPrefix('/api')
  .withMicroService({
    appName: 'user-service',
    serviceVersion: { enable: true, version: '1.0.0' }
  })
  .withTrustProxy(true)
  .withRequestId({ headerName: 'X-Request-Id', exposeHeader: true })
  .enableResponseTime({ addHeader: true, logOnComplete: true })
  .withBodyParser({ json: { limit: '2mb' }, urlencoded: { extended: true, limit: '2mb' } })
  .withCookies(true)
  .withHttps({
    key: './localhost-key.pem',
    cert: './localhost-cert.pem'
  })
  .withCustom({ requestTimeout: 60000 })
  .build();

// Create server with all lifecycle hooks
const server = new ExpressServer(config, {
  beforeInit: srv => console.log('Initializing server...'),
  afterInit: srv => console.log('Server initialized'),
  beforeStart: app => console.log('Starting server...'),
  afterStart: srv => console.log('Server started!'),
  beforeStop: srv => console.log('Stopping server...'),
  afterStop: () => console.log('Server stopped.'),
  onRequest: (req, res, next) => {
    console.log('Processing request:', req.method, req.url);
    next();
  },
  onResponse: (req, res, next) => {
    res.setHeader('X-Processed-By', 'ExpressServer');
    next();
  },
  onError: (err, req, res, next) => {
    console.error('Custom error handler:', err);
    res.status(500).json({ error: 'Custom error: ' + err.message });
  }
});

// Register health checks
server.registerHealthCheck('database', async () => await checkDatabaseConnection());
server.registerHealthCheck('storage', () => require('fs').existsSync('./data'));

// Register routes
const router = server.createRouter('/users');
router.get('/', (req, res) => res.json({ users: [] }));
router.post('/', (req, res) => res.json({ created: true }));

// Or set a base router for all routes
import { Router } from "express";
const baseRouter = Router();
baseRouter.use('/users', router);
server.setBaseRouter(baseRouter);

// Register custom middleware for admin routes
server.registerMiddleware('/admin', (req, res, next) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).send('Forbidden');
  next();
});

// Use global middleware
server.useMiddleware((req, res, next) => {
  // Example: log request time
  req.logger?.info('Request received at ' + new Date().toISOString());
  next();
});

// Register a route directly
server.registerRoute(['get'], '/status', (req, res) => res.json({ ok: true }));

// Start server
await server.start();

// Enable graceful shutdown
server.enableGracefulShutdown();
```

---

## ServerConfigBuilder

Fluent API for configuring all aspects of your server.

**Method Signatures:**
```ts
new ServerConfigBuilder()
  .withPort(port: number)
  .withHost(host: string)
  .enableCors()
  .withCors(options: CorsOptions)
  .enableHelmet()
  .withHelmet(options: HelmetOptions)
  .enableCompression()
  .withCompression(options: CompressionOptions)
  .enableRateLimit(options: RateLimitOptions)
  .withRateLimit(options: RateLimitOptions)
  .enableRequestLogging(options: RequestLoggingOptions)
  .withRequestLogging(options: RequestLoggingOptions)
  .enableMetrics(options: MetricsOptions)
  .withMetrics(options: MetricsOptions)
  .withHealthCheck(options: HealthCheckOptions)
  .enableOpenApi(filePath: string, options: OpenApiOptions)
  .withOpenApi(options: OpenApiOptions)
  .withMicroService({ appName, serviceVersion })
  .withTrustProxy(value: boolean)
  .withRequestId(options: { headerName?: string; exposeHeader?: boolean; generator?: () => string })
  .enableResponseTime(options: { addHeader?: boolean; logOnComplete?: boolean })
  .withResponseTime(options: { addHeader?: boolean; logOnComplete?: boolean })
  .withBodyParser(options: { json?: BodyParserOptions; urlencoded?: BodyParserOptions })
  .withCookies(options: { secret?: string; secure?: boolean })
  .withStaticFolder({ path, directory, ... })
  .withGlobalHeaders(headers: Record<string, string>)
  .withGlobalPrefix(prefix: string)
  .withHttps(options: { cert: string; key: string; ca?: string })
  .withCustom(overrides: Partial<ServerConfig>)
  .build()
```

**Examples:**
```ts
const config = new ServerConfigBuilder()
  .withPort(3000)
  .enableCors()
  .enableHelmet()
  .enableCompression()
  .withGlobalPrefix('/api/v1')
  .enableMetrics({ path: '/metrics' })
  .enableOpenApi('./openapi.yaml', { mountPath: '/docs' })
  .build();
```

---

## ExpressServer

Main server class with lifecycle hooks and utilities.

**Method Signatures:**
```ts
new ExpressServer(config: ServerConfig, hooks?: ServerHooks)
.start(): Promise<http.Server | https.Server>
.stop(force?: boolean): Promise<void>
.enableGracefulShutdown(signals?: NodeJS.Signals[])
.registerHealthCheck(name: string, fn: () => Promise<boolean> | boolean)
.createRouter(prefix?: string): Router
.registerRoute(methods: string[], path: string, ...handlers)
.registerMiddleware(path: string, middleware)
.useMiddleware(...middlewares)
.getMetricsRegistry(): client.Registry
.getConfig(): ServerConfig
.waitUntilReady(): Promise<void>
```

**Lifecycle Hooks:**
```ts
{
  beforeInit?: (server) => void | Promise<void>,
  afterInit?: (server) => void | Promise<void>,
  beforeStart?: (app) => void | Promise<void>,
  afterStart?: (server) => void | Promise<void>,
  beforeStop?: (server) => void | Promise<void>,
  afterStop?: () => void | Promise<void>,
  onRequest?: (req, res, next) => void,
  onResponse?: (req, res, next) => void,
  onError?: (err, req, res, next) => void
}
```

**Examples:**
```ts
const server = new ExpressServer(config, {
  beforeInit: srv => console.log('Initializing...'),
  afterStart: srv => console.log('Started!')
});
await server.start();
```

---

## Health Checks

Register health checks for monitoring dependencies.

**Method Signature:**
```ts
server.registerHealthCheck(name: string, fn: () => Promise<boolean> | boolean)
```

**Examples:**
```ts
server.registerHealthCheck('storage', () => fs.existsSync('./data'));
server.registerHealthCheck('database', async () => {
  try { await db.ping(); return true; } catch { return false; }
});
```

---

## Graceful Shutdown

Enable zero-downtime deployments.

**Method Signature:**
```ts
server.enableGracefulShutdown(signals?: NodeJS.Signals[])
```

**Examples:**
```ts
server.enableGracefulShutdown();

async function shutdown() {
  await server.stop();
  process.exit(0);
}
```

---

## Routing & Middleware

### Set Global Base Router

```ts
import { Router } from "express";
const baseRouter = Router();

const config = new ServerConfigBuilder()
  .withGlobalPrefix('/api/v1')
  .build();
const server = new ExpressServer(config);

server.setBaseRouter(baseRouter);
```

### Create Router
```ts
const router = server.createRouter('/users');
router.get('/', handler);
```

### Register Route
```ts
server.registerRoute(['get'], '/status', (req, res) => res.json({ ok: true }));
```

### Register Middleware
```ts
server.registerMiddleware('/admin', adminMiddleware);
server.useMiddleware(loggingMiddleware, errorMiddleware);
```

---

## Metrics

**Access Prometheus Registry:**
```ts
const registry = server.getMetricsRegistry();
```

---

## API Reference

See [ServerConfigBuilder](#serverconfigbuilder) and [ExpressServer](#expressserver) for full method documentation and options.

---
- `withCompression(opts: CompressionOptions)` / `enableCompression()` / `disableCompression()` - Configure response compression
- `withRateLimit(opts: RateLimitOptions)` / `enableRateLimit(opts: RateLimitOptions)` / `disableRateLimit()` - Configure rate limiting
- `withRequestLogging(opts: RequestLoggingOptions)` / `enableRequestLogging(opts: RequestLoggingOptions)` / `disableRequestLogging()` - Configure request logging
- `withMetrics(opts: MetricsOptions)` / `enableMetrics(opts: MetricsOptions)` / `disableMetrics()` - Configure Prometheus metrics
- `withHealthCheck(opts: HealthCheckOptions)` - Configure health check endpoints
- `withOpenApi(opts: OpenApiOptions)` / `enableOpenApi(filePath: string, opts: OpenApiOptions)` / `disableOpenApi()` - Configure OpenAPI documentation
- `withMicroService(opts: MicroServiceOptions)` - Configure as a microservice
- `withTrustProxy(opts: TrustProxyOptions)` - Configure trust proxy settings
- `withRequestId(opts: RequestIdOptions)` - Configure request ID generation
- `withResponseTime(opts: ResponseTimeOptions)` / `enableResponseTime(opts: ResponseTimeOptions)` / `disableResponseTime()` - Configure response time tracking
- `withBodyParser(opts: BodyParserOptions)` - Configure request body parsing
- `withCookies(opts: CookiesOptions)` - Configure cookie parsing
- `withStaticFolder(folder: string)` - Configure static file serving
- `withGlobalHeaders(headers: Record<string, string>)` - Set global response headers
- `withGlobalPrefix(prefix: string)` - Set global route prefix
- `withHttps(opts: HttpsOptions)` - Configure HTTPS
- `withCustom(overrides: Partial<ServerConfig>)` - Apply custom configuration
- `build()` - Build the final configuration

---

## Core NPM Packages (always required)

- `express` - The web framework
- `reflect-metadata` - Metadata reflection API
- `pino` - Logging library

---

## Feature-specific NPM Packages (only if feature is enabled)

| Feature                | Required NPM Packages                   |
|------------------------|-----------------------------------------|
| CORS                   | `cors`                                  |
| Helmet (security)      | `helmet`                                |
| Compression            | `compression`                           |
| Cookie Parsing         | `cookie-parser`                         |
| Rate Limiting          | `express-rate-limit`                    |
| Prometheus Metrics     | `prom-client`                           |
| OpenAPI Docs           | `@scalar/express-api-reference`         |

**Note:** These packages must be installed via `npm install <package>` if you enable the corresponding feature in your server config.

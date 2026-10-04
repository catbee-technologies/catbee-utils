# Environment Variables

Comprehensive reference for environment variables supported across `@catbee/utils` modules.

---

## Server Configuration (`CatbeeServer`)

Controls the Express-based HTTP application server setup, security middlewares, routing, and telemetry.

| Environment Variable | Type | Default/Value | Description |
| -------------------- | ---- | ------------- | ----------- |
| `SERVER_PORT` | `number` | `${PORT}` or `3000` | Server port (takes precedence over `PORT`) |
| `PORT` | `number` | `3000` | Fallback server port if `SERVER_PORT` is unset |
| `SERVER_HOST` | `string` | `${HOST}` or `0.0.0.0` | Server host to bind (takes precedence over `HOST`) |
| `HOST` | `string` | `0.0.0.0` | Fallback server host if `SERVER_HOST` is unset |
| `SERVER_APP_NAME` | `string` | `${npm_package_name}` or `catbee_server` | Application or service name |
| `SERVER_IS_MICROSERVICE` | `boolean` | `false` | Microservice mode flag |
| `SERVER_GLOBAL_HEADERS` | `JSON` | `{}` | Global response headers as JSON map |
| `SERVER_CORS_ENABLE` | `boolean` | `false` | Enable CORS middleware |
| `SERVER_HELMET_ENABLE` | `boolean` | `false` | Enable Helmet security headers middleware |
| `SERVER_COMPRESSION_ENABLE` | `boolean` | `false` | Enable response gzip/deflate compression |
| `SERVER_COOKIE_PARSER_ENABLE` | `boolean` | `false` | Enable cookie-parser middleware |
| `SERVER_BODY_PARSER_JSON_LIMIT` | `string` | `1mb` | Max request body size for JSON payloads |
| `SERVER_BODY_PARSER_URLENCODED_LIMIT` | `string` | `1mb` | Max request body size for URL-encoded payloads |
| `SERVER_RATE_LIMIT_ENABLE` | `boolean` | `false` | Enable IP-based rate limiting middleware |
| `SERVER_RATE_LIMIT_WINDOW_MS` | `duration` | `15m` | Rate limit sliding window (ms or duration string) |
| `SERVER_RATE_LIMIT_MAX` | `number` | `100` | Maximum requests allowed per rate limit window |
| `SERVER_RATE_LIMIT_MESSAGE` | `string` | `Too many requests, please try again later.` | Error message returned when rate limit is exceeded |
| `SERVER_RATE_LIMIT_STANDARD_HEADERS` | `boolean` | `true` | Send standard `RateLimit-*` headers |
| `SERVER_RATE_LIMIT_LEGACY_HEADERS` | `boolean` | `false` | Send legacy `X-RateLimit-*` headers |
| `SERVER_REQUEST_LOGGING_ENABLE` | `boolean` | `true` in dev, `false` otherwise | Enable automatic request logging middleware |
| `SERVER_REQUEST_LOGGING_SKIP_NOT_FOUND_ROUTES` | `boolean` | `true` | Suppress request logging for 404 Not Found routes |
| `SERVER_TRUST_PROXY_ENABLE` | `boolean` | `false` | Enable Express `trust proxy` setting for reverse proxies |
| `SERVER_OPENAPI_ENABLE` | `boolean` | `false` | Enable Swagger / OpenAPI documentation UI |
| `SERVER_OPENAPI_MOUNT_PATH` | `string` | `/docs` | Path where OpenAPI documentation is mounted |
| `SERVER_OPENAPI_VERBOSE` | `boolean` | `false` | Verbose OpenAPI generator logging |
| `SERVER_OPENAPI_WITH_GLOBAL_PREFIX` | `boolean` | `false` | Apply global route prefix to OpenAPI docs path |
| `SERVER_HEALTH_CHECK_PATH` | `string` | `/healthz` | Express built-in health check endpoint path |
| `SERVER_HEALTH_CHECK_DETAILED_OUTPUT` | `boolean` | `true` | Include individual check results in Express health response |
| `SERVER_HEALTH_CHECK_WITH_GLOBAL_PREFIX` | `boolean` | `false` | Apply global route prefix to Express health check route |
| `SERVER_SKIP_HEALTHZ_CHECKS_VALIDATION` | `boolean` | `false` | Return `200 OK` on `/healthz` without running checks |
| `SERVER_REQUEST_TIMEOUT_MS` | `duration` | `0` | Global HTTP request timeout (0 = disabled) |
| `SERVER_RESPONSE_TIME_ENABLE` | `boolean` | `false` | Enable response time tracking middleware |
| `SERVER_RESPONSE_TIME_ADD_HEADER` | `boolean` | `true` | Add `X-Response-Time` header to outgoing responses |
| `SERVER_RESPONSE_TIME_LOG_ON_COMPLETE` | `boolean` | `false` | Log response duration upon request completion |
| `SERVER_REQUEST_ID_HEADER_NAME` | `string` | `x-request-id` | HTTP header name for request correlation IDs |
| `SERVER_REQUEST_ID_EXPOSE_HEADER` | `boolean` | `true` | Return request ID in outgoing response headers |
| `SERVER_SERVICE_VERSION_ENABLE` | `boolean` | `false` | Add service version header to responses |
| `SERVER_SERVICE_VERSION_HEADER_NAME` | `string` | `x-service-version` | HTTP header name for service version |
| `SERVER_SERVICE_VERSION` | `string` | `${npm_package_version}` or `0.0.0` | Service version string |

---

## Healthz Server Configuration (`HealthzServer`)

Controls the dedicated, standalone HTTP probe server designed for Kubernetes (`livenessProbe`, `readinessProbe`, `startupProbe`) and container orchestration.

| Environment Variable | Type | Default/Value | Description |
| -------------------- | ---- | ------------- | ----------- |
| `HEALTHZ_HOST` | `string` | `0.0.0.0` | Host interface to bind (fallback: `SERVER_HEALTHZ_HOST`, `SERVER_HOST`, `HOST`) |
| `HEALTHZ_PORT` | `number` | `8282` | Port for the standalone probe server (fallback: `SERVER_HEALTHZ_PORT`) |
| `HEALTHZ_PATH` | `string` | `/healthz` | Liveness probe endpoint path (fallback: `SERVER_HEALTHZ_PATH`, `SERVER_HEALTH_CHECK_PATH`) |
| `HEALTHZ_READYZ_PATH` | `string` | `/readyz` | Readiness probe endpoint path (fallback: `SERVER_READYZ_PATH`) |
| `HEALTHZ_STARTUPZ_PATH` | `string` | `/startupz` | Startup probe endpoint path (fallback: `SERVER_STARTUPZ_PATH`) |
| `HEALTHZ_DETAILED` | `boolean` | `true` | Include individual check results in JSON responses (fallback: `SERVER_HEALTH_CHECK_DETAILED_OUTPUT`) |
| `HEALTHZ_CHECK_TIMEOUT_MS` | `duration` | `5000` | Per-check timeout before failing & aborting via AbortSignal (ms or duration) |
| `HEALTHZ_SHUTDOWN_DELAY_MS` | `duration` | `5000` | Graceful shutdown delay for LB draining after unreadying (ms or duration) |

---

## Logger Configuration (`Logger`)

Controls the Pino-based structured logger, logging thresholds, formatting, and file transport.

| Environment Variable | Type | Default/Value | Description |
| -------------------- | ---- | ------------- | ----------- |
| `LOGGER_LEVEL` | `string` | `debug` in dev/test, otherwise `info` | Minimum log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`) |
| `LOGGER_NAME` | `string` | `${npm_package_name}` or `@catbee/utils` | Logger instance identifier tag |
| `LOGGER_PRETTY` | `boolean` | `false` | Enable formatted pretty-print logging output |
| `LOGGER_PRETTY_COLORIZE` | `boolean` | `true` | Colorize pretty-print terminal output |
| `LOGGER_PRETTY_SINGLE_LINE` | `boolean` | `false` | Format pretty logs as single lines |
| `LOGGER_DIR` | `string` | `''` (empty) | Directory path for file logging transport (empty = stdout only) |

---

## Cache Configuration (`Cache`)

Controls default TTL and caching behavior.

| Environment Variable | Type | Default/Value | Description |
| -------------------- | ---- | ------------- | ----------- |
| `CACHE_DEFAULT_TTL_SECONDS` | `number` | `3600` | Default cache entry expiration in seconds (stored internally as ms) |

---

## System & Runtime Variables

General runtime environment and package identity variables automatically detected or provided by Node.js / npm.

| Environment Variable | Type | Default/Value | Description |
| -------------------- | ---- | ------------- | ----------- |
| `NODE_ENV` | `string` | `development` | Application runtime environment (`development`, `production`, `staging`, `testing`) |
| `npm_package_name` | `string` | `@catbee/utils` | Package name from `package.json` |
| `npm_package_version` | `string` | `0.0.0` | Package version from `package.json` |
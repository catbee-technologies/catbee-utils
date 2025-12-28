# @catbee/utils
## Environment Variables

| ENV                                          | Type     | Default/Value                              | Required | Description                         |
| -------------------------------------------- | -------- | ------------------------------------------ | -------- | ----------------------------------- |
| LOGGER_NAME                                  | string   | @catbee/utils                              |          | Logger name (service/module)        |
| LOGGER_LEVEL                                 | string   | info (debug in dev/test)                   |          | Logger verbosity level              |
| LOGGER_PRETTY                                | boolean  | false                                      |          | Enable pretty log formatting        |
| LOGGER_PRETTY_COLORIZE                       | boolean  | true                                       |          | Colorize pretty logs                |
| LOGGER_PRETTY_SINGLE_LINE                    | boolean  | false                                      |          | Single-line pretty logs             |
| LOGGER_DIR                                   | string   | (empty)                                    |          | Directory for log files             |
| CACHE_DEFAULT_TTL_SECONDS                    | number   | 3600                                       |          | Default cache TTL (seconds)         |
| SERVER_PORT                                  | number   | 0 (uses PORT or 3000)                      |          | Server port (overrides PORT)        |
| PORT                                         | number   | 3000                                       |          | Fallback port if SERVER_PORT unset  |
| SERVER_HOST                                  | string   | (empty, uses HOST or 0.0.0.0)              |          | Server host (overrides HOST)        |
| HOST                                         | string   | 0.0.0.0                                    |          | Fallback host if SERVER_HOST unset  |
| SERVER_CORS_ENABLE                           | boolean  | false                                      |          | Enable CORS middleware              |
| SERVER_HELMET_ENABLE                         | boolean  | false                                      |          | Enable Helmet security middleware   |
| SERVER_COMPRESSION_ENABLE                    | boolean  | false                                      |          | Enable response compression         |
| SERVER_BODY_PARSER_JSON_LIMIT                | string   | 1mb                                        |          | Max JSON body size                  |
| SERVER_BODY_PARSER_URLENCODED_LIMIT          | string   | 1mb                                        |          | Max URL-encoded body size           |
| SERVER_COOKIE_PARSER_ENABLE                  | boolean  | false                                      |          | Enable cookie parser middleware     |
| SERVER_IS_MICROSERVICE                       | boolean  | false                                      |          | Microservice mode flag              |
| SERVER_APP_NAME                              | string   | catbee_server (or npm_package_name)        |          | Application/service name            |
| npm_package_name                             | string   | @catbee/utils                              |          | Package name (from package.json)    |
| npm_package_version                          | string   | 0.0.0                                      |          | Package version (from package.json) |
| SERVER_GLOBAL_HEADERS                        | JSON     | {}                                         |          | Global response headers             |
| SERVER_RATE_LIMIT_ENABLE                     | boolean  | false                                      |          | Enable rate limiting                |
| SERVER_RATE_LIMIT_WINDOW_MS                  | duration | 15m                                        |          | Rate limit window (ms or duration)  |
| SERVER_RATE_LIMIT_MAX                        | number   | 100                                        |          | Max requests per window             |
| SERVER_RATE_LIMIT_MESSAGE                    | string   | Too many requests, please try again later. |          | Rate limit error message            |
| SERVER_RATE_LIMIT_STANDARD_HEADERS           | boolean  | true                                       |          | Use standard rate limit headers     |
| SERVER_RATE_LIMIT_LEGACY_HEADERS             | boolean  | false                                      |          | Use legacy rate limit headers       |
| SERVER_REQUEST_LOGGING_ENABLE                | boolean  | true in dev, false otherwise               |          | Enable request logging              |
| SERVER_REQUEST_LOGGING_SKIP_NOT_FOUND_ROUTES | boolean  | true                                       |          | Skip logging for 404 routes         |
| SERVER_TRUST_PROXY_ENABLE                    | boolean  | false                                      |          | Trust proxy headers                 |
| SERVER_OPENAPI_ENABLE                        | boolean  | false                                      |          | Enable OpenAPI docs                 |
| SERVER_OPENAPI_MOUNT_PATH                    | string   | /docs                                      |          | OpenAPI docs mount path             |
| SERVER_OPENAPI_VERBOSE                       | boolean  | false                                      |          | Verbose OpenAPI output              |
| SERVER_OPENAPI_WITH_GLOBAL_PREFIX            | boolean  | false                                      |          | Prefix OpenAPI routes               |
| SERVER_HEALTH_CHECK_PATH                     | string   | /healthz                                   |          | Health check endpoint path          |
| SERVER_HEALTH_CHECK_DETAILED_OUTPUT          | boolean  | true                                       |          | Detailed health check output        |
| SERVER_HEALTH_CHECK_WITH_GLOBAL_PREFIX       | boolean  | false                                      |          | Prefix health check route           |
| SERVER_REQUEST_TIMEOUT_MS                    | duration | 0                                          |          | Request timeout (ms or duration)    |
| SERVER_RESPONSE_TIME_ENABLE                  | boolean  | false                                      |          | Enable response time tracking       |
| SERVER_RESPONSE_TIME_ADD_HEADER              | boolean  | true                                       |          | Add X-Response-Time header          |
| SERVER_RESPONSE_TIME_LOG_ON_COMPLETE         | boolean  | false                                      |          | Log response time on complete       |
| SERVER_REQUEST_ID_HEADER_NAME                | string   | x-request-id                               |          | Request ID header name              |
| SERVER_REQUEST_ID_EXPOSE_HEADER              | boolean  | true                                       |          | Expose request ID header            |
| SERVER_METRICS_ENABLE                        | boolean  | false                                      |          | Enable Prometheus metrics           |
| SERVER_METRICS_PATH                          | string   | /metrics                                   |          | Metrics endpoint path               |
| SERVER_METRICS_WITH_GLOBAL_PREFIX            | boolean  | false                                      |          | Prefix metrics route                |
| SERVER_SERVICE_VERSION_ENABLE                | boolean  | false                                      |          | Enable service version header       |
| SERVER_SERVICE_VERSION_HEADER_NAME           | string   | x-service-version                          |          | Service version header name         |
| SERVER_SERVICE_VERSION                       | string   | 0.0.0                                      |          | Service version value               |
| SERVER_SKIP_HEALTHZ                          | boolean  | false                                      |          | Skip health checks if added         |

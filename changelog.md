# Changelog

## [1.0.5] - 2025-11-09
### Changed
- **Server**
  - request logging ignorePaths check to use startsWith for better path matching.
---

## [1.0.4] - 2025-10-09

### Changed
- **Utils**
  - Reordered parameters in `Env.getEnum` and `Env.getNumberEnum` for improved clarity and usability.
    - New signature: `(key, defaultValue, allowedValues)`.
    - Previous signature: `(key, allowedValues, defaultValue)`.
  - Updated related documentation and examples to reflect this change.

## [1.0.3] - 2025-10-03
### Added
- **Server**
  - Added env `SERVER_SKIP_HEALTHZ` option to allow bypassing health check endpoints.

### Changed
- **Logger**
  - Added env `LOGGER_PRETTY_COLORIZE` option to enable colorized console output for `LOGGER_PRETTY` enabled.
---

## [1.0.2] - 2025-09-27
### Added
- **Controller**
  - Added **version prefix support** for controllers and methods.  
    Example:
    ```ts
    import { Controller, Get, Version } from '@catbee/utils';
    @Version('v1')
    @Controller('users')
    export class UserController {
      @Get()
      getUsers() {}
    }
    ```
    Routes will be exposed as `/v1/users`.

### Fixed
- **Utils**
  - Missing exports: added `date`, `performance`, `stream`, and `type` modules to public API surface.
  - Ensures tree-shakable builds include all expected utilities.

---

## [1.0.1] - 2025-09-25
- **Patch release** with minor metadata updates.  
  (No functional changes to runtime code.)

---

## [1.0.0] - 2025-09-24
### Added
- **Decorators**
  - `@ReqCookie(key?: string)` -> Extract cookies directly into controller parameters.
  - `@ReqId()` -> Injects the current request's unique identifier into controllers/methods.

- **Dependency Injection (DI)**
  - Introduced `DIContainer` for lightweight dependency injection.
  - Added `@Injectable()` decorator for services.
  - Added `@Inject()` decorator for constructor/property injection.

- **HTTP & Utility Decorators**
  - `@Headers` -> Access request headers.
  - `@Cache(ttl)` -> Cache route responses for a configurable TTL.
  - `@RateLimit(limit, window)` -> Apply rate limiting on routes.
  - `@ContentType(type)` -> Override default content type.
  - `@Version(v)` -> Attach version metadata to routes.
  - `@Timeout(ms)` -> Automatically abort long-running requests.
  - `@Log()` -> Enable per-route request logging.

### Changed
- **Logger**
  - **Refactored** logger type from `pino.Logger` -> `PinoLogger` to align with typings.
  - Enhanced `setupLogger`:
    - New `isGlobal` parameter for toggling between global and scoped loggers.
    - Reintroduced serializers for consistent log formatting.
  - `getLogger()` updated to support **fresh instance creation** when needed.

- **Decorators**
  - Decorators enhanced to **support both class-level and method-level usage** for flexibility.

---

## [0.0.7] - 2025-09-07
### Fixed
- **Server**
  - Replaced static imports with **dynamic imports** for optional middleware/features.
  - Prevents errors in environments where some dependencies are not installed.

---

## [0.0.6] - 2025-08-27
### Added
- **Utils**
  - Added `getPaginationParams` utility for handling pagination parameters.

- **Middleware**
  - Added logger in request namespace for enhanced request tracking.

---

## [0.0.5] - 2025-08-22
### Added
- **Server Core**
  - Introduced **production-grade Express server bootstrap**:
    - Security via Helmet, CORS, and configurable rate limiting.
    - Health checks & monitoring endpoints.
    - Graceful shutdown handling.
  - Middleware enhancements for reliability in microservices.

- **Utils**
  - Extended `deepObjMerge`:
    - Handles circular references.
    - Supports merging **special objects** (e.g., Date, Buffer).
    - Improved support for **typed arrays**.
  - Added request utilities for handling HTTP requests.
  - Introduced new utility methods for various operations.

---

## [0.0.4] - 2025-08-17
### Changed
- **Logger**
  - Standardized request ID field: renamed `reqId` -> `requestId`.

### Fixed
- **Server**
  - Correctly typed Express `Request` objects in context middleware.
  - Request context middleware now sets unique request identifiers automatically.

---

## [0.0.3] - 2025-08-16
### Fixed
- **Utils**
  - Fixed incorrect/missing exports in utility modules.
  - Added logger typings for better IDE IntelliSense.

---

## [0.0.2] - 2025-08-15
### Added
- **Decorators**
  - Initial decorator utility set:
    - `@Req()`, `@Res()`, `@Query()`, `@Body()`, etc.
  - Provided core request lifecycle metadata helpers.

---

## [0.0.1] - 2025-08-08
### Added
- **Core Modules**
  - Initial utility helpers for arrays, async handling, and object operations.
  - Context-aware logger using pino.
  - Environment parser and validator with type-safe helpers.
  - Standard error response classes and API response formats.
  - ID generation and validation utilities.

- **Middleware**
  - Core middleware utilities for request/response handling.
  - Foundation for attaching custom middlewares.

---

# Notes
- This project follows **semantic versioning**:
  - **MAJOR** -> Breaking changes.
  - **MINOR** -> Backward-compatible features.
  - **PATCH** -> Fixes and small improvements.

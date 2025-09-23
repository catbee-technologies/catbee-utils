# Decorators Utilities

TypeScript decorators for Express.  
These utilities provide a declarative way to define Express routes, middleware, parameter extraction, response customization, and access control using TypeScript decorators.

## API Decorators Summary

- [**`registerControllers(router: Router, controllers: any[]): void`**](#registercontrollers) - Register all controller classes with the provided router.
- [**`@Controller(basePath: string): ClassDecorator`**](#controller) - Marks a class as a controller with a base path.
- [**`@Get(path: string): MethodDecorator`**](#get) - Define a route for the GET HTTP method.
- [**`@Post(path: string): MethodDecorator`**](#post) - Define a route for the POST HTTP method.
- [**`@Put(path: string): MethodDecorator`**](#put) - Define a route for the PUT HTTP method.
- [**`@Patch(path: string): MethodDecorator`**](#patch) - Define a route for the PATCH HTTP method.
- [**`@Delete(path: string): MethodDecorator`**](#delete) - Define a route for the DELETE HTTP method.
- [**`@Options(path: string): MethodDecorator`**](#options) - Define a route for the OPTIONS HTTP method.
- [**`@Head(path: string): MethodDecorator`**](#head) - Define a route for the HEAD HTTP method.
- [**`@Trace(path: string): MethodDecorator`**](#trace) - Define a route for the TRACE HTTP method.
- [**`@Connect(path: string): MethodDecorator`**](#connect) - Define a route for the CONNECT HTTP method.
- [**`@Use(...middlewares: RequestHandler[]): MethodDecorator & ClassDecorator`**](#use) - Apply Express middleware(s) to a route or controller.
- [**`@Query(key?: string, options?: ParamOptions): ParameterDecorator`**](#query) - Extract query parameters from the request.
- [**`@Param(key?: string, options?: ParamOptions): ParameterDecorator`**](#param) - Extract route parameters from the request.
- [**`@Body(key?: string): ParameterDecorator`**](#body) - Extract body or body property from the request.
- [**`@Req(): ParameterDecorator`**](#req) - Extract the request object.
- [**`@Res(): ParameterDecorator`**](#res) - Extract the response object.
- [**`@ReqHeader(key?: string): ParameterDecorator`**](#reqheader) - Extract request headers.
- [**`@ReqLogger(): ParameterDecorator`**](#reqlogger) - Inject a logger instance.
- [**`@HttpCode(status: number): MethodDecorator`**](#httpcode) - Set a custom HTTP status code for the response.
- [**`@Header(name: string, value: string): MethodDecorator & ClassDecorator`**](#header) - Add a custom HTTP header to the response.
- [**`@Headers(headers: Record<string, string> | string, value?: string): MethodDecorator & ClassDecorator`**](#headers) - Add multiple custom HTTP headers to the response.
- [**`@Before(fn: Function): MethodDecorator & ClassDecorator`**](#before) - Run a function before the route handler.
- [**`@After(fn: Function): MethodDecorator & ClassDecorator`**](#after) - Run a function after the route handler.
- [**`@Redirect(url?: string, statusCode?: number): MethodDecorator`**](#redirect) - Redirect to another URL.
- [**`@Roles(...roles: string[]): MethodDecorator & ClassDecorator`**](#roles) - Require specific roles for accessing a route.
- [**`@Cache(ttlSeconds: number): MethodDecorator & ClassDecorator`**](#cache) - Add caching to route responses.
- [**`@RateLimit(options: RateLimitOptions): MethodDecorator & ClassDecorator`**](#ratelimit) - Apply rate limiting to routes.
- [**`@ContentType(type: string): MethodDecorator & ClassDecorator`**](#contenttype) - Set the content type for responses.
- [**`@Version(version: string, options?: VersionOptions): MethodDecorator & ClassDecorator`**](#version) - Add API versioning to routes.
- [**`@Timeout(ms: number): MethodDecorator & ClassDecorator`**](#timeout) - Set execution timeout for routes.
- [**`@Log(options?: LogOptions): MethodDecorator & ClassDecorator`**](#log) - Add comprehensive logging to routes.
- [**`@Injectable(): ClassDecorator`**](#injectable) - Mark a class as injectable for DI.
- [**`@Inject(targetClass: Constructor): PropertyDecorator`**](#inject) - Inject a dependency into a class property.

---

## Main Methods Overview

These decorators and utilities allow you to:

- Define controllers and routes with HTTP methods and paths.
- Attach Express middleware to routes.
- Extract request parameters, query, body, and inject request/response objects.
- Set custom HTTP status codes and headers.
- Run hooks before and after route handlers.
- Restrict access to routes by user roles.
- Redirect requests to other URLs.
- Add caching, rate limiting, versioning, and timeout handling.
- Implement comprehensive logging and response customization.
- Register controller classes with an Express router.
- Use dependency injection for services and controllers.

---

## Interfaces, Types and Enums

```ts
// Type for supported HTTP methods
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace' | 'connect';

// Route definition for controller methods
interface RouteDefinition {
  path: string;
  method: HttpMethod;
  handlerName: string;
}

// Parameter decoration definition for method parameters
interface ParamDefinition {
  index: number;
  type: 'query' | 'param' | 'body' | 'req' | 'res' | 'logger' | 'reqHeader';
  key?: string;
  options?: ParamOptions;
}

// Parameter options for advanced extraction
interface ParamOptions<T = any> {
  type: 'string' | 'number' | 'boolean';
  dataType?: 'single' | 'array' | 'object';
  delimiter?: string;
  default?: T;
  required?: boolean;
  throwError?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternName?: string;
  validate?: (value: any) => boolean;
  transform?: (value: any) => any;
}

// Rate limiting options interface
interface RateLimitOptions {
  max: number;
  windowMs: number;
  standardHeaders?: boolean; // Default: true
  legacyHeaders?: boolean;   // Default: false
}

// Version decorator options interface
interface VersionOptions {
  addPrefix?: boolean;    // Default: true
  addHeader?: boolean;    // Default: true
  headerName?: string;    // Default: 'X-API-Version'
}

// Log decorator options interface
interface LogOptions {
  logEntry?: boolean;     // Default: true
  logExit?: boolean;      // Default: true
  logBody?: boolean;      // Default: false
  logParams?: boolean;    // Default: false
  logResponse?: boolean;  // Default: false
}

// Example enum for HTTP status codes
enum HttpStatusCodes {
  OK = 200,
  CREATED = 201,
  FORBIDDEN = 403,
  REQUEST_TIMEOUT = 408,
  TOO_MANY_REQUESTS = 429,
  // ...other status codes
}
```

---

## Function Documentation & Usage Examples

### `registerControllers()`
Registers all controller classes with the provided router.

**Method Signature:**
```ts
function registerControllers(router: Router, controllers: any[]): void
```

**Parameters:**
- `router`: An Express router instance.
- `controllers`: An array of controller classes.

**Examples:**
```ts
import express, { Router } from 'express';
import { registerControllers } from '@catbee/utils';
import { ExampleController } from './controllers/example.controller';

const router: Router = express.Router();
registerControllers(router, [ExampleController]);
```

---

### `@Controller()`
Marks a class as a controller with a base path.

**Method Signature:**
```ts
@Controller(basePath: string): ClassDecorator
```

**Parameters:**
- `basePath`: The base path for all routes in the controller.

**Returns:** 
- A class decorator.

**Examples:**
```ts
import { Controller } from '@catbee/utils';

@Controller('/api')
class ExampleController {
  // Controller methods...
}
```

---

### `@Get()`
Defines a route for the GET HTTP method.

**Method Signature:**
```ts
@Get(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Get, Param } from '@catbee/utils';

@Get('/items/:id')
getItem(@Param('id') id: string) {
  return { id };
}
```

---

### `@Post()`
Defines a route for the POST HTTP method.

**Method Signature:**
```ts
@Post(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Post, Body } from '@catbee/utils';

@Post('/items')
createItem(@Body() item: any) {
  return { created: true, item };
}
```

---

### `@Put()`
Defines a route for the PUT HTTP method.

**Method Signature:**
```ts
@Put(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Put, Param, Body } from '@catbee/utils';

@Put('/items/:id')
updateItem(@Param('id') id: string, @Body() update: any) {
  return { id, ...update };
}
```

---

### `@Patch()`
Defines a route for the PATCH HTTP method.

**Method Signature:**
```ts
@Patch(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Patch, Param, Body } from '@catbee/utils';

@Patch('/items/:id')
patchItem(@Param('id') id: string, @Body() patch: any) {
  return { id, ...patch };
}
```

---

### `@Delete()`
Defines a route for the DELETE HTTP method.

**Method Signature:**
```ts
@Delete(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Delete, Param } from '@catbee/utils';

@Delete('/items/:id')
deleteItem(@Param('id') id: string) {
  return { deleted: true, id };
}
```

---

### `@Options()`
Defines a route for the OPTIONS HTTP method.

**Method Signature:**
```ts
@Options(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Options } from '@catbee/utils';

@Options('/items')
optionsItems() {
  return { allowed: ['GET', 'POST'] };
}
```

---

### `@Head()`
Defines a route for the HEAD HTTP method.

**Method Signature:**
```ts
@Head(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Head, Param } from '@catbee/utils';

@Head('/items/:id')
headItem(@Param('id') id: string) {
  // No body returned, just headers
}
```

---

### `@Trace()`
Defines a route for the TRACE HTTP method.

**Method Signature:**
```ts
@Trace(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Trace } from '@catbee/utils';

@Trace('/trace')
traceRoute() {
  return { traced: true };
}
```

---

### `@Connect()`
Defines a route for the CONNECT HTTP method.

**Method Signature:**
```ts
@Connect(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Connect } from '@catbee/utils';

@Connect('/connect')
connectRoute() {
  return { connected: true };
}
```

---

### `@Use()`
Applies Express middleware(s) to a route or entire controller.

**Method Signature:**
```ts
@Use(...middlewares: RequestHandler[]): MethodDecorator & ClassDecorator
```

**Parameters:**
- `...middlewares`: One or more Express middleware functions.

**Returns:** 
- A method decorator or class decorator.

**Examples:**
```ts
import { Use, Get, Req } from '@catbee/utils';
import { authMiddleware, loggingMiddleware } from './middlewares';

// Method-level middleware
@Get('/protected')
@Use(authMiddleware, loggingMiddleware)
getProtected(@Req() req: any) {
  return { user: req.user };
}

// Controller-level middleware
@Controller('/api')
@Use(authMiddleware, loggingMiddleware)
class ApiController {
  // All routes in this controller will use the middleware
  @Get('/me')
  getProfile() {
    return { profile: 'data' };
  }
}
```

---

### `@Query()`
Extracts query parameters from the request with optional type conversion and validation.

**Method Signature:**
```ts
@Query(key?: string, options?: ParamOptions): ParameterDecorator
```

**Parameters:**
- `key`: The query parameter key.
- `options`: Optional parameter options for type conversion, validation, and more.

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Query } from '@catbee/utils';

@Get('/search')
search(
  // Simple usage: Get query parameter as string
  @Query('term') term: string,
  
  // With type conversion: Get page as number with default value
  @Query('page', { type: 'number', default: 1 }) page: number,
  
  // Array conversion: Convert comma-separated list to array of numbers
  @Query('ids', { type: 'number', dataType: 'array' }) ids: number[],
  
  // Required parameter with validation
  @Query('minPrice', { 
    type: 'number',
    required: true, 
    validate: (price) => price > 0 
  }) minPrice: number,
  
  // With custom transformation
  @Query('sort', { 
    transform: (val) => val.toUpperCase(),
    validate: (val) => ['ASC', 'DESC'].includes(val)
  }) sort: string
) {
  return { results: [], term, page, ids, minPrice, sort };
}

@Get('/advanced')
advanced(
  // Custom delimiter for arrays
  @Query('tags', { dataType: 'array', delimiter: '|' }) tags: string[],
  
  // Parse JSON from query parameter
  @Query('filter', { dataType: 'object' }) filter: any,
  
  // Get all query parameters
  @Query() allParams: any
) {
  return { tags, filter, allParams };
}
```

---

### `@Param()`
Extracts route parameters from the request with optional type conversion and validation.

**Method Signature:**
```ts
@Param(key?: string, options?: ParamOptions): ParameterDecorator
```

**Parameters:**
- `key`: The route parameter key.
- `options`: Optional parameter options for type conversion, validation, and more.

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Param } from '@catbee/utils';

@Get('/users/:id')
getUser(
  // Basic usage
  @Param('id') id: string,
  
  // Convert to number with validation
  @Param('id', { 
    type: 'number', 
    validate: (id) => id > 0 
  }) numericId: number
) {
  return { userId: id, numericId };
}

@Get('/items/:category/:itemId')
getItem(
  // Required parameter
  @Param('itemId', { required: true }) itemId: string,
  
  // Convert to boolean
  @Param('inStock', { type: 'boolean' }) inStock: boolean,
  
  // Get all route parameters
  @Param() allParams: any
) {
  return { itemId, inStock, allParams };
}
```

---

### `@Body()`
Extracts body or body property from the request.

**Method Signature:**
```ts
@Body(key?: string): ParameterDecorator
```

**Parameters:**
- `key`: The body property key.

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Post, Body } from '@catbee/utils';

@Post('/users')
createUser(@Body() userData: any) {
  return { created: true, userData };
}

@Post('/update')
updateName(@Body('name') name: string) {
  return { updated: true, name };
}
```

---

### `@Req()`
Injects the entire request object.

**Method Signature:**
```ts
@Req(): ParameterDecorator
```

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Req } from '@catbee/utils';

@Get('/info')
info(@Req() req: any) {
  return { headers: req.headers };
}
```

---

### `@Res()`
Injects the response object.

**Method Signature:**
```ts
@Res(): ParameterDecorator
```

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Res } from '@catbee/utils';

@Get('/custom')
custom(@Res() res: any) {
  res.status(201).send('Created');
}
```

---

### `@ReqHeader()`
Extracts headers from the request.

**Method Signature:**
```ts
@ReqHeader(key?: string): ParameterDecorator
```

**Parameters:**
- `key`: The header name to extract. Case-insensitive.

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, ReqHeader } from '@catbee/utils';

@Get('/data')
getData(
  // Extract specific header
  @ReqHeader('authorization') auth: string,
  
  // Extract content type
  @ReqHeader('content-type') contentType: string,
  
  // Get all headers
  @ReqHeader() allHeaders: any
) {
  return { 
    authorized: auth ? 'yes' : 'no', 
    contentType,
    headers: allHeaders 
  };
}
```

---

### `@ReqLogger()`
Injects a logger instance.

**Method Signature:**
```ts
@ReqLogger(): ParameterDecorator
```

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, ReqLogger } from '@catbee/utils';

@Get('/log')
logData(@ReqLogger() logger: any, @Param('id') id: string) {
  logger.info({ id }, 'Accessing data endpoint');
  return { logged: true };
}

@Post('/items')
createItem(@Body() data: any, @ReqLogger() logger: any) {
  logger.info({ data }, 'Creating new item');
  return { created: true };
}
```

---

### `@HttpCode()`
Sets a custom HTTP status code for the response.

**Method Signature:**
```ts
@HttpCode(status: number): MethodDecorator
```

**Parameters:**
- `status`: The HTTP status code.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Post, HttpCode, Body } from '@catbee/utils';

@Post('/users')
@HttpCode(201)
createUser(@Body() userData: any) {
  return { id: '123', ...userData };
}
```

---

### `@Header()`
Adds a custom HTTP header to the response.

**Method Signature:**
```ts
@Header(name: string, value: string): MethodDecorator & ClassDecorator
```

**Parameters:**
- `name`: The name of the HTTP header.
- `value`: The value of the HTTP header.

**Returns:** 
- A method decorator or class decorator.

**Examples:**
```ts
import { Get, Header } from '@catbee/utils';

@Get('/data')
@Header('Cache-Control', 'max-age=60')
getData() {
  return { data: '...' };
}

@Controller('/api/v1')
@Header('API-Version', 'v1')
class ApiV1Controller {
  // All routes in this controller will include the header
}
```

---

### `@Headers()`
Adds multiple custom HTTP headers to the response.

**Method Signature:**
```ts
@Headers(headers: Record<string, string> | string, value?: string): MethodDecorator & ClassDecorator
```

**Parameters:**
- `headers`: Either an object with header name-value pairs, or a single header name
- `value`: Header value (required when first parameter is a string)

**Returns:** 
- A method decorator or class decorator.

**Examples:**
```ts
import { Get, Headers } from '@catbee/utils';

// Single header
@Get('/data')
@Headers('Cache-Control', 'max-age=60')
getData() {
  return { data: '...' };
}

// Multiple headers
@Get('/secure')
@Headers({
  'Cache-Control': 'max-age=3600',
  'X-Custom-Header': 'custom-value',
  'Content-Security-Policy': "default-src 'self'"
})
getSecureData() {
  return { data: 'secure content' };
}

// Controller-level headers
@Controller('/api/public')
@Headers({
  'Access-Control-Allow-Origin': '*',
  'X-API-Type': 'public'
})
class PublicApiController {
  // All routes in this controller will include these headers
}
```

---

### `@Before()`
Runs a function before the route handler.

**Method Signature:**
```ts
@Before(fn: (req: Request, res: Response) => void): MethodDecorator & ClassDecorator
```

**Parameters:**
- `fn`: A function that takes the request and response objects.

**Returns:** 
- A method decorator or class decorator.

**Examples:**
```ts
import { Before, Get, Param } from '@catbee/utils';

// Method-level hook
@Get('/users/:id')
@Before((req, res) => console.log(`Accessing user ${req.params.id}`))
getUser(@Param('id') id: string) {
  return { id };
}

// Controller-level hook
@Controller('/api')
@Before((req, res) => {
  console.log(`API access: ${req.method} ${req.path}`);
  req.startTime = Date.now();
})
class ApiController {
  // This hook runs before all routes in the controller
  @Get('/data')
  getData() {
    return { data: 'example' };
  }
}
```

---

### `@After()`
Runs a function after the route handler, can access the result.

**Method Signature:**
```ts
@After(fn: (req: Request, res: Response, result: any) => void): MethodDecorator & ClassDecorator
```

**Parameters:**
- `fn`: A function that takes the request, response, and result objects.

**Returns:** 
- A method decorator or class decorator.

**Examples:**
```ts
import { After, Get, Param } from '@catbee/utils';

// Method-level hook
@Get('/users/:id')
@After((req, res, result) => console.log(`User data sent: ${JSON.stringify(result)}`))
getUser(@Param('id') id: string) {
  return { id, name: 'Example' };
}

// Controller-level hook
@Controller('/api')
@After((req, res, result) => {
  const duration = Date.now() - req.startTime;
  console.log(`Request processed in ${duration}ms`);
})
class ApiController {
  // This hook runs after all routes in the controller
  @Get('/data')
  getData() {
    return { data: 'example' };
  }
}
```

---

### `@Redirect()`
Redirects to another URL.

**Method Signature:**
```ts
@Redirect(url?: string, statusCode?: number): MethodDecorator
```

**Parameters:**
- `url`: The URL to redirect to.
- `statusCode`: The HTTP status code for the redirect.

**Returns:** 
- A method decorator.


**Examples:**
```ts
import { Get, Redirect } from '@catbee/utils';

@Get('/old-path')
@Redirect('/new-path', 301)
redirectToNewPath() {}

@Get('/dynamic-redirect')
@Redirect()
getDynamicRedirect() {
  return { url: '/calculated-path', statusCode: 307 };
}
```

---

### `@Roles()`
Requires specific roles for accessing a route.

**Method Signature:**
```ts
@Roles(...roles: string[]): MethodDecorator & ClassDecorator
```

**Parameters:**
- `...roles`: The roles required to access the route.

**Returns:** 
- A method decorator or class decorator.

**Examples:**
```ts
import { Roles, Get, Controller } from '@catbee/utils';

// Method-level roles
@Get('/admin/settings')
@Roles('admin', 'superuser')
getSettings() {
  return { settings: ['a', 'b'] };
}

// Controller-level roles
@Controller('/admin')
@Roles('admin')
class AdminController {
  // All routes in this controller require the 'admin' role
  @Get('/users')
  getUsers() {
    return { users: [] };
  }
  
  // Override controller-level roles for specific methods
  @Get('/metrics')
  @Roles('admin', 'analyst')
  getMetrics() {
    return { metrics: {} };
  }
}
```

---

### `@Cache()`
Adds caching headers to route responses for client-side caching.

**Method Signature:**
```ts
@Cache(ttlSeconds: number): MethodDecorator & ClassDecorator
```

**Parameters:**
- `ttlSeconds`: Time to live in seconds for the cache

**Returns:** 
- A method decorator or class decorator.

**Headers Set:**
- `Cache-Control: public, max-age={ttlSeconds}`

**Examples:**
```ts
import { Get, Cache, Controller } from '@catbee/utils';

// Method-level cache
@Get('/static-data')
@Cache(300) // Cache for 5 minutes
getStaticData() {
  return { data: 'This data changes infrequently' };
}

// Controller-level cache
@Controller('/api/public')
@Cache(60) // Default 1 minute cache for all routes
class PublicApiController {
  // Uses controller-level cache (60 seconds)
  @Get('/countries')
  getCountries() {
    return { countries: [] };
  }
  
  // Override with method-level cache
  @Get('/exchange-rates')
  @Cache(600) // Override with 10 minutes for this specific route
  getExchangeRates() {
    return { rates: {} };
  }
}
```

---

### `@RateLimit()`
Applies rate limiting to routes using express-rate-limit.

**Method Signature:**
```ts
@RateLimit(options: RateLimitOptions): MethodDecorator & ClassDecorator
```

**Parameters:**
- `options.max`: Maximum number of requests allowed in the window
- `options.windowMs`: Time window in milliseconds
- `options.standardHeaders`: Include standard rate limit headers (default: `true`)
- `options.legacyHeaders`: Include legacy rate limit headers (default: `false`)

**Default Options:**
```ts
{
  standardHeaders: true,
  legacyHeaders: false
}
```

**Returns:** 
- A method decorator or class decorator.

**Note:** Requires `express-rate-limit` package to be installed.

**Examples:**
```ts
import { Post, RateLimit, Body, Controller } from '@catbee/utils';

// Method-level rate limit
@Post('/login')
@RateLimit({ max: 5, windowMs: 60000 }) // 5 requests per minute
login(@Body() credentials: any) {
  return this.authService.login(credentials);
}

// Controller-level rate limit
@Controller('/api')
@RateLimit({ max: 100, windowMs: 60 * 1000 }) // 100 requests per minute
class ApiController {
  // All routes use controller-level rate limiting
  @Get('/data')
  getData() {
    return { data: [] };
  }
  
  // Stricter rate limit for sensitive operations
  @Post('/payments')
  @RateLimit({ max: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  processPayment(@Body() payment: any) {
    return { status: 'processing' };
  }
}
```

---

### `@ContentType()`
Sets the content type header for the response.

**Method Signature:**
```ts
@ContentType(type: string): MethodDecorator & ClassDecorator
```

**Parameters:**
- `type`: MIME type for the response

**Returns:** 
- A method decorator or class decorator.

**Headers Set:**
- `Content-Type: {type}`

**Examples:**
```ts
import { Get, ContentType, Controller } from '@catbee/utils';

// Method-level content type
@Get('/download/pdf')
@ContentType('application/pdf')
downloadPdf() {
  return this.fileService.generatePdf();
}

// Controller-level content type
@Controller('/api/xml')
@ContentType('application/xml')
class XmlApiController {
  // All routes return XML content
  @Get('/data')
  getData() {
    return '<data><item>1</item></data>';
  }
  
  // Override with method-level content type
  @Get('/json-data')
  @ContentType('application/json')
  getJsonData() {
    return { data: [1, 2, 3] };
  }
}
```

---

### `@Version()`
Adds API versioning to routes with configurable prefix and header options.

**Method Signature:**
```ts
@Version(version: string, options?: VersionOptions): MethodDecorator & ClassDecorator
```

**Parameters:**
- `version`: Version string for the API endpoint
- `options.addPrefix`: Add version prefix to the route path (default: `true`)
- `options.addHeader`: Add version header to the response (default: `true`)
- `options.headerName`: Name of the version header (default: `'X-API-Version'`)

**Default Options:**
```ts
{
  addPrefix: true,
  addHeader: true,
  headerName: 'X-API-Version'
}
```

**Returns:** 
- A method decorator or class decorator.

**Examples:**
```ts
import { Get, Version, Controller } from '@catbee/utils';

// Method-level versioning
@Get('/users')
@Version('v2') // Route becomes /v2/users, adds X-API-Version: v2 header
getUsersV2() {
  return this.userService.findAllV2();
}

// Controller-level versioning
@Controller('/api')
@Version('v3')
class ApiV3Controller {
  // All routes are prefixed with /v3 and include X-API-Version: v3 header
  @Get('/users')
  getUsers() {
    return { users: [] };
  }
  
  // Method-level versioning overrides controller-level
  @Get('/experimental')
  @Version('v4')
  getExperimental() {
    return { experimental: true };
  }
}
```

---

### `@Timeout()`
Sets execution timeout for route handlers to prevent long-running requests.

**Method Signature:**
```ts
@Timeout(ms: number): MethodDecorator & ClassDecorator
```

**Parameters:**
- `ms`: Timeout duration in milliseconds

**Returns:** 
- A method decorator or class decorator.

**Behavior:**
- If the route handler takes longer than the specified time, a 408 Request Timeout response is sent
- The handler execution is not cancelled, but the response is sent early

**Examples:**
```ts
import { Get, Timeout, Controller } from '@catbee/utils';

// Method-level timeout
@Get('/slow-operation')
@Timeout(30000) // 30 second timeout
async slowOperation() {
  return await this.heavyService.processLargeDataset();
}

// Controller-level timeout
@Controller('/api/reports')
@Timeout(60000) // 1 minute default timeout
class ReportsController {
  // Uses controller-level timeout (60 seconds)
  @Get('/daily')
  async getDailyReport() {
    return await this.reportService.generateDaily();
  }
  
  // Override with method-level timeout
  @Get('/annual')
  @Timeout(120000) // 2 minutes for this specific operation
  async getAnnualReport() {
    return await this.reportService.generateAnnual();
  }
}
```

---

### `@Log()`
Adds comprehensive logging to routes for monitoring and debugging.

**Method Signature:**
```ts
@Log(options?: LogOptions): MethodDecorator & ClassDecorator
```

**Parameters:**
- `options.logEntry`: Log when the route handler starts (default: `true`)
- `options.logExit`: Log when the route handler completes (default: `true`)
- `options.logBody`: Include request body in logs (default: `false`)
- `options.logParams`: Include request parameters and query in logs (default: `false`)
- `options.logResponse`: Include response data in logs (default: `false`)

**Default Options:**
```ts
{
  logEntry: true,
  logExit: true,
  logBody: false,
  logParams: false,
  logResponse: false
}
```

**Returns:** 
- A method decorator or class decorator.

**Log Information:**
- Entry logs: method, URL, user agent, timestamp
- Exit logs: method, URL, status code, execution duration
- Optional: request parameters, body, and response data

**Examples:**
```ts
import { Post, Log, Body, Param, Controller } from '@catbee/utils';

// Method-level logging
@Post('/users')
@Log()
createUser(@Body() userData: any) {
  return this.userService.create(userData);
}

// Controller-level logging
@Controller('/api')
@Log({ logEntry: true, logExit: true, logParams: true })
class ApiController {
  // Uses controller-level logging configuration
  @Get('/users/:id')
  getUser(@Param('id') id: string) {
    return { id, name: 'Test' };
  }
  
  // Override with method-level logging
  @Post('/orders')
  @Log({
    logEntry: true,
    logExit: true,
    logBody: true,
    logParams: true,
    logResponse: false // Don't log response for security
  })
  createOrder(@Body() orderData: any) {
    return this.orderService.create(orderData);
  }
}
```

---

### `@Injectable()`
Marks a class as injectable for dependency injection.

**Method Signature:**
```ts
@Injectable(): ClassDecorator
```

**Returns:** 
- A class decorator.

**Examples:**
```ts
import { Injectable } from '@catbee/utils';

@Injectable()
class UserService {
  findAll() { /* ... */ }
}
```

---

### `@Inject()`
Injects a dependency into a class property or via constructor.

**Method Signature:**
```ts
@Inject(targetClass: Constructor): PropertyDecorator
```

**Parameters:**
- `targetClass`: The class to inject.

**Returns:** 
- A property decorator.

**Examples (Property Injection):**
```ts
import { Injectable, Inject, Controller } from '@catbee/utils';

@Injectable()
class UserService {
  getUser() { /* ... */ }
}

@Controller('/api/users')
class UserController {
  @Inject(UserService)
  userService!: UserService;
}
```

**Examples (Constructor Injection):**
```ts
import { Injectable, Controller } from '@catbee/utils';

@Injectable()
class UserService {
  getUser() { /* ... */ }
}

@Controller('/api/users')
class UserController {
  constructor(public userService: UserService) {}
}
```

---


### `inject()`
A function to manually inject a dependency outside of class decorators.

**Method Signature:**
```ts
function inject<T>(targetClass: Constructor<T>): T
```
**Parameters:**
- `targetClass`: The class to inject.

**Examples:**
```ts
import { inject, Controller } from '@catbee/utils';

@Injectable()
class UserService {
  getUser() { /* ... */ }
}

@Controller('/api/users')
class UserController {
  userService = inject(UserService);
}
```

---

## Controller-Level Decorator Inheritance

Many decorators can be applied at the controller level and will be inherited by all methods in that controller, unless overridden at the method level.

**Inheritable Decorators:**
- `@Headers()`
- `@Before()`
- `@After()`
- `@Cache()`
- `@RateLimit()`
- `@Version()`
- `@Timeout()`
- `@Log()`
- `@Roles()`
- `@ContentType()`
- `@Use()`

**Examples:**
```ts
import { Controller, Get, Post, Cache, Headers, Roles, Version, Use, ContentType, Before, After } from '@catbee/utils';
import { authMiddleware, loggingMiddleware } from './middleware';

@Controller('/api/admin')
@Cache(300) // All routes cached for 5 minutes by default
@Headers({ 'X-Admin-API': 'true' }) // All routes get this header
@Roles('admin') // All routes require admin role
@Version('v2') // All routes are v2
@Use(authMiddleware, loggingMiddleware) // All routes use these middlewares
@ContentType('application/json') // All routes return JSON
@Before((req, res) => console.log(`Admin API request: ${req.method} ${req.path}`))
@After((req, res, result) => console.log(`Admin API response sent in ${Date.now() - req.startTime}ms`))
class AdminController {
  
  @Get('/users')
  // Inherits: @Cache(300), @Headers({'X-Admin-API': 'true'}), @Roles('admin'), 
  // @Version('v2'), @Use(...), @ContentType('application/json'), @Before(...), @After(...)
  getUsers() {
    return this.userService.findAll();
  }
  
  @Get('/stats')
  @Cache(60) // Overrides controller-level cache to 1 minute
  @Headers({ 'X-Fresh-Data': 'true' }) // Merges with controller headers
  getStats() {
    return this.statsService.getAdminStats();
  }
  
  @Post('/settings')
  @Roles('superadmin') // Overrides controller-level roles
  @ContentType('application/xml') // Overrides controller-level content type
  updateSettings(@Body() settings: any) {
    return this.settingsService.update(settings);
  }
}
```

---

## Error Handling

The decorators include built-in error handling for various scenarios:

**Rate Limiting:** Returns 429 Too Many Requests when rate limit is exceeded.
**Timeout:** Returns 408 Request Timeout when execution exceeds the specified time.
**Roles:** Returns 403 Forbidden when user lacks required roles.
**General Errors:** All unhandled errors are passed to Express error middleware via `next(err)`.

**Example Error Responses:**
```json
// Rate limit exceeded
{
  "error": true,
  "message": "Too Many Requests",
  "status": 429,
  "timestamp": "2025-01-08T10:30:00.000Z",
  "requestId": "12345678-1234-1234-1234-123456789012"
}

// Insufficient roles
{
  "error": true,
  "message": "Forbidden Insufficient Roles",
  "status": 403,
  "timestamp": "2025-01-08T10:30:00.000Z",
  "requestId": "12345678-1234-1234-1234-123456789012"
}

// Request timeout
{
  "error": true,
  "message": "Request timed out",
  "status": 408,
  "timestamp": "2025-01-08T10:30:00.000Z",
  "requestId": "12345678-1234-1234-1234-123456789012"
}
```

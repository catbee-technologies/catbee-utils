/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies. https://catbee-utils.npm.hprasath.com/license
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

import type { Request, RequestHandler, Response, Router } from 'express';
import 'reflect-metadata';
import { getLogger } from './logger.utils';
import { createFinalErrorResponse } from './response.utils';
import { HttpStatusCodes } from './http-status-codes';
import { rateLimit } from 'express-rate-limit';
import { TTLCache } from './cache.utils';

// Metadata keys
const ROUTES_KEY = Symbol('routes');
const MIDDLEWARE_KEY = Symbol('middlewares');
const PARAMS_KEY = Symbol('params');
const HTTP_CODE_KEY = Symbol('httpCode');
const HEADER_KEY = Symbol('headers');
const BEFORE_KEY = Symbol('before');
const AFTER_KEY = Symbol('after');
const ROLES_KEY = Symbol('roles');
const REDIRECT_KEY = Symbol('redirect');
const CACHE_KEY = Symbol('cache');
const RATE_LIMIT_KEY = Symbol('rateLimit');
const CONTENT_TYPE_KEY = Symbol('contentType');
const VERSION_KEY = Symbol('version');
const TIMEOUT_KEY = Symbol('timeout');
const LOG_KEY = Symbol('log');

/**
 * Supported HTTP methods for route decorators
 */
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace' | 'connect';

/**
 * Represents a route definition for controller methods
 */
interface RouteDefinition {
  /** The URL path for this route */
  path: string;
  /** HTTP method for this route */
  method: HttpMethod;
  /** Name of the handler method in the controller class */
  handlerName: string;
}

/**
 * Parameter decoration definition for method parameters
 */
interface ParamDefinition {
  /** Parameter position in method signature */
  index: number;
  /** Type of parameter (query, body, etc.) */
  type: 'query' | 'param' | 'body' | 'req' | 'res';
  /** Optional key for extracting specific property */
  key?: string;
}

type CachedRateLimiter = {
  limiter: ReturnType<typeof rateLimit>;
  config: string;
};

/**
 * RateLimiter cache that uses TTLCache for automatic TTL and LRU handling.
 */
class RateLimiterCache {
  private cache: TTLCache<string, CachedRateLimiter>;

  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
    this.cache = new TTLCache<string, CachedRateLimiter>({
      maxSize,
      ttlMs
    });
  }

  private generateKey(options: {
    max: number;
    windowMs: number;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  }): string {
    return `${options.max}:${options.windowMs}:${options.standardHeaders}:${options.legacyHeaders}`;
  }

  get(options: {
    max: number;
    windowMs: number;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  }): ReturnType<typeof rateLimit> {
    const key = this.generateKey(options);

    const cached = this.cache.get(key);
    if (cached) {
      return cached.limiter;
    }

    // Create new limiter
    const limiter = rateLimit({
      ...options,
      handler: (req: Request, res: Response) => {
        const errorResponse = createFinalErrorResponse(req, HttpStatusCodes.TOO_MANY_REQUESTS, 'Too Many Requests');
        res.status(HttpStatusCodes.TOO_MANY_REQUESTS).json(errorResponse);
      }
    });

    // Store in cache
    this.cache.set(key, {
      limiter,
      config: key
    });

    return limiter;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size();
  }

  destroy(): void {
    this.cache.destroy();
  }
}

// Global cache instance
const rateLimiterCache = new RateLimiterCache();

// di.container.ts
type Constructor<T = any> = new (...args: any[]) => T;

export class DIContainer {
  private instances = new Map<Constructor, any>();
  private constructing = new Map<Constructor, any>();

  register<T>(target: Constructor<T>) {
    // Mark as injectable, but do not instantiate yet
    if (!this.instances.has(target) && !this.constructing.has(target)) {
      // No-op: instantiation is deferred until get()
    }
  }

  get<T>(target: Constructor<T>): T {
    // Return existing instance if available
    if (this.instances.has(target)) {
      return this.instances.get(target);
    }

    // If currently constructing, return the proxy (for circular refs)
    if (this.constructing.has(target)) {
      return this.constructing.get(target);
    }

    // Mark as constructing (for circular dependency support)
    let proxy: any = {};
    this.constructing.set(target, proxy);

    // Resolve constructor dependencies
    const paramTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', target as object) || [];
    const dependencies = paramTypes.map(dep => this.get(dep));
    const instance = new target(...dependencies);

    // Copy instance properties to proxy (for circular refs)
    Object.assign(proxy, instance);

    // Replace proxy with real instance
    this.instances.set(target, proxy);
    this.constructing.delete(target);

    // Copy prototype (for instanceof checks)
    Object.setPrototypeOf(proxy, target.prototype);

    return proxy;
  }

  clear() {
    this.instances.clear();
    this.constructing.clear();
  }
}

const diContainer = new DIContainer();

function normalizeHeaderValue(value: unknown): string | string[] | undefined {
  if (typeof value === 'undefined') return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value;
  }
  return String(value);
}

/**
 * Injectable decorator for marking classes as injectable.
 *
 * @returns Class decorator that marks a class as injectable and registers it with the DI container.
 */
export function Injectable(): ClassDecorator {
  return target => {
    Reflect.defineMetadata('injectable', true, target);
    diContainer.register(target as any);
  };
}

/**
 * Inject decorator for injecting dependencies into class properties.
 *
 * @param targetClass - The class to inject
 * @returns Property decorator that injects the specified class into the property
 */
export function Inject<T>(targetClass: new (...args: any[]) => T): PropertyDecorator {
  return (target, propertyKey) => {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return diContainer.get(targetClass);
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * Factory function that creates HTTP method decorators.
 *
 * @param method - HTTP method to create decorator for
 * @returns A method decorator function
 */
function createRouteDecorator(method: HttpMethod) {
  return (path: string): MethodDecorator => {
    return (target, propertyKey, _descriptor) => {
      const routes: RouteDefinition[] = Reflect.getMetadata(ROUTES_KEY, (target as object).constructor) || [];
      routes.push({
        path,
        method,
        handlerName: propertyKey as string
      });
      Reflect.defineMetadata(ROUTES_KEY, routes, (target as object).constructor);
    };
  };
}

/**
 * Decorator for GET HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/users')
 * getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 */
export const Get = createRouteDecorator('get');

/**
 * Decorator for POST HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Post('/users')
 * createUser(@Body() userData: any) {
 *   return this.userService.create(userData);
 * }
 * ```
 */
export const Post = createRouteDecorator('post');

/**
 * Decorator for PUT HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 */
export const Put = createRouteDecorator('put');

/**
 * Decorator for PATCH HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 */
export const Patch = createRouteDecorator('patch');

/**
 * Decorator for DELETE HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 */
export const Delete = createRouteDecorator('delete');

/**
 * Decorator for OPTIONS HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 */
export const Options = createRouteDecorator('options');

/**
 * Decorator for HEAD HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 */
export const Head = createRouteDecorator('head');

/**
 * Decorator for TRACE HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 */
export const Trace = createRouteDecorator('trace');

/**
 * Decorator for CONNECT HTTP method routes.
 *
 * @param path - URL path for the route
 * @returns Method decorator
 */
export const Connect = createRouteDecorator('connect');

/**
 * Decorator that marks a class as a controller with a base path.
 * Used as the entry point for routing configuration.
 *
 * @param basePath - Base URL path for all routes in this controller
 * @returns Class decorator
 *
 * @example
 * ```ts
 * @Controller('/api/users')
 * class UserController {
 *   // Controller methods...
 * }
 * ```
 */
export function Controller(basePath: string): ClassDecorator {
  return target => {
    Reflect.defineMetadata('basePath', basePath, target);
  };
}

/**
 * Decorator that applies middleware to a controller method.
 * Multiple middlewares can be applied and will execute in order.
 *
 * @param middlewares - Express middleware functions to apply
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/protected')
 * @Use(authMiddleware, loggingMiddleware)
 * getProtectedResource() {
 *   // This route is protected by auth middleware
 * }
 * ```
 */
export function Use(...middlewares: RequestHandler[]): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const existing: RequestHandler[] =
      Reflect.getMetadata(MIDDLEWARE_KEY, target as object, propertyKey as string) || [];
    Reflect.defineMetadata(MIDDLEWARE_KEY, [...existing, ...middlewares], target as object, propertyKey as string);
  };
}

/**
 * Factory function that creates parameter decorators.
 *
 * @param type - Parameter type to extract from request
 * @param key - Optional fixed key for extraction
 * @returns Parameter decorator function
 */
function createParamDecorator(type: ParamDefinition['type'], key?: string) {
  return (paramKey?: string): ParameterDecorator => {
    return (target, propertyKey, parameterIndex) => {
      const params: ParamDefinition[] = Reflect.getMetadata(PARAMS_KEY, target as object, propertyKey as string) || [];
      // Ensure parameters are ordered by index
      params.push({ index: parameterIndex, type, key: paramKey || key });
      params.sort((a, b) => a.index - b.index);
      Reflect.defineMetadata(PARAMS_KEY, params, target as object, propertyKey as string);
    };
  };
}

/**
 * Decorator that extracts query parameters from request.
 *
 * @param paramKey - Optional key to extract specific query parameter
 * @returns Parameter decorator
 *
 * @example
 * ```ts
 * @Get('/search')
 * search(@Query('term') searchTerm: string) {
 *   // searchTerm will contain the value of req.query.term
 * }
 * ```
 */
export const Query = createParamDecorator('query');

/**
 * Decorator that extracts route parameters from request.
 *
 * @param paramKey - Optional key to extract specific route parameter
 * @returns Parameter decorator
 *
 * @example
 * ```ts
 * @Get('/users/:id')
 * getUser(@Param('id') userId: string) {
 *   // userId will contain the value of req.params.id
 * }
 * ```
 */
export const Param = createParamDecorator('param');

/**
 * Decorator that extracts body or body property from request.
 *
 * @param paramKey - Optional key to extract specific body property
 * @returns Parameter decorator
 *
 * @example
 * ```ts
 * @Post('/users')
 * createUser(@Body() userData: any) {
 *   // userData will contain the entire req.body
 * }
 *
 * @Post('/update')
 * updateName(@Body('name') name: string) {
 *   // name will contain the value of req.body.name
 * }
 * ```
 */
export const Body = createParamDecorator('body');

/**
 * Decorator that injects the entire request object.
 *
 * @returns Parameter decorator
 *
 * @example
 * ```ts
 * @Get('/complex')
 * complex(@Req() req: Request) {
 *   // Access the full request object
 *   console.log(req.headers);
 * }
 * ```
 */
export const Req = createParamDecorator('req');

/**
 * Decorator that injects the response object.
 *
 * @returns Parameter decorator
 *
 * @example
 * ```ts
 * @Get('/custom')
 * custom(@Res() res: Response) {
 *   // Direct access to response object
 *   return res.status(201).send('Created');
 * }
 * ```
 */
export const Res = createParamDecorator('res');

/**
 * Decorator that sets a custom HTTP status code for a response.
 *
 * @param status - HTTP status code to use
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Post('/users')
 * @HttpCode(201)
 * createUser(@Body() userData: any) {
 *   // Response will have 201 Created status code
 *   return { id: '123', ...userData };
 * }
 * ```
 */
export function HttpCode(status: number): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(HTTP_CODE_KEY, status, target, propertyKey as string);
  };
}

/**
 * Decorator that adds a custom HTTP header to the response.
 *
 * @param header - Header name-value pairs or a single header name and value
 * @param value - Header value if a single header name is provided
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/data')
 * @Header('Cache-Control', 'max-age=60')
 * getData() {
 *   // Response will include the Cache-Control header
 *   return { data: '...' };
 * }
 */
export function Header(name: string, value: string): MethodDecorator & ClassDecorator {
  return Headers(name, value);
}

/**
 * Decorator that adds a custom HTTP headers to the response.
 *
 * @param headers - Header name-value pairs or a single header name and value
 * @param value - Header value if a single header name is provided
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/data')
 * @Headers('Cache-Control', 'max-age=60')
 * getData() {
 *   // Response will include the Cache-Control header
 *   return { data: '...' };
 * }
 *
 * @Get('/data/:id')
 * @Headers({
 *   'Cache-Control': 'max-age=60',
 *   'X-Custom-Header': 'custom-value',
 *   'Content-Security-Policy': "default-src 'self'"
 * })
 * getData() {
 *   // Response will include all specified headers
 *   return { data: '...' };
 * }
 *
 * ```
 */
export function Headers(headers: Record<string, string> | string, value?: string): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol) => {
    if (typeof propertyKey === 'undefined') {
      // Class decorator
      const existing: Record<string, string> = Reflect.getMetadata(HEADER_KEY, target as object) || {};
      const newHeaders = typeof headers === 'string' ? { [headers]: value! } : headers;
      Reflect.defineMetadata(HEADER_KEY, { ...existing, ...newHeaders }, target as object);
    } else {
      // Method decorator
      const existing: Record<string, string> = Reflect.getMetadata(HEADER_KEY, target as object, propertyKey) || {};
      const newHeaders = typeof headers === 'string' ? { [headers]: value! } : headers;
      Reflect.defineMetadata(HEADER_KEY, { ...existing, ...newHeaders }, target as object, propertyKey);
    }
  };
}

/**
 * Decorator that registers a function to run before route handler execution.
 * Useful for pre-processing or logging.
 *
 * @param fn - Function to execute before the handler
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/users/:id')
 * @Before((req, res) => console.log(`Accessing user ${req.params.id}`))
 * getUser(@Param('id') id: string) {
 *   // Function will log before this handler runs
 * }
 * ```
 */
export function Before(fn: Function): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const hooks: Function[] = Reflect.getMetadata(BEFORE_KEY, target as object, propertyKey as string) || [];
    hooks.push(fn);
    Reflect.defineMetadata(BEFORE_KEY, hooks, target as object, propertyKey as string);
  };
}

/**
 * Decorator that registers a function to run after route handler execution.
 * Can access the handler's result.
 *
 * @param fn - Function to execute after the handler
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/users/:id')
 * @After((req, res, result) => console.log(`User data sent: ${JSON.stringify(result)}`))
 * getUser(@Param('id') id: string) {
 *   // After this handler, the function will log the returned data
 *   return { id, name: 'Example' };
 * }
 * ```
 */
export function After(fn: Function): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const hooks: Function[] = Reflect.getMetadata(AFTER_KEY, target as object, propertyKey as string) || [];
    hooks.push(fn);
    Reflect.defineMetadata(AFTER_KEY, hooks, target as object, propertyKey as string);
  };
}

/**
 * Decorator that requires specific roles for accessing a route.
 * Must be used with authentication middleware.
 *
 * Check req.user.roles for user roles[].
 *
 * @param roles - List of roles that can access this route
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/admin/settings')
 * @Roles('admin', 'superuser')
 * getSettings() {
 *   // Only admins and superusers can access
 *   return { settings: [...] };
 * }
 * ```
 */
export function Roles(...roles: string[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {
    if (typeof propertyKey === 'undefined') {
      // Class decorator
      Reflect.defineMetadata(ROLES_KEY, roles, target as object);
    } else {
      // Method decorator
      Reflect.defineMetadata(ROLES_KEY, roles, target as object, propertyKey as string);
    }
  };
}

/**
 * Decorator that redirects to another URL.
 *
 * @param url - URL to redirect to (can be absolute or relative)
 * @param statusCode - HTTP status code for redirect (default: 302)
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/old-path')
 * @Redirect('/new-path', 301)
 * redirectToNewPath() {
 *   // This method won't be executed; automatic redirect happens
 * }
 *
 * @Get('/dynamic-redirect')
 * @Redirect()
 * getDynamicRedirect() {
 *   // Return an object with url and optionally statusCode
 *   return { url: '/calculated-path', statusCode: 307 };
 * }
 * ```
 */
export function Redirect(url?: string, statusCode: number = 302): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    // Store the redirect information in metadata
    Reflect.defineMetadata(REDIRECT_KEY, { url, statusCode }, target, propertyKey as string);
    return descriptor;
  };
}

/**
 * Decorator that adds caching to a route response.
 *
 * @param ttlSeconds - Time to live in seconds for the cache
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/data')
 * @Cache(300) // Cache for 5 minutes
 * getData() {
 *   return { data: 'expensive operation result' };
 * }
 * ```
 */
export function Cache(ttlSeconds: number): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {
    if (typeof propertyKey === 'undefined') {
      // Class decorator
      Reflect.defineMetadata(CACHE_KEY, { ttlSeconds }, target as object);
    } else {
      // Method decorator
      Reflect.defineMetadata(CACHE_KEY, { ttlSeconds }, target as object, propertyKey as string);
    }
  };
}

/**
 * Decorator that applies rate limiting to a route.
 * Note: Requires 'express-rate-limit' package to be installed.
 *
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Method decorator
 *
 * Default Options:
 *  - standardHeaders: true
 *  - legacyHeaders: false
 *
 * @example
 * ```ts
 * @Post('/login')
 * @RateLimit({ max: 5, windowMs: 60000, standardHeaders: true, legacyHeaders: false }) // 5 requests per minute
 * login(@Body() credentials: LoginDto) {
 *   return this.authService.login(credentials);
 * }
 * ```
 */
export function RateLimit(options: {
  max: number;
  windowMs: number;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}): MethodDecorator & ClassDecorator {
  const opts = {
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  };
  return (target: any, propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {
    if (typeof propertyKey === 'undefined') {
      // Class decorator
      Reflect.defineMetadata(RATE_LIMIT_KEY, opts, target as object);
    } else {
      // Method decorator
      Reflect.defineMetadata(RATE_LIMIT_KEY, opts, target as object, propertyKey as string);
    }
  };
}

/**
 * Decorator that sets the content type for the response.
 *
 * @param type - MIME type for the response
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/download')
 * @ContentType('application/pdf')
 * downloadPdf() {
 *   return this.fileService.generatePdf();
 * }
 * ```
 */
export function ContentType(type: string): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(CONTENT_TYPE_KEY, { type }, target, propertyKey as string);
  };
}

/**
 * Decorator that adds API versioning to a route.
 *
 * @param version - Version string for the API endpoint
 * @param options - Versioning options
 * @returns Method decorator
 *
 * Default Options:
 *  - addPrefix: true
 *  - addHeader: true
 *  - headerName: 'X-API-Version'
 *
 * @example
 * ```ts
 *
 * @Get('/users')
 * @Version('v2')
 * getUsersV2() {
 *   return this.userService.findAllV2();
 * }
 *
 * @Get('/users')
 * @Version('v2', { addPrefix: true, addHeader: true, headerName: 'X-API-Version' })
 * getUsersV2() {
 *   // Route becomes /v2/users
 *   return this.userService.findAllV2();
 * }
 * ```
 */
export function Version(
  version: string,
  options?: { addPrefix?: boolean; addHeader?: boolean; headerName?: string }
): MethodDecorator & ClassDecorator {
  const opts = {
    addPrefix: true,
    addHeader: true,
    headerName: 'X-API-Version',
    ...options
  };

  return (target: any, propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {
    if (typeof propertyKey === 'undefined') {
      // Class decorator
      Reflect.defineMetadata(VERSION_KEY, { version, options: opts }, target as object);
    } else {
      // Method decorator
      Reflect.defineMetadata(VERSION_KEY, { version, options: opts }, target as object, propertyKey as string);
    }
  };
}

/**
 * Decorator that sets a timeout for route execution.
 *
 * @param ms - Timeout in milliseconds
 * @returns Method decorator
 *
 * @example
 * ```ts
 * @Get('/slow-operation')
 * @Timeout(30000) // 30 second timeout
 * slowOperation() {
 *   return this.heavyService.processData();
 * }
 * ```
 */
export function Timeout(ms: number): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {
    if (typeof propertyKey === 'undefined') {
      // Class decorator
      Reflect.defineMetadata(TIMEOUT_KEY, { ms }, target as object);
    } else {
      // Method decorator
      Reflect.defineMetadata(TIMEOUT_KEY, { ms }, target as object, propertyKey as string);
    }
  };
}

/**
 * Decorator that adds comprehensive logging to a route.
 *
 * @param options - Logging configuration options
 * @returns Method decorator
 *
 * Default Options:
 *  - logEntry: true
 *  - logExit: true
 *  - logBody: false
 *  - logParams: false
 *  - logResponse: false
 *
 * @example
 * ```ts
 * @Post('/users')
 * @Log({
 *   logEntry: true,
 *   logExit: true,
 *   logBody: true,
 *   logParams: true,
 *   logResponse: false
 * })
 * createUser(@Body() userData: any) {
 *   return this.userService.create(userData);
 * }
 * ```
 */
export function Log(options?: {
  logEntry?: boolean;
  logExit?: boolean;
  logBody?: boolean;
  logParams?: boolean;
  logResponse?: boolean;
}): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {
    const config = {
      logEntry: true,
      logExit: true,
      logBody: false,
      logParams: false,
      logResponse: false,
      ...options
    };
    if (typeof propertyKey === 'undefined') {
      // Class decorator
      Reflect.defineMetadata(LOG_KEY, config, target as object);
    } else {
      // Method decorator
      Reflect.defineMetadata(LOG_KEY, config, target as object, propertyKey as string);
    }
  };
}

/**
 * Registers all controller classes with the provided router.
 * This function processes all decorators and sets up the Express routes.
 *
 * @param router - Express router instance
 * @param controllers - Array of controller classes
 */
export function registerControllers(router: Router, controllers: any[]) {
  controllers.forEach(ControllerClass => {
    // Use DI container to resolve controller (constructor injection + property injection)
    const instance = diContainer.get(ControllerClass);
    const basePath: string = Reflect.getMetadata('basePath', ControllerClass as object) || '';
    const routes: RouteDefinition[] = Reflect.getMetadata(ROUTES_KEY, ControllerClass as object) || [];

    // Get controller-level decorators (fallback values)
    const controllerRateLimit = Reflect.getMetadata(RATE_LIMIT_KEY, ControllerClass as object);
    const controllerCache = Reflect.getMetadata(CACHE_KEY, ControllerClass as object);
    const controllerTimeout = Reflect.getMetadata(TIMEOUT_KEY, ControllerClass as object);
    const controllerVersion = Reflect.getMetadata(VERSION_KEY, ControllerClass as object);
    const controllerRoles = Reflect.getMetadata(ROLES_KEY, ControllerClass as object);
    const controllerLogConfig = Reflect.getMetadata(LOG_KEY, ControllerClass as object);
    const controllerHeaders = Reflect.getMetadata(HEADER_KEY, ControllerClass as object) || {};

    routes.forEach(({ path, method, handlerName }) => {
      const middlewares: RequestHandler[] = Reflect.getMetadata(MIDDLEWARE_KEY, instance as object, handlerName) || [];
      const params: ParamDefinition[] = Reflect.getMetadata(PARAMS_KEY, instance as object, handlerName) || [];

      const httpCode: number | undefined = Reflect.getMetadata(HTTP_CODE_KEY, instance as object, handlerName);

      // Merge controller-level and method-level headers
      const methodHeaders: Record<string, string> =
        Reflect.getMetadata(HEADER_KEY, instance as object, handlerName) || {};
      const headers = { ...controllerHeaders, ...methodHeaders };

      const beforeHooks: Function[] = Reflect.getMetadata(BEFORE_KEY, instance as object, handlerName) || [];
      const afterHooks: Function[] = Reflect.getMetadata(AFTER_KEY, instance as object, handlerName) || [];
      const redirect: { url?: string; statusCode: number } | undefined = Reflect.getMetadata(
        REDIRECT_KEY,
        instance as object,
        handlerName
      );
      const contentType: { type: string } | undefined = Reflect.getMetadata(
        CONTENT_TYPE_KEY,
        instance as object,
        handlerName
      );

      // Use method-level decorators if present, otherwise fall back to controller-level
      const roles: string[] = Reflect.getMetadata(ROLES_KEY, instance as object, handlerName) || controllerRoles || [];
      const cache: { ttlSeconds: number } | undefined =
        Reflect.getMetadata(CACHE_KEY, instance as object, handlerName) || controllerCache;
      const rateLimitOptions:
        | { max: number; windowMs: number; standardHeaders: boolean; legacyHeaders: boolean }
        | undefined = Reflect.getMetadata(RATE_LIMIT_KEY, instance as object, handlerName) || controllerRateLimit;
      const version:
        | { version: string; options: { addPrefix: boolean; addHeader: boolean; headerName: string } }
        | undefined = Reflect.getMetadata(VERSION_KEY, instance as object, handlerName) || controllerVersion;
      const timeout: { ms: number } | undefined =
        Reflect.getMetadata(TIMEOUT_KEY, instance as object, handlerName) || controllerTimeout;
      const logConfig:
        | {
            logEntry?: boolean;
            logExit?: boolean;
            logBody?: boolean;
            logParams?: boolean;
            logResponse?: boolean;
          }
        | undefined = Reflect.getMetadata(LOG_KEY, instance as object, handlerName) || controllerLogConfig;

      // Create rate limiter for this specific route if needed
      let rateLimiter: any = null;
      if (rateLimitOptions) {
        try {
          rateLimiter = rateLimiterCache.get(rateLimitOptions);
        } catch (err) {
          getLogger().warn({ err }, 'express-rate-limit not available, skipping rate limiting for this route');
        }
      }

      let finalPath = path;
      if (version?.options?.addPrefix) {
        finalPath = `/${version.version}${path}`;
      }

      const handler: RequestHandler = async (req, res, next) => {
        // Set start time for duration tracking
        (req as any)['startTime'] = Date.now();

        let timeoutId: NodeJS.Timeout | undefined;
        let timedOut = false;

        try {
          // Handle timeout setup
          if (timeout) {
            timeoutId = setTimeout(() => {
              if (!res.headersSent && !timedOut) {
                timedOut = true;
                const errorResponse = createFinalErrorResponse(
                  req,
                  HttpStatusCodes.REQUEST_TIMEOUT,
                  'Request timed out'
                );
                res.status(HttpStatusCodes.REQUEST_TIMEOUT).json(errorResponse);
              }
            }, timeout.ms);
          }

          if (timedOut) return;

          // Handle rate limiting
          if (rateLimiter) {
            await new Promise<void>((resolve, reject) => {
              rateLimiter(req, res, (err: any) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }

          // Handle content type
          if (!res.headersSent && contentType) {
            res.setHeader('Content-Type', contentType.type);
          }

          // Handle versioning header
          if (version?.options?.addHeader && version?.options?.headerName && version?.version) {
            if (!res.headersSent) {
              res.setHeader(version.options.headerName, version.version);
            }
          }

          // Handle caching
          if (cache && !res.headersSent) {
            res.setHeader('Cache-Control', `public, max-age=${cache.ttlSeconds}`);
          }

          // Handle logging - entry
          if (logConfig?.logEntry) {
            const logger = getLogger();
            const logData: any = {
              method: req.method,
              url: req.originalUrl || req.url,
              userAgent: req.get('User-Agent')
            };
            if (logConfig.logParams) {
              logData.params = req.params;
              logData.query = req.query;
            }
            if (logConfig.logBody) logData.body = req.body;
            logger.info({ entry: logData }, 'Route Entry:');
          }

          // Handle roles-based access control
          if (roles.length && !(req as any)?.user?.roles?.some((role: string) => roles.includes(role))) {
            const errorResponse = createFinalErrorResponse(
              req,
              HttpStatusCodes.FORBIDDEN,
              'Forbidden Insufficient Roles'
            );
            res.status(HttpStatusCodes.FORBIDDEN).json(errorResponse);
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            return;
          }

          // Process static redirect if configured
          if (redirect && redirect.url) {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            return res.redirect(redirect.statusCode, redirect.url);
          }

          for (const fn of beforeHooks) await fn(req, res);
          const args: any[] = [];
          if (params.length) {
            params.forEach(({ index, type, key }) => {
              switch (type) {
                case 'query':
                  args[index] = key ? req.query[key] : req.query;
                  break;
                case 'param':
                  args[index] = key ? req.params[key] : req.params;
                  break;
                case 'body':
                  args[index] = key ? req.body?.[key] : req.body;
                  break;
                case 'req':
                  args[index] = req;
                  break;
                case 'res':
                  args[index] = res;
                  break;
              }
            });
          }
          const result = (instance as any)[handlerName](...args);
          // Support both sync and async handlers
          const awaited = result instanceof Promise ? await result : result;

          // Clear timeout if operation completed
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          if (timedOut) return;

          // Handle dynamic redirects
          if (redirect && awaited && typeof awaited === 'object' && 'url' in awaited) {
            const redirectUrl = awaited.url as string;
            const redirectStatus = (awaited.statusCode as number) || redirect.statusCode;
            return res.redirect(redirectStatus, redirectUrl);
          }

          if (!res.headersSent && typeof awaited !== 'undefined') {
            if (httpCode) res.status(httpCode);
            for (const [k, v] of Object.entries(headers)) {
              const normalized = normalizeHeaderValue(v);
              if (typeof normalized !== 'undefined') {
                res.set(k, normalized);
              }
            }
            res.json(awaited);
          }

          // Handle logging - exit
          if (logConfig?.logExit) {
            const logger = getLogger();
            const logData: any = {
              method: req.method,
              url: req.originalUrl || req.url,
              statusCode: res.statusCode,
              duration: `${Date.now() - (req as any).startTime}ms`
            };
            if (logConfig.logResponse) logData.response = awaited;
            logger.info({ exit: logData }, 'Route Exit:');
          }

          for (const fn of afterHooks) await fn(req, res, awaited);
        } catch (err) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          next(err);
        }
      };

      (router as any)[method](basePath + finalPath, ...middlewares, handler);
    });
  });
}

/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies
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

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { RequestHandler, Router } from 'express';
import 'reflect-metadata';
import { HttpStatusCodes } from './http-status-codes';
import { ForbiddenException } from './exception.utils';

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

/**
 * Factory function that creates HTTP method decorators.
 *
 * @param method - HTTP method to create decorator for
 * @returns A method decorator function
 */
function createRouteDecorator(method: HttpMethod) {
  return (path: string): MethodDecorator => {
    return (target, propertyKey, descriptor) => {
      const routes: RouteDefinition[] = Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];
      routes.push({
        path,
        method,
        handlerName: propertyKey as string
      });
      Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
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
    const existing: RequestHandler[] = Reflect.getMetadata(MIDDLEWARE_KEY, target, propertyKey as string) || [];
    Reflect.defineMetadata(MIDDLEWARE_KEY, [...existing, ...middlewares], target, propertyKey as string);
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
      const params: ParamDefinition[] = Reflect.getMetadata(PARAMS_KEY, target, propertyKey as string) || [];
      // Ensure parameters are ordered by index
      params.push({ index: parameterIndex, type, key: paramKey || key });
      params.sort((a, b) => a.index - b.index);
      Reflect.defineMetadata(PARAMS_KEY, params, target, propertyKey as string);
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
 * @param name - Header name
 * @param value - Header value
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
 * ```
 */
export function Header(name: string, value: string): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const headers: Record<string, string> = Reflect.getMetadata(HEADER_KEY, target, propertyKey as string) || {};
    headers[name] = value;
    Reflect.defineMetadata(HEADER_KEY, headers, target, propertyKey as string);
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
    const hooks: Function[] = Reflect.getMetadata(BEFORE_KEY, target, propertyKey as string) || [];
    hooks.push(fn);
    Reflect.defineMetadata(BEFORE_KEY, hooks, target, propertyKey as string);
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
    const hooks: Function[] = Reflect.getMetadata(AFTER_KEY, target, propertyKey as string) || [];
    hooks.push(fn);
    Reflect.defineMetadata(AFTER_KEY, hooks, target, propertyKey as string);
  };
}

/**
 * Decorator that requires specific roles for accessing a route.
 * Must be used with authentication middleware.
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
export function Roles(...roles: string[]): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(ROLES_KEY, roles, target, propertyKey as string);
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
 * Registers all controller classes with the provided router.
 * This function processes all decorators and sets up the Express routes.
 *
 * @param router - Express router instance
 * @param controllers - Array of controller classes
 */
export function registerControllers(router: Router, controllers: any[]) {
  controllers.forEach(ControllerClass => {
    const instance = new ControllerClass();
    const basePath: string = Reflect.getMetadata('basePath', ControllerClass) || '';
    const routes: RouteDefinition[] = Reflect.getMetadata(ROUTES_KEY, ControllerClass) || [];

    routes.forEach(({ path, method, handlerName }) => {
      const middlewares: RequestHandler[] = Reflect.getMetadata(MIDDLEWARE_KEY, instance, handlerName) || [];
      const params: ParamDefinition[] = Reflect.getMetadata(PARAMS_KEY, instance, handlerName) || [];

      const httpCode: number | undefined = Reflect.getMetadata(HTTP_CODE_KEY, instance, handlerName);
      const headers: Record<string, string> = Reflect.getMetadata(HEADER_KEY, instance, handlerName) || {};
      const beforeHooks: Function[] = Reflect.getMetadata(BEFORE_KEY, instance, handlerName) || [];
      const afterHooks: Function[] = Reflect.getMetadata(AFTER_KEY, instance, handlerName) || [];
      const roles: string[] = Reflect.getMetadata(ROLES_KEY, instance, handlerName) || [];
      const redirect: { url?: string; statusCode: number } | undefined = Reflect.getMetadata(
        REDIRECT_KEY,
        instance,
        handlerName
      );

      const handler: RequestHandler = async (req, res, next) => {
        try {
          // Handle roles-based access control
          if (roles.length && !(req as any)?.user?.roles?.some((role: string) => roles.includes(role))) {
            res.status(HttpStatusCodes.FORBIDDEN).json(new ForbiddenException('Forbidden Insufficient Roles'));
            return;
          }

          // Process static redirect if configured
          if (redirect && redirect.url) {
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

          // Handle dynamic redirects
          if (redirect && awaited && typeof awaited === 'object' && 'url' in awaited) {
            const redirectUrl = awaited.url as string;
            const redirectStatus = (awaited.statusCode as number) || redirect.statusCode;
            return res.redirect(redirectStatus, redirectUrl);
          }

          if (!res.headersSent && typeof awaited !== 'undefined') {
            if (httpCode) res.status?.(httpCode);
            for (const [k, v] of Object.entries(headers)) res.set?.(k, v);
            res.json(awaited);
          }
          for (const fn of afterHooks) await fn(req, res, awaited);
        } catch (err) {
          next(err);
        }
      };

      (router as any)[method](basePath + path, ...middlewares, handler);
    });
  });
}

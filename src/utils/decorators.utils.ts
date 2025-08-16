/* eslint-disable @typescript-eslint/no-unused-vars */

import 'reflect-metadata';

// --- Sample Express interfaces for type safety ---
interface Request {
  query: any;
  params: any;
  body?: any;
  [key: string]: any;
}
interface Response {
  json: (body: any) => void;
  headersSent: boolean;
  [key: string]: any;
}
type NextFunction = (err?: any) => void;
type RequestHandler = (req: Request, res: Response, next: NextFunction) => any;
interface Router {
  [method: string]: (path: string, ...handlers: RequestHandler[]) => void;
}
// --- End sample Express interfaces ---

const ROUTES_KEY = Symbol('routes');
const MIDDLEWARE_KEY = Symbol('middlewares');
const PARAMS_KEY = Symbol('params');

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace' | 'connect';

interface RouteDefinition {
  path: string;
  method: HttpMethod;
  handlerName: string;
}

interface ParamDefinition {
  index: number;
  type: 'query' | 'param' | 'body' | 'req' | 'res';
  key?: string;
}

// ---- Route Decorators ----
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

export const Get = createRouteDecorator('get');
export const Post = createRouteDecorator('post');
export const Put = createRouteDecorator('put');
export const Patch = createRouteDecorator('patch');
export const Delete = createRouteDecorator('delete');
export const Options = createRouteDecorator('options');
export const Head = createRouteDecorator('head');
export const Trace = createRouteDecorator('trace');
export const Connect = createRouteDecorator('connect');

// ---- Controller Decorator ----
export function Controller(basePath: string): ClassDecorator {
  return target => {
    Reflect.defineMetadata('basePath', basePath, target);
  };
}

// ---- Middleware Decorator ----
export function Use(...middlewares: RequestHandler[]): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const existing: RequestHandler[] = Reflect.getMetadata(MIDDLEWARE_KEY, target, propertyKey as string) || [];
    Reflect.defineMetadata(MIDDLEWARE_KEY, [...existing, ...middlewares], target, propertyKey as string);
  };
}

// ---- Parameter Decorators ----
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

export const Query = createParamDecorator('query');
export const Param = createParamDecorator('param');
export const Body = createParamDecorator('body');
export const Req = createParamDecorator('req');
export const Res = createParamDecorator('res');

// Custom HTTP status code decorator
const HTTP_CODE_KEY = Symbol('httpCode');
export function HttpCode(status: number): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(HTTP_CODE_KEY, status, target, propertyKey as string);
  };
}

// Custom header decorator
const HEADER_KEY = Symbol('headers');
export function Header(name: string, value: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const headers: Record<string, string> = Reflect.getMetadata(HEADER_KEY, target, propertyKey as string) || {};
    headers[name] = value;
    Reflect.defineMetadata(HEADER_KEY, headers, target, propertyKey as string);
  };
}

// Before/After hooks (not Express middleware, but can be used for logging, etc.)
const BEFORE_KEY = Symbol('before');
const AFTER_KEY = Symbol('after');
export function Before(fn: Function): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const hooks: Function[] = Reflect.getMetadata(BEFORE_KEY, target, propertyKey as string) || [];
    hooks.push(fn);
    Reflect.defineMetadata(BEFORE_KEY, hooks, target, propertyKey as string);
  };
}
export function After(fn: Function): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const hooks: Function[] = Reflect.getMetadata(AFTER_KEY, target, propertyKey as string) || [];
    hooks.push(fn);
    Reflect.defineMetadata(AFTER_KEY, hooks, target, propertyKey as string);
  };
}

// ---- Register Controllers ----
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

      const handler: RequestHandler = async (req, res, next) => {
        try {
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

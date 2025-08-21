// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import {
  Controller,
  Get,
  Use,
  Query,
  Param,
  Body,
  Req,
  Res,
  HttpCode,
  Header,
  Before,
  After,
  Redirect,
  Roles,
  registerControllers
} from '../../src/utils/decorators.utils';
import { jest } from '@jest/globals';
import { HttpStatusCodes } from '../../src/utils/http-status-codes';
import { ForbiddenException } from '../../src/utils/exception.utils';
import { NextFunction } from 'express';

// Helper to create mock Router
function createMockRouter() {
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace', 'connect', 'all'];
  const router: any = {};
  methods.forEach(m => {
    router[m] = jest.fn();
  });
  return router;
}

describe('Decorators and registerControllers', () => {
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRouter = createMockRouter();
    mockReq = {
      query: { q: 'test' },
      params: { id: '123' },
      body: { name: 'John' }
    } as any;
    mockRes = {
      json: jest.fn(),
      send: jest.fn(),
      redirect: jest.fn(),
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    } as unknown as Response;
    mockNext = jest.fn();
  });

  it('should register a GET route with parameters, middlewares, http code, headers, and hooks', async () => {
    const beforeHook = jest.fn();
    const afterHook = jest.fn();

    @Controller('/api')
    class TestController {
      @Get('/items/:id')
      // @ts-expect-error TS1241/TS1270: Decorator signature mismatch (safe to ignore for tests)
      @Use((req, res, next) => {
        res.set('X-Middleware', 'yes');
        next();
      })
      @HttpCode(201)
      @Header('X-Custom', 'Value')
      @Before(beforeHook)
      @After(afterHook)
      handler(
        @Query('q') q: string,
        @Param('id') id: string,
        @Body('name') name: string,
        @Req() req: Request,
        @Res() res: Response
      ) {
        return { q, id, name, ok: true };
      }
    }

    registerControllers(mockRouter, [TestController]);

    // Should register GET route on mockRouter
    expect(mockRouter.get).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = mockRouter.get.mock.calls[0];
    expect(path).toBe('/api/items/:id');

    // Simulate running the handler
    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(beforeHook).toHaveBeenCalledWith(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.set).toHaveBeenCalledWith('X-Custom', 'Value');
    expect(mockRes.json).toHaveBeenCalledWith({
      q: 'test',
      id: '123',
      name: 'John',
      ok: true
    });
    expect(afterHook).toHaveBeenCalledWith(mockReq, mockRes, {
      q: 'test',
      id: '123',
      name: 'John',
      ok: true
    });
  });

  it('should handle async route handlers', async () => {
    @Controller('/async')
    class AsyncController {
      @Get('/wait')
      async handler() {
        return Promise.resolve({ async: true });
      }
    }

    registerControllers(mockRouter, [AsyncController]);
    const [path, ...handlers] = mockRouter.get.mock.calls[0];
    expect(path).toBe('/async/wait');

    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ async: true });
  });

  it('should call next(err) if handler throws', async () => {
    const error = new Error('fail');
    @Controller('/err')
    class ErrController {
      @Get('/boom')
      handler() {
        throw error;
      }
    }

    registerControllers(mockRouter, [ErrController]);
    // Fix: always get the last handler (routeHandler) from the handlers array
    const [, ...handlers] = mockRouter.get.mock.calls[0];
    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle static redirect with @Redirect decorator', async () => {
    @Controller('/redirects')
    class RedirectController {
      @Get('/static')
      @Redirect('/destination', 301)
      staticRedirect() {
        // This should not be called due to the decorator
        return { shouldNotBeCalled: true };
      }
    }

    registerControllers(mockRouter, [RedirectController]);
    const [path, ...handlers] = mockRouter.get.mock.calls[0];
    expect(path).toBe('/redirects/static');

    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(mockRes.redirect).toHaveBeenCalledWith(301, '/destination');
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should handle dynamic redirect from handler return value', async () => {
    @Controller('/redirects')
    class DynamicRedirectController {
      @Get('/dynamic')
      @Redirect()
      dynamicRedirect() {
        return { url: '/dynamic-destination', statusCode: 307 };
      }
    }

    registerControllers(mockRouter, [DynamicRedirectController]);
    const [path, ...handlers] = mockRouter.get.mock.calls[0];
    expect(path).toBe('/redirects/dynamic');

    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(mockRes.redirect).toHaveBeenCalledWith(307, '/dynamic-destination');
  });

  it('should allow access with matching roles', async () => {
    mockReq.user = { roles: ['admin', 'editor'] };

    @Controller('/protected')
    class RolesController {
      @Get('/admin')
      @Roles('admin')
      adminOnly() {
        return { access: 'granted' };
      }
    }

    registerControllers(mockRouter, [RolesController]);
    const [path, ...handlers] = mockRouter.get.mock.calls[0];
    expect(path).toBe('/protected/admin');

    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ access: 'granted' });
    expect(mockRes.status).not.toHaveBeenCalledWith(HttpStatusCodes.FORBIDDEN);
  });

  it('should deny access with insufficient roles', async () => {
    mockReq.user = { roles: ['user'] };

    @Controller('/protected')
    class RolesController {
      @Get('/admin')
      @Roles('admin', 'superuser')
      adminOnly() {
        return { access: 'granted' };
      }
    }

    registerControllers(mockRouter, [RolesController]);
    const [path, ...handlers] = mockRouter.get.mock.calls[0];
    expect(path).toBe('/protected/admin');

    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.FORBIDDEN);
    expect(mockRes.json).toHaveBeenCalledWith(expect.any(ForbiddenException));
    // The handler should not execute
    expect(mockRes.json).not.toHaveBeenCalledWith({ access: 'granted' });
  });

  it('should handle missing user object gracefully', async () => {
    // No user object on request
    mockReq.user = undefined;

    @Controller('/protected')
    class RolesController {
      @Get('/admin')
      @Roles('admin')
      adminOnly() {
        return { access: 'granted' };
      }
    }

    registerControllers(mockRouter, [RolesController]);
    const [path, ...handlers] = mockRouter.get.mock.calls[0];
    const routeHandler = handlers[handlers.length - 1];
    await routeHandler(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.FORBIDDEN);
    expect(mockRes.json).toHaveBeenCalledWith(expect.any(ForbiddenException));
  });
});

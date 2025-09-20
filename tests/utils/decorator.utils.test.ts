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
  Headers,
  Before,
  After,
  Redirect,
  Roles,
  Cache,
  RateLimit,
  ContentType,
  Version,
  Timeout,
  Log,
  registerControllers
} from '../../src/utils/decorators.utils';
import { jest } from '@jest/globals';
import { HttpStatusCodes } from '../../src/utils/http-status-codes';
import { NextFunction } from 'express';
import { getLogger } from '../../src/utils/logger.utils';

jest.mock('../../src/utils/logger.utils');

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

  const logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    child: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    mockRouter = createMockRouter();
    mockReq = {
      method: 'SAMPLE_ANY_METHOD',
      originalUrl: '/api/items/123?q=test',
      url: '/items/123?q=test',
      query: { q: 'test' },
      params: { id: '123' },
      body: { name: 'John' },
      ip: '127.0.0.1',
      get(headerName: string) {
        return this.headers[headerName.toLowerCase()];
      },
      headers: {
        'x-forwarded-for': '',
        forwarded: '',
        'user-agent': 'jest-test-agent'
      },
      app: {
        get: jest.fn().mockReturnValue('trust proxy')
      }
    } as any;
    mockRes = {
      json: jest.fn(),
      send: jest.fn(),
      redirect: jest.fn(),
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      statusCode: 200
    } as unknown as Response;
    mockNext = jest.fn();

    (getLogger as jest.Mock).mockReturnValue(logger);
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
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: 'Forbidden Insufficient Roles',
        path: '/api/items/123?q=test',
        requestId: expect.stringMatching(/^[0-9a-fA-F-]{36}$/),
        status: 403,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    );
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
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        message: 'Forbidden Insufficient Roles',
        path: '/api/items/123?q=test',
        requestId: expect.stringMatching(/^[0-9a-fA-F-]{36}$/),
        status: 403,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    );
  });

  describe('New Decorators', () => {
    it('should handle @Headers decorator with object parameter', async () => {
      @Controller('/headers')
      class HeadersController {
        @Get('/multiple')
        @Headers({
          'Cache-Control': 'max-age=3600',
          'X-Custom-Header': 'custom-value',
          'Content-Security-Policy': "default-src 'self'"
        })
        multipleHeaders() {
          return { success: true };
        }
      }

      registerControllers(mockRouter, [HeadersController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/headers/multiple');

      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith('Cache-Control', 'max-age=3600');
      expect(mockRes.set).toHaveBeenCalledWith('X-Custom-Header', 'custom-value');
      expect(mockRes.set).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'self'");
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle @Cache decorator', async () => {
      @Controller('/cache')
      class CacheController {
        @Get('/data')
        @Cache(300)
        getCachedData() {
          return { data: 'cached result' };
        }
      }

      registerControllers(mockRouter, [CacheController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/cache/data');

      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
      expect(mockRes.json).toHaveBeenCalledWith({ data: 'cached result' });
    });

    it('should handle @ContentType decorator', async () => {
      @Controller('/content')
      class ContentTypeController {
        @Get('/pdf')
        @ContentType('application/pdf')
        getPdf() {
          return { file: 'pdf-data' };
        }
      }

      registerControllers(mockRouter, [ContentTypeController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/content/pdf');

      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.json).toHaveBeenCalledWith({ file: 'pdf-data' });
    });

    it('should handle @Version decorator with prefix', async () => {
      @Controller('/api')
      class VersionController {
        @Get('/users')
        @Version('v2')
        getUsersV2() {
          return { users: [], version: 'v2' };
        }
      }

      registerControllers(mockRouter, [VersionController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/api/v2/users');

      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Version', 'v2');
      expect(mockRes.json).toHaveBeenCalledWith({ users: [], version: 'v2' });
    });

    it('should handle @Version decorator with custom options', async () => {
      @Controller('/api')
      class CustomVersionController {
        @Get('/data')
        @Version('v3', { addPrefix: false, addHeader: true, headerName: 'API-Version' })
        getDataV3() {
          return { data: 'v3 data' };
        }
      }

      registerControllers(mockRouter, [CustomVersionController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/api/data'); // No prefix added

      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('API-Version', 'v3');
      expect(mockRes.json).toHaveBeenCalledWith({ data: 'v3 data' });
    });

    it('should handle @Timeout decorator and timeout scenarios', async () => {
      @Controller('/timeout')
      class TimeoutController {
        @Get('/slow')
        @Timeout(1000)
        async slowOperation() {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return {};
        }
      }

      registerControllers(mockRouter, [TimeoutController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      const routeHandler = handlers[handlers.length - 1];

      const responsePromise = routeHandler(mockReq, mockRes, mockNext);

      // Flush pending microtasks so .catch/.then run
      await Promise.resolve();

      await responsePromise;

      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: true,
        message: 'Request timed out',
        path: '/api/items/123?q=test',
        requestId: expect.stringMatching(/^[0-9a-fA-F-]{36}$/),
        status: 408,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      });
    }, 5000);

    it('should handle @Log decorator with comprehensive logging', async () => {
      @Controller('/logging')
      class LoggingController {
        @Get('/test/:id')
        @Log({
          logEntry: true,
          logExit: true,
          logBody: true,
          logParams: true,
          logResponse: true
        })
        testLogging(@Param('id') id: string, @Body() body: any) {
          return { id, body, logged: true };
        }
      }

      // Mock start time
      (mockReq as any).startTime = Date.now();

      registerControllers(mockRouter, [LoggingController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      const routeHandler = handlers[handlers.length - 1];

      await routeHandler(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledTimes(2); // Entry and exit
      expect(logger.info.mock.calls[0]).toStrictEqual([
        {
          entry: {
            body: { name: 'John' },
            method: 'SAMPLE_ANY_METHOD',
            params: { id: '123' },
            query: { q: 'test' },
            url: '/api/items/123?q=test',
            userAgent: 'jest-test-agent'
          }
        },
        'Route Entry:'
      ]);
      expect(logger.info.mock.calls[1]).toStrictEqual([
        {
          exit: {
            duration: expect.stringMatching(/^\d+ms$/),
            method: 'SAMPLE_ANY_METHOD',
            response: {
              body: {
                name: 'John'
              },
              id: '123',
              logged: true
            },
            statusCode: 200,
            url: '/api/items/123?q=test'
          }
        },
        'Route Exit:'
      ]);

      // Restore original implementation
      jest.restoreAllMocks();
    });

    it('should handle @RateLimit decorator and rate limiting', async () => {
      @Controller('/rate-limited')
      class RateLimitController {
        @Get('/api')
        @RateLimit({ max: 2, windowMs: 60000 })
        limitedEndpoint() {
          return { success: true };
        }
      }

      registerControllers(mockRouter, [RateLimitController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/rate-limited/api');

      // Since rate limiting middleware is applied, we need to test the actual route handler
      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Controller-level decorator inheritance', () => {
    it('should inherit controller-level @Headers at method level', async () => {
      @Controller('/inheritance')
      @Headers({ 'X-Controller-Header': 'controller-value' })
      class InheritanceController {
        @Get('/test')
        @Headers({ 'X-Method-Header': 'method-value' })
        testMethod() {
          return { inherited: true };
        }
      }

      registerControllers(mockRouter, [InheritanceController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      const routeHandler = handlers[handlers.length - 1];

      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith('X-Controller-Header', 'controller-value');
      expect(mockRes.set).toHaveBeenCalledWith('X-Method-Header', 'method-value');
    });

    it('should inherit controller-level @Cache when method has no cache decorator', async () => {
      @Controller('/cache-inheritance')
      @Cache(600)
      class CacheInheritanceController {
        @Get('/inherited')
        inheritedCache() {
          return { cached: true };
        }

        @Get('/overridden')
        @Cache(300)
        overriddenCache() {
          return { overridden: true };
        }
      }

      registerControllers(mockRouter, [CacheInheritanceController]);

      // Test inherited cache
      const [, ...inheritedHandlers] = mockRouter.get.mock.calls[0];
      const inheritedHandler = inheritedHandlers[inheritedHandlers.length - 1];
      await inheritedHandler(mockReq, mockRes, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=600');

      // Reset mocks for second test
      mockRes.setHeader = jest.fn().mockReturnThis();
      mockRes.json = jest.fn();

      // Test overridden cache
      const [, ...overriddenHandlers] = mockRouter.get.mock.calls[1];
      const overriddenHandler = overriddenHandlers[overriddenHandlers.length - 1];
      await overriddenHandler(mockReq, mockRes, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
    });

    it('should inherit controller-level @Roles when method has no roles decorator', async () => {
      mockReq.user = { roles: ['admin'] };

      @Controller('/roles-inheritance')
      @Roles('admin')
      class RolesInheritanceController {
        @Get('/inherited')
        inheritedRoles() {
          return { access: 'inherited' };
        }

        @Get('/overridden')
        @Roles('superuser')
        overriddenRoles() {
          return { access: 'overridden' };
        }
      }

      registerControllers(mockRouter, [RolesInheritanceController]);

      // Test inherited roles (should succeed)
      const [, ...inheritedHandlers] = mockRouter.get.mock.calls[0];
      const inheritedHandler = inheritedHandlers[inheritedHandlers.length - 1];
      await inheritedHandler(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith({ access: 'inherited' });

      // Reset mocks for second test
      mockRes.status = jest.fn().mockReturnThis();
      mockRes.json = jest.fn();

      // Test overridden roles (should fail - admin doesn't have superuser role)
      const [, ...overriddenHandlers] = mockRouter.get.mock.calls[1];
      const overriddenHandler = overriddenHandlers[overriddenHandlers.length - 1];
      await overriddenHandler(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.FORBIDDEN);
    });

    it('should method-level decorators override controller-level decorators', async () => {
      @Controller('/override')
      @Version('v1')
      @Timeout(5000)
      class OverrideController {
        @Get('/method-override')
        @Version('v2')
        @Timeout(1000)
        methodOverride() {
          return { version: 'v2', timeout: 1000 };
        }
      }

      registerControllers(mockRouter, [OverrideController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/override/v2/method-override');

      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Version', 'v2');
    });
  });

  describe('Combined decorators scenarios', () => {
    it('should handle multiple decorators on the same method', async () => {
      @Controller('/combined')
      class CombinedController {
        @Get('/complex/:id')
        @HttpCode(201)
        @Headers({ 'X-Complex': 'true' })
        @Cache(1800)
        @ContentType('application/json')
        @Version('v1')
        @Log({ logEntry: true, logExit: true })
        complexEndpoint(@Param('id') id: string) {
          return { id, complex: true };
        }
      }

      registerControllers(mockRouter, [CombinedController]);
      const [path, ...handlers] = mockRouter.get.mock.calls[0];
      expect(path).toBe('/combined/v1/complex/:id');

      const routeHandler = handlers[handlers.length - 1];
      await routeHandler(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.set).toHaveBeenCalledWith('X-Complex', 'true');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=1800');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1');
      expect(mockRes.json).toHaveBeenCalledWith({ id: '123', complex: true });
    });
  });

  describe('Error handling for new decorators', () => {
    it('should handle rate limit exceeded scenario', async () => {
      // This test would require more complex mocking of express-rate-limit
      // For now, we test that the decorator doesn't break the flow
      @Controller('/rate-test')
      class RateTestController {
        @Get('/endpoint')
        @RateLimit({ max: 1, windowMs: 1000 })
        testEndpoint() {
          return { success: true };
        }
      }

      expect(() => {
        registerControllers(mockRouter, [RateTestController]);
      }).not.toThrow();
    });

    it('should handle missing express-rate-limit gracefully', async () => {
      // Mock console.warn to test warning message
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      @Controller('/rate-missing')
      class RateMissingController {
        @Get('/endpoint')
        @RateLimit({ max: 1, windowMs: 1000 })
        testEndpoint() {
          return { success: true };
        }
      }

      // Should not throw even if rate limiting fails
      expect(() => {
        registerControllers(mockRouter, [RateMissingController]);
      }).not.toThrow();

      consoleWarnSpy.mockRestore();
    });

    it('should handle headers sent scenario gracefully', async () => {
      mockRes.headersSent = true;

      @Controller('/headers-sent')
      class HeadersSentController {
        @Get('/test')
        @ContentType('text/plain')
        @Headers({ 'X-Test': 'value' })
        testMethod() {
          return { test: true };
        }
      }

      registerControllers(mockRouter, [HeadersSentController]);
      const [, ...handlers] = mockRouter.get.mock.calls[0];
      const routeHandler = handlers[handlers.length - 1];

      await routeHandler(mockReq, mockRes, mockNext);

      // Should not call setHeader when headers already sent
      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(mockRes.set).not.toHaveBeenCalled();
    });
  });
});

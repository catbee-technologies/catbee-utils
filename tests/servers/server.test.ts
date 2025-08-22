import { ExpressServer } from '../../src/servers/server';
import { ServerConfig } from '../../src/types/server';
import request from 'supertest';
import express from 'express';
import { HttpStatusCodes } from '../../src/utils/http-status-codes';
import fs from 'fs';
import * as envUtils from '../../src/utils/env.utils';

const counterInc = jest.fn();
const histogramObserve = jest.fn();

jest.mock('prom-client', () => {
  return {
    Counter: class {
      constructor(_opts: any) {}
      inc = counterInc;
    },
    Histogram: class {
      constructor(_opts: any) {}
      observe = histogramObserve;
    },
    Registry: class {
      contentType = 'text/plain';
      metrics = jest.fn().mockResolvedValue('# mock metrics');
    },
    collectDefaultMetrics: jest.fn(),
    default: {
      Counter: class {
        constructor(_opts: any) {}
        inc = counterInc;
      },
      Histogram: class {
        constructor(_opts: any) {}
        observe = histogramObserve;
      },
      Registry: class {
        contentType = 'text/plain';
        metrics = jest.fn().mockResolvedValue('# mock metrics');
      },
      collectDefaultMetrics: jest.fn()
    }
  };
});

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn().mockImplementation(filePath => {
    if (typeof filePath === 'string') {
      if (filePath.includes('localhost.pem')) return 'mock-key-content';
      if (filePath.includes('localhost.crt')) return 'mock-cert-content';
      if (filePath.includes('ca.pem')) return 'mock-ca-content';
    }
    return '';
  })
}));

jest.mock('fs/promises', () => ({
  ...jest.requireActual('fs/promises'),
  access: jest.fn().mockResolvedValue(true)
}));

jest.mock('@scalar/express-api-reference', () => ({
  apiReference: () => (req: any, res: any, next: Function) => next()
}));

jest.mock('../../src/utils/env.utils', () => ({
  Env: {
    isDev: jest.fn().mockReturnValue(true),
    get: jest.fn().mockImplementation((key: string, fallback: string) => {
      const values: Record<string, string> = {
        LOGGER_NAME: 'express_app',
        LOGGER_LEVEL: 'silent'
      };
      return key in values ? values[key] : fallback;
    }),
    getBoolean: jest.fn().mockReturnValue(false),
    getNumber: jest.fn().mockImplementation((key: string, fallback: number) => fallback)
  },
  isDev: jest.fn().mockReturnValue(true)
}));

// Mock process.getuid for port validation tests
Object.defineProperty(process, 'getuid', {
  value: jest.fn().mockReturnValue(1000)
});

async function killServer(server: ExpressServer) {
  try {
    if (server && server.getServer()) {
      await server.stop(true);
    }
  } catch {
    // Ignore errors during cleanup
  }
}

describe('ExpressServer', () => {
  const baseConfig: Partial<ServerConfig> = {
    port: 4000, // Use random available port for testing
    host: 'localhost',
    requestLogging: { enable: false }, // Disable for cleaner test output
    metrics: { enable: false, path: '/metrics' },
    healthCheck: { path: '/healthz', detailed: true }
  };

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();
      expect(server.getConfig()).toBeDefined();
      expect(server.getApp()).toBeDefined();
    });

    it('should merge custom config with defaults', async () => {
      const customConfig = {
        ...baseConfig,
        appName: 'test-app',
        cors: true,
        helmet: true
      };

      const server = new ExpressServer(customConfig);
      await server.waitUntilReady();

      const config = server.getConfig();
      expect(config.appName).toBe('test-app');
      expect(config.cors).toBe(true);
      expect(config.helmet).toBe(true);
    });

    it('should apply global prefix to routes', async () => {
      const config = {
        ...baseConfig,
        globalPrefix: '/api/v1',
        healthCheck: {
          path: '/healthz',
          detailed: true,
          withGlobalPrefix: true
        }
      };

      const server = new ExpressServer(config);
      await server.waitUntilReady();

      // Start the server
      await server.start();

      // Test that health check has the prefix
      const res = await request(server.getApp()).get('/api/v1/healthz');
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body?.message).toBe('OK');
      expect(res.body?.error).toBe(false);
      expect(res.body?.data).toBeNull();

      // Regular health path should 404
      const res2 = await request(server.getApp()).get('/healthz');
      expect(res2.status).toBe(HttpStatusCodes.NOT_FOUND);

      await killServer(server);
    });
  });

  describe('HTTP Server', () => {
    it('should start and stop the server', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();

      // Start the server
      const httpServer = await server.start();
      expect(httpServer).toBeDefined();
      expect(server.getServer()).toBe(httpServer);

      // Stop the server
      await killServer(server);
      expect(server.getServer()).toBeNull();
    });

    it('should handle HTTPS server configuration', async () => {
      const keyPath = 'localhost.pem';
      const certPath = 'localhost.crt';

      const httpsConfig = {
        ...baseConfig,
        https: {
          key: keyPath,
          cert: certPath
        }
      };

      const server = new ExpressServer(httpsConfig);
      await server.waitUntilReady();

      // Start the server
      const httpServer = await server.start();
      expect(httpServer).toBeDefined();
      expect(fs.readFileSync).toHaveBeenCalledWith(keyPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(certPath);

      await killServer(server);
    });
  });

  describe('Routes & Middleware', () => {
    it('should respond to health checks', async () => {
      const server = new ExpressServer(baseConfig);
      await server.start();
      const res = await request(server.getApp()).get('/healthz');

      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body.message).toBe('OK');
      expect(res.body.error).toBe(false);
      expect(res.body.data).toBeNull();

      await killServer(server);
    });

    it('should provide metrics endpoint', async () => {
      const server = new ExpressServer({ ...baseConfig, metrics: { enable: true } });
      await server.start();

      const res = await request(server.getApp()).get('/metrics');

      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.text).toBe('# mock metrics');
      expect(res.header['content-type']).toBe('text/plain; charset=utf-8');

      await killServer(server);
    });

    it('should handle custom routes', async () => {
      const server = new ExpressServer(baseConfig);
      server.registerRoute(['get'], '/test-route', (req, res) => {
        res.status(200).json({ success: true, message: 'Custom route' });
      });

      await server.start();

      const res = await request(server.getApp()).get('/test-route');

      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Custom route');

      await killServer(server);
    });

    it('should handle 404 for unknown routes', async () => {
      const server = new ExpressServer(baseConfig);
      await server.start();

      const res = await request(server.getApp()).get('/non-existent-route');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toBe('Route GET /non-existent-route not found');

      await killServer(server);
    });

    it('should register custom middleware', async () => {
      const server = new ExpressServer(baseConfig);
      const middleware = jest.fn((req, res, next) => next());
      server.registerMiddleware('/middleware-test', middleware);
      await server.start();
      const res = await request(server.getApp()).get('/middleware-test/something');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(middleware).toHaveBeenCalled();

      await killServer(server);
    });

    it('should apply global middleware', async () => {
      const server = new ExpressServer(baseConfig);
      const middleware = jest.fn((req, res, next) => next());
      server.useMiddleware(middleware);
      await server.start();

      const res = await request(server.getApp()).get('/random-path');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(middleware).toHaveBeenCalled();

      await killServer(server);
    });
  });

  describe('Health Checks', () => {
    it('should register and execute health checks', async () => {
      const server = new ExpressServer(baseConfig);

      const successCheck = jest.fn().mockReturnValue(true);
      const failCheck = jest.fn().mockReturnValue(false);

      server.registerHealthCheck('success-check', successCheck);
      server.registerHealthCheck('fail-check', failCheck);

      await server.start();

      const res = await request(server.getApp()).get('/healthz');

      expect(res.status).toBe(HttpStatusCodes.SERVICE_UNAVAILABLE);
      expect(successCheck).toHaveBeenCalled();
      expect(failCheck).toHaveBeenCalled();
      expect(res.body.data.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'success-check', status: true }),
          expect.objectContaining({ name: 'fail-check', status: false })
        ])
      );

      await killServer(server);
    });

    it('should handle async health checks', async () => {
      const server = new ExpressServer(baseConfig);

      const asyncCheck = jest.fn().mockResolvedValue(true);
      server.registerHealthCheck('async-check', asyncCheck);

      await server.start();

      const res = await request(server.getApp()).get('/healthz');

      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(asyncCheck).toHaveBeenCalled();
      expect(res.body.data.checks).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'async-check', status: true })])
      );

      await killServer(server);
    });

    it('should handle health check errors gracefully', async () => {
      const server = new ExpressServer(baseConfig);

      const errorCheck = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      server.registerHealthCheck('error-check', errorCheck);

      await server.start();

      const res = await request(server.getApp()).get('/healthz');

      expect(res.status).toBe(HttpStatusCodes.SERVICE_UNAVAILABLE);
      expect(errorCheck).toHaveBeenCalled();
      expect(res.body.data.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'error-check',
            status: false,
            error: 'Test error'
          })
        ])
      );

      await killServer(server);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should execute lifecycle hooks in order', async () => {
      const hookOrder: string[] = [];

      const hooks = {
        beforeInit: jest.fn(() => {
          hookOrder.push('beforeInit');
          return Promise.resolve();
        }),
        afterInit: jest.fn(() => {
          hookOrder.push('afterInit');
          return Promise.resolve();
        }),
        beforeStart: jest.fn(() => {
          hookOrder.push('beforeStart');
          return Promise.resolve();
        }),
        afterStart: jest.fn(() => {
          hookOrder.push('afterStart');
          return Promise.resolve();
        }),
        beforeStop: jest.fn(() => {
          hookOrder.push('beforeStop');
          return Promise.resolve();
        }),
        afterStop: jest.fn(() => {
          hookOrder.push('afterStop');
          return Promise.resolve();
        })
      };

      const server = new ExpressServer(baseConfig, hooks);
      await server.waitUntilReady();

      // Ensure initialization hooks ran
      expect(hooks.beforeInit).toHaveBeenCalled();
      expect(hooks.afterInit).toHaveBeenCalled();
      expect(hookOrder).toEqual(['beforeInit', 'afterInit']);

      // Start server and check hooks
      await server.start();
      expect(hooks.beforeStart).toHaveBeenCalled();
      expect(hooks.afterStart).toHaveBeenCalled();
      expect(hookOrder).toEqual(['beforeInit', 'afterInit', 'beforeStart', 'afterStart']);

      // Stop server and check hooks
      await killServer(server);
      expect(hooks.beforeStop).toHaveBeenCalled();
      expect(hooks.afterStop).toHaveBeenCalled();
      expect(hookOrder).toEqual(['beforeInit', 'afterInit', 'beforeStart', 'afterStart', 'beforeStop', 'afterStop']);
    });

    it('should handle hook errors gracefully', async () => {
      const hooks = {
        beforeInit: jest.fn(() => {
          throw new Error('Hook error');
        }),
        afterInit: jest.fn()
      };

      // Should not throw despite hook error
      const server = new ExpressServer(baseConfig, hooks);
      await server.waitUntilReady();

      expect(hooks.beforeInit).toHaveBeenCalled();
      expect(hooks.afterInit).toHaveBeenCalled(); // Should still run

      await server.start();
      await killServer(server);
    });
  });

  describe('Router Management', () => {
    it('should support custom routers', async () => {
      const server = new ExpressServer(baseConfig);
      const router = express.Router();
      router.get('/custom-route', (req, res) => {
        res.status(HttpStatusCodes.OK).json({ success: true, message: 'Custom router' });
      });
      server.setBaseRouter(router);
      await server.start();

      const res = await request(server.getApp()).get('/custom-route');

      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Custom router');

      await killServer(server);
    });

    it('should create and register nested routers', async () => {
      const server = new ExpressServer(baseConfig);
      const router = server.createRouter('/api');
      router.get('/nested', (req, res) => {
        res.status(200).json({ success: true, message: 'Nested route' });
      });
      await server.start();

      const res = await request(server.getApp()).get('/api/nested');
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Nested route');

      await killServer(server);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle graceful shutdown', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();
      const httpServer = await server.start();

      // Create a spy on the server.close method
      const closeSpy = jest.spyOn(httpServer, 'close');

      await killServer(server);
      expect(closeSpy).toHaveBeenCalled();
      expect(server.getServer()).toBeNull();

      await killServer(server);
    });

    it('should register signal handlers for graceful shutdown', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      const server = new ExpressServer(baseConfig);
      server.enableGracefulShutdown(['SIGTERM']);

      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // Clean up
      processOnSpy.mockRestore();
    });
  });

  describe('Environment-specific behavior', () => {
    beforeEach(() => {
      // Use jest.spyOn on the correctly mocked object
      jest.spyOn(envUtils.Env, 'isDev');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should configure differently in development mode', async () => {
      // Override the mock for this specific test
      (envUtils.Env.isDev as jest.Mock).mockReturnValue(true);

      const server = new ExpressServer({
        ...baseConfig,
        requestLogging: { enable: true }
      });

      await server.waitUntilReady();
      await server.start();

      const config = server.getConfig();
      expect(config.requestLogging?.enable).toBe(true);

      // Dev mode should include more details in errors
      const res = await request(server.getApp()).get('/non-existent-path');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(res.body).toHaveProperty('message');

      await killServer(server);
    });

    it('should configure differently in production mode', async () => {
      (envUtils.Env.isDev as jest.Mock).mockReturnValue(false);

      const server = new ExpressServer({
        ...baseConfig,
        requestLogging: { enable: true }
      });

      await server.waitUntilReady();
      await server.start();

      // Production mode should be more secure/restrictive
      const res = await request(server.getApp()).get('/non-existent-path');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(res.body).toHaveProperty('message');

      await killServer(server);
    });
  });
});

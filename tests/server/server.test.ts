import { ExpressServer, ServerConfigBuilder } from '../../src/server';
import { CatbeeGlobalServerConfig } from '../../src/types/server';
import request from 'supertest';
import express from 'express';
import { HttpStatusCodes } from '../../src/http-status-codes';
import { readFileSync } from '../../src/fs';
import * as envUtils from '../../src/env';

jest.mock('../../src/fs', () => ({
  ...jest.requireActual('../../src/fs'),
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
  apiReference: () => (_req: any, _res: any, next: Function) => next()
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
  const baseConfig: Partial<CatbeeGlobalServerConfig> = {
    port: 4000,
    host: 'localhost',
    requestLogging: { enable: false }, // Disable for cleaner test output
    healthCheck: { path: '/healthz', detailed: true }
  };

  describe('Initialization', () => {
    it('should accept a frozen config from ServerConfigBuilder without mutating the original object', async () => {
      const builtConfig = new ServerConfigBuilder().withPort(3001).withHost('::1').build();

      expect(Object.isFrozen(builtConfig)).toBe(true);
      expect(() => new ExpressServer(builtConfig)).not.toThrow();
      expect(builtConfig.host).toBe('::1');

      const server = new ExpressServer(builtConfig);
      await server.waitUntilReady();
      expect(server.getHost()).toBe('::1');
      expect(server.getUrl()).toBe('http://[::1]:3001');
    });

    it('should initialize with default config', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();
      expect(server.getConfig()).toBeDefined();
      expect(server.getApp()).toBeDefined();
    });

    it('should return configured port when server is not started', async () => {
      const server = new ExpressServer({ ...baseConfig, port: 3001 });
      await server.waitUntilReady();
      expect(server.getPort()).toBe(3001);
    });

    it('should return server URL when server is not started', async () => {
      const server = new ExpressServer({ ...baseConfig, port: 3001, host: '127.0.0.1' });
      await server.waitUntilReady();
      expect(server.getUrl()).toBe('http://127.0.0.1:3001');
    });

    it('should format IPv6 addresses correctly in URLs', async () => {
      const server = new ExpressServer({ ...baseConfig, port: 3001, host: '::1' });
      await server.waitUntilReady();
      expect(server.getUrl()).toBe('http://[::1]:3001');

      const server2 = new ExpressServer({ ...baseConfig, port: 3002, host: '2001:db8::1' });
      await server2.waitUntilReady();
      expect(server2.getUrl()).toBe('http://[2001:db8::1]:3002');

      // Bracketed input should be normalized (brackets stripped for server.listen compatibility)
      const server3 = new ExpressServer({ ...baseConfig, port: 3003, host: '[::1]' });
      await server3.waitUntilReady();
      expect(server3.getHost()).toBe('::1'); // Brackets stripped internally
      expect(server3.getUrl()).toBe('http://[::1]:3003'); // But re-added for URLs
    });

    it('should detect dynamic port configuration', async () => {
      const server = new ExpressServer({ ...baseConfig, port: 0 });
      await server.waitUntilReady();
      expect(server.isPortDynamic()).toBe(true);

      const server2 = new ExpressServer({ ...baseConfig, port: 3000 });
      await server2.waitUntilReady();
      expect(server2.isPortDynamic()).toBe(false);
    });

    it('should return server state information', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();

      expect(server.isRunning()).toBe(false);
      expect(server.getHost()).toBe('localhost');
      expect(server.getProtocol()).toBe('http');
      expect(server.isHttps()).toBe(false);

      await server.start();

      expect(server.isRunning()).toBe(true);

      await killServer(server);
    });

    it('should return configured port when server address is not an object', async () => {
      const server = new ExpressServer({ ...baseConfig, port: 4012 });
      await server.waitUntilReady();

      (server as any).server = {
        address: () => 'named-pipe',
        listening: false
      };

      expect(server.getPort()).toBe(4012);
      expect(server.isRunning()).toBe(false);
    });

    it('should treat null https as enabled in isHttps guard', async () => {
      const server = new ExpressServer({ ...(baseConfig as any), https: null as any });
      await server.waitUntilReady();

      expect(server.isHttps()).toBe(true);
      expect(server.getProtocol()).toBe('http');
    });

    it('should handle HTTPS configuration', async () => {
      const httpsConfig = {
        ...baseConfig,
        https: { key: 'dummy', cert: 'dummy' }
      };
      const server = new ExpressServer(httpsConfig);
      await server.waitUntilReady();

      expect(server.getProtocol()).toBe('https');
      expect(server.isHttps()).toBe(true);
    });

    it('should allow setting port before server starts', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();

      server.setPort(4000);
      expect(server.getPort()).toBe(4000);
      expect(server.getUrl()).toBe('http://localhost:4000');
    });

    it('should throw when setting port after server starts', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();
      await server.start();

      expect(() => server.setPort(4000)).toThrow('Cannot change port after server has started');

      await killServer(server);
    });

    it('should throw when setting invalid port', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();

      expect(() => server.setPort(-1)).toThrow('Port must be a valid number between 0 and 65535');
      expect(() => server.setPort(70000)).toThrow('Port must be a valid number between 0 and 65535');
    });

    it('should throw when setting invalid host', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();

      expect(() => server.setHost('not a valid host')).toThrow('Host must be a valid hostname or IP address');
    });

    it('should allow setting host before server starts', async () => {
      const server = new ExpressServer(baseConfig);
      await server.waitUntilReady();

      server.setHost('127.0.0.1');
      expect(server.getHost()).toBe('127.0.0.1');
      expect(server.getUrl()).toBe('http://127.0.0.1:4000');

      // IPv6 addresses should work
      server.setHost('::1');
      expect(server.getHost()).toBe('::1');
      expect(server.getUrl()).toBe('http://[::1]:4000');

      // Bracketed IPv6 should be normalized
      server.setHost('[2001:db8::1]');
      expect(server.getHost()).toBe('2001:db8::1');
      expect(server.getUrl()).toBe('http://[2001:db8::1]:4000');
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

    it('should return the actual port when server is running', async () => {
      const server = new ExpressServer({ ...baseConfig, port: 0 });
      await server.waitUntilReady();

      // Before starting, should return config port (0)
      expect(server.getPort()).toBe(0);

      // Start the server
      await server.start();

      // After starting, should return the actual assigned port
      const actualPort = server.getPort();
      expect(actualPort).toBeGreaterThan(0);
      expect(actualPort).toBeLessThanOrEqual(65535);

      // URL should include the actual port
      const url = server.getUrl();
      expect(url).toMatch(/^http:\/\/localhost:\d+$/);
      expect(url).toContain(actualPort.toString());

      await killServer(server);
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
      expect(readFileSync).toHaveBeenCalledWith(keyPath);
      expect(readFileSync).toHaveBeenCalledWith(certPath);

      await killServer(server);
    });

    it('should normalize bracketed IPv6 hosts for server.listen compatibility', async () => {
      // Test that bracketed IPv6 input works (brackets stripped internally)
      const server = new ExpressServer({ ...baseConfig, port: 0, host: '[::1]' });
      await server.waitUntilReady();

      // Host should be normalized (brackets stripped)
      expect(server.getHost()).toBe('::1');

      // Server should start successfully (proves server.listen works with normalized host)
      await server.start();
      expect(server.isRunning()).toBe(true);

      // URL should have brackets re-added
      const url = server.getUrl();
      expect(url).toMatch(/^http:\/\/\[::1\]:\d+$/);

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

    it('should handle custom routes', async () => {
      const server = new ExpressServer(baseConfig);
      server.registerRoute(['get'], '/test-route', (_req, res) => {
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
      const middleware = jest.fn((_req, _res, next) => next());
      server.registerMiddleware('/middleware-test', middleware);
      await server.start();
      const res = await request(server.getApp()).get('/middleware-test/something');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(middleware).toHaveBeenCalled();

      await killServer(server);
    });

    it('should apply global middleware', async () => {
      const server = new ExpressServer(baseConfig);
      const middleware = jest.fn((_req, _res, next) => next());
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
      router.get('/custom-route', (_req, res) => {
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
      router.get('/nested', (_req, res) => {
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

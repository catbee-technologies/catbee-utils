import { ExpressServer, ServerConfigBuilder } from '../../src/server';
import { CatbeeGlobalServerConfig } from '../../src/types/server';
import request from 'supertest';
import express from 'express';
import { HttpStatusCodes } from '../../src/http-status-codes';
import { readFileSync } from '../../src/fs';
import * as envUtils from '../../src/env';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { HealthzServer } from '../../src/healthz-server';

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
    await server.stop(true);
  } catch {
    // Ignore errors during cleanup
  }
}

function fetchProbe(port: number, path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}${path}`, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode!, body: data });
          }
        });
      })
      .on('error', reject);
  });
}

describe('ExpressServer', () => {
  const baseConfig: Partial<CatbeeGlobalServerConfig> = {
    port: 4000,
    host: 'localhost',
    requestLogging: { enable: false } // Disable for cleaner test output
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
      expect(server.app).toBeDefined();
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
        globalPrefix: '/api/v1'
      };

      const server = new ExpressServer(config);
      const router = express.Router();
      router.get('/test', (_req, res) => res.json({ status: 'ok' }));
      server.addBaseRouter(router);
      await server.waitUntilReady();

      // Start the server
      await server.start();

      // Test that route has the prefix
      const res = await request(server.app).get('/api/v1/test');
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body?.status).toBe('ok');

      // Regular path without prefix should 404
      const res2 = await request(server.app).get('/test');
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

    it('should handle concurrent start() calls safely without duplicates', async () => {
      const server = new ExpressServer({ ...baseConfig, port: 0 });
      const [server1, server2] = await Promise.all([server.start(), server.start()]);
      expect(server1).toBe(server2);
      expect(server.isRunning()).toBe(true);
      await killServer(server);
    });

    it('should reset this.server to null when startup fails', async () => {
      const server1 = new ExpressServer({ ...baseConfig, port: 0 });
      await server1.start();
      const port = server1.getPort();

      const server2 = new ExpressServer({ ...baseConfig, port });
      await expect(server2.start()).rejects.toThrow();
      expect(server2.getServer()).toBeNull();
      expect(server2.isRunning()).toBe(false);

      await killServer(server1);
    });

    it('should execute onServerCreated before listening and afterStart', async () => {
      const lifecycleOrder: string[] = [];
      const hooks = {
        onServerCreated: jest.fn(() => {
          lifecycleOrder.push('onServerCreated');
        }),
        afterStart: jest.fn(() => {
          lifecycleOrder.push('afterStart');
        })
      };

      const server = new ExpressServer({ ...baseConfig, port: 0 }, hooks);
      await server.start();

      expect(lifecycleOrder).toEqual(['onServerCreated', 'afterStart']);
      expect(hooks.onServerCreated).toHaveBeenCalledTimes(1);
      expect(hooks.afterStart).toHaveBeenCalledTimes(1);

      await killServer(server);
    });
  });

  describe('Routes & Middleware', () => {
    it('should handle custom routes', async () => {
      const server = new ExpressServer(baseConfig);
      server.registerRoute(['get'], '/test-route', (_req, res) => {
        res.status(200).json({ success: true, message: 'Custom route' });
      });

      await server.start();

      const res = await request(server.app).get('/test-route');

      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Custom route');

      await killServer(server);
    });

    it('should handle 404 for unknown routes', async () => {
      const server = new ExpressServer(baseConfig);
      await server.start();

      const res = await request(server.app).get('/non-existent-route');

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
      const res = await request(server.app).get('/middleware-test/something');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(middleware).toHaveBeenCalled();

      await killServer(server);
    });

    it('should apply global middleware', async () => {
      const server = new ExpressServer(baseConfig);
      const middleware = jest.fn((_req, _res, next) => next());
      server.useMiddleware(middleware);
      await server.start();

      const res = await request(server.app).get('/random-path');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(middleware).toHaveBeenCalled();

      await killServer(server);
    });
  });

  describe('Health Checks & Readiness', () => {
    afterEach(async () => {
      await HealthzServer.stop();
    });

    it('should report ready status via server.ready()', async () => {
      const server = new ExpressServer({
        port: 0,
        healthzServer: { enable: true, port: 0, shutdownDelayMs: 0 }
      });
      await server.waitUntilReady();
      await server.start();

      expect(await server.ready()).toBe(true);

      server.setReady(false);
      expect(await server.ready()).toBe(false);

      await killServer(server);
    });

    it('should handle async health checks on HealthzServer', async () => {
      const server = new ExpressServer({
        port: 0,
        healthzServer: { enable: true, port: 0, shutdownDelayMs: 0 }
      });

      const asyncCheck = jest.fn().mockResolvedValue(true);
      server.registerHealthCheck('async-check', asyncCheck, 'readiness');

      await server.waitUntilReady();
      await server.start();

      const addr = server.getHealthzAddress()!;
      const res = await fetchProbe(addr.port, '/readyz');

      expect(res.status).toBe(200);
      expect(asyncCheck).toHaveBeenCalled();
      expect(res.body.checks).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'async-check', ok: true })])
      );

      await killServer(server);
    });

    it('should handle health check errors gracefully on HealthzServer', async () => {
      const server = new ExpressServer({
        port: 0,
        healthzServer: { enable: true, port: 0, shutdownDelayMs: 0 }
      });

      const errorCheck = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      server.registerHealthCheck('error-check', errorCheck, 'readiness');

      await server.waitUntilReady();
      await server.start();

      const addr = server.getHealthzAddress()!;
      const res = await fetchProbe(addr.port, '/readyz');

      expect(res.status).toBe(503);
      expect(errorCheck).toHaveBeenCalled();
      expect(res.body.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'error-check',
            ok: false,
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

      const res = await request(server.app).get('/custom-route');

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

      const res = await request(server.app).get('/api/nested');
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Nested route');

      await killServer(server);
    });

    it('should support both createRouter and setBaseRouter together without dropping routes', async () => {
      const server = new ExpressServer(baseConfig);
      const subRouter = server.createRouter('/api');
      subRouter.get('/users', (_req, res) => {
        res.status(HttpStatusCodes.OK).json({ success: true, count: 5 });
      });

      const customBase = express.Router();
      customBase.get('/custom', (_req, res) => {
        res.status(HttpStatusCodes.OK).json({ success: true, custom: true });
      });
      server.setBaseRouter(customBase);

      await server.start();

      const resSub = await request(server.getApp()).get('/api/users');
      expect(resSub.status).toBe(HttpStatusCodes.OK);
      expect(resSub.body.count).toBe(5);

      const resCustom = await request(server.getApp()).get('/custom');
      expect(resCustom.status).toBe(HttpStatusCodes.OK);
      expect(resCustom.body.custom).toBe(true);

      await killServer(server);
    });

    it('should ignore duplicate setBaseRouter calls for the same router instance', async () => {
      const server = new ExpressServer(baseConfig);
      const customBase = express.Router();
      let callCount = 0;
      customBase.use((_req, _res, next) => {
        callCount++;
        next();
      });
      customBase.get('/dedup', (_req, res) => {
        res.status(HttpStatusCodes.OK).json({ success: true });
      });

      server.setBaseRouter(customBase);
      server.setBaseRouter(customBase); // duplicate call

      await server.start();

      const res = await request(server.getApp()).get('/dedup');
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(callCount).toBe(1);

      await killServer(server);
    });

    it('should support addBaseRouter', async () => {
      const server = new ExpressServer(baseConfig);
      const router = express.Router();
      router.get('/added', (_req, res) => res.json({ added: true }));
      server.addBaseRouter(router);
      await server.start();

      const res = await request(server.getApp()).get('/added');
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.body.added).toBe(true);

      await killServer(server);
    });

    it('should provide shorthand routing methods (get, post, put, delete, patch)', async () => {
      const server = new ExpressServer(baseConfig);
      server
        .get('/shorthand-get', (_req, res) => res.json({ method: 'GET' }))
        .post('/shorthand-post', (_req, res) => res.json({ method: 'POST' }))
        .put('/shorthand-put', (_req, res) => res.json({ method: 'PUT' }))
        .delete('/shorthand-delete', (_req, res) => res.json({ method: 'DELETE' }))
        .patch('/shorthand-patch', (_req, res) => res.json({ method: 'PATCH' }));

      await server.start();

      const resGet = await request(server.getApp()).get('/shorthand-get');
      expect(resGet.body.method).toBe('GET');

      const resPost = await request(server.getApp()).post('/shorthand-post');
      expect(resPost.body.method).toBe('POST');

      const resPut = await request(server.getApp()).put('/shorthand-put');
      expect(resPut.body.method).toBe('PUT');

      const resDelete = await request(server.getApp()).delete('/shorthand-delete');
      expect(resDelete.body.method).toBe('DELETE');

      const resPatch = await request(server.getApp()).patch('/shorthand-patch');
      expect(resPatch.body.method).toBe('PATCH');

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
      server.disableGracefulShutdown();
      processOnSpy.mockRestore();
    });

    it('should unregister signal handlers when disableGracefulShutdown is called', () => {
      const processRemoveListenerSpy = jest.spyOn(process, 'removeListener');

      const server = new ExpressServer(baseConfig);
      server.enableGracefulShutdown(['SIGTERM', 'SIGINT']);
      server.disableGracefulShutdown();

      expect(processRemoveListenerSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(processRemoveListenerSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

      processRemoveListenerSpy.mockRestore();
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
      const res = await request(server.app).get('/non-existent-path');

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
      const res = await request(server.app).get('/non-existent-path');

      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(res.body).toHaveProperty('message');

      await killServer(server);
    });
  });

  describe('HealthzServer & HealthCheck Integration', () => {
    afterEach(async () => {
      await HealthzServer.stop();
    });

    it('should not mount any healthz route on Express server', async () => {
      const server = new ExpressServer({ port: 0, host: 'localhost' });
      await server.waitUntilReady();
      const res = await request(server.app).get('/healthz');
      expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
    });

    it('should manage HealthzServer lifecycle with ExpressServer', async () => {
      const serverConfig = new ServerConfigBuilder()
        .withPort(0)
        .withHealthzServer({ port: 0, shutdownDelayMs: 0 })
        .disableOpenApi()
        .build();

      const server = new ExpressServer(serverConfig);
      expect(server.isHealthzServerEnabled()).toBe(true);

      await server.waitUntilReady();
      await server.start();

      const addr = server.getHealthzAddress();
      expect(addr).toBeDefined();
      expect(addr!.port).toBeGreaterThan(0);
      expect(server.isReady()).toBe(true);
      expect(HealthzServer.isRunning()).toBe(true);
      expect(HealthzServer.isStartupComplete()).toBe(true);

      // Verify liveness probe
      const liveness = await fetchProbe(addr!.port, '/healthz');
      expect(liveness.status).toBe(200);
      expect(liveness.body.status).toBe('ok');

      // Verify readiness probe
      const readiness = await fetchProbe(addr!.port, '/readyz');
      expect(readiness.status).toBe(200);
      expect(readiness.body.status).toBe('ok');

      // Verify startup probe
      const startup = await fetchProbe(addr!.port, '/startupz');
      expect(startup.status).toBe(200);
      expect(startup.body.status).toBe('ok');

      // Test manual readiness control
      server.setReady(false);
      expect(server.isReady()).toBe(false);
      const unready = await fetchProbe(addr!.port, '/readyz');
      expect(unready.status).toBe(503);

      server.setReady(true);
      expect(server.isReady()).toBe(true);
      const readyAgain = await fetchProbe(addr!.port, '/readyz');
      expect(readyAgain.status).toBe(200);

      // Stopping ExpressServer stops HealthzServer
      await killServer(server);
      expect(HealthzServer.isRunning()).toBe(false);
      expect(HealthzServer.isStartupComplete()).toBe(false);
      expect(server.getHealthzAddress()).toBeNull();
    });

    it('should sync registerHealthCheck to HealthzServer probes', async () => {
      const serverConfig = new ServerConfigBuilder()
        .withPort(0)
        .withHealthzServer({ port: 0, shutdownDelayMs: 0 })
        .disableOpenApi()
        .build();

      const server = new ExpressServer(serverConfig);

      server.registerHealthCheck('db-check', () => true, 'readiness');
      server.registerHealthCheck('live-check', () => true, 'liveness');

      await server.waitUntilReady();
      await server.start();

      const addr = server.getHealthzAddress()!;

      const liveRes = await fetchProbe(addr.port, '/healthz');
      expect(liveRes.status).toBe(200);
      expect(liveRes.body.checks).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'live-check', ok: true })])
      );

      const readyRes = await fetchProbe(addr.port, '/readyz');
      expect(readyRes.status).toBe(200);
      expect(readyRes.body.checks).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'db-check', ok: true })])
      );

      // Dynamic registration while server is running
      server.registerHealthCheck('dynamic-db', () => false, 'readiness');
      const dynamicReady = await fetchProbe(addr.port, '/readyz');
      expect(dynamicReady.status).toBe(503);
      expect(dynamicReady.body.checks).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'dynamic-db', ok: false })])
      );

      await killServer(server);
    });

    it('should reject start() and clean up when HealthzServer fails to start', async () => {
      const healthzStartSpy = jest
        .spyOn(HealthzServer, 'start')
        .mockRejectedValueOnce(new Error('Healthz port collision EADDRINUSE'));

      const server = new ExpressServer({
        port: 0,
        healthzServer: { enable: true, port: 8282, shutdownDelayMs: 0 }
      });
      await server.waitUntilReady();

      await expect(server.start()).rejects.toThrow('Healthz port collision EADDRINUSE');
      expect(server.getServer()).toBeNull();
      expect(server.isRunning()).toBe(false);

      healthzStartSpy.mockRestore();
    });

    it('should format EADDRINUSE error with clear, actionable message when port is already in use', async () => {
      const blocker = http.createServer();
      await new Promise<void>((resolve, reject) => {
        blocker.once('error', reject);
        blocker.listen(0, '127.0.0.1', () => resolve());
      });
      const busyPort = (blocker.address() as AddressInfo).port;

      const server = new ExpressServer({
        port: busyPort,
        host: '127.0.0.1',
        healthzServer: { enable: false }
      });
      await server.waitUntilReady();

      try {
        await expect(server.start()).rejects.toThrow(
          `Port ${busyPort} is already in use (127.0.0.1:${busyPort}). Choose a different port via SERVER_PORT/PORT`
        );
        expect(server.getServer()).toBeNull();
        expect(server.isRunning()).toBe(false);
      } finally {
        await new Promise<void>(resolve => blocker.close(() => resolve()));
      }
    });

    it('should start HealthzServer before the main Express server starts listening and coordinate probes', async () => {
      let probesBeforeListening: { healthz: number; readyz: number; startupz: number } | undefined;
      let healthzRunningBeforeListening = false;
      let startupCompleteBeforeListening: boolean | undefined;
      let readyBeforeListening: boolean | undefined;

      const serverConfig = new ServerConfigBuilder()
        .withPort(0)
        .withHealthzServer({ port: 0, shutdownDelayMs: 0 })
        .disableOpenApi()
        .build();

      const server = new ExpressServer(serverConfig, {
        onServerCreated: async () => {
          // At this point, HealthzServer is listening, but Express server.listen() has not completed
          healthzRunningBeforeListening = HealthzServer.isRunning();
          startupCompleteBeforeListening = HealthzServer.isStartupComplete();
          readyBeforeListening = HealthzServer.isReady();

          const port = server.getHealthzAddress()!.port;
          const live = await fetchProbe(port, '/healthz');
          const ready = await fetchProbe(port, '/readyz');
          const startup = await fetchProbe(port, '/startupz');

          probesBeforeListening = {
            healthz: live.status,
            readyz: ready.status,
            startupz: startup.status
          };
        }
      });

      await server.waitUntilReady();
      await server.start();

      // Before listening:
      // Healthz server is listening, but app is not yet started or ready
      expect(healthzRunningBeforeListening).toBe(true);
      expect(startupCompleteBeforeListening).toBe(false);
      expect(readyBeforeListening).toBe(false);
      expect(probesBeforeListening).toEqual({
        healthz: 200,
        readyz: 503,
        startupz: 503
      });

      // After listening:
      // Express server listening -> afterStart ran -> markStartupComplete() & setReady(true) called
      expect(server.isStartupComplete()).toBe(true);
      expect(server.isReady()).toBe(true);

      const port = server.getHealthzAddress()!.port;
      const liveAfter = await fetchProbe(port, '/healthz');
      const readyAfter = await fetchProbe(port, '/readyz');
      const startupAfter = await fetchProbe(port, '/startupz');

      expect(liveAfter.status).toBe(200);
      expect(readyAfter.status).toBe(200);
      expect(startupAfter.status).toBe(200);

      await killServer(server);
    });

    it('falls back readinessChecks to checks when readinessChecks is omitted', async () => {
      const serverConfig = new ServerConfigBuilder()
        .withPort(0)
        .withHealthzServer({
          port: 0,
          shutdownDelayMs: 0,
          checks: [{ name: 'fallback-check', check: () => true }]
        })
        .disableOpenApi()
        .build();

      const server = new ExpressServer(serverConfig);
      await server.waitUntilReady();
      await server.start();

      const addr = server.getHealthzAddress()!;

      // Liveness probe runs fallback-check
      const live = await fetchProbe(addr.port, '/healthz');
      expect(live.body.checks).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'fallback-check', ok: true })])
      );

      // Readiness probe ALSO runs fallback-check because readinessChecks was omitted!
      const ready = await fetchProbe(addr.port, '/readyz');
      expect(ready.body.checks).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'fallback-check', ok: true })])
      );

      await killServer(server);
    });

    it('services traffic with Connection: close during graceful drain delay', async () => {
      const serverConfig = new ServerConfigBuilder()
        .withPort(0)
        .withHealthzServer({ port: 0, shutdownDelayMs: 200 })
        .disableOpenApi()
        .build();

      const server = new ExpressServer(serverConfig);
      server.get('/test-drain', (_req, res) => {
        res.json({ success: true });
      });

      await server.waitUntilReady();
      await server.start();

      // Start stop() in background (which starts 200ms drain delay)
      const stopPromise = server.stop(false);

      // Give it 30ms to enter drain delay
      await new Promise(r => setTimeout(r, 30));

      // During drain delay, request should succeed (status 200) with Connection: close
      const res = await request(server.app).get('/test-drain');
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(res.headers.connection).toBe('close');
      expect(res.body).toEqual({ success: true });

      await stopPromise;
    });

    it('handles concurrent stop() calls safely without error', async () => {
      const server = new ExpressServer({
        port: 0,
        healthzServer: { enable: true, port: 0, shutdownDelayMs: 0 },
        openApi: { enable: false }
      });

      await server.waitUntilReady();
      await server.start();

      // Concurrent stop() calls
      await expect(Promise.all([server.stop(), server.stop()])).resolves.not.toThrow();
      expect(server.isRunning()).toBe(false);
      expect(HealthzServer.isRunning()).toBe(false);
    });

    it('supports unregisterHealthCheck and getHealthzChecks', async () => {
      const server = new ExpressServer({
        port: 0,
        healthzServer: { enable: true, port: 0, shutdownDelayMs: 0 },
        openApi: { enable: false }
      });

      server.registerHealthCheck('db', () => true, 'readiness');
      server.registerHealthCheck('ping', () => true, 'liveness');

      const queued = server.getHealthzChecks();
      expect(queued.readiness.map(c => c.name)).toContain('db');
      expect(queued.liveness.map(c => c.name)).toContain('ping');

      server.unregisterHealthCheck('db', 'readiness');
      expect(server.getHealthzChecks().readiness.map(c => c.name)).not.toContain('db');

      server.unregisterHealthCheck('ping', 'liveness');
      expect(server.getHealthzChecks().liveness.map(c => c.name)).not.toContain('ping');
    });

    it('deduplicates checks registered with same name on ExpressServer', async () => {
      const server = new ExpressServer({
        port: 0,
        healthzServer: { enable: true, port: 0, shutdownDelayMs: 0 },
        openApi: { enable: false }
      });

      server.registerHealthCheck('metric', () => true, 'liveness');
      server.registerHealthCheck('metric', () => false, 'liveness');

      const checks = server.getHealthzChecks();
      expect(checks.liveness.filter(c => c.name === 'metric')).toHaveLength(1);
    });

    it('returns correct readiness and startup status when healthzServer is disabled', async () => {
      const server = new ExpressServer({ port: 0, host: 'localhost', openApi: { enable: false } });
      await server.waitUntilReady();

      expect(server.isHealthzServerEnabled()).toBe(false);
      expect(server.isReady()).toBe(false);
      expect(server.ready()).toBe(false);
      expect(server.isStartupComplete()).toBe(false);

      await server.start();

      expect(server.isReady()).toBe(true);
      expect(server.ready()).toBe(true);
      expect(server.isStartupComplete()).toBe(true);

      // Manual readiness toggling
      server.setReady(false);
      expect(server.isReady()).toBe(false);
      server.setReady(true);
      expect(server.isReady()).toBe(true);

      await killServer(server);

      expect(server.isReady()).toBe(false);
      expect(server.isStartupComplete()).toBe(false);
    });
  });
});

import http from 'node:http';
import { HealthzServer, getDefaultHealthzConfig, resolveConfig } from '../src/healthz-server';
import { Env } from '../src/env';
import type { ProbeResponse } from '../src/healthz-server';

function get(port: number, path: string): Promise<{ status: number; body: ProbeResponse }> {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}${path}`, res => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(data) });
          } catch {
            reject(new Error(`Invalid JSON: ${data}`));
          }
        });
      })
      .on('error', reject);
  });
}

describe('HealthzServer', () => {
  afterEach(async () => {
    await HealthzServer.stop();
  });

  it('starts on an ephemeral port and returns address info', async () => {
    const addr = await HealthzServer.start({ port: 0 });
    expect(addr).not.toBeNull();
    expect(addr!.port).toBeGreaterThan(0);
    expect(addr!.address).toBeDefined();
  });

  it('returns null if already started (singleton)', async () => {
    await HealthzServer.start({ port: 0 });
    const second = await HealthzServer.start({ port: 0 });
    expect(second).toBeNull();
  });

  it('can be stopped and restarted', async () => {
    const first = await HealthzServer.start({ port: 0 });
    expect(first).not.toBeNull();
    await HealthzServer.stop();
    const second = await HealthzServer.start({ port: 0 });
    expect(second).not.toBeNull();
    expect(second!.port).toBeGreaterThan(0);
  });

  describe('GET /healthz (liveness)', () => {
    let port: number;

    beforeEach(async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      port = addr.port;
    });

    it('responds 200 with status ok when no checks configured', async () => {
      const { status, body } = await get(port, '/healthz');
      expect(status).toBe(200);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('returns JSON content-type', async () => {
      const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/healthz`, resolve).on('error', reject);
      });
      expect(res.headers['content-type']).toContain('application/json');
      res.resume(); // drain
    });
  });

  describe('GET /healthz with checks', () => {
    it('returns 200 when all checks pass', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [
          { name: 'db', check: () => true },
          { name: 'cache', check: () => Promise.resolve(true) }
        ]
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(200);
      expect(body.status).toBe('ok');
      expect(body.checks).toHaveLength(2);
      expect(body.checks![0].ok).toBe(true);
      expect(body.checks![1].ok).toBe(true);
    });

    it('returns 503 when a check fails', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [
          { name: 'healthy', check: () => true },
          {
            name: 'broken',
            check: () => {
              throw new Error('Connection refused');
            }
          }
        ]
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.checks!.find(c => c.name === 'broken')?.error).toBe('Connection refused');
    });

    it('returns 503 when a check returns false', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [{ name: 'disk', check: () => false }]
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(503);
      expect(body.status).toBe('unhealthy');
    });

    it('times out slow checks', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checkTimeoutMs: 50,
        checks: [{ name: 'slow', check: () => new Promise(r => setTimeout(() => r(true), 500)) }]
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(503);
      expect(body.checks![0].error).toContain('timed out');
    });
  });

  describe('GET /healthz with onHealthCheck', () => {
    it('returns 200 when custom health check returns true', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        onHealthCheck: () => true
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(200);
      expect(body.status).toBe('ok');
    });

    it('returns 503 when custom health check returns false', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        onHealthCheck: () => false
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.checks!.find(c => c.name === 'custom')?.error).toBe('Health check returned false');
    });

    it('returns 503 when custom health check throws', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        onHealthCheck: () => {
          throw new Error('DB down');
        }
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.checks!.find(c => c.name === 'custom')?.error).toBe('DB down');
    });
  });

  describe('GET /readyz (readiness)', () => {
    it('returns 503 before setReady(true)', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      const { status, body } = await get(addr.port, '/readyz');
      expect(status).toBe(503);
      expect(body.status).toBe('unhealthy');
    });

    it('returns 200 after setReady(true)', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      HealthzServer.setReady(true);
      const { status, body } = await get(addr.port, '/readyz');
      expect(status).toBe(200);
      expect(body.status).toBe('ok');
    });

    it('returns 503 after setReady(false)', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      HealthzServer.setReady(true);
      HealthzServer.setReady(false);
      const { status } = await get(addr.port, '/readyz');
      expect(status).toBe(503);
    });

    it('runs readinessChecks when configured', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        readinessChecks: [{ name: 'db', check: () => true }]
      }))!;
      HealthzServer.setReady(true);

      const { status, body } = await get(addr.port, '/readyz');
      expect(status).toBe(200);
      expect(body.checks).toHaveLength(1);
    });

    it('falls back to general checks when readinessChecks is omitted', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [{ name: 'general', check: () => true }]
      }))!;
      HealthzServer.setReady(true);

      const { status, body } = await get(addr.port, '/readyz');
      expect(status).toBe(200);
      expect(body.checks).toHaveLength(1);
      expect(body.checks![0].name).toBe('general');
    });

    it('runs no checks when readinessChecks is explicitly empty', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [{ name: 'general', check: () => true }],
        readinessChecks: []
      }))!;
      HealthzServer.setReady(true);

      const { status, body } = await get(addr.port, '/readyz');
      expect(status).toBe(200);
      expect(body.checks).toBeUndefined();
    });
  });

  describe('GET /startupz (startup)', () => {
    it('returns 200 immediately after start() (server has started)', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      // Startup probe reflects that the server process started, not readiness
      const { status, body } = await get(addr.port, '/startupz');
      expect(status).toBe(200);
      expect(body.status).toBe('ok');
    });

    it('is independent from readiness state', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      // Startup should be 200 even without setReady
      const startup = await get(addr.port, '/startupz');
      expect(startup.status).toBe(200);

      // Readiness should still be 503
      const readiness = await get(addr.port, '/readyz');
      expect(readiness.status).toBe(503);
    });
  });

  describe('edge cases', () => {
    it('returns 404 for unknown paths', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      const { status } = await get(addr.port, '/unknown');
      expect(status).toBe(404);
    });

    it('supports custom endpoint paths', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        healthzPath: '/live',
        readyzPath: '/ready',
        startupzPath: '/started'
      }))!;

      const liveness = await get(addr.port, '/live');
      const startup = await get(addr.port, '/started');

      expect(liveness.status).toBe(200);
      expect(startup.status).toBe(200);

      // Readiness requires setReady
      HealthzServer.setReady(true);
      const readiness = await get(addr.port, '/ready');
      expect(readiness.status).toBe(200);

      // Old paths should 404
      const old = await get(addr.port, '/healthz');
      expect(old.status).toBe(404);
    });

    it('omits check details when detailed is false', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        detailed: false,
        checks: [{ name: 'test', check: () => true }]
      }))!;

      const { body } = await get(addr.port, '/healthz');
      expect(body.checks).toBeUndefined();
    });

    it('includes uptimeSeconds in response', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      const { body } = await get(addr.port, '/healthz');
      expect(typeof body.uptimeSeconds).toBe('number');
      expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('isReady() reflects readiness state', async () => {
      await HealthzServer.start({ port: 0 });
      expect(HealthzServer.isReady()).toBe(false);
      HealthzServer.setReady(true);
      expect(HealthzServer.isReady()).toBe(true);
      HealthzServer.setReady(false);
      expect(HealthzServer.isReady()).toBe(false);
    });

    it('isStarted() reflects whether server is running', async () => {
      expect(HealthzServer.isStarted()).toBe(false);
      await HealthzServer.start({ port: 0 });
      expect(HealthzServer.isStarted()).toBe(true);
      await HealthzServer.stop();
      expect(HealthzServer.isStarted()).toBe(false);
    });

    it('setReady() is a no-op when server is not running', () => {
      // Should not throw
      HealthzServer.setReady(true);
      expect(HealthzServer.isReady()).toBe(false);
    });

    it('stop() is a no-op when server is not running', async () => {
      // Should not throw
      await HealthzServer.stop();
    });

    it('records check duration', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [{ name: 'delay', check: () => new Promise(r => setTimeout(() => r(true), 30)) }]
      }))!;

      const { body } = await get(addr.port, '/healthz');
      expect(body.checks![0].durationMs).toBeGreaterThanOrEqual(20);
    });

    it('cleans up singleton when listen() fails (port collision)', async () => {
      // Create a blocking server on a random port with the same host
      const blockingServer = http.createServer();
      await new Promise<void>(resolve => blockingServer.listen({ host: '0.0.0.0', port: 0 }, resolve));
      const occupiedPort = (blockingServer.address() as any).port;

      try {
        await expect(HealthzServer.start({ host: '0.0.0.0', port: occupiedPort })).rejects.toThrow();
        expect(HealthzServer.getInstance()).toBeUndefined();

        // Ensure subsequent start() succeeds and is not blocked by the failed start
        const addr = await HealthzServer.start({ port: 0 });
        expect(addr).not.toBeNull();
      } finally {
        await new Promise<void>(resolve => blockingServer.close(() => resolve()));
      }
    });

    it('passes AbortSignal to checks and signals abort on timeout', async () => {
      let aborted = false;
      const addr = (await HealthzServer.start({
        port: 0,
        checkTimeoutMs: 50,
        checks: [
          {
            name: 'cancellable',
            check: signal =>
              new Promise((resolve, reject) => {
                signal.addEventListener('abort', () => {
                  aborted = true;
                  reject(new Error('Operation aborted'));
                });
              })
          }
        ]
      }))!;

      const { status, body } = await get(addr.port, '/healthz');
      expect(status).toBe(503);
      expect(aborted).toBe(true);
      expect(body.checks![0].error).toContain('timed out');
    });

    it('supports HEAD requests without response body', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      const { statusCode, headers, body } = await new Promise<{
        statusCode: number;
        headers: http.IncomingHttpHeaders;
        body: string;
      }>((resolve, reject) => {
        const req = http.request(`http://127.0.0.1:${addr.port}/healthz`, { method: 'HEAD' }, res => {
          let raw = '';
          res.on('data', chunk => {
            raw += chunk;
          });
          res.on('end', () => resolve({ statusCode: res.statusCode!, headers: res.headers, body: raw }));
        });
        req.on('error', reject);
        req.end();
      });

      expect(statusCode).toBe(200);
      expect(headers['content-type']).toContain('application/json');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(body).toBe('');
    });

    it('returns 405 Method Not Allowed for POST / PUT / DELETE', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = http.request(`http://127.0.0.1:${addr.port}/healthz`, { method: 'POST' }, resolve);
        req.on('error', reject);
        req.end();
      });

      expect(res.statusCode).toBe(405);
      res.resume();
    });
  });

  describe('environment variable controls', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
      Env.clearCache();
    });

    afterEach(async () => {
      await HealthzServer.stop();
      process.env = { ...originalEnv };
      Env.clearCache();
    });

    it('loads defaults from HEALTHZ_* environment variables', () => {
      process.env.HEALTHZ_HOST = '127.0.0.1';
      process.env.HEALTHZ_PORT = '9191';
      process.env.HEALTHZ_PATH = '/custom-live';
      process.env.HEALTHZ_READYZ_PATH = '/custom-ready';
      process.env.HEALTHZ_STARTUPZ_PATH = '/custom-start';
      process.env.HEALTHZ_DETAILED = 'false';
      process.env.HEALTHZ_CHECK_TIMEOUT_MS = '3000';
      process.env.HEALTHZ_SHUTDOWN_DELAY_MS = '7000';
      Env.clearCache();

      const config = getDefaultHealthzConfig();
      expect(config.host).toBe('127.0.0.1');
      expect(config.port).toBe(9191);
      expect(config.healthzPath).toBe('/custom-live');
      expect(config.readyzPath).toBe('/custom-ready');
      expect(config.startupzPath).toBe('/custom-start');
      expect(config.detailed).toBe(false);
      expect(config.checkTimeoutMs).toBe(3000);
      expect(config.shutdownDelayMs).toBe(7000);
    });

    it('falls back to SERVER_HEALTH_CHECK_* environment variables', () => {
      delete process.env.HEALTHZ_PATH;
      delete process.env.HEALTHZ_DETAILED;
      delete process.env.HEALTHZ_HOST;
      process.env.SERVER_HEALTH_CHECK_PATH = '/server-live';
      process.env.SERVER_HEALTH_CHECK_DETAILED_OUTPUT = 'false';
      process.env.SERVER_HOST = '10.0.0.1';
      Env.clearCache();

      const config = getDefaultHealthzConfig();
      expect(config.healthzPath).toBe('/server-live');
      expect(config.detailed).toBe(false);
      expect(config.host).toBe('10.0.0.1');
    });

    it('allows explicit user options to override environment variables', () => {
      process.env.HEALTHZ_PORT = '9999';
      process.env.HEALTHZ_PATH = '/env-live';
      Env.clearCache();

      const resolved = resolveConfig({
        port: 8080,
        healthzPath: '/override-live'
      });

      expect(resolved.port).toBe(8080);
      expect(resolved.healthzPath).toBe('/override-live');
    });

    it('validates port number range via Env.getPort', () => {
      process.env.HEALTHZ_PORT = '99999';
      Env.clearCache();

      expect(() => getDefaultHealthzConfig()).toThrow('must be a valid port number (0-65535)');
    });

    it('applies environment variables when starting HealthzServer with no options', async () => {
      process.env.HEALTHZ_PATH = '/env-healthz';
      Env.clearCache();

      const addr = (await HealthzServer.start({ port: 0 }))!;
      const { status } = await get(addr.port, '/env-healthz');
      expect(status).toBe(200);
    });
  });
});

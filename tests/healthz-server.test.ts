import http from 'node:http';
import type { AddressInfo } from 'node:net';
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
    it('returns 503 before markStartupComplete() and 200 after', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;

      // Before startup completion: 503
      const before = await get(addr.port, '/startupz');
      expect(before.status).toBe(503);
      expect(before.body.status).toBe('unhealthy');
      expect(HealthzServer.isStartupComplete()).toBe(false);

      // Signal startup complete
      HealthzServer.markStartupComplete();

      // After startup completion: 200
      const after = await get(addr.port, '/startupz');
      expect(after.status).toBe(200);
      expect(after.body.status).toBe('ok');
      expect(HealthzServer.isStartupComplete()).toBe(true);
    });

    it('is independent from readiness state', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      HealthzServer.markStartupComplete();

      // Startup should be 200 even without setReady
      const startup = await get(addr.port, '/startupz');
      expect(startup.status).toBe(200);

      // Readiness should still be 503
      const readiness = await get(addr.port, '/readyz');
      expect(readiness.status).toBe(503);
    });

    it('keeps startupComplete = true and /startupz = 200 when readiness becomes false', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      HealthzServer.markStartupComplete();
      HealthzServer.setReady(true);

      expect(HealthzServer.isStartupComplete()).toBe(true);
      expect(HealthzServer.isReady()).toBe(true);

      // Readiness transitions to false (e.g. during graceful drain or temporary dependency outage)
      HealthzServer.setReady(false);

      expect(HealthzServer.isStartupComplete()).toBe(true);
      expect(HealthzServer.isReady()).toBe(false);

      const startup = await get(addr.port, '/startupz');
      const readiness = await get(addr.port, '/readyz');

      expect(startup.status).toBe(200);
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

      HealthzServer.markStartupComplete();
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

    it('isRunning() reflects whether health server is running', async () => {
      expect(HealthzServer.isRunning()).toBe(false);
      await HealthzServer.start({ port: 0 });
      expect(HealthzServer.isRunning()).toBe(true);
      await HealthzServer.stop();
      expect(HealthzServer.isRunning()).toBe(false);
    });

    it('isStartupComplete() reflects whether application startup completed', async () => {
      expect(HealthzServer.isStartupComplete()).toBe(false);
      await HealthzServer.start({ port: 0 });
      expect(HealthzServer.isStartupComplete()).toBe(false);
      HealthzServer.markStartupComplete();
      expect(HealthzServer.isStartupComplete()).toBe(true);
      await HealthzServer.stop();
      expect(HealthzServer.isStartupComplete()).toBe(false);
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

    it('does not duplicate check when registered with type "both" and readinessChecks is undefined', async () => {
      let callCount = 0;
      const check = {
        name: 'shared-check',
        check: () => {
          callCount++;
          return true;
        }
      };

      const addr = (await HealthzServer.start({ port: 0 }))!;
      HealthzServer.registerCheck(check, 'both');
      HealthzServer.setReady(true);

      const res = await get(addr.port, '/readyz');
      expect(res.status).toBe(200);
      expect(res.body.checks).toHaveLength(1);
      expect(callCount).toBe(1);
    });

    it('matches endpoints with query strings and trailing slashes', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      HealthzServer.markStartupComplete();
      HealthzServer.setReady(true);

      // Trailing slash
      const liveSlash = await get(addr.port, '/healthz/');
      expect(liveSlash.status).toBe(200);

      // Query parameter
      const readyQuery = await get(addr.port, '/readyz?cache=bust&t=123');
      expect(readyQuery.status).toBe(200);

      // Both trailing slash and query param
      const startupBoth = await get(addr.port, '/startupz/?param=test');
      expect(startupBoth.status).toBe(200);
    });

    it('handles concurrent stop() calls safely without error', async () => {
      await HealthzServer.start({ port: 0 });
      expect(HealthzServer.isRunning()).toBe(true);

      // Concurrent stop() calls
      await expect(Promise.all([HealthzServer.stop(), HealthzServer.stop()])).resolves.not.toThrow();
      expect(HealthzServer.isRunning()).toBe(false);
    });

    it('copies check arrays defensively to prevent external mutation', async () => {
      const myChecks = [{ name: 'initial', check: () => true }];
      await HealthzServer.start({ port: 0, checks: myChecks });

      HealthzServer.registerCheck({ name: 'registered', check: () => true }, 'liveness');
      expect(myChecks).toHaveLength(1);
    });

    it('isolates liveness check from readiness when readinessChecks was undefined', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [{ name: 'common', check: () => true }]
      }))!;
      HealthzServer.setReady(true);

      HealthzServer.registerCheck({ name: 'live-only', check: () => true }, 'liveness');

      const liveRes = await get(addr.port, '/healthz');
      expect(liveRes.body.checks).toHaveLength(2);
      expect(liveRes.body.checks.map((c: any) => c.name)).toEqual(['common', 'live-only']);

      const readyRes = await get(addr.port, '/readyz');
      expect(readyRes.body.checks).toHaveLength(1);
      expect(readyRes.body.checks[0].name).toBe('common');
    });

    it('supports onLivenessCheck as a symmetrical alias for onHealthCheck', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        onLivenessCheck: () => true
      }))!;

      const liveRes = await get(addr.port, '/healthz');
      expect(liveRes.status).toBe(200);
      expect(liveRes.body.checks[0].name).toBe('custom');
      expect(liveRes.body.checks[0].ok).toBe(true);
    });

    it('ensures check registration is completely order-independent', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [{ name: 'base', check: () => true }]
      }))!;
      HealthzServer.setReady(true);

      // Register in mixed order
      HealthzServer.registerCheck({ name: 'both-1', check: () => true }, 'both');
      HealthzServer.registerCheck({ name: 'live-only', check: () => true }, 'liveness');
      HealthzServer.registerCheck({ name: 'ready-only', check: () => true }, 'readiness');
      HealthzServer.registerCheck({ name: 'both-2', check: () => true }, 'both');

      const liveRes = await get(addr.port, '/healthz');
      const liveNames = liveRes.body.checks.map((c: any) => c.name);
      expect(liveNames).toEqual(['base', 'both-1', 'live-only', 'both-2']);

      const readyRes = await get(addr.port, '/readyz');
      const readyNames = readyRes.body.checks.map((c: any) => c.name);
      expect(readyNames).toEqual(['base', 'both-1', 'ready-only', 'both-2']);
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

    it('prefers HEALTHZ_* over SERVER_HEALTHZ_* environment variables', () => {
      process.env.HEALTHZ_HOST = '127.0.0.1';
      process.env.SERVER_HEALTHZ_HOST = '192.168.1.100';
      process.env.HEALTHZ_PORT = '8888';
      process.env.SERVER_HEALTHZ_PORT = '7777';
      process.env.HEALTHZ_PATH = '/healthz';
      process.env.SERVER_HEALTHZ_PATH = '/server-healthz';
      process.env.HEALTHZ_READYZ_PATH = '/readyz';
      process.env.SERVER_READYZ_PATH = '/server-readyz';
      process.env.HEALTHZ_STARTUPZ_PATH = '/startupz';
      process.env.SERVER_STARTUPZ_PATH = '/server-startupz';
      process.env.HEALTHZ_DETAILED = 'false';
      process.env.SERVER_HEALTHZ_DETAILED = 'true';
      process.env.HEALTHZ_CHECK_TIMEOUT_MS = '4000';
      process.env.SERVER_HEALTHZ_CHECK_TIMEOUT_MS = '2500';
      process.env.HEALTHZ_SHUTDOWN_DELAY_MS = '8000';
      process.env.SERVER_HEALTHZ_SHUTDOWN_DELAY_MS = '6500';
      Env.clearCache();

      const config = HealthzServer.getDefaultConfig();
      expect(config.host).toBe('127.0.0.1');
      expect(config.port).toBe(8888);
      expect(config.healthzPath).toBe('/healthz');
      expect(config.readyzPath).toBe('/readyz');
      expect(config.startupzPath).toBe('/startupz');
      expect(config.detailed).toBe(false);
      expect(config.checkTimeoutMs).toBe(4000);
      expect(config.shutdownDelayMs).toBe(8000);
    });

    it('falls back to SERVER_HEALTHZ_* when HEALTHZ_* variables are not set', () => {
      delete process.env.HEALTHZ_HOST;
      delete process.env.HEALTHZ_PORT;
      delete process.env.HEALTHZ_PATH;
      delete process.env.HEALTHZ_READYZ_PATH;
      delete process.env.HEALTHZ_STARTUPZ_PATH;
      delete process.env.HEALTHZ_DETAILED;
      delete process.env.HEALTHZ_CHECK_TIMEOUT_MS;
      delete process.env.HEALTHZ_SHUTDOWN_DELAY_MS;

      process.env.SERVER_HEALTHZ_HOST = '192.168.1.100';
      process.env.SERVER_HEALTHZ_PORT = '7777';
      process.env.SERVER_HEALTHZ_PATH = '/server-healthz';
      process.env.SERVER_READYZ_PATH = '/server-readyz';
      process.env.SERVER_STARTUPZ_PATH = '/server-startupz';
      process.env.SERVER_HEALTHZ_DETAILED = 'false';
      process.env.SERVER_HEALTHZ_CHECK_TIMEOUT_MS = '2500';
      process.env.SERVER_HEALTHZ_SHUTDOWN_DELAY_MS = '6500';
      Env.clearCache();

      const config = HealthzServer.getDefaultConfig();
      expect(config.host).toBe('192.168.1.100');
      expect(config.port).toBe(7777);
      expect(config.healthzPath).toBe('/server-healthz');
      expect(config.readyzPath).toBe('/server-readyz');
      expect(config.startupzPath).toBe('/server-startupz');
      expect(config.detailed).toBe(false);
      expect(config.checkTimeoutMs).toBe(2500);
      expect(config.shutdownDelayMs).toBe(6500);
    });
  });

  describe('Instance methods and API parity', () => {
    it('provides instance and static getters for address, port, host, and url', async () => {
      const addr = (await HealthzServer.start({ port: 0, host: '127.0.0.1' }))!;
      const instance = HealthzServer.getInstance()!;
      expect(instance).toBeDefined();

      expect(instance.getAddress()).toEqual(addr);
      expect(HealthzServer.getAddress()).toEqual(addr);

      expect(instance.getPort()).toBe(addr.port);
      expect(HealthzServer.getPort()).toBe(addr.port);

      expect(instance.getHost()).toBe('127.0.0.1');
      expect(HealthzServer.getHost()).toBe('127.0.0.1');

      expect(instance.getUrl()).toBe(`http://127.0.0.1:${addr.port}`);
      expect(HealthzServer.getUrl()).toBe(`http://127.0.0.1:${addr.port}`);

      expect(instance.isRunning()).toBe(true);
      expect(instance.isReady()).toBe(false);
      instance.setReady(true);
      expect(instance.isReady()).toBe(true);

      expect(instance.isStartupComplete()).toBe(false);
      instance.markStartupComplete();
      expect(instance.isStartupComplete()).toBe(true);
      instance.setStartupComplete(false);
      expect(instance.isStartupComplete()).toBe(false);
    });

    it('formats IPv6 host correctly in getUrl', async () => {
      const addr = (await HealthzServer.start({ port: 0, host: '::1' }))!;
      const instance = HealthzServer.getInstance()!;
      expect(instance.getUrl()).toBe(`http://[${addr.address}]:${addr.port}`);
    });

    it('handles bracketed IPv6 host in start() without crashing', async () => {
      const addr = await HealthzServer.start({ port: 0, host: '[::1]' });
      expect(addr).not.toBeNull();
      expect(addr!.port).toBeGreaterThan(0);
    });

    it('supports check unregistration and check inspection', async () => {
      await HealthzServer.start({
        port: 0,
        checks: [{ name: 'check-1', check: () => true }]
      });

      HealthzServer.registerCheck({ name: 'check-2', check: () => true }, 'readiness');
      const checks = HealthzServer.getChecks();
      expect(checks.liveness.map(c => c.name)).toContain('check-1');
      expect(checks.readiness.map(c => c.name)).toContain('check-2');

      HealthzServer.unregisterCheck('check-1', 'liveness');
      expect(HealthzServer.getChecks().liveness.map(c => c.name)).not.toContain('check-1');

      HealthzServer.unregisterCheck('check-2', 'readiness');
      expect(HealthzServer.getChecks().readiness.map(c => c.name)).not.toContain('check-2');
    });

    it('deduplicates and updates checks in-place when re-registering with same name', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      HealthzServer.setReady(true);

      HealthzServer.registerCheck({ name: 'dyn', check: () => true }, 'liveness');
      let live = await get(addr.port, '/healthz');
      expect(live.body.checks).toHaveLength(1);
      expect(live.body.checks![0].ok).toBe(true);

      // Re-register check with same name but returning false
      HealthzServer.registerCheck({ name: 'dyn', check: () => false }, 'liveness');
      live = await get(addr.port, '/healthz');
      expect(live.body.checks).toHaveLength(1);
      expect(live.body.checks![0].ok).toBe(false);
    });

    it('treats void check functions as healthy (resolving without error)', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [
          {
            name: 'void-check',
            check: async () => {
              /* returns void */
            }
          }
        ]
      }))!;

      const live = await get(addr.port, '/healthz');
      expect(live.status).toBe(200);
      expect(live.body.checks![0].ok).toBe(true);
    });

    it('includes Allow: GET, HEAD header on 405 response', async () => {
      const addr = (await HealthzServer.start({ port: 0 }))!;
      const res = await new Promise<{ status: number; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
        const req = http.request(`http://127.0.0.1:${addr.port}/healthz`, { method: 'POST' }, res => {
          resolve({ status: res.statusCode!, headers: res.headers });
        });
        req.on('error', reject);
        req.end();
      });

      expect(res.status).toBe(405);
      expect(res.headers.allow).toBe('GET, HEAD');
    });

    it('normalizes paths configured without leading slash and handles trailing/repeated slashes', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        healthzPath: 'custom-live',
        readyzPath: 'custom-ready',
        startupzPath: 'custom-startup'
      }))!;

      HealthzServer.setReady(true);
      HealthzServer.markStartupComplete();

      const live = await get(addr.port, '/custom-live');
      expect(live.status).toBe(200);

      const liveTrailing = await get(addr.port, '/custom-live/');
      expect(liveTrailing.status).toBe(200);

      const liveRepeatedSlashes = await get(addr.port, `/custom-live${'/'.repeat(200)}`);
      expect(liveRepeatedSlashes.status).toBe(200);

      const ready = await get(addr.port, '/custom-ready');
      expect(ready.status).toBe(200);

      const startup = await get(addr.port, '/custom-startup');
      expect(startup.status).toBe(200);
    });

    it('extracts error string from non-Error thrown values', async () => {
      const addr = (await HealthzServer.start({
        port: 0,
        checks: [
          {
            name: 'string-error',
            check: () => {
              throw 'DB string failure';
            }
          }
        ]
      }))!;

      const live = await get(addr.port, '/healthz');
      expect(live.status).toBe(503);
      expect(live.body.checks![0].error).toBe('DB string failure');
    });

    it('improves error message when port is already in use (EADDRINUSE)', async () => {
      const blocker = http.createServer();
      await new Promise<void>((resolve, reject) => {
        blocker.once('error', reject);
        blocker.listen(0, '127.0.0.1', () => resolve());
      });
      const busyPort = (blocker.address() as AddressInfo).port;

      try {
        await expect(
          HealthzServer.start({
            host: '127.0.0.1',
            port: busyPort
          })
        ).rejects.toThrow(
          `Healthz probe server: Port ${busyPort} is already in use (127.0.0.1:${busyPort}). Another process is already listening on this address. Please choose a different port via SERVER_HEALTHZ_PORT/HEALTHZ_PORT or terminate the conflicting process.`
        );
      } finally {
        await new Promise<void>(resolve => blocker.close(() => resolve()));
      }
    });
  });
});

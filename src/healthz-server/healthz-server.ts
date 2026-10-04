import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { resolveConfig, ResolvedHealthzConfig } from './config';
import type {
  CheckResult,
  HealthzAddressInfo,
  CatbeeHealthzServerConfig,
  NamedCheck,
  ProbeResponse,
  ProbeStatus
} from './types';

const SINGLETON_KEY = Symbol.for('CatbeeHealthzServer');

type ProcessGlobal = { [SINGLETON_KEY]?: HealthzServer };
const _global = globalThis as unknown as ProcessGlobal;

/**
 * Standalone HTTP health-check server designed for Kubernetes probes
 * and microservice orchestration.
 *
 * Exposes three probe endpoints (paths are configurable):
 *
 * | Probe     | Default path | K8s probe type   | Behaviour |
 * |-----------|-------------|------------------|-----------|
 * | Liveness  | `/healthz`  | `livenessProbe`  | Runs configured checks; 200 = alive, 503 = unhealthy |
 * | Readiness | `/readyz`   | `readinessProbe` | Checks readiness flag + readiness checks; 503 while not ready |
 * | Startup   | `/startupz` | `startupProbe`   | 200 once the server has successfully started listening; 503 before that |
 *
 * ### Kubernetes Probe Best Practices:
 * - **Liveness (`/healthz`)**: Keep these checks extremely lightweight (e.g. process is responsive,
 *   event loop not blocked). Avoid external dependencies (DB/Redis) here; if a shared database has
 *   a transient outage, failing liveness causes Kubernetes to restart the container, which does not
 *   fix external outages and can cause cascading restart storms.
 * - **Readiness (`/readyz`)**: Place external dependency checks (DB, Redis, downstream APIs) here via
 *   `readinessChecks`. If a dependency fails, Kubernetes temporarily pulls the pod from service endpoints
 *   without restarting the container, allowing it to recover gracefully.
 * - **Startup (`/startupz`)**: Verifies the health server process has started listening.
 *
 * @example
 * ```ts
 * import { HealthzServer } from '@catbee/utils/healthz-server';
 *
 * const addr = await HealthzServer.start({
 *   port: 8282,
 *   // Keep liveness lightweight:
 *   checks: [
 *     { name: 'process', check: () => true },
 *   ],
 *   // Place dependency checks on readiness:
 *   readinessChecks: [
 *     { name: 'database', check: (signal) => db.ping({ signal }) },
 *     { name: 'redis',    check: (signal) => redis.ping({ signal }) },
 *   ],
 *   shutdownDelayMs: 10_000,
 * });
 *
 * // Signal readiness after all background services and migrations are ready:
 * HealthzServer.setReady(true);
 * ```
 */
export class HealthzServer {
  private readonly server: Server;
  private readonly config: ResolvedHealthzConfig;
  private readonly startedAt: number = Date.now();

  /** Whether the health server has successfully started listening (for `/startupz`) */
  private started = false;
  /** Whether the service is ready to receive traffic (for `/readyz`) */
  private ready = false;
  private shuttingDown = false;

  private readonly onSigterm = () => this.initiateShutdown();
  private readonly onSigint = () => this.initiateShutdown();

  private constructor(config: ResolvedHealthzConfig) {
    this.config = config;
    this.server = createServer((req, res) => this.handleRequest(req, res));

    process.once('SIGTERM', this.onSigterm);
    process.once('SIGINT', this.onSigint);
  }

  /**
   * Boot the health-check server.
   * Returns `null` if a server is already running in this process.
   */
  static async start(opts?: CatbeeHealthzServerConfig): Promise<HealthzAddressInfo | null> {
    if (_global[SINGLETON_KEY]) return null;

    const config = resolveConfig(opts);
    const instance = new HealthzServer(config);
    _global[SINGLETON_KEY] = instance;

    return new Promise<HealthzAddressInfo>((resolve, reject) => {
      const onError = (err: Error) => {
        instance.cleanup();
        delete _global[SINGLETON_KEY];
        reject(err);
      };

      instance.server.once('error', onError);

      instance.server.listen({ host: config.host, port: config.port }, () => {
        instance.server.off('error', onError);
        instance.started = true;

        const addr = instance.server.address();

        if (!addr || typeof addr === 'string') {
          instance.cleanup();
          delete _global[SINGLETON_KEY];
          reject(new Error('Failed to resolve health server address'));
          return;
        }

        resolve({
          address: addr.address,
          family: addr.family,
          port: addr.port
        });
      });
    });
  }

  /** Whether the health-check server is currently running and started. */
  static isStarted(): boolean {
    return _global[SINGLETON_KEY]?.started ?? false;
  }

  /** Mark the service as ready / not-ready for traffic. */
  static setReady(ready: boolean): void {
    const instance = _global[SINGLETON_KEY];
    if (!instance) return;

    instance.ready = ready;
  }

  /** Whether the service is currently marked as ready. */
  static isReady(): boolean {
    return _global[SINGLETON_KEY]?.ready ?? false;
  }

  /** Gracefully stop the health-check server. */
  static async stop(): Promise<void> {
    const instance = _global[SINGLETON_KEY];
    if (!instance) return;

    instance.cleanup();

    return new Promise<void>(resolve => {
      // Close idle keep-alive connections so the server can terminate cleanly
      if (typeof instance.server.closeIdleConnections === 'function') {
        instance.server.closeIdleConnections();
      }

      instance.server.close(() => {
        delete _global[SINGLETON_KEY];
        resolve();
      });
    });
  }

  static getInstance(): HealthzServer | undefined {
    return _global[SINGLETON_KEY];
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const isHead = req.method === 'HEAD';
    if (req.method !== 'GET' && !isHead) {
      this.sendJson(res, 405, { error: 'Method Not Allowed' }, isHead);
      return;
    }

    const url = req.url ?? '/';

    try {
      if (url === this.config.healthzPath) {
        await this.handleLiveness(res, isHead);
      } else if (url === this.config.readyzPath) {
        await this.handleReadiness(res, isHead);
      } else if (url === this.config.startupzPath) {
        this.handleStartup(res, isHead);
      } else {
        this.sendJson(res, 404, { error: 'Not Found' }, isHead);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      this.sendJson(res, 500, { error: message }, isHead);
    }
  }

  /** `/healthz` — Liveness probe */
  private async handleLiveness(res: ServerResponse, isHead = false): Promise<void> {
    const results = await this.runChecks(this.config.checks);

    // Run custom onHealthCheck if provided
    if (this.config.onHealthCheck) {
      const start = Date.now();
      try {
        const ok = await this.executeCheck(this.config.onHealthCheck, this.config.checkTimeoutMs);
        results.push({
          name: 'custom',
          ok: !!ok,
          durationMs: Date.now() - start,
          ...(!ok ? { error: 'Health check returned false' } : {})
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ name: 'custom', ok: false, durationMs: Date.now() - start, error: message });
      }
    }

    const allOk = results.every(r => r.ok);
    const status: ProbeStatus = allOk ? 'ok' : 'unhealthy';
    const httpStatus = allOk ? 200 : 503;

    this.sendProbe(res, httpStatus, status, results, isHead);
  }

  /** `/readyz` — Readiness probe */
  private async handleReadiness(res: ServerResponse, isHead = false): Promise<void> {
    // If shutting down or not yet ready, fast-fail
    if (this.shuttingDown || !this.ready) {
      const status: ProbeStatus = 'unhealthy';
      this.sendProbe(
        res,
        503,
        status,
        [
          {
            name: 'readiness',
            ok: false,
            durationMs: 0,
            error: this.shuttingDown ? 'Shutting down' : 'Not ready'
          }
        ],
        isHead
      );
      return;
    }

    // Use readinessChecks if explicitly provided, otherwise fall back to general checks
    const checksToRun = this.config.readinessChecks ?? this.config.checks;

    const results = await this.runChecks(checksToRun);

    // Run custom onReadinessCheck if provided
    if (this.config.onReadinessCheck) {
      const start = Date.now();
      try {
        const ready = await this.executeCheck(this.config.onReadinessCheck, this.config.checkTimeoutMs);
        results.push({
          name: 'custom-readiness',
          ok: !!ready,
          durationMs: Date.now() - start,
          ...(!ready ? { error: 'Readiness check returned false' } : {})
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ name: 'custom-readiness', ok: false, durationMs: Date.now() - start, error: message });
      }
    }

    const allOk = results.every(r => r.ok);
    const status: ProbeStatus = allOk ? 'ok' : 'unhealthy';
    const httpStatus = allOk ? 200 : 503;

    this.sendProbe(res, httpStatus, status, results, isHead);
  }

  /** `/startupz` — Startup probe */
  private handleStartup(res: ServerResponse, isHead = false): void {
    if (this.started) {
      this.sendProbe(res, 200, 'ok', [], isHead);
    } else {
      this.sendProbe(
        res,
        503,
        'unhealthy',
        [{ name: 'startup', ok: false, durationMs: 0, error: 'Service has not started yet' }],
        isHead
      );
    }
  }

  private async runChecks(checks: NamedCheck[]): Promise<CheckResult[]> {
    if (checks.length === 0) return [];

    return Promise.all(
      checks.map(async ({ name, check }): Promise<CheckResult> => {
        const start = Date.now();
        try {
          const result = await this.executeCheck(check, this.config.checkTimeoutMs);
          return { name, ok: !!result, durationMs: Date.now() - start };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return { name, ok: false, durationMs: Date.now() - start, error: message };
        }
      })
    );
  }

  private sendProbe(
    res: ServerResponse,
    httpStatus: number,
    status: ProbeStatus,
    checks: CheckResult[],
    isHead = false
  ): void {
    const body: ProbeResponse = {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000)
    };

    if (this.config.detailed && checks.length > 0) {
      body.checks = checks;
    }

    this.sendJson(res, httpStatus, body, isHead);
  }

  private sendJson(res: ServerResponse, status: number, body: unknown, isHead = false): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    });
    if (isHead) {
      res.end();
    } else {
      res.end(payload);
    }
  }

  private async executeCheck(fn: (signal?: AbortSignal) => boolean | Promise<boolean>, ms: number): Promise<boolean> {
    const controller = new AbortController();
    let timer: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`Check timed out after ${ms}ms`);
        controller.abort(error);
        reject(error);
      }, ms);
    });

    try {
      const checkPromise = Promise.resolve().then(() => fn(controller.signal));
      checkPromise.catch(() => {});
      return await Promise.race([checkPromise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async initiateShutdown(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.ready = false;

    // Wait for the load-balancer to remove us from the pool
    if (this.config.shutdownDelayMs > 0) {
      await new Promise<void>(r => setTimeout(r, this.config.shutdownDelayMs));
    }

    await HealthzServer.stop();
  }

  private cleanup(): void {
    process.off('SIGTERM', this.onSigterm);
    process.off('SIGINT', this.onSigint);
    this.ready = false;
    this.started = false;
    this.shuttingDown = false;
  }
}

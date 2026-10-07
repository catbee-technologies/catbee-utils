import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { trimChars } from '@catbee/utils/string';
import { getDefaultHealthzConfig, resolveConfig, ResolvedHealthzConfig } from './config';
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

function formatHostForUrl(host: string): string {
  if (host.includes(':')) {
    return `[${host}]`;
  }
  return host;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string' && err.trim().length > 0) return err;
  return 'Unknown error';
}

function normalizeProbePath(p: string): string {
  const trimmed = trimChars(p, '/');
  return trimmed ? `/${trimmed}` : '/';
}

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
 * | Startup   | `/startupz` | `startupProbe`   | 200 once application startup completes (`markStartupComplete()`); 503 while booting |
 *
 * ### Kubernetes Probe Best Practices:
 * - **Liveness (`/healthz`)**: Keep these checks extremely lightweight (e.g. process is responsive,
 *   event loop not blocked). Avoid external dependencies (DB/Redis) here; if a shared database has
 *   a transient outage, failing liveness causes Kubernetes to restart the container, which does not
 *   fix external outages and can cause cascading restart storms.
 * - **Readiness (`/readyz`)**: Place external dependency checks (DB, Redis, downstream APIs) here via
 *   `readinessChecks`. If a dependency fails, Kubernetes temporarily pulls the pod from service endpoints
 *   without restarting the container, allowing it to recover gracefully.
 * - **Startup (`/startupz`)**: Verifies the application has completed its startup sequence
 *   (signaled via `markStartupComplete()`). Protects slow-starting applications from premature liveness kills.
 *
 * @example
 * ```ts
 * import { HealthzServer } from '@catbee/utils/healthz-server';
 *
 * const addr = await HealthzServer.start({
 *   port: 8282,
 *   checks: [
 *     { name: 'process', check: () => true },
 *   ],
 *   readinessChecks: [
 *     { name: 'database', check: (signal) => db.ping({ signal }) },
 *     { name: 'redis',    check: (signal) => redis.ping({ signal }) },
 *   ],
 *   shutdownDelayMs: 10_000,
 * });
 *
 * // Signal application startup complete (switches /startupz to 200):
 * HealthzServer.markStartupComplete();
 *
 * // Signal readiness after all background services and migrations are ready:
 * HealthzServer.setReady(true);
 * ```
 */
export class HealthzServer {
  private readonly server: Server;
  private readonly config: ResolvedHealthzConfig;
  private readonly startedAt: number = Date.now();

  /** Running address info for the Healthz probe server */
  private addressInfo: HealthzAddressInfo | null = null;
  /** Whether the health HTTP server is currently running and listening on its port */
  private running = false;
  /** Whether application startup has completed (for `/startupz`) */
  private startupComplete = false;
  /** Whether the service is ready to receive traffic (for `/readyz`) */
  private ready = false;
  private shuttingDown = false;
  private readonly livenessChecks: NamedCheck[];
  private readonly readinessChecks: NamedCheck[];

  private stoppingPromise?: Promise<void>;

  private readonly onSigterm = () => this.initiateShutdown();
  private readonly onSigint = () => this.initiateShutdown();

  private constructor(config: ResolvedHealthzConfig) {
    this.config = config;
    this.livenessChecks = [...config.checks];
    this.readinessChecks = config.readinessChecks !== undefined ? [...config.readinessChecks] : [...config.checks];
    this.server = createServer((req, res) => this.handleRequest(req, res));

    if (this.config.handleSignals !== false) {
      process.once('SIGTERM', this.onSigterm);
      process.once('SIGINT', this.onSigint);
    }
  }

  /**
   * Returns default Healthz server configuration resolved from environment variables.
   */
  static getDefaultConfig(): ResolvedHealthzConfig {
    return getDefaultHealthzConfig();
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

    const bindHost = config.host.startsWith('[') && config.host.endsWith(']') ? config.host.slice(1, -1) : config.host;

    return new Promise<HealthzAddressInfo>((resolve, reject) => {
      const onError = (err: Error) => {
        instance.cleanup();
        instance.running = false;
        instance.shuttingDown = false;
        instance.addressInfo = null;
        delete _global[SINGLETON_KEY];
        reject(err);
      };

      instance.server.once('error', onError);

      instance.server.listen({ host: bindHost, port: config.port }, () => {
        instance.server.off('error', onError);
        // Attach runtime error listener so server-level socket errors don't crash the process
        instance.server.on('error', () => {
          // Keep a listener attached so runtime socket errors do not crash the process
        });
        instance.running = true;

        const addr = instance.server.address();

        if (!addr || typeof addr === 'string') {
          instance.cleanup();
          instance.running = false;
          instance.shuttingDown = false;
          instance.addressInfo = null;
          delete _global[SINGLETON_KEY];
          reject(new Error('Failed to resolve health server address'));
          return;
        }

        instance.addressInfo = {
          address: addr.address,
          family: addr.family,
          port: addr.port
        };

        resolve({ ...instance.addressInfo });
      });
    });
  }

  /** Whether the Healthz HTTP probe server is currently running and listening on its port. */
  public isRunning(): boolean {
    return this.running;
  }

  /** Whether the Healthz HTTP probe server is currently running and listening on its port. */
  static isRunning(): boolean {
    return _global[SINGLETON_KEY]?.running ?? false;
  }

  /** Mark application startup as completed (switches `/startupz` to 200). */
  public markStartupComplete(): this {
    this.startupComplete = true;
    return this;
  }

  /** Mark application startup as completed (switches `/startupz` to 200). */
  static markStartupComplete(): void {
    _global[SINGLETON_KEY]?.markStartupComplete();
  }

  /** Set application startup completion status. */
  public setStartupComplete(complete: boolean): this {
    this.startupComplete = complete;
    return this;
  }

  /** Set application startup completion status. */
  static setStartupComplete(complete: boolean): void {
    _global[SINGLETON_KEY]?.setStartupComplete(complete);
  }

  /** Whether application startup has completed (for `/startupz`). */
  public isStartupComplete(): boolean {
    return this.startupComplete;
  }

  /** Whether application startup has completed (for `/startupz`). */
  static isStartupComplete(): boolean {
    return _global[SINGLETON_KEY]?.isStartupComplete() ?? false;
  }

  /** Mark the service as ready / not-ready for traffic. */
  public setReady(ready: boolean): this {
    this.ready = ready;
    return this;
  }

  /** Mark the service as ready / not-ready for traffic. */
  static setReady(ready: boolean): void {
    _global[SINGLETON_KEY]?.setReady(ready);
  }

  /** Whether the service is currently marked as ready. */
  public isReady(): boolean {
    return this.ready;
  }

  /** Whether the service is currently marked as ready. */
  static isReady(): boolean {
    return _global[SINGLETON_KEY]?.isReady() ?? false;
  }

  /** Get address info of this health server instance. */
  public getAddress(): HealthzAddressInfo | null {
    return this.addressInfo;
  }

  /** Get address info of the active singleton health server. */
  static getAddress(): HealthzAddressInfo | null {
    return _global[SINGLETON_KEY]?.getAddress() ?? null;
  }

  /** Get port the health server is listening on. */
  public getPort(): number | undefined {
    return this.addressInfo?.port;
  }

  /** Get port the active singleton health server is listening on. */
  static getPort(): number | undefined {
    return _global[SINGLETON_KEY]?.getPort();
  }

  /** Get configured host. */
  public getHost(): string | undefined {
    return this.config.host;
  }

  /** Get configured host of the active singleton health server. */
  static getHost(): string | undefined {
    return _global[SINGLETON_KEY]?.getHost();
  }

  /** Get full URL for this health server instance. */
  public getUrl(): string | undefined {
    if (!this.addressInfo) return undefined;
    const host = formatHostForUrl(this.addressInfo.address);
    return `http://${host}:${this.addressInfo.port}`;
  }

  /** Get full URL for the active singleton health server. */
  static getUrl(): string | undefined {
    return _global[SINGLETON_KEY]?.getUrl();
  }

  /** Gracefully stop this health server instance. */
  public async stop(): Promise<void> {
    return HealthzServer.stop();
  }

  /** Gracefully stop the health-check server. */
  static async stop(): Promise<void> {
    const instance = _global[SINGLETON_KEY];
    if (!instance) return;

    if (instance.stoppingPromise) {
      return instance.stoppingPromise;
    }

    instance.shuttingDown = true;
    instance.ready = false;
    instance.cleanup();

    instance.stoppingPromise = new Promise<void>((resolve, reject) => {
      let forceTimer: NodeJS.Timeout | undefined;

      const onDone = (err?: Error) => {
        if (forceTimer) clearTimeout(forceTimer);
        instance.running = false;
        instance.shuttingDown = false;
        instance.addressInfo = null;
        delete _global[SINGLETON_KEY];
        if (err && (err as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
          reject(err);
        } else {
          resolve();
        }
      };

      // Close idle keep-alive connections so the server can terminate cleanly
      if (typeof instance.server.closeIdleConnections === 'function') {
        instance.server.closeIdleConnections();
      }
      // Close all connections immediately
      if (typeof instance.server.closeAllConnections === 'function') {
        instance.server.closeAllConnections();
      }

      // Safety timeout: ensure stopping resolves even if a connection stalls
      forceTimer = setTimeout(() => {
        if (typeof instance.server.closeAllConnections === 'function') {
          instance.server.closeAllConnections();
        }
        onDone();
      }, 5_000);

      instance.server.close(err => onDone(err ?? undefined));
    });

    return instance.stoppingPromise;
  }

  static getInstance(): HealthzServer | undefined {
    return _global[SINGLETON_KEY];
  }

  /**
   * Register a named check on this HealthzServer instance dynamically.
   * If a check with the same name already exists in the target probe, it is updated in-place.
   *
   * @param check - The named check to register
   * @param type - Which probe to attach this check to ('readiness', 'liveness', or 'both')
   * @returns This instance for chaining
   */
  public registerCheck(check: NamedCheck, type: 'liveness' | 'readiness' | 'both' = 'readiness'): this {
    if (type === 'liveness' || type === 'both') {
      const idx = this.livenessChecks.findIndex(c => c.name === check.name);
      if (idx !== -1) {
        this.livenessChecks[idx] = check;
      } else {
        this.livenessChecks.push(check);
      }
    }
    if (type === 'readiness' || type === 'both') {
      const idx = this.readinessChecks.findIndex(c => c.name === check.name);
      if (idx !== -1) {
        this.readinessChecks[idx] = check;
      } else {
        this.readinessChecks.push(check);
      }
    }
    return this;
  }

  /**
   * Unregister a named check on this HealthzServer instance.
   *
   * @param name - The name of the check to remove
   * @param type - Which probe to remove from ('liveness', 'readiness', or 'both')
   * @returns This instance for chaining
   */
  public unregisterCheck(name: string, type: 'liveness' | 'readiness' | 'both' = 'both'): this {
    if (type === 'liveness' || type === 'both') {
      const idx = this.livenessChecks.findIndex(c => c.name === name);
      if (idx !== -1) this.livenessChecks.splice(idx, 1);
    }
    if (type === 'readiness' || type === 'both') {
      const idx = this.readinessChecks.findIndex(c => c.name === name);
      if (idx !== -1) this.readinessChecks.splice(idx, 1);
    }
    return this;
  }

  /**
   * Get all registered checks on this instance.
   */
  public getChecks(): { liveness: NamedCheck[]; readiness: NamedCheck[] } {
    return {
      liveness: [...this.livenessChecks],
      readiness: [...this.readinessChecks]
    };
  }

  /**
   * Register a named check on the active singleton HealthzServer instance (if started).
   * If a check with the same name already exists in the target probe, it is updated in-place.
   *
   * @param check - The named check to register
   * @param type - Which probe to attach this check to ('readiness', 'liveness', or 'both')
   */
  static registerCheck(check: NamedCheck, type: 'liveness' | 'readiness' | 'both' = 'readiness'): void {
    _global[SINGLETON_KEY]?.registerCheck(check, type);
  }

  /**
   * Unregister a named check on the active singleton HealthzServer instance (if started).
   *
   * @param name - Name of the check to remove
   * @param type - Which probe to remove from ('liveness', 'readiness', or 'both')
   */
  static unregisterCheck(name: string, type: 'liveness' | 'readiness' | 'both' = 'both'): void {
    _global[SINGLETON_KEY]?.unregisterCheck(name, type);
  }

  /**
   * Get all registered checks on the active singleton HealthzServer instance.
   */
  static getChecks(): { liveness: NamedCheck[]; readiness: NamedCheck[] } {
    return _global[SINGLETON_KEY]?.getChecks() ?? { liveness: [], readiness: [] };
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const isHead = req.method === 'HEAD';
    if (req.method !== 'GET' && !isHead) {
      res.setHeader('Allow', 'GET, HEAD');
      this.sendJson(res, 405, { error: 'Method Not Allowed' }, isHead);
      return;
    }

    const rawUrl = req.url ?? '/';
    const pathname = normalizeProbePath(rawUrl.split('?')[0]);
    const matchPath = (configured: string) => pathname === normalizeProbePath(configured);

    try {
      if (matchPath(this.config.healthzPath)) {
        await this.handleLiveness(res, isHead);
      } else if (matchPath(this.config.readyzPath)) {
        await this.handleReadiness(res, isHead);
      } else if (matchPath(this.config.startupzPath)) {
        this.handleStartup(res, isHead);
      } else {
        this.sendJson(res, 404, { error: 'Not Found' }, isHead);
      }
    } catch (_err) {
      this.sendJson(res, 500, { error: 'Internal Server Error' }, isHead);
    }
  }

  /** `/healthz` — Liveness probe */
  private async handleLiveness(res: ServerResponse, isHead = false): Promise<void> {
    const results = await this.runChecks(this.livenessChecks);

    // Run custom onLivenessCheck or onHealthCheck if provided
    const livenessCheck = this.config.onLivenessCheck ?? this.config.onHealthCheck;
    if (livenessCheck) {
      const start = Date.now();
      try {
        const result = await this.executeCheck(livenessCheck, this.config.checkTimeoutMs);
        const ok = result === undefined ? true : !!result;
        results.push({
          name: 'custom',
          ok,
          durationMs: Date.now() - start,
          ...(!ok ? { error: 'Health check returned false' } : {})
        });
      } catch (err) {
        const message = getErrorMessage(err);
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

    const results = await this.runChecks(this.readinessChecks);

    // Run custom onReadinessCheck if provided
    if (this.config.onReadinessCheck) {
      const start = Date.now();
      try {
        const result = await this.executeCheck(this.config.onReadinessCheck, this.config.checkTimeoutMs);
        const ready = result === undefined ? true : !!result;
        results.push({
          name: 'custom-readiness',
          ok: ready,
          durationMs: Date.now() - start,
          ...(!ready ? { error: 'Readiness check returned false' } : {})
        });
      } catch (err) {
        const message = getErrorMessage(err);
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
    if (this.startupComplete) {
      this.sendProbe(res, 200, 'ok', [], isHead);
    } else {
      this.sendProbe(
        res,
        503,
        'unhealthy',
        [{ name: 'startup', ok: false, durationMs: 0, error: 'Application startup not complete' }],
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
          const ok = result === undefined ? true : !!result;
          return {
            name,
            ok,
            durationMs: Date.now() - start,
            ...(!ok ? { error: 'Check returned false' } : {})
          };
        } catch (err) {
          const message = getErrorMessage(err);
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
    if (this.shuttingDown) {
      res.setHeader('Connection', 'close');
    }

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
    if (res.headersSent) return;

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

  /**
   * Executes a check function with timeout and cooperative cancellation.
   *
   * Note on cancellation: The AbortController aborts when `ms` expires, which signals cooperative
   * consumers (e.g., fetch, pg, ioredis) to terminate their work. The attached .catch() on checkPromise
   * prevents unhandled rejections if the check promise rejects after the timeout has already resolved.
   */
  private async executeCheck(
    fn: (signal?: AbortSignal) => boolean | void | Promise<boolean | void>,
    ms: number
  ): Promise<boolean | void> {
    const controller = new AbortController();
    let timer: NodeJS.Timeout | undefined;

    if (ms > 0) {
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

    return await Promise.resolve().then(() => fn(controller.signal));
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
    this.startupComplete = false;
  }
}

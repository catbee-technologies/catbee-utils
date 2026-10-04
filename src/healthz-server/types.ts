/**
 * A health check function that can be synchronous or asynchronous.
 * Receives an AbortSignal that is triggered when `checkTimeoutMs` is exceeded.
 *
 * > **Cancellation & Timeout Semantics**:
 * > When `checkTimeoutMs` expires, the HTTP probe response immediately fast-fails with 503
 * > and aborts the supplied `AbortSignal`.
 * >
 * > However, runtime cancellation in JavaScript is **strictly cooperative**. The probe server cannot
 * > preemptively interrupt executing JavaScript or force-cancel asynchronous work that does not listen
 * > to the signal. If a check executes asynchronous tasks without passing `signal`
 * > (e.g., `await db.query(...)` without `{ signal }`), that task will continue running in the background.
 * > To prevent background resource leaks, always pass `signal` to underlying drivers/clients
 * > (e.g. `fetch(url, { signal })`, database clients, HTTP clients) or check `signal?.aborted`.
 *
 * - Return `true` (or resolve to true) to signal healthy.
 * - Return `false` (or resolve to false) to signal unhealthy.
 * - Throw an error (or reject) to signal unhealthy with an error message.
 */
export type HealthCheckFn = (signal?: AbortSignal) => boolean | Promise<boolean>;

/**
 * A readiness check function.
 * Receives an AbortSignal that is triggered when `checkTimeoutMs` is exceeded.
 *
 * > **Cancellation & Timeout Semantics**:
 * > When `checkTimeoutMs` expires, the HTTP probe response immediately fast-fails with 503
 * > and aborts the supplied `AbortSignal`.
 * >
 * > However, runtime cancellation in JavaScript is **strictly cooperative**. The probe server cannot
 * > preemptively interrupt executing JavaScript or force-cancel asynchronous work that does not listen
 * > to the signal. If a check executes asynchronous tasks without passing `signal`
 * > (e.g., `await db.query(...)` without `{ signal }`), that task will continue running in the background.
 * > To prevent background resource leaks, always pass `signal` to underlying drivers/clients
 * > (e.g. `fetch(url, { signal })`, database clients, HTTP clients) or check `signal?.aborted`.
 *
 * - Return `true` (or resolve to true) to signal ready.
 * - Return `false` (or resolve to false) to signal not ready.
 * - Throw an error (or reject) to signal not ready with an error.
 */
export type ReadinessCheckFn = (signal?: AbortSignal) => boolean | Promise<boolean>;

/**
 * A named health check with an associated check function.
 */
export interface NamedCheck {
  /** Human-readable name for this check (e.g. 'database', 'redis', 'disk') */
  name: string;
  /**
   * Check function — return false or throw to indicate failure.
   * Receives an AbortSignal that is triggered when the check times out.
   * Cancellation via the signal is cooperative; pass `signal` to underlying operations.
   */
  check: (signal?: AbortSignal) => boolean | Promise<boolean>;
}

/**
 * Result of a single named health check.
 */
export interface CheckResult {
  /** Name of the check */
  name: string;
  /** Whether the check passed */
  ok: boolean;
  /** Duration of the check in milliseconds */
  durationMs: number;
  /** Error message if the check failed */
  error?: string;
}

/** Aggregate status string used in JSON probe responses */
export type ProbeStatus = 'ok' | 'unhealthy';

/**
 * Structured JSON response returned by probe endpoints.
 */
export interface ProbeResponse {
  /** Overall status */
  status: ProbeStatus;
  /** ISO-8601 timestamp of the check */
  timestamp: string;
  /** Server uptime in seconds */
  uptimeSeconds: number;
  /** Individual check results (only when `detailed` is enabled) */
  checks?: CheckResult[];
}

/**
 * Configuration for the standalone healthz HTTP server.
 */
export interface CatbeeHealthzServerConfig {
  /** Hostname / IP to bind to
   *  - **default**: `'0.0.0.0'`
   *  - **env**: `HEALTHZ_HOST` (fallback: `SERVER_HOST`, `HOST`)
   */
  host?: string;

  /** Port to listen on
   *  - **default**: `8282`
   *  - **env**: `HEALTHZ_PORT` (fallback: `SERVER_HEALTHZ_PORT`)
   */
  port?: number;

  /** Liveness probe path — Kubernetes `livenessProbe.httpGet.path`
   *  - **default**: `'/healthz'`
   *  - **env**: `HEALTHZ_PATH` (fallback: `SERVER_HEALTH_CHECK_PATH`)
   */
  healthzPath?: string;

  /** Readiness probe path — Kubernetes `readinessProbe.httpGet.path`
   *  - **default**: `'/readyz'`
   *  - **env**: `HEALTHZ_READYZ_PATH` (fallback: `SERVER_READYZ_PATH`)
   */
  readyzPath?: string;

  /** Startup probe path — Kubernetes `startupProbe.httpGet.path`
   *  - **default**: `'/startupz'`
   *  - **env**: `HEALTHZ_STARTUPZ_PATH` (fallback: `SERVER_STARTUPZ_PATH`)
   */
  startupzPath?: string;

  /** Include individual check results in the JSON response
   *  - **default**: `true`
   *  - **env**: `HEALTHZ_DETAILED` (fallback: `SERVER_HEALTH_CHECK_DETAILED_OUTPUT`)
   */
  detailed?: boolean;

  /**
   * Named checks to run on the liveness endpoint (`/healthz`).
   *
   * > **Kubernetes Best Practice**: Keep liveness checks very lightweight (e.g. process is responsive,
   * > event loop not blocked). Avoid placing external dependencies (DB, Redis, downstream APIs) here;
   * > if a shared dependency encounters transient downtime, failing liveness causes Kubernetes to restart
   * > the container, risking cascading restart storms.
   * >
   * > Place external dependency checks in `readinessChecks` instead.
   */
  checks?: NamedCheck[];

  /**
   * Named checks to run on the readiness endpoint (`/readyz`).
   *
   * Use this for external dependencies (DB, Redis, cache, message broker).
   * If a dependency goes down, Kubernetes will temporarily remove the pod from traffic rotation
   * without killing/restarting the container, allowing it to recover cleanly.
   *
   * - If **omitted** (`undefined`): falls back to `checks`.
   * - If **explicitly empty** (`[]`): no readiness checks are run (traffic gated purely by `setReady(true)`).
   */
  readinessChecks?: NamedCheck[];

  /**
   * Custom liveness check function. Runs *in addition to* `checks`.
   * Return `false` or throw to indicate unhealthy.
   * Can also be provided via `onLivenessCheck`.
   */
  onHealthCheck?: HealthCheckFn;

  /**
   * Symmetrical alias for `onHealthCheck` — custom liveness check function.
   * Runs *in addition to* `checks` on `/healthz`.
   * Return `false` or throw to indicate unhealthy.
   */
  onLivenessCheck?: HealthCheckFn;

  /**
   * Custom readiness check function. Runs *in addition to* `readinessChecks`.
   * Return `false` or throw to indicate not ready.
   */
  onReadinessCheck?: ReadinessCheckFn;

  /**
   * Timeout (ms) per individual check before it's considered failed.
   *
   * When exceeded, the probe immediately fast-fails with status 503 and triggers
   * `abort()` on the check's `AbortSignal`. Note that cancellation is cooperative;
   * checks should forward `signal` to downstream clients (e.g. database drivers, fetch)
   * to avoid orphaned background execution.
   *  - **default**: `5000`
   *  - **env**: `HEALTHZ_CHECK_TIMEOUT_MS`
   */
  checkTimeoutMs?: number;

  /**
   * Graceful shutdown delay in milliseconds.
   * After receiving SIGTERM/SIGINT the server immediately flips readiness
   * to `false` and waits this many ms before closing — giving the load
   * balancer time to drain traffic.
   *  - **default**: `5000`
   *  - **env**: `HEALTHZ_SHUTDOWN_DELAY_MS`
   */
  shutdownDelayMs?: number;

  /**
   * Whether the HealthzServer should register its own SIGTERM/SIGINT process signal listeners.
   * When managed by an orchestrating server (such as Catbee ExpressServer), set this to `false`
   * to prevent signal listener conflicts and allow coordinated teardown.
   *  - **default**: `true`
   */
  handleSignals?: boolean;
}

/**
 * Address information returned after the server starts listening.
 */
export interface HealthzAddressInfo {
  address: string;
  family: string;
  port: number;
}

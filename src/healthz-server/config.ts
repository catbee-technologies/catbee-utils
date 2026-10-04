import { Env } from '@catbee/utils/env';
import type { CatbeeHealthzServerConfig } from './types';

/**
 * Resolved configuration with all defaults applied.
 * Internal-only — consumers interact with `CatbeeHealthzServerConfig`.
 *
 * `readinessChecks` is kept as `NamedCheck[] | undefined` so that
 * "omitted" (-> fall back to `checks`) is distinguishable from
 * "explicitly empty" (-> run nothing).
 */
export interface ResolvedHealthzConfig extends Required<
  Omit<CatbeeHealthzServerConfig, 'onHealthCheck' | 'onReadinessCheck' | 'readinessChecks'>
> {
  onHealthCheck?: CatbeeHealthzServerConfig['onHealthCheck'];
  onReadinessCheck?: CatbeeHealthzServerConfig['onReadinessCheck'];
  readinessChecks?: CatbeeHealthzServerConfig['readinessChecks'];
}

/**
 * Loads default Healthz server configuration from environment variables.
 */
export function getDefaultHealthzConfig(): ResolvedHealthzConfig {
  return {
    host:
      Env.get('HEALTHZ_HOST', '') ||
      Env.get('SERVER_HEALTHZ_HOST', '') ||
      Env.get('SERVER_HOST', '') ||
      Env.get('HOST', '0.0.0.0'),
    port: Env.getPort('HEALTHZ_PORT', Env.getPort('SERVER_HEALTHZ_PORT', 8282)),
    healthzPath:
      Env.get('HEALTHZ_PATH', '') ||
      Env.get('SERVER_HEALTHZ_PATH', '') ||
      Env.get('SERVER_HEALTH_CHECK_PATH', '/healthz'),
    readyzPath: Env.get('HEALTHZ_READYZ_PATH', '') || Env.get('SERVER_READYZ_PATH', '/readyz'),
    startupzPath: Env.get('HEALTHZ_STARTUPZ_PATH', '') || Env.get('SERVER_STARTUPZ_PATH', '/startupz'),
    detailed: Env.getBoolean(
      'HEALTHZ_DETAILED',
      Env.getBoolean('SERVER_HEALTHZ_DETAILED', Env.getBoolean('SERVER_HEALTH_CHECK_DETAILED_OUTPUT', true))
    ),
    checks: [],
    checkTimeoutMs: Env.getDuration(
      'HEALTHZ_CHECK_TIMEOUT_MS',
      Env.getDuration('SERVER_HEALTHZ_CHECK_TIMEOUT_MS', 5_000)
    ),
    shutdownDelayMs: Env.getDuration(
      'HEALTHZ_SHUTDOWN_DELAY_MS',
      Env.getDuration('SERVER_HEALTHZ_SHUTDOWN_DELAY_MS', 5_000)
    ),
    handleSignals: true
  };
}

/**
 * Merge user-supplied configuration with environment-resolved defaults.
 * Undefined user values do not override resolved defaults.
 */
export function resolveConfig(userConfig?: CatbeeHealthzServerConfig): ResolvedHealthzConfig {
  const defaults = getDefaultHealthzConfig();
  if (!userConfig) return { ...defaults };

  // Ignore undefined values so they do not override resolved defaults.
  const cleaned = Object.fromEntries(Object.entries(userConfig).filter(([, v]) => v !== undefined));

  return { ...defaults, ...cleaned } as ResolvedHealthzConfig;
}

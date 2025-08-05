import { EnvHelper } from "./EnvHelper";

type LogLevel =
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace"
  | "silent";

/**
 * Application runtime configuration loaded from environment variables.
 */
export const Config = {
  Logger: {
    /**
     * Logging level (e.g., 'info', 'debug', 'warn', 'error').
     */
    level: EnvHelper.get("LOGGER_LEVEL", "info") as LogLevel,

    /**
     * Name of the logger instance (defaults to npm package name).
     */
    name: EnvHelper.get(
      "LOGGER_NAME",
      EnvHelper.get("npm_package_name", "@catbee/utils"),
    ),

    /**
     * Whether to use ISO 8601 timestamps in logs.
     */
    isoTimestamp: EnvHelper.getBoolean("LOGGER_ISO_TIMESTAMP", false),
  },
};

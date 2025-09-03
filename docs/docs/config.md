# Config

Global configuration management for logging, cache, and runtime settings. Provides type-safe access and mutation of config values, with sensible defaults and environment variable support.

## API Summary

- [**`setConfig(value: Partial<Config>): void`**](#setconfig) – update configuration at runtime.
- [**`getConfig(): Config`**](#getconfig) – get the current configuration object.

---

## Function Documentation & Usage Examples

### `setConfig()`
Updates configuration settings at runtime. Only provided keys are merged; others remain unchanged.

**Method Signature:**
```ts
function setConfig(value: Partial<Config>): void
```

**Parameters:**
- `value`: Partial configuration object to merge.

**Examples:**
```ts
import { setConfig, getConfig } from '@catbee/utils';

setConfig({
  logger: { level: "debug", name: "custom-logger", pretty: true }
});
```

---

### `getConfig()`
Returns the current configuration object.

**Method Signature:**
```ts
function getConfig(): Config
```

**Returns:**
- The current configuration object.

**Examples:**
```ts
import { getConfig } from '@catbee/utils';

const currentConfig = getConfig();
console.log(currentConfig.logger.level); // "info"
console.log(currentConfig.cache.defaultTtl); // 3600000
```

---

## Default Values

All configuration options have sensible defaults:

```ts
const config = {
  logger: {
    level: "info",         // Logging level
    name: "@catbee/utils", // Logger name
    pretty: true,          // Pretty print logs (dev only)
    singleLine: false      // Single line pretty print
  },
  cache: {
    defaultTtl: 3600000    // Default cache TTL (1 hour, in ms)
  }
};
```

---

## Types

### Logger Configuration

```ts
interface LoggerConfig {
  level: "trace" | "debug" | "info" | "warn" | "error";
  name: string;
  pretty: boolean;
  singleLine: boolean;
}
```

### Cache Configuration

```ts
interface CacheConfig {
  defaultTtl: number; // milliseconds
}
```

### Config Object

```ts
interface Config {
  logger: LoggerConfig;
  cache: CacheConfig;
}
```

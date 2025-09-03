# Logger Utilities

Structured logging with Pino. This module provides a robust logging system with features like hierarchical loggers, request-scoped logging, error handling, and sensitive data redaction.

## API Summary

- [**`getLogger(): Logger`**](#getlogger) - Retrieves the current logger instance from the request context or falls back to the global logger.
- [**`createChildLogger(bindings: Record<string, any>, parentLogger?: Logger): Logger`**](#createchildlogger) - Creates a child logger with additional context that will be included in all log entries.
- [**`createRequestLogger(requestId: string, additionalContext?: Record<string, any>): Logger`**](#createrequestlogger) - Creates a request-scoped logger with request ID and stores it in the async context.
- [**`logError(error: Error | unknown, message?: string, context?: Record<string, any>): void`**](#logerror) - Utility to safely log errors with proper stack trace extraction
- [**`resetLogger(): void`**](#resetlogger) - Resets the global logger to its default configuration.
- [**`getRedactCensor(): (key: string) => boolean`**](#getredactcensor) - Gets the current global redaction censor function used for log redaction.
- [**`setRedactCensor(censor: (key: string) => boolean): void`**](#setredactcensor) - Sets the global redaction censor function used throughout the application for log redaction.
- [**`addRedactFields(fields: string | string[]): void`**](#addredactfields) - Extends the current redaction function with additional fields to redact.
- [**`setSensitiveFields(fields: string[]): void`**](#setsensitivefields) - Replaces the default list of sensitive fields with a new list.
- [**`addSensitiveFields(fields: string | string[]): void`**](#addsensitivefields) - Adds additional field names to the default sensitive fields list.

## Environment Variables

| Environment Variable        | Default Value                  |
|-----------------------------|--------------------------------|
| `LOGGER_LEVEL`              | `info`                         |
| `LOGGER_NAME`               | `process.env.npm_package_name` |
| `LOGGER_PRETTY`             | `true`                         |
| `LOGGER_PRETTY_SINGLE_LINE` | `false`                        |

## Interfaces & Types

```ts
// Main logger type (Pino logger)
export type Logger = pino.Logger;

// Logger levels from Pino
export type LoggerLevels = pino.Level; // 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
```

## Example Usage

```ts
import { getLogger } from "@catbee/utils";

const logger = getLogger();

// Different log levels
logger.trace("Very detailed info for debugging");
logger.debug("Debugging information");
logger.info("Normal application information");
logger.warn("Warning conditions");
logger.error("Error conditions");
logger.fatal("Critical errors");

// Structured logging with context
logger.info({ userId: "123", action: "login" }, "User logged in");
```


## Function Documentation & Usage Examples

### `getLogger()`
Retrieves the current logger instance from the request context or falls back to the global logger.

**Method Signature:**
```ts
function getLogger(): Logger
```

**Returns:**
- The current `Logger` instance.

**Example:**
```ts
import { getLogger } from "@catbee/utils";

// Get current logger (request-scoped if in request context, or global)
const logger = getLogger();
logger.info("App started");
logger.debug({ user: "john" }, "User logged in");
```

---

### `createChildLogger()`
Creates a child logger with additional context that will be included in all log entries.

**Method Signature:**
```ts
function createChildLogger(bindings: Record<string, any>, parentLogger?: Logger): Logger
```

**Parameters:**
- `bindings`: Key-value pairs to include in all log entries from this logger.
- `parentLogger` (optional): The parent logger to derive from. If not provided, uses the global logger.

**Returns:**
- A new `Logger` instance with the specified bindings.

**Example:**
```ts
import { getLogger, createChildLogger } from "@catbee/utils";

// Create a module-specific logger
const moduleLogger = createChildLogger({ module: "payments" });
moduleLogger.info("Processing payment");

// Child loggers can be nested
const transactionLogger = createChildLogger({ 
  transactionId: "tx_12345" 
}, moduleLogger);
transactionLogger.info("Transaction completed");
```

---

### `createRequestLogger()`
Creates a request-scoped logger with request ID and stores it in the async context.

**Method Signature:**
```ts
function createRequestLogger(requestId: string, additionalContext?: Record<string, any>): Logger
```

**Parameters:**
- `requestId`: Unique identifier for the request (e.g., UUID).
- `additionalContext` (optional): Additional key-value pairs to include in all log entries for this request.

**Returns:**
- A new `Logger` instance scoped to the request.

**Example:**
```ts
import { createRequestLogger, uuid } from "@catbee/utils";

// In an API request handler:
function handleRequest(req, res) {
  const requestId = req.headers['x-request-id'] || uuid();
  const logger = createRequestLogger(requestId, { 
    userId: req.user?.id,
    path: req.path
  });
  
  logger.info("Request received");
  // All subsequent calls to getLogger() in this request will return this logger
}
```

---

### `logError()`
Utility to safely log errors with proper stack trace extraction.
- If `error` is an instance of `Error`, logs its message and stack trace.
- If `error` is not an `Error`, logs it as a stringified value.

**Method Signature:**
```ts
function logError(error: Error | unknown, message?: string, context?: Record<string, any>): void
```

**Parameters:**
- `error`: The error object or any value to log as an error.
- `message` (optional): Additional message to log alongside the error.
- `context` (optional): Additional context to include in the log entry. 

**Example:**
```ts
import { logError } from "@catbee/utils";

try {
  throw new Error("Something went wrong");
} catch (error) {
  logError(error, "Failed during processing", { operation: "dataSync" });
}

// Works with any error type
logError("Invalid input", "Validation error");
```

---

### `resetLogger()`
Resets the global logger instance to its initial state, removing any custom configurations or child loggers.

**Method Signature:**
```ts
function resetLogger(): void
```

**Example:**
```ts
import { resetLogger } from "@catbee/utils";

// After modifying logger configuration for tests
afterEach(() => {
  resetLogger();
});
```

---

## Redaction and Security

### `getRedactCensor()`
Gets the current global redaction censor function used for log redaction.

**Method Signature:**
```ts
function getRedactCensor(): (value: unknown, path: string[], sensitiveFields?: string[]) => string
```

**Returns:**
- The current redaction censor function.

**Example:**
```ts
import { getRedactCensor } from "@catbee/utils";

const currentCensor = getRedactCensor();
// Use current censor in custom logic
```

---

### `setRedactCensor()`
Sets the global redaction censor function used throughout the application for log redaction.

**Method Signature:**
```ts
function setRedactCensor(fn: (value: unknown, path: string[], sensitiveFields?: string[]) => string): void
```

**Parameters:**
- `fn`: A function that takes a value, its path in the object, and an optional list of sensitive fields, returning a redacted string.
  - `value`: The value to potentially redact.
  - `path`: An array representing the path to the value in the object.
  - `sensitiveFields`: An optional array of field names considered sensitive.

**Example:**
```ts
import { setRedactCensor } from "@catbee/utils";

// Custom censor that redacts only specific values
setRedactCensor((value, path, sensitiveFields) => {
  if (path.includes('password')) return '***';
  if (typeof value === 'string' && value.includes('secret')) return '***';
  return value as string;
});
```

---

### `addRedactFields()`
Extends the current redaction function with additional fields to redact.

**Method Signature:**
```ts
function addRedactFields(fields: string[]): void
```

**Parameters:**
- `fields`: An array of field names to add to the redaction list.

**Example:**
```ts
import { addRedactFields } from "@catbee/utils";

// Add custom fields to be redacted in all logs
addRedactFields(['customerId', 'accountNumber', 'ssn']);
```

---

### `setSensitiveFields()`
Replaces the default list of sensitive fields with a new list.

**Method Signature:**
```ts
function setSensitiveFields(fields: string[]): void
```

**Parameters:**
- `fields`: An array of field names to set as the new sensitive fields list.

**Example:**
```ts
import { setSensitiveFields } from "@catbee/utils";

// Replace default sensitive fields with a custom list
setSensitiveFields(['password', 'ssn', 'creditCard']);
```

---

### `addSensitiveFields()`
Adds additional field names to the default sensitive fields list.

**Method Signature:**
```ts
function addSensitiveFields(fields: string[]): void
```

**Parameters:**
- `fields`: An array of field names to add to the existing sensitive fields list.

**Example:**
```ts
import { addSensitiveFields } from "@catbee/utils";

// Add domain-specific sensitive fields to the default list
addSensitiveFields(['socialSecurityNumber', 'medicalRecordNumber']);
```

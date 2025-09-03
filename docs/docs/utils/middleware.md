# Middleware Utilities

Express middleware collection for handling common web server requirements including request identification, timing, error handling, timeouts, and request context management.

## API

- [**`requestId(options: { headerName?: string; exposeHeader?: boolean; generator?: () => string; })`**](#requestid) - Attaches a unique request ID to each request for tracing and correlation between logs.
- [**`responseTime(options?: { addHeader?: boolean; logOnComplete?: boolean; })`**](#responsetime) - Measures request processing time and adds it to response headers or logs.
- [**`timeout(timeoutMs?: number)`**](#timeout) - Aborts requests that take too long to process.
- [**`setupRequestContext()`**](#setuprequestcontext) - Creates an Express middleware that initializes a per-request context.
- [**`errorHandler(options?: ErrorHandlerOptions)`**](#errorhandler) - Global error handling middleware with enhanced features.

### Interfaces and Types

```ts
export type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export interface ErrorHandlerOptions {
  /** Whether to log errors (default: true) */
  logErrors?: boolean;
  /** Whether to include error details in non-production (default: false) */
  includeDetails?: boolean;
}
```

## Example Usage

```ts
import { requestId, responseTime, errorHandler } from "@catbee/utils";

app.use(requestId({ headerName: "X-Request-ID" })); // Sets X-Request-ID header and attaches req.id
app.use(setupRequestContext({ autoLog: true, headerName: "X-Request-ID" })); // Initializes request context with req.id and sets up logging
app.use(responseTime({ addHeader: true, logOnComplete: true })); // Adds X-Response-Time header
app.use(timeout(10_000)); // Aborts requests taking longer than 10 seconds
// ... your route handlers here ...
app.use(errorHandler({ logErrors: true, includeDetails: false })); // Last middleware
```

---

## Function Documentation & Usage Examples

### `requestId()`
Attaches a unique request ID to each request for tracing and correlation between logs.

**Method Signature:**
```ts
function requestId(options?: { headerName?: string; exposeHeader?: boolean; generator?: () => string; }): Middleware
```

**Parameters:**
- `options?: object` - Configuration options
  - `headerName?: string` - Header name for request ID (default: 'X-Request-ID')
  - `exposeHeader?: boolean` - Whether to expose the header in response (default: true)
  - `generator?: () => string` - Custom ID generator function (default: uuid)

**Returns:** 
- `Middleware` - Express middleware function

**Example:**
```ts
import express from 'express';
import { requestId } from '@catbee/utils';
const app = express();

// Basic usage with defaults
app.use(requestId());

// Custom configuration
app.use(requestId({
  headerName: 'Correlation-ID',
  exposeHeader: true,
  generator: () => `req-${Date.now()}`
}));
```

---

### `responseTime()`
Measures request processing time and adds it to response headers or logs.

**Method Signature:**
```ts
function responseTime(options?: { addHeader?: boolean; logOnComplete?: boolean; }): Middleware
```

**Parameters:**
- `options?: object` - Configuration options
  - `addHeader?: boolean` - Whether to add X-Response-Time header (default: true)
  - `logOnComplete?: boolean` - Whether to log timing info (default: false)

**Returns:** 
- `Middleware` - Express middleware function

**Example:**
```ts
import express from 'express';
import { responseTime } from '@catbee/utils';
const app = express();

// Basic usage
app.use(responseTime());

// With logging enabled
app.use(responseTime({ 
  addHeader: true,
  logOnComplete: true 
}));
```

---

### `timeout()`
Aborts requests that take too long to process.

**Method Signature:**
```ts
function timeout(timeoutMs?: number): Middleware
```

**Parameters:**
- `timeoutMs?: number` - Timeout in milliseconds (default: 30000)

**Returns:** 
- `Middleware` - Express middleware function

**Example:**
```ts
import express from 'express';
import { timeout } from '@catbee/utils';
const app = express();

// Default 30-second timeout
app.use(timeout());

// Custom 5-second timeout
app.use(timeout(5000));
```

---

### `setupRequestContext()`
Creates an Express middleware that initializes a per-request context.

**Method Signature:**
```ts
function setupRequestContext(options?: { headerName?: string; autoLog?: boolean; }): Middleware
```

**Parameters:**
- `options?: object` - Optional configuration
  - `headerName?: string` - Header to look for request ID (default: 'x-request-id')
  - `autoLog?: boolean` - Whether to log automatically when context is initialized (default: true)

**Returns:** 
- `Middleware` - Express middleware function

**Example:**
```ts
import express from 'express';
import { setupRequestContext } from '@catbee/utils';
const app = express();

// Basic usage with defaults
app.use(setupRequestContext());

// Custom configuration
app.use(setupRequestContext({
  headerName: 'correlation-id',
  autoLog: false
}));
```

---

### `errorHandler()`
Global error handling middleware with enhanced features.

**Method Signature:**
```ts
function errorHandler(options?: ErrorHandlerOptions): Middleware
```

**Parameters:**
- `options?: ErrorHandlerOptions` - Error handler options
  - `logErrors?: boolean` - Whether to log errors (default: true)
  - `includeDetails?: boolean` - Whether to include error details in non-production (default: false)

**Returns:** 
- `Middleware` - Express error-handling middleware function

**Example:**
```ts
import express from 'express';
import { errorHandler } from '@catbee/utils';
const app = express();

// Basic error handler
app.use(errorHandler());

// Custom error handler with stack traces in development
app.use(errorHandler({
  logErrors: true,
  includeDetails: process.env.NODE_ENV !== 'production'
}));
```

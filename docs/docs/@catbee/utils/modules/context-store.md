# Context Store

Per-request context using AsyncLocalStorage. Provides a type-safe API for storing and retrieving request-scoped data (such as request ID, logger, user, etc.) across async calls. Includes helpers for Express integration, context extension, and symbol-based keys. All methods are fully typed.

## API Summary

- [**`ContextStore`**](#express-middleware) – The main class for managing context.
  - [**`getInstance(): AsyncLocalStorage<Store>`**](#getinstance) – Returns the underlying AsyncLocalStorage instance.
  - [**`getAll(): Store | undefined`**](#getall) – Retrieves the entire context store object for the current async context.
  - [**`run<T>(store: Store, callback: () => T): T`**](#run) – Initializes a new async context and executes a callback within it.
  - [**`set<T>(key: symbol, value: T): void`**](#set) – Sets a value in the current context store by symbol key.
  - [**`get<T>(key: symbol): T | undefined`**](#get) – Retrieves a value from the async context store by symbol key.
  - [**`has(key: symbol): boolean`**](#has) – Checks if a key exists in the current context store.
  - [**`delete(key: symbol): void`**](#delete) – Removes a value from the current context store by symbol key.
  - [**`patch(values: Partial<Store>): void`**](#patch) – Updates multiple values in the current context store at once.
  - [**`withValue<T>(key: symbol, value: T, callback: () => void): void`**](#withvalue) – Executes a callback with a temporary store value.
  - [**`extend(newValues: Partial<Store>, callback: () => void): void`**](#extend) – Creates a new context that inherits values and adds/overrides new ones.
  - [**`createExpressMiddleware(initialValuesFactory?: () => Partial<Store>): express.RequestHandler`**](#createexpressmiddleware) – Creates Express middleware that initializes a context for each request.

Other exports:
- [**`StoreKeys`**](#interface--types) – Predefined symbols for context keys.
- [**`getRequestId(): string | undefined`**](#getrequestid) – Retrieves the current request ID from context.

---

## Interface & Types

```ts
// Predefined symbols used as keys in AsyncLocalStorage.
export const StoreKeys = {
  LOGGER: Symbol('LOGGER'),
  REQUEST_ID: Symbol('REQUEST_ID'),
  USER: Symbol('USER'),
  SESSION: Symbol('SESSION'),
  TRANSACTION_ID: Symbol('TRANSACTION_ID'),
  USER_ID: Symbol('USER_ID'),
  TENANT_ID: Symbol('TENANT_ID'),
  TRACE_ID: Symbol('TRACE_ID'),
  CORRELATION_ID: Symbol('CORRELATION_ID')
};

export interface Store {
  [key: symbol]: unknown;
}
```

---

## Example Usage

### Express Middleware

```ts
import { ContextStore, StoreKeys, getLogger } from "@catbee/utils";
import express from "express";
import crypto from "crypto";

const app = express();

// Set up request context middleware
app.use((req, res, next) => {
  // Generate request ID from header or create a new one
  const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();
  
  // Run request in context with request ID
  ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
    // Create a logger with request ID and store it in context
    const logger = getLogger().child({ requestId });
    ContextStore.set(StoreKeys.LOGGER, logger);
    
    logger.info("Request started", { 
      method: req.method, 
      path: req.path 
    });
    
    next();
  });
});

// Access context in route handlers
app.get('/api/items', (req, res) => {
  // Get request ID from anywhere in the request lifecycle
  const requestId = getRequestId();
  
  // Get logger from context
  const logger = ContextStore.get<ReturnType<typeof getLogger>>(StoreKeys.LOGGER);
  
  logger.info("Getting items", { count: 10 });
  
  res.json({ items: [], requestId });
});

// Or use the built-in middleware
app.use(ContextStore.createExpressMiddleware(() => ({
  [StoreKeys.REQUEST_ID]: crypto.randomUUID()
})));
```

---

## Function Documentation & Usage Examples

### `getInstance()`
Returns the underlying AsyncLocalStorage instance for advanced access.

**Method Signature:**
```ts
getInstance(): AsyncLocalStorage<Store>
```

**Returns:**
- The AsyncLocalStorage instance.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

const storage = ContextStore.getInstance();
const store = storage.getStore();
```

---

### `getAll()`
Retrieves the entire context store object for the current async context.

**Method Signature:**
```ts
getAll(): Store | undefined
```

**Returns:**
- The current context store object or `undefined` if no context is active.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

const allValues = ContextStore.getAll();
```

---

### `run()`
Initializes a new async context and executes a callback within it.

**Method Signature:**
```ts
run(store: Store, callback: () => T): T
```

**Parameters:**
- `store`: An object containing initial key-value pairs for the context.
- `callback`: A function to execute within the new context.

**Returns:**
- The return value of the callback.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

ContextStore.run({ [StoreKeys.REQUEST_ID]: "id" }, () => {
  // Context is active here
  const requestId = ContextStore.get<string>(StoreKeys.REQUEST_ID);
  console.log(requestId); // "id"
});
```

---

### `set()`
Sets a value in the current context store by symbol key.

**Method Signature:**
```ts
set<T>(key: symbol, value: T): void
```

**Parameters:**
- `key`: A symbol key to identify the value.
- `value`: The value to store.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

ContextStore.set(StoreKeys.REQUEST_ID, "id");
ContextStore.set(StoreKeys.USER, { id: 123, name: "Alice" });
```

---

### `get()`
Retrieves a value from the async context store by symbol key.

**Method Signature:**
```ts
get<T>(key: symbol): T | undefined
```

**Parameters:**
- `key`: A symbol key to identify the value.

**Returns:**
- The value associated with the key or `undefined` if not found.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

const user = ContextStore.get<{ id: number, name: string }>(StoreKeys.USER);
```

---

### `has()`
Checks if a key exists in the current context store.

**Method Signature:**
```ts
has(key: symbol): boolean
```

**Parameters:**
- `key`: A symbol key to check.

**Returns:**
- `true` if the key exists, otherwise `false`.

```ts
import { ContextStore } from "@catbee/utils";

if (ContextStore.has(StoreKeys.USER)) {
  // user exists in context
}
```

---

### `delete()`
Removes a value from the current context store by symbol key.

**Method Signature:**
```ts
delete(key: symbol): boolean
```

**Parameters:**
- `key`: A symbol key to identify the value.

**Returns:**
- `true` if the key was found and deleted, otherwise `false`.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

ContextStore.delete(StoreKeys.USER);
```

---

### `patch()`
Updates multiple values in the current context store at once.

**Method Signature:**
```ts
patch(values: Partial<Record<symbol, unknown>>): void
```

**Parameters:**
- `values`: An object containing key-value pairs to update in the context.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

ContextStore.patch({
  [StoreKeys.USER]: { id: 456, name: "Bob" },
  [StoreKeys.SESSION]: "session-token"
});
```

---

### `withValue()`
Executes a callback with a temporary store value that only exists during execution.

**Method Signature:**
```ts
withValue<T>(key: symbol, value: unknown, callback: () => T): T
```

**Parameters:**
- `key`: A symbol key to identify the value.
- `value`: The temporary value to set.
- `callback`: A function to execute with the temporary value.

**Returns:**
- The return value of the callback.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

ContextStore.withValue(StoreKeys.USER, { id: 789 }, () => {
  // user is temporarily set here
});
```

---

### `extend()`
Creates a new context that inherits values from the current context and adds/overrides new ones.

**Method Signature:**
```ts
extend<T>(newValues: Partial<Record<symbol, unknown>>, callback: () => T): T
```

**Parameters:**
- `newValues`: An object containing key-value pairs to add or override in the new context.
- `callback`: A function to execute within the new context.

**Returns:**
- The return value of the callback.

**Examples:**
```ts
import { ContextStore } from "@catbee/utils";

ContextStore.extend({ [StoreKeys.TENANT_ID]: "tenant-42" }, () => {
  // context includes TENANT_ID here
});
```

---

### `createExpressMiddleware()`
Creates Express middleware that initializes a context for each request.

**Method Signature:**
```ts
createExpressMiddleware(initialValuesFactory?: (req: any) => Partial<Record<symbol, unknown>>): express.RequestHandler
```

**Parameters:**
- `initialValuesFactory`: An optional function that takes the request object and returns an object of initial key-value pairs for the context.

**Returns:**
- An Express middleware function.

```ts
import { ContextStore } from "@catbee/utils";
import crypto from "crypto";

app.use(ContextStore.createExpressMiddleware(req => ({
  [StoreKeys.REQUEST_ID]: req.headers["x-request-id"]?.toString() || crypto.randomUUID()
})));
```

---

### `getRequestId()`
Retrieves the current request ID from the async context, if available.

**Method Signature:**
```ts
getRequestId(): string | undefined
```

**Returns:**
- The current request ID or `undefined` if not set.

```ts
import { getRequestId } from '@catbee/utils';

const requestId = getRequestId();
```

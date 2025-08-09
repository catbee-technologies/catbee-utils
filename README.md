# @catbee/utils

## 🧰 Utility Modules for Node.js

A modular, production-grade utility toolkit for Node.js and TypeScript, designed for robust, scalable applications (including Express-based services). All utilities are tree-shakable and can be imported independently.

[build](https://github.com/catbee-technologies/catbee-utils/actions/workflows/node-build.yml/badge.svg) ![test](https://github.com/catbee-technologies/catbee-utils/actions/workflows/code-coverage.yml/badge.svg) ![coverage](https://codecov.io/gh/catbee-technologies/catbee-utils/branch/main/graph/badge.svg) ![dependencies](https://img.shields.io/librariesio/release/npm/@catbee%2Futils)

## 📦 Installation

```bash
npm i @catbee/utils
```

## ⚡ Quick Start

```ts
import { chunk, sleep, getLogger, uuid, isEmail } from "@catbee/utils";

// Chunk an array
const result = chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Sleep for 1 second
await sleep(1000);

// Log with context
getLogger().info("App started");

// Generate a secure UUID
console.log(uuid()); // e.g. 2a563ec1-caf6-4fe2-b60c-9cf7fb1bdb7f

// Basic validation
console.log(isEmail("user@example.com")); // true

```

## 📦 Modules Overview

- [**Array Utilities**](#-array-utilities)
- [**Async Utilities**](#-async-utilities)
- [**Cache Utilities**](#-cache-utilities)
- [**Context Store**](#-context-store)
- [**Crypto Utilities**](#-crypto-utilities)
- [**Directory Utilities**](#-directory-utilities)
- [**Environment Utilities**](#-environment-utilities)
- [**Exception Utilities**](#-exception-utilities)
- [**File System Utilities**](#-file-system-utilities)
- [**HTTP Status Codes**](#-http-status-codes)
- [**ID Utilities**](#-id-utilities)
- [**Logger Utilities**](#-logger-utility)
- [**Object Utilities**](#-object-utilities)
- [**Response Utilities**](#-response-utilities)
- [**String Utilities**](#-string-utilities)
- [**URL Utilities**](#-url-utilities)
- [**Validate Utilities**](#-validate-utilities)

## 📦 Array Utilities

- `chunk<T>(arr: T[], size: number): T[][]` – Split array into chunks.
- `unique<T>(array: T[]): T[]` – Remove duplicates.
- `flattenDeep<T>(array: any[]): T[]` – Deep flatten nested arrays.
- `random<T>(array: T[]): T | undefined` – Random element.
- `groupBy<T, K>(array: T[], keyFn: (item: T) => K): Record<K, T[]>` – Group by key.
- `shuffle<T>(array: T[]): T[]` – Fisher-Yates shuffle.
- `difference<T>(a: T[], b: T[]): T[]` – Elements in `a` not in `b`.
- `intersect<T>(a: T[], b: T[]): T[]` – Intersection.
- `mergeSort<T extends object>(array: T[], key: string, direction = 'asc'): T[]` – Merge sort by nested key.

## ⏳ Async Utilities

- `sleep(ms: number): Promise<void>`
- `debounce<T>(fn: T, wait: number): T & { cancel(): void; flush(): void }`
- `throttle<T>(fn: T, wait: number, options?): T`
- `retry<T>(fn: () => Promise<T>, retries?: number): Promise<T>`
- `withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>`
- `runInBatches<T>(tasks: (() => Promise<T>)[], batchSize: number): Promise<T[]>`
- `singletonAsync<TArgs, TResult>(fn: (...args: TArgs) => Promise<TResult>): (...args: TArgs) => Promise<TResult>`
- `settleAll<T>(tasks: (() => Promise<T>)[]): Promise<SettledResult<T>[]>`
- `createTaskQueue(limit: number)`
- `runInSeries<T>(tasks: (() => Promise<T>)[]): Promise<T[]>`

## 🗃️ Cache Utilities

- `TTLCache<K, V>(ttl: number)` – In-memory TTL cache with `.set`, `.get`, `.has`, `.delete`, `.clear`.

You can use it like:

```ts
const cache = new TTLCache<string, number>(3600_000);
cache.set("foo", 42);
cache.get("foo"); // 42
cache.has("foo"); // true
cache.cleanup();  // cleans expired
```

## 🧩 Context Store

- `ContextStore` – Per-request context using AsyncLocalStorage.

  **Static Methods:**
  - `getInstance(): AsyncLocalStorage<Store>` – Get the AsyncLocalStorage instance.
  - `getAll(): Store | undefined` – Get the current context store.
  - `run(store: Store, callback: () => void): void` – Run a callback within a context.
  - `set<K extends keyof Store>(key: K, value: Store[K]): void` – Set a value in the context.
  - `get<K extends keyof Store>(key: K): Store[K] | undefined` – Get a value from the context.

- `StoreKeys` – Common context keys.
- `getRequestId(): string | undefined` – Get the current request ID from context.

### Example (Express middleware usage):

```ts
// ✅ Recommended: Unified middleware to initialize context and logger
import { ContextStore, StoreKeys, getLogger } from "@catbee/utils";
import crypto from "crypto";

export function setupRequestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();

  ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
    const logger = getLogger().child({ reqId: requestId });
    ContextStore.set(StoreKeys.LOGGER, logger);
    logger.info("Request context initialized");
    next();
  });
}

// In your app entry point
app.use(setupRequestContext);
```

👇 Alternatively, split it into two separate middlewares:

```ts
// First: Initialize context with request ID
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => next());
});

// Second: Inject logger into the context
app.use((req, res, next) => {
  const logger = getLogger().child({ reqId: req.headers["x-request-id"] });
  ContextStore.set(StoreKeys.LOGGER, logger);
  logger.info("Request started");
  next();
});
```

## 🔐 Crypto Utilities

- `hmac(algorithm: string, input: string, secret: string): string`
- `hash(algorithm: string, input: string): string`
- `sha256Hmac(input: string, secret: string): string`
- `sha1(input: string): string`
- `sha256(input: string): string`
- `md5(input: string): string`
- `randomString(): string`


## 📂 Directory Utilities

- `ensureDir(dirPath: string): Promise<void>`
- `listFiles(dirPath: string, options?): Promise<string[]>`
- `deleteDirRecursive(dirPath: string): Promise<void>`
- `isDirectory(path: string): Promise<boolean>`
- `copyDir(src: string, dest: string): Promise<void>`
- `moveDir(src: string, dest: string): Promise<void>`
- `emptyDir(dirPath: string): Promise<void>`
- `getDirSize(dirPath: string): Promise<number>`
- `watchDir(dirPath: string, cb: (event, filename) => void)`


## 🌱 Environment Utilities

- `Environment` enum – (`DEVELOPMENT`, `PRODUCTION`, `STAGING`, `TESTING`)
- `Env` class – Environment variable helpers.

  **Static Methods:**
  - `isDev(): boolean` – Is NODE_ENV development?
  - `set(key: string, value: string): void` – Set an environment variable.
  - `getAll(): object` – Get all environment variables.
  - `get(key: string, defaultValue?: string): string | undefined` – Get an environment variable.
  - `getRequired(key: string): string` – Get a required environment variable.
  - `getNumber(key: string, defaultValue: number): number` – Get a number environment variable.
  - `getNumberRequired(key: string): number` – Get a required number environment variable.
  - `getBoolean(key: string, defaultValue = false): boolean` – Get a boolean environment variable.
  - `getBooleanRequired(key: string): boolean` – Get a required boolean environment variable.
  - `getJSON<T extends object = object>(key: string, defaultValue: T): T` – Parse a JSON object from an environment variable.
  - `getArray<T = string>(key: string, defaultValue: T[] = [], splitter = ','): string[] | T[]` – Parse a comma-separated string as an array.
  - `getEnum<T extends string>(key: string, allowedValues: T[], defaultValue?: T): T` – Get and validate an enum-like environment variable.
  - `has(key: string): boolean` – Check if an environment variable exists.
  - `delete(key: string): void` – Delete an environment variable (useful in tests). 


## 🚨 Exception Utilities

- `HttpError`, `InternalServerErrorException`, `UnauthorizedException`, `BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`, `BadGatewayException`, `TooManyRequestsException`, `ServiceUnavailableException`, `GatewayTimeoutException` – All extend `ErrorResponse`.


## 📁 File System Utilities

- `fileExists(path: string): Promise<boolean>`
- `readJsonFile<T>(path: string): Promise<T | null>`
- `writeJsonFile(path: string, data: any): Promise<void>`
- `deleteFileIfExists(path: string): Promise<boolean>`


## 📊 HTTP Status Codes

A typed object with all HTTP status codes and their standard messages.

- `HttpStatusCodes.OK === 200`
- `HttpStatusCodes.NOT_FOUND === 404`
- ...and so on.

You can use it like:

```ts
import { HttpStatusCodes } from "@catbee/utils";

res.status(HttpStatusCodes.BAD_REQUEST).send("Invalid payload");
```

## 🆔 ID Utilities

Helpers for generating unique and random identifiers, covering popular formats for distributed systems and secure tokens.

- `uuid(): string` — Generate a UUID v4 string (RFC 4122).
- `ulidString(): string` — Generate a ULID (Universally Unique Lexicographically Sortable Identifier).
- `nanoId(size?: number): string` — Generate a nanoid string.
- `randomHex(byteLength?: number): string` — Generate a cryptographically strong random hex string of given length in bytes.
- `randomInt(min: number, max: number): number` — Generate a secure random integer between min and max, inclusive.


## 📄 Logger Utilities

- `getLogger(): Logger` – Context-aware logger (uses `pino`).


## 🧩 Object Utilities

- `isObjEmpty(obj: Record<any, any>): boolean`
- `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
- `omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>`
- `deepObjMerge<T>(a: T, b: Partial<T>): T`
- `flattenObject<T>(obj: T): Record<string, any>`
- `getValueByPath<T>(obj: T, path: string)`


## 📝 Response Utilities

- `SuccessResponse<T>` – Standard API success wrapper.
- `ErrorResponse` – Standard API error wrapper.
- Types: `ApiResponse<T>`, `Pagination<T>`, `PaginationResponse<T>`


## 🧵 String Utilities

- `capitalize(str: string): string`
- `toKebabCase(str: string): string`
- `toCamelCase(str: string): string`
- `slugify(str: string): string`
- `truncate(str: string, len: number): string`


## 🌐 URL Utilities

- `appendQueryParams(url: string, params: object): string`
- `parseQueryString(query: string): Record<string, string>`


## ✅ Validate Utilities
A comprehensive suite of string/format validators for safe input and API checks.

- `isEmail(str: string): boolean` — Validate basic email address.
- `isUUID(str: string): boolean` — Validate string as UUID (v1–v5).
- `isURL(str: string): boolean` — Check if string is a valid URL.
- `isPhone(str: string): boolean` — Validate (international/E164/local) phone number.
- `isAlphanumeric(str: string): boolean` — Check for letters/numbers only.
- `isNumeric(strOrNum: string | number)`: boolean — Check safely parsable numeric value.
- `isHexColor(str: string): boolean` — Validate hex color (#RGB or #RRGGBB).
- `isISODate(str: string): boolean` — Validate ISO 8601 date string.

## 🏁 Usage

Import only what you need:

```ts
import { chunk, sleep, TTLCache, getLogger } from "@catbee/utils";
```

## 📜 License

MIT © catbee-technologies
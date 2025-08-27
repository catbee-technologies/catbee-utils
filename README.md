# @catbee/utils

## 🧰 Utility Modules for Node.js

A modular, production-grade utility toolkit for Node.js and TypeScript, designed for robust, scalable applications (including Express-based services). All utilities are tree-shakable and can be imported independently.

![build](https://img.shields.io/badge/build-passing-brightgreen) ![coverage](https://codecov.io/gh/catbee-technologies/catbee-utils/graph/badge.svg?token=XAJHK6R1OQ) ![node](https://img.shields.io/node/v/@catbee/utils) ![npm](https://img.shields.io/npm/v/@catbee/utils) ![downloads](https://img.shields.io/npm/dm/@catbee/utils) ![dependencies](https://img.shields.io/librariesio/release/npm/@catbee%2Futils) ![license](https://img.shields.io/npm/l/@catbee/utils)

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
- [**Config**](#-config)
- [**Context Store**](#-context-store)
- [**Crypto Utilities**](#-crypto-utilities)
- [**Directory Utilities**](#-directory-utilities)
- [**Environment Utilities**](#-environment-utilities)
- [**Exception Utilities**](#-exception-utilities)
- [**File System Utilities**](#-file-system-utilities)
- [**HTTP Status Codes**](#-http-status-codes)
- [**ID Utilities**](#-id-utilities)
- [**Logger Utilities**](#-logger-utilities)
- [**Middleware Utilities**](#-middleware-utilities)
- [**Object Utilities**](#-object-utilities)
- [**Request Utilities**](#-request-utilities)
- [**Response Utilities**](#-response-utilities)
- [**String Utilities**](#-string-utilities)
- [**URL Utilities**](#-url-utilities)
- [**Validate Utilities**](#-validate-utilities)
- [**Decorators Utilities**](#-decorators-utilities)
- [**Express Server**](#-express-server)

---

## 📦 Array Utilities

A collection of functions for handling arrays with type-safety and efficiency.

- `chunk<T>(array: T[], size: number): T[][]` – Split array into chunks of specified size.
- `unique<T>(array: T[], keyFn?: (item: T) => unknown): T[]` – Remove duplicate items from an array, optionally by key.
- `flattenDeep<T>(array: any[]): T[]` – Deeply flatten a nested array.
- `random<T>(array: T[]): T | undefined` – Get a random element from an array.
- `groupBy<T>(array: T[], keyOrFn: keyof T | ((item: T) => string | number | symbol)): Record<string | number | symbol, T[]>` – Group array items by a key or function.
- `shuffle<T>(array: T[]): T[]` – Shuffle array elements randomly.
- `pluck<T, K extends keyof T>(array: T[], key: K): T[K][]` – Extract values for a given key from an array of objects.
- `difference<T>(a: T[], b: T[]): T[]` – Get elements in array `a` not present in array `b`.
- `intersect<T>(a: T[], b: T[]): T[]` – Get elements common to both arrays.
- `mergeSort<T>(array: T[], key: string | ((item: T) => any), direction?: "asc" | "desc"): T[]` – Sort array by key or function using merge sort.
- `zip<T>(...arrays: T[][]): T[][]` – Combine multiple arrays element-wise.
- `partition<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean): [T[], T[]]` – Split array into two based on predicate.
- `range(start: number, end: number, step?: number): number[]` – Create an array of numbers in a range.
- `take<T>(array: T[], n?: number): T[]` – Take the first `n` elements from an array.
- `takeWhile<T>(array: T[], predicate: (item: T, index: number) => boolean): T[]` – Take elements from array while predicate is true.
- `compact<T>(array: T[]): NonNullable<T>[]` – Remove falsy values from an array.
- `countBy<T>(array: T[], keyFn: (item: T) => string | number | symbol): Record<string, number>` – Count occurrences by key or function.

**Examples:**

```ts
// Group users by their role
const users = [
  { id: 1, role: 'admin', name: 'Alice' },
  { id: 2, role: 'user', name: 'Bob' },
  { id: 3, role: 'user', name: 'Charlie' }
];
const groupedByRole = groupBy(users, 'role');
// { admin: [{ id: 1, ... }], user: [{ id: 2, ... }, { id: 3, ... }] }

// Partition an array into two groups
const numbers = [1, 2, 3, 4, 5, 6];
const [evens, odds] = partition(numbers, n => n % 2 === 0);
// evens: [2, 4, 6], odds: [1, 3, 5]

// Complex sorting with mergeSort
const items = [
  { nested: { value: 5 } }, 
  { nested: { value: 2 } }, 
  { nested: { value: 8 } }
];
const sorted = mergeSort(items, (item) => item.nested.value);
// [{ nested: { value: 2 } }, { nested: { value: 5 } }, { nested: { value: 8 } }]
```

## ⏳ Async Utilities

Functions for handling asynchronous operations with better control flow and error handling.

- `sleep(ms: number): Promise<void>` – Pause execution for a given number of milliseconds.
- `debounce<T>(fn: T, delay: number): T & { cancel(): void; flush(): void }` – Debounce function calls, only invoking after delay.
- `throttle<T>(fn: T, limit: number, opts?): (...args: Parameters<T>) => void` – Throttle function calls to a maximum rate.
- `retry<T>(fn: () => Promise<T>, retries?: number, delay?: number, backoff?: boolean, onRetry?): Promise<T>` – Retry a promise-returning function with optional backoff.
- `withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>` – Reject promise if it takes longer than specified time.
- `runInBatches<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]>` – Run async tasks in batches with concurrency limit.
- `singletonAsync<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, drop?: boolean): (...args: TArgs) => Promise<TResult>` – Ensure only one instance of an async function runs at a time.
- `settleAll<T>(tasks: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]>` – Run all tasks and return their settled results.
- `createTaskQueue(limit: number): TaskQueue` – Create a queue to run tasks with concurrency control.
- `runInSeries<T>(tasks: (() => Promise<T>)[]): Promise<T[]>` – Run async tasks one after another.
- `memoizeAsync<T, Args extends any[]>(fn: (...args: Args) => Promise<T>, options?): (...args: Args) => Promise<T>` – Memoize async function results.
- `abortable<T>(promise: Promise<T>, signal: AbortSignal, abortValue?: any): Promise<T>` – Make a promise abortable via AbortSignal.
- `createDeferred<T>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void]` – Create a deferred promise with resolve/reject.
- `waterfall<T>(fns: Array<(input: any) => Promise<any>>): (initialValue: any) => Promise<T>` – Run async functions in sequence, passing result to next.
- `rateLimit<T>(fn: (...args: any[]) => Promise<T>, maxCalls: number, interval: number): (...args: any[]) => Promise<T>` – Limit the rate of async function calls.

**Examples:**

```ts
// Retry a flaky API call
const fetchData = async () => {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return await response.json();
};

const result = await retry(
  fetchData, 
  3,                    // retry 3 times
  1000,                 // wait 1 second between retries
  true,                 // use exponential backoff
  (err, attempt) => console.log(`Attempt ${attempt} failed: ${err.message}`)
);

// Process items in batches to avoid overloading resources
const processItem = async (id) => {
  // Process a single item...
  return `Processed ${id}`;
};

const itemIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const tasks = itemIds.map(id => processItem(id));
const results = await runInBatches(tasks, 3); // Process 3 items concurrently

// Function waterfall (pipeline)
const pipeline = waterfall([
  async (input) => input * 2,
  async (input) => input + 10,
  async (input) => `Result: ${input}`
]);

const finalResult = await pipeline(5); // "Result: 20"
```

## 🗃️ Cache Utilities

In-memory TTL cache with advanced features for efficient data caching and retrieval.

- `TTLCache<K, V>(options?: TTLCacheOptions)` – Create a time-to-live in-memory cache with various methods for managing entries.

**Examples:**
```ts
const cache = new TTLCache<string, number>({ ttlMs: 3600_000 });
cache.set("foo", 42);
cache.get("foo"); // 42
cache.has("foo"); // true
cache.cleanup();  // cleans expired
```

## ⚙️ Config

Global configuration settings for the application, including logging, HTTP, and cache settings.

- `config.logger.level` – Set the logging level (e.g., 'info', 'debug').
- `config.logger.name` – Set the logger name.
- `config.logger.pretty` – Enable pretty print for logs.
- `config.http.timeout` – Set HTTP request timeout in milliseconds.
- `config.cache.defaultTtl` – Set default cache TTL in seconds.
- `setConfig(value: Partial<typeof config>): void` – Update configuration settings.
- `getConfig(): typeof config` – Get the current configuration settings.

**Example:**
```ts
import { setConfig } from "@catbee/utils";

// Configure logging
setConfig({ logger: { pretty: true } });

console.log(getConfig());
```

## 🧩 Context Store

Per-request context management using AsyncLocalStorage, allowing for easy sharing of data across async calls.

- `ContextStore` – Per-request context using AsyncLocalStorage.
  - `getInstance(): AsyncLocalStorage<Store>` – Get the AsyncLocalStorage instance.
  - `getAll(): Store | undefined` – Get the current context store.
  - `run(store: Store, callback: () => void): void` – Run a callback with a specific store context.
  - `set(key: symbol, value: unknown): void` – Set a value in the current store.
  - `get<T>(key: symbol): T | undefined` – Get a value from the current store.
  - `has(key: symbol): boolean` – Check if a key exists in the store.
  - `delete(key: symbol): boolean` – Remove a key from the store.
  - `patch(values: Partial<Record<symbol, unknown>>): void` – Update multiple values in the store.
  - `withValue(key: symbol, value: unknown, callback: () => T): T` – Temporarily set a value for a callback.
  - `extend(newValues: Partial<Record<symbol, unknown>>, callback: () => T): T` – Temporarily extend the store for a callback.
  - `createExpressMiddleware(initialValuesFactory?): Middleware` – Create Express middleware for context.

- `StoreKeys` – Common context keys.
- `getRequestId(): string | undefined` – Get the current request ID from context.

**Example (Express middleware usage):**
```ts
import { ContextStore, StoreKeys, getLogger } from "@catbee/utils";
import crypto from "crypto";

export function setupRequestContext(req, res, next) {
  const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();
  ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
    const logger = getLogger().child({ requestId });
    ContextStore.set(StoreKeys.LOGGER, logger);
    logger.info("Request context initialized");
    next();
  });
}
app.use(setupRequestContext);
```

## 🔐 Crypto Utilities

Secure cryptographic functions for encryption, hashing, and token generation.

- `hmac(algorithm: string, input: string, secret: string, encoding?: BinaryToTextEncoding): string` – Generate an HMAC hash.
- `hash(algorithm: string, input: string, encoding?: BinaryToTextEncoding): string` – Generate a hash using a specified algorithm.
- `sha256Hmac(input: string, secret: string): string` – Generate a SHA256 HMAC.
- `sha1(input: string, encoding?: BinaryToTextEncoding): string` – Generate a SHA1 hash.
- `sha256(input: string, encoding?: BinaryToTextEncoding): string` – Generate a SHA256 hash.
- `md5(input: string): string` – Generate an MD5 hash.
- `randomString(): string` – Generate a cryptographically secure random string.
- `generateRandomBytes(byteLength?: number): Buffer` – Generate random bytes.
- `generateRandomBytesAsString(byteLength?: number, encoding?: BinaryToTextEncoding): string` – Generate random bytes as a string.
- `generateApiKey(prefix?: string, byteLength?: number): string` – Generate an API key with optional prefix.
- `safeCompare(a: string | Buffer | Uint8Array, b: string | Buffer | Uint8Array): boolean` – Timing-safe string comparison.
- `encrypt(data: string | Buffer, key: string | Buffer, options?): Promise<EncryptionResult>` – Encrypt data using AES.
- `decrypt(encryptedData: EncryptionResult, key: string | Buffer, options?): Promise<string | Buffer>` – Decrypt AES encrypted data.
- `createSignedToken(payload: object, secret: string, expiresInSeconds?: number): string` – Create a signed token (JWT-like).
- `verifySignedToken(token: string, secret: string): object | null` – Verify and decode a signed token.

**Examples:**

```ts
// Generate and verify JWT-like tokens
const payload = { userId: 123, permissions: ['read', 'write'] };
const secret = 'secret-key';

const token = createSignedToken(payload, secret, 3600); // expires in 1 hour

// Later, verify and decode
const decodedPayload = verifySignedToken(token, secret);
if (decodedPayload) {
  console.log(`User ID: ${decodedPayload.userId}`);
}

// Generate API keys for your service
const apiKey = generateApiKey('usr_', 32);
// usr_8f7d8937a9f27cb6b3f8a0928f5c9c1e
```

## 📂 Directory Utilities

File and directory manipulation utilities for managing file system interactions.

- `ensureDir(dirPath: string): Promise<void>` – Ensure a directory exists.
- `listFiles(dirPath: string, recursive?: boolean): Promise<string[]>` – List files in a directory.
- `deleteDirRecursive(dirPath: string): Promise<void>` – Delete a directory and its contents.
- `isDirectory(pathStr: string): Promise<boolean>` – Check if a path is a directory.
- `copyDir(src: string, dest: string): Promise<void>` – Copy a directory recursively.
- `moveDir(src: string, dest: string): Promise<void>` – Move a directory.
- `emptyDir(dirPath: string): Promise<void>` – Remove all contents from a directory.
- `getDirSize(dirPath: string): Promise<number>` – Get the total size of a directory.
- `watchDir(dirPath: string, callback): () => void` – Watch a directory for changes.
- `findFilesByPattern(pattern: string, options?): Promise<string[]>` – Find files matching a pattern.
- `getSubdirectories(dirPath: string, recursive?: boolean): Promise<string[]>` – Get subdirectories of a directory.
- `ensureEmptyDir(dirPath: string): Promise<void>` – Ensure a directory exists and is empty.
- `createTempDir(options?): Promise<{ path: string, cleanup: () => Promise<void> }>` – Create a temporary directory.
- `findNewestFile(dirPath: string, recursive?: boolean): Promise<string | null>` – Find the newest file in a directory.
- `findOldestFile(dirPath: string, recursive?: boolean): Promise<string | null>` – Find the oldest file in a directory.
- `findInDir(dirPath: string, predicate, recursive?: boolean): Promise<string[]>` – Find files in a directory by predicate.
- `watchDirRecursive(dirPath: string, callback, includeSubdirs?: boolean): Promise<() => void>` – Watch a directory and subdirectories for changes.
- `getDirStats(dirPath: string): Promise<{ fileCount: number, dirCount: number, totalSize: number }>` – Get statistics for a directory.
- `walkDir(dirPath: string, options): Promise<void>` – Walk a directory tree with callbacks.

**Examples:**

```ts
// Safely ensure a directory exists and is empty
await ensureEmptyDir('./temp/uploads');

// Find specific files in a directory structure
const imageFiles = await findInDir('./content', 
  (path) => path.endsWith('.jpg') || path.endsWith('.png'),
  true // recursive search
);

// Create a temporary directory that cleans itself up
const { path, cleanup } = await createTempDir({ 
  prefix: 'app-', 
  parentDir: './temp' 
});

try {
  // Use the temporary directory...
  await writeTextFile(`${path}/data.txt`, 'Hello world');
} finally {
  // Clean up when done
  await cleanup();
}
```

## 🌱 Environment Utilities

Environment variable management with powerful type-safe access, validation, and transformation capabilities.

- `Environment` enum – (`DEVELOPMENT`, `PRODUCTION`, `STAGING`, `TESTING`) – Enum for environment types.
- `Env` class – Environment variable helpers.
  - `isDev(): boolean` – Check if running in development environment.
  - `isProd(): boolean` – Check if running in production environment.
  - `isTest(): boolean` – Check if running in test environment.
  - `isStaging(): boolean` – Check if running in staging environment.
  - `set(key: string, value: string): void` – Set an environment variable.
  - `getAll(): object` – Get all environment variables.
  - `get(key: string, defaultValue: string): string` – Get a variable with a default value.
  - `getRequired(key: string): string` – Get a required variable, throw if missing.
  - `getOrFail(key: string): string` – Alias for getRequired.
  - `getNumber(key: string, defaultValue: number): number` – Get a variable as a number.
  - `getNumberRequired(key: string): number` – Get a required number variable.
  - `getInteger(key: string, defaultValue: number, options?): number` – Get an integer with optional validation.
  - `getBoolean(key: string, defaultValue?: boolean): boolean` – Get a variable as a boolean.
  - `getBooleanRequired(key: string): boolean` – Get a required boolean variable.
  - `getJSON<T>(key: string, defaultValue: T): T` – Parse a variable as JSON.
  - `getArray<T = string>(key: string, defaultValue?: T[], splitter?: string, transform?): T[]` – Parse a variable as an array.
  - `getNumberArray(key: string, defaultValue?: number[], splitter?: string): number[]` – Parse a variable as an array of numbers.
  - `getEnum<T extends string>(key: string, allowedValues: T[], defaultValue: T): T` – Get a variable as an enum value.
  - `getNumberEnum(key: string, allowedValues: number[], defaultValue: number): number` – Get a variable as a numeric enum.
  - `getUrl(key: string, defaultValue: string, options?): string` – Get and validate a URL variable.
  - `getEmail(key: string, defaultValue: string): string` – Get and validate an email variable.
  - `getPath(key: string, defaultValue: string, options?): string` – Get and validate a file path variable.
  - `getPort(key: string, defaultValue: number): number` – Get and validate a port number.
  - `getDate(key: string, defaultValue?: string | Date): Date` – Parse a variable as a date.
  - `getDuration(key: string, defaultValue?: string | number): number` – Parse a variable as a duration in ms.
  - `getSafeEnv(sensitiveKeys?: string[]): Record<string, string>` – Get environment with sensitive values masked.
  - `getWithDefault(key: string, defaultFn: () => string): string` – Get a variable or compute a default.
  - `loadFromFile(path: string): Record<string, string>` – Load variables from a .env file.
  - `has(key: string): boolean` – Check if a variable exists.
  - `delete(key: string): void` – Delete a variable.
  - `clearCache(): void` – Clear the internal cache.

**Examples:**

```ts
import { Env, Environment } from "@catbee/utils";

// Check current environment
if (Env.isDev()) {
  console.log("Running in development mode");
}

// Variable expansion (reference other environment variables)
// If DATABASE_HOST=localhost and DATABASE_NAME=myapp
Env.set('DATABASE_URL', 'postgres://${DATABASE_HOST}:5432/${DATABASE_NAME}');
const dbUrl = Env.get('DATABASE_URL', ''); // "postgres://localhost:5432/myapp"

// Load from .env file
Env.loadFromFile('.env.local');

// Number validation with range checks
const port = Env.getInteger('PORT', 3000, { min: 1024, max: 49151 });
const workerCount = Env.getNumber('WORKER_COUNT', 4);

// URL validation with protocol restrictions
const apiUrl = Env.getUrl('API_URL', 'https://api.example.com', {
  protocols: ['https'],
  requireTld: true,
  allowLocalhost: Env.isDev() // allow localhost in development
});

// Path validation with existence check
const configPath = Env.getPath('CONFIG_PATH', './config.json', {
  mustExist: true,
  allowedExtensions: ['.json', '.yaml']
});

// Parse arrays with automatic transformation
const ports = Env.getNumberArray('ALLOWED_PORTS', [80, 443]);
const features = Env.getArray('ENABLED_FEATURES', [], ',');

// Parse dates and durations
const launchDate = Env.getDate('LAUNCH_DATE');
const cacheTtl = Env.getDuration('CACHE_TTL', '1h'); // in milliseconds

// Complex configurations from JSON
const serverConfig = Env.getJSON('SERVER_CONFIG', {
  maxConnections: 100,
  timeout: 30000,
  retries: 3
});

// Safe environment printing (hiding secrets)
console.log(Env.getSafeEnv(['PASSWORD', 'API_KEY', 'SECRET']));

// Lazy default evaluation (only runs if variable is missing)
const hostname = Env.getWithDefault('HOSTNAME', () => {
  console.log('Computing hostname...');
  return require('os').hostname();
});
```

## 🚨 Exception Utilities

- `HttpError` – Base HTTP error class.
- `InternalServerErrorException` – HTTP 500 error.
- `UnauthorizedException` – HTTP 401 error.
- `BadRequestException` – HTTP 400 error.
- `NotFoundException` – HTTP 404 error.
- `ForbiddenException` – HTTP 403 error.
- `ConflictException` – HTTP 409 error.
- `BadGatewayException` – HTTP 502 error.
- `TooManyRequestsException` – HTTP 429 error.
- `ServiceUnavailableException` – HTTP 503 error.
- `GatewayTimeoutException` – HTTP 504 error.
- `UnprocessableEntityException` – HTTP 422 error.
- `MethodNotAllowedException` – HTTP 405 error.
- `NotAcceptableException` – HTTP 406 error.
- `RequestTimeoutException` – HTTP 408 error.
- `UnsupportedMediaTypeException` – HTTP 415 error.
- `PayloadTooLargeException` – HTTP 413 error.
- `InsufficientStorageException` – HTTP 507 error.
- `isHttpError(error: unknown): error is ErrorResponse` – Check if an error is an HTTP error.
- `createHttpError(status: number, message?: string): ErrorResponse` – Create a custom HTTP error.
- `hasErrorShape(error: unknown): error is { message: string; status?: number; code?: string }` – Check if an error has a standard shape.
- `getErrorMessage(error: unknown): string` – Extract a message from any error.
- `withErrorHandling<T extends (...args: any[]) => Promise<any>>(handler: T): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>` – Wrap an async function with error handling.

## 📁 File System Utilities

- `fileExists(path: string): Promise<boolean>` – Check if a file exists.
- `readJsonFile<T>(path: string): Promise<T | null>` – Read and parse a JSON file.
- `writeJsonFile(path: string, data: any, space?: number): Promise<void>` – Write data to a JSON file.
- `deleteFileIfExists(path: string): Promise<boolean>` – Delete a file if it exists.
- `readTextFile(path: string, encoding?: BufferEncoding): Promise<string | null>` – Read a text file.
- `writeTextFile(path: string, content: string, encoding?: BufferEncoding): Promise<boolean>` – Write text to a file.
- `appendTextFile(path: string, content: string, encoding?: BufferEncoding): Promise<boolean>` – Append text to a file.
- `copyFile(source: string, destination: string, overwrite?: boolean): Promise<boolean>` – Copy a file.
- `moveFile(oldPath: string, newPath: string): Promise<boolean>` – Move or rename a file.
- `getFileStats(path: string): Promise<fs.Stats | null>` – Get file statistics.
- `createTempFile(options?): Promise<string>` – Create a temporary file.
- `streamFile(source: string, destination: string): Promise<void>` – Stream file contents.
- `readDirectory(dirPath: string, options?): Promise<string[]>` – Read directory contents.
- `createDirectory(dirPath: string, recursive?: boolean): Promise<boolean>` – Create a directory.
- `safeReadJsonFile<T>(path: string): Promise<{ data: T | null; error: Error | null }>` – Safely read a JSON file.
- `isFile(path: string): Promise<boolean>` – Check if a path is a file.
- `getFileSize(path: string): Promise<number>` – Get the size of a file.
- `readFileBuffer(path: string): Promise<Buffer | null>` – Read a file as a buffer.

**Examples:**
```ts
import { readFileBuffer } from "@catbee/utils";
const buffer = await readFileBuffer("./file.txt");
```

## 📊 HTTP Status Codes

A typed enum with all HTTP status codes and their standard messages.

- `HttpStatusCodes.OK === 200` – HTTP 200 OK.
- `HttpStatusCodes.NOT_FOUND === 404` – HTTP 404 Not Found.
- ...and so on.

**Example:**
```ts
import { HttpStatusCodes } from "@catbee/utils";
res.status(HttpStatusCodes.BAD_REQUEST).send("Invalid payload");
```

## 🆔 ID Utilities

- `uuid(): string` – Generate a UUID v4.
- `nanoId(size?: number): string` – Generate a compact, URL-friendly unique ID.
- `randomHex(byteLength?: number): string` – Generate a random hexadecimal string.
- `randomInt(min: number, max: number): number` – Generate a random integer in a range.
- `randomBase64(byteLength?: number): number` – Generate a random Base64 string.

**Examples:**
```ts
import { nanoId } from "@catbee/utils";
const id = nanoId();
```

## 📄 Logger Utilities

- `getLogger(): Logger` – Get the default logger instance.
- `createChildLogger(bindings: Record<string, any>, parentLogger?: Logger): Logger` – Create a child logger with bindings.
- `createRequestLogger(requestId: string, additionalContext?: Record<string, any>): Logger` – Create a logger for a specific request.
- `logError(error: Error | unknown, message?: string, context?: Record<string, any>): void` – Log an error with optional context.
- `resetLogger(): void` – Reset the logger to its initial state.
- `getRedactCensor(): (value: any, paths: string[]) => any` – Get a censor function for redacting sensitive info.
- `setRedactCensor(censor: (value: any, paths: string[]) => any): void` – Set a custom censor function.
- `addRedactFields(fields: string[]): void` – Add fields to redact.
- `setSensitiveFields(): void` – Set the list of sensitive fields to redact.
- `addSensitiveFields(fields: string[]): void` – Add sensitive fields to redact.
- `LoggerLevels`: Enum for log levels (e.g., INFO, WARN, ERROR).
- `Logger`: Interface for the logger instance.

**Examples:**
```ts
import { getLogger } from "@catbee/utils";
const logger = getLogger();
logger.info("App started");
logger.warn("Potential issue detected");
logger.error({ context: "some context" }, "Error occurred");
```

## 🧩 Middleware Utilities

- `requestId(options: { headerName?: string; exposeHeader?: boolean; generator?: () => string }): Middleware` – Generate and attach a unique request ID to each request.
- `responseTime(options?: { addHeader?: boolean; logOnComplete?: boolean }): Middleware` – Measure and log the response time for each request.
- `timeout(timeoutMs?: number): Middleware` – Abort requests that exceed a specified timeout.
- `setupRequestContext(): Middleware` – Set up the request context for each incoming request.
- `errorHandler(options: { logErrors?: boolean; includeDetails?: boolean }): Middleware` – Centralized error handling middleware.

**Example:**
```ts
import { Env, requestId, responseTime, errorHandler } from "@catbee/utils";
app.use(requestId({ headerName: "X-Request-ID", autoLog: true }));
app.use(responseTime({ addHeaders: true, logOnComplete: true }));
app.use(errorHandler({ logErrors: true, includeDetails: true }));
```

## 🧩 Object Utilities

A set of helpers for working with JavaScript objects, including deep merging, flattening, picking/omitting keys, and more. These utilities help safely manipulate and inspect objects in a type-safe way.

- `isObjEmpty(obj: Record<any, any>): boolean` – Check if an object has no own properties.
- `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>` – Create a new object with only the specified keys.
- `omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>` – Create a new object without the specified keys.
- `deepObjMerge<T extends object>(target: T, ...sources: any[]): T` – Deeply merge multiple objects into the target.
- `isPlainObject(value: any): value is Record<string, any>` – Check if a value is a plain object.
- `flattenObject<T>(obj: T, prefix?: string): Record<string, any>` – Flatten a nested object into dot notation.
- `getValueByPath<T>(obj: T, path: string): any` – Get a value from an object by dot path.
- `setValueByPath<T>(obj: T, path: string, value: any): T` – Set a value in an object by dot path.
- `isEqual(a: any, b: any): boolean` – Deeply compare two values for equality.
- `filterObject<T>(obj: T, predicate): Partial<T>` – Filter object properties by predicate.
- `mapObject<T, U>(obj: T, mapFn): Record<keyof T, U>` – Map object values to a new object.
- `deepFreeze<T>(obj: T): Readonly<T>` – Recursively freeze an object.
- `isObject(value: unknown): value is Record<string, any>` – Check if a value is a plain object.
- `getAllPaths(obj: Record<string, any>, parentPath?: string): string[]` – Get all dot paths in an object.

**Examples:**

```ts
// Deep merge configurations
const defaultConfig = { 
  server: { port: 3000, host: 'localhost' },
  logging: { level: 'info', format: 'json' }
};

const userConfig = {
  server: { port: 8080 },
  logging: { pretty: true }
};

const finalConfig = deepObjMerge(defaultConfig, userConfig);
/* Result:
{
  server: { port: 8080, host: 'localhost' },
  logging: { level: 'info', format: 'json', pretty: true }
}
*/

// Flatten and unflatten nested objects
const user = {
  name: 'Alice',
  details: {
    address: {
      city: 'New York',
      zip: '10001'
    },
    preferences: {
      theme: 'dark'
    }
  }
};

const flat = flattenObject(user);
/* Result:
{
  'name': 'Alice',
  'details.address.city': 'New York',
  'details.address.zip': '10001',
  'details.preferences.theme': 'dark'
}
*/

// Getting and setting values by path
const theme = getValueByPath(user, 'details.preferences.theme'); // 'dark'
const updated = setValueByPath(user, 'details.address.state', 'NY');
```

## 📝 Request Utilities

Functions for safely parsing, validating, and extracting parameters from HTTP requests.

- `parseNumberParam(value: string | undefined, options?: ValidationOptions): ValidationResult<number>` – Parse and validate a numeric parameter from a string.
- `parseBooleanParam(value: string | undefined, options?: ValidationOptions): ValidationResult<boolean>` – Parse and validate a boolean parameter from a string.
- `extractPaginationParams(query: Record<string, string | string[]>, defaultPage?: number, defaultLimit?: number, maxLimitSize?: number): { page: number; limit: number }` – Extract and validate pagination parameters from a query object.
- `extractSortParams(query: Record<string, string | string[]>, allowedFields: string[], defaultSort?): { sortBy: string; sortOrder: 'asc' | 'desc' }` – Extract and validate sorting parameters from a query object.
- `extractFilterParams(query: Record<string, string | string[]>, allowedFilters: string[]): Record<string, string | string[]>` – Extract filter parameters from a query object based on allowed fields.

**Types:**
```ts
interface ValidationOptions {
  throwOnError?: boolean;
  errorMessage?: string;
  defaultValue?: any;
  required?: boolean;
}

interface ValidationResult<T> {
  isValid: boolean;
  value: T | null;
  error?: string;
}
```

**Examples:**

```ts
import { 
  parseNumberParam, 
  parseBooleanParam,
  extractPaginationParams,
  extractSortParams,
  extractFilterParams
} from '@catbee/utils';

// Parse and validate query parameters
function handleRequest(req, res) {
  // Parse numeric parameter with validation
  const idResult = parseNumberParam(req.query.id, { 
    required: true,
    throwOnError: false 
  });
  
  if (!idResult.isValid) {
    return res.status(400).send({ error: idResult.error });
  }
  
  // Parse boolean parameter
  const isActiveResult = parseBooleanParam(req.query.isActive, {
    defaultValue: false
  });
  
  // Extract standard pagination parameters
  const { page, limit } = extractPaginationParams(
    req.query,
    1,     // default page
    20,    // default limit
    100    // max limit
  );
  
  // Extract sorting parameters
  const { sortBy, sortOrder } = extractSortParams(
    req.query,
    ['name', 'createdAt', 'price'],  // allowed fields
    { sortBy: 'createdAt', sortOrder: 'desc' }  // defaults
  );
  
  // Extract filters based on allowed fields
  const filters = extractFilterParams(
    req.query,
    ['category', 'status', 'price']
  );
  
  // Process the request with validated parameters
  const items = getItems({
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    isActive: isActiveResult.value
  });
  
  return res.json(items);
}
```

## 📝 Response Utilities

Helpers for creating and sending standardized API responses, including success, error, paginated, and redirect responses. Ensures consistent structure and status codes for all API endpoints.

- `SuccessResponse<T>` – Standard API success wrapper object.
- `ErrorResponse` – Standard API error wrapper object.
- `PaginatedResponse<T>` – Paginated API response object.
- `NoContentResponse` – 204 No Content response object.
- `RedirectResponse` – Redirect response object.
- `createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T>` – Create a success response.
- `createErrorResponse(message: string, statusCode?: number): ErrorResponse` – Create an error response.
- `createPaginatedResponse<T>(allItems: T[], page: number, pageSize: number, message?: string): PaginatedResponse<T>` – Create a paginated response.
- `sendResponse(res, apiResponse): void` – Send an API response using an HTTP response object.
- `isApiResponse(value: any): value is ApiResponse<any>` – Check if a value is an API response.

**Examples:**

```ts
import { 
  createSuccessResponse, 
  createErrorResponse,
  createPaginatedResponse,
  sendResponse
} from "@catbee/utils";
import express from "express";

const app = express();

app.get('/api/users', (req, res) => {
  try {
    const allUsers = [/* ...users from database... */];
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || 10;
    
    const response = createPaginatedResponse(
      allUsers,
      page,
      pageSize,
      'Users retrieved successfully'
    );
    
    sendResponse(res, response);
  } catch (error) {
    const errorResponse = createErrorResponse(
      'Failed to retrieve users',
      500
    );
    sendResponse(res, errorResponse);
  }
});

app.get('/api/profile', (req, res) => {
  const user = { id: 123, name: 'Alice' };
  const response = createSuccessResponse(user, 'Profile retrieved');
  sendResponse(res, response);
  
  // This sends:
  // {
  //   success: true,
  //   data: { id: 123, name: 'Alice' },
  //   message: 'Profile retrieved'
  // }
});
```

## 🧵 String Utilities

A set of utilities for manipulating, formatting, and transforming strings. Includes helpers for casing, masking, slugifying, truncating, and more.

- `capitalize(str: string): string` – Capitalize the first letter of a string.
- `toKebabCase(str: string): string` – Convert a string to kebab-case.
- `toCamelCase(str: string): string` – Convert a string to camelCase.
- `slugify(str: string): string` – Convert a string to a URL-friendly slug.
- `truncate(str: string, len: number): string` – Truncate a string to a maximum length.
- `toPascalCase(str: string): string` – Convert a string to PascalCase.
- `toSnakeCase(str: string): string` – Convert a string to snake_case.
- `mask(str: string, visibleStart?: number, visibleEnd?: number, maskChar?: string): string` – Mask part of a string for privacy.
- `stripHtml(str: string): string` – Remove HTML tags from a string.
- `equalsIgnoreCase(a: string, b: string): boolean` – Compare two strings ignoring case.
- `reverse(str: string): string` – Reverse the characters in a string.
- `countOccurrences(str: string, substring: string, caseSensitive?: boolean): number` – Count how many times a substring appears.

** Examples **
```ts
import { capitalize, toCamelCase, slugify, mask } from "@catbee/utils";

const exampleString = "Hello World";

console.log(capitalize(exampleString)); // "Hello world"
console.log(toCamelCase(exampleString)); // "helloWorld"
console.log(slugify(exampleString)); // "hello-world"
console.log(mask(exampleString, 2, 5, "*")); // "He***"
```

## 🌐 URL Utilities

Helpers for parsing, validating, building, and manipulating URLs and query strings. Useful for web, API, and routing logic.

- `appendQueryParams(url: string, params: Record<string, string | number>): string` – Add query parameters to a URL.
- `parseQueryString(query: string): Record<string, string>` – Parse a query string into an object.
- `isValidUrl(url: string, requireHttps?: boolean): boolean` – Check if a string is a valid URL.
- `getDomain(url: string, removeSubdomains?: boolean): string` – Extract the domain from a URL.
- `joinPaths(...segments: string[]): string` – Join multiple URL path segments.
- `normalizeUrl(url: string, base?: string): string` – Normalize a URL, optionally with a base.
- `createUrlBuilder(baseUrl: string): { path(path: string, params?: Record<string, any>): string; query(params: Record<string, any>): string }` – Build URLs with paths and query parameters.
- `extractQueryParams(url: string, paramNames: string[]): Record<string, string>` – Extract specific query parameters from a URL.
- `removeQueryParams(url: string, paramsToRemove: string[]): string` – Remove specific query parameters from a URL.
- `getExtension(url: string): string` – Get the file extension from a URL.
- `parseTypedQueryParams<T>(url: string, converters?: Record<keyof T, (val: string) => any>): Partial<T>` – Parse and convert query parameters to typed values.

**Example:**
```ts
const url = appendQueryParams('https://example.com', { page: 1, limit: 10 });
// → 'https://example.com/?page=1&limit=10'
```

## ✅ Validate Utilities

A comprehensive suite of validators for checking strings, numbers, objects, arrays, and common formats such as email, UUID, IP, and more. Useful for input validation and API parameter checks.

- `isPort(str: string | number): boolean` – Check if a string or number is a valid port number.
- `isEmail(str: string): boolean` – Check if a string is a valid email address.
- `isUUID(str: string): boolean` – Check if a string is a valid UUID.
- `isURL(str: string): boolean` – Check if a string is a valid URL.
- `isPhone(str: string): boolean` – Check if a string is a valid phone number.
- `isAlphanumeric(str: string): boolean` – Check if a string contains only letters and numbers.
- `isNumeric(value: string | number): boolean` – Check if a value is numeric.
- `isHexColor(str: string): boolean` – Check if a string is a valid hex color code.
- `isISODate(str: string): boolean` – Check if a string is a valid ISO date.
- `isLengthBetween(str: string, min: number, max: number): boolean` – Check if a string's length is within a range.
- `isNumberBetween(value: number, min: number, max: number): boolean` – Check if a number is within a range.
- `isAlpha(str: string): boolean` – Check if a string contains only letters.
- `isStrongPassword(str: string): boolean` – Check if a string is a strong password.
- `isIPv4(str: string): boolean` – Check if a string is a valid IPv4 address.
- `isIPv6(str: string): boolean` – Check if a string is a valid IPv6 address.
- `isCreditCard(str: string): boolean` – Check if a string is a valid credit card number.
- `isValidJSON(str: string): boolean` – Check if a string is valid JSON.
- `isArray<T = unknown>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[]` – Check if a value is an array (optionally with type guard).
- `isObject(value: unknown): value is Record<string, unknown>` – Check if a value is a plain object.
- `hasRequiredProps(obj: Record<string, unknown>, requiredProps: string[]): boolean` – Check if an object has all required properties.
- `isDateInRange(date: Date, minDate?: Date, maxDate?: Date): boolean` – Check if a date is within a range.
- `matchesPattern(str: string, pattern: RegExp): boolean` – Check if a string matches a regular expression.
- `validateAll(value: unknown, validators: Array<(value: unknown) => boolean>): boolean` – Check if all validators pass for a value.

---

# 📧 Decorators Utilities

## Available Decorators

- `@Controller(basePath: string)` – Class decorator to set the base route.
- `@Get(path)`, `@Post(path)`, `@Put(path)`, `@Patch(path)`, `@Delete(path)`, `@Options(path)`, `@Head(path)`, `@Trace(path)`, `@Connect(path)` – Method decorators for HTTP verbs.
- `@Use(...middlewares)` – Attach Express-style middleware to a route handler.
- `@Query(key?)`, `@Param(key?)`, `@Body(key?)`, `@Req()`, `@Res()` – Parameter decorators for extracting request data.
- `@HttpCode(status)` – Set custom HTTP status code for the response.
- `@Header(name, value)` – Set custom response headers.
- `@Before(fn)`, `@After(fn)` – Register before/after hooks for a route handler.
- `@Redirect({ url?: string, statusCode: number })` – Redirect to a different URL.
- `@Roles(...roles: string[])` – Restrict access to certain roles - req.user.roles[] should include at least one of the specified roles.

## Example Usage

```typescript
import {
  Controller, Get, Post, Use, Query, Param, Body, Req, Res,
  HttpCode, Header, Before, After, Roles, registerControllers
} from './src/utils/decorators.utils';

// Example middleware
function logMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log('Request:', req.method, req.url);
  next();
}

// Example before/after hooks
function beforeHook(req: Request, res: Response) {
  console.log('Before handler');
}
function afterHook(req: Request, res: Response, result: any) {
  console.log('After handler', result);
}

@Controller('/api')
class ExampleController {
  @Get('/items/:id')
  @Use(logMiddleware)
  @HttpCode(200)
  @Header('X-Example', 'yes')
  @Before(beforeHook)
  @After(afterHook)
  @Roles('admin', 'moderator')
  @Redirect('/https://example.com')
  getItem(
    @Query('q') q: string,
    @Param('id') id: string,
    @Body('name') name: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    return { q, id, name };
  }

  @Post('/items')
  createItem(@Body() body: any) {
    return { created: true, ...body };
  }
}

// Register controllers with your router (Express-like)
const router = /* your router instance */;
registerControllers(router, [ExampleController]);
```

## Notes

- Decorated methods **must** use standard method syntax, not arrow functions or property initializers.
- All parameter decorators (`@Query`, `@Param`, etc.) are optional and can be used in any order.
- `registerControllers(router, controllers)` will register all routes and apply middlewares, hooks, status codes, and headers as defined.

## 🚀 Express Server

A production-ready Express server with enterprise-grade features for building robust web services and APIs.

### Features

- **Security**: CORS, Helmet, rate limiting, timeouts, body size limits
- **Monitoring**: Request logging, Prometheus metrics, health checks
- **Performance**: Response compression, static file serving, conditional settings
- **Reliability**: Graceful shutdown, connection tracking, error handling
- **Developer UX**: OpenAPI docs, debugging tools
- **Extensibility**: Lifecycle hooks, middleware registration, custom routes

### Getting Started

Create a server with the fluent builder pattern:

```ts
import { ServerConfigBuilder, ExpressServer } from "@catbee/utils";

// Configure the server
const config = new ServerConfigBuilder()
  .withPort(3000)
  .withHost('localhost')
  .enableCors()
  .enableHelmet()
  .enableCompression()
  .withGlobalPrefix('/api')
  .withRequestLogging({ 
    enable: true,
    ignorePaths: ['/healthz', '/metrics']
  })
  .enableMetrics()
  .build();

// Create and start the server
const server = new ExpressServer(config, {
  beforeStart: (app) => console.log('Server about to start...'),
  afterStart: (server) => console.log('Server started successfully!')
});

// Register health checks
server.registerHealthCheck('database', async () => {
  return await checkDatabaseConnection();
});

// Register routes
const router = server.createRouter('/users');
router.get('/', (req, res) => {
  res.json({ users: [] });
});

// Start the server
await server.start();

// Enable graceful shutdown handling
server.enableGracefulShutdown();
```

### Server Configuration Builder

Use the fluent builder API to configure all aspects of your server:

```ts
import { ServerConfigBuilder } from "@catbee/utils";

const config = new ServerConfigBuilder()
  // Basic configuration
  .withPort(3000)                     // Set listen port
  .withHost('0.0.0.0')                // Set listen address
  .withGlobalPrefix('/api/v1')        // Set global route prefix

  // Security
  .enableCors()                       // Enable CORS (simple)
  .withCors({                         // Configure CORS (advanced)
    origin: ['https://example.com'],
    methods: ['GET', 'POST']
  })
  .enableHelmet()                     // Enable secure headers
  .enableRateLimit({                  // Configure rate limiting
    max: 100,                        
    windowMs: 15 * 60 * 1000
  })

  // Performance
  .enableCompression()                // Enable response compression
  .withStaticFolder({                 // Serve static files
    path: '/assets',
    directory: './public/assets',
    maxAge: '1d'
  })

  // Monitoring
  .enableMetrics({                    // Enable Prometheus metrics
    path: '/metrics'
  })
  .withHealthCheck({                  // Configure health checks
    path: '/health',
    detailed: true
  })
  .enableResponseTime()               // Track response times
  .enableRequestLogging()             // Log requests

  // Documentation
  .enableOpenApi('./openapi.yaml', {  // Enable OpenAPI docs
    mountPath: '/docs'
  })

  // Microservice configuration
  .withMicroService({                 // Configure as microservice
    appName: 'user-service',
    serviceVersion: {
      enable: true,
      version: '1.0.0'
    }
  })
  
  // Build final configuration
  .build();
```

### Server Lifecycle Hooks

Register hooks for key server lifecycle events:

```ts
const server = new ExpressServer(config, {
  // Before server initialization (middleware setup)
  beforeInit: (server) => {
    console.log('Initializing server...');
  },

  // After server initialization (routes registered)
  afterInit: (server) => {
    console.log('Server initialized');
  },

  // Before server starts listening
  beforeStart: (app) => {
    console.log('Starting server...');
  },

  // After server has started listening
  afterStart: (httpServer) => {
    console.log('Server started');
  },

  // Before server begins shutdown
  beforeStop: (httpServer) => {
    console.log('Shutting down server...');
  },

  // After server has fully stopped
  afterStop: () => {
    console.log('Server stopped');
  },

  // Global request handler
  onRequest: (req, res, next) => {
    console.log('Processing request...');
    next();
  },

  // Global response handler
  onResponse: (req, res, next) => {
    res.setHeader('X-Server-Time', new Date().toISOString());
    next();
  },

  // Global error handler
  onError: (err, req, res, next) => {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
```

### Health Checks

Register health checks for monitoring service dependencies:

```ts
// Simple health check
server.registerHealthCheck('storage', () => {
  return fs.existsSync('./data');
});

// Async health check
server.registerHealthCheck('database', async () => {
  try {
    await db.ping();
    return true;
  } catch (err) {
    return false;
  }
});
```

### Graceful Shutdown

Enable zero-downtime deployments with graceful shutdown:

```ts
// Enable graceful shutdown handling
server.enableGracefulShutdown();

// Manually trigger a graceful shutdown
async function shutdown() {
  console.log('Starting graceful shutdown...');
  await server.stop();
  console.log('Server stopped gracefully');
  process.exit(0);
}
```

## 🏁 Usage

Import only what you need:

```ts
import { chunk, sleep, TTLCache, getLogger } from "@catbee/utils";
```

## 📜 License

MIT © catbee-technologies
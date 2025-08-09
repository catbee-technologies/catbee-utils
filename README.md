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
- [**Response Utilities**](#-response-utilities)
- [**String Utilities**](#-string-utilities)
- [**URL Utilities**](#-url-utilities)
- [**Validate Utilities**](#-validate-utilities)

---

## 📦 Array Utilities

- `chunk<T>(array: T[], size: number): T[][]` – Split array into chunks.
- `unique<T>(array: T[], keyFn?: (item: T) => unknown): T[]` – Remove duplicates.
- `flattenDeep<T>(array: any[]): T[]` – Deep flatten nested arrays.
- `random<T>(array: T[]): T | undefined` – Random element.
- `groupBy<T>(array: T[], keyOrFn: keyof T | ((item: T) => string | number | symbol)): Record<string | number | symbol, T[]>` – Group by key.
- `shuffle<T>(array: T[]): T[]` – Fisher-Yates shuffle.
- `pluck<T, K extends keyof T>(array: T[], key: K): T[K][]` – Pluck values by key.
- `difference<T>(a: T[], b: T[]): T[]` – Elements in `a` not in `b`.
- `intersect<T>(a: T[], b: T[]): T[]` – Intersection.
- `mergeSort<T>(array: T[], key: string | ((item: T) => any), direction?: "asc" | "desc"): T[]` – Merge sort by nested key.
- `zip<T>(...arrays: T[][]): T[][]` – Zip arrays together.
- `partition<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean): [T[], T[]]` – Partition array by predicate.
- `range(start: number, end: number, step?: number): number[]` – Generate a range of numbers.
- `take<T>(array: T[], n?: number): T[]` – Take first `n` elements.
- `takeWhile<T>(array: T[], predicate: (item: T, index: number) => boolean): T[]` – Take elements while predicate is true.
- `compact<T>(array: T[]): NonNullable<T>[]` – Remove falsy values.
- `countBy<T>(array: T[], keyFn: (item: T) => string | number | symbol): Record<string, number>` – Count occurrences by key.
- `sample<T>(array: T[], n?: number): T[]` – Sample `n` elements.

## ⏳ Async Utilities

- `sleep(ms: number): Promise<void>`
- `debounce<T>(fn: T, delay: number): T & { cancel(): void; flush(): void }`
- `throttle<T>(fn: T, limit: number, opts?): (...args: Parameters<T>) => void`
- `retry<T>(fn: () => Promise<T>, retries?: number, delay?: number, backoff?: boolean, onRetry?): Promise<T>`
- `withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>`
- `runInBatches<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]>`
- `singletonAsync<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, drop?: boolean): (...args: TArgs) => Promise<TResult>`
- `settleAll<T>(tasks: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]>`
- `createTaskQueue(limit: number): TaskQueue`
- `runInSeries<T>(tasks: (() => Promise<T>)[]): Promise<T[]>`
- `memoizeAsync<T, Args extends any[]>(fn: (...args: Args) => Promise<T>, options?): (...args: Args) => Promise<T>`
- `abortable<T>(promise: Promise<T>, signal: AbortSignal, abortValue?: any): Promise<T>`
- `createDeferred<T>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void]`
- `waterfall<T>(fns: Array<(input: any) => Promise<any>>): (initialValue: any) => Promise<T>`
- `rateLimit<T>(fn: (...args: any[]) => Promise<T>, maxCalls: number, interval: number): (...args: any[]) => Promise<T>`

## 🗃️ Cache Utilities

- `TTLCache<K, V>(options?: TTLCacheOptions)` – In-memory TTL cache with `.set`, `.get`, `.has`, `.delete`, `.clear`, `.cleanup`, `.entries`, `.keys`, `.values`, `.refresh`, `.stats`, `.destroy`, `.setMany`, `.getMany`, `.getOrCompute`.

**Example:**
```ts
const cache = new TTLCache<string, number>({ ttlMs: 3600_000 });
cache.set("foo", 42);
cache.get("foo"); // 42
cache.has("foo"); // true
cache.cleanup();  // cleans expired
```

## ⚙️ Config

- `Config.Logger.level` – Logging level (e.g., 'info', 'debug')
- `Config.Logger.name` – Logger name
- `Config.Logger.isoTimestamp` – Use ISO timestamps in logs
- `Config.Http.timeout` – HTTP request timeout (ms)
- `Config.Cache.defaultTtl` – Default cache TTL (seconds)

## 🧩 Context Store

- `ContextStore` – Per-request context using AsyncLocalStorage.

  **Static Methods:**
  - `getInstance(): AsyncLocalStorage<Store>`
  - `getAll(): Store | undefined` – Get the current context store.
  - `run(store: Store, callback: () => void): void`
  - `set(key: symbol, value: unknown): void`
  - `get<T>(key: symbol): T | undefined`
  - `has(key: symbol): boolean`
  - `delete(key: symbol): boolean`
  - `patch(values: Partial<Record<symbol, unknown>>): void`
  - `withValue(key: symbol, value: unknown, callback: () => T): T`
  - `extend(newValues: Partial<Record<symbol, unknown>>, callback: () => T): T`
  - `createExpressMiddleware(initialValuesFactory?): Middleware`

- `StoreKeys` – Common context keys.
- `getRequestId(): string | undefined` – Get the current request ID from context.

**Example (Express middleware usage):**
```ts
import { ContextStore, StoreKeys, getLogger } from "@catbee/utils";
import crypto from "crypto";

export function setupRequestContext(req, res, next) {
  const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();
  ContextStore.run({ [StoreKeys.REQUEST_ID]: requestId }, () => {
    const logger = getLogger().child({ reqId: requestId });
    ContextStore.set(StoreKeys.LOGGER, logger);
    logger.info("Request context initialized");
    next();
  });
}
app.use(setupRequestContext);
```

## 🔐 Crypto Utilities

- `hmac(algorithm: string, input: string, secret: string, encoding?: BinaryToTextEncoding): string`
- `hash(algorithm: string, input: string, encoding?: BinaryToTextEncoding): string`
- `sha256Hmac(input: string, secret: string): string`
- `sha1(input: string, encoding?: BinaryToTextEncoding): string`
- `sha256(input: string, encoding?: BinaryToTextEncoding): string`
- `md5(input: string): string`
- `randomString(): string`
- `generateRandomBytes(byteLength?: number): Buffer`
- `generateRandomBytesAsString(byteLength?: number, encoding?: BinaryToTextEncoding): string`
- `generateApiKey(prefix?: string, byteLength?: number): string`
- `safeCompare(a: string | Buffer | Uint8Array, b: string | Buffer | Uint8Array): boolean`
- `encrypt(data: string | Buffer, key: string | Buffer, options?): Promise<EncryptionResult>`
- `decrypt(encryptedData: EncryptionResult, key: string | Buffer, options?): Promise<string | Buffer>`
- `createSignedToken(payload: object, secret: string, expiresInSeconds?: number): string`
- `verifySignedToken(token: string, secret: string): object | null`

## 📂 Directory Utilities

- `ensureDir(dirPath: string): Promise<void>`
- `listFiles(dirPath: string, recursive?: boolean): Promise<string[]>`
- `deleteDirRecursive(dirPath: string): Promise<void>`
- `isDirectory(pathStr: string): Promise<boolean>`
- `copyDir(src: string, dest: string): Promise<void>`
- `moveDir(src: string, dest: string): Promise<void>`
- `emptyDir(dirPath: string): Promise<void>`
- `getDirSize(dirPath: string): Promise<number>`
- `watchDir(dirPath: string, callback): () => void`
- `findFilesByPattern(pattern: string, options?): Promise<string[]>`
- `getSubdirectories(dirPath: string, recursive?: boolean): Promise<string[]>`
- `ensureEmptyDir(dirPath: string): Promise<void>`
- `createTempDir(options?): Promise<{ path: string, cleanup: () => Promise<void> }>`
- `findNewestFile(dirPath: string, recursive?: boolean): Promise<string | null>`
- `findOldestFile(dirPath: string, recursive?: boolean): Promise<string | null>`
- `findInDir(dirPath: string, predicate, recursive?: boolean): Promise<string[]>`
- `watchDirRecursive(dirPath: string, callback, includeSubdirs?: boolean): Promise<() => void>`
- `getDirStats(dirPath: string): Promise<{ fileCount: number, dirCount: number, totalSize: number }>`
- `walkDir(dirPath: string, options): Promise<void>`

## 🌱 Environment Utilities

- `Environment` enum – (`DEVELOPMENT`, `PRODUCTION`, `STAGING`, `TESTING`)
- `Env` class – Environment variable helpers.

  **Static Methods:**
  - `isDev(): boolean`
  - `isProd(): boolean`
  - `isTest(): boolean`
  - `isStaging(): boolean`
  - `set(key: string, value: string): void`
  - `getAll(): object`
  - `get(key: string, defaultValue?: string): string | undefined`
  - `getRequired(key: string): string`
  - `getNumber(key: string, defaultValue: number): number`
  - `getNumberRequired(key: string): number`
  - `getBoolean(key: string, defaultValue?: boolean): boolean`
  - `getBooleanRequired(key: string): boolean`
  - `getJSON<T>(key: string, defaultValue: T): T`
  - `getArray<T = string>(key: string, defaultValue?: T[], splitter?: string): string[] | T[]`
  - `getEnum<T extends string>(key: string, allowedValues: T[], defaultValue?: T): T`
  - `getUrl(key: string, defaultValue?: string, options?): string`
  - `getEmail(key: string, defaultValue?: string): string`
  - `getPath(key: string, defaultValue?: string, options?): string`
  - `getPort(key: string, defaultValue?: number): number`
  - `getDuration(key: string, defaultValue?: string | number): number`
  - `getSafeEnv(sensitiveKeys?: string[]): Record<string, string>`
  - `getWithDefault(key: string, defaultFn: () => string): string`
  - `has(key: string): boolean`
  - `delete(key: string): void`

## 🚨 Exception Utilities

- `HttpError`, `InternalServerErrorException`, `UnauthorizedException`, `BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`, `BadGatewayException`, `TooManyRequestsException`, `ServiceUnavailableException`, `GatewayTimeoutException`, `UnprocessableEntityException`, `MethodNotAllowedException`, `NotAcceptableException`, `RequestTimeoutException`, `UnsupportedMediaTypeException`, `PayloadTooLargeException`, `InsufficientStorageException`
- `isHttpError(error: unknown): error is ErrorResponse`
- `createHttpError(status: number, message?: string): ErrorResponse`
- `hasErrorShape(error: unknown): error is { message: string; status?: number; code?: string }`
- `getErrorMessage(error: unknown): string`
- `withErrorHandling<T extends (...args: any[]) => Promise<any>>(handler: T): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>`

## 📁 File System Utilities

- `fileExists(path: string): Promise<boolean>`
- `readJsonFile<T>(path: string): Promise<T | null>`
- `writeJsonFile(path: string, data: any, space?: number): Promise<void>`
- `deleteFileIfExists(path: string): Promise<boolean>`
- `readTextFile(path: string, encoding?: BufferEncoding): Promise<string | null>`
- `writeTextFile(path: string, content: string, encoding?: BufferEncoding): Promise<boolean>`
- `appendTextFile(path: string, content: string, encoding?: BufferEncoding): Promise<boolean>`
- `copyFile(source: string, destination: string, overwrite?: boolean): Promise<boolean>`
- `moveFile(oldPath: string, newPath: string): Promise<boolean>`
- `getFileStats(path: string): Promise<fs.Stats | null>`
- `createTempFile(options?): Promise<string>`
- `streamFile(source: string, destination: string): Promise<void>`
- `readDirectory(dirPath: string, options?): Promise<string[]>`
- `createDirectory(dirPath: string, recursive?: boolean): Promise<boolean>`
- `safeReadJsonFile<T>(path: string): Promise<{ data: T | null; error: Error | null }>`
- `isFile(path: string): Promise<boolean>`
- `getFileSize(path: string): Promise<number>`
- `readFileBuffer(path: string): Promise<Buffer | null>`

## 📊 HTTP Status Codes

A typed enum with all HTTP status codes and their standard messages.

- `HttpStatusCodes.OK === 200`
- `HttpStatusCodes.NOT_FOUND === 404`
- ...and so on.

**Example:**
```ts
import { HttpStatusCodes } from "@catbee/utils";
res.status(HttpStatusCodes.BAD_REQUEST).send("Invalid payload");
```

## 🆔 ID Utilities

- `uuid(): string`
- `nanoId(size?: number): string`
- `randomHex(byteLength?: number): string`
- `randomInt(min: number, max: number): number`
- `randomBase64(byteLength?: number): number`

## 📄 Logger Utilities

- `getLogger(): Logger`
- `createChildLogger(bindings: Record<string, any>, parentLogger?: Logger): Logger`
- `createRequestLogger(requestId: string, additionalContext?: Record<string, any>): Logger`
- `logError(error: Error | unknown, message?: string, context?: Record<string, any>): void`
- `resetLogger(): void`

## 🧩 Middleware Utilities

- `requestId(options?): Middleware`
- `responseTime(options?): Middleware`
- `timeout(timeoutMs?: number): Middleware`
- `errorHandler(options?): Middleware`
- `cors(options?): Middleware`
- `validateRequest(schema, location?): Middleware`
- `rateLimit(options?): Middleware`
- `securityHeaders(options?): Middleware`
- `basicAuth(validator, realm?): Middleware`

**Example:**
```ts
import { requestId, responseTime, errorHandler } from "@catbee/utils";
app.use(requestId());
app.use(responseTime());
app.use(errorHandler());
```

## 🧩 Object Utilities

- `isObjEmpty(obj: Record<any, any>): boolean`
- `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
- `omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>`
- `deepObjMerge<T>(target: T, source: Partial<T>): T`
- `flattenObject<T>(obj: T, prefix?: string): Record<string, any>`
- `getValueByPath<T>(obj: T, path: string): any`
- `setValueByPath<T>(obj: T, path: string, value: any): T`
- `deepClone<T>(obj: T): T`
- `unflattenObject(obj: Record<string, any>): Record<string, any>`
- `isEqual(a: any, b: any): boolean`
- `filterObject<T>(obj: T, predicate): Partial<T>`
- `mapObject<T, U>(obj: T, mapFn): Record<keyof T, U>`
- `deepFreeze<T>(obj: T): Readonly<T>`
- `isObject(value: unknown): value is Record<string, any>`
- `getAllPaths(obj: Record<string, any>, parentPath?: string): string[]`

## 📝 Response Utilities

- `SuccessResponse<T>` – Standard API success wrapper.
- `ErrorResponse` – Standard API error wrapper.
- `PaginatedResponse<T>` – Paginated API response.
- `NoContentResponse` – 204 No Content response.
- `RedirectResponse` – Redirect response.
- `createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T>`
- `createErrorResponse(message: string, statusCode?: number): ErrorResponse`
- `createPaginatedResponse<T>(allItems: T[], page: number, pageSize: number, message?: string): PaginatedResponse<T>`
- `sendResponse(res, apiResponse): void`
- `isApiResponse(value: any): value is ApiResponse<any>`

## 🧵 String Utilities

- `capitalize(str: string): string`
- `toKebabCase(str: string): string`
- `toCamelCase(str: string): string`
- `slugify(str: string): string`
- `truncate(str: string, len: number): string`
- `toPascalCase(str: string): string`
- `toSnakeCase(str: string): string`
- `format(template: string, values: Record<string, any> | any[]): string`
- `isValidEmail(str: string): boolean`
- `isValidUrl(str: string, requireProtocol?: boolean): boolean`
- `mask(str: string, visibleStart?: number, visibleEnd?: number, maskChar?: string): string`
- `stripHtml(str: string): string`
- `equalsIgnoreCase(a: string, b: string): boolean`
- `reverse(str: string): string`
- `countOccurrences(str: string, substring: string, caseSensitive?: boolean): number`
- `randomString(length?: number, charset?: string): string`
- `pluralize(singular: string, count: number, plural?: string): string`
- `toTitleCase(str: string): string`
- `pad(str: string, length: number, padChar?: string, padEnd?: boolean): string`

## 🌐 URL Utilities

- `appendQueryParams(url: string, params: Record<string, string | number>): string`
- `parseQueryString(query: string): Record<string, string>`
- `isValidUrl(url: string, requireHttps?: boolean): boolean`
- `getDomain(url: string, removeSubdomains?: boolean): string`
- `joinPaths(...segments: string[]): string`
- `normalizeUrl(url: string, base?: string): string`
- `createUrlBuilder(baseUrl: string): { path(path: string, params?: Record<string, any>): string; query(params: Record<string, any>): string }`
- `extractQueryParams(url: string, paramNames: string[]): Record<string, string>`
- `removeQueryParams(url: string, paramsToRemove: string[]): string`
- `getExtension(url: string): string`
- `parseTypedQueryParams<T>(url: string, converters?: Record<keyof T, (val: string) => any>): Partial<T>`

**Example:**
```ts
const url = appendQueryParams('https://example.com', { page: 1, limit: 10 });
// → 'https://example.com/?page=1&limit=10'
```

## ✅ Validate Utilities

A comprehensive suite of string/format validators for safe input and API checks.

- `isEmail(str: string): boolean`
- `isUUID(str: string): boolean`
- `isURL(str: string): boolean`
- `isPhone(str: string): boolean`
- `isAlphanumeric(str: string): boolean`
- `isNumeric(value: string | number): boolean`
- `isHexColor(str: string): boolean`
- `isISODate(str: string): boolean`
- `isLengthBetween(str: string, min: number, max: number): boolean`
- `isNumberBetween(value: number, min: number, max: number): boolean`
- `isAlpha(str: string): boolean`
- `isStrongPassword(str: string): boolean`
- `isIPv4(str: string): boolean`
- `isIPv6(str: string): boolean`
- `isCreditCard(str: string): boolean`
- `isValidJSON(str: string): boolean`
- `isObject(value: unknown): value is Record<string, unknown>`
- `isArray<T = unknown>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[]`
- `isBase64(str: string): boolean`
- `hasRequiredProps(obj: Record<string, unknown>, requiredProps: string[]): boolean`
- `isDateInRange(date: Date, minDate?: Date, maxDate?: Date): boolean`
- `matchesPattern(str: string, pattern: RegExp): boolean`
- `validateAll(value: unknown, validators: Array<(value: unknown) => boolean>): boolean`

---

## 🏁 Usage

Import only what you need:

```ts
import { chunk, sleep, TTLCache, getLogger } from "@catbee/utils";
```

## 📜 License

MIT © catbee-technologies
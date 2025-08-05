# @catbee/utils

## 🧰 Utility Modules for Node.js

A modular, production-grade utility toolkit for Node.js and TypeScript, designed for robust, scalable applications (including Express-based services). All utilities are tree-shakable and can be imported independently.

---

## 📦 Installation

```bash
npm i @catbee/utils
```

## ⚡ Quick Start

```ts
import { chunk, sleep, getLogger } from "@catbee/utils";

// Chunk an array
const result = chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Sleep for 1 second
await sleep(1000);

// Log with context
const logger = getLogger();
logger.info("App started");
```

## 📦 Modules Overview

- **Array Utilities** (`array.utils.ts`)
- **Async Utilities** (`async.utils.ts`)
- **Cache Utilities** (`cache.utils.ts`)
- **Context Store** (`context-store.utils.ts`)
- **Crypto Utilities** (`crypto.utils.ts`)
- **Directory Utilities** (`dir.utils.ts`)
- **Environment Utilities** (`env.utils.ts`)
- **Exception Utilities** (`exception.utils.ts`)
- **File System Utilities** (`fs.utils.ts`)
- **HTTP Status Codes** (`http-status-codes.ts`)
- **Logger** (`logger.utils.ts`)
- **Object Utilities** (`obj.utils.ts`)
- **Response Utilities** (`response.utils.ts`)
- **String Utilities** (`string.utils.ts`)
- **URL Utilities** (`url.utils.ts`)

---

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

---

## ⏳ Async Utilities

- `sleep(ms: number): Promise<void>`
- `debounce<T>(fn, wait): T`
- `throttle<T>(fn, wait): T`
- `retry<T>(fn: () => Promise<T>, retries: number): Promise<T>`
- `withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>`
- `runInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>): Promise<void>`
- `singletonAsync<TArgs, TResult>(fn: (...args: TArgs) => Promise<TResult>): (...args: TArgs) => Promise<TResult>`
- `settleAll<T>(promises: Promise<T>[]): Promise<SettledResult<T>[]>`
- `createTaskQueue(limit: number)`
- `runInSeries<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void>`

---

## 🗃️ Cache Utilities

- `TTLCache<K, V>(ttl: number)` – In-memory TTL cache with `.set`, `.get`, `.has`, `.delete`, `.clear`.

---

## 🔐 Crypto Utilities

- `hmac(input: string, secret: string): string`
- `hash(input: string): string`
- `sha256Hmac(input: string, secret: string): string`
- `sha1(input: string): string`
- `sha256(input: string): string`
- `md5(input: string): string`
- `randomString(): string`

---

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

---

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

---

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
 
---

## 🚨 Exception Utilities

- `HttpError`, `InternalServerErrorException`, `UnauthorizedException`, `BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`, `BadGatewayException`, `TooManyRequestsException`, `ServiceUnavailableException`, `GatewayTimeoutException` – All extend `ErrorResponse`.

---

## 📁 File System Utilities

- `fileExists(path: string): Promise<boolean>`
- `readJsonFile<T>(path: string): Promise<T | null>`
- `writeJsonFile(path: string, data: any): Promise<void>`
- `deleteFileIfExists(path: string): Promise<boolean>`

---

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

## 📝 Response Utilities

- `SuccessResponse<T>` – Standard API success wrapper.
- `ErrorResponse` – Standard API error wrapper.
- Types: `ApiResponse<T>`, `Pagination<T>`, `PaginationResponse<T>`

---

## 🧩 Object Utilities

- `isObjEmpty(obj: Record<any, any>): boolean`
- `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
- `omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>`
- `deepObjMerge<T>(a: T, b: Partial<T>): T`
- `flattenObject<T>(obj: T): Record<string, any>`
- `getValueByPath<T>(obj: T, path: string)`

---

## 🧵 String Utilities

- `capitalize(str: string): string`
- `toKebabCase(str: string): string`
- `toCamelCase(str: string): string`
- `slugify(str: string): string`
- `truncate(str: string, len: number): string`

---

## 🌐 URL Utilities

- `appendQueryParams(url: string, params: object): string`
- `parseQueryString(query: string): Record<string, string>`

---

## 📄 Logger Utility

- `getLogger(): Logger` – Context-aware logger (uses `pino`).

---

## 🏁 Usage

Import only what you need:

```ts
import { chunk, sleep, TTLCache, getLogger } from "@catbee/utils";
```

---

## 📜 License

MIT © catbee-technologies
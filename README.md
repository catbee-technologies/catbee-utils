# @catbee/utils

## 🧰 Utility Modules for Node.js

A modular, production-grade utility toolkit for Node.js and TypeScript, designed for robust, scalable applications. All utilities are tree-shakable and can be imported independently.

![build](https://img.shields.io/badge/build-passing-brightgreen) ![coverage](https://codecov.io/gh/catbee-technologies/catbee-utils/graph/badge.svg?token=XAJHK6R1OQ) ![node](https://img.shields.io/node/v/@catbee/utils) ![npm](https://img.shields.io/npm/v/@catbee/utils) ![downloads](https://img.shields.io/npm/dm/@catbee/utils) ![dependencies](https://img.shields.io/librariesio/release/npm/@catbee%2Futils) ![license](https://img.shields.io/npm/l/@catbee/utils)

---

## 🚀 Key Features

- Modular: Import only what you need
- TypeScript-first: Full typings and type safety
- Production-ready: Robust, well-tested utilities
- Tree-shakable: Zero bloat in your bundle
- Express-friendly: Designed for scalable server apps

---

## 📦 Installation

```bash
npm i @catbee/utils
```

---

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

---

## 📚 Modules Overview

| Module | Description |
| ------ | ----------- |
| [Express Server](https://catbee-utils.npm.hprasath.com/docs/express-server) | Fast, secure, and scalable server setup |
| [Array Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/array) | Advanced array manipulation |
| [Async Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/async) | Promise helpers, concurrency, timing |
| [Cache Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/cache) | In-memory caching with TTL |
| [Context Store](https://catbee-utils.npm.hprasath.com/docs/utils/context-store) | Per-request context via AsyncLocalStorage |
| [Crypto Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/crypto) | Hashing, encryption, tokens |
| [Date Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/date) | Date/time manipulation |
| [Decorators Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/decorators) | TypeScript decorators for Express |
| [Directory Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/directory) | Directory and file system helpers |
| [Environment Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/environment) | Env variable management |
| [Exception Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/exception) | HTTP and error handling |
| [File System Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/file-system) | File operations |
| [HTTP Status Codes](https://catbee-utils.npm.hprasath.com/docs/utils/http-status-codes) | Typed status codes |
| [ID Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/id) | UUID and ID generation |
| [Logger Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/logger) | Structured logging with Pino |
| [Middleware Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/middleware) | Express middleware collection |
| [Object Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/object) | Deep merge, flatten, pick/omit, etc. |
| [Performance Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/performance) | Timing, memoization, memory tracking |
| [Request Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/request) | HTTP request parameter parsing/validation |
| [Response Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/response) | Standardized API response formatting |
| [Stream Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/stream) | Stream conversion, batching, throttling, line splitting |
| [String Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/string) | Casing, masking, slugifying, formatting |
| [Type Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/type) | Type checking, conversion, guards |
| [URL Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/url) | URL parsing, query manipulation, normalization |
| [Validate Utilities](https://catbee-utils.npm.hprasath.com/docs/utils/validation) | Input validation functions |

---

## 🏁 Usage

Import only what you need:

```ts
import { chunk, sleep, TTLCache, getLogger } from "@catbee/utils";
```

---

## 📖 Documentation

- [Full API Docs & Examples](https://catbee-utils.npm.hprasath.com)

---

## 📜 License

MIT © catbee-technologies
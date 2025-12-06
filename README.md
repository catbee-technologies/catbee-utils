# @catbee/utils

<!-- <div style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
  <b style="font-size: 24px; text-decoration: none;">@catbee/utils</b>
  <a href="https://sonarcloud.io/summary/new_code?id=catbee-technologies_catbee-utils">
    <img src="https://sonarcloud.io/images/project_badges/sonarcloud-dark.svg" alt="SonarQube Cloud" width="200"/>
  </a>
</div> -->

## 🧰 Utility Modules for Node.js

A modular, production-grade utility toolkit for Node.js and TypeScript, designed for robust, scalable applications. All utilities are tree-shakable and can be imported independently.

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" />
  <img src="https://codecov.io/gh/catbee-technologies/catbee-utils/graph/badge.svg?token=XAJHK6R1OQ" alt="Coverage" />
  <img src="https://img.shields.io/node/v/@catbee/utils" alt="Node Version" />
  <img src="https://img.shields.io/npm/v/@catbee/utils" alt="NPM Version" />
  <!-- <img src="https://img.shields.io/npm/v/@catbee/utils/rc" alt="NPM RC Version" />
  <img src="https://img.shields.io/npm/v/@catbee/utils/next" alt="NPM Next Version" /> -->
  <img src="https://img.shields.io/npm/dt/@catbee/utils" alt="NPM Downloads" />
  <img src="https://img.shields.io/npm/types/@catbee/utils" alt="TypeScript Types" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://snyk.io/test/github/catbee-technologies/catbee-utils/badge.svg" alt="Snyk Vulnerabilities" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=alert_status&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=ncloc&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Lines of Code" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=security_rating&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=sqale_rating&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Maintainability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=vulnerabilities&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Vulnerabilities" />
  <img src="https://img.shields.io/npm/l/@catbee/utils" alt="License" />
</div>

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
| [Express Server](https://catbee.in/docs/@catbee/utils/express-server) | Fast, secure, and scalable server setup |
| [Array Utilities](https://catbee.in/docs/@catbee/utils/modules/array) | Advanced array manipulation |
| [Async Utilities](https://catbee.in/docs/@catbee/utils/modules/async) | Promise helpers, concurrency, timing |
| [Cache Utilities](https://catbee.in/docs/@catbee/utils/modules/cache) | In-memory caching with TTL |
| [Context Store](https://catbee.in/docs/@catbee/utils/modules/context-store) | Per-request context via AsyncLocalStorage |
| [Crypto Utilities](https://catbee.in/docs/@catbee/utils/modules/crypto) | Hashing, encryption, tokens |
| [Date Utilities](https://catbee.in/docs/@catbee/utils/modules/date) | Date/time manipulation |
| [Decorators Utilities](https://catbee.in/docs/@catbee/utils/modules/decorators) | TypeScript decorators for Express |
| [Directory Utilities](https://catbee.in/docs/@catbee/utils/modules/directory) | Directory and file system helpers |
| [Environment Utilities](https://catbee.in/docs/@catbee/utils/modules/environment) | Env variable management |
| [Exception Utilities](https://catbee.in/docs/@catbee/utils/modules/exception) | HTTP and error handling |
| [File System Utilities](https://catbee.in/docs/@catbee/utils/modules/file-system) | File operations |
| [HTTP Status Codes](https://catbee.in/docs/@catbee/utils/modules/http-status-codes) | Typed status codes |
| [ID Utilities](https://catbee.in/docs/@catbee/utils/modules/id) | UUID and ID generation |
| [Logger Utilities](https://catbee.in/docs/@catbee/utils/modules/logger) | Structured logging with Pino |
| [Middleware Utilities](https://catbee.in/docs/@catbee/utils/modules/middleware) | Express middleware collection |
| [Object Utilities](https://catbee.in/docs/@catbee/utils/modules/object) | Deep merge, flatten, pick/omit, etc. |
| [Performance Utilities](https://catbee.in/docs/@catbee/utils/modules/performance) | Timing, memoization, memory tracking |
| [Request Utilities](https://catbee.in/docs/@catbee/utils/modules/request) | HTTP request parameter parsing/validation |
| [Response Utilities](https://catbee.in/docs/@catbee/utils/modules/response) | Standardized API response formatting |
| [Stream Utilities](https://catbee.in/docs/@catbee/utils/modules/stream) | Stream conversion, batching, throttling, line splitting |
| [String Utilities](https://catbee.in/docs/@catbee/utils/modules/string) | Casing, masking, slugifying, formatting |
| [Type Utilities](https://catbee.in/docs/@catbee/utils/modules/type) | Type checking, conversion, guards |
| [URL Utilities](https://catbee.in/docs/@catbee/utils/modules/url) | URL parsing, query manipulation, normalization |
| [Validate Utilities](https://catbee.in/docs/@catbee/utils/modules/validation) | Input validation functions |

---

## 🏁 Usage

Import only what you need:

```ts
import { chunk, sleep, TTLCache, getLogger } from "@catbee/utils";
```

---

## 📖 Documentation

- [Full API Docs & Examples](https://catbee.in/docs/@catbee/utils/intro)

---

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.in/license/) file for the full text)

---
sidebar_position: 1
slug: /
---

# Introduction

## 🧰 @catbee/utils – The Ultimate Utility Toolkit for Node.js & TypeScript

A modular, production-grade utility library for Node.js and TypeScript, built for robust, scalable applications and enterprise Express services. Every utility is tree-shakable, fully typed, and can be imported independently for optimal bundle size.

![build](https://img.shields.io/badge/build-passing-brightgreen) ![coverage](https://codecov.io/gh/catbee-technologies/catbee-utils/graph/badge.svg?token=XAJHK6R1OQ) ![node](https://img.shields.io/node/v/@catbee/utils) ![npm](https://img.shields.io/npm/v/@catbee/utils) ![downloads](https://img.shields.io/npm/dm/@catbee/utils) ![dependencies](https://img.shields.io/librariesio/release/npm/@catbee%2Futils) ![license](https://img.shields.io/npm/l/@catbee/utils)

---

## 🚀 Features

- **Type-safe**: All utilities are fully typed for maximum safety and IDE support.
- **Tree-shakable**: Import only what you need—no bloat, no dead code.
- **Production-ready**: Designed for high-performance, scalable Node.js apps.
- **Express-friendly**: Includes context, middleware, decorators, and server helpers.
- **Comprehensive**: Covers arrays, objects, strings, streams, requests, responses, performance, caching, validation, and more.
- **Configurable**: Global config system with environment variable support.
- **Minimal dependencies**: Minimal footprint, maximum reliability.

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

## 🏁 Usage Philosophy

Import only what you need to keep your bundle size small and your codebase clean:

```ts
import { chunk, sleep, TTLCache, getLogger } from "@catbee/utils";
```

---

## ⚙️ Configuration

Global configuration management with environment variable support:

- [Config](config) – Centralized runtime configuration

---

## 🏢 Express Server

Enterprise-grade Express server utilities:

- [Express Server](express-server) – Fast, secure, and scalable server setup

---

## 🧩 Utility Modules

Explore the full suite of utilities, each with detailed API docs and examples:

- [Array Utilities](utils/array) – Advanced array manipulation
- [Async Utilities](utils/async) – Promise helpers, concurrency, timing
- [Cache Utilities](utils/cache) – In-memory caching with TTL
- [Context Store](utils/context-store) – Per-request context via AsyncLocalStorage
- [Crypto Utilities](utils/crypto) – Hashing, encryption, tokens
- [Date Utilities](utils/date) – Date/time manipulation
- [Decorators Utilities](utils/decorators) – TypeScript decorators for Express
- [Directory Utilities](utils/directory) – Directory and file system helpers
- [Environment Utilities](utils/environment) – Env variable management
- [Exception Utilities](utils/exception) – HTTP and error handling
- [File System Utilities](utils/file-system) – File operations
- [HTTP Status Codes](utils/http-status-codes) – Typed status codes
- [ID Utilities](utils/id) – UUID and ID generation
- [Logger Utilities](utils/logger) – Structured logging with Pino
- [Middleware Utilities](utils/middleware) – Express middleware collection
- [Object Utilities](utils/object) – Deep merge, flatten, pick/omit, etc.
- [Performance Utilities](utils/performance) – Timing, memoization, memory tracking
- [Request Utilities](utils/request) – HTTP request parameter parsing/validation
- [Response Utilities](utils/response) – Standardized API response formatting
- [Stream Utilities](utils/stream) – Stream conversion, batching, throttling, line splitting
- [String Utilities](utils/string) – Casing, masking, slugifying, formatting
- [Type Utilities](utils/type) – Type checking, conversion, guards
- [URL Utilities](utils/url) – URL parsing, query manipulation, normalization
- [Validate Utilities](utils/validation) – Input validation functions

---

## 📜 License

MIT © catbee-technologies

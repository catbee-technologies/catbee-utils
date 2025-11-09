---
slug: /@catbee/utils/intro
sidebar_position: 1

---

# Introduction

## @catbee/utils – The Ultimate Utility Toolkit for Node.js & TypeScript

A modular, production-grade utility library for Node.js and TypeScript, built for robust, scalable applications and enterprise Express services. Every utility is tree-shakable, fully typed, and can be imported independently for optimal bundle size.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0', }}>
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" />
  <img src="https://codecov.io/gh/catbee-technologies/catbee-modules/graph/badge.svg?token=XAJHK6R1OQ" alt="Coverage" />
  <img src="https://img.shields.io/node/v/@catbee/utils" alt="Node Version" />
  <img src="https://img.shields.io/npm/v/@catbee/utils" alt="NPM Version" />
  <!-- <img src="https://img.shields.io/npm/v/@catbee/modules/rc" alt="NPM RC Version" />
  <img src="https://img.shields.io/npm/v/@catbee/modules/next" alt="NPM Next Version" /> -->
  <img src="https://img.shields.io/npm/dt/@catbee/utils" alt="NPM Downloads" />
  <img src="https://img.shields.io/npm/types/@catbee/utils" alt="TypeScript Types" />
  <!-- <img src="https://img.shields.io/librariesio/release/npm/@catbee%2Futils" alt="Dependencies" /> -->
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://snyk.io/test/github/catbee-technologies/catbee-modules/badge.svg" alt="Snyk Vulnerabilities" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=alert_status&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=ncloc&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Lines of Code" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=security_rating&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=sqale_rating&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Maintainability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_catbee-utils&metric=vulnerabilities&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Vulnerabilities" />
  <img src="https://img.shields.io/npm/l/@catbee/utils" alt="License" />
</div>

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

- [Array Utilities](modules/array) – Advanced array manipulation
- [Async Utilities](modules/async) – Promise helpers, concurrency, timing
- [Cache Utilities](modules/cache) – In-memory caching with TTL
- [Context Store](modules/context-store) – Per-request context via AsyncLocalStorage
- [Crypto Utilities](modules/crypto) – Hashing, encryption, tokens
- [Date Utilities](modules/date) – Date/time manipulation
- [Decorators Utilities](modules/decorators) – TypeScript decorators for Express
- [Directory Utilities](modules/directory) – Directory and file system helpers
- [Environment Utilities](modules/environment) – Env variable management
- [Exception Utilities](modules/exception) – HTTP and error handling
- [File System Utilities](modules/file-system) – File operations
- [HTTP Status Codes](modules/http-status-codes) – Typed status codes
- [ID Utilities](modules/id) – UUID and ID generation
- [Logger Utilities](modules/logger) – Structured logging with Pino
- [Middleware Utilities](modules/middleware) – Express middleware collection
- [Object Utilities](modules/object) – Deep merge, flatten, pick/omit, etc.
- [Performance Utilities](modules/performance) – Timing, memoization, memory tracking
- [Request Utilities](modules/request) – HTTP request parameter parsing/validation
- [Response Utilities](modules/response) – Standardized API response formatting
- [Stream Utilities](modules/stream) – Stream conversion, batching, throttling, line splitting
- [String Utilities](modules/string) – Casing, masking, slugifying, formatting
- [Type Utilities](modules/type) – Type checking, conversion, guards
- [URL Utilities](modules/url) – URL parsing, query manipulation, normalization
- [Validate Utilities](modules/validation) – Input validation functions

---

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](/license/) file for the full text)

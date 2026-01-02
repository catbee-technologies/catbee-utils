# @catbee/utils


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
  <img src="https://img.shields.io/maintenance/yes/2050" alt="Maintenance" />
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
import { ServerConfigBuilder, ExpressServer } from '@catbee/utils/server';
import { Router } from 'express';

const config = new ServerConfigBuilder()
  .withPort(3000)
  .withCors({ origin: '*' })
  .enableRateLimit({ max: 50, windowMs: 60000 })
  .enableRequestLogging({ ignorePaths: ['/healthz', '/metrics'] })
  .withHealthCheck({ path: '/health', detailed: true })
  .enableOpenApi('./openapi.yaml', { mountPath: '/docs' })
  .withGlobalHeaders({ 'X-Powered-By': 'Catbee' })
  .withGlobalPrefix('/api')
  .withRequestId({ headerName: 'X-Request-Id', exposeHeader: true })
  .enableResponseTime({ addHeader: true, logOnComplete: true })
  .build();

const server = new ExpressServer(config, {
  beforeInit: srv => console.log('Initializing server...'),
  afterInit: srv => console.log('Server initialized'),
  beforeStart: app => console.log('Starting server...'),
  afterStart: srv => console.log('Server started!'),
  beforeStop: srv => console.log('Stopping server...'),
  afterStop: () => console.log('Server stopped.'),
  onRequest: (req, res, next) => {
    console.log('Processing request:', req.method, req.url);
    next();
  },
  onResponse: (req, res, next) => {
    res.setHeader('X-Processed-By', 'ExpressServer');
    next();
  },
  onError: (err, req, res, next) => {
    console.error('Custom error handler:', err);
    res.status(500).json({ error: 'Custom error: ' + err.message });
  }
});

// Register routes
const router = server.createRouter('/users');
router.get('/', (req, res) => res.json({ users: [] }));
router.post('/', (req, res) => res.json({ created: true }));

// Or set a base router for all routes
const baseRouter = Router();
baseRouter.use('/users', router);
server.setBaseRouter(baseRouter);

server.registerHealthCheck('database', async () => await checkDatabaseConnection());
server.useMiddleware(loggingMiddleware, errorMiddleware);

await server.start();
server.enableGracefulShutdown();
```

---

## 📚 Modules Overview

| Module                                                                      | Description                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| [Express Server](https://catbee.in/docs/@catbee/utils/server)               | Fast, secure, and scalable server setup                 |
| [Array Utilities](https://catbee.in/docs/@catbee/utils/array)               | Advanced array manipulation                             |
| [Async Utilities](https://catbee.in/docs/@catbee/utils/async)               | Promise helpers, concurrency, timing                    |
| [Cache Utilities](https://catbee.in/docs/@catbee/utils/cache)               | In-memory caching with TTL                              |
| [Context Store](https://catbee.in/docs/@catbee/utils/context-store)         | Per-request context via AsyncLocalStorage               |
| [Crypto Utilities](https://catbee.in/docs/@catbee/utils/crypto)             | Hashing, encryption, tokens                             |
| [Date Utilities](https://catbee.in/docs/@catbee/utils/date)                 | Date/time manipulation                                  |
| [Decorators Utilities](https://catbee.in/docs/@catbee/utils/decorator)      | TypeScript decorators for Express                       |
| [Directory Utilities](https://catbee.in/docs/@catbee/utils/directory)       | Directory and file system helpers                       |
| [Environment Utilities](https://catbee.in/docs/@catbee/utils/environment)   | Env variable management                                 |
| [Exception Utilities](https://catbee.in/docs/@catbee/utils/exception)       | HTTP and error handling                                 |
| [File System Utilities](https://catbee.in/docs/@catbee/utils/fs)            | File operations                                         |
| [HTTP Status Codes](https://catbee.in/docs/@catbee/utils/http-status-codes) | Typed status codes                                      |
| [ID Utilities](https://catbee.in/docs/@catbee/utils/id)                     | UUID and ID generation                                  |
| [Logger Utilities](https://catbee.in/docs/@catbee/utils/logger)             | Structured logging with Pino                            |
| [Middleware Utilities](https://catbee.in/docs/@catbee/utils/middleware)     | Express middleware collection                           |
| [Object Utilities](https://catbee.in/docs/@catbee/utils/object)             | Deep merge, flatten, pick/omit, etc.                    |
| [Performance Utilities](https://catbee.in/docs/@catbee/utils/performance)   | Timing, memoization, memory tracking                    |
| [Request Utilities](https://catbee.in/docs/@catbee/utils/request)           | HTTP request parameter parsing/validation               |
| [Response Utilities](https://catbee.in/docs/@catbee/utils/response)         | Standardized API response formatting                    |
| [Stream Utilities](https://catbee.in/docs/@catbee/utils/stream)             | Stream conversion, batching, throttling, line splitting |
| [String Utilities](https://catbee.in/docs/@catbee/utils/string)             | Casing, masking, slugifying, formatting                 |
| [Type Utilities](https://catbee.in/docs/@catbee/utils/type)                 | Type checking, conversion, guards                       |
| [Types Utilities](https://catbee.in/docs/@catbee/utils/types)               | Common TypeScript types and interfaces                  |
| [URL Utilities](https://catbee.in/docs/@catbee/utils/url)                   | URL parsing, query manipulation, normalization          |
| [Validate Utilities](https://catbee.in/docs/@catbee/utils/validation)       | Input validation functions                              |

---

## 🏁 Usage

This library supports flexible import patterns to suit your needs:

### Root-level imports (everything available)
Import any utility directly from the root package:

```ts
import { chunk, sleep, TTLCache, getLogger, ServerConfigBuilder } from '@catbee/utils';
```

### Module-level imports (scoped imports)
Import only from specific modules for better organization and smaller bundles:

```ts
// Import only server-related exports
import { ServerConfigBuilder, ExpressServer } from '@catbee/utils/server';

// Import only date utilities
import { formatDate, addDays, DateBuilder } from '@catbee/utils/date';

// Import only crypto utilities
import { hashPassword, verifyPassword } from '@catbee/utils/crypto';
```

Both import styles are fully supported and tree-shakable. Use whichever fits your project structure best!

---

## 📖 Documentation

- [Full API Docs & Examples](https://catbee.in/docs/@catbee/utils/intro)

---

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.in/license/) file for the full text)

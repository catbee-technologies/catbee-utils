# HTTP Status Codes

Typed enum for HTTP status codes, providing standardized numeric status codes for HTTP responses. This utility helps maintain consistency in API responses and simplifies error handling with proper typing support.

## API Summary

- `HttpStatusCodes.OK === 200`
- `HttpStatusCodes.BAD_REQUEST === 400`
- `HttpStatusCodes.UNAUTHORIZED === 401`
- `HttpStatusCodes.NOT_FOUND === 404`
- `HttpStatusCodes.INTERNAL_SERVER_ERROR === 500`
- // ...other codes

## Overview

`HttpStatusCodes` is a TypeScript enum that provides strongly-typed HTTP status codes with comprehensive descriptions. Status codes are organized into five categories:

- [**1xx**: Informational responses](#1xx---informational)
- [**2xx**: Successful responses](#2xx---success)
- [**3xx**: Redirection messages](#3xx---redirection)
- [**4xx**: Client error responses](#4xx---client-error)
- [**5xx**: Server error responses](#5xx---server-error)


## Type Definition

```ts
export enum HttpStatusCodes {
  // 1xx Informational
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  // ... and so on
  
  // 5xx Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  // ... and so on
}
```

## Example Usage

```ts
import { HttpStatusCodes } from "@catbee/utils";

// Sending responses with appropriate status codes
res.status(HttpStatusCodes.BAD_REQUEST).send("Invalid payload");
```

---

## Status Code Categories

### `1xx - Informational`
These status codes indicate that the request was received and understood.

```ts
import { HttpStatusCodes } from "@catbee/utils";

// Example: Indicate request was received but processing continues
res.status(HttpStatusCodes.PROCESSING).send();

// Available 1xx codes
// HttpStatusCodes.CONTINUE - 100
// HttpStatusCodes.SWITCHING_PROTOCOLS - 101
// HttpStatusCodes.PROCESSING - 102
// HttpStatusCodes.EARLY_HINTS - 103
```

---

### `2xx - Success`
These status codes indicate that the client's request was successfully received, understood, and accepted.

```ts
import { HttpStatusCodes } from "@catbee/utils";

// Example: Resource created successfully
res.status(HttpStatusCodes.CREATED).json({ id: 123, name: "New Resource" });

// Example: Request accepted but processing not completed
async function processRequest() {
  // Accept the request immediately
  res.status(HttpStatusCodes.ACCEPTED).json({ message: "Processing started" });
  
  // Continue processing asynchronously
  await performLongRunningTask();
}

// Available 2xx codes
// HttpStatusCodes.OK - 200
// HttpStatusCodes.CREATED - 201
// HttpStatusCodes.ACCEPTED - 202
// HttpStatusCodes.NON_AUTHORITATIVE_INFORMATION - 203
// HttpStatusCodes.NO_CONTENT - 204
// HttpStatusCodes.RESET_CONTENT - 205
// HttpStatusCodes.PARTIAL_CONTENT - 206
// ...and more
```

---

### `3xx - Redirection`
These status codes indicate that further action needs to be taken by the client to complete the request.

```ts
import { HttpStatusCodes } from "@catbee/utils";

// Example: Permanent redirect
res.status(HttpStatusCodes.MOVED_PERMANENTLY)
   .header('Location', 'https://newdomain.com/resource')
   .send();

// Example: Temporary redirect
res.status(HttpStatusCodes.TEMPORARY_REDIRECT)
   .header('Location', 'https://example.com/temporary')
   .send();

// Available 3xx codes
// HttpStatusCodes.MULTIPLE_CHOICES - 300
// HttpStatusCodes.MOVED_PERMANENTLY - 301
// HttpStatusCodes.MOVED_TEMPORARILY - 302
// HttpStatusCodes.SEE_OTHER - 303
// HttpStatusCodes.NOT_MODIFIED - 304
// ...and more
```

---

### `4xx - Client Error`
These status codes indicate that the client seems to have made an error.

```ts
import { HttpStatusCodes } from "@catbee/utils";

// Example: Authentication required
function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(HttpStatusCodes.UNAUTHORIZED).json({
      error: "Authentication required"
    });
  }
  next();
}

// Example: Rate limiting
function rateLimit(req, res, next) {
  if (tooManyRequests(req.ip)) {
    return res.status(HttpStatusCodes.TOO_MANY_REQUESTS).json({
      error: "Rate limit exceeded",
      retryAfter: 60
    });
  }
  next();
}

// Available 4xx codes
// HttpStatusCodes.BAD_REQUEST - 400
// HttpStatusCodes.UNAUTHORIZED - 401
// HttpStatusCodes.FORBIDDEN - 403
// HttpStatusCodes.NOT_FOUND - 404
// HttpStatusCodes.METHOD_NOT_ALLOWED - 405
// ...and more
```

---

### `5xx - Server Error`
These status codes indicate that the server failed to fulfill a valid request.

```ts
import { HttpStatusCodes } from "@catbee/utils";

// Example: Handling server errors
try {
  // Some operation that might fail
  await database.connect();
} catch (error) {
  console.error("Database connection failed:", error);
  res.status(HttpStatusCodes.SERVICE_UNAVAILABLE).json({
    error: "Database is currently unavailable, please try again later"
  });
}

// Available 5xx codes
// HttpStatusCodes.INTERNAL_SERVER_ERROR - 500
// HttpStatusCodes.NOT_IMPLEMENTED - 501
// HttpStatusCodes.BAD_GATEWAY - 502
// HttpStatusCodes.SERVICE_UNAVAILABLE - 503
// HttpStatusCodes.GATEWAY_TIMEOUT - 504
// ...and more
```


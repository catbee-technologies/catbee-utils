# Exception Utilities

Standard HTTP and general error handling.

## Overview

This module provides a set of classes and utility functions for consistent error handling in HTTP APIs.  
It includes custom exception classes for common HTTP status codes, type guards, error factories, and error handling wrappers.

## API Summary

- [**`HttpError`**](#httperror) - Generic HTTP error class for custom exceptions with any status code.
- [**`InternalServerErrorException`**](#internalservererrorexception) - Represents a 500 Internal Server Error.
- [**`UnauthorizedException`**](#unauthorizedexception) - Represents a 401 Unauthorized Error.
- [**`BadRequestException`**](#badrequestexception) - Represents a 400 Bad Request Error.
- [**`NotFoundException`**](#notfoundexception) - Represents a 404 Not Found Error.
- [**`ForbiddenException`**](#forbiddenexception) - Represents a 403 Forbidden Error.
- [**`ConflictException`**](#conflictexception) - Represents a 409 Conflict Error.
- [**`BadGatewayException`**](#badgatewayexception) - Represents a 502 Bad Gateway Error.
- [**`TooManyRequestsException`**](#toomanyrequestsexception) - Represents a 429 Too Many Requests Error.
- [**`ServiceUnavailableException`**](#serviceunavailableexception) - Represents a 503 Service Unavailable Error.
- [**`GatewayTimeoutException`**](#gatewaytimeoutexception) - Represents a 504 Gateway Timeout Error.
- [**`UnprocessableEntityException`**](#unprocessableentityexception) - Represents a 422 Unprocessable Entity Error.
- [**`MethodNotAllowedException`**](#methodnotallowedexception) - Represents a 405 Method Not Allowed Error.
- [**`NotAcceptableException`**](#notacceptableexception) - Represents a 406 Not Acceptable Error.
- [**`RequestTimeoutException`**](#requesttimeoutexception) - Represents a 408 Request Timeout Error.
- [**`UnsupportedMediaTypeException`**](#unsupportedmediatypeexception) - Represents a 415 Unsupported Media Type Error.
- [**`PayloadTooLargeException`**](#payloadtoolargeexception) - Represents a 413 Payload Too Large Error.
- [**`InsufficientStorageException`**](#insufficientstorageexception) - Represents a 507 Insufficient Storage Error.
- [**`isHttpError`**](#ishttperror) - Checks if an error is an instance of HttpError or its subclasses.
- [**`createHttpError`**](#createhttperror) - Creates an HTTP error with the specified status code and message.
- [**`hasErrorShape`**](#haserrorshape) - Type guard to check if an object has specific error properties.
- [**`getErrorMessage`**](#geterrormessage) - Safely extracts message from any error type.
- [**`withErrorHandling`**](#witherrorhandling) - Wraps a function and transforms any errors into HTTP errors.

---

## Types & Interfaces

```ts
// Base error response interface
export class ErrorResponse extends Error {
  message: string;
  error: boolean;
  timestamp: string;
  requestId: string;
  status: number;
}

export interface ApiErrorResponse extends ErrorResponse {
  path?: string;
  stack?: string[];
}

```

---

## Function Documentation & Usage Examples

### `HttpError`
Generic HTTP error class for custom exceptions with any status code.

**Method Signature:**
```ts
class HttpError extends ErrorResponse { constructor(status: number, message: string); }
```

**Parameters:**
- `status` (number): HTTP status code (e.g., 404, 500).
- `message` (string): Error message.

**Throws:**
- An instance of `HttpError`.

**Example:**
```ts
import { HttpError } from '@catbee/utils';

throw new HttpError(401, "Unauthorized access");
```

---

### `InternalServerErrorException`
Represents a 500 Internal Server Error.

**Method Signature:**
```ts
class InternalServerErrorException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Internal Server Error".

**Throws:**
- An instance of `InternalServerErrorException`.

**Example:**
```ts
import { InternalServerErrorException } from '@catbee/utils';

throw new InternalServerErrorException();
```

---

### `UnauthorizedException`
Represents a 401 Unauthorized Error.

**Method Signature:**  
```ts
class UnauthorizedException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Unauthorized".

**Throws:**
- An instance of `UnauthorizedException`.

**Example:**
```ts
import { UnauthorizedException } from '@catbee/utils';

throw new UnauthorizedException("Login required");
```

---

### `BadRequestException`
Represents a 400 Bad Request Error.

**Method Signature:**  
```ts
class BadRequestException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Bad Request".

**Throws:**
- An instance of `BadRequestException`.

**Example:**
```ts
import { BadRequestException } from '@catbee/utils';

throw new BadRequestException("Invalid input");
```

---

### `NotFoundException`
Represents a 404 Not Found Error.

**Method Signature:**  
`class NotFoundException extends ErrorResponse { constructor(message?: string) }`

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Not Found".

**Throws:**
- An instance of `NotFoundException`.

**Example:**
```ts
import { NotFoundException } from '@catbee/utils';

throw new NotFoundException("User not found");
```

---

### `ForbiddenException`
Represents a 403 Forbidden Error.

**Method Signature:**  
`class ForbiddenException extends ErrorResponse { constructor(message?: string) }`

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Forbidden".

**Throws:**
- An instance of `ForbiddenException`.

**Example:**
```ts
import { ForbiddenException } from '@catbee/utils';

throw new ForbiddenException();
```

---

### `ConflictException`
Represents a 409 Conflict Error.

**Method Signature:**  
```ts
class ConflictException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Conflict".

**Throws:**
- An instance of `ConflictException`.

**Example:**
```ts
import { ConflictException } from '@catbee/utils';

throw new ConflictException("Resource already exists");
```

---


### `BadGatewayException`
Represents a 502 Bad Gateway Error.

**Method Signature:**  
```ts
class BadGatewayException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Bad Gateway".

**Throws:**
- An instance of `BadGatewayException`.

**Example:**
```ts
import { BadGatewayException } from '@catbee/utils';

throw new BadGatewayException();
```

---

### `TooManyRequestsException`
Represents a 429 Too Many Requests Error.

**Method Signature:**  
```ts
class TooManyRequestsException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Too Many Requests".

**Throws:**
- An instance of `TooManyRequestsException`.

**Example:**
```ts
import { TooManyRequestsException } from '@catbee/utils';

throw new TooManyRequestsException();
```

---

### `ServiceUnavailableException`
Represents a 503 Service Unavailable Error.

**Method Signature:**  
```ts
class ServiceUnavailableException extends ErrorResponse { constructor(message?: string) }
``` 

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Service Unavailable".

**Throws:**
- An instance of `ServiceUnavailableException`.

**Example:**
```ts
import { ServiceUnavailableException } from '@catbee/utils';

throw new ServiceUnavailableException();
```

---

### `GatewayTimeoutException`
Represents a 504 Gateway Timeout Error.

**Method Signature:**  
```ts
class GatewayTimeoutException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Gateway Timeout".

**Throws:**
- An instance of `GatewayTimeoutException`.

**Example:**
```ts
import { GatewayTimeoutException } from '@catbee/utils';

throw new GatewayTimeoutException();
```

---

### `UnprocessableEntityException`
Represents a 422 Unprocessable Entity Error.

**Method Signature:**  
```ts
class UnprocessableEntityException extends ErrorResponse { constructor(message?: string, details?: Record<string, any>) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Unprocessable Entity".
- `details` (object, optional): Additional error details.

**Example:**
```ts
import { UnprocessableEntityException } from '@catbee/utils';

throw new UnprocessableEntityException("Validation failed", { field: "email" });
```

---

### `MethodNotAllowedException`
Represents a 405 Method Not Allowed Error.

**Method Signature:**  
```ts
class MethodNotAllowedException extends ErrorResponse { constructor(message?: string, allowedMethods?: string[]) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Method Not Allowed".
- `allowedMethods` (string[], optional): List of allowed HTTP methods.

**Throws:**
- An instance of `MethodNotAllowedException`.

**Example:**
```ts
import { MethodNotAllowedException } from '@catbee/utils';

throw new MethodNotAllowedException("Use GET", ["GET"]);
```

---

### `NotAcceptableException`
Represents a 406 Not Acceptable Error.

**Method Signature:**  
```ts
class NotAcceptableException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Not Acceptable".

**Throws:**
- An instance of `NotAcceptableException`.

**Example:**
```ts
import { NotAcceptableException } from '@catbee/utils';

throw new NotAcceptableException();
```

---

### `RequestTimeoutException`
Represents a 408 Request Timeout Error.

**Method Signature:**  
```ts
class RequestTimeoutException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Request Timeout".

**Throws:**
- An instance of `RequestTimeoutException`.

**Example:**
```ts
import { RequestTimeoutException } from '@catbee/utils';

throw new RequestTimeoutException();
```

---

### `UnsupportedMediaTypeException`
Represents a 415 Unsupported Media Type Error.

**Method Signature:**
```ts
class UnsupportedMediaTypeException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Unsupported Media Type".

**Throws:**
- An instance of `UnsupportedMediaTypeException`.

**Example:**
```ts
import { UnsupportedMediaTypeException } from '@catbee/utils';

throw new UnsupportedMediaTypeException();
```

---

### `PayloadTooLargeException`
Represents a 413 Payload Too Large Error.

**Method Signature:**  
```ts
class PayloadTooLargeException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Payload Too Large".

**Throws:**
- An instance of `PayloadTooLargeException`.

**Example:**
```ts
import { PayloadTooLargeException } from '@catbee/utils';

throw new PayloadTooLargeException();
```

---

### `InsufficientStorageException`
Represents a 507 Insufficient Storage Error.

**Method Signature:**  
```ts
class InsufficientStorageException extends ErrorResponse { constructor(message?: string) }
```

**Parameters:**
- `message` (string, optional): Custom error message. Defaults to "Insufficient Storage".

**Throws:**
- An instance of `InsufficientStorageException`.

**Example:**
```ts
import { InsufficientStorageException } from '@catbee/utils';

throw new InsufficientStorageException();
```

---

### `isHttpError()`
Checks if an error is an instance of HttpError or its subclasses.

**Method Signature:**  
```ts
function isHttpError(error: unknown): error is ErrorResponse
```

**Parameters:**
- `error` (unknown): The error to check.

**Returns:**
- `boolean`: True if the error is an instance of HttpError or its subclasses.

**Example:**
```ts
import { isHttpError } from '@catbee/utils';

if (isHttpError(err)) { /* handle HTTP error */ }
```

---

### `createHttpError()`
Creates an HTTP error with the specified status code and message.

**Method Signature:**  
```ts
function createHttpError(status: number, message?: string): ErrorResponse
```

**Parameters:**
- `status` (number): HTTP status code.
- `message` (string, optional): Custom error message.

**Returns:**
- An instance of `ErrorResponse` corresponding to the status code.

**Example:**
```ts
import { createHttpError } from '@catbee/utils';

throw createHttpError(404, "Not found");
```

---

### `hasErrorShape()`
Type guard to check if an object has specific error properties.

**Method Signature:**  
```ts
function hasErrorShape(error: unknown): error is { message: string; status?: number; code?: string }
```

**Parameters:**
- `error` (unknown): The object to check.

**Returns:**
- `boolean`: True if the object has the error shape.

**Example:**
```ts
import { hasErrorShape } from '@catbee/utils';

if (hasErrorShape(err)) { console.log(err.message); }
```

---

### `getErrorMessage()`
Safely extracts message from any error type.

**Method Signature:**  
```ts
function getErrorMessage(error: unknown): string
```

**Parameters:**
- `error` (unknown): The error from which to extract the message.

**Returns:**
- `string`: The extracted error message or a default message.

**Example:**
```ts
import { getErrorMessage } from '@catbee/utils';

const msg = getErrorMessage(err);
```

---

### `withErrorHandling()`
Wraps a function and transforms any errors into HTTP errors.

**Method Signature:**  
```ts
function withErrorHandling<T extends (...args: any[]) => Promise<any>>(handler: T): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>
```

**Parameters:**
- `handler` (function): The async function to wrap.

**Returns:**
- A new function that wraps the original and handles errors.

**Example:**
```ts
import { withErrorHandling } from '@catbee/utils';

const safeHandler = withErrorHandling(async (req) => {
  // ...handler code...
});
```

# Response Utilities

Helpers for standardized API responses. Includes classes and functions for success, error, paginated, no-content, and redirect responses, plus utilities for creating and sending responses. All methods are fully typed.

## API Summary

### Classes
- [**`SuccessResponse<T>`**](#successresponset) - Standard HTTP response wrapper for successful responses.
- [**`ErrorResponse`**](#errorresponse) - Wrapper for error responses, extends native Error.
- [**`PaginatedResponse<T>`**](#paginatedresponset) - Response with paginated data, extends SuccessResponse.
- [**`NoContentResponse`**](#nocontentresponse) - Specialized response for operations that don't return data (HTTP 204).
- [**`RedirectResponse`**](#redirectresponse) - Specialized response for redirects.

### Functions
- [**`createSuccessResponse(data: T, message?: string): SuccessResponse<T>`**](#createsuccessresponse) - Creates a standard success response.
- [**`createErrorResponse(message: string, statusCode?: number): ErrorResponse`**](#createerrorresponse) - Creates a standard error response.
- [**`createFinalErrorResponse(req: Request, status: number, message: string, error?: any, options?: { includeDetails?: boolean }): ErrorResponse`**](#createfinalerrorresponse) - Creates a final error response.
- [**`createPaginatedResponse<T>(allItems: T[], page: number, pageSize: number, message?: string): PaginatedResponse<T>`**](#createpaginatedresponse) - Creates a paginated response from array data.
- [**`sendResponse(res: Response, apiResponse: ApiResponse<any>): void`**](#sendresponse) - Adapter to convert API responses to Express.js response format.
- [**`isApiResponse(value: any): value is ApiResponse<any>`**](#isapiresponse) - Checks if a value is an API response.

---

## Interfaces & Types

```ts
export interface ApiResponse<T> {
  message: string;
  error: boolean;
  data: T | null;
  timestamp: string;
  requestId: string;
}

export interface ApiErrorResponse {
  error: true;
  message: string;
  timestamp: string;
  requestId: string;
  status: number;
  path?: string;
  stack?: string[];
}
```

---

## Function Documentation & Usage Examples

### `SuccessResponse<T>`
Standard HTTP response wrapper for successful responses.

**Method Signature:**
```ts
class SuccessResponse<T> implements ApiResponse<T> {
  message: string;
  error: false;
  data: T;
  timestamp: string;
  requestId: string;
  constructor(message: string, data: T);
}
```

**Parameters:**
- `message`: A message describing the response.
- `data`: The response data of type T.

**Examples:**
```ts
import { SuccessResponse } from '@catbee/utils';

const resp = new SuccessResponse<{ id: number }>('OK', { id: 1 });
/*
  {
    message: 'OK',
    error: false,
    data: { id: 1 },
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678'
  }
*/
app.get('/item', (req, res) => {
  const item = { id: 1 }; // fetched item
  const resp = new SuccessResponse('Item fetched', item);
  res.status(200).json(resp);
});
```

---

### `ErrorResponse`
Wrapper for error responses, extends native Error.

**Method Signature:**
```ts
class ErrorResponse extends Error implements ApiErrorResponse {
  error: true;
  message: string;
  timestamp: string;
  requestId: string;
  status: number;
  path?: string;
  stack?: string[];
  constructor(message: string, statusCode: number);
}
```

**Parameters:**
- `message`: A message describing the error.
- `statusCode`: The HTTP status code for the error.

**Examples:**
```ts
import { ErrorResponse } from '@catbee/utils';

const errResp = new ErrorResponse('Not found', 404);
/*
  {
    error: true,
    message: 'Not found',
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678',
    status: 404
  }
*/
app.get('/item', (req, res) => {
  // ... item fetching logic ...
  if (!item) {
    const errResp = new ErrorResponse('Item not found', 404);
    res.status(errResp.status).json(errResp);
    return;
  }
  res.status(200).json(new SuccessResponse('Item fetched', item));
});
```

---

### `PaginatedResponse<T>`
Response with paginated data, extends SuccessResponse.

**Method Signature:**
```ts
class PaginatedResponse<T> extends SuccessResponse<T[]> {
  constructor(items: T[], pagination: { total: number; page: number; pageSize: number }, message: string) {
    super(message, items);
    this.pagination = {
      total: pagination.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(pagination.total / pagination.pageSize)
    };
  }
}
``` 

**Parameters:**
- `data`: An array of items of type T.
- `pagination`: An object containing pagination details:
  - `total`: Total number of items.
  - `page`: Current page number.
  - `pageSize`: Number of items per page.
- `message`: A message describing the response (default is 'Success').

**Examples:**
```ts
import { PaginatedResponse } from '@catbee/utils';

const paged = new PaginatedResponse([1,2,3], { total: 100, page: 1, pageSize: 3 });
/*
  {
    message: 'OK',
    error: false,
    data: [1, 2, 3],
    pagination: {
      total: 100,
      page: 1,
      pageSize: 3,
      totalPages: 34
    },
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678'
  }
*/
app.get('/items', (req, res) => {
  const items = [/* fetch items based on req.query.page and req.query.pageSize */];
  const totalItems = 100; // total count from database
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const pagedResponse = new PaginatedResponse(items, { total: totalItems, page, pageSize }, 'Items fetched');
  res.status(HttpStatusCodes.OK).json(pagedResponse);
});
```

---

### `NoContentResponse`
Specialized response for operations that don't return data (HTTP 204). Works only with `sendResponse()` method.

**Method Signature:**

```ts
class NoContentResponse extends SuccessResponse<void> {
  constructor(message: string);
}
```

**Parameters:**
- `message`: A message describing the response.

**Examples:**
```ts
import { NoContentResponse, sendResponse } from '@catbee/utils';

const resp = new NoContentResponse('No content');
/*
  {
    message: 'No content',
    error: false,
    data: null,
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678'
  }
*/
app.get('/delete-item', (req, res) => {
  // ... delete item logic ...
  const resp = new NoContentResponse('Item deleted');
  sendResponse(res, resp); // Sends HTTP 204 No Content
});

```

---

### `RedirectResponse`
Specialized response for redirects.

**Method Signature:**
```ts
class RedirectResponse extends SuccessResponse<void> {
  constructor(url: string, statusCode: number);
}
```

**Parameters:**
- `url`: The URL to redirect to.
- `statusCode`: The HTTP status code for the redirect (default is 302).

**Examples:**
```ts
import { RedirectResponse, sendResponse } from '@catbee/utils';

const redirect = new RedirectResponse('https://example.com', 302);
/*
  {
    message: 'Redirecting to https://example.com',
    error: false,
    data: null,
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678',
    url: 'https://example.com',
    statusCode: 302
  }
*/
app.get('/old-route', (req, res) => {
  const redirect = new RedirectResponse('https://example.com/new-route', 301);
  sendResponse(res, redirect); // Sends HTTP 301 Moved Permanently
});
```

---

### `createSuccessResponse()`
Creates a standard success response.

**Method Signature:**
```ts
function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T>;
```

**Parameters:**
- `data`: The response data of type T.
- `message`: A message describing the response (default is 'Success').

**Returns:**
- A SuccessResponse object.

**Example:**
```ts
import { createSuccessResponse } from '@catbee/utils';

const resp = createSuccessResponse({ id: 1 }, "OK");
/*
  {
    message: 'OK',
    error: false,
    data: { id: 1 },
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678'
  }
*/
app.get('/item', (req, res) => {
  const item = { id: 1 }; // fetched item
  const resp = createSuccessResponse(item, 'Item fetched');
  res.status(200).json(resp);
});

```

---

### `createErrorResponse()`
Creates a standard error response.

**Method Signature:**
```ts
function createErrorResponse(message: string, statusCode?: number): ErrorResponse;
```

**Parameters:**
- `message`: A message describing the error.
- `statusCode`: The HTTP status code for the error (default is 500).

**Returns:**
- An ErrorResponse object.

**Example:**
```ts
import { createErrorResponse } from '@catbee/utils';

const errResp = createErrorResponse("Not found", 404);
/*
  {
    error: true,
    message: 'Not found',
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678',
    status: 404
  }
*/
app.get('/item', (req, res) => {
  // ... item fetching logic ...
  if (!item) {
    const errResp = createErrorResponse('Item not found', 404);
    res.status(errResp.status).json(errResp);
    return;
  }
  res.status(200).json(createSuccessResponse(item, 'Item fetched'));
});
```

---

### `createFinalErrorResponse()`
Creates a final error response.

**Method Signature:**
```ts
function createFinalErrorResponse(
  req: Request,
  status: number,
  message: string,
  error?: any,
  options?: { includeDetails?: boolean }
): ErrorResponse;
```

**Parameters:**
- `req`: The Express request object.
- `status`: The HTTP status code for the error.
- `message`: A message describing the error.
- `error`: Optional original error object for additional details.
- `options`: Optional settings.
  - `includeDetails`: Whether to include error details in the response (default is false).

**Returns:** 
- An ErrorResponse object.

```ts
import { Env, createFinalErrorResponse } from '@catbee/utils';

const errResp = createFinalErrorResponse(new Error("Something went wrong"));
/*
  {
    error: true,
    message: 'Something went wrong',
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678',
    status: 500,
    path: '/current/request/path',
    stack: [ 'Error: Something went wrong', ' at ...' ] // if includeDetails is true
  }
*/
app.get('/item', (req, res) => {
  try {
    // ... item fetching logic ...
    if (!item) {
      throw new Error('Item not found');
    }
    res.status(200).json(createSuccessResponse(item, 'Item fetched'));
  } catch (err) {
    const errResp = createFinalErrorResponse(req, 500, err.message, err, { includeDetails: Env.isDev() });
    res.status(errResp.status).json(errResp);
  }
});
```


### `createPaginatedResponse()`
Creates a paginated response from array data.

**Method Signature:**
```ts
function createPaginatedResponse<T>(
  allItems: T[],
  page: number,
  pageSize: number,
  message?: string
): PaginatedResponse<T>;
```

**Parameters:**
- `allItems`: The full array of items to paginate.
- `page`: The current page number (1-based).
- `pageSize`: The number of items per page.
- `message`: A message describing the response (default is 'Success').

**Returns:**
- A PaginatedResponse object.

**Example:**
```ts
import { createPaginatedResponse } from '@catbee/utils';

const resp = createPaginatedResponse([1,2,3,4,5], 1, 2);
/*
  {
    message: 'Success',
    error: false,
    data: [1, 2],
    pagination: {
      total: 5,
      page: 1,
      pageSize: 2,
      totalPages: 3
    },
    timestamp: '2023-10-05T12:00:00Z',
    requestId: 'a2ef4c8d-1234-5678-90ab-cdef12345678'
  }
*/
app.get('/items', (req, res) => {
  const allItems = [1,2,3,4,5]; // fetched all items
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 2;

  const pagedResponse = createPaginatedResponse(allItems, page, pageSize, 'Items fetched');
  res.status(200).json(pagedResponse);
});
```

---

### `sendResponse()`
Adapter to convert API responses to Express.js response format.

**Method Signature:**
```ts
function sendResponse(res: Response, apiResponse: ApiResponse): void;
```

**Parameters:**
- `res`: The Express response object.
- `apiResponse`: The API response object (SuccessResponse, ErrorResponse, PaginatedResponse, NoContentResponse, or RedirectResponse).

**Example:**
```ts
import { sendResponse } from '@catbee/utils';

app.get('/item', (req, res) => {
  const item = getItemFromDatabase(req.params.id);
  if (!item) {
    return sendResponse(res, createErrorResponse('Item not found', 404));
  }
  sendResponse(res, createSuccessResponse(item, 'Item fetched'));
});
```

---

### `isApiResponse()`
Checks if a value is an API response.

**Method Signature:**
```ts
function isApiResponse(value: any): value is ApiResponse<any>;
```

**Parameters:**
- `value`: The value to check.

**Returns:**
- `true` if the value is an API response, otherwise `false`.

```ts
import { isApiResponse } from '@catbee/utils';

if (isApiResponse(resp)) { /* ... */ }
```


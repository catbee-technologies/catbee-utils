# URL Utilities

Helpers for parsing and manipulating URLs. Includes functions for appending and extracting query parameters, validating URLs, joining and normalizing paths, building URLs, and parsing typed query params. All methods are fully typed.

## API Summary

- [**`appendQueryParams(url: string, params: Record<string, string | number>): string`**](#appendqueryparams) - appends query parameters to a URL.
- [**`parseQueryString(query: string): Record<string, string>`**](#parsequerystring) - parses a query string into a key-value object.
- [**`isValidUrl(url: string, requireHttps?: boolean): boolean`**](#isvalidurl) - checks if a string is a valid URL, optionally requiring HTTPS.
- [**`getDomain(url: string, removeSubdomains?: boolean): string`**](#getdomain) - extracts the domain name from a URL, optionally removing subdomains.
- [**`joinPaths(...segments: string[]): string`**](#joinpaths) - joins URL path segments, handling slashes.
- [**`normalizeUrl(url: string, base?: string): string`**](#normalizeurl) - normalizes a URL by resolving relative paths and protocol.
- [**`createUrlBuilder(baseUrl: string): (path: string, query?: Record<string, string | number>) => string`**](#createurlbuilder) - creates a URL builder for constructing URLs with a base URL.
- [**`extractQueryParams(url: string, paramNames: string[]): Record<string, string>`**](#extractqueryparams) - extracts specific query parameters from a URL.
- [**`removeQueryParams(url: string, paramsToRemove: string[]): string`**](#removequeryparams) - removes specified query parameters from a URL.
- [**`getExtension(url: string): string`**](#getextension) - gets the file extension from a URL path.
- [**`parseTypedQueryParams<T>(url: string, converters?: Record<string, (value: string) => T>): Record<string, T>`**](#parsetypedqueryparams) - parses URL query parameters into a strongly-typed object.

---

## Function Documentation & Usage Examples

### `appendQueryParams()`
Appends query parameters to a given URL.

**Method Signature:**
```ts
function appendQueryParams(url: string, params: Record<string, string | number>): string;
```

**Parameters:**
- `url`: The base URL to which query parameters will be appended.
- `params`: An object representing the query parameters to append.

**Returns:**
- The URL with appended query parameters.

**Example:**
```ts
import { appendQueryParams } from '@catbee/utils';

appendQueryParams('https://example.com', { page: 1, limit: 10 });
// → 'https://example.com/?page=1&limit=10'
```

---

### `parseQueryString()`
Parses a query string into a key-value object.

**Method Signature:**
```ts
function parseQueryString(query: string): Record<string, string>;
```

**Parameters:**
- `query`: The query string to parse.

**Returns:**
- A key-value object representing the parsed query parameters.

**Example:**
```ts
import { parseQueryString } from '@catbee/utils';

parseQueryString('?page=1&limit=10');
// → { page: '1', limit: '10' }
```

---

### `isValidUrl()`
Validates if a string is a valid URL, optionally requiring HTTPS.

**Method Signature:**
```ts
function isValidUrl(url: string, requireHttps?: boolean): boolean;
```

**Parameters:**
- `url`: The URL string to validate.
- `requireHttps`: Whether to require HTTPS (default: false).

**Returns:**
- `true` if the URL is valid, `false` otherwise.

**Example:**
```ts
import { isValidUrl } from '@catbee/utils';

isValidUrl('https://example.com'); // true
isValidUrl('ftp://example.com'); // false (if requireHttps is true)
```

---

### `getDomain()`
Extracts the domain name from a URL, optionally removing subdomains.

**Method Signature:**
```ts
function getDomain(url: string, removeSubdomains?: boolean): string;
```

**Parameters:**
- `url`: The URL to extract the domain from.
- `removeSubdomains`: Whether to remove subdomains (default is false).

**Returns:**
- The domain name.

**Example:**
```ts
import { getDomain } from '@catbee/utils';

getDomain('https://api.example.com/path'); // 'api.example.com'
getDomain('https://api.example.com/path', true); // 'example.com'
```

---

### `joinPaths()`
Joins URL path segments, handling slashes.

**Method Signature:**
```ts
function joinPaths(...segments: string[]): string;
```

**Parameters:**
- `...segments`: The URL path segments to join.

**Returns:**
- The joined URL path.

**Example:**
```ts
import { joinPaths } from '@catbee/utils';

joinPaths('https://example.com/', '/api/', '/users');
// → 'https://example.com/api/users'
```

---

### `normalizeUrl()`
Normalizes a URL by resolving relative paths and protocol.

**Method Signature:**
```ts
function normalizeUrl(url: string, base?: string): string;
```

**Parameters:**
- `url`: The URL to normalize.
- `base`: An optional base URL to resolve relative URLs against.

**Returns:**
- The normalized URL.

**Example:**
```ts
import { normalizeUrl } from '@catbee/utils';

normalizeUrl('HTTP://Example.COM/foo/../bar');
// → 'http://example.com/bar'
```

---

### `createUrlBuilder()`
Creates a URL builder for constructing URLs with a base URL.

**Method Signature:**
```ts
function createUrlBuilder(baseUrl: string): (path: string, query?: Record<string, string | number>) => string;
```

**Parameters:**
- `baseUrl`: The base URL for the builder.

**Returns:**
- A function that takes a path and optional query parameters, returning the full URL.
  - `path`: The URL path to append to the base URL.
  - `query`: An optional object of query parameters to append.

**Example:**
```ts
import { createUrlBuilder } from '@catbee/utils';

const api = createUrlBuilder('https://api.example.com');
api.path('/users', { active: true });
// → 'https://api.example.com/users?active=true'
```

---

### `extractQueryParams()`
Extracts specific query parameters from a URL.

**Method Signature:**

```ts
function extractQueryParams(url: string, paramNames: string[]): Record<string, string>;
```

**Parameters:**
- `url`: The URL to extract query parameters from.
- `paramNames`: An array of parameter names to extract.

**Returns:**
- An object containing the extracted query parameters.

**Example:**
```ts
import { extractQueryParams } from '@catbee/utils';

extractQueryParams('https://example.com?page=1&limit=10', ['page']);
// → { page: '1' }
```

---

### `removeQueryParams()`
Removes specified query parameters from a URL.

**Method Signature:**
```ts
function removeQueryParams(url: string, paramsToRemove: string[]): string;
```

**Parameters:**
- `url`: The URL to remove query parameters from.
- `paramsToRemove`: An array of parameter names to remove.

**Returns:**
- The modified URL without the specified query parameters.

**Example:**
```ts
removeQueryParams('https://example.com?page=1&limit=10', ['limit']);
// → 'https://example.com/?page=1'
```

---

### `getExtension()`
Gets the file extension from a URL path.

**Method Signature:**
```ts
function getExtension(url: string): string;
```

**Parameters:**
- `url`: The URL to extract the file extension from.

**Returns:**
- The file extension (without the dot), or an empty string if none exists.

**Example:**
```ts
import { getExtension } from '@catbee/utils';

getExtension('https://example.com/document.pdf?v=1');
// → 'pdf'
```

---

### `parseTypedQueryParams()`
Parses URL query parameters into a strongly-typed object.

**Method Signature:**
```ts
function parseTypedQueryParams<T>(url: string, converters?: Record<keyof T, (val: string) => any>): Partial<T>;
```

**Parameters:**
- `url`: The URL to parse.
- `converters`: An optional object mapping parameter names to conversion functions.

**Returns:**
- A partially-typed object containing the parsed query parameters.

**Example:**
```ts
import { parseTypedQueryParams } from '@catbee/utils';

parseTypedQueryParams<{page: number, q: string}>('https://example.com?page=2&q=test', {
  page: Number,
  q: String
});
// → { page: 2, q: 'test' }
```


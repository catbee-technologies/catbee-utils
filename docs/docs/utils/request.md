# Request Utilities

Helpers for parsing and validating HTTP request parameters. Includes utilities for parsing numbers and booleans, extracting pagination, sorting, and filter parameters from query objects. All methods are fully typed.

## API Summary

- [**`parseNumberParam(value: string | undefined, options?: ValidationOptions)`**](#parsenumberparam) - Safely parses a string parameter to a number.
- [**`parseBooleanParam(value: string | undefined, options?: ValidationOptions)`**](#parsebooleanparam) - Safely parses a string parameter to a boolean.
- [**`extractPaginationParams(query: Record<string, string | string[]>, defaultPage?: number, defaultLimit?: number, maxLimitSize?: number)`**](#extractpaginationparams) - Extracts pagination parameters from query.
- [**`extractSortParams(query: Record<string, string | string[]>, allowedFields: string[], defaultSort?: { sortBy: string; sortOrder: 'asc' | 'desc' })`**](#extractsortparams) - Extracts sorting parameters from query.
- [**`extractFilterParams(query: Record<string, string | string[]>, allowedFilters: string[])`**](#extractfilterparams) - Extracts filter parameters from query.

---

## Interfaces & Types

```ts
export interface ValidationOptions {
  throwOnError?: boolean;
  errorMessage?: string;
  defaultValue?: any;
  required?: boolean;
}

export interface ValidationResult<T> {
  isValid: boolean;
  value: T | null;
  error?: string;
}
```

---

## Function Documentation & Usage Examples

### `parseNumberParam()`
Safely parses a string parameter to a number, with validation and error handling.

**Method Signature:**
```ts
function parseNumberParam(value: string | undefined, options?: ValidationOptions): ValidationResult<number>;
```

**Parameters:**
- `value`: The string value to parse.
- `options`: Optional validation options:
  - `throwOnError`: If true, throws an error on invalid input.
  - `errorMessage`: Custom error message for invalid input.
  - `defaultValue`: Default value to return if input is invalid or undefined.
  - `required`: If true, input must be provided.

**Returns:**
- An object containing:
  - `isValid`: Boolean indicating if the parsing was successful.
  - `value`: The parsed number or null if invalid.
  - `error`: Optional error message if parsing failed.  

**Examples:**
```ts
import { parseNumberParam } from '@catbee/utils';

const result = parseNumberParam(req.query.id, { required: true });
if (result.isValid) {
  // Use result.value as a number
}
```

---

### `parseBooleanParam()`
Safely parses a string parameter to a boolean, supporting various formats.

**Method Signature:**
```ts
function parseBooleanParam(value: string | undefined, options?: ValidationOptions): ValidationResult<boolean>;
```

**Parameters:**
- `value`: The string value to parse.
- `options`: Optional validation options:
  - `throwOnError`: If true, throws an error on invalid input.
  - `errorMessage`: Custom error message for invalid input.
  - `defaultValue`: Default value to return if input is invalid or undefined.
  - `required`: If true, input must be provided.

**Returns:**
- An object containing:
  - `isValid`: Boolean indicating if the parsing was successful.
  - `value`: The parsed boolean or null if invalid.
  - `error`: Optional error message if parsing failed.

**Examples:**
```ts
import { parseBooleanParam } from '@catbee/utils';

const result = parseBooleanParam(req.query.active, { defaultValue: false });
if (result.isValid) {
  // Use result.value as a boolean
}
```

---

### `extractPaginationParams()`
Extracts validated pagination parameters (`page`, `limit`) from query object.

**Method Signature:**
```ts
function extractPaginationParams(
  query: Record<string, string | string[]>,
  defaultPage: number = 1,
  defaultLimit: number = 10,
  maxLimitSize: number = 100
): { page: number; limit: number }
```

**Parameters:**
- `query`: The query object from which to extract parameters.
- `defaultPage`: Default page number if not provided (default is 1).
- `defaultLimit`: Default limit if not provided (default is 10).
- `maxLimitSize`: Maximum allowed limit size (default is 100). 

**Returns:**
- An object containing:
  - `page`: The validated page number.
  - `limit`: The validated limit number.

**Example:**
```ts
import { extractPaginationParams } from '@catbee/utils';

const { page, limit } = extractPaginationParams(req.query, 1, 20, 100);
```

---

### `extractSortParams()`
Extracts sorting parameters (`sortBy`, `sortOrder`) from query object, validating against allowed fields.

**Method Signature:**
```ts
function extractSortParams(
  query: Record<string, string | string[]>,
  allowedFields: string[],
  defaultSort?: { sortBy: string; sortOrder: 'asc' | 'desc' }
): { sortBy: string; sortOrder: 'asc' | 'desc' }
```

**Parameters:**
- `query`: The query object from which to extract parameters.
- `allowedFields`: Array of allowed fields for sorting.
- `defaultSort`: Optional default sorting if parameters are not provided.

**Returns:**
- An object containing:
  - `sortBy`: The field to sort by.
  - `sortOrder`: The order of sorting, either 'asc' or 'desc'.

**Example:**
```ts
import { extractSortParams } from '@catbee/utils';

const { sortBy, sortOrder } = extractSortParams(req.query, ['name', 'createdAt'], { sortBy: 'name', sortOrder: 'asc' });
```

---

### `extractFilterParams()`
Extracts filter parameters from query object based on allowed filter fields.

**Method Signature:**
```ts
function extractFilterParams(
  query: Record<string, string | string[]>,
  allowedFilters: string[]
): Record<string, string | string[]>
```

**Parameters:**
- `query`: The query object from which to extract parameters.
- `allowedFilters`: Array of allowed fields for filtering.

**Returns:**
- An object containing only the allowed filter parameters.

**Example:**
```ts
import { extractFilterParams } from '@catbee/utils';

const filters = extractFilterParams(req.query, ['status', 'type']);
```

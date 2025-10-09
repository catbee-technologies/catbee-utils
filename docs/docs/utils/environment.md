# Environment Utilities

Type-safe environment variable management for Node.js applications.

Provides a single `Env` class with static methods for reading, validating, and transforming environment variables, plus helpers for masking sensitive values and loading `.env` files.

## Main Features

- **Type-safe getters**: Retrieve environment variables as strings, numbers, booleans, arrays, enums, dates, durations, URLs, emails, and paths.
- **Validation**: Built-in validation for types, ranges, allowed values, formats, and existence.
- **Caching**: Internal cache for parsed values to improve performance.
- **Sensitive masking**: Mask sensitive values for safe logging.
- **.env loader**: Load variables from `.env` files without overwriting existing ones.
- **Helpers**: Check, set, delete, and clear environment variables at runtime.

---

## API Summary

- [**`Environment`**](#environment-enum) enum - Represents valid application environments.
- [**`Env`**](#env-class) class - with static methods:
  - [**`isDev(): boolean`**](#isdev) - Checks if `NODE_ENV` is `'development'`.
  - [**`isProd(): boolean`**](#isprod) - Checks if `NODE_ENV` is `'production'`.
  - [**`isTest(): boolean`**](#istest) - Checks if `NODE_ENV` is `'testing'`.
  - [**`isStaging(): boolean`**](#isstaging) - Checks if `NODE_ENV` is `'staging'`.
  - [**`set(key: string, value: string): void`**](#set) - Sets an environment variable (in-memory only).
  - [**`getAll(): object`**](#getall) - Returns all environment variables as an object.
  - [**`get(key: string, defaultValue: string): string`**](#get) - Gets a string environment variable, with variable expansion and fallback.
  - [**`getRequired(key: string): string`**](#getrequired) - Gets a required string environment variable, throws if missing.
  - [**`getOrFail(key: string): string`**](#getorfail) - Alias for `getRequired`.
  - [**`getNumber(key: string, defaultValue: number, options?: { min?: number; max?: number }): number`**](#getnumber) - Gets a number environment variable, throws if not a valid number.
  - [**`getNumberRequired(key: string): number`**](#getnumberrequired) - Gets a required number environment variable, throws if missing or invalid.
  - [**`getInteger(key: string, defaultValue: number, options?: { min?: number; max?: number }): number`**](#getinteger) - Gets an integer environment variable, with optional min/max validation.
  - [**`getBoolean(key: string, defaultValue?: boolean): boolean`**](#getboolean) - Gets a boolean environment variable. Accepts `true`, `1`, `yes`, `on` as true; `false`, `0`, `no`, `off` as false.
  - [**`getBooleanRequired(key: string): boolean`**](#getbooleanrequired) - Gets a required boolean environment variable, throws if missing or invalid.
  - [**`getJSON<T>(key: string, defaultValue: T): T`**](#getjson) - Parses a JSON object from an environment variable.
  - [**`getArray<T>(key: string, defaultValue?: T[], splitter?: string, transform?: (item: string) => T): T[]`**](#getarray) - Parses a delimited string as an array, with optional transformation.
  - [**`getNumberArray(key: string, defaultValue?: number[], splitter?: string): number[]`**](#getnumberarray) - Parses a delimited string as an array of numbers.
  - [**`getEnum<T extends string>(key: string, defaultValue: T, allowedValues: readonly T[]): T`**](#getenum) - Gets an enum environment variable, throws if not a valid value.
  - [**`getNumberEnum(key: string, defaultValue: number, allowedValues: number[]): number`**](#getnumberenum) - Gets a number enum environment variable, throws if not a valid value.
  - [**`getUrl(key: string, defaultValue: string, options?: UrlOptions): string`**](#geturl) - Gets a URL environment variable, with optional validation.
  - [**`getEmail(key: string, defaultValue: string): string`**](#getemail) - Gets an email environment variable, with basic validation.
  - [**`getPath(key: string, defaultValue: string, options?: PathOptions): string`**](#getpath) - Gets a path environment variable, with optional validation.
  - [**`getPort(key: string, defaultValue: number): number`**](#getport) - Gets and validates a port number (0-65535).
  - [**`getDate(key: string, defaultValue?: string | Date): Date`**](#getdate) - Gets a date environment variable as a `Date` object.
  - [**`getDuration(key: string, defaultValue?: string | number): number`**](#getduration) - Parses a duration string (e.g., `1h30m`) as milliseconds.
  - [**`getSafeEnv(sensitiveKeys?: string[]): Record<string, string>`**](#getsafeenv) - Returns all environment variables with sensitive values masked.
  - [**`getWithDefault(key: string, defaultFn: () => string): string`**](#getwithdefault) - Gets a value, or generates a default using a function.
  - [**`loadFromFile(path: string): Record<string, string>`**](#loadfromfile) - Loads environment variables from a `.env` file (does not overwrite existing).
  - [**`has(key: string): boolean`**](#has) - Checks if an environment variable exists.
  - [**`delete(key: string): void`**](#delete) - Deletes an environment variable (useful for tests).
  - [**`clearCache(): void`**](#clearcache) - Clears the internal cache of parsed values.

---

## Types & Interfaces

Below are the main types and interfaces used by the API methods:

### `Environment` enum

Represents valid application environments.

```ts
enum Environment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  TESTING = 'testing'
}
```

### `UrlOptions` interface

Options for validating URL environment variables.

```ts
interface UrlOptions {
  protocols?: string[];        // Allowed protocols (e.g., ['http', 'https'])
  requireTld?: boolean;        // Require a top-level domain (default: true)
  allowIp?: boolean;           // Allow IP addresses (default: true)
  allowLocalhost?: boolean;    // Allow localhost (default: true)
}
```

### `PathOptions` interface

Options for validating path environment variables.

```ts
interface PathOptions {
  mustExist?: boolean;         // Path must exist on the filesystem (default: false)
  makeAbsolute?: boolean;      // Convert relative paths to absolute (default: true)
  allowedExtensions?: string[];// Allowed file extensions (e.g., ['.json', '.yaml'])
}
```

---

## Function Documentation & Usage Examples

### `Env` class

```ts
import { Env } from "@catbee/utils";
```

### `isDev()`
Checks if `NODE_ENV` is `'development'`.

```ts
Env.isDev(); // true or false
```

### `isProd()`
Checks if `NODE_ENV` is `'production'`.

```ts
Env.isProd(); // true or false
```

### `isTest()`
Checks if `NODE_ENV` is `'testing'`.

```ts
Env.isTest(); // true or false
```

### `isStaging()`
Checks if `NODE_ENV` is `'staging'`.

```ts
Env.isStaging(); // true or false
```

---

### `set()`
Sets an environment variable (in-memory only).

**Method Signature:**
```ts
set(key: string, value: string): void
```

**Parameters:**
- `key`: The name of the environment variable to set.
- `value`: The value to assign to the environment variable.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.set('FOO', 'bar');
```

---

### `getAll()`
Returns all environment variables as an object.

**Method Signature:**
```ts
getAll(): Record<string, string>
```

**Returns:**
- An object containing all environment variables.

**Examples:**
```ts
import { Env } from "@catbee/utils";

const allEnv = Env.getAll(); // { NODE_ENV: 'development', FOO: 'bar', ... }
```

---

### `get()`
Gets a string environment variable, with variable expansion and fallback.

**Method Signature:**
```ts
get(key: string, defaultValue: string): string
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The value to return if the environment variable is not set.

**Returns:**
- The value of the environment variable, or the default value if not set.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.get('FOO', 'default'); // 'bar' if set, otherwise 'default'
Env.get('DATABASE_URL', 'postgres://${DB_HOST}/db'); // expands ${DB_HOST}
```

---

### `getRequired()`
Gets a required string environment variable, throws if missing.

**Method Signature:**
```ts
getRequired(key: string): string
```

**Parameters:**
- `key`: The name of the environment variable to get.

**Returns:**
- The value of the environment variable.

**Throws:**
- An error if the environment variable is not set.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getRequired('API_KEY'); // throws if not set
```

---

### `getOrFail()`
Alias for `getRequired`.

**Method Signature:**
```ts
getOrFail(key: string): string
```

**Parameters:**
- `key`: The name of the environment variable to get.

**Returns:**
- The value of the environment variable.

**Throws:**
- An error if the environment variable is not set.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getOrFail('SECRET'); // throws if not set
```

---

### `getNumber()`
Gets a number environment variable, throws if not a valid number.

**Method Signature:**
```ts
getNumber(key: string, defaultValue: number, options: { min?: number; max?: number } = {}): number
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The value to return if the environment variable is not set.
- `options`: Optional min/max validation.
  - `min`: Minimum allowed value.
  - `max`: Maximum allowed value.

**Returns:**
- The numeric value of the environment variable, or the default value if not set.

**Throws:**
- An error if the environment variable is set but not a valid number.
- An error if the value is out of the specified min/max range.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getNumber('PORT', 3000); // 3000 if not set, otherwise parsed value
Env.getNumber('TIMEOUT', 5000, { min: 1000, max: 10000 }); // throws if out of range
```

---

### `getNumberRequired()`
Gets a required number environment variable, throws if missing or invalid.

**Method Signature:**
```ts
getNumberRequired(key: string): number
```

**Parameters:**
- `key`: The name of the environment variable to get.

**Returns:**
- The numeric value of the environment variable.

**Throws:**
- An error if the environment variable is not set or not a valid number.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getNumberRequired('TIMEOUT'); // throws if not set or not a number
```

---

### `getInteger()`
Gets an integer environment variable, with optional min/max validation.

**Method Signature:**
```ts
getInteger(key: string, defaultValue: number, options: { min?: number; max?: number } = {}): number
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The value to return if the environment variable is not set.
- `options`: Optional min/max validation.
  - `min`: Minimum allowed value.
  - `max`: Maximum allowed value.

**Returns:**
- The integer value of the environment variable, or the default value if not set.

**Throws:**
- An error if the environment variable is set but not a valid integer.
- An error if the value is out of the specified min/max range.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getInteger('PORT', 8080, { min: 1024, max: 65535 }); // throws if not integer or out of range
```

---

### `getBoolean()`
Gets a boolean environment variable. Accepts `true`, `1`, `yes`, `on` as true; `false`, `0`, `no`, `off` as false.

**Method Signature:**
```ts
getBoolean(key: string, defaultValue?: boolean): boolean
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The value to return if the environment variable is not set.

**Returns:**
- The boolean value of the environment variable, or the default value if not set.

**Throws:**
- An error if the environment variable is set but not a valid boolean.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getBoolean('DEBUG', false); // true if DEBUG=yes, otherwise false
```

---

### `getBooleanRequired()`
Gets a required boolean environment variable, throws if missing or invalid.

**Method Signature:**
```ts
getBooleanRequired(key: string): boolean
```

**Parameters:**
- `key`: The name of the environment variable to get.

**Returns:**
- The boolean value of the environment variable.

**Throws:**
- An error if the environment variable is not set or not a valid boolean.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getBooleanRequired('FEATURE_ENABLED'); // throws if not set or invalid
```

---

### `getJSON()`
Parses a JSON object from an environment variable.

**Method Signature:**
```ts
getJSON<T>(key: string, defaultValue: T): T
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The value to return if the environment variable is not set.

**Returns:**
- The parsed JSON object from the environment variable, or the default value if not set.

**Throws:**
- An error if the environment variable is set but not valid JSON.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getJSON('CONFIG', { debug: false }); // parses JSON string or returns default
```

---

### `getArray()`
Parses a delimited string as an array, with optional transformation.

**Method Signature:**
```ts
getArray<T>(key: string, defaultValue?: T[], splitter: string = ',', transform?: (item: string) => T): T[]
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The value to return if the environment variable is not set.
- `splitter`: The string used to split the environment variable value into an array.
- `transform`: An optional function to transform each item in the array.

**Returns:**
- The array of values parsed from the environment variable, or the default value if not set.

**Throws:**
- An error if the environment variable is set but cannot be split or transformed.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getArray('ALLOWED_IPS'); // ['127.0.0.1', '192.168.1.1']
Env.getArray('PORTS', [], ',', p => parseInt(p, 10)); // [3000, 8080]
```

---

### `getNumberArray()`
Parses a delimited string as an array of numbers.

**Method Signature:**
```ts
getNumberArray(key: string, defaultValue?: number[], splitter: string = ','): number[]
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The value to return if the environment variable is not set.
- `splitter`: The string used to split the environment variable value into an array.

**Returns:**
- The array of numbers parsed from the environment variable, or the default value if not set.

**Throws:**
- An error if the environment variable is set but contains non-numeric values.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getNumberArray('ALLOWED_PORTS'); // [80, 443, 3000]
```

---

### `getEnum()`
Gets an environment variable as a string enum, validates allowed values.

**Method Signature:**
```ts
getEnum<T extends string>(key: string, defaultValue: T, allowedValues: readonly T[]): T
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.
- `allowedValues`: The list of allowed string values.

**Returns:**
- The value of the environment variable if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but not in the allowed values.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getEnum('LOG_LEVEL', 'info', ['debug', 'info', 'warn', 'error'] as const);
```

---

### `getNumberEnum()`
Gets an environment variable as a number enum, validates allowed values.

**Method Signature:**
```ts
getNumberEnum(key: string, defaultValue: number, allowedValues: number[]): number
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.
- `allowedValues`: The list of allowed number values.

**Returns:**
- The numeric value of the environment variable if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but not in the allowed values.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getNumberEnum('NODE_VERSION', 16, [14, 16, 18]);
```

---

### `getUrl()`
Gets and validates a URL environment variable.

**Method Signature:**
```ts
getUrl(key: string, defaultValue: string, options?: UrlOptions): string
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.
- `options`: Optional URL validation options.
  - `protocols`: Allowed protocols (e.g., `['http', 'https']`).
  - `requireTld`: Require a top-level domain (default: `true`).
  - `allowIp`: Allow IP addresses (default: `true`).
  - `allowLocalhost`: Allow localhost (default: `true`).

**Returns:**
- The URL string if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but not a valid URL.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getUrl('API_URL', 'https://api.example.com', {
  protocols: ['https'],
  requireTld: true,
  allowIp: false
}); // throws if invalid
```

---

### `getEmail()`
Gets and validates an email environment variable.

**Method Signature:**
```ts
getEmail(key: string, defaultValue: string): string
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.

**Returns:**
- The email string if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but not a valid email.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getEmail('SUPPORT_EMAIL', 'support@example.com'); // throws if invalid
```

---

### `getPath()`
Gets and validates a path environment variable.

**Method Signature:**
```ts
getPath(key: string, defaultValue: string, options?: PathOptions): string
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.
- `options`: Optional path validation options.
  - `mustExist`: Require the path to exist (default: `false`).
  - `allowedExtensions`: List of allowed file extensions (default: `[]`).

**Returns:**
- The path string if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but the path does not exist (if `mustExist` is `true`).
- An error if the path has an invalid extension (if `allowedExtensions` is specified).

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getPath('CONFIG_PATH', './config.json', {
  mustExist: true,
  allowedExtensions: ['.json', '.yaml']
}); // throws if not exists or invalid extension
```

---

### `getPort()`
Gets and validates a port number (0-65535).

**Method Signature:**
```ts
getPort(key: string, defaultValue: number): number
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.

**Returns:**
- The port number if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but not a valid port number.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getPort('PORT', 3000); // throws if out of range
```

---

### `getDate()`
Gets a date environment variable as a `Date` object.

**Method Signature:**
```ts
getDate(key: string, defaultValue?: string | Date): Date
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.

**Returns:**
- The date object if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but not a valid date.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getDate('EXPIRY_DATE', new Date()); // parses ISO string or returns default
```

---

### `getDuration()`
Parses a duration string (e.g., `1h30m`) as milliseconds.

**Method Signature:**
```ts
getDuration(key: string, defaultValue?: string | number): number
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultValue`: The default value to return if the environment variable is not set or invalid.

**Returns:**
- The duration in milliseconds if valid, otherwise the default value.

**Throws:**
- An error if the environment variable is set but not a valid duration.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getDuration('CACHE_TTL', '2h30m'); // 9000000
```

---

### `getSafeEnv()`
Returns all environment variables with sensitive values masked.

**Method Signature:**
```ts
getSafeEnv(sensitiveKeys?: string[]): Record<string, string>
```

**Parameters:**
- `sensitiveKeys`: Optional list of keys to mask (default: `['password', 'secret', 'key']`).

**Returns:**
- An object containing all environment variables, with sensitive values replaced by `'******'`.

**Examples:**

```ts
import { Env } from "@catbee/utils";

Env.getSafeEnv(['password', 'secret', 'key']); // { NODE_ENV: 'development', API_KEY: '******', ... }
```

---

### `getWithDefault()`
Gets a value, or generates a default using a function.

**Method Signature:**
```ts
getWithDefault(key: string, defaultFn: () => string): string
```

**Parameters:**
- `key`: The name of the environment variable to get.
- `defaultFn`: A function that generates the default value if the environment variable is not set.

**Returns:**
- The environment variable value if set, otherwise the result of calling `defaultFn`.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.getWithDefault('HOSTNAME', () => require('os').hostname());
```

---

### `loadFromFile()`
Loads environment variables from a `.env` file (does not overwrite existing).

**Method Signature:**
```ts
loadFromFile(path: string): Record<string, string>
```

**Parameters:**
- `path`: The path to the `.env` file to load.

**Returns:**
- An object containing the loaded environment variables.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.loadFromFile('.env.development');
```

---

### `has()`
Checks if an environment variable exists.

**Method Signature:**
```ts
has(key: string): boolean
```

**Parameters:**
- `key`: The name of the environment variable to check.

**Returns:**
- `true` if the environment variable exists, `false` otherwise.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.has('API_KEY'); // true or false
```

---

### `delete()`
Deletes an environment variable (useful for tests).

**Method Signature:**
```ts
delete(key: string): void
```

**Parameters:**
- `key`: The name of the environment variable to delete.

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.delete('FOO');
```

---

### `clearCache()`
Clears the internal cache of parsed values.

**Method Signature:**
```ts
clearCache(): void
```

**Examples:**
```ts
import { Env } from "@catbee/utils";

Env.clearCache();
```

---
id: validation
pagination_next: null
---

# Validation Utilities

Comprehensive suite of validators for strings, numbers, arrays, objects, dates, patterns, and more. Includes type guards, range checks, format checks, and multi-validator helpers. All methods are fully typed.

## API Summary

- [**`isPort(str: string | number): boolean`**](#isport) - Checks if a value is a valid port number (1-65535).
- [**`isEmail(str: string): boolean`**](#isemail) - Checks if a string is a valid email address.
- [**`isUUID(str: string): boolean`**](#isuuid) - Checks if a string is a valid UUID (versions 1-5).
- [**`isURL(str: string): boolean`**](#isurl) - Checks if a string is a valid URL.
- [**`isPhone(str: string): boolean`**](#isphone) - Checks if a string is a valid international phone number.
- [**`isAlphanumeric(str: string): boolean`**](#isalphanumeric) - Checks if a string contains only letters and numbers.
- [**`isNumeric(value: string | number): boolean`**](#isnumeric) - Checks if a value is numeric.
- [**`isHexColor(str: string): boolean`**](#ishexcolor) - Checks if a string is a valid hex color code.
- [**`isISODate(str: string): boolean`**](#isisodate) - Checks if a string is a valid ISO date.
- [**`isLengthBetween(str: string, min: number, max: number): boolean`**](#islengthbetween) - Checks if a string's length is within a range.
- [**`isNumberBetween(value: number, min: number, max: number): boolean`**](#isnumberbetween) - Checks if a number is within a range.
- [**`isAlpha(str: string): boolean`**](#isalpha) - Checks if a string contains only alphabetic characters.
- [**`isStrongPassword(str: string): boolean`**](#isstrongpassword) - Checks if a string meets password complexity requirements.
- [**`isIPv4(str: string): boolean`**](#isipv4) - Checks if a string is a valid IPv4 address.
- [**`isIPv6(str: string): boolean`**](#isipv6) - Checks if a string is a valid IPv6 address.
- [**`isCreditCard(str: string): boolean`**](#iscreditcard) - Checks if a string is a valid credit card number.
- [**`isValidJSON(str: string): boolean`**](#isvalidjson) - Checks if a string is valid JSON.
- [**`isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): boolean`**](#isarray) - Checks if a value is an array.
- [**`isObject(value: unknown): boolean`**](#isobject) - Checks if a value is an object.
- [**`hasRequiredProps(obj: object, requiredProps: string[]): boolean`**](#hasrequiredprops) - Checks if an object has all required properties.
- [**`isDateInRange(date: Date, minDate?: Date, maxDate?: Date): boolean`**](#isdateinrange) - Checks if a date is within a range.
- [**`matchesPattern(str: string, pattern: RegExp): boolean`**](#matchespattern) - Checks if a string matches a regex pattern.
- [**`validateAll(value: unknown, validators: Array<(value: unknown) => boolean>): boolean`**](#validateall) - Validates a value against multiple validators.

---

## Function Documentation & Usage Examples


### `isPort()`
Checks if a value is a valid port number (1-65535).

**Method Signature:**
```ts
function isPort(value: string | number): boolean;
```

**Parameters:**
- `value`: The value to check (string or number).

**Returns:**
- `true` if the value is a valid port number, otherwise `false`.

**Example:**
```ts
import { isPort } from '@catbee/utils';

isPort(8080); // true
isPort('65536'); // false
```

---

### `isEmail()`
Checks if a string is a valid email address.

**Method Signature:**
```ts
function isEmail(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid email address, otherwise `false`.

**Example:**
```ts
import { isEmail } from '@catbee/utils';

isEmail("user@example.com"); // true
```

---

### `isUUID()`
Checks if a string is a valid UUID (versions 1-5).

**Method Signature:**
```ts
function isUUID(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid UUID, otherwise `false`.

**Example:**
```ts
import { isUUID } from '@catbee/utils';

isUUID("550e8400-e29b-41d4-a716-446655440000"); // true
```

---

### `isURL()`
Checks if a string is a valid URL.

**Method Signature:**
```ts
function isURL(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid URL, otherwise `false`.

**Example:**
```ts
import { isURL } from '@catbee/utils';

isURL("https://example.com"); // true
```

---

### `isPhone()`
Checks if a string is a valid international phone number.

**Method Signature:**
```ts
function isPhone(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid international phone number, otherwise `false`.

**Example:**
```ts
import { isPhone } from '@catbee/utils';

isPhone("+1-800-555-1234"); // true
```

---

### `isAlphanumeric()`
Checks if a string contains only letters and numbers.

**Method Signature:**
```ts
function isAlphanumeric(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is alphanumeric, otherwise `false`.

**Example:**
```ts
import { isAlphanumeric } from '@catbee/utils';

isAlphanumeric("abc123"); // true
```

---

### `isNumeric()`
Checks if a value can be safely parsed to a number.

**Method Signature:**
```ts
function isNumeric(value: string | number): boolean;
```

**Parameters:**
- `value`: The value to check (string or number).

**Returns:**
- `true` if the value can be safely parsed to a number, otherwise `false`.

**Example:**
```ts
import { isNumeric } from '@catbee/utils';

isNumeric("42"); // true
isNumeric("abc"); // false
```

---

### `isHexColor()`
Checks if a string is a valid hex color code.

**Method Signature:**
```ts
function isHexColor(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid hex color code, otherwise `false`.

**Example:**
```ts
import { isHexColor } from '@catbee/utils';

isHexColor("#fff"); // true
isHexColor("#123abc"); // true
```

---

### `isISODate()`
Checks if a string is a valid ISO date.

**Method Signature:**
```ts
function isISODate(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid ISO date, otherwise `false`.

**Example:**
```ts
import { isISODate } from '@catbee/utils';

isISODate("2023-01-01T12:00:00Z"); // true
```

---

### `isLengthBetween()`
Checks if a string's length is within a range.

**Method Signature:**
```ts
function isLengthBetween(str: string, min: number, max: number): boolean;
```

**Parameters:**
- `str`: The string to check.
- `min`: Minimum length (inclusive).
- `max`: Maximum length (inclusive).

**Returns:**
- `true` if the string's length is within the range, otherwise `false`.

**Example:**
```ts
import { isLengthBetween } from '@catbee/utils';

isLengthBetween("abc", 2, 5); // true
```

---

### `isNumberBetween()`
Checks if a number is within a range.

**Method Signature:**
```ts
function isNumberBetween(value: number, min: number, max: number): boolean;
```

**Parameters:**
- `value`: The number to check.
- `min`: Minimum value (inclusive).
- `max`: Maximum value (inclusive).

**Returns:**
- `true` if the number is within the range, otherwise `false`.

**Example:**
```ts
import { isNumberBetween } from '@catbee/utils';

isNumberBetween(5, 1, 10); // true
```

---

### `isAlpha()`
Checks if a string contains only alphabetic characters.

**Method Signature:**
```ts
function isAlpha(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value contains only alphabetic characters, otherwise `false`.

**Example:**
```ts
import { isAlpha } from '@catbee/utils';

isAlpha("abcDEF"); // true
```

---

### `isStrongPassword()`
Checks if a string meets password complexity requirements.

**Method Signature:**
```ts
function isStrongPassword(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value meets password complexity requirements, otherwise `false`.

**Example:**
```ts
import { isStrongPassword } from '@catbee/utils';

isStrongPassword("Abc123!@#"); // true
```

---

### `isIPv4()`
Checks if a string is a valid IPv4 address.

**Method Signature:**
```ts
function isIPv4(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid IPv4 address, otherwise `false`.

**Example:**
```ts
import { isIPv4 } from '@catbee/utils';

isIPv4("192.168.1.1"); // true
```

---

### `isIPv6()`
Checks if a string is a valid IPv6 address.

**Method Signature:**
```ts
function isIPv6(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid IPv6 address, otherwise `false`.

**Example:**
```ts
import { isIPv6 } from '@catbee/utils';

isIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334"); // true
```

---

### `isCreditCard()`
Checks if a string is a valid credit card number (Luhn algorithm).

**Method Signature:**
```ts
function isCreditCard(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is a valid credit card number, otherwise `false`.

**Example:**
```ts
import { isCreditCard } from '@catbee/utils';

isCreditCard("4111111111111111"); // true
```

---

### `isValidJSON()`
Checks if a string is valid JSON.

**Method Signature:**
```ts
function isValidJSON(value: string): boolean;
```

**Parameters:**
- `value`: The value to check (string).

**Returns:**
- `true` if the value is valid JSON, otherwise `false`.

**Example:**
```ts
import { isValidJSON } from '@catbee/utils';

isValidJSON('{"a":1}'); // true
```

---

### `isArray()`
Type guard for arrays, optionally checks element type.

**Method Signature:**
```ts
function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[];
```

**Parameters:**
- `value`: The value to check (unknown).
- `itemGuard`: Optional type guard function for array elements.

**Returns:**
- `true` if the value is an array (and elements pass the guard if provided), otherwise `false`.

**Example:**
```ts
import { isArray } from '@catbee/utils';

isArray([1,2,3], (x): x is number => typeof x === 'number'); // true
```

---

### `isObject()`
Checks if a value is a non-null object.

**Method Signature:**
```ts
function isObject(value: unknown): value is Record<string, unknown>;
```

**Parameters:**
- `value`: The value to check (unknown).

**Returns:**
- `true` if the value is a non-null object, otherwise `false`.

**Example:**
```ts
import { isObject } from '@catbee/utils';

isObject({ a: 1 }); // true
```

---

### `hasRequiredProps()`
Checks if an object has all required properties.

**Method Signature:**
```ts
function hasRequiredProps(obj: Record<string, unknown>, requiredProps: string[]): boolean;
```

**Parameters:**
- `obj`: The object to check (`Record<string, unknown>`).
- `requiredProps`: An array of required property names (`string[]`).

**Returns:**
- `true` if the object has all required properties, otherwise `false`.

**Example:**
```ts
import { hasRequiredProps } from '@catbee/utils';

hasRequiredProps({ a: 1, b: 2 }, ['a', 'b']); // true
```

---

### `isDateInRange()`
Checks if a date is within a specified range.

**Method Signature:**
```ts
function isDateInRange(date: Date, minDate?: Date, maxDate?: Date): boolean;
```

**Parameters:**
- `date`: The date to check (Date).
- `minDate`: The minimum date (Date, optional).
- `maxDate`: The maximum date (Date, optional).

**Returns:**
- `true` if the date is within the specified range, otherwise `false`.

**Example:**
```ts
import { isDateInRange } from '@catbee/utils';

isDateInRange(new Date(), new Date('2020-01-01'), new Date('2030-01-01')); // true
```

---

### `matchesPattern()`
Checks if a string matches a regular expression.

**Method Signature:**
```ts
function matchesPattern(str: string, pattern: RegExp): boolean;
```

**Parameters:**
- `str`: The string to check (string).
- `pattern`: The regular expression pattern to match against (RegExp).

**Returns:**
- `true` if the string matches the pattern, otherwise `false`.

**Example:**
```ts
import { matchesPattern } from '@catbee/utils';

matchesPattern("abc123", /^[a-z]+\d+$/); // true
```

---

### `validateAll()`
Checks if a value passes all provided validators.

**Method Signature:**
```ts
function validateAll(value: unknown, validators: Array<(value: unknown) => boolean>): boolean;
```

**Parameters:**
- `value`: The value to validate.
- `validators`: An array of validator functions to apply.

**Returns:**
- `true` if the value passes all validators, otherwise `false`.

**Example:**
```ts
import { validateAll, isAlpha } from '@catbee/utils';
validateAll("abc", [isAlpha, str => str.length > 2]); // true
```

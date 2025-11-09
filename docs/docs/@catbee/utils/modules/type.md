# Type Utilities

A set of utility functions for type checking, conversion, and type guards in TypeScript. Includes primitives/type guards, conversion helpers, and type enforcement. All methods are fully typed.

## API Summary

- [**`isPrimitiveType(value: unknown, type: PrimitiveType): boolean`**](#isprimitivetype) - Checks if a value is of a specific primitive type.
- [**`getTypeOf(value: unknown): string`**](#gettypeof) - Returns the primitive type of a value as a string.
- [**`isArrayOf<T>(value: unknown, itemTypeGuard: (item: unknown) => item is T): value is T[]`**](#isarrayof) - Type guard for checking if a value is an array of a specific type.
- [**`toStr(value: unknown, defaultValue?: string): string`**](#tostr) - Converts a value to a string.
- [**`toNum(value: unknown, defaultValue?: number): number`**](#tonum) - Converts a value to a number.
- [**`toBool(value: unknown, defaultValue?: boolean): boolean`**](#tobool) - Converts a value to a boolean.
- [**`ensureType(value: unknown, expectedType: string, defaultValue: T): T`**](#ensuretype) - Ensures a value matches the expected type, or provides a default.

---

## Interface & Types

```ts
type PrimitiveType = | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint' | 'function' | 'object' | 'array' | 'null' | 'undefined';
```

---

## Function Documentation & Usage Examples

### `isPrimitiveType()`
Checks if a value is of a specific primitive type.

**Method Signature:**
```ts
function isPrimitiveType(value: unknown, type: PrimitiveType): boolean;
```

**Parameters:**
- `value`: The value to check.
- `type`: The primitive type to check against.

**Returns:**
- `true` if the value matches the specified type, otherwise `false`. 

**Example:**
```ts
import { isPrimitiveType } from '@catbee/utils';

isPrimitiveType('hello', 'string'); // true
isPrimitiveType(42, 'number'); // true
isPrimitiveType([], 'array'); // true
isPrimitiveType(null, 'null'); // true
```

---

### `getTypeOf()`
Returns the primitive type of a value as a string.

**Method Signature:**
```ts
getTypeOf(value: unknown): string;
```

**Parameters:**
- `value`: The value to check.

**Returns:**
- The primitive type of the value as a string.

**Example:**
```ts
import { getTypeOf } from '@catbee/utils';

getTypeOf('hello'); // 'string'
getTypeOf(42); // 'number'
getTypeOf([]); // 'array'
getTypeOf(null); // 'null'
```

---

### `isArrayOf()`
Type guard for checking if a value is an array of a specific type.

**Method Signature:**
```ts
function isArrayOf<T>(value: unknown, itemTypeGuard: (item: unknown) => item is T): value is T[];
```

**Parameters:**
- `value`: The value to check.
- `itemTypeGuard`: A type guard function to check each item in the array.

**Returns:**
- `true` if the value is an array and all items pass the type guard, otherwise `false`.

**Example:**
```ts
import { isArrayOf } from '@catbee/utils';

isArrayOf([1, 2, 3], (item): item is number => typeof item === 'number'); // true
isArrayOf(['a', 'b'], (item): item is string => typeof item === 'string'); // true
isArrayOf([1, '2'], (item): item is number => typeof item === 'number'); // false
```

---

### `toStr()`
Converts a value to a string. Returns a default value if conversion fails.

**Method Signature:**
```ts
function toStr(value: unknown, defaultValue?: string): string;
```

**Parameters:**
- `value`: The value to convert.
- `defaultValue`: The default string to return if conversion fails (optional).

**Returns:**
- The string representation of the value, or the default value if conversion fails.

**Example:**
```ts
import { toStr } from '@catbee/utils';

toStr(42); // '42'
toStr({ a: 1 }); // '{"a":1}'
toStr(undefined, 'N/A'); // 'N/A'
```

---

### `toNum()`
Converts a value to a number. Returns a default value if conversion fails.

**Method Signature:**
```ts
function toNum(value: unknown, defaultValue?: number): number;
```

**Parameters:**
- `value`: The value to convert.
- `defaultValue`: The default number to return if conversion fails (optional).

**Returns:**
- The number representation of the value, or the default value if conversion fails.

**Example:**
```ts
import { toNum } from '@catbee/utils';

toNum('42'); // 42
toNum('abc', 0); // 0
toNum(undefined, 5); // 5
```

---

### `toBool()`
Converts a value to a boolean. Returns a default value if conversion fails.

**Method Signature:**

```ts
function toBool(value: unknown, defaultValue?: boolean): boolean;
```

**Parameters:**
- `value`: The value to convert.
- `defaultValue`: The default boolean to return if conversion fails (optional).

**Returns:**
- The boolean representation of the value, or the default value if conversion fails.

**Example:**
```ts
import { toBool } from '@catbee/utils';

toBool('true'); // true
toBool('no'); // false
toBool(1); // true
toBool(0); // false
```

---

### `ensureType()`
Ensures a value matches the expected type, or provides a default.

**Method Signature:**
```ts
function ensureType<T>(value: unknown, expectedType: string, defaultValue: T): T;
```

**Parameters:**
- `value`: The value to check.
- `expectedType`: The expected type as a string (e.g., 'string', 'number').
- `defaultValue`: The default value to return if the type does not match.

**Returns:**
- The original value if it matches the expected type, otherwise the default value.

**Example:**
```ts
import { ensureType } from '@catbee/utils';
ensureType(42, 'number', 0); // 42
ensureType('42', 'number', 0); // 0
ensureType(undefined, 'string', 'default'); // 'default'
```

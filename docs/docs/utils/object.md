# Object Utilities

Helpers for manipulating objects. Includes methods for picking/omitting keys, deep merging, flattening, path-based access, deep equality, filtering, mapping, freezing, and more. All methods are fully typed.

## API Summary

- [**`isObjEmpty(obj)`**](#isobjempty) - checks if an object is empty.
- [**`pick(obj, keys)`**](#pick) - picks specific keys from an object.
- [**`omit(obj, keys)`**](#omit) - omits specific keys from an object.
- [**`deepObjMerge(target, ...sources)`**](#deepobjmerge) - deeply merges multiple objects into the target object.
- [**`isPlainObject(value)`**](#isplainobject) - checks if a value is a plain object.
- [**`flattenObject(obj, prefix?)`**](#flattenobject) - flattens a nested object.
- [**`getValueByPath(obj, path)`**](#getvaluebypath) - gets a value by a dot/bracket notation path.
- [**`setValueByPath(obj, path, value)`**](#setvaluebypath) - sets a value by a dot/bracket notation path.
- [**`isEqual(a, b)`**](#isequal) - performs deep equality check between two values.
- [**`filterObject(obj, predicate)`**](#filterobject) - filters object properties based on a predicate function.
- [**`mapObject(obj, mapFn)`**](#mapobject) - maps object values using a mapping function.
- [**`deepFreeze(obj)`**](#deepfreeze) - deeply freezes an object.
- [**`isObject(value)`**](#isobject) - checks if a value is an object.
- [**`getAllPaths(obj, parentPath?)`**](#getallpaths) - gets all paths in an object using dot notation.

---

## Function Documentation & Usage Examples

### `isObjEmpty()`
Checks if an object has no own enumerable properties.

**Method Signature:**

```ts
function isObjEmpty(obj: Record<any, any>): boolean
```

**Parameters:**
- `obj`: The object to check.

**Returns:**
- `true` if the object is empty, otherwise `false`.

**Examples:**
```ts
import { isObjEmpty } from '@catbee/utils';

isObjEmpty({}) // true
isObjEmpty({ a: 1 }) // false
```

---

### `pick()`
Returns a new object with only the specified keys.

**Method Signature:**
```ts
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>
```

**Parameters:**
- `obj`: The source object.
- `keys`: An array of keys to pick from the object.

**Returns:**
- A new object containing only the picked keys.

**Examples:**
```ts
import { pick } from '@catbee/utils';

pick({ a: 1, b: 2 }, ['a']) // { a: 1 }
```

---

### `omit()`
Returns a new object with the specified keys omitted.

**Method Signature:**
```ts
function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>
```

**Parameters:**
- `obj`: The source object.
- `keys`: An array of keys to omit from the object.

**Returns:**
- A new object containing all keys except the omitted ones.

**Examples:**
```ts
import { omit } from '@catbee/utils';

omit({ a: 1, b: 2 }, ['a']) // { b: 2 }
```

---

### `deepObjMerge()`
Deeply merges multiple objects into the target object (mutates and returns target).

**Method Signature:**
```ts
function deepObjMerge<T extends object>(target: T, ...sources: any[]): T
```

**Parameters:**
- `target`: The target object to merge into.
- `sources`: One or more source objects to merge from.

**Returns:**
- The mutated target object.

**Examples:**
```ts
import { deepObjMerge } from '@catbee/utils';

const a = { x: 1, y: { z: 2 } }
const b = { y: { w: 3 } }
deepObjMerge(a, b) // { x: 1, y: { z: 2, w: 3 } }
```

---

### `isPlainObject()`
Checks if a value is a plain object (not array, not null, not built-in).

**Method Signature:**
```ts
function isPlainObject(value: any): value is Record<string, any>
```

**Parameters:**
- `value`: The value to check.

**Returns:**
- `true` if the value is a plain object, otherwise `false`.

**Examples:**
```ts
import { isPlainObject } from '@catbee/utils';

isPlainObject({}) // true
isPlainObject([]) // false
isPlainObject(new Date()) // false
```

---

### `flattenObject()`
Flattens a nested object using dot notation for keys.

**Method Signature:**
```ts
function flattenObject<T>(obj: T, prefix?: string): Record<string, any>
```

**Parameters:**
- `obj`: The object to flatten.
- `prefix` (optional): A prefix to prepend to all keys.

**Returns:**
- A new flattened object.

**Examples:**
```ts
import { flattenObject } from '@catbee/utils';

flattenObject({ a: { b: 1 } }) // { 'a.b': 1 }
```

---

### `getValueByPath()`
Safely gets the value of a deeply nested key using dot/bracket notation.

**Method Signature:**
```ts
function getValueByPath<T>(obj: T, path: string): any
```

**Parameters:**
- `obj`: The source object.
- `path`: The path string (e.g. 'a.b[0].c').

**Returns:**
- The value at the specified path, or `undefined` if not found.

**Examples:**
```ts
import { getValueByPath } from '@catbee/utils';

getValueByPath({ a: { b: [ { c: 5 } ] } }, 'a.b[0].c') // 5
```

---

### `setValueByPath()`
Sets a value at a deeply nested key using dot/bracket notation.

**Method Signature:**
```ts
function setValueByPath<T>(obj: T, path: string, value: any): T
```

**Parameters:**
- `obj`: The target object.
- `path`: The path string (e.g. 'a.b[0].c').
- `value`: The value to set at the specified path.

**Returns:**
- The mutated target object.

**Examples:**
```ts
import { setValueByPath } from '@catbee/utils';

const obj = { a: {} }
setValueByPath(obj, 'a.b.c', 10) // obj is now { a: { b: { c: 10 } } }
```

---

### `isEqual()`
Performs a deep equality check between two values.

**Method Signature:**
```ts
function isEqual(a: any, b: any): boolean
```

**Parameters:**
- `a`: The first value to compare.
- `b`: The second value to compare.

**Returns:**
- `true` if the values are deeply equal, otherwise `false`.

**Examples:**
```ts
import { isEqual } from '@catbee/utils';

isEqual({ x: [1, 2] }, { x: [1, 2] }) // true
isEqual({ x: 1 }, { x: 2 }) // false
```

---

### `filterObject()`
Filters object properties based on a predicate function.

**Method Signature:**
```ts
function filterObject<T>(obj: T, predicate: (value: any, key: string, obj: T) => boolean): Partial<T>
```

**Parameters:**
- `obj`: The source object.
- `predicate`: A function that returns `true` to keep the property, or `false to omit it.
  - `value`: The current property value.
  - `key`: The current property key.
  - `obj`: The original object.

**Returns:**
- A new object containing only the properties that passed the predicate.

**Examples:**
```ts
import { filterObject } from '@catbee/utils';

filterObject({ a: 1, b: 2 }, v => v > 1) // { b: 2 }
```

---

### `mapObject()`
Maps object values to new values using a mapping function.

**Method Signature:**
```ts
function mapObject<T, U>(obj: T, mapFn: (value: any, key: string, obj: T) => U): Record<keyof T, U>
```

**Parameters:**
- `obj`: The source object.
- `mapFn`: A function that transforms each value.
  - `value`: The current property value.
  - `key`: The current property key.
  - `obj`: The original object.

**Returns:**
- A new object with the same keys but transformed values.

**Examples:**
```ts
import { mapObject } from '@catbee/utils';

mapObject({ a: 1, b: 2 }, v => v * 2) // { a: 2, b: 4 }
```

---

### `deepFreeze()`
Recursively freezes an object and all its properties.

**Method Signature:**
```ts
function deepFreeze<T>(obj: T): Readonly<T>
```

**Parameters:**
- `obj`: The object to deeply freeze.

**Returns:**
- The deeply frozen object.

**Examples:**
```ts
import { deepFreeze } from '@catbee/utils';

const frozen = deepFreeze({ a: { b: 2 } })
// frozen.a.b = 3 // Throws error in strict mode
```

---

### `isObject()`
Safely checks if a value is an object (not null, not array).

**Method Signature:**
```ts
function isObject(value: unknown): value is Record<string, any>
```

**Parameters:**
- `value`: The value to check.

**Returns:**
- `true` if the value is an object, otherwise `false`.

**Examples:**
```ts
import { isObject } from '@catbee/utils';

isObject({}) // true
isObject(null) // false
isObject([]) // false
```

---

### `getAllPaths()`
Gets all paths in an object using dot notation.

**Method Signature:**
```ts
function getAllPaths(obj: Record<string, any>, parentPath?: string): string[]
```

**Parameters:**
- `obj`: The object to extract paths from.
- `parentPath` (optional): A prefix to prepend to all paths.

**Returns:**
- An array of strings representing all paths in the object.

**Examples:**
```ts
import { getAllPaths } from '@catbee/utils';

getAllPaths({ a: { b: 1 }, c: 2 }) // ['a', 'a.b', 'c']
```


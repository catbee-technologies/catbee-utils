# ID Utilities

A collection of utility functions for generating unique identifiers and random values using cryptographically strong methods. These utilities help you create UUIDs, compact IDs, random strings, and numbers for various application needs.

## API Summary

- [**`uuid(): string`**](#uuid) - generates a UUID v4 string
- [**`nanoId(size?: number): string`**](#nanoid) - generates a URL-safe, compact ID
- [**`randomHex(byteLength?: number): string`**](#randomhex) - generates a random hexadecimal string
- [**`randomInt(min: number, max: number): number`**](#randomint) - generates a random integer within a specified range
- [**`randomBase64(byteLength?: number): string`**](#randombase64) - generates a random base64 string


---

## Function Documentation & Usage Examples

### `uuid()`
Generates a UUID v4 string (RFC 4122).

**Method Signature:**
```ts
function uuid(): string
```

**Returns:** 
- A UUID v4 string (e.g., 'c0de1234-5678-9abc-def0-123456789abc')

**Example:**
```ts
import { uuid } from "@catbee/utils";

const id = uuid();
// Result: "c0de1234-5678-9abc-def0-123456789abc"
```

---

### `nanoId()`
Generates a nanoid-style random ID that is URL-safe and has customizable length.

**Method Signature:**
```ts
function nanoId(length?: number): string
```

**Parameters:**
- `length` (optional): Length of the ID (default: 21)

**Returns:** 
- Nanoid-style random string

**Example:**
```ts
import { nanoId } from "@catbee/utils";

// Default length (21)
const id1 = nanoId();
// Result: "ZhPQoGbxcKmVqLn3j5cza"

// Custom length
const shortId = nanoId(10);
// Result: "dBn7Pq3L5K"
```

---

### `randomHex()`
Generates a cryptographically strong random hexadecimal string.

**Method Signature:**
```ts
function randomHex(byteLength?: number): string
```

**Parameters:**
- `byteLength` (optional): Number of random bytes (default: 16, resulting in 32 hex chars)

**Returns:** 
- Random hex string

**Example:**
```ts
import { randomHex } from "@catbee/utils";

// Default length (16 bytes = 32 chars)
const hex = randomHex();
// Result: "8f7d6a5e4c3b2a1908f7d6a5e4c3b2a19"

// Custom length
const shortHex = randomHex(8);
// Result: "3f2e1d0c9b8a7654"
```

---

### `randomInt()`
Generates a random integer between min (inclusive) and max (inclusive).

**Method Signature:**
```ts
function randomInt(min: number, max: number): number
```

**Parameters:**
- `min`: Minimum value (inclusive)
- `max`: Maximum value (inclusive)

**Returns:** 
- Random integer in the specified range

**Example:**
```ts
import { randomInt } from "@catbee/utils";

// Random number between 1 and 100
const roll = randomInt(1, 100);
// Result: 42

// Random number for array index
const index = randomInt(0, array.length - 1);
```

---

### `randomBase64()`
Generates a cryptographically strong random base64 string (URL-safe, no padding).

**Method Signature:**
```ts
function randomBase64(byteLength?: number): string
```

**Parameters:**
- `byteLength` (optional): Number of random bytes (default: 16)

**Returns:** 
- Random URL-safe base64 string

**Example:**
```ts
import { randomBase64 } from "@catbee/utils";

// Default length (16 bytes)
const token = randomBase64();
// Result: "j5cza-ZhPQoGbxcKmVqLn"

// Custom length
const longToken = randomBase64(32);
// Result: "dBn7Pq3L5K-ZhPQoGbxcKmVqLn3j5cza-8f7d6a5e4c3b"
```

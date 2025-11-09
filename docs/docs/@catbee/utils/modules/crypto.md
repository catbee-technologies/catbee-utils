# Crypto Utilities

Secure cryptographic functions for encryption, hashing, and token generation. Includes hashing, HMAC, random string and API key generation, timing-safe comparison, AES encryption/decryption, and JWT-like token creation/verification. All methods are fully typed.

## API Summary

- [**`hmac(algorithm: string, input: string, secret: string, encoding?: BinaryToTextEncoding): string`**](#hmac) - Generate an HMAC hash.
- [**`hash(algorithm: string, input: string, encoding?: BinaryToTextEncoding): string`**](#hash) - Generate a hash using a specified algorithm.
- [**`sha256Hmac(input: string, secret: string): string`**](#sha256hmac) - Generate a SHA256 HMAC.
- [**`sha1(input: string, encoding?: BinaryToTextEncoding): string`**](#sha1) - Generate a SHA1 hash.
- [**`sha256(input: string, encoding?: BinaryToTextEncoding): string`**](#sha256) - Generate a SHA256 hash.
- [**`md5(input: string): string`**](#md5) - Generate an MD5 hash.
- [**`randomString(): string`**](#randomstring) - Generate a cryptographically secure random string.
- [**`generateRandomBytes(byteLength?: number): Buffer`**](#generaterandombytes) - Generate random bytes.
- [**`generateRandomBytesAsString(byteLength?: number, encoding?: BinaryToTextEncoding): string`**](#generaterandombytesasstring) - Generate random bytes as a string.
- [**`generateApiKey(prefix?: string, byteLength?: number): string`**](#generateapikey) - Generate an API key with optional prefix.
- [**`safeCompare(a: string | Buffer | Uint8Array, b: string | Buffer | Uint8Array): boolean`**](#safecompare) - Timing-safe string comparison.
- [**`encrypt(data: string | Buffer, key: string | Buffer, options?): Promise<EncryptionResult>`**](#encrypt) - Encrypt data using AES.
- [**`decrypt(encryptedData: EncryptionResult, key: string | Buffer, options?): Promise<string | Buffer>`**](#decrypt) - Decrypt AES encrypted data.
- [**`createSignedToken(payload: object, secret: string, expiresInSeconds?: number): string`**](#createsignedtoken) - Create a signed token (JWT-like).
- [**`verifySignedToken(token: string, secret: string): object | null`**](#verifysignedtoken) - Verify and decode a signed token.

---

## Interfaces & Types

```ts
type BufferEncoding = | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'utf-16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

interface EncryptionOptions {
  algorithm?: string;
  inputEncoding?: BufferEncoding;
  outputEncoding?: string;
}

interface DecryptionOptions {
  algorithm?: string;
  inputEncoding?: string;
  outputEncoding?: BufferEncoding;
}

interface EncryptionResult {
  ciphertext: string | Buffer;
  iv: Buffer;
  authTag?: Buffer;
  algorithm: string;
}

```

___

## Function Documentation & Usage Examples

### `hmac()`
Generate an HMAC hash.

**Method Signature:**
```ts
function hmac(algorithm: string, input: string, secret: string, encoding?: BinaryToTextEncoding): string
```

**Parameters:**
- `algorithm`: The hash algorithm (e.g., 'sha256', 'sha1').
- `input`: The input string to hash.
- `secret`: The secret key for HMAC.
- `encoding`: Optional output encoding (e.g., 'hex', 'base64'). Default is 'hex'.

**Returns:**
- The resulting HMAC hash as a string.

**Examples:**
```ts
import { hmac } from "@catbee/utils";

hmac('sha256', 'data', 'secret'); // '...'/
```

---

### `hash()`
Generate a hash using a specified algorithm.

**Method Signature:**
```ts
function hash(algorithm: string, input: string, encoding?: BinaryToTextEncoding): string
```

**Parameters:**
- `algorithm`: The hash algorithm (e.g., 'sha256', 'md5').
- `input`: The input string to hash.
- `encoding`: Optional output encoding (e.g., 'hex', 'base64'). Default is 'hex'.

**Returns:**
- The resulting hash as a string.

**Examples:**
```ts
import { hash } from "@catbee/utils";

hash('sha256', 'data'); // '...'
```

---

### `sha256Hmac()`
Generate a SHA256 HMAC.

**Method Signature:**
```ts
function sha256Hmac(input: string, secret: string): string
```

**Parameters:**
- `input`: The input string to hash.
- `secret`: The secret key for HMAC.

**Returns:**
- The resulting HMAC hash as a string.

**Examples:**
```ts
import { sha256Hmac } from "@catbee/utils";

sha256Hmac('data', 'secret'); // '...'
```

---

### `sha1()`
Generate a SHA1 hash.

**Method Signature:**
```ts
function sha1(input: string, encoding?: BinaryToTextEncoding): string
```

**Parameters:**
- `input`: The input string to hash.
- `encoding`: Optional output encoding (e.g., 'hex', 'base64'). Default is 'hex'.

**Returns:**
- The resulting hash as a string.

**Examples:**
```ts
import { sha1 } from "@catbee/utils";

sha1('data'); // '...'
```

---

### `sha256()`
Generate a SHA256 hash.

**Method Signature:**
```ts
function sha256(input: string, encoding?: BinaryToTextEncoding): string
```

**Parameters:**
- `input`: The input string to hash.
- `encoding`: Optional output encoding (e.g., 'hex', 'base64'). Default is 'hex'.

**Returns:**
- The resulting hash as a string.

**Examples:**
```ts
import { sha256 } from "@catbee/utils";

sha256('data'); // '...'
```

---

### `md5()`
Generate an MD5 hash.

**Method Signature:**
```ts
function md5(input: string): string
```

**Parameters:**
- `input`: The input string to hash.

**Returns:**
- The resulting hash as a string.

**Examples:**
```ts
import { md5 } from "@catbee/utils";

md5('data'); // '...'
```

---

### `randomString()`
Generate a cryptographically secure random string.

**Method Signature:**
```ts
function randomString(): string
```

**Returns:**
- A cryptographically secure random string.

**Examples:**
```ts
import { randomString } from "@catbee/utils";

randomString(); // '...'
```

---

### `generateRandomBytes()`
Generate random bytes.

**Method Signature:**
```ts
function generateRandomBytes(byteLength?: number): Buffer
```

**Parameters:**
- `byteLength`: The number of random bytes to generate. Default is 32.

**Returns:**
- A Buffer containing the random bytes.

**Examples:**
```ts
import { generateRandomBytes } from "@catbee/utils";

generateRandomBytes(16); // <Buffer ...>
```

---

### `generateRandomBytesAsString()`
Generate random bytes as a string.

**Method Signature:**
```ts
function generateRandomBytesAsString(byteLength?: number, encoding?: BinaryToTextEncoding): string
```

**Parameters:**
- `byteLength`: The number of random bytes to generate. Default is 32.
- `encoding`: The encoding for the output string (e.g., 'hex', 'base64'). Default is 'hex'.

**Returns:**
- A string containing the random bytes in the specified encoding.

**Examples:**
```ts
import { generateRandomBytesAsString } from "@catbee/utils";

generateRandomBytesAsString(16, 'hex'); // '...'
```

---

### `generateApiKey()`
Generate an API key with optional prefix.

**Method Signature:**
```ts
function generateApiKey(prefix?: string, byteLength?: number): string
```

**Parameters:**
- `prefix`: An optional prefix for the API key.
- `byteLength`: The number of random bytes to generate. Default is 32.

**Returns:**
- A string containing the generated API key.

**Examples:**
```ts
import { generateApiKey } from "@catbee/utils";

generateApiKey('catbee_', 32); // 'catbee_...'
```

---

### `safeCompare()`
Timing-safe string comparison.

**Method Signature:**
```ts
function safeCompare(a: string | Buffer | Uint8Array, b: string | Buffer | Uint8Array): boolean
```

**Parameters:**
- `a`: The first string or buffer to compare.
- `b`: The second string or buffer to compare.

**Returns:**
- `true` if the inputs are equal, otherwise `false`.

**Examples:**
```ts
import { safeCompare } from "@catbee/utils";

safeCompare('abc', 'abc'); // true
```

---

### `encrypt()`
Encrypt data using AES.

**Method Signature:**
```ts
function encrypt(data: string | Buffer, key: string | Buffer, options?: EncryptionOptions): Promise<EncryptionResult>
```

**Parameters:**
- `data`: The data to encrypt (string or Buffer).
- `key`: The encryption key (string or Buffer).
- `options`: Optional encryption options.
  - `algorithm`: The encryption algorithm (default is 'aes-256-gcm').
  - `inputEncoding`: The encoding of the input data (default is 'utf8').
  - `outputEncoding`: The encoding of the output ciphertext (default is 'base64')

**Returns:**
- A Promise that resolves to the encryption result.

**Examples:**
```ts
import { encrypt, EncryptionResult } from "@catbee/utils";

const encrypted = await encrypt('secret', 'password');
```

---

### `decrypt()`
Decrypt AES encrypted data.

**Method Signature:**
```ts
function decrypt(encryptedData: EncryptionResult, key: string | Buffer, options?: DecryptionOptions): Promise<string | Buffer>
```

**Parameters:**
- `encryptedData`: The encrypted data to decrypt (as returned by `encrypt`).
- `key`: The decryption key (string or Buffer).
- `options`: Optional decryption options.
  - `algorithm`: The decryption algorithm (default is 'aes-256-gcm').
  - `inputEncoding`: The encoding of the input ciphertext (default is 'base64').
  - `outputEncoding`: The encoding of the output data (default is 'utf8').

**Returns:**
- A Promise that resolves to the decrypted data (string or Buffer).

**Examples:**
```ts
import { decrypt, EncryptionResult } from "@catbee/utils";

const decrypted = await decrypt(encrypted, 'password');
```

---

### `createSignedToken()`
Create a signed token (JWT-like).

**Method Signature:**
```ts
function createSignedToken(payload: object, secret: string, expiresInSeconds?: number): string
```

**Parameters:**
- `payload`: The payload to include in the token.
- `secret`: The secret key to sign the token.
- `expiresInSeconds`: Optional expiration time in seconds.

**Returns:**
- A signed token as a string.

**Examples:**
```ts
import { createSignedToken } from "@catbee/utils";

const token = createSignedToken({ userId: 1 }, 'secret', 3600);
```

---

### `verifySignedToken()`
Verify and decode a signed token.

**Method Signature:**
```ts
function verifySignedToken(token: string, secret: string): object | null
```

**Parameters:**
- `token`: The signed token to verify.
- `secret`: The secret key used to sign the token.

**Returns:**
- The decoded payload if the token is valid, otherwise `null`.

**Examples:**
```ts
import { verifySignedToken } from "@catbee/utils";

const payload = verifySignedToken(token, 'secret');
```

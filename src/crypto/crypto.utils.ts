import {
  createHmac,
  createHash,
  BinaryToTextEncoding,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scrypt,
  timingSafeEqual,
  pbkdf2,
  webcrypto as nodeWebcrypto
} from 'node:crypto';
import type { CipherGCMTypes } from 'node:crypto';
import { promisify } from 'node:util';
import { uuid } from '@catbee/utils/id';

// Promisified version of pbkdf2 for key derivation
const pbkdf2Async = promisify(pbkdf2);
// Promisified version of scrypt for key derivation
const scryptAsync = promisify<string | Buffer, string | Buffer, number, Buffer>(scrypt);

export type BufferEncoding =
  | 'ascii'
  | 'utf8'
  | 'utf-8'
  | 'utf16le'
  | 'utf-16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'base64url'
  | 'latin1'
  | 'binary'
  | 'hex';

/**
 * Generates an HMAC digest using the specified algorithm and secret key.
 *
 * @param {string} algorithm - The hashing algorithm (e.g., 'sha256', 'sha1').
 * @param {string} input - The string to hash.
 * @param {string} secret - The secret key for HMAC.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding ('hex', 'base64', etc).
 * @returns {string} HMAC digest as a string.
 */
export function hmac(algorithm: string, input: string, secret: string, encoding: BinaryToTextEncoding = 'hex'): string {
  return createHmac(algorithm, secret).update(input).digest(encoding);
}

/**
 * Generates a hash digest using the specified algorithm.
 *
 * @param {string} algorithm - The hashing algorithm (e.g., 'sha256', 'md5').
 * @param {string} input - The string to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding ('hex', 'base64', etc).
 * @returns {string} Hash digest as a string.
 */
export function hash(algorithm: string, input: string, encoding: BinaryToTextEncoding = 'hex'): string {
  return createHash(algorithm).update(input).digest(encoding);
}

/**
 * Generates an HMAC-SHA256 digest.
 *
 * @param {string} input - The string to hash.
 * @param {string} secret - The secret key.
 * @returns {string} SHA-256 HMAC digest as a string.
 */
export function sha256Hmac(input: string, secret: string): string {
  return hmac('sha256', input, secret);
}

/**
 * Generates a SHA1 hash digest.
 *
 * @param {string} input - The string to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding.
 * @returns {string} SHA-1 hash as a string.
 */
export function sha1(input: string, encoding: BinaryToTextEncoding = 'hex'): string {
  return hash('sha1', input, encoding);
}

/**
 * Generates a SHA256 hash digest.
 *
 * @param {string} input - The string to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding.
 * @returns {string} SHA-256 hash as a string.
 */
export function sha256(input: string, encoding: BinaryToTextEncoding = 'hex'): string {
  return hash('sha256', input, encoding);
}

/**
 * Generates an MD5 hash digest.
 *
 * @param {string} input - The string to hash.
 * @returns {string} MD5 hash as a string.
 */
export function md5(input: string): string {
  return hash('md5', input);
}

/**
 * Supported asymmetric key types for generation.
 *
 * - `RSA`       → RSASSA-PKCS1-v1_5 (legacy compatibility)
 * - `RSA-PSS`   → Recommended RSA variant with modern padding
 * - `ECDSA`     → Elliptic Curve (fast, smaller keys)
 * - `Ed25519`   → Modern, simple, highly secure (recommended)
 */
export type EncKeyType = 'RSA' | 'RSA-PSS' | 'ECDSA' | 'Ed25519';

/**
 * Options to configure key pair generation.
 */
export interface GenerateKeyOptions {
  /**
   * Type of key algorithm to generate.
   * @default 'RSA-PSS'
   */
  type?: EncKeyType;

  /**
   * RSA modulus length in bits.
   * Recommended: 2048 or 3072 (4096 for high security).
   * @default 2048
   */
  modulusLength?: number;

  /**
   * Hash algorithm used for signing.
   *
   * ⚠️ For ECDSA, hash is used during sign/verify, not key generation.
   * @default 'SHA-256'
   */
  hash?: 'SHA-256' | 'SHA-384' | 'SHA-512';

  /**
   * Named curve for ECDSA keys.
   * @default 'P-256'
   */
  namedCurve?: 'P-256' | 'P-384' | 'P-521';

  /**
   * Whether the private key can be exported.
   *
   * ⚠️ Set to `false` in production if you don't need to export keys.
   * @default false
   */
  extractable?: boolean;

  /**
   * Whether to include generated CryptoKey objects in the result.
   *
   * Useful when private key export is disabled (`extractable: false`) but
   * you still want to sign/verify with the in-memory keys.
   * @default false
   */
  includeCryptoKeys?: boolean;

  /**
   * Whether to format Base64 output into 64-character lines (PEM style).
   * @default true
   */
  formatPemLines?: boolean;

  /**
   * Whether to include PEM prefix/suffix headers.
   *
   * Example:
   * -----BEGIN PRIVATE KEY-----
   * -----END PRIVATE KEY-----
   *
   * @default true
   */
  addPrefixSuffix?: boolean;
}

/**
 * Result object returned from {@link generateKeys}
 */
export interface GenerateKeyResult {
  /** Algorithm type used */
  type: EncKeyType;

  /** PEM or Base64 encoded private key (only when extractable is true) */
  privateKey?: string;

  /** PEM or Base64 encoded public key */
  publicKey: string;

  /** Raw PKCS8 private key buffer (only when extractable is true) */
  privateKeyBuffer?: ArrayBuffer;

  /** Raw SPKI public key buffer */
  publicKeyBuffer: ArrayBuffer;

  /** Optional generated private CryptoKey */
  privateKeyCrypto?: CryptoKey;

  /** Optional generated public CryptoKey */
  publicKeyCrypto?: CryptoKey;
}

export type SupportedAlgorithm = RsaHashedKeyGenParams | EcKeyGenParams | { name: 'Ed25519' };

export type SignatureEncoding = 'base64' | 'base64url' | 'hex';

export interface SignatureOptions {
  /**
   * Hash algorithm used for ECDSA signatures.
   *
   * ⚠️ For ECDSA, hash is used during sign/verify, not key generation.
   * @default 'SHA-256'
   */
  hash?: 'SHA-256' | 'SHA-384' | 'SHA-512';

  /**
   * Salt length for RSA-PSS signatures.
   * Defaults to the digest length of the configured hash.
   */
  saltLength?: number;

  /**
   * Output encoding for generated signatures.
   * @default 'base64url'
   */
  outputEncoding?: SignatureEncoding;

  /**
   * Input encoding when the payload is a string.
   * @default 'utf8'
   */
  inputEncoding?: BufferEncoding;
}

export interface VerifyOptions extends Omit<SignatureOptions, 'outputEncoding'> {
  /**
   * Encoding of the provided signature when it is a string.
   * @default 'base64url'
   */
  signatureEncoding?: SignatureEncoding;
}

export interface ImportKeyOptions {
  /**
   * Explicit key type. Required for PEM import when the algorithm cannot be inferred.
   */
  type?: EncKeyType;

  /**
   * Hash algorithm used with RSA and ECDSA operations.
   *
   * ⚠️ For ECDSA, hash is used during sign/verify, not key generation.
   * @default 'SHA-256'
   */
  hash?: 'SHA-256' | 'SHA-384' | 'SHA-512';

  /**
   * Named curve for ECDSA keys.
   * @default 'P-256'
   */
  namedCurve?: 'P-256' | 'P-384' | 'P-521';

  /**
   * Whether the imported key can be exported.
   * @default false
   */
  extractable?: boolean;

  /**
   * Allowed operations for the imported key.
   * Defaults to `['sign']` for private keys and `['verify']` for public keys.
   */
  usages?: Array<'sign' | 'verify'>;
}

export interface ExportKeyOptions {
  /**
   * Whether to format Base64 output into 64-character lines (PEM style).
   * @default true
   */
  formatPemLines?: boolean;

  /**
   * Whether to include PEM prefix/suffix headers.
   * @default true
   */
  addPrefixSuffix?: boolean;
}

interface ResolveKeyAlgorithmOptions extends ImportKeyOptions {
  modulusLength?: number;
}

const DEFAULT_SIGNATURE_ENCODING: SignatureEncoding = 'base64url';
const subtle: SubtleCrypto = globalThis.crypto?.subtle ?? nodeWebcrypto.subtle;

function getDigestLength(hash: NonNullable<GenerateKeyOptions['hash']>): number {
  switch (hash) {
    case 'SHA-256':
      return 32;
    case 'SHA-384':
      return 48;
    case 'SHA-512':
      return 64;
    default:
      return 32;
  }
}

function resolveKeyAlgorithm({
  type = 'RSA-PSS',
  modulusLength = 2048,
  hash = 'SHA-256',
  namedCurve = 'P-256'
}: ResolveKeyAlgorithmOptions): SupportedAlgorithm {
  switch (type) {
    case 'RSA':
      if (!Number.isInteger(modulusLength) || modulusLength < 2048) {
        throw new Error('RSA modulusLength must be an integer greater than or equal to 2048');
      }
      return {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash
      };

    case 'RSA-PSS':
      if (!Number.isInteger(modulusLength) || modulusLength < 2048) {
        throw new Error('RSA-PSS modulusLength must be an integer greater than or equal to 2048');
      }
      return {
        name: 'RSA-PSS',
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash
      };

    case 'ECDSA':
      return {
        name: 'ECDSA',
        namedCurve
      };

    case 'Ed25519':
      return {
        name: 'Ed25519'
      };

    default:
      throw new Error(`Unsupported key type: ${type}. Supported types: RSA, RSA-PSS, ECDSA, Ed25519`);
  }
}

function toBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function toPEM(base64: string, type: string, formatPemLines: boolean, addPrefixSuffix: boolean): string {
  const formattedBase64 = formatPemLines ? (base64.match(/.{1,64}/g)?.join('\n') ?? base64) : base64;

  if (!addPrefixSuffix) {
    return formattedBase64;
  }

  const prefix = `-----BEGIN ${type}-----`;
  const suffix = `-----END ${type}-----`;

  return `${prefix}\n${formattedBase64}\n${suffix}`;
}

function fromPEM(pem: string): { format: 'pkcs8' | 'spki'; binary: ArrayBuffer } {
  const trimmedPem = pem.trim();
  const format = trimmedPem.includes('BEGIN PRIVATE KEY')
    ? 'pkcs8'
    : trimmedPem.includes('BEGIN PUBLIC KEY')
      ? 'spki'
      : undefined;

  if (!format) {
    throw new Error('Unsupported PEM format. Expected PUBLIC KEY or PRIVATE KEY PEM block');
  }

  const base64 = trimmedPem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  return {
    format,
    binary: toArrayBuffer(Buffer.from(base64, 'base64'))
  };
}

function toBinary(data: string | Buffer | Uint8Array, encoding: BufferEncoding = 'utf8'): Uint8Array {
  if (typeof data === 'string') {
    return Uint8Array.from(Buffer.from(data, encoding));
  }

  if (Buffer.isBuffer(data)) {
    return Uint8Array.from(data);
  }

  return data;
}

function toArrayBuffer(data: Uint8Array | Buffer): ArrayBuffer {
  const byteView = data instanceof Uint8Array ? data : Uint8Array.from(data);
  const copy = new Uint8Array(byteView.byteLength);
  copy.set(byteView);
  return copy.buffer;
}

function inferKeyTypeFromJwk(jwk: JsonWebKey, fallback?: EncKeyType): EncKeyType {
  if (fallback) {
    return fallback;
  }

  const keyType = typeof jwk.kty === 'string' ? jwk.kty : undefined;
  const curve = typeof jwk.crv === 'string' ? jwk.crv : undefined;
  const algorithm = typeof jwk.alg === 'string' ? jwk.alg : undefined;

  if (keyType === 'OKP' && curve === 'Ed25519') {
    return 'Ed25519';
  }

  if (keyType === 'EC') {
    return 'ECDSA';
  }

  if (keyType === 'RSA') {
    return algorithm?.startsWith('PS') ? 'RSA-PSS' : 'RSA';
  }

  throw new Error('Unable to infer key type from JWK. Provide import options with an explicit type');
}

function resolveDefaultUsages(format: 'pkcs8' | 'spki', usages?: Array<'sign' | 'verify'>): Array<'sign' | 'verify'> {
  return usages ?? (format === 'pkcs8' ? ['sign'] : ['verify']);
}

function inferJwkUsages(jwk: JsonWebKey, usages?: Array<'sign' | 'verify'>): Array<'sign' | 'verify'> {
  if (usages) {
    return usages;
  }

  if (Array.isArray(jwk.key_ops)) {
    const inferredFromKeyOps = jwk.key_ops.filter(
      (usage): usage is 'sign' | 'verify' => usage === 'sign' || usage === 'verify'
    );

    if (inferredFromKeyOps.length === 0) {
      throw new Error('JWK key_ops must include at least one of sign or verify when provided');
    }

    return inferredFromKeyOps;
  }

  // Private JWKs include `d`; public-only JWKs do not.
  if (typeof jwk.d === 'string' && jwk.d.length > 0) {
    return ['sign'];
  }

  return ['verify'];
}

function resolveSignAlgorithm(
  key: CryptoKey,
  options: SignatureOptions = {}
): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
  const hash = options.hash ?? 'SHA-256';

  switch (key.algorithm.name) {
    case 'RSASSA-PKCS1-v1_5':
      return 'RSASSA-PKCS1-v1_5';
    case 'RSA-PSS': {
      const keyAlgorithm = key.algorithm as RsaHashedKeyAlgorithm;
      const pssHash = (options.hash ?? keyAlgorithm.hash.name) as NonNullable<GenerateKeyOptions['hash']>;
      return {
        name: 'RSA-PSS',
        saltLength: options.saltLength ?? getDigestLength(pssHash)
      };
    }
    case 'ECDSA':
      return {
        name: 'ECDSA',
        hash
      };
    case 'Ed25519':
      return 'Ed25519';
    default:
      throw new Error(`Unsupported signing key algorithm: ${key.algorithm.name}`);
  }
}

function arrayBufferToBuffer(buffer: ArrayBuffer): Buffer {
  return Buffer.from(buffer);
}

/**
 * Generates an asymmetric cryptographic key pair using Web Crypto API.
 *
 * Supports RSA, RSA-PSS, ECDSA, and Ed25519.
 *
 * @param options - Configuration for key generation
 *
 * @returns Promise resolving to generated key pair (PEM + raw buffers)
 *
 * @example
 * ```ts
 * const keys = await generateKeys({
 *   type: 'RSA-PSS',
 *   modulusLength: 2048
 * });
 *
 * console.log(keys.publicKey);
 * ```
 *
 * @example
 * ```ts
 * const keys = await generateKeys({
 *   type: 'Ed25519',
 *   extractable: false
 * });
 * ```
 *
 * @remarks
 * - Uses `crypto.subtle.generateKey`
 * - Private key is exported in PKCS#8 format
 * - Public key is exported in SPKI format
 * - Ed25519 requires modern runtime support (Node 18+, modern browsers)
 *
 * ⚠️ Security Notes:
 * - Avoid logging private keys in production
 * - Prefer `extractable: false` when possible
 * - Store keys securely (e.g., KMS, HSM)
 */
export async function generateKeys(options: GenerateKeyOptions = {}): Promise<GenerateKeyResult> {
  const {
    type = 'RSA-PSS',
    modulusLength = 2048,
    hash = 'SHA-256',
    namedCurve = 'P-256',
    extractable = false,
    includeCryptoKeys = false,
    formatPemLines = true,
    addPrefixSuffix = true
  } = options;

  const algorithm = resolveKeyAlgorithm({ type, modulusLength, hash, namedCurve });
  const usages: KeyUsage[] = ['sign', 'verify'];

  /**
   * Generate key pair using Web Crypto API.
   */
  const keyPair = (await subtle.generateKey(algorithm, extractable, usages)) as CryptoKeyPair;

  /**
   * Export keys:
   * - Private → PKCS#8
   * - Public  → SPKI
   */
  const [publicKeyBuf, privateKeyBuf] = await Promise.all([
    subtle.exportKey('spki', keyPair.publicKey),
    extractable ? subtle.exportKey('pkcs8', keyPair.privateKey) : Promise.resolve(undefined)
  ]);

  const publicKeyBase64 = toBase64(publicKeyBuf);
  const privateKeyBase64 = privateKeyBuf ? toBase64(privateKeyBuf) : undefined;

  const result: GenerateKeyResult = {
    type,
    publicKey: toPEM(publicKeyBase64, 'PUBLIC KEY', formatPemLines, addPrefixSuffix),
    publicKeyBuffer: publicKeyBuf
  };

  if (privateKeyBase64 && privateKeyBuf) {
    result.privateKey = toPEM(privateKeyBase64, 'PRIVATE KEY', formatPemLines, addPrefixSuffix);
    result.privateKeyBuffer = privateKeyBuf;
  }

  if (includeCryptoKeys) {
    result.privateKeyCrypto = keyPair.privateKey;
    result.publicKeyCrypto = keyPair.publicKey;
  }

  return result;
}

/**
 * Signs data with a private key generated or imported through Web Crypto.
 * ⚠️ ECDSA signatures are DER-encoded.
 * Some systems (e.g., JWT ES256, blockchain) require raw (r || s) format.
 * Conversion may be required depending on the consumer.
 */
export async function sign(
  data: string | Buffer | Uint8Array,
  privateKeyCrypto: CryptoKey,
  options: SignatureOptions = {}
): Promise<string> {
  const algorithm = resolveSignAlgorithm(privateKeyCrypto, options);
  const signature = await subtle.sign(
    algorithm,
    privateKeyCrypto,
    toArrayBuffer(toBinary(data, options.inputEncoding))
  );
  return arrayBufferToBuffer(signature).toString(options.outputEncoding ?? DEFAULT_SIGNATURE_ENCODING);
}

/**
 * Verifies a signature with a public key generated or imported through Web Crypto.
 */
export async function verify(
  data: string | Buffer | Uint8Array,
  signature: string | Buffer | Uint8Array,
  publicKeyCrypto: CryptoKey,
  options: VerifyOptions = {}
): Promise<boolean> {
  const algorithm = resolveSignAlgorithm(publicKeyCrypto, options);
  const signatureBytes =
    typeof signature === 'string'
      ? Uint8Array.from(Buffer.from(signature, options.signatureEncoding ?? DEFAULT_SIGNATURE_ENCODING))
      : toBinary(signature);

  return subtle.verify(
    algorithm,
    publicKeyCrypto,
    toArrayBuffer(signatureBytes),
    toArrayBuffer(toBinary(data, options.inputEncoding))
  );
}

/**
 * Imports a PEM or JWK asymmetric key into Web Crypto.
 */
export async function importKey(key: string | JsonWebKey, options: ImportKeyOptions = {}): Promise<CryptoKey> {
  const extractable = options.extractable ?? false;

  if (typeof key === 'string') {
    if (!options.type) {
      throw new Error('Key type is required when importing PEM keys');
    }

    const { format, binary } = fromPEM(key);
    const algorithm = resolveKeyAlgorithm({
      type: options.type,
      hash: options.hash,
      namedCurve: options.namedCurve
    });

    return subtle.importKey(format, binary, algorithm, extractable, resolveDefaultUsages(format, options.usages));
  }

  const keyType = inferKeyTypeFromJwk(key, options.type);
  const algorithm = resolveKeyAlgorithm({
    type: keyType,
    hash: options.hash,
    namedCurve: options.namedCurve
  });
  return subtle.importKey('jwk', key, algorithm, extractable, inferJwkUsages(key, options.usages));
}

/**
 * Exports an asymmetric CryptoKey as JWK or PEM.
 */
export async function exportKey(
  key: CryptoKey,
  format: 'jwk' | 'pem' = 'jwk',
  options: ExportKeyOptions = {}
): Promise<JsonWebKey | string> {
  if (format === 'jwk') {
    return subtle.exportKey('jwk', key);
  }

  const binary = key.type === 'private' ? await subtle.exportKey('pkcs8', key) : await subtle.exportKey('spki', key);

  return toPEM(
    toBase64(binary),
    key.type === 'private' ? 'PRIVATE KEY' : 'PUBLIC KEY',
    options.formatPemLines ?? true,
    options.addPrefixSuffix ?? true
  );
}

/**
 * Produces a stable SHA-256 fingerprint for a public key.
 */
export async function fingerprint(publicKey: CryptoKey, encoding: SignatureEncoding = 'base64url'): Promise<string> {
  if (publicKey.type !== 'public') {
    throw new Error('fingerprint requires a public key');
  }

  const spki = await subtle.exportKey('spki', publicKey);
  return createHash('sha256').update(arrayBufferToBuffer(spki)).digest(encoding);
}

/**
 * Generates a unique identifier for a public key by computing its fingerprint.
 */
export async function getKeyId(publicKey: CryptoKey): Promise<string> {
  return fingerprint(publicKey, 'base64url');
}

/**
 * Generates a cryptographically strong random string by hashing a random UUID with SHA-256.
 *
 * @returns {string} Random string hashed with SHA-256 (hex encoding).
 */
export function randomString(): string {
  return sha256(uuid());
}

/**
 * Generates a secure random buffer of specified byte length.
 *
 * @param {number} [byteLength=32] - Number of random bytes to generate.
 * @returns {Buffer} Buffer containing random bytes.
 */
export function generateRandomBytes(byteLength: number = 32): Buffer {
  return randomBytes(byteLength);
}

/**
 * Generates a secure random string of specified byte length with specified encoding.
 *
 * @param {number} [byteLength=32] - Number of random bytes to generate.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding.
 * @returns {string} Random string in specified encoding.
 */
export function generateRandomBytesAsString(byteLength: number = 32, encoding: BinaryToTextEncoding = 'hex'): string {
  return randomBytes(byteLength).toString(encoding);
}

/**
 * Generates a secure API key with a specified format.
 *
 * @param {string} [prefix=''] - Optional prefix for the key.
 * @param {number} [byteLength=24] - Number of random bytes to generate.
 * @returns {string} Formatted API key.
 */
export function generateApiKey(prefix: string = '', byteLength: number = 24): string {
  const randomString = generateRandomBytesAsString(byteLength, 'base64');
  const key = randomString
    .replace(/[+/=]/g, '') // Remove non-URL-safe characters
    .substring(0, 32); // Limit length

  return prefix ? `${prefix}_${key}` : key;
}

/**
 * Compares two strings, arrays, or buffers in constant time to prevent timing attacks.
 *
 * @param {string | Buffer | Uint8Array} a - First value to compare
 * @param {string | Buffer | Uint8Array} b - Second value to compare
 * @returns {boolean} True if values are equal
 */
export function safeCompare(a: string | Buffer | Uint8Array, b: string | Buffer | Uint8Array): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    // Convert strings to buffers
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    // Compare lengths first (not constant time, but prevents timing attack on contents)
    if (bufA.length !== bufB.length) return false;

    return timingSafeEqual(bufA, bufB);
  } else if ((a instanceof Buffer || a instanceof Uint8Array) && (b instanceof Buffer || b instanceof Uint8Array)) {
    // Compare lengths first
    if (a.length !== b.length) return false;

    return timingSafeEqual(a instanceof Buffer ? a : Buffer.from(a), b instanceof Buffer ? b : Buffer.from(b));
  }

  throw new Error('Cannot compare: inputs must be strings, Buffers, or Uint8Arrays');
}

/**
 * Interface for encryption options
 */
export interface EncryptionOptions {
  /** Algorithm to use (default: aes-256-gcm) */
  algorithm?: CipherGCMTypes;
  /** Input encoding for plaintext if string (default: utf8) */
  inputEncoding?: BufferEncoding;
  /** Output encoding for ciphertext (default: hex) */
  outputEncoding?: BinaryToTextEncoding;
}

/**
 * Interface for decryption options
 */
export interface DecryptionOptions {
  /** Algorithm to use (default: aes-256-gcm) */
  algorithm?: CipherGCMTypes;
  /** Input encoding for ciphertext if string (default: hex) */
  inputEncoding?: BinaryToTextEncoding;
  /** Output encoding for plaintext (default: utf8) */
  outputEncoding?: BufferEncoding;
}

/**
 * Result of encryption operation including all data needed for decryption
 */
export interface EncryptionResult {
  /** Encrypted data (string or Buffer based on options) */
  ciphertext: string | Buffer;
  /** Initialization vector */
  iv: Buffer;
  /** Authentication tag (for GCM mode) */
  authTag?: Buffer;
  /** Algorithm used */
  algorithm: string;
  /** Salt used for key derivation */
  salt: Buffer;
}

/**
 * Encrypts data using a symmetric key with secure defaults (AES-256-GCM).
 *
 * @param {string | Buffer} data - Data to encrypt
 * @param {string | Buffer} key - Encryption key or passphrase
 * @param {EncryptionOptions} [options] - Encryption options
 * @returns {Promise<EncryptionResult>} Encrypted data with metadata
 */
export async function encrypt(
  data: string | Buffer,
  key: string | Buffer,
  options: EncryptionOptions = {}
): Promise<EncryptionResult> {
  const algorithm = options.algorithm || 'aes-256-gcm';
  const inputEncoding = options.inputEncoding || 'utf8';
  const outputEncoding = options.outputEncoding || 'hex';

  // Generate a random IV
  const iv = randomBytes(16);

  // Derive key using scrypt if key is a string (passphrase)
  const salt = randomBytes(8);
  const derivedKey = typeof key === 'string' ? await scryptAsync(key, salt, 32) : key;

  // Create cipher
  const cipher = createCipheriv(algorithm, derivedKey, iv);

  // Encrypt the data
  let ciphertext: string | Buffer;

  if (typeof data === 'string') {
    ciphertext = cipher.update(data, inputEncoding, outputEncoding as BufferEncoding);
    ciphertext += cipher.final(outputEncoding as BufferEncoding);
  } else {
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    ciphertext = outputEncoding ? encrypted.toString(outputEncoding) : encrypted;
  }

  // Get authentication tag if using GCM mode
  const authTag = algorithm.includes('gcm') ? (cipher as any).getAuthTag() : undefined;

  return {
    ciphertext,
    iv,
    authTag,
    algorithm,
    salt
  };
}

/**
 * Decrypts data that was encrypted with the encrypt function.
 *
 * @param {EncryptionResult} encryptedData - The encrypted data and metadata
 * @param {string | Buffer} key - Decryption key or passphrase
 * @param {DecryptionOptions} [options] - Decryption options
 * @returns {Promise<string | Buffer>} Decrypted data
 */
export async function decrypt(
  encryptedData: EncryptionResult,
  key: string | Buffer,
  options: DecryptionOptions = {}
): Promise<string | Buffer> {
  const algorithm = options.algorithm || encryptedData.algorithm || 'aes-256-gcm';
  const inputEncoding = options.inputEncoding || 'hex';
  const outputEncoding = options.outputEncoding || 'utf8';

  // Derive key using scrypt if key is a string (passphrase)
  const derivedKey = typeof key === 'string' ? await scryptAsync(key, encryptedData.salt, 32) : key;

  // Create decipher
  const decipher = createDecipheriv(algorithm, derivedKey, encryptedData.iv);

  // Set auth tag if using GCM mode
  if (encryptedData.authTag && algorithm.includes('gcm')) {
    (decipher as any).setAuthTag(encryptedData.authTag);
  }

  // Decrypt the data
  let decrypted: string | Buffer;

  if (typeof encryptedData.ciphertext === 'string') {
    decrypted = decipher.update(encryptedData.ciphertext, inputEncoding as BufferEncoding, outputEncoding);
    decrypted += decipher.final(outputEncoding);
  } else {
    const result = Buffer.concat([decipher.update(encryptedData.ciphertext), decipher.final()]);
    decrypted = outputEncoding ? result.toString(outputEncoding) : result;
  }

  return decrypted;
}

/**
 * Creates a signed token with an expiration time and payload.
 *
 * @param {object} payload - Data to include in the token
 * @param {string} secret - Secret key for signing
 * @param {number} [expiresInSeconds=3600] - Token expiration in seconds
 * @returns {string} Signed token string
 */
export function createSignedToken(
  payload: Record<string, any>,
  secret: string,
  expiresInSeconds: number = 3600
): string {
  // Create payload with expiration
  const tokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };

  // Convert to string
  const payloadStr = JSON.stringify(tokenPayload);

  // Base64 encode the payload
  const base64Payload = Buffer.from(payloadStr).toString('base64url');

  // Create signature
  const signature = hmac('sha256', base64Payload, secret, 'base64url');

  // Combine payload and signature
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes a signed token.
 *
 * @param {string} token - The token to verify
 * @param {string} secret - Secret key for verification
 * @returns {object | null} Decoded payload if valid, null if invalid
 */
export function verifySignedToken(token: string, secret: string): Record<string, any> | null {
  try {
    // Split token into parts
    const [payloadB64, signature] = token.split('.');

    if (!payloadB64 || !signature) return null;

    // Verify signature
    const expectedSignature = hmac('sha256', payloadB64, secret, 'base64url');
    if (!safeCompare(signature, expectedSignature)) return null;

    // Decode payload
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Derives a cryptographic key using PBKDF2 (SHA-256).
 *
 * @param password - Password to derive key from
 * @param salt - Cryptographic salt (use unique per password)
 * @param keyLength - Output key length in bytes (default 32)
 * @param iterations - Number of hashing iterations (default 310000, OWASP recommended)
 * @returns Derived key as Buffer
 *
 * @example
 * const key = await pbkdf2Hash('myPassword', 'mySalt');
 */
export async function pbkdf2Hash(
  password: string,
  salt: string | Buffer,
  keyLength = 32,
  iterations = 310_000
): Promise<Buffer> {
  return pbkdf2Async(password, salt, iterations, keyLength, 'sha256') as Promise<Buffer>;
}

/**
 * Generates a cryptographically secure nonce (number used once).
 *
 * @param {number} [byteLength=16] - Length of nonce in bytes.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding.
 * @returns {string} Nonce string.
 *
 * @example
 * const nonce = generateNonce(16, 'base64'); // Random nonce
 */
export function generateNonce(byteLength: number = 16, encoding: BinaryToTextEncoding = 'hex'): string {
  return randomBytes(byteLength).toString(encoding);
}

/**
 * Generates a cryptographically secure random integer in a range.
 *
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (inclusive).
 * @returns {number} Random integer.
 *
 * @example
 * const random = secureRandomInt(1, 100); // Random number 1-100
 */
export function secureRandomInt(min: number, max: number): number {
  if (min > max) throw new Error('min must be less than or equal to max');
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range;

  let randomValue: number;
  do {
    const bytes = randomBytes(bytesNeeded);
    randomValue = bytes.reduce((acc, byte, i) => acc + byte * 256 ** i, 0);
  } while (randomValue >= maxValid);

  return min + (randomValue % range);
}

/**
 * Hashes a password using scrypt (memory-hard function).
 *
 * @param {string} password - The password to hash.
 * @param {number} [saltLength=16] - Length of salt in bytes.
 * @param {number} [keyLength=32] - Length of derived key.
 * @returns {Promise<string>} Hash string containing salt and key.
 *
 * @example
 * const hash = await hashPassword('myPassword');
 * // Returns format: salt:hash (both base64)
 */
export async function hashPassword(password: string, saltLength: number = 16, keyLength: number = 32): Promise<string> {
  const salt = randomBytes(saltLength);
  const scryptAsync = promisify(scrypt);
  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
  return `${salt.toString('base64')}:${derivedKey.toString('base64')}`;
}

/**
 * Verifies a password against a scrypt hash.
 *
 * @param {string} password - The password to verify.
 * @param {string} hash - The hash to verify against (from hashPassword).
 * @returns {Promise<boolean>} True if password matches.
 *
 * @example
 * const isValid = await verifyPassword('myPassword', storedHash);
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltB64, keyB64] = hash.split(':');
    if (!saltB64 || !keyB64) return false;

    const salt = Buffer.from(saltB64, 'base64');
    const key = Buffer.from(keyB64, 'base64');

    const scryptAsync = promisify(scrypt);
    const derivedKey = (await scryptAsync(password, salt, key.length)) as Buffer;

    return timingSafeEqual(key, derivedKey);
  } catch {
    return false;
  }
}

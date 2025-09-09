/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies. https://catbee-utils.npm.hprasath.com/license
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {
  createHmac,
  createHash,
  BinaryToTextEncoding,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scrypt,
  timingSafeEqual,
  CipherGCMTypes
} from 'crypto';
import { promisify } from 'util';
import { uuid } from './id.utils';

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
}

// Promisified version of scrypt for key derivation
const scryptAsync = promisify<string | Buffer, string | Buffer, number, Buffer>(scrypt);

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
  const derivedKey = typeof key === 'string' ? await scryptAsync(key, iv.slice(0, 8), 32) : key;

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
    algorithm
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
  const derivedKey = typeof key === 'string' ? await scryptAsync(key, encryptedData.iv.slice(0, 8), 32) : key;

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

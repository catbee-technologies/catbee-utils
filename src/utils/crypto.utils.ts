import {
  createHmac,
  createHash,
  BinaryToTextEncoding,
  randomUUID,
} from "crypto";

/**
 * Generates an HMAC digest using the specified algorithm and secret key.
 *
 * @param {string} algorithm - The hashing algorithm (e.g., 'sha256', 'sha1').
 * @param {string} input - The string to hash.
 * @param {string} secret - The secret key for HMAC.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding ('hex', 'base64', etc).
 * @returns {string} HMAC digest as a string.
 */
export const hmac = (
  algorithm: string,
  input: string,
  secret: string,
  encoding: BinaryToTextEncoding = "hex",
): string => {
  return createHmac(algorithm, secret).update(input).digest(encoding);
};

/**
 * Generates a hash digest using the specified algorithm.
 *
 * @param {string} algorithm - The hashing algorithm (e.g., 'sha256', 'md5').
 * @param {string} input - The string to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding ('hex', 'base64', etc).
 * @returns {string} Hash digest as a string.
 */
export const hash = (
  algorithm: string,
  input: string,
  encoding: BinaryToTextEncoding = "hex",
): string => {
  return createHash(algorithm).update(input).digest(encoding);
};

/**
 * Generates an HMAC-SHA256 digest.
 *
 * @param {string} input - The string to hash.
 * @param {string} secret - The secret key.
 * @returns {string} SHA-256 HMAC digest as a string.
 */
export const sha256Hmac = (input: string, secret: string): string => {
  return hmac("sha256", input, secret);
};

/**
 * Generates a SHA1 hash digest.
 *
 * @param {string} input - The string to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding.
 * @returns {string} SHA-1 hash as a string.
 */
export const sha1 = (
  input: string,
  encoding: BinaryToTextEncoding = "hex",
): string => {
  return hash("sha1", input, encoding);
};

/**
 * Generates a SHA256 hash digest.
 *
 * @param {string} input - The string to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - Output encoding.
 * @returns {string} SHA-256 hash as a string.
 */
export const sha256 = (
  input: string,
  encoding: BinaryToTextEncoding = "hex",
): string => {
  return hash("sha256", input, encoding);
};

/**
 * Generates an MD5 hash digest.
 *
 * @param {string} input - The string to hash.
 * @returns {string} MD5 hash as a string.
 */
export const md5 = (input: string): string => {
  return hash("md5", input);
};

/**
 * Generates a cryptographically strong random string by hashing a random UUID with SHA-256.
 *
 * @returns {string} Random string hashed with SHA-256 (hex encoding).
 */
export const randomString = (): string => {
  return sha256(randomUUID());
};

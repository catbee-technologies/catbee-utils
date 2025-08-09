import { randomUUID, randomBytes } from "crypto";

/**
 * Generates a UUID v4 string (RFC 4122).
 *
 * @returns {string} UUID v4 (e.g., 'c0de1234-5678-9abc-def0-123456789abc')
 */
export function uuid(): string {
  return randomUUID();
}

/**
 * Generates a nanoid-style random ID (URL-safe, customizable length).
 *
 * @param {number} length - Length of the ID (default: 21).
 * @returns {string} Nanoid-style random string.
 */
export function nanoId(length: number = 21): string {
  if (length <= 0) return "";
  let id = "";
  while (id.length < length) {
    id += randomBytes(Math.ceil((length * 3) / 4))
      .toString("base64url")
      .replace(/[+/=]/g, "");
  }
  return id.slice(0, length);
}

/**
 * Generates a cryptographically strong random hex string.
 *
 * @param {number} byteLength - Number of random bytes (default: 16 → 32 hex chars).
 * @returns {string} Random hex string.
 */
export function randomHex(byteLength: number = 16): string {
  // Use Node.js crypto for both Node and browser compatibility
  // Prefer randomBytes if available (Node), fallback to getRandomValues for browser (not used here)
  return randomBytes(byteLength)
    .toString("hex")
    .padStart(byteLength * 2, "0")
    .slice(0, byteLength * 2);
}

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 *
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} Random integer in range.
 */
export function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  return Math.floor(Math.random() * range) + min;
}

/**
 * Generates a cryptographically strong random base64 string.
 *
 * @param {number} byteLength - Number of random bytes (default: 16).
 * @returns {string} Random base64 string (URL-safe, no padding).
 */
export function randomBase64(byteLength: number = 16): string {
  return randomBytes(byteLength).toString("base64url");
}

import { randomUUID } from "crypto";
import { ulid } from "ulid";
import { nanoid } from "nanoid";

/**
 * Generates a UUID v4 string (RFC 4122).
 *
 * @returns {string} UUID v4 (e.g., 'c0de1234-5678-9abc-def0-123456789abc')
 */
export function uuid(): string {
  return randomUUID();
}

/**
 * Generates a ULID (Universally Unique Lexicographically Sortable Identifier).
 *
 * @returns {string} ULID string (26 chars, Crockford Base32, e.g., '01H7ZXS9FJKPX06P1AYZKCGHQF').
 */
export function ulidString(): string {
  return ulid();
}

/**
 * Generates a nanoid string (URL-friendly, collision-resistant, customizable size).
 *
 * @param {number} [size=21] - Number of characters for the ID (default: 21).
 * @returns {string} nanoid string.
 */
export function nanoId(size: number = 21): string {
  return nanoid(size);
}

/**
 * Generates a cryptographically strong random hex string.
 *
 * @param {number} byteLength - Number of random bytes (default: 16 → 32 hex chars).
 * @returns {string} Random hex string.
 */
export function randomHex(byteLength: number = 16): string {
  // Node: crypto.getRandomValues is not available; use randomBytes if needed.
  // If using browser target, replace this impl accordingly.
  return Buffer.from(crypto.getRandomValues(new Uint8Array(byteLength)))
    .toString("hex")
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

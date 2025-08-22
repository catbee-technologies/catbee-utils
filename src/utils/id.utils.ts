/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies
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

import { randomUUID, randomBytes } from 'crypto';

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
  if (length <= 0) return '';
  let id = '';
  while (id.length < length) {
    id += randomBytes(Math.ceil((length * 3) / 4))
      .toString('base64url')
      .replace(/[+/=]/g, '');
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
    .toString('hex')
    .padStart(byteLength * 2, '0')
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
  return randomBytes(byteLength).toString('base64url');
}

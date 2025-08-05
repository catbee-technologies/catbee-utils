import {
  createHmac,
  createHash,
  BinaryToTextEncoding,
  randomUUID,
} from "crypto";

/**
 * Utility class for generating cryptographic hashes, HMACs, and random strings.
 * All methods are stateless and can be used directly via static access.
 */
export class CryptoHelper {
  /**
   * Generates an HMAC digest using the specified algorithm, input string, and secret.
   *
   * @param algorithm - The hashing algorithm (e.g., 'sha256', 'sha1').
   * @param input - The string to hash.
   * @param secret - Secret key used for HMAC generation.
   * @param encoding - Output encoding (default is `'hex'`).
   * @returns HMAC digest as a string.
   */
  static hmac(
    algorithm: string,
    input: string,
    secret: string,
    encoding: BinaryToTextEncoding = "hex",
  ): string {
    return createHmac(algorithm, secret).update(input).digest(encoding);
  }

  /**
   * Generates a hash digest using the specified algorithm.
   *
   * @param algorithm - The hashing algorithm (e.g., 'sha256', 'md5').
   * @param input - The string to hash.
   * @param encoding - Output encoding (default is `'hex'`).
   * @returns Hash digest as a string.
   */
  static hash(
    algorithm: string,
    input: string,
    encoding: BinaryToTextEncoding = "hex",
  ): string {
    return createHash(algorithm).update(input).digest(encoding);
  }

  /**
   * Generates an HMAC-SHA256 digest.
   *
   * @param input - The string to hash.
   * @param secret - The secret key.
   * @returns SHA-256 HMAC digest as a string.
   */
  static sha256Hmac(input: string, secret: string): string {
    return this.hmac("sha256", input, secret);
  }

  /**
   * Generates a SHA1 hash digest.
   *
   * @param input - The string to hash.
   * @param encoding - Output encoding (default is `'hex'`).
   * @returns SHA-1 hash as a string.
   */
  static sha1(input: string, encoding: BinaryToTextEncoding = "hex"): string {
    return this.hash("sha1", input, encoding);
  }

  /**
   * Generates a SHA256 hash digest.
   *
   * @param input - The string to hash.
   * @param encoding - Output encoding (default is `'hex'`).
   * @returns SHA-256 hash as a string.
   */
  static sha256(input: string, encoding: BinaryToTextEncoding = "hex"): string {
    return this.hash("sha256", input, encoding);
  }

  /**
   * Generates an MD5 hash digest.
   *
   * @param input - The string to hash.
   * @returns MD5 hash as a string.
   */
  static md5(input: string): string {
    return this.hash("md5", input);
  }

  /**
   * Generates a SHA256 hash of a random UUID string.
   * Useful for creating cryptographically strong random tokens.
   *
   * @returns Random string hashed with SHA-256.
   */
  static randomString(): string {
    return this.sha256(randomUUID());
  }
}

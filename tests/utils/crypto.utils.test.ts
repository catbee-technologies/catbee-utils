import {
  hmac,
  hash,
  sha256Hmac,
  sha1,
  sha256,
  md5,
  generateKeys,
  sign,
  verify,
  importKey,
  exportKey,
  fingerprint,
  getKeyId,
  randomString,
  generateRandomBytes,
  generateRandomBytesAsString,
  generateApiKey,
  safeCompare,
  encrypt,
  decrypt,
  createSignedToken,
  verifySignedToken,
  pbkdf2Hash,
  generateNonce,
  secureRandomInt,
  hashPassword,
  verifyPassword
} from '../../src/crypto';
import { randomUUID } from 'node:crypto';

describe('CryptoUtils', () => {
  describe('hash', () => {
    it('produces expected sha256 hash in hex', () => {
      expect(hash('sha256', 'hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('produces expected sha256 hash in base64', () => {
      expect(hash('sha256', 'hello', 'base64')).toBe('LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=');
    });

    it('produces expected md5 hash', () => {
      expect(hash('md5', 'abcdef')).toBe('e80b5017098950fc58aad83c8c14978e');
    });

    it('throws if unknown algorithm', () => {
      expect(() => hash('no-such-algo', 'abc')).toThrow();
    });
  });

  describe('hmac', () => {
    it('generates correct HMAC for sha256, secret', () => {
      expect(hmac('sha256', 'payload', 'secret')).toBe(
        'b82fcb791acec57859b989b430a826488ce2e479fdf92326bd0a2e8375a42ba4'
      );
    });

    it('supports base64 encoding', () => {
      expect(hmac('sha256', 'stuff', 'key', 'base64')).toBe('AkYLKFGdkjVVb67YBy007wR0mJBb/7WTx/PiA/06dfg=');
    });

    it('is deterministic (same input yields same output)', () => {
      const sig1 = hmac('sha1', 'foo', 'bar');
      const sig2 = hmac('sha1', 'foo', 'bar');
      expect(sig1).toBe(sig2);
    });

    it('throws if invalid algo', () => {
      expect(() => hmac('nope', 'foo', 'bar')).toThrow();
    });
  });

  describe('sha256Hmac', () => {
    it('calculates using sha256 and hmac for input/secret', () => {
      const expected = hmac('sha256', 'abc', 'xyz');
      expect(sha256Hmac('abc', 'xyz')).toBe(expected);
    });
  });

  describe('sha1', () => {
    it('produces correct digest in hex', () => {
      expect(sha1('MyData')).toBe('f5384a033d0c581eddebf868a25d3203f3f484c8');
    });

    it('produces correct digest in base64', () => {
      expect(sha1('MyData', 'base64')).toBe('9ThKAz0MWB7d6/hool0yA/P0hMg=');
    });
  });

  describe('sha256', () => {
    it('produces correct digest in hex', () => {
      expect(sha256('HelloWorld')).toBe('872e4e50ce9990d8b041330c47c9ddd11bec6b503ae9386a99da8584e9bb12c4');
    });

    it('produces correct digest in base64', () => {
      expect(sha256('HelloWorld', 'base64')).toBe('hy5OUM6ZkNiwQTMMR8nd0Rvsa1A66ThqmdqFhOm7EsQ=');
    });
  });

  describe('md5', () => {
    it('produces expected MD5 hash as hex', () => {
      expect(md5('batman')).toBe('ec0e2603172c73a8b644bb9456c1ff6e');
    });
  });

  describe('asymmetric crypto helpers', () => {
    it('uses safe defaults when generateKeys is called without options', async () => {
      const keys = await generateKeys();

      expect(keys.type).toBe('RSA-PSS');
      expect(keys.privateKey).toBeUndefined();
      expect(keys.privateKeyBuffer).toBeUndefined();
      expect(keys.privateKeyCrypto).toBeUndefined();
      expect(keys.publicKeyCrypto).toBeUndefined();
      expect(keys.publicKey).toContain('BEGIN PUBLIC KEY');
    });

    it('signs and verifies data using generated Ed25519 keys', async () => {
      const keys = await generateKeys({ type: 'Ed25519', includeCryptoKeys: true });

      expect(keys.privateKeyCrypto).toBeDefined();
      expect(keys.publicKeyCrypto).toBeDefined();

      const signature = await sign('hello asymmetric crypto', keys.privateKeyCrypto!);
      const isValid = await verify('hello asymmetric crypto', signature, keys.publicKeyCrypto!);

      expect(typeof signature).toBe('string');
      expect(isValid).toBe(true);
    });

    it('signs and verifies binary payloads using hex signatures', async () => {
      const keys = await generateKeys({ type: 'Ed25519', includeCryptoKeys: true });
      const payload = Buffer.from('binary-payload');
      const signature = await sign(payload, keys.privateKeyCrypto!, { outputEncoding: 'hex' });

      expect(signature).toMatch(/^[0-9a-f]+$/i);

      const signatureBuffer = Buffer.from(signature, 'hex');
      await expect(verify(payload, signatureBuffer, keys.publicKeyCrypto!)).resolves.toBe(true);
    });

    it('exports and imports a public key as JWK', async () => {
      const keys = await generateKeys({ type: 'Ed25519', includeCryptoKeys: true });
      const jwk = await exportKey(keys.publicKeyCrypto!, 'jwk');
      const importedPublicKey = await importKey(jwk, { type: 'Ed25519', usages: ['verify'] });
      const signature = await sign('jwk-roundtrip', keys.privateKeyCrypto!);

      await expect(verify('jwk-roundtrip', signature, importedPublicKey)).resolves.toBe(true);
    });

    it('exports and imports a public key as PEM', async () => {
      const keys = await generateKeys({ type: 'RSA-PSS', includeCryptoKeys: true });
      const pem = await exportKey(keys.publicKeyCrypto!, 'pem');
      const importedPublicKey = await importKey(pem, { type: 'RSA-PSS', usages: ['verify'] });
      const signature = await sign('pem-roundtrip', keys.privateKeyCrypto!);

      await expect(verify('pem-roundtrip', signature, importedPublicKey)).resolves.toBe(true);
    });

    it('creates a stable fingerprint for the same public key', async () => {
      const keys = await generateKeys({ type: 'Ed25519', includeCryptoKeys: true });
      const fingerprintA = await fingerprint(keys.publicKeyCrypto!);
      const fingerprintB = await fingerprint(keys.publicKeyCrypto!);

      expect(fingerprintA).toBe(fingerprintB);
      expect(typeof fingerprintA).toBe('string');
      expect(fingerprintA.length).toBeGreaterThan(10);
    });

    it('generates key id from a public key', async () => {
      const keys = await generateKeys({ type: 'Ed25519', includeCryptoKeys: true });
      const keyId = await getKeyId(keys.publicKeyCrypto!);

      expect(typeof keyId).toBe('string');
      expect(keyId.length).toBeGreaterThan(10);
    });

    it('throws if fingerprint is called with a private key', async () => {
      const keys = await generateKeys({ type: 'Ed25519', includeCryptoKeys: true });
      await expect(fingerprint(keys.privateKeyCrypto as CryptoKey)).rejects.toThrow(
        'fingerprint requires a public key'
      );
    });

    it('throws for unsupported generateKeys type', async () => {
      await expect(generateKeys({ type: 'UNKNOWN' as any })).rejects.toThrow('Unsupported key type: UNKNOWN');
    });

    it('throws for invalid RSA modulus length', async () => {
      await expect(generateKeys({ type: 'RSA', modulusLength: 1024 })).rejects.toThrow(
        'RSA modulusLength must be an integer greater than or equal to 2048'
      );
      await expect(generateKeys({ type: 'RSA-PSS', modulusLength: 1024 })).rejects.toThrow(
        'RSA-PSS modulusLength must be an integer greater than or equal to 2048'
      );
    });

    it('signs and verifies using ECDSA defaults', async () => {
      const keys = await generateKeys({ type: 'ECDSA', includeCryptoKeys: true });
      const signature = await sign('ecdsa-default', keys.privateKeyCrypto!);
      await expect(verify('ecdsa-default', signature, keys.publicKeyCrypto!)).resolves.toBe(true);
    });

    it('throws when PEM import is missing explicit type', async () => {
      const keys = await generateKeys({ type: 'RSA-PSS', includeCryptoKeys: true });
      const pem = (await exportKey(keys.publicKeyCrypto!, 'pem')) as string;

      await expect(importKey(pem)).rejects.toThrow('Key type is required when importing PEM keys');
    });

    it('throws for invalid PEM blocks', async () => {
      await expect(importKey('not-a-pem', { type: 'RSA-PSS' })).rejects.toThrow(
        'Unsupported PEM format. Expected PUBLIC KEY or PRIVATE KEY PEM block'
      );
    });

    it('exports private key PEM without prefix/suffix and re-imports for signing', async () => {
      const keys = await generateKeys({ type: 'RSA-PSS', extractable: true, includeCryptoKeys: true });
      const privatePem = (await exportKey(keys.privateKeyCrypto!, 'pem', {
        formatPemLines: false,
        addPrefixSuffix: false
      })) as string;

      expect(privatePem).not.toContain('BEGIN PRIVATE KEY');
      expect(privatePem).not.toContain('\n');

      const fullPrivatePem = `-----BEGIN PRIVATE KEY-----\n${privatePem}\n-----END PRIVATE KEY-----`;
      const importedPrivate = await importKey(fullPrivatePem, { type: 'RSA-PSS' });
      const signature = await sign('private-pem-import', importedPrivate);

      await expect(verify('private-pem-import', signature, keys.publicKeyCrypto!)).resolves.toBe(true);
    });

    it('imports JWK without explicit type by inferring RSA and verifies signature', async () => {
      const keys = await generateKeys({ type: 'RSA', includeCryptoKeys: true });
      const jwk = (await exportKey(keys.publicKeyCrypto!, 'jwk')) as JsonWebKey;
      const importedPublic = await importKey(jwk);
      const signature = await sign('infer-rsa-jwk', keys.privateKeyCrypto!);

      await expect(verify('infer-rsa-jwk', signature, importedPublic)).resolves.toBe(true);
    });

    it('imports JWK without explicit type by inferring ECDSA and verifies signature', async () => {
      const keys = await generateKeys({ type: 'ECDSA', includeCryptoKeys: true });
      const jwk = (await exportKey(keys.publicKeyCrypto!, 'jwk')) as JsonWebKey;
      const importedPublic = await importKey(jwk);
      const signature = await sign('infer-ec-jwk', keys.privateKeyCrypto!);

      await expect(verify('infer-ec-jwk', signature, importedPublic)).resolves.toBe(true);
    });

    it('infers RSA-PSS from JWK alg and verifies signature', async () => {
      const keys = await generateKeys({ type: 'RSA-PSS', includeCryptoKeys: true });
      const jwk = (await exportKey(keys.publicKeyCrypto!, 'jwk')) as JsonWebKey;
      jwk.alg = 'PS256';
      const importedPublic = await importKey(jwk);
      const signature = await sign('infer-rsa-pss-jwk', keys.privateKeyCrypto!);

      await expect(verify('infer-rsa-pss-jwk', signature, importedPublic)).resolves.toBe(true);
    });

    it('imports private JWK without usages and defaults to sign', async () => {
      const keys = await generateKeys({ type: 'Ed25519', extractable: true, includeCryptoKeys: true });
      const privateJwk = (await exportKey(keys.privateKeyCrypto!, 'jwk')) as JsonWebKey;
      const importedPrivate = await importKey(privateJwk);

      const signature = await sign('private-jwk-default-sign', importedPrivate);
      await expect(verify('private-jwk-default-sign', signature, keys.publicKeyCrypto!)).resolves.toBe(true);
    });

    it('throws when key_ops is present but does not include sign/verify', async () => {
      const keys = await generateKeys({ type: 'Ed25519', extractable: true, includeCryptoKeys: true });
      const privateJwk = (await exportKey(keys.privateKeyCrypto!, 'jwk')) as JsonWebKey;
      privateJwk.key_ops = ['encrypt' as any];

      await expect(importKey(privateJwk)).rejects.toThrow(
        'JWK key_ops must include at least one of sign or verify when provided'
      );
    });

    it('throws when JWK type cannot be inferred', async () => {
      await expect(importKey({} as JsonWebKey)).rejects.toThrow(
        'Unable to infer key type from JWK. Provide import options with an explicit type'
      );
    });

    it('throws for unsupported signing algorithm object', async () => {
      const fakeKey = {
        algorithm: { name: 'FAKE' },
        type: 'private'
      } as unknown as CryptoKey;

      await expect(sign('payload', fakeKey)).rejects.toThrow('Unsupported signing key algorithm: FAKE');
    });
  });

  describe('randomString', () => {
    it('returns a different value each time', () => {
      const s1 = randomString();
      const s2 = randomString();
      expect(s1).not.toBe(s2);
      expect(typeof s1).toBe('string');
      expect(s1).toHaveLength(64); // sha256 hex is 64 chars
    });

    it('result matches hashing of randomUUID', () => {
      // patch randomUUID to produce known value
      const orig = randomUUID;
      const uuid = '123e4567-e89b-12d3-a456-426655440000';
      // @ts-ignore
      require('crypto').randomUUID = () => uuid;
      const expected = sha256(uuid);
      expect(randomString()).toBe(expected);
      // restore randomUUID (for test isolation)
      // @ts-ignore
      require('crypto').randomUUID = orig;
    });
  });

  describe('generateRandomBytes', () => {
    it('returns a Buffer of requested length', () => {
      const buf = generateRandomBytes(16);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf).toHaveLength(16);
    });
  });

  describe('generateRandomBytesAsString', () => {
    it('returns a string of requested encoding and length', () => {
      const str = generateRandomBytesAsString(8, 'hex');
      expect(typeof str).toBe('string');
      expect(str).toHaveLength(16); // 8 bytes = 16 hex chars
    });
  });

  describe('generateApiKey', () => {
    it('returns a string with optional prefix', () => {
      const key = generateApiKey('test');
      expect(key.startsWith('test_')).toBe(true);
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(5);
    });
    it('returns a string without prefix', () => {
      const key = generateApiKey();
      expect(typeof key).toBe('string');
      expect(key).not.toContain('_');
    });
  });

  describe('safeCompare', () => {
    it('returns true for equal strings', () => {
      expect(safeCompare('abc', 'abc')).toBe(true);
    });
    it('returns false for different strings', () => {
      expect(safeCompare('abc', 'def')).toBe(false);
    });
    it('returns true for equal buffers', () => {
      expect(safeCompare(Buffer.from('123'), Buffer.from('123'))).toBe(true);
    });
    it('returns false for different buffers', () => {
      expect(safeCompare(Buffer.from('123'), Buffer.from('456'))).toBe(false);
    });
    it('throws for mismatched types', () => {
      expect(() => safeCompare('abc', Buffer.from('abc'))).toThrow();
    });
  });

  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts string data with passphrase', async () => {
      const secret = 'my-secret';
      const data = 'Sensitive data!';
      const encrypted = await encrypt(data, secret);
      expect(encrypted.ciphertext).not.toBe(data);
      const decrypted = await decrypt(encrypted, secret);
      expect(decrypted).toBe(data);
    });

    it('encrypts and decrypts Buffer data', async () => {
      const secret = 'buffer-key';
      const data = Buffer.from('BufferData');
      const encrypted = await encrypt(data, secret);
      const decrypted = await decrypt(encrypted, secret);
      expect(decrypted).toBe('BufferData');
    });

    it('throws if wrong key is used for decryption', async () => {
      const encrypted = await encrypt('failme', 'right-key');
      await expect(decrypt(encrypted, 'wrong-key')).rejects.toThrow();
    });
  });

  describe('createSignedToken/verifySignedToken', () => {
    it('creates and verifies a signed token', () => {
      const payload = { foo: 'bar' };
      const secret = 'tokensecret';
      const token = createSignedToken(payload, secret, 60);
      const decoded = verifySignedToken(token, secret);
      expect(decoded).toBeTruthy();
      expect(decoded!.foo).toBe('bar');
    });

    it('returns null for invalid signature', () => {
      const payload = { foo: 'bar' };
      const token = createSignedToken(payload, 'secret1', 60);
      expect(verifySignedToken(token, 'wrongsecret')).toBeNull();
    });

    it('returns null for expired token', () => {
      const payload = { foo: 'bar' };
      const secret = 'tokensecret';
      // Expired token
      const token = createSignedToken(payload, secret, -1);
      expect(verifySignedToken(token, secret)).toBeNull();
    });

    it('returns null for malformed token', () => {
      expect(verifySignedToken('not.a.token', 'secret')).toBeNull();
    });
  });

  describe('pbkdf2Hash', () => {
    it('derives a key using PBKDF2 with default parameters', async () => {
      const password = 'mypassword';
      const salt = 'mysalt';
      const derived = await pbkdf2Hash(password, salt);
      expect(Buffer.isBuffer(derived)).toBe(true);
      expect(derived).toHaveLength(32); // default keyLength
    });

    it('derives a key with custom keyLength', async () => {
      const password = 'mypassword';
      const salt = 'mysalt';
      const derived = await pbkdf2Hash(password, salt, 64);
      expect(derived).toHaveLength(64);
    });

    it('derives a key with custom iterations', async () => {
      const password = 'mypassword';
      const salt = 'mysalt';
      const derived = await pbkdf2Hash(password, salt, 32, 1000);
      expect(Buffer.isBuffer(derived)).toBe(true);
      expect(derived).toHaveLength(32);
    });

    it('produces deterministic results for same inputs', async () => {
      const password = 'test';
      const salt = 'salt123';
      const derived1 = await pbkdf2Hash(password, salt);
      const derived2 = await pbkdf2Hash(password, salt);
      expect(derived1.equals(derived2)).toBe(true);
    });

    it('produces different results for different salts', async () => {
      const password = 'test';
      const derived1 = await pbkdf2Hash(password, 'salt1');
      const derived2 = await pbkdf2Hash(password, 'salt2');
      expect(derived1.equals(derived2)).toBe(false);
    });
  });

  describe('generateNonce', () => {
    it('generates a nonce with default parameters', () => {
      const nonce = generateNonce();
      expect(typeof nonce).toBe('string');
      expect(nonce).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('generates a nonce with custom byte length', () => {
      const nonce = generateNonce(8);
      expect(nonce).toHaveLength(16); // 8 bytes = 16 hex chars
    });

    it('generates a nonce with base64 encoding', () => {
      const nonce = generateNonce(16, 'base64');
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('generates unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('secureRandomInt', () => {
    it('generates a random integer within range', () => {
      const min = 1;
      const max = 10;
      for (let i = 0; i < 100; i++) {
        const random = secureRandomInt(min, max);
        expect(random).toBeGreaterThanOrEqual(min);
        expect(random).toBeLessThanOrEqual(max);
        expect(Number.isInteger(random)).toBe(true);
      }
    });

    it('handles single value range', () => {
      const random = secureRandomInt(5, 5);
      expect(random).toBe(5);
    });

    it('throws if min > max', () => {
      expect(() => secureRandomInt(10, 5)).toThrow('min must be less than or equal to max');
    });

    it('handles negative numbers', () => {
      const random = secureRandomInt(-10, -5);
      expect(random).toBeGreaterThanOrEqual(-10);
      expect(random).toBeLessThanOrEqual(-5);
    });
  });

  describe('hashPassword', () => {
    it('hashes a password and returns salt:hash format', async () => {
      const password = 'mypassword';
      const hash = await hashPassword(password);
      expect(typeof hash).toBe('string');
      expect(hash).toContain(':');
      const [saltB64, keyB64] = hash.split(':');
      expect(saltB64).toBeTruthy();
      expect(keyB64).toBeTruthy();
    });

    it('generates different hashes for same password (due to salt)', async () => {
      const password = 'mypassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it('supports custom salt and key lengths', async () => {
      const password = 'test';
      const hash = await hashPassword(password, 32, 64);
      expect(hash).toContain(':');
      const [saltB64, keyB64] = hash.split(':');
      const salt = Buffer.from(saltB64, 'base64');
      const key = Buffer.from(keyB64, 'base64');
      expect(salt).toHaveLength(32);
      expect(key).toHaveLength(64);
    });
  });

  describe('verifyPassword', () => {
    it('verifies a correct password', async () => {
      const password = 'mypassword';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const password = 'mypassword';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });

    it('returns false for malformed hash', async () => {
      const isValid = await verifyPassword('password', 'notvalid');
      expect(isValid).toBe(false);
    });

    it('returns false for hash without colon', async () => {
      const isValid = await verifyPassword('password', 'nocolon');
      expect(isValid).toBe(false);
    });

    it('returns false for invalid base64 in hash', async () => {
      const isValid = await verifyPassword('password', 'invalid!!!:base64!!!');
      expect(isValid).toBe(false);
    });
  });
});

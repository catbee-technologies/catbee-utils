import {
  hmac,
  hash,
  sha256Hmac,
  sha1,
  sha256,
  md5,
  randomString,
} from "../../src/utils/crypto.utils";

import { randomUUID } from "crypto";

describe("CryptoUtils", () => {
  describe("hash", () => {
    it("produces expected sha256 hash in hex", () => {
      expect(hash("sha256", "hello")).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      );
    });

    it("produces expected sha256 hash in base64", () => {
      expect(hash("sha256", "hello", "base64")).toBe(
        "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=",
      );
    });

    it("produces expected md5 hash", () => {
      expect(hash("md5", "abcdef")).toBe("e80b5017098950fc58aad83c8c14978e");
    });

    it("throws if unknown algorithm", () => {
      expect(() => hash("no-such-algo", "abc")).toThrow();
    });
  });

  describe("hmac", () => {
    it("generates correct HMAC for sha256, secret", () => {
      expect(hmac("sha256", "payload", "secret")).toBe(
        "b82fcb791acec57859b989b430a826488ce2e479fdf92326bd0a2e8375a42ba4",
      );
    });

    it("supports base64 encoding", () => {
      expect(hmac("sha256", "stuff", "key", "base64")).toBe(
        "AkYLKFGdkjVVb67YBy007wR0mJBb/7WTx/PiA/06dfg=",
      );
    });

    it("is deterministic (same input yields same output)", () => {
      const sig1 = hmac("sha1", "foo", "bar");
      const sig2 = hmac("sha1", "foo", "bar");
      expect(sig1).toBe(sig2);
    });

    it("throws if invalid algo", () => {
      expect(() => hmac("nope", "foo", "bar")).toThrow();
    });
  });

  describe("sha256Hmac", () => {
    it("calculates using sha256 and hmac for input/secret", () => {
      const expected = hmac("sha256", "abc", "xyz");
      expect(sha256Hmac("abc", "xyz")).toBe(expected);
    });
  });

  describe("sha1", () => {
    it("produces correct digest in hex", () => {
      expect(sha1("MyData")).toBe("f5384a033d0c581eddebf868a25d3203f3f484c8");
    });

    it("produces correct digest in base64", () => {
      expect(sha1("MyData", "base64")).toBe("9ThKAz0MWB7d6/hool0yA/P0hMg=");
    });
  });

  describe("sha256", () => {
    it("produces correct digest in hex", () => {
      expect(sha256("HelloWorld")).toBe(
        "872e4e50ce9990d8b041330c47c9ddd11bec6b503ae9386a99da8584e9bb12c4",
      );
    });

    it("produces correct digest in base64", () => {
      expect(sha256("HelloWorld", "base64")).toBe(
        "hy5OUM6ZkNiwQTMMR8nd0Rvsa1A66ThqmdqFhOm7EsQ=",
      );
    });
  });

  describe("md5", () => {
    it("produces expected MD5 hash as hex", () => {
      expect(md5("batman")).toBe("ec0e2603172c73a8b644bb9456c1ff6e");
    });
  });

  describe("randomString", () => {
    it("returns a different value each time", () => {
      const s1 = randomString();
      const s2 = randomString();
      expect(s1).not.toBe(s2);
      expect(typeof s1).toBe("string");
      expect(s1).toHaveLength(64); // sha256 hex is 64 chars
    });

    it("result matches hashing of randomUUID", () => {
      // patch randomUUID to produce known value
      const orig = randomUUID;
      const uuid = "123e4567-e89b-12d3-a456-426655440000";
      // @ts-ignore
      require("crypto").randomUUID = () => uuid;
      const expected = sha256(uuid);
      expect(randomString()).toBe(expected);
      // restore randomUUID (for test isolation)
      // @ts-ignore
      require("crypto").randomUUID = orig;
    });
  });
});

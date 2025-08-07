import {
  uuid,
  ulidString,
  nanoId,
  randomHex,
  randomInt,
} from "../../src/utils/id.utils";

describe("IdUtils", () => {
  describe("uuid", () => {
    it("returns the result of randomUUID()", () => {
      const spy = jest
        .spyOn(require("crypto"), "randomUUID")
        .mockReturnValue("deadbeef-dead-beef-dead-beefdeadbeef");
      expect(uuid()).toBe("deadbeef-dead-beef-dead-beefdeadbeef");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("ulidString", () => {
    it("returns the result of ulid()", () => {
      const ulidValue = "01H7ZXS9FJKPX06P1AYZKCGHQF";
      const spy = jest
        .spyOn(require("ulid"), "ulid")
        .mockReturnValue(ulidValue);
      expect(ulidString()).toBe(ulidValue);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("nanoId", () => {
    it("returns nanoid of correct length (default 21)", () => {
      const out = "a".repeat(21);
      const spy = jest.spyOn(require("nanoid"), "nanoid").mockReturnValue(out);
      expect(nanoId()).toBe(out);
      expect(spy).toHaveBeenCalledWith(21);
      spy.mockRestore();
    });

    it("generates nanoid with specified length", () => {
      const out = "b".repeat(8);
      const spy = jest.spyOn(require("nanoid"), "nanoid").mockReturnValue(out);
      expect(nanoId(8)).toBe(out);
      expect(spy).toHaveBeenCalledWith(8);
      spy.mockRestore();
    });
  });

  describe("randomHex", () => {
    beforeEach(() => {
      // Node.js: global.crypto is not set. We'll patch it for tests.
      // Returns incremented numbers for predictability.
      const getRandomValues = (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; ++i) arr[i] = i + 1;
        return arr;
      };
      // @ts-ignore
      global.crypto = { getRandomValues };
    });

    afterEach(() => {
      // @ts-ignore
      delete global.crypto;
    });

    it("returns 32 hex chars for default byteLength=16", () => {
      const hex = randomHex();
      expect(hex).toHaveLength(32);
      expect(hex).toBe(
        Buffer.from(Array.from({ length: 16 }, (_, i) => i + 1))
          .toString("hex")
          .slice(0, 32),
      );
    });

    it("returns correct length for custom byteLength", () => {
      expect(randomHex(4)).toHaveLength(8);
      expect(randomHex(8)).toHaveLength(16);
      expect(randomHex(32)).toHaveLength(64);
    });

    it("each byte is correctly hex-encoded", () => {
      // For byteLength = 4, outputs: 01 02 03 04
      const hex = randomHex(4);
      expect(hex).toBe("01020304");
    });
  });

  describe("randomInt", () => {
    it("returns a number between min and max inclusive", () => {
      // We'll spy on Math.random to get determinism
      jest.spyOn(Math, "random").mockReturnValue(0.4); // so result is predictable
      const n = randomInt(10, 20); // 0.4 * 11 = 4.4 -> floor 4 -> 14
      expect(n).toBe(14);
      (Math.random as any).mockRestore();
    });

    it("returns min if Math.random() is 0", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      expect(randomInt(7, 9)).toBe(7);
      (Math.random as any).mockRestore();
    });

    it("returns max if Math.random() is just under 1", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.99999999);
      const res = randomInt(1, 4); // should be 4
      expect(res).toBe(4);
      (Math.random as any).mockRestore();
    });

    it("works when min == max", () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });
});

import {
  uuid,
  randomHex,
  randomInt,
  randomBase64,
  nanoId,
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

  describe("nanoid", () => {
    it("returns a string of requested length", () => {
      const spy = jest.spyOn(require("crypto"), "randomBytes");
      // 21 chars needs ceil(21*3/4) = 16 bytes
      spy.mockReturnValue(Buffer.alloc(16, 1));
      expect(nanoId()).toHaveLength(21);
      expect(typeof nanoId()).toBe("string");
      spy.mockRestore();
    });
    it("is url-safe (no +, /, =)", () => {
      const spy = jest.spyOn(require("crypto"), "randomBytes");
      spy.mockReturnValue(
        Buffer.from([255, 254, 253, 252, 251, 250, 249, 248]),
      );
      const result = nanoId(12);
      expect(result).not.toMatch(/[+/=]/);
      expect(result.length).toBe(12);
      spy.mockRestore();
    });
    it("returns empty string if length is 0", () => {
      expect(nanoId(0)).toBe("");
    });
  });

  describe("randomHex", () => {
    it("returns correct hex length for default and custom byteLength", () => {
      const spy = jest.spyOn(require("crypto"), "randomBytes");
      spy.mockReturnValue(
        Buffer.from(Array.from({ length: 16 }, (_, i) => i + 1)),
      );
      expect(randomHex()).toBe(
        Buffer.from(Array.from({ length: 16 }, (_, i) => i + 1)).toString(
          "hex",
        ),
      );
      expect(randomHex(4)).toHaveLength(8);
      expect(randomHex(8)).toHaveLength(16);
      expect(randomHex(32)).toHaveLength(64);
      spy.mockRestore();
    });
    it("each byte is correctly hex-encoded", () => {
      const spy = jest.spyOn(require("crypto"), "randomBytes");
      spy.mockReturnValue(Buffer.from([1, 2, 3, 4]));
      expect(randomHex(4)).toBe("01020304");
      spy.mockRestore();
    });
  });

  describe("randomInt", () => {
    it("returns a number between min and max inclusive", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.4);
      const n = randomInt(10, 20);
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
      expect(randomInt(1, 4)).toBe(4);
      (Math.random as any).mockRestore();
    });

    it("works when min == max", () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });

  describe("randomBase64", () => {
    it("returns a base64url string of expected length", () => {
      const spy = jest.spyOn(require("crypto"), "randomBytes");
      spy.mockReturnValue(Buffer.from("1234567890123456"));
      const result = randomBase64(8);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThanOrEqual(8); // base64url is variable, but should be >= input
      spy.mockRestore();
    });
    it("is url-safe (no +, /, =)", () => {
      const spy = jest.spyOn(require("crypto"), "randomBytes");
      spy.mockReturnValue(
        Buffer.from([255, 254, 253, 252, 251, 250, 249, 248]),
      );
      const result = randomBase64(8);
      expect(result).not.toMatch(/[+/=]/);
      spy.mockRestore();
    });
  });
});

import {
  isEmail,
  isUUID,
  isURL,
  isPhone,
  isAlphanumeric,
  isNumeric,
  isHexColor,
  isISODate,
} from "../../src/utils/validate.utils";

describe("ValidateUtils", () => {
  describe("isEmail", () => {
    it("accepts standard emails", () => {
      expect(isEmail("test@example.com")).toBe(true);
      expect(isEmail("user.name+tag@a.co.uk")).toBe(true);
      expect(isEmail("foo.bar@baz.io")).toBe(true);
    });
    it("rejects invalid emails", () => {
      expect(isEmail("notanemail")).toBe(false);
      expect(isEmail("foo@bar")).toBe(false);
      expect(isEmail("foo.com")).toBe(false);
      expect(isEmail("foo@.com")).toBe(false);
      expect(isEmail("@nope.com")).toBe(false);
      expect(isEmail("foo@bar.")).toBe(false);
      expect(isEmail("foo@bar..com")).toBe(false);
    });
  });

  describe("isUUID", () => {
    it("accepts valid UUIDs v1-v5", () => {
      expect(isUUID("123e4567-e89b-12d3-a456-426655440000")).toBe(true);
      expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isUUID("a8098c1a-f86e-11da-bd1a-00112444be1e")).toBe(true);
      expect(isUUID("A8098C1A-F86E-11DA-BD1A-00112444BE1E")).toBe(true); // case insensitivity
    });
    it("rejects non-uuid and wrong format", () => {
      expect(isUUID("not-a-uuid")).toBe(false);
      expect(isUUID("123e4567e89b12d3a456426655440000")).toBe(false);
      expect(isUUID("z23e4567-e89b-12d3-a456-426655440000")).toBe(false);
      expect(isUUID("")).toBe(false);
    });
  });

  describe("isURL", () => {
    it("accepts standard URLs", () => {
      expect(isURL("http://example.com")).toBe(true);
      expect(isURL("https://a.co/cat?x=1")).toBe(true);
      expect(isURL("https://foo.bar/path/to?x=1")).toBe(true);
      expect(isURL("ftp://domain.com")).toBe(true);
      expect(isURL("mailto:abc@foo.com")).toBe(true);
    });
    it("rejects invalid URLs", () => {
      expect(isURL("not a url")).toBe(false);
      expect(isURL("www.example.com")).toBe(false); // missing protocol
      expect(isURL("")).toBe(false);
    });
  });

  describe("isPhone", () => {
    it("accepts E.164 and various phone formats", () => {
      expect(isPhone("+14155552671")).toBe(true);
      expect(isPhone("14155552671")).toBe(true);
      expect(isPhone("+91 8005321412")).toBe(true);
      expect(isPhone("(555) 123-4567")).toBe(true);
      expect(isPhone("555-123-4567")).toBe(true);
      expect(isPhone("+44 (0)20 7123 4567")).toBe(true);
      expect(isPhone("03-1234-5678")).toBe(true);
      expect(isPhone("123 456 7890")).toBe(true);
    });
    it("rejects invalid phone numbers", () => {
      expect(isPhone("abcdefg")).toBe(false);
      expect(isPhone("12345")).toBe(false);
      expect(isPhone("++113355")).toBe(false);
      expect(isPhone("")).toBe(false);
    });
  });

  describe("isAlphanumeric", () => {
    it("accepts letters and numbers", () => {
      expect(isAlphanumeric("abc123")).toBe(true);
      expect(isAlphanumeric("ABC")).toBe(true);
      expect(isAlphanumeric("abcABC0123")).toBe(true);
    });
    it("rejects non-alpha or empty", () => {
      expect(isAlphanumeric("abc!")).toBe(false);
      expect(isAlphanumeric(" ")).toBe(false);
      expect(isAlphanumeric("123_456")).toBe(false);
      expect(isAlphanumeric("")).toBe(false);
    });
  });

  describe("isNumeric", () => {
    it("accepts ints, floats, string numbers, 0, -numbers", () => {
      expect(isNumeric(123)).toBe(true);
      expect(isNumeric("123.45")).toBe(true);
      expect(isNumeric("-14")).toBe(true);
      expect(isNumeric("  77 ")).toBe(true);
      expect(isNumeric(0)).toBe(true);
      expect(isNumeric("0")).toBe(true);
    });
    it("rejects non-numbers, empty, spaces", () => {
      expect(isNumeric("")).toBe(false);
      expect(isNumeric("abc")).toBe(false);
      expect(isNumeric(" ")).toBe(false);
      expect(isNumeric(NaN)).toBe(false);
      expect(isNumeric(Infinity)).toBe(false);
      expect(isNumeric("1e309")).toBe(false); // overflows Number.MAX_VALUE
    });
  });

  describe("isHexColor", () => {
    it("accepts 3- and 6-digit hex codes (case-insensitive)", () => {
      expect(isHexColor("#FFF")).toBe(true);
      expect(isHexColor("#fff")).toBe(true);
      expect(isHexColor("#FfFfFf")).toBe(true);
      expect(isHexColor("#123456")).toBe(true);
      expect(isHexColor("#a9b")).toBe(true);
    });
    it("rejects wrong format, too short, missing #, extra", () => {
      expect(isHexColor("FFF")).toBe(false);
      expect(isHexColor("#FF")).toBe(false);
      expect(isHexColor("#FFFF")).toBe(false);
      expect(isHexColor("#12345")).toBe(false);
      expect(isHexColor("#abcdex")).toBe(false);
    });
  });

  describe("isISODate", () => {
    it("accepts common ISO date and datetime formats", () => {
      expect(isISODate("2024-04-02")).toBe(true);
      expect(isISODate("2020-12-31T12:34:56Z")).toBe(true);
      expect(isISODate("2023-05-17T10:34:53+05:30")).toBe(true);
      expect(isISODate("2021-01-01T00:00:00.000Z")).toBe(true);
    });
    it("rejects non-ISO or incomplete", () => {
      expect(isISODate("31-12-2020")).toBe(false);
      expect(isISODate("20201312")).toBe(false);
      expect(isISODate("2022/05/05")).toBe(false);
      expect(isISODate("2022-05-99")).toBe(false);
      expect(isISODate("2022-05-10T123456Z")).toBe(false); // bad time
      expect(isISODate("notadate")).toBe(false);
      expect(isISODate("")).toBe(false);
    });
  });
});

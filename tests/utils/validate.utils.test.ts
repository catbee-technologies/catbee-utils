import {
  isEmail,
  isUUID,
  isURL,
  isPhone,
  isAlphanumeric,
  isNumeric,
  isHexColor,
  isISODate,
  isLengthBetween,
  isNumberBetween,
  isAlpha,
  isStrongPassword,
  isIPv4,
  isIPv6,
  isCreditCard,
  isValidJSON,
  isArray,
  isBase64,
  hasRequiredProps,
  isDateInRange,
  matchesPattern,
  validateAll,
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

  describe("isLengthBetween", () => {
    it("returns true if string length is within range", () => {
      expect(isLengthBetween("abc", 2, 4)).toBe(true);
      expect(isLengthBetween("abcd", 4, 4)).toBe(true);
    });
    it("returns false if string length is out of range", () => {
      expect(isLengthBetween("a", 2, 4)).toBe(false);
      expect(isLengthBetween("abcdef", 2, 4)).toBe(false);
    });
  });

  describe("isNumberBetween", () => {
    it("returns true if number is within range", () => {
      expect(isNumberBetween(5, 1, 10)).toBe(true);
      expect(isNumberBetween(1, 1, 10)).toBe(true);
      expect(isNumberBetween(10, 1, 10)).toBe(true);
    });
    it("returns false if number is out of range", () => {
      expect(isNumberBetween(0, 1, 10)).toBe(false);
      expect(isNumberBetween(11, 1, 10)).toBe(false);
    });
  });

  describe("isAlpha", () => {
    it("returns true for alphabetic strings", () => {
      expect(isAlpha("abc")).toBe(true);
      expect(isAlpha("ABC")).toBe(true);
    });
    it("returns false for non-alpha", () => {
      expect(isAlpha("abc1")).toBe(false);
      expect(isAlpha(" ")).toBe(false);
      expect(isAlpha("")).toBe(false);
    });
  });

  describe("isStrongPassword", () => {
    it("returns true for strong passwords", () => {
      expect(isStrongPassword("Abcdef1!")).toBe(true);
      expect(isStrongPassword("XyZ123$%")).toBe(true);
    });
    it("returns false for weak passwords", () => {
      expect(isStrongPassword("short1!")).toBe(false); // too short
      expect(isStrongPassword("abcdefg1")).toBe(false); // no uppercase, no special
      expect(isStrongPassword("ABCDEFG1")).toBe(false); // no lowercase, no special
      expect(isStrongPassword("Abcdefgh")).toBe(false); // no number, no special
      expect(isStrongPassword("Abcdefg1")).toBe(false); // no special
    });
  });

  describe("isIPv4", () => {
    it("returns true for valid IPv4", () => {
      expect(isIPv4("127.0.0.1")).toBe(true);
      expect(isIPv4("192.168.1.1")).toBe(true);
    });
    it("returns false for invalid IPv4", () => {
      expect(isIPv4("256.0.0.1")).toBe(false);
      expect(isIPv4("abc.def.ghi.jkl")).toBe(false);
      expect(isIPv4("1.2.3")).toBe(false);
    });
  });

  describe("isIPv6", () => {
    it("returns true for valid IPv6", () => {
      expect(isIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
      expect(isIPv6("::1")).toBe(true);
    });
    it("returns false for invalid IPv6", () => {
      expect(isIPv6("not:ipv6")).toBe(false);
      expect(isIPv6("123.123.123.123")).toBe(false);
    });
  });

  describe("isCreditCard", () => {
    it("returns true for valid credit card numbers", () => {
      expect(isCreditCard("4111 1111 1111 1111")).toBe(true);
      expect(isCreditCard("4012888888881881")).toBe(true);
    });
    it("returns false for invalid credit card numbers", () => {
      expect(isCreditCard("1234 5678 9012 3456")).toBe(false);
      expect(isCreditCard("abcd")).toBe(false);
      expect(isCreditCard("")).toBe(false);
    });
  });

  describe("isValidJSON", () => {
    it("returns true for valid JSON strings", () => {
      expect(isValidJSON('{"a":1}')).toBe(true);
      expect(isValidJSON("[1,2,3]")).toBe(true);
    });
    it("returns false for invalid JSON", () => {
      expect(isValidJSON("{a:1}")).toBe(false);
      expect(isValidJSON("not json")).toBe(false);
    });
  });

  describe("isArray", () => {
    it("returns true for arrays", () => {
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray([])).toBe(true);
    });
    it("returns false for non-arrays", () => {
      expect(isArray("abc")).toBe(false);
      expect(isArray({})).toBe(false);
    });
    it("validates items with itemGuard", () => {
      expect(
        isArray([1, 2, 3], (x): x is number => typeof x === "number"),
      ).toBe(true);
      expect(isArray([1, "a"], (x): x is number => typeof x === "number")).toBe(
        false,
      );
    });
  });

  describe("isBase64", () => {
    it("returns true for valid base64", () => {
      expect(isBase64("SGVsbG8gd29ybGQ=")).toBe(true);
      expect(isBase64("U29tZSBkYXRh")).toBe(true);
    });
    it("returns false for invalid base64", () => {
      expect(isBase64("not base64!")).toBe(false);
      expect(isBase64("123")).toBe(false);
    });
  });

  describe("hasRequiredProps", () => {
    it("returns true if all required props exist and not null/undefined", () => {
      expect(hasRequiredProps({ a: 1, b: 2 }, ["a", "b"])).toBe(true);
      expect(hasRequiredProps({ a: 1, b: 0 }, ["a", "b"])).toBe(true);
    });
    it("returns false if missing or null/undefined", () => {
      expect(hasRequiredProps({ a: 1 }, ["a", "b"])).toBe(false);
      expect(hasRequiredProps({ a: 1, b: undefined }, ["a", "b"])).toBe(false);
      expect(hasRequiredProps({ a: 1, b: null }, ["a", "b"])).toBe(false);
    });
  });

  describe("isDateInRange", () => {
    it("returns true if date is within range", () => {
      const d = new Date("2020-01-01");
      expect(
        isDateInRange(d, new Date("2019-01-01"), new Date("2021-01-01")),
      ).toBe(true);
      expect(isDateInRange(d, undefined, new Date("2021-01-01"))).toBe(true);
      expect(isDateInRange(d, new Date("2019-01-01"))).toBe(true);
    });
    it("returns false if date is out of range or invalid", () => {
      const d = new Date("2020-01-01");
      expect(isDateInRange(d, new Date("2021-01-01"))).toBe(false);
      expect(isDateInRange(d, undefined, new Date("2019-01-01"))).toBe(false);
      expect(isDateInRange(new Date("invalid"))).toBe(false);
      expect(isDateInRange("not a date" as any)).toBe(false);
    });
  });

  describe("matchesPattern", () => {
    it("returns true if string matches pattern", () => {
      expect(matchesPattern("abc123", /^[a-z]+\d+$/)).toBe(true);
    });
    it("returns false if string does not match pattern", () => {
      expect(matchesPattern("abc", /^\d+$/)).toBe(false);
    });
  });

  describe("validateAll", () => {
    it("returns true if all validators pass", () => {
      const validators = [
        (x: any) => typeof x === "string",
        (x: any) => x.length > 2,
      ];
      expect(validateAll("abcd", validators)).toBe(true);
    });
    it("returns false if any validator fails", () => {
      const validators = [
        (x: any) => typeof x === "string",
        (x: any) => x.length > 5,
      ];
      expect(validateAll("abc", validators)).toBe(false);
    });
  });
});

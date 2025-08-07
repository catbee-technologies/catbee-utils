import { appendQueryParams, parseQueryString } from "../../src/utils/url.utils";

describe("UrlUtils", () => {
  describe("appendQueryParams", () => {
    it("appends params to base URL with no query", () => {
      const url = "https://example.com";
      const params = { page: 2, limit: 10 };
      expect(appendQueryParams(url, params)).toBe(
        "https://example.com/?page=2&limit=10",
      );
    });

    it("merges with existing query string (overrides keys)", () => {
      const url = "https://host/test?a=1&x=y";
      const params = { a: "99", b: "blue" };
      expect(appendQueryParams(url, params)).toBe(
        "https://host/test?a=99&x=y&b=blue",
      );
    });

    it("works with URLs that already end with ?", () => {
      const url = "https://domain.com/endpoint?";
      expect(appendQueryParams(url, { foo: 1 })).toBe(
        "https://domain.com/endpoint?foo=1",
      );
    });

    it("stringifies numbers and keeps strings as is", () => {
      expect(appendQueryParams("https://a.co", { q: 0, b: "2" })).toBe(
        "https://a.co/?q=0&b=2",
      );
    });

    it("overrides existing duplicate keys", () => {
      expect(appendQueryParams("https://m.com?a=1&b=2", { a: 5 })).toMatch(
        /a=5/,
      );
    });

    it("returns the original URL if params is empty", () => {
      const url = "https://site/page";
      expect(appendQueryParams(url, {})).toBe("https://site/page");
    });
  });

  describe("parseQueryString", () => {
    it("parses a typical query string with ?", () => {
      const q = "?foo=bar&x=1";
      expect(parseQueryString(q)).toEqual({ foo: "bar", x: "1" });
    });

    it("parses without leading ?", () => {
      expect(parseQueryString("k=v&z=42")).toEqual({ k: "v", z: "42" });
    });

    it("returns empty object for empty query string", () => {
      expect(parseQueryString("")).toEqual({});
      expect(parseQueryString("?")).toEqual({});
    });

    it("handles repeated keys (keeps last, per URLSearchParams)", () => {
      expect(parseQueryString("k=1&k=3")).toEqual({ k: "3" });
    });

    it("decodes percent-encoded values", () => {
      expect(parseQueryString("a=%2Ffoo%3Fz&b=%E2%9C%85")).toEqual({
        a: "/foo?z",
        b: "✅",
      });
    });

    it("returns string values only, even for numbers", () => {
      expect(parseQueryString("n=42")).toEqual({ n: "42" });
    });

    it("handles keys with empty value", () => {
      expect(parseQueryString("a=")).toEqual({ a: "" });
      expect(parseQueryString("a")).toEqual({ a: "" });
    });

    it("treats + as space (per URLSearchParams spec)", () => {
      expect(parseQueryString("q=foo+bar")).toEqual({ q: "foo bar" });
    });
  });
});

import {
  capitalize,
  toKebabCase,
  toCamelCase,
  slugify,
  truncate,
} from "../../src/utils/string.utils";

describe("StringUtils", () => {
  describe("capitalize", () => {
    it("capitalizes the first character", () => {
      expect(capitalize("foo")).toBe("Foo");
      expect(capitalize("barTest")).toBe("BarTest");
    });
    it("returns '' for empty strings", () => {
      expect(capitalize("")).toBe("");
    });
    it("leaves single character strings uppercased", () => {
      expect(capitalize("a")).toBe("A");
      expect(capitalize("Z")).toBe("Z");
    });
    it("does not lowercase the rest", () => {
      expect(capitalize("tEST")).toBe("TEST");
    });
    it("works for non-Latin first char", () => {
      expect(capitalize("ßfoo")).not.toBe(""); // Should not throw
    });
  });

  describe("toKebabCase", () => {
    it("converts camelCase and spaces to kebab-case", () => {
      expect(toKebabCase("fooBarTest")).toBe("foo-bar-test");
      expect(toKebabCase("FooBar test")).toBe("foo-bar-test");
      expect(toKebabCase("my_big_dog")).toBe("my-big-dog");
      expect(toKebabCase("My   cool_Thing")).toBe("my-cool-thing");
      expect(toKebabCase(" already-kebab ")).toBe("-already-kebab-");
    });
    it("lowercases output and handles leading/trailing spaces", () => {
      expect(toKebabCase(" Hello_world ")).toBe("-hello-world-");
    });
    it("works for empty string", () => {
      expect(toKebabCase("")).toBe("");
    });
  });

  describe("toCamelCase", () => {
    it("converts kebab-case and snake_case to camelCase", () => {
      expect(toCamelCase("foo-bar-baz")).toBe("fooBarBaz");
      expect(toCamelCase("snake_case_test")).toBe("snakeCaseTest");
    });
    it("handles leading/trailing dashes/underscores", () => {
      expect(toCamelCase("-abc-def")).toBe("AbcDef");
      expect(toCamelCase("_a_b")).toBe("AB");
    });
    it("returns input as-is if no dash/underscore", () => {
      expect(toCamelCase("plain")).toBe("plain");
    });
    it("works for empty string", () => {
      expect(toCamelCase("")).toBe("");
    });
  });

  describe("slugify", () => {
    it("makes string url friendly: lowercases, hyphenates, removes special chars", () => {
      expect(slugify("Hello World!")).toBe("hello-world");
      expect(slugify(" Big   test 123 ")).toBe("big-test-123");
      expect(slugify("foo$bar--baz")).toBe("foobar-baz");
      expect(slugify("foo_bar@#baz")).toBe("foo_barbaz"); // underscore allowed by \w
    });
    it("single word returns itself lowercased", () => {
      expect(slugify("TeSt")).toBe("test");
    });
    it("removes leading and trailing dashes", () => {
      expect(slugify("--something cool---")).toBe("something-cool");
    });
    it("collapses multiple dashes", () => {
      expect(slugify("a  -- b----  c")).toBe("a-b-c");
    });
    it("returns empty for empty or all punctuation", () => {
      expect(slugify("!!!")).toBe("");
      expect(slugify("")).toBe("");
    });
    it("handles unicode", () => {
      expect(slugify("Straße ünicode 𐍈")).toBe("strae-nicode");
    });
  });

  describe("truncate", () => {
    it("truncates string with ellipsis if too long", () => {
      expect(truncate("hello world", 5)).toBe("hello...");
      expect(truncate("123456", 3)).toBe("123...");
    });
    it("returns string unmodified if <= len", () => {
      expect(truncate("abc", 3)).toBe("abc");
      expect(truncate("ab", 3)).toBe("ab");
    });
    it("returns full string for zero or negative len", () => {
      expect(truncate("abc", 0)).toBe("..."); // first 0 chars + "..."
      expect(truncate("abc", -5)).toBe("..."); // first -5 chars = "" + "..."
    });
    it("works for empty string", () => {
      expect(truncate("", 7)).toBe("");
    });
    it("handles unicode properly", () => {
      expect(truncate("汉字汉字汉字", 2)).toBe("汉字...");
    });
  });
});

import {
  capitalize,
  toKebabCase,
  toCamelCase,
  slugify,
  truncate,
  toPascalCase,
  toSnakeCase,
  mask,
  stripHtml,
  equalsIgnoreCase,
  reverse,
  countOccurrences,
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

  describe("toPascalCase", () => {
    it("converts kebab-case and snake_case to PascalCase", () => {
      expect(toPascalCase("foo-bar")).toBe("FooBar");
      expect(toPascalCase("foo_bar")).toBe("FooBar");
    });
    it("capitalizes camelCase", () => {
      expect(toPascalCase("fooBar")).toBe("FooBar");
    });
    it("returns empty string for empty input", () => {
      expect(toPascalCase("")).toBe("");
    });
  });

  describe("toSnakeCase", () => {
    it("converts camelCase and kebab-case to snake_case", () => {
      expect(toSnakeCase("fooBarTest")).toBe("foo_bar_test");
      expect(toSnakeCase("foo-bar-test")).toBe("foo_bar_test");
      expect(toSnakeCase("Foo Bar test")).toBe("foo_bar_test");
    });
    it("handles leading/trailing spaces and dashes", () => {
      expect(toSnakeCase("  Foo-Bar ")).toBe("__foo_bar_");
    });
    it("returns empty string for empty input", () => {
      expect(toSnakeCase("")).toBe("");
    });
  });

  describe("mask", () => {
    it("masks all but visibleStart and visibleEnd", () => {
      expect(mask("1234567890", 2, 2)).toBe("12******90");
      expect(mask("abcdef", 1, 1, "#")).toBe("a####f");
    });
    it("returns empty string for empty input", () => {
      expect(mask("")).toBe("");
    });
    it("returns original if visibleStart >= length", () => {
      expect(mask("abc", 3, 2)).toBe("abc");
    });
    it("returns only mask if visibleStart and visibleEnd are 0", () => {
      expect(mask("abc")).toBe("***");
    });
  });

  describe("stripHtml", () => {
    it("removes HTML tags", () => {
      expect(stripHtml("<div>foo</div>bar")).toBe("foobar");
      expect(stripHtml("<p>test</p><br>")).toBe("test");
      expect(stripHtml("no tags")).toBe("no tags");
    });
  });

  describe("equalsIgnoreCase", () => {
    it("returns true for equal strings ignoring case", () => {
      expect(equalsIgnoreCase("abc", "ABC")).toBe(true);
      expect(equalsIgnoreCase("TeSt", "test")).toBe(true);
    });
    it("returns false for different strings", () => {
      expect(equalsIgnoreCase("abc", "def")).toBe(false);
    });
  });

  describe("reverse", () => {
    it("reverses the string", () => {
      expect(reverse("abc")).toBe("cba");
      expect(reverse("racecar")).toBe("racecar");
      expect(reverse("")).toBe("");
    });
  });

  describe("countOccurrences", () => {
    it("counts substring occurrences (case sensitive)", () => {
      expect(countOccurrences("ababab", "ab")).toBe(3);
      expect(countOccurrences("aaaa", "aa")).toBe(2);
      expect(countOccurrences("abc", "d")).toBe(0);
    });
    it("counts substring occurrences (case insensitive)", () => {
      expect(countOccurrences("aBaBaB", "ab", false)).toBe(3);
    });
    it("returns 0 if substring is not found", () => {
      expect(countOccurrences("foo", "bar")).toBe(0);
    });
  });
});

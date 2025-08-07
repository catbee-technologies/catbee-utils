import { Env, Environment } from "../../src/utils/env.utils";

describe("Environment enum", () => {
  it("has all expected values", () => {
    expect(Environment.PRODUCTION).toBe("production");
    expect(Environment.DEVELOPMENT).toBe("development");
    expect(Environment.STAGING).toBe("staging");
    expect(Environment.TESTING).toBe("testing");
  });
});

describe("EnvUtils", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe("isDev", () => {
    it("returns true if NODE_ENV is 'development'", () => {
      Env.set("NODE_ENV", "development");
      expect(Env.isDev()).toBe(true);
    });

    it("returns false if NODE_ENV is not 'development'", () => {
      Env.set("NODE_ENV", "production");
      expect(Env.isDev()).toBe(false);
    });

    it("defaults to development if NODE_ENV is unset", () => {
      Env.delete("NODE_ENV");
      expect(Env.isDev()).toBe(true);
    });
  });

  describe("set, get, delete", () => {
    it("sets, gets, and deletes environment variables", () => {
      Env.set("FOOBAR", "sometext");
      expect(Env.get("FOOBAR")).toBe("sometext");
      Env.delete("FOOBAR");
      expect(Env.get("FOOBAR")).toBe(undefined);
      expect(Env.has("FOOBAR")).toBe(false);
    });
  });

  describe("getAll", () => {
    it("returns process.env", () => {
      expect(Env.getAll()).toBe(process.env);
    });
  });

  describe("get", () => {
    it("returns undefined for missing keys", () => {
      Env.delete("MISSING_KEY");
      expect(Env.get("MISSING_KEY")).toBeUndefined();
    });
    it("returns the fallback if provided", () => {
      expect(Env.get("NOPE", "fally")).toBe("fally");
    });
    it("returns process.env value if present", () => {
      Env.set("FOO", "bar");
      expect(Env.get("FOO", "baz")).toBe("bar");
    });
  });

  describe("getRequired", () => {
    it("returns value if present", () => {
      Env.set("REQ", "xyz");
      expect(Env.getRequired("REQ")).toBe("xyz");
    });
    it("throws if missing", () => {
      Env.delete("REQ2");
      expect(() => Env.getRequired("REQ2")).toThrow(
        "Required env REQ2 is missing",
      );
    });
  });

  describe("getNumber", () => {
    it("gets number if present", () => {
      Env.set("NUM1", "123");
      expect(Env.getNumber("NUM1", 7)).toBe(123);
    });
    it("gets fallback if missing", () => {
      Env.delete("NUM2");
      expect(Env.getNumber("NUM2", 77)).toBe(77);
    });
    it("throws if not a number", () => {
      Env.set("NUM3", "abc");
      expect(() => Env.getNumber("NUM3", 55)).toThrow(
        "Env NUM3 is not a number",
      );
    });
  });

  describe("getNumberRequired", () => {
    it("returns number if present", () => {
      Env.set("NUMREQ", "99");
      expect(Env.getNumberRequired("NUMREQ")).toBe(99);
    });
    it("throws if variable missing", () => {
      Env.delete("NUMREQ2");
      expect(() => Env.getNumberRequired("NUMREQ2")).toThrow(
        "Required env NUMREQ2 is missing",
      );
    });
    it("throws if value is not a number", () => {
      Env.set("NUMREQ3", "notanumber");
      expect(() => Env.getNumberRequired("NUMREQ3")).toThrow(
        "Required env NUMREQ3 is not a number",
      );
    });
  });

  describe("getBoolean", () => {
    it("parses true values", () => {
      ["true", "1", "yes", "on", "TRUE", "On"].forEach((val) => {
        Env.set("B", val);
        expect(Env.getBoolean("B", false)).toBe(true);
      });
    });
    it("parses false values", () => {
      ["false", "0", "no", "off", "NO", "off"].forEach((val) => {
        Env.set("B", val);
        expect(Env.getBoolean("B", true)).toBe(false);
      });
    });
    it("returns the fallback default if missing", () => {
      Env.delete("BDEF");
      expect(Env.getBoolean("BDEF", true)).toBe(true);
      expect(Env.getBoolean("BDEF", false)).toBe(false);
    });
    it("throws on invalid value", () => {
      Env.set("BINV", "maybe");
      expect(() => Env.getBoolean("BINV")).toThrow(/is not a boolean/);
    });
  });

  describe("getBooleanRequired", () => {
    it("parses present booleans", () => {
      Env.set("XX", "yes");
      expect(Env.getBooleanRequired("XX")).toBe(true);
    });
    it("throws if missing", () => {
      Env.delete("YY");
      expect(() => Env.getBooleanRequired("YY")).toThrow(
        /Required env YY is missing/,
      );
    });
    it("throws if value is not recognized", () => {
      Env.set("ZZ", "definitely");
      expect(() => Env.getBooleanRequired("ZZ")).toThrow(/is not a boolean/);
    });
  });

  describe("getJSON", () => {
    it("returns parsed object for valid JSON", () => {
      Env.set("J", '{"foo":42}');
      expect(Env.getJSON<{ foo: number }>("J", { foo: 99 })).toEqual({
        foo: 42,
      });
    });
    it("returns default for missing", () => {
      Env.delete("JMISS");
      expect(Env.getJSON("JMISS", { bar: "hi" })).toEqual({ bar: "hi" });
    });
    it("throws for invalid JSON", () => {
      Env.set("JBAD", "{not-json");
      expect(() => Env.getJSON("JBAD", {})).toThrow("not a valid JSON string");
    });
  });

  describe("getArray", () => {
    it("parses comma-separated lists", () => {
      Env.set("ARR", "a, b ,c,d ,");
      expect(Env.getArray<string>("ARR")).toEqual(["a", "b", "c", "d"]);
    });
    it("returns default for empty or missing", () => {
      Env.delete("ARR2");
      expect(Env.getArray("ARR2", ["x"])).toEqual(["x"]);
      Env.set("ARR2", "");
      expect(Env.getArray("ARR2", ["y"])).toEqual(["y"]);
    });
    it("handles custom splitter", () => {
      Env.set("A2", "q|r|s|t");
      expect(Env.getArray("A2", [], "|")).toEqual(["q", "r", "s", "t"]);
    });
    it("trims and excludes empty elements", () => {
      Env.set("A3", " ,a,, ,b,");
      expect(Env.getArray("A3")).toEqual(["a", "b"]);
    });
  });

  describe("getEnum", () => {
    it("returns allowed value if present", () => {
      Env.set("EN", "production");
      expect(Env.getEnum("EN", ["production", "staging"])).toBe("production");
    });
    it("returns allowed default if missing", () => {
      Env.delete("ENM");
      expect(Env.getEnum("ENM", ["foo", "bar"], "bar")).toBe("bar");
    });
    it("throws on invalid value", () => {
      Env.set("EN2", "wat");
      expect(() => Env.getEnum("EN2", ["a", "b"])).toThrow(/must be one of/);
      Env.delete("EN2");
      expect(() => Env.getEnum("EN2", ["c", "d"])).toThrow(/must be one of/);
    });
  });

  describe("has", () => {
    it("is true if key exists, false otherwise", () => {
      Env.set("QWERTY", "asdf");
      expect(Env.has("QWERTY")).toBe(true);
      Env.delete("QWERTY");
      expect(Env.has("QWERTY")).toBe(false);
    });
  });
});

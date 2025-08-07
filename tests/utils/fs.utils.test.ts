import fs from "fs/promises";
import path from "path";
import os from "os";

import {
  fileExists,
  readJsonFile,
  writeJsonFile,
  deleteFileIfExists,
} from "../../src/utils/fs.utils";

describe("FsUtils", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "futil-"));
  });

  afterEach(async () => {
    // Cleanup the temp dir (ignore errors)
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  });

  function tmpfile(name = "test.json") {
    return path.join(tempDir, name);
  }

  describe("fileExists", () => {
    it("returns true for an existing file", async () => {
      const file = tmpfile();
      await fs.writeFile(file, "abc");
      expect(await fileExists(file)).toBe(true);
    });

    it("returns true for an existing directory", async () => {
      expect(await fileExists(tempDir)).toBe(true);
    });

    it("returns false for a missing path", async () => {
      expect(await fileExists(tmpfile("missing.txt"))).toBe(false);
    });
  });

  describe("readJsonFile", () => {
    it("returns parsed object if file is valid JSON", async () => {
      const file = tmpfile();
      const obj = { foo: 42, bar: "baz" };
      await fs.writeFile(file, JSON.stringify(obj));
      expect(await readJsonFile<typeof obj>(file)).toEqual(obj);
    });

    it("returns null if file does not exist", async () => {
      expect(await readJsonFile(tmpfile("dne.json"))).toBeNull();
    });

    it("returns null if file is not JSON", async () => {
      const file = tmpfile();
      await fs.writeFile(file, "not { json: [");
      expect(await readJsonFile(file)).toBeNull();
    });
  });

  describe("writeJsonFile", () => {
    it("writes object as pretty JSON by default", async () => {
      const file = tmpfile();
      const data = { a: 1, b: [2, 3] };
      await writeJsonFile(file, data);
      // Should be properly formatted (default 2-space indent)
      const text = await fs.readFile(file, "utf-8");
      expect(text.startsWith("{\n")).toBe(true);
      expect(JSON.parse(text)).toEqual(data);
    });

    it("writes compact JSON if space is 0", async () => {
      const file = tmpfile();
      await writeJsonFile(file, { x: 7 }, 0);
      const text = await fs.readFile(file, "utf-8");
      expect(text).toBe('{"x":7}');
    });

    it("overwrites previous file content", async () => {
      const file = tmpfile();
      await fs.writeFile(file, '{"old":true}');
      await writeJsonFile(file, { n: 1 });
      const text = await fs.readFile(file, "utf-8");
      expect(JSON.parse(text)).toEqual({ n: 1 });
    });
  });

  describe("deleteFileIfExists", () => {
    it("deletes a file if it exists and returns true", async () => {
      const file = tmpfile();
      await fs.writeFile(file, "to-delete");
      expect(await fileExists(file)).toBe(true);
      expect(await deleteFileIfExists(file)).toBe(true);
      expect(await fileExists(file)).toBe(false);
    });

    it("returns true if file does not exist", async () => {
      const file = tmpfile("nothere.txt");
      expect(await deleteFileIfExists(file)).toBe(true);
    });

    it("returns false if deletion fails for another reason", async () => {
      // Try to delete a directory (should fail with EISDIR)
      expect(await deleteFileIfExists(tempDir)).toBe(false);
    });
  });
});

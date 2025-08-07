import fsp from "fs/promises";
import path from "path";
import os from "os";

import {
  ensureDir,
  listFiles,
  deleteDirRecursive,
  isDirectory,
  copyDir,
  moveDir,
  emptyDir,
  getDirSize,
  watchDir,
} from "../../src/utils/dir.utils";

describe("DirUtils", () => {
  let tempDir: string;

  // Use a new temp dir for each test file
  beforeEach(async () => {
    tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "fsutil-"));
  });
  afterEach(async () => {
    if (
      await fsp.stat(tempDir).then(
        () => true,
        () => false,
      )
    ) {
      await fsp.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe("ensureDir", () => {
    it("creates nested directories if not exists", async () => {
      const p = path.join(tempDir, "foo/bar/baz");
      await ensureDir(p);
      expect(await isDirectory(p)).toBe(true);
    });

    it("does not throw if directory already exists", async () => {
      await ensureDir(tempDir);
      await expect(ensureDir(tempDir)).resolves.toBeUndefined();
    });
  });

  describe("listFiles", () => {
    beforeEach(async () => {
      // Setup structure:
      // tempDir/a.txt
      // tempDir/sub/foo.txt
      await ensureDir(path.join(tempDir, "sub"));
      await fsp.writeFile(path.join(tempDir, "a.txt"), "a");
      await fsp.writeFile(path.join(tempDir, "sub", "foo.txt"), "b");
      await fsp.writeFile(path.join(tempDir, "sub", "bar.md"), "c");
    });

    it("lists files non-recursively", async () => {
      const files = await listFiles(tempDir, false);
      const expected = [path.join(tempDir, "a.txt")];
      expect(files.sort()).toEqual(expected.sort());
    });

    it("lists all files recursively", async () => {
      const files = await listFiles(tempDir, true);
      const expected = [
        path.join(tempDir, "a.txt"),
        path.join(tempDir, "sub", "foo.txt"),
        path.join(tempDir, "sub", "bar.md"),
      ];
      expect(files.sort()).toEqual(expected.sort());
    });
  });

  describe("deleteDirRecursive", () => {
    it("removes directory and all contents", async () => {
      const p = path.join(tempDir, "stuff");
      await ensureDir(p);
      await fsp.writeFile(path.join(p, "file.txt"), "data");
      await deleteDirRecursive(p);
      expect(await isDirectory(p)).toBe(false);
    });
  });

  describe("isDirectory", () => {
    it("returns true for directories, false for files, false for non-existing", async () => {
      expect(await isDirectory(tempDir)).toBe(true);
      const file = path.join(tempDir, "f.txt");
      await fsp.writeFile(file, "x");
      expect(await isDirectory(file)).toBe(false);
      expect(await isDirectory(path.join(tempDir, "none"))).toBe(false);
    });
  });

  describe("copyDir", () => {
    it("copies directory contents recursively", async () => {
      const src = path.join(tempDir, "src");
      const dst = path.join(tempDir, "dst");
      await ensureDir(path.join(src, "sub"));
      await fsp.writeFile(path.join(src, "file.txt"), "abc");
      await fsp.writeFile(path.join(src, "sub", "data.md"), "hi");
      await copyDir(src, dst);
      expect(await isDirectory(dst)).toBe(true);
      expect(await fsp.readFile(path.join(dst, "file.txt"), "utf8")).toBe(
        "abc",
      );
      expect(await fsp.readFile(path.join(dst, "sub", "data.md"), "utf8")).toBe(
        "hi",
      );
    });
  });

  describe("moveDir", () => {
    it("moves directory and leaves nothing behind", async () => {
      const src = path.join(tempDir, "src");
      const dst = path.join(tempDir, "dst");
      await ensureDir(src);
      await fsp.writeFile(path.join(src, "a.txt"), "mvd");
      await moveDir(src, dst);
      expect(await isDirectory(src)).toBe(false);
      expect(await fsp.readFile(path.join(dst, "a.txt"), "utf8")).toBe("mvd");
    });
  });

  describe("emptyDir", () => {
    it("removes all contents but keeps containing directory", async () => {
      const p = path.join(tempDir, "empt");
      await ensureDir(path.join(p, "sub"));
      await fsp.writeFile(path.join(p, "a.txt"), "q");
      await fsp.writeFile(path.join(p, "sub", "foo"), "w");
      await emptyDir(p);
      expect(await fsp.readdir(p)).toHaveLength(0);
      expect(await isDirectory(p)).toBe(true);
    });
  });

  describe("getDirSize", () => {
    it("sums all file sizes recursively", async () => {
      const d = path.join(tempDir, "sizedir");
      await ensureDir(path.join(d, "deep"));
      await fsp.writeFile(path.join(d, "one.txt"), "abcde"); // 5
      await fsp.writeFile(path.join(d, "deep", "two.bin"), "foobar"); // 6
      const size = await getDirSize(d); // should be 11
      expect(size).toBe(11);
    });
    it("returns 0 for empty directory", async () => {
      const d = path.join(tempDir, "empty");
      await ensureDir(d);
      expect(await getDirSize(d)).toBe(0);
    });
  });

  describe("watchDir", () => {
    it("triggers callback on change", async () => {
      const events: Array<{ event: string; filename: string | null }> = [];
      const watcherDir = path.join(tempDir, "watchme");
      await ensureDir(watcherDir);

      const stop = watchDir(watcherDir, (event, filename) => {
        events.push({ event, filename });
      });

      // Write file to trigger
      const f = path.join(watcherDir, "abc.txt");
      await fsp.writeFile(f, "z");
      // fs.watch is not guaranteed to fire immediately, so wait a bit
      await new Promise((res) => setTimeout(res, 300));
      stop();
      expect(events.some((e) => e.filename === "abc.txt")).toBe(true);
    });
  });
});

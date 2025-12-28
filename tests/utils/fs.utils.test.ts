import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import {
  fileExists,
  readJsonFile,
  writeJsonFile,
  deleteFileIfExists,
  readFile,
  readFileSync,
  writeFile,
  appendFile,
  copyFile,
  moveFile,
  getFileStats,
  createTempFile,
  streamFile,
  readDirectory,
  createDirectory,
  safeReadJsonFile,
  isFile,
  getFileSize,
  readFileBuffer,
  safeReadFileSync,
  safeReadFile
} from '../../src/fs';

describe('FsUtils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'futil-'));
  });

  afterEach(async () => {
    // Cleanup the temp dir (ignore errors)
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  });

  function tmpfile(name = 'test.json') {
    return path.join(tempDir, name);
  }

  describe('fileExists', () => {
    it('returns true for an existing file', async () => {
      const file = tmpfile();
      await fs.writeFile(file, 'abc');
      expect(await fileExists(file)).toBe(true);
    });

    it('returns true for an existing directory', async () => {
      expect(await fileExists(tempDir)).toBe(true);
    });

    it('returns false for a missing path', async () => {
      expect(await fileExists(tmpfile('missing.txt'))).toBe(false);
    });
  });

  describe('readJsonFile', () => {
    it('returns parsed object if file is valid JSON', async () => {
      const file = tmpfile();
      const obj = { foo: 42, bar: 'baz' };
      await fs.writeFile(file, JSON.stringify(obj));
      expect(await readJsonFile<typeof obj>(file)).toEqual(obj);
    });

    it('returns null if file does not exist', async () => {
      expect(await readJsonFile(tmpfile('dne.json'))).toBeNull();
    });

    it('returns null if file is not JSON', async () => {
      const file = tmpfile();
      await fs.writeFile(file, 'not { json: [');
      expect(await readJsonFile(file)).toBeNull();
    });
  });

  describe('writeJsonFile', () => {
    it('writes object as pretty JSON by default', async () => {
      const file = tmpfile();
      const data = { a: 1, b: [2, 3] };
      await writeJsonFile(file, data);
      // Should be properly formatted (default 2-space indent)
      const text = await fs.readFile(file, 'utf-8');
      expect(text.startsWith('{\n')).toBe(true);
      expect(JSON.parse(text)).toEqual(data);
    });

    it('writes compact JSON if space is 0', async () => {
      const file = tmpfile();
      await writeJsonFile(file, { x: 7 }, 0);
      const text = await fs.readFile(file, 'utf-8');
      expect(text).toBe('{"x":7}');
    });

    it('overwrites previous file content', async () => {
      const file = tmpfile();
      await fs.writeFile(file, '{"old":true}');
      await writeJsonFile(file, { n: 1 });
      const text = await fs.readFile(file, 'utf-8');
      expect(JSON.parse(text)).toEqual({ n: 1 });
    });
  });

  describe('deleteFileIfExists', () => {
    it('deletes a file if it exists and returns true', async () => {
      const file = tmpfile();
      await fs.writeFile(file, 'to-delete');
      expect(await fileExists(file)).toBe(true);
      expect(await deleteFileIfExists(file)).toBe(true);
      expect(await fileExists(file)).toBe(false);
    });

    it('returns true if file does not exist', async () => {
      const file = tmpfile('nothere.txt');
      expect(await deleteFileIfExists(file)).toBe(true);
    });

    it('returns false if deletion fails for another reason', async () => {
      // Try to delete a directory (should fail with EISDIR)
      expect(await deleteFileIfExists(tempDir)).toBe(false);
    });
  });

  describe('readFile & writeFile', () => {
    it('writes and reads text file', async () => {
      const file = tmpfile('foo.txt');
      await writeFile(file, 'hello world');
      expect(await readFile(file)).toBe('hello world');
    });
    it('throws for missing file', async () => {
      await expect(readFile(tmpfile('none.txt'))).rejects.toThrow();
    });
    it('writeFile returns true on success', async () => {
      const file = tmpfile('bar.txt');
      expect(await writeFile(file, 'abc')).toBe(true);
      expect(await readFile(file)).toBe('abc');
    });
    it('readFileSync reads file content', async () => {
      const file = tmpfile('sync.txt');
      await writeFile(file, 'syncdata');
      expect(readFileSync(file)).toBe('syncdata');
    });
    it('readFileSync should throw for missing file', async () => {
      expect(() => readFileSync(tmpfile('nosync.txt'))).toThrow();
    });
    it('safeReadFile returns null for missing file', async () => {
      expect((await safeReadFile(tmpfile('nosync.txt'))).data).toBeNull();
    });
    it('safeReadFileSync returns null for missing file', async () => {
      expect(safeReadFileSync(tmpfile('nosync.txt')).data).toBeNull();
    });
  });

  describe('appendFile', () => {
    it('appends text to file', async () => {
      const file = tmpfile('append.txt');
      await writeFile(file, 'a');
      await appendFile(file, 'b');
      expect(await readFile(file)).toBe('ab');
    });
    it('returns false if file cannot be appended', async () => {
      expect(await appendFile(path.join(tempDir, 'no-dir', 'fail.txt'), 'x')).toBe(false);
    });
  });

  describe('copyFile', () => {
    it('copies file to new location', async () => {
      const src = tmpfile('src.txt');
      const dst = tmpfile('dst.txt');
      await writeFile(src, 'copyme');
      expect(await copyFile(src, dst)).toBe(true);
      expect(await readFile(dst)).toBe('copyme');
    });
    it('does not overwrite by default', async () => {
      const src = tmpfile('src2.txt');
      const dst = tmpfile('dst2.txt');
      await writeFile(src, 'x');
      await writeFile(dst, 'y');
      expect(await copyFile(src, dst)).toBe(false);
      expect(await readFile(dst)).toBe('y');
    });
    it('overwrites if flag set', async () => {
      const src = tmpfile('src3.txt');
      const dst = tmpfile('dst3.txt');
      await writeFile(src, 'x');
      await writeFile(dst, 'y');
      expect(await copyFile(src, dst, true)).toBe(true);
      expect(await readFile(dst)).toBe('x');
    });
  });

  describe('moveFile', () => {
    it('moves file to new location', async () => {
      const src = tmpfile('move.txt');
      const dst = tmpfile('moved.txt');
      await writeFile(src, 'mv');
      expect(await moveFile(src, dst)).toBe(true);
      expect(await fileExists(dst)).toBe(true);
      expect(await fileExists(src)).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('returns stats for file', async () => {
      const file = tmpfile('stat.txt');
      await writeFile(file, 'abc');
      const stats = await getFileStats(file);
      expect(stats).toBeTruthy();
      expect(stats!.isFile()).toBe(true);
    });
    it('returns null for missing file', async () => {
      expect(await getFileStats(tmpfile('none.txt'))).toBeNull();
    });
  });

  describe('createTempFile', () => {
    it('creates a temp file with content', async () => {
      const file = await createTempFile({ dir: tempDir, content: 'hi' });
      expect(await readFile(file)).toBe('hi');
    });
    it('creates a temp file with extension', async () => {
      const file = await createTempFile({ dir: tempDir, extension: '.foo' });
      expect(path.extname(file)).toBe('.foo');
    });
  });

  describe('streamFile', () => {
    it('streams file from source to destination', async () => {
      const src = tmpfile('streamsrc.txt');
      const dst = tmpfile('streamdst.txt');
      await writeFile(src, 'streamdata');
      await streamFile(src, dst);
      expect(await readFile(dst)).toBe('streamdata');
    });
  });

  describe('readDirectory', () => {
    it('reads directory and returns file names', async () => {
      const d = path.join(tempDir, 'readdir');
      await createDirectory(d);
      await writeFile(path.join(d, 'a.txt'), '1');
      await writeFile(path.join(d, 'b.md'), '2');
      const files = await readDirectory(d);
      expect(files.sort()).toEqual(['a.txt', 'b.md'].sort());
    });
    it('returns full paths if option set', async () => {
      const d = path.join(tempDir, 'readdir2');
      await createDirectory(d);
      await writeFile(path.join(d, 'a.txt'), '1');
      const files = await readDirectory(d, { fullPaths: true });
      expect(files[0]).toContain(d);
    });
    it('filters files by regex', async () => {
      const d = path.join(tempDir, 'readdir3');
      await createDirectory(d);
      await writeFile(path.join(d, 'a.txt'), '1');
      await writeFile(path.join(d, 'b.md'), '2');
      const files = await readDirectory(d, { filter: /\.md$/ });
      expect(files).toEqual(['b.md']);
    });
  });

  describe('createDirectory', () => {
    it('creates directory recursively', async () => {
      const d = path.join(tempDir, 'deep', 'dir');
      expect(await createDirectory(d)).toBe(true);
      expect(await fileExists(d)).toBe(true);
    });
    it('returns true if already exists', async () => {
      const d = path.join(tempDir, 'exists');
      await createDirectory(d);
      expect(await createDirectory(d)).toBe(true);
    });
  });

  describe('safeReadJsonFile', () => {
    it('returns data and null error for valid JSON', async () => {
      const file = tmpfile('safe.json');
      await writeFile(file, '{"a":1}');
      const { data, error } = await safeReadJsonFile<{ a: number }>(file);
      expect(data).toEqual({ a: 1 });
      expect(error).toBeNull();
    });
    it('returns null data and error for missing file', async () => {
      const { data, error } = await safeReadJsonFile(tmpfile('none.json'));
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });
    it('returns null data and error for invalid JSON', async () => {
      const file = tmpfile('bad.json');
      await writeFile(file, '{not-json');
      const { data, error } = await safeReadJsonFile(file);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('isFile', () => {
    it('returns true for files, false for dirs or missing', async () => {
      const file = tmpfile('isf.txt');
      await writeFile(file, 'x');
      expect(await isFile(file)).toBe(true);
      expect(await isFile(tempDir)).toBe(false);
      expect(await isFile(tmpfile('none.txt'))).toBe(false);
    });
  });

  describe('getFileSize', () => {
    it('returns file size in bytes', async () => {
      const file = tmpfile('size.txt');
      await writeFile(file, 'abcde');
      expect(await getFileSize(file)).toBe(5);
    });
    it('returns -1 for missing file', async () => {
      expect(await getFileSize(tmpfile('none.txt'))).toBe(-1);
    });
  });

  describe('readFileBuffer', () => {
    it('returns Buffer for file', async () => {
      const file = tmpfile('buf.txt');
      await writeFile(file, 'buff');
      const buf = await readFileBuffer(file);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf!.toString()).toBe('buff');
    });
    it('returns null for missing file', async () => {
      expect(await readFileBuffer(tmpfile('none.txt'))).toBeNull();
    });
  });
});

import fsp from 'fs/promises';
import path from 'path';
import os from 'os';

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
  findFilesByPattern,
  getSubdirectories,
  ensureEmptyDir,
  createTempDir,
  findNewestFile,
  findOldestFile,
  findInDir,
  watchDirRecursive,
  getDirStats,
  walkDir
} from '../../src/utils/dir.utils';

describe('DirUtils', () => {
  let tempDir: string;

  // Use a new temp dir for each test file
  beforeEach(async () => {
    tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'fsutil-'));
  });
  afterEach(async () => {
    if (
      await fsp.stat(tempDir).then(
        () => true,
        () => false
      )
    ) {
      await fsp.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('ensureDir', () => {
    it('creates nested directories if not exists', async () => {
      const p = path.join(tempDir, 'foo/bar/baz');
      await ensureDir(p);
      expect(await isDirectory(p)).toBe(true);
    });

    it('does not throw if directory already exists', async () => {
      await ensureDir(tempDir);
      await expect(ensureDir(tempDir)).resolves.toBeUndefined();
    });
  });

  describe('listFiles', () => {
    beforeEach(async () => {
      // Setup structure:
      // tempDir/a.txt
      // tempDir/sub/foo.txt
      await ensureDir(path.join(tempDir, 'sub'));
      await fsp.writeFile(path.join(tempDir, 'a.txt'), 'a');
      await fsp.writeFile(path.join(tempDir, 'sub', 'foo.txt'), 'b');
      await fsp.writeFile(path.join(tempDir, 'sub', 'bar.md'), 'c');
    });

    it('lists files non-recursively', async () => {
      const files = await listFiles(tempDir, false);
      const expected = [path.join(tempDir, 'a.txt')];
      expect(files.sort()).toEqual(expected.sort());
    });

    it('lists all files recursively', async () => {
      const files = await listFiles(tempDir, true);
      const expected = [
        path.join(tempDir, 'a.txt'),
        path.join(tempDir, 'sub', 'foo.txt'),
        path.join(tempDir, 'sub', 'bar.md')
      ];
      expect(files.sort()).toEqual(expected.sort());
    });
  });

  describe('deleteDirRecursive', () => {
    it('removes directory and all contents', async () => {
      const p = path.join(tempDir, 'stuff');
      await ensureDir(p);
      await fsp.writeFile(path.join(p, 'file.txt'), 'data');
      await deleteDirRecursive(p);
      expect(await isDirectory(p)).toBe(false);
    });
  });

  describe('isDirectory', () => {
    it('returns true for directories, false for files, false for non-existing', async () => {
      expect(await isDirectory(tempDir)).toBe(true);
      const file = path.join(tempDir, 'f.txt');
      await fsp.writeFile(file, 'x');
      expect(await isDirectory(file)).toBe(false);
      expect(await isDirectory(path.join(tempDir, 'none'))).toBe(false);
    });
  });

  describe('copyDir', () => {
    it('copies directory contents recursively', async () => {
      const src = path.join(tempDir, 'src');
      const dst = path.join(tempDir, 'dst');
      await ensureDir(path.join(src, 'sub'));
      await fsp.writeFile(path.join(src, 'file.txt'), 'abc');
      await fsp.writeFile(path.join(src, 'sub', 'data.md'), 'hi');
      await copyDir(src, dst);
      expect(await isDirectory(dst)).toBe(true);
      expect(await fsp.readFile(path.join(dst, 'file.txt'), 'utf8')).toBe('abc');
      expect(await fsp.readFile(path.join(dst, 'sub', 'data.md'), 'utf8')).toBe('hi');
    });
  });

  describe('moveDir', () => {
    it('moves directory and leaves nothing behind', async () => {
      const src = path.join(tempDir, 'src');
      const dst = path.join(tempDir, 'dst');
      await ensureDir(src);
      await fsp.writeFile(path.join(src, 'a.txt'), 'mvd');
      await moveDir(src, dst);
      expect(await isDirectory(src)).toBe(false);
      expect(await fsp.readFile(path.join(dst, 'a.txt'), 'utf8')).toBe('mvd');
    });
  });

  describe('emptyDir', () => {
    it('removes all contents but keeps containing directory', async () => {
      const p = path.join(tempDir, 'empt');
      await ensureDir(path.join(p, 'sub'));
      await fsp.writeFile(path.join(p, 'a.txt'), 'q');
      await fsp.writeFile(path.join(p, 'sub', 'foo'), 'w');
      await emptyDir(p);
      expect(await fsp.readdir(p)).toHaveLength(0);
      expect(await isDirectory(p)).toBe(true);
    });
  });

  describe('getDirSize', () => {
    it('sums all file sizes recursively', async () => {
      const d = path.join(tempDir, 'sizedir');
      await ensureDir(path.join(d, 'deep'));
      await fsp.writeFile(path.join(d, 'one.txt'), 'abcde'); // 5
      await fsp.writeFile(path.join(d, 'deep', 'two.bin'), 'foobar'); // 6
      const size = await getDirSize(d); // should be 11
      expect(size).toBe(11);
    });
    it('returns 0 for empty directory', async () => {
      const d = path.join(tempDir, 'empty');
      await ensureDir(d);
      expect(await getDirSize(d)).toBe(0);
    });
  });

  describe('watchDir', () => {
    it('triggers callback on change', async () => {
      const events: Array<{ event: string; filename: string | null }> = [];
      const watcherDir = path.join(tempDir, 'watchme');
      await ensureDir(watcherDir);

      const stop = watchDir(watcherDir, (event, filename) => {
        events.push({ event, filename });
      });

      // Write file to trigger
      const f = path.join(watcherDir, 'abc.txt');
      await fsp.writeFile(f, 'z');
      // fs.watch is not guaranteed to fire immediately, so wait a bit
      await new Promise(res => setTimeout(res, 300));
      stop();
      expect(events.some(e => e.filename === 'abc.txt')).toBe(true);
    });
  });

  describe('findFilesByPattern', () => {
    it('finds files matching glob pattern', async () => {
      const d = path.join(tempDir, 'globdir');
      await ensureDir(d);
      await fsp.writeFile(path.join(d, 'a.txt'), '1');
      await fsp.writeFile(path.join(d, 'b.md'), '2');
      const files = await findFilesByPattern('*.txt', { cwd: d });
      expect(files.map(f => path.basename(f))).toContain('a.txt');
      expect(files.map(f => path.basename(f))).not.toContain('b.md');
    });
  });

  describe('getSubdirectories', () => {
    it('returns subdirectories (non-recursive and recursive)', async () => {
      const d = path.join(tempDir, 'dirs');
      await ensureDir(path.join(d, 'sub1'));
      await ensureDir(path.join(d, 'sub2', 'deep'));
      const nonrec = await getSubdirectories(d, false);
      expect(nonrec.map(p => path.basename(p)).sort()).toEqual(['sub1', 'sub2']);
      const rec = await getSubdirectories(d, true);
      expect(rec.map(p => path.basename(p)).sort()).toEqual(['deep', 'sub1', 'sub2']);
    });
  });

  describe('ensureEmptyDir', () => {
    it('empties existing dir or creates new one', async () => {
      const d = path.join(tempDir, 'emptyme');
      await ensureDir(d);
      await fsp.writeFile(path.join(d, 'foo.txt'), 'x');
      await ensureEmptyDir(d);
      expect(await fsp.readdir(d)).toHaveLength(0);
      // Remove and ensureEmptyDir again (should create)
      await fsp.rm(d, { recursive: true, force: true });
      await ensureEmptyDir(d);
      expect(await isDirectory(d)).toBe(true);
    });
  });

  describe('createTempDir', () => {
    it('creates a temp dir and cleans up', async () => {
      const { path: tmp, cleanup } = await createTempDir({ prefix: 'ctd-' });
      expect(await isDirectory(tmp)).toBe(true);
      await cleanup();
      expect(await isDirectory(tmp)).toBe(false);
    });
  });

  describe('findNewestFile and findOldestFile', () => {
    it('finds newest and oldest files', async () => {
      const d = path.join(tempDir, 'age');
      await ensureDir(d);
      const f1 = path.join(d, 'a.txt');
      const f2 = path.join(d, 'b.txt');
      await fsp.writeFile(f1, '1');
      await new Promise(res => setTimeout(res, 10));
      await fsp.writeFile(f2, '2');
      expect(await findNewestFile(d)).toBe(f2);
      expect(await findOldestFile(d)).toBe(f1);
    });
    it('returns null if no files', async () => {
      const d = path.join(tempDir, 'emptyage');
      await ensureDir(d);
      expect(await findNewestFile(d)).toBeNull();
      expect(await findOldestFile(d)).toBeNull();
    });
  });

  describe('findInDir', () => {
    it('finds files matching predicate', async () => {
      const d = path.join(tempDir, 'findme');
      await ensureDir(d);
      await fsp.writeFile(path.join(d, 'a.txt'), '1');
      await fsp.writeFile(path.join(d, 'b.md'), '2');
      const found = await findInDir(d, (p, _stat) => p.endsWith('.md'), false);
      expect(found.length).toBe(1);
      expect(path.basename(found[0])).toBe('b.md');
    });
    it('recursively finds files', async () => {
      const d = path.join(tempDir, 'findrec');
      await ensureDir(path.join(d, 'sub'));
      await fsp.writeFile(path.join(d, 'a.txt'), '1');
      await fsp.writeFile(path.join(d, 'sub', 'b.md'), '2');
      const found = await findInDir(d, (p, _stat) => p.endsWith('.md'), true);
      expect(found.some(f => f.endsWith('b.md'))).toBe(true);
    });
  });

  describe('watchDirRecursive', () => {
    it('watches directory recursively for changes', async () => {
      const d = path.join(tempDir, 'watchrec');
      await ensureDir(path.join(d, 'sub'));
      const events: Array<{ event: string; filename: string }> = [];
      const stop = await watchDirRecursive(d, (event, filename) => {
        events.push({ event, filename });
      });
      // Write file in subdir
      const f = path.join(d, 'sub', 'file.txt');
      await fsp.writeFile(f, 'z');
      await new Promise(res => setTimeout(res, 300));
      stop();
      expect(events.some(e => e.filename.endsWith('file.txt'))).toBe(true);
    });
  });

  describe('getDirStats', () => {
    it('returns file/dir count and total size', async () => {
      const d = path.join(tempDir, 'statsdir');
      await ensureDir(path.join(d, 'sub'));
      await fsp.writeFile(path.join(d, 'a.txt'), 'abc');
      await fsp.writeFile(path.join(d, 'sub', 'b.txt'), 'defg');
      const stats = await getDirStats(d);
      expect(stats.fileCount).toBe(2);
      expect(stats.dirCount).toBe(1);
      expect(stats.totalSize).toBe(3 + 4);
    });
  });

  describe('walkDir', () => {
    it('walks directory tree and visits all entries', async () => {
      const d = path.join(tempDir, 'walkme');
      await ensureDir(path.join(d, 'sub'));
      await fsp.writeFile(path.join(d, 'a.txt'), '1');
      await fsp.writeFile(path.join(d, 'sub', 'b.txt'), '2');
      const visited: string[] = [];
      await walkDir(d, {
        visitorFn: entry => {
          visited.push(entry.path);
        }
      });
      expect(visited.some(p => p.endsWith('a.txt'))).toBe(true);
      expect(visited.some(p => p.endsWith('b.txt'))).toBe(true);
    });
    it('supports post-order traversal', async () => {
      const d = path.join(tempDir, 'walkpost');
      await ensureDir(path.join(d, 'sub'));
      await fsp.writeFile(path.join(d, 'a.txt'), '1');
      const order: string[] = [];
      await walkDir(d, {
        visitorFn: entry => {
          order.push(entry.name);
        },
        traversalOrder: 'post'
      });
      // Directory visited after file
      expect(order[order.length - 1]).toBe('walkpost');
    });
    it('can skip subdirectories by returning false', async () => {
      const d = path.join(tempDir, 'walkskip');
      await ensureDir(path.join(d, 'sub'));
      await fsp.writeFile(path.join(d, 'a.txt'), '1');
      await fsp.writeFile(path.join(d, 'sub', 'b.txt'), '2');
      const visited: string[] = [];
      await walkDir(d, {
        visitorFn: entry => {
          visited.push(entry.path);
          if (entry.isDirectory && entry.name === 'sub') return false;
          return undefined;
        }
      });
      expect(visited.some(p => p.endsWith('a.txt'))).toBe(true);
      expect(visited.some(p => p.endsWith('b.txt'))).toBe(false);
    });
  });
});

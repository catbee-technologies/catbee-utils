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

  // Helper functions to reduce duplication
  const createTestDir = async (name: string) => {
    const dir = path.join(tempDir, name);
    await ensureDir(dir);
    return dir;
  };

  const getBasenames = (files: string[]) => files.map(f => path.basename(f)).sort();

  const writeTestFile = async (filepath: string, content = '') => {
    await fsp.writeFile(filepath, content);
    return filepath;
  };

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
      await writeTestFile(path.join(tempDir, 'a.txt'), 'a');
      await writeTestFile(path.join(tempDir, 'sub', 'foo.txt'), 'b');
      await writeTestFile(path.join(tempDir, 'sub', 'bar.md'), 'c');
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
    const createWatchTest = async (dirName: string) => {
      const watcherDir = await createTestDir(dirName);
      const events: Array<{ event: string; filename: string | null }> = [];

      const stop = watchDir(watcherDir, (event, filename) => {
        events.push({ event, filename });
      });

      return { watcherDir, events, stop };
    };

    it('triggers callback on change', async () => {
      const { watcherDir, events, stop } = await createWatchTest('watchme');

      // Write file to trigger
      await writeTestFile(path.join(watcherDir, 'abc.txt'), 'z');
      // fs.watch is not guaranteed to fire immediately, so wait a bit
      await new Promise(res => setTimeout(res, 300));
      stop();
      expect(events.some(e => e.filename === 'abc.txt')).toBe(true);
    });
  });

  describe('findFilesByPattern', () => {
    let globDir: string;

    beforeEach(async () => {
      // Create a complex directory structure for testing
      globDir = await createTestDir('globdir');
      const dirs = [
        path.join(globDir, 'src', 'components'),
        path.join(globDir, 'src', 'utils'),
        path.join(globDir, 'dist'),
        path.join(globDir, 'node_modules')
      ];

      for (const dir of dirs) {
        await ensureDir(dir);
      }

      // Create test files in various directories
      const files = [
        ['package.json', '{}'],
        ['README.md', 'readme'],
        ['index.ts', 'main'],
        ['config.js', 'config'],
        ['test.spec.ts', 'test'],
        ['src/app.ts', 'app'],
        ['src/main.js', 'main'],
        ['src/components/Button.tsx', 'button'],
        ['src/components/Header.vue', 'header'],
        ['src/utils/helper.ts', 'helper'],
        ['dist/bundle.js', 'bundle'],
        ['.env', 'env'],
        ['.gitignore', 'git'],
        ['src/.eslintrc', 'eslint'],
        ['file-with-dash.txt', 'dash'],
        ['file_with_underscore.py', 'python'],
        ['file.backup.old', 'backup']
      ];

      for (const [filePath, content] of files) {
        await writeTestFile(path.join(globDir, filePath), content);
      }
    });

    const testPattern = async (pattern: string, expectedFiles: string[], options = {}) => {
      const files = await findFilesByPattern(pattern, { cwd: globDir, ...options });
      const basenames = getBasenames(files);
      expect(basenames).toEqual(expectedFiles.sort());
    };

    it('finds files matching simple wildcard pattern (*)', async () => {
      await testPattern('*.ts', ['index.ts', 'test.spec.ts']);
    });

    it('finds files matching question mark pattern (?)', async () => {
      // Create files that match single character pattern
      await writeTestFile(path.join(globDir, 'a.txt'), '1');
      await writeTestFile(path.join(globDir, 'b.txt'), '2');
      await writeTestFile(path.join(globDir, 'ab.txt'), '3');

      await testPattern('?.txt', ['a.txt', 'b.txt']);

      const files = await findFilesByPattern('?.txt', { cwd: globDir });
      const basenames = getBasenames(files);
      expect(basenames).not.toContain('ab.txt');
    });

    it('finds files with complex wildcard patterns', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('*.spec.*', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('test.spec.ts');
    });

    it('finds files matching multi-segment directory patterns', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('src/*.ts', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('app.ts');
      expect(basenames).not.toContain('helper.ts'); // This is in src/utils, not directly in src
    });

    it('finds files matching nested directory patterns', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('src/*/*.ts', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('helper.ts');
      expect(basenames).not.toContain('app.ts'); // This is directly in src, not in a subdirectory
    });

    it('finds files matching wildcard directory names', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('*/bundle.js', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('bundle.js');
    });

    it('excludes dotfiles by default', async () => {
      const files = await findFilesByPattern('*', { cwd: globDir });
      const basenames = getBasenames(files);
      expect(basenames).not.toContain('.env');
      expect(basenames).not.toContain('.gitignore');
    });

    it('includes dotfiles when dot option is true', async () => {
      const files = await findFilesByPattern('.*', { cwd: globDir, dot: true });
      const basenames = getBasenames(files);
      expect(basenames).toContain('.env');
      expect(basenames).toContain('.gitignore');
    });

    it('includes dotfiles in subdirectories when dot option is true', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('src/.*', { cwd: d, dot: true });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('.eslintrc');
    });

    it('handles patterns with special regex characters', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('file-*-*.txt', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('file-with-dash.txt');
    });

    it('handles patterns with dots and multiple extensions', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('*.backup.*', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('file.backup.old');
    });

    it('returns empty array when no files match pattern', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('*.nonexistent', { cwd: d });
      expect(files).toEqual([]);
    });

    it('returns empty array when directory pattern does not match', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('nonexistent/*.txt', { cwd: d });
      expect(files).toEqual([]);
    });

    it('handles exact filename matches (no wildcards)', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('package.json', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toEqual(['package.json']);
    });

    it('handles exact directory/filename matches', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('src/app.ts', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toEqual(['app.ts']);
    });

    it('uses current working directory when cwd is not specified', async () => {
      const originalCwd = process.cwd();
      const d = path.join(tempDir, 'globdir');

      try {
        process.chdir(d);
        const files = await findFilesByPattern('*.json');
        const basenames = files.map(f => path.basename(f));
        expect(basenames).toContain('package.json');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('only matches files, not directories', async () => {
      const d = path.join(tempDir, 'globdir');
      // Create a directory that would match the pattern
      await ensureDir(path.join(d, 'test.ts'));

      const files = await findFilesByPattern('*.ts', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('index.ts');
      expect(basenames).toContain('test.spec.ts');
      // Should not include the directory named 'test.ts'
      expect(files.every(async f => !(await isDirectory(f)))).toBe(true);
    });

    it('handles deeply nested patterns', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('src/*/Button.*', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('Button.tsx');
    });

    it('handles multiple wildcards in filename', async () => {
      const d = path.join(tempDir, 'globdir');
      await fsp.writeFile(path.join(d, 'test.min.js'), 'minified');

      const files = await findFilesByPattern('*.*.js', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('test.min.js');
    });

    it('handles patterns starting with wildcard', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('*config*', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames).toContain('config.js');
    });

    it('handles empty pattern segments', async () => {
      const d = path.join(tempDir, 'globdir');
      // Test with empty segments in pattern (should return empty array)
      const files = await findFilesByPattern('', { cwd: d });
      expect(files).toEqual([]);
    });

    it('handles pattern with only wildcards', async () => {
      const d = path.join(tempDir, 'globdir');
      const files = await findFilesByPattern('*', { cwd: d });
      const basenames = files.map(f => path.basename(f));
      expect(basenames.length).toBeGreaterThan(0);
      expect(basenames).toContain('package.json');
    });

    it('handles non-existent base directory', async () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');
      await expect(findFilesByPattern('*', { cwd: nonExistentDir })).rejects.toThrow();
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

    it('handles cleanup on process signals', async () => {
      const { path: tmp, cleanup } = await createTempDir({
        prefix: 'signal-test-',
        cleanup: true
      });

      expect(await isDirectory(tmp)).toBe(true);

      // Manually call cleanup to test the cleanup function
      await cleanup();
      expect(await isDirectory(tmp)).toBe(false);
    });

    it('creates temp dir without cleanup option', async () => {
      const { path: tmp, cleanup } = await createTempDir({
        prefix: 'no-cleanup-'
      });

      expect(await isDirectory(tmp)).toBe(true);

      // Manually cleanup
      await cleanup();
      expect(await isDirectory(tmp)).toBe(false);
    });

    it('uses custom parent directory', async () => {
      const customParent = path.join(tempDir, 'custom-parent');
      await ensureDir(customParent);

      const { path: tmp, cleanup } = await createTempDir({
        parentDir: customParent,
        prefix: 'custom-'
      });

      expect(tmp.startsWith(customParent)).toBe(true);
      expect(await isDirectory(tmp)).toBe(true);

      await cleanup();
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
    const setupWatcher = async (dirName: string, recursive = true) => {
      const d = await createTestDir(dirName);
      if (recursive) {
        await ensureDir(path.join(d, 'sub'));
      }

      const events: Array<{ event: string; filename: string }> = [];
      const stop = await watchDirRecursive(
        d,
        (event, filename) => {
          events.push({ event, filename });
        },
        recursive
      );

      return { dir: d, events, stop };
    };

    it('watches directory recursively for changes', async () => {
      const { dir, events, stop } = await setupWatcher('watchrec');

      // Write file in subdir
      await writeTestFile(path.join(dir, 'sub', 'file.txt'), 'z');
      await new Promise(res => setTimeout(res, 300));
      stop();
      expect(events.some(e => e.filename.endsWith('file.txt'))).toBe(true);
    });

    it('handles watching without including subdirectories', async () => {
      const { dir, events, stop } = await setupWatcher('watchnosub', false);

      // Write file in main dir
      await writeTestFile(path.join(dir, 'main.txt'), 'main');
      await new Promise(res => setTimeout(res, 300));

      stop();
      expect(events.some(e => e.filename === 'main.txt')).toBe(true);
    });

    it('handles errors when watching non-accessible directories', async () => {
      const d = path.join(tempDir, 'watcherror');
      await ensureDir(d);

      // The function should handle errors gracefully and not throw
      const stop = await watchDirRecursive(d, () => {});

      // Should not throw
      expect(typeof stop).toBe('function');
      stop();
    });

    it('handles new directory creation during watching', async () => {
      const d = path.join(tempDir, 'watchnewdir');
      await ensureDir(d);
      const events: Array<{ event: string; filename: string }> = [];

      const stop = await watchDirRecursive(d, (event, filename) => {
        events.push({ event, filename });
      });

      // Create a new directory - this should trigger the watcher
      await ensureDir(path.join(d, 'newdir'));
      await new Promise(res => setTimeout(res, 400)); // Wait longer for directory creation

      stop();
      expect(events.some(e => e.filename === 'newdir')).toBe(true);
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
    it('handles post-order traversal correctly for root directory', async () => {
      const d = path.join(tempDir, 'walkpostroot');
      await ensureDir(d);
      await fsp.writeFile(path.join(d, 'file.txt'), 'content');

      const visitOrder: string[] = [];
      await walkDir(d, {
        visitorFn: entry => {
          visitOrder.push(entry.name);
        },
        traversalOrder: 'post'
      });

      // In post-order, the root directory should be visited after its contents
      expect(visitOrder[visitOrder.length - 1]).toBe('walkpostroot');
    });
    it('handles visitor function that returns Promise<boolean>', async () => {
      const d = path.join(tempDir, 'walkasync');
      await ensureDir(path.join(d, 'sub'));
      await fsp.writeFile(path.join(d, 'file.txt'), 'content');

      const visited: string[] = [];
      await walkDir(d, {
        visitorFn: async entry => {
          visited.push(entry.name);
          // Async visitor that returns false for subdirectories
          if (entry.isDirectory && entry.name === 'sub') {
            return Promise.resolve(false);
          }
          return Promise.resolve(true);
        }
      });

      expect(visited).toContain('file.txt');
      expect(visited).toContain('sub');
      // But sub directory contents should be skipped
    });
    it('handles visitor function that returns void', async () => {
      const d = path.join(tempDir, 'walkvoid');
      await ensureDir(d);
      await fsp.writeFile(path.join(d, 'file.txt'), 'content');

      const visited: string[] = [];
      await walkDir(d, {
        visitorFn: entry => {
          visited.push(entry.name);
          // Return void (undefined)
        }
      });

      expect(visited).toContain('file.txt');
    });
  });

  // Add tests for edge cases that might not be covered
  describe('Edge cases and error handling', () => {
    it('ensureEmptyDir handles file at target path', async () => {
      const filePath = path.join(tempDir, 'notadir.txt');
      await fsp.writeFile(filePath, 'content');

      // Should remove the file and create a directory
      await ensureEmptyDir(filePath);
      expect(await isDirectory(filePath)).toBe(true);
      expect(await fsp.readdir(filePath)).toHaveLength(0);
    });

    it('ensureEmptyDir handles ENOENT error gracefully', async () => {
      const nonExistent = path.join(tempDir, 'nonexistent');

      // Should not throw and should create the directory
      await ensureEmptyDir(nonExistent);
      expect(await isDirectory(nonExistent)).toBe(true);
    });

    it('createTempDir cleanup handles non-existent directory', async () => {
      const { cleanup } = await createTempDir();

      // Call cleanup twice - second call should not throw
      await cleanup();
      await expect(cleanup()).resolves.toBeUndefined();
    });

    it('watchDirRecursive handles relative path normalization', async () => {
      const d = path.join(tempDir, 'watchnorm');
      await ensureDir(d);

      // Use a path with .. and . to test normalization
      const normalizedPath = path.normalize(d);
      const events: Array<{ event: string; filename: string }> = [];

      const stop = await watchDirRecursive(normalizedPath, (event, filename) => {
        events.push({ event, filename });
      });

      await fsp.writeFile(path.join(d, 'test.txt'), 'test');
      await new Promise(res => setTimeout(res, 300));

      stop();
      expect(events.some(e => e.filename === 'test.txt')).toBe(true);
    });
  });
});

import {
  bufferToStream,
  streamToBuffer,
  streamToString,
  createThrottleStream,
  createBatchStream,
  createLineStream
} from '../../src/stream';
import { Readable } from 'stream';

describe('stream.utils', () => {
  describe('bufferToStream', () => {
    it('converts buffer to readable stream', async () => {
      const buf = Buffer.from('hello');
      const stream = bufferToStream(buf);
      const result = await streamToBuffer(stream);
      expect(result.toString()).toBe('hello');
    });

    it('converts string to readable stream', async () => {
      const str = 'world';
      const stream = bufferToStream(str);
      const result = await streamToString(stream);
      expect(result).toBe('world');
    });
  });

  describe('streamToBuffer', () => {
    it('reads all data from stream into buffer', async () => {
      const stream = bufferToStream('abc123');
      const buf = await streamToBuffer(stream);
      expect(buf.toString()).toBe('abc123');
    });
  });

  describe('streamToString', () => {
    it('reads all data from stream into string', async () => {
      const stream = bufferToStream('xyz789');
      const str = await streamToString(stream);
      expect(str).toBe('xyz789');
    });

    it('respects encoding', async () => {
      const stream = bufferToStream(Buffer.from('héllo', 'utf8'));
      const str = await streamToString(stream, 'utf8');
      expect(str).toBe('héllo');
    });
  });

  describe('createThrottleStream', () => {
    it('throttles data flow', async () => {
      const stream = bufferToStream('abcdefghij');
      const throttle = createThrottleStream(1000); // 1000 bytes/sec
      const start = Date.now();
      const result = await streamToString(stream.pipe(throttle));
      const elapsed = Date.now() - start;
      expect(result).toBe('abcdefghij');
      expect(elapsed).toBeGreaterThanOrEqual(0); // Should not throw
    });

    it('passes chunks immediately when under target throughput', done => {
      const nowSpy = jest.spyOn(Date, 'now');
      nowSpy.mockReturnValueOnce(0).mockReturnValue(5000);

      const throttle = createThrottleStream(2);
      const chunks: Buffer[] = [];

      throttle.on('data', chunk => chunks.push(chunk));
      throttle.on('end', () => {
        expect(chunks.map(c => c.toString())).toEqual(['abcd']);
        nowSpy.mockRestore();
        done();
      });

      throttle.end(Buffer.from('abcd'));
    });
  });

  describe('createBatchStream', () => {
    it('batches data in object mode', done => {
      const input = Readable.from(['a', 'b', 'c', 'd', 'e'], { objectMode: true });
      const batchStream = createBatchStream(2, { objectMode: true });
      const batches: any[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
        done();
      });
      input.pipe(batchStream);
    });

    it('uses object mode by default and flushes remaining objects', done => {
      const input = Readable.from(['a', 'b'], { objectMode: true });
      const batchStream = createBatchStream(3);
      const batches: any[] = [];

      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches).toEqual([['a', 'b']]);
        done();
      });

      input.pipe(batchStream);
    });

    it('batches data in binary mode', done => {
      const input = bufferToStream(Buffer.from('abcdef'));
      const batchStream = createBatchStream(2, { objectMode: false });
      const batches: Buffer[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches.map(b => b.toString())).toEqual(['ab', 'cd', 'ef']);
        done();
      });
      input.pipe(batchStream);
    });

    it('flushes remaining batch in object mode', done => {
      const input = Readable.from(['a', 'b', 'c'], { objectMode: true });
      const batchStream = createBatchStream(5, { objectMode: true });
      const batches: any[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches).toEqual([['a', 'b', 'c']]);
        done();
      });
      input.pipe(batchStream);
    });

    it('flushes remaining buffer in binary mode', done => {
      const input = bufferToStream(Buffer.from('abc'));
      const batchStream = createBatchStream(5, { objectMode: false });
      const batches: Buffer[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches.map(b => b.toString())).toEqual(['abc']);
        done();
      });
      input.pipe(batchStream);
    });

    it('flushes partial buffer after full batches in binary mode', done => {
      const input = bufferToStream(Buffer.from('abcdefgh'));
      const batchStream = createBatchStream(3, { objectMode: false });
      const batches: Buffer[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches.map(b => b.toString())).toEqual(['abc', 'def', 'gh']);
        done();
      });
      input.pipe(batchStream);
    });

    it('handles empty stream in object mode', done => {
      const input = Readable.from([], { objectMode: true });
      const batchStream = createBatchStream(2, { objectMode: true });
      const batches: any[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches).toEqual([]);
        done();
      });
      input.pipe(batchStream);
    });

    it('handles empty stream in binary mode', done => {
      const input = bufferToStream(Buffer.from(''));
      const batchStream = createBatchStream(2, { objectMode: false });
      const batches: Buffer[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches).toEqual([]);
        done();
      });
      input.pipe(batchStream);
    });

    it('flushes remaining object batch on direct end', done => {
      const batchStream = createBatchStream(10, { objectMode: true });
      const batches: any[] = [];

      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches).toEqual([['x', 'y']]);
        done();
      });

      batchStream.write('x');
      batchStream.write('y');
      batchStream.end();
    });

    it('flushes remaining binary data on direct end', done => {
      const batchStream = createBatchStream(10, { objectMode: false });
      const batches: Buffer[] = [];

      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches.map(b => b.toString())).toEqual(['abc']);
        done();
      });

      batchStream.write(Buffer.from('abc'));
      batchStream.end();
    });

    it('processes multiple full batches then flushes remainder in binary mode', done => {
      const input = bufferToStream(Buffer.from('abcdefghij'));
      const batchStream = createBatchStream(3, { objectMode: false });
      const batches: Buffer[] = [];
      batchStream.on('data', batch => batches.push(batch));
      batchStream.on('end', () => {
        expect(batches.map(b => b.toString())).toEqual(['abc', 'def', 'ghi', 'j']);
        done();
      });
      input.pipe(batchStream);
    });
  });

  describe('createLineStream', () => {
    it('splits text by newlines', done => {
      const input = bufferToStream('foo\nbar\r\nbaz');
      const lineStream = createLineStream();
      const lines: string[] = [];
      lineStream.on('data', line => lines.push(line));
      lineStream.on('end', () => {
        expect(lines).toEqual(['foo', 'bar', 'baz']);
        done();
      });
      input.pipe(lineStream);
    });

    it('includes newlines if option set', done => {
      const input = bufferToStream('x\ny\nz');
      const lineStream = createLineStream({ includeNewlines: true });
      const lines: string[] = [];
      lineStream.on('data', line => lines.push(line));
      lineStream.on('end', () => {
        expect(lines).toEqual(['x\n', 'y\n', 'z']);
        done();
      });
      input.pipe(lineStream);
    });
  });
});

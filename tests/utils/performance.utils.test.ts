import { timeSync, timeAsync, timed, memoize, trackMemoryUsage } from '../../src/performance';
import { getLogger } from '../../src/logger';

const childLogger = { info: jest.fn(), error: jest.fn() };
jest.mock('../../src/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    child: jest.fn(() => childLogger)
  }))
}));

describe('performance.utils', () => {
  describe('timeSync', () => {
    it('measures sync function execution time', () => {
      const { result, timing } = timeSync(() => 42);
      expect(result).toBe(42);
      expect(timing.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof timing.label).toBe('string');
    });

    it('uses custom label and logs', () => {
      const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      const { timing } = timeSync(() => 1, { label: 'TestLabel', log: false });
      expect(timing.label).toBe('TestLabel');
      spy.mockRestore();
    });
  });

  describe('timeAsync', () => {
    it('measures async function execution time', async () => {
      const { result, timing } = await timeAsync(async () => {
        await new Promise(res => setTimeout(res, 10));
        return 'done';
      });
      expect(result).toBe('done');
      expect(Math.ceil(timing.durationMs)).toBeGreaterThanOrEqual(10);
    });

    it('uses custom label and logs', async () => {
      const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      const { timing } = await timeAsync(async () => 1, { label: 'AsyncLabel', log: false });
      expect(timing.label).toBe('AsyncLabel');
      spy.mockRestore();
    });
  });

  describe('timed decorator', () => {
    it('decorates sync method', () => {
      class TestClass {
        @timed({ label: 'syncMethod' })
        syncMethod() {
          return 123;
        }
      }
      const obj = new TestClass();
      expect(obj.syncMethod()).toBe(123);
    });

    it('decorates async method', async () => {
      class TestClass {
        @timed({ label: 'asyncMethod' })
        async asyncMethod() {
          await new Promise(res => setTimeout(res, 5));
          return 'async';
        }
      }
      const obj = new TestClass();
      await expect(obj.asyncMethod()).resolves.toBe('async');
    });
  });

  describe('memoize', () => {
    it('caches sync results', () => {
      let callCount = 0;
      const fn = (x: number) => {
        callCount++;
        return x * 2;
      };
      const memoized = memoize(fn);
      expect(memoized(2)).toBe(4);
      expect(memoized(2)).toBe(4);
      expect(callCount).toBe(1);
    });

    it('uses custom cacheKey', () => {
      let callCount = 0;
      const fn = (x: number, y: number) => {
        callCount++;
        return x + y;
      };
      const memoized = memoize(fn, { cacheKey: (x, y) => `${x}:${y}` });
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(callCount).toBe(1);
    });
  });

  describe('trackMemoryUsage', () => {
    it('tracks memory usage for a function', () => {
      const { result, memoryUsage } = trackMemoryUsage(() => 99);
      expect(result).toBe(99);
      expect(memoryUsage.before).toBeDefined();
      expect(memoryUsage.after).toBeDefined();
      expect(memoryUsage.diff).toBeDefined();
    });
  });

  describe('timeSync logLevel switch', () => {
    const baseLogger = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    const logger = { ...baseLogger, child: jest.fn(() => baseLogger) };

    beforeEach(() => {
      (getLogger as jest.Mock).mockReturnValue(logger);
    });

    it('calls trace for logLevel=trace', () => {
      timeSync(() => 1, { log: true, logLevel: 'trace', label: 'traceTest' });
      expect(logger.trace).toHaveBeenCalled();
    });
    it('calls debug for logLevel=debug', () => {
      timeSync(() => 1, { log: true, logLevel: 'debug', label: 'debugTest' });
      expect(logger.debug).toHaveBeenCalled();
    });
    it('calls info for logLevel=info', () => {
      timeSync(() => 1, { log: true, logLevel: 'info', label: 'infoTest' });
      expect(logger.info).toHaveBeenCalled();
    });
    it('calls warn for logLevel=warn', () => {
      timeSync(() => 1, { log: true, logLevel: 'warn', label: 'warnTest' });
      expect(logger.warn).toHaveBeenCalled();
    });
    it('calls error for logLevel=error', () => {
      timeSync(() => 1, { log: true, logLevel: 'error', label: 'errorTest' });
      expect(logger.error).toHaveBeenCalled();
    });
    it('calls debug for unknown logLevel', () => {
      timeSync(() => 1, { log: true, logLevel: 'unknown' as any, label: 'unknownTest' });
      expect(logger.debug).toHaveBeenCalled();
    });
  });

  describe('timeAsync logLevel switch', () => {
    const baseLogger = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    const logger = { ...baseLogger, child: jest.fn(() => baseLogger) };

    beforeEach(() => {
      (getLogger as jest.Mock).mockReturnValue(logger);
    });

    it('calls trace for logLevel=trace', async () => {
      await timeAsync(async () => 1, { log: true, logLevel: 'trace', label: 'traceTest' });
      expect(logger.trace).toHaveBeenCalled();
    });
    it('calls debug for logLevel=debug', async () => {
      await timeAsync(async () => 1, { log: true, logLevel: 'debug', label: 'debugTest' });
      expect(logger.debug).toHaveBeenCalled();
    });
    it('calls info for logLevel=info', async () => {
      await timeAsync(async () => 1, { log: true, logLevel: 'info', label: 'infoTest' });
      expect(logger.info).toHaveBeenCalled();
    });
    it('calls warn for logLevel=warn', async () => {
      await timeAsync(async () => 1, { log: true, logLevel: 'warn', label: 'warnTest' });
      expect(logger.warn).toHaveBeenCalled();
    });
    it('calls error for logLevel=error', async () => {
      await timeAsync(async () => 1, { log: true, logLevel: 'error', label: 'errorTest' });
      expect(logger.error).toHaveBeenCalled();
    });
    it('calls debug for unknown logLevel', async () => {
      await timeAsync(async () => 1, { log: true, logLevel: 'unknown' as any, label: 'unknownTest' });
      expect(logger.debug).toHaveBeenCalled();
    });
  });
});

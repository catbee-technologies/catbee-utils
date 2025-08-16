import * as loggerUtils from '../../src/utils/logger.utils';
import { ContextStore, StoreKeys } from '../../src/utils/context-store.utils';
import pino from 'pino';

jest.mock('pino');
jest.mock('../../src/config', () => ({
  Config: {
    Logger: {
      name: 'TestLogger',
      level: 'info',
      isoTimestamp: false
    }
  }
}));
jest.mock('../../src/utils/context-store.utils', () => ({
  ContextStore: {
    get: jest.fn(),
    set: jest.fn()
  },
  StoreKeys: {
    LOGGER: Symbol('MOCK_LOGGER_KEY')
  }
}));

describe('LoggerUtils', () => {
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      child: jest.fn().mockReturnThis(),
      debug: jest.fn(),
      error: jest.fn()
    };
    (pino as unknown as jest.Mock).mockReturnValue(mockLogger);
    // Clear global logger
    delete (loggerUtils._globalThis as any)[Symbol.for('logger')];
  });

  describe('getLogger', () => {
    it('returns logger from context if available', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(mockLogger);
      const logger = loggerUtils.getLogger();
      expect(logger).toBe(mockLogger);
      expect(ContextStore.get).toHaveBeenCalledWith(StoreKeys.LOGGER);
    });

    it('creates and returns global logger if not in context', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(undefined);
      const logger = loggerUtils.getLogger();
      expect(logger).toBe(mockLogger);
      expect(pino).toHaveBeenCalled();
      // Should cache in global
      expect((loggerUtils._globalThis as any)[Symbol.for('logger')]).toBe(mockLogger);
    });

    it('does not recreate global logger if already set', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(undefined);
      (loggerUtils._globalThis as any)[Symbol.for('logger')] = mockLogger;
      const logger = loggerUtils.getLogger();
      expect(logger).toBe(mockLogger);
      expect(pino).not.toHaveBeenCalled();
    });

    it('returns request-scoped logger if in ContextStore', () => {
      const reqLogger = { log: jest.fn() };
      (ContextStore.get as jest.Mock).mockReturnValue(reqLogger);

      const result = loggerUtils.getLogger();
      expect(result).toBe(reqLogger);

      // Should not call pino or global logger setup at all
      expect(pino).not.toHaveBeenCalled();
    });
  });

  describe('createChildLogger', () => {
    it('creates a child logger with bindings', () => {
      mockLogger.child = jest.fn().mockReturnValue({ foo: 'bar' });
      const child = loggerUtils.createChildLogger({ foo: 'bar' }, mockLogger);
      expect(mockLogger.child).toHaveBeenCalledWith({ foo: 'bar' });
      expect(child).toEqual({ foo: 'bar' });
    });

    it('uses getLogger if parentLogger not provided', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(undefined);
      (pino as unknown as jest.Mock).mockReturnValue(mockLogger);
      mockLogger.child = jest.fn().mockReturnValue({ baz: 1 });
      const child = loggerUtils.createChildLogger({ baz: 1 });
      expect(mockLogger.child).toHaveBeenCalledWith({ baz: 1 });
      expect(child).toEqual({ baz: 1 });
    });
  });

  describe('createRequestLogger', () => {
    it('creates a child logger with requestId and stores in context', () => {
      mockLogger.child = jest.fn().mockReturnValue(mockLogger);
      const logger = loggerUtils.createRequestLogger('req-123', {
        user: 'alice'
      });
      expect(mockLogger.child).toHaveBeenCalledWith({
        requestId: 'req-123',
        user: 'alice'
      });
      expect(ContextStore.set).toHaveBeenCalledWith(StoreKeys.LOGGER, mockLogger);
      expect(logger).toBe(mockLogger);
    });

    it('logs debug if context store set fails', () => {
      mockLogger.child = jest.fn().mockReturnValue(mockLogger);
      (ContextStore.set as jest.Mock).mockImplementation(() => {
        throw new Error('fail');
      });
      loggerUtils.createRequestLogger('req-456');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Failed to store logger in context - AsyncLocalStorage not initialized'
      );
    });
  });

  describe('logError', () => {
    it('logs error with Error object', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(mockLogger);
      const err = new Error('fail!');
      loggerUtils.logError(err, 'msg', { foo: 1 });
      expect(mockLogger.error).toHaveBeenCalledWith({ foo: 1, err }, 'msg');
    });

    it('logs error with non-Error object', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(mockLogger);
      loggerUtils.logError('fail!', undefined, { bar: 2 });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ bar: 2, err: expect.any(Error) }),
        'fail!'
      );
    });

    it('logs error with no context', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(mockLogger);
      const err = new Error('oops');
      loggerUtils.logError(err);
      expect(mockLogger.error).toHaveBeenCalledWith({ err }, 'oops');
    });
  });
});

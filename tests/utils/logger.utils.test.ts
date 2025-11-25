import * as loggerUtils from '../../src/utils/logger.utils';
import { ContextStore, StoreKeys } from '../../src/utils/context-store.utils';
import pino from 'pino';
import { Env } from '../../src/utils/env.utils';

jest.mock('pino');
jest.mock('../../src/config', () => ({
  defaultCatbeeConfig: {
    logger: {
      name: 'TestLogger',
      level: 'info',
      pretty: true
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
      const error = new Error('fail!');
      loggerUtils.logError(error, 'msg', { foo: 1 });
      expect(mockLogger.error).toHaveBeenCalledWith({ foo: 1, error }, 'msg');
    });

    it('logs error with non-Error object', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(mockLogger);
      loggerUtils.logError('fail!', undefined, { bar: 2 });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ bar: 2, error: expect.any(Error) }),
        'fail!'
      );
    });

    it('logs error with no context', () => {
      (ContextStore.get as jest.Mock).mockReturnValue(mockLogger);
      const error = new Error('oops');
      loggerUtils.logError(error);
      expect(mockLogger.error).toHaveBeenCalledWith({ error }, 'oops');
    });
  });

  describe('setupLogger with pretty transport', () => {
    it('uses pino-pretty transport when pretty + dev', () => {
      const transportMock = jest.fn().mockReturnValue('transported');
      (pino as any).transport = transportMock;

      jest.spyOn(Env, 'isDev').mockReturnValue(true);

      const logger = loggerUtils.getLogger();
      expect(transportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'pino-pretty'
        })
      );
      expect(logger).toBe(mockLogger);
    });
  });

  describe('redactCensor', () => {
    it('should redact access_token in URL', () => {
      const url = '/api?access_token=abc123';
      expect(loggerUtils.getRedactCensor()(url, ['url'])).toBe('/api?access_token=***');
    });

    it('should redact token in URL', () => {
      const url = '/api?token=xyz';
      expect(loggerUtils.getRedactCensor()(url, ['url'])).toBe('/api?token=***');
    });

    it('should redact api_key in URL', () => {
      const url = '/api?api_key=secretKey';
      expect(loggerUtils.getRedactCensor()(url, ['url'])).toBe('/api?api_key=***');
    });

    it('should redact authorization header', () => {
      const header = 'Bearer mySecretToken';
      expect(loggerUtils.getRedactCensor()(header, ['req', 'authorization'])).toBe('***');
    });

    it('should redact basic auth header', () => {
      const header = 'Basic username:password';
      expect(loggerUtils.getRedactCensor()(header, ['authorization'])).toBe('***');
    });

    it('should redact common sensitive fields', () => {
      expect(loggerUtils.getRedactCensor()('mypassword', ['password'])).toBe('***');
      expect(loggerUtils.getRedactCensor()('jwtToken', ['jwt'])).toBe('***');
      expect(loggerUtils.getRedactCensor()('secretValue', ['secret'])).toBe('***');
      expect(loggerUtils.getRedactCensor()('apiKeyValue', ['apiKey'])).toBe('***');
    });

    it('should redact if path contains sensitive field anywhere', () => {
      expect(loggerUtils.getRedactCensor()('something', ['user', 'password'])).toBe('***');
      expect(loggerUtils.getRedactCensor()('something', ['auth', 'token'])).toBe('***');
    });

    it('should return "***" for non-string values', () => {
      expect(loggerUtils.getRedactCensor()(12345 as any, ['number'])).toBe('***');
      expect(loggerUtils.getRedactCensor()(null as any, ['null'])).toBe('***');
      expect(loggerUtils.getRedactCensor()({ key: 'value' } as any, ['object'])).toBe('***');
    });

    describe('setRedactCensor and getRedactCensor', () => {
      it('should allow setting and getting a custom redaction function', () => {
        // Save original censor to restore after test
        const originalCensor = loggerUtils.getRedactCensor();

        try {
          // Create a simple custom censor function
          const customCensor = (_value: unknown, _path: string[]) => {
            return 'CUSTOM_REDACTED';
          };

          // Set the custom censor
          loggerUtils.setRedactCensor(customCensor);

          // Verify the getter returns the custom censor
          expect(loggerUtils.getRedactCensor()).toBe(customCensor);

          // Verify the custom censor behavior
          expect(loggerUtils.getRedactCensor()('test value', ['any', 'path'])).toBe('CUSTOM_REDACTED');
        } finally {
          // Restore original censor after test
          loggerUtils.setRedactCensor(originalCensor);
        }
      });

      it('should allow custom censor to use sensitiveFields parameter', () => {
        const originalCensor = loggerUtils.getRedactCensor();

        try {
          // Create a censor that checks against provided sensitiveFields
          loggerUtils.setRedactCensor((value, path, sensitiveFields = ['password', 'secret', 'apiKey']) => {
            if (typeof value !== 'string') return '###';
            if (path.some(p => sensitiveFields?.includes(p))) {
              return '###SENSITIVE###';
            }
            return value;
          });

          // Test with default sensitive fields list
          expect(loggerUtils.getRedactCensor()('secret data', ['password'])).toBe('###SENSITIVE###');

          // Test with custom sensitive fields list
          expect(loggerUtils.getRedactCensor()('custom field', ['customField'], ['customField'])).toBe(
            '###SENSITIVE###'
          );
          expect(loggerUtils.getRedactCensor()('normal data', ['normal'], ['customField'])).toBe('normal data');
        } finally {
          // Restore original censor
          loggerUtils.setRedactCensor(originalCensor);
        }
      });

      it('should allow chaining of censors through composition', () => {
        const originalCensor = loggerUtils.getRedactCensor();

        try {
          // Get current censor
          const currentCensor = loggerUtils.getRedactCensor();

          // Create a composed censor that delegates to the original for some cases
          loggerUtils.setRedactCensor((value, path, sensitiveFields) => {
            // Special case
            if (path.includes('special')) {
              return '!!!SPECIAL!!!';
            }
            // Otherwise delegate to original censor
            return currentCensor(value, path, sensitiveFields);
          });

          // Test the special case
          expect(loggerUtils.getRedactCensor()('value', ['special'])).toBe('!!!SPECIAL!!!');

          // Test that original behavior still works for other cases
          expect(loggerUtils.getRedactCensor()('Bearer token', ['authorization'])).toBe('***');
        } finally {
          // Restore original censor
          loggerUtils.setRedactCensor(originalCensor);
        }
      });
    });

    describe('redact', () => {
      it('should call the global redact censor function', () => {
        const originalCensor = loggerUtils.getRedactCensor();
        const mockCensor = jest.fn().mockReturnValue('MOCK_REDACTED');

        try {
          loggerUtils.setRedactCensor(mockCensor);
          const result = loggerUtils.redact('test value', ['test', 'path'], ['sensitive']);

          expect(mockCensor).toHaveBeenCalledWith('test value', ['test', 'path'], ['sensitive']);
          expect(result).toBe('MOCK_REDACTED');
        } finally {
          loggerUtils.setRedactCensor(originalCensor);
        }
      });
    });

    describe('addRedactFields', () => {
      it('should extend the redact function with additional fields', () => {
        const originalCensor = loggerUtils.getRedactCensor();
        const mockCensor = jest.fn().mockImplementation((_value, _path, sensitiveFields) => {
          // Return the sensitive fields for testing
          return JSON.stringify(sensitiveFields);
        });

        try {
          loggerUtils.setRedactCensor(mockCensor);
          loggerUtils.addRedactFields(['custom1', 'custom2']);

          const result = loggerUtils.redact('value', ['path'], ['base']);
          const sensitiveFields = JSON.parse(result);

          expect(sensitiveFields).toContain('base');
          expect(sensitiveFields).toContain('custom1');
          expect(sensitiveFields).toContain('custom2');
        } finally {
          loggerUtils.setRedactCensor(originalCensor);
        }
      });
    });

    describe('setSensitiveFields', () => {
      it('should replace the default sensitive fields list', () => {
        // Save original fields
        const originalFields = [...loggerUtils.defaultSensitiveFields];

        try {
          loggerUtils.setSensitiveFields(['newField1', 'newField2']);

          expect(loggerUtils.defaultSensitiveFields).toHaveLength(2);
          expect(loggerUtils.defaultSensitiveFields).toContain('newField1');
          expect(loggerUtils.defaultSensitiveFields).toContain('newField2');
          expect(loggerUtils.defaultSensitiveFields).not.toContain(originalFields[0]);
        } finally {
          // Restore original fields
          loggerUtils.setSensitiveFields(originalFields);
        }
      });
    });

    describe('addSensitiveFields', () => {
      it('should add fields to the default sensitive fields list', () => {
        // Save original fields
        const originalFields = [...loggerUtils.defaultSensitiveFields];
        const originalLength = originalFields.length;

        try {
          loggerUtils.addSensitiveFields(['extraField1', 'extraField2']);

          expect(loggerUtils.defaultSensitiveFields).toHaveLength(originalLength + 2);
          expect(loggerUtils.defaultSensitiveFields).toContain('extraField1');
          expect(loggerUtils.defaultSensitiveFields).toContain('extraField2');

          // Should still contain all original fields
          originalFields.forEach(field => {
            expect(loggerUtils.defaultSensitiveFields).toContain(field);
          });
        } finally {
          // Restore original fields
          loggerUtils.setSensitiveFields(originalFields);
        }
      });
    });
  });

  describe('expandSensitiveFields', () => {
    it('should expand multiple fields into various naming conventions', () => {
      const fields = ['api_key', 'password'];
      const expanded = loggerUtils.expandSensitiveFields(fields);

      // Should contain variations of api_key
      expect(expanded).toContain('api_key');
      expect(expanded).toContain('apiKey');
      expect(expanded).toContain('apikey');
      expect(expanded).toContain('APIKEY');
      expect(expanded).toContain('api-key');
      expect(expanded).toContain('API_KEY');

      // Should contain variations of password
      expect(expanded).toContain('password');
      expect(expanded).toContain('PASSWORD');
    });

    it('should return unique values', () => {
      const fields = ['test', 'test'];
      const expanded = loggerUtils.expandSensitiveFields(fields);
      const uniqueCount = new Set(expanded).size;
      expect(uniqueCount).toBe(expanded.length);
    });
  });

  describe('expandSensitiveField', () => {
    it('should generate camelCase variant', () => {
      const variants = loggerUtils.expandSensitiveField('api_key');
      expect(variants).toContain('apiKey');
    });

    it('should generate lowercase merged variant', () => {
      const variants = loggerUtils.expandSensitiveField('api_key');
      expect(variants).toContain('apikey');
    });

    it('should generate uppercase merged variant', () => {
      const variants = loggerUtils.expandSensitiveField('api_key');
      expect(variants).toContain('APIKEY');
    });

    it('should generate kebab-case variant', () => {
      const variants = loggerUtils.expandSensitiveField('api_key');
      expect(variants).toContain('api-key');
    });

    it('should generate snake_case variants', () => {
      const variants = loggerUtils.expandSensitiveField('api_key');
      expect(variants).toContain('api_key');
      expect(variants).toContain('API_KEY');
      expect(variants).toContain('apiKey');
    });

    it('should return original field in the list', () => {
      const variants = loggerUtils.expandSensitiveField('password');
      expect(variants).toContain('password');
    });

    it('should handle single-word fields', () => {
      const variants = loggerUtils.expandSensitiveField('token');
      expect(variants).toContain('token');
      expect(variants).toContain('TOKEN');
    });

    it('should handle hyphenated fields', () => {
      const variants = loggerUtils.expandSensitiveField('access-token');
      expect(variants).toContain('accessToken');
      expect(variants).toContain('access_token');
      expect(variants).toContain('ACCESS_TOKEN');
    });
  });

  describe('generateDeepPaths', () => {
    it('should generate wildcard paths up to specified depth', () => {
      const paths = loggerUtils.generateDeepPaths('password', 2);

      expect(paths).toContain('password');
      expect(paths).toContain('*.password');
      expect(paths).toContain('*.*.password');
      expect(paths).toHaveLength(3); // depth 0, 1, 2
    });

    it('should work with depth 0', () => {
      const paths = loggerUtils.generateDeepPaths('token', 0);
      expect(paths).toEqual(['token']);
    });

    it('should work with depth 1', () => {
      const paths = loggerUtils.generateDeepPaths('secret', 1);
      expect(paths).toContain('secret');
      expect(paths).toContain('*.secret');
      expect(paths).toHaveLength(2);
    });

    it('should work with larger depths', () => {
      const paths = loggerUtils.generateDeepPaths('key', 5);
      expect(paths).toHaveLength(6); // depth 0-5
      expect(paths).toContain('key');
      expect(paths).toContain('*.*.*.*.*.key');
    });
  });

  describe('getExpandedSensitiveFields', () => {
    it('should cache expanded fields', () => {
      const first = loggerUtils.getExpandedSensitiveFields();
      const second = loggerUtils.getExpandedSensitiveFields();

      expect(first).toBe(second); // Same reference (cached)
    });

    it('should return expanded default sensitive fields', () => {
      const expanded = loggerUtils.getExpandedSensitiveFields();

      // Should contain variations of default fields
      expect(expanded.length).toBeGreaterThan(loggerUtils.defaultSensitiveFields.length);
      expect(expanded).toContain('password');
      expect(expanded).toContain('PASSWORD');
      expect(expanded).toContain('apiKey');
      expect(expanded).toContain('api_key');
    });
  });
});

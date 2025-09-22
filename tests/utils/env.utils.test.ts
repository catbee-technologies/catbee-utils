import { Env, Environment } from '../../src/utils/env.utils';
import fs from 'fs';

describe('Environment enum', () => {
  it('has all expected values', () => {
    expect(Environment.PRODUCTION).toBe('production');
    expect(Environment.DEVELOPMENT).toBe('development');
    expect(Environment.STAGING).toBe('staging');
    expect(Environment.TESTING).toBe('testing');
  });
});

describe('EnvUtils', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    Env.clearCache(); // Clear cache between tests
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  describe('isDev', () => {
    it("returns true if NODE_ENV is 'development'", () => {
      Env.set('NODE_ENV', 'development');
      expect(Env.isDev()).toBe(true);
    });

    it("returns false if NODE_ENV is not 'development'", () => {
      Env.set('NODE_ENV', 'production');
      expect(Env.isDev()).toBe(false);
    });

    it('defaults to development if NODE_ENV is unset', () => {
      Env.delete('NODE_ENV');
      expect(Env.isDev()).toBe(true);
    });
  });

  describe('isProd, isTest, isStaging', () => {
    it('isProd returns true only for production', () => {
      Env.set('NODE_ENV', 'production');
      expect(Env.isProd()).toBe(true);
      Env.set('NODE_ENV', 'development');
      expect(Env.isProd()).toBe(false);
    });
    it('isTest returns true only for testing', () => {
      Env.set('NODE_ENV', 'testing');
      expect(Env.isTest()).toBe(true);
      Env.set('NODE_ENV', 'production');
      expect(Env.isTest()).toBe(false);
    });
    it('isStaging returns true only for staging', () => {
      Env.set('NODE_ENV', 'staging');
      expect(Env.isStaging()).toBe(true);
      Env.set('NODE_ENV', 'production');
      expect(Env.isStaging()).toBe(false);
    });
  });

  describe('set, get, delete', () => {
    it('sets, gets, and deletes environment variables', () => {
      Env.set('FOOBAR', 'sometext');
      expect(Env.get('FOOBAR', '')).toBe('sometext');
      Env.delete('FOOBAR');
      expect(Env.get('FOOBAR', 'hello')).toBe('hello');
      expect(Env.has('FOOBAR')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('returns process.env', () => {
      expect(Env.getAll()).toBe(process.env);
    });
  });

  describe('get', () => {
    it('returns the fallback if provided', () => {
      expect(Env.get('NOPE', 'fally')).toBe('fally');
    });
    it('returns process.env value if present', () => {
      Env.set('FOO', 'bar');
      expect(Env.get('FOO', 'baz')).toBe('bar');
    });
    it('expands environment variables in values', () => {
      Env.set('BASE_URL', 'http://example.com');
      Env.set('API_PATH', '/api');
      Env.set('FULL_URL', '${BASE_URL}${API_PATH}');

      expect(Env.get('FULL_URL', '')).toBe('http://example.com/api');
    });

    it('handles missing variables in expansion', () => {
      Env.set('WITH_MISSING', 'prefix-${MISSING_VAR}-suffix');
      expect(Env.get('WITH_MISSING', '')).toBe('prefix--suffix');
    });
  });

  describe('getRequired', () => {
    it('returns value if present', () => {
      Env.set('REQ', 'xyz');
      expect(Env.getRequired('REQ')).toBe('xyz');
    });
    it('throws if missing', () => {
      Env.delete('REQ2');
      expect(() => Env.getRequired('REQ2')).toThrow(`Required environment variable 'REQ2' is missing`);
    });
  });

  describe('getWithDefault', () => {
    it('returns environment variable if it exists', () => {
      Env.set('WITH_DEFAULT', 'actual-value');
      const defaultFn = jest.fn().mockReturnValue('default-value');

      expect(Env.getWithDefault('WITH_DEFAULT', defaultFn)).toBe('actual-value');
      expect(defaultFn).not.toHaveBeenCalled();
    });

    it('calls the default function if variable is missing', () => {
      Env.delete('WITH_DEFAULT');
      const defaultFn = jest.fn().mockReturnValue('computed-default');

      expect(Env.getWithDefault('WITH_DEFAULT', defaultFn)).toBe('computed-default');
      expect(defaultFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNumber', () => {
    it('gets number if present', () => {
      Env.set('NUM1', '123');
      expect(Env.getNumber('NUM1', 7)).toBe(123);
    });
    it('gets fallback if missing', () => {
      Env.delete('NUM2');
      expect(Env.getNumber('NUM2', 77)).toBe(77);
    });
    it('throws if not a number', () => {
      Env.set('NUM3', 'abc');
      expect(() => Env.getNumber('NUM3', 55)).toThrow(`Environment variable 'NUM3' is not a valid number, got: "abc"`);
    });
  });

  describe('getNumberRequired', () => {
    it('gets number if present', () => {
      Env.set('NUM1', '123');
      expect(Env.getNumberRequired('NUM1')).toBe(123);
    });

    it('throws if missing', () => {
      Env.delete('NUM2');
      expect(() => Env.getNumberRequired('NUM2')).toThrow(`Required environment variable 'NUM2' is missing`);
    });

    it('throws if not a number', () => {
      Env.set('NUM3', 'abc');
      expect(() => Env.getNumberRequired('NUM3')).toThrow(
        `Environment variable 'NUM3' is not a valid number, got: "abc"`
      );
    });
  });

  describe('getNumberEnum', () => {
    it('returns allowed value if present', () => {
      Env.set('NUM_ENUM', '2');
      expect(Env.getNumberEnum('NUM_ENUM', [1, 2, 3], 1)).toBe(2);
    });

    it('returns allowed default if missing', () => {
      Env.delete('NUM_ENUM_MISS');
      expect(Env.getNumberEnum('NUM_ENUM_MISS', [1, 2, 3], 3)).toBe(3);
    });

    it('throws on invalid value', () => {
      Env.set('NUM_ENUM_INVALID', '4');
      expect(() => Env.getNumberEnum('NUM_ENUM_INVALID', [1, 2, 3], 1)).toThrow(/must be one of/);
    });
  });

  describe('getDate', () => {
    it('returns date from ISO string', () => {
      Env.set('DATE1', '2023-10-01T12:00:00Z');
      expect(Env.getDate('DATE1')).toEqual(new Date('2023-10-01T12:00:00Z'));
    });

    it('returns fallback if missing', () => {
      Env.delete('DATE2');
      expect(Env.getDate('DATE2', new Date('2023-01-01'))).toEqual(new Date('2023-01-01'));
    });

    it('throws on invalid date string', () => {
      Env.set('DATE3', 'not-a-date');
      expect(() => Env.getDate('DATE3')).toThrow(`Environment variable 'DATE3' is not a valid date: "not-a-date"`);
    });

    // Add test for empty value with default Date object
    it('returns default Date when value is empty and default is a Date object', () => {
      Env.delete('EMPTY_DATE');
      const defaultDate = new Date('2023-01-01');
      expect(Env.getDate('EMPTY_DATE', defaultDate)).toEqual(defaultDate);
    });

    // Add test for empty value with default ISO string
    it('returns Date from default ISO string when value is empty', () => {
      Env.delete('EMPTY_DATE_STRING');
      const defaultDateString = '2023-02-01T00:00:00Z';
      expect(Env.getDate('EMPTY_DATE_STRING', defaultDateString)).toEqual(new Date(defaultDateString));
    });
  });

  describe('getInteger', () => {
    it('gets integer if present', () => {
      Env.set('INT1', '123');
      expect(Env.getInteger('INT1', 7)).toBe(123);
    });

    it('throws if not an integer', () => {
      Env.set('INT2', '123.45');
      expect(() => Env.getInteger('INT2', 7)).toThrow(/must be an integer/);
    });

    it('enforces minimum constraint', () => {
      Env.set('INT3', '5');
      expect(() => Env.getInteger('INT3', 10, { min: 10 })).toThrow(/must be at least 10/);
    });

    it('enforces maximum constraint', () => {
      Env.set('INT4', '100');
      expect(() => Env.getInteger('INT4', 10, { max: 50 })).toThrow(/must be at most 50/);
    });

    it('passes validation with constraints', () => {
      Env.set('INT5', '25');
      expect(Env.getInteger('INT5', 10, { min: 10, max: 50 })).toBe(25);
    });
  });

  describe('getBoolean', () => {
    it('parses true values', () => {
      ['true', '1', 'yes', 'on', 'TRUE', 'On'].forEach(val => {
        Env.set('B', val);
        expect(Env.getBoolean('B', false)).toBe(true);
      });
    });
    it('parses false values', () => {
      ['false', '0', 'no', 'off', 'NO', 'off'].forEach(val => {
        Env.set('B', val);
        expect(Env.getBoolean('B', true)).toBe(false);
      });
    });
    it('returns the fallback default if missing', () => {
      Env.delete('BDEF');
      expect(Env.getBoolean('BDEF', true)).toBe(true);
      expect(Env.getBoolean('BDEF', false)).toBe(false);
    });
    it('throws on invalid value', () => {
      Env.set('BINV', 'maybe');
      expect(() => Env.getBoolean('BINV')).toThrow(
        `Environment variable 'BINV' is not a valid boolean, got: "maybe". Use true/false, yes/no, 1/0, or on/off.`
      );
    });
  });

  describe('getBooleanRequired', () => {
    it('parses present booleans', () => {
      Env.set('XX', 'yes');
      expect(Env.getBooleanRequired('XX')).toBe(true);
    });
    it('throws if missing', () => {
      Env.delete('YY');
      expect(() => Env.getBooleanRequired('YY')).toThrow(`Required environment variable 'YY' is missing`);
    });
    it('throws if value is not recognized', () => {
      Env.set('ZZ', 'definitely');
      expect(() => Env.getBooleanRequired('ZZ')).toThrow(
        `Environment variable 'ZZ' is not a valid boolean, got: "definitely". Use true/false, yes/no, 1/0, or on/off.`
      );
    });
  });

  describe('getJSON', () => {
    it('returns parsed object for valid JSON', () => {
      Env.set('J', '{"foo":42}');
      expect(Env.getJSON<{ foo: number }>('J', { foo: 99 })).toEqual({
        foo: 42
      });
    });
    it('returns default for missing', () => {
      Env.delete('JMISS');
      expect(Env.getJSON('JMISS', { bar: 'hi' })).toEqual({ bar: 'hi' });
    });
    it('throws for invalid JSON', () => {
      Env.set('JBAD', '{not-json');
      expect(() => Env.getJSON('JBAD', {})).toThrow(
        `Environment variable 'JBAD' is not valid JSON: Expected property name or '}' in JSON at position 1 (line 1 column 2)`
      );
    });
  });

  describe('getArray', () => {
    it('parses comma-separated lists', () => {
      Env.set('ARR', 'a, b ,c,d ,');
      expect(Env.getArray<string>('ARR')).toEqual(['a', 'b', 'c', 'd']);
    });
    it('returns default for empty or missing', () => {
      Env.delete('ARR2');
      expect(Env.getArray('ARR2', ['x'])).toEqual(['x']);
      Env.set('ARR2', '');
      expect(Env.getArray('ARR2', ['y'])).toEqual(['y']);
    });
    it('handles custom splitter', () => {
      Env.set('A2', 'q|r|s|t');
      expect(Env.getArray('A2', [], '|')).toEqual(['q', 'r', 's', 't']);
    });
    it('trims and excludes empty elements', () => {
      Env.set('A3', ' ,a,, ,b,');
      expect(Env.getArray('A3')).toEqual(['a', 'b']);
    });
    it('applies transform function to items', () => {
      Env.set('TRANSFORM_ARRAY', '10,20,30');
      const result = Env.getArray('TRANSFORM_ARRAY', [], ',', item => parseInt(item, 10) * 2);
      expect(result).toEqual([20, 40, 60]);
    });

    it('throws if transform function fails', () => {
      Env.set('FAIL_TRANSFORM', 'a,b,c');
      expect(() =>
        Env.getArray('FAIL_TRANSFORM', [], ',', item => {
          if (!/^\d+$/.test(item)) throw new Error('Numbers only');
          return parseInt(item, 10);
        })
      ).toThrow(/Failed to transform items/);
    });
  });

  describe('getNumberArray', () => {
    it('parses arrays of numbers', () => {
      Env.set('NUM_ARRAY', '10,20,30');
      expect(Env.getNumberArray('NUM_ARRAY')).toEqual([10, 20, 30]);
    });

    it('uses default for missing value', () => {
      Env.delete('NUM_ARRAY');
      expect(Env.getNumberArray('NUM_ARRAY', [1, 2])).toEqual([1, 2]);
    });

    it('throws if any value is not a number', () => {
      Env.set('INVALID_NUM_ARRAY', '10,abc,30');
      expect(() => Env.getNumberArray('INVALID_NUM_ARRAY')).toThrow(/not a valid number/);
    });

    it('handles custom splitter', () => {
      Env.set('NUM_ARRAY', '10|20|30');
      expect(Env.getNumberArray('NUM_ARRAY', [], '|')).toEqual([10, 20, 30]);
    });
  });

  describe('getEnum', () => {
    it('returns allowed value if present', () => {
      Env.set('EN', 'production');
      expect(Env.getEnum('EN', ['production', 'staging'], 'production')).toBe('production');
    });
    it('returns allowed default if missing', () => {
      Env.delete('ENM');
      expect(Env.getEnum('ENM', ['foo', 'bar'], 'bar')).toBe('bar');
    });
    it('throws on invalid value', () => {
      Env.set('EN2', 'wat');
      expect(() => Env.getEnum('EN2', ['a', 'b'], 'c')).toThrow(/must be one of/);
    });
  });

  describe('has', () => {
    it('is true if key exists, false otherwise', () => {
      Env.set('QWERTY', 'asdf');
      expect(Env.has('QWERTY')).toBe(true);
      Env.delete('QWERTY');
      expect(Env.has('QWERTY')).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('returns valid URL if present', () => {
      Env.set('URL', 'http://example.com');
      expect(Env.getUrl('URL', '')).toBe('http://example.com');
    });
    it('throws if invalid URL', () => {
      Env.set('URL', 'not-a-url');
      expect(() => Env.getUrl('URL', '')).toThrow(/not a valid URL/);
    });
    it('throws if protocol not allowed', () => {
      Env.set('URL', 'ftp://example.com');
      expect(() => Env.getUrl('URL', '', { protocols: ['http', 'https'] })).toThrow(/must use one of/);
    });
    it('throws if TLD required and missing', () => {
      Env.set('URL', 'http://localhost');
      // Now we test with both requireTld and allowLocalhost=false
      expect(() => Env.getUrl('URL', '', { requireTld: true, allowLocalhost: false })).toThrow(/cannot be localhost/);

      // Test with a non-TLD hostname
      Env.set('URL', 'http://internal');
      expect(() => Env.getUrl('URL', '', { requireTld: true })).toThrow(/must have a valid host with TLD/);
    });
    it('allows localhost if requireTld is false', () => {
      Env.set('URL', 'http://localhost');
      expect(Env.getUrl('URL', '', { requireTld: false })).toBe('http://localhost');
    });
    it('validates IP addresses', () => {
      Env.set('IP_URL', 'http://192.168.1.1');
      expect(Env.getUrl('IP_URL', '')).toBe('http://192.168.1.1');
      expect(() => Env.getUrl('IP_URL', '', { allowIp: false })).toThrow(/cannot be an IP address/);
    });

    it('validates localhost', () => {
      Env.set('LOCALHOST_URL', 'http://localhost:3000');
      expect(Env.getUrl('LOCALHOST_URL', '')).toBe('http://localhost:3000');
      expect(() => Env.getUrl('LOCALHOST_URL', '', { allowLocalhost: false })).toThrow(/cannot be localhost/);
    });
  });

  describe('getEmail', () => {
    it('returns valid email', () => {
      Env.set('EMAIL', 'foo@bar.com');
      expect(Env.getEmail('EMAIL', '')).toBe('foo@bar.com');
    });
    it('throws if invalid email', () => {
      Env.set('EMAIL', 'not-an-email');
      expect(() => Env.getEmail('EMAIL', '')).toThrow(/not a valid email address/);
    });

    // Add test for default value when key is missing
    it('returns default value when email is missing', () => {
      Env.delete('EMAIL_DEFAULT');
      const defaultEmail = 'default@example.com';
      expect(Env.getEmail('EMAIL_DEFAULT', defaultEmail)).toBe(defaultEmail);
    });

    it('throws if email is missing and no default provided', () => {
      Env.delete('EMAIL_REQUIRED');
      expect(() => Env.getEmail('EMAIL_REQUIRED', undefined as any)).toThrow(/is missing/);
    });
  });

  describe('getPath', () => {
    it('returns absolute path if exists', () => {
      Env.set('PATHVAR', __filename);
      expect(Env.getPath('PATHVAR', '', { mustExist: true })).toBe(__filename);
    });

    // Add test for missing path with undefined default
    it('throws if path is missing and no default provided', () => {
      Env.delete('MISSING_PATH');
      expect(() => Env.getPath('MISSING_PATH', undefined as any)).toThrow(/is missing/);
    });

    it('throws if mustExist and not found', () => {
      Env.set('PATHVAR', '/no/such/file');
      expect(() => Env.getPath('PATHVAR', '', { mustExist: true })).toThrow(/does not exist/);
    });
    it('returns absolute path if makeAbsolute', () => {
      Env.set('PATHVAR', 'foo/bar');
      expect(Env.getPath('PATHVAR', '', { makeAbsolute: true })).toContain('foo' + require('path').sep + 'bar');
    });
    it('validates file extensions', () => {
      Env.set('JSON_PATH', '/test/file.json');
      Env.set('YML_PATH', '/test/file.yml');
      Env.set('TXT_PATH', '/test/file.txt');

      // Mock existsSync to return true for these paths
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true);

      // Should pass validation
      expect(Env.getPath('JSON_PATH', '', { allowedExtensions: ['.json', '.yml'] })).toBe('/test/file.json');

      expect(Env.getPath('YML_PATH', '', { allowedExtensions: ['.json', '.yml'] })).toBe('/test/file.yml');

      // Should fail validation
      expect(() => Env.getPath('TXT_PATH', '', { allowedExtensions: ['.json', '.yml'] })).toThrow(
        /must have one of these extensions/
      );
    });
  });

  describe('getPort', () => {
    it('returns port as number', () => {
      Env.set('PORT', '8080');
      expect(Env.getPort('PORT', 1000)).toBe(8080);
    });
    it('throws if port is out of range', () => {
      Env.set('PORT', '70000');
      expect(() => Env.getPort('PORT', -10)).toThrow(/must be a valid port number/);
    });

    // Add test for port value below min
    it('throws if port is below minimum range', () => {
      Env.set('PORT_LOW', '-10');
      expect(() => Env.getPort('PORT_LOW', 1000)).toThrow(/must be at least 0/);
    });
  });

  describe('getDuration', () => {
    it('parses ms, s, m, h, d, and combos', () => {
      Env.set('DUR', '1d2h3m4s5ms');
      expect(Env.getDuration('DUR')).toBe(1 * 86400000 + 2 * 3600000 + 3 * 60000 + 4 * 1000 + 5);
      Env.set('DUR', '1000');
      expect(Env.getDuration('DUR')).toBe(1000);
    });
    it('throws on invalid duration', () => {
      Env.set('DUR', 'notaduration');
      expect(() => Env.getDuration('DUR')).toThrow(/invalid duration format/);
    });

    // Add test for empty value
    it('returns 0 when value is empty', () => {
      Env.set('EMPTY_DURATION', '');
      expect(Env.getDuration('EMPTY_DURATION')).toBe(0);
    });

    // Add test for years and weeks
    it('parses years and weeks in duration', () => {
      Env.set('LONG_DUR', '1y2w3d');
      const expected =
        1 * 31536000000 + // 1 year
        2 * 604800000 + // 2 weeks
        3 * 86400000; // 3 days
      expect(Env.getDuration('LONG_DUR')).toBe(expected);
    });
  });

  describe('getSafeEnv', () => {
    it('masks sensitive keys', () => {
      Env.set('MY_SECRET', 'abc123');
      Env.set('MY_TOKEN', 'tok');
      Env.set('MY_PASSWORD', 'pw');
      Env.set('MY_KEY', 'k');
      Env.set('MY_AUTH', 'a');
      Env.set('SAFE', 'ok');
      const safe = Env.getSafeEnv();
      expect(safe.MY_SECRET).toBe('******');
      expect(safe.MY_TOKEN).toBe('******');
      expect(safe.MY_PASSWORD).toBe('******');
      expect(safe.MY_KEY).toBe('******');
      expect(safe.MY_AUTH).toBe('******');
      expect(safe.SAFE).toBe('ok');
    });
  });

  describe('loadFromFile', () => {
    let readFileSyncMock: jest.SpyInstance;
    let existsSyncMock: jest.SpyInstance;

    beforeEach(() => {
      existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      // Don't set a default return value here - each test should set its own mock return
      readFileSyncMock = jest.spyOn(fs, 'readFileSync');
    });

    afterEach(() => {
      existsSyncMock.mockRestore();
      readFileSyncMock.mockRestore();
    });

    it('loads variables from env file', () => {
      // Set the mock return value for this specific test
      readFileSyncMock.mockReturnValue(
        'BASIC=value\n' +
          'QUOTED="quoted value"\n' +
          '# Comment line\n' +
          'MULTILINE=line 1\nline 2\n' +
          'WITH_COMMENT=value # end comment\n' +
          '\n' +
          'EMPTY=\n'
      );

      const result = Env.loadFromFile('.env.test');

      expect(result).toHaveProperty('BASIC', 'value');
      expect(result).toHaveProperty('QUOTED', 'quoted value');
      expect(result).toHaveProperty('MULTILINE', 'line 1\nline 2');
      expect(result).toHaveProperty('WITH_COMMENT', 'value');
      expect(result).toHaveProperty('EMPTY', '');

      // Verify process.env was updated
      expect(process.env.BASIC).toBe('value');
    });

    // Add test for multiline quoted values
    it('handles multiline quoted values', () => {
      readFileSyncMock.mockReturnValue(
        'BASIC=value\n' + 'MULTILINE_QUOTED="first line\n' + 'second line\n' + 'third line"'
      );

      const result = Env.loadFromFile('.env.multiline');

      expect(result).toHaveProperty('MULTILINE_QUOTED', 'first line\nsecond line\nthird line');
      expect(process.env.MULTILINE_QUOTED).toBe('first line\nsecond line\nthird line');
    });

    // Add test for single quoted values
    it('handles single quoted values', () => {
      readFileSyncMock.mockReturnValue("SINGLE_QUOTED='value with spaces'\n" + "WITH_SPECIAL='special ${{value}}'");

      const result = Env.loadFromFile('.env.quotes');

      expect(result).toHaveProperty('SINGLE_QUOTED', 'value with spaces');
      expect(result).toHaveProperty('WITH_SPECIAL', 'special ${{value}}');
    });

    it('handles inline comments correctly', () => {
      readFileSyncMock.mockReturnValue(
        'NO_COMMENT=plain value\n' +
          'WITH_HASH=value with # hash\n' +
          'WITH_COMMENT=actual value # this is a comment\n' +
          'QUOTED_COMMENT="# this is not a comment"'
      );

      const result = Env.loadFromFile('.env.comments');

      expect(result).toHaveProperty('NO_COMMENT', 'plain value');
      expect(result).toHaveProperty('WITH_HASH', 'value with');
      expect(result).toHaveProperty('WITH_COMMENT', 'actual value');
      expect(result).toHaveProperty('QUOTED_COMMENT', '# this is not a comment');
    });

    it('throws if file does not exist', () => {
      existsSyncMock.mockReturnValue(false);
      expect(() => Env.loadFromFile('non-existent.env')).toThrow(/not found/);
    });

    it('does not override existing variables', () => {
      Env.set('EXISTING', 'original-value');
      readFileSyncMock.mockReturnValue('EXISTING=new-value');

      Env.loadFromFile('.env');

      expect(process.env.EXISTING).toBe('original-value');
    });
  });

  describe('cache behavior', () => {
    it('caches parsed values', () => {
      Env.set('CACHE_TEST', '42');

      // First call should parse and cache
      expect(Env.getNumber('CACHE_TEST', 0)).toBe(42);

      // Update value directly in process.env
      process.env.CACHE_TEST = '100';

      // Should return cached value, not new value
      expect(Env.getNumber('CACHE_TEST', 0)).toBe(42);
    });

    it('clears cache on set', () => {
      Env.set('CACHE_TEST', '42');
      expect(Env.getNumber('CACHE_TEST', 0)).toBe(42);

      // Update with set should clear cache
      Env.set('CACHE_TEST', '100');

      // Should get new value
      expect(Env.getNumber('CACHE_TEST', 0)).toBe(100);
    });

    it('clears cache on delete', () => {
      Env.set('CACHE_TEST', '42');
      expect(Env.getNumber('CACHE_TEST', 0)).toBe(42);

      Env.delete('CACHE_TEST');
      process.env.CACHE_TEST = '100';

      // Should get new value after delete
      expect(Env.getNumber('CACHE_TEST', 0)).toBe(100);
    });

    it('clearCache clears all cached values', () => {
      Env.set('CACHE_TEST1', '42');
      Env.set('CACHE_TEST2', 'true');

      expect(Env.getNumber('CACHE_TEST1', 0)).toBe(42);
      expect(Env.getBoolean('CACHE_TEST2', false)).toBe(true);

      // Update directly
      process.env.CACHE_TEST1 = '100';
      process.env.CACHE_TEST2 = 'false';

      // Should return cached values
      expect(Env.getNumber('CACHE_TEST1', 0)).toBe(42);
      expect(Env.getBoolean('CACHE_TEST2', false)).toBe(true);

      // Clear cache
      Env.clearCache();

      // Should get new values
      expect(Env.getNumber('CACHE_TEST1', 0)).toBe(100);
      expect(Env.getBoolean('CACHE_TEST2', false)).toBe(false);
    });
  });
});

jest.mock('../src/utils/env.utils.ts');

describe('config', () => {
  it('should use default logger config values', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        isDev: jest.fn(() => true),
        get: jest.fn((_key: string, fallback: string) => fallback),
        getBoolean: jest.fn(() => false),
        getNumber: jest.fn((_key: string, fallback: number) => fallback)
      }
    }));

    const { config } = require('../src/config');
    const { Env } = require('../src/utils/env.utils');

    expect(config.logger.level).toBe('info');
    expect(config.logger.name).toBe('@catbee/utils');

    expect(Env.get).toHaveBeenCalledWith('LOGGER_LEVEL', 'info');
    expect(Env.get).toHaveBeenCalledWith('LOGGER_NAME', '@catbee/utils');
    expect(Env.get).toHaveBeenCalledWith('npm_package_name', '@catbee/utils');
  });

  it('should load environment-provided logger values', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        isDev: jest.fn(() => true),
        get: jest.fn((key: string, fallback: string) => {
          const values: Record<string, string> = {
            LOGGER_LEVEL: 'debug',
            LOGGER_NAME: 'custom-logger'
          };
          return key in values ? values[key] : fallback;
        }),
        getBoolean: jest.fn((key: string, fallback: boolean) => (key === 'LOGGER_ISO_TIMESTAMP' ? true : fallback)),
        getNumber: jest.fn((_key: string, fallback: number) => fallback)
      }
    }));

    const { config } = require('../src/config');

    expect(config.logger.level).toBe('debug');
    expect(config.logger.name).toBe('custom-logger');
  });

  it('should fallback to npm_package_name when LOGGER_NAME is not set', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        isDev: jest.fn(() => true),
        get: jest.fn((key: string, fallback: string) => {
          const values: Record<string, string> = {
            LOGGER_LEVEL: 'warn',
            npm_package_name: 'my-pkg'
          };
          return key in values ? values[key] : fallback;
        }),
        getBoolean: jest.fn(() => false),
        getNumber: jest.fn((_key: string, fallback: number) => fallback)
      }
    }));

    const { config } = require('../src/config');

    expect(config.logger.level).toBe('warn');
    expect(config.logger.name).toBe('my-pkg');
  });

  it('should still return string for level even if invalid', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        isDev: jest.fn(() => true),
        get: jest.fn(() => 'debug'),
        getBoolean: jest.fn(() => false),
        getNumber: jest.fn((_key: string, fallback: number) => fallback)
      }
    }));

    const { config } = require('../src/config');

    expect(typeof config.logger.level).toBe('string');
    expect(config.logger.level).toBe('debug');
  });

  it('should update nested config values without losing others', () => {
    const { config, setConfig } = require('../src/config');

    expect(config.logger.pretty).toBe(false); // based on previous mock

    setConfig({ logger: { level: 'debug' } });

    expect(config.logger.level).toBe('debug');
    expect(config.logger.pretty).toBe(false); // still unchanged
  });

  it('should get config', () => {
    const { getConfig } = require('../src/config');

    expect(getConfig()).toStrictEqual({
      logger: {
        level: 'debug',
        name: 'debug',
        pretty: false,
        singleLine: false
      },
      cache: {
        defaultTtl: 3600000
      },
      server: {
        skipHealthz: false
      }
    });
  });
});

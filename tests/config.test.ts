jest.mock('../src/utils/env.utils');

describe('Config', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should use default logger config values', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        get: jest.fn((key: string, fallback: string) => fallback),
        getBoolean: jest.fn(() => false),
        getNumber: jest.fn((key: string, fallback: number) => fallback)
      }
    }));

    const { Config } = require('../src/config');
    const { Env } = require('../src/utils/env.utils');

    expect(Config.Logger.level).toBe('info');
    expect(Config.Logger.name).toBe('@catbee/utils');

    expect(Env.get).toHaveBeenCalledWith('LOGGER_LEVEL', 'info');
    expect(Env.get).toHaveBeenCalledWith('LOGGER_NAME', '@catbee/utils');
    expect(Env.get).toHaveBeenCalledWith('npm_package_name', '@catbee/utils');
  });

  it('should load environment-provided logger values', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        get: jest.fn((key: string, fallback: string) => {
          const values: Record<string, string> = {
            LOGGER_LEVEL: 'debug',
            LOGGER_NAME: 'custom-logger'
          };
          return key in values ? values[key] : fallback;
        }),
        getBoolean: jest.fn((key: string, fallback: boolean) => (key === 'LOGGER_ISO_TIMESTAMP' ? true : fallback)),
        getNumber: jest.fn((key: string, fallback: number) => fallback)
      }
    }));

    const { Config } = require('../src/config');

    expect(Config.Logger.level).toBe('debug');
    expect(Config.Logger.name).toBe('custom-logger');
  });

  it('should fallback to npm_package_name when LOGGER_NAME is not set', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        get: jest.fn((key: string, fallback: string) => {
          const values: Record<string, string> = {
            LOGGER_LEVEL: 'warn',
            npm_package_name: 'my-pkg'
          };
          return key in values ? values[key] : fallback;
        }),
        getBoolean: jest.fn(() => false),
        getNumber: jest.fn((key: string, fallback: number) => fallback)
      }
    }));

    const { Config } = require('../src/config');

    expect(Config.Logger.level).toBe('warn');
    expect(Config.Logger.name).toBe('my-pkg');
  });

  it('should still return string for level even if invalid', () => {
    jest.mock('../src/utils/env.utils', () => ({
      Env: {
        get: jest.fn(() => 'nonsense'),
        getBoolean: jest.fn(() => false),
        getNumber: jest.fn((key: string, fallback: number) => fallback)
      }
    }));

    const { Config } = require('../src/config');

    expect(typeof Config.Logger.level).toBe('string');
    expect(Config.Logger.level).toBe('nonsense');
  });
});

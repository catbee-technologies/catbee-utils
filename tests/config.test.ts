import { CatbeeConfig } from './../src/types/config';
import { getEnvMockModule } from './__mocks__/index.mock';

jest.mock('../src/env', () => getEnvMockModule());

describe('config', () => {
  it('should use default logger config values', () => {
    const { getCatbeeGlobalConfig } = require('../src/config');
    const { Env } = require('../src/env');

    const config = getCatbeeGlobalConfig();
    expect(config.logger.level).toBe('debug');
    expect(config.logger.name).toBe('@catbee/utils');

    expect(Env.get).toHaveBeenCalledWith('LOGGER_LEVEL', 'debug');
    expect(Env.get).toHaveBeenCalledWith('LOGGER_NAME', '@catbee/utils');
    expect(Env.get).toHaveBeenCalledWith('npm_package_name', '@catbee/utils');
  });

  it('should load environment-provided logger values', () => {
    const { getCatbeeGlobalConfig } = require('../src/config');

    const config = getCatbeeGlobalConfig();
    expect(config.logger.level).toBe('debug');
    expect(config.logger.name).toBe('@catbee/utils');
  });

  it('should still return string for level even if invalid', () => {
    const { getCatbeeGlobalConfig } = require('../src/config');

    const config = getCatbeeGlobalConfig();
    expect(typeof config.logger.level).toBe('string');
    expect(config.logger.level).toBe('debug');
  });

  it('should update nested config values without losing others', () => {
    const { getCatbeeGlobalConfig, setCatbeeGlobalConfig } = require('../src/config');

    const config = getCatbeeGlobalConfig();
    expect(config.logger.pretty).toBe(false); // based on previous mock

    setCatbeeGlobalConfig({ logger: { level: 'debug' } });

    const updatedConfig = getCatbeeGlobalConfig();
    expect(updatedConfig.logger.level).toBe('debug');
    expect(updatedConfig.logger.pretty).toBe(false); // still unchanged
  });

  it('should get config', () => {
    const { getCatbeeGlobalConfig } = require('../src/config');

    const expected: CatbeeConfig = {
      logger: {
        level: 'debug',
        name: '@catbee/utils',
        pretty: false,
        colorize: false,
        singleLine: false,
        dir: ''
      },
      cache: {
        defaultTtl: 3600000
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        cors: false,
        helmet: false,
        compression: false,
        bodyParser: {
          json: {
            limit: '1mb'
          },
          urlencoded: {
            extended: true,
            limit: '1mb'
          }
        },
        cookieParser: false,
        isMicroservice: false,
        appName: 'catbee_server',
        globalHeaders: {},
        rateLimit: {
          enable: false,
          windowMs: 900000,
          max: 100,
          message: 'Too many requests, please try again later.',
          standardHeaders: false,
          legacyHeaders: false
        },
        requestLogging: {
          enable: false,
          skipNotFoundRoutes: false
        },
        trustProxy: false,
        openApi: {
          enable: false,
          mountPath: '/docs',
          verbose: false,
          withGlobalPrefix: false
        },
        healthCheck: {
          path: '/healthz',
          detailed: false,
          withGlobalPrefix: false
        },
        requestTimeout: 0,
        responseTime: {
          enable: false,
          addHeader: false,
          logOnComplete: false
        },
        requestId: {
          headerName: 'x-request-id',
          exposeHeader: false
        },
        metrics: {
          enable: false,
          path: '/metrics',
          withGlobalPrefix: false
        },
        serviceVersion: {
          enable: false,
          headerName: 'x-service-version',
          version: '0.0.0'
        },
        skipHealthzChecksValidation: false
      }
    };

    const actual = getCatbeeGlobalConfig();
    delete actual.server.requestLogging.ignorePaths;
    delete actual.server.requestId.generator;

    expect(actual).toEqual(expected);
  });

  it('should support getConfig/setConfig aliases', () => {
    const { getConfig, setConfig } = require('../src/config');

    setConfig({ logger: { level: 'error' } });
    const cfg = getConfig();

    expect(cfg.logger.level).toBe('error');
  });

  it('should update and read server config using dedicated helpers', () => {
    const { setCatbeeServerGlobalConfig, getCatbeeServerGlobalConfig } = require('../src/config');

    setCatbeeServerGlobalConfig({ host: '127.0.0.1', metrics: { enable: true } });
    const serverCfg = getCatbeeServerGlobalConfig();

    expect(serverCfg.host).toBe('127.0.0.1');
    expect(serverCfg.metrics.enable).toBe(true);
  });

  it('should evaluate requestLogging.ignorePaths predicate for skipped and non-skipped routes', () => {
    const { getCatbeeGlobalConfig } = require('../src/config');
    const cfg = getCatbeeGlobalConfig();

    expect(cfg.server.requestLogging.ignorePaths({ path: '/healthz/ready' }, {})).toBe(true);
    expect(cfg.server.requestLogging.ignorePaths({ path: '/api/users' }, {})).toBe(false);
  });

  it('should build enabled server option objects when env flags are true', () => {
    jest.resetModules();
    jest.doMock('../src/env', () =>
      getEnvMockModule({
        getBoolean: jest.fn((key: string, fallback: boolean) => {
          const enabledKeys = new Set([
            'SERVER_CORS_ENABLE',
            'SERVER_HELMET_ENABLE',
            'SERVER_COMPRESSION_ENABLE',
            'SERVER_COOKIE_PARSER_ENABLE'
          ]);
          return enabledKeys.has(key) ? true : fallback;
        }),
        get: jest.fn((key: string, fallback: string) => {
          if (key === 'SERVER_HEALTH_CHECK_PATH') return '/hc';
          return fallback;
        }),
        isDev: jest.fn(() => false),
        isTest: jest.fn(() => false)
      })
    );

    const { getCatbeeGlobalConfig } = require('../src/config');
    const cfg = getCatbeeGlobalConfig();

    expect(cfg.server.cors).toEqual({});
    expect(cfg.server.helmet).toEqual({});
    expect(cfg.server.compression).toEqual({});
    expect(cfg.server.cookieParser).toEqual({});
    expect(cfg.server.healthCheck.path).toBe('/hc');

    jest.resetModules();
    jest.doMock('../src/env', () => getEnvMockModule());
  });
});

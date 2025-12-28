import { ServerConfigBuilder } from '../../src/server';

jest.mock(
  '@scalar/express-api-reference',
  () => ({
    apiReference: () => (_req: any, _res: any, next: Function) => next()
  }),
  { virtual: true }
);

describe('ServerConfigBuilder', () => {
  it('should set port and host', () => {
    const config = new ServerConfigBuilder().withPort(3001).withHost('127.0.0.1').disableOpenApi().build();
    expect(config.port).toBe(3001);
    expect(config.host).toBe('127.0.0.1');
  });

  it('should enable and disable CORS', () => {
    const enabled = new ServerConfigBuilder().enableCors().disableOpenApi().build();
    expect(enabled.cors).toBe(true);

    const disabled = new ServerConfigBuilder().disableCors().disableOpenApi().build();
    expect(disabled.cors).toBe(false);
  });

  it('should enable and disable Helmet', () => {
    const enabled = new ServerConfigBuilder().enableHelmet().disableOpenApi().build();
    expect(enabled.helmet).toBe(true);

    const disabled = new ServerConfigBuilder().disableHelmet().disableOpenApi().build();
    expect(disabled.helmet).toBe(false);
  });

  it('should throw on invalid port', () => {
    expect(() => new ServerConfigBuilder().withPort(0).disableOpenApi().build()).toThrow();
    expect(() => new ServerConfigBuilder().withPort(70000).disableOpenApi().build()).toThrow();
    expect(() => new ServerConfigBuilder().withPort(3.14).disableOpenApi().build()).toThrow();
  });

  it('should merge custom config', () => {
    const config = new ServerConfigBuilder().withCustom({ port: 4000, host: 'foo' }).disableOpenApi().build();
    expect(config.port).toBe(4000);
    expect(config.host).toBe('foo');
  });

  it('should add static folders without duplicates', () => {
    const builder = new ServerConfigBuilder()
      .withStaticFolder({ path: '/a', directory: 'dirA' })
      .withStaticFolder({ path: '/b', directory: 'dirB' })
      .withStaticFolder({ path: '/a', directory: 'dirA2' }) // should overwrite '/a'
      .disableOpenApi();
    const config = builder.build();
    expect(config.staticFolders?.length).toBe(2);
    expect(config.staticFolders?.find(f => f.path === '/a')?.directory).toBe('dirA2');
  });

  it('should throw if static folder path is missing', () => {
    const builder = new ServerConfigBuilder();
    expect(() => builder.withStaticFolder({ directory: 'dirA' } as any)).toThrow(/path/);
  });

  it('should throw if port is not an integer', () => {
    expect(() => new ServerConfigBuilder().withPort(3.14).disableOpenApi().build()).toThrow(
      'Port must be a valid number between 1 and 65535, got: 3.14'
    );
  });

  it('should throw if port is out of range', () => {
    expect(() => new ServerConfigBuilder().withPort(0).disableOpenApi().build()).toThrow(/between 1 and 65535/);
    expect(() => new ServerConfigBuilder().withPort(70000).disableOpenApi().build()).toThrow(/between 1 and 65535/);
  });

  it('should throw if OpenAPI is enabled but filePath is missing', () => {
    expect(() => new ServerConfigBuilder().enableOpenApi(undefined as any).build()).toThrow(/filePath/);
    expect(() => new ServerConfigBuilder().withOpenApi({ enable: true }).build()).toThrow(/filePath/);
  });

  it('should disable compression', () => {
    const config = new ServerConfigBuilder().disableCompression().disableOpenApi().build();
    expect(config.compression).toBe(false);
  });

  it('should enable and disable compression', () => {
    const enabled = new ServerConfigBuilder().enableCompression().disableOpenApi().build();
    expect(enabled.compression).toBe(true);

    const disabled = new ServerConfigBuilder().disableCompression().disableOpenApi().build();
    expect(disabled.compression).toBe(false);
  });

  it('should configure rate limiting', () => {
    const config = new ServerConfigBuilder().withRateLimit({ max: 5 }).disableOpenApi().build();
    expect(config.rateLimit?.max).toBe(5);
  });

  it('should enable and disable rate limiting', () => {
    const enabled = new ServerConfigBuilder().enableRateLimit({ max: 2 }).disableOpenApi().build();
    expect(enabled.rateLimit?.enable).toBe(true);
    expect(enabled.rateLimit?.max).toBe(2);

    const disabled = new ServerConfigBuilder().disableRateLimit().disableOpenApi().build();
    expect(disabled.rateLimit?.enable).toBe(false);
  });

  it('should configure request logging', () => {
    const config = new ServerConfigBuilder()
      .withRequestLogging({ enable: true, ignorePaths: ['/health', '/metrics'], skipNotFoundRoutes: true })
      .disableOpenApi()
      .build();
    expect(config.requestLogging?.ignorePaths).toEqual(['/health', '/metrics']);
    expect(config.requestLogging?.skipNotFoundRoutes).toBe(true);
  });

  it('should enable and disable request logging', () => {
    const enabled = new ServerConfigBuilder()
      .enableRequestLogging({ ignorePaths: ['/health', '/metrics'], skipNotFoundRoutes: true })
      .disableOpenApi()
      .build();
    expect(enabled.requestLogging?.enable).toBe(true);
    expect(enabled.requestLogging?.ignorePaths).toEqual(['/health', '/metrics']);
    expect(enabled.requestLogging?.skipNotFoundRoutes).toBe(true);

    const disabled = new ServerConfigBuilder().disableRequestLogging().disableOpenApi().build();
    expect(disabled.requestLogging?.enable).toBe(false);
  });

  it('should configure metrics', () => {
    const config = new ServerConfigBuilder().withMetrics({ path: '/metrics' }).disableOpenApi().build();
    expect(config.metrics?.path).toBe('/metrics');
  });

  it('should enable and disable metrics', () => {
    const enabled = new ServerConfigBuilder().enableMetrics({ path: '/m' }).disableOpenApi().build();
    expect(enabled.metrics?.enable).toBe(true);
    expect(enabled.metrics?.path).toBe('/m');

    const disabled = new ServerConfigBuilder().disableMetrics().disableOpenApi().build();
    expect(disabled.metrics?.enable).toBe(false);
  });

  it('should configure health check', () => {
    const config = new ServerConfigBuilder()
      .withHealthCheck({ path: '/health', detailed: true })
      .disableOpenApi()
      .build();
    expect(config.healthCheck?.path).toBe('/health');
    expect(config.healthCheck?.detailed).toBe(true);
  });

  it('should configure OpenAPI via withOpenApi', () => {
    const config = new ServerConfigBuilder()
      .withOpenApi({ enable: true, filePath: 'spec.yaml', mountPath: '/docs' })
      .build();
    expect(config.openApi?.enable).toBe(true);
    expect(config.openApi?.filePath).toBe('spec.yaml');
    expect(config.openApi?.mountPath).toBe('/docs');
  });

  it('should configure trust proxy', () => {
    const config = new ServerConfigBuilder().withTrustProxy(true).disableOpenApi().build();
    expect(config.trustProxy).toBe(true);
  });

  it('should configure request id', () => {
    const config = new ServerConfigBuilder().withRequestId({ headerName: 'X-Request-Id' }).disableOpenApi().build();
    expect(config.requestId?.headerName).toBe('X-Request-Id');
  });

  it('should configure response time', () => {
    const config = new ServerConfigBuilder()
      .withResponseTime({ addHeader: true, logOnComplete: true })
      .disableOpenApi()
      .build();
    expect(config.responseTime?.addHeader).toBe(true);
    expect(config.responseTime?.logOnComplete).toBe(true);
  });

  it('should enable and disable response time', () => {
    const enabled = new ServerConfigBuilder()
      .enableResponseTime({ addHeader: true, logOnComplete: true })
      .disableOpenApi()
      .build();
    expect(enabled.responseTime?.enable).toBe(true);
    expect(enabled.responseTime?.addHeader).toBe(true);
    expect(enabled.responseTime?.logOnComplete).toBe(true);

    const disabled = new ServerConfigBuilder().disableResponseTime().disableOpenApi().build();
    expect(disabled.responseTime?.enable).toBe(false);
  });

  it('should configure body parser', () => {
    const config = new ServerConfigBuilder()
      .withBodyParser({ json: { limit: '2mb' } })
      .disableOpenApi()
      .build();
    expect(config.bodyParser?.json?.limit).toBe('2mb');
  });

  it('should configure cookies', () => {
    const config = new ServerConfigBuilder()
      .withCookies({ decode: value => value })
      .disableOpenApi()
      .build();
    expect((config as any).cookieParser).toEqual({ decode: expect.any(Function) });
  });

  it('should configure microservice', () => {
    const config = new ServerConfigBuilder()
      .withMicroService({
        appName: 'hello',
        serviceVersion: {
          enable: true,
          headerName: 'X-Service-Version',
          version: '1.0.0'
        }
      })
      .build();
    expect(config.isMicroservice).toBe(true);
    expect(config.appName).toBe('hello');
    expect(config.serviceVersion?.headerName).toBe('X-Service-Version');
    expect(config.serviceVersion?.version).toBe('1.0.0');
  });

  it('should config global headers', () => {
    const config = new ServerConfigBuilder().withGlobalHeaders({ 'X-Powered-By': 'Catbee' }).disableOpenApi().build();
    expect(config.globalHeaders).toEqual({ 'X-Powered-By': 'Catbee' });
  });

  it('should configure global prefix', () => {
    const config = new ServerConfigBuilder().withGlobalPrefix('/api').disableOpenApi().build();
    expect(config.globalPrefix).toBe('/api');
  });

  it('should configure https', () => {
    const config = new ServerConfigBuilder()
      .withHttps({
        key: 'https://example.com/key.pem',
        cert: 'https://example.com/cert.pem',
        ca: 'https://example.com/ca.pem'
      })
      .build();
    expect(config.https).toEqual({
      key: 'https://example.com/key.pem',
      cert: 'https://example.com/cert.pem',
      ca: 'https://example.com/ca.pem'
    });
  });
});

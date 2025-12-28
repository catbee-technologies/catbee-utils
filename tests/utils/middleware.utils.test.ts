import { requestId, timeout, errorHandler, responseTime, setupRequestContext, healthCheck } from '../../src/middleware';
import { HttpStatusCodes } from '../../src/http-status-codes';
import { ErrorResponse } from '../../src/response';
import { Env } from '../../src/env';
import { getLogger } from '../../src/logger';
import { ContextStore, StoreKeys } from '../../src/context-store';
import { uuid } from '../../src/id';

jest.mock('../../src/id', () => ({
  uuid: jest.fn()
}));
const childLogger = { info: jest.fn(), error: jest.fn() };
jest.mock('../../src/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    child: jest.fn(() => childLogger)
  }))
}));
jest.mock('../../src/env', () => ({
  Env: { isDev: jest.fn() }
}));
jest.mock('../../src/context-store', () => {
  const original = jest.requireActual('../../src/context-store');
  return {
    ...original,
    ContextStore: {
      ...original.ContextStore,
      run: jest.fn((_store, cb) => cb()),
      set: jest.fn()
    },
    getRequestId: jest.fn(() => undefined)
  };
});

describe('Middleware tests', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {}, method: 'GET', url: '/test' };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      end: jest.fn(),
      on: jest.fn((event, cb) => {
        if (event === 'finish') res._finishCallback = cb;
      })
    };
    next = jest.fn();
    (uuid as jest.Mock).mockReturnValue('generated-uuid');
    (getLogger as jest.Mock).mockReturnValue({
      info: jest.fn(),
      error: jest.fn()
    });
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  describe('requestId', () => {
    it('should generate and attach a new ID if not present', () => {
      requestId()(req, res, next);
      expect(req.id).toBe('generated-uuid');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'generated-uuid');
      expect(next).toHaveBeenCalled();
    });

    it('should use existing request ID from headers', () => {
      req.headers['x-request-id'] = 'existing-id';
      requestId()(req, res, next);
      expect(req.id).toBe('existing-id');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id');
    });

    it('should not expose header if exposeHeader=false', () => {
      requestId({ exposeHeader: false })(req, res, next);
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('should use custom headerName', () => {
      req.headers['x-custom-id'] = 'abc123';
      requestId({ headerName: 'X-Custom-ID' })(req, res, next);
      expect(req.id).toBe('abc123');
      expect(res.setHeader).toHaveBeenCalledWith('X-Custom-ID', 'abc123');
    });
  });

  describe('timeout', () => {
    it('should send 408 response after timeout', () => {
      timeout(1000)(req, res, next);
      jest.advanceTimersByTime(1000);
      expect(res.status).toHaveBeenCalledWith(408);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          message: 'Request timed out',
          status: 408
        })
      );
    });

    it('should clear timeout on finish', () => {
      timeout(1000)(req, res, next);
      res._finishCallback();
      jest.advanceTimersByTime(1000);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    it('should log and send default error response', () => {
      (Env.isDev as jest.Mock).mockReturnValue(false);
      const logger = { error: jest.fn() };
      (getLogger as jest.Mock).mockReturnValue(logger);

      const err = new Error('Test error');
      errorHandler()(err, req, res, next);

      expect(logger.error).toHaveBeenCalledWith({ err }, 'Test error');
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          message: 'Test error',
          path: '/test'
        })
      );
    });

    it('should handle ErrorResponse instance', () => {
      const err = new ErrorResponse('Bad request', HttpStatusCodes.BAD_REQUEST);
      err.requestId = 'rid123';
      errorHandler()(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: err.error,
          message: err.message,
          requestId: 'rid123'
        })
      );
    });

    it('should include stack trace in dev mode when includeDetails=true', () => {
      (Env.isDev as jest.Mock).mockReturnValue(true);
      const err = new Error('Stack test');
      err.stack = 'line1\nline2';
      errorHandler({ includeDetails: true })(err, req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: ['line1', 'line2']
        })
      );
    });

    it('should skip logging if logErrors=false', () => {
      const logger = { error: jest.fn() };
      (getLogger as jest.Mock).mockReturnValue(logger);
      const err = new Error('No log');
      errorHandler({ logErrors: false })(err, req, res, next);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('responseTime middleware', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
      req = { method: 'GET', url: '/test' };
      res = {
        headersSent: false,
        setHeader: jest.fn(),
        writeHead: jest.fn(function () {
          this.headersSent = true;
        }),
        end: jest.fn()
      };
      next = jest.fn();
    });

    it('should add X-Response-Time header via writeHead', () => {
      const mw = responseTime({ addHeader: true });
      mw(req, res, next);

      // Simulate Express sending response
      res.writeHead(200);
      res.end();

      expect(res.setHeader).toHaveBeenCalledWith('X-Response-Time', expect.stringMatching(/\d+\.\d{2}ms/));
      expect(next).toHaveBeenCalled();
    });

    it('should call next() even if addHeader is false', () => {
      const mw = responseTime({ addHeader: false });
      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('setupRequestContext middleware', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;
    let childLogger: any;

    beforeEach(() => {
      req = { headers: {}, method: 'GET', url: '/test', originalUrl: '/test' };
      res = {};
      next = jest.fn();

      (uuid as jest.Mock).mockReturnValue('generated-uuid');

      childLogger = { info: jest.fn(), error: jest.fn() };
      (getLogger as jest.Mock).mockReturnValue({
        child: jest.fn(() => childLogger)
      });

      (ContextStore.run as jest.Mock).mockImplementation((_ctx, fn) => fn());
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should generate a new requestId if header is missing', () => {
      const middleware = setupRequestContext();
      middleware(req, res, next);

      expect(ContextStore.run).toHaveBeenCalledWith({ [StoreKeys.REQUEST_ID]: 'generated-uuid' }, expect.any(Function));
      expect(ContextStore.set).toHaveBeenCalledWith(StoreKeys.LOGGER, childLogger);
      expect(childLogger.info).toHaveBeenCalledWith('Request context initialized');
      expect(next).toHaveBeenCalled();
    });

    it('should use existing requestId from headers', () => {
      req.headers['x-request-id'] = 'header-id';
      const middleware = setupRequestContext();
      middleware(req, res, next);

      expect(ContextStore.run).toHaveBeenCalledWith({ [StoreKeys.REQUEST_ID]: 'header-id' }, expect.any(Function));
      expect(next).toHaveBeenCalled();
    });

    it('should use req.id if present', () => {
      req.id = 'req-id';
      const middleware = setupRequestContext();
      middleware(req, res, next);

      expect(ContextStore.run).toHaveBeenCalledWith({ [StoreKeys.REQUEST_ID]: 'req-id' }, expect.any(Function));
      expect(next).toHaveBeenCalled();
    });

    it('should respect custom headerName', () => {
      req.headers['x-custom-id'] = 'custom-id';
      const middleware = setupRequestContext({ headerName: 'x-custom-id' });
      middleware(req, res, next);

      expect(ContextStore.run).toHaveBeenCalledWith({ [StoreKeys.REQUEST_ID]: 'custom-id' }, expect.any(Function));
      expect(next).toHaveBeenCalled();
    });

    it('should skip autoLog when autoLog=false', () => {
      const middleware = setupRequestContext({ autoLog: false });
      middleware(req, res, next);

      expect(childLogger.info).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should create a child logger with requestId, method, and url', () => {
      const middleware = setupRequestContext();
      middleware(req, res, next);

      expect(getLogger).toHaveBeenCalled();
      expect(getLogger().child).toHaveBeenCalledWith({
        requestId: 'generated-uuid',
        method: 'GET',
        url: '/test'
      });
    });
  });

  describe('healthCheck middleware', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
      req = { path: '/healthz' };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should return healthy status by default', async () => {
      await healthCheck()(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
    });

    it('should run custom checks and return ok if all pass', async () => {
      const checks = [
        { name: 'db', check: () => true },
        { name: 'cache', check: () => Promise.resolve(true) }
      ];
      await healthCheck({ checks })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          checks: { db: true, cache: true }
        })
      );
    });

    it('should return unhealthy if any check fails', async () => {
      const checks = [
        { name: 'db', check: () => false },
        { name: 'cache', check: () => true }
      ];
      await healthCheck({ checks })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: { db: false, cache: true }
        })
      );
    });

    it('should return unhealthy if a check throws', async () => {
      const checks = [
        {
          name: 'db',
          check: () => {
            throw new Error('fail');
          }
        }
      ];
      await healthCheck({ checks })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: { db: false }
        })
      );
    });

    it('should not include checks if detailed=false', async () => {
      const checks = [{ name: 'db', check: () => true }];
      await healthCheck({ checks, detailed: false })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
      expect(res.json.mock.calls[0][0].checks).toBeUndefined();
    });

    it('should skip if path does not match', async () => {
      req.path = '/not-healthz';
      await healthCheck()(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should support custom path', async () => {
      req.path = '/custom-health';
      await healthCheck({ path: '/custom-health' })(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
    });
  });
});

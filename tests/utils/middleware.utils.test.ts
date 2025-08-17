import { randomUUID } from 'crypto';
import { requestId, timeout, errorHandler, responseTime } from '../../src/utils/middleware.utils';
import { HttpStatusCodes } from '../../src/utils/http-status-codes';
import { ErrorResponse } from '../../src/utils/response.utils';
import { Env } from '../../src/utils/env.utils';
import { getLogger } from '../../src/utils/logger.utils';

jest.mock('crypto', () => ({
  randomUUID: jest.fn()
}));
const childLogger = { info: jest.fn(), error: jest.fn() };
jest.mock('../../src/utils/logger.utils', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    child: jest.fn(() => childLogger)
  }))
}));
jest.mock('../../src/utils/env.utils', () => ({
  Env: { isDev: jest.fn() }
}));
jest.mock('../../src/config', () => ({
  Config: { Http: { timeout: 30000 } }
}));

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
    (randomUUID as jest.Mock).mockReturnValue('generated-uuid');
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
          message: 'Request timeout',
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

      expect(logger.error).toHaveBeenCalledWith({ error: err }, 'Test error');
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

  describe('responseTime', () => {
    it('should call next', () => {
      const mw = responseTime();
      mw(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should add X-Response-Time header', () => {
      const mw = responseTime({ addHeader: true });
      mw(req, res, next);
      res.end();
      expect(res.setHeader).toHaveBeenCalledWith('X-Response-Time', expect.stringMatching(/\d+\.\d{2}ms/));
    });

    it('should log duration if logOnComplete is true', () => {
      const mw = responseTime({ logOnComplete: true });
      mw(req, res, next);
      const logger = getLogger();
      res._finishCallback?.();
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/GET \/test - \d+\.\d{2}ms/));
    });

    it('should not set header if addHeader is false', () => {
      const mw = responseTime({ addHeader: false });
      mw(req, res, next);
      res.end();
      expect(res.setHeader).not.toHaveBeenCalled();
    });
  });
});

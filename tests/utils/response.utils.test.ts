import { getRequestId } from '../../src/context-store';
import { randomUUID } from 'crypto';
import {
  ErrorResponse,
  SuccessResponse,
  PaginatedResponse,
  NoContentResponse,
  RedirectResponse,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  sendResponse
} from '../../src/response';

jest.mock('../../src/context-store');
jest.mock('crypto', () => ({
  randomUUID: jest.fn()
}));

describe('ResponseUtils', () => {
  describe('SuccessResponse', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('sets defaults when only message is supplied', () => {
      (getRequestId as jest.Mock).mockReturnValue(null);
      (randomUUID as jest.Mock).mockReturnValue('uuid123');

      const res = new SuccessResponse('It worked!');
      expect(res.message).toBe('It worked!');
      expect(res.error).toBe(false);
      expect(res.data).toBeNull();
      expect(typeof res.timestamp).toBe('string');
      expect(res.requestId).toBe('uuid123');
    });

    it('sets message and data fields as specified', () => {
      (getRequestId as jest.Mock).mockReturnValue('req-xyz');
      const res = new SuccessResponse<number>('All done', 42);
      expect(res.message).toBe('All done');
      expect(res.data).toBe(42);
      expect(res.error).toBe(false);
      expect(res.requestId).toBe('req-xyz');
      expect(typeof res.timestamp).toBe('string');
    });

    it('defaults message to "Success" if falsy or empty string not passed (but DOES use falsy values if passed)', () => {
      // If an empty string is passed, it should keep the default "Success"
      const res = new SuccessResponse('');
      expect(res.message).toBe('Success');
    });

    it('timestamp should be a valid ISO string', () => {
      const res = new SuccessResponse('msg');
      expect(() => new Date(res.timestamp)).not.toThrow();
      expect(res.timestamp).toEqual(expect.stringMatching(/T\d{2}:\d{2}:\d{2}\./));
    });

    it('requestId uses getRequestId if available, otherwise uses randomUUID', () => {
      // With getRequestId returning a value
      (getRequestId as jest.Mock).mockReturnValueOnce('rid-12');
      expect(new SuccessResponse('X').requestId).toBe('rid-12');
      // With getRequestId returning falsy, use randomUUID
      (getRequestId as jest.Mock).mockReturnValueOnce(undefined);
      (randomUUID as jest.Mock).mockReturnValueOnce('r-uuid');
      expect(new SuccessResponse('Y').requestId).toBe('r-uuid');
    });
  });

  describe('ErrorResponse', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('defaults status to 500, sets fields, name, error=true', () => {
      (getRequestId as jest.Mock).mockReturnValueOnce('err-x');
      const message = 'Something went wrong';
      const err = new ErrorResponse(message);
      expect(err.status).toBe(500);
      expect(err.message).toBe(message);
      expect(err.error).toBe(true);
      expect(err.timestamp).toEqual(expect.stringMatching(/T\d{2}:\d{2}:\d{2}\./));
      expect(err.requestId).toBe('err-x');
      expect(err.name).toBe('ErrorResponse');
      expect(err).toBeInstanceOf(ErrorResponse);
      expect(err).toBeInstanceOf(Error);
      expect(typeof err.stack).toBe('string');
    });

    it('sets custom HTTP status via constructor', () => {
      (getRequestId as jest.Mock).mockReturnValue('idZZ');
      const e = new ErrorResponse('Bad stuff', 404);
      expect(e.status).toBe(404);
      expect(e.requestId).toBe('idZZ');
    });

    it('sets requestId from randomUUID if getRequestId returns null/undefined', () => {
      (getRequestId as jest.Mock).mockReturnValueOnce(undefined);
      (randomUUID as jest.Mock).mockReturnValueOnce('err-uuid-89');
      expect(new ErrorResponse('fail').requestId).toBe('err-uuid-89');
    });

    it('sets name to subclass name', () => {
      const err = new ErrorResponse('msg');
      expect(err.name).toBe('ErrorResponse');
    });

    it('does not have a "data" property (by contract)', () => {
      const err = new ErrorResponse('fail');
      expect('data' in err).toBe(false);
    });
  });

  describe('PaginatedResponse', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      (getRequestId as jest.Mock).mockReturnValue('pid');
    });

    it('sets pagination fields and computes totalPages, hasNext, hasPrevious', () => {
      const items = [1, 2, 3, 4, 5];
      const resp = new PaginatedResponse(items.slice(0, 2), {
        total: 5,
        page: 1,
        pageSize: 2
      });
      expect(resp.data).toEqual([1, 2]);
      expect(resp.total).toBe(5);
      expect(resp.page).toBe(1);
      expect(resp.pageSize).toBe(2);
      expect(resp.totalPages).toBe(3);
      expect(resp.hasNext).toBe(true);
      expect(resp.hasPrevious).toBe(false);
    });

    it('has hasPrevious true if page > 1', () => {
      const resp = new PaginatedResponse([3, 4], {
        total: 5,
        page: 2,
        pageSize: 2
      });
      expect(resp.hasPrevious).toBe(true);
    });

    it('has hasNext false if last page', () => {
      const resp = new PaginatedResponse([5], {
        total: 5,
        page: 3,
        pageSize: 2
      });
      expect(resp.hasNext).toBe(false);
    });
  });

  describe('NoContentResponse', () => {
    it('sets message and data=null, is instance of SuccessResponse', () => {
      const res = new NoContentResponse('Done');
      expect(res.message).toBe('Done');
      expect(res.data).toBeNull();
      expect(res).toBeInstanceOf(SuccessResponse);
    });
  });

  describe('RedirectResponse', () => {
    beforeEach(() => {
      (getRequestId as jest.Mock).mockReturnValue('redir-id');
    });
    it('sets url, statusCode, isRedirect, requestId', () => {
      const r = new RedirectResponse('http://foo', 301);
      expect(r.redirectUrl).toBe('http://foo');
      expect(r.statusCode).toBe(301);
      expect(r.isRedirect).toBe(true);
      expect(r.requestId).toBe('redir-id');
    });
    it('defaults statusCode to 302', () => {
      const r = new RedirectResponse('http://bar');
      expect(r.statusCode).toBe(302);
    });
  });

  describe('createSuccessResponse', () => {
    it('creates SuccessResponse with data and message', () => {
      const res = createSuccessResponse({ foo: 1 }, 'msg');
      expect(res).toBeInstanceOf(SuccessResponse);
      expect(res.data).toEqual({ foo: 1 });
      expect(res.message).toBe('msg');
    });
    it("defaults message to 'Success'", () => {
      const res = createSuccessResponse(123);
      expect(res.message).toBe('Success');
    });
  });

  describe('createErrorResponse', () => {
    it('creates ErrorResponse with message and status', () => {
      (getRequestId as jest.Mock).mockReturnValue('errid');
      const err = createErrorResponse('fail', 400);
      expect(err).toBeInstanceOf(ErrorResponse);
      expect(err.message).toBe('fail');
      expect(err.status).toBe(400);
      expect(err.requestId).toBe('errid');
    });
    it('defaults status to 500', () => {
      const err = createErrorResponse('fail');
      expect(err.status).toBe(500);
    });
  });

  describe('createPaginatedResponse', () => {
    it('returns PaginatedResponse with correct page data', () => {
      const arr = [1, 2, 3, 4, 5];
      const resp = createPaginatedResponse(arr, 2, 2, 'Paged');
      expect(resp).toBeInstanceOf(PaginatedResponse);
      expect(resp.data).toEqual([3, 4]);
      expect(resp.page).toBe(2);
      expect(resp.pageSize).toBe(2);
      expect(resp.total).toBe(5);
      expect(resp.totalPages).toBe(3);
      expect(resp.message).toBe('Paged');
    });
    it('handles page/pageSize less than 1', () => {
      const arr = [1, 2, 3];
      const resp = createPaginatedResponse(arr, 0, 0);
      expect(resp.page).toBe(1);
      expect(resp.pageSize).toBe(1);
      expect(resp.data).toEqual([1]);
    });
  });

  describe('sendResponse', () => {
    it('handles RedirectResponse', () => {
      const res = { redirect: jest.fn() };
      const r = new RedirectResponse('http://foo', 301);
      sendResponse(res, r);
      expect(res.redirect).toHaveBeenCalledWith(301, 'http://foo');
    });
    it('handles ErrorResponse', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const err = new ErrorResponse('fail', 400);
      sendResponse(res, err);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          message: 'fail',
          requestId: err.requestId
        })
      );
    });
    it('handles NoContentResponse', () => {
      const res = { status: jest.fn().mockReturnThis(), end: jest.fn() };
      const n = new NoContentResponse();
      sendResponse(res, n);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });
    it('handles SuccessResponse', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const s = new SuccessResponse('ok', { foo: 1 });
      sendResponse(res, s);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(s);
    });
  });
});

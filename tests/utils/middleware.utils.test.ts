import {
  requestId,
  responseTime,
  timeout,
  errorHandler,
} from "../../src/utils/middleware.utils";
import { ErrorResponse } from "../../src/utils/response.utils";

describe.skip("MiddlewareUtils", () => {
  function mockReqRes() {
    const headers: Record<string, any> = {};
    const res: any = {
      setHeader: jest.fn((k, v) => {
        headers[k] = v;
      }),
      status: jest.fn(function (code) {
        this._status = code;
        return this;
      }),
      json: jest.fn(function (data) {
        this._json = data;
      }),
      send: jest.fn(),
      end: jest.fn(),
      on: jest.fn((event, cb) => {
        res._on = cb;
      }),
    };
    const req: any = {
      headers: {},
      method: "GET",
      url: "/foo",
      originalUrl: "/foo",
    };
    const next = jest.fn();
    return { req, res, next, headers };
  }

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
  });
  afterAll(() => {
    // eslint-disable-next-line no-console
    (console.error as jest.Mock).mockRestore();
    // eslint-disable-next-line no-console
    (console.info as jest.Mock).mockRestore();
  });

  describe("requestId", () => {
    it("sets request id header and req.id", () => {
      const { req, res, next } = mockReqRes();
      requestId()(req, res, next);
      expect(req.id).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith("X-Request-ID", req.id);
      expect(next).toHaveBeenCalled();
    });
    it("uses existing request id from header", () => {
      const { req, res, next } = mockReqRes();
      req.headers["x-request-id"] = "abc";
      requestId()(req, res, next);
      expect(req.id).toBe("abc");
    });
    it("does not expose header if option set", () => {
      const { req, res, next } = mockReqRes();
      requestId({ exposeHeader: false })(req, res, next);
      expect(res.setHeader).not.toHaveBeenCalled();
    });
    it("uses custom header name", () => {
      const { req, res, next } = mockReqRes();
      req.headers["x-foo-id"] = "bar";
      requestId({ headerName: "X-Foo-Id" })(req, res, next);
      expect(req.id).toBe("bar");
      expect(res.setHeader).toHaveBeenCalledWith("X-Foo-Id", "bar");
    });
  });

  describe("responseTime", () => {
    it("adds X-Response-Time header on finish", () => {
      const { req, res, next } = mockReqRes();
      let finishCb: any;
      res.on = jest.fn((event, cb) => {
        if (event === "finish") finishCb = cb;
      });
      responseTime()(req, res, next);
      expect(next).toHaveBeenCalled();
      finishCb();
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-Response-Time",
        expect.stringMatching(/ms$/),
      );
    });
    it("logs on complete if option set", () => {
      const { req, res, next } = mockReqRes();
      let finishCb: any;
      res.on = jest.fn((event, cb) => {
        if (event === "finish") finishCb = cb;
      });
      const spy = jest.spyOn(console, "info").mockImplementation(() => {});
      responseTime({ logOnComplete: true })(req, res, next);
      finishCb();
      expect(spy).toHaveBeenCalledWith(
        "GET /foo - " + expect.stringMatching(/^[\d.]+ms$/),
      );
      spy.mockRestore();
    });
    it("does not add header if addHeader is false", () => {
      const { req, res, next } = mockReqRes();
      let finishCb: any;
      res.on = jest.fn((event, cb) => {
        if (event === "finish") finishCb = cb;
      });
      responseTime({ addHeader: false })(req, res, next);
      finishCb();
      expect(res.setHeader).not.toHaveBeenCalledWith(
        "X-Response-Time",
        expect.anything(),
      );
    });
  });

  describe("timeout", () => {
    it("sends 408 if request times out", () => {
      const { req, res, next } = mockReqRes();
      let finishCb: any;
      res.on = jest.fn((event, cb) => {
        if (event === "finish") finishCb = cb;
      });
      jest.useFakeTimers();
      timeout(10)(req, res, next);
      expect(next).toHaveBeenCalled();
      jest.advanceTimersByTime(11);
      expect(res.status).toHaveBeenCalledWith(408);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Request timeout", status: 408 }),
      );
      // Simulate finish to clear timer
      finishCb();
      jest.useRealTimers();
    });
  });

  describe("errorHandler", () => {
    it("handles ErrorResponse and returns correct json", () => {
      const { req, res } = mockReqRes();
      const err = {
        error: true,
        message: "fail",
        status: 400,
        timestamp: "now",
        requestId: "id",
      };
      Object.setPrototypeOf(err, ErrorResponse.prototype);
      errorHandler()(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: true,
          message: "fail",
          requestId: "id",
        }),
      );
    });
    it("handles generic error and includes details in dev", () => {
      const { req, res } = mockReqRes();
      process.env.NODE_ENV = "development";
      const err = new Error("fail");
      errorHandler({ includeDetails: true })(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json.mock.calls[0][0].stack).toBeDefined();
    });
    it("logs error if logErrors is true", () => {
      const { req, res } = mockReqRes();
      const spy = jest.fn();
      errorHandler({ logger: spy })(new Error("fail"), req, res, jest.fn());
      expect(spy).toHaveBeenCalled();
    });
    it("does not log error if logErrors is false", () => {
      const { req, res } = mockReqRes();
      const spy = jest.fn();
      errorHandler({ logger: spy, logErrors: false })(
        new Error("fail"),
        req,
        res,
        jest.fn(),
      );
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

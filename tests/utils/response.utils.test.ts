import { getRequestId } from "../../src/utils/context-store.utils";
import { randomUUID } from "crypto";
import { ErrorResponse, SuccessResponse } from "../../src/utils/response.utils";

jest.mock("../../src/utils/context-store.utils");
jest.mock("crypto", () => ({
  randomUUID: jest.fn(),
}));

describe("ResponseUtils", () => {
  describe("SuccessResponse", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("sets defaults when only message is supplied", () => {
      (getRequestId as jest.Mock).mockReturnValue(null);
      (randomUUID as jest.Mock).mockReturnValue("uuid123");

      const res = new SuccessResponse("It worked!");
      expect(res.message).toBe("It worked!");
      expect(res.error).toBe(false);
      expect(res.data).toBeNull();
      expect(typeof res.timestamp).toBe("string");
      expect(res.requestId).toBe("uuid123");
    });

    it("sets message and data fields as specified", () => {
      (getRequestId as jest.Mock).mockReturnValue("req-xyz");
      const res = new SuccessResponse<number>("All done", 42);
      expect(res.message).toBe("All done");
      expect(res.data).toBe(42);
      expect(res.error).toBe(false);
      expect(res.requestId).toBe("req-xyz");
      expect(typeof res.timestamp).toBe("string");
    });

    it('defaults message to "Success" if falsy or empty string not passed (but DOES use falsy values if passed)', () => {
      // If an empty string is passed, it should keep the default "Success"
      const res = new SuccessResponse("");
      expect(res.message).toBe("Success");
    });

    it("timestamp should be a valid ISO string", () => {
      const res = new SuccessResponse("msg");
      expect(() => new Date(res.timestamp)).not.toThrow();
      expect(res.timestamp).toEqual(
        expect.stringMatching(/T\d{2}:\d{2}:\d{2}\./),
      );
    });

    it("requestId uses getRequestId if available, otherwise uses randomUUID", () => {
      // With getRequestId returning a value
      (getRequestId as jest.Mock).mockReturnValueOnce("rid-12");
      expect(new SuccessResponse("X").requestId).toBe("rid-12");
      // With getRequestId returning falsy, use randomUUID
      (getRequestId as jest.Mock).mockReturnValueOnce(undefined);
      (randomUUID as jest.Mock).mockReturnValueOnce("r-uuid");
      expect(new SuccessResponse("Y").requestId).toBe("r-uuid");
    });
  });

  describe("ErrorResponse", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("defaults status to 500, sets fields, name, error=true", () => {
      (getRequestId as jest.Mock).mockReturnValueOnce("err-x");
      const message = "Something went wrong";
      const err = new ErrorResponse(message);
      expect(err.status).toBe(500);
      expect(err.message).toBe(message);
      expect(err.error).toBe(true);
      expect(err.timestamp).toEqual(
        expect.stringMatching(/T\d{2}:\d{2}:\d{2}\./),
      );
      expect(err.requestId).toBe("err-x");
      expect(err.name).toBe("ErrorResponse");
      expect(err).toBeInstanceOf(ErrorResponse);
      expect(err).toBeInstanceOf(Error);
      expect(typeof err.stack).toBe("string");
    });

    it("sets custom HTTP status via constructor", () => {
      (getRequestId as jest.Mock).mockReturnValue("idZZ");
      const e = new ErrorResponse("Bad stuff", 404);
      expect(e.status).toBe(404);
      expect(e.requestId).toBe("idZZ");
    });

    it("sets requestId from randomUUID if getRequestId returns null/undefined", () => {
      (getRequestId as jest.Mock).mockReturnValueOnce(undefined);
      (randomUUID as jest.Mock).mockReturnValueOnce("err-uuid-89");
      expect(new ErrorResponse("fail").requestId).toBe("err-uuid-89");
    });

    it("sets name to subclass name", () => {
      const err = new ErrorResponse("msg");
      expect(err.name).toBe("ErrorResponse");
    });

    it('does not have a "data" property (by contract)', () => {
      const err = new ErrorResponse("fail");
      expect("data" in err).toBe(false);
    });
  });
});

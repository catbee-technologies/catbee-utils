import {
  HttpError,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadGatewayException,
  TooManyRequestsException,
  ServiceUnavailableException,
  GatewayTimeoutException,
  UnprocessableEntityException,
  MethodNotAllowedException,
  NotAcceptableException,
  RequestTimeoutException,
  UnsupportedMediaTypeException,
  PayloadTooLargeException,
  InsufficientStorageException,
  isHttpError,
  createHttpError,
  hasErrorShape,
  getErrorMessage,
  withErrorHandling,
} from "../../src/utils/exception.utils";
import { HttpStatusCodes } from "../../src/utils/http-status-codes";
import { ErrorResponse } from "../../src/utils/response.utils";

describe("ExceptionUtils", () => {
  describe("HttpError (generic)", () => {
    it("sets custom status and message", () => {
      const err = new HttpError(418, "I'm a teapot");
      expect(err).toBeInstanceOf(HttpError);
      expect(err).toBeInstanceOf(ErrorResponse);
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(418);
      expect(err.message).toBe("I'm a teapot");
      expect(err.name).toBe("HttpError"); // From Error base class (unless ErrorResponse changes it)
    });
  });

  describe("InternalServerErrorException", () => {
    it("has default message and 500 status", () => {
      const e = new InternalServerErrorException();
      expect(e.status).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(e.message).toBe("Internal server error");
      expect(e).toBeInstanceOf(InternalServerErrorException);
      expect(e).toBeInstanceOf(ErrorResponse);
    });
    it("uses custom message", () => {
      const e = new InternalServerErrorException("CUSTOM!");
      expect(e.message).toBe("CUSTOM!");
    });
  });

  describe("UnauthorizedException", () => {
    it("has default message and 401 status", () => {
      const e = new UnauthorizedException();
      expect(e.status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(e.message).toBe("Unauthorized");
    });
    it("uses custom message", () => {
      const e = new UnauthorizedException("No token!");
      expect(e.message).toBe("No token!");
    });
  });

  describe("BadRequestException", () => {
    it("has default message and 400 status", () => {
      const e = new BadRequestException();
      expect(e.status).toBe(HttpStatusCodes.BAD_REQUEST);
      expect(e.message).toBe("Bad request");
    });
    it("uses custom message", () => {
      const e = new BadRequestException("Invalid email");
      expect(e.message).toBe("Invalid email");
    });
  });

  describe("NotFoundException", () => {
    it("has default message and 404 status", () => {
      const e = new NotFoundException();
      expect(e.status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(e.message).toBe("Resource not found");
    });
    it("uses custom message", () => {
      const e = new NotFoundException("User not found");
      expect(e.message).toBe("User not found");
    });
  });

  describe("ForbiddenException", () => {
    it("has default message and 403 status", () => {
      const e = new ForbiddenException();
      expect(e.status).toBe(HttpStatusCodes.FORBIDDEN);
      expect(e.message).toBe("Forbidden");
    });
    it("uses custom message", () => {
      const e = new ForbiddenException("No admin privileges");
      expect(e.message).toBe("No admin privileges");
    });
  });

  describe("ConflictException", () => {
    it("has default message and 409 status", () => {
      const e = new ConflictException();
      expect(e.status).toBe(HttpStatusCodes.CONFLICT);
      expect(e.message).toBe("Conflict");
    });
    it("uses custom message", () => {
      const e = new ConflictException("Email already exists");
      expect(e.message).toBe("Email already exists");
    });
  });

  describe("BadGatewayException", () => {
    it("has default message and 502 status", () => {
      const e = new BadGatewayException();
      expect(e.status).toBe(HttpStatusCodes.BAD_GATEWAY);
      expect(e.message).toBe("Bad Gateway");
    });
    it("uses custom message", () => {
      const e = new BadGatewayException("Reverse proxy error");
      expect(e.message).toBe("Reverse proxy error");
    });
  });

  describe("TooManyRequestsException", () => {
    it("has default message and 429 status", () => {
      const e = new TooManyRequestsException();
      expect(e.status).toBe(HttpStatusCodes.TOO_MANY_REQUESTS);
      expect(e.message).toBe("Too many requests");
    });
    it("uses custom message", () => {
      const e = new TooManyRequestsException("Slow down");
      expect(e.message).toBe("Slow down");
    });
  });

  describe("ServiceUnavailableException", () => {
    it("has default message and 503 status", () => {
      const e = new ServiceUnavailableException();
      expect(e.status).toBe(HttpStatusCodes.SERVICE_UNAVAILABLE);
      expect(e.message).toBe("Service Unavailable");
    });
    it("uses custom message", () => {
      const e = new ServiceUnavailableException("Restarting...");
      expect(e.message).toBe("Restarting...");
    });
  });

  describe("GatewayTimeoutException", () => {
    it("has default message and 504 status", () => {
      const e = new GatewayTimeoutException();
      expect(e.status).toBe(HttpStatusCodes.GATEWAY_TIMEOUT);
      expect(e.message).toBe("Gateway Timeout");
    });
    it("uses custom message", () => {
      const e = new GatewayTimeoutException("Timeout talking to upsteam");
      expect(e.message).toBe("Timeout talking to upsteam");
    });
  });

  describe("UnprocessableEntityException", () => {
    it("has default message and 422 status", () => {
      const e = new UnprocessableEntityException();
      expect(e.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(e.message).toBe("Unprocessable Entity");
    });
    it("accepts custom message and details", () => {
      const details = { field: "email" };
      const e = new UnprocessableEntityException("Invalid", details);
      expect(e.message).toBe("Invalid");
      expect(e.details).toBe(details);
    });
  });

  describe("MethodNotAllowedException", () => {
    it("has default message and 405 status", () => {
      const e = new MethodNotAllowedException();
      expect(e.status).toBe(HttpStatusCodes.METHOD_NOT_ALLOWED);
      expect(e.message).toBe("Method Not Allowed");
    });
    it("accepts custom message and allowedMethods", () => {
      const e = new MethodNotAllowedException("Nope", ["GET", "POST"]);
      expect(e.message).toBe("Nope");
      expect(e.allowedMethods).toEqual(["GET", "POST"]);
    });
  });

  describe("NotAcceptableException", () => {
    it("has default message and 406 status", () => {
      const e = new NotAcceptableException();
      expect(e.status).toBe(HttpStatusCodes.NOT_ACCEPTABLE);
      expect(e.message).toBe("Not Acceptable");
    });
    it("accepts custom message", () => {
      const e = new NotAcceptableException("Nope");
      expect(e.message).toBe("Nope");
    });
  });

  describe("RequestTimeoutException", () => {
    it("has default message and 408 status", () => {
      const e = new RequestTimeoutException();
      expect(e.status).toBe(HttpStatusCodes.REQUEST_TIMEOUT);
      expect(e.message).toBe("Request Timeout");
    });
    it("accepts custom message", () => {
      const e = new RequestTimeoutException("Too slow");
      expect(e.message).toBe("Too slow");
    });
  });

  describe("UnsupportedMediaTypeException", () => {
    it("has default message and 415 status", () => {
      const e = new UnsupportedMediaTypeException();
      expect(e.status).toBe(HttpStatusCodes.UNSUPPORTED_MEDIA_TYPE);
      expect(e.message).toBe("Unsupported Media Type");
    });
    it("accepts custom message", () => {
      const e = new UnsupportedMediaTypeException("Nope");
      expect(e.message).toBe("Nope");
    });
  });

  describe("PayloadTooLargeException", () => {
    it("has default message and 413 status", () => {
      const e = new PayloadTooLargeException();
      expect(e.status).toBe(HttpStatusCodes.PAYLOAD_TOO_LARGE);
      expect(e.message).toBe("Payload Too Large");
    });
    it("accepts custom message", () => {
      const e = new PayloadTooLargeException("Big!");
      expect(e.message).toBe("Big!");
    });
  });

  describe("InsufficientStorageException", () => {
    it("has default message and 507 status", () => {
      const e = new InsufficientStorageException();
      expect(e.status).toBe(HttpStatusCodes.INSUFFICIENT_STORAGE);
      expect(e.message).toBe("Insufficient Storage");
    });
    it("accepts custom message", () => {
      const e = new InsufficientStorageException("Disk full");
      expect(e.message).toBe("Disk full");
    });
  });

  describe("isHttpError", () => {
    it("returns true for ErrorResponse and subclasses", () => {
      expect(isHttpError(new BadRequestException())).toBe(true);
      expect(isHttpError(new ErrorResponse("x"))).toBe(true);
    });
    it("returns false for plain Error or object", () => {
      expect(isHttpError(new Error("x"))).toBe(false);
      expect(isHttpError({})).toBe(false);
    });
  });

  describe("createHttpError", () => {
    it("returns correct error class for known status", () => {
      expect(createHttpError(HttpStatusCodes.BAD_REQUEST)).toBeInstanceOf(
        BadRequestException,
      );
      expect(createHttpError(HttpStatusCodes.UNAUTHORIZED)).toBeInstanceOf(
        UnauthorizedException,
      );
      expect(createHttpError(HttpStatusCodes.NOT_FOUND)).toBeInstanceOf(
        NotFoundException,
      );
      expect(
        createHttpError(HttpStatusCodes.METHOD_NOT_ALLOWED),
      ).toBeInstanceOf(MethodNotAllowedException);
      expect(
        createHttpError(HttpStatusCodes.UNPROCESSABLE_ENTITY),
      ).toBeInstanceOf(UnprocessableEntityException);
      expect(createHttpError(499, "Custom")).toBeInstanceOf(HttpError);
    });
    it("sets message if provided", () => {
      const e = createHttpError(HttpStatusCodes.BAD_REQUEST, "bad!");
      expect(e.message).toBe("bad!");
    });
  });

  describe("hasErrorShape", () => {
    it("returns true for objects with message", () => {
      expect(hasErrorShape({ message: "x" })).toBe(true);
      expect(hasErrorShape({ message: "x", status: 400 })).toBe(true);
    });
    it("returns false for objects without message", () => {
      expect(hasErrorShape({})).toBe(false);
      expect(hasErrorShape(null)).toBe(false);
      expect(hasErrorShape(undefined)).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("returns string for string input", () => {
      expect(getErrorMessage("foo")).toBe("foo");
    });
    it("returns message for Error", () => {
      expect(getErrorMessage(new Error("err"))).toBe("err");
    });
    it("returns message for error-like object", () => {
      expect(getErrorMessage({ message: "msg" })).toBe("msg");
    });
    it("returns fallback for unknown", () => {
      expect(getErrorMessage(123)).toBe("Unknown error occurred");
    });
  });

  describe("withErrorHandling", () => {
    it("passes through if no error", async () => {
      const fn = withErrorHandling(async (x: number) => x + 1);
      await expect(fn(2)).resolves.toBe(3);
    });
    it("throws HttpError as-is", async () => {
      const fn = withErrorHandling(async () => {
        throw new BadRequestException("bad");
      });
      await expect(fn()).rejects.toBeInstanceOf(BadRequestException);
    });
    it("wraps non-HttpError in InternalServerErrorException", async () => {
      const fn = withErrorHandling(async () => {
        throw new Error("fail");
      });
      await expect(fn()).rejects.toBeInstanceOf(InternalServerErrorException);
    });
    it("wraps error-like object with status", async () => {
      const fn = withErrorHandling(async () => {
        throw { message: "fail", status: 409 };
      });
      await expect(fn()).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // Inheritance checks for static typing / compatibility
  it("all exception classes extend ErrorResponse", () => {
    [
      InternalServerErrorException,
      UnauthorizedException,
      BadRequestException,
      NotFoundException,
      ForbiddenException,
      ConflictException,
      BadGatewayException,
      TooManyRequestsException,
      ServiceUnavailableException,
      GatewayTimeoutException,
      UnprocessableEntityException,
      MethodNotAllowedException,
      NotAcceptableException,
      RequestTimeoutException,
      UnsupportedMediaTypeException,
      PayloadTooLargeException,
      InsufficientStorageException,
    ].forEach((ExceptionClass) => {
      const e = new ExceptionClass();
      expect(e).toBeInstanceOf(ErrorResponse);
      expect(typeof e.status).toBe("number");
      expect(typeof e.message).toBe("string");
    });
  });
});

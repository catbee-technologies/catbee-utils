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
    ].forEach((ExceptionClass) => {
      const e = new ExceptionClass();
      expect(e).toBeInstanceOf(ErrorResponse);
      expect(typeof e.status).toBe("number");
      expect(typeof e.message).toBe("string");
    });
  });
});

/*
 * The MIT License
 *
 * Copyright (c) 2025 Catbee Technologies
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Complete HTTP status codes enum with descriptions.
 * For use with API responses and error handling.
 */
export enum HttpStatusCodes {
  // 1xx Informational
  /**
   * The server has received the request headers and the client should proceed to send the request body.
   */
  CONTINUE = 100,

  /**
   * The server is switching protocols according to the client's request.
   */
  SWITCHING_PROTOCOLS = 101,

  /**
   * Server has received the request and is still processing it.
   */
  PROCESSING = 102,

  /**
   * The server is sending preliminary headers while preparing the final response.
   */
  EARLY_HINTS = 103,

  // 2xx Success
  /**
   * The request succeeded. The result meaning depends on the HTTP method used.
   */
  OK = 200,

  /**
   * The request succeeded and a new resource was created as a result.
   */
  CREATED = 201,

  /**
   * The request has been received but not yet acted upon.
   */
  ACCEPTED = 202,

  /**
   * The returned information is from a third-party source, not the origin server.
   */
  NON_AUTHORITATIVE_INFORMATION = 203,

  /**
   * The request succeeded but there's no content to send in the response.
   */
  NO_CONTENT = 204,

  /**
   * The client should reset the document view that caused this request.
   */
  RESET_CONTENT = 205,

  /**
   * The server is delivering only part of the resource due to a range header sent by the client.
   */
  PARTIAL_CONTENT = 206,

  /**
   * Conveys information about multiple resources, for complex operations.
   */
  MULTI_STATUS = 207,

  /**
   * The members of a DAV binding have already been enumerated and are not included in the response.
   */
  ALREADY_REPORTED = 208,

  /**
   * The server has fulfilled a request for the resource, and the response represents the result of one or more instance-manipulations.
   */
  IM_USED = 226,

  // 3xx Redirection
  /**
   * The request has more than one possible response and the client should choose one.
   */
  MULTIPLE_CHOICES = 300,

  /**
   * The resource has been permanently moved to a new URL.
   */
  MOVED_PERMANENTLY = 301,

  /**
   * The resource has been temporarily moved to another URL.
   */
  MOVED_TEMPORARILY = 302,

  /**
   * The response to the request can be found under another URI using the GET method.
   */
  SEE_OTHER = 303,

  /**
   * The resource hasn't been modified since the last request.
   */
  NOT_MODIFIED = 304,

  /**
   * @deprecated
   * Response must be accessed through a proxy.
   */
  USE_PROXY = 305,

  /**
   * The resource is temporarily available at a different URI, using the same HTTP method.
   */
  TEMPORARY_REDIRECT = 307,

  /**
   * The resource has been permanently moved to another URL, using the same HTTP method.
   */
  PERMANENT_REDIRECT = 308,

  // 4xx Client Error
  /**
   * The server cannot process the request due to a client error (malformed request).
   */
  BAD_REQUEST = 400,

  /**
   * Authentication is required and has failed or not been provided.
   */
  UNAUTHORIZED = 401,

  /**
   * Reserved for future use, originally intended for digital payment systems.
   */
  PAYMENT_REQUIRED = 402,

  /**
   * The client doesn't have permission to access the requested resource.
   */
  FORBIDDEN = 403,

  /**
   * The requested resource could not be found on the server.
   */
  NOT_FOUND = 404,

  /**
   * The request method is not supported for the requested resource.
   */
  METHOD_NOT_ALLOWED = 405,

  /**
   * The server can't provide a response matching the list of acceptable values in the client's headers.
   */
  NOT_ACCEPTABLE = 406,

  /**
   * Authentication by a proxy is required.
   */
  PROXY_AUTHENTICATION_REQUIRED = 407,

  /**
   * The server timed out waiting for the request.
   */
  REQUEST_TIMEOUT = 408,

  /**
   * The request conflicts with the current state of the server.
   */
  CONFLICT = 409,

  /**
   * The resource has been permanently deleted with no forwarding address.
   */
  GONE = 410,

  /**
   * The server requires a Content-Length header field.
   */
  LENGTH_REQUIRED = 411,

  /**
   * Preconditions in the client's headers failed.
   */
  PRECONDITION_FAILED = 412,

  /**
   * Request entity is larger than limits defined by server.
   */
  REQUEST_TOO_LONG = 413,

  /**
   * The request payload exceeds server size limits.
   * Modern equivalent of REQUEST_TOO_LONG.
   */
  PAYLOAD_TOO_LARGE = 413,

  /**
   * The URI requested is too long for the server to interpret.
   */
  REQUEST_URI_TOO_LONG = 414,

  /**
   * The server does not support the media type requested by the client.
   */
  UNSUPPORTED_MEDIA_TYPE = 415,

  /**
   * The range specified by the Range header cannot be fulfilled.
   */
  REQUESTED_RANGE_NOT_SATISFIABLE = 416,

  /**
   * The server cannot meet the expectations given in the Expect header.
   */
  EXPECTATION_FAILED = 417,

  /**
   * The server refuses to brew coffee because it is a teapot. (April Fools' joke)
   */
  IM_A_TEAPOT = 418,

  /**
   * The server cannot store the representation needed to complete the request.
   */
  INSUFFICIENT_SPACE_ON_RESOURCE = 419,

  /**
   * @deprecated
   * A method has failed - specific to Spring Framework.
   */
  METHOD_FAILURE = 420,

  /**
   * The server cannot produce a response for the requested URI scheme and authority.
   */
  MISDIRECTED_REQUEST = 421,

  /**
   * The request was well-formed but has semantic errors preventing processing.
   */
  UNPROCESSABLE_ENTITY = 422,

  /**
   * The requested resource is locked against access.
   */
  LOCKED = 423,

  /**
   * The request failed due to the failure of a previous request.
   */
  FAILED_DEPENDENCY = 424,

  /**
   * The client should switch to a different protocol.
   */
  UPGRADE_REQUIRED = 426,

  /**
   * The server requires conditional requests to prevent lost updates.
   */
  PRECONDITION_REQUIRED = 428,

  /**
   * The client has sent too many requests in a given time period (rate limiting).
   */
  TOO_MANY_REQUESTS = 429,

  /**
   * Request headers are too large for the server to process.
   */
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,

  /**
   * Resource cannot be legally provided (e.g., censored by government).
   */
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,

  // 5xx Server Error
  /**
   * The server encountered an unexpected error preventing it from fulfilling the request.
   */
  INTERNAL_SERVER_ERROR = 500,

  /**
   * The server does not support the functionality required to fulfill the request.
   */
  NOT_IMPLEMENTED = 501,

  /**
   * The server, acting as a gateway, received an invalid response from an upstream server.
   */
  BAD_GATEWAY = 502,

  /**
   * The server is currently unable to handle the request due to temporary overload or maintenance.
   */
  SERVICE_UNAVAILABLE = 503,

  /**
   * The server, acting as a gateway, did not receive a timely response from an upstream server.
   */
  GATEWAY_TIMEOUT = 504,

  /**
   * The server does not support the HTTP protocol version used in the request.
   */
  HTTP_VERSION_NOT_SUPPORTED = 505,

  /**
   * Transparent content negotiation for the request resulted in circular reference.
   */
  VARIANT_ALSO_NEGOTIATES = 506,

  /**
   * The server cannot store the representation needed to complete the request.
   */
  INSUFFICIENT_STORAGE = 507,

  /**
   * The server detected an infinite loop while processing the request.
   */
  LOOP_DETECTED = 508,

  /**
   * Further extensions to the request are required for the server to fulfill it.
   */
  NOT_EXTENDED = 510,

  /**
   * The client needs to authenticate to gain network access.
   */
  NETWORK_AUTHENTICATION_REQUIRED = 511
}

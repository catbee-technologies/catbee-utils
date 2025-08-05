import fetch, { Headers, RequestInit, HeadersInit, Response } from "node-fetch";
import { AbortController } from "abort-controller";
import { getLogger } from "./Logger";

/**
 * Supported HTTP methods.
 */
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

/**
 * Configuration options for initializing HttpClient.
 */
export interface HttpClientOptions {
  /**
   * Optional base URL to prepend to all request paths.
   */
  baseUrl?: string;

  /**
   * Default headers applied to every request unless overridden.
   */
  headers?: HeadersInit;

  /**
   * Maximum time to wait for a request before aborting (in milliseconds).
   */
  timeout?: number;

  /**
   * Number of times to retry a failed request.
   */
  retries?: number;
}

/**
 * Represents a request or response interceptor.
 */
export type Interceptor<T> = (data: T) => Promise<T> | T;

/**
 * A customizable HTTP client with support for base URL, retries, timeouts,
 * interceptors, and typed responses.
 */
export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private timeout: number;
  private retries: number;
  private requestInterceptors: Interceptor<RequestInit>[] = [];
  private responseInterceptors: Interceptor<any>[] = [];

  /**
   * Creates a new HttpClient instance.
   * @param options Optional configuration for the client.
   */
  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.defaultHeaders = options.headers ?? {
      "Content-Type": "application/json",
    };
    this.timeout = options.timeout ?? 10000;
    this.retries = options.retries ?? 0;
  }

  /**
   * Adds a request interceptor to modify requests before they're sent.
   * @param interceptor The request interceptor function.
   */
  useRequestInterceptor(interceptor: Interceptor<RequestInit>): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Adds a response interceptor to modify responses before they're returned.
   * @param interceptor The response interceptor function.
   */
  useResponseInterceptor<T>(interceptor: Interceptor<T>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Applies all registered request interceptors in sequence.
   * @param init The original request init object.
   * @returns The modified request init object.
   */
  private async applyRequestInterceptors(
    init: RequestInit,
  ): Promise<RequestInit> {
    let current = init;
    for (const interceptor of this.requestInterceptors) {
      current = await interceptor(current);
    }
    return current;
  }

  /**
   * Applies all registered response interceptors in sequence.
   * @param response The original response body.
   * @returns The modified response body.
   */
  private async applyResponseInterceptors<T>(response: T): Promise<T> {
    let current = response;
    for (const interceptor of this.responseInterceptors) {
      current = await interceptor(current);
    }
    return current;
  }

  /**
   * Checks if a specific header is present in the headers.
   * @param headers Headers object or key-value pair.
   * @param name Header name to check (case-insensitive).
   * @returns True if the header exists, false otherwise.
   */
  private hasHeader(headers: HeadersInit, name: string): boolean {
    if (headers instanceof Headers) {
      return headers.has(name);
    }

    if (Array.isArray(headers)) {
      return headers.some(([key]) => key.toLowerCase() === name.toLowerCase());
    }

    return Object.keys(headers).some(
      (key) => key.toLowerCase() === name.toLowerCase(),
    );
  }

  /**
   * Wraps a fetch call in a timeout using AbortController.
   * @param promise The fetch call.
   * @param timeout Timeout in milliseconds.
   * @param controller Abort controller instance.
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    controller: AbortController,
  ): Promise<T> {
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await promise;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Internal method to execute HTTP requests with retry, timeout, interceptors.
   *
   * @template T - Expected type of the response body.
   * @returns The parsed response body of type T, or an object containing metadata if `returnAlsoHeaders` is true.
   */
  private async execute<T>(
    method: HttpMethod,
    path: string,
    data?: any,
    headers: HeadersInit = {},
    fetchOpts: RequestInit = {},
    returnAlsoHeaders = false,
  ): Promise<T | { status: number; headers: Headers; body: T }> {
    const url = `${this.baseUrl}${path}`;
    const logger = getLogger();
    const controller = new AbortController();

    const finalHeaders: HeadersInit = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Handle request body and content-type
    if (data instanceof Buffer) {
      fetchOpts.body = data;
    } else if (data !== undefined && method !== "GET" && method !== "HEAD") {
      if (typeof data !== "string") data = JSON.stringify(data);
      fetchOpts.body = data;
      if (!this.hasHeader(finalHeaders, "content-type")) {
        (finalHeaders as any)["Content-Type"] =
          "application/json;charset=utf-8";
      }
    }

    let init: RequestInit = {
      method,
      headers: finalHeaders,
      signal: controller.signal,
      ...fetchOpts,
    };

    init = await this.applyRequestInterceptors(init);

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const res = await this.withTimeout(
          fetch(url, init),
          this.timeout,
          controller,
        );

        if (res.status >= 400) {
          const errData = await this.extractBody(res);
          throw new HttpError(res.status, res.statusText, errData);
        }

        if (method === "HEAD") {
          return { headers: res.headers } as any;
        }

        const body: T =
          res.status === 204 ? (null as any) : await this.extractBody(res);
        const result: T = await this.applyResponseInterceptors(body);
        return returnAlsoHeaders
          ? { status: res.status, headers: res.headers, body: result }
          : result;
      } catch (err) {
        logger.warn({ err, attempt, url }, "HTTP attempt failed");
        if (attempt === this.retries) throw err;
      }
    }

    throw new Error("Exhausted all retry attempts");
  }

  /**
   * Parses the response body based on Content-Type.
   */
  private async extractBody(res: Response): Promise<any> {
    const contentLength = res.headers.get("content-length");
    if (contentLength === "0") return null;

    const contentType = res.headers.get("content-type");
    if (!contentType) return res.arrayBuffer();

    if (/^application\/(\w+\+)?json/.test(contentType)) {
      return res.json();
    }
    if (
      /^application\/(\w+\+)?xml/.test(contentType) ||
      /^text\/|charset=utf-8$/.test(contentType)
    ) {
      return res.text();
    }

    return res.arrayBuffer();
  }

  /**
   * Sends an HTTP HEAD request.
   * Primarily used to fetch headers without fetching the response body.
   *
   * @param path - Relative path to append to baseUrl.
   * @param headers - Optional headers to override defaults.
   * @param fetchOpts - Additional fetch options (e.g., credentials, mode).
   * @returns A promise resolving with the response headers.
   */
  head(path: string, headers?: HeadersInit, fetchOpts?: RequestInit) {
    return this.execute("HEAD", path, undefined, headers, fetchOpts);
  }

  /**
   * Sends an HTTP OPTIONS request.
   * Useful for CORS preflight requests or discovering server-supported methods.
   *
   * @param path - Relative request path.
   * @param headers - Optional headers to include.
   * @param fetchOpts - Additional fetch options.
   * @param returnAlsoHeaders - If true, includes response status and headers in the result.
   * @returns A promise resolving with the response body or metadata.
   */
  options(
    path: string,
    headers?: HeadersInit,
    fetchOpts?: RequestInit,
    returnAlsoHeaders = false,
  ) {
    return this.execute(
      "OPTIONS",
      path,
      undefined,
      headers,
      fetchOpts,
      returnAlsoHeaders,
    );
  }

  /**
   * Sends an HTTP GET request.
   * Used to retrieve data from the server.
   *
   * @typeParam T - Expected response type.
   * @param path - Relative URL path (e.g., '/users').
   * @param headers - Optional headers to override defaults.
   * @param fetchOpts - Optional fetch config.
   * @param returnAlsoHeaders - If true, returns body, status and headers.
   * @returns A promise resolving to the response body (or full response if `returnAlsoHeaders` is true).
   */
  get<T = unknown>(
    path: string,
    headers?: HeadersInit,
    fetchOpts?: RequestInit,
    returnAlsoHeaders = false,
  ) {
    return this.execute<T>(
      "GET",
      path,
      undefined,
      headers,
      fetchOpts,
      returnAlsoHeaders,
    );
  }

  /**
   * Sends an HTTP DELETE request.
   * Typically used to remove a resource from the server.
   *
   * @typeParam T - Expected response type.
   * @param path - Relative path to the resource.
   * @param data - Optional payload (rare for DELETE, but sometimes used).
   * @param headers - Optional headers for the request.
   * @param fetchOpts - Additional fetch options.
   * @param returnAlsoHeaders - If true, includes headers and status in response.
   * @returns A promise resolving to the response.
   */
  delete<T = unknown>(
    path: string,
    data?: any,
    headers?: HeadersInit,
    fetchOpts?: RequestInit,
    returnAlsoHeaders = false,
  ) {
    return this.execute<T>(
      "DELETE",
      path,
      data,
      headers,
      fetchOpts,
      returnAlsoHeaders,
    );
  }

  /**
   * Sends an HTTP PUT request.
   * Used to fully update or replace a resource.
   *
   * @typeParam T - Expected response type.
   * @param path - Target URL path.
   * @param data - The request payload (usually a full resource object).
   * @param headers - Optional headers to send.
   * @param fetchOpts - Fetch API options like credentials, mode, etc.
   * @param returnAlsoHeaders - If true, includes headers and status in the return.
   * @returns A promise resolving with the response body or metadata.
   */
  put<T = unknown>(
    path: string,
    data: any,
    headers?: HeadersInit,
    fetchOpts?: RequestInit,
    returnAlsoHeaders = false,
  ) {
    return this.execute<T>(
      "PUT",
      path,
      data,
      headers,
      fetchOpts,
      returnAlsoHeaders,
    );
  }

  /**
   * Sends an HTTP POST request.
   * Commonly used to create a new resource or trigger a server-side action.
   *
   * @typeParam T - Expected response type.
   * @param path - Endpoint path (relative to baseUrl).
   * @param data - Request body (e.g., form data or JSON).
   * @param headers - Optional custom headers.
   * @param fetchOpts - Additional fetch options.
   * @param returnAlsoHeaders - If true, includes headers and status in the response.
   * @returns A promise resolving with the server response.
   */
  post<T = unknown>(
    path: string,
    data: any,
    headers?: HeadersInit,
    fetchOpts?: RequestInit,
    returnAlsoHeaders = false,
  ) {
    return this.execute<T>(
      "POST",
      path,
      data,
      headers,
      fetchOpts,
      returnAlsoHeaders,
    );
  }

  /**
   * Sends an HTTP PATCH request.
   * Used to partially update an existing resource.
   *
   * @typeParam T - Expected response type.
   * @param path - Resource path (e.g., '/users/123').
   * @param data - Partial update payload.
   * @param headers - Optional request headers.
   * @param fetchOpts - Optional fetch options.
   * @param returnAlsoHeaders - If true, returns response headers and status as well.
   * @returns A promise resolving with the updated resource.
   */
  patch<T = unknown>(
    path: string,
    data: any,
    headers?: HeadersInit,
    fetchOpts?: RequestInit,
    returnAlsoHeaders = false,
  ) {
    return this.execute<T>(
      "PATCH",
      path,
      data,
      headers,
      fetchOpts,
      returnAlsoHeaders,
    );
  }
}

/**
 * Represents an HTTP error response with status and parsed body.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response: unknown,
  ) {
    super(`[HTTP ${status}] ${statusText}`);
  }
}

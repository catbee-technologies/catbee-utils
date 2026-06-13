import { HttpInterceptorManager } from '../http-interceptor-manager';
import { HttpMethod } from './http-method';

export { HttpMethod };

/** Possible header values for HTTP request headers. */
export type HttpHeaderValue = string | number | boolean;

/** Initial header map for HTTP requests. */
export type HttpHeadersInit = Record<string, HttpHeaderValue>;

/**
 * Configures retry behavior for HTTP requests.
 *
 * @example
 * const retry: RetryOptions = {
 *   retries: 3,
 *   delay: 500,
 *   retryOn: [500, 502, 503],
 *   methods: [HttpMethod.GET, HttpMethod.HEAD],
 *   retryNetworkErrors: true
 * };
 */
export interface RetryOptions {
  /** Maximum number of retry attempts after the initial request. */
  retries?: number;
  /** Delay between retries in milliseconds or a function that returns milliseconds per attempt. */
  delay?: number | ((attempt: number) => number);
  /** HTTP status codes that should be retried when returned by the server. */
  retryOn?: number[];
  /** HTTP methods allowed to retry. */
  methods?: HttpMethod[];
  /** Whether network-level failures should be retried. */
  retryNetworkErrors?: boolean;
}

/**
 * HTTP request payload plus optional request configuration.
 */
export interface HttpRequest<T = unknown> extends HttpRequestConfig {
  /** Request URL path or absolute address. */
  url: string;
  /** Request body payload. */
  body?: T;
}

/**
 * HTTP response returned by an adapter.
 */
export interface HttpResponse<T = unknown> {
  /** Parsed response payload. */
  data: T;
  /** HTTP status code from the response. */
  status: number;
  /** HTTP status text from the response. */
  statusText: string;
  /** Response headers. */
  headers: Headers;
  /** The original request configuration that produced this response. */
  config: HttpRequestConfig;
}

/**
 * Interceptor that can modify request configuration before it is sent.
 */
export type RequestInterceptor = (config: HttpRequestConfig) => Promise<HttpRequestConfig> | HttpRequestConfig;

/**
 * Interceptor that can inspect or modify an HTTP response.
 */
export type ResponseInterceptor = <T>(response: HttpResponse<T>) => Promise<HttpResponse<T>> | HttpResponse<T>;

/**
 * Interceptor that handles request or response errors.
 */
export type ErrorInterceptor = (error: unknown) => Promise<unknown> | unknown;

/**
 * Adapter contract for HTTP request execution.
 */
export interface HttpAdapter {
  /**
   * Sends a request and resolves with the HTTP response.
   */
  send<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}

/**
 * Container for request, response, and error interceptors.
 */
export interface HttpInterceptors {
  request: HttpInterceptorManager<HttpRequestConfig>;
  response: HttpInterceptorManager<HttpResponse>;
  error: HttpInterceptorManager<unknown>;
}

/**
 * Function used to validate response status codes.
 */
export type ValidateStatusFn = (status: number) => boolean;

/**
 * Hook executed before a request is sent.
 * Returning `false` cancels the request.
 */
export type BeforeRequestHook = (
  config: HttpRequestConfig
) => HttpRequestConfig | false | Promise<HttpRequestConfig | false>;

/**
 * Hook executed after a response is received.
 */
export type AfterResponseHook = <T>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;

/**
 * Optional data transformers for request and response payloads.
 */
export interface HttpTransformers {
  /** Transform the request body before it is sent. */
  request?: (body: unknown) => unknown | Promise<unknown>;
  /** Transform the response body after it is received. */
  response?: (body: unknown) => unknown | Promise<unknown>;
}

/**
 * Options for creating an HTTP client instance.
 *
 * @example
 * const client = HttpClient.create({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000,
 *   retry: { retries: 2 },
 *   validateStatus: status => status >= 200 && status < 400
 * });
 */
export interface HttpClientOptions {
  /** Global base URL to prefix request paths with. */
  baseURL?: string;
  /** Default headers to apply to every request. */
  headers?: HttpHeadersInit;
  /** Default request timeout in milliseconds. */
  timeout?: number;
  /** Default number of retries for requests when `retry` is not provided. */
  retries?: number;
  /** Retry policy configuration. */
  retry?: RetryOptions;
  /** Custom HTTP adapter implementation. */
  adapter?: HttpAdapter;
  /** Payload transformers applied before request and after response. */
  transform?: HttpTransformers;
  /** Optional override for response status validation. */
  validateStatus?: ValidateStatusFn;
  /** Hook to run before sending each request. */
  beforeRequest?: BeforeRequestHook;
  /** Hook to run after receiving each response. */
  afterResponse?: AfterResponseHook;
  /** Custom JSON parser for response bodies. */
  jsonParser?: (text: string) => unknown;
  /** Custom JSON serializer for request bodies. */
  jsonStringifier?: (value: unknown) => string;
}

/**
 * Progress information reported during upload or download events.
 */
export interface ProgressEvent {
  /** Number of bytes loaded so far. */
  loaded: number;
  /** Total number of bytes expected, if known. */
  total?: number;
  /** Optional completed percentage value. */
  percent?: number;
}

/**
 * Common request configuration for HTTP methods.
 *
 * @example
 * const config: HttpRequestConfig = {
 *   method: HttpMethod.POST,
 *   headers: { 'Content-Type': 'application/json' },
 *   query: { search: 'test' },
 *   responseType: 'json'
 * };
 */
export interface HttpRequestConfig {
  /** HTTP method to use for the request. */
  method?: HttpMethod;
  /** Request headers. */
  headers?: HttpHeadersInit;
  /** Query parameters to append to the request URL. */
  query?: Record<string, unknown>;
  /** Request timeout in milliseconds. */
  timeout?: number;
  /** AbortSignal used to cancel the request. */
  signal?: AbortSignal;
  /** Request body payload. */
  body?: unknown;
  /** Progress callback for upload events. */
  onUploadProgress?: (progress: ProgressEvent) => void;
  /** Progress callback for download events. */
  onDownloadProgress?: (progress: ProgressEvent) => void;
  /** Expected response type when reading the response body. */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'auto';
  /** Request credentials policy. */
  credentials?: 'omit' | 'same-origin' | 'include';
  /** Request mode for fetch. */
  mode?: 'cors' | 'no-cors' | 'same-origin' | 'navigate';
  /** Redirect behavior for fetch requests. */
  redirect?: 'follow' | 'error' | 'manual';
  /** Optional status validation override. */
  validateStatus?: ValidateStatusFn;
  /** Optional JSON parser override for response text. */
  jsonParser?: (text: string) => unknown;
  /** Optional JSON serializer override for request bodies. */
  jsonStringifier?: (value: unknown) => string;
}

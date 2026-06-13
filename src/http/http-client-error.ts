import { HttpRequestConfig } from './types';

export class HttpClientError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly method?: string;
  public readonly url?: string;
  public readonly headers?: Headers;
  public readonly data?: unknown;
  public readonly config?: HttpRequestConfig;
  public override readonly cause?: unknown;
  public readonly isHttpClientError = true;

  constructor(options: {
    message: string;
    status: number;
    statusText: string;
    method?: string;
    url?: string;
    headers?: Headers;
    data?: unknown;
    config?: HttpRequestConfig;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'HttpClientError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.method = options.method;
    this.url = options.url;
    this.headers = options.headers;
    this.data = options.data;
    this.config = options.config;
    this.cause = options.cause;

    // Capture stack trace for better debugging in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpClientError);
    }
  }

  public static isHttpClientError(value: unknown): value is HttpClientError {
    return (
      value instanceof HttpClientError ||
      (typeof value === 'object' && value !== null && (value as any).isHttpClientError === true)
    );
  }
}

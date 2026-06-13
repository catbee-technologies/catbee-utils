import { HttpAdapter, HttpClientOptions, HttpMethod, HttpRequest, HttpRequestConfig, HttpResponse } from './types';
import { buildURL } from './utils/url';
import { createTimeoutSignal } from './utils/timeout';
import { HttpInterceptorManager } from './http-interceptor-manager';
import { HttpHeaders } from './http-header';
import { RetryPolicy } from './retry-policy';
import { FetchAdapter } from './adapters/fetch';
import { HttpClientError } from './http-client-error';
import { deepObjMerge } from '@catbee/utils/object';

/**
 * Default HTTP client options that are applied to every request.
 */
export interface HttpDefaults {
  /** Base URL used to prefix relative request paths. */
  baseURL?: string;
  /** Default request timeout in milliseconds. */
  timeout?: number;
  /** Default headers applied to every request. */
  headers?: Record<string, string | number | boolean>;
}

/**
 * HTTP client for making requests with interceptors, retries, and transport adapters.
 */
export class HttpClient {
  public interceptors = {
    request: new HttpInterceptorManager<HttpRequestConfig>(),
    response: new HttpInterceptorManager<HttpResponse>(),
    error: new HttpInterceptorManager<unknown>()
  };
  public readonly defaults: HttpDefaults;

  private readonly headers = new HttpHeaders();
  private readonly retryPolicy: RetryPolicy;
  private readonly adapter: HttpAdapter;
  private readonly clientOptions: HttpClientOptions;

  /**
   * Create a new HTTP client instance with the provided options.
   * @param options Client configuration options.
   */
  public static create(options: HttpClientOptions = {}): HttpClient {
    return new HttpClient(options);
  }

  /**
   * Create an HTTP client instance.
   * @param options Client configuration options.
   */
  constructor(options: HttpClientOptions = {}) {
    this.clientOptions = options;
    this.headers.merge(options.headers);

    this.defaults = {
      baseURL: options.baseURL,
      timeout: options.timeout,
      headers: options.headers ? { ...options.headers } : {}
    };

    this.retryPolicy = new RetryPolicy({
      retries: options.retry?.retries ?? options.retries,
      delay: options.retry?.delay,
      retryOn: options.retry?.retryOn,
      methods: options.retry?.methods
    });

    this.adapter = options.adapter ?? new FetchAdapter();
  }

  /**
   * Set a default header for all requests.
   * @param key Header name.
   * @param value Header value.
   * @example
   * client.setHeader('Authorization', 'Bearer token');
   */
  public setHeader(key: string, value: string | number | boolean): this {
    this.headers.set(key, value);
    this.defaults.headers ??= {};
    this.defaults.headers[key] = value;
    return this;
  }

  /**
   * Remove a default header from the client.
   * @param key Header name to remove.
   * @example
   * client.removeHeader('Authorization');
   */
  public removeHeader(key: string): this {
    this.headers.delete(key);
    if (this.defaults.headers) {
      delete this.defaults.headers[key];
    }
    return this;
  }

  /**
   * Clear all default headers configured on the client.
   * @example
   * client.clearHeaders();
   */
  public clearHeaders(): this {
    this.headers.clear();
    this.defaults.headers = {};
    return this;
  }

  /**
   * Create a child client that inherits this client's configuration and merges overrides.
   * @param options Partial options to override on the child client.
   * @example
   * const child = client.createChild({ baseURL: 'https://api.example.com/v2' });
   */
  public createChild(options: Partial<HttpClientOptions> = {}): HttpClient {
    const merged = deepObjMerge<HttpClientOptions>(
      { ...this.clientOptions },
      {
        ...options,
        headers: {
          ...this.clientOptions.headers,
          ...options.headers
        }
      }
    );
    return new HttpClient(merged);
  }

  /**
   * Clone this client including headers, interceptors, and default configuration.
   * @example
   * const clonedClient = client.clone();
   */
  public clone(): HttpClient {
    const cloned = new HttpClient({ ...this.clientOptions });
    cloned.headers.merge(this.headers.toObject());

    // Clone interceptor handlers independently so modifications don't affect the original
    cloned.interceptors.request = this.interceptors.request.clone();
    cloned.interceptors.response = this.interceptors.response.clone();
    cloned.interceptors.error = this.interceptors.error.clone();

    // Copy defaults modifications
    Object.assign(cloned.defaults, this.defaults);

    return cloned;
  }

  /**
   * Build a full request URI from the base URL, path, and query params.
   * @param config Partial request config containing url and query params.
   * @example
   * client.getUri({ url: '/users', query: { active: true } });
   */
  public getUri(config: Partial<HttpRequestConfig & { url: string }> = {}): string {
    const finalConfig = deepObjMerge<HttpRequestConfig>(
      {
        headers: this.headers.toObject(),
        timeout: this.clientOptions.timeout
      },
      config as HttpRequestConfig
    );

    return buildURL(this.clientOptions.baseURL, config.url || '', finalConfig.query);
  }

  /**
   * Send an HTTP request using the configured adapter, retry policy, and interceptors.
   * @param config Request configuration including URL, method, headers, and body.
   * @example
   * const response = await client.request({
   *   url: '/users',
   *   method: HttpMethod.GET
   * });
   */
  public async request<T>(
    config: HttpRequestConfig & {
      url: string;
    }
  ): Promise<HttpResponse<T>> {
    const merged = deepObjMerge<HttpRequestConfig>(
      {
        headers: this.headers.toObject(),
        timeout: this.clientOptions.timeout,
        validateStatus: this.clientOptions.validateStatus,
        jsonParser: this.clientOptions.jsonParser,
        jsonStringifier: this.clientOptions.jsonStringifier
      },
      config
    );

    let finalConfig = await this.interceptors.request.execute(merged);

    if (this.clientOptions.beforeRequest) {
      try {
        const result = await this.clientOptions.beforeRequest(finalConfig);
        // Allow beforeRequest to cancel by returning false
        if (result === false) {
          throw new HttpClientError({
            message: 'Request cancelled by beforeRequest hook',
            status: 0,
            statusText: 'Cancelled'
          });
        }
        finalConfig = result as HttpRequestConfig;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        if (error instanceof HttpClientError) {
          throw error;
        }
        throw error;
      }
    }

    const timeout = createTimeoutSignal(finalConfig.timeout);
    let cleanup = () => {};
    let signal: AbortSignal | undefined;

    if (finalConfig.signal && timeout.signal) {
      if (typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([finalConfig.signal, timeout.signal]);
      } else {
        const controller = new AbortController();
        const handleAbort = () => controller.abort();

        finalConfig.signal.addEventListener('abort', handleAbort);
        timeout.signal.addEventListener('abort', handleAbort);

        cleanup = () => {
          finalConfig.signal?.removeEventListener('abort', handleAbort);
          timeout.signal?.removeEventListener('abort', handleAbort);
        };

        signal = controller.signal;
      }
    } else {
      signal = finalConfig.signal ?? timeout.signal;
    }

    const request: HttpRequest = {
      ...finalConfig,
      url: buildURL(this.clientOptions.baseURL, config.url, finalConfig.query),
      signal
    };

    let attempt = 0;

    try {
      while (true) {
        try {
          if (this.clientOptions.transform?.request) {
            request.body = await this.clientOptions.transform.request(request.body);
          }

          const response = await this.adapter.send<T>(request);

          if (this.clientOptions.transform?.response) {
            response.data = (await this.clientOptions.transform.response(response.data)) as T;
          }

          let processedResponse = await this.interceptors.response.execute(response);

          if (this.clientOptions.afterResponse) {
            processedResponse = await this.clientOptions.afterResponse(processedResponse);
          }

          return processedResponse as HttpResponse<T>;
        } catch (error: any) {
          const status = error?.status;
          const method = request.method;

          if (!this.retryPolicy.canRetry(attempt, status, method)) {
            await this.interceptors.error.executeError(error);
            throw error;
          }

          attempt++;
          await this.retryPolicy.wait(attempt);
        }
      }
    } finally {
      cleanup();
      timeout.cleanup();
    }
  }

  /**
   * Perform a GET request.
   * @param url Request URL.
   * @param config Optional request configuration.
   * @example
   * const response = await client.get('/users', { query: { active: true } });
   */
  public get<T>(url: string, config: HttpRequestConfig = {}) {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.GET
    });
  }

  /**
   * Perform a HEAD request.
   * @param url Request URL.
   * @param config Optional request configuration.
   * @example
   * await client.head('/health');
   */
  public head<T>(url: string, config: HttpRequestConfig = {}) {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.HEAD
    });
  }

  /**
   * Perform an OPTIONS request.
   * @param url Request URL.
   * @param config Optional request configuration.
   * @example
   * await client.options('/users');
   */
  public options<T>(url: string, config: HttpRequestConfig = {}) {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.OPTIONS
    });
  }

  /**
   * Perform a DELETE request.
   * @param url Request URL.
   * @param config Optional request configuration.
   * @example
   * await client.delete('/users/123');
   */
  public delete<T>(url: string, config: HttpRequestConfig = {}) {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.DELETE
    });
  }

  /**
   * Perform a POST request.
   * @param url Request URL.
   * @param body Optional request body.
   * @param config Optional request configuration.
   * @example
   * const newUser = await client.post('/users', { name: 'Alice' });
   */
  public post<T>(url: string, body?: unknown, config: HttpRequestConfig = {}) {
    return this.request<T>({
      ...config,
      url,
      body,
      method: HttpMethod.POST
    });
  }

  /**
   * Perform a PUT request.
   * @param url Request URL.
   * @param body Optional request body.
   * @param config Optional request configuration.
   * @example
   * await client.put('/users/123', { name: 'Updated Name' });
   */
  public put<T>(url: string, body?: unknown, config: HttpRequestConfig = {}) {
    return this.request<T>({
      ...config,
      url,
      body,
      method: HttpMethod.PUT
    });
  }

  /**
   * Perform a PATCH request.
   * @param url Request URL.
   * @param body Optional request body.
   * @param config Optional request configuration.
   * @example
   * await client.patch('/users/123', { active: false });
   */
  public patch<T>(url: string, body?: unknown, config: HttpRequestConfig = {}) {
    return this.request<T>({
      ...config,
      url,
      body,
      method: HttpMethod.PATCH
    });
  }

  /**
   * Execute a set of promises while preserving tuple inference.
   * @param values List of promises or values.
   * @example
   * const [users, posts] = await client.all([client.get('/users'), client.get('/posts')]);
   */
  public all<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
    return Promise.all([...values] as any) as any;
  }

  /**
   * Perform a GET request and return the response payload.
   * @param url Request URL.
   * @param config Optional request configuration.
   * @example
   * const user = await client.getData('/users/123');
   */
  public async getData<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.get<T>(url, config);
    return response.data;
  }

  /**
   * Perform a POST request and return the response payload.
   * @param url Request URL.
   * @param body Optional request body.
   * @param config Optional request configuration.
   * @example
   * const created = await client.postData('/users', { name: 'Alice' });
   */
  public async postData<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.post<T>(url, body, config);
    return response.data;
  }

  /**
   * Perform a PUT request and return the response payload.
   * @param url Request URL.
   * @param body Optional request body.
   * @param config Optional request configuration.
   * @example
   * const updated = await client.putData('/users/123', { name: 'Bob' });
   */
  public async putData<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.put<T>(url, body, config);
    return response.data;
  }

  /**
   * Perform a PATCH request and return the response payload.
   * @param url Request URL.
   * @param body Optional request body.
   * @param config Optional request configuration.
   * @example
   * const patched = await client.patchData('/users/123', { active: false });
   */
  public async patchData<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await this.patch<T>(url, body, config);
    return response.data;
  }

  /**
   * Perform a DELETE request and return the response payload.
   * @param url Request URL.
   * @param config Optional request configuration.
   * @example
   * await client.deleteData('/users/123');
   */
  public async deleteData<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await this.delete<T>(url, config);
    return response.data;
  }
}

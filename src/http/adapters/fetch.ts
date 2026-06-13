import { HttpClientError } from '../http-client-error';
import { HttpRequest, HttpResponse } from '../types';

/**
 * HTTP adapter that uses the Fetch API for transport.
 */
export class FetchAdapter {
  /**
   * Send an HTTP request using fetch and normalize the response.
   */
  public async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    let body = request.body;

    const headers: Record<string, string> = {};
    if (request.headers) {
      for (const [key, value] of Object.entries(request.headers)) {
        headers[key] = String(value);
      }
    }

    if (body !== undefined && body !== null) {
      if (
        body instanceof FormData ||
        body instanceof Blob ||
        body instanceof ArrayBuffer ||
        body instanceof URLSearchParams
      ) {
        // Leave as is
      } else if (typeof body === 'string') {
        // Leave as is
      } else {
        headers['Content-Type'] ??= 'application/json';

        const stringify = request.jsonStringifier ?? JSON.stringify;
        body = stringify(body);
      }
    }

    let response: Response;
    try {
      response = await fetch(request.url, {
        method: request.method,
        headers,
        body: body as BodyInit,
        signal: request.signal,
        credentials: request.credentials,
        mode: request.mode,
        redirect: request.redirect
      });
    } catch (error) {
      throw new HttpClientError({
        message: error instanceof Error ? error.message : 'Network error',
        status: 0,
        statusText: 'Network Error',
        url: request.url,
        method: request.method,
        config: request,
        cause: error
      });
    }

    let data: unknown = null;

    const contentType = response.headers.get('content-type');
    const responseType = request.responseType || 'auto';

    // Handle 204 No Content and 205 Reset Content
    if (response.status === 204 || response.status === 205) {
      data = null;
    } else if (responseType === 'arrayBuffer') {
      data = await response.arrayBuffer();
    } else if (responseType === 'blob') {
      data = await response.blob();
    } else if (responseType === 'text') {
      data = await response.text();
    } else if (responseType === 'json' || (responseType === 'auto' && contentType?.includes('application/json'))) {
      try {
        const text = await response.text();
        const parse = request.jsonParser ?? JSON.parse;
        data = text ? parse(text) : null;
      } catch {
        data = null;
      }
    } else if (contentType?.includes('application/json')) {
      try {
        const text = await response.text();
        const parse = request.jsonParser ?? JSON.parse;
        data = text ? parse(text) : null;
      } catch {
        data = null;
      }
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // Use validateStatus if provided, otherwise check response.ok
    const validateStatus = request.validateStatus ?? ((status: number) => status >= 200 && status < 300);
    const isValid = validateStatus(response.status);

    if (!isValid) {
      throw new HttpClientError({
        message: response.statusText,
        status: response.status,
        statusText: response.statusText,
        url: request.url,
        method: request.method,
        headers: response.headers,
        data,
        config: request
      });
    }

    return {
      data: data as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: request
    };
  }
}
